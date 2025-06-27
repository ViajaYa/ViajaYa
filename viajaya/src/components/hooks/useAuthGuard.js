import { useEffect } from 'react';
import { useAuth } from '../../redux/hooks/hooks';
import { useAppDispatch } from '../../redux/hooks/hooks';
import { verifyToken, logout } from '../../redux/slices/authSlice';

const useAuthGuard = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, loading, error } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // Si hay token pero no está autenticado, verificar token
    if (token && !isAuthenticated && !loading) {
      dispatch(verifyToken());
    }
    
    // Si no hay token pero Redux dice que está autenticado, limpiar estado
    if (!token && isAuthenticated) {
      dispatch(logout());
    }
  }, [dispatch, isAuthenticated, loading]);

  // Función para verificar permisos
  const hasPermission = (requiredRoles = []) => {
    if (!isAuthenticated || !user) return false;
    if (requiredRoles.length === 0) return true;
    return requiredRoles.includes(user.role);
  };

  // Función para verificar si el usuario está activo
  const isActiveUser = () => {
    return isAuthenticated && user && user.is_active;
  };

  return {
    isAuthenticated,
    user,
    loading,
    error,
    hasPermission,
    isActiveUser,
  };
};

export default useAuthGuard; // ✅ Exportación default