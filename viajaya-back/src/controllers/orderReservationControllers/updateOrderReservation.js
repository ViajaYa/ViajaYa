const { OrderReservation, User, Pack } = require('../../db');

// Actualizar una orden de reserva por su ID
const updateOrderReservation = async (req, res) => {
    try {
      const { id } = req.params;
      const { numberOfPeople, status, totalPrice, isPaid } = req.body;
  
      const order = await OrderReservation.findByPk(id);
  
      if (!order) {
        return res.status(404).json({ message: 'Orden de reserva no encontrada' });
      }
  
      // Actualizar los campos de la orden
      await order.update({
        numberOfPeople,
        status,
        totalPrice,
        isPaid,
      });
  
      return res.status(200).json(order);
    } catch (error) {
      return res.status(500).json({ message: 'Error al actualizar la orden de reserva', error });
    }
  };

  
module.exports = updateOrderReservation
  