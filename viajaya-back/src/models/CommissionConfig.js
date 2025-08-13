const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  sequelize.define('commissionConfig', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    // Configuración por rol
    role: {
      type: DataTypes.ENUM('asesor', 'lider', 'gerente', 'admin', 'owner'),
      allowNull: false,
    },
    // Tipo de viaje
    trip_type: {
      type: DataTypes.ENUM('nacional', 'internacional', 'operadorLlano', 'hotel'),
      allowNull: false,
    },
    // Tipo de cálculo
    calculation_type: {
      type: DataTypes.ENUM('fixed_per_person', 'percentage', 'fixed_total'),
      allowNull: false,
      
    },
    // Monto fijo por persona (para viajes locales/internacionales)
    amount_per_person: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      
    },
    // Porcentaje (para casos especiales)
    percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      
    },
    // Monto fijo total (independiente de personas)
    fixed_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      
    },
    // Configuración adicional
    min_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      
    },
    max_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      
    },
    // Control
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    effective_from: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      
    },
    effective_until: {
      type: DataTypes.DATE,
      allowNull: true,
      
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    tableName: 'commission_configs',
    indexes: [
      {
        unique: true,
        fields: ['role', 'trip_type', 'effective_from'],
        name: 'unique_active_config'
      },
      {
        fields: ['role']
      },
      {
        fields: ['trip_type']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['effective_from', 'effective_until']
      }
    ]
  });
};
