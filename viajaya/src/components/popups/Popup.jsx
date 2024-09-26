/* eslint-disable react/prop-types */
// eslint-disable-next-line no-unused-vars
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { putPopup } from '../../redux/actions/actions';
import logo from "../../assets/mascota.png"


const Popup = ({ id, content, isActive }) => {
  const [isVisible, setIsVisible] = useState(true);
  const dispatch = useDispatch();

  const handleClose = () => {
    setIsVisible(false);
    // Despacha una acción para actualizar el popup
    dispatch(putPopup(id, { content, isActive: false }));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-70 flex justify-center items-center z-50">
      <div className="relative bg-ColorAzul bg-opacity-80 text-gray-600 p-8 rounded-lg shadow-lg w-11/12 sm:w-3/4 md:w-2/3 lg:w-1/2 h-auto max-h-[80%] overflow-y-auto">
        
        {/* Botón de cierre */}
        <button 
          onClick={handleClose} 
          className="absolute top-2 right-2 text-gray-800 hover:text-gray-800 focus:outline-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Título del Popup */}
        <h2 className="text-4xl font-bold text-gray-700 mb-6 text-center">SORTEO VIAJA YA</h2>
        
        {/* Contenido del Popup */}
        <p className="text-3xl font-nunito text-gray-800 text-center mb-8">{content}</p>
        
        {/* Botón de Participación */}
        <div className="mb-8 mt-12 flex justify-center">
          <button 
            onClick={() => window.location.href = "/rifa"} 
            className="bg-yellow-300 text-gray-800 px-8 py-3 rounded-lg font-nunito hover:bg-yellow-400 transition-all duration-300"
          >
            PARTICIPA
          </button>
        </div>

        {/* Logo en la esquina inferior derecha */}
        <div className="absolute bottom-4 left-4 ">
          <img 
            src={logo} 
            alt="Logo" 
            className="h-36 w-auto"
          />
        </div>
      </div>
    </div>
  );
};

export default Popup;




