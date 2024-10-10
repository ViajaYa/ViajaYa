const express = require('express');
const router = express.Router();
const {getCapacitaciones, createCapacitacion, deleteCapacitacion}= require('../controllers/asesoresCapacitaciones');
const asesoresCapacitaciones = require('../controllers/asesoresCapacitaciones');

// Rutas para los videos de Instagram
router.post('/capacitacion', createCapacitacion);
router.get('/capacitacion', getCapacitaciones);
router.delete('/capacitacion/:id', deleteCapacitacion);

module.exports = router;