import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = import.meta.env.BASE_URL || 'http://localhost:3001';

// ✅ Estado inicial con arrays vacíos para evitar errores de .filter()
const initialState = {
  packages: [], // ✅ Siempre array
  allPackages: [], // ✅ Siempre array
  filteredPackages: [], // ✅ Siempre array
  currentPackage: null,
  loading: false,
  error: null,
  searchTerm: '',
  filters: {
    characteristics: [],
    title: '',
    category: '',
    priceRange: { min: 0, max: 0 },
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 10,
  },
};

// ✅ Thunk mejorado con validación de respuesta
export const fetchAllPackages = createAsyncThunk(
  'package/fetchAllPackages',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/pack`);
      
      // ✅ Validar que la respuesta sea un array
      const data = response.data;
      
      if (!Array.isArray(data)) {
        console.warn('La respuesta del endpoint no es un array:', data);
        return []; // Devolver array vacío si no es array
      }
      
      console.log('Paquetes obtenidos del backend:', data.length);
      return data;
    } catch (error) {
      console.error('Error en fetchAllPackages:', error);
      return rejectWithValue(
        error.response?.data?.message || 'Error al obtener paquetes'
      );
    }
  }
);

export const fetchPackageById = createAsyncThunk(
  'package/fetchPackageById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/pack/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Error al obtener paquete'
      );
    }
  }
);

export const createPackage = createAsyncThunk(
  'package/createPackage',
  async (packageData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE_URL}/pack`, packageData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Error al crear paquete'
      );
    }
  }
);

export const updatePackage = createAsyncThunk(
  'package/updatePackage',
  async (packageData, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${BASE_URL}/pack/${packageData.id}`, packageData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Error al actualizar paquete'
      );
    }
  }
);

export const deletePackage = createAsyncThunk(
  'package/deletePackage',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${BASE_URL}/pack/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Error al eliminar paquete'
      );
    }
  }
);

// Slice
const packageSlice = createSlice({
  name: 'package',
  initialState,
  reducers: {
    setPackages: (state, action) => {
      const packages = Array.isArray(action.payload) ? action.payload : [];
      state.packages = packages;
      state.allPackages = packages;
      state.filteredPackages = packages;
    },
    searchPackages: (state, action) => {
      const searchTerm = action.payload.toLowerCase();
      state.searchTerm = searchTerm;
      state.filters.title = searchTerm;
      
      if (searchTerm === '') {
        state.filteredPackages = state.allPackages;
      } else {
        state.filteredPackages = state.allPackages.filter(pkg =>
          pkg.title?.toLowerCase().includes(searchTerm) ||
          pkg.detail?.toLowerCase().includes(searchTerm) || // ✅ Backend usa "detail"
          pkg.destino?.toLowerCase().includes(searchTerm) // ✅ Backend usa "destino"
        );
      }
    },
    filterPackages: (state, action) => {
      const [filterType, filterValue] = action.payload;
      
      let filtered = state.allPackages;
      
      switch (filterType) {
        case 'category':
          state.filters.category = filterValue;
          filtered = filterValue ? filtered.filter(pkg => pkg.category === filterValue) : filtered;
          break;
        case 'price':
          state.filters.priceRange = filterValue;
          filtered = filtered.filter(pkg => 
            pkg.price >= filterValue.min && pkg.price <= filterValue.max
          );
          break;
        case 'duration':
          filtered = filtered.filter(pkg => pkg.days === filterValue); // ✅ Backend usa "days"
          break;
        default:
          break;
      }
      
      state.filteredPackages = filtered;
    },
    filterPackagesByCharacteristics: (state, action) => {
      const characteristics = action.payload;
      state.filters.characteristics = characteristics;
      
      if (characteristics.length === 0) {
        state.filteredPackages = state.allPackages;
      } else {
        state.filteredPackages = state.allPackages.filter(pkg =>
          characteristics.every(char => 
            pkg.chars?.includes(char) // ✅ Backend usa "chars"
          )
        );
      }
    },
    filterPackagesByTitle: (state, action) => {
      const title = action.payload.toLowerCase();
      state.filters.title = title;
      
      if (title === '') {
        state.filteredPackages = state.allPackages;
      } else {
        state.filteredPackages = state.allPackages.filter(pkg =>
          pkg.title?.toLowerCase().includes(title)
        );
      }
    },
    setCurrentPage: (state, action) => {
      state.pagination.currentPage = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {
        characteristics: [],
        title: '',
        category: '',
        priceRange: { min: 0, max: 0 },
      };
      state.searchTerm = '';
      state.filteredPackages = state.allPackages;
    },
    clearPackageError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Packages
      .addCase(fetchAllPackages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllPackages.fulfilled, (state, action) => {
        state.loading = false;
        // ✅ Asegurar que siempre sean arrays
        const packages = Array.isArray(action.payload) ? action.payload : [];
        state.packages = packages;
        state.allPackages = packages;
        state.filteredPackages = packages;
      })
      .addCase(fetchAllPackages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // ✅ Mantener arrays vacíos en error
        state.packages = [];
        state.allPackages = [];
        state.filteredPackages = [];
      })
      // Fetch Package by ID
      .addCase(fetchPackageById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPackageById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPackage = action.payload;
      })
      .addCase(fetchPackageById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Package
      .addCase(createPackage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPackage.fulfilled, (state, action) => {
        state.loading = false;
        const newPackage = action.payload;
        state.packages.push(newPackage);
        state.allPackages.push(newPackage);
        state.filteredPackages.push(newPackage);
      })
      .addCase(createPackage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Package
      .addCase(updatePackage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePackage.fulfilled, (state, action) => {
        state.loading = false;
        const updatedPackage = action.payload;
        const index = state.packages.findIndex(pkg => pkg.id === updatedPackage.id);
        if (index !== -1) {
          state.packages[index] = updatedPackage;
          state.allPackages[index] = updatedPackage;
          const filteredIndex = state.filteredPackages.findIndex(pkg => pkg.id === updatedPackage.id);
          if (filteredIndex !== -1) {
            state.filteredPackages[filteredIndex] = updatedPackage;
          }
        }
      })
      .addCase(updatePackage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Package
      .addCase(deletePackage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePackage.fulfilled, (state, action) => {
        state.loading = false;
        const deletedId = action.payload;
        state.packages = state.packages.filter(pkg => pkg.id !== deletedId);
        state.allPackages = state.allPackages.filter(pkg => pkg.id !== deletedId);
        state.filteredPackages = state.filteredPackages.filter(pkg => pkg.id !== deletedId);
      })
      .addCase(deletePackage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  setPackages, 
  searchPackages, 
  filterPackages, 
  filterPackagesByCharacteristics, 
  filterPackagesByTitle, 
  setCurrentPage, 
  clearFilters, 
  clearPackageError 
} = packageSlice.actions;

// Selectores
export const selectPackages = (state) => state.package.packages;
export const selectAllPackages = (state) => state.package.allPackages;
export const selectFilteredPackages = (state) => state.package.filteredPackages;
export const selectCurrentPackage = (state) => state.package.currentPackage;
export const selectPackageLoading = (state) => state.package.loading;
export const selectPackageError = (state) => state.package.error;

export default packageSlice.reducer;