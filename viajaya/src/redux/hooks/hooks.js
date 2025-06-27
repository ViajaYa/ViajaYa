import { useDispatch, useSelector } from 'react-redux';

// Hook personalizado para dispatch
export const useAppDispatch = () => useDispatch();

// Hook personalizado para selector
export const useAppSelector = useSelector;

// Hooks específicos para cada slice
export const useAuth = () => {
  const authState = useAppSelector((state) => state.auth);
  
  // ✅ Normalizar el usuario si existe
  const normalizedUser = authState.user ? {
    ...authState.user,
    // ✅ Lógica para determinar si está activo
    isActive: authState.user.is_active !== undefined 
      ? authState.user.is_active 
      : authState.user.isActive !== undefined 
        ? authState.user.isActive 
        : authState.user.is_active_seller !== undefined
          ? authState.user.is_active_seller
          : true, // Por defecto true si no hay información
    
    isActiveSeller: authState.user.is_active_seller || authState.user.isActiveSeller || false,
    supervisorId: authState.user.supervisor_id || authState.user.supervisorId,
    referralCode: authState.user.referral_code || authState.user.referralCode,
  } : null;

  return {
    user: normalizedUser,
    token: authState.token,
    isAuthenticated: authState.isAuthenticated,
    loading: authState.loading,
    error: authState.error,
  };
};
export const useUsers = () => useAppSelector((state) => state.user);
export const usePackages = () => {
  const packageState = useAppSelector((state) => state.package);
  
  // ✅ Normalizar los datos del backend al formato esperado por el frontend
  const normalizePackage = (pack) => {
    if (!pack || typeof pack !== 'object') return pack;
    
    return {
      ...pack,
      // ✅ Mapear campos del backend al formato esperado
      destination: pack.destino || pack.destination, // Backend usa "destino"
      characteristics: pack.chars || pack.characteristics, // Backend usa "chars"
      // Mantener los nombres originales también por compatibilidad
      destino: pack.destino,
      chars: pack.chars,
    };
  };
  
  const normalizePackages = (packages) => {
    if (!Array.isArray(packages)) return [];
    return packages.map(normalizePackage);
  };
  
  return {
    packages: normalizePackages(packageState.packages),
    allPackages: normalizePackages(packageState.allPackages),
    filteredPackages: normalizePackages(packageState.filteredPackages),
    currentPackage: packageState.currentPackage ? normalizePackage(packageState.currentPackage) : null,
    loading: packageState.loading || false,
    error: packageState.error,
    filters: packageState.filters,
    searchTerm: packageState.searchTerm,
    pagination: packageState.pagination,
  };
};
export const usePopups = () => useAppSelector((state) => state.popup);
export const usePayments = () => useAppSelector((state) => state.payment);
export const useQuotes = () => useAppSelector((state) => state.quote);
export const useContracts = () => useAppSelector((state) => state.contract);
export const useCommissions = () => useAppSelector((state) => state.commission);
export const useDashboard = () => useAppSelector((state) => state.dashboard);
export const useNotifications = () => useAppSelector((state) => state.notification);