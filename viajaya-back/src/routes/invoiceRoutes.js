const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');

// ================== FACTURAS PENDIENTES ==================

// Obtener contratos pendientes de facturar
router.get('/pending', invoiceController.getPendingInvoices);

// ================== GENERACIÓN DE FACTURAS ==================

// Generar factura para un contrato específico
router.post('/generate/:contractId', invoiceController.generateInvoice);

// ================== GESTIÓN DE FACTURAS ==================

// Obtener todas las facturas con filtros
router.get('/', invoiceController.getAllInvoices);

// Obtener factura específica por ID
router.get('/:id', invoiceController.getInvoiceById);

// Actualizar estado de una factura
router.patch('/:id/status', invoiceController.updateInvoiceStatus);

// ================== REPORTES Y ESTADÍSTICAS ==================

// Estadísticas de facturación (para implementar después)
router.get('/reports/stats', (req, res) => {
  res.json({ 
    message: 'Endpoint de estadísticas - por implementar',
    available: false 
  });
});

// Reporte de facturación por período (para implementar después)
router.get('/reports/period', (req, res) => {
  res.json({ 
    message: 'Endpoint de reportes por período - por implementar',
    available: false 
  });
});

module.exports = router;
