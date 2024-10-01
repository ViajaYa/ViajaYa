const { OrderReservation, User, Pack } = require('../../db');

// Eliminar una orden de reserva por su ID
const deleteOrderReservation = async (req, res) => {
    try {
      const { id } = req.params;
  
      const order = await OrderReservation.findByPk(id);
  
      if (!order) {
        return res.status(404).json({ message: 'Orden de reserva no encontrada' });
      }
  
      // Eliminar la orden
      await order.destroy();
  
      return res.status(200).json({ message: 'Orden de reserva eliminada correctamente' });
    } catch (error) {
      return res.status(500).json({ message: 'Error al eliminar la orden de reserva', error });
    }
  };
  module.exports = deleteOrderReservation