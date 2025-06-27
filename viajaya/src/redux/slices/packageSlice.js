import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Estado inicial
const initialState = {
  packages: [],
  allPackages: [],
  filteredPackages: [],
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

// Thunks asíncronos
export const fetchAllPackages = createAsyncThunk(
  'package/fetchAllPackages',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/pack`);
      return response.data;
    } catch (error) {
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

// Slice
const packageSlice = createSlice({
  name: 'package',
  initialState,
  reducers: {
    // Equivalente a SET_PAQUETES
    setPackages: (state, action) => {
      state.packages = action.payload;
      state.allPackages = action.payload;
      state.filteredPackages = action.payload;
    },
    // Equivalente a FIND_PAQUETES
    searchPackages: (state, action) => {
      const searchTerm = action.payload.toLowerCase();
      state.searchTerm = searchTerm;
      state.filters.title = searchTerm;
      
      if (searchTerm === '') {
        state.filteredPackages = state.allPackages;
      } else {
        state.filteredPackages = state.allPackages.filter(pkg =>
          pkg.title?.toLowerCase().includes(searchTerm) ||
          pkg.description?.toLowerCase().includes(searchTerm) ||
          pkg.destination?.toLowerCase().includes(searchTerm)
        );
      }
    },
    // Equivalente a FILTER_PACKS
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
          filtered = filtered.filter(pkg => pkg.duration === filterValue);
          break;
        default:
          break;
      }
      
      state.filteredPackages = filtered;
    },
    // Equivalente a FILTER_PACKSCHARS
    filterPackagesByCharacteristics: (state, action) => {
      const characteristics = action.payload;
      state.filters.characteristics = characteristics;
      
      if (characteristics.length === 0) {
        state.filteredPackages = state.allPackages;
      } else {
        state.filteredPackages = state.allPackages.filter(pkg =>
          characteristics.every(char => 
            pkg.characteristics?.includes(char)
          )
        );
      }
    },
    // Equivalente a FILTER_PACKSTITLE
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
    // Equivalente a SET_PAGINA
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
        state.packages = action.payload;
        state.allPackages = action.payload;
        state.filteredPackages = action.payload;
      })
      .addCase(fetchAllPackages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
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

export default packageSlice.reducer;