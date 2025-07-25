const express = require('express');
const router = express.Router();
const commissionConfigController = require('../controllers/commissionConfigController');
const { authenticateToken,  authorizeRoles } = require('../middlewares/authMiddleware');

// ✅ CREAR nueva configuración de comisiones
router.post('/configs', 
  authenticateToken, 
  authorizeRoles(5, 7), // Solo Admin y Owner
  commissionConfigController.createCommissionConfig
);

// ✅ OBTENER todas las configuraciones activas
router.get('/configs', 
  authenticateToken, 
  commissionConfigController.getActiveConfigs
);

// ✅ OBTENER configuración específica para un rol y tipo de viaje
router.get('/configs/:role/:trip_type', 
  authenticateToken, 
  commissionConfigController.getConfigForRoleAndType
);

// ✅ ACTUALIZAR configuración (crear nueva versión)
router.put('/configs/:configId', 
  authenticateToken, 
  authorizeRoles(5, 7), // Solo Admin y Owner
  commissionConfigController.updateConfig
);

// ✅ DESACTIVAR configuración
router.delete('/configs/:configId', 
  authenticateToken, 
  authorizeRoles(5, 7), // Solo Admin y Owner
  commissionConfigController.deactivateConfig
);

// ✅ OBTENER historial de configuraciones
router.get('/configs/history', 
  authenticateToken, 
  authorizeRoles(5, 7), // Solo Admin y Owner
  commissionConfigController.getConfigHistory
);

module.exports = router;
