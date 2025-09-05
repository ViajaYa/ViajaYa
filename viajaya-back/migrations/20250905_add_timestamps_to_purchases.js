const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Verificar si las columnas ya existen
      const tableDescription = await queryInterface.describeTable('purchases');
      
      // Agregar created_at si no existe
      if (!tableDescription.created_at) {
        await queryInterface.addColumn('purchases', 'created_at', {
          type: DataTypes.DATE,
          allowNull: true, // Permitir null inicialmente
          defaultValue: Sequelize.fn('NOW')
        }, { transaction });
        
        // Actualizar registros existentes con fecha actual
        await queryInterface.sequelize.query(
          `UPDATE purchases SET created_at = NOW() WHERE created_at IS NULL;`,
          { transaction }
        );
        
        // Ahora hacer la columna NOT NULL
        await queryInterface.changeColumn('purchases', 'created_at', {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('NOW')
        }, { transaction });
      }
      
      // Agregar updated_at si no existe
      if (!tableDescription.updated_at) {
        await queryInterface.addColumn('purchases', 'updated_at', {
          type: DataTypes.DATE,
          allowNull: true, // Permitir null inicialmente
          defaultValue: Sequelize.fn('NOW')
        }, { transaction });
        
        // Actualizar registros existentes con fecha actual
        await queryInterface.sequelize.query(
          `UPDATE purchases SET updated_at = NOW() WHERE updated_at IS NULL;`,
          { transaction }
        );
        
        // Ahora hacer la columna NOT NULL
        await queryInterface.changeColumn('purchases', 'updated_at', {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('NOW')
        }, { transaction });
      }
      
      await transaction.commit();
      console.log('✅ Columnas de timestamp agregadas exitosamente a purchases');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error agregando timestamps a purchases:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Remover las columnas si existen
      const tableDescription = await queryInterface.describeTable('purchases');
      
      if (tableDescription.created_at) {
        await queryInterface.removeColumn('purchases', 'created_at', { transaction });
      }
      
      if (tableDescription.updated_at) {
        await queryInterface.removeColumn('purchases', 'updated_at', { transaction });
      }
      
      await transaction.commit();
      console.log('✅ Columnas de timestamp removidas de purchases');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error removiendo timestamps de purchases:', error);
      throw error;
    }
  }
};
