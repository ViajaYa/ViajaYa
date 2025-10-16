module.exports = {
  up: async (queryInterface, Sequelize) => {
/**
 * Migration: Add Transport Schedule Fields to Tiquetes
 * Date: 2025-10-15
 * 
 * This migration documents the addition of transport schedule fields to the 
 * QuoteCalculation model's tiquetes JSONB field.
 * 
 * Since tiquetes is a JSONB field, no ALTER TABLE is needed.
 * The model's defaultValue has been updated to include:
 * - hora_salida_ida: Departure time for outbound transport
 * - hora_llegada_ida: Arrival time for outbound transport
 * - hora_salida_vuelta: Departure time for return transport
 * - hora_llegada_vuelta: Arrival time for return transport
 * - aerolinea: Transport provider/company name (airline, bus company, etc.)
 * - numero_vuelo_ida: Outbound transport number (flight/bus number)
 * - numero_vuelo_vuelta: Return transport number (flight/bus number)
 * 
 * Note: All fields are optional to support various transport types 
 * (air, land, water transport).
 */    return Promise.resolve();
  },

  down: async (queryInterface, Sequelize) => {
    // Rollback: Los campos JSONB no se pueden "eliminar" fácilmente
    // pero podemos documentar que esta migración se ha revertido
    console.log('⏪ Rollback: Revertir campos de horarios de tiquetes');
    console.log('⚠️  Nota: Los datos existentes con horarios permanecerán en la BD');
    
    return Promise.resolve();
  }
};
