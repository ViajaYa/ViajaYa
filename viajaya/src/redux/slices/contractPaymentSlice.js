import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ✅ CONFIGURAR axios con token automático
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// ✅ ASYNC THUNK para obtener detalles de pagos del contrato
export const fetchContractPaymentDetails = createAsyncThunk(
  'contractPayment/fetchDetails',
  async (contractId, { rejectWithValue }) => {
    try {
      console.log('🔍 Fetching payment details for contract:', contractId);
      
      const response = await fetch(`${BASE_URL}/contracts/${contractId}/payment-details`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al obtener detalles de pagos');
      }
      
      if (!data.success) {
        return rejectWithValue(data.message);
      }
      
      console.log('📊 Payment details received:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching contract payment details:', error);
      return rejectWithValue(error.message);
    }
  }
);

// ✅ ASYNC THUNK para registrar un pago
export const registerPayment = createAsyncThunk(
  'contractPayment/registerPayment',
  async ({ contractId, paymentData, comprobante }, { rejectWithValue }) => {
    try {
      console.log('💳 Registering payment for contract:', contractId, paymentData);
      
      // Crear FormData para enviar archivo y datos
      const formData = new FormData();
      formData.append('contract_id', contractId);
      formData.append('monto', paymentData.amount);
      formData.append('fecha_pago', paymentData.date);
      formData.append('tipo_pago', paymentData.method);
      formData.append('observaciones', paymentData.description || '');
      
      // Agregar comprobante si existe
      if (comprobante) {
        formData.append('comprobante', comprobante);
      }
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/payments/register-client-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // No incluir Content-Type para FormData
        },
        body: formData
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al registrar pago');
      }
      
      if (!data.success) {
        return rejectWithValue(data.message);
      }
      
      console.log('✅ Payment registered:', data);
      return data;
    } catch (error) {
      console.error('❌ Error registering payment:', error);
      return rejectWithValue(error.message);
    }
  }
);

// ✅ ASYNC THUNK para subir comprobante de pago
export const uploadPaymentReceipt = createAsyncThunk(
  'contractPayment/uploadReceipt',
  async ({ paymentId, file }, { rejectWithValue }) => {
    try {
      console.log('📎 Uploading payment receipt:', paymentId);
      
      const formData = new FormData();
      formData.append('comprobante', file);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/payments/${paymentId}/upload-receipt`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // No incluir Content-Type para FormData
        },
        body: formData
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al subir comprobante');
      }
      
      if (!data.success) {
        return rejectWithValue(data.message);
      }
      
      console.log('✅ Payment receipt uploaded:', data);
      return data;
    } catch (error) {
      console.error('❌ Error uploading payment receipt:', error);
      return rejectWithValue(error.message);
    }
  }
);

const contractPaymentSlice = createSlice({
  name: 'contractPayment',
  initialState: {
    // Datos del contrato actual
    currentContract: null,
    planPagos: [],
    pagosRealizados: [],
    resumenFinanciero: null,
    
    // Estados de loading
    loading: false,
    uploadingReceipt: false,
    registeringPayment: false,
    
    // Errores
    error: null,
    uploadError: null,
    registerError: null,
    
    // UI states
    lastUpdated: null
  },
  reducers: {
    // ✅ LIMPIAR DATOS DEL CONTRATO
    clearContractPaymentData: (state) => {
      state.currentContract = null;
      state.planPagos = [];
      state.pagosRealizados = [];
      state.resumenFinanciero = null;
      state.error = null;
      state.uploadError = null;
      state.registerError = null;
      state.lastUpdated = null;
    },
    
    // ✅ LIMPIAR ERRORES
    clearErrors: (state) => {
      state.error = null;
      state.uploadError = null;
      state.registerError = null;
    },
    
    // ✅ ACTUALIZAR UN PAGO ESPECÍFICO
    updatePaymentInList: (state, action) => {
      const updatedPayment = action.payload;
      const index = state.pagosRealizados.findIndex(p => p.id === updatedPayment.id);
      if (index !== -1) {
        state.pagosRealizados[index] = updatedPayment;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // ===== FETCH CONTRACT PAYMENT DETAILS =====
      .addCase(fetchContractPaymentDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContractPaymentDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentContract = action.payload.contract;
        state.planPagos = action.payload.plan_pagos;
        state.pagosRealizados = action.payload.pagos_realizados;
        state.resumenFinanciero = action.payload.resumen_financiero;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchContractPaymentDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ===== REGISTER PAYMENT =====
      .addCase(registerPayment.pending, (state) => {
        state.registeringPayment = true;
        state.registerError = null;
      })
      .addCase(registerPayment.fulfilled, (state, action) => {
        state.registeringPayment = false;
        // Agregar el nuevo pago a la lista
        if (action.payload.payment) {
          state.pagosRealizados.unshift(action.payload.payment);
        }
      })
      .addCase(registerPayment.rejected, (state, action) => {
        state.registeringPayment = false;
        state.registerError = action.payload;
      })
      
      // ===== UPLOAD PAYMENT RECEIPT =====
      .addCase(uploadPaymentReceipt.pending, (state) => {
        state.uploadingReceipt = true;
        state.uploadError = null;
      })
      .addCase(uploadPaymentReceipt.fulfilled, (state, action) => {
        state.uploadingReceipt = false;
        // Actualizar el pago con el comprobante
        if (action.payload.payment) {
          const index = state.pagosRealizados.findIndex(p => p.id === action.payload.payment.id);
          if (index !== -1) {
            state.pagosRealizados[index] = action.payload.payment;
          }
        }
      })
      .addCase(uploadPaymentReceipt.rejected, (state, action) => {
        state.uploadingReceipt = false;
        state.uploadError = action.payload;
      });
  }
});

export const { 
  clearContractPaymentData, 
  clearErrors, 
  updatePaymentInList 
} = contractPaymentSlice.actions;

export default contractPaymentSlice.reducer;

// ===== SELECTORS =====
export const selectContractPaymentData = (state) => state.contractPayment.currentContract;
export const selectPlanPagos = (state) => state.contractPayment.planPagos;
export const selectPagosRealizados = (state) => state.contractPayment.pagosRealizados;
export const selectResumenFinanciero = (state) => state.contractPayment.resumenFinanciero;

export const selectContractPaymentLoading = (state) => state.contractPayment.loading;
export const selectUploadingReceipt = (state) => state.contractPayment.uploadingReceipt;
export const selectRegisteringPayment = (state) => state.contractPayment.registeringPayment;

export const selectContractPaymentError = (state) => state.contractPayment.error;
export const selectUploadError = (state) => state.contractPayment.uploadError;
export const selectRegisterError = (state) => state.contractPayment.registerError;

export const selectLastUpdated = (state) => state.contractPayment.lastUpdated;

// ===== COMPUTED SELECTORS =====
export const selectPaymentSummary = (state) => {
  const resumen = state.contractPayment.resumenFinanciero;
  if (!resumen) return null;
  
  return {
    totalToPay: resumen.precio_total,
    totalPaid: resumen.total_pagado,
    remaining: resumen.saldo_pendiente,
    percentagePaid: resumen.porcentaje_pagado,
    daysUntilTrip: resumen.dias_hasta_viaje,
    isFullyPaid: resumen.saldo_pendiente <= 0
  };
};

export const selectNextPaymentDue = (state) => {
  const planPagos = state.contractPayment.planPagos;
  if (!planPagos || planPagos.length === 0) return null;
  
  const nextPending = planPagos.find(cuota => cuota.estado === 'pendiente');
  return nextPending || null;
};
