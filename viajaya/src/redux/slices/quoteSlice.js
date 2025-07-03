import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getApiUrl } from '../../utils/env';

// Estado inicial actualizado
const initialState = {
  quotes: [],
  externalQuotes: [], // ✅ NUEVO: Para cotizaciones externas
  currentQuote: null,
  loading: false,
  error: null,
  filters: {
    status: 'all',
    cliente_id: null,
    asesor_id: null,
    lider_id: null,
    gerente_id: null,
    admin_id: null, // ✅ NUEVO: Filtro para admin
    is_external: null, // ✅ NUEVO: Filtro para externas
    priority: null, // ✅ NUEVO: Filtro por prioridad
    source: null, // ✅ NUEVO: Filtro por origen
    startDate: null,
    endDate: null,
    priceRange: {
      min: null,
      max: null,
    },
    destino: '',
    origen: '',
    acomodacion: 'all',
    numero_personas: null,
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  externalPagination: { // ✅ NUEVO: Paginación para externas
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  stats: {
    totalQuotes: 0,
    pendingQuotes: 0,
    completedQuotes: 0,
    sentQuotes: 0,
    approvedQuotes: 0,
    rejectedQuotes: 0,
    requoteQuotes: 0,
    expiredQuotes: 0,
    convertedQuotes: 0,
    externalQuotes: 0, // ✅ NUEVO: Contador de externas
    totalValue: 0,
    averageValue: 0,
  },
  quoteTemplates: [],
  searchHistory: [],
  assignmentHistory: [], // ✅ NUEVO: Historial de asignaciones
};

// ✅ Estados de cotización actualizados
export const QUOTE_STATUSES = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  SENT: 'sent',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  REQUOTE: 'requote',
  EXPIRED: 'expired',
  CONVERTED: 'converted',
};

// ✅ NUEVO: Tipos de origen de cotización
export const QUOTE_SOURCES = {
  INTERNAL: 'internal',
  EXTERNAL: 'external',
};

// ✅ NUEVO: Niveles de prioridad
export const QUOTE_PRIORITIES = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
};

// ===== THUNKS EXISTENTES ACTUALIZADOS =====

export const fetchQuotes = createAsyncThunk(
  'quote/fetchQuotes',
  async ({ page = 1, limit = 10, filters = {} }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      
      // ✅ ACTUALIZADO: Incluir nuevos filtros
      Object.entries(filters).forEach(([key, value]) => {
        if (
          value !== null && 
          value !== undefined && 
          value !== 'all' && 
          value !== '' && 
          typeof value !== 'object' &&
          value.toString().trim() !== ''
        ) {
          queryParams.append(key, value.toString());
        }
      });

      const url = getApiUrl(`/quotes?${queryParams}`);
      console.log('🔍 fetchQuotes - URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('🔍 fetchQuotes - Response:', data);

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error obteniendo cotizaciones');
      }

      return {
        quotes: data.quotes || [],
        total: data.total || 0,
        totalPages: data.totalPages || 0,
        currentPage: data.currentPage || page,
      };
    } catch (error) {
      console.error('❌ fetchQuotes error:', error);
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

// ===== NUEVOS THUNKS =====

// ✅ NUEVO: Crear cotización externa
export const createExternalQuote = createAsyncThunk(
  'quote/createExternalQuote',
  async (quoteData, { rejectWithValue }) => {
    try {
      console.log('🔍 createExternalQuote - Data:', quoteData);

      const response = await fetch(getApiUrl('/quotes/external'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quoteData),
      });

      const data = await response.json();
      console.log('🔍 createExternalQuote - Response:', data);

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error creando cotización externa');
      }

      return data.quote || data;
    } catch (error) {
      console.error('❌ createExternalQuote error:', error);
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

// ✅ NUEVO: Crear cotización desde usuario autenticado
export const createQuoteFromUser = createAsyncThunk(
  'quote/createQuoteFromUser',
  async ({ userId, quoteData }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      
      console.log('🔍 createQuoteFromUser - UserId:', userId, 'Data:', quoteData);

      const response = await fetch(getApiUrl(`/quotes/user/${userId}`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quoteData),
      });

      const data = await response.json();
      console.log('🔍 createQuoteFromUser - Response:', data);

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error creando cotización');
      }

      return data.quote || data;
    } catch (error) {
      console.error('❌ createQuoteFromUser error:', error);
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

// ✅ NUEVO: Obtener cotizaciones externas
export const fetchExternalQuotes = createAsyncThunk(
  'quote/fetchExternalQuotes',
  async ({ page = 1, limit = 10, owner_only = true }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      queryParams.append('owner_only', owner_only.toString());

      const url = getApiUrl(`/quotes/external/list?${queryParams}`);
      console.log('🔍 fetchExternalQuotes - URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('🔍 fetchExternalQuotes - Response:', data);

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error obteniendo cotizaciones externas');
      }

      return {
        quotes: data.quotes || [],
        total: data.total || 0,
        totalPages: data.totalPages || 0,
        currentPage: data.currentPage || page,
        type: data.type || 'external_quotes',
      };
    } catch (error) {
      console.error('❌ fetchExternalQuotes error:', error);
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

// ✅ NUEVO: Reasignar cotización externa
export const reassignExternalQuote = createAsyncThunk(
  'quote/reassignExternalQuote',
  async ({ quoteId, assignmentData }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      
      console.log('🔍 reassignExternalQuote - ID:', quoteId, 'Data:', assignmentData);

      const response = await fetch(getApiUrl(`/quotes/${quoteId}/reassign`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assignmentData),
      });

      const data = await response.json();
      console.log('🔍 reassignExternalQuote - Response:', data);

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error reasignando cotización');
      }

      return data.quote || data;
    } catch (error) {
      console.error('❌ reassignExternalQuote error:', error);
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

// ✅ NUEVO: Obtener cotizaciones por usuario
export const fetchQuotesByUser = createAsyncThunk(
  'quote/fetchQuotesByUser',
  async ({ userId, page = 1, limit = 10, status }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      if (status) queryParams.append('status', status);

      const url = getApiUrl(`/quotes/user/${userId}?${queryParams}`);
      console.log('🔍 fetchQuotesByUser - URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('🔍 fetchQuotesByUser - Response:', data);

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error obteniendo cotizaciones del usuario');
      }

      return {
        quotes: data.quotes || [],
        total: data.total || 0,
        totalPages: data.totalPages || 0,
        currentPage: data.currentPage || page,
        userRole: data.userRole,
      };
    } catch (error) {
      console.error('❌ fetchQuotesByUser error:', error);
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

// ✅ NUEVO: Obtener cotizaciones por vendedor
export const fetchQuotesByVendedor = createAsyncThunk(
  'quote/fetchQuotesByVendedor',
  async ({ vendedorId, tipo, page = 1, limit = 10, status }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      if (status) queryParams.append('status', status);

      const url = getApiUrl(`/quotes/vendedor/${vendedorId}/${tipo}?${queryParams}`);
      console.log('🔍 fetchQuotesByVendedor - URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('🔍 fetchQuotesByVendedor - Response:', data);

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error obteniendo cotizaciones del vendedor');
      }

      return {
        quotes: data.quotes || [],
        total: data.total || 0,
        totalPages: data.totalPages || 0,
        currentPage: data.currentPage || page,
        vendedorId,
        tipo,
      };
    } catch (error) {
      console.error('❌ fetchQuotesByVendedor error:', error);
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

// ✅ NUEVO: Marcar cotizaciones expiradas
export const markExpiredQuotes = createAsyncThunk(
  'quote/markExpiredQuotes',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      
      console.log('🔍 markExpiredQuotes - Processing...');

      const response = await fetch(getApiUrl('/quotes/mark-expired'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('🔍 markExpiredQuotes - Response:', data);

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error marcando cotizaciones expiradas');
      }

      return {
        count: data.count || 0,
        message: data.message,
      };
    } catch (error) {
      console.error('❌ markExpiredQuotes error:', error);
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

// ===== THUNKS EXISTENTES (mantener todos los anteriores) =====
export const fetchQuoteById = createAsyncThunk(
  'quote/fetchQuoteById',
  async (quoteId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl(`/quotes/${quoteId}`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('🔍 fetchQuoteById - Response:', data);

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error obteniendo cotización');
      }

      return data.quote || data;
    } catch (error) {
      console.error('❌ fetchQuoteById error:', error);
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const createQuote = createAsyncThunk(
  'quote/createQuote',
  async (quoteData, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const headers = {
        'Content-Type': 'application/json',
      };
      if (auth.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      }

      console.log('🔍 createQuote - Data:', quoteData);

      const response = await fetch(getApiUrl('/quotes'), {
        method: 'POST',
        headers,
        body: JSON.stringify(quoteData),
      });

      const data = await response.json();
      console.log('🔍 createQuote - Response:', data);

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error creando cotización');
      }

      return data.quote || data;
    } catch (error) {
      console.error('❌ createQuote error:', error);
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const updateQuote = createAsyncThunk(
  'quote/updateQuote',
  async ({ id, updates }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      
      console.log('🔍 updateQuote - ID:', id, 'Updates:', updates);

      const response = await fetch(getApiUrl(`/quotes/${id}`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      console.log('🔍 updateQuote - Response:', data);

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error actualizando cotización');
      }

      return data.quote || data;
    } catch (error) {
      console.error('❌ updateQuote error:', error);
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

// ✅ ACTUALIZAR: sendQuoteToClient con nueva ruta
export const sendQuoteToClient = createAsyncThunk(
  'quote/sendQuoteToClient',
  async (quoteId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      
      console.log('🔍 sendQuoteToClient - ID:', quoteId);

      const response = await fetch(getApiUrl(`/quotes/${quoteId}/send`), {
        method: 'PATCH', // ✅ Cambiar a PATCH según las rutas
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('🔍 sendQuoteToClient - Response:', data);

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error enviando cotización al cliente');
      }

      return data.quote || data;
    } catch (error) {
      console.error('❌ sendQuoteToClient error:', error);
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

// ✅ ACTUALIZAR: approveQuote con nueva ruta
export const approveQuote = createAsyncThunk(
  'quote/approveQuote',
  async ({ quoteId, approvalData = {} }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      
      console.log('🔍 approveQuote - ID:', quoteId, 'Data:', approvalData);

      const response = await fetch(getApiUrl(`/quotes/${quoteId}/approve`), {
        method: 'PATCH', // ✅ Cambiar a PATCH según las rutas
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(approvalData),
      });

      const data = await response.json();
      console.log('🔍 approveQuote - Response:', data);

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error aprobando cotización');
      }

      return data.quote || data;
    } catch (error) {
      console.error('❌ approveQuote error:', error);
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

// ✅ ACTUALIZAR: rejectQuote con nueva ruta
export const rejectQuote = createAsyncThunk(
  'quote/rejectQuote',
  async ({ quoteId, reason }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      
      console.log('🔍 rejectQuote - ID:', quoteId, 'Reason:', reason);

      const response = await fetch(getApiUrl(`/quotes/${quoteId}/reject`), {
        method: 'PATCH', // ✅ Cambiar a PATCH según las rutas
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ motivo_rechazo: reason }),
      });

      const data = await response.json();
      console.log('🔍 rejectQuote - Response:', data);

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error rechazando cotización');
      }

      return data.quote || data;
    } catch (error) {
      console.error('❌ rejectQuote error:', error);
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const requestRequote = createAsyncThunk(
  'quote/requestRequote',
  async ({ quoteId, requote_reason }, { rejectWithValue }) => {
    try {
      console.log('🔍 requestRequote - ID:', quoteId, 'Reason:', requote_reason);

      const response = await fetch(getApiUrl(`/quotes/${quoteId}/requote`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requote_reason }),
      });

      const data = await response.json();
      console.log('🔍 requestRequote - Response:', data);

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error solicitando recotización');
      }

      return data.quote || data;
    } catch (error) {
      console.error('❌ requestRequote error:', error);
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

// ===== SLICE ACTUALIZADO =====
const quoteSlice = createSlice({
  name: 'quote',
  initialState,
  reducers: {
    clearQuoteError: (state) => {
      state.error = null;
    },
    setCurrentQuote: (state, action) => {
      state.currentQuote = action.payload;
    },
    clearCurrentQuote: (state) => {
      state.currentQuote = null;
    },
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        status: 'all',
        cliente_id: null,
        asesor_id: null,
        lider_id: null,
        gerente_id: null,
        admin_id: null, // ✅ NUEVO
        is_external: null, // ✅ NUEVO
        priority: null, // ✅ NUEVO
        source: null, // ✅ NUEVO
        startDate: null,
        endDate: null,
        priceRange: {
          min: null,
          max: null,
        },
        destino: '',
        origen: '',
        acomodacion: 'all',
        numero_personas: null,
      };
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    // ✅ NUEVO: Setter para paginación de externas
    setExternalPagination: (state, action) => {
      state.externalPagination = { ...state.externalPagination, ...action.payload };
    },
    updateQuoteStatus: (state, action) => {
      const { quoteId, status } = action.payload;
      const quote = state.quotes.find(q => q.id === quoteId);
      if (quote) {
        quote.status = status;
        quote.updated_at = new Date().toISOString();
      }
      if (state.currentQuote?.id === quoteId) {
        state.currentQuote.status = status;
        state.currentQuote.updated_at = new Date().toISOString();
      }
      // ✅ También actualizar en externas
      const externalQuote = state.externalQuotes.find(q => q.id === quoteId);
      if (externalQuote) {
        externalQuote.status = status;
        externalQuote.updated_at = new Date().toISOString();
      }
    },
    // ✅ NUEVO: Mover cotización de externas a regulares tras reasignación
    moveQuoteFromExternal: (state, action) => {
      const { quoteId } = action.payload;
      const externalIndex = state.externalQuotes.findIndex(q => q.id === quoteId);
      if (externalIndex !== -1) {
        const quote = state.externalQuotes[externalIndex];
        state.externalQuotes.splice(externalIndex, 1);
        state.quotes.unshift(quote);
      }
    },
    addToSearchHistory: (state, action) => {
      const searchTerm = action.payload;
      if (searchTerm && !state.searchHistory.includes(searchTerm)) {
        state.searchHistory.unshift(searchTerm);
        if (state.searchHistory.length > 10) {
          state.searchHistory = state.searchHistory.slice(0, 10);
        }
      }
    },
    clearSearchHistory: (state) => {
      state.searchHistory = [];
    },
    resetQuotes: (state) => {
      state.quotes = [];
      state.externalQuotes = [];
      state.currentQuote = null;
      state.pagination = {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      };
      state.externalPagination = {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      };
    },
    optimisticUpdateQuote: (state, action) => {
      const { id, updates } = action.payload;
      const index = state.quotes.findIndex(q => q.id === id);
      if (index !== -1) {
        state.quotes[index] = { ...state.quotes[index], ...updates };
      }
      if (state.currentQuote?.id === id) {
        state.currentQuote = { ...state.currentQuote, ...updates };
      }
      // ✅ También actualizar en externas
      const externalIndex = state.externalQuotes.findIndex(q => q.id === id);
      if (externalIndex !== -1) {
        state.externalQuotes[externalIndex] = { ...state.externalQuotes[externalIndex], ...updates };
      }
    },
    // ✅ NUEVO: Añadir a historial de asignaciones
    addToAssignmentHistory: (state, action) => {
      const assignment = action.payload;
      state.assignmentHistory.unshift({
        ...assignment,
        timestamp: new Date().toISOString(),
      });
      if (state.assignmentHistory.length > 50) {
        state.assignmentHistory = state.assignmentHistory.slice(0, 50);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // ===== THUNKS EXISTENTES =====
      .addCase(fetchQuotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuotes.fulfilled, (state, action) => {
        state.loading = false;
        console.log('✅ fetchQuotes.fulfilled payload:', action.payload);
        
        state.quotes = action.payload.quotes || [];
        state.pagination = {
          ...state.pagination,
          page: action.payload.currentPage || action.payload.page || 1,
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 0,
        };
        
        // ✅ Calcular estadísticas actualizadas
        state.stats.totalQuotes = action.payload.total || state.quotes.length;
        state.stats.pendingQuotes = state.quotes.filter(q => q.status === QUOTE_STATUSES.PENDING).length;
        state.stats.completedQuotes = state.quotes.filter(q => q.status === QUOTE_STATUSES.COMPLETED).length;
        state.stats.sentQuotes = state.quotes.filter(q => q.status === QUOTE_STATUSES.SENT).length;
        state.stats.approvedQuotes = state.quotes.filter(q => q.status === QUOTE_STATUSES.APPROVED).length;
        state.stats.rejectedQuotes = state.quotes.filter(q => q.status === QUOTE_STATUSES.REJECTED).length;
        state.stats.requoteQuotes = state.quotes.filter(q => q.status === QUOTE_STATUSES.REQUOTE).length;
        state.stats.expiredQuotes = state.quotes.filter(q => q.status === QUOTE_STATUSES.EXPIRED).length;
        state.stats.convertedQuotes = state.quotes.filter(q => q.status === QUOTE_STATUSES.CONVERTED).length;
        state.stats.externalQuotes = state.quotes.filter(q => q.is_external === true).length;
      })
      .addCase(fetchQuotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ===== NUEVOS THUNKS =====
      
      // ✅ Create External Quote
      .addCase(createExternalQuote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createExternalQuote.fulfilled, (state, action) => {
        state.loading = false;
        console.log('✅ createExternalQuote.fulfilled payload:', action.payload);
        state.externalQuotes.unshift(action.payload);
        state.stats.totalQuotes += 1;
        state.stats.externalQuotes += 1;
        state.stats.pendingQuotes += 1;
      })
      .addCase(createExternalQuote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ✅ Create Quote From User
      .addCase(createQuoteFromUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createQuoteFromUser.fulfilled, (state, action) => {
        state.loading = false;
        console.log('✅ createQuoteFromUser.fulfilled payload:', action.payload);
        state.quotes.unshift(action.payload);
        state.currentQuote = action.payload;
        state.stats.totalQuotes += 1;
        state.stats.pendingQuotes += 1;
      })
      .addCase(createQuoteFromUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ✅ Fetch External Quotes
      .addCase(fetchExternalQuotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExternalQuotes.fulfilled, (state, action) => {
        state.loading = false;
        console.log('✅ fetchExternalQuotes.fulfilled payload:', action.payload);
        state.externalQuotes = action.payload.quotes || [];
        state.externalPagination = {
          ...state.externalPagination,
          page: action.payload.currentPage || 1,
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 0,
        };
      })
      .addCase(fetchExternalQuotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ✅ Reassign External Quote
      .addCase(reassignExternalQuote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(reassignExternalQuote.fulfilled, (state, action) => {
        state.loading = false;
        console.log('✅ reassignExternalQuote.fulfilled payload:', action.payload);
        
        // Actualizar en externalQuotes
        const externalIndex = state.externalQuotes.findIndex(q => q.id === action.payload.id);
        if (externalIndex !== -1) {
          state.externalQuotes[externalIndex] = action.payload;
        }
        
        // También actualizar en quotes regulares si existe
        const regularIndex = state.quotes.findIndex(q => q.id === action.payload.id);
        if (regularIndex !== -1) {
          state.quotes[regularIndex] = action.payload;
        }
        
        // Actualizar currentQuote si corresponde
        if (state.currentQuote?.id === action.payload.id) {
          state.currentQuote = action.payload;
        }

        // ✅ Agregar al historial de asignaciones
        state.assignmentHistory.unshift({
          quoteId: action.payload.id,
          type: 'reassignment',
          from: 'external',
          to: 'vendedor',
          timestamp: new Date().toISOString(),
        });
      })
      .addCase(reassignExternalQuote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ✅ Fetch Quotes By User
      .addCase(fetchQuotesByUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuotesByUser.fulfilled, (state, action) => {
        state.loading = false;
        console.log('✅ fetchQuotesByUser.fulfilled payload:', action.payload);
        state.quotes = action.payload.quotes || [];
        state.pagination = {
          ...state.pagination,
          page: action.payload.currentPage || 1,
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 0,
        };
      })
      .addCase(fetchQuotesByUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ✅ Fetch Quotes By Vendedor
      .addCase(fetchQuotesByVendedor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuotesByVendedor.fulfilled, (state, action) => {
        state.loading = false;
        console.log('✅ fetchQuotesByVendedor.fulfilled payload:', action.payload);
        state.quotes = action.payload.quotes || [];
        state.pagination = {
          ...state.pagination,
          page: action.payload.currentPage || 1,
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 0,
        };
      })
      .addCase(fetchQuotesByVendedor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ✅ Mark Expired Quotes
      .addCase(markExpiredQuotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markExpiredQuotes.fulfilled, (state, action) => {
        state.loading = false;
        console.log('✅ markExpiredQuotes.fulfilled payload:', action.payload);
        
        // Actualizar stats con cotizaciones expiradas
        state.stats.expiredQuotes += action.payload.count || 0;
      })
      .addCase(markExpiredQuotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ===== CASOS EXISTENTES (mantener todos) =====
      .addCase(fetchQuoteById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuoteById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentQuote = action.payload;
      })
      .addCase(fetchQuoteById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(createQuote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createQuote.fulfilled, (state, action) => {
        state.loading = false;
        state.quotes.unshift(action.payload);
        state.currentQuote = action.payload;
        state.stats.totalQuotes += 1;
        state.stats.pendingQuotes += 1;
      })
      .addCase(createQuote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateQuote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateQuote.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.quotes.findIndex(q => q.id === action.payload.id);
        if (index !== -1) {
          state.quotes[index] = action.payload;
        }
        if (state.currentQuote?.id === action.payload.id) {
          state.currentQuote = action.payload;
        }
      })
      .addCase(updateQuote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(sendQuoteToClient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendQuoteToClient.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.quotes.findIndex(q => q.id === action.payload.id);
        if (index !== -1) {
          state.quotes[index] = action.payload;
        }
        if (state.currentQuote?.id === action.payload.id) {
          state.currentQuote = action.payload;
        }
      })
      .addCase(sendQuoteToClient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(approveQuote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(approveQuote.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.quotes.findIndex(q => q.id === action.payload.id);
        if (index !== -1) {
          state.quotes[index] = action.payload;
        }
        if (state.currentQuote?.id === action.payload.id) {
          state.currentQuote = action.payload;
        }
        state.stats.approvedQuotes += 1;
      })
      .addCase(approveQuote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(rejectQuote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(rejectQuote.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.quotes.findIndex(q => q.id === action.payload.id);
        if (index !== -1) {
          state.quotes[index] = action.payload;
        }
        if (state.currentQuote?.id === action.payload.id) {
          state.currentQuote = action.payload;
        }
        state.stats.rejectedQuotes += 1;
      })
      .addCase(rejectQuote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(requestRequote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(requestRequote.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.quotes.findIndex(q => q.id === action.payload.id);
        if (index !== -1) {
          state.quotes[index] = action.payload;
        }
        if (state.currentQuote?.id === action.payload.id) {
          state.currentQuote = action.payload;
        }
        state.stats.requoteQuotes += 1;
      })
      .addCase(requestRequote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// ===== ACCIONES ACTUALIZADAS =====
export const {
  clearQuoteError,
  setCurrentQuote,
  clearCurrentQuote,
  updateFilters,
  clearFilters,
  setPagination,
  setExternalPagination, // ✅ NUEVO
  updateQuoteStatus,
  moveQuoteFromExternal, // ✅ NUEVO
  addToSearchHistory,
  clearSearchHistory,
  resetQuotes,
  optimisticUpdateQuote,
  addToAssignmentHistory, // ✅ NUEVO
} = quoteSlice.actions;

// ===== SELECTORES ACTUALIZADOS =====
export const selectQuotes = (state) => state.quote.quotes;
export const selectExternalQuotes = (state) => state.quote.externalQuotes; // ✅ NUEVO
export const selectCurrentQuote = (state) => state.quote.currentQuote;
export const selectQuoteLoading = (state) => state.quote.loading;
export const selectQuoteError = (state) => state.quote.error;
export const selectQuoteFilters = (state) => state.quote.filters;
export const selectQuotePagination = (state) => state.quote.pagination;
export const selectExternalPagination = (state) => state.quote.externalPagination; // ✅ NUEVO
export const selectQuoteStats = (state) => state.quote.stats;
export const selectSearchHistory = (state) => state.quote.searchHistory;
export const selectAssignmentHistory = (state) => state.quote.assignmentHistory; // ✅ NUEVO

// ✅ NUEVOS SELECTORES
export const selectExternalQuotesByOwner = (ownerId) => (state) =>
  state.quote.externalQuotes.filter(quote => quote.admin_id === ownerId);

export const selectQuotesByAdmin = (adminId) => (state) =>
  state.quote.quotes.filter(quote => quote.admin_id === adminId);

export const selectQuotesBySource = (source) => (state) =>
  state.quote.quotes.filter(quote => quote.source === source);

export const selectQuotesByPriority = (priority) => (state) =>
  state.quote.quotes.filter(quote => quote.priority === priority);

export const selectHighPriorityQuotes = (state) =>
  state.quote.quotes.filter(quote => quote.priority === QUOTE_PRIORITIES.HIGH);

export const selectRecentAssignments = (state) =>
  state.quote.assignmentHistory.slice(0, 10);

// Selectores existentes mantener todos...
export const selectQuotesByStatus = (status) => (state) =>
  state.quote.quotes.filter(quote => quote.status === status);

export const selectPendingQuotes = (state) =>
  state.quote.quotes.filter(quote => quote.status === QUOTE_STATUSES.PENDING);

export const selectCompletedQuotes = (state) =>
  state.quote.quotes.filter(quote => quote.status === QUOTE_STATUSES.COMPLETED);

export const selectSentQuotes = (state) =>
  state.quote.quotes.filter(quote => quote.status === QUOTE_STATUSES.SENT);

export const selectApprovedQuotes = (state) =>
  state.quote.quotes.filter(quote => quote.status === QUOTE_STATUSES.APPROVED);

export const selectRejectedQuotes = (state) =>
  state.quote.quotes.filter(quote => quote.status === QUOTE_STATUSES.REJECTED);

export const selectRequoteQuotes = (state) =>
  state.quote.quotes.filter(quote => quote.status === QUOTE_STATUSES.REQUOTE);

export const selectExpiredQuotes = (state) =>
  state.quote.quotes.filter(quote => quote.status === QUOTE_STATUSES.EXPIRED);

export const selectConvertedQuotes = (state) =>
  state.quote.quotes.filter(quote => quote.status === QUOTE_STATUSES.CONVERTED);

export const selectQuotesByAsesor = (asesorId) => (state) =>
  state.quote.quotes.filter(quote => quote.asesor_id === asesorId);

export const selectQuotesByLider = (liderId) => (state) =>
  state.quote.quotes.filter(quote => quote.lider_id === liderId);

export const selectQuotesByGerente = (gerenteId) => (state) =>
  state.quote.quotes.filter(quote => quote.gerente_id === gerenteId);

export const selectQuotesByCliente = (clienteId) => (state) =>
  state.quote.quotes.filter(quote => quote.cliente_id === clienteId);

export const selectQuotesTotalValue = (state) =>
  state.quote.quotes.reduce((total, quote) => total + (quote.precio_total || 0), 0);

export default quoteSlice.reducer;