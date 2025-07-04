import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSave,
  faArrowLeft,
  faPaperPlane,
  faCalendarAlt,
  faMapMarkerAlt,
  faUsers,
  faChild,
  faBed,
  faHotel,
  faCar,
  faUtensils,
  faDollarSign,
  faStickyNote,
  faSpinner,
  faExclamationTriangle,
  faShieldAlt
} from '@fortawesome/free-solid-svg-icons';

// ✅ Importar acciones del slice
import {
  fetchQuoteById,
  updateQuote,
  sendQuoteToClient,
  clearQuoteError,
  QUOTE_STATUSES,
  selectCurrentQuote,
  selectQuoteLoading,
  selectQuoteError
} from '../../../redux/slices/quoteSlice';

// ✅ Importar selectores de auth y permisos
import { selectUser } from '../../../redux/slices/authSlice';
import { useRolePermissions } from '../../../redux/hooks/hooks';

// ✅ Importar componentes
import NavBar from '../../layout/NavBar/NavBar';

const QuoteEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // ✅ TODOS LOS HOOKS PRIMERO - Sin condiciones
  const currentQuote = useSelector(selectCurrentQuote);
  const loading = useSelector(selectQuoteLoading);
  const error = useSelector(selectQuoteError);
  const user = useSelector(selectUser);
  
  // ✅ Hook de permisos - CORREGIDO
  const { hasAnyRole = () => false, USER_ROLES = {}, canManageQuotes = false } = useRolePermissions() || {};

  // ✅ Estados del formulario
  const [formData, setFormData] = useState({
    numero_personas: 1,
    fecha_ida: '',
    fecha_regreso: '',
    destino: '',
    origen: '',
    acomodacion: 'Doble',
    tipo_hotel: '3 Estrellas',
    traslado: false,
    alimentacion: '',
    ninos: 0,
    edades_ninos: [],
    observaciones: '',
    precio_total: ''
  });

  const [saveLoading, setSaveLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // ✅ Opciones para selects
  const acomodacionOptions = ['Simple', 'Doble', 'Triple', 'Cuádruple', 'Familiar'];
  const tipoHotelOptions = ['1 Estrella', '2 Estrellas', '3 Estrellas', '4 Estrellas', '5 Estrellas', 'Boutique', 'Resort'];

  // ✅ TODAS LAS FUNCIONES DESPUÉS DE LOS HOOKS
  const canEditQuote = () => {
    if (!user || !currentQuote || typeof hasAnyRole !== 'function') return false;
    
    // Owner puede editar todas
    if (hasAnyRole([USER_ROLES.OWNER])) return true;
    
    // Admin/Contador pueden editar todas
    if (hasAnyRole([USER_ROLES.ADMIN, USER_ROLES.CONTADOR])) return true;
    
    // Gerente puede editar las suyas y de su equipo
    if (hasAnyRole([USER_ROLES.GERENTE]) && currentQuote.gerente_id === user.id) return true;
    
    // Líder puede editar las suyas y de su equipo
    if (hasAnyRole([USER_ROLES.LIDER]) && currentQuote.lider_id === user.id) return true;
    
    // Asesor puede editar solo las suyas
    if (hasAnyRole([USER_ROLES.ASESOR]) && currentQuote.asesor_id === user.id) return true;
    
    return false;
  };

  const canSendQuote = () => {
    if (!user || !currentQuote || typeof hasAnyRole !== 'function') return false;
    
    // Solo Líder y superiores pueden enviar
    return hasAnyRole([USER_ROLES.LIDER, USER_ROLES.GERENTE, USER_ROLES.ADMIN, USER_ROLES.CONTADOR, USER_ROLES.OWNER]);
  };

  // ✅ TODOS LOS useEffect DESPUÉS DE LAS FUNCIONES
  useEffect(() => {
    if (id) {
      dispatch(fetchQuoteById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (currentQuote) {
      setFormData({
        numero_personas: currentQuote.numero_personas || 1,
        fecha_ida: currentQuote.fecha_ida ? new Date(currentQuote.fecha_ida).toISOString().split('T')[0] : '',
        fecha_regreso: currentQuote.fecha_regreso ? new Date(currentQuote.fecha_regreso).toISOString().split('T')[0] : '',
        destino: currentQuote.destino || '',
        origen: currentQuote.origen || '',
        acomodacion: currentQuote.acomodacion || 'Doble',
        tipo_hotel: currentQuote.tipo_hotel || '3 Estrellas',
        traslado: currentQuote.traslado || false,
        alimentacion: currentQuote.alimentacion || '',
        ninos: currentQuote.ninos || 0,
        edades_ninos: currentQuote.edades_ninos || [],
        observaciones: currentQuote.observaciones || '',
        precio_total: currentQuote.precio_total || ''
      });
    }
  }, [currentQuote]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearQuoteError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  useEffect(() => {
    const numNinos = formData.edades_ninos.length;
    if (numNinos !== formData.ninos) {
      setFormData(prev => ({ ...prev, ninos: numNinos }));
    }
  }, [formData.edades_ninos, formData.ninos]);

  // ✅ FUNCIONES DE MANEJO DESPUÉS DE TODOS LOS HOOKS
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleEdadNinoChange = (index, edad) => {
    const newEdades = [...formData.edades_ninos];
    newEdades[index] = parseInt(edad);
    setFormData(prev => ({ ...prev, edades_ninos: newEdades }));
  };

  const addEdadNino = () => {
    setFormData(prev => ({
      ...prev,
      edades_ninos: [...prev.edades_ninos, 0]
    }));
  };

  const removeEdadNino = (index) => {
    const newEdades = formData.edades_ninos.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, edades_ninos: newEdades }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.destino.trim()) {
      newErrors.destino = 'El destino es requerido';
    }
    if (!formData.origen.trim()) {
      newErrors.origen = 'El origen es requerido';
    }
    if (!formData.fecha_ida) {
      newErrors.fecha_ida = 'La fecha de ida es requerida';
    }
    if (!formData.fecha_regreso) {
      newErrors.fecha_regreso = 'La fecha de regreso es requerida';
    }
    if (formData.fecha_ida && formData.fecha_regreso && new Date(formData.fecha_ida) >= new Date(formData.fecha_regreso)) {
      newErrors.fecha_regreso = 'La fecha de regreso debe ser posterior a la fecha de ida';
    }
    if (formData.numero_personas < 1) {
      newErrors.numero_personas = 'Debe ser al menos 1 persona';
    }
    if (canSendQuote() && (!formData.precio_total || formData.precio_total <= 0)) {
      newErrors.precio_total = 'El precio total es requerido y debe ser mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaveLoading(true);
    try {
      const updateData = {
        ...formData,
        precio_total: formData.precio_total ? parseFloat(formData.precio_total) : null,
        numero_personas: parseInt(formData.numero_personas),
        ninos: parseInt(formData.ninos),
        status: formData.precio_total && formData.precio_total > 0 ? 'completed' : 'pending'
      };

      await dispatch(updateQuote({ id, updates: updateData })).unwrap();
      
      alert('Cotización guardada exitosamente');
    } catch (error) {
      console.error('Error guardando cotización:', error);
      alert('Error al guardar la cotización: ' + error);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSendToClient = async () => {
    if (!canSendQuote()) {
      alert('No tienes permisos para enviar cotizaciones');
      return;
    }

    if (!validateForm()) {
      alert('Por favor, completa todos los campos requeridos antes de enviar');
      return;
    }

    if (!formData.precio_total || formData.precio_total <= 0) {
      alert('Debes establecer un precio total antes de enviar la cotización');
      return;
    }

    if (window.confirm('¿Estás seguro de enviar esta cotización al cliente? Una vez enviada no podrás editarla.')) {
      setSendLoading(true);
      try {
        const updateData = {
          ...formData,
          precio_total: parseFloat(formData.precio_total),
          numero_personas: parseInt(formData.numero_personas),
          ninos: parseInt(formData.ninos),
          status: 'completed'
        };

        await dispatch(updateQuote({ id, updates: updateData })).unwrap();
        
        await dispatch(sendQuoteToClient(id)).unwrap();
        
        alert('Cotización enviada exitosamente al cliente');
        navigate('/panel/quotes');
      } catch (error) {
        console.error('Error enviando cotización:', error);
        alert('Error al enviar la cotización: ' + error);
      } finally {
        setSendLoading(false);
      }
    }
  };

  // ✅ RENDERS CONDICIONALES AL FINAL - Después de todos los hooks
  
  // Loading state
  if (loading && !currentQuote) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className='fixed top-0 left-0 z-50 w-full'>
          <NavBar />
        </div>
        <div className="flex justify-center items-center h-screen">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-lg">Cargando cotización...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !currentQuote) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className='fixed top-0 left-0 z-50 w-full'>
          <NavBar />
        </div>
        <div className="flex justify-center items-center h-screen">
          <div className="text-center">
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 text-6xl mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar la cotización</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/panel/quotes')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Volver a cotizaciones
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Validar permisos de acceso
  if (!loading && currentQuote && !canEditQuote()) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className='fixed top-0 left-0 z-50 w-full'>
          <NavBar />
        </div>
        <div className="flex justify-center items-center h-screen">
          <div className="text-center max-w-md">
            <FontAwesomeIcon icon={faShieldAlt} className="text-red-500 text-6xl mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sin Permisos</h2>
            <p className="text-gray-600 mb-4">
              No tienes permisos para editar esta cotización.
            </p>
            <button
              onClick={() => navigate('/panel/quotes')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Volver a cotizaciones
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Verificar si la cotización puede ser editada por estado
  const isReadOnly = currentQuote?.status === QUOTE_STATUSES.SENT || 
                    currentQuote?.status === QUOTE_STATUSES.APPROVED ||
                    currentQuote?.status === QUOTE_STATUSES.REJECTED ||
                    currentQuote?.status === QUOTE_STATUSES.EXPIRED;

  // ✅ RENDER PRINCIPAL
  return (
    <div className="min-h-screen bg-gray-50">
      <div className='fixed top-0 left-0 z-50 w-full'>
        <NavBar />
      </div>

      <div className="container mx-auto p-4 mt-28">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/panel/quotes')}
                className="mr-4 p-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <FontAwesomeIcon icon={faArrowLeft} size="lg" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isReadOnly ? 'Ver Cotización' : 'Editar Cotización'}
                </h1>
                <p className="text-gray-600">
                  {currentQuote?.quote_number} - {currentQuote?.nombre_cliente || 'Cliente sin nombre'}
                </p>
                {isReadOnly && (
                  <p className="text-sm text-orange-600 font-medium">
                    Esta cotización no puede ser editada debido a su estado actual
                  </p>
                )}
              </div>
            </div>
            
            {/* Botones de acción */}
            <div className="flex gap-3">
              {!isReadOnly && (
                <button
                  onClick={handleSave}
                  disabled={saveLoading}
                  className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  {saveLoading ? (
                    <FontAwesomeIcon icon={faSpinner} spin />
                  ) : (
                    <FontAwesomeIcon icon={faSave} />
                  )}
                  Guardar
                </button>
              )}
              
              {canSendQuote() && !isReadOnly && currentQuote?.status !== QUOTE_STATUSES.SENT && (
                <button
                  onClick={handleSendToClient}
                  disabled={sendLoading}
                  className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  {sendLoading ? (
                    <FontAwesomeIcon icon={faSpinner} spin />
                  ) : (
                    <FontAwesomeIcon icon={faPaperPlane} />
                  )}
                  Enviar al Cliente
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Formulario */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <form className="space-y-8">
            {/* Información del Viaje */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-blue-500" />
                Información del Viaje
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Destino *
                  </label>
                  <input
                    type="text"
                    name="destino"
                    value={formData.destino}
                    onChange={handleInputChange}
                    disabled={isReadOnly}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.destino ? 'border-red-500' : 'border-gray-300'
                    } ${isReadOnly ? 'bg-gray-100' : ''}`}
                    placeholder="Ej: París, Francia"
                  />
                  {errors.destino && <p className="text-red-500 text-sm mt-1">{errors.destino}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Origen *
                  </label>
                  <input
                    type="text"
                    name="origen"
                    value={formData.origen}
                    onChange={handleInputChange}
                    disabled={isReadOnly}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.origen ? 'border-red-500' : 'border-gray-300'
                    } ${isReadOnly ? 'bg-gray-100' : ''}`}
                    placeholder="Ej: Buenos Aires, Argentina"
                  />
                  {errors.origen && <p className="text-red-500 text-sm mt-1">{errors.origen}</p>}
                </div>
              </div>
            </div>

            {/* Fechas */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-green-500" />
                Fechas del Viaje
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Ida *
                  </label>
                  <input
                    type="date"
                    name="fecha_ida"
                    value={formData.fecha_ida}
                    onChange={handleInputChange}
                    disabled={isReadOnly}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.fecha_ida ? 'border-red-500' : 'border-gray-300'
                    } ${isReadOnly ? 'bg-gray-100' : ''}`}
                  />
                  {errors.fecha_ida && <p className="text-red-500 text-sm mt-1">{errors.fecha_ida}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Regreso *
                  </label>
                  <input
                    type="date"
                    name="fecha_regreso"
                    value={formData.fecha_regreso}
                    onChange={handleInputChange}
                    disabled={isReadOnly}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.fecha_regreso ? 'border-red-500' : 'border-gray-300'
                    } ${isReadOnly ? 'bg-gray-100' : ''}`}
                  />
                  {errors.fecha_regreso && <p className="text-red-500 text-sm mt-1">{errors.fecha_regreso}</p>}
                </div>
              </div>
            </div>

            {/* Información de Pasajeros */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FontAwesomeIcon icon={faUsers} className="mr-2 text-purple-500" />
                Información de Pasajeros
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Personas *
                  </label>
                  <input
                    type="number"
                    name="numero_personas"
                    value={formData.numero_personas}
                    onChange={handleInputChange}
                    disabled={isReadOnly}
                    min="1"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.numero_personas ? 'border-red-500' : 'border-gray-300'
                    } ${isReadOnly ? 'bg-gray-100' : ''}`}
                  />
                  {errors.numero_personas && <p className="text-red-500 text-sm mt-1">{errors.numero_personas}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Acomodación
                  </label>
                  <select
                    name="acomodacion"
                    value={formData.acomodacion}
                    onChange={handleInputChange}
                    disabled={isReadOnly}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isReadOnly ? 'bg-gray-100' : ''
                    }`}
                  >
                    {acomodacionOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Edades de niños */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    <FontAwesomeIcon icon={faChild} className="mr-2 text-yellow-500" />
                    Edades de Niños ({formData.edades_ninos.length})
                  </label>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={addEdadNino}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Agregar Niño
                    </button>
                  )}
                </div>
                {formData.edades_ninos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {formData.edades_ninos.map((edad, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="number"
                          value={edad}
                          onChange={(e) => handleEdadNinoChange(index, e.target.value)}
                          disabled={isReadOnly}
                          min="0"
                          max="17"
                          className={`w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            isReadOnly ? 'bg-gray-100' : ''
                          }`}
                          placeholder="Edad"
                        />
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => removeEdadNino(index)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Información del Hotel */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FontAwesomeIcon icon={faHotel} className="mr-2 text-indigo-500" />
                Información del Alojamiento
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Hotel
                  </label>
                  <select
                    name="tipo_hotel"
                    value={formData.tipo_hotel}
                    onChange={handleInputChange}
                    disabled={isReadOnly}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isReadOnly ? 'bg-gray-100' : ''
                    }`}
                  >
                    {tipoHotelOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alimentación
                  </label>
                  <input
                    type="text"
                    name="alimentacion"
                    value={formData.alimentacion}
                    onChange={handleInputChange}
                    disabled={isReadOnly}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isReadOnly ? 'bg-gray-100' : ''
                    }`}
                    placeholder="Ej: Desayuno incluido, Media pensión, etc."
                  />
                </div>
              </div>

              {/* Traslados */}
              <div className="mt-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="traslado"
                    checked={formData.traslado}
                    onChange={handleInputChange}
                    disabled={isReadOnly}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    <FontAwesomeIcon icon={faCar} className="mr-2 text-blue-500" />
                    Incluir traslados aeropuerto-hotel
                  </span>
                </label>
              </div>
            </div>

            {/* Precio - Solo visible para Líder y superiores */}
            {hasAnyRole([USER_ROLES.LIDER, USER_ROLES.GERENTE, USER_ROLES.ADMIN, USER_ROLES.CONTADOR, USER_ROLES.OWNER]) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FontAwesomeIcon icon={faDollarSign} className="mr-2 text-green-500" />
                  Información de Precio
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Precio Total * (USD)
                    </label>
                    <input
                      type="number"
                      name="precio_total"
                      value={formData.precio_total}
                      onChange={handleInputChange}
                      disabled={isReadOnly}
                      min="0"
                      step="0.01"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.precio_total ? 'border-red-500' : 'border-gray-300'
                      } ${isReadOnly ? 'bg-gray-100' : ''}`}
                      placeholder="0.00"
                    />
                    {errors.precio_total && <p className="text-red-500 text-sm mt-1">{errors.precio_total}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Observaciones */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FontAwesomeIcon icon={faStickyNote} className="mr-2 text-orange-500" />
                Observaciones
              </h3>
              <textarea
                name="observaciones"
                value={formData.observaciones}
                onChange={handleInputChange}
                disabled={isReadOnly}
                rows={4}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isReadOnly ? 'bg-gray-100' : ''
                }`}
                placeholder="Comentarios adicionales, solicitudes especiales, etc."
              />
            </div>
          </form>
        </div>

        {/* Botones de acción fijos en la parte inferior */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40">
          <div className="container mx-auto flex justify-end gap-3">
            <button
              onClick={() => navigate('/panel/quotes')}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              {isReadOnly ? 'Volver' : 'Cancelar'}
            </button>
            
            {!isReadOnly && (
              <button
                onClick={handleSave}
                disabled={saveLoading}
                className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                {saveLoading ? (
                  <FontAwesomeIcon icon={faSpinner} spin />
                ) : (
                  <FontAwesomeIcon icon={faSave} />
                )}
                Guardar
              </button>
            )}
            
            {canSendQuote() && !isReadOnly && currentQuote?.status !== QUOTE_STATUSES.SENT && (
              <button
                onClick={handleSendToClient}
                disabled={sendLoading}
                className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                {sendLoading ? (
                  <FontAwesomeIcon icon={faSpinner} spin />
                ) : (
                  <FontAwesomeIcon icon={faPaperPlane} />
                )}
                Enviar al Cliente
              </button>
            )}
          </div>
        </div>

        {/* Espacio para los botones fijos */}
        <div className="h-20"></div>
      </div>
    </div>
  );
};

export default QuoteEdit;