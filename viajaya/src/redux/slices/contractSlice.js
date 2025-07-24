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
