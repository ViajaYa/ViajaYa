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
    numero_pasajeros: {
  type: DataTypes.INTEGER,
  allowNull: true
},
trip_type: {
  type: DataTypes.ENUM('nacional', 'internacional'),
  allowNull: true, // Temporal para no romper registros existentes
  defaultValue: 'nacional',
},
pasajero_titular: {
  type: DataTypes.STRING(200),
  allowNull: true
},
documento_titular: {
  type: DataTypes.STRING(100),
  allowNull: true
},
    // Detalles financieros principales
    precio_total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    forma_pago: {
      type: DataTypes.ENUM('contado', 'cuotas'),
      allowNull: false,
    },
    
    // ✅ ESTRUCTURA MEJORADA PARA CUOTAS
    // Cuota inicial (seña/anticipo)
    tiene_cuota_inicial: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    cuota_inicial_porcentaje: {
      type: DataTypes.DECIMAL(5, 2), // ej: 30.00 para 30%
      allowNull: true,
    },
    cuota_inicial_monto: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    fecha_vencimiento_inicial: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cuota_inicial_pagada: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    fecha_pago_inicial: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    
    // Cuotas restantes
    numero_cuotas_restantes: {
      type: DataTypes.INTEGER,
      defaultValue: 0, // Número de cuotas después de la inicial
    },
    monto_restante: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true, // precio_total - cuota_inicial_monto
    },
    valor_cuota_restante: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true, // monto_restante / numero_cuotas_restantes
    },
    fechas_vencimiento_cuotas: {
      type: DataTypes.ARRAY(DataTypes.DATE),
      defaultValue: [],
    },
    cuotas_pagadas: {
      type: DataTypes.ARRAY(DataTypes.BOOLEAN),
      defaultValue: [], // [false, false, false] para trackear cuáles están pagas
    },
    fechas_pago_cuotas: {
      type: DataTypes.ARRAY(DataTypes.DATE),
      defaultValue: [], // Fechas reales de pago de cada cuota
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
    
    // Control de pagos consolidado
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