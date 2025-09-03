const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { formatForPDF } = require('./dateUtils');

/**
 * Genera un recibo PDF en formato ticket para un pago
 * @param {Object} paymentData - Datos del pago con contract e información del cliente
 * @returns {Promise<Buffer>} Buffer del PDF generado
 */
async function generateReceiptPDF(paymentData) {
  return new Promise((resolve, reject) => {
    try {
      // Crear nuevo documento PDF en formato ticket (ancho: 226px = 80mm)
      const doc = new PDFDocument({
        size: [226, 600], // Formato ticket: 80mm ancho, altura variable
        margins: {
          top: 10,
          bottom: 10,
          left: 10,
          right: 10
        }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // ✅ DATOS DEL PAGO Y CONTRATO
      const contract = paymentData.Contract || {};
      const quote = contract.Quote || {};
      const cliente = quote.Cliente || {};

      // ✅ CONFIGURAR FUENTES Y ESTILOS
      const primaryColor = '#1E40AF'; // Azul
      const secondaryColor = '#374151'; // Gris oscuro
      const lightGray = '#F3F4F6';

      // ✅ ENCABEZADO - LOGO Y EMPRESA
      doc.fontSize(14)
         .fillColor(primaryColor)
         .text('VIAJA YA', 10, 20, { align: 'center', width: 206 });

      doc.fontSize(8)
         .fillColor(secondaryColor)
         .text('Agencia de Viajes y Turismo', 10, 40, { align: 'center', width: 206 });

      // ✅ LÍNEA SEPARADORA
      doc.moveTo(10, 55)
         .lineTo(216, 55)
         .stroke();

      // ✅ TÍTULO DEL RECIBO
      doc.fontSize(12)
         .fillColor(primaryColor)
         .text('RECIBO DE PAGO', 10, 65, { align: 'center', width: 206 });

      let currentY = 85;

      // ✅ INFORMACIÓN DEL PAGO
      const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP',
          minimumFractionDigits: 0
        }).format(amount);
      };

      const formatDate = (date) => {
        if (!date) return 'N/A';
        
        // Usar formatForPDF para consistencia con zona horaria de Colombia
        const dateFormatted = formatForPDF(date);
        
        // Para recibos, incluir también la hora si está disponible
        if (date && typeof date === 'string' && date.includes('T')) {
          try {
            const dateObj = new Date(date);
            const timeFormatted = dateObj.toLocaleTimeString('es-CO', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'America/Bogota'
            });
            return `${dateFormatted} ${timeFormatted}`;
          } catch (error) {
            return dateFormatted;
          }
        }
        
        return dateFormatted;
      };

      // ✅ FUNCIÓN PARA AGREGAR LÍNEA DE INFORMACIÓN
      const addInfoLine = (label, value, y) => {
        doc.fontSize(8)
           .fillColor(secondaryColor)
           .text(label, 10, y, { width: 100 });
        
        doc.fontSize(8)
           .fillColor('#000000')
           .text(value, 110, y, { width: 106, align: 'right' });
        
        return y + 15;
      };

      // ✅ INFORMACIÓN BÁSICA
      currentY = addInfoLine('Fecha de pago:', formatDate(paymentData.fecha_pago), currentY);
      currentY = addInfoLine('Recibo No.:', paymentData.referencia_pago || paymentData.id?.substring(0, 8) || 'N/A', currentY);
      currentY = addInfoLine('Contrato:', contract.contract_number || 'N/A', currentY);

      // ✅ LÍNEA SEPARADORA
      doc.moveTo(10, currentY + 5)
         .lineTo(216, currentY + 5)
         .stroke();

      currentY += 15;

      // ✅ INFORMACIÓN DEL CLIENTE
      doc.fontSize(10)
         .fillColor(primaryColor)
         .text('CLIENTE QUE PAGA', 10, currentY, { align: 'center', width: 206 });

      currentY += 20;

      const clienteNombre = paymentData.pagador_nombre || 
                           `${cliente.name || ''} ${cliente.lastname || ''}`.trim() || 
                           'Cliente';
      
      currentY = addInfoLine('Nombre:', clienteNombre, currentY);
      
      if (paymentData.pagador_email || cliente.email) {
        currentY = addInfoLine('Email:', paymentData.pagador_email || cliente.email, currentY);
      }
      
      if (paymentData.pagador_telefono || cliente.phone) {
        currentY = addInfoLine('Teléfono:', paymentData.pagador_telefono || cliente.phone, currentY);
      }

      // ✅ LÍNEA SEPARADORA
      doc.moveTo(10, currentY + 5)
         .lineTo(216, currentY + 5)
         .stroke();

      currentY += 15;

      // ✅ DETALLES DEL VIAJE (si disponible)
      if (quote.destino || quote.nombre_cliente) {
        doc.fontSize(10)
           .fillColor(primaryColor)
           .text('DETALLES DEL VIAJE', 10, currentY, { align: 'center', width: 206 });

        currentY += 20;

        if (quote.destino) {
          currentY = addInfoLine('Destino:', quote.destino, currentY);
        }
        
        if (quote.nombre_cliente) {
          currentY = addInfoLine('Viajero(s):', quote.nombre_cliente, currentY);
        }

        // ✅ LÍNEA SEPARADORA
        doc.moveTo(10, currentY + 5)
           .lineTo(216, currentY + 5)
           .stroke();

        currentY += 15;
      }

      // ✅ INFORMACIÓN DEL PAGO
      doc.fontSize(10)
         .fillColor(primaryColor)
         .text('DETALLE DEL PAGO', 10, currentY, { align: 'center', width: 206 });

      currentY += 20;

      // Tipo de pago
      const tiposPago = {
        'wompi': 'Wompi (Online)',
        'transferencia': 'Transferencia Bancaria',
        'efectivo': 'Efectivo',
        'tarjeta': 'Tarjeta',
        'cheque': 'Cheque'
      };

      currentY = addInfoLine('Método:', tiposPago[paymentData.tipo_pago] || paymentData.tipo_pago, currentY);
      
      if (paymentData.banco_origen) {
        currentY = addInfoLine('Banco:', paymentData.banco_origen, currentY);
      }

      // ✅ MONTO - MÁS DESTACADO
      doc.moveTo(10, currentY + 5)
         .lineTo(216, currentY + 5)
         .stroke();

      currentY += 15;

      doc.fontSize(10)
         .fillColor(secondaryColor)
         .text('MONTO RECIBIDO:', 10, currentY, { width: 100 });

      doc.fontSize(12)
         .fillColor(primaryColor)
         .text(formatCurrency(paymentData.monto), 110, currentY, { width: 106, align: 'right' });

      currentY += 25;

      // ✅ LÍNEA SEPARADORA GRUESA
      doc.moveTo(10, currentY)
         .lineTo(216, currentY)
         .lineWidth(2)
         .stroke()
         .lineWidth(1);

      currentY += 15;

      // ✅ INFORMACIÓN DE LA EMPRESA
      doc.fontSize(8)
         .fillColor(secondaryColor)
         .text('VIAJA YA - Agencia de Viajes', 10, currentY, { align: 'center', width: 206 });

      currentY += 12;

      doc.fontSize(7)
         .fillColor('#6B7280')
         .text('www.viajaya.com', 10, currentY, { align: 'center', width: 206 });

      currentY += 12;

      doc.fontSize(7)
         .fillColor('#6B7280')
         .text('Este es un recibo provisional del pago registrado', 10, currentY, { align: 'center', width: 206 });

      currentY += 10;

      doc.fontSize(6)
         .fillColor('#9CA3AF')
         .text(`Recibo válido - ViajaYa Turismo`, 10, currentY, { align: 'center', width: 206 });

      // ✅ AJUSTAR ALTURA DEL DOCUMENTO
      const finalHeight = Math.max(currentY + 20, 300);
      
      doc.end();

    } catch (error) {
      console.error('❌ Error generando recibo PDF:', error);
      reject(error);
    }
  });
}

module.exports = {
  generateReceiptPDF
};
