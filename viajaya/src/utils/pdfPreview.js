// ✅ Helper para vista previa de PDF
export const openPDFPreview = (pdfUrl, filename = 'cotizacion.pdf') => {
  console.log('🔍 openPDFPreview - URL recibida:', pdfUrl);
  
  if (!pdfUrl) {
    console.error('❌ No se proporcionó URL para vista previa');
    alert('Error: No se pudo generar la URL del PDF');
    return;
  }

  try {
    // Abrir en nueva pestaña
    const newWindow = window.open(pdfUrl, '_blank');
    
    if (newWindow) {
      newWindow.document.title = filename;
      console.log('✅ PDF abierto en nueva ventana');
    } else {
      console.warn('⚠️ No se pudo abrir ventana emergente');
      
      // Fallback: crear enlace de descarga temporal
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Intentar hacer clic programáticamente
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert('Verifica que las ventanas emergentes estén habilitadas. Se intentó abrir en nueva pestaña.');
    }
  } catch (error) {
    console.error('❌ Error abriendo PDF:', error);
    alert('Error al abrir la vista previa del PDF');
  }
};

// ✅ Helper para limpiar URLs de blob
export const cleanupBlobUrl = (url) => {
  if (url && url.startsWith('blob:')) {
    try {
      window.URL.revokeObjectURL(url);
      console.log('✅ Blob URL limpiada:', url);
    } catch (error) {
      console.warn('⚠️ Error limpiando blob URL:', error);
    }
  }
};

// ✅ Helper para verificar si una cotización tiene PDF generado
export const hasGeneratedPDF = (quote) => {
  return !!(quote?.pdf_filename && quote?.pdf_generated_at);
};

// ✅ Helper para verificar si una cotización puede generar PDF
export const canGeneratePDF = (quote) => {
  return !!(quote?.precio_total && quote.precio_total > 0);
};

// ✅ NUEVA FUNCIÓN: Convertir blob response a URL
export const createBlobUrl = (blob, filename) => {
  try {
    // Verificar que sea un blob válido
    if (!(blob instanceof Blob)) {
      throw new Error('No es un blob válido');
    }

    // Crear URL del blob
    const url = window.URL.createObjectURL(blob);
    console.log('✅ Blob URL creada:', url, 'para archivo:', filename);
    
    return url;
  } catch (error) {
    console.error('❌ Error creando blob URL:', error);
    throw error;
  }
};