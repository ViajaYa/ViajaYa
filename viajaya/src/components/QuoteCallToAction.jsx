import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalculator, faStar, faGift } from '@fortawesome/free-solid-svg-icons';

const QuoteCallToAction = ({ onOpenQuote, className = "" }) => {
  return (
    <div className={`bg-gradient-to-r from-purple-500 via-pink-600 to-purple-500 rounded-2xl p-8 text-white text-center shadow-2xl transform hover:scale-105 transition-all duration-300 ${className}`}>
      {/* Título principal */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2 animate-pulse">
          ¡Planifica tu viaje perfecto!
        </h2>
        <p className="text-lg opacity-90">
          Cotización personalizada y gratuita en minutos
        </p>
      </div>

      {/* Beneficios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="flex flex-col items-center p-4">
          <div className="bg-white bg-opacity-20 rounded-full p-3 mb-2">
            <FontAwesomeIcon icon={faGift} className="text-2xl text-yellow-300" />
          </div>
          <span className="font-semibold">100% Gratis</span>
          <span className="text-sm opacity-80">Sin costo alguno</span>
        </div>
        
        <div className="flex flex-col items-center p-4">
          <div className="bg-white bg-opacity-20 rounded-full p-3 mb-2">
            <FontAwesomeIcon icon={faStar} className="text-2xl text-yellow-300" />
          </div>
          <span className="font-semibold">Personalizada</span>
          <span className="text-sm opacity-80">Para tus necesidades</span>
        </div>
        
        <div className="flex flex-col items-center p-4">
          <div className="bg-white bg-opacity-20 rounded-full p-3 mb-2">
            <FontAwesomeIcon icon={faCalculator} className="text-2xl text-yellow-300" />
          </div>
          <span className="font-semibold">Rápida</span>
          <span className="text-sm opacity-80">En pocos minutos</span>
        </div>
      </div>

      {/* Botón principal */}
      <button
        onClick={onOpenQuote}
        className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-purple-900 font-bold py-4 px-8 rounded-full text-xl shadow-lg transform hover:scale-105 transition-all duration-300 animate-pulse"
      >
        <FontAwesomeIcon icon={faCalculator} className="mr-3" />
        ¡Solicitar Cotización Gratis!
        <FontAwesomeIcon icon={faStar} className="ml-3" />
      </button>

      {/* Texto promocional */}
      <p className="mt-4 text-sm opacity-75">
        🎯 Sin compromiso • ⚡ Respuesta inmediata • 🌟 Asesores expertos
      </p>
    </div>
  );
};

export default QuoteCallToAction;
