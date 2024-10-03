import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { postPopup, putPopup, getAllPopups } from '../../redux/actions/actions';
import NavBar from '../layout/NavBar/NavBar';

const ManagePopup = () => {
  const dispatch = useDispatch();
  const loading = useSelector((state) => state.loading);
  const error = useSelector((state) => state.error);
  const popups = useSelector((state) => state.popups);
  console.log(popups);

  const [content, setContent] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [title, setTitle] = useState('');
  const [boton, setBoton] = useState('');
  const [selectedPopup, setSelectedPopup] = useState(null); // Estado para el popup seleccionado

  // Cargar todos los popups al cargar el componente
  useEffect(() => {
    dispatch(getAllPopups());
  }, [dispatch]);

  // Rellenar los campos cuando haya un popup seleccionado
  useEffect(() => {
    if (selectedPopup) {
      setContent(selectedPopup.content);
      setIsActive(selectedPopup.isActive);
      setTitle(selectedPopup.title);
      setBoton(selectedPopup.boton);
      setIsEditing(true); // Establecer modo de edición si existe un popup
    } else {
      // Resetear si no hay popup seleccionado
      setContent('');
      setIsActive(false);
      setTitle('');
      setBoton('');
      setIsEditing(false);
    }
  }, [selectedPopup]);

  // Desaparecer el mensaje de éxito después de 3 segundos
  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => setAlertMessage(''), 3000);
      return () => clearTimeout(timer); // Limpiar el timeout cuando el componente se desmonte o cambie
    }
  }, [alertMessage]);

  const handleSubmit = () => {
    const popupData = { content, isActive, title, boton }; // Agregar title y boton al objeto de datos

    if (isEditing && selectedPopup?.id) {
      // Confirmar actualización
      const confirmUpdate = window.confirm('¿Estás seguro de que deseas actualizar este popup?');
      if (confirmUpdate) {
        dispatch(putPopup(selectedPopup.id, popupData));
        setAlertMessage('Popup actualizado exitosamente!');
      }
    } else {
      // Crear un nuevo popup
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

      {/* Selección de Popup existente */}
      <div className="mb-6 mt-10">
        <h1 className="bg-ColorMorado text-2xl text-center font-bold font-nunito p-2 text-gray-200 mb-8">
          Seleccionar Popup
        </h1>
        <select
          onChange={(e) => setSelectedPopup(popups.find(p => p.id === parseInt(e.target.value)))}
          className="w-full p-2 border border-gray-300 rounded-md mb-4"
        >
          <option value="">Selecciona un Popup</option>
          {popups.map(popup => (
            <option key={popup.id} value={popup.id}>{popup.title}</option>
          ))}
        </select>
      </div>

      {/* Formulario para editar o crear un popup */}
      <div className="mb-6">
        <h3 className="text-xl font-nunito font-semibold mb-2">
          {isEditing ? 'Editar Popup' : 'Crear Nuevo Popup'}
        </h3>
        <textarea
          className="w-full p-2 border border-gray-300 rounded-md mb-2"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Ingresa el contenido del popup"
        />
        <textarea
          className="w-full p-2 border border-gray-300 rounded-md mb-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ingresa el título del popup"
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
        <label className="mb-4">
          Botón:
          <select
            value={boton}
            onChange={(e) => setBoton(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">Selecciona un botón</option>
            <option value="Reservas">Reservas</option>
            <option value="Rifa">Rifa</option>
            {/* Agrega más opciones aquí según sea necesario */}
          </select>
        </label>
        <button
          onClick={handleSubmit}
          className="bg-ColorAzul hover:bg-blue-300 text-gray-600 font-bold font-nunito py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          disabled={loading} // Deshabilitar botón si está cargando
        >
          {isEditing ? 'Actualizar Popup' : 'Crear Popup'}
        </button>
      </div>

      {/* Mostrar Popup siempre que esté activo */}
      {popups && popups.some(p => p.isActive) && (
        <div className="mt-10 p-4 border border-green-400 bg-green-100 rounded-md">
          <h2 className="text-lg font-nunito font-bold">Popup Activo:</h2>
          {popups.filter(p => p.isActive).map(popup => (
            <div key={popup.id}>
              <p>{popup.content}</p>
              <p className={popup.isActive ? 'text-green-500' : 'text-red-500'}>
                {popup.isActive ? 'Activo' : 'Inactivo'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManagePopup;














