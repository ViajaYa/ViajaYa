import  { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchReservations } from '../../redux/NewActions/newActions'; 

const ReservationsList = () => {
  const dispatch = useDispatch();
  const reservations = useSelector(state => state.reservations.reservations);
  const loading = useSelector(state => state.reservations.loading);
  const error = useSelector(state => state.reservations.error);

  useEffect(() => {
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
