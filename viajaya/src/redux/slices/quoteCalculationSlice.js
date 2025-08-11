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
      // ✅ NUEVO: Log para debugging de excursiones/extras en Redux
      console.log('🔍 REDUX SLICE - Datos enviados a backend:', {
        quote_id: data.quote_id,
        excursiones_presente: !!data.excursiones,
        excursiones_length: Array.isArray(data.excursiones) ? data.excursiones.length : 'NO ES ARRAY',
        extras_presente: !!data.extras,
        extras_length: Array.isArray(data.extras) ? data.extras.length : 'NO ES ARRAY',
        keys: Object.keys(data)
      });
      
      if (data.excursiones && Array.isArray(data.excursiones)) {
        console.log('🎯 REDUX - Excursiones detalle:', data.excursiones);
      }
      
      if (data.extras && Array.isArray(data.extras)) {
        console.log('🎪 REDUX - Extras detalle:', data.extras);
      }
      
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

export default quoteCalculationSlice.reducer;
// ✅ Exportar thunk nuevo
