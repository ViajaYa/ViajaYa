const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  sequelize.define('autoMessage', {
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      primaryKey: true,
    },
    contract_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'contracts',
        key: 'id'
      }
    },
    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    tipo_mensaje: {
      type: DataTypes.ENUM(
        'recordatorio_pago', 
        'tramite_documentos', 
        'bienvenida', 
        'confirmacion', 
        'itinerario', 
        'general',
        'urgente'
      ),
      allowNull: false,
    },
    titulo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    contenido: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    fecha_programada: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    fecha_enviado: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'sent', 'failed', 'cancelled'),
      defaultValue: 'scheduled',
    },
    canal_envio: {
      type: DataTypes.ENUM('email', 'sms', 'whatsapp', 'todos'),
      defaultValue: 'email',
    },
    // Información del destinatario
    destinatario_email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    destinatario_telefono: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Control de reenvíos
    intentos_envio: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    maximo_intentos: {
      type: DataTypes.INTEGER,
      defaultValue: 3,
    },
    // Template y personalización
    template_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    variables_template: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    // Archivos adjuntos
    adjuntos_urls: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    // Creado por
    creado_por: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    es_automatico: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    // Respuesta del destinatario
    respuesta_recibida: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    fecha_respuesta: {
      type: DataTypes.DATE,
      allowNull: true,
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
};
