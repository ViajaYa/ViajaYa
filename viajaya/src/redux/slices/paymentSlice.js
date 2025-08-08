import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Estado inicial
const initialState = {
  payments: [],
  currentPayment: null,
  paymentData: null, // Equivalente a DATA_PAY
  loading: false,
  error: null,
  processingPayment: false,
};

// Thunks asíncronos
export const processPayment = createAsyncThunk(
  'payment/processPayment',
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE_URL}/api/payments`, paymentData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Error al procesar pago'
      );
    }
  }
);

export const fetchPayments = createAsyncThunk(
  'payment/fetchPayments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/payments`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Error al obtener pagos'
      );
    }
  }
);

// Slice
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
    },
    setCurrentPayment: (state, action) => {
      state.currentPayment = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Process Payment
      .addCase(processPayment.pending, (state) => {
        state.processingPayment = true;
        state.error = null;
      })
      .addCase(processPayment.fulfilled, (state, action) => {
        state.processingPayment = false;
        state.payments.push(action.payload);
        state.currentPayment = action.payload;
      })
      .addCase(processPayment.rejected, (state, action) => {
        state.processingPayment = false;
        state.error = action.payload;
      })
      // Fetch Payments
      .addCase(fetchPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = action.payload;
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  setPaymentData, 
  clearPaymentData, 
  clearPaymentError, 
  setCurrentPayment 
} = paymentSlice.actions;

export default paymentSlice.reducer;