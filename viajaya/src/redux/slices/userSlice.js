import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
      const response = await axios.post(`${BASE_URL}/api/user/register`, userData);
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
      const response = await axios.get(`${BASE_URL}/api/user`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Error al obtener usuarios'
      );
    }
  }
);

// Slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Equivalente a SET_USER
    setUser: (state, action) => {
      state.currentUser = action.payload;
    },
    // Equivalente a SET_USERS
    setUsers: (state, action) => {
      state.users = action.payload;
      state.allUsers = action.payload;
      state.filteredUsers = action.payload;
    },
    // Equivalente a FIND_USERS
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
        state.users.push(action.payload);
        state.allUsers.push(action.payload);
        state.filteredUsers.push(action.payload);
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