import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const ReceiptModal = ({ isOpen, onClose, receiptUrl, title = "Comprobante" }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔄 OPTIMIZAR URL DE CLOUDINARY ESPECIALMENTE PARA PDFs
  const getOptimizedCloudinaryUrl = (url) => {
    if (!url) return url;
    
    console.log('🔄 ReceiptModal - Optimizando URL:', url);
    
    if (url.includes('cloudinary.com')) {
      const extension = url.split('.').pop()?.toLowerCase();
      const hasRawUpload = url.includes('/raw/upload/');
      const hasImageUpload = url.includes('/image/upload/');
      const hasNoExtension = !url.includes('.') || url.split('/').pop().indexOf('.') === -1;
      
      console.log('🔍 URL Analysis:', {
        extension,
        hasRawUpload,
        hasImageUpload,
        hasNoExtension,
        url
      });
      
      // Para PDFs (incluye archivos sin extensión que suelen ser PDFs)
      if (extension === 'pdf' || hasRawUpload || hasNoExtension) {
        console.log('📄 Procesando como PDF');
        let pdfUrl = url;
        
        // Si está mal configurado como imagen, convertir a raw/upload
        if (hasImageUpload) {
          pdfUrl = url.replace('/image/upload/', '/raw/upload/')
                     .replace(/\/f_auto,q_auto[^/]*\//, '/');
        }
        
        console.log('📄 PDF URL simplificada:', pdfUrl);
        return pdfUrl;
      } else {
        // Para imágenes reales: optimizar
        console.log('🖼️ Procesando como imagen');
        let imageUrl = url;
        if (hasRawUpload) {
          imageUrl = url.replace('/raw/upload/', '/image/upload/f_auto,q_auto,w_800/');
        } else if (hasImageUpload && !url.includes('f_auto,q_auto')) {
          imageUrl = url.replace('/image/upload/', '/image/upload/f_auto,q_auto,w_800/');
        }
        console.log('🖼️ Imagen URL optimizada:', imageUrl);
        return imageUrl;
      }
    }
    
    return url;
  };

  const optimizedUrl = getOptimizedCloudinaryUrl(receiptUrl);

  // 🔍 DETECTAR TIPO DE ARCHIVO
  const getFileType = (url) => {
    if (!url) return 'unknown';
    
    const extension = url.split('.').pop()?.toLowerCase();
    const hasRawUpload = url.includes('/raw/upload/');
    const hasNoExtension = !url.includes('.') || url.split('/').pop().indexOf('.') === -1;
    
    console.log('🔍 Detección de tipo:', {
      url,
      extension,
      hasRawUpload,
      hasNoExtension
    });
    
    // Si es PDF explícito o está en raw/upload o no tiene extensión
    if (extension === 'pdf' || hasRawUpload || hasNoExtension) {
      console.log('📄 Detectado como PDF');
      return 'pdf';
    }
    
    // Si es imagen por extensión
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension)) {
      console.log('🖼️ Detectado como imagen');
      return 'image';
    }
    
    console.log('❓ Tipo desconocido');
    return 'unknown';
  };

  // 🐛 DEBUG: Log completo para diagnóstico
  useEffect(() => {
    if (isOpen && receiptUrl) {
      console.log('🔍 ReceiptModal Debug Info:');
      console.log('📄 Title:', title);
      console.log('🔗 Original URL:', receiptUrl);
      console.log('🎯 Optimized URL:', optimizedUrl);
      console.log('📋 Detected Type:', getFileType(optimizedUrl));
      console.log('✅ URL Valid:', !!receiptUrl && receiptUrl.trim() !== '');
    }
  }, [isOpen, receiptUrl, title, optimizedUrl]);

  // 🔄 RESETEAR ESTADO AL ABRIR
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
    }
  }, [isOpen]);

  // 🚪 CERRAR CON ESC
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  // ✅ MANEJAR CARGA EXITOSA
  const handleLoad = () => {
    console.log('✅ Contenido cargado exitosamente');
    setLoading(false);
    setError(null);
  };

  // ❌ MANEJAR ERROR DE CARGA
  const handleError = () => {
    console.log('❌ Error cargando contenido');
    setLoading(false);
    setError('No se pudo cargar el comprobante. Intenta descargarlo o abrirlo en una nueva pestaña.');
  };

  // 📥 DESCARGAR CON EXTENSIÓN CORRECTA
  const handleDownload = () => {
    if (receiptUrl) {
      console.log('📥 Iniciando descarga:', receiptUrl);
      
      // Detectar extensión apropiada
      const getFileExtension = (url) => {
        // Si ya tiene extensión válida
        const currentExt = url.split('.').pop()?.toLowerCase();
        if (['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp'].includes(currentExt)) {
          return currentExt;
        }
        
        // Si está en raw/upload o no tiene extensión, asumir PDF
        if (url.includes('/raw/upload/') || !url.includes('.')) {
          return 'pdf';
        }
        
        // Si está optimizado como imagen
        if (url.includes('f_auto,q_auto')) {
          return 'jpg';
        }
        
        // Default para comprobantes
        return 'pdf';
      };
      
      const extension = getFileExtension(receiptUrl);
      const filename = `comprobante_${Date.now()}.${extension}`;
      
      console.log('📄 Descargando como:', filename);
      
      // Crear enlace de descarga
      const link = document.createElement('a');
      link.href = receiptUrl; // Usar URL original
      link.download = filename;
      link.target = '_blank';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ Descarga iniciada');
    }
  };

  if (!isOpen) return null;

  const fileType = getFileType(optimizedUrl);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* HEADER */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              📄 {title}
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownload}
                className="px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                title="Descargar comprobante"
              >
                📥 Descargar
              </button>
              <button
                onClick={onClose}
                className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                ❌ Cerrar
              </button>
            </div>
          </div>

          {/* CONTENIDO */}
          <div className="px-6 py-4" style={{ maxHeight: '70vh', overflow: 'auto' }}>
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-2 text-gray-600">Cargando comprobante...</span>
              </div>
            )}

            {error && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar</h3>
                <p className="text-gray-500 mb-4">{error}</p>
                <div className="space-x-2">
                  <a
                    href={optimizedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 mr-2"
                  >
                    🔗 Abrir en nueva pestaña
                  </a>
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 mr-2"
                  >
                    📥 Descargar
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}

            {!loading && !error && receiptUrl && (
              <div className="receipt-container">
                {/* IMAGEN */}
                {fileType === 'image' && (
                  <div className="text-center">
                    <img
                      src={optimizedUrl}
                      alt="Comprobante"
                      className="max-w-full h-auto rounded-lg shadow-lg mx-auto"
                      onLoad={handleLoad}
                      onError={handleError}
                      style={{ maxHeight: '60vh' }}
                    />
                  </div>
                )}

                {/* PDF - ENFOQUE SIMPLE COMO COMMISSIONS */}
                {fileType === 'pdf' && (
                  <div className="space-y-4">
                    <div className="w-full border rounded-lg overflow-hidden" style={{ height: '60vh' }}>
                      <iframe
                        src={optimizedUrl}
                        className="w-full h-full border-0"
                        title="Comprobante PDF"
                        onLoad={handleLoad}
                        onError={() => {
                          console.log('❌ Error cargando PDF en iframe');
                          setError('PDF no se puede mostrar en el navegador. Usa los botones para descargarlo o abrirlo en nueva pestaña.');
                        }}
                      />
                    </div>
                    
                    <div className="flex justify-center space-x-4 p-4 bg-blue-50 rounded-lg">
                      <a
                        href={optimizedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200"
                      >
                        🔗 Abrir en nueva pestaña
                      </a>
                      <button
                        onClick={handleDownload}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-600 bg-green-100 rounded-md hover:bg-green-200"
                      >
                        📥 Descargar PDF
                      </button>
                    </div>
                    
                    <div className="text-xs text-gray-500 text-center bg-gray-50 p-3 rounded-lg">
                      💡 <strong>Si el PDF no se muestra:</strong> Ábrelo en una nueva pestaña o descárgalo
                    </div>
                  </div>
                )}

                {/* TIPO DESCONOCIDO */}
                {fileType === 'unknown' && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📎</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Archivo no previsualizable
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Este tipo de archivo no se puede previsualizar en el navegador
                    </p>
                    <button
                      onClick={handleDownload}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                    >
                      📥 Descargar archivo
                    </button>
                  </div>
                )}
              </div>
            )}

            {!receiptUrl && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">❌</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay comprobante disponible
                </h3>
                <p className="text-gray-500 mb-4">
                  No se ha adjuntado ningún comprobante para este registro
                </p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

ReceiptModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  receiptUrl: PropTypes.string,
  title: PropTypes.string
};

export default ReceiptModal;
