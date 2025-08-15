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
            [Op.lte]: new Date() // Viajes ya terminados
          }
        },
        include: [
          {
            model: Quote,
            include: [
              { 
                model: User, 
                attributes: ['id', 'nombre', 'apellido', 'email', 'telefono'] 
              },
              {
                model: QuoteCalculation,
                attributes: [
                  'total_price', 
                  'commission_asesor',
                  'commission_lider', 
                  'commission_gerente',
                  'company_profit'
                ]
              }
            ]
          }
        ],
        order: [['fecha_fin_viaje', 'ASC']]
      });

      console.log(`📊 Encontrados ${contractsPendientes.length} contratos pendientes de facturar`);

      res.status(200).json({
        success: true,
        message: `Se encontraron ${contractsPendientes.length} contratos pendientes de facturar`,
        data: contractsPendientes
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
            include: [
              { 
                model: User, 
                attributes: ['id', 'nombre', 'apellido', 'email', 'telefono'] 
              },
              {
                model: QuoteCalculation,
                attributes: [
                  'total_price', 
                  'commission_asesor',
                  'commission_lider', 
                  'commission_gerente',
                  'company_profit'
                ]
              }
            ]
          },
          {
            model: ContractItem,
            include: [
              {
                model: Purchase,
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

      // 4. Calcular totales de la factura
      const quoteCalc = contract.Quote?.QuoteCalculations?.[0];
      const totalAmount = quoteCalc?.total_price || 0;
      const commissionsAmount = (quoteCalc?.commission_asesor || 0) + 
                                (quoteCalc?.commission_lider || 0) + 
                                (quoteCalc?.commission_gerente || 0);
      const companyProfit = quoteCalc?.company_profit || 0;

      // 5. Crear la factura
      const invoice = await Invoice.create({
        contract_id: contractId,
        user_id: contract.Quote?.User?.id,
        invoice_number: invoiceNumber,
        issue_date: new Date(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
        total_amount: totalAmount,
        tax_amount: 0, // Por definir si aplica
        subtotal: totalAmount,
        status: 'pending',
        notes: `Factura generada automáticamente para contrato ${contractId}`,
        metadata: {
          commissions_amount: commissionsAmount,
          company_profit: companyProfit,
          generated_by: 'system',
          generation_date: new Date().toISOString()
        }
      });

      console.log(`✅ Factura creada exitosamente: ${invoiceNumber}`);

      res.status(201).json({
        success: true,
        message: 'Factura generada exitosamente',
        data: invoice
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
            include: [
              {
                model: Quote,
                include: [
                  { 
                    model: User, 
                    attributes: ['id', 'nombre', 'apellido', 'email', 'telefono'] 
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
            include: [
              {
                model: Quote,
                include: [
                  { 
                    model: User, 
                    attributes: ['id', 'nombre', 'apellido', 'email', 'telefono'] 
                  },
                  {
                    model: QuoteCalculation,
                    attributes: [
                      'total_price', 
                      'commission_asesor',
                      'commission_lider', 
                      'commission_gerente',
                      'company_profit'
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
        data: invoice
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
