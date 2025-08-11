// ✅ Utilidades para validación y manejo de datos de pasajeros
// Archivo: src/utils/passengerValidation.js

/**
 * Valida los datos de pasajeros según las nuevas reglas de edad
 * @param {Object} passengerData - Datos de pasajeros
 * @returns {Object} - Resultado de validación con errores si los hay
 */
function validatePassengerData(passengerData) {
  const {
    numero_personas,
    adultos,
    menores,
    infantes,
    edades_menores,
    edades_infantes,
    personas_atencion_especial
  } = passengerData;

  const errors = [];
  const warnings = [];

  // ✅ Validación 1: Coherencia en números totales
  const totalCalculado = (adultos || 0) + (menores || 0) + (infantes || 0);
  
  if (numero_personas && totalCalculado !== numero_personas) {
    errors.push({
      field: 'numero_personas',
      message: `El total de pasajeros (${totalCalculado}) no coincide con numero_personas (${numero_personas})`
    });
  }

  // ✅ Validación 2: Rangos de edades
  if (edades_menores && edades_menores.length > 0) {
    if (edades_menores.length !== (menores || 0)) {
      errors.push({
        field: 'edades_menores',
        message: `Número de edades de menores (${edades_menores.length}) no coincide con cantidad de menores (${menores || 0})`
      });
    }

    const edadesInvalidas = edades_menores.filter(edad => edad < 2 || edad > 14);
    if (edadesInvalidas.length > 0) {
      errors.push({
        field: 'edades_menores',
        message: `Edades inválidas para menores: ${edadesInvalidas.join(', ')}. Deben estar entre 2 y 14 años`
      });
    }
  }

  if (edades_infantes && edades_infantes.length > 0) {
    if (edades_infantes.length !== (infantes || 0)) {
      errors.push({
        field: 'edades_infantes',
        message: `Número de edades de infantes (${edades_infantes.length}) no coincide con cantidad de infantes (${infantes || 0})`
      });
    }

    const edadesInvalidas = edades_infantes.filter(edad => edad < 0 || edad >= 24);
    if (edadesInvalidas.length > 0) {
      errors.push({
        field: 'edades_infantes',
        message: `Edades inválidas para infantes: ${edadesInvalidas.join(', ')}. Deben estar entre 0 y 23 meses`
      });
    }
  }

  // ✅ Validación 3: Personas con atención especial
  if (personas_atencion_especial && personas_atencion_especial > totalCalculado) {
    errors.push({
      field: 'personas_atencion_especial',
      message: `Personas con atención especial (${personas_atencion_especial}) no puede ser mayor al total de pasajeros (${totalCalculado})`
    });
  }

  // ✅ Validación 4: Al menos un adulto responsable
  if ((adultos || 0) === 0 && ((menores || 0) > 0 || (infantes || 0) > 0)) {
    warnings.push({
      field: 'adultos',
      message: 'Se recomienda que al menos un adulto acompañe a menores e infantes'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    totalCalculado
  };
}

/**
 * Convierte datos legacy de pasajeros al nuevo formato
 * @param {Object} legacyData - Datos en formato anterior
 * @returns {Object} - Datos convertidos al nuevo formato
 */
function convertLegacyPassengerData(legacyData) {
  const {
    numero_personas,
    ninos,
    edades_ninos
  } = legacyData;

  let adultos = 0;
  let menores = 0;
  let infantes = 0;
  let edades_menores = [];
  let edades_infantes = [];

  // Conversión basada en edades específicas
  if (edades_ninos && edades_ninos.length > 0) {
    const edadesArray = Array.isArray(edades_ninos) ? edades_ninos : [];
    
    edadesArray.forEach(edad => {
      if (edad >= 14) {
        adultos++;
      } else if (edad >= 2) {
        menores++;
        edades_menores.push(edad);
      } else {
        infantes++;
        edades_infantes.push(edad * 12); // Convertir años a meses
      }
    });

    // Completar adultos si hay diferencia con numero_personas
    const totalContado = adultos + menores + infantes;
    if (numero_personas && numero_personas > totalContado) {
      adultos += (numero_personas - totalContado);
    }
  } else {
    // Sin edades específicas, usar lógica simple
    const totalNinos = ninos || 0;
    const totalPersonas = numero_personas || 1;
    
    adultos = totalPersonas - totalNinos;
    menores = totalNinos; // Asumir que todos los niños son menores (2-14)
    infantes = 0;
  }

  return {
    adultos: Math.max(0, adultos),
    menores: Math.max(0, menores),
    infantes: Math.max(0, infantes),
    edades_menores,
    edades_infantes,
    numero_personas: adultos + menores + infantes
  };
}

/**
 * Calcula precios donde solo infantes no pagan
 * @param {Object} passengerData - Datos de pasajeros
 * @param {number} precioBase - Precio base por persona
 * @returns {Object} - Desglose de precios
 */
function calculatePricingByAge(passengerData, precioBase) {
  const {
    adultos = 0,
    menores = 0,
    infantes = 0
  } = passengerData;

  // ✅ NUEVA LÓGICA: Solo infantes no pagan
  const precioAdultos = adultos * precioBase;
  const precioMenores = menores * precioBase;  // ✅ Menores SÍ pagan precio completo
  const precioInfantes = 0;                    // ✅ Solo infantes no pagan

  const subtotal = precioAdultos + precioMenores + precioInfantes;
  const personasQuePagan = adultos + menores;  // ✅ Solo excluir infantes

  return {
    desglose: {
      adultos: {
        cantidad: adultos,
        precio_unitario: precioBase,
        subtotal: precioAdultos
      },
      menores: {
        cantidad: menores,
        precio_unitario: precioBase, // ✅ Sin descuento
        subtotal: precioMenores
      },
      infantes: {
        cantidad: infantes,
        precio_unitario: 0,          // ✅ Gratis
        subtotal: precioInfantes
      }
    },
    subtotal,
    total: subtotal,
    total_pasajeros: adultos + menores + infantes,
    personas_que_pagan: personasQuePagan // ✅ Solo los que pagan
  };
}

/**
 * Genera un resumen legible de los pasajeros
 * @param {Object} passengerData - Datos de pasajeros
 * @returns {string} - Resumen en texto
 */
function generatePassengerSummary(passengerData) {
  const {
    adultos = 0,
    menores = 0,
    infantes = 0,
    personas_atencion_especial = 0,
    edades_menores = [],
    edades_infantes = []
  } = passengerData;

  const total = adultos + menores + infantes;
  let summary = `Total: ${total} pasajero${total !== 1 ? 's' : ''}`;

  if (adultos > 0) {
    summary += ` • ${adultos} adulto${adultos !== 1 ? 's' : ''} (14+ años)`;
  }

  if (menores > 0) {
    const edadesTexto = edades_menores.length > 0 
      ? ` (${edades_menores.join(', ')} años)` 
      : ' (2-14 años)';
    summary += ` • ${menores} menor${menores !== 1 ? 'es' : ''}${edadesTexto}`;
  }

  if (infantes > 0) {
    const edadesTexto = edades_infantes.length > 0 
      ? ` (${edades_infantes.join(', ')} meses)` 
      : ' (<2 años)';
    summary += ` • ${infantes} infante${infantes !== 1 ? 's' : ''}${edadesTexto}`;
  }

  if (personas_atencion_especial > 0) {
    summary += ` • ${personas_atencion_especial} con atención especial`;
  }

  return summary;
}

module.exports = {
  validatePassengerData,
  convertLegacyPassengerData,
  calculatePricingByAge,
  generatePassengerSummary
};
