import React, { useState } from "react";
import "./Destinos.css";
import PropTypes from "prop-types";
import llanero from '../../../assets/llanero.jpg';
import llano from '../../../assets/llano.jpg';
import atardecer from '../../../assets/atardecer.jpg';
import logo from '../../../assets/mascota.png'

const FlipCard = ({ link, backTitle, backSteps, backHighlight, frontColor, backColor, frontImage }) => {
  const [flipped, setFlipped] = useState(false);

  const handleMouseEnter = () => setFlipped(true);
  const handleMouseLeave = () => setFlipped(false); // Vuelve a girar a 0° al salir el cursor

  return (
    <a href={link} className="group flip-card relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <div className={`flip-card-inner ${flipped ? "flipped" : ""} relative rounded-lg shadow-lg transition-transform duration-800`}>
        <div
          className={`flip-card-front ${frontColor}`}
          style={{ backgroundImage: `url(${frontImage})` }}
        >
          {/* Imagen de fondo sin textos ni iconos */}
        </div>
        <div className={`flip-card-back ${backColor}`}>
          <h2 className="text-3xl font-bold mb-4">{backTitle}</h2>
          <ul className="text-center mb-4">
            {backSteps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ul>
          <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-nunito font-bold text-gray-800 mb-3">{backHighlight}</h3>
          <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer">
            <i className="fab fa-youtube text-red-600 text-3xl"></i>
          </a>
        </div>
      </div>
    </a>
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
};

const Destinos = () => {
  return (
    <div className="relative cursor-custom">
    
        <img
    src={logo}
    alt="Logo"
    className="w-20 h-20 ml-4 mt-4" // Ajusta el tamaño del logo y agrega un margen a la derecha
  />
<div className="flex items-center  mt-0 justify-center bg-ColorAzul pt-2 ">

  <h1 className="font-nunito text-gray-700 font-bold text-2xl p-4 ">
  ENAMORATE DE LA REGION DE LOS LLANOS ORIENTALES
  </h1>
</div>



      <div className="flip-card-container mt-12"> {/* Ajusta este margen según la altura del título */}
        <FlipCard
          link="https://www.instagram.com/viajaya_pagina_oficial/"
          backSteps={[]}
          backHighlight="VER TOUR"
          backColor="bg-slate-200"
          frontImage={llanero}
        />
        <FlipCard
          link="https://www.instagram.com/viajaya_pagina_oficial/"
          backSteps={[]}
          backHighlight="VER TOUR"
          backColor="bg-slate-200"
          frontImage={atardecer}
        />
        <FlipCard
          link="https://www.instagram.com/viajaya_pagina_oficial/"
          backSteps={[]}
          backHighlight="VER TOUR"
          backColor="bg-slate-200"
          frontImage={llano}
        />
      </div>
    </div>
  );
};

export default Destinos;




