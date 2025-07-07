import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Async thunks
export const fetchReservations = createAsyncThunk(
  'reservation/fetchReservations',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`${BASE_URL}/order`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchReservationById = createAsyncThunk(
  'reservation/fetchReservationById',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`${BASE_URL}/order/${id}`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createReservation = createAsyncThunk(
  'reservation/createReservation',
  async (reservation, { rejectWithValue }) => {
    try {
      const { data } = await axios.post(`${BASE_URL}/order`, reservation);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateReservation = createAsyncThunk(
  'reservation/updateReservation',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const { data } = await axios.put(`${BASE_URL}/order/${id}`, updates);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteReservation = createAsyncThunk(
  'reservation/deleteReservation',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${BASE_URL}/order/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Slice
const reservationSlice = createSlice({
  name: 'reservation',
  initialState: {
    reservations: [],
    userReservations: [],
    loadingReservations: false,
    errorReservations: null,
    selectedReservation: null,
  },
  reducers: {
    clearReservationError: (state) => {
      state.errorReservations = null;
    },
    clearSelectedReservation: (state) => {
      state.selectedReservation = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchReservations.pending, (state) => {
        state.loadingReservations = true;
        state.errorReservations = null;
      })
      .addCase(fetchReservations.fulfilled, (state, action) => {
        state.loadingReservations = false;
        state.reservations = action.payload;
      })
      .addCase(fetchReservations.rejected, (state, action) => {
        state.loadingReservations = false;
        state.errorReservations = action.payload;
      })
      // Fetch by ID
      .addCase(fetchReservationById.pending, (state) => {
        state.loadingReservations = true;
        state.errorReservations = null;
      })
      .addCase(fetchReservationById.fulfilled, (state, action) => {
        state.loadingReservations = false;
        state.selectedReservation = action.payload;
      })
      .addCase(fetchReservationById.rejected, (state, action) => {
        state.loadingReservations = false;
        state.errorReservations = action.payload;
      })
      // Create
      .addCase(createReservation.pending, (state) => {
        state.loadingReservations = true;
        state.errorReservations = null;
      })
      .addCase(createReservation.fulfilled, (state, action) => {
        state.loadingReservations = false;
        state.reservations.push(action.payload);
      })
      .addCase(createReservation.rejected, (state, action) => {
        state.loadingReservations = false;
        state.errorReservations = action.payload;
      })
      // Update
      .addCase(updateReservation.pending, (state) => {
        state.loadingReservations = true;
        state.errorReservations = null;
      })
      .addCase(updateReservation.fulfilled, (state, action) => {
        state.loadingReservations = false;
        state.reservations = state.reservations.map(r =>
          r.id === action.payload.id ? action.payload : r
        );
      })
      .addCase(updateReservation.rejected, (state, action) => {
        state.loadingReservations = false;
        state.errorReservations = action.payload;
      })
      // Delete
      .addCase(deleteReservation.pending, (state) => {
        state.loadingReservations = true;
        state.errorReservations = null;
      })
      .addCase(deleteReservation.fulfilled, (state, action) => {
        state.loadingReservations = false;
        state.reservations = state.reservations.filter(r => r.id !== action.payload);
      })
      .addCase(deleteReservation.rejected, (state, action) => {
        state.loadingReservations = false;
        state.errorReservations = action.payload;
      });
  },
});

export const {
  clearReservationError,
  clearSelectedReservation,
} = reservationSlice.actions;

export default reservationSlice.reducer;

// Selectores
export const selectReservations = (state) => state.reservation.reservations;
export const selectLoadingReservations = (state) => state.reservation.loadingReservations;
export const selectErrorReservations = (state) => state.reservation.errorReservations;
export const selectSelectedReservation = (state) => state.reservation.selectedReservation;