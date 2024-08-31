/* eslint-disable react/prop-types */
// eslint-disable-next-line no-unused-vars
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { putPopup } from '../../redux/actions/actions';

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
      <div className="relative bg-fondoPopup text-gray-600 p-8 rounded-lg shadow-lg w-11/12 sm:w-3/5 md:w-2/5 lg:w-1/3 h-auto ">
        {/* Botón de cierre */}
        <button 
          onClick={handleClose} 
          className="absolute top-2 right-2 text-gray-100 hover:text-gray-800 focus:outline-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl  text-gray-100  mb-4 ml-28">SORTEO VIAJA YA</h2>
        <p className="text-3xl text-gray-100 mb-6 ml-12">{content}</p>
        
        <div className="mb-8 mt-12 flex justify-center space-x-4">
          
          <button 
            onClick={() => window.location.href = "/rifa"} 
            className="bg-yellow-300 text-gray-500 px-4 py-2 rounded-md hover:bgpink-600"
          >
            PARTICIPA
          </button>
        </div>
      </div>
    </div>
  );
};

export default Popup;



