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

  // 1. TRANSPORTE AÉREO
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
    
    const detallesTraslados = [
      'TRASLADO LLEGADA/SALIDA: AEROPUERTO-HOTEL/HOTEL-AEROPUERTO'
    ];
    
    // Verificar si hay traslados incluidos
    const tieneIda = trasladoIda?.incluido;
    const tieneVuelta = trasladoVuelta?.incluido;
    
    if (tieneIda || tieneVuelta) {
      // Agregar información del proveedor si está disponible
      if (trasladoIda?.proveedor || trasladoVuelta?.proveedor) {
        const proveedor = trasladoIda?.proveedor || trasladoVuelta?.proveedor;
        detallesTraslados.push(`Proveedor: ${proveedor}`);
      }
      
      // Agregar tipo de vehículo si está disponible
      if (trasladoIda?.tipo_vehiculo || trasladoVuelta?.tipo_vehiculo) {
        const vehiculo = trasladoIda?.tipo_vehiculo || trasladoVuelta?.tipo_vehiculo;
        detallesTraslados.push(`Vehículo: ${vehiculo}`);
      }
    }

    inclusiones.push({
      titulo: 'TRASLADOS',
      descripcion: 'Servicios de traslado incluidos',
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
  if (calculation.equipaje) {
    console.log("🧳 DEBUG EQUIPAJE EN PDF:", {
      equipaje_completo: calculation.equipaje,
      tiene_equipaje_extra: !!calculation.equipaje.equipaje_extra,
      equipaje_extra_incluido: calculation.equipaje.equipaje_extra?.incluido,
      tiene_bodega: !!calculation.equipaje.bodega,
      costo_total: calculation.equipaje.costo_total
    });

    const detallesEquipaje = ['Equipaje de cabina incluido (morral)'];
    let descripcionEquipaje = 'Equipaje incluido';
    
    // Verificar equipaje extra (nuevo formato)
    if (calculation.equipaje.equipaje_extra?.incluido) {
      descripcionEquipaje = 'Equipaje extra incluido';
      detallesEquipaje.push('Maleta de 23kg en bodega incluida');
    } 
    // Verificar equipaje de bodega (formato anterior)
    else if (calculation.equipaje.bodega?.incluido) {
      descripcionEquipaje = 'Equipaje de bodega incluido';
      detallesEquipaje.push('Maleta de 23kg en bodega incluida');
    } else if (calculation.equipaje.bodega?.costo > 0) {
      descripcionEquipaje = 'Equipaje de bodega disponible';
      detallesEquipaje.push('Maleta de 23kg disponible con costo extra');
    } else if (calculation.equipaje.bodega) {
      descripcionEquipaje = 'Equipaje de bodega disponible';
      detallesEquipaje.push('Maleta de 23kg disponible');
    }
    // Si hay costo total pero no está en los formatos anteriores
    else if (calculation.equipaje.costo_total && calculation.equipaje.costo_total > 0) {
      descripcionEquipaje = 'Equipaje extra disponible';
      detallesEquipaje.push('Servicios de equipaje adicional');
    }

    inclusiones.push({
      titulo: 'EQUIPAJE',
      descripcion: descripcionEquipaje,
      detalles: detallesEquipaje
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
  
  return observaciones;
}

// ✅ Calcular noches y días de viaje
function calcularNoches(fechaIda, fechaRegreso) {
  if (!fechaIda || !fechaRegreso) return null;
  const ida = new Date(fechaIda);
  const regreso = new Date(fechaRegreso);
  const diferencia = regreso.getTime() - ida.getTime();
  const noches = Math.max(1, Math.ceil(diferencia / (1000 * 3600 * 24)));
  return noches;
}

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
    excursiones: quote.excursiones || [],
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

// ✅ Generar PDF OPTIMIZADO
const generateQuotePDF = async (quote, saveToFile = true) => {
  console.log("🔍 Iniciando generateQuotePDF:", { saveToFile, quoteId: quote.id });
  
  let doc, yPosition, pageWidth, pageHeight, margin, contentWidth;
  let filepath;
  let bufferChunks = [];
  
  try {
    doc = new PDFDocument({ margin: 30, size: 'A4' });
    yPosition = 30;
    pageWidth = doc.page.width;
    pageHeight = doc.page.height;
    margin = 30;
    contentWidth = pageWidth - 2 * margin;

    if (saveToFile) {
      const pdfDir = ensurePDFDirectory();
      const filename = `cotizacion-${quote.quote_number || quote.id}.pdf`;
      filepath = path.join(pdfDir, filename);
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);
    } else {
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

  // ✅ FUNCIONES UTILITARIAS MEJORADAS
  const checkPageSpace = (requiredSpace) => {
    if (yPosition + requiredSpace > pageHeight - 100) {
      doc.addPage();
      yPosition = margin + 10;
      return true;
    }
    return false;
  };

  const addSpace = (space = 12) => {
    yPosition += space;
  };

  const addSectionSpace = () => {
    addSpace(15);
  };

  // ✅ HEADER CORPORATIVO
  doc.rect(0, 0, pageWidth, 75).fillColor(COLORS.ColorAzul2).fill();

  // Logo
  const logoCandidates = [
    path.join(__dirname, '../assets/logoNuevo.png'),
    path.join(__dirname, '../assets/NuevoLogo.png'),
    path.join(__dirname, '../assets/logo2.png')
  ];
  
  let logoLoaded = false;
  for (const logoPath of logoCandidates) {
    try {
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, margin, 12, { width: 50, height: 50 });
        logoLoaded = true;
        break;
      }
    } catch (error) {
      console.log(`⚠️ No se pudo cargar el logo (${logoPath}):`, error.message);
    }
  }

  if (!logoLoaded) {
    doc.fontSize(8).fillColor('white').text('Logo no disponible', margin, 20);
  }

  // Información de la empresa
  doc.fontSize(14).fillColor('white').font('Helvetica-Bold')
     .text('VIAJA YA', margin + 60, 15)
     .fontSize(8).font('Helvetica')
     .text('Hacemos realidad tus sueños de viaje', margin + 60, 30)
     .text('info@viajaya.com | +57 300 123 4567', margin + 60, 42)
     .text('Bogotá, Colombia', margin + 60, 54);

  // Número de cotización
  doc.fontSize(11).fillColor('white').font('Helvetica-Bold')
     .text(`Cotización: ${quote.quote_number || quote.id}`, pageWidth - 180, 20, { 
       width: 150, 
       align: 'right' 
     });

  yPosition = 85;

  // ✅ TÍTULO DEL DESTINO
  checkPageSpace(40);
  doc.rect(margin, yPosition, contentWidth, 35).fillColor(COLORS.MoradoSuave).fill();
  doc.fontSize(16).fillColor('white').font('Helvetica-Bold')
     .text(`VIAJE A ${quote.destino.toUpperCase()}`, margin + 10, yPosition + 10, { 
       align: 'center', 
       width: contentWidth - 20 
     });
  yPosition += 45;

  // ✅ INFORMACIÓN DEL CLIENTE
  checkPageSpace(80);
  doc.rect(margin, yPosition, contentWidth, 18).fillColor(COLORS.botonPopup).fill();
  doc.fontSize(10).fillColor('white').font('Helvetica-Bold')
     .text('INFORMACIÓN DEL CLIENTE', margin + 10, yPosition + 5);
  yPosition += 25;

  const clienteInfo = [
    { label: 'Cliente:', value: quote.nombre_cliente || 'No especificado' },
    { label: 'Email:', value: quote.email_cliente || 'No especificado' },
    { label: 'Teléfono:', value: quote.telefono_cliente || 'No especificado' },
    { label: 'Ruta:', value: `${quote.origen || 'Colombia'} → ${quote.destino}` }
  ];

  clienteInfo.forEach(info => {
    doc.fontSize(9).fillColor(COLORS.textoOscuro).font('Helvetica-Bold')
       .text(info.label, margin + 10, yPosition, { width: 80 })
       .fillColor(COLORS.textoGris).font('Helvetica')
       .text(info.value, margin + 95, yPosition, { width: contentWidth - 105 });
    addSpace(14);
  });

  addSectionSpace();

  // ✅ RESUMEN DEL VIAJE
  checkPageSpace(120);
  doc.rect(margin, yPosition, contentWidth, 18).fillColor(COLORS.fondoPopup).fill();
  doc.fontSize(10).fillColor('white').font('Helvetica-Bold')
     .text('RESUMEN DETALLADO DEL VIAJE', margin + 10, yPosition + 5);
  yPosition += 25;

  // Datos del viaje
  const fechaIda = quote.fecha_ida ? new Date(quote.fecha_ida + 'T12:00:00').toLocaleDateString('es-CO', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  }) : 'Por confirmar';
  
  const fechaRegreso = quote.fecha_regreso ? new Date(quote.fecha_regreso + 'T12:00:00').toLocaleDateString('es-CO', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  }) : 'Por confirmar';
  
  const noches = calcularNoches(quote.fecha_ida, quote.fecha_regreso);
  const dias = noches ? noches + 1 : null;
  
  const adultos = quote.adultos || 0;
  const menores = quote.menores || 0;
  const infantes = quote.infantes || 0;
  const totalPasajeros = adultos + menores + infantes;
  
  let detallesPasajeros = [];
  if (adultos > 0) detallesPasajeros.push(`${adultos} adulto${adultos > 1 ? 's' : ''}`);
  if (menores > 0) detallesPasajeros.push(`${menores} menor${menores > 1 ? 'es' : ''}`);
  if (infantes > 0) detallesPasajeros.push(`${infantes} infante${infantes > 1 ? 's' : ''} (no pagan)`);

  const resumenViaje = [
    { label: 'Destino:', value: `${quote.destino}${noches && dias ? ` (${noches} noches / ${dias} días)` : ''}`, highlight: true },
    { label: 'Salida:', value: fechaIda },
    { label: 'Regreso:', value: fechaRegreso },
    { label: 'Pasajeros:', value: `${totalPasajeros} persona${totalPasajeros > 1 ? 's' : ''} (${detallesPasajeros.join(' + ')})` }
  ];

  // Obtener datos de cálculo
  const calculation = getCalculationData(quote);

  // Información de servicios
  if (calculation.tiquetes && calculation.tiquetes.costo_total > 0) {
    const tipoTiquete = calculation.tiquetes.tipo === 'ida_vuelta' ? 'Ida y vuelta' : 'Solo ida';
    resumenViaje.push({ 
      label: 'Vuelos:', 
      value: `${tipoTiquete} - ${calculation.tiquetes.proveedor || 'Aerolínea por confirmar'}` 
    });
  }

  if (calculation.hotel && calculation.hotel.costo_total > 0) {
    let hotelInfo = calculation.hotel.nombre || 'Hotel por confirmar';
    const categoria = calculation.hotel.categoria || quote.tipo_hotel;
    const acomodacion = calculation.hotel.acomodacion || quote.acomodacion;
    
    if (categoria) hotelInfo += ` (${getTipoHotelLabel(categoria)})`;
    if (acomodacion) hotelInfo += ` - ${getAcomodacionLabel(acomodacion)}`;
    
    resumenViaje.push({ label: 'Hotel:', value: hotelInfo });
  }

  if (calculation.alimentacion && calculation.alimentacion.costo_total > 0) {
    const tipoAlimentacion = calculation.alimentacion.tipo || quote.alimentacion;
    resumenViaje.push({ label: 'Alimentación:', value: getAlimentacionLabel(tipoAlimentacion) });
  }

  // Línea separadora antes de precios
  resumenViaje.push({ separator: true });
  
  // Precios
  const precioPersona = quote.precio_por_persona || (quote.precio_total / Math.max(1, adultos + menores));
  resumenViaje.push({ 
    label: 'Precio por persona:', 
    value: formatPrice(precioPersona),
    highlight: true 
  });
  resumenViaje.push({ 
    label: 'PRECIO TOTAL:', 
    value: formatPrice(quote.precio_total),
    total: true
  });

  // Renderizar resumen
  resumenViaje.forEach(info => {
    if (info.separator) {
      doc.moveTo(margin + 10, yPosition + 5)
         .lineTo(margin + contentWidth - 10, yPosition + 5)
         .strokeColor(COLORS.moradito)
         .lineWidth(1)
         .stroke();
      addSpace(15);
      return;
    }
    
    if (info.total) {
      doc.fontSize(10).fillColor(COLORS.ColorMorado).font('Helvetica-Bold')
         .text(info.label, margin + 10, yPosition, { width: 120 })
         .fontSize(11).fillColor(COLORS.fondoPopup)
         .text(info.value, margin + 135, yPosition, { width: contentWidth - 145 });
    } else if (info.highlight) {
      doc.fontSize(9).fillColor(COLORS.botonPopup).font('Helvetica-Bold')
         .text(info.label, margin + 10, yPosition, { width: 120 })
         .fillColor(COLORS.ColorMorado).font('Helvetica-Bold')
         .text(info.value, margin + 135, yPosition, { width: contentWidth - 145 });
    } else {
      doc.fontSize(9).fillColor(COLORS.textoOscuro).font('Helvetica-Bold')
         .text(info.label, margin + 10, yPosition, { width: 120 })
         .fillColor(COLORS.textoGris).font('Helvetica')
         .text(info.value, margin + 135, yPosition, { width: contentWidth - 145 });
    }
    addSpace(15);
  });

  addSectionSpace();

  // ✅ BLOQUE DE PRECIOS DESTACADO
  checkPageSpace(50);
  doc.rect(margin, yPosition, contentWidth, 45).fillColor(COLORS.ColorAzul).fill();
  doc.fontSize(13).fillColor('white').font('Helvetica-Bold')
     .text(`PRECIO POR PERSONA: ${formatPrice(quote.precio_por_persona)}`, margin + 15, yPosition + 10, { 
       align: 'center', 
       width: contentWidth - 30 
     })
     .fontSize(11)
     .text(`PRECIO TOTAL: ${formatPrice(quote.precio_total)}`, margin + 15, yPosition + 28, { 
       align: 'center', 
       width: contentWidth - 30 
     });
  yPosition += 55;

  addSectionSpace();

  // ✅ LO QUE INCLUYE TU VIAJE - FORMATO TABLA
  checkPageSpace(80);
  doc.rect(margin, yPosition, contentWidth, 20).fillColor(COLORS.ColorMorado).fill();
  doc.fontSize(11).fillColor('white').font('Helvetica-Bold')
     .text('LO QUE INCLUYE TU VIAJE', margin + 10, yPosition + 6);
  yPosition += 30;
  
  const inclusiones = generateTripInclusions(quote);
  
  if (inclusiones.length > 0) {
    // Configuración de la tabla
    const tableStartY = yPosition;
    const rowHeight = 24;
    const col1Width = 120; // Ancho columna título
    const col2Width = contentWidth - col1Width - 20; // Ancho columna descripción
    const col1X = margin + 10;
    const col2X = col1X + col1Width + 10;
    
    // Encabezado de tabla
    doc.rect(margin + 5, yPosition - 2, contentWidth - 10, 18).fillColor('#e5e7eb').fill();
    doc.fontSize(9).fillColor(COLORS.textoOscuro).font('Helvetica-Bold')
       .text('SERVICIO', col1X, yPosition + 4, { width: col1Width })
       .text('DESCRIPCIÓN', col2X, yPosition + 4, { width: col2Width });
    yPosition += 20;
    
    // Filas de la tabla
    inclusiones.forEach((inclusion, index) => {
      checkPageSpace(30);
      
      // Fondo alternado para las filas
      const bgColor = index % 2 === 0 ? '#f9fafb' : '#ffffff';
      doc.rect(margin + 5, yPosition - 2, contentWidth - 10, rowHeight).fillColor(bgColor).fill();
      
      // Borde sutil
      doc.rect(margin + 5, yPosition - 2, contentWidth - 10, rowHeight)
         .strokeColor('#e5e7eb')
         .lineWidth(0.5)
         .stroke();
      
      // Columna 1: Título del servicio
      doc.fontSize(8).fillColor(COLORS.botonPopup).font('Helvetica-Bold')
         .text(inclusion.titulo, col1X, yPosition + 2, { 
           width: col1Width,
           height: rowHeight - 4,
           align: 'left'
         });
      
      // Columna 2: Descripción compacta
      let descripcionCompleta = inclusion.descripcion;
      
      // Agregar detalles más importantes en la misma línea
      if (inclusion.detalles && inclusion.detalles.length > 0) {
        const detallesImportantes = inclusion.detalles
          .filter(d => d.trim() !== '' && !d.includes('TOURS OPCIONALES:'))
          .slice(0, 2) // Solo los 2 primeros detalles más importantes
          .join(' • ');
        
        if (detallesImportantes) {
          descripcionCompleta += ` • ${detallesImportantes}`;
        }
      }
      
      doc.fontSize(7).fillColor(COLORS.textoOscuro).font('Helvetica')
         .text(descripcionCompleta, col2X, yPosition + 2, { 
           width: col2Width - 5,
           height: rowHeight - 4,
           align: 'left',
           lineGap: 1
         });
      
      yPosition += rowHeight;
    });
    
    // Línea final de la tabla
    doc.moveTo(margin + 5, yPosition)
       .lineTo(margin + contentWidth - 5, yPosition)
       .strokeColor('#e5e7eb')
       .lineWidth(1)
       .stroke();
    
    addSpace(10);
  } else {
    // Mensaje cuando no hay inclusiones específicas
    doc.rect(margin + 5, yPosition - 2, contentWidth - 10, 40).fillColor('#f9fafb').fill();
    doc.fontSize(8).fillColor(COLORS.textoGris).font('Helvetica')
       .text('• Los servicios incluidos se detallarán según la cotización específica', margin + 15, yPosition + 5);
    doc.fontSize(8).fillColor(COLORS.textoGris).font('Helvetica')
       .text('• Transporte, alojamiento y servicios según destino seleccionado', margin + 15, yPosition + 18);
    yPosition += 45;
  }
  
  addSectionSpace();

  // ✅ MENSAJE PERSONALIZADO
  checkPageSpace(100);
  doc.rect(margin, yPosition, contentWidth, 18).fillColor(COLORS.MoradoSuave).fill();
  doc.fontSize(10).fillColor('white').font('Helvetica-Bold')
     .text('TU VIAJE ESTÁ A UN CLICK DE HACERSE REALIDAD', margin + 10, yPosition + 5);
  yPosition += 25;
  
  const mensajePersonalizado = `Hemos preparado esta propuesta para tu viaje de ensueño a la hermosa ${quote.destino}, combinando economía y aventura para que vivas una experiencia inolvidable.

El valor por viajero de este viaje es de ${formatPrice(quote.precio_por_persona || (quote.precio_total / Math.max(1, (quote.adultos || 0) + (quote.menores || 0))))} y el precio total es de ${formatPrice(quote.precio_total)}.

Esperamos que esta propuesta te inspire a empacar tus maletas. Si tienes alguna pregunta sobre el itinerario o quieres personalizar algo más, por favor, no dudes en contactarnos.

¡Estamos listos para ayudarte a crear recuerdos inolvidables!`;
  
  doc.fontSize(9).fillColor(COLORS.textoOscuro).font('Helvetica')
     .text(mensajePersonalizado, margin + 10, yPosition, { 
       width: contentWidth - 20, 
       align: 'justify', 
       lineGap: 2 
     });
  
  // Calcular el espacio real que ocupó el texto
  const textoHeight = doc.heightOfString(mensajePersonalizado, {
    width: contentWidth - 20,
    lineGap: 2
  });
  yPosition += textoHeight + 15; // Agregar 15px de padding extra

  addSectionSpace();

  // ✅ OBSERVACIONES ESPECIALES
  const observaciones = generateObservations(quote, quote.calculation || {});
  
  if (observaciones.length > 0) {
    checkPageSpace(60);
    doc.rect(margin, yPosition, contentWidth, 18).fillColor(COLORS.ColorMorado).fill();
    doc.fontSize(10).fillColor('white').font('Helvetica-Bold')
       .text('INFORMACIÓN ESPECIAL DEL VIAJE', margin + 10, yPosition + 5);
    yPosition += 25;
    
    observaciones.forEach((obs, index) => {
      checkPageSpace(40);
      
      doc.fontSize(9).fillColor(COLORS.botonPopup).font('Helvetica-Bold')
         .text(`${obs.tipo}:`, margin + 10, yPosition);
      yPosition += 12;
      
      doc.fontSize(8).fillColor(COLORS.textoOscuro).font('Helvetica')
         .text(obs.contenido, margin + 15, yPosition, { 
           width: contentWidth - 25, 
           align: 'justify', 
           lineGap: 1 
         });
      yPosition += 20;
      
      if (index < observaciones.length - 1) {
        addSpace(8);
      }
    });
    
    addSectionSpace();
  }

  // ✅ OBSERVACIONES IMPORTANTES
  checkPageSpace(80);
  doc.rect(margin, yPosition, contentWidth, 18).fillColor(COLORS.botonPopup).fill();
  doc.fontSize(10).fillColor('white').font('Helvetica-Bold')
     .text('OBSERVACIONES IMPORTANTES', margin + 10, yPosition + 5);
  yPosition += 25;
  
  const observacionesImportantes = quote.observaciones || 
    `• Precios sujetos a disponibilidad al momento de la reserva
• Cotización válida por 48 horas
• Menores de 2 años no pagan, pero requieren documentación
• Documentación vigente requerida (cédula o pasaporte según destino)
• Infórmanos si algún viajero presenta alguna condición especial
• Los servicios están sujetos a términos y condiciones específicos de cada proveedor`;
    
  doc.fontSize(8).fillColor(COLORS.textoGris).font('Helvetica')
     .text(observacionesImportantes, margin + 10, yPosition, { 
       width: contentWidth - 20, 
       align: 'justify', 
       lineGap: 2 
     });
  yPosition += 60;

  addSectionSpace();

  // ✅ SERVICIOS ADICIONALES
  checkPageSpace(70);
  doc.rect(margin, yPosition, contentWidth, 18).fillColor(COLORS.fondoPopup).fill();
  doc.fontSize(10).fillColor('white').font('Helvetica-Bold')
     .text('SERVICIOS ADICIONALES DISPONIBLES (con costo extra)', margin + 10, yPosition + 5);
  yPosition += 25;
  
  const serviciosExtra = [
    '• Equipaje en bodega (23 kg)',
    '• Selección de asiento aéreo',
    '• Paseos en destino (solicita nuestro brochure de servicios)',
    '• Seguro de cancelación',
    '• Asistencia personalizada premium',
    '• Alquiler de vehículos'
  ];
  
  serviciosExtra.forEach(servicio => {
    doc.fontSize(8).fillColor(COLORS.textoGris).font('Helvetica')
       .text(servicio, margin + 15, yPosition);
    addSpace(12);
  });
  
  addSectionSpace();

  // ✅ ATENCIÓN PERSONALIZADA
  checkPageSpace(60);
  doc.rect(margin, yPosition, contentWidth, 18).fillColor(COLORS.ColorMorado).fill();
  doc.fontSize(10).fillColor('white').font('Helvetica-Bold')
     .text('ATENCIÓN PERSONALIZADA VIAJA YA', margin + 10, yPosition + 5);
  yPosition += 25;
  
  const atencionPersonalizada = `En Viaja Ya, contamos con un canal de atención a los viajeros donde estarás acompañado desde un día antes del viaje hasta que finalice.

• Realizamos check-in
• Brindamos recomendaciones personalizadas  
• Aseguramos que tu experiencia de viaje sea la mejor
• Soporte 24/7 durante tu viaje
• Atención inmediata ante cualquier inconveniente`;

  doc.fontSize(8).fillColor(COLORS.textoOscuro).font('Helvetica')
     .text(atencionPersonalizada, margin + 10, yPosition, { 
       width: contentWidth - 20, 
       align: 'justify', 
       lineGap: 2 
     });
  yPosition += 60;

  addSectionSpace();

  // ✅ CONTACTO DEL ASESOR
  if (quote.asesor_info && quote.asesor_info.nombre_completo && quote.asesor_info.email) {
    checkPageSpace(50);
    doc.rect(margin, yPosition, contentWidth, 18).fillColor(COLORS.ColorAzul2).fill();
    doc.fontSize(10).fillColor('white').font('Helvetica-Bold')
       .text('TU ASESOR DE VIAJES', margin + 10, yPosition + 5);
    yPosition += 25;
    
    doc.fontSize(9).fillColor(COLORS.textoOscuro).font('Helvetica-Bold')
       .text('Asesor: ', margin + 10, yPosition, { continued: true });
    doc.fillColor(COLORS.ColorMorado).font('Helvetica-Bold')
       .text(quote.asesor_info.nombre_completo, { continued: false });
    addSpace(12);
    
    doc.fontSize(8).fillColor(COLORS.textoOscuro).font('Helvetica')
       .text('Email: ', margin + 10, yPosition, { continued: true });
    doc.fillColor(COLORS.ColorMorado).font('Helvetica')
       .text(quote.asesor_info.email, { 
         link: `mailto:${quote.asesor_info.email}`, 
         underline: true 
       });
    addSpace(12);
    
    if (quote.asesor_info.telefono) {
      doc.fontSize(8).fillColor(COLORS.textoOscuro).font('Helvetica')
         .text('Teléfono: ', margin + 10, yPosition, { continued: true });
      doc.fillColor(COLORS.ColorMorado).font('Helvetica')
         .text(quote.asesor_info.telefono, { continued: false });
      addSpace(12);
    }
    
    addSectionSpace();
  }

  // ✅ PIE DE PÁGINA MEJORADO
  // Verificar si necesitamos nueva página para el pie
  const espacioRestante = pageHeight - yPosition;
  if (espacioRestante < 100) {
    checkPageSpace(100);
  }

  // Posicionar el pie de página siempre en la parte inferior
  const footerStartY = pageHeight - 80;
  if (yPosition < footerStartY - 20) {
    yPosition = footerStartY - 20;
  }

  // Línea separadora elegante
  doc.moveTo(margin, yPosition)
     .lineTo(pageWidth - margin, yPosition)
     .strokeColor(COLORS.moradito)
     .lineWidth(1.5)
     .stroke();
  yPosition += 10;

  // Información de la empresa - bien espaciada
  doc.fontSize(9).fillColor(COLORS.textoOscuro).font('Helvetica-Bold')
     .text('VIAJA YA - Hacemos realidad tus sueños de viaje', margin, yPosition, { 
       width: contentWidth, 
       align: 'center' 
     });
  yPosition += 12;
  
  doc.fontSize(8).fillColor(COLORS.textoGris).font('Helvetica')
     .text('info@viajaya.com | +57 300 123 4567 | Bogotá, Colombia', margin, yPosition, { 
       width: contentWidth, 
       align: 'center' 
     });
  yPosition += 10;
  
  doc.fontSize(7).fillColor(COLORS.textoGris).font('Helvetica-Oblique')
     .text(`Cotización generada el ${new Date().toLocaleDateString('es-CO', { 
       weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
     })}`, margin, yPosition, { 
       width: contentWidth, 
       align: 'center' 
     });

  doc.end();
  
  if (saveToFile) {
    console.log("✅ PDF guardado en archivo:", filepath);
    return { 
      filepath,
      filename: `cotizacion-${quote.quote_number || quote.id}.pdf`
    };
  } else {
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