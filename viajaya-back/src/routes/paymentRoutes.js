const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Crear nuevo pago
router.post('/', paymentController.createPayment);

// Obtener todos los pagos
router.get('/', paymentController.getAllPayments);

// Obtener pago por ID
router.get('/:id', paymentController.getPaymentById);

// Verificar y aprobar pago
router.patch('/:id/verify', paymentController.verifyPayment);

// Obtener pagos por contrato
router.get('/contract/:contract_id', paymentController.getPaymentsByContract);

// Procesar pago con Wompi
router.post('/wompi', paymentController.processWompiPayment);

// Webhook para notificaciones de Wompi
router.post('/wompi/webhook', paymentController.wompiWebhook);

// Generar reporte de pagos
router.get('/reports/summary', paymentController.getPaymentsReport);

module.exports = router;
