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
       cloudinary_public_id: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'ID del archivo en Cloudinary'
    },
    
    tipo_comprobante: {
      type: DataTypes.ENUM('factura', 'recibo', 'confirmacion', 'voucher', 'ticket'),
      defaultValue: 'factura'
    },
    
    moneda: {
      type: DataTypes.ENUM('COP', 'USD', 'EUR'),
      defaultValue: 'COP'
    },
    
    diferencia_precio: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      comment: 'Diferencia entre precio cotizado y precio real (puede ser negativa)'
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