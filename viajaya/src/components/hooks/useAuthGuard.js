import { useEffect, useRef } from 'react';
import { useAuth } from '../../redux/hooks/hooks';
import { useAppDispatch } from '../../redux/hooks/hooks';
import { verifyToken, logout } from '../../redux/slices/authSlice';

const useAuthGuard = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, loading, error } = useAuth();
  const hasInitialized = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // ✅ Solo verificar token una vez para evitar bucles infinitos
    if (token && !isAuthenticated && !loading && !hasInitialized.current) {
      hasInitialized.current = true;
      dispatch(verifyToken());
    }
    
    // Si no hay token pero Redux dice que está autenticado, limpiar estado
    if (!token && isAuthenticated) {
      hasInitialized.current = false; // Permitir re-inicialización
      dispatch(logout());
    }
    
    // Resetear flag si el estado cambia (por logout manual, etc.)
    if (!token && !isAuthenticated) {
      hasInitialized.current = false;
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