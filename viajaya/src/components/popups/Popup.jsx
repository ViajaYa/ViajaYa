/* eslint-disable react/prop-types */
// eslint-disable-next-line no-unused-vars
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { putPopup } from '../../redux/actions/actions';

// eslint-disable-next-line no-unused-vars
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
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-3/5">
        <h2 className="text-xl font-bold mb-4">Este es el Popup</h2>
        <p className="mb-4">{content}</p>
        <div className="flex justify-end space-x-4">
          <button 
            onClick={handleClose} 
            className="bg-red-500 text-white px-4 py-2 rounded-md"
          >
            Cerrar
          </button>
          <button 
            onClick={() => window.location.href = "/otro-componente"} 
            className="bg-blue-500 text-white px-4 py-2 rounded-md"
          >
            Ir a otro componente
          </button>
        </div>
      </div>
    </div>
  );
};

export default Popup;
