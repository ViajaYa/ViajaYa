const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ✅ Función para generar información detallada de inclusiones del viaje
function generateTripInclusions(quote) {
   console.log("🔍 DEBUG generateTripInclusions - INICIO:", {
    quote_id: quote.id,
    tiene_calculation: !!quote.calculation,
    excursiones_directas: quote.excursiones,
    calculation_excursiones: quote.calculation?.excursiones
  });

  const calculation = getCalculationData(quote);
  
  console.log("🔍 DEBUG calculation obtenido:", {
    excursiones_existe: !!calculation.excursiones,
    excursiones_tipo: typeof calculation.excursiones,
    excursiones_array: Array.isArray(calculation.excursiones),
    excursiones_longitud: calculation.excursiones?.length,
    excursiones_contenido: calculation.excursiones
  });

  const inclusiones = [];

  // 1. TIQUETES AÉREOS
  if (calculation.tiquetes && calculation.tiquetes.costo_total > 0) {
    const tipoTiquete = calculation.tiquetes.tipo || 'ida_vuelta';
    const aerolinea = calculation.tiquetes.proveedor || 'Aerolínea por confirmar';
    
    let descripcionTiquetes = '';
    if (tipoTiquete === 'ida_vuelta') {
      descripcionTiquetes = `Tiquetes aéreos ida y vuelta con ${aerolinea}`;
    } else if (tipoTiquete === 'ida') {
      descripcionTiquetes = `Tiquetes aéreos solo ida con ${aerolinea}`;
    } else {
      descripcionTiquetes = `Tiquetes aéreos con ${aerolinea}`;
    }
    
    inclusiones.push({
      titulo: 'TRANSPORTE AÉREO',
      descripcion: descripcionTiquetes,
      detalles: [
        `Ruta: ${calculation.tiquetes.origen || quote.origen || 'Colombia'} ↔ ${calculation.tiquetes.destino || quote.destino}`,
        calculation.equipaje?.cabina?.incluido ? 'Incluye equipaje de cabina (morral)' : 'Equipaje de cabina básico'
      ]
    });
  }

  // 2. ALOJAMIENTO
  if (calculation.hotel && calculation.hotel.costo_total > 0) {
    const noches = calculation.hotel.noches || calcularNoches(quote.fecha_ida, quote.fecha_regreso);
    const categoria = calculation.hotel.categoria || quote.tipo_hotel;
    const acomodacion = calculation.hotel.acomodacion || quote.acomodacion;
    const nombreHotel = calculation.hotel.nombre || `Hotel en ${quote.destino}`;
    
    const detallesHotel = [
      `${noches} noche${noches > 1 ? 's' : ''} de hospedaje`,
      `Categoría: ${getTipoHotelLabel(categoria)}`,
      `Habitación: ${getAcomodacionLabel(acomodacion)}`
    ];
    
    if (calculation.hotel.ubicacion) {
      detallesHotel.push(`Ubicación: ${calculation.hotel.ubicacion}`);
    }

    inclusiones.push({
      titulo: 'ALOJAMIENTO',
      descripcion: nombreHotel,
      detalles: detallesHotel
    });
  }

  // 3. TRASLADOS
  if (calculation.traslados && calculation.traslados.costo_total > 0) {
    const trasladoIda = calculation.traslados.aeropuerto_hotel_ida;
    const trasladoVuelta = calculation.traslados.hotel_aeropuerto_vuelta;
    
    let descripcionTraslados = '';
    const detallesTraslados = [];
    
    // Verificar si hay traslados incluidos
    const tieneIda = trasladoIda?.incluido;
    const tieneVuelta = trasladoVuelta?.incluido;
    
    if (tieneIda && tieneVuelta) {
      descripcionTraslados = 'Traslados aeropuerto ↔ hotel (ida y vuelta)';
      detallesTraslados.push('✓ Traslado de llegada: Aeropuerto → Hotel');
      detallesTraslados.push('✓ Traslado de salida: Hotel → Aeropuerto');
    } else if (tieneIda && !tieneVuelta) {
      descripcionTraslados = 'Traslado aeropuerto → hotel (solo ida)';
      detallesTraslados.push('✓ Traslado de llegada: Aeropuerto → Hotel');
      detallesTraslados.push('✗ Traslado de salida: NO incluido');
    } else if (!tieneIda && tieneVuelta) {
      descripcionTraslados = 'Traslado hotel → aeropuerto (solo vuelta)';
      detallesTraslados.push('✗ Traslado de llegada: NO incluido');
      detallesTraslados.push('✓ Traslado de salida: Hotel → Aeropuerto');
    } else {
      descripcionTraslados = 'Traslados terrestres';
      detallesTraslados.push('Servicios de transporte terrestre según cotización');
    }
    
    // Agregar información del proveedor si está disponible
    if (trasladoIda?.proveedor || trasladoVuelta?.proveedor) {
      const proveedor = trasladoIda?.proveedor || trasladoVuelta?.proveedor;
      detallesTraslados.push(`Proveedor: ${proveedor}`);
    }
    
    // Agregar tipo de vehículo si está disponible
    if (trasladoIda?.tipo_vehiculo || trasladoVuelta?.tipo_vehiculo) {
      const tipoVehiculo = trasladoIda?.tipo_vehiculo || trasladoVuelta?.tipo_vehiculo;
      detallesTraslados.push(`Tipo de vehículo: ${tipoVehiculo}`);
    }

    inclusiones.push({
      titulo: 'TRASLADOS',
      descripcion: descripcionTraslados,
      detalles: detallesTraslados
    });
  }

  // 4. ALIMENTACIÓN
  if (calculation.alimentacion && calculation.alimentacion.costo_total > 0) {
    const tipoAlimentacion = calculation.alimentacion.tipo || quote.alimentacion;
    const detallesAlimentacion = [];
    
    if (tipoAlimentacion === 'todo_incluido') {
      detallesAlimentacion.push('Desayuno, almuerzo y cena');
      detallesAlimentacion.push('Bebidas alcohólicas y no alcohólicas');
      detallesAlimentacion.push('Snacks durante el día');
    } else if (tipoAlimentacion === 'pension_completa') {
      detallesAlimentacion.push('Desayuno buffet');
      detallesAlimentacion.push('Almuerzo y cena');
      detallesAlimentacion.push('Bebidas no incluidas');
    } else if (tipoAlimentacion === 'media_pension' || tipoAlimentacion === 'desayuno_cena') {
      detallesAlimentacion.push('Desayuno buffet');
      detallesAlimentacion.push('Cena');
    } else if (tipoAlimentacion === 'desayuno') {
      detallesAlimentacion.push('Desayuno buffet');
    }

    inclusiones.push({
      titulo: 'ALIMENTACIÓN',
      descripcion: getAlimentacionLabel(tipoAlimentacion),
      detalles: detallesAlimentacion
    });
  }

  // 5. EQUIPAJE ADICIONAL
  if (calculation.equipaje && calculation.equipaje.bodega?.incluido) {
    inclusiones.push({
      titulo: 'EQUIPAJE',
      descripcion: 'Equipaje de bodega incluido',
      detalles: [
        'Maleta de 23kg en bodega',
        'Equipaje de cabina (morral)',
        'Sin costo adicional'
      ]
    });
  } else if (calculation.equipaje && calculation.equipaje.bodega?.costo > 0) {
    inclusiones.push({
      titulo: 'EQUIPAJE',
      descripcion: 'Equipaje de bodega disponible',
      detalles: [
        'Maleta de 23kg disponible',
        `Costo adicional: ${formatPrice(calculation.equipaje.bodega.costo)} por persona`,
        'Equipaje de cabina incluido'
      ]
    });
  }

  // 6. ASISTENCIA MÉDICA
  if (calculation.seguros && calculation.seguros.asistencia_medica && calculation.seguros.asistencia_medica.costo > 0) {
    const tipoAsistencia = calculation.seguros.asistencia_medica.tipo || 'básica';
    const detallesAsistencia = [
      'Cobertura médica durante el viaje',
      'Atención médica de emergencia',
      'Repatriación sanitaria'
    ];
    
    if (tipoAsistencia.toLowerCase().includes('completa')) {
      detallesAsistencia.push('Cobertura ampliada');
      detallesAsistencia.push('Medicamentos básicos');
    }

    inclusiones.push({
      titulo: 'ASISTENCIA MÉDICA',
      descripcion: `Asistencia médica ${tipoAsistencia}`,
      detalles: detallesAsistencia
    });
  }

  // 7. TOURS Y EXCURSIONES
 if (calculation.excursiones && calculation.excursiones.length > 0) {
  console.log("🔍 DEBUG EXCURSIONES EN PDF:", {
    excursiones_existe: !!calculation.excursiones,
    es_array: Array.isArray(calculation.excursiones),
    longitud: calculation.excursiones.length,
    primer_elemento: calculation.excursiones[0]
  });

  const excursionesIncluidas = calculation.excursiones.filter(exc => exc.obligatoria);
  const excursionesOpcionales = calculation.excursiones.filter(exc => !exc.obligatoria);
  
  console.log("🔍 DEBUG FILTROS:", {
    incluidas: excursionesIncluidas.length,
    opcionales: excursionesOpcionales.length
  });

  let descripcionTours = '';
  const detallesTours = [];
  
  // Procesar excursiones incluidas
  if (excursionesIncluidas.length > 0) {
    descripcionTours = `${excursionesIncluidas.length} tour${excursionesIncluidas.length > 1 ? 's' : ''} incluido${excursionesIncluidas.length > 1 ? 's' : ''}`;
    
    excursionesIncluidas.forEach(exc => {
      let detalleExcursion = `• ${exc.nombre}`;
      
      if (exc.descripcion && exc.descripcion.trim()) {
        detalleExcursion += ` - ${exc.descripcion}`;
      }
      
      if (exc.duracion && exc.duracion.trim()) {
        detalleExcursion += ` (${exc.duracion})`;
      }
      
      detallesTours.push(detalleExcursion);
      
      if (exc.proveedor && exc.proveedor.trim()) {
        detallesTours.push(`  Operador: ${exc.proveedor}`);
      }
      
      if (exc.costo == 0 || exc.costo === '0') {
        detallesTours.push(`  ✓ Incluido sin costo adicional`);
      }
    });
  }
  
  // Procesar excursiones opcionales
  if (excursionesOpcionales.length > 0) {
    if (descripcionTours) {
      descripcionTours += ` + ${excursionesOpcionales.length} opcional${excursionesOpcionales.length > 1 ? 'es' : ''}`;
    } else {
      descripcionTours = `${excursionesOpcionales.length} tour${excursionesOpcionales.length > 1 ? 's' : ''} opcional${excursionesOpcionales.length > 1 ? 'es' : ''}`;
    }
    
    if (excursionesIncluidas.length > 0) {
      detallesTours.push(''); // Línea separadora
      detallesTours.push('TOURS OPCIONALES:');
    }
    
    excursionesOpcionales.forEach(exc => {
      let detalleExcursion = `• ${exc.nombre}`;
      
      if (exc.descripcion && exc.descripcion.trim()) {
        detalleExcursion += ` - ${exc.descripcion}`;
      }
      
      if (exc.duracion && exc.duracion.trim()) {
        detalleExcursion += ` (${exc.duracion})`;
      }
      
      detallesTours.push(detalleExcursion);
      
      if (exc.proveedor && exc.proveedor.trim()) {
        detallesTours.push(`  Operador: ${exc.proveedor}`);
      }
    });
  }

  console.log("🔍 DEBUG RESULTADO FINAL:", {
    descripcionTours,
    detallesTours,
    va_a_agregar_inclusion: detallesTours.length > 0
  });

  // ✅ SOLO AGREGAR SI HAY CONTENIDO
  if (detallesTours.length > 0) {
    inclusiones.push({
      titulo: 'TOURS Y EXCURSIONES',
      descripcion: descripcionTours,
      detalles: detallesTours
    });
  }
}

  // 8. SERVICIOS ADICIONALES
  if (calculation.extras && calculation.extras.length > 0) {
    const detallesExtras = calculation.extras.map(extra => `• ${extra.nombre}`);
    
    inclusiones.push({
      titulo: 'SERVICIOS ADICIONALES',
      descripcion: `${calculation.extras.length} servicio${calculation.extras.length > 1 ? 's' : ''} extra`,
      detalles: detallesExtras
    });
  }

  return inclusiones;
}

// Función para generar observaciones adicionales
function generateObservations(quote, calculation) {
  const observaciones = [];
  
  // Agregar detalles de atención especial si existen
  if (quote.detalles_atencion_especial && quote.detalles_atencion_especial.trim()) {
    observaciones.push({
      tipo: 'ATENCIÓN ESPECIAL',
      contenido: quote.detalles_atencion_especial
    });
  }
  
  // Observaciones generales del cálculo
  if (calculation.observaciones && calculation.observaciones.trim()) {
    observaciones.push({
      tipo: 'INFORMACIÓN IMPORTANTE',
      contenido: calculation.observaciones
    });
  }
  
  // Observaciones específicas según servicios
  if (calculation.seguros && calculation.seguros.length > 0) {
    const segurosInfo = calculation.seguros
      .filter(seguro => seguro.informacion_adicional && seguro.informacion_adicional.trim())
      .map(seguro => seguro.informacion_adicional);
    
    if (segurosInfo.length > 0) {
      observaciones.push({
        tipo: 'INFORMACIÓN DE SEGUROS',
        contenido: segurosInfo.join(' • ')
      });
    }
  }
  
  return observaciones;
}

// ✅ Calcular noches y días de viaje
const { formatForPDF } = require("../utils/dateUtils");


function calcularNoches(fechaIda, fechaRegreso) {
  if (!fechaIda || !fechaRegreso) return null;
  const ida = new Date(fechaIda);
  const regreso = new Date(fechaRegreso);
  const diferencia = regreso.getTime() - ida.getTime();
  const noches = Math.max(1, Math.ceil(diferencia / (1000 * 3600 * 24)));
  return noches;
}

// ✅ Función auxiliar para obtener datos de cálculo desde el quote
// ✅ Función auxiliar para obtener datos de cálculo desde el quote
function getCalculationData(quote) {
  console.log("🔍 DEBUG getCalculationData:", {
    tiene_calculation: !!quote.calculation,
    calculation_type: typeof quote.calculation,
    excursiones_en_quote: quote.calculation ? !!quote.calculation.excursiones : 'NO_CALCULATION'
  });

  if (quote.calculation) {
    console.log("🔍 DEBUG calculation.excursiones:", {
      existe: !!quote.calculation.excursiones,
      tipo: typeof quote.calculation.excursiones,
      es_array: Array.isArray(quote.calculation.excursiones),
      longitud: quote.calculation.excursiones?.length
    });
    return quote.calculation;
  }
  
  return {
    tiquetes: quote.tiquetes || {},
    traslados: quote.traslados || {},
    hotel: quote.hotel || {},
    alimentacion: quote.alimentacion || {},
    equipaje: quote.equipaje || {},
    seguros: quote.seguros || {},
    extras: quote.extras || [],
    excursiones: quote.excursiones || [], // ✅ Asegurar que esté como array
    asistencia_medica: quote.seguros?.asistencia_medica || {}
  };
}

// ✅ Formatear precios
function formatPrice(price) {
  if (!price || price === 0) return '$0';
  return `$${Number(price).toLocaleString('es-CO')}`;
}

// ✅ Obtener etiqueta de alimentación
function getAlimentacionLabel(tipo) {
  const tipos = {
    'ninguna': 'Sin alimentación',
    'desayuno': 'Desayuno incluido',
    'media_pension': 'Desayuno y cena incluidos',
    'pension_completa': 'Desayuno, almuerzo y cena incluidos',
    'todo_incluido': 'Todo incluido (desayuno, almuerzo, cena + bebidas y licores + snacks)',
    'desayuno_cena': 'Desayuno y cena incluidos',
    'desayuno_almuerzo_cena': 'Desayuno, almuerzo y cena incluidos'
  };
  return tipos[tipo] || tipo || 'Por confirmar';
}

// ✅ Función para agregar espacio seguro
function addSafeSpace(doc, space = 15) {
  doc.y += space;
  return doc.y;
}

// ✅ Función para verificar espacio en página
function checkSafePageSpace(doc, requiredSpace = 50) {
  const pageHeight = doc.page.height;
  const margin = 25;
  if (doc.y + requiredSpace > pageHeight - margin - 50) {
    doc.addPage();
    doc.y = margin + 20;
    return true;
  }
  return false;
}

// ✅ Obtener etiqueta de acomodación
function getAcomodacionLabel(acomodacion) {
  const acomodaciones = {
    'sencilla': 'Habitación sencilla',
    'doble': 'Habitación doble',
    'triple': 'Habitación triple',
    'cuadruple': 'Habitación cuádruple'
  };
  return acomodaciones[acomodacion] || acomodacion || 'Por confirmar';
}

// ✅ Obtener etiqueta de tipo de hotel
function getTipoHotelLabel(tipo) {
  const tipos = {
    'basico': 'Hotel básico',
    'superior': 'Hotel superior'
  };
  return tipos[tipo] || tipo || 'Por confirmar';
}

// ✅ Generar desglose detallado profesional
function generateBudgetBreakdown(quote) {
  try {
    console.log("🔍 Iniciando generateBudgetBreakdown profesional...");
    const calculation = getCalculationData(quote);
    console.log("✅ getCalculationData completado");
    
    // Calcular personas que pagan (adultos + menores, no incluir infantes)
    const adultos = quote.adultos || 0;
    const menores = quote.menores || 0;
    const infantes = quote.infantes || 0;
    const personas_que_pagan = adultos + menores;
    
    console.log(`👥 Pasajeros: ${adultos} adultos, ${menores} menores (2-14 años), ${infantes} infantes (0-2 años)`);
    console.log(`💰 Personas que pagan: ${personas_que_pagan} (adultos + menores)`);
    
    let breakdown = [];
    
    // 1. TIQUETES AÉREOS (sin iconos problemáticos)
    console.log("🔍 Procesando tiquetes aéreos...");
    if (calculation.tiquetes && calculation.tiquetes.costo_total > 0) {

      const tipoTiquete = calculation.tiquetes.tipo || 'ida_vuelta';
      let descripcionTiquete = '';
      
      if (tipoTiquete === 'ida_vuelta') {
        descripcionTiquete = 'Tiquetes aéreos ida y vuelta';
      } else if (tipoTiquete === 'ida') {
        descripcionTiquete = 'Tiquetes aéreos solo ida';
      } else {
        descripcionTiquete = 'Tiquetes aéreos';
      }
      
      const detallesTiquete = [
        `Ruta: ${calculation.tiquetes.origen || quote.origen || 'Colombia'} -> ${calculation.tiquetes.destino || quote.destino}`,
        `Tipo: ${tipoTiquete === 'ida_vuelta' ? 'Ida y vuelta' : tipoTiquete === 'ida' ? 'Solo ida' : 'Por confirmar'}`,
        `Aerolínea: ${calculation.tiquetes.proveedor || 'Por confirmar'}`,
        `Fecha salida: ${calculation.tiquetes.fecha_ida ? new Date(calculation.tiquetes.fecha_ida + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : quote.fecha_ida ? new Date(quote.fecha_ida + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Por confirmar'}`,
      ];
      
      if (tipoTiquete === 'ida_vuelta') {
        detallesTiquete.push(`Fecha regreso: ${calculation.tiquetes.fecha_vuelta ? new Date(calculation.tiquetes.fecha_vuelta + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : quote.fecha_regreso ? new Date(quote.fecha_regreso + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Por confirmar'}`);
      }
      
      // Agregar información de equipaje incluido
      if (calculation.equipaje?.cabina?.incluido) {
        detallesTiquete.push('Incluye: Equipaje de cabina (maleta pequeña tipo morral 40x35x25 cm)');
      }
      
      breakdown.push({
        category: 'TRANSPORTE AEREO',
        items: [{
          description: descripcionTiquete,
          details: detallesTiquete,

          totalPerPerson: calculation.tiquetes.costo_total,
          totalGeneral: calculation.tiquetes.costo_total * personas_que_pagan
        }]
      });
    }
    
    // 2. TRASLADOS TERRESTRES (sin iconos)
    console.log("🔍 Procesando traslados terrestres...");
    if (calculation.traslados && calculation.traslados.costo_total > 0) {
      const trasladosItems = [];
      
      // Verificar traslados específicos
      const trasladoIda = calculation.traslados.aeropuerto_hotel_ida;
      const trasladoVuelta = calculation.traslados.hotel_aeropuerto_vuelta;
      
      if (trasladoIda?.incluido || trasladoVuelta?.incluido || calculation.traslados.costo_total > 0) {
        let descripcionTraslados = '';
        const detallesTraslados = [];
        
        if (trasladoIda?.incluido && trasladoVuelta?.incluido) {
          descripcionTraslados = 'Traslados aeropuerto <-> hotel (ida y vuelta)';
          detallesTraslados.push('- Traslado aeropuerto -> hotel (llegada)');
          detallesTraslados.push('- Traslado hotel -> aeropuerto (salida)');
        } else if (trasladoIda?.incluido) {
          descripcionTraslados = 'Traslado aeropuerto -> hotel';
          detallesTraslados.push('- Solo traslado de llegada incluido');
        } else if (trasladoVuelta?.incluido) {
          descripcionTraslados = 'Traslado hotel -> aeropuerto';
          detallesTraslados.push('- Solo traslado de salida incluido');
        } else {
          descripcionTraslados = 'Traslados terrestres';
          detallesTraslados.push('- Servicios de transporte terrestre');
        }
        
        // Agregar información del proveedor si está disponible
        if (trasladoIda?.proveedor || trasladoVuelta?.proveedor) {
          const proveedor = trasladoIda?.proveedor || trasladoVuelta?.proveedor;
          detallesTraslados.push(`Proveedor: ${proveedor}`);
        }
        
        // Agregar otros traslados si existen
        if (calculation.traslados.otros && calculation.traslados.otros.length > 0) {
          calculation.traslados.otros.forEach(otro => {
            detallesTraslados.push(`- ${otro.descripcion || 'Traslado adicional'}`);
          });
        }
        
        trasladosItems.push({
          description: descripcionTraslados,
          details: detallesTraslados,
          totalPerPerson: calculation.traslados.costo_total,
          totalGeneral: calculation.traslados.costo_total * personas_que_pagan
        });
      }
      
      if (trasladosItems.length > 0) {
        breakdown.push({
          category: 'TRASLADOS TERRESTRES',
          items: trasladosItems
        });
      }
    }
    
    // 3. ALOJAMIENTO (sin iconos)
    console.log("🔍 Procesando alojamiento...");
    if (calculation.hotel && calculation.hotel.costo_total > 0) {
      const noches = calculation.hotel.noches || calcularNoches(quote.fecha_ida, quote.fecha_regreso);
      const dias = noches ? noches + 1 : null;
      
      const detallesHotel = [];
      
      // Información básica del hotel
      if (calculation.hotel.nombre) {
        detallesHotel.push(`Hotel: ${calculation.hotel.nombre}`);
      }
      
      // Categoría del hotel
      const categoria = calculation.hotel.categoria || quote.tipo_hotel;
      if (categoria) {
        detallesHotel.push(`Categoria: ${getTipoHotelLabel(categoria)}`);
      }
      
      // Acomodación
      const acomodacion = calculation.hotel.acomodacion || quote.acomodacion;
      if (acomodacion) {
        detallesHotel.push(`Habitacion: ${getAcomodacionLabel(acomodacion)}`);
      }
      
      // Duración
      if (noches && dias) {
        detallesHotel.push(`Duracion: ${noches} noche${noches > 1 ? 's' : ''} / ${dias} dia${dias > 1 ? 's' : ''}`);
      }
      
      // Ubicación
      if (calculation.hotel.ubicacion) {
        detallesHotel.push(`Ubicacion: ${calculation.hotel.ubicacion}`);
      }
      
      // Costo por noche si está disponible
      if (calculation.hotel.costo_noche > 0) {
        detallesHotel.push(`Costo por noche: ${formatPrice(calculation.hotel.costo_noche)}`);
      }
      
      // Proveedor
      if (calculation.hotel.proveedor) {
        detallesHotel.push(`Proveedor: ${calculation.hotel.proveedor}`);
      }
      
      // Observaciones adicionales
      if (calculation.hotel.observaciones) {
        detallesHotel.push(`Observaciones: ${calculation.hotel.observaciones}`);
      }
      
      breakdown.push({
        category: 'ALOJAMIENTO',
        items: [{
          description: `Hospedaje en ${calculation.hotel.nombre || quote.destino}`,
          details: detallesHotel,
          totalPerPerson: calculation.hotel.costo_total,
          totalGeneral: calculation.hotel.costo_total * personas_que_pagan
        }]
      });
    }
    
    // 4. ALIMENTACIÓN (sin iconos)
    console.log("🔍 Procesando alimentación...");
    if (calculation.alimentacion && calculation.alimentacion.costo_total > 0) {
      const tipoAlimentacion = calculation.alimentacion.tipo || quote.alimentacion;
      const detallesAlimentacion = [];
      
      // Descripción del plan de alimentación
      detallesAlimentacion.push(`Plan: ${getAlimentacionLabel(tipoAlimentacion)}`);
      
      // Detalles específicos según el tipo
      if (tipoAlimentacion === 'todo_incluido') {
        detallesAlimentacion.push('Incluye: Desayuno, almuerzo y cena');
        detallesAlimentacion.push('Incluye: Bebidas alcoholicas y no alcoholicas');
        detallesAlimentacion.push('Incluye: Snacks durante el dia');
        detallesAlimentacion.push('Incluye: Licores nacionales');
      } else if (tipoAlimentacion === 'pension_completa') {
        detallesAlimentacion.push('Incluye: Desayuno buffet');
        detallesAlimentacion.push('Incluye: Almuerzo');
        detallesAlimentacion.push('Incluye: Cena');
        detallesAlimentacion.push('No incluye: Bebidas');
      } else if (tipoAlimentacion === 'media_pension' || tipoAlimentacion === 'desayuno_cena') {
        detallesAlimentacion.push('Incluye: Desayuno buffet');
        detallesAlimentacion.push('Incluye: Cena');
        detallesAlimentacion.push('No incluye: Almuerzo');
        detallesAlimentacion.push('No incluye: Bebidas');
      } else if (tipoAlimentacion === 'desayuno') {
        detallesAlimentacion.push('Incluye: Desayuno buffet');
        detallesAlimentacion.push('No incluye: Almuerzo y cena');
      }
      
      // Proveedor
      if (calculation.alimentacion.proveedor) {
        detallesAlimentacion.push(`Servido por: ${calculation.alimentacion.proveedor}`);
      } else {
        detallesAlimentacion.push('Servido por: Hotel');
      }
      
      // Observaciones adicionales
      if (calculation.alimentacion.observaciones) {
        detallesAlimentacion.push(`Observaciones: ${calculation.alimentacion.observaciones}`);
      }
      
      breakdown.push({
        category: 'ALIMENTACION',
        items: [{
          description: `Plan de alimentacion - ${getAlimentacionLabel(tipoAlimentacion)}`,
          details: detallesAlimentacion,
          totalPerPerson: calculation.alimentacion.costo_total,
          totalGeneral: calculation.alimentacion.costo_total * personas_que_pagan
        }]
      });
    }
    
    // 5. EQUIPAJE (sin iconos)
    console.log("🔍 Procesando equipaje...");
    if (calculation.equipaje && (calculation.equipaje.costo_total > 0 || calculation.equipaje.cabina?.incluido)) {
      const equipajeItems = [];
      const detallesEquipaje = [];
      
      // Equipaje de cabina
      if (calculation.equipaje.cabina?.incluido) {
        detallesEquipaje.push('Incluido: Equipaje de cabina');
        detallesEquipaje.push('   Dimensiones: 40x35x25 cm (tipo morral)');
        detallesEquipaje.push('   Peso maximo: 10 kg');
      }
      
      // Equipaje de bodega
      if (calculation.equipaje.bodega?.incluido) {
        detallesEquipaje.push('Incluido: Equipaje de bodega');
        if (calculation.equipaje.bodega.costo > 0) {
          detallesEquipaje.push(`   Costo: ${formatPrice(calculation.equipaje.bodega.costo)} por persona`);
        }
      } else if (calculation.equipaje.bodega?.costo > 0) {
        detallesEquipaje.push('Disponible: Equipaje de bodega');
        detallesEquipaje.push(`   Costo adicional: ${formatPrice(calculation.equipaje.bodega.costo)} por persona`);
        detallesEquipaje.push('   Peso maximo: 23 kg');
      } else {
        detallesEquipaje.push('No incluido: Equipaje de bodega');
        detallesEquipaje.push('   Disponible con costo adicional');
      }
      
      // Equipaje extra
      if (calculation.equipaje.equipaje_extra?.incluido) {
        detallesEquipaje.push('Incluido: Equipaje adicional');
        if (calculation.equipaje.equipaje_extra.costo > 0) {
          detallesEquipaje.push(`   Valor: ${formatPrice(calculation.equipaje.equipaje_extra.costo)}`);
        }
      } else if (calculation.equipaje.equipaje_extra?.costo > 0) {
        detallesEquipaje.push('Disponible: Equipaje adicional');
        detallesEquipaje.push(`   Costo: ${formatPrice(calculation.equipaje.equipaje_extra.costo)} por persona`);
      }
      
      // Solo agregar si hay contenido
      if (detallesEquipaje.length > 0) {
        breakdown.push({
          category: 'EQUIPAJE',
          items: [{
            description: 'Servicios de equipaje',
            details: detallesEquipaje,
            totalPerPerson: calculation.equipaje.costo_total || 0,
            totalGeneral: (calculation.equipaje.costo_total || 0) * personas_que_pagan
          }]
        });
      }
    }
    
    // 6. ASISTENCIA MÉDICA (sin iconos)
    console.log("🔍 Procesando asistencia médica...");
    if (calculation.seguros && calculation.seguros.asistencia_medica && calculation.seguros.asistencia_medica.costo > 0) {
      const detallesAsistencia = [];
      
      // Tipo de asistencia
      const tipoAsistencia = calculation.seguros.asistencia_medica.tipo;
      if (tipoAsistencia) {
        detallesAsistencia.push(`Tipo: ${tipoAsistencia}`);
      }
      
      // Proveedor
      if (calculation.seguros.asistencia_medica.proveedor) {
        detallesAsistencia.push(`Proveedor: ${calculation.seguros.asistencia_medica.proveedor}`);
      }
      
      // Cobertura básica
      detallesAsistencia.push('Incluye: Cobertura medica durante el viaje');
      detallesAsistencia.push('Incluye: Atencion medica de emergencia');
      detallesAsistencia.push('Incluye: Medicamentos basicos');
      detallesAsistencia.push('Incluye: Repatriacion en caso necesario');
      detallesAsistencia.push('Disponible: Linea de atencion 24/7');
      
      breakdown.push({
        category: 'ASISTENCIA MEDICA',
        items: [{
          description: 'Asistencia medica de viaje',
          details: detallesAsistencia,
          totalPerPerson: calculation.seguros.asistencia_medica.costo,
          totalGeneral: calculation.seguros.asistencia_medica.costo * personas_que_pagan
        }]
      });
    }
    
    // 7. EXCURSIONES Y TOURS (sin iconos)
    console.log("🔍 Procesando excursiones y tours...");
    if (calculation.excursiones && calculation.excursiones.length > 0) {
      const excursionesItems = calculation.excursiones.map(excursion => {
        const detallesExcursion = [];
        
        if (excursion.descripcion) {
          detallesExcursion.push(`Descripcion: ${excursion.descripcion}`);
        }
        
        if (excursion.duracion) {
          detallesExcursion.push(`Duracion: ${excursion.duracion}`);
        }
        
        if (excursion.proveedor) {
          detallesExcursion.push(`Operador: ${excursion.proveedor}`);
        }
        
        if (excursion.obligatoria) {
          detallesExcursion.push('Estado: Incluida en el paquete');
        } else {
          detallesExcursion.push('Estado: Opcional - con costo adicional');
        }
        
        return {
          description: `${excursion.nombre || 'Excursion'}`,
          details: detallesExcursion,
          totalPerPerson: excursion.costo || 0,
          totalGeneral: (excursion.costo || 0) * personas_que_pagan
        };
      });
      
      breakdown.push({
        category: 'EXCURSIONES Y TOURS',
        items: excursionesItems
      });
    }
    
    // 8. SERVICIOS ADICIONALES (sin iconos)
    console.log("🔍 Procesando servicios adicionales...");
    if (calculation.extras && calculation.extras.length > 0) {
      const extrasItems = calculation.extras.map(extra => {
        const detallesExtra = [];
        
        if (extra.descripcion) {
          detallesExtra.push(`Descripcion: ${extra.descripcion}`);
        }
        
        if (extra.proveedor) {
          detallesExtra.push(`Proveedor: ${extra.proveedor}`);
        }
        
        // Determinar tipo de servicio
        let tipoServicio = 'Servicio adicional';
        if (extra.tipo === 'servicio_extra') {
          tipoServicio = 'Servicio extra';
          detallesExtra.push('Costo: Unico para todo el grupo');
        } else if (extra.tipo === 'excursion') {
          tipoServicio = 'Excursion';
          detallesExtra.push('Costo: Por persona');
        } else if (extra.tipo === 'actividad_basica') {
          tipoServicio = 'Actividad incluida';
          detallesExtra.push('Costo: Sin costo adicional');
        }
        
        detallesExtra.unshift(`Tipo: ${tipoServicio}`);
        
        return {
          description: `${extra.nombre || 'Servicio adicional'}`,
          details: detallesExtra,
          totalPerPerson: extra.tipo === 'servicio_extra' ? extra.costo / personas_que_pagan : extra.costo,
          totalGeneral: extra.costo,
          isServiceExtra: extra.tipo === 'servicio_extra'
        };
      });
      
      breakdown.push({
        category: 'SERVICIOS ADICIONALES',
        items: extrasItems
      });
    }
    
    console.log("✅ generateBudgetBreakdown profesional completado exitosamente");
    return breakdown;
    
  } catch (error) {
    console.error("❌ Error en generateBudgetBreakdown:", error);
    // Retornar breakdown básico en caso de error
    const personas_que_pagan = (quote.adultos || 0) + (quote.menores || 0);
    return [{
      category: 'PRECIO TOTAL',
      items: [{
        description: 'Paquete completo de viaje',
        details: ['Todos los servicios incluidos segun cotizacion'],
        totalPerPerson: quote.precio_por_persona || quote.precio_total / personas_que_pagan,
        totalGeneral: quote.precio_total || 0
      }]
    }];
  }
}

// 🎨 Colores corporativos
const COLORS = {
  MoradoSuave: "#dc86c7",
  moradito: "#cdb2d5", 
  botonPopup: "#573b58",
  fondoPopup: "#421261",
  ColorMorado: "#b85aa1",
  ColorAzul: "#2be0e9",
  ColorAzul2: "#5475A8",
  textoOscuro: "#1f2937",
  textoGris: "#374151",
};

// ✅ Asegurar carpeta
const ensurePDFDirectory = () => {
  const pdfDir = path.join(__dirname, '../../uploads/pdfs');
  if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
  return pdfDir;
};


// ✅ Generar PDF
const generateQuotePDF = async (quote, saveToFile = true) => {
  console.log("🔍 Iniciando generateQuotePDF:", { saveToFile, quoteId: quote.id });
  
  // Declarar variables fuera del try block para evitar problemas de scope
  let doc, yPosition, pageWidth, pageHeight, margin, contentWidth;
  let filepath;
  let bufferChunks = [];
  
  try {
    doc = new PDFDocument({ margin: 25, size: 'A4' });
    yPosition = 20;
    pageWidth = doc.page.width;
    pageHeight = doc.page.height;
    margin = 25;
    contentWidth = pageWidth - 2 * margin;

    if (saveToFile) {
     const pdfDir = ensurePDFDirectory();
     const filename = `cotizacion-${quote.quote_number || quote.id}.pdf`;
     filepath = path.join(pdfDir, filename);
     const stream = fs.createWriteStream(filepath);
     doc.pipe(stream);
    } else {
     // ✅ FIX: Para vista previa, capturar el buffer
     doc.on('data', chunk => bufferChunks.push(chunk));
     doc.on('end', () => {
      console.log("✅ PDF buffer generado, chunks:", bufferChunks.length);
     });
    }

    console.log("🔍 Configuración PDF completada, iniciando contenido...");
  } catch (error) {
    console.error("❌ Error en inicialización de generateQuotePDF:", error);
    throw error;
  }

  // Funciones utilitarias
  const checkPageSpace = (requiredSpace) => {
   if (yPosition + requiredSpace > pageHeight - 80) {
    doc.addPage();
    yPosition = margin + 20;
    return true;
   }
   return false;
  };
  const addSpace = (space = 14) => yPosition += space;


  // Header mejorado: logo y datos empresa a la izquierda, número de cotización a la derecha
  doc.rect(0, 0, pageWidth, 70).fillColor(COLORS.ColorAzul2).fill();

  // Logo a la izquierda (intenta varios archivos y muestra error si falla)
  let logoBottom = 6;
  const logoCandidates = [
    path.join(__dirname, '../assets/logoNuevo.png'), // tu logo adjunto
    path.join(__dirname, '../assets/NuevoLogo.png'),    // otro logo
    path.join(__dirname, '../assets/logo2.png')         // logo anterior
  ];
  let logoLoaded = false;
  for (const logoPath of logoCandidates) {
    try {
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, margin, 10, { width: 52, height: 52 });
        logoBottom = 6 + 52;
        logoLoaded = true;
        break;
      }
    } catch (error) {
      console.log(`⚠️ No se pudo cargar el logo (${logoPath}):`, error.message);
    }
  }
  if (!logoLoaded) {
    doc.fontSize(8).fillColor('white').text('Logo no disponible', margin, 20);
    console.log('⚠️ Ningún logo pudo ser cargado.');
  }

  // Datos empresa debajo del logo, alineados a la izquierda
  let companyInfoY = 10;
  if (logoBottom > 40) companyInfoY = logoBottom + 2;
  else companyInfoY = 10;
  doc.fontSize(13)
     .fillColor('white')
     .font('Helvetica-Bold')
     .text('VIAJA YA', margin + 55, 14)
     .fontSize(8)
     .font('Helvetica')
     .text('Hacemos realidad tus sueños de viaje', margin + 55, 28)
     .text('info@viajaya.com | +57 300 123 4567', margin + 55, 40)
     .text('Bogotá, Colombia', margin + 55, 52);

  // Cotización número arriba a la derecha
  doc.fontSize(12).fillColor('white').font('Helvetica-Bold')
    .text(`Cotización: ${quote.quote_number || quote.id}`, pageWidth - 180, 15, { width: 150, align: 'right' });

  yPosition = 80;

  // Destino principal
  doc.rect(margin, yPosition, contentWidth, 32).fillColor(COLORS.MoradoSuave).fill();
  doc.fontSize(18).fillColor('white').font('Helvetica-Bold')
    .text(`VIAJE A ${quote.destino.toUpperCase()}`, margin + 10, yPosition + 8, { align: 'center', width: contentWidth - 20 });
  yPosition += 42;


  // Información cliente
  checkPageSpace(60);
  doc.rect(margin, yPosition, contentWidth, 16).fillColor(COLORS.botonPopup).fill();
  doc.fontSize(10).fillColor('white').font('Helvetica-Bold')
     .text('INFORMACIÓN DEL CLIENTE:', margin + 8, yPosition + 4);
  yPosition += 20;

  const clienteInfo = [
    { label: 'Cliente', value: quote.nombre_cliente || 'No especificado' },
    { label: 'Email', value: quote.email_cliente || 'No especificado' },
    { label: 'Teléfono', value: quote.telefono_cliente || 'No especificado' },
    { label: 'Destino', value: `${quote.origen || 'Colombia'} → ${quote.destino}` }
  ];
  clienteInfo.forEach(info => {
    doc.fontSize(8).fillColor(COLORS.textoOscuro).font('Helvetica-Bold')
       .text(`${info.label}:`, margin + 6, yPosition, { width: 90 })
       .fillColor(COLORS.textoGris).font('Helvetica')
       .text(info.value, margin + 100, yPosition, { width: contentWidth - 106 });
    addSpace(16);
  });

  // Espacio antes del resumen del viaje
  addSpace(10);


  // Bloque RESUMEN DEL VIAJE (limpio, sin iconos)
  checkPageSpace(150);
  doc.rect(margin, yPosition, contentWidth, 18).fillColor(COLORS.fondoPopup).fill();
  doc.fontSize(10).fillColor('white').font('Helvetica-Bold')
     .text('RESUMEN DETALLADO DEL VIAJE', margin + 8, yPosition + 5);
  yPosition += 25;


  // Datos principales del viaje con cálculos precisos
  const fechaIda = quote.fecha_ida ? new Date(quote.fecha_ida + 'T12:00:00').toLocaleDateString('es-CO', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  }) : null;
  const fechaRegreso = quote.fecha_regreso ? new Date(quote.fecha_regreso + 'T12:00:00').toLocaleDateString('es-CO', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  }) : null;
 

  const noches = calcularNoches(quote.fecha_ida, quote.fecha_regreso);
  const dias = noches ? noches + 1 : null;
  
  // Información de pasajeros detallada
  const adultos = quote.adultos || 0;
  const menores = quote.menores || 0;
  const infantes = quote.infantes || 0;
  const totalPasajeros = adultos + menores + infantes;
  
  let detallesPasajeros = [];
  if (adultos > 0) detallesPasajeros.push(`${adultos} adulto${adultos > 1 ? 's' : ''} (14+ años)`);
  if (menores > 0) {
    detallesPasajeros.push(`${menores} menor${menores > 1 ? 'es' : ''} (2-14 años)`);
    if (quote.edades_menores && quote.edades_menores.length > 0) {
      detallesPasajeros.push(`Edades: ${quote.edades_menores.join(', ')} años`);
    }
  }
  if (infantes > 0) {
    detallesPasajeros.push(`${infantes} infante${infantes > 1 ? 's' : ''} (0-2 años - no pagan)`);
    if (quote.edades_infantes && quote.edades_infantes.length > 0) {
      detallesPasajeros.push(`Edades: ${quote.edades_infantes.join(', ')} meses`);
    }
  }
  
  // Obtener datos de cálculo para información detallada
  const calculation = getCalculationData(quote);

  // Construir el resumen profesional (sin iconos)
  const resumenViaje = [
    { 
      label: 'Destino', 
      value: `${quote.destino}${noches && dias ? ` (${noches} noche${noches > 1 ? 's' : ''} / ${dias} dia${dias > 1 ? 's' : ''})` : ''}`,
      highlight: true 
    },
    { label: 'Origen', value: quote.origen || 'Colombia' },
    { label: 'Fecha de salida', value: fechaIda || 'Por confirmar' },
    { label: 'Fecha de regreso', value: fechaRegreso || 'Por confirmar' },
    { label: 'Total pasajeros', value: `${totalPasajeros} persona${totalPasajeros > 1 ? 's' : ''}` },
    { label: 'Composicion', value: detallesPasajeros.join(' + ') || 'Por confirmar' }
  ];

  // Información de transporte
  if (calculation.tiquetes && calculation.tiquetes.costo_total > 0) {
    const tipoTiquete = calculation.tiquetes.tipo === 'ida_vuelta' ? 'Ida y vuelta' : 
                       calculation.tiquetes.tipo === 'ida' ? 'Solo ida' : 'Por confirmar';
    resumenViaje.push({ label: 'Tiquetes aereos', value: `${tipoTiquete} - ${calculation.tiquetes.proveedor || 'Aerolinea por confirmar'}` });
  }

  // Información de traslados
  if (calculation.traslados && calculation.traslados.costo_total > 0) {
    let trasladosInfo = [];
    if (calculation.traslados.aeropuerto_hotel_ida?.incluido) trasladosInfo.push('Aeropuerto -> Hotel');
    if (calculation.traslados.hotel_aeropuerto_vuelta?.incluido) trasladosInfo.push('Hotel -> Aeropuerto');
    if (trasladosInfo.length === 0) trasladosInfo.push('Traslados terrestres');
    resumenViaje.push({ label: 'Traslados', value: `Incluidos: ${trasladosInfo.join(', ')}` });
  }

  // Información de alojamiento
  if (calculation.hotel && calculation.hotel.costo_total > 0) {
    let hotelInfo = calculation.hotel.nombre || 'Hotel por confirmar';
    const categoria = calculation.hotel.categoria || quote.tipo_hotel;
    const acomodacion = calculation.hotel.acomodacion || quote.acomodacion;
    
    if (categoria) hotelInfo += ` (${getTipoHotelLabel(categoria)})`;
    if (acomodacion) hotelInfo += ` - ${getAcomodacionLabel(acomodacion)}`;
    
    resumenViaje.push({ label: 'Alojamiento', value: hotelInfo });
  }

  // Información de alimentación
  if (calculation.alimentacion && calculation.alimentacion.costo_total > 0) {
    const tipoAlimentacion = calculation.alimentacion.tipo || quote.alimentacion;
    resumenViaje.push({ label: 'Alimentacion', value: getAlimentacionLabel(tipoAlimentacion) });
  }

  // Información de equipaje
  if (calculation.equipaje && (calculation.equipaje.costo_total > 0 || calculation.equipaje.cabina?.incluido)) {
    let equipajeInfo = [];
    if (calculation.equipaje.cabina?.incluido) equipajeInfo.push('Cabina incluido');
    if (calculation.equipaje.bodega?.incluido) equipajeInfo.push('Bodega incluido');
    else if (calculation.equipaje.bodega?.costo > 0) equipajeInfo.push('Bodega disponible');
    if (equipajeInfo.length === 0) equipajeInfo.push('Equipaje basico');
    resumenViaje.push({ label: 'Equipaje', value: equipajeInfo.join(', ') });
  }

  // Asistencia médica
  if (calculation.seguros && calculation.seguros.asistencia_medica && calculation.seguros.asistencia_medica.costo > 0) {
    const tipoAsistencia = calculation.seguros.asistencia_medica.tipo || 'Basica';
    resumenViaje.push({ label: 'Asistencia medica', value: `Incluida - ${tipoAsistencia}` });
  }

  // Excursiones/Tours
  if (calculation.excursiones && calculation.excursiones.length > 0) {
    const numExcursiones = calculation.excursiones.length;
    resumenViaje.push({ label: 'Tours incluidos', value: `${numExcursiones} excursion${numExcursiones > 1 ? 'es' : ''}` });
  }

  // Servicios adicionales
  if (calculation.extras && calculation.extras.length > 0) {
    const numExtras = calculation.extras.length;
    resumenViaje.push({ label: 'Servicios extra', value: `${numExtras} servicio${numExtras > 1 ? 's' : ''} adicional${numExtras > 1 ? 'es' : ''}` });
  }

  // Necesidades especiales
  if (quote.personas_atencion_especial > 0 && quote.detalles_atencion_especial) {
    resumenViaje.push({ 
      label: 'Atencion especial', 
      value: `${quote.personas_atencion_especial} persona${quote.personas_atencion_especial > 1 ? 's' : ''} - ${quote.detalles_atencion_especial}` 
    });
  }

  // Agregar líneas divisorias antes de precios
  resumenViaje.push({ separator: true });
  
  // Precios
  const precioPersona = quote.precio_por_persona || (quote.precio_total / Math.max(1, adultos + menores));
  resumenViaje.push({ 
    label: 'Precio por persona', 
    value: formatPrice(precioPersona),
    highlight: true 
  });
  resumenViaje.push({ 
    label: 'PRECIO TOTAL', 
    value: formatPrice(quote.precio_total),
    highlight: true,
    total: true
  });

  // Renderizar el resumen
  resumenViaje.forEach(info => {
    if (info.separator) {
      // Línea divisoria
      doc.moveTo(margin + 6, yPosition + 6)
         .lineTo(margin + contentWidth - 6, yPosition + 6)
         .strokeColor(COLORS.moradito)
         .lineWidth(1)
         .stroke();
      addSpace(18);
      return;
    }
    
    // Estilo especial para elementos destacados
    if (info.total) {
      doc.fontSize(9).fillColor(COLORS.ColorMorado).font('Helvetica-Bold')
         .text(`${info.label}:`, margin + 8, yPosition, { width: 130 })
         .fontSize(10).fillColor(COLORS.fondoPopup)
         .text(info.value, margin + 145, yPosition, { width: contentWidth - 151 });
    } else if (info.highlight) {
      doc.fontSize(8).fillColor(COLORS.botonPopup).font('Helvetica-Bold')
         .text(`${info.label}:`, margin + 8, yPosition, { width: 130 })
         .fillColor(COLORS.ColorMorado).font('Helvetica-Bold')
         .text(info.value, margin + 145, yPosition, { width: contentWidth - 151 });
    } else {
      doc.fontSize(8).fillColor(COLORS.textoOscuro).font('Helvetica-Bold')
         .text(`${info.label}:`, margin + 8, yPosition, { width: 130 })
         .fillColor(COLORS.textoGris).font('Helvetica')
         .text(info.value, margin + 145, yPosition, { width: contentWidth - 151 });
    }
    addSpace(16);
  });

  // Espacio antes del bloque de precios
  addSpace(10);

  // Resumen precios
  checkPageSpace(50);
  doc.rect(margin, yPosition, contentWidth, 40).fillColor(COLORS.ColorAzul).fill();
  doc.fontSize(14).fillColor('white').font('Helvetica-Bold')
     .text(`PRECIO POR PERSONA: ${formatPrice(quote.precio_por_persona)}`, margin + 10, yPosition + 8, { align: 'center', width: contentWidth - 20 })
     .fontSize(12)
     .text(`PRECIO TOTAL: ${formatPrice(quote.precio_total)}`, margin + 10, yPosition + 24, { align: 'center', width: contentWidth - 20 });
  addSpace(50);

  // ✅ NUEVA SECCIÓN: LO QUE INCLUYE EL VIAJE
  addSpace(20);
  checkPageSpace(100);
  
  // Título de la sección
  doc.rect(margin, yPosition, contentWidth, 18).fillColor(COLORS.ColorMorado).fill();
  doc.fontSize(11).fillColor('white').font('Helvetica-Bold')
    .text('LO QUE INCLUYE TU VIAJE', margin + 8, yPosition + 5);
  addSpace(25);
  
  // Obtener inclusiones del viaje
  const inclusiones = generateTripInclusions(quote);
  
  // Generar observaciones adicionales
  const observaciones = generateObservations(quote, quote.calculation || {});
  
  if (inclusiones.length > 0) {
    inclusiones.forEach((inclusion, index) => {
      checkPageSpace(60);
      
      // Título de la inclusión (SIN iconos problemáticos)
      doc.fontSize(9).fillColor(COLORS.botonPopup).font('Helvetica-Bold')
        .text(`${inclusion.titulo}`, margin + 8, yPosition);
      addSpace(14);
      
      // Descripción principal
      doc.fontSize(8).fillColor(COLORS.textoOscuro).font('Helvetica-Bold')
        .text(`• ${inclusion.descripcion}`, margin + 12, yPosition);
      addSpace(12);
      
      // Detalles de la inclusión
      if (inclusion.detalles && inclusion.detalles.length > 0) {
        inclusion.detalles.forEach(detalle => {
          doc.fontSize(8).fillColor(COLORS.textoGris).font('Helvetica')
            .text(`  ${detalle}`, margin + 20, yPosition, { width: contentWidth - 30 });
          addSpace(11);
        });
      }
      
      addSpace(8);
    });
  } else {
    // Si no hay información detallada, mostrar mensaje básico
    doc.fontSize(8).fillColor(COLORS.textoGris).font('Helvetica')
      .text('• Los servicios incluidos se detallarán según la cotización específica', margin + 12, yPosition);
    addSpace(12);
    
    doc.fontSize(8).fillColor(COLORS.textoGris).font('Helvetica')
      .text('• Transporte, alojamiento y servicios según destino seleccionado', margin + 12, yPosition);
    addSpace(12);
  }
  
  addSpace(20);

  // MENSAJE PERSONALIZADO Y OBSERVACIONES (sin iconos)
  addSpace(30); // Más espacio antes del mensaje
  checkPageSpace(80);
  
  // Mensaje inspirador
  addSpace(10);
  doc.rect(margin, yPosition, contentWidth, 18).fillColor(COLORS.MoradoSuave).fill();
  doc.fontSize(10).fillColor('white').font('Helvetica-Bold')
    .text('TU VIAJE ESTA A UN CLICK DE HACERSE REALIDAD!', margin + 8, yPosition + 5);
  addSpace(25);
  
  // Mensaje personalizado
  const mensajePersonalizado = `Hemos preparado esta propuesta para tu viaje de ensueño a la hermosa ${quote.destino}, combinando economia y aventura para que vivas una experiencia inolvidable.

El valor por viajero de este viaje es de ${formatPrice(quote.precio_por_persona || (quote.precio_total / Math.max(1, (quote.adultos || 0) + (quote.menores || 0))))} y el precio total es de ${formatPrice(quote.precio_total)}.

Esperamos que esta propuesta te inspire a empacar tus maletas. Si tienes alguna pregunta sobre el itinerario o quieres personalizar algo mas, por favor, no dudes en contactarnos.

Estamos listos para ayudarte a crear recuerdos inolvidables!`;
  
  doc.fontSize(9).fillColor(COLORS.textoOscuro).font('Helvetica')
    .text(mensajePersonalizado, margin + 8, yPosition, { 
      width: contentWidth - 16, 
      align: 'justify', 
      lineGap: 3 
    });
    
  addSpace(100);

  // NUEVA SECCIÓN: OBSERVACIONES ESPECÍFICAS DEL VIAJE
  if (observaciones.length > 0) {
    addSpace(20);
    checkPageSpace(70);
    doc.rect(margin, yPosition, contentWidth, 18).fillColor(COLORS.ColorMorado).fill();
    doc.fontSize(10).fillColor('white').font('Helvetica-Bold')
      .text('INFORMACIÓN ESPECIAL DEL VIAJE:', margin + 8, yPosition + 5);
    addSpace(25);
    
    observaciones.forEach((obs, index) => {
      checkPageSpace(30);
      
      // Título del tipo de observación
      doc.fontSize(9).fillColor(COLORS.botonPopup).font('Helvetica-Bold')
        .text(obs.tipo + ':', margin + 8, yPosition);
      addSpace(15);
      
      // Contenido de la observación
      doc.fontSize(8).fillColor(COLORS.textoOscuro).font('Helvetica')
        .text(obs.contenido, margin + 12, yPosition, { 
          width: contentWidth - 20, 
          align: 'justify', 
          lineGap: 2 
        });
      addSpace(20);
      
      if (index < observaciones.length - 1) {
        addSpace(5); // Espacio entre observaciones
      }
    });
    
    addSpace(15);
  }

  // Observaciones específicas del viaje
  addSpace(20); // Más espacio antes de observaciones
  checkPageSpace(70);
  doc.rect(margin, yPosition, contentWidth, 18).fillColor(COLORS.botonPopup).fill();
  doc.fontSize(10).fillColor('white').font('Helvetica-Bold')
    .text('OBSERVACIONES IMPORTANTES:', margin + 8, yPosition + 5);
  addSpace(25);
  
  const observacionesCustom = quote.observaciones || 
    `• Precios sujetos a disponibilidad al momento de la reserva
• Cotizacion valida por 48 horas
• Menores de 2 años no pagan, pero requieren documentacion
• Documentacion vigente requerida (cedula o pasaporte segun destino)
• Informanos si algun viajero presenta alguna condicion especial
• Los servicios estan sujetos a terminos y condiciones especificos de cada proveedor`;
    
  doc.fontSize(8).fillColor(COLORS.textoGris).font('Helvetica')
    .text(observacionesCustom, margin + 8, yPosition, { 
      width: contentWidth - 16, 
      align: 'justify', 
      lineGap: 2 
    });
  addSpace(65);

  // SERVICIOS ADICIONALES DISPONIBLES
  addSpace(20); // Más espacio antes de servicios adicionales
  checkPageSpace(60);
  doc.rect(margin, yPosition, contentWidth, 18).fillColor(COLORS.fondoPopup).fill();
  doc.fontSize(10).fillColor('white').font('Helvetica-Bold')
    .text('SERVICIOS ADICIONALES DISPONIBLES (con costo extra):', margin + 8, yPosition + 5);
  addSpace(25);
  
  const serviciosExtra = [
    '• Equipaje en bodega (23 kg)',
    '• Seleccion de asiento aereo',
    '• Paseos en destino (solicita nuestro brochure de servicios)',
    '• Seguro de cancelacion',
    '• Asistencia personalizada premium',
    '• Alquiler de vehiculos',
    '• Actividades y excursiones especiales'
  ];
  
  serviciosExtra.forEach(servicio => {
    doc.fontSize(8).fillColor(COLORS.textoGris).font('Helvetica')
      .text(servicio, margin + 12, yPosition);
    addSpace(12);
  });
  
  addSpace(25);

  // ATENCIÓN PERSONALIZADA
  addSpace(20); // Más espacio antes de atención personalizada
  checkPageSpace(50);
  doc.rect(margin, yPosition, contentWidth, 18).fillColor(COLORS.ColorMorado).fill();
  doc.fontSize(10).fillColor('white').font('Helvetica-Bold')
    .text('ATENCION PERSONALIZADA VIAJA YA:', margin + 8, yPosition + 5);
  addSpace(25);
  
  const atencionPersonalizada = `En Viaja Ya, contamos con un canal de atencion a los viajeros donde estaras acompañado desde un dia antes del viaje hasta que finalice. 

• Realizamos check-in
• Brindamos recomendaciones personalizadas  
• Aseguramos que tu experiencia de viaje sea la mejor
• Soporte 24/7 durante tu viaje
• Atencion inmediata ante cualquier inconveniente`;

  doc.fontSize(8).fillColor(COLORS.textoOscuro).font('Helvetica')
    .text(atencionPersonalizada, margin + 8, yPosition, { 
      width: contentWidth - 16, 
      align: 'justify', 
      lineGap: 2 
    });
  addSpace(60);

  // CONTACTO DEL ASESOR (limpio)
  addSpace(25); // Más espacio antes del asesor
  if (quote.asesor_info && quote.asesor_info.nombre_completo && quote.asesor_info.email) {
    checkPageSpace(45);
    doc.rect(margin, yPosition, contentWidth, 18).fillColor(COLORS.ColorAzul2).fill();
    doc.fontSize(10).fillColor('white').font('Helvetica-Bold')
      .text('TU ASESOR DE VIAJES:', margin + 8, yPosition + 5);
    addSpace(25);
    
    doc.fontSize(9).fillColor(COLORS.textoOscuro).font('Helvetica-Bold')
      .text('Asesor:', margin + 8, yPosition, { continued: true });
    doc.fillColor(COLORS.ColorMorado).font('Helvetica-Bold')
      .text(` ${quote.asesor_info.nombre_completo}`, { continued: false });
    addSpace(14);
    
    doc.fontSize(8).fillColor(COLORS.textoOscuro).font('Helvetica')
      .text('Email:', margin + 8, yPosition, { continued: true });
    doc.fillColor(COLORS.ColorMorado).font('Helvetica')
      .text(` ${quote.asesor_info.email}`, { 
        link: `mailto:${quote.asesor_info.email}`, 
        underline: true 
      });
    addSpace(14);
    
    if (quote.asesor_info.telefono) {
      doc.fontSize(8).fillColor(COLORS.textoOscuro).font('Helvetica')
        .text('Telefono:', margin + 8, yPosition, { continued: true });
      doc.fillColor(COLORS.ColorMorado).font('Helvetica')
        .text(` ${quote.asesor_info.telefono}`, { continued: false });
      addSpace(14);
    }
    
    addSpace(25);
  }

  // TÉRMINOS Y CONDICIONES (detallados pero sin iconos)
  addSpace(20); // Más espacio antes de términos
  const espacioRestante = pageHeight - yPosition - 80;
  if (espacioRestante > 120) {
    doc.rect(margin, yPosition, contentWidth, 18).fillColor(COLORS.fondoPopup).fill();
    doc.fontSize(10).fillColor('white').font('Helvetica-Bold')
      .text('TERMINOS Y CONDICIONES', margin + 8, yPosition + 5);
    addSpace(25);

    const terminos = [
      '• Cotizacion valida por 48 horas desde su emision',
      '• Precios sujetos a disponibilidad al momento de la reserva',
      '• Menores de 2 años no pagan pero requieren documentacion',
      '• Documentacion vigente requerida segun destino',
      '• Cambios y cancelaciones sujetos a politicas de proveedores',
      '• Servicios sujetos a condiciones climaticas y operacionales',
      '• Viaja Ya actua como intermediario entre cliente y proveedores',
      '• Aplican terminos y condiciones especificos de cada proveedor',
      '• Para reservar se requiere anticipo minimo del 30%',
      '• Saldo restante debe cancelarse antes del viaje'
    ];
    
    terminos.forEach(termino => {
      doc.fontSize(8).fillColor(COLORS.textoGris).font('Helvetica')
        .text(termino, margin + 10, yPosition, { width: contentWidth - 20 });
      addSpace(14);
    });
    
    addSpace(2);
  } else {
    doc.fontSize(8).fillColor(COLORS.textoGris).font('Helvetica-Bold')
      .text('Terminos: Cotizacion valida 48h. Precios sujetos a disponibilidad. Menores 2 años no pagan.', 
            margin, yPosition, { width: contentWidth, align: 'center' });
    addSpace(2);
  }

  // PIE DE PÁGINA (sin iconos)
  addSpace(2); // Más espacio antes del pie de página
  const footerY = pageHeight - 50;
  if (yPosition < footerY) {
    yPosition = footerY;
  }
  
  // Línea divisoria
  doc.moveTo(margin, yPosition)
     .lineTo(pageWidth - margin, yPosition)
     .strokeColor(COLORS.moradito)
     .lineWidth(1)
     .stroke();
  

  
  // Información de la empresa
  doc.fontSize(8).fillColor(COLORS.textoGris).font('Helvetica-Bold')
    .text('VIAJA YA - Hacemos realidad tus sueños de viaje', margin, yPosition, { width: contentWidth, align: 'center' });
 
  
  doc.fontSize(7).fillColor(COLORS.textoGris).font('Helvetica')
    .text('info@viajaya.com | +57 300 123 4567 | Bogota, Colombia', margin, yPosition, { width: contentWidth, align: 'center' });
 
  
  doc.fontSize(7).fillColor(COLORS.textoGris).font('Helvetica-Oblique')
    .text(`Cotizacion generada el ${new Date().toLocaleDateString('es-CO', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    })}`, margin, yPosition, { width: contentWidth, align: 'center' });

  doc.end();
  
  if (saveToFile) {
    console.log("✅ PDF guardado en archivo:", filepath);
    return { 
      filepath,
      filename: `cotizacion-${quote.quote_number || quote.id}.pdf`
    };
  } else {
    // ✅ FIX: Para vista previa, retornar el buffer
    console.log("🔍 Esperando generación de buffer...");
    return new Promise((resolve, reject) => {
      doc.on('end', () => {
        try {
          const buffer = Buffer.concat(bufferChunks);
          console.log("✅ Buffer generado exitosamente, tamaño:", buffer.length);
          resolve({
            buffer,
            filename: `cotizacion-${quote.quote_number || quote.id}.pdf`
          });
        } catch (error) {
          console.error("❌ Error creando buffer:", error);
          reject(error);
        }
      });
      
      doc.on('error', (error) => {
        console.error("❌ Error en documento PDF:", error);
        reject(error);
      });
    });
  }
};

module.exports = { generateQuotePDF };
