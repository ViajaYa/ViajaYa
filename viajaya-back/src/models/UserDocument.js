const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  sequelize.define('userDocument', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    document_name: {
      type: DataTypes.STRING,
      allowNull: false,
      // Ejemplos: "Firma Digital", "RUT", "Cédula Escaneada", "Certificado Bancario", etc.
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      // Descripción detallada del documento requerido
    },
    file_url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    file_type: {
      type: DataTypes.ENUM('image', 'pdf'),
      allowNull: false,
    },
    cloudinary_public_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_required: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    // ✅ SÍ, el status es para control de calidad
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
    },
    verified_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    verified_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    }
  }, {
    tableName: 'user_documents',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'document_name'] // Un documento por nombre por usuario
      }
    ]
  });
};