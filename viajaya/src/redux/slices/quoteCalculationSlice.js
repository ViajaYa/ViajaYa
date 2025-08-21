// ✅ NUEVO: Obtener cálculo por quote_id (UUID)
export const fetchQuoteCalculationByQuoteId = createAsyncThunk(
  'quoteCalculation/fetchByQuoteId',
  async (quoteId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/quote-calculations/by-quote/${quoteId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Error al obtener cálculo por quote_id');
    }
  }
);
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { createSelector } from '@reduxjs/toolkit';
import api from '../../utils/api';

// ✅ NUEVO: Obtener datos base para calculadora desde un Quote
export const fetchCalculationBaseData = createAsyncThunk(
  'quoteCalculation/fetchBaseData',
  async (quoteId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/quote-calculations/base-data/${quoteId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Error al obtener datos base');
    }
  }
);

// Crear cálculo temporal
export const createQuoteCalculation = createAsyncThunk(
  'quoteCalculation/create',
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post('/quote-calculations', data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Error al crear cálculo');
    }
  }
);

// ✅ NUEVO: Crear o actualizar cálculo (upsert)
export const upsertQuoteCalculation = createAsyncThunk(
  'quoteCalculation/upsert',
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post('/quote-calculations/upsert', data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Error al crear/actualizar cálculo');
    }
  }
);

// Obtener cálculo por ID
export const fetchQuoteCalculation = createAsyncThunk(
  'quoteCalculation/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`/quote-calculations/${id}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Error al obtener cálculo');
    }
  }
);

// Confirmar cálculo y asociar a cotización
export const confirmQuoteCalculation = createAsyncThunk(
  'quoteCalculation/confirm',
  async ({ id, quote_id }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/quote-calculations/${id}/confirm`, { quote_id });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Error al confirmar cálculo');
    }
  }
);

const initialState = {
  calculation: null,
  baseData: null, // ✅ NUEVO: Datos base del quote
  loading: false,
  baseDataLoading: false, // ✅ NUEVO: Loading para datos base
  error: null,
};

const quoteCalculationSlice = createSlice({
  name: 'quoteCalculation',
  initialState,
  reducers: {
    clearCalculation: (state) => {
      state.calculation = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ✅ NUEVO: Casos para fetchCalculationBaseData
      .addCase(fetchCalculationBaseData.pending, (state) => {
        state.baseDataLoading = true;
        state.error = null;
      })
      .addCase(fetchCalculationBaseData.fulfilled, (state, action) => {
        state.baseDataLoading = false;
        state.baseData = action.payload;
      })
      .addCase(fetchCalculationBaseData.rejected, (state, action) => {
        state.baseDataLoading = false;
        state.error = action.payload;
      })
      .addCase(createQuoteCalculation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createQuoteCalculation.fulfilled, (state, action) => {
        state.loading = false;
        state.calculation = action.payload;
      })
      .addCase(createQuoteCalculation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // ✅ NUEVO: Casos para upsertQuoteCalculation
      .addCase(upsertQuoteCalculation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(upsertQuoteCalculation.fulfilled, (state, action) => {
        state.loading = false;
        state.calculation = action.payload;
      })
      .addCase(upsertQuoteCalculation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchQuoteCalculation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuoteCalculation.fulfilled, (state, action) => {
        state.loading = false;
        state.calculation = action.payload;
      })
      .addCase(fetchQuoteCalculation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // ✅ NUEVO: Casos para fetchQuoteCalculationByQuoteId
      .addCase(fetchQuoteCalculationByQuoteId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuoteCalculationByQuoteId.fulfilled, (state, action) => {
        state.loading = false;
        state.calculation = action.payload;
      })
      .addCase(fetchQuoteCalculationByQuoteId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(confirmQuoteCalculation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(confirmQuoteCalculation.fulfilled, (state, action) => {
        state.loading = false;
        state.calculation = action.payload;
      })
      .addCase(confirmQuoteCalculation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCalculation } = quoteCalculationSlice.actions;

// Selectors
export const selectCalculation = (state) => state.quoteCalculation.calculation;
export const selectCalculationLoading = (state) => state.quoteCalculation.loading;
export const selectCalculationError = (state) => state.quoteCalculation.error;
export const selectBaseData = (state) => state.quoteCalculation.baseData;

// ✅ NUEVO: Selectores calculados adicionales
export const selectCalculationItems = createSelector(
  selectCalculation,
  calculation => {
    if (!calculation) return [];
    
    // Extraer items desde la estructura JSONB del cálculo
    const items = [];
    
    // Tickets
    if (calculation.tiquetes && calculation.tiquetes.costo_total > 0) {
      items.push({
        tipo: 'tickets',
        descripcion: `Tickets ${calculation.tiquetes.origen || ''} - ${calculation.tiquetes.destino || ''}`,
        precio_total: calculation.tiquetes.costo_total,
        requiere_compra: true,
        prioridad: 'critica',
        detalles: calculation.tiquetes
      });
    }
    
    // Hotel
    if (calculation.hotel && calculation.hotel.costo_total > 0) {
      items.push({
        tipo: 'alojamiento',
        descripcion: `Alojamiento ${calculation.hotel.categoria || ''} - ${calculation.hotel.nombre || ''}`,
        precio_total: calculation.hotel.costo_total,
        requiere_compra: true,
        prioridad: 'alta',
        detalles: calculation.hotel
      });
    }
    
    // Traslados
    if (calculation.traslados && calculation.traslados.costo_total > 0) {
      items.push({
        tipo: 'traslados',
        descripcion: 'Traslados',
        precio_total: calculation.traslados.costo_total,
        requiere_compra: true,
        prioridad: 'media',
        detalles: calculation.traslados
      });
    }
    
    // Alimentación
    if (calculation.alimentacion && calculation.alimentacion.costo_total > 0) {
      items.push({
        tipo: 'alimentacion',
        descripcion: `Alimentación ${calculation.alimentacion.tipo || ''}`,
        precio_total: calculation.alimentacion.costo_total,
        requiere_compra: true,
        prioridad: 'media',
        detalles: calculation.alimentacion
      });
    }
    
    // Equipaje
    if (calculation.equipaje && calculation.equipaje.costo_total > 0) {
      items.push({
        tipo: 'equipaje',
        descripcion: 'Equipaje adicional',
        precio_total: calculation.equipaje.costo_total,
        requiere_compra: true,
        prioridad: 'baja',
        detalles: calculation.equipaje
      });
    }
    
    // Seguros
    if (calculation.seguros) {
      if (calculation.seguros.asistencia_medica && calculation.seguros.asistencia_medica.costo > 0) {
        items.push({
          tipo: 'seguro',
          descripcion: `Asistencia médica ${calculation.seguros.asistencia_medica.tipo || ''}`,
          precio_total: calculation.seguros.asistencia_medica.costo,
          requiere_compra: true,
          prioridad: 'alta',
          detalles: calculation.seguros.asistencia_medica
        });
      }
      
      if (calculation.seguros.cancelacion && calculation.seguros.cancelacion.costo > 0) {
        items.push({
          tipo: 'seguro',
          descripcion: 'Seguro de cancelación',
          precio_total: calculation.seguros.cancelacion.costo,
          requiere_compra: true,
          prioridad: 'media',
          detalles: calculation.seguros.cancelacion
        });
      }
    }
    
    // Excursiones
    if (calculation.excursiones && Array.isArray(calculation.excursiones)) {
      calculation.excursiones.forEach((excursion, index) => {
        if (excursion.costo > 0) {
          items.push({
            tipo: 'excursiones',
            descripcion: excursion.nombre || `Excursión ${index + 1}`,
            precio_total: excursion.costo,
            requiere_compra: true,
            prioridad: 'media',
            detalles: excursion
          });
        }
      });
    }
    
    // Extras
    if (calculation.extras && Array.isArray(calculation.extras)) {
      calculation.extras.forEach((extra, index) => {
        if (extra.costo > 0) {
          items.push({
            tipo: 'extras',
            descripcion: extra.nombre || `Extra ${index + 1}`,
            precio_total: extra.costo,
            requiere_compra: true,
            prioridad: 'baja',
            detalles: extra
          });
        }
      });
    }
    
    return items;
  }
);

export const selectItemsRequiringPurchase = createSelector(
  selectCalculationItems,
  items => items.filter(item => item.requiere_compra)
);

export const selectItemsRequiringPurchaseCount = createSelector(
  selectItemsRequiringPurchase,
  items => items.length
);

export const selectTotalPurchaseAmount = createSelector(
  selectItemsRequiringPurchase,
  items => items.reduce((total, item) => total + (parseFloat(item.precio_total) || 0), 0)
);

export const selectCriticalPurchaseItems = createSelector(
  selectItemsRequiringPurchase,
  items => items.filter(item => item.prioridad === 'critica')
);

export const selectHighPriorityPurchaseItems = createSelector(
  selectItemsRequiringPurchase,
  items => items.filter(item => ['critica', 'alta'].includes(item.prioridad))
);

export default quoteCalculationSlice.reducer;
// ✅ Exportar thunk nuevo
