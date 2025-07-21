const { UserDocument, User } = require('../db');

const documentUsersController = {
  // ✅ Subir/actualizar documento de usuario
  uploadDocumentFile: async (req, res) => {
    try {
      console.log('📁 === CONTROLLER INICIADO ===');
      console.log('req.body:', JSON.stringify(req.body, null, 2));
      console.log('req.file:', req.file ? JSON.stringify(req.file, null, 2) : 'NO FILE');
      
      if (!req.file) {
        console.log('❌ No se recibió archivo en el controller');
        return res.status(400).json({
          success: false,
          message: 'No se envió ningún archivo'
        });
      }

      const { user_id, document_name, description, is_required } = req.body;

      // Validar campos requeridos
      if (!user_id || !document_name) {
        return res.status(400).json({
          success: false,
          message: 'user_id y document_name son campos requeridos'
        });
      }

      // Verificar que el usuario existe
      const user = await User.findByPk(user_id);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'Usuario no encontrado' 
        });
      }

      // Determinar el tipo de archivo
      const file_type = req.file.mimetype === 'application/pdf' ? 'pdf' : 
                       req.file.mimetype.includes('word') ? 'document' : 'image';

      // Crear o actualizar documento
      const [document, created] = await UserDocument.upsert({
        user_id: parseInt(user_id),
        document_name,
        description: description || '',
        file_url: req.file.path,
        file_type,
        cloudinary_public_id: req.file.public_id || req.file.filename,
        is_required: is_required === 'true' || is_required === true,
        status: 'pending'
      }, {
        returning: true
      });

      console.log('✅ Documento guardado exitosamente');

      res.status(created ? 201 : 200).json({
        success: true,
        message: created ? 'Documento subido exitosamente' : 'Documento actualizado exitosamente',
        document,
        file: {
          url: req.file.path,
          public_id: req.file.public_id || req.file.filename,
          type: file_type,
          size: req.file.size,
          originalname: req.file.originalname
        }
      });

    } catch (error) {
      console.log('❌ ERROR EN CONTROLLER:', error.message);
      console.log('Stack:', error.stack);
      return res.status(500).json({
        success: false,
        message: 'Error al subir archivo: ' + error.message,
        error: error.message
      });
    }
  },
  
  // ✅ Obtener documentos de un usuario específico
  getUserDocuments: async (req, res) => {
    try {
      const { userId } = req.params;

      // Primero verificar si el usuario existe
      const user = await User.findByPk(userId);
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'Usuario no encontrado' 
        });
      }

      // Buscar documentos del usuario
      const documents = await UserDocument.findAll({
        where: { user_id: userId },
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            lastname: user.lastname,
            email: user.email,
            role: user.role
          },
          documents: documents || []
        }
      });

    } catch (error) {
      console.error('Error al obtener documentos:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error interno del servidor' 
      });
    }
  },

  // ✅ Verificar estado de documentación de un usuario
  checkDocumentationStatus: async (req, res) => {
    try {
      const { userId } = req.params;

      // Verificar que el usuario existe
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'Usuario no encontrado' 
        });
      }

      // Documentos requeridos por rol
      const REQUIRED_DOCUMENTS_BY_ROLE = {
        2: ['Firma Digital', 'RUT', 'Cédula Escaneada', 'Certificado Bancario'], // Asesor
        3: ['Firma Digital', 'RUT', 'Cédula Escaneada', 'Certificado Bancario', 'Autorización Líder'], // Líder
        4: ['Firma Digital', 'RUT', 'Cédula Escaneada', 'Certificado Bancario', 'Autorización Gerente', 'Referencias Comerciales'], // Gerente
      };

      const userRole = user.role;
      const requiredDocuments = REQUIRED_DOCUMENTS_BY_ROLE[userRole] || [];
      
      // Si el rol no requiere documentos, devolver que está completo
      if (requiredDocuments.length === 0) {
        return res.json({
          success: true,
          data: {
            requiresDocumentation: false,
            isComplete: true,
            approvedDocuments: 0,
            totalRequired: 0,
            missingDocuments: [],
            documents: []
          }
        });
      }

      // Obtener documentos actuales del usuario
      const userDocuments = await UserDocument.findAll({
        where: { user_id: userId },
        attributes: ['document_name', 'status', 'createdAt']
      });

      // Verificar qué documentos tiene y cuáles faltan
      const uploadedDocuments = userDocuments.map(doc => doc.document_name);
      const approvedDocuments = userDocuments.filter(doc => doc.status === 'approved').length;
      const missingDocuments = requiredDocuments.filter(doc => !uploadedDocuments.includes(doc));
      
      const isComplete = missingDocuments.length === 0 && approvedDocuments === requiredDocuments.length;

      res.json({
        success: true,
        data: {
          requiresDocumentation: true,
          isComplete,
          approvedDocuments,
          totalRequired: requiredDocuments.length,
          missingDocuments,
          documents: userDocuments
        }
      });

    } catch (error) {
      console.error('Error al verificar documentación:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error interno del servidor' 
      });
    }
  },

  // ✅ Eliminar documento
  deleteDocument: async (req, res) => {
    try {
      const { documentId } = req.params;

      const document = await UserDocument.findByPk(documentId);
      
      if (!document) {
        return res.status(404).json({ 
          success: false, 
          message: 'Documento no encontrado' 
        });
      }

      await document.destroy();

      res.json({
        success: true,
        message: 'Documento eliminado exitosamente'
      });

    } catch (error) {
      console.error('Error al eliminar documento:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error interno del servidor' 
      });
    }
  }
};

module.exports = documentUsersController;
