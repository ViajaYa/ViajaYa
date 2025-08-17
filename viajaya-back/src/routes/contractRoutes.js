const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
const purchaseController = require('../controllers/purchaseController');
const { uploadComprobante } = require('../config/multerConfig');

// ================== CONTRATOS ==================

// Crear nuevo contrato
router.post('/', contractController.createContract);

// Obtener todos los contratos
router.get('/', contractController.getAllContracts);

// Obtener contrato por ID
router.get('/:id', contractController.getContractById);

// Actualizar contrato
router.put('/:id', contractController.updateContract);
router.get('/pdf/:id', contractController.servePDF);
router.get('/:id/email-preview', contractController.previewContractEmail);
// Enviar contrato para firma (actualiza estado)
router.patch('/:id/send', contractController.sendContract);

// Generar/regenerar PDF del contrato
router.post('/:id/generate-pdf', contractController.generateContractPDF);

// Descargar PDF del contrato  
router.get('/:id/download-pdf', contractController.downloadContractPDF);

// Vista previa del PDF (sin guardar)
router.get('/:id/preview-pdf', contractController.generateContractPDF);
router.get('/:id/email-preview', contractController.previewContractEmail);
// Firmar contrato
router.post('/:id/sign', contractController.signContract);

// ✅ NUEVA RUTA: Aprobar contrato y generar comisiones
router.patch('/:id/approve', contractController.approveContract);

// Completar contrato (después del viaje)
router.patch('/:id/complete', contractController.completeContract);

// Obtener contratos por cliente
router.get('/cliente/:cliente_id', contractController.getContractsByCliente);

// ✅ NUEVA RUTA: Obtener detalles de pagos del contrato
router.get('/:contract_id/payment-details', contractController.getContractPaymentDetails);

// ================== ITEMS DEL CONTRATO ==================
router.post('/:contractId/convert-quote-items', contractController.convertQuoteToContractItems);

router.get('/:contractId/purchase-stats', purchaseController.getContractPurchaseStats);
router.get('/:contractId/items-with-purchases', purchaseController.getContractItemsWithPurchases);
// Crear item para un contrato
router.post('/:contractId/items', contractController.createContractItem);

// Listar items de un contrato
router.get('/:contractId/items', contractController.getContractItems);

// Actualizar un item
router.put('/items/:itemId', contractController.updateContractItem);
router.patch('/items/:itemId/deadline', purchaseController.updateItemDeadline);
// Eliminar un item
router.delete('/items/:itemId', contractController.deleteContractItem);

router.post('/items/:itemId/purchases', purchaseController.createPurchase);

// ✅ NUEVA RUTA: Subir comprobante de compra
router.post('/items/:itemId/upload-receipt', uploadComprobante.single('comprobante'), purchaseController.uploadPurchaseReceipt);

// 🔧 NUEVA RUTA: Proxy para servir PDFs con headers correctos
router.get('/serve-pdf/:public_id(*)', purchaseController.servePDFFile);

// Listar compras de un item
router.get('/items/:itemId/purchases', purchaseController.getPurchasesByItem);

// Actualizar compra
router.put('/purchases/:purchaseId', purchaseController.updatePurchase);
router.patch('/purchases/:purchaseId/mark-paid', purchaseController.markPaymentCompleted);
// Eliminar compra
router.delete('/purchases/:purchaseId', purchaseController.deletePurchase);




module.exports = router;