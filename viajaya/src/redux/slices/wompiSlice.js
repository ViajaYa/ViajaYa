import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import wompiService from '../../utils/wompiService';

// Estado inicial
const initialState = {
  acceptanceToken: null,
  paymentToken: null,
  transaction: null,
  loading: false,
  error: null,
  paymentInProgress: false,
  transactionStatus: null,
};

// Thunks asíncronos
export const getAcceptanceToken = createAsyncThunk(
  'wompi/getAcceptanceToken',
  async (_, { rejectWithValue }) => {
    try {
      const token = await wompiService.getAcceptanceToken();
      return token;
    } catch (error) {
      return rejectWithValue(
        error.message || 'Error obteniendo token de aceptación'
      );
    }
  }
);

export const createPaymentToken = createAsyncThunk(
  'wompi/createPaymentToken',
  async (cardData, { rejectWithValue }) => {
    try {
      const response = await wompiService.createPaymentToken(cardData);
      if (response.status === 'CREATED') {
        return response.data;
      } else {
        return rejectWithValue(response.error?.reason || 'Error creando token de pago');
      }
    } catch (error) {
      return rejectWithValue(
        error.message || 'Error creando token de pago'
      );
    }
  }
);

export const processPayment = createAsyncThunk(
  'wompi/processPayment',
  async (transactionData, { rejectWithValue, getState }) => {
    try {
      const { wompi } = getState();
      
      const paymentData = {
        ...transactionData,
        acceptanceToken: wompi.acceptanceToken,
        paymentToken: wompi.paymentToken.id,
      };

      const response = await wompiService.createTransaction(paymentData);
      
      if (response.status === 'APPROVED') {
        return response.data;
      } else {
        return rejectWithValue(
          response.error?.reason || 'Pago rechazado'
        );
      }
    } catch (error) {
      return rejectWithValue(
        error.message || 'Error procesando pago'
      );
    }
  }
);

export const checkTransactionStatus = createAsyncThunk(
  'wompi/checkTransactionStatus',
  async (transactionId, { rejectWithValue }) => {
    try {
      const response = await wompiService.getTransaction(transactionId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.message || 'Error consultando estado de transacción'
      );
    }
  }
);

// Slice
const wompiSlice = createSlice({
  name: 'wompi',
  initialState,
  reducers: {
    clearPaymentData: (state) => {
      state.paymentToken = null;
      state.transaction = null;
      state.error = null;
      state.transactionStatus = null;
    },
    clearPaymentError: (state) => {
      state.error = null;
    },
    setTransactionStatus: (state, action) => {
      state.transactionStatus = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Acceptance Token
      .addCase(getAcceptanceToken.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAcceptanceToken.fulfilled, (state, action) => {
        state.loading = false;
        state.acceptanceToken = action.payload;
      })
      .addCase(getAcceptanceToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Payment Token
      .addCase(createPaymentToken.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPaymentToken.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentToken = action.payload;
      })
      .addCase(createPaymentToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Process Payment
      .addCase(processPayment.pending, (state) => {
        state.paymentInProgress = true;
        state.error = null;
      })
      .addCase(processPayment.fulfilled, (state, action) => {
        state.paymentInProgress = false;
        state.transaction = action.payload;
        state.transactionStatus = 'APPROVED';
      })
      .addCase(processPayment.rejected, (state, action) => {
        state.paymentInProgress = false;
        state.error = action.payload;
        state.transactionStatus = 'DECLINED';
      })
      // Check Transaction Status
      .addCase(checkTransactionStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkTransactionStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.transaction = action.payload;
        state.transactionStatus = action.payload.status;
      })
      .addCase(checkTransactionStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  clearPaymentData, 
  clearPaymentError, 
  setTransactionStatus 
} = wompiSlice.actions;

export default wompiSlice.reducer;