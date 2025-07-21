import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    'Authorization': `Bearer ${token}`
  };
};

const getAuthHeadersMultipart = () => {
  const token = localStorage.getItem("token");
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'multipart/form-data'
  };
};

// Estado inicial
const initialState = {
  userDocuments: [],
  documentationStatus: null,
  pendingDocuments: [],
  documentStats: null,
  loading: false,
  uploadLoading: false,
  statusLoading: false,
  error: null,
  uploadProgress: 0
};

// Thunk para subir documento
export const uploadDocument = createAsyncThunk(
  'document/uploadDocument',
  async ({ file, documentData }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('user_id', documentData.user_id);
      formData.append('document_name', documentData.document_name);
      formData.append('description', documentData.description || '');
      formData.append('is_required', documentData.is_required || true);

      const response = await axios.post(
        `${BASE_URL}/document-users/upload-file`,
        formData,
        { headers: getAuthHeadersMultipart() }
      );
      
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Error al subir documento'
      );
    }
  }
);

// Thunk para obtener documentos de un usuario
export const getUserDocuments = createAsyncThunk(
  'document/getUserDocuments',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/document-users/user/${userId}`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al obtener documentos');
    }
  }
);

// Thunk para verificar estado de documentación
export const checkDocumentationStatus = createAsyncThunk(
  'document/checkDocumentationStatus',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/document-users/status/${userId}`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al verificar documentación');
    }
  }
);

// Thunk para eliminar documento
export const deleteDocument = createAsyncThunk(
  'document/deleteDocument',
  async (documentId, { rejectWithValue }) => {
    try {
      const response = await axios.delete(
        `${BASE_URL}/document-users/${documentId}`,
        { headers: getAuthHeaders() }
      );
      return { documentId, message: response.data.message };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al eliminar documento');
    }
  }
);

// Slice de documentos
const documentSlice = createSlice({
  name: 'document',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetUploadProgress: (state) => {
      state.uploadProgress = 0;
    },
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Upload document
      .addCase(uploadDocument.pending, (state) => {
        state.uploadLoading = true;
        state.error = null;
      })
      .addCase(uploadDocument.fulfilled, (state, action) => {
        state.uploadLoading = false;
        if (action.payload.success) {
          const existingIndex = state.userDocuments.findIndex(
            doc => doc.id === action.payload.document.id
          );
          if (existingIndex >= 0) {
            state.userDocuments[existingIndex] = action.payload.document;
          } else {
            state.userDocuments.push(action.payload.document);
          }
        }
      })
      .addCase(uploadDocument.rejected, (state, action) => {
        state.uploadLoading = false;
        state.error = action.payload;
      })

      // Get user documents
      .addCase(getUserDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserDocuments.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          state.userDocuments = action.payload.data.documents || [];
        }
      })
      .addCase(getUserDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Check documentation status
      .addCase(checkDocumentationStatus.pending, (state) => {
        state.statusLoading = true;
        state.error = null;
      })
      .addCase(checkDocumentationStatus.fulfilled, (state, action) => {
        state.statusLoading = false;
        if (action.payload.success) {
          state.documentationStatus = action.payload.data;
        }
      })
      .addCase(checkDocumentationStatus.rejected, (state, action) => {
        state.statusLoading = false;
        state.error = action.payload;
      })

      // Delete document
      .addCase(deleteDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteDocument.fulfilled, (state, action) => {
        state.loading = false;
        state.userDocuments = state.userDocuments.filter(
          doc => doc.id !== action.payload.documentId
        );
      })
      .addCase(deleteDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

// Selectores
export const selectUserDocuments = (state) => state.document.userDocuments;
export const selectDocumentationStatus = (state) => state.document.documentationStatus;
export const selectDocumentLoading = (state) => state.document.loading;
export const selectUploadLoading = (state) => state.document.uploadLoading;
export const selectStatusLoading = (state) => state.document.statusLoading;
export const selectDocumentError = (state) => state.document.error;
export const selectUploadProgress = (state) => state.document.uploadProgress;

// Documentos requeridos por rol
export const REQUIRED_DOCUMENTS_BY_ROLE = {
  2: ['Firma Digital', 'RUT', 'Cédula Escaneada', 'Certificado Bancario'],
  3: ['Firma Digital', 'RUT', 'Cédula Escaneada', 'Certificado Bancario', 'Autorización Líder'],
  4: ['Firma Digital', 'RUT', 'Cédula Escaneada', 'Certificado Bancario', 'Autorización Gerente', 'Referencias Comerciales'],
};

// Selector de documentos requeridos por rol
export const selectRequiredDocumentsByRole = (state, role) => {
  return REQUIRED_DOCUMENTS_BY_ROLE[role] || [];
};

export const { clearError, resetUploadProgress, setUploadProgress } = documentSlice.actions;

export default documentSlice.reducer;
