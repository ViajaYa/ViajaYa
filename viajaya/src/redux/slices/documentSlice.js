import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Estado inicial
const initialState = {
  userDocuments: [],
  documentationStatus: null,
  pendingDocuments: [],
  allDocuments: [], // Nueva propiedad para todos los documentos
  documentStats: null,
  loading: false,
  uploadLoading: false,
  statusLoading: false,
  reviewLoading: false,
  statsLoading: false,
  allDocumentsLoading: false, // Loading específico para todos los documentos
  error: null,
  uploadProgress: 0,
  pagination: null // Para paginación
};

// ✅ Thunk para subir documento
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

      const response = await api.post(
        `/document-users/upload-file`,
        formData
        // No necesitamos headers - la instancia api los maneja automáticamente
      );
      
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Error al subir documento'
      );
    }
  }
);

// ✅ Thunk para obtener documentos de un usuario
export const getUserDocuments = createAsyncThunk(
  'document/getUserDocuments',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/document-users/user/${userId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al obtener documentos');
    }
  }
);

// ✅ Thunk para verificar estado de documentación
export const checkDocumentationStatus = createAsyncThunk(
  'document/checkDocumentationStatus',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/document-users/status/${userId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al verificar documentación');
    }
  }
);

// ✅ Thunk para eliminar documento
export const deleteDocument = createAsyncThunk(
  'document/deleteDocument',
  async (documentId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/document-users/${documentId}`);
      return { documentId, message: response.data.message };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al eliminar documento');
    }
  }
);

// ✅ Thunks para revisión de documentos (Owner)
export const getPendingDocuments = createAsyncThunk(
  'document/getPendingDocuments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/document-users/pending');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al obtener documentos pendientes');
    }
  }
);

export const getDocumentStats = createAsyncThunk(
  'document/getDocumentStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/document-users/stats');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al obtener estadísticas');
    }
  }
);

export const approveDocument = createAsyncThunk(
  'document/approveDocument',
  async ({ documentId, reviewerId, comments }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/document-users/${documentId}/approve`, {
        reviewerId,
        comments
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al aprobar documento');
    }
  }
);

export const rejectDocument = createAsyncThunk(
  'document/rejectDocument',
  async ({ documentId, reviewerId, reason, comments }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/document-users/${documentId}/reject`, {
        reviewerId,
        reason,
        comments
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al rechazar documento');
    }
  }
);

// ✅ Thunk para obtener todos los documentos con filtros
export const getAllDocuments = createAsyncThunk(
  'document/getAllDocuments',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.role) queryParams.append('role', filters.role);
      if (filters.page) queryParams.append('page', filters.page);
      if (filters.limit) queryParams.append('limit', filters.limit);

      const response = await api.get(`/document-users/all?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error al obtener documentos');
    }
  }
);

// ✅ Slice de documentos
const documentSlice = createSlice({
  name: 'document', // Cambiado para coincidir con el store
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
          // Agregar o actualizar el documento en la lista
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
        state.pendingDocuments = state.pendingDocuments.filter(
          doc => doc.id !== action.payload.documentId
        );
      })
      .addCase(deleteDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get pending documents
      .addCase(getPendingDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPendingDocuments.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          state.pendingDocuments = action.payload.data.documents || [];
        }
      })
      .addCase(getPendingDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get document stats
      .addCase(getDocumentStats.pending, (state) => {
        state.statsLoading = true;
        state.error = null;
      })
      .addCase(getDocumentStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        if (action.payload.success) {
          state.documentStats = action.payload.data;
        }
      })
      .addCase(getDocumentStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.error = action.payload;
      })

      // Approve document
      .addCase(approveDocument.pending, (state) => {
        state.reviewLoading = true;
        state.error = null;
      })
      .addCase(approveDocument.fulfilled, (state, action) => {
        state.reviewLoading = false;
        if (action.payload.success) {
          const pendingIndex = state.pendingDocuments.findIndex(
            doc => doc.id === action.payload.document.id
          );
          if (pendingIndex >= 0) {
            state.pendingDocuments[pendingIndex] = action.payload.document;
          }
          const userDocIndex = state.userDocuments.findIndex(
            doc => doc.id === action.payload.document.id
          );
          if (userDocIndex >= 0) {
            state.userDocuments[userDocIndex] = action.payload.document;
          }
        }
      })
      .addCase(approveDocument.rejected, (state, action) => {
        state.reviewLoading = false;
        state.error = action.payload;
      })

      // Reject document
      .addCase(rejectDocument.pending, (state) => {
        state.reviewLoading = true;
        state.error = null;
      })
      .addCase(rejectDocument.fulfilled, (state, action) => {
        state.reviewLoading = false;
        if (action.payload.success) {
          const pendingIndex = state.pendingDocuments.findIndex(
            doc => doc.id === action.payload.document.id
          );
          if (pendingIndex >= 0) {
            state.pendingDocuments[pendingIndex] = action.payload.document;
          }
          const userDocIndex = state.userDocuments.findIndex(
            doc => doc.id === action.payload.document.id
          );
          if (userDocIndex >= 0) {
            state.userDocuments[userDocIndex] = action.payload.document;
          }
          const allDocIndex = state.allDocuments.findIndex(
            doc => doc.id === action.payload.document.id
          );
          if (allDocIndex >= 0) {
            state.allDocuments[allDocIndex] = action.payload.document;
          }
        }
      })
      .addCase(rejectDocument.rejected, (state, action) => {
        state.reviewLoading = false;
        state.error = action.payload;
      })

      // Get all documents
      .addCase(getAllDocuments.pending, (state) => {
        state.allDocumentsLoading = true;
        state.error = null;
      })
      .addCase(getAllDocuments.fulfilled, (state, action) => {
        state.allDocumentsLoading = false;
        if (action.payload.success) {
          state.allDocuments = action.payload.data.documents || [];
          state.pagination = action.payload.data.pagination;
        }
      })
      .addCase(getAllDocuments.rejected, (state, action) => {
        state.allDocumentsLoading = false;
        state.error = action.payload;
      });
  }
});

// ✅ Selectores
export const selectUserDocuments = (state) => state.document.userDocuments;
export const selectDocumentationStatus = (state) => state.document.documentationStatus;
export const selectDocumentLoading = (state) => state.document.loading;
export const selectUploadLoading = (state) => state.document.uploadLoading;
export const selectStatusLoading = (state) => state.document.statusLoading;
export const selectReviewLoading = (state) => state.document.reviewLoading;
export const selectStatsLoading = (state) => state.document.statsLoading;
export const selectAllDocumentsLoading = (state) => state.document.allDocumentsLoading;
export const selectDocumentError = (state) => state.document.error;
export const selectUploadProgress = (state) => state.document.uploadProgress;
export const selectPendingDocuments = (state) => state.document.pendingDocuments;
export const selectAllDocuments = (state) => state.document.allDocuments;
export const selectDocumentStats = (state) => state.document.documentStats;
export const selectDocumentPagination = (state) => state.document.pagination;

// ✅ Documentos requeridos por rol
export const REQUIRED_DOCUMENTS_BY_ROLE = {
  2: ['Firma Digital', 'RUT', 'Cédula Escaneada', 'Certificado Bancario'], // Asesor
  3: ['Firma Digital', 'RUT', 'Cédula Escaneada', 'Certificado Bancario', 'Autorización Líder'], // Líder
  4: ['Firma Digital', 'RUT', 'Cédula Escaneada', 'Certificado Bancario', 'Autorización Gerente', 'Referencias Comerciales'], // Gerente
};

// ✅ Selector de documentos requeridos por rol
export const selectRequiredDocumentsByRole = (state, role) => {
  return REQUIRED_DOCUMENTS_BY_ROLE[role] || [];
};

export const { clearError, resetUploadProgress, setUploadProgress } = documentSlice.actions;

// Export del reducer como default
export default documentSlice.reducer;
