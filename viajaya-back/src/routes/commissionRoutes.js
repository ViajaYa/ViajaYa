const express = require('express');
const router = express.Router();
const commissionController = require('../controllers/commissionController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');


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
  authorizeRoles(3, 4, 5, 6, 7), 
  commissionController.getCommissionStats
);

// Aprobar comisión manualmente (solo roles 4+)
router.put('/:commissionId/approve', 
  authenticateToken,
  authorizeRoles(4, 5, 6, 7), 
  commissionController.approveCommission
);

// Marcar comisión como pagada (solo roles 5+)
router.put('/:commissionId/pay', 
  authenticateToken,
  authorizeRoles(5, 6, 7), 
  commissionController.payCommission
);

module.exports = router;
