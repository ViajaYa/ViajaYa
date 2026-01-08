const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { generatePassengerSummary } = require('./passengerValidation');
const { calcularPersonasQuePagan } = require('./quoteCalculations'); // ✅ AGREGAR
const { formatForPDF } = require('./dateUtils'); // ✅ AGREGAR utilidades de fecha

// ✅ Función auxiliar para generar desglose detallado de pasajeros
function generatePassengerBreakdown(contractData) {
  const quote = contractData.Quote || contractData;
  
  // Datos detallados de pasajeros (nuevo formato)
  const adultos = quote.adultos || 0;
  const menores = quote.menores || 0;
  const infantes = quote.infantes || 0;
  const edades_menores = quote.edades_menores || [];
  const edades_infantes = quote.edades_infantes || [];
  const personas_especiales = quote.personas_atencion_especial || 0;
  
  // Datos legacy para compatibilidad
  const numero_personas = quote.numero_personas || (adultos + menores + infantes);
  const ninos_legacy = quote.ninos || 0;
  
  let breakdown = [];
  
  // Si tenemos datos detallados, usarlos
  if (adultos > 0 || menores > 0 || infantes > 0) {
    if (adultos > 0) {
      breakdown.push({
        label: 'Adultos (14+ años):',
        value: adultos.toString()
      });
    }
    
    if (menores > 0) {
      const edadesTexto = edades_menores.length > 0 
        ? ` (${edades_menores.join(', ')} años)` 
        : '';
      breakdown.push({
        label: `Menores (2-14 años)${edadesTexto}:`,
        value: menores.toString()
      });
    }
    
    if (infantes > 0) {
      const edadesTexto = edades_infantes.length > 0 
        ? ` (${edades_infantes.join(', ')} meses)` 
        : '';
      breakdown.push({
        label: `Infantes (<2 años)${edadesTexto}:`,
        value: infantes.toString()
      });
    }
    
    if (personas_especiales > 0) {
      breakdown.push({
        label: 'Atención especial:',
        value: personas_especiales.toString()
      });
    }
    
    breakdown.push({
      label: 'TOTAL PASAJEROS:',
      value: numero_personas.toString(),
      isBold: true
    });
  } else {
    // Formato legacy
    breakdown.push({
      label: 'Cantidad de Pasajeros:',
      value: numero_personas.toString()
    });
    
    if (ninos_legacy > 0) {
      breakdown.push({
        label: 'Niños:',
        value: ninos_legacy.toString()
      });
    }
  }
  
  return breakdown;
}

// 🎨 Paleta de colores profesional para el contrato
const COLORS = {
  primary: "#1e40af",        // Azul principal
  secondary: "#3b82f6",      // Azul secundario  
  accent: "#f59e0b",         // Naranja/dorado para destacar
  text: "#1f2937",           // Gris oscuro para texto
  textLight: "#6b7280",      // Gris claro para texto secundario
  background: "#f8fafc",     // Fondo suave
  border: "#e5e7eb",         // Bordes suaves
  success: "#10b981",        // Verde para elementos positivos
  white: "#ffffff"
};

// ✅ Asegurar que el directorio de PDFs existe
const ensurePDFDirectory = () => {
  const pdfDir = path.join(__dirname, '../../uploads/pdfs');
  if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
  }
  return pdfDir;
};

// ✅ Función para formatear fechas en español - CORREGIDO para manejar fechas-only sin zona horaria
const formatearFecha = (fecha) => {
  if (!fecha) return 'Fecha no disponible';
  
  try {
    // ✅ DETECTAR si es un Date object o string con hora exactamente a medianoche UTC
    let isDateOnlyFormat = false;
    let dateISOString = '';
    
    if (typeof fecha === 'object' && fecha instanceof Date) {
      // ✅ CONVERTIR Date object a ISO string para análisis
      dateISOString = fecha.toISOString();
      
      // ✅ VERIFICAR si termina en T00:00:00.000Z (indica fecha-only)
      isDateOnlyFormat = dateISOString.endsWith('T00:00:00.000Z');
    } else if (typeof fecha === 'string') {
      // ✅ CASO STRING: verificar directamente
      dateISOString = fecha;
      isDateOnlyFormat = /^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/.test(fecha);
    }
    
    if (isDateOnlyFormat && dateISOString) {
      // Es una fecha "solo fecha" almacenada como timestamp UTC a medianoche
      // Extraer solo la parte de fecha (YYYY-MM-DD) y tratarla como fecha local
      const dateOnly = dateISOString.substring(0, 10); // "2025-10-01"
      const [year, month, day] = dateOnly.split('-');
      
      // Crear fecha local sin conversión de timezone
      const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      // Formatear directamente con JavaScript nativo
      return localDate.toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    // Para otros formatos, usar el sistema existente
    return formatForPDF(fecha);
  } catch (error) {
    console.error('Error formateando fecha en PDF:', error);
    return 'Error en fecha';
  }
};

// ✅ Función para formatear moneda colombiana
const formatearMoneda = (monto) => {
  return `$${Math.round(monto).toLocaleString('es-CO')}`;
};

// ✅ Función para convertir número a letras (simplificada)
const numeroALetras = (numero) => {
  const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const especiales = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const decenas = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];
  
  if (numero === 0) return 'CERO';
  if (numero >= 1000000) return 'UN MILLÓN O MÁS';
  
  let resultado = '';
  
  // Miles
  if (numero >= 1000) {
    const miles = Math.floor(numero / 1000);
    if (miles === 1) {
      resultado += 'MIL ';
    } else if (miles < 10) {
      resultado += unidades[miles] + ' MIL ';
    } else {
      resultado += numeroALetras(miles) + ' MIL ';
    }
    numero = numero % 1000;
  }
  
  // Centenas
  if (numero >= 100) {
    if (numero === 100) {
      resultado += 'CIEN ';
    } else {
      resultado += centenas[Math.floor(numero / 100)] + ' ';
    }
    numero = numero % 100;
  }
  
  // Decenas y unidades
  if (numero >= 20) {
    resultado += decenas[Math.floor(numero / 10)];
    if (numero % 10 > 0) {
      resultado += ' Y ' + unidades[numero % 10];
    }
  } else if (numero >= 10) {
    resultado += especiales[numero - 10];
  } else if (numero > 0) {
    resultado += unidades[numero];
  }
  
  return resultado.trim();
};

// ✅ Función para crear header del contrato (basado en el modelo)
const createContractHeader = (doc) => {
  const pageWidth = doc.page.width;
  const margin = 25; // Mismo margen que cotización
  const headerHeight = 70; // Mismo alto que cotización
  
  // ✅ Fondo azul (usar mismo color que cotización)
  doc.rect(0, 0, pageWidth, headerHeight)
     .fillColor('#5475A8') // ColorAzul2 del PDF de cotización
     .fill();

  // ✅ Logo a la izquierda (misma lógica que cotización)
  let logoBottom = 6;
  const logoCandidates = [
    path.join(__dirname, '../assets/logoNuevo.png'), 
    path.join(__dirname, '../assets/NuevoLogo.png'),
    path.join(__dirname, '../assets/logo2.png')
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

  // ✅ Datos empresa debajo del logo (mismo estilo que cotización)
  doc.fontSize(13)
     .fillColor('white')
     .font('Helvetica-Bold')
     .text('VIAJA YA', margin + 55, 14)
     .fontSize(8)
     .font('Helvetica')
     .text('Hacemos realidad tus sueños de viaje', margin + 55, 28)
     .text('info@viajaya.com | +57 320 492 44 44', margin + 55, 40)
     .text('Bogotá, Colombia', margin + 55, 52);

  // ✅ Número de contrato a la derecha (mismo estilo que cotización)
  if (doc._currentContractNumber) {
    doc.fontSize(12).fillColor('white').font('Helvetica-Bold')
      .text(`Contrato: ${doc._currentContractNumber}`, pageWidth - 180, 15, { width: 150, align: 'right' });
  }

  return headerHeight + 20; // Retornar posición Y después del header
};

// ✅ Función para crear footer en todas las páginas
const createContractFooter = (doc) => {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const footerHeight = 35;
  const footerY = pageHeight - footerHeight;
  
  // Rectángulo de footer con color corporativo
  doc.rect(0, footerY, pageWidth, footerHeight)
     .fillColor('#5475A8') // Mismo color que el header
     .fill();
  
  // Línea decorativa superior
  doc.rect(0, footerY - 1, pageWidth, 1)
     .fillColor('#7b2cbf') // Morado corporativo
     .fill();
  
  // Información de contacto - línea 1
  doc.fontSize(6)
     .fillColor('#ffffff')
     .font('Helvetica-Bold')
     .text('NIT: 1032406128 | RNT: 122035 | Tel: 320 492 44 44 | Email: info@viajaya.com', 
           20, footerY + 6, {
             width: pageWidth - 40,
             align: 'center'
           });
  
  // Información de contacto - línea 2
  doc.fontSize(6)
     .font('Helvetica')
     .text('Oficina: CC Sunrise local 15', 
           20, footerY + 18, {
             width: pageWidth - 40,
             align: 'center'
           });
  
  return footerY; // Retornar posición Y del footer para límite de contenido
};

// ✅ Función para crear título del contrato con espaciado mejorado
const createContractTitle = (doc, yPos) => {
  const margin = 25;
  const pageWidth = doc.page.width;
  const contentWidth = pageWidth - 2 * margin;
  
  // Agregar espacio inicial
  yPos += 15;
  
  // ✅ Título principal con fondo (usando colores de cotización)
  doc.rect(margin, yPos, contentWidth, 32) // Reducido de 35 a 32
     .fillColor('#dc86c7') // MoradoSuave del PDF de cotización
     .fill();
  
  doc.fontSize(14) // Reducido de 16 a 14
     .fillColor('white')
     .font('Helvetica-Bold')
     .text('CONTRATO DE PRESTACIÓN DE SERVICIOS Y/O PRODUCTOS TURÍSTICOS', 
           margin + 10, yPos + 9, { // Ajustado centrado vertical
             width: contentWidth - 20,
             align: 'center'
           });
  
  yPos += 45; // Reducido de 50 a 45
  
  // ✅ Subtítulo
  doc.rect(margin, yPos, contentWidth, 28) // Más alto
     .fillColor('#421261') // fondoPopup del PDF de cotización
     .fill();
  
  doc.fontSize(12)
     .fillColor('white')
     .font('Helvetica-Bold')
     .text('OPERADOR TURÍSTICO Y AGENCIA DE VIAJES VIAJA YA RNT 256357', 
           margin + 10, yPos + 8, { // Mejor centrado vertical
             width: contentWidth - 20,
             align: 'center'
           });
  
  return yPos + 45; // Más espacio después del subtítulo
};

// ✅ Función para crear cláusulas del contrato con espaciado corregido
const createContractClauses = (doc, contractData, yPos) => {
  const margin = 25;
  const pageWidth = doc.page.width;
  const contentWidth = pageWidth - 2 * margin;
  
  // ✅ Función helper para verificar espacio en página
  const checkPageSpace = (requiredSpace) => {
    if (yPos + requiredSpace > doc.page.height - 80) {
      doc.addPage();
      // Agregar header en nueva página
      const headerHeight = createContractHeader(doc);
      doc._currentContractNumber = contractData.contract_number; // Asegurar número en header
      yPos = headerHeight + 30; // Más espacio después del header
      return true;
    }
    return false;
  };

  // Agregar espacio inicial
  yPos += 20;
  
  checkPageSpace(200); // Más espacio requerido

  // ✅ CLÁUSULA PRIMERA con header colorido
  doc.rect(margin, yPos, contentWidth, 25) // Header más alto
     .fillColor('#573b58') // botonPopup del PDF de cotización
     .fill();
  
  doc.fontSize(11)
     .fillColor('white')
     .font('Helvetica-Bold')
     .text('CLÁUSULA PRIMERA. PARTES:', margin + 8, yPos + 7); // Centrado verticalmente
  
  yPos += 40; // Más espacio después del header
  
  // ✅ Contenido de la cláusula primera con mejor formato
  const clausulaPrimera = `El presente contrato será suscrito entre GABRIELA MATEUS HENAO Identificado con número de cedula ciudadanía No 1070326574 quien funciona bajo el nombre comercial “OPERADOR TURISTICO VIAJA YA BOGOTA”, con domicilio en Restrepo, Meta, en la Oficina Principal Centro Comercial Sunrise Local 102 Restrepo, Meta, con NIT 1070326574 y Registro Nacional de Turismo N° 256357, que en adelante será denominado VENDEDOR. Por otra parte, el COMPRADOR, quien se encuentra debidamente identificado en los datos de la Reserva y en el capítulo correspondiente del presente contrato.`;
  
  doc.fontSize(9)
     .fillColor('#1f2937') // textoOscuro del PDF de cotización
     .font('Helvetica')
     .text(clausulaPrimera, margin + 5, yPos, {
       width: contentWidth - 10,
       align: 'justify',
       lineGap: 4 // Más espacio entre líneas
     });
  
  yPos += 110; // Más espacio después del texto
  
  checkPageSpace(140);
  
  // ✅ PARÁGRAFO PRIMERO con header colorido
  doc.rect(margin, yPos, contentWidth, 25) // Header más alto
     .fillColor('#b85aa1') // ColorMorado del PDF de cotización
     .fill();
  
  doc.fontSize(10)
     .fillColor('white')
     .font('Helvetica-Bold')
     .text('PARÁGRAFO PRIMERO: EL OPERADOR TURÍSTICO Y AGENCIA DE VIAJES – VIAJAYA', margin + 8, yPos + 7);
  
  yPos += 40; // Más espacio después del header
  
  const paragrafo = `es una agencia de viajes y turismo dedicada a la comercialización y venta de productos y servicios turísticos, entre otros, conforme se señala en el Certificado de Existencia y Representación Legal, y en el Registro Nacional de Turismo RNT regulado por FONTUR.`;
  
  doc.fontSize(9)
     .fillColor('#1f2937')
     .font('Helvetica')
     .text(paragrafo, margin + 5, yPos, {
       width: contentWidth - 10,
       align: 'justify',
       lineGap: 4
     });
  
  yPos += 70; // Más espacio después del texto
  
  checkPageSpace(140);
  
  // ✅ CLÁUSULA SEGUNDA con header colorido
  doc.rect(margin, yPos, contentWidth, 25) // Header más alto
     .fillColor('#573b58') // botonPopup del PDF de cotización
     .fill();
  
  doc.fontSize(11)
     .fillColor('white')
     .font('Helvetica-Bold')
     .text('CLÁUSULA SEGUNDA. OBJETO:', margin + 8, yPos + 7);
  
  yPos += 40; // Más espacio después del header
  
  const clausulaSegunda = `EL COMPRADOR a través de este contrato acuerda con EL VENDEDOR la compra de un paquete turístico a cambio de un precio y conforme a las especificaciones que a continuación se detallan:`;
  
  doc.fontSize(9)
     .fillColor('#1f2937')
     .font('Helvetica')
     .text(clausulaSegunda, margin + 5, yPos, {
       width: contentWidth - 10,
       align: 'justify',
       lineGap: 4
     });
  
  return yPos + 80; // Más espacio al final
};

// ✅ Función helper para agregar líneas divisorias
const addSectionDivider = (doc, yPos, margin, contentWidth, style = 'solid') => {
  if (style === 'solid') {
    // Línea sólida
    doc.strokeColor('#7b2cbf')
       .lineWidth(1)
       .moveTo(margin + 10, yPos)
       .lineTo(margin + contentWidth - 10, yPos)
       .stroke();
  } else if (style === 'dashed') {
    // Línea punteada
    doc.strokeColor('#b85aa1')
       .lineWidth(1)
       .dash(3, 2)
       .moveTo(margin + 10, yPos)
       .lineTo(margin + contentWidth - 10, yPos)
       .stroke()
       .undash();
  } else if (style === 'thick') {
    // Línea gruesa
    doc.strokeColor('#573b58')
       .lineWidth(2)
       .moveTo(margin + 5, yPos)
       .lineTo(margin + contentWidth - 5, yPos)
       .stroke();
  }
  
  return yPos + 15; // Espacio después de la línea
};

// ✅ Función para crear sección de reserva (página 2)
const createReservaSection = (doc, contractData) => {
  doc.addPage();
  
  // Header colorido en página 2
  createContractHeader(doc);
  
  const margin = 40;
  const pageWidth = doc.page.width;
  const contentWidth = pageWidth - 2 * margin;
  let yPos = 120;
  
  // Crear el cuadro de información de reserva
  const boxHeight = 480; // Aumentado para incluir los nuevos headers
  const boxY = yPos;
  
  // Fondo del cuadro
  doc.rect(margin, boxY, contentWidth, boxHeight)
     .fillColor('#e8f4f8')
     .fill()
     .strokeColor('#7b2cbf')
     .lineWidth(2)
     .stroke();
  
  // Headers del cuadro
  const headerHeight = 20;
  const halfWidth = contentWidth / 2;
  
  // Primera fila de headers - VENTA PROGRAMADA y VENTA AL DIA
  doc.rect(margin, boxY, halfWidth, headerHeight)
     .fillColor('#7b2cbf')
     .fill();
  
  doc.rect(margin + halfWidth, boxY, halfWidth, headerHeight)
     .fillColor('#7b2cbf')
     .fill();
  
  doc.fontSize(9)
     .fillColor('#ffffff')
     .font('Helvetica-Bold')
     .text('VENTA PROGRAMADA:', margin + 5, boxY + 6, {
       width: halfWidth - 10
     });
  
  doc.fontSize(9)
     .fillColor('#ffffff')
     .font('Helvetica-Bold')
     .text('VENTA AL DIA:', margin + halfWidth + 5, boxY + 6, {
       width: halfWidth - 10
     });
  
  // Segunda fila de headers - FECHA DE RESERVA y NUMERO DE CONTRATO
  const secondRowY = boxY + headerHeight;
  
  doc.rect(margin, secondRowY, halfWidth, headerHeight)
     .fillColor('#7b2cbf')
     .fill();
  
  doc.rect(margin + halfWidth, secondRowY, halfWidth, headerHeight)
     .fillColor('#7b2cbf')
     .fill();
  
  doc.fontSize(9)
     .fillColor('#ffffff')
     .font('Helvetica-Bold')
     .text('FECHA DE RESERVA: ' + formatearFecha(contractData.fecha_firma), 
           margin + 5, secondRowY + 6, {
             width: halfWidth - 10
           });
  
  doc.fontSize(9)
     .fillColor('#ffffff')
     .font('Helvetica-Bold')
     .text('NUMERO DE CONTRATO: ' + (contractData.numero_contrato || contractData.id || 'N/A'), 
           margin + halfWidth + 5, secondRowY + 6, {
             width: halfWidth - 10
           });
  
  yPos = secondRowY + headerHeight + 40;
  
  // ================== SECCIÓN 1: DATOS DEL TITULAR ==================
  // Agregar un pequeño fondo blanco para asegurar visibilidad
  doc.rect(margin + 3, yPos - 2, contentWidth - 6, 16)
     .fillColor('#ffffff')
     .fill();
  
  doc.fontSize(10)
     .fillColor('#000000')
     .font('Helvetica-Bold')
     .text('DATOS DE RESERVA Y DATOS PERSONALES DEL TITULAR', margin + 5, yPos, {
       width: contentWidth - 10,
       align: 'left'
     });
  
  yPos += 35; // Aumentado de 20 a 35 para dar más espacio después del título largo
  
  // Información del titular en 2 columnas
  const colWidth = (contentWidth - 20) / 2;
  
  // Obtener datos del titular
  const titular = contractData.Quote?.Passengers?.find(p => p.titular) || contractData.Quote?.Passengers?.[0];
  const cliente = contractData.Cliente;
  
  const titularData = [
    { 
      label: 'Nombre completo del Titular del Contrato:', 
      value: titular ? `${titular.nombre.toUpperCase()} ${titular.apellido.toUpperCase()}` : `${cliente?.name || ''} ${cliente?.lastname || ''}`.toUpperCase()
    },
    { 
      label: 'Numero Cedula:', 
      value: titular?.documento_identidad || cliente?.documento_identidad || ''
    },
    { 
      label: 'Numero de Celular:', 
      value: cliente?.phone || ''
    },
    { 
      label: 'Correo:', 
      value: cliente?.email || ''
    },
    { 
      label: 'Dirección:', 
      value: 'Información no disponible'
    },
    { 
      label: 'Origen:', 
      value: contractData.Quote?.origen || ''
    },
    { 
      label: 'Destino:', 
      value: contractData.Quote?.destino || ''
    },
    // ✅ Insertar desglose dinámico de pasajeros
    ...generatePassengerBreakdown(contractData),
    { 
      label: 'Fecha de salida:', 
      value: formatearFecha(contractData.fecha_inicio_viaje)
    },
    { 
      label: '', 
      value: ''
    }, // Espacio
    { 
      label: 'Fecha de regreso:', 
      value: formatearFecha(contractData.fecha_fin_viaje)
    }
  ];
  
  // Dibujar datos en formato tabla corregido
  let currentRow = 0;
  titularData.forEach((item, index) => {
    if (index % 2 === 0) { // Columna izquierda
      doc.fontSize(8)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text(item.label, margin + 5, yPos + (currentRow * 30));
      
      doc.fontSize(8)
         .font('Helvetica')
         .text(item.value, margin + 5, yPos + (currentRow * 30) + 10);
    } else { // Columna derecha
      doc.fontSize(8)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text(item.label, margin + 5 + colWidth, yPos + (currentRow * 30));
      
      doc.fontSize(8)
         .font('Helvetica')
         .text(item.value, margin + 5 + colWidth, yPos + (currentRow * 30) + 10);
      
      currentRow++; // Solo incrementar fila después de completar ambas columnas
    }
  });
  
  // Ajustar yPos después de todas las filas
  yPos += (Math.ceil(titularData.length / 2) * 30);
  
  // ✅ LÍNEA DIVISORIA DESPUÉS DE DATOS DEL TITULAR
  yPos = addSectionDivider(doc, yPos + 10, margin, contentWidth, 'thick');
  
  // ================== SECCIÓN 2: INFORMACIÓN DE TRANSPORTE ==================
  
  // ✅ TRASLADOS - Información detallada del backend
  const traslados = contractData.quote_calculation_analysis?.items_detallados?.find(item => item.tipo === 'traslados');
let trasladosTexto = 'TRASLADOS: ';

if (traslados && traslados.detalles) {
  const detalles = traslados.detalles;
  const trasladosIncluidos = [];
  
  if (detalles.aeropuerto_hotel_ida?.incluido) {
    trasladosIncluidos.push('aeropuerto → hotel');
  }
  if (detalles.hotel_aeropuerto_vuelta?.incluido) {
    trasladosIncluidos.push('hotel → aeropuerto');
  }
  
  if (trasladosIncluidos.length > 0) {
    trasladosTexto += `${trasladosIncluidos.join(' y ')} INCLUIDOS - APLICA SI: X NO: _`;
  } else {
    trasladosTexto += `NO INCLUIDOS - APLICA SI: _ NO: X`;
  }
} else {
  // ✅ BUSCAR EN LA ESTRUCTURA REAL DEL CONTRATO
  const trasladosCalculation = contractData.Quote?.Calculation?.traslados;
  if (trasladosCalculation && trasladosCalculation.costo_total > 0) {
    const detalles = trasladosCalculation;
    const trasladosIncluidos = [];
    
    if (detalles.aeropuerto_hotel_ida?.incluido) {
      trasladosIncluidos.push('aeropuerto → hotel');
    }
    if (detalles.hotel_aeropuerto_vuelta?.incluido) {
      trasladosIncluidos.push('hotel → aeropuerto');
    }
    
    if (trasladosIncluidos.length > 0) {
      trasladosTexto += `${trasladosIncluidos.join(' y ')} INCLUIDOS - APLICA SI: X NO: _`;
    } else {
      trasladosTexto += `Aeropuerto – hotel – aeropuerto (si aplican) - APLICA SI: X NO: _`;
    }
  } else {
    trasladosTexto += 'NO INCLUIDOS - APLICA SI: _ NO: X';
  }
}
  
  doc.fontSize(9)
     .fillColor('#000000')
     .font('Helvetica-Bold')
     .text(trasladosTexto, margin + 5, yPos, {
       width: contentWidth - 10
     });
  
  yPos += 20;
  
  // ✅ LÍNEA DIVISORIA DESPUÉS DE TRASLADOS
  yPos = addSectionDivider(doc, yPos, margin, contentWidth, 'dashed');
  
  // ✅ TIQUETES - Información detallada del backend
  const tiquetes = contractData.quote_calculation_analysis?.items_detallados?.find(item => item.tipo === 'tickets');
let tiquetesTexto = 'TIQUETES: ';

if (tiquetes) {
  const detalles = tiquetes.detalles;
  tiquetesTexto += detalles.tipo === 'ida_vuelta' ? 'IDA Y REGRESO' : 'SOLO IDA';
  tiquetesTexto += ` - ${detalles.origen} ↔ ${detalles.destino}`;
  if (detalles.proveedor) {
    tiquetesTexto += ` - Aerolínea: ${detalles.proveedor.toUpperCase()}`;
  }
  tiquetesTexto += ` según itinerario confirmado`;
  
  if (detalles.fecha_ida) {
    tiquetesTexto += ` - Ida: ${formatearFecha(detalles.fecha_ida)}`;
  }
  if (detalles.fecha_vuelta) {
    tiquetesTexto += ` - Vuelta: ${formatearFecha(detalles.fecha_vuelta)}`;
  }
} else {
  // ✅ BUSCAR EN LA ESTRUCTURA REAL DEL CONTRATO
  const tiquetesCalculation = contractData.Quote?.Calculation?.tiquetes;
  if (tiquetesCalculation) {
    tiquetesTexto += tiquetesCalculation.tipo === 'ida_vuelta' ? 'IDA Y REGRESO' : 'SOLO IDA';
    tiquetesTexto += ` - ${tiquetesCalculation.origen} ↔ ${tiquetesCalculation.destino}`;
    if (tiquetesCalculation.proveedor) {
      tiquetesTexto += ` - Aerolínea: ${tiquetesCalculation.proveedor.toUpperCase()}`;
    }
    tiquetesTexto += ` según itinerario confirmado`;
    
    if (tiquetesCalculation.fecha_ida) {
      tiquetesTexto += ` - Ida: ${formatearFecha(tiquetesCalculation.fecha_ida)}`;
    }
    if (tiquetesCalculation.fecha_vuelta) {
      tiquetesTexto += ` - Vuelta: ${formatearFecha(tiquetesCalculation.fecha_vuelta)}`;
    }
  } else {
    tiquetesTexto += 'INFORMACIÓN NO DISPONIBLE';
  }
}
  
  doc.fontSize(8)
     .font('Helvetica')
     .text(tiquetesTexto, margin + 5, yPos, {
       width: contentWidth - 10
     });
  
  yPos += 25;
  
  // ✅ EQUIPAJE - Información detallada del backend
  const equipaje = contractData.quote_calculation_analysis?.items_detallados?.find(item => item.tipo === 'equipaje');
let equipajeTexto = 'DIMENSIONES DE EQUIPAJE: ';

if (equipaje && equipaje.detalles) {
  const detalles = equipaje.detalles;
  const incluidoItems = [];
  
  if (detalles.cabina?.incluido) {
    incluidoItems.push('equipaje de cabina incluido');
  }
  if (detalles.bodega?.incluido) {
    incluidoItems.push('equipaje de bodega incluido');
  }
  
  if (incluidoItems.length > 0) {
    equipajeTexto += `${incluidoItems.join(', ')} - verificar dimensiones con aerolínea. EL QR de check in se entregará 24 horas antes – APLICA ley aérea`;
  } else {
    equipajeTexto += `Equipaje adicional - 40*35*25 tipo morral-mochila 8 a 10° kilos de peso - la mochila debe ir bajo asientos aéreos (No se asegura silla continua dependemos de aerolínea) EL QR de check in se entregará 24 horas antes – APLICA ley aérea`;
  }
} else {
  // ✅ BUSCAR EN LA ESTRUCTURA REAL DEL CONTRATO
  const equipajeCalculation = contractData.Quote?.Calculation?.equipaje;
  if (equipajeCalculation && equipajeCalculation.costo_total > 0) {
    const detalles = equipajeCalculation;
    const incluidoItems = [];
    
    if (detalles.equipaje_extra?.incluido) {
      incluidoItems.push('equipaje extra incluido');
    }
    
    if (incluidoItems.length > 0) {
      equipajeTexto += `${incluidoItems.join(', ')} - verificar dimensiones con aerolínea. EL QR de check in se entregará 24 horas antes – APLICA ley aérea`;
    } else {
      equipajeTexto += `Equipaje estándar incluido - 40*35*25 tipo morral-mochila 8 a 10° kilos de peso - la mochila debe ir bajo asientos aéreos (No se asegura silla continua dependemos de aerolínea) EL QR de check in se entregará 24 horas antes – APLICA ley aérea`;
    }
  } else {
    equipajeTexto += 'verificar con aerolínea - EL QR de check in se entregará 24 horas antes – APLICA ley aérea';
  }
}

  
  doc.fontSize(8)
     .font('Helvetica')
     .text(equipajeTexto, margin + 5, yPos, {
       width: contentWidth - 10,
       align: 'justify'
     });
  
  yPos += 50;
  
  // ✅ LÍNEA DIVISORIA ANTES DE ALOJAMIENTO
  yPos = addSectionDivider(doc, yPos, margin, contentWidth, 'solid');
  
  // ================== SECCIÓN 3: ALOJAMIENTO ==================
  
  const hotel = contractData.quote_calculation_analysis?.items_detallados?.find(item => item.tipo === 'hotel');
const alimentacion = contractData.quote_calculation_analysis?.items_detallados?.find(item => item.tipo === 'alimentacion');
const seguros = contractData.quote_calculation_analysis?.items_detallados?.find(item => item.tipo === 'seguros');

if (hotel) {
  // Usar datos de quote_calculation_analysis
} else {
  // ✅ BUSCAR EN LA ESTRUCTURA REAL DEL CONTRATO
  const hotelCalculation = contractData.Quote?.Calculation?.hotel;
  if (hotelCalculation) {
    doc.fontSize(9)
       .fillColor('#000000')
       .font('Helvetica-Bold')
       .text('ALOJAMIENTO:', margin + 5, yPos);
    
    yPos += 15;
    
    const hotelInfo = [
      `Nombre de Hotel: ${hotelCalculation.nombre || 'Por confirmar'}`,
      `Categoría: ${hotelCalculation.categoria?.replace('_', ' ') || 'No especificada'}`,
      `Acomodación: ${hotelCalculation.acomodacion || 'No especificada'}`,
      `No de Noches: ${hotelCalculation.noches || 'No especificado'} noches`,
      `Hotel confirmado con número de noches y acomodación`,
      `Plan de alimentación según cotización`,
    ];
    
    // Información de alimentación detallada SIN PRECIO
    const alimentacionCalculation = contractData.Quote?.Calculation?.alimentacion;
    if (alimentacionCalculation && alimentacionCalculation.tipo) {
      let alimentacionTexto = 'Tipo Alimentación: ';
      switch(alimentacionCalculation.tipo) {
        case 'pension_completa':
          alimentacionTexto += 'Pensión completa (Desayuno, almuerzo y cena)';
          break;
        case 'media_pension':
          alimentacionTexto += 'Media pensión (Desayuno y almuerzo o cena)';
          break;
        case 'desayuno':
          alimentacionTexto += 'Solo desayuno';
          break;
        case 'ninguna':
          alimentacionTexto += 'No incluida';
          break;
        case 'todo_incluido':
          alimentacionTexto += 'todo_incluido';
          break;
        default:
          alimentacionTexto += alimentacionCalculation.tipo || 'No especificada';
      }
      
      // ✅ PRECIO ELIMINADO según solicitud del cliente
      alimentacionTexto += '. Check in: Primer día 3 pm y Check out: Último día según hotel.';
      
      hotelInfo.push(alimentacionTexto);
    }
    
    // Mostrar información del hotel
    hotelInfo.forEach(info => {
      doc.fontSize(8)
         .font('Helvetica')
         .text(info, margin + 5, yPos, {
           width: contentWidth - 10
         });
      yPos += 12;
    });
  }
}
  
  yPos += 10;
  
  // ✅ LÍNEA DIVISORIA ANTES DE DESCRIPCIÓN
  yPos = addSectionDivider(doc, yPos, margin, contentWidth, 'thick');
  
  // ================== SECCIÓN 4: DESCRIPCIÓN DEL SERVICIO ==================
  
  // Sección de descripción del servicio
  doc.rect(margin, yPos, contentWidth, 25)
     .fillColor('#7b2cbf')
     .fill();
  
  doc.fontSize(10)
     .fillColor('#ffffff')
     .font('Helvetica-Bold')
     .text('DESCRIPCIÓN DEL SERVICIO', margin + 5, yPos + 8);
  
  yPos += 35;
  
  // Plan info y actividades
  const calculation = contractData.Quote?.Calculation;
  const alimentacionDetallada = contractData.quote_calculation_analysis?.items_detallados?.find(item => item.tipo === 'alimentacion');
  
  let planInfo = `PLAN ${contractData.Quote?.destino || 'PERSONALIZADO'}`;
  
  if (alimentacionDetallada?.detalles?.tipo) {
    switch(alimentacionDetallada.detalles.tipo) {
      case 'pension_completa':
        planInfo = `PLAN PENSIÓN COMPLETA ${contractData.Quote?.destino || ''}`;
        break;
      case 'media_pension':
        planInfo = `PLAN MEDIA PENSIÓN ${contractData.Quote?.destino || ''}`;
        break;
      case 'desayuno':
        planInfo = `PLAN CON DESAYUNO ${contractData.Quote?.destino || ''}`;
        break;
      case 'ninguna':
        planInfo = `PLAN ESTÁNDAR ${contractData.Quote?.destino || ''}`;
        break;
    }
  }
  
  if (contractData.Quote?.origen) {
    planInfo += ` desde ${contractData.Quote.origen}`;
  }
  
  doc.fontSize(9)
     .fillColor('#000000')
     .font('Helvetica-Bold')
     .text('Concepto: ' + planInfo + ' - Aplica penalidades por cambios y cancelaciones', margin + 5, yPos);
  
  yPos += 15;
  
  // ✅ MINI LÍNEA DIVISORIA
  yPos = addSectionDivider(doc, yPos, margin, contentWidth, 'dashed');
  
  // Actividades adicionales - CORREGIDO para mostrar excursiones
  let actividadesTexto = 'Actividades Adicionales: ';
  
  // ✅ BUSCAR EXCURSIONES EN MÚLTIPLES LUGARES
  let excursiones = [];
  
  // Opción 1: En quote_calculation_analysis
  if (contractData.quote_calculation_analysis?.items_detallados) {
    excursiones = contractData.quote_calculation_analysis.items_detallados.filter(item => item.tipo === 'excursiones');
  }
  
  // Opción 2: En Quote.Calculation.excursiones
  if (excursiones.length === 0 && contractData.Quote?.Calculation?.excursiones) {
    const excurCalc = contractData.Quote.Calculation.excursiones;
    if (excurCalc.incluido && excurCalc.detalles && excurCalc.detalles.length > 0) {
      excursiones = excurCalc.detalles.map(exc => ({
        descripcion: exc.nombre || exc.descripcion || 'Excursión',
        valor: exc.precio || 0
      }));
    }
  }
  
  if (excursiones && excursiones.length > 0) {
    const nombreExcursiones = excursiones.map(exc => {
      return exc.descripcion || exc.nombre || 'Excursión';
    }).join(', ');
    actividadesTexto += nombreExcursiones;
  } else {
    actividadesTexto += 'NO APLICA';
  }
  
  doc.fontSize(8)
     .font('Helvetica')
     .text(actividadesTexto, margin + 5, yPos, {
       width: contentWidth - 10
     });
  
  yPos += 15;
  doc.fontSize(8)
     .font('Helvetica')
     .text('Garantías (VENDEDOR Y COMPRADOR): Aplican', margin + 5, yPos);
  
  yPos += 15;
  doc.fontSize(8)
     .font('Helvetica')
     .text('Seguro Hotelero: aplica según hotel', margin + 5, yPos);
  
  yPos += 15;
  
  // Asistencia médica
  const segurosDetallados = contractData.quote_calculation_analysis?.items_detallados?.find(item => item.tipo === 'seguros');
let asistenciaTexto = 'Asistencia médica: ';

if (segurosDetallados && segurosDetallados.valor > 0) {
  asistenciaTexto += 'SI Aplica (se entrega un día antes de su fecha de viaje y verifique su cobertura)';
  
  const segDetalles = segurosDetallados.detalles;
  if (segDetalles?.tipo) {
    asistenciaTexto += ` - Tipo: ${segDetalles.tipo}`;
  }
  if (segDetalles?.proveedor) {
    asistenciaTexto += ` (${segDetalles.proveedor})`;
  }
  
  // Costo eliminado según solicitud del cliente
} else {
  // ✅ BUSCAR EN LA ESTRUCTURA REAL DEL CONTRATO
  const segurosCalculation = contractData.Quote?.Calculation?.seguros;
  if (segurosCalculation?.asistencia_medica?.costo && parseFloat(segurosCalculation.asistencia_medica.costo) > 0) {
    asistenciaTexto += 'SI Aplica (se entrega un día antes de su fecha de viaje y verifique su cobertura)';
    
    if (segurosCalculation.asistencia_medica.tipo) {
      asistenciaTexto += ` - Tipo: ${segurosCalculation.asistencia_medica.tipo}`;
    }
    
    // Costo eliminado según solicitud del cliente
  } else {
    asistenciaTexto += 'Verificar disponibilidad según destino';
  }
}
  
  doc.fontSize(8)
     .font('Helvetica')
     .text(asistenciaTexto, margin + 5, yPos, {
       width: contentWidth - 10
     });
  
  // ✅ LÍNEA DIVISORIA ANTES DE DATOS DE VIAJEROS
  yPos += 25;
  yPos = addSectionDivider(doc, yPos, margin, contentWidth, 'thick');
  
  // ================== SECCIÓN 5: DATOS DE LOS VIAJEROS ==================
  
  // Información de pasajeros reales
  if (contractData.Quote?.Passengers && contractData.Quote.Passengers.length > 0) {
    const blockHeight = 20 + 12 + 12 + 12 + 10;
    const pageHeight = doc.page.height;
    const bottomMargin = 60;
    
    // ✅ TÍTULO SOLO CUANDO SE NECESITE (primera vez o nueva página)
    let titleShown = false;
    
    contractData.Quote.Passengers.forEach((passenger, index) => {
      if (yPos + blockHeight > pageHeight - bottomMargin) {
        doc.addPage();
        createContractHeader(doc);
        yPos = 120;
        doc.fontSize(9)
          .fillColor('#000000')
          .font('Helvetica-Bold')
          .text('DATOS DE LOS VIAJEROS (continuación)', margin + 5, yPos);
        yPos += 20;
        titleShown = true;
      } else if (!titleShown) {
        // Mostrar título solo la primera vez
        doc.fontSize(9)
           .fillColor('#000000')
           .font('Helvetica-Bold')
           .text('DATOS DE LOS VIAJEROS', margin + 5, yPos);
        yPos += 20;
        titleShown = true;
      }
      
      yPos += 20;
      
      // ✅ MINI LÍNEA ANTES DE CADA PASAJERO
      if (index > 0) {
        yPos = addSectionDivider(doc, yPos - 5, margin, contentWidth, 'dashed');
      }
      
      doc.fontSize(8)
         .font('Helvetica-Bold')
         .text(`Pasajero ${index + 1}: ${passenger.nombre.toUpperCase()} ${passenger.apellido.toUpperCase()}`, margin + 5, yPos);
      yPos += 12;
      doc.fontSize(8)
         .font('Helvetica')
         .text(`${passenger.tipo_documento.toUpperCase()}: ${passenger.documento_identidad}`, margin + 5, yPos);
      yPos += 12;
      doc.fontSize(8)
         .text(`Celular: ${contractData.Cliente?.phone || 'No registrado'}`, margin + 5, yPos);
      yPos += 12;
      doc.fontSize(8)
         .text(`Fecha de nacimiento: ${formatearFecha(passenger.fecha_nacimiento)}`, margin + 5, yPos);
    });
  }
  
  // Footer simple para página 2
  doc.fontSize(7)
     .fillColor('#666666')
     .text('NIT: 1032406128 | RNT: 122035 | Tel: 320 492 44 44 | Email: info@viajaya.com', 
           margin, 750, {
             width: contentWidth,
             align: 'center'
           });
  
  return yPos + 30;
};

// ✅ Función mejorada para crear página 3 con plan de pagos y acuerdos
const createFinancialSection = (doc, contractData) => {
  doc.addPage();
  
  // Header colorido en página 3
  createContractHeader(doc);
  
  const margin = 40;
  const pageWidth = doc.page.width;
  const contentWidth = pageWidth - 2 * margin;
  let yPos = 120;
  
  // ================== SECCIÓN 1: ACUERDO DE PAGO ==================
  
  // Header principal
  doc.rect(margin, yPos, contentWidth, 30)
     .fillColor('#7b2cbf')
     .fill();
  
  doc.fontSize(14)
     .fillColor('#ffffff')
     .font('Helvetica-Bold')
     .text('ACUERDO DE PAGO', margin + 10, yPos + 8);
  
  yPos += 45;
  
  // Información del acuerdo
  const acuerdoTexto = `Nos permitimos informarle que 30 días antes de su fecha de viaje debe estar a paz y salvo con el valor total de su reserva; quedan pactadas las cuotas en este acuerdo.`;
  
  doc.fontSize(9)
     .fillColor('#000000')
     .font('Helvetica')
     .text(acuerdoTexto, margin + 5, yPos, {
       width: contentWidth - 10,
       align: 'justify',
       lineGap: 3
     });
  
  yPos += 40;
  
  // ✅ LÍNEA DIVISORIA
  yPos = addSectionDivider(doc, yPos, margin, contentWidth, 'dashed');
  
  // Información de pagos
  const pagosTexto = `Tenga en cuenta consignar a las cuentas bancarias autorizadas y enviar sus soportes de pago al siguiente correo: soportedepagosviajaya@gmail.com para evitar cambios o cancelaciones de sus servicios, foto legible donde se puede evidenciar fecha, número de aprobación y valor cancelado.`;
  
  doc.fontSize(8)
     .fillColor('#000000')
     .font('Helvetica')
     .text(pagosTexto, margin + 5, yPos, {
       width: contentWidth - 10,
       align: 'justify',
       lineGap: 3
     });
  
  yPos += 45;
  
  const responsabilidadTexto = `Es de responsabilidad del titular enviar e informar sus pagos mensuales.`;
  
  doc.fontSize(9)
     .fillColor('#7b2cbf')
     .font('Helvetica-Bold')
     .text(responsabilidadTexto, margin + 5, yPos, {
       width: contentWidth - 10,
       align: 'justify'
     });
  
  yPos += 30;
  
  // ✅ LÍNEA DIVISORIA GRUESA
  yPos = addSectionDivider(doc, yPos, margin, contentWidth, 'thick');
  
  // ================== SECCIÓN 2: CLÁUSULA TERCERA PRECIO ==================
  
  doc.rect(margin, yPos, contentWidth, 25)
     .fillColor('#573b58')
     .fill();
  
  doc.fontSize(12)
     .fillColor('#ffffff')
     .font('Helvetica-Bold')
     .text('CLÁUSULA TERCERA - PRECIO', margin + 10, yPos + 6);
  
  yPos += 40;
  
  // ================== TABLA DE PAGOS ==================
  
  // Headers de la tabla
  const tableHeaders = ['PAGO', 'VALOR', 'FECHA DE PAGO'];
  const colWidths = [contentWidth * 0.3, contentWidth * 0.35, contentWidth * 0.35];
  let xPos = margin;
  
  // Fondo del header
  doc.rect(margin, yPos, contentWidth, 25)
     .fillColor('#b85aa1')
     .fill();
  
  // Texto del header
  tableHeaders.forEach((header, index) => {
    doc.fontSize(10)
       .fillColor('#ffffff')
       .font('Helvetica-Bold')
       .text(header, xPos + 5, yPos + 7, {
         width: colWidths[index] - 10,
         align: 'center'
       });
    xPos += colWidths[index];
  });
  
  yPos += 30;
  
  // ✅ Obtener información de pagos reales del contrato
  const precioTotal = parseFloat(contractData.precio_total || contractData.total_amount || 0);
  const payments = contractData.payments || [];
  
  // Si no hay pagos definidos, crear pagos de ejemplo basados en el total
  let pagosParaMostrar = [];
  
  if (payments && payments.length > 0) {
    // Usar pagos reales del contrato
    pagosParaMostrar = payments.map((payment, index) => ({
      concepto: `CUOTA ${index === 0 ? 'INICIAL' : index}`,
      valor: payment.amount,
      fecha: formatearFecha(payment.payment_date || payment.fecha_pago)
    }));
  } else {
    // ✅ USAR LOS DATOS REALES DEL CONTRATO PARA CREAR PLAN DE PAGOS
    if (contractData.forma_pago === 'contado') {
      // Pago al contado
      pagosParaMostrar = [
        {
          concepto: 'PAGO TOTAL',
          valor: precioTotal,
          fecha: formatearFecha(contractData.fecha_firma)
        }
      ];
    } else if (contractData.tiene_cuota_inicial) {
      // Plan de cuotas con cuota inicial
      const cuotaInicial = parseFloat(contractData.cuota_inicial_monto || 0);
      const montoRestante = parseFloat(contractData.monto_restante || 0);
      const numeroCuotasRestantes = parseInt(contractData.numero_cuotas_restantes || 0);
      const valorCuotaRestante = parseFloat(contractData.valor_cuota_restante || 0);
      
      // Cuota inicial
      pagosParaMostrar.push({
        concepto: 'CUOTA INICIAL',
        valor: cuotaInicial,
        fecha: formatearFecha(contractData.fecha_vencimiento_inicial || contractData.fecha_firma)
      });
      
      // Agregar cuotas restantes
      for (let i = 0; i < numeroCuotasRestantes; i++) {
        const fechaCuota = contractData.fechas_vencimiento_cuotas?.[i] || 
                          new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000).toISOString();
        
        pagosParaMostrar.push({
          concepto: `CUOTA ${i + 1}`,
          valor: valorCuotaRestante,
          fecha: formatearFecha(fechaCuota)
        });
      }
    } else {
      // Plan básico basado en fechas del viaje
      const fechaFirma = new Date(contractData.fecha_firma);
      const fechaViaje = new Date(contractData.fecha_inicio_viaje);
      const diasHastaViaje = Math.ceil((fechaViaje - fechaFirma) / (1000 * 60 * 60 * 24));
      
      if (diasHastaViaje > 60) {
        // Plan de 3 cuotas para viajes con más de 60 días
        const cuota1 = Math.round(precioTotal * 0.4); // 40% inicial
        const cuota2 = Math.round(precioTotal * 0.35); // 35% 
        const cuota3 = precioTotal - cuota1 - cuota2; // El resto
        
        const fecha1 = fechaFirma;
        const fecha2 = new Date(fechaFirma);
        fecha2.setMonth(fecha2.getMonth() + 1);
        const fecha3 = new Date(fechaViaje);
        fecha3.setDate(fecha3.getDate() - 30); // 30 días antes del viaje
        
        pagosParaMostrar = [
          {
            concepto: 'CUOTA INICIAL',
            valor: cuota1,
            fecha: formatearFecha(fecha1.toISOString())
          },
          {
            concepto: 'CUOTA 1',
            valor: cuota2,
            fecha: formatearFecha(fecha2.toISOString())
          },
          {
            concepto: 'CUOTA FINAL',
            valor: cuota3,
            fecha: formatearFecha(fecha3.toISOString())
          }
        ];
      } else if (diasHastaViaje > 30) {
        // Plan de 2 cuotas para viajes entre 30-60 días
        const cuota1 = Math.round(precioTotal * 0.5); // 50% inicial
        const cuota2 = precioTotal - cuota1; // El resto
        
        const fecha1 = fechaFirma;
        const fecha2 = new Date(fechaViaje);
        fecha2.setDate(fecha2.getDate() - 30); // 30 días antes del viaje
        
        pagosParaMostrar = [
          {
            concepto: 'CUOTA INICIAL',
            valor: cuota1,
            fecha: formatearFecha(fecha1.toISOString())
          },
          {
            concepto: 'CUOTA FINAL',
            valor: cuota2,
            fecha: formatearFecha(fecha2.toISOString())
          }
        ];
      } else {
        // Pago inmediato para viajes en menos de 30 días
        pagosParaMostrar = [
          {
            concepto: 'PAGO INMEDIATO',
            valor: precioTotal,
            fecha: formatearFecha(contractData.fecha_firma)
          }
        ];
      }
    }
  }
  
  // Dibujar filas de la tabla
  pagosParaMostrar.forEach((pago, index) => {
    // Fondo alternado para las filas
    if (index % 2 === 0) {
      doc.rect(margin, yPos, contentWidth, 22)
         .fillColor('#f8f9fa')
         .fill();
    }
    
    // Bordes de la fila
    doc.rect(margin, yPos, contentWidth, 22)
       .strokeColor('#dee2e6')
       .lineWidth(0.5)
       .stroke();
    
    xPos = margin;
    
    // Concepto
    doc.fontSize(9)
       .fillColor('#000000')
       .font('Helvetica-Bold')
       .text(pago.concepto, xPos + 5, yPos + 6, {
         width: colWidths[0] - 10,
         align: 'center'
       });
    xPos += colWidths[0];
    
    // Valor
    doc.fontSize(9)
       .font('Helvetica')
       .text(`$${formatearMoneda(pago.valor).replace('$', '')}`, xPos + 5, yPos + 6, {
         width: colWidths[1] - 10,
         align: 'center'
       });
    xPos += colWidths[1];
    
    // Fecha
    doc.fontSize(9)
       .text(pago.fecha, xPos + 5, yPos + 6, {
         width: colWidths[2] - 10,
         align: 'center'
       });
    
    yPos += 22;
  });
  
  // Fila de total
  doc.rect(margin, yPos, contentWidth, 25)
     .fillColor('#dc86c7')
     .fill();
  
  xPos = margin;
  
  doc.fontSize(11)
     .fillColor('#ffffff')
     .font('Helvetica-Bold')
     .text('TOTAL', xPos + 5, yPos + 7, {
       width: colWidths[0] - 10,
       align: 'center'
     });
  xPos += colWidths[0];
  
  doc.fontSize(11)
     .text(`$${formatearMoneda(precioTotal).replace('$', '')}`, xPos + 5, yPos + 7, {
       width: colWidths[1] - 10,
       align: 'center'
     });
  
  yPos += 40;
  
  // ✅ LÍNEA DIVISORIA
  yPos = addSectionDivider(doc, yPos, margin, contentWidth, 'solid');
  
  // ================== INFORMACIÓN ADICIONAL ==================
  
  // Información del desglose de costos si está disponible
  const analysis = contractData.quote_calculation_analysis;
  if (analysis && analysis.items_detallados) {
    doc.fontSize(10)
       .fillColor('#000000')
       .font('Helvetica-Bold')
       .text('DESGLOSE DE COSTOS INCLUIDOS:', margin + 5, yPos);
    
    yPos += 20;
    
    analysis.items_detallados.forEach(item => {
      if (item.valor > 0) {
        const itemTexto = `• ${item.tipo.toUpperCase()}: ${formatearMoneda(item.valor)}`;
        doc.fontSize(8)
           .font('Helvetica')
           .text(itemTexto, margin + 10, yPos);
        yPos += 12;
      }
    });
    
    yPos += 10;
    // ✅ MINI LÍNEA DIVISORIA
    yPos = addSectionDivider(doc, yPos, margin, contentWidth, 'dashed');
  }
  
  // ================== NOTAS IMPORTANTES ==================
  
  doc.fontSize(10)
     .fillColor('#7b2cbf')
     .font('Helvetica-Bold')
     .text('NOTAS IMPORTANTES:', margin + 5, yPos);
  
  yPos += 15;
  
  const notasImportantes = [
    '• Los pagos deben realizarse en las fechas establecidas para garantizar la reserva.',
    '• Cualquier retraso en los pagos puede resultar en cancelación de servicios.',
    '• Los comprobantes de pago deben enviarse inmediatamente al correo especificado.',
    '• No se aceptan pagos en efectivo directamente, solo transferencias bancarias.',
    '• El titular es responsable de informar todos los pagos realizados.'
  ];
  
  notasImportantes.forEach(nota => {
    doc.fontSize(8)
       .fillColor('#000000')
       .font('Helvetica')
       .text(nota, margin + 5, yPos, {
         width: contentWidth - 10,
         lineGap: 2
       });
    yPos += 15;
  });
  
  // Footer simple para página 3
  doc.fontSize(7)
     .fillColor('#666666')
     .text('NIT: 1032406128 | RNT: 122035 | Tel: 320 492 44 44 | Email: info@viajaya.com', 
           margin, 750, {
             width: contentWidth,
             align: 'center'
           });
  
  return yPos + 30;
};

// ✅ Función para crear páginas de cláusulas adicionales (texto estático)
const createAdditionalClausesPages = (doc, contractData) => {
  const margin = 40;
  const pageWidth = doc.page.width;
  const contentWidth = pageWidth - 2 * margin;
  
  // ================== PÁGINA 4: NOTA Y PARÁGRAFO PRIMERO ==================
  doc.addPage();
  createContractHeader(doc);
  let yPos = 120;
  
  // NOTA IMPORTANTE
  doc.rect(margin, yPos, contentWidth, 25)
     .fillColor('#e74c3c')
     .fill();
  
  doc.fontSize(12)
     .fillColor('#ffffff')
     .font('Helvetica-Bold')
     .text('NOTA IMPORTANTE', margin + 10, yPos + 6);
  
  yPos += 40;
  
  const notaTexto = `Ningún asesor está autorizado en recibir efectivo todo será cancelado en puntos de ventas o cuentas bancarias - es bajo su responsabilidad entregar efectivo`;
  
  doc.fontSize(10)
     .fillColor('#e74c3c')
     .font('Helvetica-Bold')
     .text(notaTexto, margin + 5, yPos, {
       width: contentWidth - 10,
       align: 'justify',
       lineGap: 4
     });
  
  yPos += 50;
  yPos = addSectionDivider(doc, yPos, margin, contentWidth, 'thick');
  
  // PARÁGRAFO PRIMERO
  doc.fontSize(11)
     .fillColor('#000000')
     .font('Helvetica-Bold')
     .text('PARÁGRAFO PRIMERO:', margin + 5, yPos);
  
  yPos += 20;
  
  const parrafo1Texto = `El precio del contrato incluye los cargos, suplementos e impuestos (Tasas aeroportuarias, cargo de combustible, retenciones de ley, cargo por seguro, impuestos de ley). En los vuelos comerciales de itinerario no está incluido el equipaje de bodega conforme a las políticas de cada aerolínea.`;
  
  doc.fontSize(9)
     .fillColor('#000000')
     .font('Helvetica')
     .text(parrafo1Texto, margin + 5, yPos, {
       width: contentWidth - 10,
       align: 'justify',
       lineGap: 3
     });
  
  yPos += 60;
  
  // NO INCLUYE
  doc.fontSize(10)
     .fillColor('#7b2cbf')
     .font('Helvetica-Bold')
     .text('NO INCLUYE:', margin + 5, yPos);
  
  yPos += 20;
  
  const noIncluye = [
    '1. Tarjetas de turismo (excepción Cuba).',
    '2. Tarjetas de entrada al destino seleccionado.',
    '3. Otros impuestos establecidos por las autoridades competentes',
    '4. Conceptos no especificados en el plan adquirido.',
    '5. El SERVICIO de equipaje cubierto en el plan, será únicamente el indicado en el cuadro de "DATOS RESERVA". Cualquier cambio en las condiciones del equipaje serán asumidas directamente por el pasajero y dependerán de las dimensiones y peso del equipaje, la anticipación con que se avise del servicio adicional, las condiciones del viaje y de las políticas de la aerolínea.'
  ];
  
  noIncluye.forEach(item => {
    doc.fontSize(8)
       .fillColor('#000000')
       .font('Helvetica')
       .text(item, margin + 10, yPos, {
         width: contentWidth - 20,
         align: 'justify',
         lineGap: 2
       });
    yPos += item.includes('equipaje') ? 65 : 20;
  });
  
  yPos += 20;
  
  const equipajeTexto = `VIAJAYA realizará la verificación del costo adicional y procederá a trasladar el cobro al COMPRADOR para su respectivo pago. En caso de que el equipaje exceda el peso autorizado por cada aerolínea, el COMPRADOR se compromete a asumir los costos adicionales. En caso de pérdida del equipaje, o demora en el mismo, la aerolínea será la responsable en los términos del reglamento aeronáutico civil No. 3 Actividades aéreas civiles.`;
  
  doc.fontSize(8)
     .text(equipajeTexto, margin + 10, yPos, {
       width: contentWidth - 20,
       align: 'justify',
       lineGap: 2
     });
  
  // Footer para página 4
  doc.fontSize(7)
     .fillColor('#666666')
     .text('NIT: 1032406128 | RNT: 122035 | Tel: 320 492 44 44 | Email: info@viajaya.com', 
           margin, 750, {
             width: contentWidth,
             align: 'center'
           });
  
  // ================== PÁGINA 5: PARÁGRAFO SEGUNDO Y CLÁUSULAS ==================
  doc.addPage();
  createContractHeader(doc);
  yPos = 120;
  
  // PARÁGRAFO SEGUNDO
  doc.fontSize(11)
     .fillColor('#000000')
     .font('Helvetica-Bold')
     .text('PARÁGRAFO SEGUNDO: INFANTE Y NIÑO:', margin + 5, yPos);
  
  yPos += 20;
  
  const parrafo2Texto = `Entiéndase por infante, todo aquel que no ha cumplido 2 años de edad a la fecha de regreso del viaje; niño(a) el mayor a 2 años y que no ha cumplido 12 años de edad a la fecha de regreso del viaje; pasajero mayor todo aquel mayor de 12 años que no ha cumplido 65 años a la fecha de regreso del viaje; pasajero tercera edad todo aquel mayor a 65 años. El ingreso de infantes y niños a los hoteles y vuelos se encuentra restringido si no cuenta con la presencia del guardián legal, padre, tutor o carta de permiso del mismo. (Sujeto a condiciones de Migración Colombia y cada una de las aerolíneas).`;
  
  doc.fontSize(8)
     .fillColor('#000000')
     .font('Helvetica')
     .text(parrafo2Texto, margin + 5, yPos, {
       width: contentWidth - 10,
       align: 'justify',
       lineGap: 3
     });
  
  yPos += 100;
  yPos = addSectionDivider(doc, yPos, margin, contentWidth, 'solid');
  
  // CLÁUSULA TERCERA PRECIO
  doc.rect(margin, yPos, contentWidth, 25)
     .fillColor('#7b2cbf')
     .fill();
  
  doc.fontSize(11)
     .fillColor('#ffffff')
     .font('Helvetica-Bold')
     .text('CLÁUSULA TERCERA - PRECIO', margin + 10, yPos + 6);
  
  yPos += 40;
  
  const clausula3Texto = `El COMPRADOR se compromete a pagar la totalidad de este contrato de manera incondicional a la orden del VENDEDOR la suma total indicada en el cuadro "DATOS RESERVA"- específicamente en la casilla total Valor contrato que hace parte de la cláusula segunda del presente contrato, dinero que se consignará exclusivamente en las cuentas autorizadas y nombradas en el acuerdo de pago enviar sus soportes legibles al correo: soportedepagosviajaya@gmail.com en este email autorizado enviar los soportes legibles y es su obligación dar a conocer sus abonos mensuales`;
  
  doc.fontSize(9)
     .fillColor('#000000')
     .font('Helvetica')
     .text(clausula3Texto, margin + 5, yPos, {
       width: contentWidth - 10,
       align: 'justify',
       lineGap: 3
     });
  
  yPos += 80;
  yPos = addSectionDivider(doc, yPos, margin, contentWidth, 'dashed');
  
  // CLÁUSULA CUARTA
  doc.fontSize(11)
     .fillColor('#7b2cbf')
     .font('Helvetica-Bold')
     .text('CLÁUSULA CUARTA - FORMA DE PAGO PARA VIAJES CON FECHA SUPERIOR A 31 DÍAS (VENTA PROGRAMADA):', margin + 5, yPos);
  
  yPos += 25;
  
  const clausula4Texto = `Si el viaje se realiza entre (31) días calendario o más, contados a partir del perfeccionamiento del presente contrato, EL COMPRADOR deberá pagar una cuota inicial para reservar, atendiendo el acuerdo comercial descrito en el presente contrato. El saldo se pagará en el número cuotas mensuales restantes y hasta completar el 100% del valor final del plan, atendiendo el acuerdo comercial de pago descrito en el presente contrato, con un plazo máximo de 30 días calendario antes de la fecha de viaje.`;
  
  doc.fontSize(9)
     .fillColor('#000000')
     .font('Helvetica')
     .text(clausula4Texto, margin + 5, yPos, {
       width: contentWidth - 10,
       align: 'justify',
       lineGap: 3
     });
  
  yPos += 80;
  
  // CLÁUSULA QUINTA
  doc.fontSize(11)
     .fillColor('#7b2cbf')
     .font('Helvetica-Bold')
     .text('CLÁUSULA QUINTA - FORMA DE PAGO PARA VIAJES CON FECHA INFERIOR A 30 DÍAS (VENTA AL DÍA):', margin + 5, yPos);
  
  yPos += 25;
  
  const clausula5Texto = `Si el viaje se realiza dentro de los treinta (30) días calendario siguiente al recibo del presente contrato en el correo electrónico DEL COMPRADOR, éste debe pagar el 100% del valor final de manera inmediata.`;
  
  doc.fontSize(9)
     .fillColor('#000000')
     .font('Helvetica')
     .text(clausula5Texto, margin + 5, yPos, {
       width: contentWidth - 10,
       align: 'justify',
       lineGap: 3
     });
  
  // Footer para página 5
  doc.fontSize(7)
     .fillColor('#666666')
     .text('NIT: 1032406128 | RNT: 122035 | Tel: 320 492 44 44 | Email: info@viajaya.com', 
           margin, 750, {
             width: contentWidth,
             align: 'center'
           });
  
  // ================== PÁGINA 6: CLÁUSULAS ADICIONALES ==================
  doc.addPage();
  createContractHeader(doc);
  yPos = 120;
  
  // CLÁUSULA SEXTA
  doc.fontSize(11)
     .fillColor('#7b2cbf')
     .font('Helvetica-Bold')
     .text('CLÁUSULA SEXTA - PERFECCIONAMIENTO:', margin + 5, yPos);
  
  yPos += 20;
  
  const clausula6Texto = `El contrato celebrado entre las partes se perfecciona desde el momento que se efectúe el primer pago por parte de EL COMPRADOR por cualquiera de los medios de pago o recaudo oficiales del VENDEDOR y al momento de confirmarse la reserva por parte de EL VENDEDOR, y las prestaciones principales a cargo de EL VENDEDOR se harán efectivas cuando se realice la totalidad del pago del contrato pactado y en las fechas determinadas contractualmente.`;
  
  doc.fontSize(9)
     .fillColor('#000000')
     .font('Helvetica')
     .text(clausula6Texto, margin + 5, yPos, {
       width: contentWidth - 10,
       align: 'justify',
       lineGap: 3
     });
  
  yPos += 80;
  yPos = addSectionDivider(doc, yPos, margin, contentWidth, 'solid');
  
  // CLÁUSULA SÉPTIMA
  doc.fontSize(11)
     .fillColor('#7b2cbf')
     .font('Helvetica-Bold')
     .text('CLÁUSULA SÉPTIMA - CAMBIOS Y CANCELACIONES:', margin + 5, yPos);
  
  yPos += 20;
  
  const clausula7Parte1 = `EL COMPRADOR podrá cambiar o cancelar el paquete turístico o viaje, en cuyo caso deberá pagar la mayor diferencia resultante o solicitar la devolución de la diferencia en servicios y/o receptivos ofrecidos por la compañía si el cambio o variación del servicio es imputable AL COMPRADOR; o en dinero si la variación o cambio en el servicio es atribuible AL VENDEDOR, exceptuando las modificaciones que en virtud de la cláusula de responsabilidad se puedan efectuar.`;
  
  doc.fontSize(8)
     .fillColor('#000000')
     .font('Helvetica')
     .text(clausula7Parte1, margin + 5, yPos, {
       width: contentWidth - 10,
       align: 'justify',
       lineGap: 3
     });
  
  yPos += 80;
  
  const clausula7Parte2 = `Cualquier cambio en la reserva del paquete turístico, desarrollo del producto y/o servicio adquirido y demás condiciones o cancelaciones, los podrá realizar EL COMPRADOR mediante escrito físico ante las oficinas de EL VENDEDOR o al correo electrónico: mayordomodeviajesviajaya@gmail.com teniendo en cuenta que serán aplicables las condiciones de la tabla de penalidades de la cláusula décima segunda (12) y el reajuste de tarifa por cambios o demás adiciones, que en su momento se liquidarán a EL COMPRADOR y serán de pago inmediato y total.`;
  
  doc.fontSize(8)
     .fillColor('#000000')
     .font('Helvetica')
     .text(clausula7Parte2, margin + 5, yPos, {
       width: contentWidth - 10,
       align: 'justify',
       lineGap: 3
     });
  
  yPos += 90;
  
  const clausula7Parte3 = `EL VENDEDOR podrá efectuar los cambios determinados por los prestadores de los servicios, de acuerdo con la cláusula de responsabilidad y con los términos y condiciones establecidos por ellos, con el fin de garantizar el éxito del viaje.`;
  
  doc.fontSize(8)
     .fillColor('#000000')
     .font('Helvetica')
     .text(clausula7Parte3, margin + 5, yPos, {
       width: contentWidth - 10,
       align: 'justify',
       lineGap: 3
     });
  
  // Footer para página 6
  doc.fontSize(7)
     .fillColor('#666666')
     .text('NIT: 1032406128 | RNT: 122035 | Tel: 320 492 44 44 | Email: info@viajaya.com', 
           margin, 750, {
             width: contentWidth,
             align: 'center'
           });
  
  // ================== PÁGINA 7: CLÁUSULAS FINALES ==================
  doc.addPage();
  createContractHeader(doc);
  yPos = 120;
  
  // Continuación CLÁUSULA SÉPTIMA - casos de cancelación
  const clausula7Cancelacion = `EL VENDEDOR procederá a cancelar las reservas respectivas, en los siguientes casos: 1) Si dentro de las 24 horas siguientes a la fijación de la reserva, no se ha efectuado el pago correspondiente para mantenerla. 2) cuando EL COMPRADOR no efectúe el pago de dos (2) cuotas mensuales consecutivas. 3) en caso de que este contrato no esté pagado en su totalidad por lo menos treinta (30) días calendario antes de la fecha de viaje o veinte (20) días calendario antes de la fecha de viaje dependiendo si es una venta programada o es una venta al día.`;
  
  doc.fontSize(8)
     .fillColor('#e74c3c')
     .font('Helvetica-Bold')
     .text(clausula7Cancelacion, margin + 5, yPos, {
       width: contentWidth - 10,
       align: 'justify',
       lineGap: 3
     });
  
  yPos += 100;
  yPos = addSectionDivider(doc, yPos, margin, contentWidth, 'thick');
  
  // CLÁUSULA OCTAVA
  doc.fontSize(11)
     .fillColor('#7b2cbf')
     .font('Helvetica-Bold')
     .text('CLÁUSULA OCTAVA - TERMINACIÓN:', margin + 5, yPos);
  
  yPos += 20;
  
  const clausula8Texto = `EL VENDEDOR: podrá dar por terminado con justa causa el presente contrato cuando EL COMPRADOR no cumpla con el pago oportuno parcial o total de este contrato. En caso de terminación del contrato, por cualquiera de las partes, el VENDEDOR procederá a liquidar y requerir el pago de los valores proporcionales que corresponda por el "no show" en el hotel, costo de haber reservado sillas en vuelos y los gastos en los que incurra EL VENDEDOR por la reservación ante sus proveedores, LAS PARTES reconocen el mérito ejecutivo que presta este contrato.`;
  
  doc.fontSize(9)
     .fillColor('#000000')
     .font('Helvetica')
     .text(clausula8Texto, margin + 5, yPos, {
       width: contentWidth - 10,
       align: 'justify',
       lineGap: 3
     });
  
  yPos += 100;
  yPos = addSectionDivider(doc, yPos, margin, contentWidth, 'dashed');
  
  // CLÁUSULA NOVENA
  doc.fontSize(11)
     .fillColor('#7b2cbf')
     .font('Helvetica-Bold')
     .text('CLÁUSULA NOVENA - VERIFICACIÓN DE TÉRMINOS:', margin + 5, yPos);
  
  yPos += 20;
  
  const clausula9Texto = `EL COMPRADOR, acepta que no hay promesas, ni condiciones verbales adicionales, ya que el presente contrato contempla todas las estipulaciones, condiciones y servicios que por el mismo aceptan y adquieren.`;
  
  doc.fontSize(9)
     .fillColor('#000000')
     .font('Helvetica')
     .text(clausula9Texto, margin + 5, yPos, {
       width: contentWidth - 10,
       align: 'justify',
       lineGap: 3
     });
  
  yPos += 60;
  
  // CLÁUSULA DÉCIMA PRIMERA
  doc.fontSize(11)
     .fillColor('#7b2cbf')
     .font('Helvetica-Bold')
     .text('CLÁUSULA DÉCIMA PRIMERA - OBLIGACIONES DE LAS PARTES:', margin + 5, yPos);
  
  yPos += 20;
  
  const clausula11Texto = `Además de las obligaciones contempladas en la legislación aplicable al contrato en materia turística y comercial, EL COMPRADOR manifiesta que fue informado adecuadamente del alcance de la cláusula de responsabilidad que como prestador de servicios turísticos tiene EL VENDEDOR según la Ley de Turismo, y EL COMPRADOR manifiesta que recibe copia de la Cláusula de Responsabilidad inmersa en este contrato.`;
  
  doc.fontSize(9)
     .fillColor('#000000')
     .font('Helvetica')
     .text(clausula11Texto, margin + 5, yPos, {
       width: contentWidth - 10,
       align: 'justify',
       lineGap: 3
     });
  
  yPos += 80;
  
  // CLÁUSULA DÉCIMA SEGUNDA
  doc.fontSize(11)
     .fillColor('#e74c3c')
     .font('Helvetica-Bold')
     .text('CLÁUSULA DÉCIMA SEGUNDA - PENALIDADES:', margin + 5, yPos);
  
  yPos += 20;
  
  const clausula12Texto = `Las penalidades del presente contrato, serán aplicables para cada persona de la reserva y son las que a continuación se describen, las cuales son conocidas, informadas, explicadas y aceptadas por EL COMPRADOR, en los casos de cancelación de viaje se deducirá el 100% de la Garantía de Viaje por pasajero`;
  
  doc.fontSize(9)
     .fillColor('#e74c3c')
     .font('Helvetica-Bold')
     .text(clausula12Texto, margin + 5, yPos, {
       width: contentWidth - 10,
       align: 'justify',
       lineGap: 3
     });
  
  yPos += 80;
  
  // ================== TABLA DE PENALIDADES ==================
  
  // Crear tabla de penalidades
  const createPenaltiesTable = (doc, startY) => {
    const tableStartX = margin;
    const tableWidth = contentWidth;
    
    // Definir columnas y sus anchos
    const columns = [
      { header: 'Descripción del servicio', width: tableWidth * 0.20 },
      { header: 'Cambio de nombre1', width: tableWidth * 0.08 },
      { header: '', width: tableWidth * 0.08 }, // Cambio de nombre2
      { header: 'Cambio de fecha', width: tableWidth * 0.08 },
      { header: '', width: tableWidth * 0.08 }, // Cambio de fecha2
      { header: 'Cambio de destino2', width: tableWidth * 0.08 },
      { header: '', width: tableWidth * 0.08 }, // Cambio de destino2
      { header: 'Cancelación', width: tableWidth * 0.08 },
      { header: '', width: tableWidth * 0.08 }  // Cancelación2
    ];
    
    let currentY = startY;
    
    // Header principal de la tabla con colores
    doc.rect(tableStartX, currentY, tableWidth, 25)
       .fillColor('#8e44ad')
       .fill();
    
    // Títulos principales
    let currentX = tableStartX;
    
    // Descripción del servicio
    doc.fontSize(8)
       .fillColor('#ffffff')
       .font('Helvetica-Bold')
       .text('Descripción del servicio', currentX + 2, currentY + 8, {
         width: columns[0].width - 4,
         align: 'center'
       });
    currentX += columns[0].width;
    
    // Cambio de nombre (2 columnas)
    doc.text('Cambio de nombre1', currentX + 2, currentY + 8, {
       width: (columns[1].width + columns[2].width) - 4,
       align: 'center'
     });
    currentX += columns[1].width + columns[2].width;
    
    // Cambio de fecha (2 columnas)
    doc.text('Cambio de fecha', currentX + 2, currentY + 8, {
       width: (columns[3].width + columns[4].width) - 4,
       align: 'center'
     });
    currentX += columns[3].width + columns[4].width;
    
    // Cambio de destino (2 columnas)
    doc.text('Cambio de destino2', currentX + 2, currentY + 8, {
       width: (columns[5].width + columns[6].width) - 4,
       align: 'center'
     });
    currentX += columns[5].width + columns[6].width;
    
    // Cancelación (2 columnas)
    doc.text('Cancelación', currentX + 2, currentY + 8, {
       width: (columns[7].width + columns[8].width) - 4,
       align: 'center'
     });
    
    currentY += 25;
    
    // Sub-headers con rangos de días
    doc.rect(tableStartX, currentY, tableWidth, 20)
       .fillColor('#9b59b6')
       .fill();
    
    currentX = tableStartX + columns[0].width; // Empezar después de "Descripción del servicio"
    
    const rangeLabels = [
      'Mayor a 8 días', 'Menor o igual a 8 días',
      'Mayor a 30 días', 'Menor o igual a 30 Días',
      'Mayor a 30 días', 'Menor o igual a 30 días',
      'Mayor a 30 días', 'Menor igual a 30 días'
    ];
    
    doc.fontSize(6)
       .fillColor('#ffffff')
       .font('Helvetica');
    
    rangeLabels.forEach((label, index) => {
      const colWidth = index < 2 ? columns[index + 1].width : columns[index + 1].width;
      doc.text(label, currentX + 1, currentY + 6, {
        width: colWidth - 2,
        align: 'center'
      });
      currentX += colWidth;
    });
    
    currentY += 20;
    
    // Filas de datos
    const rowData = [
      {
        service: 'Transporte aéreo CHARTER Y COMERCIAL',
        values: ['Según Tarifa', 'Según Tarifa', '100%', '100%', '100%', '100%', '100%', '100%']
      },
      {
        service: 'Servicio Turístico: Alojamiento, receptivos incluidos y CSI (Cargos, suplementos e impuestos)',
        values: ['N/A', '', '30%', '100%', '30%', '100%', '30%', '100%']
      }
    ];
    
    rowData.forEach((row, rowIndex) => {
      const rowHeight = row.service.length > 50 ? 35 : 25;
      
      // Fondo alternado para las filas
      if (rowIndex % 2 === 0) {
        doc.rect(tableStartX, currentY, tableWidth, rowHeight)
           .fillColor('#f8f9fa')
           .fill();
      }
      
      // Bordes de la fila
      doc.rect(tableStartX, currentY, tableWidth, rowHeight)
         .strokeColor('#dee2e6')
         .lineWidth(0.5)
         .stroke();
      
      currentX = tableStartX;
      
      // Descripción del servicio
      doc.fontSize(7)
         .fillColor('#000000')
         .font('Helvetica')
         .text(row.service, currentX + 2, currentY + 4, {
           width: columns[0].width - 4,
           align: 'left'
         });
      currentX += columns[0].width;
      
      // Valores de penalidades
      row.values.forEach((value, index) => {
        const colWidth = columns[index + 1].width;
        
        doc.fontSize(7)
           .fillColor('#000000')
           .font('Helvetica-Bold')
           .text(value, currentX + 1, currentY + 8, {
             width: colWidth - 2,
             align: 'center'
           });
        
        // Dibujar línea vertical entre columnas
        doc.moveTo(currentX, currentY)
           .lineTo(currentX, currentY + rowHeight)
           .strokeColor('#dee2e6')
           .lineWidth(0.5)
           .stroke();
        
        currentX += colWidth;
      });
      
      currentY += rowHeight;
    });
    
    // Bordes exteriores de la tabla
    doc.rect(tableStartX, startY, tableWidth, currentY - startY)
       .strokeColor('#000000')
       .lineWidth(1)
       .stroke();
    
    return currentY;
  };
  
  yPos = createPenaltiesTable(doc, yPos);
  
  yPos += 30;
  
  // Nota adicional sobre penalidades
  doc.fontSize(8)
     .fillColor('#e74c3c')
     .font('Helvetica-Bold')
     .text('NOTA: Todas las penalidades se aplican por pasajero y están sujetas a las condiciones específicas de cada proveedor de servicios.', 
           margin + 5, yPos, {
             width: contentWidth - 10,
             align: 'justify',
             lineGap: 2
           });

  yPos += 50;

  // ================== NUEVA PÁGINA: CLÁUSULAS ADICIONALES ==================
  doc.addPage();
  createContractHeader(doc);
  yPos = 120;

  // CLÁUSULA DÉCIMA TERCERA - CONDICIONES GENERALES
  doc.fontSize(11)
     .fillColor('#7b2cbf')
     .font('Helvetica-Bold')
     .text('CLÁUSULA DÉCIMA TERCERA - CONDICIONES GENERALES:', margin + 5, yPos);

  yPos += 20;

  const clausula13Texto = `Cambio de nombre en vuelo comercial está sujeto a penalidades de la aerolínea. Cambio de destino a mayor categoría con fecha de viaje mayor a 30 días no aplicarpenalidad solo aplica reajuste de la tarifa vigente.

Para el artículo 2.o Si después de haberse iniciado el viaje y hasta 30 días, el valor resultante una vez descontada la penalidad correspondiente, será reembolsado por la Empresa según los procedimientos establecidos por éste. Cuando sea el transporte comercial correspondiente a tarifa promocional, por tanto las penalidades aplicables serán las que establezca la aerolínea con determinación civil determine y con cargo al titular de la reserva, igualmente se informa al COMPRADOR desde este momento, que los tiquetes aéreos tienen una restricción en términos de cancelación, conforme al numeral 3.30.1.8.1 De los Reglamentos Aeronáuticos de Colombia (RAC 3)`;

  const clausula13Parte2 = `Al COMPRADOR le fueron informadas ampliamente las condiciones de responsabilidad y manejo que otorga la Ley de Turismo. AL COMPRADOR le fueron informadas ampliamente los términos y condiciones que debe cumplir para viajar a su lugar de destino, también le fue informado de los servicios de asistencia al turista. El término mínimo con antelación para sus servicios turísticos del presente contrato, será de cuarenta y cinco (45) días calendario después de ejecutada esta compra para ser informado y así viajar el itinerario exacto para efectuar su reclamación directa. 3. EL VENDEDOR rechaza cualquier forma de explotación, pornografía, turismo sexual. El VENDEDOR está comprometido con la protección y prevención contra toda forma de explotación sexual que involucre niños, niñas y adolescentes en viajes y turismo, conforme a la Ley 17.823. Adicionalmente adhiere al COMPRADOR que la explotación sexual y el abuso sexual comercial de niñas, niños y adolescentes es penada y sancionada administrativa, conforme a las leyes vigentes.`;

  doc.fontSize(9)
     .fillColor('#000000')
     .font('Helvetica')
     .text(clausula13Texto, margin + 5, yPos, {
       width: contentWidth - 10,
       align: 'justify',
       lineGap: 3
     });

  yPos += 120;

  // Segunda parte de la cláusula décima tercera
  doc.fontSize(9)
     .fillColor('#000000')
     .font('Helvetica')
     .text(clausula13Parte2, margin + 5, yPos, {
       width: contentWidth - 10,
       align: 'justify',
       lineGap: 3
     });

  yPos += 140;
  yPos = addSectionDivider(doc, yPos, margin, contentWidth, 'dashed');

  // CLÁUSULA DÉCIMA SEXTA - DECLARACIÓN DE LAS PARTES
  doc.fontSize(11)
     .fillColor('#7b2cbf')
     .font('Helvetica-Bold')
     .text('CLÁUSULA DÉCIMA SEXTA - DECLARACIÓN DE LAS PARTES:', margin + 5, yPos);

  yPos += 20;

  const clausula16Texto = `Las partes declaran que las ofertas iniciales realizadas por el VENDEDOR fueron meramente informativas, que cada una de las obligaciones y servicios adquiridos por el COMPRADOR se encuentran descritas detalladamente en el presente contrato. De igual manera, las partes declaran que cualquier modificación al presente contrato deberá constar por escrito y con la aceptación de ambas partes.`;

  doc.fontSize(9)
     .fillColor('#000000')
     .font('Helvetica')
     .text(clausula16Texto, margin + 5, yPos, {
       width: contentWidth - 10,
       align: 'justify',
       lineGap: 3
     });

  yPos += 80;
  yPos = addSectionDivider(doc, yPos, margin, contentWidth, 'solid');

  // CLÁUSULA DÉCIMA SÉPTIMA - FIRMA DE DOCUMENTOS ADICIONALES
  doc.fontSize(11)
     .fillColor('#7b2cbf')
     .font('Helvetica-Bold')
     .text('CLÁUSULA DÉCIMA SÉPTIMA - FIRMA DE DOCUMENTOS ADICIONALES:', margin + 5, yPos);

  yPos += 20;

  const clausula17Texto = `El COMPRADOR se compromete a firmar todos los documentos adicionales que sean requeridos para el cumplimiento de las obligaciones derivadas del presente contrato, incluyendo pero no limitándose a: autorizaciones para menores de edad, permisos de viaje, documentos migratorios, formularios de aerolíneas, hoteles y otros proveedores de servicios turísticos.`;

  doc.fontSize(9)
     .fillColor('#000000')
     .font('Helvetica')
     .text(clausula17Texto, margin + 5, yPos, {
       width: contentWidth - 10,
       align: 'justify',
       lineGap: 3
     });

  yPos += 80;

  // Verificar si necesitamos nueva página
  if (yPos > 650) {
    doc.addPage();
    createContractHeader(doc);
    yPos = 120;
  }

  yPos = addSectionDivider(doc, yPos, margin, contentWidth, 'dashed');

  // CLÁUSULA DÉCIMA OCTAVA - NORMAS QUE SE ENTIENDEN INCORPORADAS
  doc.fontSize(11)
     .fillColor('#7b2cbf')
     .font('Helvetica-Bold')
     .text('CLÁUSULA DÉCIMA OCTAVA - NORMAS QUE SE ENTIENDEN INCORPORADAS:', margin + 5, yPos);

  yPos += 20;

  const clausula18Texto = `Se entienden incorporadas al presente contrato todas las normas que regulan las actividades turísticas en Colombia, especialmente la Ley 300 de 1996 (Ley General de Turismo) y sus decretos reglamentarios, el Código de Comercio, las normas aeronáuticas civiles, las resoluciones del Ministerio de Comercio, Industria y Turismo, y demás normatividad vigente que resulte aplicable a la prestación de servicios turísticos.`;

  doc.fontSize(9)
     .fillColor('#000000')
     .font('Helvetica')
     .text(clausula18Texto, margin + 5, yPos, {
       width: contentWidth - 10,
       align: 'justify',
       lineGap: 3
     });

  yPos += 80;
  yPos = addSectionDivider(doc, yPos, margin, contentWidth, 'solid');

  // CLÁUSULA DÉCIMA NOVENA - ACEPTACIÓN POR MENSAJE DE DATOS
  doc.fontSize(11)
     .fillColor('#7b2cbf')
     .font('Helvetica-Bold')
     .text('CLÁUSULA DÉCIMA NOVENA - ACEPTACIÓN POR MENSAJE DE DATOS:', margin + 5, yPos);

  yPos += 20;

  const clausula19Texto = `Las partes acuerdan que la comunicación a través de medios electrónicos, incluyendo correo electrónico, mensajes de texto SMS, WhatsApp y otras plataformas digitales, constituyen medios válidos para el intercambio de información relacionada con el presente contrato. El COMPRADOR acepta que las notificaciones, confirmaciones y comunicaciones enviadas por estos medios tienen plena validez jurídica, conforme a la Ley 527 de 1999 sobre Comercio Electrónico.`;

  doc.fontSize(9)
     .fillColor('#000000')
     .font('Helvetica')
     .text(clausula19Texto, margin + 5, yPos, {
       width: contentWidth - 10,
       align: 'justify',
       lineGap: 3
     });

  // Footer para esta página
  doc.fontSize(7)
     .fillColor('#666666')
     .text('NIT: 1032406128 | RNT: 122035 | Tel: 320 492 44 44 | Email: info@viajaya.com', 
           margin, 750, {
             width: contentWidth,
             align: 'center'
           });

  return yPos + 50;
};

// ✅ Función principal para generar el PDF del contrato
// ✅ Actualizar la función principal para usar el nuevo diseño
const generateContractPDF = async (contractData, saveToFile = true) => {
  try {
    console.log('🔄 Generando PDF de contrato:', contractData.contract_number);
    
    // Crear el documento PDF con mismo margin que cotización
    const doc = new PDFDocument({ 
      margin: 25, // Mismo margin que cotización
      size: 'A4'
    });

    // ✅ Asignar número de contrato al documento para uso en headers
    doc._currentContractNumber = contractData.contract_number;

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 25;
    const contentWidth = pageWidth - 2 * margin;

    // Si se debe guardar como archivo
    let stream;
    if (saveToFile) {
      const pdfDir = ensurePDFDirectory();
      const filename = `contrato-${contractData.contract_number}.pdf`;
      const filepath = path.join(pdfDir, filename);
      stream = fs.createWriteStream(filepath);
      doc.pipe(stream);
    }

    // ================= PÁGINA 1 - PORTADA CON NUEVO DISEÑO =================
    let yPosition = createContractHeader(doc);
    yPosition = createContractTitle(doc, yPosition);
    yPosition = createContractClauses(doc, contractData, yPosition);
    
    // Footer simple para página 1
    doc.fontSize(7)
       .fillColor('#666666')
       .text('NIT: 1032406128 | RNT: 122035 | Tel: 320 492 44 44 | Email: info@viajaya.com', 
             margin, 750, {
               width: contentWidth,
               align: 'center'
             });
    
    // ================= CONTINUAR CON LAS DEMÁS PÁGINAS... =================
    // (mantener el resto de las funciones existentes)
    createReservaSection(doc, contractData);
    createFinancialSection(doc, contractData);
    createAdditionalClausesPages(doc, contractData);

    // ================= ÚLTIMA HOJA: DATOS DE LA EMPRESA Y FIRMA =================
    doc.addPage();
    createContractHeader(doc);
    let yPos = 120;

    // Datos de la empresa con diseño mejorado
    doc.rect(margin, yPos, contentWidth, 25)
       .fillColor('#2be0e9') // ColorAzul del PDF de cotización
       .fill();

    doc.fontSize(14)
      .fillColor('white')
      .font('Helvetica-Bold')
      .text('VIAJA YA - OPERADOR TURÍSTICO Y AGENCIA DE VIAJES', margin + 5, yPos + 6, {
        width: contentWidth - 10,
        align: 'center'
      });
    
    yPos += 40;
    
    // Información de la empresa
    const empresaInfo = [
      'NIT: 1032406128',
      'RNT: 122035',
      'Oficina principal: Centro Comercial Plaza Ensueño 2° Piso, Bogotá D.C.',
      'Tel: 320 492 44 44',
      'Email: info@viajaya.com'
    ];

    empresaInfo.forEach(info => {
      doc.fontSize(10)
         .fillColor('#000000')
         .font('Helvetica')
         .text(info, margin, yPos, { width: contentWidth, align: 'center' });
      yPos += 15;
    });

    yPos += 20;

    // ================= INFORMACIÓN DE COMUNICACIÓN ================== 
    
    // Texto informativo sobre comunicación telefónica
    const textoInformativo = `Informamos que si su contrato tiene acuerdos de pagos mensuales se comunicaran del número telefónico. Numero (3209560958) recordándole la protección de la reserva Departamento que se encargara de cuidar su reserva y protegerla`;
    
    doc.fontSize(9)
       .fillColor('#000000')
       .font('Helvetica')
       .text(textoInformativo, margin + 5, yPos, {
         width: contentWidth - 10,
         align: 'justify',
         lineGap: 3
       });

    yPos += 50;

    // Texto sobre evitar cambios de reserva
    const textoEvitarCambios = `Para evitar que la reserva inicial cambie de su estado por favor cancelar sus acuerdos de pago a las siguientes cuentas bancarias:`;
    
    doc.fontSize(9)
       .fillColor('#000000')
       .font('Helvetica')
       .text(textoEvitarCambios, margin + 5, yPos, {
         width: contentWidth - 10,
         align: 'justify',
         lineGap: 3
       });

    yPos += 30;

    // Información bancaria
    const textoBancario = `Bancolombia de ahorros No 84668111024 cedula representante legal 1070326574`;
    
    doc.fontSize(9)
       .fillColor('#7b2cbf')
       .font('Helvetica-Bold')
       .text(textoBancario, margin + 5, yPos, {
         width: contentWidth - 10,
         align: 'center',
         lineGap: 3
       });

    yPos += 40;

    // ================= SECCIÓN DE FIRMAS EN DOS COLUMNAS =================
    
    const firmasSectionHeight = 150;
    const firmaColumnWidth = contentWidth / 2 - 10;
    const leftColumnX = margin;
    const rightColumnX = margin + firmaColumnWidth + 20;
    
    // Fondo para la sección de firmas
    doc.rect(margin, yPos, contentWidth, firmasSectionHeight)
       .fillColor('#f8f9fa')
       .fill()
       .strokeColor('#dee2e6')
       .lineWidth(1)
       .stroke();
    
    yPos += 20;
    
    // =========== COLUMNA IZQUIERDA: FIRMA DE LA EMPRESA ===========
    
    // Título de la columna izquierda
    doc.fontSize(11)
       .fillColor('#7b2cbf')
       .font('Helvetica-Bold')
       .text('FIRMA DEL VENDEDOR', leftColumnX + 5, yPos, {
         width: firmaColumnWidth - 10,
         align: 'center'
       });
    
    // Línea divisoria vertical entre columnas
    doc.moveTo(margin + firmaColumnWidth + 10, yPos - 10)
       .lineTo(margin + firmaColumnWidth + 10, yPos + firmasSectionHeight - 30)
       .strokeColor('#dee2e6')
       .lineWidth(1)
       .stroke();
    
    // Firma de la empresa (más pequeña)
    const firmaPath = path.join(__dirname, '../assets/firma.png');
    try {
      doc.image(firmaPath, leftColumnX + 25, yPos + 15, { width: 120 });
    } catch (e) {
      doc.fontSize(9).fillColor('red').text('Firma no disponible', leftColumnX + 25, yPos + 15);
    }
    
    // Información del representante legal
    doc.fontSize(9)
       .fillColor('#000000')
       .font('Helvetica-Bold')
       .text('GABRIELA MATEUS HENAO', leftColumnX + 5, yPos + 85, {
         width: firmaColumnWidth - 10,
         align: 'center'
       });
    
    doc.fontSize(8)
       .font('Helvetica')
       .text('Representante Legal', leftColumnX + 5, yPos + 98, {
         width: firmaColumnWidth - 10,
         align: 'center'
       });
    
    doc.fontSize(8)
       .text('VIAJA YA - OPERADOR TURÍSTICO', leftColumnX + 5, yPos + 110, {
         width: firmaColumnWidth - 10,
         align: 'center'
       });
    
    // =========== COLUMNA DERECHA: FIRMA DEL CLIENTE ===========
    
    // Título de la columna derecha
    doc.fontSize(11)
       .fillColor('#7b2cbf')
       .font('Helvetica-Bold')
       .text('FIRMA DEL COMPRADOR', rightColumnX + 5, yPos, {
         width: firmaColumnWidth - 10,
         align: 'center'
       });
    
    // Espacio para firma del cliente
    const firmaClienteY = yPos + 25;
    const firmaClienteHeight = 50;
    
    // Rectángulo para la firma del cliente
    doc.rect(rightColumnX + 15, firmaClienteY, firmaColumnWidth - 30, firmaClienteHeight)
       .fillColor('#ffffff')
       .fill()
       .strokeColor('#7b2cbf')
       .lineWidth(1)
       .stroke();
    
    // Texto indicativo dentro del rectángulo
    doc.fontSize(8)
       .fillColor('#999999')
       .font('Helvetica-Oblique')
       .text('Espacio para firma', rightColumnX + 20, firmaClienteY + 20, {
         width: firmaColumnWidth - 40,
         align: 'center'
       });
    
    // Línea para la firma
    doc.moveTo(rightColumnX + 20, firmaClienteY + firmaClienteHeight + 10)
       .lineTo(rightColumnX + firmaColumnWidth - 20, firmaClienteY + firmaClienteHeight + 10)
       .strokeColor('#000000')
       .lineWidth(1)
       .stroke();
    
    // Información del comprador
    const nombreComprador = contractData.nombre_pasajero_principal || 
                           contractData.nombre_titular || 
                           'NOMBRE DEL COMPRADOR';
    
    doc.fontSize(9)
       .fillColor('#000000')
       .font('Helvetica-Bold')
       .text(nombreComprador.toUpperCase(), rightColumnX + 5, yPos + 85, {
         width: firmaColumnWidth - 10,
         align: 'center'
       });
    
    doc.fontSize(8)
       .font('Helvetica')
       .text('Comprador', rightColumnX + 5, yPos + 98, {
         width: firmaColumnWidth - 10,
         align: 'center'
       });
    
    // Información del documento del comprador si está disponible
    const documentoComprador = contractData.documento_titular || contractData.numero_documento;
    if (documentoComprador) {
      doc.fontSize(8)
         .text(`C.C. ${documentoComprador}`, rightColumnX + 5, yPos + 110, {
           width: firmaColumnWidth - 10,
           align: 'center'
         });
    }
    
    yPos += firmasSectionHeight + 20;
    
    // ================= INFORMACIÓN ADICIONAL DE CONTACTO =================
    
    // Línea divisoria
    yPos = addSectionDivider(doc, yPos, margin, contentWidth, 'solid');
    
    // Información de contacto en formato compacto
    doc.fontSize(8)
       .fillColor('#666666')
       .font('Helvetica')
       .text('NIT: 1032406128 | RNT: 122035 | Tel: 320 492 44 44 | Email: info@viajaya.com', 
             margin, yPos, {
               width: contentWidth,
               align: 'center'
             });
    
    yPos += 15;
    
    doc.fontSize(8)
       .text('Oficina: Centro Comercial Plaza Ensueño 2° Piso, Bogotá D.C.', 
             margin, yPos, {
               width: contentWidth,
               align: 'center'
             });

    // Finalizar el documento
    doc.end();

    if (saveToFile) {
      await new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
      });
      
      const pdfDir = ensurePDFDirectory();
      const filename = `contrato-${contractData.contract_number}.pdf`;
      const filepath = path.join(pdfDir, filename);

      console.log('✅ PDF de contrato generado exitosamente:', filepath);
      
      return {
        filepath,
        filename,
        relativePath: `uploads/pdfs/${filename}`,
        buffer: fs.readFileSync(filepath)
      };
    } else {
      return new Promise((resolve, reject) => {
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve({
            buffer: pdfBuffer,
            filename: `contrato-${contractData.contract_number}.pdf`
          });
        });
        doc.on('error', reject);
      });
    }
    
  } catch (error) {
    console.error('❌ Error generando PDF de contrato:', error);
    throw new Error(`Error generando PDF de contrato: ${error.message}`);
  }
};

module.exports = {
  generateContractPDF,
  ensurePDFDirectory,
  formatearFecha,
  formatearMoneda,
  numeroALetras,
  createContractHeader,
  createContractTitle,
  createContractClauses,
  createReservaSection,
  createFinancialSection,
  createAdditionalClausesPages
};