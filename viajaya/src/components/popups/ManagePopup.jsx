import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { postPopup, putPopup, getPopup } from '../../redux/actions/actions';

const ManagePopup = ({ existingPopup }) => {
  const [content, setContent] = useState(existingPopup ? existingPopup.content : '');
  const [isActive, setIsActive] = useState(existingPopup ? existingPopup.isActive : false);
  const dispatch = useDispatch();
  const { loading, popup, error } = useSelector((state) => state.popup); // Usar el estado del reducer

  // Si `existingPopup` está definido, usa los datos del popup para edición
  useEffect(() => {
    if (existingPopup) {
      dispatch(getPopup(existingPopup.id)); // Obtener popup si hay uno existente
    }
  }, [dispatch, existingPopup]);

  const handleSubmit = () => {
    const popupData = { content, isActive };

    if (existingPopup) {
      dispatch(putPopup(existingPopup.id, popupData)); // Actualizar popup existente
    } else {
      dispatch(postPopup(popupData)); // Crear nuevo popup
    }
  };

  return (
    <div className="popup-form">
      {loading && <p>Cargando...</p>} {/* Mostrar mensaje de carga */}
      {error && <p>Error: {error}</p>} {/* Mostrar errores si existen */}
      
      <textarea 
        value={content} 
        onChange={(e) => setContent(e.target.value)} 
        placeholder="Enter popup content here"
      />
      <label>
        <input
          type="checkbox"
          checked={isActive}
          onChange={() => setIsActive(!isActive)}
        />
        Active
      </label>
      <button onClick={handleSubmit}>
        {existingPopup ? 'Actualizar Popup' : 'Crear Popup'}
      </button>
    </div>
  );
};

export default ManagePopup;
