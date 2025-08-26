'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Cambiar fecha_ida y fecha_regreso de DATE a DATEONLY para evitar problemas de zona horaria
    await queryInterface.changeColumn('Quotes', 'fecha_ida', {
      type: Sequelize.DATEONLY,
      allowNull: false,
    });

    await queryInterface.changeColumn('Quotes', 'fecha_regreso', {
      type: Sequelize.DATEONLY,
      allowNull: false,
    });

    console.log('✅ Migración completada: fecha_ida y fecha_regreso cambiadas a DATEONLY');
  },

  down: async (queryInterface, Sequelize) => {
    // Revertir cambios - volver a DATE
    await queryInterface.changeColumn('Quotes', 'fecha_ida', {
      type: Sequelize.DATE,
      allowNull: false,
    });

    await queryInterface.changeColumn('Quotes', 'fecha_regreso', {
      type: Sequelize.DATE,
      allowNull: false,
    });

    console.log('✅ Migración revertida: fecha_ida y fecha_regreso vueltas a DATE');
  }
};
