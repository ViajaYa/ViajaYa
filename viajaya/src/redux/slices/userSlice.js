import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';


const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}; 
// Estado inicial
const initialState = {
  currentUser: null,
  users: [],
  allUsers: [],
  filteredUsers: [],
  loading: false,
  error: null,
  searchTerm: '',
  // ✅ NUEVOS estados para funcionalidades organizacionales
  organizationStructure: null,
  teamMetrics: null,
  dashboard: null,
  pendingCommissions: [],
  organizationLoading: false,
  metricsLoading: false,
  dashboardLoading: false,
  commissionsLoading: false,
};
// Thunks asíncronos
export const registerUser = createAsyncThunk(
  'user/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE_URL}/user/register`, userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Error al registrar usuario'
      );
    }
  }
);

export const fetchAllUsers = createAsyncThunk(
  'user/fetchAllUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/user`, {
        headers: getAuthHeaders()
      });
      // Manejar diferentes estructuras de respuesta
      return Array.isArray(response.data) ? response.data : (response.data.users || response.data.data || []);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Error al obtener usuarios'
      );
    }
  }
);


export const updateUser = createAsyncThunk(
  'user/updateUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${BASE_URL}/user/update/${userData.id}`, userData, {
        headers: getAuthHeaders()
      });
      
      console.log('🔍 updateUser response:', response.data);
      
      // ✅ CORRECCIÓN: Verificar la estructura de la respuesta
      if (response.data.success) {
        // Si el backend retorna el usuario actualizado
        if (response.data.user) {
          return response.data.user;
        }
        // Si el backend solo retorna un mensaje de éxito, devolver los datos enviados
        else {
          return userData;
        }
      } else {
        return rejectWithValue(response.data.message || 'Error al actualizar usuario');
      }
    } catch (error) {
      console.error('❌ updateUser error:', error);
      return rejectWithValue(
        error.response?.data?.message || 'Error al actualizar usuario'
      );
    }
  }
);


export const deleteUser = createAsyncThunk(
  'user/deleteUser',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${BASE_URL}/user/${userId}`, {
        headers: getAuthHeaders()
      });
      
      // ✅ Retornamos el ID del usuario eliminado para actualizar el estado
      return {
        id: userId,
        message: response.data.user
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Error al eliminar usuario'
      );
    }
  }
);

// ✅ NUEVO: Thunk para obtener usuario por ID
export const fetchUserById = createAsyncThunk(
  'user/fetchUserById',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/user/${userId}`, {
        headers: getAuthHeaders()
      });
      return response.data.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Error al obtener usuario'
      );
    }
  }
);

export const fetchOrganizationStructure = createAsyncThunk(
  'user/fetchOrganizationStructure',
  async ({ userId, includeCommissions = false, period = 'current_month' }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        includeCommissions: includeCommissions.toString(),
        period
      });
      
      const response = await axios.get(
        `${BASE_URL}/user/organization/${userId}?${params}`, 
        { headers: getAuthHeaders() }
      );
      
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Error al obtener estructura organizacional'
      );
    }
  }
);

export const fetchTeamMetrics = createAsyncThunk(
  'user/fetchTeamMetrics',
  async ({ managerId, period = 'current_month' }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ period });
      
      const response = await axios.get(
        `${BASE_URL}/user/metrics/${managerId}?${params}`, 
        { headers: getAuthHeaders() }
      );
      
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Error al obtener métricas del equipo'
      );
    }
  }
);

export const fetchManagerDashboard = createAsyncThunk(
  'user/fetchManagerDashboard',
  async ({ managerId, period = 'current_month' }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ period });
      
      const response = await axios.get(
        `${BASE_URL}/user/dashboard/${managerId}?${params}`, 
        { headers: getAuthHeaders() }
      );
      
      return response.data.dashboard;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Error al obtener dashboard'
      );
    }
  }
);

export const fetchPendingCommissions = createAsyncThunk(
  'user/fetchPendingCommissions',
  async ({ managerId, status = 'pending', limit = 50, offset = 0 }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        status,
        limit: limit.toString(),
        offset: offset.toString()
      });
      
      const response = await axios.get(
        `${BASE_URL}/user/commissions/pending/${managerId}?${params}`, 
        { headers: getAuthHeaders() }
      );
      
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Error al obtener comisiones pendientes'
      );
    }
  }
);

// ✅ NUEVAS funciones de gestión de usuarios

export const changeUserPassword = createAsyncThunk(
  'user/changeUserPassword',
  async ({ userId, newPassword }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${BASE_URL}/user/reset-password/${userId}`, 
        { newPassword },
        { headers: getAuthHeaders() }
      );
      
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Error al cambiar contraseña'
      );
    }
  }
);

export const unlockUserAccount = createAsyncThunk(
  'user/unlockUserAccount',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${BASE_URL}/user/unlock/${userId}`, 
        {},
        { headers: getAuthHeaders() }
      );
      
      return { userId, ...response.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Error al desbloquear cuenta'
      );
    }
  }
);

// ✅ Funciones auxiliares para filtros avanzados

export const fetchUsersByRole = createAsyncThunk(
  'user/fetchUsersByRole',
  async (role, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/user`, {
        headers: getAuthHeaders()
      });
      
      const filteredUsers = response.data.users.filter(user => user.role === role);
      return filteredUsers;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Error al obtener usuarios por rol'
      );
    }
  }
);

export const fetchUsersByHierarchy = createAsyncThunk(
  'user/fetchUsersByHierarchy',
  async ({ liderId, gerenteId }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/user`, {
        headers: getAuthHeaders()
      });
      
      const filteredUsers = response.data.users.filter(user => 
        (liderId && user.lider_id === liderId) || 
        (gerenteId && user.gerente_id === gerenteId)
      );
      
      return filteredUsers;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Error al obtener usuarios por jerarquía'
      );
    }
  }
);


const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.currentUser = action.payload;
    },
    setUsers: (state, action) => {
      state.users = action.payload;
      state.allUsers = action.payload;
      state.filteredUsers = action.payload;
    },
    searchUsers: (state, action) => {
      const searchTerm = action.payload.toLowerCase();
      state.searchTerm = searchTerm;
      
      if (searchTerm === '') {
        state.filteredUsers = state.allUsers;
      } else {
        state.filteredUsers = state.allUsers.filter(user =>
          user.name?.toLowerCase().includes(searchTerm) ||
          user.lastname?.toLowerCase().includes(searchTerm) ||
          user.email?.toLowerCase().includes(searchTerm) ||
          user.documento_identidad?.toLowerCase().includes(searchTerm)
        );
      }
    },
    // ✅ NUEVOS reducers
    filterUsersByRole: (state, action) => {
      const role = action.payload;
      if (role === null || role === '') {
        state.filteredUsers = state.allUsers;
      } else {
        state.filteredUsers = state.allUsers.filter(user => user.role === role);
      }
    },
    filterUsersByStatus: (state, action) => {
      const isActive = action.payload;
      if (isActive === null) {
        state.filteredUsers = state.allUsers;
      } else {
        state.filteredUsers = state.allUsers.filter(user => user.is_active === isActive);
      }
    },
    clearUserError: (state) => {
      state.error = null;
    },
    clearUserSearch: (state) => {
      state.searchTerm = '';
      state.filteredUsers = state.allUsers;
    },
    clearOrganizationData: (state) => {
      state.organizationStructure = null;
      state.teamMetrics = null;
      state.dashboard = null;
      state.pendingCommissions = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Register User
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        const newUser = action.payload.user || action.payload;
        state.users.push(newUser);
        state.allUsers.push(newUser);
        state.filteredUsers.push(newUser);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch All Users
      .addCase(fetchAllUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
        state.allUsers = action.payload;
        state.filteredUsers = action.payload;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update User
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        const updatedUser = action.payload;
        
        const updateUserInArray = (array) => {
          const index = array.findIndex(user => user.id === updatedUser.id);
          if (index !== -1) {
            array[index] = { ...array[index], ...updatedUser };
          }
        };
        
        updateUserInArray(state.users);
        updateUserInArray(state.allUsers);
        updateUserInArray(state.filteredUsers);
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete User
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        const deletedUserId = action.payload.id;
        
        state.users = state.users.filter(user => user.id !== deletedUserId);
        state.allUsers = state.allUsers.filter(user => user.id !== deletedUserId);
        state.filteredUsers = state.filteredUsers.filter(user => user.id !== deletedUserId);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch User By ID
      .addCase(fetchUserById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ✅ NUEVOS casos para funcionalidades organizacionales

      // Organization Structure
      .addCase(fetchOrganizationStructure.pending, (state) => {
        state.organizationLoading = true;
        state.error = null;
      })
      .addCase(fetchOrganizationStructure.fulfilled, (state, action) => {
        state.organizationLoading = false;
        state.organizationStructure = action.payload;
      })
      .addCase(fetchOrganizationStructure.rejected, (state, action) => {
        state.organizationLoading = false;
        state.error = action.payload;
      })

      // Team Metrics
      .addCase(fetchTeamMetrics.pending, (state) => {
        state.metricsLoading = true;
        state.error = null;
      })
      .addCase(fetchTeamMetrics.fulfilled, (state, action) => {
        state.metricsLoading = false;
        state.teamMetrics = action.payload;
      })
      .addCase(fetchTeamMetrics.rejected, (state, action) => {
        state.metricsLoading = false;
        state.error = action.payload;
      })

      // Manager Dashboard
      .addCase(fetchManagerDashboard.pending, (state) => {
        state.dashboardLoading = true;
        state.error = null;
      })
      .addCase(fetchManagerDashboard.fulfilled, (state, action) => {
        state.dashboardLoading = false;
        state.dashboard = action.payload;
      })
      .addCase(fetchManagerDashboard.rejected, (state, action) => {
        state.dashboardLoading = false;
        state.error = action.payload;
      })

      // Pending Commissions
      .addCase(fetchPendingCommissions.pending, (state) => {
        state.commissionsLoading = true;
        state.error = null;
      })
      .addCase(fetchPendingCommissions.fulfilled, (state, action) => {
        state.commissionsLoading = false;
        state.pendingCommissions = action.payload.data;
      })
      .addCase(fetchPendingCommissions.rejected, (state, action) => {
        state.commissionsLoading = false;
        state.error = action.payload;
      })

      // Change User Password
      .addCase(changeUserPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changeUserPassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(changeUserPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Unlock User Account
      .addCase(unlockUserAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(unlockUserAccount.fulfilled, (state, action) => {
        state.loading = false;
        const userId = action.payload.userId;
        
        const updateUserInArray = (array) => {
          const index = array.findIndex(user => user.id === userId);
          if (index !== -1) {
            array[index] = { 
              ...array[index], 
              account_locked_until: null,
              failed_login_attempts: 0 
            };
          }
        };
        
        updateUserInArray(state.users);
        updateUserInArray(state.allUsers);
        updateUserInArray(state.filteredUsers);
      })
      .addCase(unlockUserAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Users By Role
      .addCase(fetchUsersByRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsersByRole.fulfilled, (state, action) => {
        state.loading = false;
        state.filteredUsers = action.payload;
      })
      .addCase(fetchUsersByRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Users By Hierarchy
      .addCase(fetchUsersByHierarchy.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsersByHierarchy.fulfilled, (state, action) => {
        state.loading = false;
        state.filteredUsers = action.payload;
      })
      .addCase(fetchUsersByHierarchy.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  setUser, 
  setUsers, 
  searchUsers, 
  filterUsersByRole,
  filterUsersByStatus,
  clearUserError, 
  clearUserSearch,
  clearOrganizationData
} = userSlice.actions;

// ✅ NUEVOS selectores
export const selectUsers = (state) => state.user.users;
export const selectFilteredUsers = (state) => state.user.filteredUsers;
export const selectCurrentUser = (state) => state.user.currentUser;
export const selectUserLoading = (state) => state.user.loading;
export const selectUserError = (state) => state.user.error;

// Selectores organizacionales
export const selectOrganizationStructure = (state) => state.user.organizationStructure;
export const selectTeamMetrics = (state) => state.user.teamMetrics;
export const selectManagerDashboard = (state) => state.user.dashboard;
export const selectPendingCommissions = (state) => state.user.pendingCommissions;

// Selectores de loading específicos
export const selectOrganizationLoading = (state) => state.user.organizationLoading;
export const selectMetricsLoading = (state) => state.user.metricsLoading;
export const selectDashboardLoading = (state) => state.user.dashboardLoading;
export const selectCommissionsLoading = (state) => state.user.commissionsLoading;

export default userSlice.reducer;