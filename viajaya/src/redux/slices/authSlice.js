import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getApiUrl } from '../../utils/env';

// Estado inicial mejorado
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,
  loginAttempts: 0,
  lastLoginAttempt: null,
  isAccountLocked: false,
};

// ✅ CORREGIR ENDPOINT - Cambiar de '/user/auth' a '/user/login'
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const url = getApiUrl('/user/login');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return rejectWithValue(`Endpoint no encontrado: ${url}`);
        }
        
        try {
          const errorData = await response.json();
          return rejectWithValue(errorData.message || errorData.error || `Error ${response.status}`);
        } catch (parseError) {
          return rejectWithValue(`Error ${response.status}: ${response.statusText}`);
        }
      }

      const data = await response.json();

      // ✅ Verificar success en lugar de solo message
      if (!data.success) {
        return rejectWithValue(data.error || data.message || 'Error en la autenticación');
      }

      // ✅ Normalizar los datos del usuario para manejar ambos campos
      const normalizedUser = {
        ...data.user,
        // ✅ Priorizar is_active sobre is_active_seller para validación general
        isActive: data.user.is_active !== undefined ? data.user.is_active : data.user.is_active_seller,
        isActiveSeller: data.user.is_active_seller || false,
        supervisorId: data.user.supervisor_id,
        referralCode: data.user.referral_code,
        // Mantener campos originales
        is_active: data.user.is_active,
        is_active_seller: data.user.is_active_seller,
        supervisor_id: data.user.supervisor_id,
        referral_code: data.user.referral_code,
      };

      // ✅ Debug en desarrollo
      if (import.meta.env.MODE === 'development') {
        console.log('✅ Usuario normalizado:', {
          original: data.user,
          normalized: normalizedUser,
          isActive: normalizedUser.isActive,
          isActiveSeller: normalizedUser.isActiveSeller
        });
      }

      // ✅ Guardar token en localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      return {
        user: normalizedUser,
        token: data.token,
      };
    } catch (error) {
      console.error('💥 Error de conexión en login:', error);
      return rejectWithValue(`Error de conexión: ${error.message}`);
    }
  }
);

// ✅ CORREGIR ENDPOINT DE REGISTRO - Asumiendo que es '/user/register'
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      // ✅ Verificar endpoint correcto (ajustar según tu backend)
      const response = await fetch(getApiUrl('/user/register'), { // o '/user' según tu backend
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return rejectWithValue('Endpoint de registro no encontrado');
        }
        
        try {
          const errorData = await response.json();
          return rejectWithValue(errorData.message || `Error ${response.status}`);
        } catch (parseError) {
          return rejectWithValue(`Error ${response.status}: ${response.statusText}`);
        }
      }

      const data = await response.json();

      return {
        user: data.user,
        token: data.token,
        message: data.message,
      };
    } catch (error) {
      console.error('Error de conexión en registro:', error);
      return rejectWithValue('Error de conexión con el servidor');
    }
  }
);

// ✅ CORREGIR ENDPOINT DE VERIFICACIÓN DE TOKEN
export const verifyToken = createAsyncThunk(
  'auth/verifyToken',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return rejectWithValue('No hay token disponible');
      }

      // ✅ Ajustar endpoint según tu backend
      const response = await fetch(getApiUrl('/user/verify/token'), { // Ajustar si es diferente
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        localStorage.removeItem('token');
        
        if (response.status === 404) {
          return rejectWithValue('Endpoint de verificación no encontrado');
        }
        
        try {
          const errorData = await response.json();
          return rejectWithValue(errorData.message || 'Token inválido');
        } catch (parseError) {
          return rejectWithValue('Token inválido');
        }
      }

      const data = await response.json();

      return {
        user: data.user || data,
        token: token,
      };
    } catch (error) {
      console.error('Error verificando token:', error);
      localStorage.removeItem('token');
      return rejectWithValue('Error verificando token');
    }
  }
);

// ✅ CORREGIR ENDPOINT DE RECUPERACIÓN DE CONTRASEÑA
export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async ({ email }, { rejectWithValue }) => {
    try {
      // ✅ Ajustar endpoint según tu backend
      const response = await fetch(getApiUrl('/user/forgot-password'), { // o '/user/recovery'
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return rejectWithValue('Endpoint de recuperación no encontrado');
        }
        
        try {
          const errorData = await response.json();
          return rejectWithValue(errorData.message || 'Error enviando correo');
        } catch (parseError) {
          return rejectWithValue(`Error ${response.status}: ${response.statusText}`);
        }
      }

      const data = await response.json();
      return data.message || 'Email de recuperación enviado';
    } catch (error) {
      console.error('Error en recuperación de contraseña:', error);
      return rejectWithValue('Error de conexión con el servidor');
    }
  }
);

// ✅ RESTO DEL CÓDIGO PERMANECE IGUAL...
export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async ({ currentPassword, newPassword }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl('/user/change-password'), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          return rejectWithValue(errorData.message || 'Error al cambiar contraseña');
        } catch (parseError) {
          return rejectWithValue(`Error ${response.status}: ${response.statusText}`);
        }
      }

      const data = await response.json();
      return data.message || 'Contraseña cambiada exitosamente';
    } catch (error) {
      return rejectWithValue('Error de conexión');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(getApiUrl('/user/profile'), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          return rejectWithValue(errorData.message || 'Error actualizando perfil');
        } catch (parseError) {
          return rejectWithValue(`Error ${response.status}: ${response.statusText}`);
        }
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      return rejectWithValue('Error de conexión');
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, password }, { rejectWithValue }) => {
    try {
      const response = await fetch(getApiUrl('/user/reset-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          return rejectWithValue(errorData.message || 'Error reseteando contraseña');
        } catch (parseError) {
          return rejectWithValue(`Error ${response.status}: ${response.statusText}`);
        }
      }

      const data = await response.json();
      return data.message;
    } catch (error) {
      return rejectWithValue('Error de conexión');
    }
  }
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      state.loginAttempts = 0;
      state.lastLoginAttempt = null;
      state.isAccountLocked = false;
      localStorage.removeItem('token');
    },
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    incrementLoginAttempts: (state) => {
      state.loginAttempts += 1;
      state.lastLoginAttempt = new Date().toISOString();
      state.isAccountLocked = state.loginAttempts >= 5;
    },
    resetLoginAttempts: (state) => {
      state.loginAttempts = 0;
      state.lastLoginAttempt = null;
      state.isAccountLocked = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login User
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
        state.loginAttempts = 0;
        state.lastLoginAttempt = null;
        state.isAccountLocked = false;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.loginAttempts += 1;
        state.lastLoginAttempt = new Date().toISOString();
        state.isAccountLocked = state.loginAttempts >= 4;
      })
      // Register User
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.token) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.isAuthenticated = true;
        }
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      // Verify Token
      .addCase(verifyToken.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyToken.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(verifyToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Change Password
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Forgot Password
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  logout, 
  clearError, 
  setLoading, 
  updateUser, 
  incrementLoginAttempts, 
  resetLoginAttempts 
} = authSlice.actions;

// Selectores
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export const selectIsAccountLocked = (state) => state.auth.isAccountLocked;

export default authSlice.reducer;