const express = require('express');
const router = express.Router();
const commissionController = require('../controllers/commissionController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { uploadPaymentProof } = require('../config/multerConfig'); // ✅ Configuración para comprobantes de pago


// ✅ RUTAS PARA COMISIONES

// Obtener comisiones con filtros (todos los roles 2+)
router.get('/', 
  authenticateToken, 
  authorizeRoles(2, 3, 4, 5, 6, 7), 
  commissionController.getCommissions
);

// Obtener estadísticas de comisiones
router.get('/stats', 
  authenticateToken,
  authorizeRoles(2, 3, 4, 5, 6, 7), 
  commissionController.getCommissionStats
);

// Obtener comisiones específicas de un contrato
router.get('/contract/:contractId', 
  authenticateToken,
  authorizeRoles(2, 3, 4, 5, 6, 7), 
  commissionController.getCommissionsByContract
);

router.get('/document/:documentId', 
  authenticateToken,
  authorizeRoles(2, 3, 4, 5, 6, 7), // Todos los roles autenticados
  commissionController.downloadDocument
);

// Vista previa del documento de comisión
router.get('/document/:documentId/preview', 
  authenticateToken,
  authorizeRoles(2, 3, 4, 5, 6, 7), 
  commissionController.previewDocument
);

router.post('/request-payment', 
  authenticateToken,
  authorizeRoles(2, 3, 4), // Solo asesores, líderes, gerentes pueden solicitar pago
  commissionController.requestPayment
);

// Aprobar comisión manualmente (solo roles 4+)
router.put('/:commissionId/approve', 
  authenticateToken,
  authorizeRoles(4, 5, 6, 7), 
  commissionController.approveCommission
);

// Marcar comisión como pagada con comprobante (solo roles 4+)
router.put('/:commissionId/pay', 
  authenticateToken,
  authorizeRoles(4, 5, 6, 7), // ✅ Incluir gerentes (rol 4) para pruebas
  uploadPaymentProof.single('comprobante'), // ✅ Middleware para archivo
  commissionController.payCommission
);

// ✅ NUEVAS RUTAS PARA LÍMITES MENSUALES DE PAGO

// Obtener resumen de límite mensual específico de un vendedor (versión compacta)
router.get('/vendor-limit-summary/:vendedorId', 
  authenticateToken,
  authorizeRoles(2, 3, 4, 5, 6, 7), // Todos los roles pueden ver
  commissionController.getVendorMonthlyLimitSummary
);

// Obtener límite mensual específico de un vendedor
router.get('/monthly-limit/:vendedorId', 
  authenticateToken,
  authorizeRoles(4, 5, 6, 7), // Solo roles superiores pueden ver límites
  commissionController.getMonthlyPaymentLimit
);

// Obtener límites mensuales de todos los vendedores
router.get('/monthly-limits/all', 
  authenticateToken,
  authorizeRoles(4, 5, 6, 7), // Solo roles superiores pueden ver límites
  commissionController.getAllVendorsMonthlyLimits
);

module.exports = router;
