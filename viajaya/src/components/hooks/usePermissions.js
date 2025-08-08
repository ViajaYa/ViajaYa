import { useAuth } from '../../redux/hooks/hooks';

const USER_ROLES = {
  CLIENTE: 1,
  ASESOR: 2,
  LIDER: 3,
  GERENTE: 4,
  ADMIN: 5,
  CONTADOR: 6,
  OWNER: 7
};

const PERMISSIONS = {
  CREATE_QUOTE: [USER_ROLES.ASESOR, USER_ROLES.LIDER, USER_ROLES.GERENTE, USER_ROLES.ADMIN, USER_ROLES.OWNER],
  APPROVE_QUOTE: [USER_ROLES.LIDER, USER_ROLES.GERENTE, USER_ROLES.ADMIN, USER_ROLES.OWNER],
  MANAGE_USERS: [USER_ROLES.ADMIN, USER_ROLES.OWNER],
  VIEW_FINANCES: [USER_ROLES.CONTADOR, USER_ROLES.ADMIN, USER_ROLES.OWNER],
  MANAGE_PACKAGES: [USER_ROLES.ADMIN, USER_ROLES.OWNER],
  ACCESS_PANEL: [USER_ROLES.LIDER, USER_ROLES.GERENTE, USER_ROLES.ADMIN, USER_ROLES.OWNER],
};

export const usePermissions = () => {
  const { user, isAuthenticated } = useAuth();

  const hasRole = (requiredRole) => {
    return isAuthenticated && user?.role === requiredRole;
  };

  const hasAnyRole = (requiredRoles) => {
    return isAuthenticated && user?.role && requiredRoles.includes(user.role);
  };

  const hasMinimumRole = (minimumRole) => {
    return isAuthenticated && user?.role >= minimumRole;
  };

  const hasPermission = (permission) => {
    if (!PERMISSIONS[permission]) {
      console.warn(`Permission '${permission}' not found`);
      return false;
    }
    return hasAnyRole(PERMISSIONS[permission]);
  };

  const canCreateQuotes = () => hasPermission('CREATE_QUOTE');
  const canApproveQuotes = () => hasPermission('APPROVE_QUOTE');
  const canManageUsers = () => hasPermission('MANAGE_USERS');
  const canViewFinances = () => hasPermission('VIEW_FINANCES');
  const canManagePackages = () => hasPermission('MANAGE_PACKAGES');
  const canAccessPanel = () => hasPermission('ACCESS_PANEL');

  const getRoleName = () => {
    const roleNames = {
      1: 'Cliente',
      2: 'Asesor',
      3: 'Líder',
      4: 'Gerente',
      5: 'Administrador',
      6: 'Contador',
      7: 'Propietario'
    };
    return roleNames[user?.role] || 'Desconocido';
  };

  return {
    user,
    hasRole,
    hasAnyRole,
    hasMinimumRole,
    hasPermission,
    canCreateQuotes,
    canApproveQuotes,
    canManageUsers,
    canViewFinances,
    canManagePackages,
    canAccessPanel,
    getRoleName,
  };
};