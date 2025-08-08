import { useCallback, useRef } from "react";
import { useAppSelector, useAppDispatch } from '../../redux/hooks/hooks';
import {
  selectReservations,
  selectLoadingReservations,
  selectErrorReservations,
  selectSelectedReservation,
  fetchReservations,
  fetchReservationById,
  createReservation,
  updateReservation,
  deleteReservation,
} from '../../redux/slices/reservationSlice';
import { DEBUG_MODE, callCounter, reportDebugState } from '../../utils/debugMode';

export const useReservations = () => {
  // ✅ Incrementar contador y reportar
  callCounter.useReservationsHook++;
  
  const timestamp = new Date().toISOString();
  
  if (DEBUG_MODE.LOG_ALL_CALLS) {
    console.log(`🔄 useReservations hook ejecutado #${callCounter.useReservationsHook} en ${timestamp}`);
    console.log(`🛤️ useReservations - Ruta actual: ${window.location.pathname}`);
    console.trace('useReservations llamado desde:');
    reportDebugState();
  }
  
  const reservations = useAppSelector(selectReservations);
  const loading = useAppSelector(selectLoadingReservations);
  const error = useAppSelector(selectErrorReservations);
  const selectedReservation = useAppSelector(selectSelectedReservation);
  const dispatch = useAppDispatch();
  
  // ✅ Debounce para evitar llamadas muy rápidas
  const lastFetchRef = useRef(0);
  const DEBOUNCE_DELAY = 2000; // ✅ Reducido a 2 segundos para uso normal

  // Memoiza las funciones para que sean estables
  const fetchReservationsCb = useCallback(() => {
    const now = Date.now();
    const timeSinceLastCall = now - lastFetchRef.current;
    
    console.log(`📞 fetchReservations llamado desde hook - Tiempo desde última llamada: ${timeSinceLastCall}ms`);
    console.log(`📍 fetchReservations llamado desde ruta: ${window.location.pathname}`);
    console.trace('fetchReservations stack trace:');
    
    if (timeSinceLastCall < DEBOUNCE_DELAY) {
      console.log(`⏰ fetchReservations - Llamada ignorada por debounce (necesita ${DEBOUNCE_DELAY - timeSinceLastCall}ms más)`);
      return Promise.resolve();
    }
    
    lastFetchRef.current = now;
    console.log('� fetchReservations - Ejecutando dispatch...');
    return dispatch(fetchReservations());
  }, [dispatch]);
  
  const fetchReservationByIdCb = useCallback((id) => dispatch(fetchReservationById(id)), [dispatch]);
  const createReservationCb = useCallback((data) => dispatch(createReservation(data)), [dispatch]);
  const updateReservationCb = useCallback((args) => dispatch(updateReservation(args)), [dispatch]);
  const deleteReservationCb = useCallback((id) => dispatch(deleteReservation(id)), [dispatch]);

  return {
    reservations,
    loading,
    error,
    selectedReservation,
    fetchReservations: fetchReservationsCb,
    fetchReservationById: fetchReservationByIdCb,
    createReservation: createReservationCb,
    updateReservation: updateReservationCb,
    deleteReservation: deleteReservationCb,
  };
};