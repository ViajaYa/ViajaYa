const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ✅ Función auxiliar para obtener datos de cálculo desde el quote
function getCalculationData(quote) {
  // Si hay calculation directamente en quote, usarla
  if (quote.calculation) {
    return quote.calculation;
  }
  
  // Si no, construir desde los datos de quote (para compatibilidad)
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

// ✅ Función auxiliar para formatear precios en COP
function formatPrice(price) {
  if (!price || price === 0) return '$0';
  return `$${Number(price).toLocaleString('es-CO')}`;
}

// ✅ Función auxiliar para generar desglose detallado de presupuesto
function generateBudgetBreakdown(quote) {
  const calculation = getCalculationData(quote);
  const personas_que_pagan = quote.personas_que_pagan || 1;
  
  let breakdown = [];
  
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
            `Fecha ida: ${calculation.tiquetes.fecha_ida ? new Date(calculation.tiquetes.fecha_ida).toLocaleDateString('es-ES') : 'Por confirmar'}`,
            `Fecha vuelta: ${calculation.tiquetes.fecha_vuelta ? new Date(calculation.tiquetes.fecha_vuelta).toLocaleDateString('es-ES') : 'Por confirmar'}`
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
  
  return breakdown;
}

// 🎨 Colores de la marca ViajaYa
const COLORS = {
  MoradoSuave: "#dc86c7",
  moradito: "#cdb2d5", 
  botonPopup: "#573b58",
  fondoPopup: "#421261",
  ColorMorado: "#b85aa1",
  ColorAzul: "#2be0e9",
  textoSecundario: "#666666",
  textoOscuro: "#1f2937",
  textoGris: "#374151",
  separador: "#e5e7eb",
  textoClaro: "#9ca3af"
};

// ✅ Asegurar que el directorio de PDFs existe
const ensurePDFDirectory = () => {
  const pdfDir = path.join(__dirname, '../../uploads/pdfs');
  if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
  }
  return pdfDir;
};

// ✅ Función auxiliar para calcular noches
function calcularNoches(fechaIda, fechaRegreso) {
  const ida = new Date(fechaIda);
  const regreso = new Date(fechaRegreso);
  const diferencia = regreso.getTime() - ida.getTime();
  const noches = Math.ceil(diferencia / (1000 * 3600 * 24));
  return noches;
}

// ✅ Función para controlar espaciado y evitar páginas innecesarias
const checkNewPage = (doc, yPosition, requiredHeight, pageHeight, margin) => {
  // Si no hay suficiente espacio para el contenido, ajustar posición
  if (yPosition + requiredHeight > pageHeight - 80) {
    // Si está muy cerca del final, comprimir el espaciado
    return Math.min(yPosition, pageHeight - requiredHeight - 50);
  }
  return yPosition;
};

// ✅ Función para verificar si necesitamos comprimir espaciado
const needsCompression = (yPosition, pageHeight) => {
  return yPosition > pageHeight * 0.7; // Si estamos en el 70% de la página
};

// ✅ Generar PDF de cotización con el formato detallado de Viaja Ya
const generateQuotePDF = async (quote, saveToFile = true) => {
  try {
    console.log('🔄 Generando PDF detallado para cotización:', quote.id);
    
    // Crear el documento PDF con más espacio
    const doc = new PDFDocument({ 
      margin: 25,
      size: 'A4'
    });

    let yPosition = 20;
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 25;
    const contentWidth = pageWidth - 2 * margin;

    // Si se debe guardar como archivo
    let stream;
    if (saveToFile) {
      const pdfDir = ensurePDFDirectory();
      const filename = `cotizacion-${quote.quote_number || quote.id}.pdf`;
      const filepath = path.join(pdfDir, filename);
      stream = fs.createWriteStream(filepath);
      doc.pipe(stream);
    }

    // ✅ FUNCIÓN PARA VERIFICAR ESPACIO Y CREAR NUEVA PÁGINA
    const checkPageSpace = (requiredSpace) => {
      if (yPosition + requiredSpace > pageHeight - 80) {
        doc.addPage();
        yPosition = 40;
        return true;
      }
      return false;
    };

    // ✅ FUNCIÓN PARA AÑADIR ESPACIO CONTROLADO
    const addSpace = (space) => {
      yPosition += space;
    };

    // ✅ FUNCIÓN PARA VERIFICAR SI NECESITAMOS COMPRIMIR
    const shouldCompress = () => {
      return yPosition > pageHeight * 0.75;
    };

    // ✅ HEADER CON LOGO Y FONDO
    doc.rect(0, 0, pageWidth, 70)
       .fillColor(COLORS.fondoPopup)
       .fill();

    // Intentar cargar el logo
    try {
      const logoPath = path.join(__dirname, '../assets/logo2.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, margin, 8, { width: 40, height: 40 });
      }
    } catch (error) {
      console.log('⚠️ No se pudo cargar el logo:', error.message);
    }

    // Información de contacto del header
    doc.fontSize(11)
       .fillColor('white')
       .font('Helvetica-Bold')
       .text('VIAJA YA', margin + 50, 12)
       .fontSize(8)
       .font('Helvetica')
       .text('Hacemos realidad tus sueños de viaje', margin + 50, 25)
       .text('info@viajaya.com | +57 300 123 4567', margin + 50, 37)
       .text('Bogotá, Colombia', margin + 50, 49);

    // Número de cotización
    doc.fontSize(12)
       .fillColor(COLORS.ColorAzul)
       .font('Helvetica-Bold')
       .text(`Cotización: ${quote.quote_number || quote.id}`, pageWidth - 180, 15, { width: 150, align: 'right' })
       .fontSize(8)
       .fillColor('white')
       .font('Helvetica')
       .text('Instagram: @viajaya_pagina_oficial', pageWidth - 180, 30, { width: 150, align: 'right' });

    yPosition = 80;

    // ✅ DESTINO PRINCIPAL
    doc.rect(margin, yPosition, contentWidth, 32)
       .fillColor(COLORS.MoradoSuave)
       .fill();
    
    doc.fontSize(18)
       .fillColor('white')
       .font('Helvetica-Bold')
       .text(`VIAJE A ${quote.destino.toUpperCase()}`, margin + 10, yPosition + 8, { 
         align: 'center',
         width: contentWidth - 20
       });
    
    yPosition += 42;

    // ✅ INFORMACIÓN DEL CLIENTE
    checkPageSpace(60);
    
    doc.rect(margin, yPosition, contentWidth, 16)
       .fillColor(COLORS.botonPopup)
       .fill();
    
    doc.fontSize(10)
       .fillColor('white')
       .font('Helvetica-Bold')
       .text('INFORMACIÓN DEL CLIENTE:', margin + 8, yPosition + 4);
    
    yPosition += 20;

    const clienteInfo = [
      { label: 'Cliente', value: quote.nombre_cliente || 'No especificado' },
      { label: 'Email', value: quote.email_cliente || 'No especificado' },
      { label: 'Teléfono', value: quote.telefono_cliente || 'No especificado' },
      { label: 'Fecha de viaje', value: `${new Date(quote.fecha_ida || quote.fecha_viaje_inicio).toLocaleDateString('es-ES')} al ${new Date(quote.fecha_regreso || quote.fecha_viaje_fin).toLocaleDateString('es-ES')}` },
      { label: 'Destino', value: `${quote.origen || 'Colombia'} → ${quote.destino}` },
      { label: 'Tipo de viaje', value: quote.trip_type === 'nacional' ? 'Nacional' : 'Internacional' }
    ];

    doc.fontSize(8)
       .fillColor(COLORS.textoGris)
       .font('Helvetica');

    clienteInfo.forEach(info => {
      doc.fillColor(COLORS.textoOscuro)
         .font('Helvetica-Bold')
         .text(`${info.label}:`, margin + 6, yPosition, { width: 70 })
         .fillColor(COLORS.textoGris)
         .font('Helvetica')
         .text(info.value, margin + 80, yPosition, { width: contentWidth - 86 });
      yPosition += shouldCompress() ? 8 : 10;
    });

    addSpace(shouldCompress() ? 6 : 10);

    // ✅ INFORMACIÓN DE PASAJEROS
    checkPageSpace(80);
    
    doc.rect(margin, yPosition, contentWidth, 16)
       .fillColor(COLORS.ColorMorado)
       .fill();
    
    doc.fontSize(10)
       .fillColor('white')
       .font('Helvetica-Bold')
       .text('INFORMACIÓN DE PASAJEROS:', margin + 8, yPosition + 4);
    
    yPosition += 20;

    const adultos = quote.adultos || 0;
    const menores = quote.menores || 0;
    const infantes = quote.infantes || 0;
    const edades_menores = quote.edades_menores || [];
    const edades_infantes = quote.edades_infantes || [];
    const personas_especiales = quote.personas_atencion_especial || 0;

    const passengerInfo = [
      { label: 'Total de pasajeros', value: quote.numero_personas?.toString() || '0', isBold: true },
      { label: 'Adultos (14+ años)', value: adultos.toString() },
      { 
        label: `Menores (2-14 años)`, 
        value: menores > 0 ? `${menores}${edades_menores.length > 0 ? ` (${edades_menores.join(', ')} años)` : ''}` : '0'
      },
      { 
        label: `Infantes (<2 años)`, 
        value: infantes > 0 ? `${infantes}${edades_infantes.length > 0 ? ` (${edades_infantes.join(', ')} meses)` : ''}` : '0'
      },
      { label: 'Personas que pagan', value: quote.personas_que_pagan?.toString() || (adultos + menores).toString(), isBold: true }
    ];

    if (personas_especiales > 0) {
      passengerInfo.push({ 
        label: 'Atención especial', 
        value: `${personas_especiales} - ${quote.detalles_atencion_especial || 'Sin detalles'}`
      });
    }

    passengerInfo.forEach(info => {
      const fontWeight = info.isBold ? 'Helvetica-Bold' : 'Helvetica-Bold';
      const valueFont = info.isBold ? 'Helvetica-Bold' : 'Helvetica';
      const textColor = info.isBold ? COLORS.textoOscuro : COLORS.textoOscuro;
      const valueColor = info.isBold ? COLORS.ColorMorado : COLORS.textoGris;
      
      doc.fillColor(textColor)
         .font(fontWeight)
         .text(`${info.label}:`, margin + 6, yPosition, { width: 100 })
         .fillColor(valueColor)
         .font(valueFont)
         .text(info.value, margin + 110, yPosition, { width: contentWidth - 116 });
      yPosition += shouldCompress() ? 8 : 10;
    });

    addSpace(shouldCompress() ? 8 : 12);

    // ✅ RESUMEN DE PRECIOS (DESTACADO)
    checkPageSpace(50);
    
    doc.rect(margin, yPosition, contentWidth, 40)
       .fillColor(COLORS.ColorAzul)
       .fill();

    doc.fontSize(14)
       .fillColor('white')
       .font('Helvetica-Bold')
       .text(`PRECIO POR PERSONA: ${formatPrice(quote.precio_por_persona)}`, margin + 10, yPosition + 8, { align: 'center', width: contentWidth - 20 })
       .fontSize(12)
       .text(`PRECIO TOTAL: ${formatPrice(quote.precio_total)}`, margin + 10, yPosition + 24, { align: 'center', width: contentWidth - 20 });
    
    addSpace(shouldCompress() ? 8 : 12);

    // ✅ DESGLOSE DETALLADO DEL PRESUPUESTO
    checkPageSpace(30);
    
    doc.rect(margin, yPosition, contentWidth, 18)
       .fillColor(COLORS.fondoPopup)
       .fill();
    
    doc.fontSize(12)
       .fillColor('white')
       .font('Helvetica-Bold')
       .text('DESGLOSE DETALLADO DEL PRESUPUESTO:', margin + 8, yPosition + 4);
    
    addSpace(shouldCompress() ? 15 : 25);

    // Obtener el desglose detallado
    const budgetBreakdown = generateBudgetBreakdown(quote);

    // Renderizar cada categoría con espaciado optimizado
    budgetBreakdown.forEach((category, categoryIndex) => {
      // Calcular espacio necesario de forma más precisa
      let estimatedCategorySpace = 25; // Header de categoría
      category.items.forEach(item => {
        estimatedCategorySpace += 15; // Descripción
        if (item.details) estimatedCategorySpace += item.details.length * 10; // Detalles
        estimatedCategorySpace += 12; // Precios
      });
      estimatedCategorySpace += 8; // Espacio entre categorías
      
      checkPageSpace(estimatedCategorySpace);

      // Título de la categoría
      doc.rect(margin, yPosition, contentWidth, 16)
         .fillColor(COLORS.moradito)
         .fill();
      
      doc.fontSize(10)
         .fillColor(COLORS.fondoPopup)
         .font('Helvetica-Bold')
         .text(`${categoryIndex + 1}. ${category.category}`, margin + 8, yPosition + 4);
      
      addSpace(20);

      // Items de la categoría
      category.items.forEach((item, itemIndex) => {
        // Descripción del item
        doc.fontSize(9)
           .fillColor(COLORS.textoOscuro)
           .font('Helvetica-Bold')
           .text(`• ${item.description}`, margin + 10, yPosition);
        
        addSpace(shouldCompress() ? 10 : 12);

        // Detalles del item (si existen)
        if (item.details && item.details.length > 0) {
          item.details.forEach(detail => {
            doc.fontSize(8)
               .fillColor(COLORS.textoGris)
               .font('Helvetica')
               .text(`  - ${detail}`, margin + 15, yPosition);
            addSpace(shouldCompress() ? 8 : 9);
          });
        }

        // Precios
        if (item.isServiceExtra) {
          doc.fontSize(8)
             .fillColor(COLORS.ColorMorado)
             .font('Helvetica-Bold')
             .text(`Costo total: ${formatPrice(item.totalGeneral)} (${formatPrice(item.totalPerPerson)} por persona)`, margin + 15, yPosition);
        } else {
          doc.fontSize(8)
             .fillColor(COLORS.ColorMorado)
             .font('Helvetica-Bold')
             .text(`Por persona: ${formatPrice(item.totalPerPerson)} | Total: ${formatPrice(item.totalGeneral)}`, margin + 15, yPosition);
        }
        
        addSpace(shouldCompress() ? 10 : 12);
      });

      addSpace(shouldCompress() ? 6 : 8); // Espacio entre categorías
    });

    // ✅ OBSERVACIONES IMPORTANTES
    checkPageSpace(50);
    
    doc.rect(margin, yPosition, contentWidth, 16)
       .fillColor(COLORS.botonPopup)
       .fill();
    
    doc.fontSize(10)
       .fillColor('white')
       .font('Helvetica-Bold')
       .text('OBSERVACIONES IMPORTANTES:', margin + 8, yPosition + 4);
    
    addSpace(20);

    const observacionesTexto = quote.observaciones && quote.observaciones.trim() 
      ? quote.observaciones 
      : 'Esta cotización incluye todos los servicios detallados anteriormente. Los precios están sujetos a disponibilidad al momento de la reserva.';

    doc.fontSize(8)
       .fillColor(COLORS.textoGris)
       .font('Helvetica')
       .text(observacionesTexto, margin + 6, yPosition, { 
         width: contentWidth - 12,
         align: 'justify',
         lineGap: 1
       });

    addSpace(shouldCompress() ? 25 : 35);

    // ✅ INFORMACIÓN DEL RESPONSABLE
    const responsable = quote.Asesor || quote.Lider || quote.Gerente || quote.Admin || quote.Owner;

    if (responsable) {
      checkPageSpace(40);
      
      doc.rect(margin, yPosition, contentWidth, 25)
         .fillColor(COLORS.fondoPopup)
         .fill();
      
      doc.fontSize(9)
         .fillColor('white')
         .font('Helvetica-Bold')
         .text('TU ASESOR DE CONFIANZA:', margin + 8, yPosition + 3);
      
      addSpace(15);
      
      // Determinar el tipo de responsable
      let tipoResponsable = 'Asesor';
      if (quote.Lider && !quote.Asesor) tipoResponsable = 'Líder';
      if (quote.Gerente && !quote.Asesor && !quote.Lider) tipoResponsable = 'Gerente';
      if (quote.Admin && !quote.Asesor && !quote.Lider && !quote.Gerente) tipoResponsable = 'Administrador';
      if (quote.Owner && !quote.Asesor && !quote.Lider && !quote.Gerente && !quote.Admin) tipoResponsable = 'Director';
      
      doc.fontSize(8)
         .fillColor(COLORS.ColorAzul)
         .font('Helvetica-Bold')
         .text(`${responsable.name} ${responsable.lastname} - ${tipoResponsable}`, margin + 8, yPosition)
         .fontSize(7)
         .fillColor('white')
         .font('Helvetica')
         .text(`${responsable.email}`, margin + 8, yPosition + 8);

      addSpace(25);
    }

    // ✅ TÉRMINOS Y CONDICIONES - Solo si hay espacio, sino omitir la página extra
    const espacioRestante = pageHeight - yPosition - 100;
    
    if (espacioRestante < 120) {
      // Si no hay suficiente espacio, agregar términos básicos en el footer sin nueva página
      addSpace(10);
      
      doc.fontSize(8)
         .fillColor(COLORS.textoGris)
         .font('Helvetica-Bold')
         .text('Términos básicos:', margin, yPosition);
      
      addSpace(12);
      
      doc.fontSize(7)
         .fillColor(COLORS.textoGris)
         .font('Helvetica')
         .text('• Cotización válida por 48 horas • Precios sujetos a disponibilidad • Documentación vigente requerida', 
               margin, yPosition, { width: contentWidth, lineGap: 1 });
    } else {
      // Si hay espacio, agregar términos completos en la misma página
      addSpace(15);
      
      doc.rect(margin, yPosition, contentWidth, 16)
         .fillColor(COLORS.fondoPopup)
         .fill();
      
      doc.fontSize(10)
         .fillColor('white')
         .font('Helvetica-Bold')
         .text('TÉRMINOS Y CONDICIONES', margin + 8, yPosition + 4);

      addSpace(25);

      const terminos = [
        '• Esta cotización es válida por 48 horas a partir de la fecha de emisión.',
        '• Los precios están sujetos a disponibilidad al momento de la reserva.',
        '• Los infantes menores de 2 años no pagan servicios terrestres.',
        '• Se requiere documentación vigente para viajar (pasaporte, cédula, etc.).'
      ];

      doc.fontSize(7)
         .fillColor(COLORS.textoGris)
         .font('Helvetica');

      terminos.forEach(termino => {
        doc.text(termino, margin + 6, yPosition, { 
          width: contentWidth - 12
        });
        addSpace(8);
      });
    }

    // ✅ FOOTER COMPACTO EN LA PARTE INFERIOR
    const footerY = pageHeight - 50;
    
    // Verificar si tenemos espacio para el footer
    if (yPosition < footerY - 10) {
      yPosition = footerY;
    }

    doc.rect(0, yPosition - 3, pageWidth, 53)
       .fillColor(COLORS.fondoPopup)
       .fill();

    doc.fontSize(9)
       .fillColor(COLORS.ColorAzul)
       .font('Helvetica-Bold')
       .text('VIAJA YA - Hacemos realidad tus sueños de viaje', 
             margin, yPosition + 2, { align: 'center', width: contentWidth });

    doc.fontSize(7)
       .fillColor('white')
       .font('Helvetica')
       .text('info@viajaya.com | +57 300 123 4567 | Bogotá, Colombia', 
             margin, yPosition + 14, { align: 'center', width: contentWidth })
       .text('Instagram: @viajaya_pagina_oficial', 
             margin, yPosition + 24, { align: 'center', width: contentWidth })
       .text('Esta cotización es válida por 48 horas desde la fecha de emisión.', 
             margin, yPosition + 36, { align: 'center', width: contentWidth });

    // Finalizar el documento
    doc.end();

    if (saveToFile) {
      // ✅ Esperar a que se complete la escritura
      await new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
      });
      
      const pdfDir = ensurePDFDirectory();
      const filename = `cotizacion-${quote.quote_number || quote.id}.pdf`;
      const filepath = path.join(pdfDir, filename);

      console.log('✅ PDF detallado generado exitosamente:', filepath);
      
      return {
        filepath,
        filename,
        relativePath: `uploads/pdfs/${filename}`,
        buffer: fs.readFileSync(filepath)
      };
    } else {
      // Para vista previa, retornar solo el buffer
      return new Promise((resolve, reject) => {
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve({
            buffer: pdfBuffer,
            filename: `cotizacion-${quote.quote_number || quote.id}.pdf`
          });
        });
        doc.on('error', reject);
      });
    }
    
  } catch (error) {
    console.error('❌ Error generando PDF detallado:', error);
    throw new Error(`Error generando PDF: ${error.message}`);
  }
};

module.exports = {
  generateQuotePDF,
  ensurePDFDirectory,
  calcularNoches
};
