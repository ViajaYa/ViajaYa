// Destinos.jsx
import React from "react";
import "./Destinos.css";
import PropTypes from "prop-types";
import llanero from '../../../assets/llanero.jpg';
import llano from '../../../assets/llano.jpg';
import atardecer from '../../../assets/atardecer.jpg';

const FlipCard = ({ link, backTitle, backSteps, backHighlight, frontColor, backColor, frontImage }) => {
  return (
    <a href={link} className="group flip-card relative">
      <div className={`flip-card relative rounded-lg shadow-lg transition-transform duration-800`}>
        <div
          className={`flip-card-front ${frontColor}`}
          style={{ backgroundImage: `url(${frontImage})` }}
        >
          {/* Imagen de fondo sin textos ni iconos */}
        </div>
        <div
          className={`flip-card-back ${backColor}`}
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
    <div className="flip-card-container">
      <FlipCard
        link="https://periodico.unal.edu.co/uploads/UN_Periodico_Digital/Imagenes/2021/04-Abril/0408/pm/01-LLanos_cc0.jpg"
        backSteps={[]}
        backHighlight="Embrujo llanero"
        backColor="bg-slate-200"
        frontImage={llanero}
      />
      <FlipCard
        link="https://drive.google.com/file/d/14yE4CEhINubE6cHk3uRywct6nFJUzdH-/view?usp=drive_link"
        backSteps={[]}
        backHighlight="Amanecer llanero"
        backColor="bg-slate-200"
        frontImage={atardecer}
      />
      <FlipCard
        link="https://drive.google.com/file/d/1-hSjK9145gJQ59W-NgTTyX3-qNyMZoxI/view"
        backSteps={[]}
        backHighlight="Pie de monte llanero"
        backColor="bg-slate-200"
        frontImage={llano}
      />
    </div>
  );
};

export default Destinos;


