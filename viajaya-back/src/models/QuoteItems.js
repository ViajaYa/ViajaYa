const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  sequelize.define('quoteItem', {
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      primaryKey: true,
    },
    quote_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'quotes',
        key: 'id'
      }
    },
    tipo: {
      type: DataTypes.ENUM(
        'tickets',
        'asistencia_medica', 
        'equipaje',
        'alimentacion',
        'alojamiento',
        'traslados',
        'excursiones',
        'seguro',
        'otros'
      ),
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    detalle: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Precios y costos
    precio_unitario: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    cantidad: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    precio_total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    costo_proveedor: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true, // Costo real del proveedor
    },
    ganancia: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true, // Calculado: precio_total - costo_proveedor
    },
    porcentaje_ganancia: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true, // % de ganancia sobre el costo
    },
    // Fechas importantes
    fecha_inicio: {
      type: DataTypes.DATE,
      allowNull: true, // Para servicios con fecha específica
    },
    fecha_fin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    fecha_vencimiento_pago: {
      type: DataTypes.DATE,
      allowNull: true, // Cuándo hay que pagar al proveedor
    },
    // Proveedor
    proveedor: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    proveedor_contacto: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Estado del item
    status: {
      type: DataTypes.ENUM(
        'pendiente',
        'confirmado', 
        'pagado',
        'cancelado'
      ),
      defaultValue: 'pendiente',
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
};