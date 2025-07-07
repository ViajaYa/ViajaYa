// ✅ DEBUG MODE - Reactivación progresiva después de resolver el loop
export const DEBUG_MODE = {
  DISABLE_AUTO_FETCH: false, // ✅ Reactivar cargas automáticas
  LOG_ALL_CALLS: false,      // ✅ Reducir logs para producción
  BLOCK_RESERVATIONS: false, // ✅ Reactivar fetchReservations
};

// ✅ Contador global de llamadas para detectar loops
export const callCounter = {
  fetchReservations: 0,
  useReservationsHook: 0,
  gestionOrdenesRender: 0,
  userReservationsRender: 0,
};

// ✅ Función para resetear contadores
export const resetCounters = () => {
  Object.keys(callCounter).forEach(key => {
    callCounter[key] = 0;
  });
};

// ✅ Función para reportar estado
export const reportDebugState = () => {
  console.log('🐛 DEBUG REPORT:', {
    DEBUG_MODE,
    callCounter,
    timestamp: new Date().toISOString(),
    currentPath: window.location.pathname
  });
};
