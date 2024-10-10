const { OrderReservation, User, Pack } = require('../../db');

const createOrderReservation = async (req, res) => {
  try {
    const { userId, packId, numberOfPeople, totalPrice, fechas } = req.body;

    // Verifica que se reciban las fechas
    if (!fechas || !fechas.salida || !fechas.llegada) {
      return res.status(400).json({ message: 'Fechas de salida y llegada son requeridas.' });
    }

    // Crea la nueva orden
    const newOrder = await OrderReservation.create({
      userId,
      packId,
      numberOfPeople,
      totalPrice,
      fechas,
    });

    // Obtiene el usuario que hace la reserva
    const user = await User.findByPk(userId);
    
    // Maneja la lógica de referidos
    if (user && user.referred_by) {
      const referrer = await User.findOne({ where: { referral_code: user.referred_by } });
      if (referrer) {
        const pointsEarned = Math.floor(totalPrice / 50000); // Calcula puntos ganados
        await referrer.increment('points', { by: pointsEarned }); // Sumar puntos al referido
        console.log(`Puntos agregados al usuario referido: ${referrer.id}, Puntos: ${pointsEarned}`);
      }
    }

    return res.status(201).json(newOrder);
  } catch (error) {
    return res.status(500).json({ message: 'Error al crear la orden de reserva', error });
  }
};

module.exports = createOrderReservation;




