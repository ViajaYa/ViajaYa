import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getApiUrl } from '../../utils/env';

// Estado inicial
const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  filters: {
    type: 'all',
    read: 'all',
    priority: 'all',
  },
  preferences: {
    email: true,
    push: true,
    sms: false,
    quotesUpdates: true,
    paymentReminders: true,
    systemAlerts: true,
    marketingEmails: false,
  },
  realTimeEnabled: false,
};

// Tipos de notificaciones
export const NOTIFICATION_TYPES = {
  QUOTE_CREATED: 'quote_created',
  QUOTE_UPDATED: 'quote_updated',
  QUOTE_APPROVED: 'quote_approved',
  QUOTE_REJECTED: 'quote_rejected',
  PAYMENT_RECEIVED: 'payment_received',
  PAYMENT_OVERDUE: 'payment_overdue',
  CONTRACT_SIGNED: 'contract_signed',
  USER_REGISTERED: 'user_registered',
  SYSTEM_ALERT: 'system_alert',
  COMMISSION_CALCULATED: 'commission_calculated',
  PACKAGE_UPDATED: 'package_updated',
};

// Thunks asíncronos
export const fetchNotifications = createAsyncThunk(
  'notification/fetchNotifications',
  async ({ page = 1, limit = 20, filters = {} }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters,
      });

      const response = await fetch(getApiUrl(`/api/notifications?${queryParams}`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error obteniendo notificaciones');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const markAsRead = createAsyncThunk(
  'notification/markAsRead',
  async (notificationId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl(`/api/notifications/${notificationId}/read`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error marcando notificación como leída');
      }

      return { id: notificationId, ...data };
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const markAllAsRead = createAsyncThunk(
  'notification/markAllAsRead',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl('/api/notifications/mark-all-read'), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error marcando todas las notificaciones como leídas');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const deleteNotification = createAsyncThunk(
  'notification/deleteNotification',
  async (notificationId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl(`/api/notifications/${notificationId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        return rejectWithValue(data.message || 'Error eliminando notificación');
      }

      return notificationId;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const createNotification = createAsyncThunk(
  'notification/createNotification',
  async (notificationData, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl('/api/notifications'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error creando notificación');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const updateNotificationPreferences = createAsyncThunk(
  'notification/updateNotificationPreferences',
  async (preferences, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl('/api/notifications/preferences'), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error actualizando preferencias');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const getNotificationPreferences = createAsyncThunk(
  'notification/getNotificationPreferences',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl('/api/notifications/preferences'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error obteniendo preferencias');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const sendBulkNotification = createAsyncThunk(
  'notification/sendBulkNotification',
  async ({ userIds, notificationData }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl('/api/notifications/bulk'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds,
          ...notificationData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error enviando notificaciones masivas');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

// Slice
const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    clearNotificationError: (state) => {
      state.error = null;
    },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.read) {
        state.unreadCount += 1;
      }
    },
    removeNotification: (state, action) => {
      const index = state.notifications.findIndex(n => n.id === action.payload);
      if (index !== -1) {
        const notification = state.notifications[index];
        if (!notification.read) {
          state.unreadCount -= 1;
        }
        state.notifications.splice(index, 1);
      }
    },
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        type: 'all',
        read: 'all',
        priority: 'all',
      };
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    toggleRealTime: (state) => {
      state.realTimeEnabled = !state.realTimeEnabled;
    },
    setRealTime: (state, action) => {
      state.realTimeEnabled = action.payload;
    },
    updatePreferences: (state, action) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    resetNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      state.pagination = {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.notifications || [];
        state.unreadCount = action.payload.unreadCount || 0;
        state.pagination = {
          ...state.pagination,
          page: action.payload.page || 1,
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 0,
        };
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Mark As Read
      .addCase(markAsRead.fulfilled, (state, action) => {
        const index = state.notifications.findIndex(n => n.id === action.payload.id);
        if (index !== -1) {
          state.notifications[index].read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      // Mark All As Read
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications = state.notifications.map(n => ({ ...n, read: true }));
        state.unreadCount = 0;
      })
      // Delete Notification
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const index = state.notifications.findIndex(n => n.id === action.payload);
        if (index !== -1) {
          const notification = state.notifications[index];
          if (!notification.read) {
            state.unreadCount -= 1;
          }
          state.notifications.splice(index, 1);
        }
      })
      // Create Notification
      .addCase(createNotification.fulfilled, (state, action) => {
        state.notifications.unshift(action.payload);
        if (!action.payload.read) {
          state.unreadCount += 1;
        }
      })
      // Update Notification Preferences
      .addCase(updateNotificationPreferences.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateNotificationPreferences.fulfilled, (state, action) => {
        state.loading = false;
        state.preferences = action.payload;
      })
      .addCase(updateNotificationPreferences.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Notification Preferences
      .addCase(getNotificationPreferences.fulfilled, (state, action) => {
        state.preferences = action.payload;
      })
      // Send Bulk Notification
      .addCase(sendBulkNotification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendBulkNotification.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(sendBulkNotification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Exportar acciones
export const {
  clearNotificationError,
  addNotification,
  removeNotification,
  updateFilters,
  clearFilters,
  setPagination,
  toggleRealTime,
  setRealTime,
  updatePreferences,
  resetNotifications,
} = notificationSlice.actions;

// Selectores
export const selectNotifications = (state) => state.notification.notifications;
export const selectUnreadCount = (state) => state.notification.unreadCount;
export const selectNotificationLoading = (state) => state.notification.loading;
export const selectNotificationError = (state) => state.notification.error;
export const selectNotificationFilters = (state) => state.notification.filters;
export const selectNotificationPagination = (state) => state.notification.pagination;
export const selectNotificationPreferences = (state) => state.notification.preferences;
export const selectRealTimeEnabled = (state) => state.notification.realTimeEnabled;

// Selectores adicionales
export const selectUnreadNotifications = (state) =>
  state.notification.notifications.filter(n => !n.read);

export const selectNotificationsByType = (type) => (state) =>
  state.notification.notifications.filter(n => n.type === type);

export const selectUrgentNotifications = (state) =>
  state.notification.notifications.filter(n => n.priority === 'urgent' && !n.read);

// Exportar el reducer
export default notificationSlice.reducer;