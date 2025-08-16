import { useState } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, faDownload, faExternalLinkAlt, faSpinner,
  faFilePdf, faFileImage
} from '@fortawesome/free-solid-svg-icons';
import { formatDateDisplay } from '../../../utils/dateUtils';

const ComprobanteViewerModal = ({ purchase, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  if (!purchase?.comprobante_url) return null;

  // ✅ DETERMINAR TIPO DE ARCHIVO Y OPTIMIZAR URL DE CLOUDINARY
  const getOptimizedUrl = (url) => {
    if (!url) return url;
    
    // Si es una URL de Cloudinary, optimizarla para visualización
    if (url.includes('cloudinary.com')) {
      // Detectar si es PDF o imagen basándose en múltiples factores
      const isPDFByType = purchase.tipo_comprobante?.toLowerCase() === 'pdf';
      const isPDFByUrl = url.toLowerCase().includes('.pdf');
      const isPDFByPath = url.includes('/raw/upload/'); // Los PDFs suelen estar en raw/upload
      
      // Si hay cualquier indicación de que es PDF, tratarlo como tal
      if (isPDFByType || isPDFByUrl || isPDFByPath) {
        // Para PDFs, usar raw/upload simple (sin parámetros complejos)
        let pdfUrl = url;
        if (url.includes('/image/upload/')) {
          pdfUrl = url.replace('/image/upload/', '/raw/upload/').replace('/f_auto,q_auto,w_800/', '/');
        } else if (url.includes('/video/upload/')) {
          pdfUrl = url.replace('/video/upload/', '/raw/upload/');
        }
        
        console.log('📄 PDF URL simplificada:', pdfUrl);
        return pdfUrl;
      } else {
        // Para imágenes confirmadas, optimizar para visualización web
        if (url.includes('/raw/upload/')) {
          return url.replace('/raw/upload/', '/image/upload/f_auto,q_auto,w_800/');
        } else if (url.includes('/video/upload/')) {
          return url.replace('/video/upload/', '/image/upload/f_auto,q_auto,w_800/');
        } else if (url.includes('/image/upload/') && !url.includes('f_auto,q_auto')) {
          // Si ya es image/upload pero sin optimización, agregarla
          return url.replace('/image/upload/', '/image/upload/f_auto,q_auto,w_800/');
        }
        return url; // Ya está optimizada o en formato correcto
      }
    }
    
    return url;
  };

  const optimizedUrl = getOptimizedUrl(purchase.comprobante_url);
  
  // ✅ MEJORAR DETECCIÓN DE TIPO DE ARCHIVO
  const detectFileType = (url, originalUrl) => {
    if (!url) return 'unknown';
    
    // 1. Verificar por tipo_comprobante del backend
    if (purchase.tipo_comprobante?.toLowerCase() === 'pdf') return 'pdf';
    
    // 2. Verificar por extensión en la URL
    const extension = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension)) return 'image';
    if (extension === 'pdf') return 'pdf';
    
    // 3. Verificar por path de Cloudinary
    if (url.includes('/raw/upload/') || originalUrl?.includes('/raw/upload/')) return 'pdf';
    
    // 4. Si no tiene extensión y está en Cloudinary, probablemente es PDF
    if (url.includes('cloudinary.com') && !url.includes('.')) return 'pdf';
    
    // 5. NUEVA: Si contiene 'comprobantes' en el path y no tiene extensión, asumir PDF
    if (url.includes('comprobantes') && !extension) return 'pdf';
    
    // 6. Default: si tiene optimización de imagen, es imagen
    if (url.includes('f_auto,q_auto')) return 'image';
    
    return 'unknown';
  };
  
  const fileType = detectFileType(optimizedUrl, purchase.comprobante_url);
  const isPDF = fileType === 'pdf';
  const isImage = fileType === 'image';

  // 🐛 DEBUG: Log para diagnosticar URLs
  console.log('🔍 ComprobanteViewerModal Debug:');
  console.log('🛒 Purchase:', purchase);
  console.log('🔗 Original URL:', purchase?.comprobante_url);
  console.log('🎯 Optimized URL:', optimizedUrl);
  console.log('📏 URL Length:', purchase?.comprobante_url?.length);
  console.log('🌐 URL Type:', typeof purchase?.comprobante_url);
  console.log('✅ URL Valid:', !!purchase?.comprobante_url && purchase?.comprobante_url.trim() !== '');
  console.log('� File Type Detection:', fileType);
  console.log('�📄 Is PDF:', isPDF);
  console.log('🖼️ Is Image:', isImage);
  console.log('🎨 Tipo Comprobante:', purchase?.tipo_comprobante);
  console.log('🔗 URL contains raw/upload:', purchase?.comprobante_url?.includes('/raw/upload/'));
  console.log('🔗 URL contains image/upload:', purchase?.comprobante_url?.includes('/image/upload/'));
  console.log('📎 URL extension:', purchase?.comprobante_url?.split('.').pop());

  // ✅ MANEJAR CARGA DE IMAGEN
  const handleImageLoad = () => setLoading(false);
  const handleImageError = () => {
    setError(true);
    setLoading(false);
  };

  // ✅ FORMATEAR FECHA CON LUXON
  const formatDate = (dateString) => {
    return formatDateDisplay(dateString, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full mx-4 flex flex-col">
        {/* ✅ HEADER */}
        <div className="bg-gray-800 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center">
            <FontAwesomeIcon 
              icon={isPDF ? faFilePdf : faFileImage} 
              className="mr-3 text-lg"
            />
            <div>
              <h2 className="text-xl font-semibold">Comprobante de Compra</h2>
              <p className="text-gray-300 text-sm">
                {purchase.proveedor} - ${parseFloat(purchase.costo || 0).toLocaleString('es-CO')}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* ✅ BOTÓN DESCARGAR */}
            <a
              href={purchase.comprobante_url}
              download
              className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              title="Descargar comprobante"
            >
              <FontAwesomeIcon icon={faDownload} />
            </a>
            
            {/* ✅ BOTÓN ABRIR EN NUEVA PESTAÑA */}
            <a
              href={optimizedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              title="Abrir en nueva pestaña"
            >
              <FontAwesomeIcon icon={faExternalLinkAlt} />
            </a>
            
            {/* ✅ BOTÓN CERRAR */}
            <button
              onClick={onClose}
              className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              title="Cerrar"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        </div>

        {/* ✅ INFORMACIÓN DE LA COMPRA */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Fecha de compra:</span>
              <p className="font-medium text-gray-900">{formatDate(purchase.fecha_compra)}</p>
            </div>
            <div>
              <span className="text-gray-600">Tipo comprobante:</span>
              <p className="font-medium text-gray-900 capitalize">
                {purchase.tipo_comprobante || 'factura'}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Moneda:</span>
              <p className="font-medium text-gray-900">{purchase.moneda || 'COP'}</p>
            </div>
            <div>
              <span className="text-gray-600">Estado pago:</span>
              <span className={`font-medium capitalize ${
                purchase.estado_pago === 'pagado' ? 'text-green-600' :
                purchase.estado_pago === 'pendiente' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {purchase.estado_pago}
              </span>
            </div>
          </div>
          
          {/* ✅ OBSERVACIONES */}
          {purchase.observaciones && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <span className="text-gray-600">Observaciones:</span>
              <p className="text-gray-900 mt-1">{purchase.observaciones}</p>
            </div>
          )}
        </div>

        {/* ✅ VISOR DEL COMPROBANTE */}
        <div className="flex-1 p-6 overflow-auto">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <FontAwesomeIcon icon={faSpinner} className="text-4xl text-gray-400 animate-spin mb-4" />
                <p className="text-gray-600">Cargando comprobante...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-6xl text-gray-300 mb-4">📄</div>
                <p className="text-gray-600 mb-4">No se pudo cargar el comprobante</p>
                <a
                  href={optimizedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FontAwesomeIcon icon={faExternalLinkAlt} className="mr-2" />
                  Abrir en nueva pestaña
                </a>
              </div>
            </div>
          )}

          {/* ✅ VISOR PARA IMÁGENES */}
          {isImage && !error && (
            <div className="flex justify-center">
              <img
                src={optimizedUrl}
                alt="Comprobante de compra"
                className={`max-w-full max-h-[600px] object-contain rounded-lg shadow-lg ${loading ? 'hidden' : 'block'}`}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            </div>
          )}

          {/* ✅ VISOR PARA PDFs - ENFOQUE SIMPLE */}
          {isPDF && !error && (
            <div className="space-y-4">
              <div className="w-full h-[600px] border rounded-lg overflow-hidden">
                <iframe
                  src={optimizedUrl}
                  className={`w-full h-full border-0 ${loading ? 'hidden' : 'block'}`}
                  title="Comprobante PDF"
                  onLoad={handleImageLoad}
                  onError={() => {
                    console.log('❌ Error cargando PDF en iframe');
                    setError(true);
                    setLoading(false);
                  }}
                />
                {loading && (
                  <div className="flex items-center justify-center h-full bg-gray-50">
                    <div className="text-center">
                      <FontAwesomeIcon icon={faSpinner} className="text-4xl text-gray-400 animate-spin mb-4" />
                      <p className="text-gray-600">Cargando PDF...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* OPCIONES PARA PDFs */}
              <div className="flex justify-center space-x-4 p-4 bg-blue-50 rounded-lg">
                <a
                  href={optimizedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FontAwesomeIcon icon={faExternalLinkAlt} className="mr-2" />
                  Abrir en nueva pestaña
                </a>
                
                <a
                  href={purchase.comprobante_url}
                  download={`comprobante_${Date.now()}.pdf`}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FontAwesomeIcon icon={faDownload} className="mr-2" />
                  Descargar PDF
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

ComprobanteViewerModal.propTypes = {
  purchase: PropTypes.shape({
    comprobante_url: PropTypes.string.isRequired,
    proveedor: PropTypes.string,
    costo: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    fecha_compra: PropTypes.string,
    tipo_comprobante: PropTypes.string,
    moneda: PropTypes.string,
    estado_pago: PropTypes.string,
    observaciones: PropTypes.string
  }).isRequired,
  onClose: PropTypes.func.isRequired
};

export default ComprobanteViewerModal;
