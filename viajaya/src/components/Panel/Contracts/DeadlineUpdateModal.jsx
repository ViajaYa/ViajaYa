import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faSpinner, faTimes } from '@fortawesome/free-solid-svg-icons';

const DeadlineUpdateModal = ({ 
  item, 
  onClose, 
  onSubmit, 
  updating = false 
}) => {
  const [fecha_vencimiento_pago, setFechaVencimientoPago] = useState(''); // ✅ CORREGIDO NOMBRE
  const [error, setError] = useState('');

  // ✅ INICIALIZAR CON FECHA ACTUAL
  useEffect(() => {
    if (item?.fecha_vencimiento_pago) { // ✅ CORREGIDO
      // Convertir a formato datetime-local
      const date = new Date(item.fecha_vencimiento_pago); // ✅ CORREGIDO
      const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
      setFechaVencimientoPago(localDate.toISOString().slice(0, 16));
    } else {
      // Valor por defecto: mañana a las 09:00
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      const localDate = new Date(tomorrow.getTime() - (tomorrow.getTimezoneOffset() * 60000));
      setFechaVencimientoPago(localDate.toISOString().slice(0, 16));
    }
  }, [item]);

  // ✅ VALIDAR FECHA
  const validateDate = (dateString) => {
    if (!dateString) {
      return 'La fecha es requerida';
    }

    const selectedDate = new Date(dateString);
    const now = new Date();

    if (selectedDate <= now) {
      return 'La fecha debe ser futura';
    }

    // Validar que no sea muy lejos (ej: máximo 1 año)
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    
    if (selectedDate > maxDate) {
      return 'La fecha no puede ser mayor a 1 año';
    }

    return '';
  };

  // ✅ MANEJAR CAMBIO DE FECHA
  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setFechaVencimientoPago(newDate);
    setError(validateDate(newDate));
  };

  // ✅ MANEJAR ENVÍO
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const validationError = validateDate(fecha_vencimiento_pago); // ✅ CORREGIDO
    if (validationError) {
      setError(validationError);
      return;
    }

    // Convertir a UTC para envío
    const dateToSend = new Date(fecha_vencimiento_pago).toISOString(); // ✅ CORREGIDO
    onSubmit(dateToSend);
  };

  // ✅ OBTENER FECHA MÍNIMA (ahora + 1 hora)
  const getMinDate = () => {
    const minDate = new Date();
    minDate.setHours(minDate.getHours() + 1);
    const localMinDate = new Date(minDate.getTime() - (minDate.getTimezoneOffset() * 60000));
    return localMinDate.toISOString().slice(0, 16);
  };

  // ✅ OBTENER FECHA MÁXIMA (1 año desde ahora)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    const localMaxDate = new Date(maxDate.getTime() - (maxDate.getTimezoneOffset() * 60000));
    return localMaxDate.toISOString().slice(0, 16);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4">
        {/* ✅ HEADER */}
        <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faCalendarAlt} className="mr-3 text-lg" />
              <h2 className="text-xl font-semibold">Actualizar Fecha Límite</h2>
            </div>
            <button
              onClick={onClose}
              disabled={updating}
              className="text-white hover:text-gray-200 disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faTimes} className="text-xl" />
            </button>
          </div>
        </div>

        {/* ✅ CONTENIDO */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* ✅ INFORMACIÓN DEL ITEM */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">{item.descripcion}</h3>
            <div className="text-sm text-gray-600">
              <p><span className="font-medium">Tipo:</span> {item.tipo}</p>
              <p><span className="font-medium">Precio:</span> ${parseFloat(item.precio_total || 0).toLocaleString('es-CO')}</p>
              <p><span className="font-medium">Estado:</span> {item.status?.replace('_', ' ')}</p>
              {item.fecha_vencimiento_pago && ( // ✅ CORREGIDO
                <p>
                  <span className="font-medium">Fecha actual:</span>{' '}
                  {new Date(item.fecha_vencimiento_pago).toLocaleDateString('es-CO', { // ✅ CORREGIDO
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              )}
            </div>
          </div>

          {/* ✅ CAMPO DE FECHA */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nueva Fecha y Hora Límite de Pago {/* ✅ CORREGIDO LABEL */}
            </label>
            <input
              type="datetime-local"
              value={fecha_vencimiento_pago} // ✅ CORREGIDO
              onChange={handleDateChange}
              min={getMinDate()}
              max={getMaxDate()}
              disabled={updating}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                error ? 'border-red-300' : 'border-gray-300'
              }`}
              required
            />
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              La fecha debe ser futura y no mayor a 1 año desde ahora
            </p>
          </div>

          {/* ✅ FECHAS SUGERIDAS */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Fechas sugeridas:</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'En 2 horas', hours: 2 },
                { label: 'Mañana 9am', days: 1, hour: 9 },
                { label: 'En 3 días', days: 3 },
                { label: 'En 1 semana', days: 7 }
              ].map((suggestion, index) => {
                const suggestedDate = new Date();
                if (suggestion.hours) {
                  suggestedDate.setHours(suggestedDate.getHours() + suggestion.hours);
                } else if (suggestion.days) {
                  suggestedDate.setDate(suggestedDate.getDate() + suggestion.days);
                  if (suggestion.hour !== undefined) {
                    suggestedDate.setHours(suggestion.hour, 0, 0, 0);
                  }
                }
                const localDate = new Date(suggestedDate.getTime() - (suggestedDate.getTimezoneOffset() * 60000));
                const dateValue = localDate.toISOString().slice(0, 16);

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setFechaVencimientoPago(dateValue);
                      setError(validateDate(dateValue));
                    }}
                    disabled={updating}
                    className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {suggestion.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ✅ BOTONES */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={updating}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={updating || !!error}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {updating ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                  Actualizando...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                  Actualizar Fecha
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

DeadlineUpdateModal.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    descripcion: PropTypes.string.isRequired,
    tipo: PropTypes.string.isRequired,
    precio_total: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    status: PropTypes.string.isRequired,
    fecha_vencimiento_pago: PropTypes.string // ✅ CORREGIDO
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  updating: PropTypes.bool
};

export default DeadlineUpdateModal;