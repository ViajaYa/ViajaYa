const { Commission, Contract, Quote, User, SupportDocument, conn: sequelize } = require('../db');
const { Op } = require('sequelize');
const generatePaymentDocument = require('../utils/generatePaymentDocument');    
const path = require('path'); // ✅ Agregar este import
const fs = require('fs'); // ✅ Agregar este import

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
      const userId = req.query.userId || req.user.id;
      
      console.log('📊 Obteniendo stats para usuario:', userId, 'rol:', req.user.role);

      let whereClause = {};
      
      // ✅ Si es un usuario normal (rol < 5), solo ver sus propias comisiones
      if (req.user.role < 5) {
        whereClause.vendedor_id = req.user.id;
        console.log('👤 Usuario normal - filtrando por vendedor_id:', req.user.id);
      } else if (userId && userId !== 'all') {
        // Si es admin+ puede ver stats de usuario específico
        whereClause.vendedor_id = userId;
        console.log('👑 Admin+ - filtrando por vendedor_id:', userId);
      }

      // Obtener estadísticas generales
      const totalAmount = await Commission.sum('monto_comision', { where: whereClause });

      // Obtener estadísticas por estado
      const byStatus = await Commission.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('monto_comision')), 'amount']
        ],
        where: whereClause,
        group: ['status'],
        raw: true
      });

      // ✅ CORREGIR: Usar TO_CHAR para PostgreSQL en lugar de DATE_FORMAT
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const byMonth = await Commission.findAll({
        attributes: [
          [sequelize.fn('TO_CHAR', sequelize.col('fecha_generacion'), 'YYYY-MM'), 'month'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('monto_comision')), 'amount']
        ],
        where: {
          ...whereClause,
          fecha_generacion: {
            [Op.gte]: sixMonthsAgo
          }
        },
        group: [sequelize.fn('TO_CHAR', sequelize.col('fecha_generacion'), 'YYYY-MM')],
        order: [[sequelize.fn('TO_CHAR', sequelize.col('fecha_generacion'), 'YYYY-MM'), 'ASC']],
        raw: true
      });

      console.log('✅ Stats calculadas:', { totalAmount, byStatus: byStatus.length, byMonth: byMonth.length });

      res.json({
        success: true,
        stats: {
          totalAmount: totalAmount || 0,
          byStatus: byStatus || [],
          byMonth: byMonth || []
        }
      });

    } catch (error) {
      console.error('❌ Error getting commission stats:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error al obtener estadísticas de comisiones', 
        error: error.message 
      });
    }
  },
requestPayment: async (req, res) => {
    try {
      console.log('🔍 Datos recibidos en requestPayment:', req.body); // ✅ Debug log
      console.log('🔍 Usuario autenticado:', req.user?.id); // ✅ Debug log
      
      const { commissionId, paymentData } = req.body;
      const userId = req.user.id;

      // ✅ Validar datos requeridos
      if (!commissionId) {
        console.log('❌ commissionId faltante');
        return res.status(400).json({ message: 'ID de comisión requerido' });
      }

      if (!paymentData) {
        console.log('❌ paymentData faltante');
        return res.status(400).json({ message: 'Datos de pago requeridos' });
      }

      if (!paymentData.banco || !paymentData.numero_cuenta || !paymentData.nombre_titular) {
        console.log('❌ Datos bancarios incompletos:', paymentData);
        return res.status(400).json({ 
          message: 'Datos bancarios incompletos', 
          required: ['banco', 'numero_cuenta', 'nombre_titular'] 
        });
      }

      console.log('✅ Buscando comisión:', commissionId);

      const commission = await Commission.findByPk(commissionId, {
        include: [
          {
            model: Contract,
            as: 'Contract',
            attributes: ['contract_number', 'precio_total'],
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
          }
        ]
      });

      if (!commission) {
        console.log('❌ Comisión no encontrada:', commissionId);
        return res.status(404).json({ message: 'Comisión no encontrada' });
      }

      console.log('✅ Comisión encontrada:', {
        id: commission.id,
        vendedor_id: commission.vendedor_id,
        status: commission.status
      });

      if (commission.vendedor_id !== userId) {
        console.log('❌ Usuario sin permisos:', { commission_vendedor: commission.vendedor_id, user: userId });
        return res.status(403).json({ message: 'No tienes permisos para esta comisión' });
      }

      if (commission.status !== 'pending') {
        console.log('❌ Estado inválido:', commission.status);
        return res.status(400).json({ message: 'Esta comisión ya fue procesada' });
      }
   const numeroDocumento = `SOL-${Date.now()}-${commission.id.substring(0, 8)}`;

      console.log('✅ Creando documento de soporte:', numeroDocumento);

      // Crear documento de soporte
      const supportDocument = await SupportDocument.create({
        numero_documento: numeroDocumento,
        vendedor_id: userId,
        vendedor_real_id: userId,
        monto: commission.monto_comision,
        fecha_generacion: new Date(),
        status: 'generated',
        banco: paymentData.banco,
        numero_cuenta: paymentData.numero_cuenta,
        tipo_cuenta: paymentData.tipo_cuenta || 'ahorros',
        observaciones: `Solicitud de pago - ${paymentData.nombre_titular}\nCC: ${paymentData.documento_titular || 'No especificado'}\nTel: ${paymentData.telefono || 'No especificado'}\n\n${paymentData.observaciones || ''}`
      });

      console.log('✅ Documento creado:', supportDocument.id);

      // Actualizar comisión
      await commission.update({
        status: 'generated',
        documento_soporte_id: supportDocument.id,
        observaciones: `Documento de cobro generado: ${numeroDocumento}`
      });

      console.log('✅ Comisión actualizada');

      // ✅ VERSIÓN TEMPORAL SIN PDF para debuggear
      const pdfUrl = `/uploads/payment-documents/documento-cobro-${numeroDocumento}.pdf`;
      
      await supportDocument.update({
        documento_pdf_url: pdfUrl
      });

      console.log('✅ Documento actualizado con PDF URL');

      const updatedCommission = await Commission.findByPk(commissionId, {
        include: [
          { model: Contract, as: 'Contract' },
          { model: User, as: 'Vendedor', attributes: ['id', 'name', 'lastname'] }
        ]
      });

      console.log('✅ Respuesta exitosa preparada');

      res.json({
        success: true,
        message: 'Solicitud de pago enviada exitosamente',
        document: {
          ...supportDocument.toJSON(),
          documento_pdf_url: pdfUrl
        },
        commission: updatedCommission
      });

    } catch (error) {
      console.error('❌ Error requesting payment:', error);
      res.status(500).json({ 
        message: 'Error al enviar solicitud de pago', 
        error: error.message 
      });
    }
  },

  downloadDocument: async (req, res) => {
    try {
      const { documentId } = req.params;
      const userId = req.user.id;

      console.log('📥 Descargando documento:', documentId, 'para usuario:', userId);

      // Buscar el documento
      const document = await SupportDocument.findByPk(documentId, {
        include: [
          {
            model: User,
            as: 'Vendedor',
            attributes: ['id', 'name', 'lastname', 'email']
          }
        ]
      });

      if (!document) {
        console.log('❌ Documento no encontrado:', documentId);
        return res.status(404).json({ message: 'Documento no encontrado' });
      }

      console.log('📄 Documento encontrado:', document.numero_documento);

      // Verificar permisos: el usuario debe ser el dueño del documento o admin+
      if (document.vendedor_id !== userId && req.user.role < 5) {
        console.log('🚫 Sin permisos - vendedor:', document.vendedor_id, 'usuario:', userId, 'rol:', req.user.role);
        return res.status(403).json({ message: 'No tienes permisos para descargar este documento' });
      }

      // ✅ Asegurar que el directorio existe
      const uploadsDir = path.join(__dirname, '../../uploads/payment-documents');
      if (!fs.existsSync(uploadsDir)) {
        console.log('📁 Creando directorio:', uploadsDir);
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const fileName = `documento-cobro-${document.numero_documento}.pdf`;
      const filePath = path.join(uploadsDir, fileName);

      console.log('📁 Buscando archivo en:', filePath);
      console.log('📁 Directorio existe:', fs.existsSync(uploadsDir));

      // Si no existe el PDF, generarlo
      if (!fs.existsSync(filePath)) {
        console.log('🔄 Archivo no existe, generando...');
        
        // Buscar la comisión asociada
        const commission = await Commission.findOne({
          where: { documento_soporte_id: documentId },
          include: [
            {
              model: Contract,
              as: 'Contract',
              include: [
                {
                  model: Quote,
                  as: 'Quote'
                }
              ]
            },
            {
              model: User,
              as: 'Vendedor'
            }
          ]
        });

        if (!commission) {
          console.log('❌ Comisión no encontrada para documento:', documentId);
          return res.status(404).json({ message: 'Comisión asociada no encontrada' });
        }

        try {
          console.log('🔄 Generando PDF para:', fileName);
          const pdfUrl = await generatePaymentDocument(document, commission);
          await document.update({ documento_pdf_url: pdfUrl });
          console.log('✅ PDF generado exitosamente:', pdfUrl);
          
          // ✅ Esperar un poco para que el archivo se escriba completamente
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (pdfError) {
          console.error('❌ Error generando PDF:', pdfError);
          return res.status(500).json({ message: 'Error al generar documento PDF: ' + pdfError.message });
        }
      }

      // ✅ Verificar nuevamente después de la generación
      console.log('🔍 Verificando archivo después de generación...');
      console.log('📁 Archivo existe:', fs.existsSync(filePath));
      
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log('📊 Tamaño del archivo:', stats.size, 'bytes');
      }

      if (!fs.existsSync(filePath)) {
        // ✅ Listar archivos en el directorio para debug
        console.log('📂 Archivos en directorio:');
        try {
          const files = fs.readdirSync(uploadsDir);
          console.log('📂 Archivos encontrados:', files);
        } catch (dirError) {
          console.log('❌ Error leyendo directorio:', dirError.message);
        }
        
        return res.status(404).json({ 
          message: 'Error: archivo no se pudo generar o encontrar',
          debug: {
            expectedFile: fileName,
            directory: uploadsDir,
            filePath: filePath
          }
        });
      }

      console.log('📤 Enviando archivo:', fileName);

      // Configurar headers para descarga
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      
      // Enviar archivo
      res.sendFile(filePath, (err) => {
        if (err) {
          console.error('❌ Error enviando archivo:', err);
          if (!res.headersSent) {
            res.status(500).json({ message: 'Error al enviar archivo: ' + err.message });
          }
        } else {
          console.log('✅ Archivo enviado exitosamente');
        }
      });

    } catch (error) {
      console.error('❌ Error downloading document:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          message: 'Error al descargar documento', 
          error: error.message 
        });
      }
    }
  },
};

module.exports = commissionController;
