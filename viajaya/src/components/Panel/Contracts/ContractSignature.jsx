import React, { useState, useRef, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import SignatureCanvas from 'react-signature-canvas';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileContract,
  faPen,
  faTrash,
  faCheck,
  faSpinner,
  faDownload,
  faEye
} from '@fortawesome/free-solid-svg-icons';
import {
  fetchContractById,
  signContract,
  selectCurrentContract,
  selectContractLoading
} from '../../../redux/slices/contractSlice';

const ContractSignature = () => {
  const { contractId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const contract = useSelector(selectCurrentContract);
  const loading = useSelector(selectContractLoading);
  
  const signatureRef = useRef();
  const [signature, setSignature] = useState(null);
  const [signerInfo, setSignerInfo] = useState({
    nombre: '',
    documento: '',
    email: '',
    acepta_terminos: false
  });
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState(null);

  const token = searchParams.get('token');

  useEffect(() => {
    if (contractId) {
      dispatch(fetchContractById(contractId));
    }
  }, [dispatch, contractId]);

  useEffect(() => {
  // Buscar pasajero titular en el contrato
  const titular = contract?.contract?.Quote?.Passengers?.find(p => p.titular);
  if (titular) {
    setSignerInfo(prev => ({
      ...prev,
      nombre: `${titular.nombre} ${titular.apellido}`,
      documento: titular.documento_identidad,
      email: contract.contract.Cliente?.email || '',
      tipo_documento: titular.tipo_documento || '',
    }));
  }
}, [contract]);

  const handleClearSignature = () => {
    signatureRef.current.clear();
    setSignature(null);
  };

  const handleSaveSignature = () => {
    if (signatureRef.current.isEmpty()) {
      alert('⚠️ Por favor, firme en el área designada');
      return;
    }
    
    const signatureData = signatureRef.current.toDataURL();
    setSignature(signatureData);
  };

  const handleSignContract = async () => {
    // Validaciones
    if (!signature) {
      setError('Debe firmar antes de continuar');
      return;
    }

    if (!signerInfo.nombre || !signerInfo.documento || !signerInfo.email) {
      setError('Todos los campos son obligatorios');
      return;
    }

    if (!signerInfo.acepta_terminos) {
      setError('Debe aceptar los términos y condiciones');
      return;
    }

    setSigning(true);
    setError(null);

    try {
      const signatureData = {
        signature: signature,
        signer_info: signerInfo,
        signed_at: new Date().toISOString(),
        signature_token: token,
        ip_address: await fetch('https://api.ipify.org?format=json')
          .then(r => r.json())
          .then(data => data.ip)
          .catch(() => 'unknown')
      };

      const result = await dispatch(signContract({
        contractId,
        signatureData
      })).unwrap();

      // Redirigir directamente a página de confirmación (sin alert)
      navigate(`/signature-success/${contractId}`, { 
        state: { success: true, contract: result } 
      });

    } catch (error) {
      console.error('Error firmando contrato:', error);
      setError(error.message || 'Error al firmar el contrato');
    } finally {
      setSigning(false);
    }
  };

  const handleViewContract = () => {
    const pdfUrl = `${import.meta.env.VITE_API_URL}/contracts/pdf/${contractId}`;
    window.open(pdfUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FontAwesomeIcon icon={faSpinner} spin size="3x" className="text-blue-500 mb-4" />
          <p className="text-gray-600">Cargando contrato...</p>
        </div>
      </div>
    );
  }

  if (!contract?.contract) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FontAwesomeIcon icon={faFileContract} size="3x" className="text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Contrato no encontrado</h1>
          <p className="text-gray-600">El contrato solicitado no existe o ha expirado.</p>
        </div>
      </div>
    );
  }

  const contractData = contract.contract;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                <FontAwesomeIcon icon={faFileContract} className="mr-3 text-blue-600" />
                Firma Digital de Contrato
              </h1>
              <p className="text-gray-600">
                Contrato: <span className="font-semibold">{contractData.contract_number}</span>
              </p>
            </div>
            <button
              onClick={handleViewContract}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              <FontAwesomeIcon icon={faEye} className="mr-2" />
              Ver Contrato
            </button>
          </div>
        </div>

        {/* Información del Contrato */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">📋 Información del Contrato</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p><strong>Destino:</strong> {contractData.Quote?.destino}</p>
              <p><strong>Origen:</strong> {contractData.Quote?.origen}</p>
              <p><strong>Fecha de viaje:</strong> {new Date(contractData.fecha_inicio_viaje).toLocaleDateString('es-ES')} - {new Date(contractData.fecha_fin_viaje).toLocaleDateString('es-ES')}</p>
            </div>
            <div>
              <p><strong>Pasajeros:</strong> {contractData.numero_pasajeros}</p>
              <p><strong>Valor total:</strong> ${parseFloat(contractData.precio_total).toLocaleString('es-CO')}</p>
              <p><strong>Forma de pago:</strong> {contractData.forma_pago === 'cuotas' ? 'Cuotas' : 'Contado'}</p>
            </div>
          </div>
        </div>

        {/* Información del Firmante */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">👤 Información del Firmante</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo *
              </label>
              <input
                type="text"
                value={signerInfo.nombre}
                 readOnly
                onChange={(e) => setSignerInfo({...signerInfo, nombre: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Documento de identidad *
              </label>
              <input
                type="text"
                value={signerInfo.documento}
                 readOnly
                onChange={(e) => setSignerInfo({...signerInfo, documento: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={signerInfo.email}
                 readOnly
                onChange={(e) => setSignerInfo({...signerInfo, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
          </div>
        </div>

        {/* Área de Firma */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">
            <FontAwesomeIcon icon={faPen} className="mr-2 text-blue-600" />
            Firma Digital
          </h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4">
            <p className="text-center text-gray-600 mb-3">
              Firme en el área de abajo usando su mouse, dedo o stylus
            </p>
            
            <div className="flex justify-center mb-4">
              <div className="border-2 border-gray-400 rounded">
                <SignatureCanvas
                  ref={signatureRef}
                  canvasProps={{
                    width: 500,
                    height: 200,
                    className: 'signature-canvas bg-white'
                  }}
                  backgroundColor="#ffffff"
                />
              </div>
            </div>
            
            <div className="flex justify-center gap-4">
              <button
                onClick={handleClearSignature}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                <FontAwesomeIcon icon={faTrash} className="mr-2" />
                Limpiar
              </button>
              <button
                onClick={handleSaveSignature}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                <FontAwesomeIcon icon={faCheck} className="mr-2" />
                Guardar Firma
              </button>
            </div>
          </div>

          {signature && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800 text-center">✅ Firma guardada correctamente</p>
            </div>
          )}
        </div>

        {/* Términos y Condiciones */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-start">
            <input
              type="checkbox"
              id="acepta_terminos"
              checked={signerInfo.acepta_terminos}
              onChange={(e) => setSignerInfo({...signerInfo, acepta_terminos: e.target.checked})}
              className="mt-1 mr-3"
            />
            <label htmlFor="acepta_terminos" className="text-sm text-gray-700">
              Acepto los términos y condiciones del contrato, confirmo que he leído y entendido 
              completamente el contenido del mismo, y autorizo a ViajaYa para procesar mis datos 
              personales según la política de privacidad.
            </label>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">❌ {error}</p>
          </div>
        )}

        {/* Botón de Firma */}
        <div className="text-center">
          <button
            onClick={handleSignContract}
            disabled={signing || !signature || !signerInfo.acepta_terminos}
            className={`px-8 py-3 rounded-lg font-bold text-lg transition-all ${
              signing || !signature || !signerInfo.acepta_terminos
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
            }`}
          >
            {signing ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                Firmando Contrato...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faCheck} className="mr-2" />
                Firmar Contrato Digitalmente
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContractSignature;