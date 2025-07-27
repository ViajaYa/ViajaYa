// filepath: c:\Users\merce\Desktop\desarrollo\ViajaYa\viajaya\src\components\pages\PassengerSuccess.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const SignatureSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center max-w-md w-full">
        <div className="text-green-500 text-6xl mb-4">✅</div>
        
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          ¡Contrato Firmado!
        </h1>
        
        <p className="text-gray-600 mb-6">
          Estamos más cerca de un viaje INOLVIDABLE.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Ir al Inicio
          </button>
          
          <p className="text-xs text-gray-500">
            Si tiene alguna consulta, no dude en contactarnos
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignatureSuccess;