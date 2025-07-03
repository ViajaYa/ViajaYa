const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const Quote = sequelize.define('Quote', {
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      primaryKey: true,
    },
    quote_number: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    // ✅ Información del cliente (para cotizaciones externas)
    nombre_cliente: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email_cliente: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    telefono_cliente: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // ✅ IDs de la jerarquía de ventas
    asesor_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    lider_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    gerente_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    admin_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    // ✅ Datos del viaje
    numero_personas: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fecha_ida: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    alimentacion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    fecha_regreso: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    destino: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    origen: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    acomodacion: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    traslado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    tipo_hotel: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ninos: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    edades_ninos: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      defaultValue: [],
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // ✅ Estados y precios
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'sent', 'approved', 'requote', 'rejected', 'expired'),
      defaultValue: 'pending',
    },
    precio_total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    // ✅ NUEVOS CAMPOS PARA COTIZACIONES EXTERNAS Y GESTIÓN
    source: {
      type: DataTypes.ENUM('internal', 'external'),
      defaultValue: 'internal',
     
    },
    is_external: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    priority: {
      type: DataTypes.ENUM('low', 'normal', 'high'),
      defaultValue: 'normal',
    },
    created_by: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    reassigned_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reassignment_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // ✅ Fechas de control existentes
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // ✅ Nuevas fechas de control
    sent_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rejected_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    motivo_rechazo: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    requote_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    requote_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    }
  }, 
  {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    tableName: 'Quotes', // ✅ Nombre explícito de la tabla
    indexes: [
      
      {
        fields: ['quote_number'],
        unique: true
      },
      {
        fields: ['status']
      },
      {
        fields: ['is_external']
      },
      {
        fields: ['priority']
      },
      {
        fields: ['asesor_id']
      },
      {
        fields: ['lider_id']
      },
      {
        fields: ['gerente_id']
      },
      {
        fields: ['admin_id']
      },
      {
        fields: ['cliente_id']
      },
      {
        fields: ['email_cliente']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['expires_at']
      }
    ]
  });
}