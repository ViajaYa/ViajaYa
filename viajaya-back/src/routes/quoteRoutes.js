const express = require('express');
const router = express.Router();
const quoteController = require('../controllers/quoteController');
const {
    authenticateToken,
    authorizeRoles,
    canCreateQuotes,
    authorizeHierarchy
} = require('../middlewares/authMiddleware');

// Crear nueva cotización (Solo vendedores: Asesor, Líder, Gerente y superiores)
router.post('/', authenticateToken, canCreateQuotes, quoteController.createQuote);

// Obtener todas las cotizaciones (Solo Admin y superiores)
router.get('/', authenticateToken, authorizeRoles(5, 6, 7), quoteController.getAllQuotes);

// Obtener cotización por ID (Vendedores pueden ver sus propias cotizaciones, Admin y superiores todas)
router.get('/:id', authenticateToken, quoteController.getQuoteById);

// Actualizar cotización - completar por Admin (Solo Admin y superiores)
router.put('/:id', authenticateToken, authorizeRoles(5, 6, 7), quoteController.updateQuote);

// Aprobar cotización (Cliente o Admin/Owner)
router.patch('/:id/approve', authenticateToken, quoteController.approveQuote);

// Rechazar cotización (Cliente o Admin/Owner)  
router.patch('/:id/reject', authenticateToken, quoteController.rejectQuote);

// Obtener cotizaciones por vendedor (Con verificación de jerarquía)
router.get('/vendedor/:tipo/:vendedor_id', authenticateToken, authorizeHierarchy, quoteController.getQuotesByVendedor);

module.exports = router;
