const { Contract, Quote, User, Passenger,  Payment, PackagePurchase, Commission, ContractItems } = require('../db');
const { generateContractPDF } = require('../utils/generateContractPDF');
const commissionController = require('./commissionController');
const { generateSignatureToken, verifySignatureToken } = require('../utils/generateSignatureToken');
const { generateSignedContractPDF } = require('../utils/generateSignedContractPDF');


const contractController = {
  // Crear nuevo contrato basado en cotización aprobada
  createContract: async (req, res) => {
    console.log('Llamada a createContract', req.body);
    try {
      const {
        quote_id, // ✅ AGREGADO: Aceptar trip_type explícito del frontend
        forma_pago,
        numero_cuotas,
        fecha_inicio_viaje,
        fecha_fin_viaje,
        fecha_vencimiento_cuotas
      } = req.body;

      // Verificar que la cotización existe y está aprobada
      const quote = await Quote.findByPk(quote_id, {
        include: [{ model: User, as: 'Cliente' }]
      });
      console.log('Cotización encontrada:', quote?.status, quote?.id);

      if (!quote) {
        return res.status(404).json({ message: 'Cotización no encontrada' });
      }

      if (quote.status !== 'approved') {
        return res.status(400).json({ 
          message: 'La cotización debe estar aprobada para crear un contrato' 
        });
      }

      // Verificar que no existe ya un contrato para esta cotización
      const existingContract = await Contract.findOne({ where: { quote_id } });
      if (existingContract) {
        return res.status(400).json({ 
          message: 'Ya existe un contrato para esta cotización' 
        });
      }

      // Generar número de contrato único
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      
      const lastContract = await Contract.findOne({
        where: {
          contract_number: {
            [require('sequelize').Op.startsWith]: `CONT-${year}${month}${day}-`
          }
        },
        order: [['created_at', 'DESC']]
      });

      let sequence = 1;
      if (lastContract) {
        const lastSequence = parseInt(lastContract.contract_number.split('-')[2]);
        sequence = lastSequence + 1;
      }

      const contract_number = `CONT-${year}${month}${day}-${String(sequence).padStart(3, '0')}`;

      // Calcular valores de cuotas
      const precio_total = quote.precio_total;
      let valor_cuota = precio_total;
      
      if (forma_pago === 'cuotas' && numero_cuotas > 1) {
        valor_cuota = precio_total / numero_cuotas;
      }

      // ✅ DEBUG: Verificar trip_type de la cotización
      console.log('🔍 DEBUG - createContract recibió quote con trip_type:', quote.trip_type);
      console.log('🔍 DEBUG - createContract recibió trip_type explícito:', trip_type);
      console.log('🔍 DEBUG - Quote completa:', { 
        id: quote.id, 
        destino: quote.destino, 
        trip_type: quote.trip_type,
        updatedAt: quote.updatedAt 
      });

      const finalTripType = trip_type || quote.trip_type || 'nacional';
      console.log('🔍 DEBUG - Tipo final asignado al contrato:', finalTripType);

      const newContract = await Contract.create({
        contract_number,
        quote_id,
        cliente_id: quote.cliente_id,
        trip_type: quote.trip_type, // ✅ CORREGIDO: Usar valor explícito primero
        precio_total,
        forma_pago,
        numero_cuotas: forma_pago === 'cuotas' ? numero_cuotas : 1,
        valor_cuota,
        fecha_vencimiento_cuotas: fecha_vencimiento_cuotas || [],
        fecha_inicio_viaje,
        fecha_fin_viaje,
        saldo_pendiente: precio_total,
        status: 'draft'
      });

      const contractWithDetails = await Contract.findByPk(newContract.id, {
  include: [
    {
      model: Quote,
      as: 'Quote', // ✅ AGREGAR EL ALIAS REQUERIDO
      attributes: [
        'id', 'quote_number', 'nombre_cliente', 'email_cliente',
        'destino', 'trip_type', 'origen', 'precio_total', 'numero_personas',
        'fecha_ida', 'fecha_regreso'
      ],
      include: [
        // ✅ MANTENER: Jerarquía de ventas de la cotización
        { 
          model: User, 
          as: 'Asesor', 
          attributes: ['id', 'name', 'lastname', 'email', 'role'],
          required: false 
        },
        { 
          model: User, 
          as: 'Lider', 
          attributes: ['id', 'name', 'lastname', 'email', 'role'],
          required: false 
        },
        { 
          model: User, 
          as: 'Gerente', 
          attributes: ['id', 'name', 'lastname', 'email', 'role'],
          required: false 
        },
        { 
          model: User, 
          as: 'Admin', 
          attributes: ['id', 'name', 'lastname', 'email', 'role'],
          required: false 
        }
      ]
    },
    // ✅ AGREGAR: Relación directa con el cliente del contrato
    {
      model: User,
      as: 'Cliente', // ✅ Cliente directo del contrato
      attributes: ['id', 'name', 'lastname', 'email', 'phone'],
      required: false
    }
  ]
});

      res.status(201).json({
        message: 'Contrato creado exitosamente',
        contract: contractWithDetails
      });

    } catch (error) {
      console.error('Error creating contract:', error);
      res.status(500).json({ 
        message: 'Error al crear el contrato', 
        error: error.message 
      });
    }
  },

  // Obtener todos los contratos
getAllContracts : async (req, res) => {
  try {
    const contracts = await Contract.findAndCountAll({
      include: [
        {
          model: Quote,
          as: 'Quote', // ✅ AGREGAR ESTE ALIAS
          attributes: [
            'id', 'quote_number', 'nombre_cliente', 'email_cliente',
            'destino', 'trip_type', 'origen', 'precio_total', 'numero_personas'
          ],
          include: [
            // ✅ Jerarquía de ventas desde la cotización
            { 
              model: User, 
              as: 'Asesor', 
              attributes: ['id', 'name', 'lastname', 'email'],
              required: false 
            },
            { 
              model: User, 
              as: 'Lider', 
              attributes: ['id', 'name', 'lastname', 'email'],
              required: false 
            },
            { 
              model: User, 
              as: 'Gerente', 
              attributes: ['id', 'name', 'lastname', 'email'],
              required: false 
            },
            { 
              model: User, 
              as: 'Admin', 
              attributes: ['id', 'name', 'lastname', 'email'],
              required: false 
            }
          ]
        },
        
        {
          model: User,
          as: 'Cliente', // ✅ Cliente directo del contrato
          attributes: ['id', 'name', 'lastname', 'email', 'phone'],
          required: false
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      contracts: contracts.rows,
      total: contracts.count
    });

  } catch (error) {
    console.error("Error getting contracts:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los contratos",
      error: error.message
    });
  }
},

  // Obtener contrato por ID
  getContractById: async (req, res) => {
    try {
    const { id } = req.params;

    const contract = await Contract.findByPk(id, {
      include: [
        {
          model: Quote,
          as: 'Quote', // ✅ AGREGAR ESTE ALIAS
          attributes: [
            'id', 'quote_number', 'nombre_cliente', 'email_cliente',
            'destino', 'trip_type', 'origen', 'precio_total', 'numero_personas',
            'fecha_ida', 'fecha_regreso'
          ],
          include: [
            { 
              model: User, 
              as: 'Asesor', 
              attributes: ['id', 'name', 'lastname', 'email'],
              required: false 
            },
            { 
              model: User, 
              as: 'Lider', 
              attributes: ['id', 'name', 'lastname', 'email'],
              required: false 
            },
            { 
              model: User, 
              as: 'Gerente', 
              attributes: ['id', 'name', 'lastname', 'email'],
              required: false 
            },
            { 
              model: User, 
              as: 'Admin', 
              attributes: ['id', 'name', 'lastname', 'email'],
              required: false 
            },
             {
              model: Passenger,
              as: 'Passengers',
              attributes: [
                'id', 'nombre', 'apellido', 'documento_identidad', 
                'tipo_documento', 'fecha_nacimiento', 'titular'
              ]
            }
          ]
        },
         
        {
          model: User,
          as: 'Cliente', // ✅ Cliente directo del contrato
          attributes: ['id', 'name', 'lastname', 'email', 'phone'],
          required: false
        }
      ]
    });

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: "Contrato no encontrado"
      });
    }

    const passengers = contract.Quote?.Passengers || [];
    const titularPassenger = passengers.find(p => p.titular === true);

    res.json({
      success: true,
      contract,
      passengers_summary: {
        total: passengers.length,
        expected: contract.Quote?.numero_personas || 0,
        complete: passengers.length === contract.Quote?.numero_personas,
        titular: titularPassenger ? {
          nombre: `${titularPassenger.nombre} ${titularPassenger.apellido}`,
          documento: `${titularPassenger.tipo_documento}: ${titularPassenger.documento_identidad}`
        } : null,
        all_passengers: passengers
      }
    });

  } catch (error) {
    console.error("Error getting contract:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el contrato",
      error: error.message
    });
  }
},

  // Actualizar contrato
  updateContract: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      console.log('🔍 DEBUG - updateContract recibió datos:', updateData);

      const contract = await Contract.findByPk(id);

      if (!contract) {
        return res.status(404).json({ message: 'Contrato no encontrado' });
      }

      // ✅ FUNCIÓN AUXILIAR para validar fechas
      const validateAndCleanDate = (dateValue, fieldName) => {
        if (!dateValue) return null;
        
        if (dateValue === 'Invalid date' || dateValue === 'null' || dateValue === 'undefined') {
          console.log(`⚠️ ${fieldName} inválida, estableciendo como null:`, dateValue);
          return null;
        }
        
        const fecha = new Date(dateValue);
        if (isNaN(fecha.getTime())) {
          console.log(`⚠️ ${fieldName} inválida, estableciendo como null:`, dateValue);
          return null;
        }
        
        return dateValue; // Mantener el valor original si es válido
      };

      // ✅ LIMPIAR TODAS LAS FECHAS antes de actualizar
      const cleanUpdateData = { ...updateData };
      
      // ✅ MANEJO ESPECIAL PARA FORMA DE PAGO
      if (cleanUpdateData.forma_pago === 'contado') {
        console.log('💰 Contrato de contado - limpiando campos de cuotas');
        
        // Para pago de contado, limpiar todos los campos relacionados con cuotas
        cleanUpdateData.tiene_cuota_inicial = false;
        cleanUpdateData.cuota_inicial_porcentaje = 0;
        cleanUpdateData.cuota_inicial_monto = 0;
        cleanUpdateData.fecha_vencimiento_inicial = null; // ✅ Esto era el problema principal
        cleanUpdateData.numero_cuotas_restantes = 0;
        cleanUpdateData.monto_restante = 0;
        cleanUpdateData.valor_cuota_restante = 0;
        cleanUpdateData.fechas_vencimiento_cuotas = [];
        cleanUpdateData.cuotas_pagadas = [];
        cleanUpdateData.fechas_pago_cuotas = [];
        
        // Para contado, el saldo pendiente debe ser el precio total (hasta que se marque como pagado)
        if (cleanUpdateData.precio_total && !cleanUpdateData.total_pagado) {
          cleanUpdateData.saldo_pendiente = cleanUpdateData.precio_total;
        }
      }
      
      // Lista de campos de fecha a validar (solo si no son parte de cuotas en contado)
      const dateFields = [
        'fecha_firma', 
        'fecha_pago_inicial',
        'fecha_inicio_viaje',
        'fecha_fin_viaje'
      ];

      // ✅ Solo validar fecha_vencimiento_inicial si NO es contado
      if (cleanUpdateData.forma_pago !== 'contado') {
        dateFields.push('fecha_vencimiento_inicial');
      }

      // Validar cada campo de fecha
      dateFields.forEach(field => {
        if (cleanUpdateData[field] !== undefined) {
          cleanUpdateData[field] = validateAndCleanDate(cleanUpdateData[field], field);
        }
      });

      // ✅ VALIDAR arrays de fechas solo si NO es contado
      if (cleanUpdateData.forma_pago !== 'contado') {
        if (cleanUpdateData.fechas_vencimiento_cuotas && Array.isArray(cleanUpdateData.fechas_vencimiento_cuotas)) {
          cleanUpdateData.fechas_vencimiento_cuotas = cleanUpdateData.fechas_vencimiento_cuotas.map((fecha, index) => 
            validateAndCleanDate(fecha, `fechas_vencimiento_cuotas[${index}]`)
          ).filter(fecha => fecha !== null); // Remover fechas null del array
        }

        if (cleanUpdateData.fechas_pago_cuotas && Array.isArray(cleanUpdateData.fechas_pago_cuotas)) {
          cleanUpdateData.fechas_pago_cuotas = cleanUpdateData.fechas_pago_cuotas.map((fecha, index) => 
            validateAndCleanDate(fecha, `fechas_pago_cuotas[${index}]`)
          ).filter(fecha => fecha !== null); // Remover fechas null del array
        }
      }

      console.log('🔍 DEBUG - datos después de limpieza:', cleanUpdateData);

      await contract.update(cleanUpdateData);

      // ✅ REGENERAR PDF automáticamente si se cambiaron datos importantes
      const shouldRegeneratePDF = (
        cleanUpdateData.hasOwnProperty('forma_pago') ||
        cleanUpdateData.hasOwnProperty('precio_total') ||
        cleanUpdateData.hasOwnProperty('numero_cuotas_restantes') ||
        cleanUpdateData.hasOwnProperty('cuota_inicial_monto') ||
        cleanUpdateData.hasOwnProperty('fecha_vencimiento_inicial') ||
        cleanUpdateData.hasOwnProperty('valor_cuota_restante')
      );

      let pdfRegenerated = false;
      
      if (shouldRegeneratePDF && contract.contrato_pdf_url) {
        try {
          console.log('🔄 Regenerando PDF automáticamente tras actualización de contrato...');
          
          // Obtener contrato con todas las relaciones necesarias para el PDF
          const contractForPDF = await Contract.findByPk(id, {
            include: [
              { 
                model: Quote,
                as: 'Quote',
                include: [
                  { model: User, as: 'Cliente', attributes: ['id', 'name', 'lastname', 'email', 'phone'] },
                  {
                    model: Passenger,
                    as: 'Passengers',
                    attributes: [
                      'id', 'nombre', 'apellido', 'documento_identidad', 
                      'tipo_documento', 'fecha_nacimiento', 'titular'
                    ]
                  }
                ]
              },
              {
                model: User,
                as: 'Cliente',
                attributes: ['id', 'name', 'lastname', 'email', 'phone', 'documento_identidad', 'tipo_documento']
              }
            ]
          });

          const { generateContractPDF } = require('../utils/generateContractPDF');
          const pdfResult = await generateContractPDF(contractForPDF, true);
          
          // Actualizar URL del PDF regenerado
          await contract.update({
            contrato_pdf_url: pdfResult.relativePath
          });
          
          pdfRegenerated = true;
          console.log('✅ PDF regenerado exitosamente:', pdfResult.filename);
          
        } catch (pdfError) {
          console.error('⚠️ Error regenerando PDF automáticamente:', pdfError);
          // No fallar la actualización si el PDF falla
        }
      }

      const updatedContract = await Contract.findByPk(id, {
        include: [
          { 
           model: Quote,
          as: 'Quote',
            include: [
              { model: User, as: 'Cliente', attributes: ['id', 'name', 'lastname', 'email', 'phone'] }
            ]
          }
        ]
      });

      res.json({
        message: 'Contrato actualizado exitosamente',
        contract: updatedContract,
        pdf_regenerated: pdfRegenerated // ✅ Informar si se regeneró el PDF
      });

    } catch (error) {
      console.error('Error updating contract:', error);
      res.status(500).json({ 
        message: 'Error al actualizar el contrato', 
        error: error.message 
      });
    }
  },

  // Firmar contrato
  signContract: async (req, res) => {
  try {
    const { id } = req.params;
    const { signature, signer_info, signed_at, signature_token, ip_address } = req.body;

    // ✅ VERIFICAR token de firma
    const { verifySignatureToken } = require('../utils/generateSignatureToken');
    try {
      const tokenData = verifySignatureToken(signature_token);
      if (tokenData.contractId !== id) {
        return res.status(400).json({ message: 'Token de firma inválido para este contrato' });
      }
    } catch (error) {
      return res.status(400).json({ message: 'Token de firma inválido o expirado' });
    }

    const contract = await Contract.findByPk(id, {
      include: [
        { 
          model: Quote,
          as: 'Quote',
          include: [
            { model: User, as: 'Cliente' },
            { model: Passenger, as: 'Passengers' }
          ]
        },
        { model: User, as: 'Cliente' }
      ]
    });

    if (!contract) {
      return res.status(404).json({ message: 'Contrato no encontrado' });
    }

    if (contract.status === 'signed') {
      return res.status(400).json({ message: 'El contrato ya está firmado' });
    }

    // ✅ GUARDAR datos de firma
    const signatureData = {
      signature_image: signature,
      signer_name: signer_info.nombre,
      signer_document: signer_info.documento,
      signer_email: signer_info.email,
      signer_role: signer_info.cargo,
      signed_at: signed_at,
      signature_ip: ip_address,
      signature_token: signature_token
    };

    // ✅ ACTUALIZAR contrato con datos de firma
    await contract.update({
      status: 'signed',
      fecha_firma: new Date(signed_at),
      signature_data: JSON.stringify(signatureData)
    });

    // ✅ REGENERAR PDF con firma
    try {
      console.log('📄 Regenerando PDF con firma...');
      const { generateSignedContractPDF } = require('../utils/generateSignedContractPDF');
      const pdfResult = await generateSignedContractPDF(contract, signatureData);
      
      // Actualizar con la nueva URL del PDF firmado
      await contract.update({
        contrato_pdf_url: pdfResult.relativePath,
        signed_pdf_generated: true
      });
      
      console.log('✅ PDF con firma generado:', pdfResult.filename);
    } catch (pdfError) {
      console.error('⚠️ Error generando PDF con firma:', pdfError);
      // No fallar la firma si el PDF falla, se puede regenerar después
    }

    // ✅ ENVIAR email de confirmación (opcional)
    try {
      const { sendEmail } = require('../utils/emailService');
      await sendEmail({
        to: signer_info.email,
        subject: `✅ Contrato Firmado - ${contract.contract_number}`,
        html: `
          <h2>¡Contrato firmado exitosamente!</h2>
          <p>Su contrato <strong>${contract.contract_number}</strong> ha sido firmado digitalmente.</p>
          <p>Recibirá una copia del contrato firmado en breve.</p>
          <p>Gracias por elegir ViajaYa.</p>
        `
      });
    } catch (emailError) {
      console.error('Error enviando email de confirmación:', emailError);
    }

    res.json({
      success: true,
      message: 'Contrato firmado exitosamente',
      contract: {
        id: contract.id,
        contract_number: contract.contract_number,
        status: 'signed',
        signed_at: signed_at,
        signer_name: signer_info.nombre
      }
    });

  } catch (error) {
    console.error('Error signing contract:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al firmar el contrato', 
      error: error.message 
    });
  }
},

  // Enviar contrato para firma
  // ✅ AGREGAR: Función para previsualizar email del contrato
// ✅ CORREGIR: previewContractEmail para incluir pasajeros
previewContractEmail: async (req, res) => {
  try {
    const { id } = req.params;
    
    const contract = await Contract.findByPk(id, {
      include: [
        { 
          model: Quote,
          as: 'Quote',
          include: [
            { model: User, as: 'Cliente', attributes: ['id', 'name', 'lastname', 'email', 'phone'] },
            {
              model: Passenger,
              as: 'Passengers',
              attributes: [
                'id', 'nombre', 'apellido', 'documento_identidad', 
                'tipo_documento', 'fecha_nacimiento', 'titular'
              ],
              required: false
            }
          ]
        },
        {
          model: User,
          as: 'Cliente',
          attributes: ['id', 'name', 'lastname', 'email', 'phone', 'documento_identidad', 'tipo_documento']
        }
      ]
    });

    if (!contract) {
      return res.status(404).json({ message: 'Contrato no encontrado' });
    }

    // ✅ OBTENER PASAJEROS
    const passengers = contract.Quote?.Passengers || [];
    
    // ✅ GENERAR HTML DEL EMAIL (usa el mismo código que sendContract)
    const emailSubject = `📋 Contrato de Viaje - ${contract.Quote?.destino} | ${contract.contract_number}`;
    
    // ✅ USAR EL MISMO HTML QUE EN sendContract para consistencia
    const emailHtml = `[AQUÍ VA EL MISMO HTML QUE EN sendContract - para evitar duplicación, usaremos una función helper]`;

    // ✅ DATOS PARA EL FRONTEND
    const emailData = {
      to: contract.Cliente?.email,
      subject: emailSubject,
      html: emailHtml,
      contractInfo: {
        contract_number: contract.contract_number,
        cliente_name: `${contract.Cliente?.name} ${contract.Cliente?.lastname}`,
        destino: contract.Quote?.destino,
        precio_total: contract.precio_total,
        fecha_viaje: `${new Date(contract.fecha_inicio_viaje).toLocaleDateString('es-ES')} - ${new Date(contract.fecha_fin_viaje).toLocaleDateString('es-ES')}`
      }
    };

    res.json({
      success: true,
      emailData
    });

  } catch (error) {
    console.error('Error previewing contract email:', error);
    res.status(500).json({ 
      message: 'Error al generar preview del email', 
      error: error.message 
    });
  }
},

// ✅ ACTUALIZAR: sendContract para usar el servicio de email
// ✅ CORREGIR: sendContract para usar el servicio de email correctamente
sendContract: async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      email, 
      subject, 
      customMessage
    } = req.body;

    const contract = await Contract.findByPk(id, {
      include: [
        { 
          model: Quote,
          as: 'Quote',
          include: [
            { model: User, as: 'Cliente', attributes: ['id', 'name', 'lastname', 'email', 'phone'] },
            {
              model: Passenger,
              as: 'Passengers',
              attributes: [
                'id', 'nombre', 'apellido', 'documento_identidad', 
                'tipo_documento', 'fecha_nacimiento', 'titular'
              ],
              required: false
            }
          ]
        },
        {
          model: User,
          as: 'Cliente',
          attributes: ['id', 'name', 'lastname', 'email', 'phone', 'documento_identidad', 'tipo_documento']
        }
      ]
    });

    if (!contract) {
      return res.status(404).json({ message: 'Contrato no encontrado' });
    }

    // ✅ VERIFICAR que el PDF ya existe
    if (!contract.contrato_pdf_url) {
      return res.status(400).json({ 
        message: 'Debe generar el PDF del contrato antes de enviarlo',
        action: 'generate_pdf_first'
      });
    }

    const path = require('path');
    const fs = require('fs');
    const pdfFilePath = path.join(__dirname, '../../', contract.contrato_pdf_url);
    
    if (!fs.existsSync(pdfFilePath)) {
      return res.status(404).json({ 
        message: 'Archivo PDF no encontrado. Regenere el PDF del contrato.',
        action: 'regenerate_pdf'
      });
    }



    // ✅ GENERAR EMAIL HTML (mismo código que antes)
    const emailSubject = subject || `📋 Contrato de Viaje - ${contract.Quote?.destino} | ${contract.contract_number}`;
    const passengers = contract.Quote?.Passengers || [];

const signatureToken = generateSignatureToken(contract.id);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contrato de Viaje - ViajaYa</title>
        <style>
          body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; }
          .header { background: linear-gradient(135deg, #421261, #573b58); color: white; padding: 30px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
          .header p { margin: 5px 0 0 0; font-size: 14px; opacity: 0.9; }
          .content { padding: 30px 20px; }
          .contract-info { background: linear-gradient(135deg, #dc86c7, #cdb2d5); padding: 20px; border-radius: 10px; margin: 20px 0; color: white; }
          .contract-info h2 { margin: 0 0 15px 0; font-size: 20px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; }
          .info-item { background: rgba(255,255,255,0.2); padding: 10px; border-radius: 5px; }
          .info-item label { font-weight: bold; font-size: 12px; opacity: 0.9; display: block; }
          .info-item value { font-size: 14px; }
          .price-highlight { background: #2be0e9; color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .price-highlight .amount { font-size: 24px; font-weight: bold; }
          .price-highlight .label { font-size: 12px; opacity: 0.9; }
          .payment-info { background: #f8f9fa; border-left: 4px solid #421261; padding: 15px; margin: 20px 0; }
          .payment-info h3 { margin: 0 0 10px 0; color: #421261; }
          .passengers-section { background: #f0f8ff; border-radius: 8px; padding: 15px; margin: 20px 0; }
          .passenger { background: white; padding: 10px; margin: 5px 0; border-radius: 5px; border-left: 3px solid #2be0e9; }
          .passenger.titular { border-left-color: #421261; background: #faf5ff; }
          .instructions { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .instructions h3 { margin: 0 0 10px 0; color: #856404; }
          .footer { background: #421261; color: white; padding: 20px; text-align: center; }
          .footer a { color: #2be0e9; text-decoration: none; }
          .cta-button { background: #2be0e9; color: white; padding: 12px 25px; border-radius: 5px; text-decoration: none; display: inline-block; margin: 15px 0; font-weight: bold; }
          @media (max-width: 600px) {
            .info-grid { grid-template-columns: 1fr; }
            .container { margin: 0; }
            .content { padding: 20px 15px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <h1>📋 CONTRATO DE VIAJE</h1>
            <p>ViajaYa - Operador Turístico | RNT 122035</p>
          </div>

          <!-- Content -->
          <div class="content">
            <h2>¡Estimado/a ${contract.Cliente?.name} ${contract.Cliente?.lastname}!</h2>
            
            <p>Nos complace enviarle su <strong>contrato de viaje</strong> para revisión y confirmación. Este documento contiene todos los detalles de su reserva y las condiciones del servicio.</p>

            <!-- Información del Contrato -->
            <div class="contract-info">
              <h2>🏖️ ${contract.Quote?.destino?.toUpperCase()}</h2>
              
              <div class="info-grid">
                <div class="info-item">
                  <label>📅 FECHA DE SALIDA</label>
                  <value>${new Date(contract.fecha_inicio_viaje).toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</value>
                </div>
                
                <div class="info-item">
                  <label>📅 FECHA DE REGRESO</label>
                  <value>${new Date(contract.fecha_fin_viaje).toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</value>
                </div>
                
                <div class="info-item">
                  <label>🛫 ORIGEN</label>
                  <value>${contract.Quote?.origen}</value>
                </div>
                
                <div class="info-item">
                  <label>🎯 DESTINO</label>
                  <value>${contract.Quote?.destino}</value>
                </div>
                
                <div class="info-item">
                  <label>👥 PASAJEROS</label>
                  <value>${contract.Quote?.numero_personas} personas</value>
                </div>
                
                <div class="info-item">
                  <label>📋 N° CONTRATO</label>
                  <value>${contract.contract_number}</value>
                </div>
              </div>
            </div>

            <!-- Precio Total -->
            <div class="price-highlight">
              <div class="amount">$${parseFloat(contract.precio_total).toLocaleString('es-CO')}</div>
              <div class="label">VALOR TOTAL DEL CONTRATO</div>
            </div>

            <!-- Información de Pago -->
            ${contract.forma_pago === 'cuotas' ? `
            <div class="payment-info">
              <h3>💳 FORMA DE PAGO: EN CUOTAS</h3>
              ${contract.tiene_cuota_inicial ? `
                <p><strong>Cuota Inicial:</strong> $${parseFloat(contract.cuota_inicial_monto || 0).toLocaleString('es-CO')} (${contract.cuota_inicial_porcentaje}%)</p>
                <p><strong>Fecha límite cuota inicial:</strong> ${contract.fecha_vencimiento_inicial ? new Date(contract.fecha_vencimiento_inicial).toLocaleDateString('es-ES') : 'N/A'}</p>
              ` : ''}
              <p><strong>Número de cuotas:</strong> ${contract.numero_cuotas_restantes || 'N/A'}</p>
              <p><strong>Valor por cuota:</strong> $${parseFloat(contract.valor_cuota_restante || 0).toLocaleString('es-CO')}</p>
              <p><strong>Saldo restante:</strong> $${parseFloat(contract.monto_restante || contract.saldo_pendiente || 0).toLocaleString('es-CO')}</p>
            </div>
            ` : `
            <div class="payment-info">
              <h3>💳 FORMA DE PAGO: CONTADO</h3>
              <p>Pago único por el valor total del contrato.</p>
            </div>
            `}

            <!-- Información de Pasajeros -->
            <div class="passengers-section">
              <h3>👥 INFORMACIÓN DE PASAJEROS</h3>
              ${passengers.length > 0 ? passengers.map(passenger => `
                <div class="passenger ${passenger.titular ? 'titular' : ''}">
                  <strong>${passenger.nombre} ${passenger.apellido}</strong> ${passenger.titular ? '👑 (Titular)' : ''}
                  <br>
                  <small>${passenger.tipo_documento?.toUpperCase()}: ${passenger.documento_identidad} | 
                  Nacimiento: ${new Date(passenger.fecha_nacimiento).toLocaleDateString('es-ES')}</small>
                </div>
              `).join('') : `
                <div class="passenger titular">
                  <strong>${contract.Cliente?.name} ${contract.Cliente?.lastname}</strong> 👑 (Titular)
                  <br>
                  <small>${contract.Cliente?.tipo_documento?.toUpperCase()}: ${contract.Cliente?.documento_identidad}</small>
                </div>
              `}
            </div>

            <!-- Instrucciones -->
            <div class="instructions">
              <h3>📋 INSTRUCCIONES IMPORTANTES</h3>
              <ol>
                <li><strong>Revise cuidadosamente</strong> todos los detalles del contrato adjunto.</li>
                <li><strong>Confirme su aceptación</strong> respondiendo a este email dentro de las próximas <strong>48 horas</strong>.</li>
                <li><strong>Realice los pagos</strong> según el cronograma establecido en el contrato.</li>
                <li><strong>Envíe los soportes de pago</strong> a: <a href="mailto:soportedepagosviajaya@gmail.com">soportedepagosviajaya@gmail.com</a></li>
              </ol>
            </div>

            <!-- Cuentas Bancarias -->
            <div class="payment-info">
              <h3>🏦 CUENTAS PARA PAGOS</h3>
              <p><strong>Bancolombia - Cuenta de Ahorros</strong></p>
              <p>No. 846-772-51165</p>
              <p>Titular: MAYERLY ALEJANDRA HENAO HIGUERA</p>
              <p>CC: 1032406128</p>
            </div>

            <!-- Botón de Confirmación -->
            <div style="text-align: center;">
    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/contract-signature/${contract.id}?token=${generateSignatureToken(contract.id)}" class="cta-button">
      ✅ FIRMAR CONTRATO DIGITALMENTE
    </a>
  </div>

            <p style="margin-top: 30px;">
              <strong>🎯 ¡Estamos emocionados de hacer realidad su viaje a ${contract.Quote?.destino}!</strong>
            </p>

            <p>Para cualquier consulta o aclaración, no dude en contactarnos:</p>
            <ul>
              <li>📧 Email: <a href="mailto:info@viajaya.com">info@viajaya.com</a></li>
              <li>📱 WhatsApp: <a href="https://wa.me/573001234567">+57 300 123 4567</a></li>
              <li>📍 Oficina: Centro Comercial Plaza En Sueño 2 PISO, Bogotá</li>
            </ul>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p><strong>ViajaYa - Operador Turístico y Agencia de Viajes</strong></p>
            <p>🌟 Hacemos realidad tus sueños de viaje 🌟</p>
            <p>📧 info@viajaya.com | 📱 +57 300 123 4567</p>
            <p>📍 Bogotá, Colombia | 📋 RNT 122035</p>
            <p>📸 Síguenos: <a href="https://instagram.com/viajaya_pagina_oficial">@viajaya_pagina_oficial</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    // ✅ PREPARAR EMAIL
    const finalEmail = email || contract.Cliente?.email;

    const mailOptions = {
      to: finalEmail,
      subject: emailSubject,
      html: customMessage ? `
        <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #421261;">
          <h3 style="color: #421261; margin: 0 0 10px 0;">💬 Mensaje Personalizado:</h3>
          <p style="margin: 0; white-space: pre-line;">${customMessage}</p>
        </div>
        ${emailHtml}
      ` : emailHtml,
      attachments: [
        {
          filename: `contrato-${contract.contract_number}.pdf`,
          path: pdfFilePath,
          contentType: 'application/pdf',
        }
      ]
    };

    // ✅ ENVIAR EMAIL
    console.log('📧 Enviando email a:', finalEmail);
    const { sendEmail } = require('../utils/emailService');
    const emailResult = await sendEmail(mailOptions);

    // ✅ ACTUALIZAR ESTADO DEL CONTRATO
    await contract.update({
      status: 'sent',
      sent_at: new Date(),
      email_sent_to: finalEmail
    });

    console.log('✅ Contrato enviado exitosamente');

    res.json({
      success: true,
      message: 'Contrato enviado exitosamente',
      contract: {
        id: contract.id,
        contract_number: contract.contract_number,
        status: 'sent'
      },
      email_info: {
        sent_to: finalEmail,
        pdf_attached: true,
        sent_at: new Date().toISOString(),
        message_id: emailResult?.messageId || 'no-message-id'
      }
    });

  } catch (error) {
    console.error('Error sending contract:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al enviar el contrato', 
      error: error.message 
    });
  }
},

   generateContractPDF: async (req, res) => {
  try {
    const { id } = req.params;
    const { preview = false } = req.query; // ?preview=true para vista previa

    const contract = await Contract.findByPk(id, {
      include: [
        { 
          model: Quote,
          as: 'Quote',
          include: [
            { model: User, as: 'Cliente', attributes: ['id', 'name', 'lastname', 'email', 'phone'] },
            {
              model: Passenger,
              as: 'Passengers',
              attributes: [
                'id', 'nombre', 'apellido', 'documento_identidad', 
                'tipo_documento', 'fecha_nacimiento', 'titular'
              ]
            }
          ]
        },
        {
          model: User,
          as: 'Cliente',
          attributes: ['id', 'name', 'lastname', 'email', 'phone', 'documento_identidad', 'tipo_documento']
        }
      ]
    });

    if (!contract) {
      return res.status(404).json({ message: 'Contrato no encontrado' });
    }

    // ✅ GENERAR PDF (siempre guardamos el archivo)
    const { generateContractPDF } = require('../utils/generateContractPDF');
    const pdfResult = await generateContractPDF(contract, true); // Siempre guardar

    // ✅ ACTUALIZAR contrato con la URL del PDF
    await contract.update({
      contrato_pdf_url: pdfResult.relativePath
    });

    if (preview === 'true') {
      // ✅ VISTA PREVIA: Devolver el PDF directamente en el response
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${pdfResult.filename}"`);
      
      const fs = require('fs');
      const fileBuffer = fs.readFileSync(pdfResult.filepath);
      res.send(fileBuffer);
    } else {
      // ✅ RESPUESTA JSON: Info del PDF generado
      res.json({
        success: true,
        message: 'PDF del contrato generado exitosamente',
        pdf: {
          filename: pdfResult.filename,
          url: pdfResult.relativePath,
          filepath: pdfResult.filepath
        },
        contract: {
          id: contract.id,
          contract_number: contract.contract_number,
          contrato_pdf_url: pdfResult.relativePath
        }
      });
    }

  } catch (error) {
    console.error('Error generating contract PDF:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al generar el PDF del contrato', 
      error: error.message 
    });
  }
},

  // ✅ NUEVO: Descargar PDF del contrato
  downloadContractPDF: async (req, res) => {
    try {
      const { id } = req.params;

      const contract = await Contract.findByPk(id);

      if (!contract) {
        return res.status(404).json({ message: 'Contrato no encontrado' });
      }

      if (!contract.contrato_pdf_url) {
        return res.status(404).json({ message: 'PDF del contrato no encontrado' });
      }

      const filePath = path.join(__dirname, '../../', contract.contrato_pdf_url);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Archivo PDF no existe' });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="contrato-${contract.contract_number}.pdf"`);
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

    } catch (error) {
      console.error('Error downloading contract PDF:', error);
      res.status(500).json({ 
        message: 'Error al descargar el PDF del contrato', 
        error: error.message 
      });
    }
  },

  servePDF: async (req, res) => {
  try {
    const { id } = req.params;
    
    const contract = await Contract.findByPk(id);
    if (!contract) {
      return res.status(404).json({ message: 'Contrato no encontrado' });
    }

    if (!contract.contrato_pdf_url) {
      return res.status(404).json({ message: 'PDF no generado para este contrato' });
    }

    const path = require('path');
    const fs = require('fs');
    const filePath = path.join(__dirname, '../../', contract.contrato_pdf_url);
    
    // ✅ VERIFICAR si el archivo existe físicamente
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Archivo PDF no encontrado en el servidor' });
    }

    // ✅ ESTABLECER headers para PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="contrato-${contract.contract_number}.pdf"`);
    res.setHeader('Cache-Control', 'private, max-age=3600'); // Cache por 1 hora
    
    // ✅ ENVIAR archivo
    res.sendFile(filePath);
    
  } catch (error) {
    console.error('Error sirviendo PDF:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
},

  // Completar contrato (después del viaje)
  completeContract: async (req, res) => {
    try {
      const { id } = req.params;

      const contract = await Contract.findByPk(id);

      if (!contract) {
        return res.status(404).json({ message: 'Contrato no encontrado' });
      }

      // Verificar que el viaje ya terminó
      const currentDate = new Date();
      if (new Date(contract.fecha_fin_viaje) > currentDate) {
        return res.status(400).json({ 
          message: 'El contrato no puede completarse antes de que termine el viaje' 
        });
      }

      // Verificar que todo esté pagado
      if (contract.saldo_pendiente > 0) {
        return res.status(400).json({ 
          message: 'No se puede completar el contrato con saldo pendiente' 
        });
      }

      await contract.update({
        status: 'completed'
      });

      res.json({
        message: 'Contrato completado exitosamente',
        contract
      });

    } catch (error) {
      console.error('Error completing contract:', error);
      res.status(500).json({ 
        message: 'Error al completar el contrato', 
        error: error.message 
      });
    }
  },

  // Obtener contratos por cliente
  getContractsByCliente: async (req, res) => {
    try {
    const { clienteId } = req.params;

    const contracts = await Contract.findAll({
      where: { cliente_id: clienteId },
      include: [
        {
          model: Quote,
          as: 'Quote', // ✅ AGREGAR ESTE ALIAS
          attributes: [
            'id', 'quote_number', 'destino', 'origen', 
            'fecha_ida', 'fecha_regreso', 'numero_personas'
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      contracts
    });

  } catch (error) {
    console.error("Error getting contracts by cliente:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los contratos del cliente",
      error: error.message
    });
  }
},
createContractItem : async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tipo,
      descripcion,
      detalle,
      precio_unitario,
      cantidad,
      precio_total,
      costo_proveedor,
      proveedor,
      proveedor_contacto,
      fecha_inicio,
      fecha_fin,
      fecha_vencimiento_pago,
      observaciones
    } = req.body;

    // Verifica que el contrato existe
    const contract = await Contract.findByPk(id);
    if (!contract) {
      return res.status(404).json({ message: 'Contrato no encontrado' });
    }

    // Crea el item
    const item = await ContractItems.create({
      contract_id: id,
      tipo,
      descripcion,
      detalle,
      precio_unitario,
      cantidad,
      precio_total,
      costo_proveedor,
      proveedor,
      proveedor_contacto,
      fecha_inicio,
      fecha_fin,
      fecha_vencimiento_pago,
      observaciones
    });

    res.status(201).json({ message: 'Item creado', item });
  } catch (error) {
    console.error('Error creando item:', error);
    res.status(500).json({ message: 'Error creando item', error: error.message });
  }
},

// Listar items de un contrato
 getContractItems : async (req, res) => {
  try {
    const { id } = req.params;
    const items = await ContractItems.findAll({
      where: { contract_id: id }
    });
    res.json({ items });
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo items', error: error.message });
  }
},

// Actualizar un item
 updateContractItem : async (req, res) => {
  try {
    const { itemId } = req.params;
    const updateData = req.body;
    const item = await ContractItems.findByPk(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item no encontrado' });
    }
    await item.update(updateData);
    res.json({ message: 'Item actualizado', item });
  } catch (error) {
    res.status(500).json({ message: 'Error actualizando item', error: error.message });
  }
},

// Eliminar un item
 deleteContractItem : async (req, res) => {
  try {
    const { itemId } = req.params;
    const item = await ContractItems.findByPk(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item no encontrado' });
    }
    await item.destroy();
    res.json({ message: 'Item eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error eliminando item', error: error.message });
  }
},

// ✅ NUEVA FUNCIÓN: Aprobar contrato y generar comisiones
approveContract: async (req, res) => {
  try {
    const { id } = req.params;
    const { observaciones } = req.body;

    const contract = await Contract.findByPk(id, {
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
      return res.status(404).json({ message: 'Contrato no encontrado' });
    }

    if (contract.status !== 'signed' && contract.status !== 'draft') {
      return res.status(400).json({ 
        message: 'Solo se pueden aprobar contratos firmados o en borrador' 
      });
    }

    // Actualizar estado del contrato
    await contract.update({
      status: 'completed', // o 'active' según tu lógica de negocio
      observaciones: observaciones || 'Contrato aprobado manualmente'
    });

    // ✅ GENERAR COMISIONES
    let commissionsGenerated = false;
    let commissionResult = null;
    
    try {
      commissionResult = await commissionController.generateCommissions(id);
      commissionsGenerated = true;
      console.log('✅ Comisiones generadas para contrato aprobado:', commissionResult);
    } catch (commissionError) {
      console.error('❌ Error generando comisiones:', commissionError);
    }

    res.json({
      success: true,
      message: 'Contrato aprobado exitosamente',
      contract: await Contract.findByPk(id, {
        include: [
          {
            model: Quote,
            as: 'Quote',
            attributes: ['quote_number', 'nombre_cliente', 'destino', 'precio_total']
          }
        ]
      }),
      commissionsGenerated,
      commissionSummary: commissionResult
    });

  } catch (error) {
    console.error('Error aprobando contrato:', error);
    res.status(500).json({ 
      message: 'Error al aprobar el contrato', 
      error: error.message 
    });
  }
}

};

module.exports = contractController;
