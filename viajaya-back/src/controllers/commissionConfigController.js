const { CommissionConfig, User } = require('../db');
const { Op } = require('sequelize');

const commissionConfigController = {
  // ✅ CREAR nueva configuración de comisiones
  createCommissionConfig: async (req, res) => {
    try {
      const {
        role,
        trip_type,
        calculation_type,
        amount_per_person,
        percentage,
        fixed_amount,
        min_amount,
        max_amount,
        effective_from
      } = req.body;

      const userId = req.user.id;

      // Validaciones
      if (!role || !trip_type || !calculation_type) {
        return res.status(400).json({
          message: 'Los campos role, trip_type y calculation_type son obligatorios'
        });
      }

      // Validar que tenga el valor correcto según el tipo de cálculo
      if (calculation_type === 'fixed_per_person' && !amount_per_person) {
        return res.status(400).json({
          message: 'amount_per_person es obligatorio para calculation_type fixed_per_person'
        });
      }

      if (calculation_type === 'percentage' && !percentage) {
        return res.status(400).json({
          message: 'percentage es obligatorio para calculation_type percentage'
        });
      }

      if (calculation_type === 'fixed_total' && !fixed_amount) {
        return res.status(400).json({
          message: 'fixed_amount es obligatorio para calculation_type fixed_total'
        });
      }

      // Verificar si ya existe una configuración activa para este rol y tipo de viaje
      const existingConfig = await CommissionConfig.findOne({
        where: {
          role,
          trip_type,
          is_active: true,
          [Op.or]: [
            { effective_until: null },
            { effective_until: { [Op.gt]: new Date() } }
          ]
        }
      });

      // Si existe una configuración activa, marcarla como inactiva
      if (existingConfig) {
        await existingConfig.update({
          effective_until: new Date(),
          is_active: false,
          updated_by: userId
        });
      }

      // Crear nueva configuración
      const newConfig = await CommissionConfig.create({
        role,
        trip_type,
        calculation_type,
        amount_per_person,
        percentage,
        fixed_amount,
        min_amount,
        max_amount,
        effective_from: effective_from || new Date(),
        created_by: userId,
        is_active: true
      });

      res.status(201).json({
        success: true,
        message: 'Configuración de comisiones creada exitosamente',
        config: newConfig
      });

    } catch (error) {
      console.error('Error creando configuración de comisiones:', error);
      res.status(500).json({
        message: 'Error al crear la configuración de comisiones',
        error: error.message
      });
    }
  },

  // ✅ OBTENER todas las configuraciones activas
  getActiveConfigs: async (req, res) => {
    try {
      const configs = await CommissionConfig.findAll({
        where: {
          is_active: true,
          [Op.or]: [
            { effective_until: null },
            { effective_until: { [Op.gt]: new Date() } }
          ]
        },
        include: [
          {
            model: User,
            as: 'CreatedBy',
            attributes: ['id', 'name', 'lastname']
          },
          {
            model: User,
            as: 'UpdatedBy',
            attributes: ['id', 'name', 'lastname']
          }
        ],
        order: [['role', 'ASC'], ['trip_type', 'ASC']]
      });

      res.json({
        success: true,
        configs
      });

    } catch (error) {
      console.error('Error obteniendo configuraciones:', error);
      res.status(500).json({
        message: 'Error al obtener las configuraciones',
        error: error.message
      });
    }
  },

  // ✅ OBTENER configuración específica para un rol y tipo de viaje
  getConfigForRoleAndType: async (req, res) => {
    try {
      const { role, trip_type } = req.params;

      const config = await CommissionConfig.findOne({
        where: {
          role,
          trip_type,
          is_active: true,
          [Op.or]: [
            { effective_until: null },
            { effective_until: { [Op.gt]: new Date() } }
          ]
        },
        include: [
          {
            model: User,
            as: 'CreatedBy',
            attributes: ['id', 'name', 'lastname']
          }
        ]
      });

      if (!config) {
        return res.status(404).json({
          message: `No se encontró configuración activa para ${role} en viajes ${trip_type}`
        });
      }

      res.json({
        success: true,
        config
      });

    } catch (error) {
      console.error('Error obteniendo configuración específica:', error);
      res.status(500).json({
        message: 'Error al obtener la configuración',
        error: error.message
      });
    }
  },

  // ✅ CALCULAR monto de comisión según configuración
  calculateCommission: async (role, trip_type, totalAmount, numberOfPeople) => {
    try {
      const config = await CommissionConfig.findOne({
        where: {
          role,
          trip_type,
          is_active: true,
          [Op.or]: [
            { effective_until: null },
            { effective_until: { [Op.gt]: new Date() } }
          ]
        }
      });

      if (!config) {
        console.log(`No se encontró configuración para ${role} - ${trip_type}`);
        return 0;
      }

      let calculatedAmount = 0;

      switch (config.calculation_type) {
        case 'fixed_per_person':
          calculatedAmount = config.amount_per_person * numberOfPeople;
          break;
        
        case 'percentage':
          calculatedAmount = (totalAmount * config.percentage) / 100;
          break;
        
        case 'fixed_total':
          calculatedAmount = config.fixed_amount;
          break;
        
        default:
          console.log(`Tipo de cálculo no reconocido: ${config.calculation_type}`);
          return 0;
      }

      // Aplicar límites mínimos y máximos
      if (config.min_amount && calculatedAmount < config.min_amount) {
        calculatedAmount = config.min_amount;
      }

      if (config.max_amount && calculatedAmount > config.max_amount) {
        calculatedAmount = config.max_amount;
      }

      return Math.round(calculatedAmount * 100) / 100; // Redondear a 2 decimales

    } catch (error) {
      console.error('Error calculando comisión:', error);
      return 0;
    }
  },

  // ✅ ACTUALIZAR configuración (crear nueva versión)
  updateConfig: async (req, res) => {
    try {
      const { configId } = req.params;
      const userId = req.user.id;
      const updateData = req.body;

      const currentConfig = await CommissionConfig.findByPk(configId);
      
      if (!currentConfig) {
        return res.status(404).json({
          message: 'Configuración no encontrada'
        });
      }

      // Marcar la configuración actual como inactiva
      await currentConfig.update({
        effective_until: new Date(),
        is_active: false,
        updated_by: userId
      });

      // Crear nueva versión con los cambios
      const newConfig = await CommissionConfig.create({
        ...currentConfig.dataValues,
        ...updateData,
        id: undefined, // Para que se genere nuevo ID
        effective_from: new Date(),
        effective_until: null,
        created_by: userId,
        updated_by: null,
        is_active: true
      });

      res.json({
        success: true,
        message: 'Configuración actualizada exitosamente',
        config: newConfig
      });

    } catch (error) {
      console.error('Error actualizando configuración:', error);
      res.status(500).json({
        message: 'Error al actualizar la configuración',
        error: error.message
      });
    }
  },

  // ✅ DESACTIVAR configuración
  deactivateConfig: async (req, res) => {
    try {
      const { configId } = req.params;
      const userId = req.user.id;

      const config = await CommissionConfig.findByPk(configId);
      
      if (!config) {
        return res.status(404).json({
          message: 'Configuración no encontrada'
        });
      }

      await config.update({
        effective_until: new Date(),
        is_active: false,
        updated_by: userId
      });

      res.json({
        success: true,
        message: 'Configuración desactivada exitosamente'
      });

    } catch (error) {
      console.error('Error desactivando configuración:', error);
      res.status(500).json({
        message: 'Error al desactivar la configuración',
        error: error.message
      });
    }
  },

  // ✅ OBTENER historial de configuraciones
  getConfigHistory: async (req, res) => {
    try {
      const { role, trip_type } = req.query;

      const whereClause = {};
      if (role) whereClause.role = role;
      if (trip_type) whereClause.trip_type = trip_type;

      const configs = await CommissionConfig.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'CreatedBy',
            attributes: ['id', 'name', 'lastname']
          },
          {
            model: User,
            as: 'UpdatedBy',
            attributes: ['id', 'name', 'lastname']
          }
        ],
        order: [['effective_from', 'DESC']]
      });

      res.json({
        success: true,
        configs
      });

    } catch (error) {
      console.error('Error obteniendo historial:', error);
      res.status(500).json({
        message: 'Error al obtener el historial',
        error: error.message
      });
    }
  }
};

module.exports = commissionConfigController;
