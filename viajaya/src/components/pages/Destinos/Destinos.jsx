import React, { useState } from "react";
import "./Destinos.css";
import PropTypes from "prop-types";
import { FaYoutube, FaExternalLinkAlt } from 'react-icons/fa';
import llanero from '../../../assets/llanero.jpg';
import llano from '../../../assets/llano.jpg';
import atardecer from '../../../assets/atardecer.jpg';
import logo from '../../../assets/mascota.png'

const FlipCard = ({ 
  link, 
  backTitle, 
  backSteps, 
  backHighlight, 
  frontColor, 
  backColor, 
  frontImage,
  youtubeLink = "https://www.youtube.com" // ✅ Prop adicional para YouTube
}) => {
  const [flipped, setFlipped] = useState(false);

  const handleMouseEnter = () => setFlipped(true);
  const handleMouseLeave = () => setFlipped(false);

  return (
    <div 
      className="group flip-card" 
      onMouseEnter={handleMouseEnter} 
      onMouseLeave={handleMouseLeave}
    >
      <div className={`flip-card-inner ${flipped ? "flipped" : ""} flex flex-col space-y-4 rounded-lg shadow-lg transition-transform duration-800 md:flex-row md:space-y-2 md:space-x-2`}>
        <div
          className={`flip-card-front ${frontColor}`}
          style={{ 
            backgroundImage: `url(${frontImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {/* Imagen de fondo sin textos ni iconos */}
        </div>
        <div className={`flip-card-back ${backColor} p-6 flex flex-col justify-center items-center text-center`}>
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-800">{backTitle}</h2>
          
          {backSteps.length > 0 && (
            <ul className="text-gray-600 mb-4 space-y-1">
              {backSteps.map((step, index) => (
                <li key={index} className="text-sm md:text-base">✓ {step}</li>
              ))}
            </ul>
          )}
          
          <h3 className="text-lg sm:text-xl md:text-2xl font-nunito font-bold text-ColorAzul mb-4">
            {backHighlight}
          </h3>
          
          <div className="flex gap-4 items-center">
            <a 
              href={youtubeLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-red-600 hover:text-red-700 transition-colors"
              aria-label="Ver video en YouTube"
            >
              <FaYoutube className="text-2xl md:text-3xl" />
            </a>
            
            <a 
              href={link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-ColorAzul text-white px-4 py-2 rounded-md hover:bg-ColorMorado transition-colors flex items-center gap-2"
            >
              <span>Ver más</span>
              <FaExternalLinkAlt className="text-sm" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

FlipCard.propTypes = {
  link: PropTypes.string.isRequired,
  backTitle: PropTypes.string.isRequired,
  backSteps: PropTypes.arrayOf(PropTypes.string).isRequired,
  backHighlight: PropTypes.string.isRequired,
  frontColor: PropTypes.string.isRequired,
  backColor: PropTypes.string.isRequired,
  frontImage: PropTypes.string.isRequired,
  youtubeLink: PropTypes.string,
};

const Destinos = () => {
  // ✅ Datos estructurados para las tarjetas
  const destinosData = [
    {
      link: "https://www.instagram.com/viajaya_pagina_oficial/",
      backTitle: "LLANOS ORIENTALES",
      backSteps: [
        "Paisajes únicos e infinitos",
        "Cultura llanera auténtica",
        "Aventura garantizada",
        "Experiencia inolvidable"
      ],
      backHighlight: "VER TOUR COMPLETO",
      frontColor: "bg-gradient-to-br from-green-400 to-green-600",
      backColor: "bg-gradient-to-br from-slate-100 to-slate-200",
      frontImage: llanero,
      youtubeLink: "https://www.youtube.com/watch?v=ejemplo1"
    },
    {
      link: "https://www.instagram.com/viajaya_pagina_oficial/",
      backTitle: "ATARDECERES MÁGICOS",
      backSteps: [
        "Fotografías espectaculares",
        "Momentos perfectos",
        "Colores únicos",
        "Experiencia romántica"
      ],
      backHighlight: "VER TOUR COMPLETO",
      frontColor: "bg-gradient-to-br from-orange-400 to-red-500",
      backColor: "bg-gradient-to-br from-slate-100 to-slate-200",
      frontImage: atardecer,
      youtubeLink: "https://www.youtube.com/watch?v=ejemplo2"
    },
    {
      link: "https://www.instagram.com/viajaya_pagina_oficial/",
      backTitle: "NATURALEZA SALVAJE",
      backSteps: [
        "Flora y fauna diversa",
        "Ecosistema único",
        "Aventura natural",
        "Contacto con la naturaleza"
      ],
      backHighlight: "VER TOUR COMPLETO",
      frontColor: "bg-gradient-to-br from-blue-400 to-blue-600",
      backColor: "bg-gradient-to-br from-slate-100 to-slate-200",
      frontImage: llano,
      youtubeLink: "https://www.youtube.com/watch?v=ejemplo3"
    }
  ];

  return (
    <div className="relative cursor-custom">
      <img
        src={logo}
        alt="Mascota ViajaYa"
        className="w-20 h-20 ml-4 mt-4"
        loading="lazy"
      />
      
      <div className="flex items-center mt-0 justify-center bg-ColorAzul pt-2">
        <h1 className="font-nunito text-gray-700 font-bold text-xl md:text-2xl p-4 text-center">
          ENAMÓRATE DE LA REGIÓN DE LOS LLANOS ORIENTALES
        </h1>
      </div>

      <div className="flip-card-container mt-12">
        {/* ✅ Mapear los datos para crear las tarjetas */}
        {destinosData.map((destino, index) => (
          <FlipCard
            key={index}
            {...destino} // ✅ Spread operator para pasar todas las props
          />
        ))}
      </div>
    </div>
  );
};

export default Destinos;