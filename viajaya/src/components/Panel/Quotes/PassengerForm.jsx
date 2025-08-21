import  { useState, useEffect } from 'react';
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
// ✅ Importar validaciones colombianas
import { 
  validateDocument, 
  validateName, 
  validateEmail, 
  validatePhoneNumber,
  validateAge 
} from '../../../utils/validations';

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
    // ✅ FUNCIÓN AUXILIAR: Validar datos precargados (independiente del estado)
    const validatePreloadedData = (passengerData) => {
      const validatedData = { ...passengerData };
      
      // Validar cada campo que tenga datos
      const fieldsToValidate = [
        { field: 'nombre', validator: validateName },
        { field: 'apellido', validator: validateName },
        { field: 'email', validator: validateEmail },
        { field: 'telefono', validator: validatePhoneNumber }
      ];
      
      fieldsToValidate.forEach(({ field, validator }) => {
        const value = passengerData[field];
        if (value && value.trim && value.trim()) {
          const validation = validator(value, field);
          
          // Agregar estado de validación
          validatedData[`${field}_validation`] = {
            isValid: validation.isValid,
            message: validation.message
          };
          
          // Usar valor formateado si está disponible
          if (validation.formatted !== undefined) {
            validatedData[field] = validation.formatted;
          }
        }
      });
      
      // Validación especial para documento
      const docValue = passengerData.documento_identidad;
      const docType = passengerData.tipo_documento;
      if (docValue && docValue.trim && docValue.trim()) {
        const docValidation = validateDocument(docType, docValue);
        
        validatedData[`documento_identidad_validation`] = {
          isValid: docValidation.isValid,
          message: docValidation.message
        };
        
        if (docValidation.isValid && docValidation.formatted) {
          validatedData.documento_identidad = docValidation.formatted;
        }
      }
      
      // Validación especial para fecha de nacimiento
      const birthDate = passengerData.fecha_nacimiento;
      if (birthDate) {
        // Intentar validar como adulto primero, luego menor, luego infante
        let ageValidation = validateAge(birthDate, 'adulto');
        if (!ageValidation.isValid) {
          ageValidation = validateAge(birthDate, 'menor');
          if (!ageValidation.isValid) {
            ageValidation = validateAge(birthDate, 'infante');
          }
        }
        
        validatedData[`fecha_nacimiento_validation`] = {
          isValid: ageValidation.isValid,
          message: ageValidation.message
        };
      }
      
      return validatedData;
    };

    // ✅ MODIFICADO: Inicializar formulario vacío con datos del cliente precargados
    const initializeEmptyForm = (numPersonas, clientData = null) => {
      console.log('🚀 initializeEmptyForm llamada con:', { numPersonas, clientData });
      console.log('🔍 clientData detallado:', {
        existe: !!clientData,
        nombre: clientData?.nombre,
        apellido: clientData?.apellido,
        email: clientData?.email,
        telefono: clientData?.telefono,
        tipo_documento: clientData?.tipo_documento,
        documento_identidad: clientData?.documento_identidad
      });
      
      const emptyPassengers = Array.from({ length: numPersonas }, (_, index) => {
        const esTitular = index === 0;
        const tieneClientData = esTitular && clientData;
        
        console.log(`🔍 Procesando pasajero ${index}:`, { esTitular, tieneClientData });
        
        let passengerData = {
          id: `temp-${index}`,
          nombre: tieneClientData ? clientData.nombre : '',
          apellido: tieneClientData ? clientData.apellido : '',
          documento_identidad: tieneClientData ? clientData.documento_identidad : '',
          tipo_documento: tieneClientData ? (clientData.tipo_documento || 'CC').toUpperCase() : 'CC',
          fecha_nacimiento: tieneClientData ? clientData.fecha_nacimiento : '',
          titular: esTitular, // Primer pasajero como titular por defecto
          // ✅ AGREGADO: Campos adicionales para el titular precargados
          ...(tieneClientData ? {
            email: clientData.email || '',
            telefono: clientData.telefono || '',
            direccion: clientData.direccion || '',
            ciudad: clientData.ciudad || '',
            pais: clientData.pais || 'Colombia'
          } : {})
        };
        
        // ✅ NUEVO: Validar datos precargados para el titular
        if (tieneClientData) {
          console.log('🔍 Validando datos precargados para titular...');
          console.log('📋 Datos antes de validar:', {
            documento_identidad: passengerData.documento_identidad,
            tipo_documento: passengerData.tipo_documento,
            nombre: passengerData.nombre,
            email: passengerData.email
          });
          
          passengerData = validatePreloadedData(passengerData);
          
          console.log('✅ Datos después de validar:', {
            documento_identidad: passengerData.documento_identidad,
            documento_identidad_validation: passengerData.documento_identidad_validation,
            nombre_validation: passengerData.nombre_validation,
            email_validation: passengerData.email_validation
          });
        }
        
        if (index === 0) {
          console.log(`✅ Pasajero titular creado:`, passengerData);
        }
        
        return passengerData;
      });
      
      console.log('✅ Array completo de pasajeros:', emptyPassengers);
      setFormPassengers(emptyPassengers);
    };

    if (quoteId) {
      dispatch(fetchPassengersByQuote(quoteId))
        .unwrap()
        .then((response) => {
          console.log('✅ Datos recibidos:', response); // Debug
          setQuoteInfo(response.quote);
          
          // Si ya hay pasajeros, cargarlos
          if (response.passengers && response.passengers.length > 0) {
            setFormPassengers(response.passengers);
          } else {
            // ✅ MODIFICADO: Crear formulario vacío con datos del cliente precargados
            console.log('✅ Precargando datos del cliente:', response.clientData); // Debug
            initializeEmptyForm(response.quote?.numero_personas || 1, response.clientData);
          }
        })
        .catch((err) => {
          console.error('Error cargando datos:', err);
        });
    }
  }, [quoteId, dispatch]);

  // ✅ NUEVA: Función para validar y formatear en tiempo real
  const validateAndFormatField = (field, value, passengerIndex) => {
    const passenger = formPassengers[passengerIndex];
    let formattedValue = value;
    let isValid = true;
    let errorMessage = '';

    switch (field) {
      case 'nombre':
      case 'apellido': {
        const nameValidation = validateName(value, field);
        isValid = nameValidation.isValid;
        errorMessage = nameValidation.message;
        if (nameValidation.isValid) {
          formattedValue = nameValidation.formatted;
        }
        break;
      }
        
      case 'documento_identidad': {
        if (value.trim()) {
          const documentValidation = validateDocument(passenger.tipo_documento, value);
          isValid = documentValidation.isValid;
          errorMessage = documentValidation.message;
          if (documentValidation.isValid && documentValidation.formatted) {
            formattedValue = documentValidation.formatted;
          }
        }
        break;
      }
        
      case 'email': {
        if (value.trim()) {
          const emailValidation = validateEmail(value);
          isValid = emailValidation.isValid;
          errorMessage = emailValidation.message;
          if (emailValidation.isValid) {
            formattedValue = emailValidation.formatted;
          }
        }
        break;
      }
        
      case 'telefono': {
        if (value.trim()) {
          const phoneValidation = validatePhoneNumber(value);
          isValid = phoneValidation.isValid;
          errorMessage = phoneValidation.message;
          if (phoneValidation.isValid) {
            formattedValue = phoneValidation.formatted;
          }
        }
        break;
      }
        
      case 'fecha_nacimiento': {
        if (value) {
          // Intentar validar como adulto primero, luego menor, luego infante
          let ageValidation = validateAge(value, 'adulto');
          if (!ageValidation.isValid) {
            ageValidation = validateAge(value, 'menor');
            if (!ageValidation.isValid) {
              ageValidation = validateAge(value, 'infante');
            }
          }
          isValid = ageValidation.isValid;
          errorMessage = ageValidation.message;
        }
        break;
      }
        
      default:
        break;
    }

    return { formattedValue, isValid, errorMessage };
  };

  // ✅ MODIFICADA: Actualizar datos de un pasajero con validación en tiempo real
  const updatePassenger = (index, field, value) => {
    // Validar y formatear el campo
    const validation = validateAndFormatField(field, value, index);
    
    setFormPassengers(prev => {
      const updated = [...prev];
      
      // Si se marca como titular, desmarcar otros
      if (field === 'titular' && value === true) {
        updated.forEach((p, i) => {
          updated[i] = { ...p, titular: i === index };
        });
      } else {
        // Usar el valor formateado si la validación fue exitosa
        const finalValue = validation.formattedValue !== undefined ? validation.formattedValue : value;
        updated[index] = { ...updated[index], [field]: finalValue };
        
        // Agregar información de validación al estado (opcional, para mostrar errores en tiempo real)
        if (field !== 'titular') {
          updated[index] = { 
            ...updated[index], 
            [`${field}_validation`]: {
              isValid: validation.isValid,
              message: validation.errorMessage
            }
          };
        }
      }
      
      return updated;
    });
    
    // Limpiar errores al modificar
    if (submitError) setSubmitError(null);
    if (error) dispatch(clearPassengerError());
  };

  // ✅ Validar formulario con validaciones colombianas
  const validateForm = () => {
    const errors = [];
    const titulares = formPassengers.filter(p => p.titular).length;
    
    if (titulares !== 1) {
      errors.push('Debe haber exactamente un pasajero titular');
    }
    
    formPassengers.forEach((passenger, index) => {
      // ✅ MODIFICADO: Validaciones mejoradas para el titular
      if (passenger.titular) {
        // Validar nombre
        const nameValidation = validateName(passenger.nombre, 'nombre');
        if (!nameValidation.isValid) {
          errors.push(`Pasajero titular: ${nameValidation.message}`);
        }
        
        // Validar apellido
        const lastNameValidation = validateName(passenger.apellido, 'apellido');
        if (!lastNameValidation.isValid) {
          errors.push(`Pasajero titular: ${lastNameValidation.message}`);
        }
        
        // Validar documento
        const documentValidation = validateDocument(
          passenger.tipo_documento, 
          passenger.documento_identidad
        );
        if (!documentValidation.isValid) {
          errors.push(`Pasajero titular: ${documentValidation.message}`);
        }
        
        // Validar fecha de nacimiento/edad
        if (!passenger.fecha_nacimiento) {
          errors.push(`Pasajero titular: La fecha de nacimiento es obligatoria`);
        } else {
          const ageValidation = validateAge(passenger.fecha_nacimiento, 'adulto');
          if (!ageValidation.isValid) {
            errors.push(`Pasajero titular: ${ageValidation.message}`);
          }
        }
        
        // Validar email
        const emailValidation = validateEmail(passenger.email);
        if (!emailValidation.isValid) {
          errors.push(`Pasajero titular: ${emailValidation.message}`);
        }
        
        // Validar teléfono
        const phoneValidation = validatePhoneNumber(passenger.telefono);
        if (!phoneValidation.isValid) {
          errors.push(`Pasajero titular: ${phoneValidation.message}`);
        }
        
      } else {
        // ✅ MEJORADO: Para NO TITULARES, validar solo si hay datos parciales
        const hasPartialData = passenger.nombre?.trim() || passenger.apellido?.trim() || 
                               passenger.documento_identidad?.trim() || passenger.fecha_nacimiento;
        
        if (hasPartialData) {
          // Validar nombre si está presente
          if (passenger.nombre?.trim()) {
            const nameValidation = validateName(passenger.nombre, 'nombre');
            if (!nameValidation.isValid) {
              errors.push(`Pasajero ${index + 1}: ${nameValidation.message}`);
            }
          } else {
            errors.push(`Pasajero ${index + 1}: Si ingresa datos, el nombre es obligatorio`);
          }
          
          // Validar apellido si está presente
          if (passenger.apellido?.trim()) {
            const lastNameValidation = validateName(passenger.apellido, 'apellido');
            if (!lastNameValidation.isValid) {
              errors.push(`Pasajero ${index + 1}: ${lastNameValidation.message}`);
            }
          } else {
            errors.push(`Pasajero ${index + 1}: Si ingresa datos, el apellido es obligatorio`);
          }
          
          // Validar documento si está presente
          if (passenger.documento_identidad?.trim()) {
            const documentValidation = validateDocument(
              passenger.tipo_documento, 
              passenger.documento_identidad
            );
            if (!documentValidation.isValid) {
              errors.push(`Pasajero ${index + 1}: ${documentValidation.message}`);
            }
          }
          
          // Validar fecha de nacimiento si está presente
          if (passenger.fecha_nacimiento) {
            // Determinar tipo de pasajero basado en la edad
            const ageValidation = validateAge(passenger.fecha_nacimiento, 'adulto');
            if (!ageValidation.isValid) {
              // Intentar como menor
              const minorValidation = validateAge(passenger.fecha_nacimiento, 'menor');
              if (!minorValidation.isValid) {
                // Intentar como infante
                const infantValidation = validateAge(passenger.fecha_nacimiento, 'infante');
                if (!infantValidation.isValid) {
                  errors.push(`Pasajero ${index + 1}: Edad no válida para ninguna categoría`);
                }
              }
            }
          }
        }
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
        // ✅ AGREGADO: Incluir datos adicionales para el titular
        ...(p.titular ? {
          email: p.email?.trim(),
          telefono: p.telefono?.trim(),
          direccion: p.direccion?.trim(),
          ciudad: p.ciudad?.trim(),
          pais: p.pais || 'Colombia'
        } : {})
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
            
            {/* ✅ AGREGADO: Mensaje informativo sobre validaciones */}
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <div className="text-yellow-600 text-lg mr-2">💡</div>
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Información importante:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Los datos del <strong>pasajero titular</strong> se han precargado con la información del solicitante</li>
                    <li>Solo los datos del titular son obligatorios inicialmente</li>
                    <li>Los datos de otros pasajeros pueden completarse después en la edición</li>
                    <li>El titular se registrará automáticamente como usuario del sistema</li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* ✅ NUEVO: Información sobre validaciones colombianas */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <div className="text-blue-600 text-lg mr-2">🔍</div>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Validaciones aplicadas:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li><strong>Documentos:</strong> Formatos válidos colombianos (CC, TI, CE, PA, RC)</li>
                    <li><strong>Teléfonos:</strong> Celulares (3XXXXXXX) y fijos (601XXXXXX) con auto-formato</li>
                    <li><strong>Emails:</strong> Validación estricta de formato y dominio</li>
                    <li><strong>Nombres:</strong> Solo letras, espacios y acentos permitidos</li>
                    <li><strong>Edades:</strong> Validación automática por categoría (adulto/menor/infante)</li>
                  </ul>
                </div>
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