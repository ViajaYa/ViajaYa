const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  sequelize.define('contract', {
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      primaryKey: true,
    },
    contract_number: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    quote_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'quotes',
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
    // Detalles financieros
    precio_total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    forma_pago: {
      type: DataTypes.ENUM('contado', 'cuotas'),
      allowNull: false,
    },
    numero_cuotas: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    valor_cuota: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    fecha_vencimiento_cuotas: {
      type: DataTypes.ARRAY(DataTypes.DATE),
      defaultValue: [],
    },
    // Estados del contrato
    status: {
      type: DataTypes.ENUM('draft', 'sent', 'signed', 'completed', 'cancelled'),
      defaultValue: 'draft',
    },
    fecha_firma: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    fecha_inicio_viaje: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    fecha_fin_viaje: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    // Control de pagos
    total_pagado: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00,
    },
    saldo_pendiente: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    // URLs de documentos
    contrato_pdf_url: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
};
