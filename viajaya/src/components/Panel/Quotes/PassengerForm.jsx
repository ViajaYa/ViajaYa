import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  fetchPassengersByQuote, 
  createOrUpdatePassengers,
  selectPassengers,
  selectPassengersLoading,
  selectPassengersError,
  clearPassengerError 
} from '../../../redux/slices/quoteSlice';
import PassengerCard from './PassengerCard';
import LoadingSpinner from '../../LoadingSpinner';

const PassengerForm = () => {
  const { quoteId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const passengers = useSelector(selectPassengers);
  const loading = useSelector(selectPassengersLoading);
  const error = useSelector(selectPassengersError);
  
  const [quoteInfo, setQuoteInfo] = useState(null);
  const [formPassengers, setFormPassengers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  console.log(quoteInfo)

  // Cargar datos iniciales
  useEffect(() => {
    if (quoteId) {
      dispatch(fetchPassengersByQuote(quoteId))
        .unwrap()
        .then((response) => {
          setQuoteInfo(response.quote);
          
          // Si ya hay pasajeros, cargarlos
          if (response.passengers && response.passengers.length > 0) {
            setFormPassengers(response.passengers);
          } else {
            // Crear formulario vacío basado en número de personas
            initializeEmptyForm(response.quote?.numero_personas || 1);
          }
        })
        .catch((err) => {
          console.error('Error cargando datos:', err);
        });
    }
  }, [quoteId, dispatch]);

  // Inicializar formulario vacío
  const initializeEmptyForm = (numPersonas) => {
    const emptyPassengers = Array.from({ length: numPersonas }, (_, index) => ({
      id: `temp-${index}`,
      nombre: '',
      apellido: '',
      documento_identidad: '',
      tipo_documento: 'CC',
      fecha_nacimiento: '',
      titular: index === 0, // Primer pasajero como titular por defecto
    }));
    setFormPassengers(emptyPassengers);
  };

  // Actualizar datos de un pasajero
  const updatePassenger = (index, field, value) => {
    setFormPassengers(prev => {
      const updated = [...prev];
      
      // Si se marca como titular, desmarcar otros
      if (field === 'titular' && value === true) {
        updated.forEach((p, i) => {
          updated[i] = { ...p, titular: i === index };
        });
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      
      return updated;
    });
    
    // Limpiar errores al modificar
    if (submitError) setSubmitError(null);
    if (error) dispatch(clearPassengerError());
  };

  // Validar formulario
  const validateForm = () => {
    const errors = [];
    const titulares = formPassengers.filter(p => p.titular).length;
    
    if (titulares !== 1) {
      errors.push('Debe haber exactamente un pasajero titular');
    }
    
    formPassengers.forEach((passenger, index) => {
      if (!passenger.nombre?.trim()) {
        errors.push(`Pasajero ${index + 1}: El nombre es obligatorio`);
      }
      if (!passenger.apellido?.trim()) {
        errors.push(`Pasajero ${index + 1}: El apellido es obligatorio`);
      }
      if (!passenger.documento_identidad?.trim()) {
        errors.push(`Pasajero ${index + 1}: El documento es obligatorio`);
      }
      if (!passenger.fecha_nacimiento) {
        errors.push(`Pasajero ${index + 1}: La fecha de nacimiento es obligatoria`);
      }
    });
    
    return errors;
  };

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setSubmitError(validationErrors.join('. '));
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Preparar datos para envío
      const passengersData = formPassengers.map(p => ({
        nombre: p.nombre.trim(),
        apellido: p.apellido.trim(),
        documento_identidad: p.documento_identidad.trim(),
        tipo_documento: p.tipo_documento,
        fecha_nacimiento: p.fecha_nacimiento,
        titular: p.titular || false,
      }));
      
      await dispatch(createOrUpdatePassengers({
        quoteId,
        passengers: passengersData
      })).unwrap();
      
      setSubmitSuccess(true);
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate('/passenger-success');
      }, 2000);
      
    } catch (error) {
      setSubmitError(error.message || 'Error guardando los datos');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && !quoteInfo) {
    return <LoadingSpinner message="Cargando información de la cotización..." />;
  }

  if (!quoteInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center max-w-md w-full">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Cotización no encontrada
          </h2>
          <p className="text-gray-600">
            No se pudo cargar la información de la cotización solicitada.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Datos de Pasajeros
            </h1>
            <p className="text-gray-600">
              Complete la información de todos los pasajeros para procesar su reserva
            </p>
          </div>
          
          {/* Info de la cotización */}
          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Destino:</span>
                <span className="ml-2 text-gray-900">{quoteInfo.destino}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Cotización:</span>
                <span className="ml-2 text-gray-900">{quoteInfo.quote_number}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Pasajeros:</span>
                <span className="ml-2 text-gray-900">{quoteInfo.numero_personas}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Mensajes de estado */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="text-red-400 text-xl mr-3">⚠️</div>
                <div>
                  <h3 className="text-red-800 font-medium">Error en el formulario</h3>
                  <p className="text-red-600 text-sm mt-1">{submitError}</p>
                </div>
              </div>
            </div>
          )}

          {submitSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-green-400 text-xl mr-3">✅</div>
                <div>
                  <h3 className="text-green-800 font-medium">¡Datos guardados exitosamente!</h3>
                  <p className="text-green-600 text-sm">Redirigiendo...</p>
                </div>
              </div>
            </div>
          )}

          {/* Tarjetas de pasajeros */}
          <div className="space-y-4">
            {formPassengers.map((passenger, index) => (
              <PassengerCard
                key={passenger.id || index}
                passenger={passenger}
                index={index}
                onUpdate={updatePassenger}
                isFirst={index === 0}
              />
            ))}
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={isSubmitting}
            >
              Volver
            </button>
            <button
              type="submit"
              disabled={isSubmitting || submitSuccess}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                isSubmitting || submitSuccess
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Guardando...
                </span>
              ) : submitSuccess ? (
                '✅ Guardado'
              ) : (
                'Guardar Pasajeros'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PassengerForm;