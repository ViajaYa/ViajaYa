const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

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

// 🎨 Función para crear header elegante
const createHeader = (doc, contractData, yPos) => {
  const pageWidth = doc.page.width;
  const margin = 40;
  
  // Fondo del header
  doc.rect(0, 0, pageWidth, 120)
     .fillColor(COLORS.primary)
     .fill();
  
  // Logo placeholder y título
  doc.fontSize(20)
     .fillColor(COLORS.white)
     .font('Helvetica-Bold')
     .text('VIAJA YA', margin, 25);
  
  doc.fontSize(10)
     .font('Helvetica')
     .text('OPERADOR TURÍSTICO Y AGENCIA DE VIAJES', margin, 50)
     .text('RNT 122035 | NIT 1032406128', margin, 65);
  
  // Información del contrato en el header
  const rightX = pageWidth - 200;
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .text('CONTRATO DE SERVICIOS', rightX, 25)
     .fontSize(10)
     .font('Helvetica')
     .text(`No: ${contractData.contract_number}`, rightX, 45)
     .text(`Fecha: ${formatearFecha(contractData.fecha_firma)}`, rightX, 60)
     .text(`Estado: ${contractData.status.toUpperCase()}`, rightX, 75);
  
  return 140; // Retorna la nueva posición Y
};

// 🎨 Función para crear sección con estilo
const createSection = (doc, title, yPos, bgColor = COLORS.background) => {
  const pageWidth = doc.page.width;
  const margin = 40;
  const contentWidth = pageWidth - 2 * margin;
  
  // Fondo de la sección
  doc.rect(margin - 10, yPos - 5, contentWidth + 20, 25)
     .fillColor(bgColor)
     .fill();
  
  // Título de la sección
  doc.fontSize(12)
     .fillColor(COLORS.primary)
     .font('Helvetica-Bold')
     .text(title, margin, yPos + 5);
  
  return yPos + 35;
};

// 🎨 Función para crear tabla de datos
const createDataTable = (doc, data, yPos, columns = 2) => {
  const margin = 40;
  const pageWidth = doc.page.width;
  const contentWidth = pageWidth - 2 * margin;
  const colWidth = contentWidth / columns;
  
  let currentY = yPos;
  let currentCol = 0;
  
  data.forEach((item, index) => {
    const x = margin + (currentCol * colWidth);
    
    // Label
    doc.fontSize(9)
       .fillColor(COLORS.textLight)
       .font('Helvetica-Bold')
       .text(item.label, x, currentY);
    
    // Valor
    doc.fontSize(10)
       .fillColor(COLORS.text)
       .font('Helvetica')
       .text(item.valor, x, currentY + 12, {
         width: colWidth - 20,
         ellipsis: true
       });
    
    currentCol++;
    if (currentCol >= columns) {
      currentCol = 0;
      currentY += 35;
    }
  });
  
  // Si terminamos en una columna incompleta, ajustar Y
  if (currentCol > 0) {
    currentY += 35;
  }
  
  return currentY + 10;
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

    // ✅ PÁGINA 1 - HEADER ELEGANTE
    let yPosition = createHeader(doc, contractData, 0);

    // ✅ SECCIÓN: INFORMACIÓN DEL CLIENTE
    yPosition = createSection(doc, '👤 INFORMACIÓN DEL CLIENTE', yPosition);
    
    const datosCliente = [
      { label: 'Cliente', valor: `${contractData.Cliente?.name || ''} ${contractData.Cliente?.lastname || ''}` },
      { label: 'Email', valor: contractData.Cliente?.email || '' },
      { label: 'Teléfono', valor: contractData.Cliente?.phone || '' },
      { label: 'Documento', valor: contractData.documento_titular || '' }
    ];

    yPosition = createDataTable(doc, datosCliente, yPosition, 2);

    // ✅ SECCIÓN: DETALLES DEL VIAJE
    yPosition = createSection(doc, '✈️ DETALLES DEL VIAJE', yPosition);
    
    const datosViaje = [
      { label: 'Destino', valor: `${contractData.Quote?.origen || ''} → ${contractData.Quote?.destino || ''}` },
      { label: 'Pasajeros', valor: `${contractData.numero_pasajeros || contractData.Quote?.numero_personas || 0} personas` },
      { label: 'Fecha de salida', valor: formatearFecha(contractData.fecha_inicio_viaje) },
      { label: 'Fecha de regreso', valor: formatearFecha(contractData.fecha_fin_viaje) }
    ];

    yPosition = createDataTable(doc, datosViaje, yPosition, 2);

    // ✅ SECCIÓN: INFORMACIÓN DE PASAJEROS
    if (contractData.Quote?.Passengers && contractData.Quote.Passengers.length > 0) {
      yPosition = createSection(doc, '👥 PASAJEROS', yPosition);
      
      contractData.Quote.Passengers.forEach((passenger, index) => {
        const passengerData = [
          { 
            label: `${passenger.titular ? '👑 Titular' : `Acompañante ${index}`}`, 
            valor: `${passenger.nombre} ${passenger.apellido}` 
          },
          { 
            label: 'Documento', 
            valor: `${passenger.tipo_documento}: ${passenger.documento_identidad}` 
          }
        ];
        
        if (index === 0) {
          yPosition = createDataTable(doc, passengerData, yPosition, 2);
        } else {
          // Para acompañantes, mostrar en una línea más compacta
          doc.fontSize(9)
             .fillColor(COLORS.textLight)
             .font('Helvetica')
             .text(`• ${passenger.nombre} ${passenger.apellido} (${passenger.tipo_documento}: ${passenger.documento_identidad})`, 
                   margin, yPosition);
          yPosition += 15;
        }
      });
      yPosition += 10;
    }

    // ✅ SECCIÓN: INFORMACIÓN FINANCIERA
    yPosition = createSection(doc, '💰 INFORMACIÓN FINANCIERA', yPosition, COLORS.accent + '20');
    
    const precioPorPersona = contractData.precio_total / (contractData.numero_pasajeros || 1);
    
    // Precio principal
    doc.fontSize(14)
       .fillColor(COLORS.success)
       .font('Helvetica-Bold')
       .text(`TOTAL: ${formatearMoneda(contractData.precio_total)}`, margin, yPosition);
    
    doc.fontSize(9)
       .fillColor(COLORS.textLight)
       .font('Helvetica')
       .text(`(${numeroALetras(contractData.precio_total)} pesos colombianos)`, margin, yPosition + 20);
    
    yPosition += 45;

    const datosFinancieros = [
      { label: 'Precio por persona', valor: formatearMoneda(precioPorPersona) },
      { label: 'Forma de pago', valor: contractData.forma_pago === 'cuotas' ? 'En cuotas' : 'Pago único' },
      { label: 'Total pagado', valor: formatearMoneda(contractData.total_pagado) },
      { label: 'Saldo pendiente', valor: formatearMoneda(contractData.saldo_pendiente) }
    ];

    yPosition = createDataTable(doc, datosFinancieros, yPosition, 2);

    // ✅ TABLA DE PAGOS (si es en cuotas)
    if (contractData.forma_pago === 'cuotas') {
      yPosition = createSection(doc, '📅 CRONOGRAMA DE PAGOS', yPosition);
      
      // Header de la tabla
      const tableY = yPosition;
      const colWidths = [120, 100, 100, 100];
      const headers = ['Concepto', 'Monto', 'Fecha límite', 'Estado'];
      
      let currentX = margin;
      headers.forEach((header, index) => {
        doc.rect(currentX, tableY, colWidths[index], 25)
           .fillColor(COLORS.primary)
           .fill();
        
        doc.fontSize(9)
           .fillColor(COLORS.white)
           .font('Helvetica-Bold')
           .text(header, currentX + 5, tableY + 8, {
             width: colWidths[index] - 10,
             align: 'center'
           });
        
        currentX += colWidths[index];
      });
      
      yPosition += 25;
      
      // Filas de la tabla
      const pagos = [];
      
      // Cuota inicial
      if (contractData.tiene_cuota_inicial) {
        pagos.push({
          concepto: 'Cuota inicial',
          monto: formatearMoneda(contractData.cuota_inicial_monto),
          fecha: formatearFecha(contractData.fecha_vencimiento_inicial),
          estado: contractData.cuota_inicial_pagada ? 'Pagada' : 'Pendiente'
        });
      }
      
      // Cuotas restantes
      if (contractData.fechas_vencimiento_cuotas) {
        contractData.fechas_vencimiento_cuotas.forEach((fecha, index) => {
          const estaPagada = contractData.cuotas_pagadas && contractData.cuotas_pagadas.includes(index);
          pagos.push({
            concepto: `Cuota ${index + 1}`,
            monto: formatearMoneda(contractData.valor_cuota_restante),
            fecha: formatearFecha(fecha),
            estado: estaPagada ? 'Pagada' : 'Pendiente'
          });
        });
      }
      
      // Dibujar filas
      pagos.forEach((pago, rowIndex) => {
        currentX = margin;
        const rowY = yPosition + (rowIndex * 20);
        
        [pago.concepto, pago.monto, pago.fecha, pago.estado].forEach((cell, colIndex) => {
          const isEven = rowIndex % 2 === 0;
          
          doc.rect(currentX, rowY, colWidths[colIndex], 20)
             .fillColor(isEven ? COLORS.white : COLORS.background)
             .fill()
             .strokeColor(COLORS.border)
             .stroke();
          
          const textColor = pago.estado === 'Pagada' ? COLORS.success : COLORS.text;
          
          doc.fontSize(8)
             .fillColor(textColor)
             .font('Helvetica')
             .text(cell, currentX + 5, rowY + 6, {
               width: colWidths[colIndex] - 10,
               align: 'center'
             });
          
          currentX += colWidths[colIndex];
        });
      });
      
      yPosition += (pagos.length * 20) + 20;
    }

    // ✅ NUEVA PÁGINA SI ES NECESARIO PARA TÉRMINOS
    if (yPosition > pageHeight - 200) {
      doc.addPage();
      yPosition = margin;
    }

    // ✅ SECCIÓN: TÉRMINOS Y CONDICIONES
    yPosition = createSection(doc, '📋 TÉRMINOS Y CONDICIONES', yPosition);
    
    const terminos = [
      '• El pago debe realizarse según el cronograma establecido.',
      '• Los cambios están sujetos a penalidades según política de la empresa.',
      '• Se requiere documentación completa 30 días antes del viaje.',
      '• El seguro de viaje está incluido en el paquete.',
      '• Aplican términos y condiciones generales de ViajaYa.'
    ];

    doc.fontSize(9)
       .fillColor(COLORS.text)
       .font('Helvetica');
       
    terminos.forEach(termino => {
      doc.text(termino, margin, yPosition, {
        width: contentWidth,
        lineGap: 2
      });
      yPosition += 15;
    });

    // ✅ INFORMACIÓN BANCARIA
    yPosition += 15;
    yPosition = createSection(doc, '🏦 INFORMACIÓN BANCARIA', yPosition, COLORS.accent + '20');
    
    doc.fontSize(10)
       .fillColor(COLORS.text)
       .font('Helvetica-Bold')
       .text('Banco Bancolombia - Cuenta de Ahorros', margin, yPosition)
       .font('Helvetica')
       .text('No. 846-772-51165', margin, yPosition + 15)
       .text('Titular: MAYERLY ALEJANDRA HENAO HIGUERA', margin, yPosition + 30)
       .text('CC: 1032406128', margin, yPosition + 45);

    yPosition += 70;

    // ✅ SECCIÓN DE FIRMAS
    if (yPosition > pageHeight - 150) {
      doc.addPage();
      yPosition = margin;
    }

    yPosition = createSection(doc, '✍️ FIRMAS', yPosition);
    
    const firmaWidth = (contentWidth - 50) / 2;

    // Líneas de firma
    doc.moveTo(margin, yPosition + 40)
       .lineTo(margin + firmaWidth, yPosition + 40)
       .strokeColor(COLORS.border)
       .stroke();

    doc.moveTo(margin + firmaWidth + 50, yPosition + 40)
       .lineTo(pageWidth - margin, yPosition + 40)
       .strokeColor(COLORS.border)
       .stroke();

    // Etiquetas de firma
    doc.fontSize(9)
       .fillColor(COLORS.textLight)
       .font('Helvetica-Bold')
       .text('VIAJA YA', margin, yPosition + 50, {
         width: firmaWidth,
         align: 'center'
       })
       .text('CLIENTE', margin + firmaWidth + 50, yPosition + 50, {
         width: firmaWidth,
         align: 'center'
       });

    doc.fontSize(8)
       .font('Helvetica')
       .text('MAYERLY ALEJANDRA HENAO HIGUERA', margin, yPosition + 65, {
         width: firmaWidth,
         align: 'center'
       })
       .text(`${contractData.Cliente?.name || ''} ${contractData.Cliente?.lastname || ''}`, 
             margin + firmaWidth + 50, yPosition + 65, {
         width: firmaWidth,
         align: 'center'
       });

    // ✅ FOOTER
    const footerY = pageHeight - 40;
    doc.fontSize(8)
       .fillColor(COLORS.textLight)
       .font('Helvetica')
       .text(`Contrato generado el ${formatearFecha(new Date())} | ViajaYa - Operador Turístico RNT 122035`, 
             margin, footerY, {
         width: contentWidth,
         align: 'center'
       });

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
  numeroALetras
};