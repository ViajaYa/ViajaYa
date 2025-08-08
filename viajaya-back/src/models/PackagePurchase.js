const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  sequelize.define('packagePurchase', {
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      primaryKey: true,
    },
    contract_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'contracts',
        key: 'id'
      }
    },
    tipo_compra: {
      type: DataTypes.ENUM('vuelo', 'hotel', 'transporte', 'seguro', 'tour', 'alimentacion', 'otros'),
      allowNull: false,
    },
    proveedor: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    monto: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    fecha_compra: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    fecha_limite: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'purchased', 'cancelled', 'expired'),
      defaultValue: 'pending',
    },
    prioridad: {
      type: DataTypes.ENUM('alta', 'media', 'baja'),
      defaultValue: 'media',
    },
    comprobante_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Datos específicos para vuelos
    aerolinea: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    numero_vuelo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Datos específicos para hoteles
    nombre_hotel: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tipo_habitacion: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    check_in: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    check_out: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Control de alertas
    alerta_enviada: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    notas_internas: {
      type: DataTypes.TEXT,
      allowNull: true,
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
};
