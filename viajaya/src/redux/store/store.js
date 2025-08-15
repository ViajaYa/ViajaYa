import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../slices/authSlice'; // ✅ Solo importar desde slices
import userReducer from '../slices/userSlice';
import packageReducer from '../slices/packageSlice';
import popupReducer from '../slices/popupSlice';
import paymentReducer from '../slices/paymentSlice';
import quoteReducer from '../slices/quoteSlice';
import contractReducer from '../slices/contractSlice';
import commissionReducer from '../slices/commissionSlice';
import dashboardReducer from '../slices/dashboardSlice';
import notificationReducer from '../slices/notificationSlice';
import documentReducer from '../slices/documentSlice';
import toastMiddleware from '../../utils/toastMiddleware';
import reservationReducer from '../slices/reservationSlice'; 
import quoteCalculationReducer from '../slices/quoteCalculationSlice'; // Importar el slice de quoteCalculation
import contractPaymentReducer from '../slices/contractPaymentSlice'; // ✅ NUEVO: Importar contract payment slice

export const store = configureStore({
  reducer: {
    auth: authReducer, // ✅ Solo desde authSlice
    user: userReducer,
    package: packageReducer,
    popup: popupReducer,
    payment: paymentReducer,
    quote: quoteReducer,
    contract: contractReducer,
    commission: commissionReducer,
    dashboard: dashboardReducer,
    notification: notificationReducer,
    document: documentReducer,
    reservation: reservationReducer,
    quoteCalculation: quoteCalculationReducer,
    contractPayment: contractPaymentReducer, // ✅ NUEVO: Agregar contract payment reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(toastMiddleware),
  devTools: import.meta.env.MODE !== 'production',
});

export default store;