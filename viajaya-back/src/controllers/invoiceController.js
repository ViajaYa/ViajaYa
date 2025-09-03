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

    // ✅ OBTENER IDs de contratos que YA tienen factura (cualquier estado)
    const contractsWithInvoices = await Invoice.findAll({
      attributes: ['contract_id'],
      where: {
        status: {
          [Op.in]: ['generated', 'sent', 'paid', 'cancelled'] // ✅ Excluir solo drafts
        }
      }
    });

    const contractIdsWithInvoices = contractsWithInvoices.map(invoice => invoice.contract_id);
    console.log('📋 Contratos que ya tienen factura:', contractIdsWithInvoices);

    // ✅ BUSCAR contratos completados SIN factura generada
    const whereCondition = {
      status: 'completed',
      fecha_fin_viaje: {
        [Op.lte]: new Date() // Viajes ya terminados
      }
    };

    // ✅ Si hay contratos con facturas, excluirlos
    if (contractIdsWithInvoices.length > 0) {
      whereCondition.id = {
        [Op.notIn]: contractIdsWithInvoices
      };
    }

    const contractsPendientes = await Contract.findAll({
      where: whereCondition,
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
                'precio_final_por_persona',
                'total_comisiones',
                'total_ganancia'
              ],
              required: false
            }
          ]
        }
      ],
      order: [['fecha_fin_viaje', 'ASC']]
    });

    console.log(`📊 Encontrados ${contractsPendientes.length} contratos pendientes de facturar`);
    console.log(`📊 Excluidos ${contractIdsWithInvoices.length} contratos que ya tienen factura`);

    res.status(200).json({
      success: true,
      message: `Se encontraron ${contractsPendientes.length} contratos pendientes de facturar`,
      data: contractsPendientes,
      excluded_contracts: contractIdsWithInvoices.length
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
 // ...existing code...

// ✅ GENERAR FACTURA PARA UN CONTRATO ESPECÍFICO
generateInvoice: async (req, res) => {
  try {
    const { contractId } = req.params;
    console.log(`🧾 Generando factura para contrato ID: ${contractId}`);

    // ✅ OBTENER ID del usuario que genera la factura desde el token JWT
    const generadaPor = req.user?.id || req.userId || 1; // Fallback a admin si no hay usuario

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
                'precio_final_por_persona',
                'total_comisiones',
                'total_ganancia'
              ],
              required: false
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

    // ✅ VERIFICAR que tenemos la información del cliente
    const cliente = contract.Quote?.Cliente;
    if (!cliente) {
      return res.status(400).json({
        success: false,
        message: 'No se encontró información del cliente en el contrato'
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
    const quoteCalc = contract.Quote?.Calculation;
    const totalAmount = parseFloat(quoteCalc?.precio_final_total || contract.precio_total || 0);
    const commissionsAmount = parseFloat(quoteCalc?.total_comisiones || 0);
    const companyProfit = parseFloat(quoteCalc?.total_ganancia || 0);

    // ✅ CALCULAR montos detallados
    let montoCompras = 0;
    if (contract.Items && contract.Items.length > 0) {
      montoCompras = contract.Items.reduce((sum, item) => {
        return sum + parseFloat(item.precio_total || 0);
      }, 0);
    }

    // ✅ PREPARAR información del cliente
    const clienteNombre = `${cliente.name} ${cliente.lastname}`.trim();
    const clienteEmail = cliente.email;
    const clienteDocumento = contract.documento_titular || 'No especificado';
    const clienteTelefono = cliente.phone || null;

    console.log('📋 Datos para factura:');
    console.log(`   - Cliente ID: ${cliente.id}`);
    console.log(`   - Cliente: ${clienteNombre}`);
    console.log(`   - Email: ${clienteEmail}`);
    console.log(`   - Documento: ${clienteDocumento}`);
    console.log(`   - Total: $${totalAmount.toLocaleString('es-CO')}`);
    console.log(`   - Generada por: ${generadaPor}`);

    // 5. Crear la factura con TODOS los campos requeridos
    const invoice = await Invoice.create({
      // ✅ Campos requeridos de relaciones
      contract_id: contractId,
      cliente_id: cliente.id,
      generada_por: generadaPor,

      // ✅ Información de la factura
      numero_factura: invoiceNumber,
      fecha_factura: new Date(),
      fecha_vencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días

      // ✅ Información del cliente (campos requeridos)
      cliente_nombre: clienteNombre,
      cliente_documento: clienteDocumento,
      cliente_email: clienteEmail,
      cliente_telefono: clienteTelefono,

      // ✅ Montos detallados
      monto_compras: montoCompras,
      monto_comisiones: commissionsAmount,
      monto_ganancia: companyProfit,
      subtotal: totalAmount,
      impuestos: 0, // Por definir si aplica
      monto_total: totalAmount,

      // ✅ Estados y tipo
      status: 'generated',
      tipo_factura: 'electronica',

      // ✅ Información adicional
      observaciones: `Factura generada automáticamente para contrato ${contract.contract_number || contractId}`,

      // ✅ Desglose detallado (JSON)
      items_factura: {
        contract_info: {
          contract_number: contract.contract_number,
          fecha_viaje: contract.fecha_inicio_viaje,
          destino: contract.Quote?.destino,
          numero_personas: contract.numero_pasajeros
        },
        calculation_data: quoteCalc ? {
          precio_final_total: quoteCalc.precio_final_total,
          total_comisiones: quoteCalc.total_comisiones,
          total_ganancia: quoteCalc.total_ganancia
        } : null,
        items_contrato: contract.Items?.map(item => ({
          tipo: item.tipo,
          descripcion: item.descripcion,
          precio_total: item.precio_total,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario
        })) || [],
        generacion_info: {
          generated_by: 'system',
          generation_date: new Date().toISOString(),
          user_id: generadaPor
        }
      }
    });

    console.log(`✅ Factura creada exitosamente: ${invoiceNumber}`);

    res.status(201).json({
      success: true,
      message: 'Factura generada exitosamente',
      data: {
        id: invoice.id,
        numero_factura: invoice.numero_factura,
        cliente_nombre: invoice.cliente_nombre,
        monto_total: invoice.monto_total,
        fecha_factura: invoice.fecha_factura,
        status: invoice.status
      }
    });

  } catch (error) {
    console.error('❌ Error en generateInvoice:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar factura',
      error: error.message,
      details: error.errors?.map(e => e.message) || []
    });
  }
},

// ...existing code...

  // ✅ OBTENER TODAS LAS FACTURAS
  getAllInvoices: async (req, res) => {
    try {
      console.log('📋 Obteniendo todas las facturas...');

      const invoices = await Invoice.findAll({
        include: [
          {
            model: Contract,
            as: 'Contract', // ✅ Usar alias definido en db.js
            include: [
              {
                model: Quote,
                as: 'Quote', // ✅ Usar alias definido en db.js
                include: [
                  { 
                    model: User,
                    as: 'Cliente', // ✅ Usar alias para el cliente
                    attributes: ['id', 'name', 'lastname', 'email', 'phone'] // ✅ Corregir nombres de campos
                  }
                ]
              }
            ]
          }
        ],
        order: [['fecha_factura', 'DESC']] // ✅ Usar nombre de columna español
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
            as: 'Contract', // ✅ Usar alias definido en db.js
            include: [
              {
                model: Quote,
                as: 'Quote', // ✅ Usar alias definido en db.js
                include: [
                  { 
                    model: User,
                    as: 'Cliente', // ✅ Usar alias para el cliente
                    attributes: ['id', 'name', 'lastname', 'email', 'phone'] // ✅ Corregir nombres de campos
                  },
                  {
                    model: QuoteCalculation,
                    as: 'Calculation', // ✅ Usar alias definido en db.js
                    attributes: [
                      'precio_final_total', // ✅ Usar nombre correcto de columna
                      'precio_final_por_persona', // ✅ Agregar precio por persona
                      'total_comisiones', // ✅ Usar nombre correcto
                      'total_ganancia' // ✅ Usar nombre correcto
                    ],
                    required: false // ✅ LEFT JOIN para evitar errores si no existe
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
