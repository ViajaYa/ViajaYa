import { useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../../redux/hooks/hooks';
import { useAppDispatch } from '../../redux/hooks/hooks';
import { verifyToken, logout } from '../../redux/slices/authSlice';

const useAuthGuard = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, loading, error, token } = useAuth();
  const initializationRef = useRef({ 
    done: false, 
    lastToken: null, 
    verificationInProgress: false 
  });

  useEffect(() => {
    const tokenFromStorage = localStorage.getItem('token');
    const { done, lastToken, verificationInProgress } = initializationRef.current;

    // ✅ Evitar múltiples dispatches simultáneos
    if (verificationInProgress) return;

    // ✅ Solo actuar si el token cambió REALMENTE
    if (tokenFromStorage !== lastToken) {
      initializationRef.current.lastToken = tokenFromStorage;
      
      if (tokenFromStorage && !isAuthenticated && !loading) {
        // Token existe pero no estamos autenticados -> verificar
        initializationRef.current.verificationInProgress = true;
        dispatch(verifyToken())
          .finally(() => {
            initializationRef.current.verificationInProgress = false;
          });
      } else if (!tokenFromStorage && isAuthenticated) {
        // No hay token pero estamos autenticados -> logout silencioso
        initializationRef.current.verificationInProgress = true;
        dispatch(logout())
          .finally(() => {
            initializationRef.current.verificationInProgress = false;
          });
      }
    }
  }, [dispatch, isAuthenticated, loading]); // ✅ Dependencias más estables

  // ✅ Memoizar las funciones para evitar re-creaciones
  const authMethods = useMemo(() => ({
    hasPermission: (requiredRoles = []) => {
      if (!isAuthenticated || !user) return false;
      if (requiredRoles.length === 0) return true;
      return requiredRoles.includes(user.role);
    },

    isActiveUser: () => {
      return isAuthenticated && user && (user.is_active || user.isActive);
    }
  }), [isAuthenticated, user?.role, user?.is_active, user?.isActive]);

  return useMemo(() => ({
    isAuthenticated,
    user,
    loading,
    error,
    ...authMethods
  }), [isAuthenticated, user, loading, error, authMethods]);
};

export default useAuthGuard;