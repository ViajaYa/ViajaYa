import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getApiUrl } from '../../utils/env';

// Estado inicial
const initialState = {
  commissions: [],
  userCommissions: [],
  totalCommissions: 0,
  currentCommission: null,
  loading: false,
  error: null,
  filters: {
    startDate: null,
    endDate: null,
    status: 'all',
    userId: null,
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
};

// Thunks asíncronos
export const fetchCommissions = createAsyncThunk(
  'commission/fetchCommissions',
  async ({ page = 1, limit = 10, filters = {} }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters,
      });

      const response = await fetch(getApiUrl(`/api/commissions?${queryParams}`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error obteniendo comisiones');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const fetchUserCommissions = createAsyncThunk(
  'commission/fetchUserCommissions',
  async ({ userId, page = 1, limit = 10 }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(getApiUrl(`/api/commissions/user/${userId}?${queryParams}`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error obteniendo comisiones del usuario');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const createCommission = createAsyncThunk(
  'commission/createCommission',
  async (commissionData, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl('/api/commissions'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commissionData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error creando comisión');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const updateCommission = createAsyncThunk(
  'commission/updateCommission',
  async ({ id, updates }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl(`/api/commissions/${id}`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error actualizando comisión');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const deleteCommission = createAsyncThunk(
  'commission/deleteCommission',
  async (id, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl(`/api/commissions/${id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        return rejectWithValue(data.message || 'Error eliminando comisión');
      }

      return id;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const calculateCommissions = createAsyncThunk(
  'commission/calculateCommissions',
  async ({ startDate, endDate }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl('/api/commissions/calculate'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ startDate, endDate }),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error calculando comisiones');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const payCommission = createAsyncThunk(
  'commission/payCommission',
  async ({ id, paymentData }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl(`/api/commissions/${id}/pay`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error procesando pago de comisión');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

// Slice
const commissionSlice = createSlice({
  name: 'commission',
  initialState,
  reducers: {
    clearCommissionError: (state) => {
      state.error = null;
    },
    setCurrentCommission: (state, action) => {
      state.currentCommission = action.payload;
    },
    clearCurrentCommission: (state) => {
      state.currentCommission = null;
    },
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        startDate: null,
        endDate: null,
        status: 'all',
        userId: null,
      };
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    resetCommissions: (state) => {
      state.commissions = [];
      state.userCommissions = [];
      state.totalCommissions = 0;
      state.currentCommission = null;
      state.pagination = {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Commissions
      .addCase(fetchCommissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCommissions.fulfilled, (state, action) => {
        state.loading = false;
        state.commissions = action.payload.commissions || [];
        state.totalCommissions = action.payload.total || 0;
        state.pagination = {
          ...state.pagination,
          page: action.payload.page || 1,
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 0,
        };
      })
      .addCase(fetchCommissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch User Commissions
      .addCase(fetchUserCommissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserCommissions.fulfilled, (state, action) => {
        state.loading = false;
        state.userCommissions = action.payload.commissions || [];
        state.pagination = {
          ...state.pagination,
          page: action.payload.page || 1,
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 0,
        };
      })
      .addCase(fetchUserCommissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Commission
      .addCase(createCommission.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCommission.fulfilled, (state, action) => {
        state.loading = false;
        state.commissions.unshift(action.payload);
        state.totalCommissions += 1;
      })
      .addCase(createCommission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Commission
      .addCase(updateCommission.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCommission.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.commissions.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.commissions[index] = action.payload;
        }
        if (state.currentCommission?.id === action.payload.id) {
          state.currentCommission = action.payload;
        }
      })
      .addCase(updateCommission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Commission
      .addCase(deleteCommission.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCommission.fulfilled, (state, action) => {
        state.loading = false;
        state.commissions = state.commissions.filter(c => c.id !== action.payload);
        state.totalCommissions -= 1;
        if (state.currentCommission?.id === action.payload) {
          state.currentCommission = null;
        }
      })
      .addCase(deleteCommission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Calculate Commissions
      .addCase(calculateCommissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(calculateCommissions.fulfilled, (state, action) => {
        state.loading = false;
        // Agregar las nuevas comisiones calculadas
        if (action.payload.commissions) {
          state.commissions = [...state.commissions, ...action.payload.commissions];
          state.totalCommissions += action.payload.commissions.length;
        }
      })
      .addCase(calculateCommissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Pay Commission
      .addCase(payCommission.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(payCommission.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.commissions.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.commissions[index] = action.payload;
        }
        if (state.currentCommission?.id === action.payload.id) {
          state.currentCommission = action.payload;
        }
      })
      .addCase(payCommission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Exportar acciones
export const {
  clearCommissionError,
  setCurrentCommission,
  clearCurrentCommission,
  updateFilters,
  clearFilters,
  setPagination,
  resetCommissions,
} = commissionSlice.actions;

// Selectores
export const selectCommissions = (state) => state.commission.commissions;
export const selectUserCommissions = (state) => state.commission.userCommissions;
export const selectTotalCommissions = (state) => state.commission.totalCommissions;
export const selectCurrentCommission = (state) => state.commission.currentCommission;
export const selectCommissionLoading = (state) => state.commission.loading;
export const selectCommissionError = (state) => state.commission.error;
export const selectCommissionFilters = (state) => state.commission.filters;
export const selectCommissionPagination = (state) => state.commission.pagination;

// Exportar el reducer
export default commissionSlice.reducer;