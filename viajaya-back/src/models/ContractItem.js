const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
   sequelize.define('contractItem', {
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
        'contacto de urgencia',
        'extras',
        'comisiones', 
        'ganancia_empresa'
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
    precio_unitario: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    cantidad: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    precio_total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    costo_proveedor: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    ganancia: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    porcentaje_ganancia: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    fecha_inicio: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    fecha_fin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    fecha_vencimiento_pago: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    proveedor: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    proveedor_contacto: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        'pendiente_compra',
        'comprado_pendiente',  
        'comprado_pagado',     
        'vencido',            
        'no_requiere',        
        'cancelado'
      ),
      defaultValue: 'pendiente_compra',
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    }
  }, {
    tableName: 'contract_items',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });


};