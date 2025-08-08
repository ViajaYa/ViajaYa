const express = require('express');
const router = express.Router();
const quoteController = require('../controllers/quoteController');

// ✅ Rutas públicas (para clientes que completarán datos)
router.get('/form-link/:quoteId', quoteController.getPassengerFormLink);
router.get('/quote/:quoteId', quoteController.getPassengersByQuote);
router.post('/quote/:quoteId/bulk', quoteController.createOrUpdatePassengers);

// ✅ Rutas para gestión individual (con autenticación si es necesario)
router.post('/quote/:quoteId', quoteController.createPassenger);
router.put('/:passengerId', quoteController.updatePassenger);
router.delete('/:passengerId', quoteController.deletePassenger);

module.exports = router;