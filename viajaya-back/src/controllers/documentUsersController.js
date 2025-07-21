const { UserDocument, User, sequelize } = require('../db');

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
  },

  // ✅ Obtener todos los documentos pendientes de revisión
  getPendingDocuments: async (req, res) => {
    try {
      const documents = await UserDocument.findAll({
        where: { status: 'pending' },
        include: [{
          association: 'Owner', // Usar el alias definido para el propietario del documento
          attributes: ['id', 'name', 'lastname', 'email', 'role']
        }],
        order: [['createdAt', 'ASC']]
      });

      res.json({
        success: true,
        data: documents
      });

    } catch (error) {
      console.error('Error al obtener documentos pendientes:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error interno del servidor' 
      });
    }
  },

  // ✅ Aprobar documento
  approveDocument: async (req, res) => {
    try {
      const { documentId } = req.params;
      const { reviewerId, comments } = req.body;

      const document = await UserDocument.findByPk(documentId);
      
      if (!document) {
        return res.status(404).json({ 
          success: false, 
          message: 'Documento no encontrado' 
        });
      }

      await document.update({
        status: 'approved',
        verified_by: reviewerId,
        verified_at: new Date(),
        reviewed_at: new Date(),
        review_comments: comments || 'Documento aprobado'
      });

      res.json({
        success: true,
        message: 'Documento aprobado exitosamente',
        document
      });

    } catch (error) {
      console.error('Error al aprobar documento:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error interno del servidor' 
      });
    }
  },

  // ✅ Rechazar documento
  rejectDocument: async (req, res) => {
    try {
      const { documentId } = req.params;
      const { reviewerId, reason, comments } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'La razón del rechazo es requerida'
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
        status: 'rejected',
        verified_by: reviewerId,
        verified_at: new Date(),
        reviewed_at: new Date(),
        rejection_reason: reason,
        review_comments: comments || reason
      });

      res.json({
        success: true,
        message: 'Documento rechazado exitosamente',
        document
      });

    } catch (error) {
      console.error('Error al rechazar documento:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error interno del servidor' 
      });
    }
  },

  // ✅ Obtener estadísticas de documentos
  getDocumentStats: async (req, res) => {
    try {
      const stats = await UserDocument.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status']
      });

      const totalUsers = await User.count({
        where: {
          role: [2, 3, 4] // Solo contar usuarios que requieren documentación
        }
      });

      const formattedStats = {
        pending: 0,
        approved: 0,
        rejected: 0,
        total: 0
      };

      stats.forEach(stat => {
        formattedStats[stat.status] = parseInt(stat.dataValues.count);
        formattedStats.total += parseInt(stat.dataValues.count);
      });

      res.json({
        success: true,
        data: {
          ...formattedStats,
          totalUsersRequiringDocs: totalUsers
        }
      });

    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error interno del servidor' 
      });
    }
  },

  // ✅ Obtener todos los documentos pendientes de revisión (Solo Owner)
  getPendingDocuments: async (req, res) => {
    try {
      const documents = await UserDocument.findAll({
        where: { status: 'pending' },
        include: [{
          model: User,
          as: 'Owner', // Usar el alias exacto definido en db.js
          attributes: ['id', 'name', 'lastname', 'email', 'role']
        }],
        order: [['createdAt', 'ASC']]
      });

      res.json({
        success: true,
        data: {
          documents,
          totalPending: documents.length
        }
      });

    } catch (error) {
      console.error('Error al obtener documentos pendientes:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error interno del servidor' 
      });
    }
  },

  // ✅ Aprobar documento (Solo Owner)
  approveDocument: async (req, res) => {
    try {
      const { documentId } = req.params;
      const { comments } = req.body;

      const document = await UserDocument.findByPk(documentId);
      
      if (!document) {
        return res.status(404).json({ 
          success: false, 
          message: 'Documento no encontrado' 
        });
      }

      await document.update({
        status: 'approved',
        review_comments: comments || '',
        reviewed_at: new Date()
      });

      res.json({
        success: true,
        message: 'Documento aprobado exitosamente',
        document
      });

    } catch (error) {
      console.error('Error al aprobar documento:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error interno del servidor' 
      });
    }
  },

  // ✅ Rechazar documento (Solo Owner)
  rejectDocument: async (req, res) => {
    try {
      const { documentId } = req.params;
      const { comments } = req.body;

      if (!comments || comments.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Los comentarios son obligatorios al rechazar un documento'
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
        status: 'rejected',
        review_comments: comments,
        reviewed_at: new Date()
      });

      res.json({
        success: true,
        message: 'Documento rechazado exitosamente',
        document
      });

    } catch (error) {
      console.error('Error al rechazar documento:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error interno del servidor' 
      });
    }
  },

  // ✅ Obtener estadísticas de documentos (Solo Owner)
  getDocumentStats: async (req, res) => {
    try {
      const stats = await UserDocument.findAll({
        attributes: [
          'status',
          [User.sequelize.fn('COUNT', User.sequelize.col('status')), 'count']
        ],
        group: ['status'],
        raw: true
      });

      const totalUsers = await User.count({
        where: { role: [2, 3, 4] } // Solo contar Asesores, Líderes y Gerentes
      });

      const formattedStats = {
        pending: stats.find(s => s.status === 'pending')?.count || 0,
        approved: stats.find(s => s.status === 'approved')?.count || 0,
        rejected: stats.find(s => s.status === 'rejected')?.count || 0,
        totalUsers,
        totalDocuments: stats.reduce((acc, curr) => acc + parseInt(curr.count), 0)
      };

      res.json({
        success: true,
        data: formattedStats
      });

    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error interno del servidor' 
      });
    }
  },

  // ✅ Obtener todos los documentos con filtros (Solo Owner)
  getAllDocuments: async (req, res) => {
    try {
      const { status, role, page = 1, limit = 10 } = req.query;
      
      // Construir condiciones de filtro
      const whereConditions = {};
      if (status && status !== 'all') {
        whereConditions.status = status;
      }

      // Construir condiciones para el usuario
      const userWhereConditions = {};
      if (role && role !== 'all') {
        userWhereConditions.role = parseInt(role);
      } else {
        userWhereConditions.role = [2, 3, 4]; // Solo usuarios que requieren documentos
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const documents = await UserDocument.findAndCountAll({
        where: whereConditions,
        include: [{
          model: User,
          as: 'Owner',
          where: userWhereConditions,
          attributes: ['id', 'name', 'lastname', 'email', 'role']
        }],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });

      res.json({
        success: true,
        data: {
          documents: documents.rows,
          pagination: {
            total: documents.count,
            page: parseInt(page),
            pages: Math.ceil(documents.count / parseInt(limit)),
            limit: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error al obtener todos los documentos:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error interno del servidor' 
      });
    }
  }
};

module.exports = documentUsersController;
