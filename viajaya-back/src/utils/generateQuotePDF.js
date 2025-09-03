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
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ✅ Función auxiliar para obtener datos de cálculo desde el quote
function getCalculationData(quote) {
  if (quote.calculation) return quote.calculation;
  return {
    tiquetes: quote.tiquetes || {},
    traslados: quote.traslados || {},
    hotel: quote.hotel || {},
    alimentacion: quote.alimentacion || {},
    equipaje: quote.equipaje || {},
    seguros: quote.seguros || {},
    extras: quote.extras || [],
    asistencia_medica: quote.seguros?.asistencia_medica || {}
  };
}

// ✅ Formatear precios
function formatPrice(price) {
  if (!price || price === 0) return '$0';
  return `$${Number(price).toLocaleString('es-CO')}`;
}

// ✅ Generar desglose detallado
function generateBudgetBreakdown(quote) {
  try {
    console.log("🔍 Iniciando generateBudgetBreakdown...");
    const calculation = getCalculationData(quote);
    console.log("✅ getCalculationData completado");
    
    const personas_que_pagan = quote.personas_que_pagan || 1;
    let breakdown = [];
    
    console.log("🔍 Procesando transportes...");
    // 1. TRANSPORTES
    if (calculation.tiquetes && calculation.tiquetes.costo_total > 0) {
    breakdown.push({
      category: 'TRANSPORTES',
      items: [
        {
          description: `Tiquetes aéreos ${calculation.tiquetes.tipo || 'ida y vuelta'}`,
          details: [
            `Origen: ${calculation.tiquetes.origen || 'No especificado'}`,
            `Destino: ${calculation.tiquetes.destino || 'No especificado'}`,
            `Aerolínea: ${calculation.tiquetes.proveedor || 'Por confirmar'}`,
            `Fecha ida: ${calculation.tiquetes.fecha_ida ? formatForPDF(calculation.tiquetes.fecha_ida) : 'Por confirmar'}`,
            `Fecha vuelta: ${calculation.tiquetes.fecha_vuelta ? formatForPDF(calculation.tiquetes.fecha_vuelta) : 'Por confirmar'}`
          ],
          totalPerPerson: calculation.tiquetes.costo_total,
          totalGeneral: calculation.tiquetes.costo_total * personas_que_pagan
        }
      ]
    });
  }
  
  // 2. TRASLADOS
  if (calculation.traslados && calculation.traslados.costo_total > 0) {
    const trasladosItems = [];
    
    if (calculation.traslados.aeropuerto_hotel_ida?.costo > 0) {
      trasladosItems.push({
        description: 'Traslado Aeropuerto → Hotel (llegada)',
        totalPerPerson: calculation.traslados.aeropuerto_hotel_ida.costo,
        totalGeneral: calculation.traslados.aeropuerto_hotel_ida.costo * personas_que_pagan
      });
    }
    
    if (calculation.traslados.hotel_aeropuerto_vuelta?.costo > 0) {
      trasladosItems.push({
        description: 'Traslado Hotel → Aeropuerto (salida)',
        totalPerPerson: calculation.traslados.hotel_aeropuerto_vuelta.costo,
        totalGeneral: calculation.traslados.hotel_aeropuerto_vuelta.costo * personas_que_pagan
      });
    }
    
    // Si no hay desglose específico, mostrar como traslados generales
    if (trasladosItems.length === 0 && calculation.traslados.costo_total > 0) {
      trasladosItems.push({
        description: 'Traslados terrestres',
        details: ['Aeropuerto ↔ Hotel', 'Servicios de transporte local'],
        totalPerPerson: calculation.traslados.costo_total,
        totalGeneral: calculation.traslados.costo_total * personas_que_pagan
      });
    }
    
    if (trasladosItems.length > 0) {
      breakdown.push({
        category: 'TRASLADOS',
        items: trasladosItems
      });
    }
  }
  
  // 3. ALOJAMIENTO
  if (calculation.hotel && calculation.hotel.costo_total > 0) {
    breakdown.push({
      category: 'ALOJAMIENTO',
      items: [
        {
          description: `Hotel ${calculation.hotel.nombre || 'Por confirmar'}`,
          details: [
            `Categoría: ${calculation.hotel.categoria || 'Por confirmar'}`,
            `Acomodación: ${calculation.hotel.acomodacion || quote.acomodacion || 'Por confirmar'}`,
            `Noches: ${calculation.hotel.noches || 'Por confirmar'}`,
            `Ubicación: ${calculation.hotel.ubicacion || 'Por confirmar'}`,
            ...(calculation.hotel.observaciones ? [`Observaciones: ${calculation.hotel.observaciones}`] : [])
          ],
          totalPerPerson: calculation.hotel.costo_total,
          totalGeneral: calculation.hotel.costo_total * personas_que_pagan
        }
      ]
    });
  }
  
  // 4. ALIMENTACIÓN
  if (calculation.alimentacion && calculation.alimentacion.costo_total > 0) {
    breakdown.push({
      category: 'ALIMENTACIÓN',
      items: [
        {
          description: `Plan de alimentación`,
          details: [
            `Tipo: ${calculation.alimentacion.tipo || 'Por confirmar'}`,
            `Proveedor: ${calculation.alimentacion.proveedor || 'Hotel'}`,
            ...(calculation.alimentacion.observaciones ? [`Observaciones: ${calculation.alimentacion.observaciones}`] : [])
          ],
          totalPerPerson: calculation.alimentacion.costo_total,
          totalGeneral: calculation.alimentacion.costo_total * personas_que_pagan
        }
      ]
    });
  }
  
  // 5. EQUIPAJE
  if (calculation.equipaje && calculation.equipaje.costo_total > 0) {
    const equipajeItems = [];
    
    if (calculation.equipaje.cabina?.incluido) {
      equipajeItems.push('Equipaje de cabina incluido');
    }
    if (calculation.equipaje.bodega?.costo > 0) {
      equipajeItems.push(`Equipaje de bodega: ${formatPrice(calculation.equipaje.bodega.costo)}`);
    }
    if (calculation.equipaje.equipaje_extra?.costo > 0) {
      equipajeItems.push(`Equipaje adicional: ${formatPrice(calculation.equipaje.equipaje_extra.costo)}`);
    }
    
    breakdown.push({
      category: 'EQUIPAJE',
      items: [
        {
          description: 'Servicios de equipaje',
          details: equipajeItems,
          totalPerPerson: calculation.equipaje.costo_total,
          totalGeneral: calculation.equipaje.costo_total * personas_que_pagan
        }
      ]
    });
  }
  
  // 6. SEGUROS Y ASISTENCIA
  if (calculation.seguros && (calculation.seguros.costo_total > 0 || calculation.seguros.asistencia_medica?.costo > 0)) {
    const segurosItems = [];
    
    if (calculation.seguros.asistencia_medica?.costo > 0) {
      segurosItems.push({
        description: 'Asistencia médica de viaje',
        details: [
          `Tipo: ${calculation.seguros.asistencia_medica.tipo || 'Básica'}`,
          `Proveedor: ${calculation.seguros.asistencia_medica.proveedor || 'Por confirmar'}`,
          'Cobertura durante todo el viaje'
        ],
        totalPerPerson: calculation.seguros.asistencia_medica.costo,
        totalGeneral: calculation.seguros.asistencia_medica.costo * personas_que_pagan
      });
    }
    
    if (calculation.seguros.cancelacion?.costo > 0) {
      segurosItems.push({
        description: 'Seguro de cancelación',
        details: [
          `Proveedor: ${calculation.seguros.cancelacion.proveedor || 'Por confirmar'}`,
          'Protección contra cancelación de viaje'
        ],
        totalPerPerson: calculation.seguros.cancelacion.costo,
        totalGeneral: calculation.seguros.cancelacion.costo * personas_que_pagan
      });
    }
    
    if (segurosItems.length > 0) {
      breakdown.push({
        category: 'SEGUROS Y ASISTENCIA',
        items: segurosItems
      });
    }
  }
  
  // 7. SERVICIOS ADICIONALES
  if (calculation.extras && calculation.extras.length > 0) {
    const extrasItems = calculation.extras.map(extra => ({
      description: extra.nombre || 'Servicio adicional',
      details: [
        ...(extra.descripcion ? [`Descripción: ${extra.descripcion}`] : []),
        ...(extra.proveedor ? [`Proveedor: ${extra.proveedor}`] : []),
        `Tipo: ${extra.tipo === 'servicio_extra' ? 'Servicio extra' : 
                 extra.tipo === 'excursion' ? 'Excursión' : 
                 extra.tipo === 'actividad_basica' ? 'Actividad básica' : 'Servicio'}`
      ],
      totalPerPerson: extra.tipo === 'servicio_extra' ? extra.costo / personas_que_pagan : extra.costo,
      totalGeneral: extra.costo,
      isServiceExtra: extra.tipo === 'servicio_extra'
    }));
    
    breakdown.push({
      category: 'SERVICIOS ADICIONALES',
      items: extrasItems
    });
  }
  
  console.log("✅ generateBudgetBreakdown completado exitosamente");
  return breakdown;
} catch (error) {
  console.error("❌ Error en generateBudgetBreakdown:", error);
  // Retornar breakdown vacío en caso de error
  return [];
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


  // Bloque RESUMEN DEL VIAJE (dinámico y detallado)
  checkPageSpace(120);
  doc.rect(margin, yPosition, contentWidth, 16).fillColor(COLORS.fondoPopup).fill();
  doc.fontSize(10).fillColor('white').font('Helvetica-Bold')
     .text('RESUMEN DEL VIAJE:', margin + 8, yPosition + 4);
  yPosition += 20;

  // Datos principales del viaje
  const fechaIda = quote.fecha_ida ? formatForPDF(quote.fecha_ida) : null;
const fechaRegreso = quote.fecha_regreso ? formatForPDF(quote.fecha_regreso) : null;
  const noches = calcularNoches(quote.fecha_ida, quote.fecha_regreso);
  const dias = noches ? noches + 1 : null;
  const personas = [
    `Adultos: ${quote.adultos ?? '0'}`,
    `Menores: ${quote.menores ?? '0'}`,
    `Infantes: ${quote.infantes ?? '0'}`
  ].join(' | ');

  // Hotel
  let hotelLine = null;
  if (quote.hotel && (quote.hotel.nombre || quote.hotel.categoria || quote.hotel.acomodacion)) {
    let hotelInfo = quote.hotel.nombre ? `${quote.hotel.nombre}` : '';
    if (quote.hotel.categoria) hotelInfo += ` (${quote.hotel.categoria}`;
    if (quote.hotel.acomodacion) hotelInfo += hotelInfo.includes('(') ? `, ${quote.hotel.acomodacion}` : ` (${quote.hotel.acomodacion}`;
    if (hotelInfo.includes('(')) hotelInfo += ')';
    hotelLine = { label: 'Hotel', value: hotelInfo };
  }

  // Asistencia médica
  let asistenciaLine = null;
  if (quote.seguros && quote.seguros.asistencia_medica && quote.seguros.asistencia_medica.tipo) {
    asistenciaLine = { label: 'Incluye asistencia médica', value: quote.seguros.asistencia_medica.tipo };
  }

  // Traslados
  let trasladosLine = null;
  if (quote.traslados && (quote.traslados.aeropuerto_hotel_ida?.costo > 0 || quote.traslados.hotel_aeropuerto_vuelta?.costo > 0 || quote.traslados.costo_total > 0)) {
    let trasladosArr = [];
    if (quote.traslados.aeropuerto_hotel_ida?.costo > 0) trasladosArr.push('Aeropuerto → Hotel');
    if (quote.traslados.hotel_aeropuerto_vuelta?.costo > 0) trasladosArr.push('Hotel → Aeropuerto');
    if (trasladosArr.length === 0 && quote.traslados.costo_total > 0) trasladosArr.push('Traslados terrestres');
    trasladosLine = { label: 'Traslados incluidos', value: trasladosArr.join(', ') };
  }

  // Alimentación
  let alimentacionLine = null;
  if (quote.alimentacion && (quote.alimentacion.tipo || quote.alimentacion.detalles_tipo)) {
    alimentacionLine = { label: 'Alimentación', value: quote.alimentacion.detalles_tipo || quote.alimentacion.tipo };
  }

  // Equipaje
  let equipajeLine = null;
  if (quote.equipaje && (quote.equipaje.cabina?.incluido || quote.equipaje.bodega?.costo > 0 || quote.equipaje.equipaje_extra?.costo > 0)) {
    let equipajeArr = [];
    if (quote.equipaje.cabina?.incluido) equipajeArr.push('Cabina incluido');
    if (quote.equipaje.bodega?.costo > 0) equipajeArr.push('Bodega');
    if (quote.equipaje.equipaje_extra?.costo > 0) equipajeArr.push('Equipaje adicional');
    equipajeLine = { label: 'Equipaje', value: equipajeArr.join(', ') };
  }

  // Excursiones/Servicios adicionales
  let extrasLine = null;
  if (quote.extras && quote.extras.length > 0) {
    const extrasArr = quote.extras.map(e => e.nombre || 'Excursión');
    extrasLine = { label: 'Excursiones/Servicios adicionales', value: extrasArr.join(', ') };
  }

  // Necesidades especiales
  let necesidadesLine = null;
  if (quote.detalles_atencion_especial) {
    necesidadesLine = { label: 'Necesidades especiales', value: quote.detalles_atencion_especial };
  }

  // Construir el resumen dinámico
  const resumenViaje = [];
  if (quote.destino) {
    let destinoLabel = quote.destino;
    if (noches && dias) destinoLabel += `  (${noches} noche${noches > 1 ? 's' : ''} / ${dias} día${dias > 1 ? 's' : ''})`;
    resumenViaje.push({ label: 'Destino', value: destinoLabel });
  }
  if (quote.origen) resumenViaje.push({ label: 'Origen', value: quote.origen });
  if (fechaIda) resumenViaje.push({ label: 'Fecha ida', value: fechaIda });
  if (fechaRegreso) resumenViaje.push({ label: 'Fecha regreso', value: fechaRegreso });
  if (quote.numero_personas) resumenViaje.push({ label: 'Cantidad de pasajeros', value: quote.numero_personas });
  resumenViaje.push({ label: 'Detalle pasajeros', value: personas });
  if (hotelLine) resumenViaje.push(hotelLine);
  if (alimentacionLine) resumenViaje.push(alimentacionLine);
  if (asistenciaLine) resumenViaje.push(asistenciaLine);
  if (trasladosLine) resumenViaje.push(trasladosLine);
  if (equipajeLine) resumenViaje.push(equipajeLine);
  if (extrasLine) resumenViaje.push(extrasLine);
  if (necesidadesLine) resumenViaje.push(necesidadesLine);
  resumenViaje.push({ label: 'Precio por persona', value: formatPrice(quote.precio_por_persona) });
  resumenViaje.push({ label: 'Precio total', value: formatPrice(quote.precio_total) });

  resumenViaje.forEach(info => {
    doc.fontSize(8).fillColor(COLORS.textoOscuro).font('Helvetica-Bold')
       .text(`${info.label}:`, margin + 6, yPosition, { width: 120 })
       .fillColor(COLORS.textoGris).font('Helvetica')
       .text(info.value, margin + 130, yPosition, { width: contentWidth - 136 });
    addSpace(14);
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
  addSpace(20);

  // Desglose
  checkPageSpace(30);
  
  addSpace(25);

  const budgetBreakdown = generateBudgetBreakdown(quote);
  budgetBreakdown.forEach((category, i) => {
   let estimated = 40 + category.items.length * 30;
   checkPageSpace(estimated);

   doc.rect(margin, yPosition, contentWidth, 16).fillColor(COLORS.moradito).fill();
   doc.fontSize(10).fillColor(COLORS.fondoPopup).font('Helvetica-Bold')
     .text(`${i + 1}. ${category.category}`, margin + 8, yPosition + 4);
   addSpace(20);

   category.items.forEach(item => {
    doc.fontSize(9).fillColor(COLORS.textoOscuro).font('Helvetica-Bold')
      .text(`• ${item.description}`, margin + 10, yPosition);
    addSpace(12);

    if (item.details) {
      item.details.forEach(d => {
       doc.fontSize(8).fillColor(COLORS.textoGris).font('Helvetica')
         .text(`- ${d}`, margin + 20, yPosition);
       addSpace(10);
      });
    }

    doc.fontSize(8).fillColor(COLORS.ColorMorado).font('Helvetica-Bold')
      .text(`Por persona: ${formatPrice(item.totalPerPerson)} | Total: ${formatPrice(item.totalGeneral)}`, margin + 15, yPosition);
    addSpace(14);
   });
   addSpace(10);
  });


  // Observaciones
  checkPageSpace(60);
  doc.rect(margin, yPosition, contentWidth, 16).fillColor(COLORS.botonPopup).fill();
  doc.fontSize(10).fillColor('white').font('Helvetica-Bold')
    .text('OBSERVACIONES IMPORTANTES:', margin + 8, yPosition + 4);
  addSpace(20);
  doc.fontSize(8).fillColor(COLORS.textoGris).font('Helvetica')
    .text(quote.observaciones || 'Precios sujetos a disponibilidad. Cotización válida 48h.', margin + 6, yPosition, { width: contentWidth - 12, align: 'justify', lineGap: 2 });
  addSpace(18);

  // Contacto del asesor
  if (quote.asesor_info && quote.asesor_info.nombre_completo && quote.asesor_info.email) {
    const contacto = `Consultas: ${quote.asesor_info.nombre_completo} <${quote.asesor_info.email}>`;
    // En PDFKit, los enlaces se agregan con .link()
    doc.fontSize(8).fillColor(COLORS.textoOscuro).font('Helvetica-Bold')
      .text('Consultas:', margin + 6, yPosition, { continued: true });
    doc.fillColor(COLORS.textoGris).font('Helvetica')
      .text(` ${quote.asesor_info.nombre_completo} `, { continued: true });
    // Enlace mailto
    const emailText = `<${quote.asesor_info.email}>`;
    const emailX = doc.x;
    const emailY = yPosition;
    doc.fillColor(COLORS.ColorMorado)
      .text(emailText, { link: `mailto:${quote.asesor_info.email}`, underline: true });
    addSpace(18);
  }

  // Términos y condiciones: solo si hay espacio
  const espacioRestante = pageHeight - yPosition - 80;
  if (espacioRestante > 100) {
   doc.rect(margin, yPosition, contentWidth, 16).fillColor(COLORS.fondoPopup).fill();
   doc.fontSize(10).fillColor('white').font('Helvetica-Bold')
     .text('TÉRMINOS Y CONDICIONES', margin + 8, yPosition + 4);
   addSpace(25);

   const terminos = [
    '• Cotización válida por 48 horas.',
    '• Precios sujetos a disponibilidad.',
    '• Menores 2 años no pagan .',
    '• Documentación vigente requerida.'
   ];
   terminos.forEach(t => {
    doc.fontSize(8).fillColor(COLORS.textoGris).font('Helvetica')
      .text(t, margin + 10, yPosition, { width: contentWidth - 20 });
    addSpace(14);
   });
  } else {
   doc.fontSize(8).fillColor(COLORS.textoGris).font('Helvetica-Bold')
     .text('Términos básicos: Cotización válida 48h. Precios sujetos a disponibilidad.', margin, yPosition, { width: contentWidth, align: 'justify' });
  }

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
