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
    clientId: null,
    agentId: null,
    startDate: null,
    endDate: null,
    priceRange: {
      min: null,
      max: null,
    },
    destination: '',
    packageType: 'all',
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
    approvedQuotes: 0,
    rejectedQuotes: 0,
    totalValue: 0,
    averageValue: 0,
  },
  quoteTemplates: [],
  searchHistory: [],
};

// Estados de cotización
export const QUOTE_STATUSES = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  SENT: 'sent',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  REQUOTE: 'requote',
  EXPIRED: 'expired',
  CONVERTED: 'converted', // cuando se convierte a contrato
};

// Thunks asíncronos
export const fetchQuotes = createAsyncThunk(
  'quote/fetchQuotes',
  async ({ page = 1, limit = 10, filters = {} }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters,
      });

      const response = await fetch(getApiUrl(`/quotes?${queryParams}`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error obteniendo cotizaciones');
      }

      return data;
    } catch (error) {
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

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error obteniendo cotización');
      }

      return data;
    } catch (error) {
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

      const response = await fetch(getApiUrl('/quotes'), {
        method: 'POST',
        headers,
        body: JSON.stringify(quoteData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error creando cotización');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const updateQuote = createAsyncThunk(
  'quote/updateQuote',
  async ({ id, updates }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl(`/quotes/${id}`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error actualizando cotización');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const deleteQuote = createAsyncThunk(
  'quote/deleteQuote',
  async (quoteId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
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

      return quoteId;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const sendQuote = createAsyncThunk(
  'quote/sendQuote',
  async ({ quoteId, emailData }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl(`/quotes/${quoteId}/send`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error enviando cotización');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const approveQuote = createAsyncThunk(
  'quote/approveQuote',
  async ({ quoteId, approvalData }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl(`/quotes/${quoteId}/approve`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(approvalData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error aprobando cotización');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const rejectQuote = createAsyncThunk(
  'quote/rejectQuote',
  async ({ quoteId, reason }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl(`/quotes/${quoteId}/reject`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error rechazando cotización');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const duplicateQuote = createAsyncThunk(
  'quote/duplicateQuote',
  async (quoteId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl(`/quotes/${quoteId}/duplicate`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error duplicando cotización');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const generateQuotePDF = createAsyncThunk(
  'quote/generateQuotePDF',
  async (quoteId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
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

      // Manejar descarga del archivo
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
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const convertQuoteToContract = createAsyncThunk(
  'quote/convertQuoteToContract',
  async ({ quoteId, contractData }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl(`/quotes/${quoteId}/convert-to-contract`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contractData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error convirtiendo cotización a contrato');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const fetchQuoteTemplates = createAsyncThunk(
  'quote/fetchQuoteTemplates',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl('/quotes/templates'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error obteniendo plantillas');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const createQuoteFromTemplate = createAsyncThunk(
  'quote/createQuoteFromTemplate',
  async ({ templateId, quoteData }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl(`/quotes/from-template/${templateId}`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quoteData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error creando cotización desde plantilla');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const fetchQuoteStats = createAsyncThunk(
  'quote/fetchQuoteStats',
  async ({ startDate, endDate }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);

      const response = await fetch(getApiUrl(`/quotes/stats?${queryParams}`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error obteniendo estadísticas');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const searchQuotes = createAsyncThunk(
  'quote/searchQuotes',
  async ({ query, filters = {} }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const queryParams = new URLSearchParams({
        q: query,
        ...filters,
      });

      const response = await fetch(getApiUrl(`/quotes/search?${queryParams}`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error buscando cotizaciones');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const sendQuoteToClient = createAsyncThunk(
  'quote/sendQuoteToClient',
  async (quoteId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl(`/quotes/${quoteId}/send`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error enviando cotización al cliente');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const requestRequote = createAsyncThunk(
  'quote/requestRequote',
  async ({ quoteId, requote_reason }, { rejectWithValue }) => {
    try {
      const response = await fetch(getApiUrl(`/quotes/${quoteId}/requote`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requote_reason }),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error solicitando recotización');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const approveQuotePublic = createAsyncThunk(
  'quote/approveQuotePublic',
  async (quoteId, { rejectWithValue }) => {
    try {
      const response = await fetch(getApiUrl(`/quotes/${quoteId}/approve`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error aprobando cotización');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const fetchQuotesByVendedor = createAsyncThunk(
  'quote/fetchQuotesByVendedor',
  async ({ tipo, vendedor_id, status, page = 1, limit = 10 }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (status) queryParams.append('status', status);

      const response = await fetch(getApiUrl(`/quotes/vendedor/${tipo}/${vendedor_id}?${queryParams}`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error obteniendo cotizaciones del vendedor');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);



export const rejectQuotePublic = createAsyncThunk(
  'quote/rejectQuotePublic',
  async ({ quoteId, motivo_rechazo }, { rejectWithValue }) => {
    try {
      const response = await fetch(getApiUrl(`/quotes/${quoteId}/reject`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ motivo_rechazo }),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error rechazando cotización');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const markExpiredQuotes = createAsyncThunk(
  'quote/markExpiredQuotes',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl('/quotes/mark-expired'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error marcando cotizaciones expiradas');
      }

      return data;
    } catch (error) {
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
        clientId: null,
        agentId: null,
        startDate: null,
        endDate: null,
        priceRange: {
          min: null,
          max: null,
        },
        destination: '',
        packageType: 'all',
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
        quote.updatedAt = new Date().toISOString();
      }
      if (state.currentQuote?.id === quoteId) {
        state.currentQuote.status = status;
        state.currentQuote.updatedAt = new Date().toISOString();
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
      // Fetch Quotes
      .addCase(fetchQuotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuotes.fulfilled, (state, action) => {
        state.loading = false;
        state.quotes = action.payload.quotes || [];
        state.pagination = {
          ...state.pagination,
          page: action.payload.page || 1,
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 0,
        };
      })
      .addCase(fetchQuotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Quote By ID
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
      // Create Quote
      .addCase(createQuote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createQuote.fulfilled, (state, action) => {
        state.loading = false;
        state.quotes.unshift(action.payload);
        state.currentQuote = action.payload;
        state.stats.totalQuotes += 1;
      })
      .addCase(createQuote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Quote
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
      // Delete Quote
      .addCase(deleteQuote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteQuote.fulfilled, (state, action) => {
        state.loading = false;
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
      // Send Quote
      .addCase(sendQuote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendQuote.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.quotes.findIndex(q => q.id === action.payload.id);
        if (index !== -1) {
          state.quotes[index] = action.payload;
        }
        if (state.currentQuote?.id === action.payload.id) {
          state.currentQuote = action.payload;
        }
      })
      .addCase(sendQuote.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Approve Quote
      .addCase(approveQuote.fulfilled, (state, action) => {
        const index = state.quotes.findIndex(q => q.id === action.payload.id);
        if (index !== -1) {
          state.quotes[index] = action.payload;
        }
        if (state.currentQuote?.id === action.payload.id) {
          state.currentQuote = action.payload;
        }
        // Actualizar estadísticas
        state.stats.approvedQuotes += 1;
        if (action.payload.previousStatus === 'pending') {
          state.stats.pendingQuotes = Math.max(0, state.stats.pendingQuotes - 1);
        }
      })
      // Reject Quote
      .addCase(rejectQuote.fulfilled, (state, action) => {
        const index = state.quotes.findIndex(q => q.id === action.payload.id);
        if (index !== -1) {
          state.quotes[index] = action.payload;
        }
        if (state.currentQuote?.id === action.payload.id) {
          state.currentQuote = action.payload;
        }
        // Actualizar estadísticas
        state.stats.rejectedQuotes += 1;
        if (action.payload.previousStatus === 'pending') {
          state.stats.pendingQuotes = Math.max(0, state.stats.pendingQuotes - 1);
        }
      })
      // Duplicate Quote
      .addCase(duplicateQuote.fulfilled, (state, action) => {
        state.quotes.unshift(action.payload);
        state.currentQuote = action.payload;
        state.stats.totalQuotes += 1;
      })
      // Generate Quote PDF
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
      // Convert Quote to Contract
      .addCase(convertQuoteToContract.fulfilled, (state, action) => {
        const index = state.quotes.findIndex(q => q.id === action.payload.quoteId);
        if (index !== -1) {
          state.quotes[index].status = QUOTE_STATUSES.CONVERTED;
          state.quotes[index].contractId = action.payload.contractId;
        }
        if (state.currentQuote?.id === action.payload.quoteId) {
          state.currentQuote.status = QUOTE_STATUSES.CONVERTED;
          state.currentQuote.contractId = action.payload.contractId;
        }
      })
      // Fetch Quote Templates
      .addCase(fetchQuoteTemplates.fulfilled, (state, action) => {
        state.quoteTemplates = action.payload;
      })
      // Create Quote From Template
      .addCase(createQuoteFromTemplate.fulfilled, (state, action) => {
        state.quotes.unshift(action.payload);
        state.currentQuote = action.payload;
        state.stats.totalQuotes += 1;
      })
      // Fetch Quote Stats
      .addCase(fetchQuoteStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      // Search Quotes
      .addCase(searchQuotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchQuotes.fulfilled, (state, action) => {
        state.loading = false;
        state.quotes = action.payload.quotes || [];
        state.pagination = {
          ...state.pagination,
          page: action.payload.page || 1,
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 0,
        };
      })
      .addCase(searchQuotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
       .addCase(sendQuoteToClient.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
      .addCase(sendQuoteToClient.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.quotes.findIndex(q => q.id === action.payload.quote.id);
      if (index !== -1) {
        state.quotes[index] = action.payload.quote;
      }
      if (state.currentQuote?.id === action.payload.quote.id) {
        state.currentQuote = action.payload.quote;
      }
    })
    .addCase(sendQuoteToClient.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })

    // Request Requote
    .addCase(requestRequote.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(requestRequote.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.quotes.findIndex(q => q.id === action.payload.quote.id);
      if (index !== -1) {
        state.quotes[index] = action.payload.quote;
      }
      if (state.currentQuote?.id === action.payload.quote.id) {
        state.currentQuote = action.payload.quote;
      }
    })
    .addCase(requestRequote.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })

    // Approve Quote Public
    .addCase(approveQuotePublic.fulfilled, (state, action) => {
      const index = state.quotes.findIndex(q => q.id === action.payload.quote.id);
      if (index !== -1) {
        state.quotes[index] = action.payload.quote;
      }
      if (state.currentQuote?.id === action.payload.quote.id) {
        state.currentQuote = action.payload.quote;
      }
      // Actualizar estadísticas
      state.stats.approvedQuotes += 1;
      if (action.payload.quote.previousStatus === 'sent') {
        // Ajustar contadores según sea necesario
      }
    })

    // Reject Quote Public
    .addCase(rejectQuotePublic.fulfilled, (state, action) => {
      const index = state.quotes.findIndex(q => q.id === action.payload.quote.id);
      if (index !== -1) {
        state.quotes[index] = action.payload.quote;
      }
      if (state.currentQuote?.id === action.payload.quote.id) {
        state.currentQuote = action.payload.quote;
      }
      // Actualizar estadísticas
      state.stats.rejectedQuotes += 1;
    })

    // Mark Expired Quotes
    .addCase(markExpiredQuotes.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(markExpiredQuotes.fulfilled, (state, action) => {
      state.loading = false;
      // Opcionalmente refrescar las cotizaciones después de marcar como expiradas
      // o actualizar localmente las que han expirado
    })
    .addCase(markExpiredQuotes.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })

    // Fetch Quotes By Vendedor
    .addCase(fetchQuotesByVendedor.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(fetchQuotesByVendedor.fulfilled, (state, action) => {
      state.loading = false;
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

// Selectores
export const selectQuotes = (state) => state.quote.quotes;
export const selectCurrentQuote = (state) => state.quote.currentQuote;
export const selectQuoteLoading = (state) => state.quote.loading;
export const selectQuoteError = (state) => state.quote.error;
export const selectQuoteFilters = (state) => state.quote.filters;
export const selectQuotePagination = (state) => state.quote.pagination;
export const selectQuoteStats = (state) => state.quote.stats;
export const selectQuoteTemplates = (state) => state.quote.quoteTemplates;
export const selectSearchHistory = (state) => state.quote.searchHistory;

export const selectRequoteQuotes = (state) =>
  state.quote.quotes.filter(quote => quote.status === QUOTE_STATUSES.REQUOTE);

export const selectSentQuotes = (state) =>
  state.quote.quotes.filter(quote => quote.status === QUOTE_STATUSES.SENT);

export const selectCompletedQuotes = (state) =>
  state.quote.quotes.filter(quote => quote.status === QUOTE_STATUSES.COMPLETED);

export const selectExpiredQuotesNew = (state) =>
  state.quote.quotes.filter(quote => quote.status === QUOTE_STATUSES.EXPIRED);
// Selectores adicionales
export const selectQuotesByStatus = (status) => (state) =>
  state.quote.quotes.filter(quote => quote.status === status);

export const selectPendingQuotes = (state) =>
  state.quote.quotes.filter(quote => quote.status === QUOTE_STATUSES.PENDING);

export const selectApprovedQuotes = (state) =>
  state.quote.quotes.filter(quote => quote.status === QUOTE_STATUSES.APPROVED);

export const selectExpiredQuotes = (state) => {
  const now = new Date();
  return state.quote.quotes.filter(quote => {
    const expiryDate = new Date(quote.expiryDate);
    return expiryDate < now && quote.status !== QUOTE_STATUSES.CONVERTED;
  });
};

export const selectQuotesByVendedorType = (tipo, vendedorId) => (state) => {
  const fieldMap = {
    'asesor': 'asesor_id',
    'lider': 'lider_id', 
    'gerente': 'gerente_id'
  };
  
  const field = fieldMap[tipo];
  if (!field) return [];
  
  return state.quote.quotes.filter(quote => quote[field] === vendedorId);
};

export const selectQuotesByAgent = (agentId) => (state) =>
  state.quote.quotes.filter(quote => quote.agentId === agentId);

export const selectQuotesByClient = (clientId) => (state) =>
  state.quote.quotes.filter(quote => quote.clientId === clientId);

export const selectQuotesTotalValue = (state) =>
  state.quote.quotes.reduce((total, quote) => total + (quote.totalValue || 0), 0);

// Exportar el reducer
export default quoteSlice.reducer;