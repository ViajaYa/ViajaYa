const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  return sequelize.define('payment', {
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
      type: DataTypes.ENUM('wompi', 'transferencia', 'efectivo', 'tarjeta', 'cheque'),
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
    
    // ✅ DATOS ADICIONALES PARA INTEGRACIÓN CON WOMPI
    wompi_transaction_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    wompi_reference: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    
    // ✅ INFORMACIÓN DEL PAGADOR
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
    },
    
    // ✅ CAMPOS DE VERIFICACIÓN Y TRACKING
    verified_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    verified_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    
    // ✅ INFORMACIÓN BANCARIA ADICIONAL
    banco_origen: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    
    // ✅ OBSERVACIONES Y NOTAS
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    
    // ✅ METADATA ADICIONAL
    metadatos: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Información adicional del pago en formato JSON'
    }
  }, {
    // ✅ OPCIONES DEL MODELO
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    tableName: 'payments',
    
    // ✅ ÍNDICES PARA OPTIMIZAR CONSULTAS
    indexes: [
      {
        fields: ['contract_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['tipo_pago']
      },
      {
        fields: ['fecha_pago']
      },
      {
        fields: ['verified_by']
      },
      {
        fields: ['created_by']
      }
    ],
    
    // ✅ HOOKS PARA LOGGING
    hooks: {
      beforeCreate: (payment, options) => {
        console.log('📝 Creando nuevo pago:', {
          contract_id: payment.contract_id,
          monto: payment.monto,
          tipo_pago: payment.tipo_pago
        });
      },
      afterCreate: (payment, options) => {
        console.log('✅ Pago creado exitosamente:', {
          id: payment.id,
          monto: payment.monto
        });
      },
      beforeUpdate: (payment, options) => {
        if (payment.changed('status')) {
          console.log('🔄 Cambiando estado de pago:', {
            id: payment.id,
            from: payment._previousDataValues.status,
            to: payment.status
          });
        }
      }
    },
    
    // ✅ VALIDACIONES PERSONALIZADAS
    validate: {
      montoPositivo() {
        if (this.monto <= 0) {
          throw new Error('El monto debe ser mayor a cero');
        }
      }
      // ✅ REMOVIDO: validación de comprobante ya no es obligatoria
    }
  });
};