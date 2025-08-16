const express = require('express');
const router = express.Router();
const financialController = require('../controllers/financialController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

console.log('🔍 Cargando financialController...');

// ✅ VERIFICAR QUE EL CONTROLLER EXISTE
if (!financialController) {
  console.log('❌ financialController no encontrado');
} else {
  console.log('✅ financialController cargado exitosamente');
  console.log('📋 Métodos disponibles:', Object.keys(financialController));
}

// 🔐 MIDDLEWARE: Solo usuarios con roles administrativos pueden acceder
const adminRoles = [4, 5, 6, 7]; // gerente, admin, contador, owner

// 📊 RESUMEN FINANCIERO GENERAL
router.get('/summary', 
  authenticateToken, 
  authorizeRoles(4, 5, 6, 7), // gerente, admin, contador, owner
  financialController.getFinancialSummary
);

// 💰 LISTADO DE PAGOS CON FILTROS Y PAGINACIÓN
router.get('/payments', 
  authenticateToken, 
  authorizeRoles(4, 5, 6, 7), // gerente, admin, contador, owner
  financialController.getPaymentsList
);

// 🛒 LISTADO DE COMPRAS CON FILTROS Y PAGINACIÓN
router.get('/purchases', 
  authenticateToken, 
  authorizeRoles(4, 5, 6, 7), // gerente, admin, contador, owner
  financialController.getPurchasesList
);

// 📈 ANÁLISIS DE GANANCIAS POR CONTRATO
router.get('/profit-by-contract', 
  authenticateToken, 
  authorizeRoles(4, 5, 6, 7), // gerente, admin, contador, owner
  financialController.getProfitByContract
);

console.log('✅ financialRoutes cargado exitosamente');

module.exports = router;
