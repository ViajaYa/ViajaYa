import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  generateReceiptPDF, 
  previewReceiptPDF, 
  selectGeneratingReceipt, 
  selectReceiptError 
} from '../../../../redux/slices/paymentSlice';
import PropTypes from 'prop-types';

const PaymentReceiptActions = ({ payment, showLabels = true, size = 'medium' }) => {
  const dispatch = useDispatch();
  const [actionInProgress, setActionInProgress] = useState(null);
  const generatingReceipt = useSelector(selectGeneratingReceipt);
  const receiptError = useSelector(selectReceiptError);

  const handleDownloadReceipt = async () => {
    try {
      setActionInProgress('download');
      await dispatch(generateReceiptPDF(payment.id)).unwrap();
      setActionInProgress(null);
    } catch (error) {
      console.error('Error descargando recibo:', error);
      setActionInProgress(null);
    }
  };

  const handlePreviewReceipt = async () => {
    try {
      setActionInProgress('preview');
      await dispatch(previewReceiptPDF(payment.id)).unwrap();
      setActionInProgress(null);
    } catch (error) {
      console.error('Error abriendo vista previa:', error);
      setActionInProgress(null);
    }
  };

  // Determinar clases CSS basadas en el tamaño
  const getButtonClasses = (variant = 'primary') => {
    let baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';
    
    // Tamaños
    if (size === 'small') {
      baseClasses += ' px-2 py-1 text-xs';
    } else if (size === 'medium') {
      baseClasses += ' px-3 py-2 text-sm';
    } else if (size === 'large') {
      baseClasses += ' px-4 py-2 text-base';
    }

    // Variantes de color
    if (variant === 'primary') {
      baseClasses += ' bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500';
    } else if (variant === 'secondary') {
      baseClasses += ' bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500';
    } else if (variant === 'success') {
      baseClasses += ' bg-green-600 hover:bg-green-700 text-white focus:ring-green-500';
    }

    return baseClasses;
  };

  const isLoading = generatingReceipt || actionInProgress;

  return (
    <div className="flex items-center space-x-2">
      {/* Botón de Vista Previa */}
      <button
        onClick={handlePreviewReceipt}
        disabled={isLoading}
        className={getButtonClasses('secondary')}
        title="Ver recibo en nueva pestaña"
      >
        {actionInProgress === 'preview' ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        ) : (
          <>
            <span className="mr-1">👁️</span>
            {showLabels && <span>Vista Previa</span>}
          </>
        )}
      </button>

      {/* Botón de Descarga */}
      <button
        onClick={handleDownloadReceipt}
        disabled={isLoading}
        className={getButtonClasses('primary')}
        title="Descargar recibo PDF"
      >
        {actionInProgress === 'download' ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        ) : (
          <>
            <span className="mr-1">📄</span>
            {showLabels && <span>Descargar Recibo</span>}
          </>
        )}
      </button>

      {/* Mostrar error si existe */}
      {receiptError && (
        <div className="text-red-600 text-xs">
          ⚠️ {receiptError}
        </div>
      )}
    </div>
  );
};

PaymentReceiptActions.propTypes = {
  payment: PropTypes.shape({
    id: PropTypes.string.isRequired,
    monto: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    status: PropTypes.string,
    referencia_pago: PropTypes.string
  }).isRequired,
  showLabels: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large'])
};

export default PaymentReceiptActions;
