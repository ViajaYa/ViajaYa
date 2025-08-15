import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ✅ CONFIGURAR axios con token automático
const getAuthHeaders = (token) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
});

const getMultipartAuthHeaders = (token) => ({
  'Authorization': `Bearer ${token}`
  // Content-Type se omite para FormData
});

// Estado inicial actualizado
const initialState = {
  payments: [],
  currentPayment: null,
  paymentData: null,
  loading: false,
  error: null,
  processingPayment: false,
  
  // ✅ NUEVO: Estados específicos para registro de pagos
  registeringPayment: false,
  registerPaymentError: null,
  verifyingPayment: false,
  verifyPaymentError: null,
  
  // ✅ NUEVO: Estados para pagos por contrato
  contractPayments: [],
  contractPaymentsLoading: false,
  contractPaymentsError: null,
  
  // ✅ NUEVO: Información de pagos de contrato
  contractPaymentInfo: null,
  contractPaymentInfoLoading: false,
  contractPaymentInfoError: null,
  
  // ✅ NUEVO: Reportes de pagos
  paymentReports: null,
  reportsLoading: false,
  reportsError: null,
  
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  }
};

// ✅ NUEVO: Registrar pago de cliente (por admin/owner)
export const registerClientPayment = createAsyncThunk(
  'payment/registerClientPayment',
  async ({ contractId, paymentData, comprobante }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      
      console.log('💰 SLICE: Registrando pago de cliente:', {
        contractId,
        paymentData,
        hasComprobante: !!comprobante
      });

      const formData = new FormData();
      
      // Agregar datos del pago
      Object.keys(paymentData).forEach(key => {
        if (paymentData[key] !== null && paymentData[key] !== undefined) {
          formData.append(key, paymentData[key]);
        }
      });
      
      formData.append('contract_id', contractId);
      
      // Agregar comprobante si existe
      if (comprobante) {
        formData.append('comprobante', comprobante);
      }

      const response = await fetch(`${BASE_URL}/payments/register-client-payment`, {
        method: 'POST',
        headers: getMultipartAuthHeaders(auth.token),
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error registrando pago');
      }

      console.log('✅ SLICE: Pago registrado exitosamente:', data);
      return data;

    } catch (error) {
      console.error('❌ SLICE: Error registering client payment:', error);
      return rejectWithValue(error.message || 'Error al registrar el pago');
    }
  }
);

// ✅ NUEVO: Obtener pagos por contrato
export const fetchPaymentsByContract = createAsyncThunk(
  'payment/fetchPaymentsByContract',
  async (contractId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      
      const response = await fetch(`${BASE_URL}/payments/contract/${contractId}`, {
        method: 'GET',
        headers: getAuthHeaders(auth.token)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error obteniendo pagos del contrato');
      }

      return data;

    } catch (error) {
      console.error('❌ SLICE: Error fetching contract payments:', error);
      return rejectWithValue(error.message || 'Error obteniendo pagos');
    }
  }
);

// ✅ ACTUALIZAR: Fetch payments con parámetros mejorados
export const fetchPayments = createAsyncThunk(
  'payment/fetchPayments',
  async ({ page = 1, limit = 10, filters = {} } = {}, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });

      const response = await fetch(`${BASE_URL}/payments?${queryParams}`, {
        method: 'GET',
        headers: getAuthHeaders(auth.token)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error obteniendo pagos');
      }

      return data;

    } catch (error) {
      console.error('❌ SLICE: Error fetching payments:', error);
      return rejectWithValue(error.message || 'Error obteniendo pagos');
    }
  }
);

// ✅ NUEVO: Verificar pago
export const verifyPayment = createAsyncThunk(
  'payment/verifyPayment',
  async ({ paymentId, status, observaciones }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      
      const response = await fetch(`${BASE_URL}/payments/${paymentId}/verify`, {
        method: 'PATCH',
        headers: getAuthHeaders(auth.token),
        body: JSON.stringify({ status, observaciones })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error verificando pago');
      }

      return data;

    } catch (error) {
      console.error('❌ SLICE: Error verifying payment:', error);
      return rejectWithValue(error.message || 'Error verificando pago');
    }
  }
);

// ✅ NUEVO: Obtener información de pagos de contrato
export const fetchContractPaymentInfo = createAsyncThunk(
  'payment/fetchContractPaymentInfo',
  async (contractId, { rejectWithValue }) => {
    try {
      // Esta ruta puede ser pública o con auth según tu implementación
      const response = await fetch(`${BASE_URL}/payments/contract/${contractId}/payment-info`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error obteniendo información de pagos');
      }

      return data;

    } catch (error) {
      console.error('❌ SLICE: Error fetching contract payment info:', error);
      return rejectWithValue(error.message || 'Error obteniendo información');
    }
  }
);

// ✅ NUEVO: Obtener reportes de pagos
export const fetchPaymentReports = createAsyncThunk(
  'payment/fetchPaymentReports',
  async (filters = {}, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      
      const queryParams = new URLSearchParams(filters);

      const response = await fetch(`${BASE_URL}/payments/reports/summary?${queryParams}`, {
        method: 'GET',
        headers: getAuthHeaders(auth.token)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error obteniendo reportes');
      }

      return data;

    } catch (error) {
      console.error('❌ SLICE: Error fetching payment reports:', error);
      return rejectWithValue(error.message || 'Error obteniendo reportes');
    }
  }
);

// ✅ ACTUALIZAR: Procesar pago (mantener compatibilidad)
export const processPayment = createAsyncThunk(
  'payment/processPayment',
  async (paymentData, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      
      const response = await fetch(`${BASE_URL}/payments`, {
        method: 'POST',
        headers: getAuthHeaders(auth.token),
        body: JSON.stringify(paymentData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error procesando pago');
      }

      return data;

    } catch (error) {
      return rejectWithValue(error.message || 'Error al procesar pago');
    }
  }
);

// ✅ NUEVO: Procesar pago con Wompi
export const processWompiPayment = createAsyncThunk(
  'payment/processWompiPayment',
  async (wompiData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/payments/wompi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(wompiData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error procesando pago Wompi');
      }

      return data;

    } catch (error) {
      return rejectWithValue(error.message || 'Error procesando pago Wompi');
    }
  }
);

// Slice actualizado
const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    // Equivalente a DATA_PAY
    setPaymentData: (state, action) => {
      state.paymentData = action.payload;
    },
    clearPaymentData: (state) => {
      state.paymentData = null;
    },
    clearPaymentError: (state) => {
      state.error = null;
      state.registerPaymentError = null;
      state.verifyPaymentError = null;
      state.contractPaymentsError = null;
      state.contractPaymentInfoError = null;
      state.reportsError = null;
    },
    setCurrentPayment: (state, action) => {
      state.currentPayment = action.payload;
    },
    clearCurrentPayment: (state) => {
      state.currentPayment = null;
    },
    
    // ✅ NUEVO: Limpiar pagos de contrato
    clearContractPayments: (state) => {
      state.contractPayments = [];
      state.contractPaymentsError = null;
    },
    
    // ✅ NUEVO: Actualizar paginación
    updatePagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    
    // ✅ NUEVO: Reset completo del estado
    resetPaymentState: (state) => {
      return initialState;
    }
  },
  extraReducers: (builder) => {
    builder
      // ✅ NUEVO: Register Client Payment
      .addCase(registerClientPayment.pending, (state) => {
        state.registeringPayment = true;
        state.registerPaymentError = null;
      })
      .addCase(registerClientPayment.fulfilled, (state, action) => {
        state.registeringPayment = false;
        
        // Agregar el pago a la lista si existe
        if (action.payload.payment) {
          state.payments.unshift(action.payload.payment);
          state.currentPayment = action.payload.payment;
        }
        
        console.log('✅ SLICE: Pago registrado en estado');
      })
      .addCase(registerClientPayment.rejected, (state, action) => {
        state.registeringPayment = false;
        state.registerPaymentError = action.payload;
      })
      
      // ✅ ACTUALIZAR: Process Payment
      .addCase(processPayment.pending, (state) => {
        state.processingPayment = true;
        state.error = null;
      })
      .addCase(processPayment.fulfilled, (state, action) => {
        state.processingPayment = false;
        if (action.payload.payment) {
          state.payments.unshift(action.payload.payment);
          state.currentPayment = action.payload.payment;
        }
      })
      .addCase(processPayment.rejected, (state, action) => {
        state.processingPayment = false;
        state.error = action.payload;
      })
      
      // ✅ ACTUALIZAR: Fetch Payments con paginación
      .addCase(fetchPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = action.payload.payments || [];
        state.pagination = {
          page: action.payload.currentPage || 1,
          limit: state.pagination.limit,
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 0
        };
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ✅ NUEVO: Fetch Payments By Contract
      .addCase(fetchPaymentsByContract.pending, (state) => {
        state.contractPaymentsLoading = true;
        state.contractPaymentsError = null;
      })
      .addCase(fetchPaymentsByContract.fulfilled, (state, action) => {
        state.contractPaymentsLoading = false;
        state.contractPayments = action.payload.payments || [];
      })
      .addCase(fetchPaymentsByContract.rejected, (state, action) => {
        state.contractPaymentsLoading = false;
        state.contractPaymentsError = action.payload;
      })
      
      // ✅ NUEVO: Verify Payment
      .addCase(verifyPayment.pending, (state) => {
        state.verifyingPayment = true;
        state.verifyPaymentError = null;
      })
      .addCase(verifyPayment.fulfilled, (state, action) => {
        state.verifyingPayment = false;
        
        // Actualizar el pago en la lista
        const paymentIndex = state.payments.findIndex(p => p.id === action.payload.payment.id);
        if (paymentIndex !== -1) {
          state.payments[paymentIndex] = action.payload.payment;
        }
        
        // Actualizar en pagos de contrato también
        const contractPaymentIndex = state.contractPayments.findIndex(p => p.id === action.payload.payment.id);
        if (contractPaymentIndex !== -1) {
          state.contractPayments[contractPaymentIndex] = action.payload.payment;
        }
        
        if (state.currentPayment?.id === action.payload.payment.id) {
          state.currentPayment = action.payload.payment;
        }
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.verifyingPayment = false;
        state.verifyPaymentError = action.payload;
      })
      
      // ✅ NUEVO: Fetch Contract Payment Info
      .addCase(fetchContractPaymentInfo.pending, (state) => {
        state.contractPaymentInfoLoading = true;
        state.contractPaymentInfoError = null;
      })
      .addCase(fetchContractPaymentInfo.fulfilled, (state, action) => {
        state.contractPaymentInfoLoading = false;
        state.contractPaymentInfo = action.payload;
      })
      .addCase(fetchContractPaymentInfo.rejected, (state, action) => {
        state.contractPaymentInfoLoading = false;
        state.contractPaymentInfoError = action.payload;
      })
      
      // ✅ NUEVO: Fetch Payment Reports
      .addCase(fetchPaymentReports.pending, (state) => {
        state.reportsLoading = true;
        state.reportsError = null;
      })
      .addCase(fetchPaymentReports.fulfilled, (state, action) => {
        state.reportsLoading = false;
        state.paymentReports = action.payload;
      })
      .addCase(fetchPaymentReports.rejected, (state, action) => {
        state.reportsLoading = false;
        state.reportsError = action.payload;
      })
      
      // ✅ NUEVO: Process Wompi Payment
      .addCase(processWompiPayment.pending, (state) => {
        state.processingPayment = true;
        state.error = null;
      })
      .addCase(processWompiPayment.fulfilled, (state, action) => {
        state.processingPayment = false;
        if (action.payload.payment) {
          state.payments.unshift(action.payload.payment);
          state.currentPayment = action.payload.payment;
        }
      })
      .addCase(processWompiPayment.rejected, (state, action) => {
        state.processingPayment = false;
        state.error = action.payload;
      });
  },
});

// ✅ EXPORTAR acciones actualizadas
export const { 
  setPaymentData, 
  clearPaymentData, 
  clearPaymentError, 
  setCurrentPayment,
  clearCurrentPayment,
  clearContractPayments,
  updatePagination,
  resetPaymentState
} = paymentSlice.actions;

// ✅ NUEVO: Selectores específicos
export const selectPayments = (state) => state.payment.payments;
export const selectCurrentPayment = (state) => state.payment.currentPayment;
export const selectPaymentLoading = (state) => state.payment.loading;
export const selectPaymentError = (state) => state.payment.error;
export const selectPaymentPagination = (state) => state.payment.pagination;

// Selectores para registro de pagos
export const selectRegisteringPayment = (state) => state.payment.registeringPayment;
export const selectRegisterPaymentError = (state) => state.payment.registerPaymentError;

// Selectores para pagos por contrato
export const selectContractPayments = (state) => state.payment.contractPayments;
export const selectContractPaymentsLoading = (state) => state.payment.contractPaymentsLoading;
export const selectContractPaymentsError = (state) => state.payment.contractPaymentsError;

// Selectores para información de pagos
export const selectContractPaymentInfo = (state) => state.payment.contractPaymentInfo;
export const selectContractPaymentInfoLoading = (state) => state.payment.contractPaymentInfoLoading;

// Selectores para reportes
export const selectPaymentReports = (state) => state.payment.paymentReports;
export const selectReportsLoading = (state) => state.payment.reportsLoading;

// Selectores para verificación
export const selectVerifyingPayment = (state) => state.payment.verifyingPayment;
export const selectVerifyPaymentError = (state) => state.payment.verifyPaymentError;

// ✅ NUEVO: Selectores calculados
export const selectPaymentsByStatus = (status) => (state) =>
  state.payment.payments.filter(payment => payment.status === status);

export const selectPendingPayments = (state) =>
  state.payment.payments.filter(payment => payment.status === 'pending');

export const selectVerifiedPayments = (state) =>
  state.payment.payments.filter(payment => payment.status === 'verified');

export const selectRejectedPayments = (state) =>
  state.payment.payments.filter(payment => payment.status === 'rejected');

export const selectTotalPaymentAmount = (state) =>
  state.payment.payments
    .filter(payment => payment.status === 'verified')
    .reduce((total, payment) => total + parseFloat(payment.monto || 0), 0);

export const selectPaymentsSummary = (state) => {
  const payments = state.payment.payments;
  return {
    total: payments.length,
    pending: payments.filter(p => p.status === 'pending').length,
    verified: payments.filter(p => p.status === 'verified').length,
    rejected: payments.filter(p => p.status === 'rejected').length,
    totalAmount: payments
      .filter(p => p.status === 'verified')
      .reduce((sum, p) => sum + parseFloat(p.monto || 0), 0)
  };
};

export default paymentSlice.reducer;