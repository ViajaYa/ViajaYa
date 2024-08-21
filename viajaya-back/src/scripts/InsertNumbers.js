import Number from '../models/Number.js';

// Función para insertar números del 000 al 999
export const insertNumbers = async () => {
  try {
    // Obtener todos los registros existentes en la base de datos
    const existingNumbers = await Number.findAll({
      attributes: ['value'],
      raw: true
    });

    // Crear un conjunto con los valores existentes
    const existingNumbersSet = new Set(existingNumbers.map(num => num.value));

    // Generar y guardar números del 000 al 999
    const numbers = [];
    for (let i = 0; i <= 999; i++) {
      const value = i.toString().padStart(3, '0');
      if (!existingNumbersSet.has(value)) {
        numbers.push({
          value,
          selected: false,
          name: null,
          phone: null,
        });
      }
    }

    // Insertar sólo los números que no existían previamente
    if (numbers.length > 0) {
      await Number.bulkCreate(numbers);
      console.log('Números insertados correctamente');
    } else {
      console.log('No se insertaron nuevos números. Todos los números ya existen.');
    }
  } catch (error) {
    console.error('Error al insertar números:', error);
  }
};




