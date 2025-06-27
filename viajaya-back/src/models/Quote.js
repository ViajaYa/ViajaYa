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
    // IDs de la jerarquía de ventas
    asesor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    // Datos del viaje
    numero_personas: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fecha_ida: {
      type: DataTypes.DATE,
      allowNull: false,
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
    // Estados y precios
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'approved', 'rejected'),
      defaultValue: 'pending',
    },
    precio_total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    // Fechas de control
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
};
