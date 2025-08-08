const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  sequelize.define('commission', {
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
    vendedor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    tipo_vendedor: {
      type: DataTypes.ENUM('asesor', 'lider', 'gerente', 'owner'),
      allowNull: false,
    },
    porcentaje: {
      type: DataTypes.DECIMAL(5, 2), // Hasta 999.99%
      allowNull: false,
    },
    monto_base: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    monto_comision: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'generated', 'approved', 'paid'),
      defaultValue: 'pending',
    },
    fecha_generacion: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    fecha_aprobacion: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    fecha_pago: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Referencias a documentos soporte
    documento_soporte_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'supportDocuments',
        key: 'id'
      }
    },
    // Información adicional
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    pagado_por: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
};
