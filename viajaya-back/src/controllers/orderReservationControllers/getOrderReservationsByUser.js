const { OrderReservation, User, Pack } = require('../../db');

const getOrderReservationsByUser = async (req, res) => {
    try {
      const { userId } = req.params;
  
      // Buscar todas las órdenes de reserva que pertenecen a un usuario específico
      const orders = await OrderReservation.findAll({
        where: { userId },
        include: [Pack]  // Incluir los datos del pack asociado
      });
  
      if (!orders || orders.length === 0) {
        return res.status(404).json({ message: 'No se encontraron órdenes de reserva para este usuario' });
      }
  
      return res.status(200).json(orders);
    } catch (error) {
      return res.status(500).json({ message: 'Error al obtener las órdenes de reserva del usuario', error });
    }
  };
  module.exports = getOrderReservationsByUser