const { OrderReservation, Pack } = require('../../db');

const getAllOrderReservations = async (req, res) => {
  try {
    const orders = await OrderReservation.findAll({
      include: [Pack],
    });
    return res.status(200).json(orders);
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener las órdenes de reserva', error });
  }
};

module.exports = getAllOrderReservations;

  