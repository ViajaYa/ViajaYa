const express = require('express');
const router = express.Router();
const upload = require('../config/multerConfig'); // Importar configuración de Multer
const documentUsersController = require('../controllers/documentUsersController');

// ✅ Subir archivo directamente con Multer + Cloudinary
const debugMiddleware = (req, res, next) => {
  console.log('🔍 DEBUG MIDDLEWARE:');
  console.log('Body antes de Multer:', req.body);
  console.log('File antes de Multer:', req.file);
  next();
};

// ✅ Subir archivo con debug
router.post('/upload-file', 
  debugMiddleware,                                    // 1. Debug
  upload.single('document'),                          // 2. Multer procesa archivo
  (req, res, next) => {                              // 3. Verificar resultado de Multer
    console.log('🔍 DESPUÉS DE MULTER:');
    console.log('Body después de Multer:', req.body);
    console.log('File después de Multer:', req.file);
    next();
  },
  documentUsersController.uploadDocumentFile          // 4. Controller
);

// ✅ Obtener documentos de un usuario específico
router.get('/user/:userId', documentUsersController.getUserDocuments);

// ✅ Verificar estado de documentación de un usuario
router.get('/status/:userId', documentUsersController.checkDocumentationStatus);

// ✅ Eliminar documento
router.delete('/:documentId', documentUsersController.deleteDocument);

module.exports = router;