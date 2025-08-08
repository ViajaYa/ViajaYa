import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getApiUrl } from "../../utils/env";

// Estado inicial
const initialState = {
  contracts: [],
  currentContract: null,
  contractTemplates: [],
  loading: false,
  error: null,
  filters: {
    status: "all",
    clientId: null,
    startDate: null,
    endDate: null,
    contractType: "all",
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
  contractItems: [],
  contractItemsLoading: false,
  contractItemsError: null,
  emailPreview: null,
  emailPreviewLoading: false,
  emailPreviewError: null,

 purchaseManagement: {
    items: [],
    stats: null,
    loading: false,
    error: null,
    uploadingReceipt: false,
    updatingDeadline: false,
    markingPayment: false,
  },
};

// Thunks asíncronos
export const fetchContracts = createAsyncThunk(
  "contract/fetchContracts",
  async (
    { page = 1, limit = 10, filters = {} },
    { rejectWithValue, getState }
  ) => {
    try {
      const { auth } = getState();
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters,
      });

      const response = await fetch(getApiUrl(`/contracts?${queryParams}`), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || "Error obteniendo contratos");
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Error de conexión");
    }
  }
);

export const fetchContractById = createAsyncThunk(
  "contract/fetchContractById",
  async (contractId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl(`/contracts/${contractId}`), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || "Error obteniendo contrato");
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Error de conexión");
    }
  }
);

export const createContract = createAsyncThunk(
  "contract/createContract",
  async (contractData, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl("/contracts"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contractData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || "Error creando contrato");
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Error de conexión");
    }
  }
);

export const fetchContractItems = createAsyncThunk(
  "contractItems/fetchContractItems",
  async (contractId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(
        getApiUrl(`/contracts/${contractId}/items`),
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${auth.token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(
          data.message || "Error obteniendo items del contrato"
        );
      }
      return data.items;
    } catch (error) {
      return rejectWithValue(error.message || "Error de conexión");
    }
  }
);

export const fetchContractItemsWithPurchases = createAsyncThunk(
  "contract/fetchContractItemsWithPurchases",
  async (contractId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      console.log('🔍 Fetching contract items with purchases for:', contractId);

      const response = await fetch(
        getApiUrl(`/contracts/${contractId}/items-with-purchases`),
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${auth.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      console.log('📦 Items with purchases response:', data);

      if (!response.ok) {
        return rejectWithValue(
          data.message || "Error obteniendo items con compras"
        );
      }

      return data;
    } catch (error) {
      console.error('❌ Error fetching items with purchases:', error);
      return rejectWithValue(error.message || "Error de conexión");
    }
  }
);

export const uploadPurchaseReceipt = createAsyncThunk(
  "contract/uploadPurchaseReceipt",
  async ({ itemId, formData }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      console.log('📎 Uploading receipt for item:', itemId);

      const response = await fetch(
        getApiUrl(`/contracts/items/${itemId}/upload-receipt`),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${auth.token}`,
            // ✅ NO agregar Content-Type para FormData - el browser lo hace automáticamente
          },
          body: formData,
        }
      );

      const data = await response.json();
      console.log('📎 Upload receipt response:', data);

      if (!response.ok) {
        return rejectWithValue(
          data.message || "Error subiendo comprobante"
        );
      }

      return data;
    } catch (error) {
      console.error('❌ Error uploading receipt:', error);
      return rejectWithValue(error.message || "Error de conexión");
    }
  }
);

// ✅ NUEVO: Actualizar fecha límite de compra
export const updateItemDeadline = createAsyncThunk(
  "contract/updateItemDeadline",
  async ({ itemId, fecha_limite_compra }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      console.log('📅 Updating deadline for item:', itemId, 'to:', fecha_limite_compra);

      const response = await fetch(
        getApiUrl(`/contracts/items/${itemId}/deadline`),
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${auth.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ fecha_limite_compra }),
        }
      );

      const data = await response.json();
      console.log('📅 Update deadline response:', data);

      if (!response.ok) {
        return rejectWithValue(
          data.message || "Error actualizando fecha límite"
        );
      }

      return data;
    } catch (error) {
      console.error('❌ Error updating deadline:', error);
      return rejectWithValue(error.message || "Error de conexión");
    }
  }
);

// ✅ NUEVO: Marcar pago como completado
export const markPaymentCompleted = createAsyncThunk(
  "contract/markPaymentCompleted",
  async ({ purchaseId, observaciones }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      console.log('💳 Marking payment completed for purchase:', purchaseId);

      const response = await fetch(
        getApiUrl(`/contracts/purchases/${purchaseId}/mark-paid`),
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${auth.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ observaciones }),
        }
      );

      const data = await response.json();
      console.log('💳 Mark payment response:', data);

      if (!response.ok) {
        return rejectWithValue(
          data.message || "Error marcando pago como completado"
        );
      }

      return data;
    } catch (error) {
      console.error('❌ Error marking payment completed:', error);
      return rejectWithValue(error.message || "Error de conexión");
    }
  }
);

// ✅ NUEVO: Obtener estadísticas de compras
export const fetchContractPurchaseStats = createAsyncThunk(
  "contract/fetchContractPurchaseStats",
  async (contractId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      console.log('📊 Fetching purchase stats for contract:', contractId);

      const response = await fetch(
        getApiUrl(`/contracts/${contractId}/purchase-stats`),
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${auth.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      console.log('📊 Purchase stats response:', data);

      if (!response.ok) {
        return rejectWithValue(
          data.message || "Error obteniendo estadísticas de compras"
        );
      }

      return data;
    } catch (error) {
      console.error('❌ Error fetching purchase stats:', error);
      return rejectWithValue(error.message || "Error de conexión");
    }
  }
);

// ✅ NUEVO: Convertir cotización a items de contrato
export const convertQuoteToContractItems = createAsyncThunk(
  "contract/convertQuoteToContractItems",
  async (contractId, { rejectWithValue, getState }) => {
    console.log('🔄 SLICE: Iniciando conversión de cotización a items');
    console.log('📋 SLICE: Contract ID recibido:', contractId);
    
    try {
      const { auth } = getState();
      console.log('🔐 SLICE: Auth token presente:', !!auth.token);
      console.log('🔐 SLICE: Auth token length:', auth.token?.length);
      
      const url = getApiUrl(`/contracts/${contractId}/convert-quote-items`);
      console.log('📡 SLICE: URL completa:', url);
      
      console.log('📤 SLICE: Enviando petición POST...');
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
        },
      });

      console.log('📨 SLICE: Respuesta recibida');
      console.log('📨 SLICE: Status:', response.status);
      console.log('📨 SLICE: Status Text:', response.statusText);
      console.log('📨 SLICE: Headers:', Object.fromEntries(response.headers.entries()));

      // ✅ AGREGAR: Verificar si la respuesta es JSON válida
      const contentType = response.headers.get('content-type');
      console.log('📨 SLICE: Content-Type:', contentType);
      
      let data;
      try {
        data = await response.json();
        console.log('✅ SLICE: JSON parseado exitosamente:', data);
      } catch (jsonError) {
        console.error('❌ SLICE: Error parseando JSON:', jsonError);
        const textResponse = await response.text();
        console.error('❌ SLICE: Respuesta como texto:', textResponse.substring(0, 500));
        throw new Error('La respuesta del servidor no es JSON válido');
      }

      if (!response.ok) {
        console.error('❌ SLICE: Respuesta no exitosa');
        console.error('❌ SLICE: Error data:', data);
        return rejectWithValue(
          data.message || "Error convirtiendo cotización a items"
        );
      }

      console.log('✅ SLICE: Conversión exitosa');
      console.log('✅ SLICE: Items creados:', data.items?.length || 0);
      console.log('✅ SLICE: Datos completos:', data);
      
      return data;
      
    } catch (error) {
      console.error('❌ SLICE: Error en catch block');
      console.error('❌ SLICE: Error type:', error.constructor.name);
      console.error('❌ SLICE: Error message:', error.message);
      console.error('❌ SLICE: Error stack:', error.stack);
      
      return rejectWithValue(error.message || "Error de conexión");
    }
  }
);

export const updateContract = createAsyncThunk(
  "contract/updateContract",
  async ({ id, updates }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl(`/contracts/${id}`), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || "Error actualizando contrato");
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Error de conexión");
    }
  }
);

export const deleteContract = createAsyncThunk(
  "contract/deleteContract",
  async (contractId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl(`/contracts/${contractId}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json();
        return rejectWithValue(data.message || "Error eliminando contrato");
      }

      return contractId;
    } catch (error) {
      return rejectWithValue(error.message || "Error de conexión");
    }
  }
);

export const signContract = createAsyncThunk(
  "contract/signContract",
  async ({ contractId, signatureData }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl(`/contracts/${contractId}/sign`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signatureData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || "Error firmando contrato");
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Error de conexión");
    }
  }
);

export const generateContractPDF = createAsyncThunk(
  "contract/generateContractPDF",
  async (contractId, { rejectWithValue, getState }) => {
    try {
      console.log("🔄 Generando PDF para contrato:", contractId);

      const { auth } = getState();
      const response = await fetch(
        getApiUrl(`/contracts/${contractId}/generate-pdf`),
        {
          // ✅ CORREGIR: Ruta correcta
          method: "POST",
          headers: {
            Authorization: `Bearer ${auth.token}`,
            "Content-Type": "application/json", // ✅ AGREGAR: Content-Type
          },
        }
      );

      console.log("📡 Status de respuesta:", response.status);
      console.log("📡 Content-Type:", response.headers.get("content-type"));

      // ✅ VERIFICAR: Si la respuesta es JSON (no blob)
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error(
          "❌ Respuesta no es JSON:",
          textResponse.substring(0, 200)
        );
        throw new Error("El servidor no devolvió una respuesta JSON válida");
      }

      const data = await response.json(); // ✅ CAMBIAR: Manejar como JSON

      if (!response.ok) {
        return rejectWithValue(data.message || "Error generando PDF");
      }

      console.log("✅ PDF generado exitosamente:", data);
      return data; // ✅ RETORNAR: Datos del PDF generado
    } catch (error) {
      console.error("❌ Error en generateContractPDF:", error);
      return rejectWithValue(error.message || "Error de conexión");
    }
  }
);

export const previewContractEmail = createAsyncThunk(
  "contract/previewContractEmail",
  async (contractId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(
        getApiUrl(`/contracts/${contractId}/email-preview`),
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${auth.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(
          data.message || "Error obteniendo preview del email"
        );
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Error de conexión");
    }
  }
);

export const sendContractForSignature = createAsyncThunk(
  "contract/sendContractForSignature",
  async ({ contractId, emailData }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl(`/contracts/${contractId}/send`), {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(
          data.message || "Error enviando contrato para firma"
        );
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Error de conexión");
    }
  }
);

export const fetchContractTemplates = createAsyncThunk(
  "contract/fetchContractTemplates",
  async (_, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl("/contracts/templates"), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || "Error obteniendo plantillas");
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Error de conexión");
    }
  }
);

export const createContractFromTemplate = createAsyncThunk(
  "contract/createContractFromTemplate",
  async ({ templateId, contractData }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(
        getApiUrl(`/contracts/from-template/${templateId}`),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${auth.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(contractData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(
          data.message || "Error creando contrato desde plantilla"
        );
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Error de conexión");
    }
  }
);

export const fetchContractStats = createAsyncThunk(
  "contract/fetchContractStats",
  async (_, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl("/contracts/stats"), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || "Error obteniendo estadísticas");
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Error de conexión");
    }
  }
);

// Slice
const contractSlice = createSlice({
  name: "contract",
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
        status: "all",
        clientId: null,
        startDate: null,
        endDate: null,
        contractType: "all",
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
      const contract = state.contracts.find((c) => c.id === contractId);
      if (contract) {
        contract.status = status;
      }
      if (state.currentContract?.id === contractId) {
        state.currentContract.status = status;
      }
    },

    clearContractItemsError: (state) => {
      state.contractItemsError = null;
    },
    resetContractItems: (state) => {
      state.contractItems = [];
      state.contractItemsLoading = false;
      state.contractItemsError = null;
    },
    clearEmailPreview: (state) => {
      state.emailPreview = null;
      state.emailPreviewError = null;
    },
    clearEmailPreviewError: (state) => {
      state.emailPreviewError = null;
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
          totalPages: Math.ceil(
            (action.payload.total || 0) / state.pagination.limit
          ),
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
        // ✅ AJUSTAR: Verificar que action.payload tenga la estructura correcta
        const newContract = action.payload.contract || action.payload;
        state.contracts.unshift(newContract);
        state.currentContract = newContract;

        // ✅ ACTUALIZAR: Estadísticas
        state.stats.totalContracts += 1;
        if (newContract.status === "draft") {
          state.stats.pendingContracts += 1;
        }
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
        const index = state.contracts.findIndex(
          (c) => c.id === action.payload.id
        );
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
        state.contracts = state.contracts.filter(
          (c) => c.id !== action.payload
        );
        if (state.currentContract?.id === action.payload) {
          state.currentContract = null;
        }
      })
      .addCase(deleteContract.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(previewContractEmail.pending, (state) => {
        state.emailPreviewLoading = true;
        state.emailPreviewError = null;
      })
      .addCase(previewContractEmail.fulfilled, (state, action) => {
        state.emailPreviewLoading = false;
        state.emailPreview = action.payload.emailData;
      })
      .addCase(previewContractEmail.rejected, (state, action) => {
        state.emailPreviewLoading = false;
        state.emailPreviewError = action.payload;
      })
      // Sign Contract
      .addCase(signContract.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signContract.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.contracts.findIndex(
          (c) => c.id === action.payload.id
        );
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
      // ✅ MODIFICAR: extraReducers para generateContractPDF
      .addCase(generateContractPDF.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateContractPDF.fulfilled, (state, action) => {
        state.loading = false;

        const { contractId, pdf } = action.payload;

        // ✅ ACTUALIZAR: El contrato actual con la URL del PDF
        if (
          state.currentContract &&
          state.currentContract.contract &&
          state.currentContract.contract.id === action.payload.contract?.id
        ) {
          state.currentContract.contract.contrato_pdf_url = pdf?.url;
        }

        // ✅ ACTUALIZAR: En la lista de contratos si existe
        const contractIndex = state.contracts.findIndex(
          (c) => c.id === action.payload.contract?.id
        );
        if (contractIndex !== -1) {
          state.contracts[contractIndex].contrato_pdf_url = pdf?.url;
        }

        console.log("✅ Estado actualizado con PDF URL:", pdf?.url);
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
        const index = state.contracts.findIndex(
          (c) => c.id === action.payload.id
        );
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
      })

      .addCase(fetchContractItems.pending, (state) => {
        state.contractItemsLoading = true;
        state.contractItemsError = null;
      })
      .addCase(fetchContractItems.fulfilled, (state, action) => {
        state.contractItemsLoading = false;
        state.contractItems = action.payload;
      })
      .addCase(fetchContractItems.rejected, (state, action) => {
        state.contractItemsLoading = false;
        state.contractItemsError = action.payload;
      })

      .addCase(fetchContractItemsWithPurchases.pending, (state) => {
        state.purchaseManagement.loading = true;
        state.purchaseManagement.error = null;
      })
      .addCase(fetchContractItemsWithPurchases.fulfilled, (state, action) => {
        state.purchaseManagement.loading = false;
        state.purchaseManagement.items = action.payload.items || [];
        state.purchaseManagement.stats = action.payload.summary || null;
        console.log('✅ Contract items with purchases loaded:', action.payload.items?.length);
      })
      .addCase(fetchContractItemsWithPurchases.rejected, (state, action) => {
        state.purchaseManagement.loading = false;
        state.purchaseManagement.error = action.payload;
        state.purchaseManagement.items = [];
      })

      // Upload Purchase Receipt
      .addCase(uploadPurchaseReceipt.pending, (state) => {
        state.purchaseManagement.uploadingReceipt = true;
        state.purchaseManagement.error = null;
      })
      .addCase(uploadPurchaseReceipt.fulfilled, (state, action) => {
        state.purchaseManagement.uploadingReceipt = false;
        
        // ✅ Actualizar el item específico en la lista
        const updatedPurchase = action.payload.purchase;
        const itemIndex = state.purchaseManagement.items.findIndex(
          item => item.id === updatedPurchase.contract_item_id
        );
        
        if (itemIndex !== -1) {
          // Agregar la nueva compra al item
          if (!state.purchaseManagement.items[itemIndex].Purchases) {
            state.purchaseManagement.items[itemIndex].Purchases = [];
          }
          state.purchaseManagement.items[itemIndex].Purchases.unshift(updatedPurchase);
          
          // Actualizar status del item
          state.purchaseManagement.items[itemIndex].status = 'comprado_pendiente';
        }
        
        console.log('✅ Purchase receipt uploaded successfully');
      })
      .addCase(uploadPurchaseReceipt.rejected, (state, action) => {
        state.purchaseManagement.uploadingReceipt = false;
        state.purchaseManagement.error = action.payload;
      })

      // Update Item Deadline
      .addCase(updateItemDeadline.pending, (state) => {
        state.purchaseManagement.updatingDeadline = true;
        state.purchaseManagement.error = null;
      })
      .addCase(updateItemDeadline.fulfilled, (state, action) => {
        state.purchaseManagement.updatingDeadline = false;
        
        // ✅ Actualizar el item específico
        const updatedItem = action.payload.item;
        const itemIndex = state.purchaseManagement.items.findIndex(
          item => item.id === updatedItem.id
        );
        
        if (itemIndex !== -1) {
          state.purchaseManagement.items[itemIndex].fecha_limite_compra = 
            updatedItem.fecha_limite_compra;
        }
        
        console.log('✅ Item deadline updated successfully');
      })
      .addCase(updateItemDeadline.rejected, (state, action) => {
        state.purchaseManagement.updatingDeadline = false;
        state.purchaseManagement.error = action.payload;
      })

      // Mark Payment Completed
      .addCase(markPaymentCompleted.pending, (state) => {
        state.purchaseManagement.markingPayment = true;
        state.purchaseManagement.error = null;
      })
      .addCase(markPaymentCompleted.fulfilled, (state, action) => {
        state.purchaseManagement.markingPayment = false;
        
        // ✅ Actualizar la compra y el item
        const updatedPurchase = action.payload.purchase;
        
        state.purchaseManagement.items.forEach(item => {
          if (item.Purchases) {
            const purchaseIndex = item.Purchases.findIndex(
              p => p.id === updatedPurchase.id
            );
            if (purchaseIndex !== -1) {
              item.Purchases[purchaseIndex] = updatedPurchase;
              item.status = 'comprado_pagado';
            }
          }
        });
        
        console.log('✅ Payment marked as completed successfully');
      })
      .addCase(markPaymentCompleted.rejected, (state, action) => {
        state.purchaseManagement.markingPayment = false;
        state.purchaseManagement.error = action.payload;
      })

      // Fetch Contract Purchase Stats
      .addCase(fetchContractPurchaseStats.pending, (state) => {
        state.purchaseManagement.loading = true;
        state.purchaseManagement.error = null;
      })
      .addCase(fetchContractPurchaseStats.fulfilled, (state, action) => {
        state.purchaseManagement.loading = false;
        state.purchaseManagement.stats = action.payload.stats || null;
        console.log('✅ Purchase stats loaded successfully');
      })
      .addCase(fetchContractPurchaseStats.rejected, (state, action) => {
        state.purchaseManagement.loading = false;
        state.purchaseManagement.error = action.payload;
      })

     .addCase(convertQuoteToContractItems.pending, (state) => {
  console.log('⏳ REDUCER: convertQuoteToContractItems.pending');
  state.loading = true;
  state.error = null;
})
.addCase(convertQuoteToContractItems.fulfilled, (state, action) => {
  console.log('✅ REDUCER: convertQuoteToContractItems.fulfilled');
  console.log('✅ REDUCER: Action payload:', action.payload);
  
  state.loading = false;
  
  // ✅ MEJORAR: Manejo de los items creados
  if (action.payload.success) {
    console.log('✅ REDUCER: Conversión marcada como exitosa');
  }
  
  if (action.payload.items && Array.isArray(action.payload.items)) {
    console.log('✅ REDUCER: Agregando items al estado:', action.payload.items.length);
    state.contractItems = [...state.contractItems, ...action.payload.items];
  } else {
    console.log('⚠️ REDUCER: No se encontraron items en la respuesta');
  }
  
  // ✅ AGREGAR: Actualizar el currentContract si está disponible
  if (state.currentContract && action.payload.contract) {
    console.log('✅ REDUCER: Actualizando currentContract con datos nuevos');
    state.currentContract = {
      ...state.currentContract,
      ...action.payload.contract
    };
  }
  
  console.log('✅ REDUCER: Quote converted to contract items:', action.payload.items?.length || 0);
})
.addCase(convertQuoteToContractItems.rejected, (state, action) => {
  console.error('❌ REDUCER: convertQuoteToContractItems.rejected');
  console.error('❌ REDUCER: Error payload:', action.payload);
  
  state.loading = false;
  state.error = action.payload;
})
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
  clearContractItemsError,
  resetContractItems,
  clearEmailPreview,
  clearEmailPreviewError,
} = contractSlice.actions;

// Selectores
export const selectContracts = (state) => state.contract.contracts;
export const selectCurrentContract = (state) => state.contract.currentContract;
export const selectContractTemplates = (state) =>
  state.contract.contractTemplates;
export const selectContractLoading = (state) => state.contract.loading;
export const selectContractError = (state) => state.contract.error;
export const selectContractFilters = (state) => state.contract.filters;
export const selectContractPagination = (state) => state.contract.pagination;
export const selectContractStats = (state) => state.contract.stats;
export const selectContractItems = (state) => state.contract.contractItems;
export const selectPurchaseManagement = (state) => state.contract.purchaseManagement;
export const selectPurchaseItems = (state) => state.contract.purchaseManagement.items;
export const selectPurchaseStats = (state) => state.contract.purchaseManagement.stats;
export const selectPurchaseLoading = (state) => state.contract.purchaseManagement.loading;
export const selectPurchaseError = (state) => state.contract.purchaseManagement.error;
export const selectUploadingReceipt = (state) => state.contract.purchaseManagement.uploadingReceipt;
export const selectUpdatingDeadline = (state) => state.contract.purchaseManagement.updatingDeadline;
export const selectMarkingPayment = (state) => state.contract.purchaseManagement.markingPayment;

// ✅ NUEVO: Selectores calculados
export const selectItemsByStatus = (status) => (state) =>
  state.contract.purchaseManagement.items.filter(item => item.status === status);

export const selectPendingPurchases = (state) =>
  state.contract.purchaseManagement.items.filter(item => item.status === 'pendiente_compra');

export const selectCompletedPurchases = (state) =>
  state.contract.purchaseManagement.items.filter(item => item.status === 'comprado_pagado');

export const selectCriticalItems = (state) => {
  const now = new Date();
  return state.contract.purchaseManagement.items.filter(item => {
    if (!item.fecha_limite_compra || item.status === 'comprado_pagado') return false;
    const deadline = new Date(item.fecha_limite_compra);
    const diffHours = (deadline - now) / (1000 * 60 * 60);
    return diffHours < 24 && diffHours >= 0;
  });
};

export const selectOverdueItems = (state) => {
  const now = new Date();
  return state.contract.purchaseManagement.items.filter(item => {
    if (!item.fecha_limite_compra || item.status === 'comprado_pagado') return false;
    const deadline = new Date(item.fecha_limite_compra);
    return deadline < now;
  });
};

export const selectItemsByType = (tipo) => (state) =>
  state.contract.purchaseManagement.items.filter(item => item.tipo === tipo);
export const selectContractItemsLoading = (state) =>
  state.contract.contractItemsLoading;
export const selectContractItemsError = (state) =>
  state.contract.contractItemsError;
export const selectEmailPreview = (state) => state.contract.emailPreview;
export const selectEmailPreviewLoading = (state) =>
  state.contract.emailPreviewLoading;
export const selectEmailPreviewError = (state) =>
  state.contract.emailPreviewError;
export const selectContractsWithDetails = (state) => {
  return state.contract.contracts.map((contract) => ({
    ...contract,
    // ✅ Datos del cliente (desde relación directa)
    clienteName: contract.Cliente
      ? `${contract.Cliente.name} ${contract.Cliente.lastname}`
      : contract.Quote?.nombre_cliente,
    clienteEmail: contract.Cliente?.email || contract.Quote?.email_cliente,
    clientePhone: contract.Cliente?.phone,

    // ✅ Datos del viaje (desde Quote)
    destino: contract.Quote?.destino,
    origen: contract.Quote?.origen,
    quoteNumber: contract.Quote?.quote_number,

    // ✅ Jerarquía de ventas
    asesor: contract.Quote?.Asesor,
    lider: contract.Quote?.Lider,
    gerente: contract.Quote?.Gerente,
    admin: contract.Quote?.Admin,

    // ✅ Estado calculado
    isActive: contract.status === "active",
    isPending: contract.status === "draft",
    isCompleted: contract.status === "completed",

    // ✅ Información de pagos
    hasPendingPayments: parseFloat(contract.saldo_pendiente) > 0,
    paymentProgress: (
      (parseFloat(contract.total_pagado) / parseFloat(contract.precio_total)) *
      100
    ).toFixed(1),
  }));
};
export const selectQuoteCalculationAnalysis = (state) => 
  state.contract.currentContract?.quote_calculation_analysis;

export const selectConversionStatus = (state) => 
  state.contract.currentContract?.conversion_status;

export const selectTripDetails = (state) => 
  state.contract.currentContract?.trip_details;

export const selectPassengersSummary = (state) => 
  state.contract.currentContract?.passengers_summary;

export const selectContractItemsAnalysis = (state) => 
  state.contract.currentContract?.contract_items_analysis;

// ✅ AGREGAR: Selectores calculados específicos para gestión de compras
export const selectCanConvertQuote = (state) => 
  state.contract.currentContract?.conversion_status?.can_convert || false;

export const selectIsReadyForPurchaseManagement = (state) => 
  state.contract.currentContract?.conversion_status?.ready_for_purchase_management || false;

export const selectItemsRequireingPurchase = (state) => 
  state.contract.currentContract?.quote_calculation_analysis?.items_detallados?.filter(
    item => item.requiere_compra
  ) || [];

export const selectTotalPurchaseValue = (state) => 
  state.contract.currentContract?.quote_calculation_analysis?.valor_total_compras || 0;

// ✅ AGREGAR: Selector para obtener el cálculo completo
export const selectQuoteCalculation = (state) => 
  state.contract.currentContract?.contract?.Quote?.Calculation;

export const selectUrgentItems = (state) => {
  const calculation = state.contract.currentContract?.quote_calculation_analysis;
  if (!calculation?.items_detallados) return [];
  
  return calculation.items_detallados.filter(item => 
    item.requiere_compra && item.prioridad === 'critica'
  );
};

// ✅ AGREGAR: Selector para resumen financiero
export const selectFinancialSummary = (state) => {
  const analysis = state.contract.currentContract?.quote_calculation_analysis;
  const contract = state.contract.currentContract?.contract;
  
  if (!analysis || !contract) return null;
  
  return {
    precio_total: parseFloat(contract.precio_total || 0),
    costo_compras: analysis.valor_total_compras,
    total_comisiones: analysis.financials.total_comisiones,
    ganancia_empresa: analysis.financials.total_ganancia,
    margen_bruto: analysis.valor_total_compras > 0 
      ? ((parseFloat(contract.precio_total) - analysis.valor_total_compras) / parseFloat(contract.precio_total) * 100).toFixed(2)
      : 0
  };
};

export const selectContractSummary = (state) => {
  const contracts = state.contract.contracts;

  return {
    total: contracts.length,
    active: contracts.filter((c) => c.status === "active").length,
    pending: contracts.filter((c) => c.status === "draft").length,
    completed: contracts.filter((c) => c.status === "completed").length,
    totalValue: contracts.reduce(
      (sum, c) => sum + parseFloat(c.precio_total || 0),
      0
    ),
    totalPaid: contracts.reduce(
      (sum, c) => sum + parseFloat(c.total_pagado || 0),
      0
    ),
    totalPending: contracts.reduce(
      (sum, c) => sum + parseFloat(c.saldo_pendiente || 0),
      0
    ),
  };
};

// Exportar el reducer
export default contractSlice.reducer;
