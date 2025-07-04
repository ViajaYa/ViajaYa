const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ✅ Asegurar que el directorio de PDFs existe
const ensurePDFDirectory = () => {
  const pdfDir = path.join(__dirname, '../../uploads/pdfs');
  if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
  }
  return pdfDir;
};

// ✅ Función auxiliar para calcular noches - MOVER ANTES DE generateQuotePDF
function calcularNoches(fechaIda, fechaRegreso) {
  const ida = new Date(fechaIda);
  const regreso = new Date(fechaRegreso);
  const diferencia = regreso.getTime() - ida.getTime();
  const noches = Math.ceil(diferencia / (1000 * 3600 * 24));
  return noches;
}

// ✅ Generar PDF de cotización con el formato de Viaja Ya
const generateQuotePDF = async (quote, saveToFile = true) => {
  try {
    console.log('🔄 Generando PDF para cotización:', quote.id);
    
    // Crear el documento PDF
    const doc = new PDFDocument({ 
      margin: 30,
      size: 'A4'
    });

    let yPosition = 30;
    const pageWidth = doc.page.width;
    const margin = 30;

    // Si se debe guardar como archivo
    let stream;
    if (saveToFile) {
      const pdfDir = ensurePDFDirectory();
      const filename = `cotizacion-${quote.quote_number || quote.id}.pdf`;
      const filepath = path.join(pdfDir, filename);
      stream = fs.createWriteStream(filepath);
      doc.pipe(stream);
    }

    // ✅ HEADER - Información de contacto y redes sociales
    doc.fontSize(10)
       .fillColor('#666666')
       .text('Visítanos en https://www.instagram.com/viajaya_pagina_oficial', margin, yPosition, { align: 'center' });
    
    yPosition += 25;

    // ✅ DESTINO PRINCIPAL
    doc.fontSize(28)
       .fillColor('#2563eb')
       .font('Helvetica-Bold')
       .text(`${quote.destino.toUpperCase()} 🛫`, margin, yPosition, { align: 'center' });
    
    yPosition += 40;

    // ✅ MENSAJE DE BIENVENIDA
    doc.fontSize(14)
       .fillColor('#1f2937')
       .font('Helvetica')
       .text(`¡Disfruta de un viaje inolvidable a ${quote.destino} con Viaja Ya! 🏖️`, margin, yPosition, { 
         align: 'center',
         width: pageWidth - 2 * margin
       });
    
    yPosition += 40;

    // ✅ SECCIÓN INCLUYE
    doc.fontSize(16)
       .fillColor('#2563eb')
       .font('Helvetica-Bold')
       .text('INCLUYE:', margin, yPosition);
    
    yPosition += 20;

    // ✅ CORREGIR AQUÍ: Cambiar this.calcularNoches por calcularNoches
    const noches = calcularNoches(quote.fecha_ida, quote.fecha_regreso);
    
    // Lista de inclusiones
    const inclusiones = [
      '* Tiquetes Aéreos ida y regreso equipaje de tipo morral (40_35_25 cm) 🛫',
      '* Traslados Aeropuerto - Hotel - Aeropuerto',
      `* Alojamiento por ${noches} noches en ${quote.tipo_hotel} 🏨`,
      '* Desayuno, almuerzo y cena 🍽️',
      '* Bebidas incluidas',
      '* Asistencia médica ⚕️'
    ];

    // Si tiene alimentación específica, la usamos
    if (quote.alimentacion && quote.alimentacion !== 'No especificada') {
      inclusiones[3] = `* ${quote.alimentacion} 🍽️`;
    }

    doc.fontSize(12)
       .fillColor('#374151')
       .font('Helvetica');

    inclusiones.forEach(item => {
      doc.text(item, margin + 10, yPosition, { 
        width: pageWidth - 2 * margin - 20,
        lineGap: 3
      });
      yPosition += 18;
    });

    yPosition += 20;

    // ✅ DETALLES DEL VIAJE
    doc.fontSize(16)
       .fillColor('#2563eb')
       .font('Helvetica-Bold')
       .text('DETALLES DEL VIAJE:', margin, yPosition);
    
    yPosition += 20;

    // Detalles principales
    const detalles = [
      `💰 Valor por persona $${quote.precio_total ? quote.precio_total.toLocaleString('es-CO') : 'Por confirmar'}`,
      `📆 Fecha de viaje: ${new Date(quote.fecha_ida).toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      })} al ${new Date(quote.fecha_regreso).toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      })}`,
      `🏨 Hotel: ${quote.tipo_hotel || 'Por confirmar'}`,
      `🛏️ Acomodación: ${quote.acomodacion}`
    ];

    // Si hay niños, agregar información
    if (quote.ninos > 0) {
      detalles.push(`👶 Niños: ${quote.ninos} (Edades: ${quote.edades_ninos.join(', ')})`);
    }

    // Si hay más de una persona
    if (quote.numero_personas > 1) {
      detalles.push(`👥 Número de personas: ${quote.numero_personas}`);
    }

    doc.fontSize(12)
       .fillColor('#374151')
       .font('Helvetica');

    detalles.forEach(detalle => {
      doc.text(detalle, margin + 10, yPosition, { 
        width: pageWidth - 2 * margin - 20,
        lineGap: 3
      });
      yPosition += 18;
    });

    yPosition += 20;

    // ✅ ADICIONALES
    doc.fontSize(16)
       .fillColor('#2563eb')
       .font('Helvetica-Bold')
       .text('ADICIONALES (con costo extra): 💰', margin, yPosition);
    
    yPosition += 20;

    const adicionales = [
      '• Equipaje en bodega',
      '• Selección de asiento aéreo', 
      '• Paseos en destino (solicita nuestro brochure de servicios)'
    ];

    doc.fontSize(12)
       .fillColor('#374151')
       .font('Helvetica');

    adicionales.forEach(adicional => {
      doc.text(adicional, margin + 10, yPosition, { 
        width: pageWidth - 2 * margin - 20,
        lineGap: 3
      });
      yPosition += 16;
    });

    yPosition += 20;

    // ✅ OBSERVACIONES
    doc.fontSize(14)
       .fillColor('#2563eb')
       .font('Helvetica-Bold')
       .text('Observaciones:', margin, yPosition);
    
    yPosition += 15;

    const observacionesTexto = quote.observaciones && quote.observaciones.trim() 
      ? quote.observaciones 
      : 'Infórmanos si algún viajero presenta alguna condición especial';

    doc.fontSize(12)
       .fillColor('#374151')
       .font('Helvetica')
       .text(observacionesTexto, margin + 10, yPosition, { 
         width: pageWidth - 2 * margin - 20,
         align: 'justify',
         lineGap: 3
       });

    yPosition += 40;

    // ✅ ATENCIÓN PERSONALIZADA
    doc.fontSize(16)
       .fillColor('#2563eb')
       .font('Helvetica-Bold')
       .text('ATENCIÓN PERSONALIZADA:', margin, yPosition);
    
    yPosition += 20;

    const atencionTexto = `En Viaja Ya, contamos con un canal de atención a los viajeros donde estarás acompañado desde un día antes del viaje hasta que finaliza. ¡Realizamos check-in, brindamos recomendaciones y aseguramos que tu experiencia de viaje sea la mejor! 💜`;

    doc.fontSize(12)
       .fillColor('#374151')
       .font('Helvetica')
       .text(atencionTexto, margin + 10, yPosition, { 
         width: pageWidth - 2 * margin - 20,
         align: 'justify',
         lineGap: 4
       });

    yPosition += 60;

    // ✅ INFORMACIÓN DEL RESPONSABLE (actualizado para incluir Owner)
    const responsable = quote.Asesor || quote.Lider || quote.Gerente || quote.Admin || quote.Owner;

    if (responsable) {
      doc.fontSize(14)
         .fillColor('#2563eb')
         .font('Helvetica-Bold')
         .text('TU ASESOR DE CONFIANZA:', margin, yPosition);
      
      yPosition += 15;
      
      // Determinar el tipo de responsable
      let tipoResponsable = 'Asesor';
      if (quote.Lider && !quote.Asesor) tipoResponsable = 'Líder';
      if (quote.Gerente && !quote.Asesor && !quote.Lider) tipoResponsable = 'Gerente';
      if (quote.Admin && !quote.Asesor && !quote.Lider && !quote.Gerente) tipoResponsable = 'Administrador';
      if (quote.Owner && !quote.Asesor && !quote.Lider && !quote.Gerente && !quote.Admin) tipoResponsable = 'Director';
      
      doc.fontSize(12)
         .fillColor('#374151')
         .font('Helvetica')
         .text(`👨‍💼 ${responsable.name} ${responsable.lastname} (${tipoResponsable})`, margin + 10, yPosition)
         .text(`📧 ${responsable.email}`, margin + 10, yPosition + 15)
         .text(`📞 Línea de atención: +57 300 123 4567`, margin + 10, yPosition + 30);

      yPosition += 60;
    }

    // ✅ FOOTER
    const pageHeight = doc.page.height;
    const footerY = pageHeight - 60;

    // Separador
    doc.moveTo(margin, footerY - 20)
       .lineTo(pageWidth - margin, footerY - 20)
       .strokeColor('#e5e7eb')
       .stroke();

    doc.fontSize(10)
       .fillColor('#9ca3af')
       .font('Helvetica')
       .text('📋 Esta cotización es válida por 30 días a partir de la fecha de emisión.', 
             margin, footerY - 10, { align: 'center', width: pageWidth - 2 * margin })
       .text('💜 Viaja Ya - Hacemos realidad tus sueños de viaje', 
             margin, footerY + 5, { align: 'center', width: pageWidth - 2 * margin })
       .text('📧 info@viajaya.com | 📞 +57 300 123 4567 | 📍 Bogotá, Colombia', 
             margin, footerY + 20, { align: 'center', width: pageWidth - 2 * margin });

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
  calcularNoches // ✅ Exportar la función también
};