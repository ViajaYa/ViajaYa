// ✅ Utilidades para cálculos de cotizaciones
// Archivo: src/utils/quoteCalculations.js

/**
 * Calcula cuántas personas pagan en una cotización
 * @param {Object} passengerData - Datos de pasajeros
 * @returns {number} - Número de personas que pagan
 */
function calcularPersonasQuePagan(passengerData) {
  const {
    adultos = 0,
    menores = 0,
    infantes = 0  // Los infantes NO pagan
  } = passengerData;

  return adultos + menores; // Solo adultos y menores pagan
}

/**
 * Calcula el precio total considerando que infantes no pagan
 * @param {Object} passengerData - Datos de pasajeros
 * @param {number} precioBase - Precio base por persona
 * @returns {Object} - Desglose de precios
 */
function calcularPrecioConEdades(passengerData, precioBase) {
  const {
    adultos = 0,
    menores = 0,
    infantes = 0
  } = passengerData;

  const precioAdultos = adultos * precioBase;
  const precioMenores = menores * precioBase; // ✅ Menores pagan precio completo
  const precioInfantes = 0; // ✅ Infantes NO pagan

  return {
    adultos: precioAdultos,
    menores: precioMenores,
    infantes: precioInfantes,
    total: precioAdultos + precioMenores + precioInfantes,
    personasQuePagan: adultos + menores,
    desglose: {
      adultos: { 
        cantidad: adultos, 
        precio_unitario: precioBase, 
        subtotal: precioAdultos 
      },
      menores: { 
        cantidad: menores, 
        precio_unitario: precioBase, 
        subtotal: precioMenores 
      },
      infantes: { 
        cantidad: infantes, 
        precio_unitario: 0, 
        subtotal: precioInfantes 
      }
    }
  };
}

/**
 * Valida que los datos de pasajeros sean coherentes
 * @param {Object} passengerData - Datos de pasajeros
 * @returns {Object} - Resultado de validación
 */
function validarDatosPasajeros(passengerData) {
  const {
    numero_personas,
    adultos = 0,
    menores = 0,
    infantes = 0,
    edades_menores = [],
    edades_infantes = []
  } = passengerData;

  const errors = [];
  const totalCalculado = adultos + menores + infantes;

  // Validar coherencia en totales
  if (numero_personas && totalCalculado !== numero_personas) {
    errors.push(`Total de pasajeros (${totalCalculado}) no coincide con numero_personas (${numero_personas})`);
  }

  // Validar edades
  if (edades_menores.length !== menores) {
    errors.push(`Número de edades de menores (${edades_menores.length}) no coincide con cantidad de menores (${menores})`);
  }

  if (edades_infantes.length !== infantes) {
    errors.push(`Número de edades de infantes (${edades_infantes.length}) no coincide con cantidad de infantes (${infantes})`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    totalCalculado,
    personasQuePagan: adultos + menores
  };
}

/**
 * Convierte datos legacy a nuevo formato
 * @param {Object} legacyData - Datos en formato anterior
 * @returns {Object} - Datos convertidos
 */
function convertirDatosLegacy(legacyData) {
  const {
    numero_personas = 1,
    ninos = 0,
    edades_ninos = []
  } = legacyData;

  let adultos = 0;
  let menores = 0;
  let infantes = 0;
  let edades_menores = [];
  let edades_infantes = [];

  if (edades_ninos && edades_ninos.length > 0) {
    // Usar edades específicas para clasificar
    edades_ninos.forEach(edad => {
      if (edad >= 14) {
        adultos++;
      } else if (edad >= 2) {
        menores++;
        edades_menores.push(edad);
      } else {
        infantes++;
        edades_infantes.push(Math.round(edad * 12)); // Convertir a meses
      }
    });

    // Completar adultos restantes
    const totalContado = adultos + menores + infantes;
    if (numero_personas > totalContado) {
      adultos += (numero_personas - totalContado);
    }
  } else {
    // Sin edades específicas - asumir que ninos son menores
    adultos = numero_personas - ninos;
    menores = ninos;
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
 * Genera resumen legible de pasajeros
 * @param {Object} passengerData - Datos de pasajeros
 * @returns {string} - Resumen en texto
 */
function generarResumenPasajeros(passengerData) {
  const {
    adultos = 0,
    menores = 0,
    infantes = 0,
    edades_menores = [],
    edades_infantes = []
  } = passengerData;

  const total = adultos + menores + infantes;
  const personasQuePagan = adultos + menores;
  
  let resumen = `${total} pasajero${total !== 1 ? 's' : ''} (${personasQuePagan} que pagan)`;

  if (adultos > 0) {
    resumen += ` • ${adultos} adulto${adultos !== 1 ? 's' : ''} (14+ años)`;
  }

  if (menores > 0) {
    const edadesTexto = edades_menores.length > 0 
      ? ` - Edades: ${edades_menores.join(', ')} años` 
      : ' (2-14 años)';
    resumen += ` • ${menores} menor${menores !== 1 ? 'es' : ''}${edadesTexto}`;
  }

  if (infantes > 0) {
    const edadesTexto = edades_infantes.length > 0 
      ? ` - Edades: ${edades_infantes.join(', ')} meses` 
      : ' (<2 años)';
    resumen += ` • ${infantes} infante${infantes !== 1 ? 's' : ''}${edadesTexto}`;
  }

  return resumen;
}

module.exports = {
  calcularPersonasQuePagan,
  calcularPrecioConEdades,
  validarDatosPasajeros,
  convertirDatosLegacy,
  generarResumenPasajeros
};
