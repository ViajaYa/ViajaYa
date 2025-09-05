const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('purchaseInstallment', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    purchase_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'purchases', key: 'id' }
    },
    numero_cuota: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    monto_cuota: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    fecha_vencimiento: {
      type: DataTypes.DATE,
      allowNull: false
    },
    fecha_pago: {
      type: DataTypes.DATE,
      allowNull: true
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'pagado', 'vencido'),
      defaultValue: 'pendiente'
    },
    comprobante_pago_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    cloudinary_public_id: {
      type: DataTypes.STRING,
      allowNull: true
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    metodo_pago: {
      type: DataTypes.ENUM('transferencia', 'efectivo', 'cheque', 'tarjeta'),
      allowNull: true
    }
  }, {
    tableName: 'purchaseInstallments',
    timestamps: false // ✅ Deshabilitamos timestamps por ahora
  });
};
