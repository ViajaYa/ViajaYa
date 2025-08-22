const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { generatePassengerSummary } = require('./passengerValidation');

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

// ✅ Función para formatear fechas en español
const formatearFecha = (fecha) => {
  return new Date(fecha).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
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
  const margin = 40;
  const headerHeight = 80;
  // Fondo azul (mantener color original)
  doc.rect(0, 0, pageWidth, headerHeight)
     .fillColor('#00bcd4')
     .fill();

  // Logo a la izquierda (intenta varios archivos)
  const logoCandidates = [
    
    path.join(__dirname, '../assets/NuevoLogo.png'),
    path.join(__dirname, '../assets/logo2.png')
  ];
  let logoLoaded = false;
  for (const logoPath of logoCandidates) {
    try {
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, margin, 16, { width: 48, height: 48 });
        logoLoaded = true;
        break;
      }
    } catch (error) {}
  }
  if (!logoLoaded) {
    doc.fontSize(8).fillColor('white').text('Logo no disponible', margin, 30);
  }

  // Datos empresa a la derecha del logo
  doc.fontSize(13)
     .fillColor('white')
     .font('Helvetica-Bold')
     .text('VIAJA YA', margin + 60, 20)
     .fontSize(8)
     .font('Helvetica')
     .text('Hacemos realidad tus sueños de viaje', margin + 60, 36)
     .text('info@viajaya.com | +57 320 492 44 44', margin + 60, 48)
     .text('Bogotá, Colombia', margin + 60, 60);

  // Número de contrato a la derecha
  if (doc._currentContractNumber) {
    doc.fontSize(12).fillColor('white').font('Helvetica-Bold')
      .text(`Contrato: ${doc._currentContractNumber}`, pageWidth - 180, 20, { width: 150, align: 'right' });
  }

  return headerHeight + 20;
};

// ✅ Función para crear título del contrato
const createContractTitle = (doc, yPos) => {
  const margin = 40;
  const pageWidth = doc.page.width;
  
  doc.fontSize(12)
     .fillColor('#000000')
     .font('Helvetica-Bold')
     .text('CONTRATO DE PRESTACIÓN DE SERVICIOS Y/O PRODUCTOS TURÍSTICOS DE:', 
           margin, yPos, {
             width: pageWidth - 2 * margin,
             align: 'center'
           });
  
  doc.fontSize(11)
     .font('Helvetica-Bold')
     .text('OPERADOR TURÍSTICO Y AGENCIA DE VIAJES VIAJA YA RNT 122035', 
           margin, yPos + 20, {
             width: pageWidth - 2 * margin,
             align: 'center'
           });
  
  return yPos + 60;
};

// ✅ Función para crear cláusulas del contrato
const createContractClauses = (doc, contractData, yPos) => {
  const margin = 40;
  const pageWidth = doc.page.width;
  const contentWidth = pageWidth - 2 * margin;
  
  // CLÁUSULA PRIMERA
  doc.fontSize(10)
     .fillColor('#000000')
     .font('Helvetica-Bold')
     .text('CLÁUSULA PRIMERA. PARTES: ', margin, yPos);
  
  doc.font('Helvetica')
     .text(`El presente contrato será suscrito entre MAYERLY ALEJANDRA HENAO HIGUERA identificado con número de cédula ciudadanía No 1032406128 quien en primer lugar bajo primer comercial "OPERADOR TURÍSTICO Y AGENCIA DE VIAJES VIAJA YA", con domicilio en Bogotá DC, en la Oficina Principal Centro Comercial Plaza En sueño 2 PISO , con NIT 1032406128 y Registro Nacional de Turismo N°122035, que en adelante será denominado VENDEDOR. Por otra parte, el COMPRADOR, quien se encuentra debidamente identificado en los datos de la reserva y en el capítulo correspondiente del presente contrato.`, 
           margin, yPos + 15, {
             width: contentWidth,
             align: 'justify',
             lineGap: 2
           });
  
  yPos += 100;
  
  // PÁRRAFO PRIMERO
  doc.fontSize(10)
     .font('Helvetica-Bold')
     .text('PÁRRAFO PRIMERO: EL OPERADOR TURÍSTICO Y AGENCIA DE VIAJES – VIAJAYA ', margin, yPos);
  
  doc.font('Helvetica')
     .text('es una agencia de viajes y turismo dedicada a la comercialización y venta de productos y servicios turísticos, entre otros, conforme se señala en el Certificado de Existencia y Representación Legal, y en el Registro Nacional de Turismo RNT regulado por FONTUR', 
           margin, yPos + 15, {
             width: contentWidth,
             align: 'justify',
             lineGap: 2
           });
  
  yPos += 80;
  
  // CLÁUSULA SEGUNDA
  doc.fontSize(10)
     .font('Helvetica-Bold')
     .text('CLAUSULA SEGUNDA. Objeto: ', margin, yPos);
  
  doc.font('Helvetica')
     .text('EL COMPRADOR a través de este contrato acuerda con EL VENDEDOR la compra de un paquete turístico a cambio de un precio y conforme a las especificaciones que a continuación se detallan:', 
           margin, yPos + 15, {
             width: contentWidth,
             align: 'justify',
             lineGap: 2
           });
  
  return yPos + 80;
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
  const boxHeight = 450;
  const boxY = yPos;
  
  // Fondo del cuadro
  doc.rect(margin, boxY, contentWidth, boxHeight)
     .fillColor('#e8f4f8')
     .fill()
     .strokeColor('#7b2cbf')
     .lineWidth(2)
     .stroke();
  
  // Headers del cuadro
  const headerHeight = 25;
  
  // Header izquierdo - FECHA DE RESERVA
  doc.rect(margin, boxY, contentWidth/2, headerHeight)
     .fillColor('#7b2cbf')
     .fill();
  
  doc.fontSize(10)
     .fillColor('#ffffff')
     .font('Helvetica-Bold')
     .text('FECHA DE RESERVA: ' + formatearFecha(contractData.fecha_firma), 
           margin + 5, boxY + 8);
  
  // Header derecho - NUMERO DE CONTRATO
  doc.rect(margin + contentWidth/2, boxY, contentWidth/2, headerHeight)
     .fillColor('#7b2cbf')
     .fill();
  
  doc.fontSize(10)
     .fillColor('#ffffff')
     .font('Helvetica-Bold')
     .text('NUMERO DE CONTRATO: ' + contractData.contract_number, 
           margin + contentWidth/2 + 5, boxY + 8);
  
  yPos = boxY + headerHeight + 10;
  
  // Datos del titular
  doc.fontSize(10)
     .fillColor('#000000')
     .font('Helvetica-Bold')
     .text('DATOS RESERVA Y DATOS PERSONALES DEL TITULAR DEL CONTRATO', margin + 5, yPos);
  
  yPos += 20;
  
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
      value: 'Información no disponible' // TODO: Agregar campo dirección al modelo
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
  
  // Dibujar datos en formato tabla
  titularData.forEach((item, index) => {
    if (index % 2 === 0) { // Columna izquierda
      doc.fontSize(8)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text(item.label, margin + 5, yPos);
      
      doc.fontSize(8)
         .font('Helvetica')
         .text(item.value, margin + 5, yPos + 10);
    } else { // Columna derecha
      doc.fontSize(8)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text(item.label, margin + 5 + colWidth, yPos - 20);
      
      doc.fontSize(8)
         .font('Helvetica')
         .text(item.value, margin + 5 + colWidth, yPos - 10);
      
      yPos += 30;
    }
  });
  
  // ✅ TRASLADOS - Información detallada del backend
  yPos += 10;
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
      trasladosTexto += `${trasladosIncluidos.join(' y ')} INCLUIDOS - Costo total: ${formatearMoneda(traslados.valor)} APLICA SI: X NO: _`;
    } else {
      trasladosTexto += `NO INCLUIDOS - Costo adicional: ${formatearMoneda(traslados.valor)} APLICA SI: _ NO: X`;
    }
    
    // Agregar información de costos individuales
    if (detalles.aeropuerto_hotel_ida?.costo || detalles.hotel_aeropuerto_vuelta?.costo) {
      trasladosTexto += ' (';
      const costosDetalle = [];
      if (detalles.aeropuerto_hotel_ida?.costo) {
        costosDetalle.push(`ida: ${formatearMoneda(detalles.aeropuerto_hotel_ida.costo)}`);
      }
      if (detalles.hotel_aeropuerto_vuelta?.costo) {
        costosDetalle.push(`vuelta: ${formatearMoneda(detalles.hotel_aeropuerto_vuelta.costo)}`);
      }
      trasladosTexto += costosDetalle.join(', ') + ')';
    }
  } else {
    // Fallback a datos anteriores
    const trasladosOld = contractData.Quote?.Calculation?.traslados;
    if (trasladosOld) {
      const trasladosIncluidos = [];
      if (trasladosOld.aeropuerto_hotel_ida?.incluido) {
        trasladosIncluidos.push('aeropuerto hotel');
      }
      if (trasladosOld.hotel_aeropuerto_vuelta?.incluido) {
        trasladosIncluidos.push('hotel aeropuerto');
      }
      
      if (trasladosIncluidos.length > 0) {
        trasladosTexto += trasladosIncluidos.join(' - ') + ' APLICA SI: X NO: _';
      } else {
        trasladosTexto += 'NO INCLUIDOS APLICA SI: _ NO: X';
      }
    } else {
      trasladosTexto += 'INFORMACIÓN NO DISPONIBLE';
    }
  }
  
  doc.fontSize(9)
     .fillColor('#000000')
     .font('Helvetica-Bold')
     .text(trasladosTexto, margin + 5, yPos, {
       width: contentWidth - 10
     });
  
  // ✅ TIQUETES - Información detallada del backend
  yPos += 15;
  const tiquetes = contractData.quote_calculation_analysis?.items_detallados?.find(item => item.tipo === 'tickets');
  let tiquetesTexto = 'TIQUETES: ';
  
  if (tiquetes) {
    const detalles = tiquetes.detalles;
    tiquetesTexto += detalles.tipo === 'ida_vuelta' ? 'IDA Y REGRESO' : 'SOLO IDA';
    tiquetesTexto += ` - ${detalles.origen} ↔ ${detalles.destino}`;
    if (detalles.proveedor) {
      tiquetesTexto += ` - Aerolínea: ${detalles.proveedor.toUpperCase()}`;
    }
    tiquetesTexto += ` - Valor: ${formatearMoneda(tiquetes.valor)}`;
    
    if (detalles.fecha_ida) {
      tiquetesTexto += ` - Ida: ${formatearFecha(detalles.fecha_ida)}`;
    }
    if (detalles.fecha_vuelta) {
      tiquetesTexto += ` - Vuelta: ${formatearFecha(detalles.fecha_vuelta)}`;
    }
  } else {
    // Fallback a datos anteriores si no existe la nueva estructura
    const tiquetesOld = contractData.Quote?.Calculation?.tiquetes;
    if (tiquetesOld) {
      tiquetesTexto += tiquetesOld.tipo === 'ida_vuelta' ? 'ida y regreso' : 'solo ida';
      if (tiquetesOld.proveedor) {
        tiquetesTexto += ` - Aerolínea: ${tiquetesOld.proveedor.toUpperCase()}`;
      }
    } else {
      tiquetesTexto += 'información no disponible';
    }
  }
  
  doc.fontSize(8)
     .font('Helvetica')
     .text(tiquetesTexto, margin + 5, yPos, {
       width: contentWidth - 10
     });
  
  // ✅ EQUIPAJE - Información detallada del backend
  yPos += 20;
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
    if (detalles.equipaje_extra?.incluido) {
      incluidoItems.push('equipaje extra incluido');
    }
    
    if (incluidoItems.length > 0) {
      equipajeTexto += `${incluidoItems.join(', ')} - Costo total: ${formatearMoneda(equipaje.valor)} - verificar dimensiones con aerolínea. EL QR de check in se entregará 24 horas antes – APLICA ley aérea`;
    } else {
      equipajeTexto += `Costo equipaje adicional: ${formatearMoneda(equipaje.valor)} - 40*35*25 tipo morral-mochila 8 a 10° kilos de peso - la mochila debe ir bajo asientos aéreos (No se asegura silla continua dependemos de aerolínea) EL QR de check in se entregará 24 horas antes – APLICA ley aérea`;
    }
  } else {
    // Fallback a datos anteriores
    const equipajeOld = contractData.Quote?.Calculation?.equipaje;
    if (equipajeOld) {
      const detalles = [];
      if (equipajeOld.cabina?.incluido) {
        detalles.push('equipaje de cabina incluido');
      }
      if (equipajeOld.bodega?.incluido) {
        detalles.push('equipaje de bodega incluido');
      }
      
      if (detalles.length > 0) {
        equipajeTexto += `${detalles.join(', ')} - verificar dimensiones con aerolínea. EL QR de check in se entregará 24 horas antes – APLICA ley aérea`;
      } else {
        equipajeTexto += '40*35*25 tipo morral-mochila 8 a 10° kilos de peso - la mochila debe ir bajo asientos aéreos (No se asegura silla continua dependemos de aerolínea) EL QR de check in se entregará 24 horas antes – APLICA ley aérea';
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
  
  yPos += 60;
  
  // ✅ ALOJAMIENTO - Información detallada del backend
  const hotel = contractData.quote_calculation_analysis?.items_detallados?.find(item => item.tipo === 'hotel');
  const alimentacion = contractData.quote_calculation_analysis?.items_detallados?.find(item => item.tipo === 'alimentacion');
  const seguros = contractData.quote_calculation_analysis?.items_detallados?.find(item => item.tipo === 'seguros');
  
  if (hotel) {
    doc.fontSize(9)
       .fillColor('#000000')
       .font('Helvetica-Bold')
       .text('ALOJAMIENTO:', margin + 5, yPos);
    
    yPos += 15;
    
    const detalles = hotel.detalles;
    const hotelInfo = [
      `Nombre de Hotel: ${detalles.nombre || 'Por confirmar'}`,
      `Categoría: ${detalles.categoria?.replace('_', ' ') || 'No especificada'}`,
      `Acomodación: ${detalles.acomodacion || 'No especificada'}`,
      `No de Noches: ${detalles.noches || 'No especificado'} noches`,
      `Costo por noche: ${formatearMoneda(detalles.costo_noche || 0)}`,
      `Valor total hotel: ${formatearMoneda(hotel.valor)}`,
    ];
    
    if (detalles.ubicacion) {
      hotelInfo.push(`Ubicación: ${detalles.ubicacion}`);
    }
    if (detalles.proveedor) {
      hotelInfo.push(`Proveedor: ${detalles.proveedor}`);
    }
    
    // Información de alimentación detallada
    if (alimentacion && alimentacion.detalles) {
      let alimentacionTexto = 'Tipo Alimentación: ';
      switch(alimentacion.detalles.tipo) {
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
        default:
          alimentacionTexto += alimentacion.detalles.tipo || 'No especificada';
      }
      
      alimentacionTexto += ` - Costo: ${formatearMoneda(alimentacion.valor)}`;
      
      if (alimentacion.detalles.observaciones) {
        alimentacionTexto += `. ${alimentacion.detalles.observaciones}`;
      } else {
        alimentacionTexto += '. Check in: Primer día 3 pm y Check out: Último día según hotel.';
      }
      
      if (alimentacion.detalles.proveedor) {
        alimentacionTexto += ` Proveedor: ${alimentacion.detalles.proveedor}`;
      }
      
      hotelInfo.push(alimentacionTexto);
    }
    
    // Información detallada de seguros
    if (seguros && seguros.valor > 0) {
      const segDetalles = seguros.detalles;
      let segurosTexto = `Seguros incluidos - Costo total: ${formatearMoneda(seguros.valor)}`;
      
      if (segDetalles.asistencia_medica?.incluido) {
        segurosTexto += ` - Asistencia médica: ${segDetalles.asistencia_medica.tipo || 'Básica'}`;
        if (segDetalles.asistencia_medica.proveedor) {
          segurosTexto += ` (${segDetalles.asistencia_medica.proveedor})`;
        }
      }
      
      if (segDetalles.cancelacion?.incluido) {
        segurosTexto += ' - Seguro de cancelación incluido';
        if (segDetalles.cancelacion.proveedor) {
          segurosTexto += ` (${segDetalles.cancelacion.proveedor})`;
        }
      }
      
      hotelInfo.push(segurosTexto);
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
  } else {
    // Fallback a estructura anterior
    const hotelOld = contractData.Quote?.Calculation?.hotel;
    if (hotelOld) {
      doc.fontSize(9)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('ALOJAMIENTO:', margin + 5, yPos);
      
      yPos += 15;
      
      const hotelInfo = [
        `Nombre de Hotel: ${hotelOld.nombre || 'Por confirmar'}`,
        `Acomodación: ${hotelOld.acomodacion || 'No especificada'}`,
        `No de Noches: ${hotelOld.noches || 'No especificado'}`,
        `Categoría: ${hotelOld.categoria || 'No especificada'}`,
      ];
      
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
  
  // Sección de descripción del servicio
  doc.rect(margin, yPos, contentWidth, 25)
     .fillColor('#7b2cbf')
     .fill();
  
  doc.fontSize(10)
     .fillColor('#ffffff')
     .font('Helvetica-Bold')
     .text('DESCRIPCIÓN DEL SERVICIO', margin + 5, yPos + 8);
  
  yPos += 35;
  
  // ✅ Información del plan - basada en datos reales detallados
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
  } else if (calculation?.alimentacion?.tipo) {
    // Fallback a estructura anterior
    switch(calculation.alimentacion.tipo) {
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
  
  // Agregar información de origen si está disponible
  if (contractData.Quote?.origen) {
    planInfo += ` desde ${contractData.Quote.origen}`;
  }
  
  doc.fontSize(9)
     .fillColor('#000000')
     .font('Helvetica-Bold')
     .text('Concepto: ' + planInfo + ' - Aplica penalidades por cambios y cancelaciones', margin + 5, yPos);
  
  yPos += 15;
  
  // ✅ Actividades adicionales - basadas en excursiones detalladas
  const excursiones = contractData.quote_calculation_analysis?.items_detallados?.filter(item => item.tipo === 'excursiones');
  let actividadesTexto = 'Actividades Adicionales: ';
  
  if (excursiones && excursiones.length > 0) {
    const nombreExcursiones = excursiones.map(exc => {
      let texto = exc.descripcion || exc.detalles?.nombre || 'Excursión';
      if (exc.valor) {
        texto += ` (${formatearMoneda(exc.valor)})`;
      }
      return texto;
    }).join(', ');
    actividadesTexto += nombreExcursiones;
  } else {
    // Fallback a estructura anterior
    const excursionesOld = calculation?.excursiones;
    if (excursionesOld && excursionesOld.length > 0) {
      const nombreExcursiones = excursionesOld.map(exc => exc.nombre || 'Excursión').join(', ');
      actividadesTexto += nombreExcursiones;
    } else {
      actividadesTexto += 'NO APLICA';
    }
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
  
  // ✅ Asistencia médica - basada en seguros detallados
  const segurosDetallados = contractData.quote_calculation_analysis?.items_detallados?.find(item => item.tipo === 'seguros');
  let asistenciaTexto = 'Asistencia médica: ';
  
  if (segurosDetallados && segurosDetallados.valor > 0) {
    asistenciaTexto += 'SI Aplica (se entrega un día antes de su fecha de viaje y verifique su cobertura)';
    
    const segDetalles = segurosDetallados.detalles;
    if (segDetalles?.asistencia_medica?.tipo) {
      asistenciaTexto += ` - Tipo: ${segDetalles.asistencia_medica.tipo}`;
    }
    if (segDetalles?.asistencia_medica?.proveedor) {
      asistenciaTexto += ` (${segDetalles.asistencia_medica.proveedor})`;
    }
    if (segDetalles?.cancelacion?.incluido) {
      asistenciaTexto += ' y Seguro de cancelación incluido';
    }
    
    asistenciaTexto += ` - Costo total seguros: ${formatearMoneda(segurosDetallados.valor)}`;
  } else {
    // Fallback a estructura anterior
    const segurosOld = contractData.Quote?.Calculation?.seguros;
    if (segurosOld && segurosOld.costo_total > 0) {
      asistenciaTexto += 'SI Aplica (se entrega un día antes de su fecha de viaje y verifique su cobertura)';
      if (segurosOld.asistencia_medica?.tipo) {
        asistenciaTexto += ` y Seguro ${segurosOld.asistencia_medica.tipo}`;
      }
    } else {
      asistenciaTexto += 'Verificar disponibilidad según destino';
    }
  }
  
  doc.fontSize(8)
     .font('Helvetica')
     .text(asistenciaTexto, margin + 5, yPos, {
       width: contentWidth - 10
     });
  
  // ✅ DATOS DE LOS VIAJEROS - Información real
  yPos += 30;
  doc.fontSize(9)
     .fillColor('#000000')
     .font('Helvetica-Bold')
     .text('DATOS DE LOS VIAJEROS', margin + 5, yPos);
  
  // Información de pasajeros reales
  if (contractData.Quote?.Passengers && contractData.Quote.Passengers.length > 0) {
    const blockHeight = 20 + 12 + 12 + 12 + 10; // Altura estimada por pasajero (66)
    const pageHeight = doc.page.height;
    const bottomMargin = 60;
    contractData.Quote.Passengers.forEach((passenger, index) => {
      // Si no hay suficiente espacio, salto de página manual y header
      if (yPos + blockHeight > pageHeight - bottomMargin) {
        doc.addPage();
        createContractHeader(doc);
        yPos = 120;
        doc.fontSize(9)
          .fillColor('#000000')
          .font('Helvetica-Bold')
          .text('DATOS DE LOS VIAJEROS (continuación)', margin + 5, yPos);
        yPos += 20;
      }
      yPos += 20;
      doc.fontSize(8)
         .font('Helvetica-Bold')
         .text(`${passenger.nombre.toUpperCase()} ${passenger.apellido.toUpperCase()}:`, margin + 5, yPos);
      yPos += 12;
      doc.fontSize(8)
         .font('Helvetica')
         .text(`${passenger.tipo_documento.toUpperCase()}. ${passenger.documento_identidad}`, margin + 5, yPos);
      yPos += 12;
      doc.fontSize(8)
         .text(`Celular: ${cliente?.phone || 'No registrado'}`, margin + 5, yPos);
      yPos += 12;
      doc.fontSize(8)
         .text(`Fecha de nacimiento: ${formatearFecha(passenger.fecha_nacimiento)}`, margin + 5, yPos);
      // Agregar espacio entre pasajeros
      if (index < contractData.Quote.Passengers.length - 1) {
        yPos += 10;
      }
    });
  }
  
  return yPos + 30;
};

// ✅ Función para crear página 3 con información financiera
const createFinancialSection = (doc, contractData) => {
  doc.addPage();
  
  // Header colorido en página 3
  createContractHeader(doc);
  
  const margin = 40;
  const pageWidth = doc.page.width;
  const contentWidth = pageWidth - 2 * margin;
  let yPos = 120;
  
  // ✅ Información de precios - datos reales detallados
  const precioTotal = parseFloat(contractData.precio_total || 0);
  const precioPorPersona = precioTotal / (contractData.numero_pasajeros || 1);
  const analysis = contractData.quote_calculation_analysis;
  
  // Crear cuadro de precios con más detalles
  const priceBoxHeight = analysis ? 220 : 150;
  
  doc.rect(margin, yPos, contentWidth, priceBoxHeight)
     .fillColor('#ffffff')
     .fill()
     .strokeColor('#000000')
     .lineWidth(1)
     .stroke();
  
  yPos += 20;
  
  doc.fontSize(12)
     .fillColor('#000000')
     .font('Helvetica-Bold')
     .text(`VALOR PRECIO POR PERSONA: $ ${formatearMoneda(precioPorPersona).replace('$', '')}`, margin + 10, yPos);
  
  yPos += 20;
  doc.fontSize(12)
     .text(`Número de pasajeros: ${contractData.numero_pasajeros} Pasajeros`, margin + 10, yPos);
  
  yPos += 20;
  doc.fontSize(14)
     .fillColor('#7b2cbf')
     .font('Helvetica-Bold')
     .text(`VALOR PRECIO TOTAL CONTRATO: ${formatearMoneda(precioTotal)}`, margin + 10, yPos);
  
  // Mostrar desglose de costos si está disponible
  if (analysis && analysis.items_detallados) {
    yPos += 25;
    doc.fontSize(9)
       .fillColor('#000000')
       .font('Helvetica-Bold')
       .text('DESGLOSE DE COSTOS:', margin + 10, yPos);
    
    yPos += 15;
    
    analysis.items_detallados.forEach(item => {
      if (item.requiere_compra && item.valor > 0) {
        doc.fontSize(8)
           .font('Helvetica')
           .text(`• ${item.descripcion}: ${formatearMoneda(item.valor)}`, margin + 15, yPos);
        yPos += 12;
      }
    });
    
    // Mostrar información financiera adicional si está disponible
    if (analysis.financials) {
      yPos += 10;
      doc.fontSize(8)
         .font('Helvetica-Bold')
         .text(`Costo base: ${formatearMoneda(analysis.financials.costo_base)}`, margin + 15, yPos);
      yPos += 10;
      doc.fontSize(8)
         .text(`Total comisiones: ${formatearMoneda(analysis.financials.total_comisiones)}`, margin + 15, yPos);
    }
  }
  
  yPos += 20;
  doc.fontSize(10)
     .fillColor('#000000')
     .font('Helvetica-Bold')
     .text(`VALOR TOTAL DEL CONTRATO EN LETRA: ${numeroALetras(precioTotal)} pesos (pesos M/CTE)`, 
           margin + 10, yPos, {
             width: contentWidth - 20,
             align: 'justify'
           });
  
  yPos += 50;
  
  // ✅ Información de cuotas si aplica - datos reales
  if (contractData.forma_pago === 'cuotas') {
    const cuotaInicial = contractData.tiene_cuota_inicial ? parseFloat(contractData.cuota_inicial_monto || 0) : 0;
    const saldoPendiente = parseFloat(contractData.saldo_pendiente || contractData.monto_restante || 0);
    const numeroCuotas = contractData.numero_cuotas_restantes || 0;
    
    doc.fontSize(10)
       .text(`CUOTA INICIAL: ${formatearMoneda(cuotaInicial)} SALDO: $ ${formatearMoneda(saldoPendiente)} No cuotas: ${numeroCuotas}`, 
             margin + 10, yPos);
    
    yPos += 15;
    
    if (contractData.valor_cuota_restante) {
      const valorCuota = parseFloat(contractData.valor_cuota_restante);
      doc.fontSize(9)
         .text(`Valor de cuotas: ${formatearMoneda(valorCuota)} —VER ACUERDO DE PAGO —(siguiente página confirmas fechas)`, 
               margin + 10, yPos, {
                 width: contentWidth - 20
               });
    }
  } else {
    doc.fontSize(10)
       .text(`FORMA DE PAGO: PAGO ÚNICO - VALOR TOTAL: ${formatearMoneda(precioTotal)}`, 
             margin + 10, yPos);
  }
  
  yPos += 50;
  
  // ✅ Tabla de equipo de trabajo - datos reales del backend
  console.log('🔍 Debug contractData structure:', {
    hasQuote: !!contractData.Quote,
    quoteKeys: contractData.Quote ? Object.keys(contractData.Quote) : 'No Quote',
    fullQuote: contractData.Quote
  });
  
  console.log('🔍 Debug equipo de trabajo:', {
    asesor: contractData.Quote?.Asesor,
    lider: contractData.Quote?.Lider,
    gerente: contractData.Quote?.Gerente
  });
  
  doc.fontSize(10)
     .fillColor('#000000')
     .font('Helvetica-Bold')
     .text('Equipo de trabajo:', margin + 10, yPos);
  
  yPos += 20;
  
  // Información del asesor
  const asesor = contractData.Quote?.Asesor;
  const asesorInfo = asesor ? 
    `${asesor.name} ${asesor.lastname} - ${asesor.email}` : 
    'Por asignar';
  
  console.log('🔍 Asesor info:', asesorInfo);
  
  doc.fontSize(10)
     .fillColor('#000000')
     .font('Helvetica-Bold')
     .text('Asesor comercial:', margin + 10, yPos);
  
  doc.fontSize(9)
     .fillColor('#7b2cbf')
     .font('Helvetica')
     .text(asesorInfo, margin + 150, yPos, {
       width: contentWidth - 160
     });
  
  yPos += 20;
  
  // Información del líder
  const lider = contractData.Quote?.Lider;
  const liderInfo = lider ? 
    `${lider.name} ${lider.lastname} - ${lider.email}` : 
    'Por asignar';
  
  console.log('🔍 Lider info:', liderInfo);
  
  doc.fontSize(10)
     .fillColor('#000000')
     .font('Helvetica-Bold')
     .text('Líder comercial:', margin + 10, yPos);
  
  doc.fontSize(9)
     .fillColor('#7b2cbf')
     .font('Helvetica')
     .text(liderInfo, margin + 150, yPos, {
       width: contentWidth - 160
     });
  
  yPos += 20;
  
  // Información del gerente
  const gerente = contractData.Quote?.Gerente;
  const gerenteInfo = gerente ? 
    `${gerente.name} ${gerente.lastname} - ${gerente.email}` : 
    'Alejandra Henao - gerencia@viajaya.com';
  
  console.log('🔍 Gerente info:', gerenteInfo);
  
  doc.fontSize(10)
     .fillColor('#000000')
     .font('Helvetica-Bold')
     .text('Gerente de zona:', margin + 10, yPos);
  
  doc.fontSize(9)
     .fillColor('#7b2cbf')
     .font('Helvetica')
     .text(gerenteInfo, margin + 150, yPos, {
       width: contentWidth - 160
     });
  
  return yPos + 50;
};

// ✅ Función para crear página 4 con acuerdo de pago
const createPaymentSection = (doc, contractData) => {
  doc.addPage();
  
  // Header colorido en página 4
  createContractHeader(doc);
  
  const margin = 40;
  const pageWidth = doc.page.width;
  const contentWidth = pageWidth - 2 * margin;
  let yPos = 120;
  
  // Cuadro de acuerdo de pago
  const paymentBoxHeight = 500;
  
  doc.rect(margin, yPos, contentWidth, paymentBoxHeight)
     .fillColor('#7b2cbf')
     .fill();
  
  // Header del acuerdo
  doc.fontSize(12)
     .fillColor('#ffffff')
     .font('Helvetica-Bold')
     .text('ACUERDO DE PAGO', margin + 10, yPos + 15, {
       width: contentWidth - 20,
       align: 'center'
     });
  
  yPos += 50;
  
  // Texto del acuerdo
  doc.fontSize(9)
     .fillColor('#ffffff')
     .font('Helvetica')
     .text('Nos permitimos informarle que 30 días antes de su fecha de viaje debe estar a paz y salvo con el valor total de su reserva; quedan pactadas las cuotas en este acuerdo', 
           margin + 10, yPos, {
             width: contentWidth - 20,
             align: 'justify'
           });
  
  yPos += 40;
  doc.fontSize(9)
     .text('Tenga en cuenta consignar a las cuentas bancarias autorizadas y enviar sus soportes de pago al siguiente correo:', 
           margin + 10, yPos, {
             width: contentWidth - 20,
             align: 'justify'
           });
  
  yPos += 25;
  doc.fontSize(9)
     .fillColor('#00bcd4')
     .font('Helvetica-Bold')
     .text('soportedepagosviajaya@gmail.com', margin + 10, yPos);
  
  yPos += 25;
  doc.fontSize(9)
     .fillColor('#ffffff')
     .font('Helvetica')
     .text('para evitar cambios o cancelaciones de sus servicios, foto legible donde se pueda evidenciar fecha, número de aprobación y valor cancelado', 
           margin + 10, yPos, {
             width: contentWidth - 20,
             align: 'justify'
           });
  
  yPos += 30;
  doc.fontSize(9)
     .text('Es de responsabilidad del titular enviar e informar sus pagos mensuales CLAUSULA TERCERA PRECIO', 
           margin + 10, yPos, {
             width: contentWidth - 20,
             align: 'justify'
           });
  
  yPos += 50;
  
  // ✅ Tabla de pagos - solo si es en cuotas
  if (contractData.forma_pago === 'cuotas' && contractData.fechas_vencimiento_cuotas) {
    const tableY = yPos;
    const colWidths = [150, 120, 130];
    const headers = ['PAGO', 'VALOR', 'FECHA DE PAGO'];
    
    // Headers de la tabla
    let currentX = margin + 10;
    headers.forEach((header, index) => {
      doc.rect(currentX, tableY, colWidths[index], 25)
         .fillColor('#ffffff')
         .fill()
         .strokeColor('#000000')
         .lineWidth(1)
         .stroke();
      
      doc.fontSize(9)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text(header, currentX + 5, tableY + 8);
      
      currentX += colWidths[index];
    });
    
    yPos += 25;
    
    // ✅ Filas de pagos - datos reales
    const pagos = [];
    
    // Cuota inicial si existe
    if (contractData.tiene_cuota_inicial && contractData.cuota_inicial_monto > 0) {
      pagos.push({
        concepto: 'CUOTA INICIAL',
        valor: formatearMoneda(contractData.cuota_inicial_monto || 0).replace('$', ''),
        fecha: contractData.fecha_vencimiento_inicial ? formatearFecha(contractData.fecha_vencimiento_inicial) : 'Por definir'
      });
    }
    
    // Cuotas restantes - usar fechas reales
    if (contractData.fechas_vencimiento_cuotas && contractData.fechas_vencimiento_cuotas.length > 0) {
      contractData.fechas_vencimiento_cuotas.forEach((fecha, index) => {
        pagos.push({
          concepto: `CUOTA ${index + 1}`,
          valor: formatearMoneda(contractData.valor_cuota_restante || 0).replace('$', ''),
          fecha: formatearFecha(fecha)
        });
      });
    }
    
    // Si no hay cuotas definidas pero es pago en cuotas, mostrar mensaje
    if (pagos.length === 0) {
      doc.fontSize(9)
         .fillColor('#ffffff')
         .font('Helvetica')
         .text('Las fechas de pago serán definidas con el asesor comercial', 
               margin + 10, yPos, {
                 width: contentWidth - 20,
                 align: 'center'
               });
    } else {
      // Dibujar filas de pagos
      pagos.forEach((pago, rowIndex) => {
        currentX = margin + 10;
        const rowY = yPos + (rowIndex * 25);
        
        [pago.concepto, pago.valor, pago.fecha].forEach((cell, colIndex) => {
          doc.rect(currentX, rowY, colWidths[colIndex], 25)
             .fillColor('#ffffff')
             .fill()
             .strokeColor('#000000')
             .lineWidth(1)
             .stroke();
          
          doc.fontSize(8)
             .fillColor('#000000')
             .font('Helvetica')
             .text(cell, currentX + 5, rowY + 8);
          
          currentX += colWidths[colIndex];
        });
      });
      
      yPos += (pagos.length * 25) + 30;
    }
  } else {
    // Si es pago único
    doc.fontSize(9)
       .fillColor('#ffffff')
       .font('Helvetica-Bold')
       .text(`PAGO ÚNICO: ${formatearMoneda(contractData.precio_total)}`, 
             margin + 10, yPos, {
               width: contentWidth - 20,
               align: 'center'
             });
    
    yPos += 20;
    doc.fontSize(9)
       .fillColor('#ffffff')
       .font('Helvetica')
       .text('El pago debe realizarse antes del inicio del viaje según las condiciones acordadas', 
             margin + 10, yPos, {
               width: contentWidth - 20,
               align: 'center'
             });
  }
  
  return yPos;
};

// ✅ Función principal para generar el PDF del contrato
const generateContractPDF = async (contractData, saveToFile = true) => {
  try {
    console.log('🔄 Generando PDF de contrato:', contractData.contract_number);
    
    // Crear el documento PDF
    const doc = new PDFDocument({ 
      margin: 40,
      size: 'A4'
    });

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 40;
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

    // ================= PÁGINA 1 - PORTADA =================
    let yPosition = createContractHeader(doc);
    yPosition = createContractTitle(doc, yPosition);
    yPosition = createContractClauses(doc, contractData, yPosition);

    // ================= PÁGINA 2 - INFORMACIÓN DE RESERVA =================
    createReservaSection(doc, contractData);

    // ================= PÁGINA 3 - INFORMACIÓN FINANCIERA =================
    createFinancialSection(doc, contractData);

    // ================= PÁGINA 4 - ACUERDO DE PAGO =================
    createPaymentSection(doc, contractData);


    // ================= ÚLTIMA HOJA: DATOS DE LA EMPRESA Y FIRMA =================
    doc.addPage();
    let yPos = 100;

    // Datos de la empresa
    doc.fontSize(14)
      .fillColor('#1e40af')
      .font('Helvetica-Bold')
      .text('VIAJA YA - OPERADOR TURÍSTICO Y AGENCIA DE VIAJES', margin, yPos, {
        width: contentWidth,
        align: 'center'
      });
    yPos += 30;
    doc.fontSize(10)
      .fillColor('#000000')
      .font('Helvetica')
      .text('NIT: 1032406128', margin, yPos, { width: contentWidth, align: 'center' });
    yPos += 15;
    doc.text('RNT: 122035', margin, yPos, { width: contentWidth, align: 'center' });
    yPos += 15;
    doc.text('Oficina principal: Centro Comercial Plaza Ensueño 2° Piso, Bogotá D.C.', margin, yPos, { width: contentWidth, align: 'center' });
    yPos += 15;
    doc.text('Tel: 320 492 44 44', margin, yPos, { width: contentWidth, align: 'center' });
    yPos += 15;
    doc.text('Email: info@viajaya.com.co', margin, yPos, { width: contentWidth, align: 'center' });
    yPos += 30;

    // Firma
    const firmaPath = path.join(__dirname, '../assets/firma.png');
    try {
      doc.image(firmaPath, (pageWidth - 200) / 2, yPos, { width: 200 });
      yPos += 90;
    } catch (e) {
      doc.fontSize(10).fillColor('red').text('No se pudo cargar la firma', margin, yPos);
      yPos += 20;
    }

    doc.fontSize(12)
      .fillColor('#000000')
      .font('Helvetica-Bold')
      .text('MAYERLY ALEJANDRA HENAO HIGUERA', margin, yPos, { width: contentWidth, align: 'center' });
    yPos += 15;
    doc.fontSize(10)
      .font('Helvetica')
      .text('Representante Legal', margin, yPos, { width: contentWidth, align: 'center' });

    // Finalizar el documento
    doc.end();

    if (saveToFile) {
      // ✅ Esperar a que se complete la escritura
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
      // Para vista previa, retornar solo el buffer
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
  createPaymentSection
};