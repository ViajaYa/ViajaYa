const { Router } = require('express');
const { Reservation } = require('../db'); // Importa el modelo de Reservation
const { User, Pack } = require('../db');
  // Si necesitas trabajar con estos modelos también
const reservationRoutes = Router();

// POST /reservations
reservationRoutes.post('/', async (req, res) => {
    const { id, packId, status } = req.body; // Asegúrate de recibir estos datos desde el frontend
  
    try {
      // Crea la nueva reserva
      const newReservation = await Reservation.create({
        id,
        packId,
        status: status || 'pending', // Puedes establecer un estado por defecto, como 'pending'
      });
  
      res.status(201).json(newReservation);
    } catch (error) {
      console.log(error.message);
      res.status(400).json({ error: error.message });
  }
  });
  // GET /reservations/user/:id
reservationRoutes.get('/user/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      const userReservations = await Reservation.findAll({
        where: { id },
        include: [Pack], // Incluir detalles del pack en cada reserva
      });
  
      res.status(200).json(userReservations);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  // PUT /reservations/:id
reservationRoutes.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // Solo permitimos actualizar el estado
  
    try {
      const reservation = await Reservation.findByPk(id);
      if (!reservation) {
        return res.status(404).json({ error: 'Reservation not found' });
      }
  
      reservation.status = status || reservation.status; // Actualiza el estado
      await reservation.save();
  
      res.status(200).json(reservation);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  // DELETE /reservations/:id
reservationRoutes.delete('/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      const reservation = await Reservation.findByPk(id);
      if (!reservation) {
        return res.status(404).json({ error: 'Reservation not found' });
      }
  
      await reservation.destroy();
      res.status(204).send(); // No devuelve contenido, indicando eliminación exitosa
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  module.exports = reservationRoutes;