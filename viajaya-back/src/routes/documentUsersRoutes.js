const express = require('express');
const router = express.Router();
const { upload } = require('../config/multerConfig'); // Importar configuración de Multer
const documentUsersController = require('../controllers/documentUsersController');

// ✅ Subir archivo directamente con Multer + Cloudinary
router.post('/upload-file', 
  upload.single('document'),                          // Multer procesa archivo
  documentUsersController.uploadDocumentFile          // Controller
);

// ✅ Obtener documentos de un usuario específico
router.get('/user/:userId', documentUsersController.getUserDocuments);

// ✅ Verificar estado de documentación de un usuario
router.get('/status/:userId', documentUsersController.checkDocumentationStatus);

// ✅ Eliminar documento
router.delete('/:documentId', documentUsersController.deleteDocument);

// ✅ Rutas para revisión de documentos (Solo Owner - rol 7)
router.get('/pending', documentUsersController.getPendingDocuments);
router.get('/all', documentUsersController.getAllDocuments); // Nueva ruta para todos los documentos
router.patch('/:documentId/approve', documentUsersController.approveDocument);
router.patch('/:documentId/reject', documentUsersController.rejectDocument);
router.get('/stats', documentUsersController.getDocumentStats);

module.exports = router;