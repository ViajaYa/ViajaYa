const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
sequelize.define('purchase', {

    contract_item_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'contract_items', key: 'id' }
    },
    proveedor: {
      type: DataTypes.STRING,
      allowNull: true
    },
    costo: {
      type: DataTypes.DECIMAL(12,2),
      allowNull: true
    },
    fecha_compra: {
      type: DataTypes.DATE,
      allowNull: true
    },
    fecha_vencimiento_pago: {
      type: DataTypes.DATE,
      allowNull: true
    },
    comprobante_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    estado_pago: {
      type: DataTypes.ENUM('pendiente', 'pagado', 'vencido'),
      defaultValue: 'pendiente',
      allowNull: true
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  });


};