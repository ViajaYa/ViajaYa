// eslint-disable-next-line no-unused-vars
import React from "react";
import "./Destinos.css";
import PropTypes from "prop-types";
import destinacionales from '../../../assets/flipcard/destinacionales.jpg';
import lamacarena from '../../../assets/flipcard/lamacarena.jpg';
import europoa from '../../../assets/flipcard/europoa.jpg';
import portierra from '../../../assets/flipcard/portierra.jpg';

const FlipCard = ({ link, backTitle, backSteps, backHighlight, frontColor, backColor, frontImage }) => {
  return (
    <a href={link} className="group perspective my-4 mb-0 no-underline">
      <div className="flip-card relative w-70 h-160 md:w-80 md:h-180 rounded-lg shadow-lg transition-transform duration-500 preserve-3d">
        <div
          className={`flip-card-front absolute rounded-lg text-white flex flex-col items-center justify-center ${frontColor}`}
          style={{ backgroundImage: `url(${frontImage})`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
        >
          {/* Imagen de fondo sin textos ni iconos */}
        </div>
        <div
          className={`flip-card-back absolute w-full h-full rounded-lg text-white flex flex-col items-center justify-center p-6 ${backColor}`}
        >
          <h2 className="text-3xl font-bold mb-4">{backTitle}</h2>
          <ul className="text-center mb-4">
            {backSteps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ul>
          <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-nunito font-bold text-gray-800 mb-3">{backHighlight}</h3>
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
    <div className="flex flex-col items-center md:flex-row justify-around w-full h-full">
      <FlipCard
        link="https://periodico.unal.edu.co/uploads/UN_Periodico_Digital/Imagenes/2021/04-Abril/0408/pm/01-LLanos_cc0.jpg"  // Enlace a la página correspondiente
        backSteps={[]}
        backHighlight="Embrujo llanero"
        backColor="bg-ColorMorado"
        frontImage={lamacarena}
      />
      <FlipCard
        link="https://drive.google.com/file/d/14yE4CEhINubE6cHk3uRywct6nFJUzdH-/view?usp=drive_link"
        backSteps={[]}
        backHighlight="Amanecer llanero"
        backColor="bg-ColorMorado"
        frontImage={portierra}
      />
      <FlipCard
        link="https://drive.google.com/file/d/1-hSjK9145gJQ59W-NgTTyX3-qNyMZoxI/view"
        backSteps={[]}
        backHighlight="Pie de monte llanero"
        backColor="bg-ColorMorado"
        frontImage={europoa}
      />
     
    </div>
  );
};

export default Destinos;

