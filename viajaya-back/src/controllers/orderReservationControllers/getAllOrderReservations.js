const { OrderReservation, Pack, User } = require('../../db');

const getAllOrderReservations = async (req, res) => {
  try {
    const orders = await OrderReservation.findAll({
      include: [
        { model: Pack, as: 'Package' },
        { model: User, as: 'Customer' }
      ]
    });
    return res.status(200).json(orders);
  } catch (error) {
    console.error(error); // Para ver el error real en consola
    return res.status(500).json({ message: 'Error al obtener las órdenes de reserva', error });
  }
};

module.exports = getAllOrderReservations;

  