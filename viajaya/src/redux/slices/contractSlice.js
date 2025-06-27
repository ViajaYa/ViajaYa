import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getApiUrl } from '../../utils/env';

// Estado inicial
const initialState = {
  contracts: [],
  currentContract: null,
  contractTemplates: [],
  loading: false,
  error: null,
  filters: {
    status: 'all',
    clientId: null,
    startDate: null,
    endDate: null,
    contractType: 'all',
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  stats: {
    totalContracts: 0,
    activeContracts: 0,
    expiredContracts: 0,
    pendingContracts: 0,
  },
};

// Thunks asíncronos
export const fetchContracts = createAsyncThunk(
  'contract/fetchContracts',
  async ({ page = 1, limit = 10, filters = {} }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters,
      });

      const response = await fetch(getApiUrl(`/api/contracts?${queryParams}`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error obteniendo contratos');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const fetchContractById = createAsyncThunk(
  'contract/fetchContractById',
  async (contractId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl(`/api/contracts/${contractId}`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error obteniendo contrato');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const createContract = createAsyncThunk(
  'contract/createContract',
  async (contractData, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl('/api/contracts'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contractData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error creando contrato');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const updateContract = createAsyncThunk(
  'contract/updateContract',
  async ({ id, updates }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl(`/api/contracts/${id}`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error actualizando contrato');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const deleteContract = createAsyncThunk(
  'contract/deleteContract',
  async (contractId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl(`/api/contracts/${contractId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        return rejectWithValue(data.message || 'Error eliminando contrato');
      }

      return contractId;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const signContract = createAsyncThunk(
  'contract/signContract',
  async ({ contractId, signatureData }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl(`/api/contracts/${contractId}/sign`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signatureData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error firmando contrato');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const generateContractPDF = createAsyncThunk(
  'contract/generateContractPDF',
  async (contractId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl(`/api/contracts/${contractId}/pdf`), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        return rejectWithValue(data.message || 'Error generando PDF');
      }

      // Manejar respuesta de archivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contrato-${contractId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { contractId, downloaded: true };
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const sendContractForSignature = createAsyncThunk(
  'contract/sendContractForSignature',
  async ({ contractId, emailData }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl(`/api/contracts/${contractId}/send-signature`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error enviando contrato para firma');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const fetchContractTemplates = createAsyncThunk(
  'contract/fetchContractTemplates',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl('/api/contracts/templates'), {
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

export const createContractFromTemplate = createAsyncThunk(
  'contract/createContractFromTemplate',
  async ({ templateId, contractData }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl(`/api/contracts/from-template/${templateId}`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contractData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Error creando contrato desde plantilla');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error de conexión');
    }
  }
);

export const fetchContractStats = createAsyncThunk(
  'contract/fetchContractStats',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl('/api/contracts/stats'), {
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

// Slice
const contractSlice = createSlice({
  name: 'contract',
  initialState,
  reducers: {
    clearContractError: (state) => {
      state.error = null;
    },
    setCurrentContract: (state, action) => {
      state.currentContract = action.payload;
    },
    clearCurrentContract: (state) => {
      state.currentContract = null;
    },
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        status: 'all',
        clientId: null,
        startDate: null,
        endDate: null,
        contractType: 'all',
      };
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    resetContracts: (state) => {
      state.contracts = [];
      state.currentContract = null;
      state.pagination = {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      };
    },
    updateContractStatus: (state, action) => {
      const { contractId, status } = action.payload;
      const contract = state.contracts.find(c => c.id === contractId);
      if (contract) {
        contract.status = status;
      }
      if (state.currentContract?.id === contractId) {
        state.currentContract.status = status;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Contracts
      .addCase(fetchContracts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContracts.fulfilled, (state, action) => {
        state.loading = false;
        state.contracts = action.payload.contracts || [];
        state.pagination = {
          ...state.pagination,
          page: action.payload.page || 1,
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 0,
        };
      })
      .addCase(fetchContracts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Contract By ID
      .addCase(fetchContractById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContractById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentContract = action.payload;
      })
      .addCase(fetchContractById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Contract
      .addCase(createContract.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createContract.fulfilled, (state, action) => {
        state.loading = false;
        state.contracts.unshift(action.payload);
        state.currentContract = action.payload;
      })
      .addCase(createContract.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Contract
      .addCase(updateContract.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateContract.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.contracts.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.contracts[index] = action.payload;
        }
        if (state.currentContract?.id === action.payload.id) {
          state.currentContract = action.payload;
        }
      })
      .addCase(updateContract.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Contract
      .addCase(deleteContract.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteContract.fulfilled, (state, action) => {
        state.loading = false;
        state.contracts = state.contracts.filter(c => c.id !== action.payload);
        if (state.currentContract?.id === action.payload) {
          state.currentContract = null;
        }
      })
      .addCase(deleteContract.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Sign Contract
      .addCase(signContract.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signContract.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.contracts.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.contracts[index] = action.payload;
        }
        if (state.currentContract?.id === action.payload.id) {
          state.currentContract = action.payload;
        }
      })
      .addCase(signContract.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Generate Contract PDF
      .addCase(generateContractPDF.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateContractPDF.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(generateContractPDF.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Send Contract For Signature
      .addCase(sendContractForSignature.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendContractForSignature.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.contracts.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.contracts[index] = action.payload;
        }
        if (state.currentContract?.id === action.payload.id) {
          state.currentContract = action.payload;
        }
      })
      .addCase(sendContractForSignature.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Contract Templates
      .addCase(fetchContractTemplates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContractTemplates.fulfilled, (state, action) => {
        state.loading = false;
        state.contractTemplates = action.payload;
      })
      .addCase(fetchContractTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Contract From Template
      .addCase(createContractFromTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createContractFromTemplate.fulfilled, (state, action) => {
        state.loading = false;
        state.contracts.unshift(action.payload);
        state.currentContract = action.payload;
      })
      .addCase(createContractFromTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Contract Stats
      .addCase(fetchContractStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContractStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchContractStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Exportar acciones
export const {
  clearContractError,
  setCurrentContract,
  clearCurrentContract,
  updateFilters,
  clearFilters,
  setPagination,
  resetContracts,
  updateContractStatus,
} = contractSlice.actions;

// Selectores
export const selectContracts = (state) => state.contract.contracts;
export const selectCurrentContract = (state) => state.contract.currentContract;
export const selectContractTemplates = (state) => state.contract.contractTemplates;
export const selectContractLoading = (state) => state.contract.loading;
export const selectContractError = (state) => state.contract.error;
export const selectContractFilters = (state) => state.contract.filters;
export const selectContractPagination = (state) => state.contract.pagination;
export const selectContractStats = (state) => state.contract.stats;

// Exportar el reducer
export default contractSlice.reducer;