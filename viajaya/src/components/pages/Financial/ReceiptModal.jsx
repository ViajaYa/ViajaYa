import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const ReceiptModal = ({ isOpen, onClose, receiptUrl, title = "Comprobante" }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [forceImageView, setForceImageView] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef(null);

  // 🔄 OPTIMIZAR URL DE CLOUDINARY ESPECIALMENTE PARA PDFs
  const getOptimizedCloudinaryUrl = (url) => {
    if (!url) return url;
    
    if (url.includes('cloudinary.com')) {
      const extension = url.split('.').pop()?.toLowerCase();
      const hasRawUpload = url.includes('/raw/upload/');
      const hasImageUpload = url.includes('/image/upload/');
      const hasNoExtension = !url.includes('.') || url.split('/').pop().indexOf('.') === -1;
      
      // Para PDFs o archivos sin extensión clara (que suelen ser PDFs en este contexto)
      if (extension === 'pdf' || hasRawUpload || hasNoExtension || 
          (hasImageUpload && !['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension))) {
        let pdfUrl = url;
        
        // Si está mal configurado como imagen, convertir a raw/upload
        if (hasImageUpload) {
          pdfUrl = url.replace('/image/upload/', '/raw/upload/')
                     .replace(/\/f_auto,q_auto[^/]*\//, '/');
        }
        
        // 🔧 USAR PROXY DEL BACKEND para PDFs de Cloudinary
        if (hasRawUpload) {
          // Mejorar extracción de public_id para ser más robusta
          let publicId = '';
          
          // Método 1: Usar split en lugar de regex para mayor compatibilidad
          const parts = pdfUrl.split('/raw/upload/');
          if (parts.length > 1) {
            publicId = parts[1];
            // Remover versión si existe (v1234567890/)
            if (publicId.startsWith('v') && publicId.includes('/')) {
              publicId = publicId.split('/').slice(1).join('/');
            }
          }
          
          if (publicId) {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const proxyUrl = `${apiUrl}/contracts/serve-pdf/${encodeURIComponent(publicId)}`;
            console.log('🔧 Using backend proxy for PDF:', pdfUrl, '→', proxyUrl);
            console.log('🆔 Extracted public_id:', publicId);
            return proxyUrl;
          } else {
            console.warn('⚠️ Could not extract public_id from URL:', pdfUrl);
          }
        }
        
        console.log('🔧 Keeping original Cloudinary PDF URL:', pdfUrl);
        
        return pdfUrl;
      } else {
        // Para imágenes reales: optimizar
        let imageUrl = url;
        if (hasRawUpload) {
          // Si está en raw pero es imagen, mover a image/upload
          imageUrl = url.replace('/raw/upload/', '/image/upload/f_auto,q_auto,w_800/');
        } else if (hasImageUpload && !url.includes('f_auto,q_auto')) {
          imageUrl = url.replace('/image/upload/', '/image/upload/f_auto,q_auto,w_800/');
        }
        return imageUrl;
      }
    }
    
    return url;
  };

  // 🔍 DETECTAR TIPO DE ARCHIVO - MEJORADO
  const getFileType = (url) => {
    if (!url) return 'unknown';
    
    // Extraer extensión correctamente
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const extension = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() : '';
    
    const hasRawUpload = url.includes('/raw/upload/');
    const hasImageUpload = url.includes('/image/upload/');
    
    console.log('🔍 File type detection:', { url, fileName, extension, hasRawUpload, hasImageUpload });
    
    // Si es PDF explícito, está en raw/upload, o no tiene extensión (común en Cloudinary para PDFs)
    if (extension === 'pdf' || hasRawUpload) {
      return 'pdf';
    }
    
    // Si está en image/upload pero no es una extensión de imagen real, asumir PDF
    if (hasImageUpload && !['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(extension)) {
      return 'pdf';
    }
    
    // Si es imagen por extensión Y está en image/upload
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(extension)) {
      return 'image';
    }
    
    // Default para comprobantes: PDF (la mayoría son PDFs)
    return 'pdf';
  };

  const optimizedUrl = getOptimizedCloudinaryUrl(receiptUrl);
  const detectedFileType = getFileType(optimizedUrl);
  
  // Permitir forzar vista como imagen si la detección PDF falla
  const fileType = forceImageView ? 'image' : detectedFileType;

  // 🐛 DEBUG: Log completo para diagnóstico
  useEffect(() => {
    if (isOpen && receiptUrl) {
      const detectedType = getFileType(receiptUrl);
      const urlParts = receiptUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const extension = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() : 'sin extensión';
      
      console.log('📄 Receipt Modal Debug:', {
        title,
        originalUrl: receiptUrl,
        optimizedUrl: optimizedUrl,
        detectedFileType: detectedType,
        fileName: fileName,
        extension: extension,
        hasRawUpload: receiptUrl.includes('/raw/upload/'),
        hasImageUpload: receiptUrl.includes('/image/upload/')
      });
      
      // Test URL accessibility
      if (optimizedUrl) {
        console.log('🔍 Testing URL accessibility...');
        fetch(optimizedUrl, { method: 'HEAD' })
          .then(response => {
            console.log('✅ URL is accessible:', response.status, response.headers.get('content-type'));
          })
          .catch(error => {
            console.log('❌ URL is not accessible:', error);
          });
      }
    }
  }, [isOpen, receiptUrl, title, optimizedUrl]);

  // 🔄 RESETEAR ESTADO AL ABRIR
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      setForceImageView(false);
      setImageLoaded(false);
      
      const currentFileType = getFileType(optimizedUrl || receiptUrl);
      
      // Para imágenes, usar pre-carga manual
      if (currentFileType === 'image' && optimizedUrl) {
        console.log('🔄 Pre-loading image:', optimizedUrl);
        
        const preloadImage = new Image();
        preloadImage.crossOrigin = 'anonymous';
        
        preloadImage.onload = () => {
          console.log('✅ Image pre-loaded successfully');
          setImageLoaded(true);
          setLoading(false);
          setError(null);
        };
        
        preloadImage.onerror = () => {
          console.log('❌ Image pre-load failed, trying original URL');
          // Try original URL
          if (receiptUrl && receiptUrl !== optimizedUrl) {
            const fallbackImage = new Image();
            fallbackImage.crossOrigin = 'anonymous';
            
            fallbackImage.onload = () => {
              console.log('✅ Original image loaded successfully');
              setImageLoaded(true);
              setLoading(false);
              setError(null);
              // Update image ref to use original URL
              if (imageRef.current) {
                imageRef.current.src = receiptUrl;
              }
            };
            
            fallbackImage.onerror = () => {
              console.log('❌ Both image URLs failed');
              setLoading(false);
              setError('No se pudo cargar la imagen');
            };
            
            fallbackImage.src = receiptUrl;
          } else {
            console.log('❌ Image pre-load failed completely');
            setLoading(false);
            setError('No se pudo cargar la imagen');
          }
        };
        
        preloadImage.src = optimizedUrl;
      } else if (currentFileType === 'pdf') {
        // Para PDFs, inicializar con loading pero no hacer pre-carga
        console.log('📄 PDF detected, preparing iframe load');
        // Verificar accesibilidad del PDF usando la URL original (sin .pdf)
        fetch(receiptUrl, { method: 'HEAD' })
          .then(response => {
            console.log('📄 PDF accessibility check:', response.status, response.ok);
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }
            // PDF es accesible, el object/iframe manejará la carga
            console.log('✅ PDF is accessible, object/iframe will handle display');
          })
          .catch(error => {
            console.log('❌ PDF not accessible:', error);
            setLoading(false);
            setError('No se puede acceder al PDF. Intenta descargarlo o abrirlo en nueva pestaña.');
          });
      } else {
        // Para tipos desconocidos
        console.log('❓ Unknown file type, using general timeout');
        const loadingTimeout = setTimeout(() => {
          setLoading((currentLoading) => {
            if (currentLoading) {
              console.log('⏰ General loading timeout');
              setError('El comprobante está tardando mucho en cargar. Prueba descargarlo o abrirlo en nueva pestaña.');
              return false;
            }
            return currentLoading;
          });
        }, 8000);
        
        return () => clearTimeout(loadingTimeout);
      }
    }
  }, [isOpen, receiptUrl, optimizedUrl, imageRef]);

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

  // 📥 DESCARGAR CON EXTENSIÓN CORRECTA
  const handleDownload = () => {
    console.log('🚨 handleDownload called! Stack trace:');
    console.trace();
    
    if (receiptUrl) {
      // 🔧 USAR URL OPTIMIZADA PARA DESCARGA (que incluye el proxy para PDFs)
      const downloadUrl = optimizedUrl || receiptUrl;
      
      // Detectar extensión apropiada basándose en el tipo de archivo detectado
      const getFileExtension = () => {
        // Si ya detectamos que es PDF, usar .pdf
        if (detectedFileType === 'pdf') {
          return 'pdf';
        }
        
        // Si detectamos que es imagen, intentar obtener extensión real
        if (detectedFileType === 'image') {
          const currentExt = receiptUrl.split('.').pop()?.toLowerCase();
          if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(currentExt)) {
            return currentExt;
          }
          return 'jpg'; // Default para imágenes
        }
        
        // Si está en raw/upload o no tiene extensión, asumir PDF
        if (receiptUrl.includes('/raw/upload/') || !receiptUrl.includes('.')) {
          return 'pdf';
        }
        
        // Si está optimizado como imagen
        if (receiptUrl.includes('f_auto,q_auto')) {
          return 'jpg';
        }
        
        // Default para comprobantes
        return 'pdf';
      };
      
      const extension = getFileExtension();
      const filename = `comprobante_${Date.now()}.${extension}`;
      
      console.log('📥 Downloading file:', { downloadUrl, filename, extension, detectedFileType });
      
      // Crear enlace de descarga
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.target = '_blank';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!isOpen) return null;

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
                <div className="space-y-3">
                  <div className="flex justify-center space-x-2">
                    <a
                      href={optimizedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      🔗 Abrir en nueva pestaña
                    </a>
                    <button
                      onClick={handleDownload}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                    >
                      📥 Descargar
                    </button>
                  </div>
                  
                  {detectedFileType === 'pdf' && !forceImageView && (
                    <button
                      onClick={() => {
                        setForceImageView(true);
                        setError(null);
                        setLoading(true);
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700"
                    >
                      🖼️ Probar como imagen
                    </button>
                  )}
                  
                  <div className="mt-4">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!loading && !error && receiptUrl && (
              <div className="receipt-container">
                {/* IMAGEN - CON PRE-CARGA MANUAL */}
                {fileType === 'image' && (
                  <div className="text-center space-y-4">
                    {/* Imagen siempre visible */}
                    <div className="relative inline-block">
                      <img
                        ref={imageRef}
                        src={optimizedUrl}
                        alt="Comprobante"
                        className="max-w-full h-auto rounded-lg shadow-lg"
                        style={{ 
                          maxHeight: '60vh',
                          minHeight: '300px',
                          minWidth: '200px',
                          backgroundColor: '#f3f4f6',
                          border: '2px dashed #d1d5db',
                          display: imageLoaded ? 'block' : 'none'
                        }}
                      />
                      
                      {/* Placeholder mientras carga */}
                      {!imageLoaded && (
                        <div 
                          className="flex items-center justify-center bg-gray-100 rounded-lg border-2 border-dashed border-gray-300"
                          style={{ 
                            minHeight: '300px',
                            minWidth: '200px'
                          }}
                        >
                          <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
                            <span className="text-sm text-gray-600">Cargando imagen...</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Botones siempre visibles */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-center space-x-3">
                        <a
                          href={optimizedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                        >
                          🔗 Nueva pestaña
                        </a>
                        <button
                          onClick={handleDownload}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-green-600 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
                        >
                          📥 Descargar
                        </button>
                        <button
                          onClick={() => {
                            console.log('🔄 Manually reloading image...');
                            setLoading(true);
                            setImageLoaded(false);
                            setError(null);
                            
                            // Force reload with new preload
                            const reloadImage = new Image();
                            reloadImage.crossOrigin = 'anonymous';
                            
                            reloadImage.onload = () => {
                              console.log('✅ Manual reload successful');
                              setImageLoaded(true);
                              setLoading(false);
                              if (imageRef.current) {
                                const timestamp = Date.now();
                                imageRef.current.src = optimizedUrl + (optimizedUrl.includes('?') ? '&' : '?') + 't=' + timestamp;
                              }
                            };
                            
                            reloadImage.onerror = () => {
                              console.log('❌ Manual reload failed');
                              setLoading(false);
                              setError('No se pudo recargar la imagen');
                            };
                            
                            const timestamp = Date.now();
                            reloadImage.src = optimizedUrl + (optimizedUrl.includes('?') ? '&' : '?') + 't=' + timestamp;
                          }}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-orange-600 bg-orange-100 rounded-md hover:bg-orange-200 transition-colors"
                        >
                          🔄 Recargar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* PDF - ESTRATEGIA SIMPLE Y ROBUSTA */}
                {fileType === 'pdf' && (
                  <div className="space-y-4">
                    {/* Estrategia 1: Mostrar directamente sin iframe complejo */}
                    <div className="w-full h-[600px] border rounded-lg overflow-hidden bg-gray-50 relative">
                      {/* Botón para forzar visualización */}
                      <div className="absolute top-4 right-4 z-10">
                        <button
                          onClick={() => {
                            // Abrir en nueva pestaña como solución inmediata
                            window.open(optimizedUrl, '_blank');
                          }}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          🔗 Ver PDF
                        </button>
                      </div>

                      {/* Iframe simple con detección automática de fallos */}
                      <iframe
                        src={optimizedUrl}
                        className="w-full h-full border-0"
                        title="Comprobante PDF"
                        onLoad={() => {
                          console.log('✅ PDF iframe cargado exitosamente');
                          setLoading(false);
                          setError(null);
                        }}
                        onError={() => {
                          console.log('❌ Error en iframe, mostrando controles alternativos');
                          setError('El navegador bloqueó la visualización del PDF. Usa los botones de abajo.');
                          setLoading(false);
                        }}
                        style={{ display: loading ? 'none' : 'block' }}
                        // Agregar timeout automático para detectar carga fallida
                        ref={(iframe) => {
                          if (iframe && !error) {
                            // Timeout de 5 segundos para detectar si el iframe no carga correctamente
                            const timeoutId = setTimeout(() => {
                              console.log('⏰ PDF iframe timeout - probably blocked by browser');
                              setError('El navegador está bloqueando la visualización del PDF. Usa los botones de abajo.');
                              setLoading(false);
                            }, 5000);
                            
                            // Limpiar timeout si el iframe carga exitosamente
                            iframe.onload = () => {
                              clearTimeout(timeoutId);
                              console.log('✅ PDF iframe cargado exitosamente');
                              setLoading(false);
                              setError(null);
                            };
                            
                            iframe.onerror = () => {
                              clearTimeout(timeoutId);
                              console.log('❌ Error en iframe, mostrando controles alternativos');
                              setError('El navegador bloqueó la visualización del PDF. Usa los botones de abajo.');
                              setLoading(false);
                            };
                          }
                        }}
                      />

                      {/* Loading state */}
                      {loading && (
                        <div className="flex items-center justify-center h-full bg-gray-50">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
                            <p className="text-gray-600">Cargando PDF...</p>
                            <p className="text-xs text-gray-500 mt-2">Si no carga, usa el botón &quot;Ver PDF&quot;</p>
                          </div>
                        </div>
                      )}

                      {/* Error state con instrucciones claras */}
                      {error && (
                        <div className="flex items-center justify-center h-full bg-gray-50">
                          <div className="text-center p-8">
                            <div className="text-6xl mb-4">📄</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">PDF Disponible</h3>
                            <p className="text-gray-600 mb-6">
                              {error}
                            </p>
                            <div className="space-y-3">
                              <button
                                onClick={() => window.open(optimizedUrl, '_blank')}
                                className="w-full inline-flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                🔗 Abrir en Nueva Pestaña
                              </button>
                              <button
                                onClick={handleDownload}
                                className="w-full inline-flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                              >
                                📥 Descargar PDF
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Botones siempre disponibles */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex justify-center space-x-3 flex-wrap gap-2">
                        <a
                          href={optimizedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                        >
                          🔗 Nueva pestaña
                        </a>
                        <button
                          onClick={handleDownload}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-green-600 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
                        >
                          📥 Descargar
                        </button>
                        <button
                          onClick={() => {
                            console.log('🔄 Reloading PDF...');
                            setLoading(true);
                            setError(null);
                            // Force iframe reload
                            setTimeout(() => setLoading(false), 3000);
                          }}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-purple-600 bg-purple-100 rounded-md hover:bg-purple-200 transition-colors"
                        >
                          🔄 Reintentar
                        </button>
                        {detectedFileType === 'pdf' && (
                          <button
                            onClick={() => {
                              console.log('🔄 Switching to image view for PDF');
                              setForceImageView(true);
                              setLoading(true);
                              setError(null);
                            }}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-orange-600 bg-orange-100 rounded-md hover:bg-orange-200 transition-colors"
                          >
                            🖼️ Ver como imagen
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 text-center bg-gray-50 p-3 rounded-lg">
                      💡 <strong>¿No se ve el PDF?</strong> Algunos navegadores bloquean PDFs por seguridad. 
                      Prueba abrirlo en nueva pestaña, descargarlo, o verlo como imagen.
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
