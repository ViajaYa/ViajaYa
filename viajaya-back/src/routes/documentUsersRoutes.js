const express = require('express');
const router = express.Router();
const upload = require('../config/multerConfig'); // Importar configuración de Multer
const documentUsersController = require('../controllers/documentUsersController');

// ✅ Subir archivo directamente con Multer + Cloudinary
router.post('/upload-file', 
  upload.single('document'), // 'document' es el nombre del campo en el formulario
  documentUsersController.uploadDocumentFile
);

// ✅ Obtener documentos de un usuario específico
router.get('/user/:userId', documentUsersController.getUserDocuments);

// ✅ Verificar estado de documentación de un usuario
router.get('/status/:userId', documentUsersController.checkDocumentationStatus); // Corregido el nombre

// ✅ Obtener documentos pendientes de revisión (para admins)
router.get('/pending', documentUsersController.getPendingDocuments);

// ✅ Revisar/aprobar/rechazar documento (para admins)
router.put('/:documentId/review', documentUsersController.reviewDocument);

// ✅ Eliminar documento
router.delete('/:documentId', documentUsersController.deleteDocument);

// ✅ Obtener estadísticas de documentos (para dashboard admin)
router.get('/stats', documentUsersController.getDocumentStats);

module.exports = router;