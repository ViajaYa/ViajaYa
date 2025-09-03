const express = require('express');
const router = express.Router();

try {
  // ✅ IMPORTS CON VERIFICACIÓN
  console.log('🔍 Cargando paymentController...');
  const paymentController = require('../controllers/paymentController');
  
  if (!paymentController) {
    throw new Error('paymentController no encontrado');
  }
  
  console.log('📋 Métodos disponibles:', Object.keys(paymentController));
  
  // ✅ VERIFICAR MÉTODO ESPECÍFICO
  if (!paymentController.registerClientPayment) {
    console.log('❌ registerClientPayment no existe');
  } else {
    console.log('✅ registerClientPayment encontrado');
  }

  // ✅ IMPORTS DE MIDDLEWARE
  console.log('🔍 Cargando middlewares...');
  const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
  
  if (!authenticateToken) {
    throw new Error('authenticateToken no encontrado');
  }
  
  if (!authorizeRoles) {
    throw new Error('authorizeRoles no encontrado');
  }

  // ✅ IMPORTS DE MULTER
  console.log('🔍 Cargando multer config...');
  const { uploadComprobante } = require('../config/multerConfig');
  
  if (!uploadComprobante) {
    throw new Error('uploadComprobante no encontrado');
  }

  // ✅ RUTAS BÁSICAS PRIMERO
  console.log('🔍 Definiendo rutas...');

  // Ruta de test
  router.get('/test', (req, res) => {
    res.json({ 
      success: true, 
      message: 'Payment routes funcionando correctamente',
      available_methods: Object.keys(paymentController)
    });
  });

  // ✅ RUTAS EXISTENTES QUE FUNCIONAN
  if (paymentController.getAllPayments) {
    router.get('/', authenticateToken, authorizeRoles(4, 5, 6, 7), paymentController.getAllPayments);
  }

  if (paymentController.getPaymentById) {
    router.get('/:id', authenticateToken, authorizeRoles(4, 5, 6, 7), paymentController.getPaymentById);
  }

  if (paymentController.verifyPayment) {
    router.patch('/:id/verify', authenticateToken, authorizeRoles(4, 5, 6, 7), paymentController.verifyPayment);
  }

  // ✅ NUEVA RUTA - SOLO SI EL MÉTODO EXISTE
  if (paymentController.registerClientPayment) {
    console.log('✅ Agregando ruta registerClientPayment...');
    router.post('/register-client-payment', 
      authenticateToken,
      authorizeRoles(4, 5, 6, 7),
      uploadComprobante.single('comprobante'),
      paymentController.registerClientPayment
    );
  } else {
    console.log('❌ No se puede agregar ruta registerClientPayment - método no existe');
  }

  // ✅ OTRAS RUTAS EXISTENTES
  if (paymentController.getPaymentsByContract) {
    router.get('/contract/:contract_id', authenticateToken, authorizeRoles(2, 3, 4, 5, 6, 7), paymentController.getPaymentsByContract);
  }

  if (paymentController.processWompiPayment) {
    router.post('/wompi', paymentController.processWompiPayment);
  }

  if (paymentController.wompiWebhook) {
    router.post('/wompi/webhook', paymentController.wompiWebhook);
  }

  if (paymentController.getPaymentsReport) {
    router.get('/reports/summary', authenticateToken, authorizeRoles(4, 5, 6, 7), paymentController.getPaymentsReport);
  }

  // ✅ NUEVAS RUTAS PARA RECIBOS PDF
  if (paymentController.generateReceiptPDF) {
    console.log('✅ Agregando ruta generateReceiptPDF...');
    router.get('/:id/receipt/download', 
      authenticateToken,
      authorizeRoles(1, 2, 3, 4, 5, 6, 7), // Todos los roles pueden descargar recibos
      paymentController.generateReceiptPDF
    );
  } else {
    console.log('❌ No se puede agregar ruta generateReceiptPDF - método no existe');
  }

  if (paymentController.previewReceiptPDF) {
    console.log('✅ Agregando ruta previewReceiptPDF...');
    router.get('/:id/receipt/preview', 
      authenticateToken,
      authorizeRoles(1, 2, 3, 4, 5, 6, 7), // Todos los roles pueden ver vista previa
      paymentController.previewReceiptPDF
    );
  } else {
    console.log('❌ No se puede agregar ruta previewReceiptPDF - método no existe');
  }

  console.log('✅ paymentRoutes cargado exitosamente');

} catch (error) {
  console.error('❌ Error cargando paymentRoutes:', error);
  
  // ✅ RUTA DE EMERGENCIA
  router.get('/error', (req, res) => {
    res.status(500).json({ 
      error: 'Error en paymentRoutes', 
      details: error.message 
    });
  });
}

module.exports = router;