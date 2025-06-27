const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');

// Crear nuevo contrato
router.post('/', contractController.createContract);

// Obtener todos los contratos
router.get('/', contractController.getAllContracts);

// Obtener contrato por ID
router.get('/:id', contractController.getContractById);

// Actualizar contrato
router.put('/:id', contractController.updateContract);

// Enviar contrato para firma
router.patch('/:id/send', contractController.sendContract);

// Firmar contrato
router.patch('/:id/sign', contractController.signContract);

// Completar contrato (después del viaje)
router.patch('/:id/complete', contractController.completeContract);

// Obtener contratos por cliente
router.get('/cliente/:cliente_id', contractController.getContractsByCliente);

module.exports = router;
