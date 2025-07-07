import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalculator, faPlane, faStar, faGift, faHeart } from '@fortawesome/free-solid-svg-icons';
import './FloatingQuoteButton.css';

const FloatingQuoteButton = ({ onOpenQuote }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPulsing, setIsPulsing] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      // Mostrar el botón después de hacer scroll 100px
      const scrolled = window.scrollY;
      setIsVisible(scrolled > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Pulsar cada 3 segundos para llamar la atención
    const interval = setInterval(() => {
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 1000);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed z-50 floating-quote-button-container">
      {/* Ondas de expansión */}
      <div className="absolute inset-0 rounded-full">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 opacity-30 animate-ping"></div>
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 opacity-20 animate-ping" style={{animationDelay: '300ms'}}></div>
      </div>

      {/* Botón principal */}
      <div 
        className={`relative group cursor-pointer transition-all duration-500 ${
          isHovered ? 'scale-110' : isPulsing ? 'scale-105' : 'scale-100'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onOpenQuote}
      >
        {/* Efecto de resplandor dinámico */}
        <div className={`absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 rounded-full blur-xl transition-all duration-500 ${
          isHovered ? 'opacity-100 scale-110' : isPulsing ? 'opacity-80 scale-105' : 'opacity-60'
        }`}></div>
        
        {/* Botón principal con gradiente animado */}
        <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white rounded-full p-5 shadow-2xl transform transition-all duration-500 hover:shadow-purple-500/50">
          <div className="flex items-center space-x-3">
            <FontAwesomeIcon 
              icon={faCalculator} 
              className={`text-xl transition-transform duration-300 ${
                isHovered ? 'rotate-12 scale-110' : isPulsing ? 'animate-bounce' : ''
              }`}
            />
            <div className="flex flex-col">
              <span className="font-bold text-sm whitespace-nowrap">
                Cotización
              </span>
              <span className="font-bold text-xs text-yellow-300 animate-pulse">
                ¡GRATIS!
              </span>
            </div>
            <FontAwesomeIcon 
              icon={faStar} 
              className="text-sm text-yellow-300 animate-spin" 
            />
          </div>
        </div>

        {/* Badge de "GRATIS" */}
        

        {/* Indicador de avión */}
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs rounded-full w-8 h-8 flex items-center justify-center animate-pulse shadow-lg">
          <FontAwesomeIcon icon={faPlane} className="text-sm animate-bounce" />
        </div>

        {/* Tooltip mejorado */}
        <div className={`absolute bottom-full right-0 mb-4 transition-all duration-300 ${
          isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}>
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white text-sm rounded-xl py-3 px-4 shadow-2xl max-w-xs">
            <div className="flex items-center space-x-2 mb-1">
              <FontAwesomeIcon icon={faHeart} className="text-red-400 animate-pulse" />
              <span className="font-bold text-yellow-300">¡Viaja con nosotros!</span>
            </div>
            <div className="text-xs text-gray-300">
              ✈️ Cotización personalizada<br/>
            
              ⚡ Respuesta inmediata
            </div>
            <div className="absolute top-full right-6 w-0 h-0 border-l-4 border-r-4 border-t-8 border-transparent border-t-gray-800"></div>
          </div>
        </div>
      </div>

      {/* Partículas flotantes */}
      {isHovered && (
        <>
          <div className="absolute top-0 left-0 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
          <div className="absolute top-2 right-0 w-1 h-1 bg-pink-400 rounded-full animate-pulse"></div>
          <div className="absolute bottom-2 left-2 w-1 h-1 bg-purple-400 rounded-full animate-bounce"></div>
        </>
      )}

      {/* Mensaje promocional emergente */}
   
    </div>
  );
};

export default FloatingQuoteButton;
