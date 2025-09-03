import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, 
  faSpinner, 
  faEnvelope, 
  faEye, 
  faEyeSlash,
  faPaperPlane,
  faExclamationTriangle 
} from '@fortawesome/free-solid-svg-icons';
import { 
  sendContractForSignature,
  previewContractEmail,
  clearEmailPreview,
  clearEmailPreviewError,
  selectEmailPreview,
  selectEmailPreviewLoading,
  selectEmailPreviewError
} from '../../../redux/slices/contractSlice';

const SendContractModal = ({ 
  isOpen, 
  onClose, 
  contract, 
  onSuccess 
}) => {
  const dispatch = useDispatch();
  
  // ✅ USAR: Selectores de Redux
  const emailPreview = useSelector(selectEmailPreview);
  const emailPreviewLoading = useSelector(selectEmailPreviewLoading);
  const emailPreviewError = useSelector(selectEmailPreviewError);
  
  // ✅ ESTADOS LOCALES
  const [customMessage, setCustomMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);

  // ✅ CARGAR PREVIEW cuando se abre el modal
  useEffect(() => {
    if (isOpen && contract?.id) {
      console.log('🔄 Cargando preview del email para contrato:', contract.id);
      dispatch(previewContractEmail(contract.id));
      setCustomMessage(''); // Limpiar mensaje personalizado
      setShowPreview(false); // Ocultar preview inicialmente
    }
  }, [dispatch, isOpen, contract?.id]);

  // ✅ LIMPIAR cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      dispatch(clearEmailPreview());
    }
  }, [dispatch, isOpen]);

  // ✅ ENVIAR CONTRATO
  const handleSend = async () => {
    if (!emailPreview?.to) {
      alert('❌ No se pudo obtener el email del cliente');
      return;
    }

    try {
      setSending(true);
      
      await dispatch(sendContractForSignature({
        contractId: contract.id,
        emailData: {
          email: emailPreview.to,
          subject: emailPreview.subject,
          customMessage: customMessage.trim() || undefined,
          includeContractPDF: true
        }
      })).unwrap();

      alert('✅ Contrato enviado exitosamente al cliente');
      onSuccess?.();
      onClose();
      
    } catch (error) {
      console.error('❌ Error enviando contrato:', error);
      alert(`❌ Error al enviar: ${error.message || error}`);
    } finally {
      setSending(false);
    }
  };

  // ✅ CERRAR MODAL con limpieza
  const handleClose = () => {
    setCustomMessage('');
    setShowPreview(false);
    dispatch(clearEmailPreview());
    onClose();
  };

  // ✅ Si no está abierto, no renderizar nada
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* ✅ HEADER */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <FontAwesomeIcon icon={faEnvelope} className="text-blue-500" />
              Enviar Contrato por Email
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <FontAwesomeIcon icon={faTimes} size="lg" />
            </button>
          </div>

          {/* ✅ ESTADO DE CARGA */}
          {emailPreviewLoading && (
            <div className="text-center py-12">
              <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-blue-500 mb-4" />
              <p className="text-gray-600">Cargando información del contrato...</p>
            </div>
          )}

          {/* ✅ ERROR AL CARGAR */}
          {emailPreviewError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-red-800">
                <FontAwesomeIcon icon={faExclamationTriangle} />
                <span className="font-medium">Error al cargar vista previa</span>
              </div>
              <p className="text-red-700 text-sm mt-1">{emailPreviewError}</p>
              <button
                onClick={() => {
                  dispatch(clearEmailPreviewError());
                  dispatch(previewContractEmail(contract.id));
                }}
                className="mt-2 px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200 transition-colors"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* ✅ CONTENIDO PRINCIPAL */}
          {emailPreview && !emailPreviewLoading && (
            <>
              {/* ✅ INFORMACIÓN DEL CONTRATO */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 mb-6 border-l-4 border-blue-400">
                <h4 className="font-semibold text-blue-900 mb-3">📋 Información del Contrato</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-blue-800">Número:</span>
                    <span className="ml-2 text-blue-900">{contract?.contract_number}</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Cliente:</span>
                    <span className="ml-2 text-blue-900">{emailPreview?.contractInfo?.cliente_name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Destino:</span>
                    <span className="ml-2 text-blue-900">{emailPreview?.contractInfo?.destino}</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Valor Total:</span>
                    <span className="ml-2 text-blue-900 font-semibold">
                      ${parseFloat(emailPreview?.contractInfo?.precio_total || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* ✅ FORMULARIO DE ENVÍO */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    📧 Email del destinatario
                  </label>
                  <input
                    type="email"
                    value={emailPreview.to || ''}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    📄 Asunto del email
                  </label>
                  <input
                    type="text"
                    value={emailPreview.subject || ''}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    💬 Mensaje personalizado (opcional)
                  </label>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={3}
                    placeholder="Agregue un mensaje personalizado que aparecerá al inicio del email..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Este mensaje aparecerá antes del contenido principal del email
                  </p>
                </div>

                {/* ✅ BOTÓN VISTA PREVIA */}
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">📎 Se adjuntará el contrato en PDF automáticamente</span>
                  </div>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={showPreview ? faEyeSlash : faEye} />
                    {showPreview ? 'Ocultar Vista Previa' : 'Ver Vista Previa'}
                  </button>
                </div>
              </div>

              {/* ✅ VISTA PREVIA DEL EMAIL */}
              {showPreview && (
                <div className="border rounded-lg mb-6 bg-gray-50">
                  <div className="p-3 border-b bg-gray-100 rounded-t-lg">
                    <h4 className="font-medium text-gray-900">📧 Vista Previa del Email</h4>
                  </div>
                  <div className="p-4 max-h-96 overflow-y-auto">
                    <div 
                      className="email-preview"
                      dangerouslySetInnerHTML={{ 
                        __html: customMessage ? `
                          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 15px; border-left: 4px solid #421261;">
                            <h4 style="color: #421261; margin: 0 0 8px 0;">💬 Mensaje Personalizado:</h4>
                            <p style="margin: 0; white-space: pre-line;">${customMessage}</p>
                          </div>
                          ${emailPreview.html}
                        ` : emailPreview.html
                      }}
                    />
                  </div>
                </div>
              )}

              {/* ✅ BOTONES DE ACCIÓN */}
              <div className="flex justify-end gap-3 pt-6 border-t">
                <button
                  onClick={handleClose}
                  disabled={sending}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                
                <button
                  onClick={handleSend}
                  disabled={sending || !emailPreview}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {sending ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faPaperPlane} />
                      Enviar Contrato
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SendContractModal;