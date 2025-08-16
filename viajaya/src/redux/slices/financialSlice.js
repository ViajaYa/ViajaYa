import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// 📊 ENDPOINT: Obtener resumen financiero general
export const fetchFinancialSummary = createAsyncThunk(
  'financial/fetchSummary',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/financial/summary`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al obtener resumen financiero');
      }

      const data = await response.json();
      return data; // Retorna toda la respuesta, no data.data
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 💰 ENDPOINT: Obtener listado de pagos con filtros
export const fetchPaymentsList = createAsyncThunk(
  'financial/fetchPayments',
  async ({ page = 1, limit = 10, contractId, dateRange } = {}, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(contractId && { contractId }),
        ...(dateRange && { dateRange })
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/financial/payments?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al obtener listado de pagos');
      }

      const data = await response.json();
      return data; // Retorna toda la respuesta que incluye payments y pagination
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 🛒 ENDPOINT: Obtener listado de compras con filtros
export const fetchPurchasesList = createAsyncThunk(
  'financial/fetchPurchases',
  async ({ page = 1, limit = 10, contractId, dateRange } = {}, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(contractId && { contractId }),
        ...(dateRange && { dateRange })
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/financial/purchases?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al obtener listado de compras');
      }

      const data = await response.json();
      return data; // Retorna toda la respuesta que incluye purchases y pagination
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 📈 ENDPOINT: Obtener análisis de ganancias por contrato
export const fetchProfitByContract = createAsyncThunk(
  'financial/fetchProfitByContract',
  async ({ contractId, dateRange } = {}, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const params = new URLSearchParams({
        ...(contractId && { contractId }),
        ...(dateRange && { dateRange })
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/financial/profit-by-contract?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al obtener análisis de ganancias');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  // 📊 RESUMEN FINANCIERO
  summary: {
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    monthlyData: [],
    loading: false,
    error: null
  },

  // 💰 LISTADO DE PAGOS
  payments: {
    data: [],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 10
    },
    filters: {
      contractId: '',
      dateRange: ''
    },
    loading: false,
    error: null
  },

  // 🛒 LISTADO DE COMPRAS
  purchases: {
    data: [],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 10
    },
    filters: {
      contractId: '',
      dateRange: ''
    },
    loading: false,
    error: null
  },

  // 📈 ANÁLISIS DE GANANCIAS
  profitAnalysis: {
    data: [],
    loading: false,
    error: null
  }
};

const financialSlice = createSlice({
  name: 'financial',
  initialState,
  reducers: {
    // 🔄 LIMPIAR ESTADOS
    clearFinancialData: (state) => {
      state.summary = initialState.summary;
      state.payments = initialState.payments;
      state.purchases = initialState.purchases;
      state.profitAnalysis = initialState.profitAnalysis;
    },

    // 🔍 ACTUALIZAR FILTROS DE PAGOS
    updatePaymentsFilters: (state, action) => {
      state.payments.filters = { ...state.payments.filters, ...action.payload };
    },

    // 🔍 ACTUALIZAR FILTROS DE COMPRAS
    updatePurchasesFilters: (state, action) => {
      state.purchases.filters = { ...state.purchases.filters, ...action.payload };
    },

    // 📄 ACTUALIZAR PÁGINA DE PAGOS
    updatePaymentsPage: (state, action) => {
      state.payments.pagination.currentPage = action.payload;
    },

    // 📄 ACTUALIZAR PÁGINA DE COMPRAS
    updatePurchasesPage: (state, action) => {
      state.purchases.pagination.currentPage = action.payload;
    }
  },
  extraReducers: (builder) => {
    // 📊 RESUMEN FINANCIERO
    builder
      .addCase(fetchFinancialSummary.pending, (state) => {
        state.summary.loading = true;
        state.summary.error = null;
      })
      .addCase(fetchFinancialSummary.fulfilled, (state, action) => {
        state.summary.loading = false;
        const summary = action.payload.summary;
        state.summary = {
          ...state.summary,
          totalIncome: summary.metricas?.total_ingresos || 0,
          totalExpenses: summary.metricas?.total_gastos || 0,
          netProfit: summary.metricas?.ganancia_neta || 0,
          profitMargin: parseFloat(summary.metricas?.margen_ganancia || 0),
          monthlyData: (summary.datos_mensuales || []).map(item => ({
            month: item.mes,
            income: item.ingresos || 0,
            expenses: item.gastos || 0,
            paymentCount: item.cantidad_pagos || 0,
            purchaseCount: item.cantidad_compras || 0
          })),
          loading: false,
          error: null
        };
      })
      .addCase(fetchFinancialSummary.rejected, (state, action) => {
        state.summary.loading = false;
        state.summary.error = action.payload;
      })

      // 💰 LISTADO DE PAGOS
      .addCase(fetchPaymentsList.pending, (state) => {
        state.payments.loading = true;
        state.payments.error = null;
      })
      .addCase(fetchPaymentsList.fulfilled, (state, action) => {
        state.payments.loading = false;
        state.payments.data = action.payload.payments || [];
        state.payments.pagination = {
          currentPage: action.payload.currentPage || 1,
          totalPages: action.payload.totalPages || 1,
          totalItems: action.payload.totalItems || 0,
          itemsPerPage: action.payload.itemsPerPage || 10
        };
      })
      .addCase(fetchPaymentsList.rejected, (state, action) => {
        state.payments.loading = false;
        state.payments.error = action.payload;
      })

      // 🛒 LISTADO DE COMPRAS
      .addCase(fetchPurchasesList.pending, (state) => {
        state.purchases.loading = true;
        state.purchases.error = null;
      })
      .addCase(fetchPurchasesList.fulfilled, (state, action) => {
        state.purchases.loading = false;
        state.purchases.data = action.payload.purchases || [];
        state.purchases.pagination = {
          currentPage: action.payload.currentPage || 1,
          totalPages: action.payload.totalPages || 1,
          totalItems: action.payload.totalItems || 0,
          itemsPerPage: action.payload.itemsPerPage || 10
        };
      })
      .addCase(fetchPurchasesList.rejected, (state, action) => {
        state.purchases.loading = false;
        state.purchases.error = action.payload;
      })

      // 📈 ANÁLISIS DE GANANCIAS
      .addCase(fetchProfitByContract.pending, (state) => {
        state.profitAnalysis.loading = true;
        state.profitAnalysis.error = null;
      })
      .addCase(fetchProfitByContract.fulfilled, (state, action) => {
        state.profitAnalysis.loading = false;
        state.profitAnalysis.data = action.payload || [];
      })
      .addCase(fetchProfitByContract.rejected, (state, action) => {
        state.profitAnalysis.loading = false;
        state.profitAnalysis.error = action.payload;
      });
  }
});

export const {
  clearFinancialData,
  updatePaymentsFilters,
  updatePurchasesFilters,
  updatePaymentsPage,
  updatePurchasesPage
} = financialSlice.actions;

export default financialSlice.reducer;
