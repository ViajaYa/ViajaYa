const { Payment, Contract, Quote, User } = require('../db');

const paymentController = {
  // Crear nuevo pago
  createPayment: async (req, res) => {
    try {
      const {
        contract_id,
        tipo_pago,
        monto,
        referencia_pago,
        comprobante_url,
        wompi_transaction_id,
        wompi_reference,
        pagador_nombre,
        pagador_email,
        pagador_telefono
      } = req.body;

      // Verificar que el contrato existe
      const contract = await Contract.findByPk(contract_id);

      if (!contract) {
        return res.status(404).json({ message: 'Contrato no encontrado' });
      }

      // Verificar que el contrato esté firmado
      if (contract.status !== 'signed') {
        return res.status(400).json({ 
          message: 'El contrato debe estar firmado para recibir pagos' 
        });
      }

      // Verificar que el monto no exceda el saldo pendiente
      if (parseFloat(monto) > parseFloat(contract.saldo_pendiente)) {
        return res.status(400).json({ 
          message: 'El monto del pago excede el saldo pendiente del contrato' 
        });
      }

      const newPayment = await Payment.create({
        contract_id,
        tipo_pago,
        monto,
        fecha_pago: new Date(),
        referencia_pago,
        comprobante_url,
        wompi_transaction_id,
        wompi_reference,
        pagador_nombre,
        pagador_email,
        pagador_telefono,
        status: 'pending'
      });

      res.status(201).json({
        message: 'Pago registrado exitosamente',
        payment: newPayment
      });

    } catch (error) {
      console.error('Error creating payment:', error);
      res.status(500).json({ 
        message: 'Error al registrar el pago', 
        error: error.message 
      });
    }
  },

  // Verificar y aprobar pago
  verifyPayment: async (req, res) => {
  try {
    const { id } = req.params;
    const { status, observaciones } = req.body;

    const payment = await Payment.findByPk(id, {
      include: [{ 
        model: Contract, 
        as: 'Contract',
        include: [
          { 
            model: Quote, 
            as: 'Quote',
            attributes: ['quote_number', 'nombre_cliente'] 
          }
        ]
      }]
    });

    if (!payment) {
      return res.status(404).json({ 
        success: false,
        message: 'Pago no encontrado' 
      });
    }

    const oldStatus = payment.status;
    
    await payment.update({
      status,
      observaciones,
      verified_at: status === 'verified' ? new Date() : null,
      verified_by: req.user ? req.user.id : null
    });

    let contractUpdated = false;
    let contractChanges = {};

    // ✅ SI EL PAGO ES VERIFICADO, actualizar el contrato
    if (status === 'verified' && oldStatus !== 'verified') {
      const contract = payment.Contract;
      const montoFloat = parseFloat(payment.monto);
      const nuevoSaldo = parseFloat(contract.saldo_pendiente) - montoFloat;
      const totalPagado = parseFloat(contract.total_pagado || 0) + montoFloat;

      contractChanges = {
        saldo_pendiente: Math.max(0, nuevoSaldo),
        total_pagado: totalPagado
      };

      // ✅ CAMBIAR ESTADO SI SE COMPLETÓ EL PAGO
      if (nuevoSaldo <= 0) {
        contractChanges.status = 'paid';
      }

      await contract.update(contractChanges);
      contractUpdated = true;
      
      console.log('✅ Pago verificado, contrato actualizado:', {
        contract_number: contract.contract_number,
        changes: contractChanges
      });
    }

    // ✅ SI SE RECHAZA UN PAGO QUE ESTABA VERIFICADO, revertir cambios
    if (oldStatus === 'verified' && status === 'rejected') {
      const contract = payment.Contract;
      const montoFloat = parseFloat(payment.monto);
      const nuevoSaldo = parseFloat(contract.saldo_pendiente) + montoFloat;
      const totalPagado = Math.max(0, parseFloat(contract.total_pagado || 0) - montoFloat);

      contractChanges = {
        saldo_pendiente: nuevoSaldo,
        total_pagado: totalPagado,
        status: nuevoSaldo > 0 ? 'signed' : contract.status // Revertir estado si hay saldo pendiente
      };

      await contract.update(contractChanges);
      contractUpdated = true;
      
      console.log('🔄 Pago rechazado, saldos revertidos:', {
        contract_number: contract.contract_number,
        changes: contractChanges
      });
    }

    res.json({
      success: true,
      message: `Pago ${status === 'verified' ? 'verificado' : status === 'rejected' ? 'rechazado' : 'actualizado'} exitosamente`,
      payment: await Payment.findByPk(id, {
        include: [
          {
            model: Contract,
            as: 'Contract',
            attributes: ['contract_number', 'status', 'saldo_pendiente', 'total_pagado']
          }
        ]
      }),
      contract_updated: contractUpdated,
      contract_changes: contractChanges
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al verificar el pago', 
      error: error.message 
    });
  }
},

  // Obtener todos los pagos
  getAllPayments: async (req, res) => {
    try {
      const { status, contract_id, tipo_pago, page = 1, limit = 10 } = req.query;
      
      const offset = (page - 1) * limit;
      const where = {};

      if (status) where.status = status;
      if (contract_id) where.contract_id = contract_id;
      if (tipo_pago) where.tipo_pago = tipo_pago;

      const payments = await Payment.findAndCountAll({
        where,
        include: [
          { 
            model: Contract,
            include: [
              { 
                model: Quote,
                include: [
                  { model: User, as: 'Cliente', attributes: ['id', 'name', 'lastname', 'email'] }
                ]
              }
            ]
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        payments: payments.rows,
        total: payments.count,
        totalPages: Math.ceil(payments.count / limit),
        currentPage: parseInt(page)
      });

    } catch (error) {
      console.error('Error fetching payments:', error);
      res.status(500).json({ 
        message: 'Error al obtener los pagos', 
        error: error.message 
      });
    }
  },

  // Obtener pago por ID
  getPaymentById: async (req, res) => {
    try {
      const { id } = req.params;

      const payment = await Payment.findByPk(id, {
        include: [
          { 
            model: Contract,
            include: [
              { 
                model: Quote,
                include: [
                  { model: User, as: 'Cliente', attributes: ['id', 'name', 'lastname', 'email', 'phone'] }
                ]
              }
            ]
          }
        ]
      });

      if (!payment) {
        return res.status(404).json({ message: 'Pago no encontrado' });
      }

      res.json(payment);

    } catch (error) {
      console.error('Error fetching payment:', error);
      res.status(500).json({ 
        message: 'Error al obtener el pago', 
        error: error.message 
      });
    }
  },

  // Obtener pagos por contrato
  getPaymentsByContract: async (req, res) => {
  try {
    const { contract_id } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    console.log('🔍 Buscando pagos para contrato:', {
      contract_id,
      status,
      page,
      limit
    });

    const offset = (page - 1) * limit;
    const where = { contract_id };

    if (status) where.status = status;

    console.log('📊 Filtros de búsqueda:', where);

    const payments = await Payment.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    console.log('💳 Pagos encontrados:', {
      count: payments.count,
      rows: payments.rows.length,
      contractId: contract_id
    });

    // ✅ AGREGAR: Log detallado de cada pago
    payments.rows.forEach((payment, index) => {
      console.log(`  Pago ${index + 1}:`, {
        id: payment.id,
        monto: payment.monto,
        status: payment.status,
        fecha: payment.fecha_pago,
        tipo: payment.tipo_pago
      });
    });

    res.json({
      success: true,
      payments: payments.rows,
      total: payments.count,
      totalPages: Math.ceil(payments.count / limit),
      currentPage: parseInt(page)
    });

  } catch (error) {
    console.error('❌ Error fetching payments by contract:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener los pagos del contrato', 
      error: error.message 
    });
  }
},

  // Procesar pago con Wompi
  processWompiPayment: async (req, res) => {
    try {
      const {
        contract_id,
        monto,
        currency = 'COP',
        customer_email,
        customer_phone,
        customer_document,
        customer_name,
        reference
      } = req.body;

      // Verificar que el contrato existe
      const contract = await Contract.findByPk(contract_id, {
        include: [
          { 
            model: Quote,
            include: [
              { model: User, as: 'Cliente', attributes: ['id', 'name', 'lastname', 'email', 'phone'] }
            ]
          }
        ]
      });

      if (!contract) {
        return res.status(404).json({ message: 'Contrato no encontrado' });
      }

      // Generar referencia única si no se proporciona
      const paymentReference = reference || `${contract.contract_number}-${Date.now()}`;

      // Aquí integrarías con la API de Wompi
      // const wompiResponse = await createWompiTransaction({
      //   amount_in_cents: monto * 100,
      //   currency,
      //   customer_email,
      //   reference: paymentReference,
      //   // otros parámetros necesarios
      // });

      // Por ahora, simulamos la respuesta
      const wompiResponse = {
        id: `wompi_${Date.now()}`,
        reference: paymentReference,
        status: 'PENDING',
        payment_link: `https://checkout.wompi.co/p/${paymentReference}`
      };

      // Crear el registro de pago en estado pending
      const newPayment = await Payment.create({
        contract_id,
        tipo_pago: 'wompi',
        monto,
        fecha_pago: new Date(),
        referencia_pago: paymentReference,
        wompi_transaction_id: wompiResponse.id,
        wompi_reference: wompiResponse.reference,
        pagador_nombre: customer_name,
        pagador_email: customer_email,
        pagador_telefono: customer_phone,
        status: 'pending'
      });

      res.json({
        message: 'Pago iniciado con Wompi',
        payment: newPayment,
        wompi_payment_link: wompiResponse.payment_link,
        wompi_reference: wompiResponse.reference
      });

    } catch (error) {
      console.error('Error processing Wompi payment:', error);
      res.status(500).json({ 
        message: 'Error al procesar el pago con Wompi', 
        error: error.message 
      });
    }
  },

  // Webhook para notificaciones de Wompi
  wompiWebhook: async (req, res) => {
    try {
      const { data, event } = req.body;

      if (event === 'transaction.updated') {
        const { reference, status } = data.transaction;

        // Buscar el pago por referencia
        const payment = await Payment.findOne({
          where: { wompi_reference: reference },
          include: [{ model: Contract }]
        });

        if (payment) {
          let paymentStatus = 'pending';
          
          switch (status) {
            case 'APPROVED':
              paymentStatus = 'verified';
              break;
            case 'DECLINED':
            case 'ERROR':
              paymentStatus = 'rejected';
              break;
            default:
              paymentStatus = 'pending';
          }

          await payment.update({ status: paymentStatus });

          // Si el pago fue aprobado, actualizar el contrato
          if (paymentStatus === 'verified') {
            const contract = payment.Contract;
            const nuevoSaldo = parseFloat(contract.saldo_pendiente) - parseFloat(payment.monto);
            const totalPagado = parseFloat(contract.total_pagado) + parseFloat(payment.monto);

            await contract.update({
              saldo_pendiente: nuevoSaldo,
              total_pagado: totalPagado
            });
          }
        }
      }

      res.status(200).json({ message: 'Webhook processed successfully' });

    } catch (error) {
      console.error('Error processing Wompi webhook:', error);
      res.status(500).json({ 
        message: 'Error processing webhook', 
        error: error.message 
      });
    }
  },

  // Generar reporte de pagos
  getPaymentsReport: async (req, res) => {
    try {
      const { start_date, end_date, status, tipo_pago } = req.query;

      const where = {};

      if (start_date && end_date) {
        where.fecha_pago = {
          [require('sequelize').Op.between]: [new Date(start_date), new Date(end_date)]
        };
      }

      if (status) where.status = status;
      if (tipo_pago) where.tipo_pago = tipo_pago;

      const payments = await Payment.findAll({
        where,
        include: [
          { 
            model: Contract,
            include: [
              { 
                model: Quote,
                include: [
                  { model: User, as: 'Cliente', attributes: ['id', 'name', 'lastname', 'email'] },
                  { model: User, as: 'Asesor', attributes: ['id', 'name', 'lastname', 'email'] }
                ]
              }
            ]
          }
        ],
        order: [['fecha_pago', 'DESC']]
      });

      // Calcular estadísticas
      const totalPagos = payments.length;
      const montoTotal = payments.reduce((sum, payment) => 
        sum + parseFloat(payment.monto), 0
      );
      const pagosPorTipo = payments.reduce((acc, payment) => {
        acc[payment.tipo_pago] = (acc[payment.tipo_pago] || 0) + 1;
        return acc;
      }, {});

      res.json({
        payments,
        estadisticas: {
          total_pagos: totalPagos,
          monto_total: montoTotal,
          pagos_por_tipo: pagosPorTipo
        }
      });

    } catch (error) {
      console.error('Error generating payments report:', error);
      res.status(500).json({ 
        message: 'Error al generar el reporte de pagos', 
        error: error.message 
      });
    }
  },

  registerClientPayment: async (req, res) => {
    try {
      const {
        contract_id,
        tipo_pago,
        monto,
        fecha_pago,
        referencia_pago,
        banco_origen,
        observaciones,
        pagador_nombre,
        pagador_email,
        pagador_telefono
      } = req.body;

      const registradoPor = req.user.id;

      console.log('💰 Registrando pago de cliente:', {
        contract_id,
        tipo_pago,
        monto,
        registrado_por: registradoPor,
        hasComprobante: !!req.file
      });

      // ✅ VERIFICAR que el contrato existe
      const contract = await Contract.findByPk(contract_id, {
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
      });

      if (!contract) {
        return res.status(404).json({ 
          success: false,
          message: 'Contrato no encontrado' 
        });
      }

      // ✅ VERIFICAR monto válido
      const montoFloat = parseFloat(monto);
      const saldoPendiente = parseFloat(contract.saldo_pendiente || contract.precio_total);

      if (montoFloat > saldoPendiente + 1) { // +1 tolerancia
        return res.status(400).json({ 
          success: false,
          message: `El monto ($${montoFloat.toLocaleString('es-CO')}) excede el saldo pendiente ($${saldoPendiente.toLocaleString('es-CO')})` 
        });
      }

      if (montoFloat <= 0) {
        return res.status(400).json({ 
          success: false,
          message: 'El monto debe ser mayor a cero' 
        });
      }

      // ✅ URL del comprobante desde Cloudinary
      const comprobanteUrl = req.file ? req.file.path : null;

      // ✅ INFORMACIÓN del cliente
      const clienteInfo = contract.Quote?.Cliente;
      const finalPagadorNombre = pagador_nombre || 
        `${clienteInfo?.name || ''} ${clienteInfo?.lastname || ''}`.trim() ||
        'Cliente';
      const finalPagadorEmail = pagador_email || clienteInfo?.email;
      const finalPagadorTelefono = pagador_telefono || clienteInfo?.phone;

      // ✅ CREAR el registro de pago
      const newPayment = await Payment.create({
        contract_id,
        tipo_pago,
        monto: montoFloat,
        fecha_pago: fecha_pago || new Date(),
        referencia_pago: referencia_pago || `PAY-${Date.now()}`,
        comprobante_url: comprobanteUrl,
        pagador_nombre: finalPagadorNombre,
        pagador_email: finalPagadorEmail,
        pagador_telefono: finalPagadorTelefono,
        banco_origen,
        observaciones: observaciones || `Pago registrado por ${req.user.name} ${req.user.lastname}`,
        status: 'verified' // ✅ Ya verificado por admin
      });

      // ✅ ACTUALIZAR SALDOS DEL CONTRATO
      const nuevoSaldoPendiente = Math.max(0, saldoPendiente - montoFloat);
      const totalPagado = parseFloat(contract.total_pagado || 0) + montoFloat;

      let contractUpdates = {
        saldo_pendiente: nuevoSaldoPendiente,
        total_pagado: totalPagado
      };

      // ✅ CAMBIAR ESTADO SI SE COMPLETÓ EL PAGO
      if (nuevoSaldoPendiente <= 0) {
        contractUpdates.status = 'paid';
      }

      // ✅ APLICAR ACTUALIZACIONES AL CONTRATO
      await contract.update(contractUpdates);

      console.log('✅ Contrato actualizado:', {
        contract_number: contract.contract_number,
        nuevo_saldo: nuevoSaldoPendiente,
        total_pagado: totalPagado
      });

      // ✅ OBTENER PAGO CON DETALLES
      const paymentWithDetails = await Payment.findByPk(newPayment.id, {
        include: [
          {
            model: Contract,
            as: 'Contract',
            attributes: ['id', 'contract_number', 'status', 'saldo_pendiente', 'total_pagado'],
            include: [
              {
                model: Quote,
                as: 'Quote',
                attributes: ['quote_number', 'nombre_cliente', 'destino']
              }
            ]
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Pago registrado y aplicado exitosamente',
        payment: paymentWithDetails,
        contract_updates: contractUpdates,
        summary: {
          monto_pagado: montoFloat,
          nuevo_saldo_pendiente: nuevoSaldoPendiente,
          total_pagado_contrato: totalPagado,
          contrato_completamente_pagado: nuevoSaldoPendiente <= 0,
          comprobante_guardado: !!comprobanteUrl,
          registrado_por: `${req.user.name} ${req.user.lastname}`
        }
      });

    } catch (error) {
      console.error('❌ Error registering client payment:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error al registrar el pago del cliente', 
        error: error.message 
      });
    }
  }
};



module.exports = paymentController;
