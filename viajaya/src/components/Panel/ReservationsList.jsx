import  { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// ✅ Usar el nuevo sistema de slices en lugar de las acciones legacy
import { 
  fetchReservations,
  selectReservations,
  selectLoadingReservations,
  selectErrorReservations
} from '../../redux/slices/reservationSlice';
import { DEBUG_MODE } from '../../utils/debugMode';

const ReservationsList = () => {
  const dispatch = useDispatch();
  // ✅ Usar los nuevos selectores
  const reservations = useSelector(selectReservations);
  const loading = useSelector(selectLoadingReservations);
  const error = useSelector(selectErrorReservations);

  useEffect(() => {
    // ✅ Agregar protección para evitar el loop infinito
    if (DEBUG_MODE.DISABLE_AUTO_FETCH) {
      console.log('🚫 ReservationsList - fetchReservations bloqueado por DEBUG_MODE');
      return;
    }
    
    console.log('🔄 ReservationsList - Cargando reservas...');
    dispatch(fetchReservations());
  }, [dispatch]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Reservations</h1>
      <ul>
        {reservations.map(reservation => (
          <li key={reservation.id}>
            {reservation.pack.title} - {reservation.status}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ReservationsList;
