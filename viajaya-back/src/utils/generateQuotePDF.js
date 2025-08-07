const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

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

// ✅ Generar PDF de cotización con el formato de Viaja Ya
const generateQuotePDF = async (quote, saveToFile = true) => {
  try {
    console.log('🔄 Generando PDF para cotización:', quote.id);
    
    // Crear el documento PDF
    const doc = new PDFDocument({ 
      margin: 30,
      size: 'A4'
    });

    let yPosition = 20;
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 30;
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

    // ✅ HEADER CON LOGO Y FONDO (equilibrado)
    doc.rect(0, 0, pageWidth, 75)
       .fillColor(COLORS.fondoPopup)
       .fill();

    // Intentar cargar el logo
    try {
      const logoPath = path.join(__dirname, '../assets/logo2.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, margin, 10, { width: 45, height: 45 });
      }
    } catch (error) {
      console.log('⚠️ No se pudo cargar el logo:', error.message);
    }

    // Información de contacto del header
    doc.fontSize(11)
       .fillColor('white')
       .font('Helvetica-Bold')
       .text('VIAJA YA', margin + 60, 15)
       .fontSize(8)
       .font('Helvetica')
       .text('Hacemos realidad tus sueños de viaje', margin + 60, 30)
       .text('info@viajaya.com | +57 300 123 4567', margin + 60, 42)
       .text('Bogotá, Colombia', margin + 60, 54);

    // Instagram en el lado derecho
    doc.fontSize(8)
       .fillColor(COLORS.ColorAzul)
       .text('Síguenos en Instagram:', pageWidth - 130, 15, { width: 100, align: 'right' })
       .text('@viajaya_pagina_oficial', pageWidth - 130, 27, { width: 100, align: 'right' });

    yPosition = 85;

    // ✅ DESTINO PRINCIPAL (más compacto)
    doc.rect(margin, yPosition, contentWidth, 35)
       .fillColor(COLORS.MoradoSuave)
       .fill();
    
    doc.fontSize(20)
       .fillColor('white')
       .font('Helvetica-Bold')
       .text(`${quote.destino.toUpperCase()}`, margin + 10, yPosition + 8, { 
         align: 'center',
         width: contentWidth - 20
       });
    
    yPosition += 45;

    // ✅ MENSAJE DE BIENVENIDA (más compacto)
    doc.fontSize(10)
       .fillColor(COLORS.textoOscuro)
       .font('Helvetica')
       .text(`¡Disfruta de un viaje inolvidable a ${quote.destino} con Viaja Ya!`, margin, yPosition, { 
         align: 'center',
         width: contentWidth
       });
    
    yPosition += 18;

    // ✅ SECCIÓN INCLUYE (más compacta)
    doc.rect(margin, yPosition, contentWidth, 18)
       .fillColor(COLORS.botonPopup)
       .fill();
    
    doc.fontSize(12)
       .fillColor('white')
       .font('Helvetica-Bold')
       .text('INCLUYE:', margin + 10, yPosition + 4);
    
    yPosition += 25;

    const noches = calcularNoches(quote.fecha_ida, quote.fecha_regreso);
    
    // Lista de inclusiones SIN EMOJIS
    const inclusiones = [
      `• Tiquetes Aéreos ida y regreso equipaje de tipo morral (40×35×25 cm)`,
      `• Traslados Aeropuerto - Hotel - Aeropuerto`,
      `• Alojamiento por ${noches} noches en ${quote.tipo_hotel}`,
      `• Desayuno, almuerzo y cena`,
      `• Bebidas incluidas`,
      `• Asistencia médica`
    ];

    // Si tiene alimentación específica, la usamos
    if (quote.alimentacion && quote.alimentacion !== 'No especificada') {
      inclusiones[3] = `• ${quote.alimentacion}`;
    }

    doc.fontSize(9)
       .fillColor(COLORS.textoGris)
       .font('Helvetica');

    inclusiones.forEach(item => {
      doc.text(item, margin + 6, yPosition, { 
        width: contentWidth - 12,
        lineGap: 0
      });
      yPosition += needsCompression(yPosition, pageHeight) ? 8 : 10;
    });

    yPosition += needsCompression(yPosition, pageHeight) ? 4 : 8;

    // ✅ DETALLES DEL VIAJE (más compacto)
    doc.rect(margin, yPosition, contentWidth, 18)
       .fillColor(COLORS.moradito)
       .fill();
    
    doc.fontSize(12)
       .fillColor(COLORS.fondoPopup)
       .font('Helvetica-Bold')
       .text('DETALLES DEL VIAJE:', margin + 10, yPosition + 4);
    
    yPosition += 25;

    // Precio destacado (más compacto)
    console.log('🔍 PDF DEBUG - Datos de precio recibidos:', {
  precio_total: quote.precio_total,
  precio_por_persona: quote.precio_por_persona,
  precio_por_persona_formateado: quote.precio_por_persona_formateado,
  pdf_data: quote.pdf_data,
  tipo_precio_por_persona: typeof quote.precio_por_persona,
});

// Precio destacado (más compacto)
doc.rect(margin, yPosition, contentWidth, 30)
   .fillColor(COLORS.ColorAzul)
   .fill();

// ✅ OPCIÓN 1: Usar el valor numérico (RECOMENDADA)
doc.fontSize(16)
   .fillColor('white')
   .font('Helvetica-Bold')
   .text(`$${quote.precio_por_persona ? Number(quote.precio_por_persona).toLocaleString('es-CO') : 'Por confirmar'}`, margin + 10, yPosition + 6, { align: 'center', width: contentWidth - 20 })
   .fontSize(8)
   .font('Helvetica')
   .text('Valor por persona', margin + 10, yPosition + 20, { align: 'center', width: contentWidth - 20 });
    
    yPosition += 38;

    // Detalles principales
    const detallesData = [
      { label: 'Fecha de viaje', value: `${new Date(quote.fecha_ida).toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      })} al ${new Date(quote.fecha_regreso).toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      })}` },
      { label: 'Hotel', value: quote.tipo_hotel || 'Por confirmar' },
      { label: 'Acomodación', value: quote.acomodacion }
    ];

    // Si hay niños, agregar información
    if (quote.ninos > 0) {
      detallesData.push({ label: 'Niños', value: `${quote.ninos} (Edades: ${quote.edades_ninos.join(', ')})` });
    }

    // Si hay más de una persona
    if (quote.numero_personas > 1) {
      detallesData.push({ label: 'Número de personas', value: quote.numero_personas.toString() });
    }

    doc.fontSize(9)
       .fillColor(COLORS.textoGris)
       .font('Helvetica');

    detallesData.forEach(detalle => {
      doc.fillColor(COLORS.textoOscuro)
         .font('Helvetica-Bold')
         .text(`${detalle.label}:`, margin + 6, yPosition, { width: 80 })
         .fillColor(COLORS.textoGris)
         .font('Helvetica')
         .text(detalle.value, margin + 90, yPosition, { 
           width: contentWidth - 96
         });
      yPosition += needsCompression(yPosition, pageHeight) ? 8 : 10;
    });

    yPosition += needsCompression(yPosition, pageHeight) ? 4 : 6;

    // ✅ ADICIONALES (más compacto)
    doc.rect(margin, yPosition, contentWidth, 18)
       .fillColor(COLORS.ColorMorado)
       .fill();
    
    doc.fontSize(12)
       .fillColor('white')
       .font('Helvetica-Bold')
       .text('ADICIONALES (con costo extra):', margin + 10, yPosition + 4);
    
    yPosition += 25;

    const adicionales = [
      '• Equipaje en bodega',
      '• Selección de asiento aéreo',
      '• Paseos en destino (solicita nuestro brochure de servicios)'
    ];

    doc.fontSize(9)
       .fillColor(COLORS.textoGris)
       .font('Helvetica');

    adicionales.forEach(item => {
      doc.text(item, margin + 6, yPosition, { 
        width: contentWidth - 12,
        lineGap: 0
      });
      yPosition += needsCompression(yPosition, pageHeight) ? 6 : 10;
    });

    yPosition += needsCompression(yPosition, pageHeight) ? 3 : 6;

    // ✅ OBSERVACIONES (más compacto)
    doc.fontSize(10)
       .fillColor(COLORS.botonPopup)
       .font('Helvetica-Bold')
       .text('Observaciones:', margin, yPosition);
    
    yPosition += needsCompression(yPosition, pageHeight) ? 10 : 15;

    const observacionesTexto = quote.observaciones && quote.observaciones.trim() 
      ? quote.observaciones 
      : 'Infórmanos si algún viajero presenta alguna condición especial';

    // Calcular altura dinámica para observaciones
    const observacionesHeight = needsCompression(yPosition, pageHeight) ? 15 : 20;

    doc.rect(margin, yPosition, contentWidth, observacionesHeight)
       .fillColor('#f8f9fa')
       .stroke(COLORS.separador)
       .fill();

    doc.fontSize(8)
       .fillColor(COLORS.textoGris)
       .font('Helvetica')
       .text(observacionesTexto, margin + 8, yPosition + 4, { 
         width: contentWidth - 16,
         align: 'justify',
         lineGap: 1
       });

    yPosition += observacionesHeight + (needsCompression(yPosition, pageHeight) ? 3 : 5);

    // ✅ ATENCIÓN PERSONALIZADA (ajustado dinámicamente)
    const atencionHeight = needsCompression(yPosition, pageHeight) ? 15 : 18;
    
    doc.rect(margin, yPosition, contentWidth, atencionHeight)
       .fillColor(COLORS.ColorAzul)
       .fill();
    
    doc.fontSize(10)
       .fillColor('white')
       .font('Helvetica-Bold')
       .text('ATENCIÓN PERSONALIZADA:', margin + 10, yPosition + 4);
    
    yPosition += atencionHeight + (needsCompression(yPosition, pageHeight) ? 2 : 5);

    const atencionTexto = `En Viaja Ya, contamos con un canal de atención a los viajeros donde estarás acompañado desde un día antes del viaje hasta que finaliza. ¡Realizamos check-in, brindamos recomendaciones y aseguramos que tu experiencia de viaje sea la mejor!`;

    doc.fontSize(8)
       .fillColor(COLORS.textoGris)
       .font('Helvetica')
       .text(atencionTexto, margin + 6, yPosition, { 
         width: contentWidth - 12,
         align: 'justify',
         lineGap: 1
       });

    yPosition += needsCompression(yPosition, pageHeight) ? 20 : 25;

    // ✅ INFORMACIÓN DEL RESPONSABLE (optimizado para espacio)
    const responsable = quote.Asesor || quote.Lider || quote.Gerente || quote.Admin || quote.Owner;

    if (responsable) {
      // Verificar espacio disponible y ajustar posicionamiento
      const espacioDisponible = pageHeight - 80 - yPosition;
      const alturaResponsable = needsCompression(yPosition, pageHeight) ? 25 : 30;
      
      // Si no hay suficiente espacio, comprimir más o mover cerca del footer
      if (espacioDisponible < alturaResponsable + 40) {
        yPosition = pageHeight - 115;
      }
      
      doc.rect(margin, yPosition, contentWidth, alturaResponsable)
         .fillColor(COLORS.fondoPopup)
         .fill();
      
      doc.fontSize(9)
         .fillColor('white')
         .font('Helvetica-Bold')
         .text('TU ASESOR DE CONFIANZA:', margin + 8, yPosition + 3);
      
      yPosition += needsCompression(yPosition, pageHeight) ? 12 : 15;
      
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

      yPosition += needsCompression(yPosition, pageHeight) ? 15 : 20;
    }

    // ✅ FOOTER (más compacto)
    const footerY = pageHeight - 40;

    doc.rect(0, footerY - 3, pageWidth, 43)
       .fillColor(COLORS.fondoPopup)
       .fill();

    doc.moveTo(margin, footerY)
       .lineTo(pageWidth - margin, footerY)
       .strokeColor(COLORS.ColorAzul)
       .lineWidth(1)
       .stroke();

    doc.fontSize(8)
       .fillColor('white')
       .font('Helvetica-Bold')
       .text('VIAJA YA - Hacemos realidad tus sueños de viaje', 
             margin, footerY + 4, { align: 'center', width: contentWidth });

    doc.fontSize(7)
       .fillColor(COLORS.ColorAzul)
       .font('Helvetica')
       .text('info@viajaya.com | +57 300 123 4567 | Bogotá, Colombia', 
             margin, footerY + 15, { align: 'center', width: contentWidth });

    doc.fontSize(6)
       .fillColor(COLORS.textoClaro)
       .font('Helvetica')
       .text('Esta cotización es válida por 48 horas a partir de la fecha de emisión.', 
             margin, footerY + 25, { align: 'center', width: contentWidth })
       .text('Síguenos en Instagram: @viajaya_pagina_oficial', 
             margin, footerY + 35, { align: 'center', width: contentWidth });

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

      console.log('✅ PDF generado exitosamente:', filepath);
      
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
    console.error('❌ Error generando PDF:', error);
    throw new Error(`Error generando PDF: ${error.message}`);
  }
};

module.exports = {
  generateQuotePDF,
  ensurePDFDirectory,
  calcularNoches
};
