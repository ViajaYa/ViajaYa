const { Number } = require('../models/Number');

module.exports = {
  // Obtener todos los números ordenados
  getAllNumbers: async () => {
    try {
      const numbers = await Number.findAll({
        order: [['value', 'ASC']],
      });
      return numbers;
    } catch (error) {
      console.error('Error al obtener los números:', error);
      throw new Error('Error al obtener los números');
    }
  },

  // Seleccionar números
  selectNumbers: async (data) => {
    const { numbers, name, phone } = data;

    if (!Array.isArray(numbers)) {
      throw new Error('numbers debe ser un array');
    }

    try {
      for (let value of numbers) {
        const number = await Number.findOne({ where: { value } });

        if (!number) {
          console.log(`Número ${value} no encontrado`);
          continue;
        }

        if (number.selected) {
          console.log(`Número ${value} ya seleccionado`);
          continue;
        }

        number.selected = true;
        number.name = name;
        number.phone = phone;
        await number.save();
      }

      return 'Números seleccionados correctamente';
    } catch (error) {
      console.error('Error al seleccionar los números:', error);
      throw new Error('Error al seleccionar los números');
    }
  },

  // Obtener números disponibles con paginación
  getAvailableNumbers: async (pagination) => {
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    try {
      const { count, rows: availableNumbers } = await Number.findAndCountAll({
        where: { selected: false },
        offset,
        limit,
        order: [['value', 'ASC']],
      });

      return {
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        availableNumbers,
      };
    } catch (error) {
      console.error('Error al obtener números disponibles:', error);
      throw new Error('Error al obtener números disponibles');
    }
  },

  // Obtener números seleccionados
  getSelectedNumbers: async () => {
    try {
      const selectedNumbers = await Number.findAll({
        where: { selected: true },
        attributes: ['id', 'value', 'name', 'phone', 'isPaid'],
        order: [['value', 'ASC']],
      });
      return selectedNumbers;
    } catch (error) {
      console.error('Error al obtener los números seleccionados:', error);
      throw new Error('Error al obtener los números seleccionados');
    }
  },

  // Actualizar el estado de pago de un número
  updateNumberPaymentStatus: async (data) => {
    const { id, isPaid } = data;

    try {
      const number = await Number.findByPk(id);
      if (!number) {
        throw new Error('Número no encontrado');
      }

      number.isPaid = isPaid;
      await number.save();

      return number;
    } catch (error) {
      console.error('Error al actualizar el estado de pago:', error);
      throw new Error('Error al actualizar el estado de pago');
    }
  },

  // Resetear los números
  resetNumbers: async () => {
    try {
      console.log('Reseteando números...');

      const result = await Number.update(
        { selected: false, name: null, phone: null },
        { where: {} }
      );

      console.log('Resultado de la actualización:', result);

      const updatedNumbers = await Number.findAll();
      console.log('Números actualizados:', updatedNumbers);

      return 'Números reseteados correctamente';
    } catch (error) {
      console.error('Error al resetear los números:', error);
      throw new Error('Error al resetear los números');
    }
  },
};
