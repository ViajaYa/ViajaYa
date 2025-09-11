import { useDispatch, useSelector } from 'react-redux';
import { useMemo } from 'react';

// Hook personalizado para dispatch
export const useAppDispatch = () => useDispatch();

// Hook personalizado para selector
export const useAppSelector = useSelector;

export const USER_ROLES = {
  CLIENTE: 1,
  ASESOR: 2,
  LIDER: 3,
  GERENTE: 4,
  ADMIN: 5,
  CONTADOR: 6,
  OWNER: 7
};

// Hooks específicos para cada slice
export const useAuth = () => {
  const authState = useAppSelector((state) => state.auth);
  
  // ✅ Memoizar el usuario normalizado para evitar re-renders infinitos
  const normalizedUser = useMemo(() => {
    if (!authState.user) return null;
    
    // ✅ Solo crear nuevo objeto si alguna propiedad realmente cambió
    const baseUser = authState.user;
    return {
      ...baseUser,
      // ✅ Lógica para determinar si está activo
      isActive: baseUser.is_active !== undefined 
        ? baseUser.is_active 
        : baseUser.isActive !== undefined 
          ? baseUser.isActive 
          : baseUser.is_active_seller !== undefined
            ? baseUser.is_active_seller
            : true, // Por defecto true si no hay información
      
      isActiveSeller: baseUser.is_active_seller || baseUser.isActiveSeller || false,
      supervisorId: baseUser.supervisor_id || baseUser.supervisorId,
      referralCode: baseUser.referral_code || baseUser.referralCode,
    };
  }, [authState.user?.id, authState.user?.is_active, authState.user?.isActive, authState.user?.is_active_seller]);

  // ✅ Memoizar todo el objeto de retorno con dependencias más específicas
  return useMemo(() => ({
    user: normalizedUser,
    token: authState.token,
    isAuthenticated: authState.isAuthenticated,
    loading: authState.loading,
    error: authState.error,
  }), [normalizedUser, authState.token, authState.isAuthenticated, authState.loading, authState.error]);
};


export const useRolePermissions = () => {
  const { user } = useAuth();

  // ✅ Función principal para verificar múltiples roles
  const hasAnyRole = (roles) => {
    if (!user || !user.role) return false;
    
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  // ✅ Función para verificar rol mínimo (jerárquico)
  const hasMinimumRole = (minRole) => {
    return user && user.role >= minRole;
  };

  // ✅ Función para verificar rol exacto
  const hasExactRole = (role) => {
    return user && user.role === role;
  };

  // ✅ Funciones específicas con múltiples roles permitidos
  const canManageUsers = () => hasAnyRole([USER_ROLES.OWNER]);
  
  const canManagePackages = () => hasAnyRole([
    USER_ROLES.ADMIN, 
    USER_ROLES.OWNER
  ]);
  
  const canManageReservations = () => hasAnyRole([
    USER_ROLES.LIDER, 
    USER_ROLES.GERENTE, 
    USER_ROLES.ADMIN, 
    USER_ROLES.OWNER
  ]);
  
  const canManagePage = () => hasAnyRole([
    USER_ROLES.ADMIN, 
    USER_ROLES.OWNER
  ]);
  
  const canManageQuotes = () => hasAnyRole([
    USER_ROLES.ASESOR,
    USER_ROLES.LIDER,
    USER_ROLES.GERENTE,
    USER_ROLES.ADMIN,
    USER_ROLES.OWNER
  ]);
  
  const canCreateStaff = () => hasAnyRole([
    USER_ROLES.GERENTE,
    USER_ROLES.ADMIN,
    USER_ROLES.OWNER
  ]);

  // ✅ Funciones para dashboard organizacional
  const canViewOrganization = () => hasAnyRole([
    USER_ROLES.LIDER,
    USER_ROLES.GERENTE,
    USER_ROLES.ADMIN,
    USER_ROLES.OWNER
  ]);

  const canViewTeamMetrics = () => hasAnyRole([
    USER_ROLES.GERENTE,
    USER_ROLES.ADMIN,
    USER_ROLES.OWNER
  ]);

  // ✅ Funciones para operaciones financieras
  const canManageAccounting = () => hasAnyRole([
    USER_ROLES.CONTADOR,
    USER_ROLES.ADMIN,
    USER_ROLES.OWNER
  ]);

  const canViewCommissions = () => hasAnyRole([
    USER_ROLES.ASESOR,
    USER_ROLES.LIDER,
    USER_ROLES.GERENTE,
    USER_ROLES.CONTADOR,
    USER_ROLES.ADMIN,
    USER_ROLES.OWNER
  ]);

  // ✅ Funciones para determinar accesos por contexto
  const canCreateQuotes = () => hasMinimumRole(USER_ROLES.ASESOR);
  const canApproveQuotes = () => hasMinimumRole(USER_ROLES.LIDER);
  const canManageContracts = () => hasMinimumRole(USER_ROLES.LIDER);
  const canAccessPanel = () => hasMinimumRole(USER_ROLES.ADMIN);
  const canViewReports = () => hasMinimumRole(USER_ROLES.LIDER);

  // ✅ Función helper para obtener el nombre del rol
  const getRoleName = (role = user?.role) => {
    const roleNames = {
      [USER_ROLES.CLIENTE]: 'Cliente',
      [USER_ROLES.ASESOR]: 'Asesor',
      [USER_ROLES.LIDER]: 'Líder',
      [USER_ROLES.GERENTE]: 'Gerente',
      [USER_ROLES.ADMIN]: 'Admin',
      [USER_ROLES.CONTADOR]: 'Contador',
      [USER_ROLES.OWNER]: 'Owner'
    };
    return roleNames[role] || 'Sin rol';
  };

  // ✅ Función para verificar si puede gestionar a otro usuario
  const canManageUser = (targetUser) => {
    if (!user || !targetUser) return false;
    
    // Owner puede gestionar a todos
    if (user.role === USER_ROLES.OWNER) return true;
    
    // Admin puede gestionar roles menores
    if (user.role === USER_ROLES.ADMIN && targetUser.role < USER_ROLES.ADMIN) return true;
    
    // Gerente puede gestionar su equipo
    if (user.role === USER_ROLES.GERENTE && targetUser.gerente_id === user.id) return true;
    
    // Líder puede gestionar su equipo
    if (user.role === USER_ROLES.LIDER && targetUser.lider_id === user.id) return true;
    
    return false;
  };

  return {
    user,
    hasAnyRole,
    hasMinimumRole,
    hasExactRole,
    canManageUsers,
    canManagePackages,
    canManageReservations,
    canManagePage,
    canManageQuotes,
    canCreateStaff,
    canViewOrganization,
    canViewTeamMetrics,
    canManageAccounting,
    canViewCommissions,
    canCreateQuotes,
    canApproveQuotes,
    canManageContracts,
    canAccessPanel,
    canViewReports,
    canManageUser,
    getRoleName,
    // ✅ Exportar constantes también
    USER_ROLES
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
