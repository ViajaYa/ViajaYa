const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
 sequelize.define('quote', {
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
        model: 'users',
        key: 'id'
      }
    },
    lider_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    gerente_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    admin_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    // ✅ Datos del viaje
    numero_personas: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    // ✅ NUEVOS CAMPOS PARA MANEJO DETALLADO DE PASAJEROS
    adultos: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Personas mayores de 14 años (pagan precio completo)'
    },
    menores: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Niños de 2-14 años (pagan precio reducido)'
    },
    infantes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Bebés menores de 2 años (no pagan pero necesitan datos)'
    },
    edades_menores: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      defaultValue: [],
      comment: 'Edades específicas de menores de 2-14 años'
    },
    edades_infantes: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      defaultValue: [],
      comment: 'Edades específicas de infantes menores de 2 años (en meses)'
    },
    personas_atencion_especial: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Personas que requieren atención especial/discapacidad'
    },
    detalles_atencion_especial: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Descripción de las necesidades especiales'
    },
    // ✅ CAMPOS MEJORADOS PARA ALOJAMIENTO
    tipo_hotel: {
      type: DataTypes.ENUM('basico', 'superior'),
      allowNull: true,
      defaultValue: 'basico'
    },
    acomodacion: {
      type: DataTypes.ENUM('sencilla', 'doble', 'triple', 'cuadruple'),
      allowNull: true,
      defaultValue: 'doble'
    },
    fecha_ida: {
      type: DataTypes.DATEONLY, // ✅ CAMBIAR: De DATE a DATEONLY para evitar problemas de zona horaria
      allowNull: false,
    },
    alimentacion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    fecha_regreso: {
      type: DataTypes.DATEONLY, // ✅ CAMBIAR: De DATE a DATEONLY para evitar problemas de zona horaria
      allowNull: false,
    },
    destino: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    trip_type: {
      type: DataTypes.ENUM('nacional', 'internacional', 'operadorLlano', 'hotel'),
      allowNull: true, // Permitir NULL hasta que el usuario seleccione
      defaultValue: null, // No valor por defecto
    },
    origen: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // ✅ CAMPOS LEGACY COMENTADOS (mantener por compatibilidad de DB)
    // ninos: {
    //   type: DataTypes.INTEGER,
    //   defaultValue: 0,
    // },
    // edades_ninos: {
    //   type: DataTypes.ARRAY(DataTypes.INTEGER),
    //   defaultValue: [],
    // },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    pdf_path: {
      type: DataTypes.STRING,
      allowNull: true,
      
    },
    pdf_filename: {
      type: DataTypes.STRING,
      allowNull: true,
      
    },
    pdf_generated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      
    },
    // ✅ Estados y precios
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'sent', 'pending_passengers', 'approved', 'requote', 'rejected', 'expired'),
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
    email_sent_to: {
      type: DataTypes.STRING,
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
    tableName: 'quotes', // ✅ Nombre explícito de la tabla
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