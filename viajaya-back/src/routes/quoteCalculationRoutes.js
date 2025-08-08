// ✅ NUEVO: Obtener cálculo por quote_id (UUID)

const quoteCalculationController = require('../controllers/quoteCalculationController');
const express = require('express');
const router = express.Router();

// ✅ NUEVO: Obtener datos base para calculadora desde un Quote
router.get('/base-data/:quoteId', quoteCalculationController.getCalculationBaseData);
router.get('/by-quote/:quoteId', quoteCalculationController.getCalculationByQuoteId);
// ✅ NUEVO: Obtener comisiones específicas por trip_type
router.get('/commissions/:quoteId/:tripType', quoteCalculationController.getCommissionsByTripType);
// Crear cálculo temporal
router.post('/', quoteCalculationController.createCalculation);
// ✅ NUEVO: Crear o actualizar cálculo (upsert)
router.post('/upsert', quoteCalculationController.upsertCalculation);
router.get('/:id', quoteCalculationController.getCalculationById);
router.put('/:id/confirm', quoteCalculationController.confirmCalculation);

module.exports = router;