const { Contract, Quote, User, Payment, PackagePurchase, Commission, ContractItems } = require('../db');
const { generateContractPDF } = require('../utils/generateContractPDF');


const contractController = {
  // Crear nuevo contrato basado en cotización aprobada
  createContract: async (req, res) => {
    console.log('Llamada a createContract', req.body);
    try {
      const {
        quote_id,
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

      const newContract = await Contract.create({
        contract_number,
        quote_id,
        cliente_id: quote.cliente_id,
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
        'destino', 'origen', 'precio_total', 'numero_personas',
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
            'destino', 'origen', 'precio_total', 'numero_personas'
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
            'destino', 'origen', 'precio_total', 'numero_personas',
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

    res.json({
      success: true,
      contract
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

      const contract = await Contract.findByPk(id);

      if (!contract) {
        return res.status(404).json({ message: 'Contrato no encontrado' });
      }

      await contract.update(updateData);

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
        contract: updatedContract
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

      const contract = await Contract.findByPk(id);

      if (!contract) {
        return res.status(404).json({ message: 'Contrato no encontrado' });
      }

      if (contract.status !== 'sent') {
        return res.status(400).json({ 
          message: 'El contrato debe estar enviado para poder ser firmado' 
        });
      }

      await contract.update({
        status: 'signed',
        fecha_firma: new Date()
      });

      // Aquí se pueden crear las compras del paquete automáticamente
      // y generar las comisiones correspondientes

      res.json({
        message: 'Contrato firmado exitosamente',
        contract
      });

    } catch (error) {
      console.error('Error signing contract:', error);
      res.status(500).json({ 
        message: 'Error al firmar el contrato', 
        error: error.message 
      });
    }
  },

  // Enviar contrato para firma
  sendContract: async (req, res) => {
    try {
      const { id } = req.params;

      const contract = await Contract.findByPk(id, {
        include: [
          { 
            model: Quote,
            as: 'Quote',
            include: [
              { model: User, as: 'Cliente', attributes: ['id', 'name', 'lastname', 'email', 'phone'] }
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

      // ✅ GENERAR PDF DEL CONTRATO
      console.log('🔄 Generando PDF del contrato...');
      const pdfResult = await generateContractPDF(contract, true);

      // ✅ GUARDAR LA URL DEL PDF EN EL CONTRATO
      await contract.update({
        status: 'sent',
        contrato_pdf_url: pdfResult.relativePath
      });

      console.log('✅ PDF generado y guardado:', pdfResult.filename);

      // Aquí se enviaría el email con el contrato al cliente
      // TODO: Implementar envío de email con PDF adjunto

      res.json({
        message: 'Contrato enviado para firma',
        contract,
        pdf: {
          filename: pdfResult.filename,
          url: pdfResult.relativePath
        }
      });

    } catch (error) {
      console.error('Error sending contract:', error);
      res.status(500).json({ 
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
              { model: User, as: 'Cliente', attributes: ['id', 'name', 'lastname', 'email', 'phone'] }
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

      const saveToFile = preview !== 'true';
      const pdfResult = await generateContractPDF(contract, saveToFile);

      if (preview === 'true') {
        // Para vista previa, devolver el PDF directamente
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${pdfResult.filename}"`);
        res.send(pdfResult.buffer);
      } else {
        // Guardar la URL del PDF en el contrato
        await contract.update({
          contrato_pdf_url: pdfResult.relativePath
        });

        res.json({
          message: 'PDF del contrato generado exitosamente',
          pdf: {
            filename: pdfResult.filename,
            url: pdfResult.relativePath,
            filepath: pdfResult.filepath
          }
        });
      }

    } catch (error) {
      console.error('Error generating contract PDF:', error);
      res.status(500).json({ 
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
}

};

module.exports = contractController;
