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
        include: [{ model: Contract }]
      });

      if (!payment) {
        return res.status(404).json({ message: 'Pago no encontrado' });
      }

      await payment.update({
        status,
        observaciones
      });

      // Si el pago es verificado, actualizar el saldo del contrato
      if (status === 'verified') {
        const contract = payment.Contract;
        const nuevoSaldo = parseFloat(contract.saldo_pendiente) - parseFloat(payment.monto);
        const totalPagado = parseFloat(contract.total_pagado) + parseFloat(payment.monto);

        await contract.update({
          saldo_pendiente: nuevoSaldo,
          total_pagado: totalPagado
        });

        // Generar recibo PDF aquí
        // payment.recibo_pdf_url = await generateReciboPDF(payment);
        // await payment.save();
      }

      res.json({
        message: 'Pago verificado exitosamente',
        payment
      });

    } catch (error) {
      console.error('Error verifying payment:', error);
      res.status(500).json({ 
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

      const offset = (page - 1) * limit;
      const where = { contract_id };

      if (status) where.status = status;

      const payments = await Payment.findAndCountAll({
        where,
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
      console.error('Error fetching payments by contract:', error);
      res.status(500).json({ 
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
  }
};

module.exports = paymentController;
