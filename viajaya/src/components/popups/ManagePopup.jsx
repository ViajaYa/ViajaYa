import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { postPopup, putPopup, getAllPopups } from '../../redux/actions/actions';
import NavBar from '../layout/NavBar/NavBar';

const ManagePopup = () => {
  const dispatch = useDispatch();
  const loading = useSelector((state) => state.loading);
  const  error  = useSelector((state) => state.error);
  const popup = useSelector((state) => state.popups);
  console.log(popup)

  const [content, setContent] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // Cargar el popup existente al cargar el componente
  useEffect(() => {
    dispatch(getAllPopups()); // Despacha la acción al montar el componente
  }, [dispatch]);

  // Rellenar los campos cuando haya un popup en el estado
  useEffect(() => {
    if (popup && popup.id) {
      setContent(popup.content);
      setIsActive(popup.isActive);
      setIsEditing(true); // Establecer modo de edición si existe un popup
    } else {
      // Resetear si no hay popup
      setContent('');
      setIsActive(false);
      setIsEditing(false);
    }
  }, [popup]);

  // Desaparecer el mensaje de éxito después de 3 segundos
  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => setAlertMessage(''), 3000);
      return () => clearTimeout(timer); // Limpiar el timeout cuando el componente se desmonte o cambie
    }
  }, [alertMessage]);
  const handleSubmit = () => {
    const popupData = { content, isActive };

    // Check if in edit mode and we have an id to update
    if (isEditing && popup?.id) {
        // Confirm with the user before updating
        const confirmUpdate = window.confirm('¿Estás seguro de que deseas actualizar este popup?');
        if (confirmUpdate) {
            // Verificar que el id no sea undefined
            if (popup.id !== undefined) {
                console.log('Dispatching PUT with id:', popup.id);
                dispatch(putPopup(popup.id, popupData));
                setAlertMessage('Popup actualizado exitosamente!');
            } else {
                console.error('ID del popup es undefined');
            }
        }
    } else {
        // Otherwise, create a new popup
        dispatch(postPopup(popupData));
        setAlertMessage('Popup creado exitosamente!');
    }
};

  return (
    <div className="mb-64 pt-20 p-8">
      {/* NavBar fija */}
      <div className="fixed top-0 left-0 z-50 w-full">
        <NavBar />
      </div>

      {/* Mensajes de carga y error */}
      {loading && <p className="text-center text-gray-500">Cargando...</p>}
      {error && <p className="text-center text-red-500">Error: {error}</p>}

      {/* Alert de éxito (desaparece en 3 segundos) */}
      {alertMessage && (
        <div className="p-2 mb-4 text-green-700 bg-green-200 rounded-md">
          {alertMessage}
        </div>
      )}

      {/* Mostrar los detalles del popup existente */}
      {popup && popup.id ? (
        <div className="mb-6 mt-10">
          <h1 className="bg-ColorMorado text-2xl text-center font-bold font-nunito p-2 text-gray-200 mb-8">
            Popup Existente
          </h1>
          <textarea
            className="w-full p-2 border border-gray-300 rounded-md mb-2 font-nunito"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ingresa el contenido del popup"
          />
          <label className="flex items-center mb-4 font-nunito">
            <input
              type="checkbox"
              checked={isActive}
              onChange={() => setIsActive(!isActive)}
              className="mr-2"
            />
            <span>Activo</span>
          </label>
          <button
            onClick={handleSubmit}
            className="bg-ColorAzul hover:bg-blue-300 text-gray-600 font-bold font-nunito py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={loading} // Deshabilitar botón si está cargando
          >
            {isEditing ? 'Actualizar Popup' : 'Crear Popup'}
          </button>
        </div>
      ) : (
        // Mostrar formulario para crear un nuevo popup
        <div className="mt-10">
          <h3 className="text-xl font-semibold mb-2">Crear Nuevo Popup</h3>
          <textarea
            className="w-full p-2 border border-gray-300 rounded-md mb-2"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ingresa el contenido del nuevo popup"
          />
          <label className="flex items-center mb-4">
            <input
              type="checkbox"
              checked={isActive}
              onChange={() => setIsActive(!isActive)}
              className="mr-2"
            />
            <span>Activo</span>
          </label>
          <button
            onClick={handleSubmit}
            className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition duration-200"
            disabled={loading} // Deshabilitar botón si está cargando
          >
            Crear Popup
          </button>
        </div>
      )}

      {/* Mostrar Popup siempre que esté activo */}
      {popup && popup.isActive && (
        <div className="mt-10 p-4 border border-green-400 bg-green-100 rounded-md">
          <h2 className="text-lg font-bold">Popup Activo:</h2>
          <p>{popup.content}</p>
          <p className={popup.isActive ? 'text-green-500' : 'text-red-500'}>
            {popup.isActive ? 'Activo' : 'Inactivo'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ManagePopup;












