import { useCallback } from "react";
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

export const useReservations = () => {
  const reservations = useAppSelector(selectReservations);
  const loading = useAppSelector(selectLoadingReservations);
  const error = useAppSelector(selectErrorReservations);
  const selectedReservation = useAppSelector(selectSelectedReservation);
  const dispatch = useAppDispatch();

  // Memoiza las funciones para que sean estables
  const fetchReservationsCb = useCallback(() => dispatch(fetchReservations()), [dispatch]);
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