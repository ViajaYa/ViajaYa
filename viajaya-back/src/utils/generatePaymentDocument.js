const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generatePaymentDocument = async (supportDocument, commission) => {
  return new Promise((resolve, reject) => {
    try {
      // ✅ Usar el mismo directorio que el controller
      const uploadsDir = path.join(__dirname, '../../uploads/payment-documents');
      if (!fs.existsSync(uploadsDir)) {
        console.log('📁 Creando directorio uploads:', uploadsDir);
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const fileName = `documento-cobro-${supportDocument.numero_documento}.pdf`;
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
          top: 50,
          bottom: 50,
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

      let yPosition = 80;

      // ✅ FECHA DEL DÍA (formato exacto como en la imagen)
      const fechaHoy = new Date().toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      doc.fontSize(12)
         .text(`Bogotá, ${fechaHoy}`, 80, yPosition);

      yPosition += 80; // Más espacio después de la fecha

      // ✅ DATOS DE QUIEN PAGA (ViajaYa) - CENTRADO Y CON ESPACIADO CORRECTO
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('MAYERLY ALEJANDRA HENAO HIGUERA', 80, yPosition, { 
           width: 430, 
           align: 'center' 
         });
      yPosition += 20;
      
      doc.fontSize(12)
         .font('Helvetica')
         .text('REPRESENTANTE LEGAL', 80, yPosition, { 
           width: 430, 
           align: 'center' 
         });
      yPosition += 18;
      
      doc.text('OPERADOR TURÍSTICO Y AGENCIA DE VIAJES VIAJA YA', 80, yPosition, { 
        width: 430, 
        align: 'center' 
      });
      yPosition += 18;
      
      doc.text('Nit: 1032406128', 80, yPosition, { 
        width: 430, 
        align: 'center' 
      });
      yPosition += 80; // Mucho espacio después de los datos de ViajaYa

      // ✅ DEBE A (con espaciado correcto)
      const vendedorInfo = commission?.Vendedor || supportDocument.Vendedor;
      const nombreCompleto = `${vendedorInfo?.name || ''} ${vendedorInfo?.lastname || ''}`.trim();
      
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Debe a:', 80, yPosition);
      yPosition += 25;
      
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text(nombreCompleto.toUpperCase(), 80, yPosition);
      yPosition += 20;
      
      // Extraer CC del campo observaciones o usar placeholder
      const observaciones = supportDocument.observaciones || '';
      const ccMatch = observaciones.match(/CC:\s*([^\n\r]+)/);
      const numeroCC = ccMatch ? ccMatch[1].trim() : 'No especificado';
      
      doc.fontSize(12)
         .font('Helvetica')
         .text(`CC: ${numeroCC}`, 80, yPosition);
      yPosition += 60; // Más espacio antes de "LA SUMA DE"

      // ✅ LA SUMA DE (En números y letras)
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('LA SUMA DE:', 80, yPosition);
      yPosition += 25;
      
      const montoEnLetras = convertirNumeroALetras(supportDocument.monto);
      doc.fontSize(12)
         .font('Helvetica')
         .text(`${montoEnLetras.toUpperCase()} (${formatCurrency(supportDocument.monto)})`, 80, yPosition, {
           width: 430,
           align: 'left'
         });
      yPosition += 60; // Más espacio antes de "Por concepto de"

      // ✅ POR CONCEPTO DE
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Por concepto de:', 80, yPosition);
      yPosition += 25;
      
      const contratoNumero = commission?.Contract?.contract_number || 'N/A';
      doc.fontSize(12)
         .font('Helvetica')
         .text(`Comisión de venta contrato ${contratoNumero}`, 80, yPosition);
      yPosition += 60; // Más espacio antes de "Favor efectuar"

      // ✅ FAVOR EFECTUAR EL PAGO
      doc.fontSize(12)
         .font('Helvetica')
         .text('Favor efectuar el pago en efectivo o por transferencia bancaria a:', 80, yPosition);
      yPosition += 40;

      // ✅ DATOS BANCARIOS (con formato específico)
      doc.fontSize(12)
         .font('Helvetica')
         .text(`Banco: ${supportDocument.banco?.toUpperCase() || 'N/A'}`, 80, yPosition);
      yPosition += 18;
      
      doc.text(`Tipo de Cuenta: ${supportDocument.tipo_cuenta?.toUpperCase() || 'N/A'}`, 80, yPosition);
      yPosition += 18;
      
      doc.text(`Número de Cuenta: ${supportDocument.numero_cuenta || 'N/A'}`, 80, yPosition);
      yPosition += 80; // Mucho espacio antes de "Atentamente"

      // ✅ ATENTAMENTE
      doc.fontSize(12)
         .font('Helvetica')
         .text('Atentamente,', 80, yPosition);
      yPosition += 80; // Espacio para la firma

      // ✅ FIRMA Y DATOS DEL ASESOR
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text(nombreCompleto.toUpperCase(), 80, yPosition);
      yPosition += 25;
      
      // Extraer teléfono del campo observaciones
      const telMatch = observaciones.match(/Tel:\s*([^\n\r]+)/);
      const numeroTel = telMatch ? telMatch[1].trim() : 'No especificado';
      
      doc.fontSize(12)
         .font('Helvetica')
         .text(`Celular: ${numeroTel}`, 80, yPosition);

      // ✅ PIE DE PÁGINA (en la parte inferior)
      doc.fontSize(8)
         .font('Helvetica')
         .text(`Documento No: ${supportDocument.numero_documento}`, 80, 750)
         .text(`Generado el ${new Date().toLocaleString('es-CO')}`, 400, 750);

      // ✅ Finalizar documento
      doc.end();

      stream.on('finish', () => {
        // ✅ Verificar que el archivo se creó correctamente
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