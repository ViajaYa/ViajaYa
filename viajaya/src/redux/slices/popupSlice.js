import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Estado inicial
const initialState = {
  popups: [],
  allPopups: [],
  currentPopup: null,
  loading: false,
  error: null,
  // ✅ Opcional: agregar más control de estado
  isVisible: false, // Para controlar visibilidad del popup actual
};

// Thunks asíncronos (mantener como están)
export const fetchPopup = createAsyncThunk(
  'popup/fetchPopup',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/popup`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Error al obtener popup'
      );
    }
  }
);

export const fetchAllPopups = createAsyncThunk(
  'popup/fetchAllPopups',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/popup/all`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'Error al obtener popups'
      );
    }
  }
);

export const createPopup = createAsyncThunk(
  'popup/createPopup',
  async (popupData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE_URL}/popup`, popupData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Error al crear popup'
      );
    }
  }
);

export const updatePopup = createAsyncThunk(
  'popup/updatePopup',
  async ({ id, popupData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${BASE_URL}/popup/${id}`, popupData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Error al actualizar popup'
      );
    }
  }
);

// Slice
const popupSlice = createSlice({
  name: 'popup',
  initialState,
  reducers: {
    clearPopupError: (state) => {
      state.error = null;
    },
    setCurrentPopup: (state, action) => {
      state.currentPopup = action.payload;
      // ✅ Auto-mostrar cuando se setea un popup
      state.isVisible = !!action.payload;
    },
    clearCurrentPopup: (state) => {
      state.currentPopup = null;
      state.isVisible = false;
    },
    // ✅ Opcional: agregar control de visibilidad independiente
    showPopup: (state) => {
      state.isVisible = true;
    },
    hidePopup: (state) => {
      state.isVisible = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Popup
      .addCase(fetchPopup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPopup.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPopup = action.payload;
        // ✅ Auto-mostrar popup cuando se carga
        if (action.payload && action.payload.isActive) {
          state.isVisible = true;
        }
      })
      .addCase(fetchPopup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch All Popups
      .addCase(fetchAllPopups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllPopups.fulfilled, (state, action) => {
        state.loading = false;
        state.popups = action.payload;
        state.allPopups = action.payload;
      })
      .addCase(fetchAllPopups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Popup
      .addCase(createPopup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPopup.fulfilled, (state, action) => {
        state.loading = false;
        state.popups.push(action.payload);
        state.allPopups.push(action.payload);
        state.currentPopup = action.payload;
      })
      .addCase(createPopup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Popup
      .addCase(updatePopup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePopup.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.popups.findIndex(popup => popup.id === action.payload.id);
        if (index !== -1) {
          state.popups[index] = action.payload;
          // ✅ También actualizar allPopups
          const allIndex = state.allPopups.findIndex(popup => popup.id === action.payload.id);
          if (allIndex !== -1) {
            state.allPopups[allIndex] = action.payload;
          }
        }
        state.currentPopup = action.payload;
      })
      .addCase(updatePopup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// ✅ Exportar las nuevas acciones también
export const { 
  clearPopupError, 
  setCurrentPopup, 
  clearCurrentPopup,
  showPopup,
  hidePopup
} = popupSlice.actions;

// ✅ Opcional: agregar selectores para mejor acceso
export const selectPopups = (state) => state.popup.popups;
export const selectAllPopups = (state) => state.popup.allPopups;
export const selectCurrentPopup = (state) => state.popup.currentPopup;
export const selectPopupLoading = (state) => state.popup.loading;
export const selectPopupError = (state) => state.popup.error;
export const selectIsPopupVisible = (state) => state.popup.isVisible;

export default popupSlice.reducer;