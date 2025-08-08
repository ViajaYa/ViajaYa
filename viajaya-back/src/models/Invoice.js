const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  sequelize.define('invoice', {
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      primaryKey: true,
    },
    numero_factura: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    contract_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'contracts',
        key: 'id'
      }
    },
    fecha_factura: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    fecha_vencimiento: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Montos detallados
    monto_compras: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    monto_comisiones: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    monto_ganancia: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    impuestos: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00,
    },
    monto_total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    // Estados
    status: {
      type: DataTypes.ENUM('draft', 'generated', 'sent', 'paid', 'cancelled'),
      defaultValue: 'draft',
    },
    tipo_factura: {
      type: DataTypes.ENUM('electronica', 'pos', 'manual'),
      defaultValue: 'electronica',
    },
    // Información del cliente facturado
    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    cliente_nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cliente_documento: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cliente_email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cliente_telefono: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cliente_direccion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Archivos generados
    pdf_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    xml_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Control interno
    generada_por: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    aprobada_por: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    fecha_aprobacion: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Información adicional
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    forma_pago_factura: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Para facturación electrónica
    cufe: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    numero_autorizacion: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
};
