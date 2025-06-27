import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getApiUrl } from '../../utils/env';

// Estado inicial
const initialState = {
  stats: {
    totalUsers: 0,
    totalQuotes: 0,
    totalContracts: 0,
    totalRevenue: 0,
    activePackages: 0,
    pendingPayments: 0,
    monthlyRevenue: 0,
    monthlyQuotes: 0,
  },
  recentActivities: [],
  topSellers: [],
  revenueChart: {
    labels: [],
    data: [],
  },
  quotesChart: {
    labels: [],
    data: [],
  },
  packageStats: [],
  userPerformance: [],
  monthlyComparisons: {
    revenue: { current: 0, previous: 0, percentage: 0 },
    quotes: { current: 0, previous: 0, percentage: 0 },
    users: { current: 0, previous: 0, percentage: 0 },
  },
  notifications: {
    unread: 0,
    urgent: 0,
    recent: [],
  },
  loading: false,
  error: null,
  lastUpdated: null,
  dateRange: {
    startDate: null,
    endDate: null,
  },
};

// Thunks asíncronos
export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchDashboardStats',
  async ({ startDate, endDate }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const queryParams = new URLSearchParams();
      
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);

      const response = await fetch(getApiUrl(`/api/dashboard/stats?${queryParams}`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error obteniendo estadísticas del dashboard');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const fetchRecentActivities = createAsyncThunk(
  'dashboard/fetchRecentActivities',
  async ({ limit = 10 }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl(`/api/dashboard/activities?limit=${limit}`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error obteniendo actividades recientes');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const fetchTopSellers = createAsyncThunk(
  'dashboard/fetchTopSellers',
  async ({ limit = 5, period = 'month' }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl(`/api/dashboard/top-sellers?limit=${limit}&period=${period}`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error obteniendo top vendedores');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const fetchRevenueChart = createAsyncThunk(
  'dashboard/fetchRevenueChart',
  async ({ period = 'month', year = new Date().getFullYear() }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl(`/api/dashboard/revenue-chart?period=${period}&year=${year}`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error obteniendo gráfico de ingresos');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const fetchQuotesChart = createAsyncThunk(
  'dashboard/fetchQuotesChart',
  async ({ period = 'month', year = new Date().getFullYear() }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl(`/api/dashboard/quotes-chart?period=${period}&year=${year}`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error obteniendo gráfico de cotizaciones');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const fetchPackageStats = createAsyncThunk(
  'dashboard/fetchPackageStats',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl('/api/dashboard/package-stats'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error obteniendo estadísticas de paquetes');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const fetchUserPerformance = createAsyncThunk(
  'dashboard/fetchUserPerformance',
  async ({ period = 'month' }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl(`/api/dashboard/user-performance?period=${period}`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error obteniendo rendimiento de usuarios');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const fetchMonthlyComparisons = createAsyncThunk(
  'dashboard/fetchMonthlyComparisons',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl('/api/dashboard/monthly-comparisons'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error obteniendo comparaciones mensuales');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const refreshDashboard = createAsyncThunk(
  'dashboard/refreshDashboard',
  async (filters, { dispatch }) => {
    await Promise.all([
      dispatch(fetchDashboardStats(filters || {})),
      dispatch(fetchRecentActivities({ limit: 10 })),
      dispatch(fetchTopSellers({ limit: 5 })),
      dispatch(fetchRevenueChart({})),
      dispatch(fetchQuotesChart({})),
      dispatch(fetchPackageStats()),
      dispatch(fetchUserPerformance({})),
      dispatch(fetchMonthlyComparisons()),
    ]);

    return { refreshed: true, timestamp: new Date().toISOString() };
  }
);

// Slice
const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearDashboardError: (state) => {
      state.error = null;
    },
    setDateRange: (state, action) => {
      state.dateRange = action.payload;
    },
    clearDateRange: (state) => {
      state.dateRange = {
        startDate: null,
        endDate: null,
      };
    },
    updateStats: (state, action) => {
      state.stats = { ...state.stats, ...action.payload };
    },
    addRecentActivity: (state, action) => {
      state.recentActivities.unshift(action.payload);
      // Mantener solo los últimos 20
      if (state.recentActivities.length > 20) {
        state.recentActivities = state.recentActivities.slice(0, 20);
      }
    },
    markNotificationsAsRead: (state) => {
      state.notifications.unread = 0;
      state.notifications.recent = state.notifications.recent.map(notif => ({
        ...notif,
        read: true
      }));
    },
    resetDashboard: () => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Dashboard Stats
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload.stats || state.stats;
        state.notifications = action.payload.notifications || state.notifications;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Recent Activities
      .addCase(fetchRecentActivities.fulfilled, (state, action) => {
        state.recentActivities = action.payload;
      })
      // Fetch Top Sellers
      .addCase(fetchTopSellers.fulfilled, (state, action) => {
        state.topSellers = action.payload;
      })
      // Fetch Revenue Chart
      .addCase(fetchRevenueChart.fulfilled, (state, action) => {
        state.revenueChart = action.payload;
      })
      // Fetch Quotes Chart
      .addCase(fetchQuotesChart.fulfilled, (state, action) => {
        state.quotesChart = action.payload;
      })
      // Fetch Package Stats
      .addCase(fetchPackageStats.fulfilled, (state, action) => {
        state.packageStats = action.payload;
      })
      // Fetch User Performance
      .addCase(fetchUserPerformance.fulfilled, (state, action) => {
        state.userPerformance = action.payload;
      })
      // Fetch Monthly Comparisons
      .addCase(fetchMonthlyComparisons.fulfilled, (state, action) => {
        state.monthlyComparisons = action.payload;
      })
      // Refresh Dashboard
      .addCase(refreshDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(refreshDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.lastUpdated = action.payload.timestamp;
      })
      .addCase(refreshDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Exportar acciones
export const {
  clearDashboardError,
  setDateRange,
  clearDateRange,
  updateStats,
  addRecentActivity,
  markNotificationsAsRead,
  resetDashboard,
} = dashboardSlice.actions;

// Selectores
export const selectDashboardStats = (state) => state.dashboard.stats;
export const selectRecentActivities = (state) => state.dashboard.recentActivities;
export const selectTopSellers = (state) => state.dashboard.topSellers;
export const selectRevenueChart = (state) => state.dashboard.revenueChart;
export const selectQuotesChart = (state) => state.dashboard.quotesChart;
export const selectPackageStats = (state) => state.dashboard.packageStats;
export const selectUserPerformance = (state) => state.dashboard.userPerformance;
export const selectMonthlyComparisons = (state) => state.dashboard.monthlyComparisons;
export const selectDashboardNotifications = (state) => state.dashboard.notifications;
export const selectDashboardLoading = (state) => state.dashboard.loading;
export const selectDashboardError = (state) => state.dashboard.error;
export const selectDashboardLastUpdated = (state) => state.dashboard.lastUpdated;
export const selectDashboardDateRange = (state) => state.dashboard.dateRange;

// Exportar el reducer
export default dashboardSlice.reducer;