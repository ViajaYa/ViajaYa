const {Reservation} = require("../db")

module.exports = {
     createReservation : async (req, res) => {
        try {
          const { id, packId, amount } = req.body;
      
          const newReservation = await Reservation.create({
            id,
            packId,
            amount,
            status: 'pending', // La reserva comienza en estado pendiente
          });
      
          res.status(201).json(newReservation);
        } catch (error) {
          res.status(500).json({ message: 'Error al crear la reserva', error });
        }
      },

      getReservationsByUser : async (req, res) => {
        try {
          const { id } = req.params;
      
          const reservations = await Reservation.findAll({
            where: { id },
            include: [Pack], // Incluir el pack asociado
          });
      
          res.status(200).json(reservations);
        } catch (error) {
          res.status(500).json({ message: 'Error al obtener las reservas', error });
        }
      },
      
      updateReservationStatus : async (req, res) => {
        try {
          const { id } = req.params;
          const { status, paymentId } = req.body;
      
          const reservation = await Reservation.findByPk(id);
      
          if (!reservation) {
            return res.status(404).json({ message: 'Reserva no encontrada' });
          }
      
          reservation.status = status;
          if (paymentId) reservation.paymentId = paymentId;
      
          await reservation.save();
      
          res.status(200).json(reservation);
        } catch (error) {
          res.status(500).json({ message: 'Error al actualizar la reserva', error });
        }
      }
}