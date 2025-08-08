const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const generateSignedContractPDF = async (contract, signatureData) => {
  return new Promise((resolve, reject) => {
    try {
      // Crear directorio si no existe
      const uploadsDir = path.join(__dirname, '../../uploads/pdfs');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filename = `contrato-firmado-${contract.contract_number}.pdf`;
      const filepath = path.join(uploadsDir, filename);
      const doc = new PDFDocument({ margin: 50 });

      // Stream del PDF
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // ✅ CONTENIDO DEL PDF (reutilizar lógica del PDF original + firma)
      
      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('CONTRATO DE VIAJE FIRMADO', 50, 50);
      doc.fontSize(12).font('Helvetica').text('ViajaYa - Operador Turístico | RNT 122035', 50, 80);
      
      let currentY = 120;

      // Información del contrato (reutilizar del generateContractPDF original)
      doc.fontSize(14).font('Helvetica-Bold').text('INFORMACIÓN DEL CONTRATO', 50, currentY);
      currentY += 30;

      doc.fontSize(10).font('Helvetica');
      doc.text(`Número de Contrato: ${contract.contract_number}`, 50, currentY);
      doc.text(`Destino: ${contract.Quote?.destino}`, 300, currentY);
      currentY += 20;

      doc.text(`Cliente: ${contract.Cliente?.name} ${contract.Cliente?.lastname}`, 50, currentY);
      doc.text(`Precio Total: $${parseFloat(contract.precio_total).toLocaleString('es-CO')}`, 300, currentY);
      currentY += 40;

      // ✅ SECCIÓN DE FIRMA DIGITAL
      doc.fontSize(14).font('Helvetica-Bold').text('FIRMA DIGITAL', 50, currentY);
      currentY += 30;

      // Información del firmante
      doc.fontSize(10).font('Helvetica');
      doc.text(`Firmado por: ${signatureData.signer_name}`, 50, currentY);
      doc.text(`Documento: ${signatureData.signer_document}`, 300, currentY);
      currentY += 20;

      doc.text(`Email: ${signatureData.signer_email}`, 50, currentY);
      doc.text(`Cargo: ${signatureData.signer_role}`, 300, currentY);
      currentY += 20;

      doc.text(`Fecha de firma: ${new Date(signatureData.signed_at).toLocaleString('es-ES')}`, 50, currentY);
      doc.text(`IP: ${signatureData.signature_ip}`, 300, currentY);
      currentY += 40;

      // ✅ INSERTAR IMAGEN DE LA FIRMA
      if (signatureData.signature_image) {
        try {
          // Convertir base64 a buffer
          const base64Data = signatureData.signature_image.replace(/^data:image\/png;base64,/, '');
          const imgBuffer = Buffer.from(base64Data, 'base64');
          
          // Guardar imagen temporalmente
          const tempImgPath = path.join(uploadsDir, `temp-signature-${Date.now()}.png`);
          fs.writeFileSync(tempImgPath, imgBuffer);
          
          // Insertar en PDF
          doc.text('Firma:', 50, currentY);
          currentY += 20;
          doc.image(tempImgPath, 50, currentY, { width: 200, height: 100 });
          
          // Limpiar archivo temporal
          fs.unlinkSync(tempImgPath);
          
          currentY += 120;
        } catch (imgError) {
          console.error('Error procesando imagen de firma:', imgError);
          doc.text('Error: No se pudo insertar la firma', 50, currentY);
          currentY += 20;
        }
      }

      // ✅ SELLO DE VALIDACIÓN DIGITAL
      currentY += 20;
      doc.fontSize(8).font('Helvetica');
      doc.text('━'.repeat(80), 50, currentY);
      currentY += 15;
      doc.text('VALIDACIÓN DIGITAL:', 50, currentY);
      currentY += 12;
      doc.text(`Token de firma: ${signatureData.signature_token.substring(0, 50)}...`, 50, currentY);
      currentY += 12;
      doc.text(`Hash de verificación: ${generateVerificationHash(contract.id, signatureData)}`, 50, currentY);
      currentY += 12;
      doc.text('Este documento ha sido firmado digitalmente y es válido ante la ley.', 50, currentY);

      // Finalizar PDF
      doc.end();

      stream.on('finish', () => {
        const relativePath = `uploads/pdfs/${filename}`;
        resolve({
          filename,
          filepath,
          relativePath
        });
      });

      stream.on('error', reject);

    } catch (error) {
      reject(error);
    }
  });
};

// Función auxiliar para generar hash de verificación
const generateVerificationHash = (contractId, signatureData) => {
  const crypto = require('crypto');
  const data = `${contractId}-${signatureData.signed_at}-${signatureData.signer_document}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
};

module.exports = { generateSignedContractPDF };