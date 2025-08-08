import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, 
  faUser, 
  faEdit, 
  faTrash, 
  faSave,
  faCrown,
  faUsers,
  faSpinner,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import {
  fetchQuoteById,
  updatePassenger,
  deletePassenger,
} from '../../redux/slices/quoteSlice';

const PassengerModal = ({ isOpen, onClose, quote: initialQuote }) => {
  const dispatch = useDispatch();
  
  const [quote, setQuote] = useState(initialQuote);
  const [editingPassenger, setEditingPassenger] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const tiposDocumento = [
    { value: 'CC', label: 'Cédula de Ciudadanía' },
    { value: 'CE', label: 'Cédula de Extranjería' },
    { value: 'PS', label: 'Pasaporte' },
    { value: 'TI', label: 'Tarjeta de Identidad' },
  ];

  // Cargar datos completos de la cotización al abrir el modal
  useEffect(() => {
    if (isOpen && initialQuote?.id) {
      setIsLoading(true);
      dispatch(fetchQuoteById(initialQuote.id))
        .unwrap()
        .then((fullQuote) => {
          setQuote(fullQuote);
        })
        .catch((error) => {
          console.error('Error cargando cotización:', error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, initialQuote?.id, dispatch]);

  // Limpiar estado al cerrar
  useEffect(() => {
    if (!isOpen) {
      setEditingPassenger(null);
      setEditForm({});
      setQuote(initialQuote);
    }
  }, [isOpen, initialQuote]);

  // Recargar datos después de cambios
  const reloadQuoteData = async () => {
    if (quote?.id) {
      try {
        const updatedQuote = await dispatch(fetchQuoteById(quote.id)).unwrap();
        setQuote(updatedQuote);
      } catch (error) {
        console.error('Error recargando datos:', error);
      }
    }
  };

  const handleEdit = (passenger) => {
    setEditingPassenger(passenger.id);
    setEditForm({
      nombre: passenger.nombre,
      apellido: passenger.apellido,
      documento_identidad: passenger.documento_identidad,
      tipo_documento: passenger.tipo_documento,
      fecha_nacimiento: passenger.fecha_nacimiento?.split('T')[0], // Formatear fecha
      titular: passenger.titular
    });
  };

  const handleCancelEdit = () => {
    setEditingPassenger(null);
    setEditForm({});
  };

  const handleSaveEdit = async () => {
    if (!editForm.nombre?.trim() || !editForm.apellido?.trim() || 
        !editForm.documento_identidad?.trim() || !editForm.fecha_nacimiento) {
      alert('Todos los campos son obligatorios');
      return;
    }

    try {
      setIsUpdating(true);
      
      await dispatch(updatePassenger({
        passengerId: editingPassenger,
        updates: editForm
      })).unwrap();
      
      // Recargar datos
      await reloadQuoteData();
      
      setEditingPassenger(null);
      setEditForm({});
      
    } catch (error) {
      alert(`Error actualizando pasajero: ${error}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (passengerId, passengerName) => {
    if (!window.confirm(`¿Estás seguro de eliminar a ${passengerName}?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    try {
      setIsUpdating(true);
      
      await dispatch(deletePassenger(passengerId)).unwrap();
      
      // Recargar datos
      await reloadQuoteData();
      
    } catch (error) {
      alert(`Error eliminando pasajero: ${error}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFormChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  const passengers = quote?.Passengers || [];
  const hasPassengers = passengers.length > 0;
  const isComplete = passengers.length === quote?.numero_personas;
  const titularPassenger = passengers.find(p => p.titular);
  const nonTitularPassengers = passengers.filter(p => !p.titular);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden shadow-xl">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FontAwesomeIcon icon={faUsers} className="mr-2 text-blue-600" />
              Pasajeros - {quote?.quote_number}
            </h2>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
              <span>{quote?.destino}</span>
              <span>•</span>
              <span className={`font-medium ${
                isComplete ? 'text-green-600' : hasPassengers ? 'text-orange-600' : 'text-red-600'
              }`}>
                {passengers.length} de {quote?.numero_personas} pasajeros
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUpdating}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-[calc(90vh-140px)] overflow-y-auto">
          
          {/* Loading */}
          {isLoading && (
            <div className="text-center py-12">
              <FontAwesomeIcon icon={faSpinner} className="text-blue-600 text-3xl animate-spin mb-4" />
              <p className="text-gray-600">Cargando datos de pasajeros...</p>
            </div>
          )}

          {/* Sin pasajeros */}
          {!isLoading && !hasPassengers && (
            <div className="text-center py-12">
              <FontAwesomeIcon icon={faUser} className="text-gray-300 text-5xl mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay pasajeros registrados
              </h3>
              <p className="text-gray-600 mb-6">
                Esta cotización aún no tiene datos de pasajeros completados por el cliente.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <div className="flex items-start">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-blue-600 mr-3 mt-1" />
                  <div className="text-left">
                    <p className="text-blue-800 text-sm font-medium">
                      Información importante
                    </p>
                    <p className="text-blue-700 text-sm mt-1">
                      Los pasajeros deben completar sus datos usando el enlace enviado en el email de la cotización.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Lista de pasajeros */}
          {!isLoading && hasPassengers && (
            <div className="space-y-4">
              
              {/* Pasajero titular */}
              {titularPassenger && (
                <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faCrown} className="text-blue-600 mr-2" />
                      <span className="font-semibold text-blue-900">Pasajero Titular</span>
                    </div>
                    <div className="flex gap-2">
                      {editingPassenger !== titularPassenger.id ? (
                        <>
                          <button
                            onClick={() => handleEdit(titularPassenger)}
                            disabled={isUpdating}
                            className="text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50 p-1"
                            title="Editar pasajero"
                          >
                            <FontAwesomeIcon icon={faEdit} size="sm" />
                          </button>
                          <button
                            onClick={() => handleDelete(titularPassenger.id, `${titularPassenger.nombre} ${titularPassenger.apellido}`)}
                            disabled={isUpdating}
                            className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50 p-1"
                            title="Eliminar pasajero"
                          >
                            <FontAwesomeIcon icon={faTrash} size="sm" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={handleSaveEdit}
                            disabled={isUpdating}
                            className="text-green-600 hover:text-green-800 transition-colors disabled:opacity-50 p-1"
                            title="Guardar cambios"
                          >
                            <FontAwesomeIcon icon={isUpdating ? faSpinner : faSave} 
                              className={isUpdating ? 'animate-spin' : ''} size="sm" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={isUpdating}
                            className="text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 p-1"
                            title="Cancelar edición"
                          >
                            <FontAwesomeIcon icon={faTimes} size="sm" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {editingPassenger === titularPassenger.id ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Nombre</label>
                        <input
                          type="text"
                          placeholder="Nombre"
                          value={editForm.nombre}
                          onChange={(e) => handleFormChange('nombre', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Apellido</label>
                        <input
                          type="text"
                          placeholder="Apellido"
                          value={editForm.apellido}
                          onChange={(e) => handleFormChange('apellido', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Documento</label>
                        <select
                          value={editForm.tipo_documento}
                          onChange={(e) => handleFormChange('tipo_documento', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                          {tiposDocumento.map(tipo => (
                            <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Número de Documento</label>
                        <input
                          type="text"
                          placeholder="Número de documento"
                          value={editForm.documento_identidad}
                          onChange={(e) => handleFormChange('documento_identidad', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
                        <input
                          type="date"
                          value={editForm.fecha_nacimiento}
                          onChange={(e) => handleFormChange('fecha_nacimiento', e.target.value)}
                          className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-900">
                          {titularPassenger.nombre} {titularPassenger.apellido}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">
                          {titularPassenger.tipo_documento}: {titularPassenger.documento_identidad}
                        </span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-gray-600">
                          Fecha de nacimiento: {new Date(titularPassenger.fecha_nacimiento).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Otros pasajeros */}
              {nonTitularPassengers.map((passenger, index) => (
                <div key={passenger.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faUser} className="text-gray-600 mr-2" />
                      <span className="font-medium text-gray-900">
                        Pasajero {index + 2}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {editingPassenger !== passenger.id ? (
                        <>
                          <button
                            onClick={() => handleEdit(passenger)}
                            disabled={isUpdating}
                            className="text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50 p-1"
                            title="Editar pasajero"
                          >
                            <FontAwesomeIcon icon={faEdit} size="sm" />
                          </button>
                          <button
                            onClick={() => handleDelete(passenger.id, `${passenger.nombre} ${passenger.apellido}`)}
                            disabled={isUpdating}
                            className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50 p-1"
                            title="Eliminar pasajero"
                          >
                            <FontAwesomeIcon icon={faTrash} size="sm" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={handleSaveEdit}
                            disabled={isUpdating}
                            className="text-green-600 hover:text-green-800 transition-colors disabled:opacity-50 p-1"
                            title="Guardar cambios"
                          >
                            <FontAwesomeIcon icon={isUpdating ? faSpinner : faSave} 
                              className={isUpdating ? 'animate-spin' : ''} size="sm" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={isUpdating}
                            className="text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 p-1"
                            title="Cancelar edición"
                          >
                            <FontAwesomeIcon icon={faTimes} size="sm" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {editingPassenger === passenger.id ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Nombre</label>
                        <input
                          type="text"
                          placeholder="Nombre"
                          value={editForm.nombre}
                          onChange={(e) => handleFormChange('nombre', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Apellido</label>
                        <input
                          type="text"
                          placeholder="Apellido"
                          value={editForm.apellido}
                          onChange={(e) => handleFormChange('apellido', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Documento</label>
                        <select
                          value={editForm.tipo_documento}
                          onChange={(e) => handleFormChange('tipo_documento', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                          {tiposDocumento.map(tipo => (
                            <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Número de Documento</label>
                        <input
                          type="text"
                          placeholder="Número de documento"
                          value={editForm.documento_identidad}
                          onChange={(e) => handleFormChange('documento_identidad', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
                        <input
                          type="date"
                          value={editForm.fecha_nacimiento}
                          onChange={(e) => handleFormChange('fecha_nacimiento', e.target.value)}
                          className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editForm.titular}
                            onChange={(e) => handleFormChange('titular', e.target.checked)}
                            className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label className="text-sm text-gray-700">Pasajero titular de la reserva</label>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-900">
                          {passenger.nombre} {passenger.apellido}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">
                          {passenger.tipo_documento}: {passenger.documento_identidad}
                        </span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-gray-600">
                          Fecha de nacimiento: {new Date(passenger.fecha_nacimiento).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4 text-sm">
              {isComplete ? (
                <div className="flex items-center text-green-600">
                  <FontAwesomeIcon icon={faUsers} className="mr-2" />
                  <span className="font-medium">
                    Todos los pasajeros registrados ({passengers.length}/{quote?.numero_personas})
                  </span>
                </div>
              ) : hasPassengers ? (
                <div className="flex items-center text-orange-600">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                  <span className="font-medium">
                    Faltan pasajeros ({passengers.length}/{quote?.numero_personas})
                  </span>
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                  <span className="font-medium">
                    Sin datos de pasajeros (0/{quote?.numero_personas})
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              disabled={isUpdating}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 font-medium"
            >
              {isUpdating ? 'Guardando...' : 'Cerrar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassengerModal;