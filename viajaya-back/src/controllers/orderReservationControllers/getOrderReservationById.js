const { OrderReservation, User, Pack } = require('../../db');

const getOrderReservationById = async (req, res) => {
    try {
      const { id } = req.params;
      const order = await OrderReservation.findByPk(id, {
       include: [
        { model: Pack, as: 'Package' },
        { model: User, as: 'Customer' }
      ]
      });
  
      if (!order) {
        return res.status(404).json({ message: 'Orden de reserva no encontrada' });
      }
  
      return res.status(200).json(order);
    } catch (error) {
      return res.status(500).json({ message: 'Error al obtener la orden de reserva', error });
    }
  };

  module.exports = getOrderReservationById;