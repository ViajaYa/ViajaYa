const { Commission, Contract, Quote, User, SupportDocument, CommissionConfig, conn: sequelize } = require('../db');
const { Op } = require('sequelize');
const generatePaymentDocument = require('../utils/generatePaymentDocument');    
const commissionConfigController = require('./commissionConfigController');
const { calcularPersonasQuePagan } = require('../utils/quoteCalculations');
const path = require('path'); // ✅ Agregar este import
const fs = require('fs'); // ✅ Agregar este import

const commissionController = {
  // ✅ GENERAR COMISIONES cuando el contrato es aprobado - NUEVA LÓGICA
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
              { model: User, as: 'Asesor', attributes: ['id', 'name', 'lastname'] },
              { model: User, as: 'Lider', attributes: ['id', 'name', 'lastname'] },
              { model: User, as: 'Gerente', attributes: ['id', 'name', 'lastname'] }
            ]
          }
        ]
      });

      if (!contract) {
        throw new Error('Contrato no encontrado');
      }

      const quote = contract.Quote;
      const montoBase = contract.precio_total;
      
      // ✅ USAR NUEVA LÓGICA: Calcular solo personas que pagan (excluir infantes)
      const personasQuePagan = calcularPersonasQuePagan({
        adultos: quote.adultos,
        menores: quote.menores,
        infantes: quote.infantes
      });
      
      // Fallback a datos legacy si no hay nuevos campos
      const numeroPasajeros = personasQuePagan > 0 ? personasQuePagan : 
                             (contract.numero_pasajeros || quote.numero_personas || 1);
      
      console.log('💰 CÁLCULO DE COMISIONES:', {
        total_pasajeros: quote.numero_personas,
        adultos: quote.adultos,
        menores: quote.menores,
        infantes: quote.infantes,
        personas_que_pagan: personasQuePagan,
        numero_usado_para_comision: numeroPasajeros
      });
      
      const commissionsToCreate = [];

      // ✅ USAR EL CAMPO TRIP_TYPE DEL CONTRATO O LA COTIZACIÓN
      const trip_type = quote.trip_type || contract.trip_type || quote.trip_type || 'nacional';

      console.log(`📍 Destino: ${quote.destino} - Tipo: ${trip_type} (desde ${contract.trip_type ? 'contrato' : 'cotización'})`);

      // Generar comisión para ASESOR
      if (quote.Asesor) {
        const montoComision = await commissionConfigController.calculateCommission(
          'asesor', 
          trip_type, 
          montoBase, 
          numeroPasajeros
        );
        
        if (montoComision > 0) {
          // Calcular el porcentaje equivalente para compatibilidad
          const porcentajeEquivalente = ((montoComision / montoBase) * 100).toFixed(2);
          
          commissionsToCreate.push({
            contract_id: contractId,
            vendedor_id: quote.Asesor.id,
            tipo_vendedor: 'asesor',
            porcentaje: porcentajeEquivalente,
            monto_base: montoBase,
            monto_comision: montoComision,
            status: 'pending',
            fecha_generacion: new Date(),
            observaciones: `Comisión ${trip_type} - ${numeroPasajeros} personas que pagan (excl. infantes)`
          });
        }
      }

      // Generar comisión para LÍDER
      if (quote.Lider) {
        const montoComision = await commissionConfigController.calculateCommission(
          'lider', 
          trip_type, 
          montoBase, 
          numeroPasajeros
        );
        
        if (montoComision > 0) {
          // Calcular el porcentaje equivalente para compatibilidad
          const porcentajeEquivalente = ((montoComision / montoBase) * 100).toFixed(2);
          
          commissionsToCreate.push({
            contract_id: contractId,
            vendedor_id: quote.Lider.id,
            tipo_vendedor: 'lider',
            porcentaje: porcentajeEquivalente,
            monto_base: montoBase,
            monto_comision: montoComision,
            status: 'pending',
            fecha_generacion: new Date(),
            observaciones: `Comisión ${trip_type} - ${numeroPasajeros} personas que pagan (excl. infantes)`
          });
        }
      }

      // Generar comisión para GERENTE
      if (quote.Gerente) {
        const montoComision = await commissionConfigController.calculateCommission(
          'gerente', 
          trip_type, 
          montoBase, 
          numeroPasajeros
        );
        
        if (montoComision > 0) {
          // Calcular el porcentaje equivalente para compatibilidad
          const porcentajeEquivalente = ((montoComision / montoBase) * 100).toFixed(2);
          
          commissionsToCreate.push({
            contract_id: contractId,
            vendedor_id: quote.Gerente.id,
            tipo_vendedor: 'gerente',
            porcentaje: porcentajeEquivalente,
            monto_base: montoBase,
            monto_comision: montoComision,
            status: 'pending',
            fecha_generacion: new Date(),
            observaciones: `Comisión ${trip_type} - ${numeroPasajeros} personas que pagan (excl. infantes)`
          });
        }
      }

      // Crear las comisiones en batch
      if (commissionsToCreate.length === 0) {
        console.log('⚠️ No se encontraron configuraciones de comisiones activas');
        await transaction.commit();
        return {
          success: true,
          message: 'No se generaron comisiones - sin configuraciones activas',
          commissions: []
        };
      }

      const createdCommissions = await Commission.bulkCreate(commissionsToCreate, { 
        transaction,
        returning: true 
      });

      await transaction.commit();
      
      console.log(`✅ Se generaron ${createdCommissions.length} comisiones para contrato ${contract.contract_number}`);
      
      return {
        success: true,
        message: `Se generaron ${createdCommissions.length} comisiones para el contrato ${contract.contract_number}`,
        commissions: createdCommissions
      };

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error generando comisiones:', error);
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
          },
          {
            model: SupportDocument,
            as: 'DocumentoSoporte',
            attributes: ['id', 'numero_documento', 'status', 'documento_pdf_url']
          }
        ]
      });

      if (!commission) {
        return res.status(404).json({ message: 'Comisión no encontrada' });
      }

      // ✅ CORREGIR: Solo se pueden aprobar comisiones en estado 'generated' que tengan documento
      if (commission.status !== 'generated') {
        return res.status(400).json({ 
          message: `Solo se pueden aprobar comisiones activas. Estado actual: ${commission.status}` 
        });
      }

      // ✅ NUEVA VALIDACIÓN: Verificar que tenga documento de soporte subido
      if (!commission.DocumentoSoporte) {
        return res.status(400).json({ 
          message: 'No se puede aprobar una comisión sin documento de cuenta-cobro subido' 
        });
      }

      // Actualizar comisión a aprobada
      await commission.update({
        status: 'approved',
        fecha_aprobacion: new Date(),
        observaciones: observaciones || 'Comisión aprobada - documento revisado',
        aprobado_por: userId // Cambiar de pagado_por a aprobado_por
      });

      res.json({
        success: true,
        message: 'Comisión aprobada exitosamente',
        commission: await Commission.findByPk(commissionId, {
          include: [
            { model: Contract, as: 'Contract' },
            { model: User, as: 'Vendedor', attributes: ['id', 'name', 'lastname'] },
            { model: SupportDocument, as: 'DocumentoSoporte' }
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

  // ✅ MARCAR comisión como PAGADA con comprobante obligatorio
payCommission: async (req, res) => {
  try {
    const { commissionId } = req.params;
    const { observaciones } = req.body;
    const userId = req.user.id;

    // ✅ Debug: Ver qué llega en req.file
    console.log('📄 Archivo recibido:', {
      fieldname: req.file?.fieldname,
      originalname: req.file?.originalname,
      mimetype: req.file?.mimetype,
      size: req.file?.size,
      path: req.file?.path, // ✅ URL de Cloudinary
      filename: req.file?.filename
    });

    // ✅ Verificar que se haya subido el comprobante de pago
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'El comprobante de pago es obligatorio' 
      });
    }

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
        },
        {
          model: SupportDocument,
          as: 'DocumentoSoporte'
        }
      ]
    });

    if (!commission) {
      return res.status(404).json({ 
        success: false,
        message: 'Comisión no encontrada' 
      });
    }

    // ✅ Verificar que esté en estado correcto
    if (commission.status !== 'approved') {
      return res.status(400).json({ 
        success: false,
        message: `Solo se pueden pagar comisiones aprobadas. Estado actual: ${commission.status}` 
      });
    }

    // ✅ Verificar que tenga documento de soporte
    if (!commission.DocumentoSoporte) {
      return res.status(400).json({
        success: false,
        message: 'No se encontró documento de soporte asociado'
      });
    }

    // ✅ CORREGIR: Usar req.file.path para Cloudinary
    const comprobanteUrl = req.file.path; // URL completa de Cloudinary

    console.log('💾 Guardando comprobante URL:', comprobanteUrl);

    // Actualizar el DOCUMENTO DE SOPORTE con el comprobante
    await commission.DocumentoSoporte.update({
      comprobante_pago_url: comprobanteUrl,
      status: 'paid',
      fecha_pago: new Date()
    });

    // Actualizar la COMISIÓN
    await commission.update({
      status: 'paid',
      fecha_pago: new Date(),
      observaciones: observaciones || commission.observaciones,
      pagado_por: userId
    });

    console.log('✅ Comisión actualizada correctamente');

    res.json({
      success: true,
      message: 'Comisión marcada como pagada exitosamente',
      commission: await Commission.findByPk(commissionId, {
        include: [
          { model: Contract, as: 'Contract' },
          { model: User, as: 'Vendedor', attributes: ['id', 'name', 'lastname'] },
          { model: SupportDocument, as: 'DocumentoSoporte' }
        ]
      }),
      // ✅ Debug info
      file_info: {
        original_name: req.file.originalname,
        cloudinary_url: req.file.path,
        file_size: req.file.size
      }
    });

  } catch (error) {
    console.error('❌ Error marcando comisión como pagada:', error);
    res.status(500).json({ 
      success: false,
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
        contractId,
        search
      } = req.query;

      const offset = (page - 1) * limit;
      const whereConditions = {};
      const includeConditions = [];

      // Filtros básicos
      if (status !== 'all') {
        whereConditions.status = status;
      }
      
      if (userId) {
        whereConditions.vendedor_id = userId;
      }

      if (contractId) {
        whereConditions.contract_id = contractId;
      }

      // Filtro de fechas
      if (startDate && endDate) {
        whereConditions.fecha_generacion = {
          [Op.between]: [new Date(startDate), new Date(endDate + ' 23:59:59')]
        };
      } else if (startDate) {
        whereConditions.fecha_generacion = {
          [Op.gte]: new Date(startDate)
        };
      } else if (endDate) {
        whereConditions.fecha_generacion = {
          [Op.lte]: new Date(endDate + ' 23:59:59')
        };
      }

      // Configurar includes con filtros de búsqueda
      const contractInclude = {
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
      };

      const vendedorInclude = {
        model: User,
        as: 'Vendedor',
        attributes: ['id', 'name', 'lastname', 'email']
      };

      // Aplicar filtro de búsqueda si existe
      if (search) {
        const searchTerm = `%${search}%`;
        
        // Buscar en múltiples campos
        whereConditions[Op.or] = [
          // Buscar en observaciones de la comisión
          { observaciones: { [Op.iLike]: searchTerm } },
          // Buscar en número de contrato
          { '$Contract.contract_number$': { [Op.iLike]: searchTerm } },
          // Buscar en nombre del cliente
          { '$Contract.Quote.nombre_cliente$': { [Op.iLike]: searchTerm } },
          // Buscar en nombre del vendedor
          { '$Vendedor.name$': { [Op.iLike]: searchTerm } },
          { '$Vendedor.lastname$': { [Op.iLike]: searchTerm } },
          { '$Vendedor.email$': { [Op.iLike]: searchTerm } }
        ];
      }

      const { rows: commissions, count } = await Commission.findAndCountAll({
        where: whereConditions,
        include: [
          contractInclude,
          vendedorInclude,
          {
            model: User,
            as: 'PagadoPor',
            attributes: ['id', 'name', 'lastname'],
            required: false
          },
          {
            model: SupportDocument,
            as: 'DocumentoSoporte',
            attributes: ['id', 'numero_documento', 'status','comprobante_pago_url', 'documento_pdf_url', 'fecha_generacion'],
            required: false
          }
        ],
        order: [['fecha_generacion', 'DESC']],
        limit: parseInt(limit),
        offset,
        distinct: true // Importante para count correcto con joins
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
        success: false,
        message: 'Error al obtener las comisiones', 
        error: error.message 
      });
    }
  },

  // ✅ OBTENER comisiones específicas de un contrato
  getCommissionsByContract: async (req, res) => {
    try {
      const { contractId } = req.params;

      if (!contractId) {
        return res.status(400).json({ 
          success: false, 
          message: 'ID del contrato es requerido' 
        });
      }

      const commissions = await Commission.findAll({
        where: { contract_id: contractId },
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
            model: SupportDocument,
            as: 'DocumentoSoporte',
            required: false
          }
        ],
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        commissions,
        total: commissions.length
      });

    } catch (error) {
      console.error('Error obteniendo comisiones del contrato:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error al obtener las comisiones del contrato', 
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
      console.log('🔍 Datos recibidos en requestPayment:', req.body);
      console.log('🔍 Usuario autenticado:', req.user?.id);
      
      const { commissionId, paymentData, firma_digital_url } = req.body;
      const userId = req.user.id;

      // Validar datos requeridos
      if (!commissionId) {
        return res.status(400).json({ message: 'ID de comisión requerido' });
      }
      if (!paymentData) {
        return res.status(400).json({ message: 'Datos de pago requeridos' });
      }
      if (!paymentData.banco || !paymentData.numero_cuenta || !paymentData.nombre_titular) {
        return res.status(400).json({ 
          message: 'Datos bancarios incompletos', 
          required: ['banco', 'numero_cuenta', 'nombre_titular'] 
        });
      }

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
        return res.status(404).json({ message: 'Comisión no encontrada' });
      }

      if (commission.vendedor_id !== userId) {
        return res.status(403).json({ message: 'No tienes permisos para esta comisión' });
      }

      if (commission.status !== 'pending') {
        return res.status(400).json({ message: 'Esta comisión ya fue procesada' });
      }

      const numeroDocumento = `SOL-${Date.now()}-${commission.id.substring(0, 8)}`;

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

      // Actualizar comisión
      await commission.update({
        status: 'generated',
        documento_soporte_id: supportDocument.id,
        observaciones: `Cuenta de cobro generada: ${numeroDocumento}`
      });

      // --- Cambios clave: pasar la firma digital al generador de PDF ---
      const supportDocumentData = {
        ...supportDocument.toJSON(),
        firma_digital_url: firma_digital_url || null
      };

      // Generar el PDF con la firma digital si existe
      const pdfUrl = await generatePaymentDocument(supportDocumentData, commission);

      await supportDocument.update({
        documento_pdf_url: pdfUrl
      });

      const updatedCommission = await Commission.findByPk(commissionId, {
        include: [
          { model: Contract, as: 'Contract' },
          { model: User, as: 'Vendedor', attributes: ['id', 'name', 'lastname'] }
        ]
      });

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

      const fileName = `cuenta-cobro-${document.numero_documento}.pdf`;
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

  // ✅ VISTA PREVIA del documento de comisión
  previewDocument: async (req, res) => {
    try {
      const { documentId } = req.params;
      const userId = req.user.id;

      console.log('🔍 Vista previa de documento:', documentId, 'usuario:', userId);

      // Buscar el documento
      const document = await SupportDocument.findByPk(documentId);

      if (!document) {
        return res.status(404).json({ message: 'Documento no encontrado' });
      }

      // Verificar permisos: el usuario debe ser el dueño del documento o admin+
      if (document.vendedor_id !== userId && req.user.role < 5) {
        return res.status(403).json({ message: 'No tienes permisos para ver este documento' });
      }

      // ✅ Asegurar que el directorio existe
      const uploadsDir = path.join(__dirname, '../../uploads/payment-documents');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const fileName = `cuenta-cobro-${document.numero_documento}.pdf`;
      const filePath = path.join(uploadsDir, fileName);

      // Si no existe el PDF, generarlo
      if (!fs.existsSync(filePath)) {
        console.log('🔄 Generando PDF para vista previa...');
        
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
          return res.status(404).json({ message: 'Comisión no encontrada para este documento' });
        }

        // Generar el PDF
        try {
          await generatePaymentDocument(document, commission);
          console.log('✅ PDF generado para vista previa');
        } catch (generateError) {
          console.error('❌ Error generando PDF:', generateError);
          return res.status(500).json({ message: 'Error generando documento para vista previa' });
        }
      }

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Error: no se pudo generar el archivo para vista previa' });
      }

      console.log('📖 Enviando vista previa del archivo:', fileName);

      // Configurar headers para vista previa (inline en lugar de attachment)
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
      res.setHeader('Cache-Control', 'no-cache');
      
      // Enviar archivo para vista previa
      res.sendFile(filePath, (err) => {
        if (err) {
          console.error('❌ Error enviando vista previa:', err);
          if (!res.headersSent) {
            res.status(500).json({ message: 'Error al mostrar vista previa: ' + err.message });
          }
        } else {
          console.log('✅ Vista previa enviada exitosamente');
        }
      });

    } catch (error) {
      console.error('❌ Error preview document:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          message: 'Error al mostrar vista previa del documento', 
          error: error.message 
        });
      }
    }
  },
};

module.exports = commissionController;
