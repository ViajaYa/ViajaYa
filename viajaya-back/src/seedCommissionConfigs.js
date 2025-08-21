// src/seedCommissionConfigs.js
const { CommissionConfig, User } = require('./db');

const ROLES = ['asesor', 'lider', 'gerente'];
const TRIP_TYPES = ['nacional', 'internacional', 'operadorLlano', 'hotel'];
const DEFAULT_AMOUNT = '10000.00';

async function seedCommissionConfigs() {
  const count = await CommissionConfig.count();
  if (count > 0) {
    console.log('🟢 Ya existen configuraciones de comisión, no se cargan por defecto.');
    return;
  }

  // Busca el Owner para asignar como creador
  const owner = await User.findOne({ where: { role: 7 } });
  const created_by = owner ? owner.id : 1;

  const configs = [];
  for (const role of ROLES) {
    for (const trip_type of TRIP_TYPES) {
      configs.push({
        role,
        trip_type,
        calculation_type: 'fixed_per_person',
        amount_per_person: DEFAULT_AMOUNT,
        is_active: true,
        created_by,
        effective_from: new Date(),
      });
    }
  }

  await CommissionConfig.bulkCreate(configs);
  console.log('✅ Comisiones por defecto cargadas exitosamente.');
}

module.exports = seedCommissionConfigs;
