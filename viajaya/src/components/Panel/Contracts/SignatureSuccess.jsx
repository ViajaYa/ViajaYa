import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faHome, faFileContract, faDownload } from '@fortawesome/free-solid-svg-icons';

const SignatureSuccess = () => {
  const navigate = useNavigate();
  const { contractId } = useParams();
  const location = useLocation();
  
  // Obtener datos del contrato del state (si viene de la navegación)
  const contractData = location.state?.contract;

  const handleDownloadContract = () => {
    const pdfUrl = `${import.meta.env.VITE_API_URL}/contracts/pdf/${contractId}`;
    window.open(pdfUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg border p-8 text-center max-w-lg w-full">
        <div className="text-green-500 text-7xl mb-6">
          <FontAwesomeIcon icon={faCheckCircle} />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          ¡Contrato Firmado Exitosamente!
        </h1>
        
        <p className="text-gray-600 mb-2">
          Su firma digital ha sido registrada correctamente.
        </p>
        
        <p className="text-lg font-semibold text-blue-600 mb-8">
          ¡Estamos más cerca de un viaje INOLVIDABLE! ✈️
        </p>

        {/* Información del contrato */}
        {contractData && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
              <FontAwesomeIcon icon={faFileContract} className="mr-2 text-blue-500" />
              Detalles del Contrato
            </h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Número:</strong> {contractData.contract_number}</p>
              {contractData.Quote && (
                <>
                  <p><strong>Destino:</strong> {contractData.Quote.destino}</p>
                  <p><strong>Valor:</strong> ${parseFloat(contractData.precio_total).toLocaleString('es-CO')}</p>
                </>
              )}
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          {contractId && (
            <button
              onClick={handleDownloadContract}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center"
            >
              <FontAwesomeIcon icon={faDownload} className="mr-2" />
              Descargar Contrato Firmado
            </button>
          )}
          
          <button
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
          >
            <FontAwesomeIcon icon={faHome} className="mr-2" />
            Ir al Inicio
          </button>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>📧 Próximos pasos:</strong> Recibirá una copia del contrato firmado en su email. 
              Nuestro equipo se pondrá en contacto con usted para coordinar los detalles del viaje.
            </p>
          </div>
          
          <p className="text-xs text-gray-500 mt-4">
            Si tiene alguna consulta, no dude en contactarnos
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignatureSuccess;