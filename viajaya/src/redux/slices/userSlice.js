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
      return response.data.users;
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


// Slice
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
          user.email?.toLowerCase().includes(searchTerm)
        );
      }
    },
    clearUserError: (state) => {
      state.error = null;
    },
    clearUserSearch: (state) => {
      state.searchTerm = '';
      state.filteredUsers = state.allUsers;
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
      
      // ✅ NUEVO: Update User
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        const updatedUser = action.payload;
        
        // ✅ Función auxiliar para actualizar usuario en un array
        const updateUserInArray = (array) => {
          const index = array.findIndex(user => user.id === updatedUser.id);
          if (index !== -1) {
            // Mantener datos existentes y actualizar solo los campos enviados
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
      
      // ✅ NUEVO: Delete User
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        const deletedUserId = action.payload.id;
        
        // ✅ Eliminar usuario de todos los arrays
        state.users = state.users.filter(user => user.id !== deletedUserId);
        state.allUsers = state.allUsers.filter(user => user.id !== deletedUserId);
        state.filteredUsers = state.filteredUsers.filter(user => user.id !== deletedUserId);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ✅ NUEVO: Fetch User By ID
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
      });
  },
});

export const { 
  setUser, 
  setUsers, 
  searchUsers, 
  clearUserError, 
  clearUserSearch 
} = userSlice.actions;

export default userSlice.reducer;