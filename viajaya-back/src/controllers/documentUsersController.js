const { UserDocument, User } = require('../db');
const { sequelize } = require('../db');

const documentUsersController = {
  // ✅ Subir/actualizar documento de usuario
   uploadDocumentFile: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se envió ningún archivo'
        });
      }

      const { user_id, document_name, description, is_required } = req.body;

      // Verificar que el usuario existe
      const user = await User.findByPk(user_id);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'Usuario no encontrado' 
        });
      }

      // Determinar el tipo de archivo
      const file_type = req.file.mimetype === 'application/pdf' ? 'pdf' : 'image';

      // Crear o actualizar documento
      const [document, created] = await UserDocument.upsert({
        user_id,
        document_name,
        description,
        file_url: req.file.path, // URL de Cloudinary
        file_type,
        cloudinary_public_id: req.file.filename, // Public ID de Cloudinary
        is_required: is_required || true,
        status: 'pending'
      }, {
        returning: true
      });

      res.status(created ? 201 : 200).json({
        success: true,
        message: created ? 'Archivo subido exitosamente' : 'Archivo actualizado exitosamente',
        document,
        file: {
          url: req.file.path,
          public_id: req.file.filename,
          type: file_type,
          size: req.file.size
        }
      });

    } catch (error) {
      console.error('Error al subir archivo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al subir archivo',
        error: error.message
      });
    }
  },

  // ✅ Obtener todos los documentos de un usuario
  getUserDocuments: async (req, res) => {
    try {
      const { userId } = req.params;

      const user = await User.findByPk(userId, {
        include: [
          {
            model: UserDocument,
            as: 'DocumentsAsOwner',
            include: [
              {
                model: User,
                as: 'VerifiedBy',
                attributes: ['id', 'name', 'lastname', 'email']
              }
            ]
          }
        ]
      });

      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'Usuario no encontrado' 
        });
      }

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
          documents: user.DocumentsAsOwner || []
        }
      });

    } catch (error) {
      console.error('Error al obtener documentos:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener documentos del usuario' 
      });
    }
  },

  // ✅ Verificar si la documentación del usuario está completa
  checkDocumentationStatus: async (req, res) => {
    try {
      const { userId } = req.params;

      const user = await User.findByPk(userId, {
        include: [
          {
            model: UserDocument,
            as: 'DocumentsAsOwner',
            where: { 
              status: 'approved',
              is_required: true 
            },
            required: false
          }
        ]
      });

      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'Usuario no encontrado' 
        });
      }

      // Solo verificar para roles 2, 3, 4
      const requiredRoles = [2, 3, 4];
      if (!requiredRoles.includes(user.role)) {
        return res.json({
          success: true,
          data: {
            requiresDocumentation: false,
            isComplete: true,
            message: 'Este rol no requiere documentación especial'
          }
        });
      }

      // Documentos mínimos requeridos (puedes ajustar según tu negocio)
      const minimumRequiredDocs = ['Firma Digital', 'RUT', 'Cédula Escaneada'];
      
      const approvedDocs = user.DocumentsAsOwner || [];
      const approvedDocNames = approvedDocs.map(doc => doc.document_name);
      
      const missingDocs = minimumRequiredDocs.filter(docName => 
        !approvedDocNames.includes(docName)
      );

      const isComplete = missingDocs.length === 0;

      res.json({
        success: true,
        data: {
          requiresDocumentation: true,
          isComplete,
          approvedDocuments: approvedDocs.length,
          totalRequired: minimumRequiredDocs.length,
          missingDocuments: missingDocs,
          documents: approvedDocs.map(doc => ({
            name: doc.document_name,
            status: doc.status,
            uploadedAt: doc.createdAt,
            verifiedAt: doc.verified_at
          }))
        }
      });

    } catch (error) {
      console.error('Error al verificar documentación:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al verificar estado de documentación' 
      });
    }
  },

  // ✅ Obtener todos los documentos pendientes de revisión (para admins)
  getPendingDocuments: async (req, res) => {
    try {
      const { page = 1, limit = 10, status = 'pending' } = req.query;
      const offset = (page - 1) * limit;

      const { count, rows: documents } = await UserDocument.findAndCountAll({
        where: { status },
        include: [
          {
            model: User,
            as: 'Owner',
            attributes: ['id', 'name', 'lastname', 'email', 'role']
          },
          {
            model: User,
            as: 'VerifiedBy',
            attributes: ['id', 'name', 'lastname', 'email'],
            required: false
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        data: {
          documents,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit)
          }
        }
      });

    } catch (error) {
      console.error('Error al obtener documentos pendientes:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener documentos pendientes' 
      });
    }
  },

  // ✅ Revisar/aprobar/rechazar documento (para admins)
  reviewDocument: async (req, res) => {
    try {
      const { documentId } = req.params;
      const { status, rejection_reason } = req.body;
      const adminId = req.user?.id; // Asumiendo que viene del middleware de auth

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Status debe ser "approved" o "rejected"' 
        });
      }

      if (status === 'rejected' && !rejection_reason) {
        return res.status(400).json({ 
          success: false, 
          message: 'La razón de rechazo es requerida' 
        });
      }

      const document = await UserDocument.findByPk(documentId);
      if (!document) {
        return res.status(404).json({ 
          success: false, 
          message: 'Documento no encontrado' 
        });
      }

      await document.update({
        status,
        rejection_reason: status === 'rejected' ? rejection_reason : null,
        verified_by: adminId,
        verified_at: new Date()
      });

      // Traer el documento actualizado con relaciones
      const updatedDocument = await UserDocument.findByPk(documentId, {
        include: [
          {
            model: User,
            as: 'Owner',
            attributes: ['id', 'name', 'lastname', 'email']
          },
          {
            model: User,
            as: 'VerifiedBy',
            attributes: ['id', 'name', 'lastname', 'email']
          }
        ]
      });

      res.json({
        success: true,
        message: `Documento ${status === 'approved' ? 'aprobado' : 'rechazado'} exitosamente`,
        document: updatedDocument
      });

    } catch (error) {
      console.error('Error al revisar documento:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al revisar documento' 
      });
    }
  },

  // ✅ Eliminar documento
  deleteDocument: async (req, res) => {
    try {
      const { documentId } = req.params;
      const userId = req.user?.id;

      const document = await UserDocument.findByPk(documentId);
      if (!document) {
        return res.status(404).json({ 
          success: false, 
          message: 'Documento no encontrado' 
        });
      }

      // Solo el propietario o un admin puede eliminar
      if (document.user_id !== userId && req.user?.role !== 7) {
        return res.status(403).json({ 
          success: false, 
          message: 'No tienes permisos para eliminar este documento' 
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
        message: 'Error al eliminar documento' 
      });
    }
  },

  // ✅ Obtener estadísticas de documentos (para dashboard admin)
  getDocumentStats: async (req, res) => {
    try {
      const stats = await UserDocument.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status'],
        raw: true
      });

      const formattedStats = {
        pending: 0,
        approved: 0,
        rejected: 0
      };

      stats.forEach(stat => {
        formattedStats[stat.status] = parseInt(stat.count);
      });

      res.json({
        success: true,
        data: {
          ...formattedStats,
          total: formattedStats.pending + formattedStats.approved + formattedStats.rejected
        }
      });

    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener estadísticas' 
      });
    }
  }
};

module.exports = documentUsersController;