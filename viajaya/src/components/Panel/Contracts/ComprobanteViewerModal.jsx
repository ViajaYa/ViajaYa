import { useState } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, faDownload, faExternalLinkAlt, faSpinner,
  faFilePdf, faFileImage
} from '@fortawesome/free-solid-svg-icons';

const ComprobanteViewerModal = ({ purchase, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  if (!purchase?.comprobante_url) return null;

  // ✅ DETERMINAR TIPO DE ARCHIVO
  const isPDF = purchase.comprobante_url.toLowerCase().includes('.pdf') || 
                purchase.tipo_comprobante?.toLowerCase() === 'pdf';
  const isImage = !isPDF;

  // ✅ MANEJAR CARGA DE IMAGEN
  const handleImageLoad = () => setLoading(false);
  const handleImageError = () => {
    setError(true);
    setLoading(false);
  };

  // ✅ FORMATEAR FECHA
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CO', {
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
              href={purchase.comprobante_url}
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
                  href={purchase.comprobante_url}
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
                src={purchase.comprobante_url}
                alt="Comprobante de compra"
                className={`max-w-full max-h-[600px] object-contain rounded-lg shadow-lg ${loading ? 'hidden' : 'block'}`}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            </div>
          )}

          {/* ✅ VISOR PARA PDFs */}
          {isPDF && !error && (
            <div className="w-full h-[600px]">
              <iframe
                src={`${purchase.comprobante_url}#toolbar=1&view=FitH`}
                className={`w-full h-full rounded-lg shadow-lg ${loading ? 'hidden' : 'block'}`}
                title="Comprobante PDF"
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
              {loading && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FontAwesomeIcon icon={faSpinner} className="text-4xl text-gray-400 animate-spin mb-4" />
                    <p className="text-gray-600">Cargando PDF...</p>
                  </div>
                </div>
              )}
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
