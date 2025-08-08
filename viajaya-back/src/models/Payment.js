const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  sequelize.define('payment', {
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
    tipo_pago: {
      type: DataTypes.ENUM('wompi', 'transferencia', 'efectivo', 'tarjeta'),
      allowNull: false,
    },
    monto: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    fecha_pago: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    referencia_pago: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    comprobante_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'verified', 'rejected'),
      defaultValue: 'pending',
    },
    recibo_pdf_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Datos adicionales para integración con Wompi
    wompi_transaction_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    wompi_reference: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Información del pagador
    pagador_nombre: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    pagador_email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    pagador_telefono: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
};
