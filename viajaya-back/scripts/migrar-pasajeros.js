// ✅ Script para ejecutar la migración de pasajeros manualmente
// Archivo: scripts/migrar-pasajeros.js

const { sequelize } = require('../src/db');

async function ejecutarMigracion() {
  try {
    console.log('🔄 Iniciando migración de campos de pasajeros...');

    // ✅ Agregar nuevos campos para manejo detallado de pasajeros
    await sequelize.query(`
      ALTER TABLE quotes 
      ADD COLUMN IF NOT EXISTS adultos INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS menores INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS infantes INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS edades_menores INTEGER[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS edades_infantes INTEGER[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS personas_atencion_especial INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS detalles_atencion_especial TEXT,
      ADD COLUMN IF NOT EXISTS tipo_hotel VARCHAR(20) DEFAULT 'basico',
      ADD COLUMN IF NOT EXISTS acomodacion VARCHAR(20) DEFAULT 'doble';
    `);

    console.log('✅ Campos agregados exitosamente');

    // ✅ Migrar datos existentes: asignar todos los pasajeros como adultos
    const result = await sequelize.query(`
      UPDATE quotes 
      SET adultos = COALESCE(numero_personas, 1),
          menores = 0,
          infantes = 0,
          tipo_hotel = COALESCE(tipo_hotel, 'basico'),
          acomodacion = COALESCE(acomodacion, 'doble')
      WHERE adultos IS NULL;
    `);

    console.log('✅ Datos migrados:', result[1], 'filas afectadas');

    // ✅ Verificar la migración
    const stats = await sequelize.query(`
      SELECT 
        COUNT(*) as total_quotes,
        SUM(adultos) as total_adultos,
        SUM(menores) as total_menores,
        SUM(infantes) as total_infantes,
        COUNT(*) FILTER (WHERE tipo_hotel IS NOT NULL) as con_tipo_hotel
      FROM quotes;
    `);

    console.log('📊 Estadísticas después de la migración:', stats[0][0]);
    console.log('✅ Migración completada exitosamente');

  } catch (error) {
    console.error('❌ Error en la migración:', error);
    throw error;
  }
}

module.exports = { ejecutarMigracion };

// Si se ejecuta directamente
if (require.main === module) {
  ejecutarMigracion()
    .then(() => {
      console.log('🎉 Migración terminada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}
