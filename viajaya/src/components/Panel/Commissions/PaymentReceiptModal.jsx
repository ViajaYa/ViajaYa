import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes,
  faDownload,
  faMoneyBillWave,
  faCalendarAlt,
  faUser,
  faExpand,
  faCompress
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-hot-toast';
import PropTypes from 'prop-types';

const PaymentReceiptModal = ({ receipt, onClose }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!receipt) return null;

  const { url, commission, title, paidBy, paymentDate } = receipt;
  
  // Determinar tipo de archivo
  const isImage = url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPdf = url.match(/\.pdf$/i);

  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = `comprobante-${commission?.Contract?.contract_number || 'pago'}.${isImage ? 'jpg' : 'pdf'}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Descarga iniciada');
    } catch (error) {
      console.error('Error al descargar:', error);
      toast.error('Error al descargar el comprobante');
    }
  };

  const handleImageError = () => {
    setImageError(true);
    toast.error('Error al cargar la imagen');
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle ${
          isFullscreen 
            ? 'w-full h-full max-w-full max-h-full' 
            : 'w-full max-w-4xl'
        }`}>
          
          {/* Header */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FontAwesomeIcon icon={faMoneyBillWave} className="text-green-500 text-xl" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {title || 'Comprobante de Pago'}
                  </h3>
                  {commission && (
                    <p className="text-sm text-gray-600">
                      {commission.Contract?.contract_number} - {commission.Contract?.Quote?.nombre_cliente}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Botón pantalla completa */}
                {isImage && (
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title={isFullscreen ? 'Salir pantalla completa' : 'Pantalla completa'}
                  >
                    <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} />
                  </button>
                )}

                {/* Botón descargar */}
                <button
                  onClick={handleDownload}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Descargar comprobante"
                >
                  <FontAwesomeIcon icon={faDownload} />
                </button>

                {/* Botón cerrar */}
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Cerrar"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
            </div>

            {/* Info adicional */}
            {(paidBy || paymentDate) && (
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
                {paidBy && (
                  <div className="flex items-center space-x-1">
                    <FontAwesomeIcon icon={faUser} className="text-gray-400" />
                    <span>Pagado por: {paidBy.name} {paidBy.lastname}</span>
                  </div>
                )}
                {paymentDate && (
                  <div className="flex items-center space-x-1">
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400" />
                    <span>Fecha: {new Date(paymentDate).toLocaleDateString('es-CO')}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Content */}
          <div className={`${isFullscreen ? 'h-full' : 'max-h-96 md:max-h-[500px]'} overflow-auto`}>
            {isImage && (
              <div className="p-4 text-center bg-gray-50">
                {!imageLoaded && !imageError && (
                  <div className="py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                    <p className="text-gray-500 text-sm">Cargando imagen...</p>
                  </div>
                )}
                
                {imageError ? (
                  <div className="py-12">
                    <div className="text-red-500 mb-2">
                      <FontAwesomeIcon icon={faMoneyBillWave} className="text-4xl" />
                    </div>
                    <p className="text-red-600 mb-2">Error al cargar la imagen</p>
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Ver imagen original
                    </a>
                  </div>
                ) : (
                  <img
                    src={url}
                    alt="Comprobante de pago"
                    className={`${isFullscreen ? 'max-w-full max-h-full' : 'max-w-full h-auto'} mx-auto rounded-lg shadow-lg`}
                    onLoad={() => setImageLoaded(true)}
                    onError={handleImageError}
                    style={{ display: imageLoaded ? 'block' : 'none' }}
                  />
                )}
              </div>
            )}

            {isPdf && (
              <div className="h-96 md:h-[500px]">
                <iframe
                  src={url}
                  className="w-full h-full border-0"
                  title="Comprobante PDF"
                />
              </div>
            )}

            {!isImage && !isPdf && (
              <div className="p-8 text-center">
                <FontAwesomeIcon icon={faMoneyBillWave} className="text-4xl text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">Vista previa no disponible para este tipo de archivo</p>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FontAwesomeIcon icon={faDownload} />
                  <span>Descargar comprobante</span>
                </a>
              </div>
            )}
          </div>

          {/* Footer */}
          {!isFullscreen && (
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">
                  Comprobante almacenado de forma segura
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={handleDownload}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    <FontAwesomeIcon icon={faDownload} className="mr-2" />
                    Descargar
                  </button>
                  <button
                    onClick={onClose}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
PaymentReceiptModal.propTypes = {
  receipt: PropTypes.shape({
    url: PropTypes.string.isRequired,
    commission: PropTypes.shape({
      Contract: PropTypes.shape({
        contract_number: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        Quote: PropTypes.shape({
          nombre_cliente: PropTypes.string
        })
      })
    }),
    title: PropTypes.string,
    paidBy: PropTypes.shape({
      name: PropTypes.string,
      lastname: PropTypes.string
    }),
    paymentDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)])
  }),
  onClose: PropTypes.func.isRequired
};

export default PaymentReceiptModal;
