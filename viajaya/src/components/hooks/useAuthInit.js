import { useEffect, useRef } from 'react';
import { useAppDispatch } from '../../redux/hooks/hooks';
import { useAuth } from '../../redux/hooks/hooks';
import { verifyToken } from '../../redux/slices/authSlice';

/**
 * Hook para inicializar la autenticación una sola vez
 * Evita llamadas repetitivas a verifyToken
 */
export const useAuthInit = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, loading } = useAuth();
  const hasInitialized = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // Solo inicializar una vez
    if (!hasInitialized.current && token && !user && !loading) {
      hasInitialized.current = true;
      dispatch(verifyToken());
    }
    
    // Si no hay token pero Redux dice que está autenticado, es inconsistente
    if (!token && isAuthenticated) {
      hasInitialized.current = false; // Permitir re-inicialización
    }
  }, [dispatch, isAuthenticated, user, loading]);

  return {
    isInitialized: hasInitialized.current,
    isAuthenticated,
    user,
    loading
  };
};
