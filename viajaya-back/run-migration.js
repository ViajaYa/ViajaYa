const { sequelize } = require('./src/db');

async function runMigration() {
  try {
    console.log('🔄 Ejecutando migración de campos de pasajeros...');
    
    // Ejecutar la migración manualmente
    const Sequelize = require('sequelize');
    const queryInterface = sequelize.getQueryInterface();
    
    // Agregar nuevos campos para manejo detallado de pasajeros
    await queryInterface.addColumn('quotes', 'adultos', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      comment: 'Personas mayores de 14 años (pagan precio completo)'
    });

    await queryInterface.addColumn('quotes', 'menores', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      comment: 'Niños de 2-14 años (pagan precio reducido)'
    });

    await queryInterface.addColumn('quotes', 'infantes', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      comment: 'Bebés menores de 2 años (no pagan pero necesitan datos)'
    });

    await queryInterface.addColumn('quotes', 'edades_menores', {
      type: Sequelize.ARRAY(Sequelize.INTEGER),
      defaultValue: [],
      comment: 'Edades específicas de menores de 2-14 años'
    });

    await queryInterface.addColumn('quotes', 'edades_infantes', {
      type: Sequelize.ARRAY(Sequelize.INTEGER),
      defaultValue: [],
      comment: 'Edades específicas de infantes menores de 2 años (en meses)'
    });

    await queryInterface.addColumn('quotes', 'personas_atencion_especial', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      comment: 'Personas que requieren atención especial/discapacidad'
    });

    await queryInterface.addColumn('quotes', 'detalles_atencion_especial', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Descripción de las necesidades especiales'
    });

    // Campos mejorados para alojamiento
    await queryInterface.addColumn('quotes', 'tipo_hotel', {
      type: Sequelize.ENUM('basico', 'superior'),
      allowNull: true,
      defaultValue: 'basico'
    });

    await queryInterface.addColumn('quotes', 'acomodacion', {
      type: Sequelize.ENUM('sencilla', 'doble', 'triple', 'cuadruple'),
      allowNull: true,
      defaultValue: 'doble'
    });

    // Migrar datos existentes: asignar todos los pasajeros como adultos
    await queryInterface.sequelize.query(`
      UPDATE quotes 
      SET adultos = numero_personas 
      WHERE adultos IS NULL AND numero_personas IS NOT NULL AND numero_personas > 0
    `);

    console.log('✅ Migración completada exitosamente!');
    
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('⚠️ Los campos ya existen en la base de datos');
    } else {
      console.error('❌ Error durante la migración:', error.message);
    }
  } finally {
    await sequelize.close();
  }
}

runMigration();
