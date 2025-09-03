const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { formatForPDF } = require('./dateUtils');

// ✅ Función para verificar si necesitamos comprimir espaciado
const needsCompression = (yPosition, pageHeight) => {
  return yPosition > pageHeight * 0.6; // Si estamos en el 60% de la página
};

// ✅ Función para obtener espaciado dinámico
const getDynamicSpacing = (yPosition, pageHeight, normalSpacing, compressedSpacing) => {
  return needsCompression(yPosition, pageHeight) ? compressedSpacing : normalSpacing;
};

const getImageBuffer = (url) => new Promise((resolve, reject) => {
  https.get(url, (res) => {
    const data = [];
    res.on('data', chunk => data.push(chunk));
    res.on('end', () => resolve(Buffer.concat(data)));
    res.on('error', reject);
  });
});

const generatePaymentDocument = async (supportDocument, commission) => {
  return new Promise((resolve, reject) => {
    try {
      // ✅ Usar el mismo directorio que el controller
      const uploadsDir = path.join(__dirname, '../../uploads/payment-documents');
      if (!fs.existsSync(uploadsDir)) {
        console.log('📁 Creando directorio uploads:', uploadsDir);
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const fileName = `cuenta-cobro-${supportDocument.numero_documento}.pdf`;
      const filePath = path.join(uploadsDir, fileName);

      console.log('📝 Generando PDF en:', filePath);

      // ✅ Verificar si el archivo ya existe y eliminarlo
      if (fs.existsSync(filePath)) {
        console.log('🗑️ Eliminando archivo existente');
        fs.unlinkSync(filePath);
      }

      // Crear PDF con márgenes específicos
      const doc = new PDFDocument({
        margins: {
          top: 40,
          bottom: 40,
          left: 80,
          right: 80
        }
      });
      const stream = fs.createWriteStream(filePath);
      
      // ✅ Manejar errores del stream
      stream.on('error', (err) => {
        console.error('❌ Error en stream:', err);
        reject(err);
      });

      doc.pipe(stream);

      const pageHeight = doc.page.height;
      let yPosition = 60; // Reducido de 80

      // ✅ FECHA DEL DÍA (formato exacto como en la imagen)
      const fechaHoy = formatForPDF(new Date().toISOString());
      // Convertir DD/MM/YYYY a formato largo
      const [day, month, year] = fechaHoy.split('/');
      const fechaLarga = new Date(year, month - 1, day).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      doc.fontSize(12)
         .text(`Bogotá, ${fechaLarga}`, 80, yPosition);

      yPosition += getDynamicSpacing(yPosition, pageHeight, 50, 35); // Reducido de 80

      // ✅ DATOS DE QUIEN PAGA (ViajaYa) - CENTRADO Y CON ESPACIADO OPTIMIZADO
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('MAYERLY ALEJANDRA HENAO HIGUERA', 80, yPosition, { 
           width: 430, 
           align: 'center' 
         });
      yPosition += getDynamicSpacing(yPosition, pageHeight, 20, 15);
      
      doc.fontSize(12)
         .font('Helvetica')
         .text('REPRESENTANTE LEGAL', 80, yPosition, { 
           width: 430, 
           align: 'center' 
         });
      yPosition += getDynamicSpacing(yPosition, pageHeight, 18, 12);
      
      doc.text('OPERADOR TURÍSTICO Y AGENCIA DE VIAJES VIAJA YA', 80, yPosition, { 
        width: 430, 
        align: 'center' 
      });
      yPosition += getDynamicSpacing(yPosition, pageHeight, 18, 12);
      
      doc.text('Nit: 1032406128', 80, yPosition, { 
        width: 430, 
        align: 'center' 
      });
      yPosition += getDynamicSpacing(yPosition, pageHeight, 50, 35); // Reducido de 80

      // ✅ DEBE A (con espaciado optimizado)
      const vendedorInfo = commission?.Vendedor || supportDocument.Vendedor;
      const nombreCompleto = `${vendedorInfo?.name || ''} ${vendedorInfo?.lastname || ''}`.trim();
      
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Debe a:', 80, yPosition);
      yPosition += getDynamicSpacing(yPosition, pageHeight, 25, 18);
      
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text(nombreCompleto.toUpperCase(), 80, yPosition);
      yPosition += getDynamicSpacing(yPosition, pageHeight, 20, 15);
      
      // Extraer CC del campo observaciones o usar placeholder
      const observaciones = supportDocument.observaciones || '';
      const ccMatch = observaciones.match(/CC:\s*([^\n\r]+)/);
      const numeroCC = ccMatch ? ccMatch[1].trim() : 'No especificado';
      
      doc.fontSize(12)
         .font('Helvetica')
         .text(`CC: ${numeroCC}`, 80, yPosition);
      yPosition += getDynamicSpacing(yPosition, pageHeight, 40, 30); // Reducido de 60

      // ✅ LA SUMA DE (En números y letras) - espaciado optimizado
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('LA SUMA DE:', 80, yPosition);
      yPosition += getDynamicSpacing(yPosition, pageHeight, 25, 18);
      
      const montoEnLetras = convertirNumeroALetras(supportDocument.monto);
      doc.fontSize(12)
         .font('Helvetica')
         .text(`${montoEnLetras.toUpperCase()} (${formatCurrency(supportDocument.monto)})`, 80, yPosition, {
           width: 430,
           align: 'left'
         });
      yPosition += getDynamicSpacing(yPosition, pageHeight, 40, 30); // Reducido de 60

      // ✅ POR CONCEPTO DE - espaciado optimizado
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Por concepto de:', 80, yPosition);
      yPosition += getDynamicSpacing(yPosition, pageHeight, 25, 18);
      
      const contratoNumero = commission?.Contract?.contract_number || 'N/A';
      doc.fontSize(12)
         .font('Helvetica')
         .text(`Comisión de venta contrato ${contratoNumero}`, 80, yPosition);
      yPosition += getDynamicSpacing(yPosition, pageHeight, 40, 30); // Reducido de 60

      // ✅ FAVOR EFECTUAR EL PAGO - espaciado optimizado
      doc.fontSize(12)
         .font('Helvetica')
         .text('Favor efectuar el pago en efectivo o por transferencia bancaria a:', 80, yPosition);
      yPosition += getDynamicSpacing(yPosition, pageHeight, 30, 20); // Reducido de 40

      // ✅ DATOS BANCARIOS (con formato específico) - espaciado optimizado
      doc.fontSize(12)
         .font('Helvetica')
         .text(`Banco: ${supportDocument.banco?.toUpperCase() || 'N/A'}`, 80, yPosition);
      yPosition += getDynamicSpacing(yPosition, pageHeight, 18, 12);
      
      doc.text(`Tipo de Cuenta: ${supportDocument.tipo_cuenta?.toUpperCase() || 'N/A'}`, 80, yPosition);
      yPosition += getDynamicSpacing(yPosition, pageHeight, 18, 12);
      
      doc.text(`Número de Cuenta: ${supportDocument.numero_cuenta || 'N/A'}`, 80, yPosition);
      yPosition += getDynamicSpacing(yPosition, pageHeight, 50, 35); // Reducido de 80

      // ✅ ATENTAMENTE - espaciado optimizado
      doc.fontSize(12)
         .font('Helvetica')
         .text('Atentamente,', 80, yPosition);
      yPosition += getDynamicSpacing(yPosition, pageHeight, 50, 35); // Reducido de 80 para la firma

      // ✅ FIRMA Y DATOS DEL ASESOR - espaciado optimizado
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text(nombreCompleto.toUpperCase(), 80, yPosition);
      yPosition += getDynamicSpacing(yPosition, pageHeight, 25, 18);
      
      // Extraer teléfono del campo observaciones
      const telMatch = observaciones.match(/Tel:\s*([^\n\r]+)/);
      const numeroTel = telMatch ? telMatch[1].trim() : 'No especificado';
      
      doc.fontSize(12)
         .font('Helvetica')
         .text(`Celular: ${numeroTel}`, 80, yPosition);

      // ✅ PIE DE PÁGINA (posicionado de forma inteligente)
      const footerY = Math.max(yPosition + 40, pageHeight - 60); // Asegurar que esté cerca del final pero no se corte
      
      doc.fontSize(8)
         .font('Helvetica')
         .text(`Documento No: ${supportDocument.numero_documento}`, 80, footerY)
         .text(`Generado el ${new Date().toLocaleString('es-CO')}`, 400, footerY);


         
        if (supportDocument.firma_digital_url) {
          console.log('🔍 URL de firma recibida en generatePaymentDocument:', supportDocument.firma_digital_url);
        getImageBuffer(supportDocument.firma_digital_url)
          .then(firmaBuffer => {
            console.log('✅ Firma digital descargada, tamaño:', firmaBuffer.length);
            const firmaWidth = 120;
            const firmaHeight = 60;
            const x = doc.page.width - doc.page.margins.right - firmaWidth;
            const y = doc.page.height - doc.page.margins.bottom - firmaHeight - 10;
            doc.image(firmaBuffer, x, y, { width: firmaWidth, height: firmaHeight });
            doc.end();
          })
          .catch(err => {
            console.error('❌ Error descargando la firma digital:', err);
            console.error('No se pudo cargar la firma digital:', err);
            doc.end();
          });
      } else {
        doc.end();
      }

      stream.on('finish', () => {
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          console.log('✅ PDF creado exitosamente:', filePath);
          console.log('📊 Tamaño:', stats.size, 'bytes');
          const relativePath = `/uploads/payment-documents/${fileName}`;
          resolve(relativePath);
        } else {
          console.error('❌ Archivo no se creó correctamente');
          reject(new Error('El archivo PDF no se pudo crear'));
        }
      });

    } catch (error) {
      console.error('❌ Error generando PDF:', error);
      reject(error);
    }
  });
};

// ✅ Función para convertir números a letras
const convertirNumeroALetras = (numero) => {
  const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const decenas = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

  if (numero === 0) return 'cero pesos';
  if (numero === 100) return 'cien pesos';

  let letras = '';
  
  // Millones
  if (numero >= 1000000) {
    const millones = Math.floor(numero / 1000000);
    if (millones === 1) {
      letras += 'un millón ';
    } else {
      letras += convertirGrupoTres(millones) + ' millones ';
    }
    numero %= 1000000;
  }

  // Miles
  if (numero >= 1000) {
    const miles = Math.floor(numero / 1000);
    if (miles === 1) {
      letras += 'mil ';
    } else {
      letras += convertirGrupoTres(miles) + ' mil ';
    }
    numero %= 1000;
  }

  // Unidades, decenas y centenas
  if (numero > 0) {
    letras += convertirGrupoTres(numero);
  }

  return letras.trim() + ' pesos';

  function convertirGrupoTres(num) {
    let resultado = '';
    
    // Centenas
    if (num >= 100) {
      const c = Math.floor(num / 100);
      if (num === 100) {
        resultado += 'cien';
      } else {
        resultado += centenas[c] + ' ';
      }
      num %= 100;
    }

    // Decenas y unidades
    if (num >= 20) {
      const d = Math.floor(num / 10);
      const u = num % 10;
      resultado += decenas[d];
      if (u > 0) {
        resultado += ' y ' + unidades[u];
      }
    } else if (num >= 10) {
      resultado += especiales[num - 10];
    } else if (num > 0) {
      resultado += unidades[num];
    }

    return resultado.trim();
  }
};

// Función auxiliar para formatear moneda
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP'
  }).format(amount);
};

module.exports = generatePaymentDocument;