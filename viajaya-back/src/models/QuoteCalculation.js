module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');
  sequelize.define('quoteCalculation', {
    id: { 
      type: DataTypes.INTEGER, 
      autoIncrement: true, 
      primaryKey: true 
    },
    user_id: { 
      type: DataTypes.INTEGER,
      allowNull: false 
    },
    quote_id: { 
      type: DataTypes.UUID, 
      allowNull: true
    },
    
    // ===== COSTOS POR CATEGORÍAS =====
    
    // TRANSPORTE
    tiquetes: { 
      type: DataTypes.JSONB,
      defaultValue: {
        tipo: 'ida_vuelta', // ida | ida_vuelta | sin_tiquetes
        origen: '',
        destino: '',
        fecha_ida: '',
        fecha_vuelta: '',
        costo_ida: 0,
        costo_vuelta: 0,
        costo_total: 0,
        proveedor: '',
        observaciones: ''
      }
    },
    
    traslados: { 
      type: DataTypes.JSONB,
      defaultValue: {
        aeropuerto_hotel_ida: { incluido: false, costo: 0, proveedor: '' },
        hotel_aeropuerto_vuelta: { incluido: false, costo: 0, proveedor: '' },
        otros: [],
        costo_total: 0
      }
    },
    
    // ALOJAMIENTO
    hotel: { 
      type: DataTypes.JSONB,
      defaultValue: {
        nombre: '',
        categoria: '3_estrellas',
        acomodacion: 'doble', // simple | doble | triple | cuadruple | familiar
        noches: 0,
        costo_noche: 0,
        costo_total: 0,
        ubicacion: '',
        proveedor: '',
        observaciones: ''
      }
    },
    
    alimentacion: { 
      type: DataTypes.JSONB,
      defaultValue: {
        tipo: 'ninguna', // ninguna | desayuno | media_pension | pension_completa | todo_incluido
        costo_total: 0,
        proveedor: '',
        observaciones: ''
      }
    },
    
    // SERVICIOS ADICIONALES
    equipaje: { 
      type: DataTypes.JSONB,
      defaultValue: {
        cabina: { incluido: true, costo: 0 },
        bodega: { incluido: false, costo: 0 },
        equipaje_extra: { incluido: false, costo: 0 },
        costo_total: 0
      }
    },
    
    seguros: { 
      type: DataTypes.JSONB,
      defaultValue: {
        asistencia_medica: { incluido: false, tipo: '', costo: 0, proveedor: '' },
        cancelacion: { incluido: false, costo: 0, proveedor: '' },
        otros: [],
        costo_total: 0
      }
    },
    
    // ACTIVIDADES
    excursiones: { 
      type: DataTypes.JSONB,
      defaultValue: []
      // [{ nombre: '', descripcion: '', duracion: '', costo: 0, proveedor: '', obligatoria: false }]
    },
    
    extras: { 
      type: DataTypes.JSONB,
      defaultValue: []
      // [{ nombre: '', descripcion: '', costo: 0, proveedor: '' }]
    },
    
    // ===== COMISIONES Y GANANCIAS =====
    
    comisiones: { 
      type: DataTypes.JSONB,
      defaultValue: {
        asesor: { porcentaje: 0, valor_fijo: 0, total: 0 },
        lider: { porcentaje: 0, valor_fijo: 0, total: 0 },
        gerente: { porcentaje: 0, valor_fijo: 0, total: 0 },
        admin: { porcentaje: 0, valor_fijo: 0, total: 0 },
        total_comisiones: 0
      }
    },
    
    ganancia: { 
      type: DataTypes.JSONB,
      defaultValue: {
        porcentaje: 0,
        valor_fijo: 0,
        total: 0
      }
    },
    
    // ===== TOTALES =====
    
    costo_base: { 
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    
    total_comisiones: { 
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    
    total_ganancia: { 
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    
    precio_final_total: { 
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    
    precio_final_por_persona: { 
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    
    num_personas: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    
    // ===== METADATOS =====
    
    estado: {
      type: DataTypes.ENUM('temporal', 'confirmado', 'usado'),
      defaultValue: 'temporal'
    },
    
    observaciones_generales: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    fecha_viaje_inicio: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    fecha_viaje_fin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // CAMPOS LEGACY (mantener compatibilidad)
    proveedor: { type: DataTypes.STRING },
    items: { type: DataTypes.JSONB },
    costo_total: { type: DataTypes.FLOAT },
    margen: { type: DataTypes.FLOAT },
    precio_sugerido: { type: DataTypes.FLOAT }
    
  }, {
    timestamps: true,
    tableName: 'quoteCalculations'
  });
};