const { OrderReservation, User, Pack } = require('../../db');

const createOrderReservation = async (req, res) => {
  try {
    const { userId, packId, numberOfPeople, totalPrice, fechas } = req.body;

    // Verifica que se reciban las fechas
    if (!fechas || !fechas.salida || !fechas.llegada) {
      return res.status(400).json({ message: 'Fechas de salida y llegada son requeridas.' });
    }

    const newOrder = await OrderReservation.create({
      userId,
      packId,
      numberOfPeople,
      totalPrice,
      fechas, // Agregamos el campo de fechas aquí
    });

    return res.status(201).json(newOrder);
  } catch (error) {
    return res.status(500).json({ message: 'Error al crear la orden de reserva', error });
  }
};

module.exports = createOrderReservation;


