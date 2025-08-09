import axios from 'axios';
import { store } from '../redux/store/store';
import { logout } from '../redux/slices/authSlice';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'; //probando 2

// Crear instancia de axios
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Interceptor para requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para responses
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('token');
      store.dispatch(logout());
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;