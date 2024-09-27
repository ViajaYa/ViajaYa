const { OrderReservation, User, Pack } = require('../../db');

const createOrderReservation = async (req, res) => {
  try {
    const { userId, packId, numberOfPeople, totalPrice } = req.body;

    const newOrder = await OrderReservation.create({
      userId,
      packId,
      numberOfPeople,
      totalPrice,
    });

    return res.status(201).json(newOrder);
  } catch (error) {
    return res.status(500).json({ message: 'Error al crear la orden de reserva', error });
  }
};

module.exports = createOrderReservation;

