const {
  Invoice,
  Contract,
  Quote,
  User,
  ContractItem,
  Commission,
  Purchase,
  QuoteCalculation,
  sequelize
} = require('../db');
const { Op } = require('sequelize');

const invoiceController = {

  // ✅ OBTENER CONTRATOS PENDIENTES DE FACTURAR
  getPendingInvoices: async (req, res) => {
    try {
      console.log('🔍 Obteniendo contratos pendientes de facturar...');

      const contractsPendientes = await Contract.findAll({
        where: {
          status: 'completed',
          fecha_fin_viaje: {
            [Op.lte]: new Date() // Solo viajes ya terminados (fecha de regreso pasada)
          }
        },
        include: [
          {
            model: Quote,
            as: 'Quote',
            include: [
              { 
                model: User,
                as: 'Cliente',
                attributes: ['id', 'name', 'lastname', 'email', 'phone'] 
              },
              {
                model: QuoteCalculation,
                as: 'Calculation',
                attributes: [
                  'precio_final_total', 
                  'total_comisiones',
                  'total_ganancia',
                  'precio_tickets',
                  'precio_asistencia_medica',
                  'precio_traslados',
                  'precio_alojamiento'
                ]
              }
            ]
          }
        ],
        order: [['fecha_fin_viaje', 'ASC']]
      });

      // ✅ FILTRAR CONTRATOS QUE YA TIENEN FACTURA
      const contractsWithoutInvoice = [];
      for (const contract of contractsPendientes) {
        const existingInvoice = await Invoice.findOne({
          where: { contract_id: contract.id }
        });
        
        if (!existingInvoice) {
          contractsWithoutInvoice.push(contract);
        }
      }

      console.log(`📊 Encontrados ${contractsWithoutInvoice.length} contratos pendientes de facturar`);

      res.status(200).json({
        success: true,
        message: `Se encontraron ${contractsWithoutInvoice.length} contratos pendientes de facturar`,
        data: contractsWithoutInvoice
      });

    } catch (error) {
      console.error('❌ Error en getPendingInvoices:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener facturas pendientes',
        error: error.message
      });
    }
  },

  // ✅ GENERAR FACTURA PARA UN CONTRATO ESPECÍFICO
  generateInvoice: async (req, res) => {
    try {
      const { contractId } = req.params;
      console.log(`🧾 Generando factura para contrato ID: ${contractId}`);

      // 1. Verificar que el contrato existe y está completado
      const contract = await Contract.findByPk(contractId, {
        include: [
          {
            model: Quote,
            as: 'Quote',
            include: [
              { 
                model: User,
                as: 'Cliente',
                attributes: ['id', 'name', 'lastname', 'email', 'phone'] 
              },
              {
                model: QuoteCalculation,
                as: 'Calculation',
                attributes: [
                  'precio_final_total', 
                  'total_comisiones',
                  'total_ganancia'
                ]
              }
            ]
          },
          {
            model: ContractItem,
            as: 'Items',
            include: [
              {
                model: Purchase,
                as: 'Purchases',
                attributes: ['id', 'costo', 'proveedor', 'estado_pago']
              }
            ]
          }
        ]
      });

      if (!contract) {
        return res.status(404).json({
          success: false,
          message: 'Contrato no encontrado'
        });
      }

      if (contract.status !== 'completed') {
        return res.status(400).json({
          success: false,
          message: 'El contrato debe estar completado para generar factura'
        });
      }

      // 2. Verificar que no existe ya una factura para este contrato
      const existingInvoice = await Invoice.findOne({
        where: { contract_id: contractId }
      });

      if (existingInvoice) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una factura para este contrato',
          invoice_id: existingInvoice.id
        });
      }

      // 3. Generar número de factura único
      const invoiceCount = await Invoice.count();
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(4, '0')}`;

      // 4. Extraer items de la cotización aprobada
      const quote = contract.Quote;
      const calculation = quote?.Calculation;
      
      // ✅ DESGLOSE DE ITEMS BASADO EN LA COTIZACIÓN
      const invoiceItems = [];
      
      // Items principales de la cotización
      if (calculation) {
        // Agregar items según lo cotizado
        if (calculation.precio_tickets > 0) {
          invoiceItems.push({
            descripcion: 'Tickets de transporte',
            cantidad: 1,
            valor_unitario: parseFloat(calculation.precio_tickets),
            valor_total: parseFloat(calculation.precio_tickets)
          });
        }
        
        if (calculation.precio_asistencia_medica > 0) {
          invoiceItems.push({
            descripcion: 'Asistencia médica de viaje',
            cantidad: 1,
            valor_unitario: parseFloat(calculation.precio_asistencia_medica),
            valor_total: parseFloat(calculation.precio_asistencia_medica)
          });
        }
        
        if (calculation.precio_traslados > 0) {
          invoiceItems.push({
            descripcion: 'Traslados y transporte local',
            cantidad: 1,
            valor_unitario: parseFloat(calculation.precio_traslados),
            valor_total: parseFloat(calculation.precio_traslados)
          });
        }
        
        if (calculation.precio_alojamiento > 0) {
          invoiceItems.push({
            descripcion: 'Alojamiento',
            cantidad: 1,
            valor_unitario: parseFloat(calculation.precio_alojamiento),
            valor_total: parseFloat(calculation.precio_alojamiento)
          });
        }
        
        if (calculation.total_comisiones > 0) {
          invoiceItems.push({
            descripcion: 'Comisiones de gestión',
            cantidad: 1,
            valor_unitario: parseFloat(calculation.total_comisiones),
            valor_total: parseFloat(calculation.total_comisiones)
          });
        }
        
        if (calculation.total_ganancia > 0) {
          invoiceItems.push({
            descripcion: 'Ganancia operacional',
            cantidad: 1,
            valor_unitario: parseFloat(calculation.total_ganancia),
            valor_total: parseFloat(calculation.total_ganancia)
          });
        }
      }

      // 5. Calcular totales de la factura
      const totalAmount = calculation?.precio_final_total || 0;
      const commissionsAmount = calculation?.total_comisiones || 0;
      const companyProfit = calculation?.total_ganancia || 0;
      const purchasesAmount = parseFloat(totalAmount) - parseFloat(commissionsAmount) - parseFloat(companyProfit);

      // 6. Crear la factura usando los nombres correctos del modelo
      const invoice = await Invoice.create({
        contract_id: contractId,
        cliente_id: contract.Quote?.Cliente?.id,
        numero_factura: invoiceNumber,
        fecha_factura: new Date(),
        fecha_vencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
        
        // Información del cliente
        cliente_nombre: `${contract.Quote?.Cliente?.name} ${contract.Quote?.Cliente?.lastname}`,
        cliente_documento: contract.Quote?.Cliente?.documento || 'N/A',
        cliente_email: contract.Quote?.Cliente?.email,
        cliente_telefono: contract.Quote?.Cliente?.phone,
        
        // Montos detallados según cotización
        monto_compras: purchasesAmount,
        monto_comisiones: commissionsAmount,
        monto_ganancia: companyProfit,
        subtotal: totalAmount,
        impuestos: 0, // Por definir si aplica
        monto_total: totalAmount,
        
        status: 'generated',
        generada_por: req.user?.id || 1, // Usuario que genera
        observaciones: `Factura generada automáticamente para contrato ${contract.contract_number}`,
        
        // Items detallados como JSON
        items_factura: invoiceItems
      });

      console.log(`✅ Factura creada exitosamente: ${invoiceNumber}`);
      console.log(`📋 Items de factura:`, invoiceItems);

      res.status(201).json({
        success: true,
        message: 'Factura generada exitosamente',
        data: {
          ...invoice.toJSON(),
          items_detallados: invoiceItems
        }
      });

    } catch (error) {
      console.error('❌ Error en generateInvoice:', error);
      res.status(500).json({
        success: false,
        message: 'Error al generar factura',
        error: error.message
      });
    }
  },

  // ✅ OBTENER TODAS LAS FACTURAS
  getAllInvoices: async (req, res) => {
    try {
      console.log('📋 Obteniendo todas las facturas...');

      const invoices = await Invoice.findAll({
        include: [
          {
            model: Contract,
            as: 'Contract',
            include: [
              {
                model: Quote,
                as: 'Quote',
                include: [
                  { 
                    model: User,
                    as: 'Cliente',
                    attributes: ['id', 'name', 'lastname', 'email', 'phone'] 
                  }
                ]
              }
            ]
          }
        ],
        order: [['issue_date', 'DESC']]
      });

      res.status(200).json({
        success: true,
        message: `Se encontraron ${invoices.length} facturas`,
        data: invoices
      });

    } catch (error) {
      console.error('❌ Error en getAllInvoices:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener facturas',
        error: error.message
      });
    }
  },

  // ✅ OBTENER FACTURA POR ID
  getInvoiceById: async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`🔍 Obteniendo factura ID: ${id}`);

      const invoice = await Invoice.findByPk(id, {
        include: [
          {
            model: Contract,
            as: 'Contract',
            include: [
              {
                model: Quote,
                as: 'Quote',
                include: [
                  { 
                    model: User,
                    as: 'Cliente',
                    attributes: ['id', 'name', 'lastname', 'email', 'phone'] 
                  },
                  {
                    model: QuoteCalculation,
                    as: 'Calculation',
                    attributes: [
                      'precio_final_total', 
                      'total_comisiones',
                      'total_ganancia'
                    ]
                  }
                ]
              }
            ]
          }
        ]
      });

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Factura no encontrada'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          ...invoice.toJSON(),
          items_detallados: invoice.items_factura || []
        }
      });

    } catch (error) {
      console.error('❌ Error en getInvoiceById:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener factura',
        error: error.message
      });
    }
  },

  // ✅ ACTUALIZAR ESTADO DE FACTURA
  updateInvoiceStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      
      console.log(`🔄 Actualizando estado de factura ID: ${id} a ${status}`);

      const invoice = await Invoice.findByPk(id);
      
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Factura no encontrada'
        });
      }

      const validStatuses = ['pending', 'approved', 'rejected', 'paid'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Estado inválido. Debe ser uno de: ${validStatuses.join(', ')}`
        });
      }

      await invoice.update({
        status,
        notes: notes || invoice.notes,
        updated_at: new Date()
      });

      res.status(200).json({
        success: true,
        message: `Estado de factura actualizado a ${status}`,
        data: invoice
      });

    } catch (error) {
      console.error('❌ Error en updateInvoiceStatus:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar estado de factura',
        error: error.message
      });
    }
  }

};

module.exports = invoiceController;
