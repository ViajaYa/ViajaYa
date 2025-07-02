import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getApiUrl } from '../../utils/env';

// Estado inicial
const initialState = {
  quotes: [],
  currentQuote: null,
  loading: false,
  error: null,
  filters: {
    status: 'all',
    cliente_id: null,
    asesor_id: null,
    lider_id: null,
    gerente_id: null,
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
    totalValue: 0,
    averageValue: 0,
  },
  quoteTemplates: [],
  searchHistory: [],
};

// ✅ Estados de cotización corregidos
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

// ✅ Thunks corregidos para manejar la estructura real
export const fetchQuotes = createAsyncThunk(
  'quote/fetchQuotes',
  async ({ page = 1, limit = 10, filters = {} }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      
      // ✅ CORRECCIÓN: Construir queryParams solo con valores válidos
      const queryParams = new URLSearchParams();
      
      // Parámetros básicos
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      
      // ✅ Solo agregar filtros que tengan valores válidos
      Object.entries(filters).forEach(([key, value]) => {
        // Excluir valores nulos, undefined, "all", strings vacíos y objetos
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

      // ✅ CORRECCIÓN: Manejar la estructura real de la respuesta
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

      // ✅ Retornar la cotización directamente
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

      // ✅ Retornar la cotización creada
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

      // ✅ Retornar la cotización actualizada
      return data.quote || data;
    } catch (error) {
      console.error('❌ updateQuote error:', error);
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const deleteQuote = createAsyncThunk(
  'quote/deleteQuote',
  async (quoteId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      
      console.log('🔍 deleteQuote - ID:', quoteId);

      const response = await fetch(getApiUrl(`/quotes/${quoteId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        return rejectWithValue(data.message || 'Error eliminando cotización');
      }

      // ✅ Retornar el ID de la cotización eliminada
      return quoteId;
    } catch (error) {
      console.error('❌ deleteQuote error:', error);
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

// ✅ Thunk corregido para enviar cotización al cliente
export const sendQuoteToClient = createAsyncThunk(
  'quote/sendQuoteToClient',
  async (quoteId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      
      console.log('🔍 sendQuoteToClient - ID:', quoteId);

      const response = await fetch(getApiUrl(`/quotes/${quoteId}/send`), {
        method: 'PUT',
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

      // ✅ Retornar la cotización actualizada
      return data.quote || data;
    } catch (error) {
      console.error('❌ sendQuoteToClient error:', error);
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

// ✅ Thunk para aprobar cotización (admin)
export const approveQuote = createAsyncThunk(
  'quote/approveQuote',
  async ({ quoteId, approvalData = {} }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      
      console.log('🔍 approveQuote - ID:', quoteId, 'Data:', approvalData);

      const response = await fetch(getApiUrl(`/quotes/${quoteId}/approve`), {
        method: 'POST',
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

      // ✅ Retornar la cotización aprobada
      return data.quote || data;
    } catch (error) {
      console.error('❌ approveQuote error:', error);
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

// ✅ Thunk para rechazar cotización (admin)
export const rejectQuote = createAsyncThunk(
  'quote/rejectQuote',
  async ({ quoteId, reason }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      
      console.log('🔍 rejectQuote - ID:', quoteId, 'Reason:', reason);

      const response = await fetch(getApiUrl(`/quotes/${quoteId}/reject`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      const data = await response.json();
      console.log('🔍 rejectQuote - Response:', data);

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error rechazando cotización');
      }

      // ✅ Retornar la cotización rechazada
      return data.quote || data;
    } catch (error) {
      console.error('❌ rejectQuote error:', error);
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

// ✅ Thunk para solicitar re-cotización
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

      // ✅ Retornar la cotización actualizada
      return data.quote || data;
    } catch (error) {
      console.error('❌ requestRequote error:', error);
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

// ✅ Thunk para convertir a contrato
export const convertQuoteToContract = createAsyncThunk(
  'quote/convertQuoteToContract',
  async ({ quoteId, contractData = {} }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      
      console.log('🔍 convertQuoteToContract - ID:', quoteId, 'Data:', contractData);

      const response = await fetch(getApiUrl(`/quotes/${quoteId}/convert-to-contract`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contractData),
      });

      const data = await response.json();
      console.log('🔍 convertQuoteToContract - Response:', data);

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error convirtiendo cotización a contrato');
      }

      // ✅ Retornar información del contrato y cotización
      return {
        quoteId,
        contractId: data.contractId || data.contract?.id,
        quote: data.quote || data,
      };
    } catch (error) {
      console.error('❌ convertQuoteToContract error:', error);
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

// ✅ Thunk para generar PDF
export const generateQuotePDF = createAsyncThunk(
  'quote/generateQuotePDF',
  async (quoteId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      
      console.log('🔍 generateQuotePDF - ID:', quoteId);

      const response = await fetch(getApiUrl(`/quotes/${quoteId}/pdf`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        return rejectWithValue(data.message || 'Error generando PDF');
      }

      // ✅ Manejar descarga del archivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cotizacion-${quoteId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { quoteId, downloaded: true };
    } catch (error) {
      console.error('❌ generateQuotePDF error:', error);
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

// ✅ Thunk para duplicar cotización
export const duplicateQuote = createAsyncThunk(
  'quote/duplicateQuote',
  async (quoteId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      
      console.log('🔍 duplicateQuote - ID:', quoteId);

      const response = await fetch(getApiUrl(`/quotes/${quoteId}/duplicate`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('🔍 duplicateQuote - Response:', data);

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error duplicando cotización');
      }

      // ✅ Retornar la cotización duplicada
      return data.quote || data;
    } catch (error) {
      console.error('❌ duplicateQuote error:', error);
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

// ✅ Thunk para obtener estadísticas
export const fetchQuoteStats = createAsyncThunk(
  'quote/fetchQuoteStats',
  async ({ startDate, endDate } = {}, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);

      console.log('🔍 fetchQuoteStats - Params:', { startDate, endDate });

      const response = await fetch(getApiUrl(`/quotes/stats?${queryParams}`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('🔍 fetchQuoteStats - Response:', data);

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error obteniendo estadísticas');
      }

      // ✅ Retornar las estadísticas
      return data.stats || data;
    } catch (error) {
      console.error('❌ fetchQuoteStats error:', error);
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

// Slice
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
    },
    addToSearchHistory: (state, action) => {
      const searchTerm = action.payload;
      if (searchTerm && !state.searchHistory.includes(searchTerm)) {
        state.searchHistory.unshift(searchTerm);
        // Mantener solo los últimos 10 términos
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
      state.currentQuote = null;
      state.pagination = {
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
    },
  },
  extraReducers: (builder) => {
    builder
      // ✅ Fetch Quotes - Corregido
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
        
        // ✅ Calcular estadísticas básicas
        state.stats.totalQuotes = action.payload.total || state.quotes.length;
        state.stats.pendingQuotes = state.quotes.filter(q => q.status === QUOTE_STATUSES.PENDING).length;
        state.stats.completedQuotes = state.quotes.filter(q => q.status === QUOTE_STATUSES.COMPLETED).length;
        state.stats.sentQuotes = state.quotes.filter(q => q.status === QUOTE_STATUSES.SENT).length;
        state.stats.approvedQuotes = state.quotes.filter(q => q.status === QUOTE_STATUSES.APPROVED).length;
        state.stats.rejectedQuotes = state.quotes.filter(q => q.status === QUOTE_STATUSES.REJECTED).length;
        state.stats.requoteQuotes = state.quotes.filter(q => q.status === QUOTE_STATUSES.REQUOTE).length;
        state.stats.expiredQuotes = state.quotes.filter(q => q.status === QUOTE_STATUSES.EXPIRED).length;
        state.stats.convertedQuotes = state.quotes.filter(q => q.status === QUOTE_STATUSES.CONVERTED).length;
      })
      .addCase(fetchQuotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ✅ Fetch Quote By ID - Corregido
      .addCase(fetchQuoteById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuoteById.fulfilled, (state, action) => {
        state.loading = false;
        console.log('✅ fetchQuoteById.fulfilled payload:', action.payload);
        state.currentQuote = action.payload;
      })
      .addCase(fetchQuoteById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ✅ Create Quote - Corregido
      .addCase(createQuote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createQuote.fulfilled, (state, action) => {
        state.loading = false;
        console.log('✅ createQuote.fulfilled payload:', action.payload);
        state.quotes.unshift(action.payload);
        state.currentQuote = action.payload;
        state.stats.totalQuotes += 1;
        state.stats.pendingQuotes += 1;
      })
      .addCase(createQuote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ✅ Update Quote - Corregido
      .addCase(updateQuote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateQuote.fulfilled, (state, action) => {
        state.loading = false;
        console.log('✅ updateQuote.fulfilled payload:', action.payload);
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
      
      // ✅ Delete Quote - Corregido
      .addCase(deleteQuote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteQuote.fulfilled, (state, action) => {
        state.loading = false;
        console.log('✅ deleteQuote.fulfilled payload:', action.payload);
        state.quotes = state.quotes.filter(q => q.id !== action.payload);
        if (state.currentQuote?.id === action.payload) {
          state.currentQuote = null;
        }
        state.stats.totalQuotes = Math.max(0, state.stats.totalQuotes - 1);
      })
      .addCase(deleteQuote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ✅ Send Quote To Client - Corregido
      .addCase(sendQuoteToClient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendQuoteToClient.fulfilled, (state, action) => {
        state.loading = false;
        console.log('✅ sendQuoteToClient.fulfilled payload:', action.payload);
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
      
      // ✅ Approve Quote - Corregido
      .addCase(approveQuote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(approveQuote.fulfilled, (state, action) => {
        state.loading = false;
        console.log('✅ approveQuote.fulfilled payload:', action.payload);
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
      
      // ✅ Reject Quote - Corregido
      .addCase(rejectQuote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(rejectQuote.fulfilled, (state, action) => {
        state.loading = false;
        console.log('✅ rejectQuote.fulfilled payload:', action.payload);
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
      
      // ✅ Request Requote - Corregido
      .addCase(requestRequote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(requestRequote.fulfilled, (state, action) => {
        state.loading = false;
        console.log('✅ requestRequote.fulfilled payload:', action.payload);
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
      })
      
      // ✅ Convert Quote To Contract - Corregido
      .addCase(convertQuoteToContract.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(convertQuoteToContract.fulfilled, (state, action) => {
        state.loading = false;
        console.log('✅ convertQuoteToContract.fulfilled payload:', action.payload);
        const index = state.quotes.findIndex(q => q.id === action.payload.quoteId);
        if (index !== -1) {
          state.quotes[index].status = QUOTE_STATUSES.CONVERTED;
          state.quotes[index].contractId = action.payload.contractId;
          state.quotes[index].updated_at = new Date().toISOString();
        }
        if (state.currentQuote?.id === action.payload.quoteId) {
          state.currentQuote.status = QUOTE_STATUSES.CONVERTED;
          state.currentQuote.contractId = action.payload.contractId;
          state.currentQuote.updated_at = new Date().toISOString();
        }
        state.stats.convertedQuotes += 1;
      })
      .addCase(convertQuoteToContract.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ✅ Generate Quote PDF
      .addCase(generateQuotePDF.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateQuotePDF.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(generateQuotePDF.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ✅ Duplicate Quote - Corregido
      .addCase(duplicateQuote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(duplicateQuote.fulfilled, (state, action) => {
        state.loading = false;
        console.log('✅ duplicateQuote.fulfilled payload:', action.payload);
        state.quotes.unshift(action.payload);
        state.currentQuote = action.payload;
        state.stats.totalQuotes += 1;
        state.stats.pendingQuotes += 1;
      })
      .addCase(duplicateQuote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ✅ Fetch Quote Stats - Corregido
      .addCase(fetchQuoteStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuoteStats.fulfilled, (state, action) => {
        state.loading = false;
        console.log('✅ fetchQuoteStats.fulfilled payload:', action.payload);
        state.stats = { ...state.stats, ...action.payload };
      })
      .addCase(fetchQuoteStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Exportar acciones
export const {
  clearQuoteError,
  setCurrentQuote,
  clearCurrentQuote,
  updateFilters,
  clearFilters,
  setPagination,
  updateQuoteStatus,
  addToSearchHistory,
  clearSearchHistory,
  resetQuotes,
  optimisticUpdateQuote,
} = quoteSlice.actions;

// ✅ Selectores corregidos con nombres de campos reales
export const selectQuotes = (state) => state.quote.quotes;
export const selectCurrentQuote = (state) => state.quote.currentQuote;
export const selectQuoteLoading = (state) => state.quote.loading;
export const selectQuoteError = (state) => state.quote.error;
export const selectQuoteFilters = (state) => state.quote.filters;
export const selectQuotePagination = (state) => state.quote.pagination;
export const selectQuoteStats = (state) => state.quote.stats;
export const selectQuoteTemplates = (state) => state.quote.quoteTemplates;
export const selectSearchHistory = (state) => state.quote.searchHistory;

// ✅ Selectores específicos con nombres de campos reales
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

// ✅ Selectores por vendedor usando nombres de campos reales
export const selectQuotesByAsesor = (asesorId) => (state) =>
  state.quote.quotes.filter(quote => quote.asesor_id === asesorId);

export const selectQuotesByLider = (liderId) => (state) =>
  state.quote.quotes.filter(quote => quote.lider_id === liderId);

export const selectQuotesByGerente = (gerenteId) => (state) =>
  state.quote.quotes.filter(quote => quote.gerente_id === gerenteId);

export const selectQuotesByCliente = (clienteId) => (state) =>
  state.quote.quotes.filter(quote => quote.cliente_id === clienteId);

// ✅ Selector para valor total usando campo real
export const selectQuotesTotalValue = (state) =>
  state.quote.quotes.reduce((total, quote) => total + (quote.precio_total || 0), 0);

// Exportar el reducer
export default quoteSlice.reducer;