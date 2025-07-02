const express = require('express');
const router = express.Router();
const quoteController = require('../controllers/quoteController');
const {
    authenticateToken,
    authorizeRoles,
    authorizeHierarchy
} = require('../middlewares/authMiddleware');

// ✅ RUTAS PÚBLICAS (sin autenticación)
// Crear nueva cotización (Visitantes y usuarios autenticados)
router.post('/', quoteController.createQuote);

// Aprobar cotización (Cliente puede aprobar sin estar autenticado usando token en URL)
router.patch('/:id/approve', quoteController.approveQuote);

// Rechazar cotización (Cliente puede rechazar sin estar autenticado usando token en URL)
router.patch('/:id/reject', quoteController.rejectQuote);

// Solicitar recotización (Cliente puede solicitar modificaciones)
router.patch('/:id/requote', quoteController.requestRequote);

// ✅ RUTAS CON AUTENTICACIÓN BÁSICA
// Obtener cotización por ID (Vendedores pueden ver sus propias cotizaciones, Admin y superiores todas)
router.get('/:id', authenticateToken, quoteController.getQuoteById);

// ✅ RUTAS PARA ROLES ALTOS (Owner, Admin)
// Obtener todas las cotizaciones (Solo Owner y Admin)
router.get('/', authenticateToken, authorizeRoles(5, 6, 7), quoteController.getAllQuotes);

// Actualizar cotización - completar por Owner/Admin (Solo Owner y Admin)
router.put('/:id', authenticateToken, authorizeRoles(5, 6, 7), quoteController.updateQuote);

// Enviar cotización al cliente (Solo Owner y Admin)
router.put('/:id/send', authenticateToken, authorizeRoles(5, 6, 7), quoteController.sendQuote);

// Marcar cotizaciones expiradas (Proceso automatizado - Solo Admin)
router.post('/mark-expired', authenticateToken, authorizeRoles(7), quoteController.markExpiredQuotes);

// ✅ RUTAS CON JERARQUÍA
// Obtener cotizaciones por vendedor (Con verificación de jerarquía)
router.get('/vendedor/:tipo/:vendedor_id', authenticateToken, authorizeHierarchy, quoteController.getQuotesByVendedor);

module.exports = router;