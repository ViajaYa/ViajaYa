const express = require('express');
const router = express.Router();
const quoteController = require('../controllers/quoteController');
const {
    authenticateToken,
    authorizeRoles,
    authorizeHierarchy
} = require('../middlewares/authMiddleware');




// ✅ RUTAS PÚBLICAS (sin autenticación)
// Crear cotización externa desde web pública
router.post('/external', quoteController.createExternalQuote);

// Crear nueva cotización (Visitantes y usuarios autenticados)
router.post('/', quoteController.createQuote);

// Aprobar cotización (Cliente puede aprobar sin estar autenticado usando token en URL)
router.patch('/:id/approve', quoteController.approveQuote);

// Rechazar cotización (Cliente puede rechazar sin estar autenticado usando token en URL)
router.patch('/:id/reject', quoteController.rejectQuote);

// Solicitar recotización (Cliente puede solicitar modificaciones)
router.patch('/:id/requote', quoteController.requestRequote);

// ✅ RUTAS CON AUTENTICACIÓN BÁSICA
// Crear cotización desde usuario autenticado (con auto-asignación)
router.post('/user/:userId', authenticateToken, quoteController.createQuoteFromUser);

// Obtener cotizaciones del usuario autenticado (según su rol y jerarquía)
router.get('/user/:userId', authenticateToken, quoteController.getQuotesByUser);

// Obtener cotización por ID (Vendedores pueden ver sus propias cotizaciones, Admin y superiores todas)
router.get('/:id', authenticateToken, quoteController.getQuoteById);

// ✅ RUTAS PARA VENDEDORES (Asesor, Líder, Gerente)
// Actualizar cotización - Vendedores pueden actualizar sus propias cotizaciones
router.put('/:id', authenticateToken, authorizeRoles(2, 3, 4, 5, 6, 7), quoteController.updateQuote);

// Enviar cotización al cliente (Líder en adelante)
router.post('/:id/send', authenticateToken, authorizeRoles(3, 4, 5, 6, 7), quoteController.sendQuote);
router.get('/:id/preview-pdf', authenticateToken, quoteController.previewQuotePDF);

router.get('/:id/download-pdf', authenticateToken, quoteController.downloadQuotePDF);
router.post('/:id/regenerate-pdf', authenticateToken, quoteController.regenerateQuotePDF);
// ✅ RUTAS PARA ROLES MEDIOS Y ALTOS (Líder, Gerente, Admin, Owner)
// Obtener todas las cotizaciones (Con filtros según rol)
router.get('/', authenticateToken, authorizeRoles(3, 4, 5, 6, 7), quoteController.getAllQuotes);

// ✅ RUTAS PARA ROLES ALTOS (Admin, Contador, Owner)
// Obtener cotizaciones externas pendientes de asignación
router.get('/external/list', authenticateToken, authorizeRoles(5, 6, 7), quoteController.getExternalQuotes);

// Reasignar cotización externa
router.patch('/:id/reassign', authenticateToken, authorizeRoles(5, 6, 7), quoteController.reassignExternalQuote);

// Marcar cotizaciones expiradas (Proceso automatizado - Solo Owner)
router.post('/mark-expired', authenticateToken, authorizeRoles(7), quoteController.markExpiredQuotes);

// ✅ RUTAS CON JERARQUÍA
// Obtener cotizaciones por vendedor (Con verificación de jerarquía)
router.get('/vendedor/:vendedor_id/:tipo', authenticateToken, authorizeHierarchy, quoteController.getQuotesByVendedor);



module.exports = router;