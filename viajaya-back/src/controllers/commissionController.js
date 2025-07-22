const { Commission, Contract, Quote, User, conn: sequelize } = require('../db');
const { Op } = require('sequelize');

const commissionController = {
  // ✅ GENERAR COMISIONES cuando el contrato es aprobado
  generateCommissions: async (contractId) => {
    const transaction = await sequelize.transaction();
    
    try {
      // Obtener el contrato con la cotización y jerarquía
      const contract = await Contract.findByPk(contractId, {
        include: [
          {
            model: Quote,
            as: 'Quote',
            include: [
              { model: User, as: 'Asesor', attributes: ['id', 'name', 'lastname', 'commission_percentage'] },
              { model: User, as: 'Lider', attributes: ['id', 'name', 'lastname', 'commission_percentage'] },
              { model: User, as: 'Gerente', attributes: ['id', 'name', 'lastname', 'commission_percentage'] }
            ]
          }
        ]
      });

      if (!contract) {
        throw new Error('Contrato no encontrado');
      }

      const quote = contract.Quote;
      const montoBase = contract.precio_total;
      const commissionsToCreate = [];

      // ✅ Porcentajes de comisión por rol
      const commissionRates = {
        asesor: 0.05,   // 5%
        lider: 0.02,    // 2%
        gerente: 0.015  // 1.5%
      };

      // Generar comisión para ASESOR
      if (quote.Asesor) {
        const asesorRate = quote.Asesor.commission_percentage 
          ? parseFloat(quote.Asesor.commission_percentage) / 100 
          : commissionRates.asesor;
        
        commissionsToCreate.push({
          contract_id: contractId,
          vendedor_id: quote.Asesor.id,
          tipo_vendedor: 'asesor',
          porcentaje: asesorRate * 100,
          monto_base: montoBase,
          monto_comision: montoBase * asesorRate,
          status: 'pending',
          fecha_generacion: new Date()
        });
      }

      // Generar comisión para LÍDER
      if (quote.Lider) {
        const liderRate = quote.Lider.commission_percentage 
          ? parseFloat(quote.Lider.commission_percentage) / 100 
          : commissionRates.lider;
        
        commissionsToCreate.push({
          contract_id: contractId,
          vendedor_id: quote.Lider.id,
          tipo_vendedor: 'lider',
          porcentaje: liderRate * 100,
          monto_base: montoBase,
          monto_comision: montoBase * liderRate,
          status: 'pending',
          fecha_generacion: new Date()
        });
      }

      // Generar comisión para GERENTE
      if (quote.Gerente) {
        const gerenteRate = quote.Gerente.commission_percentage 
          ? parseFloat(quote.Gerente.commission_percentage) / 100 
          : commissionRates.gerente;
        
        commissionsToCreate.push({
          contract_id: contractId,
          vendedor_id: quote.Gerente.id,
          tipo_vendedor: 'gerente',
          porcentaje: gerenteRate * 100,
          monto_base: montoBase,
          monto_comision: montoBase * gerenteRate,
          status: 'pending',
          fecha_generacion: new Date()
        });
      }

      // Crear las comisiones en batch
      const createdCommissions = await Commission.bulkCreate(commissionsToCreate, { 
        transaction,
        returning: true 
      });

      await transaction.commit();
      
      return {
        success: true,
        message: `Se generaron ${createdCommissions.length} comisiones para el contrato ${contract.contract_number}`,
        commissions: createdCommissions
      };

    } catch (error) {
      await transaction.rollback();
      console.error('Error generando comisiones:', error);
      throw error;
    }
  },

  // ✅ APROBAR comisión manualmente cuando se registra el pago
  approveCommission: async (req, res) => {
    try {
      const { commissionId } = req.params;
      const { observaciones } = req.body;
      const userId = req.user.id; // Del middleware de autenticación

      const commission = await Commission.findByPk(commissionId, {
        include: [
          {
            model: Contract,
            as: 'Contract',
            attributes: ['contract_number', 'precio_total']
          },
          {
            model: User,
            as: 'Vendedor',
            attributes: ['id', 'name', 'lastname', 'email']
          }
        ]
      });

      if (!commission) {
        return res.status(404).json({ message: 'Comisión no encontrada' });
      }

      if (commission.status !== 'pending') {
        return res.status(400).json({ 
          message: 'Solo se pueden aprobar comisiones en estado pending' 
        });
      }

      // Actualizar comisión a aprobada
      await commission.update({
        status: 'approved',
        fecha_aprobacion: new Date(),
        observaciones: observaciones || 'Comisión aprobada manualmente',
        pagado_por: userId
      });

      res.json({
        success: true,
        message: 'Comisión aprobada exitosamente',
        commission: await Commission.findByPk(commissionId, {
          include: [
            { model: Contract, as: 'Contract' },
            { model: User, as: 'Vendedor', attributes: ['id', 'name', 'lastname'] }
          ]
        })
      });

    } catch (error) {
      console.error('Error aprobando comisión:', error);
      res.status(500).json({ 
        message: 'Error al aprobar la comisión', 
        error: error.message 
      });
    }
  },

  // ✅ MARCAR comisión como PAGADA
  payCommission: async (req, res) => {
    try {
      const { commissionId } = req.params;
      const { observaciones } = req.body;
      const userId = req.user.id;

      const commission = await Commission.findByPk(commissionId);

      if (!commission) {
        return res.status(404).json({ message: 'Comisión no encontrada' });
      }

      if (commission.status !== 'approved') {
        return res.status(400).json({ 
          message: 'Solo se pueden pagar comisiones aprobadas' 
        });
      }

      await commission.update({
        status: 'paid',
        fecha_pago: new Date(),
        observaciones: observaciones || commission.observaciones,
        pagado_por: userId
      });

      res.json({
        success: true,
        message: 'Comisión marcada como pagada',
        commission: await Commission.findByPk(commissionId, {
          include: [
            { model: Contract, as: 'Contract' },
            { model: User, as: 'Vendedor', attributes: ['id', 'name', 'lastname'] }
          ]
        })
      });

    } catch (error) {
      console.error('Error marcando comisión como pagada:', error);
      res.status(500).json({ 
        message: 'Error al marcar la comisión como pagada', 
        error: error.message 
      });
    }
  },

  // ✅ OBTENER comisiones con filtros
  getCommissions: async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        status = 'all', 
        userId, 
        startDate, 
        endDate,
        contractId 
      } = req.query;

      const offset = (page - 1) * limit;
      const whereConditions = {};

      // Filtros
      if (status !== 'all') {
        whereConditions.status = status;
      }
      
      if (userId) {
        whereConditions.vendedor_id = userId;
      }

      if (contractId) {
        whereConditions.contract_id = contractId;
      }

      if (startDate && endDate) {
        whereConditions.fecha_generacion = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      const { rows: commissions, count } = await Commission.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: Contract,
            as: 'Contract',
            attributes: ['contract_number', 'precio_total', 'status'],
            include: [
              {
                model: Quote,
                as: 'Quote',
                attributes: ['quote_number', 'nombre_cliente']
              }
            ]
          },
          {
            model: User,
            as: 'Vendedor',
            attributes: ['id', 'name', 'lastname', 'email']
          },
          {
            model: User,
            as: 'PagadoPor',
            attributes: ['id', 'name', 'lastname'],
            required: false
          }
        ],
        order: [['fecha_generacion', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        commissions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      });

    } catch (error) {
      console.error('Error obteniendo comisiones:', error);
      res.status(500).json({ 
        message: 'Error al obtener las comisiones', 
        error: error.message 
      });
    }
  },

  // ✅ ESTADÍSTICAS de comisiones
  getCommissionStats: async (req, res) => {
    try {
      const { userId, startDate, endDate } = req.query;
      const whereConditions = {};

      if (userId) {
        whereConditions.vendedor_id = userId;
      }

      if (startDate && endDate) {
        whereConditions.fecha_generacion = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      const stats = await Commission.findAll({
        where: whereConditions,
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('monto_comision')), 'total']
        ],
        group: ['status'],
        raw: true
      });

      const totalCommissions = await Commission.count({ where: whereConditions });
      const totalAmount = await Commission.sum('monto_comision', { where: whereConditions });

      res.json({
        success: true,
        stats: {
          byStatus: stats,
          totalCommissions,
          totalAmount: totalAmount || 0
        }
      });

    } catch (error) {
      console.error('Error obteniendo estadísticas de comisiones:', error);
      res.status(500).json({ 
        message: 'Error al obtener estadísticas', 
        error: error.message 
      });
    }
  }
};

module.exports = commissionController;
