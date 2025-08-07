import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarAlt,
  faTimes,
  faSpinner,
  faClock,
  faExclamationTriangle,
  faLightbulb,
  faPlane,
  faHotel
} from '@fortawesome/free-solid-svg-icons';

const DeadlineUpdateModal = ({ item, onClose, onSubmit, updating }) => {
  const [selectedDate, setSelectedDate] = useState(
    item.fecha_limite_compra ? 
      new Date(item.fecha_limite_compra).toISOString().slice(0, 16) : 
      ''
  );
  const [errors, setErrors] = useState({});

  // ✅ OBTENER SUGERENCIAS DE FECHA SEGÚN TIPO
  const getDateSuggestions = () => {
    const now = new Date();
    const suggestions = [];

    switch (item.tipo) {
      case 'tickets':
        suggestions.push({
          label: '24 horas (Crítico)',
          date: new Date(now.getTime() + 24 * 60 * 60 * 1000),
          reason: 'Los tickets pueden cambiar de precio rápidamente',
          urgency: 'high'
        });
        suggestions.push({
          label: '12 horas (Urgente)',
          date: new Date(now.getTime() + 12 * 60 * 60 * 1000),
          reason: 'Para vuelos con alta demanda',
          urgency: 'critical'
        });
        break;
      
      case 'hotel':
        suggestions.push({
          label: '3 días',
          date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
          reason: 'Tiempo estándar para reservas hoteleras',
          urgency: 'medium'
        });
        suggestions.push({
          label: '1 semana',
          date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          reason: 'Para hoteles con disponibilidad estable',
          urgency: 'low'
        });
        break;
      
      default:
        suggestions.push({
          label: '2 días',
          date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
          reason: 'Plazo estándar para servicios generales',
          urgency: 'medium'
        });
        suggestions.push({
          label: '5 días',
          date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
          reason: 'Plazo extendido para servicios complejos',
          urgency: 'low'
        });
    }

    return suggestions;
  };

  const suggestions = getDateSuggestions();

  // ✅ VALIDAR FECHA
  const validateDate = (dateString) => {
    if (!dateString) {
      return 'La fecha límite es obligatoria';
    }

    const selectedDateTime = new Date(dateString);
    const now = new Date();

    if (selectedDateTime <= now) {
      return 'La fecha límite debe ser en el futuro';
    }

    // Advertencia si es muy lejana (más de 30 días)
    const diffDays = (selectedDateTime - now) / (1000 * 60 * 60 * 24);
    if (diffDays > 30) {
      return 'warning:Fecha muy lejana, considera si es necesario tanto tiempo';
    }

    return null;
  };

  // ✅ MANEJAR CAMBIO DE FECHA
  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    
    const validation = validateDate(newDate);
    setErrors(prev => ({
      ...prev,
      date: validation && !validation.startsWith('warning:') ? validation : null
    }));
  };

  // ✅ APLICAR SUGERENCIA
  const applySuggestion = (suggestedDate) => {
    const dateString = suggestedDate.toISOString().slice(0, 16);
    setSelectedDate(dateString);
    setErrors(prev => ({ ...prev, date: null }));
  };

  // ✅ ENVIAR FORMULARIO
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const validation = validateDate(selectedDate);
    if (validation && !validation.startsWith('warning:')) {
      setErrors({ date: validation });
      return;
    }

    const fecha_limite_compra = new Date(selectedDate).toISOString();
    onSubmit(fecha_limite_compra);
  };

  // ✅ FORMATEAR FECHA PARA MOSTRAR
  const formatDisplayDate = (date) => {
    return date.toLocaleDateString('es-CO', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ✅ CALCULAR TIEMPO DESDE AHORA
  const getTimeFromNow = (date) => {
    const now = new Date();
    const diffMs = date - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `en ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `en ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    return 'menos de 1 hora';
  };

  const validation = validateDate(selectedDate);
  const isWarning = validation?.startsWith('warning:');
  const warningMessage = isWarning ? validation.replace('warning:', '') : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* ✅ HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              <FontAwesomeIcon icon={faCalendarAlt} className="mr-3 text-blue-600" />
              Actualizar Fecha Límite
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {item.descripcion}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
            disabled={updating}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* ✅ CONTENIDO */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ✅ FECHA ACTUAL */}
            {item.fecha_limite_compra && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Fecha límite actual:</p>
                <p className="font-medium text-gray-900">
                  <FontAwesomeIcon icon={faClock} className="mr-2 text-blue-600" />
                  {formatDisplayDate(new Date(item.fecha_limite_compra))}
                </p>
              </div>
            )}

            {/* ✅ SUGERENCIAS RÁPIDAS */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <FontAwesomeIcon icon={faLightbulb} className="mr-2 text-yellow-500" />
                Sugerencias Rápidas
              </label>
              <div className="grid grid-cols-1 gap-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => applySuggestion(suggestion.date)}
                    className={`text-left p-3 rounded-lg border transition-colors ${
                      suggestion.urgency === 'critical' ? 'border-red-300 hover:bg-red-50' :
                      suggestion.urgency === 'high' ? 'border-orange-300 hover:bg-orange-50' :
                      suggestion.urgency === 'medium' ? 'border-yellow-300 hover:bg-yellow-50' :
                      'border-green-300 hover:bg-green-50'
                    }`}
                    disabled={updating}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-gray-900">
                        {suggestion.label}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        suggestion.urgency === 'critical' ? 'bg-red-100 text-red-800' :
                        suggestion.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                        suggestion.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {getTimeFromNow(suggestion.date)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{suggestion.reason}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDisplayDate(suggestion.date)}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* ✅ SELECTOR DE FECHA PERSONALIZADA */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-purple-600" />
                Fecha Límite Personalizada
              </label>
              <input
                type="datetime-local"
                value={selectedDate}
                onChange={handleDateChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.date ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={updating}
                min={new Date().toISOString().slice(0, 16)}
              />
              
              {errors.date && (
                <p className="text-red-500 text-xs mt-1">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1" />
                  {errors.date}
                </p>
              )}
              
              {warningMessage && (
                <p className="text-yellow-600 text-xs mt-1">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1" />
                  {warningMessage}
                </p>
              )}

              {selectedDate && !errors.date && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
                  <FontAwesomeIcon icon={faClock} className="mr-2" />
                  Se vence {getTimeFromNow(new Date(selectedDate))}
                </div>
              )}
            </div>

            {/* ✅ INFORMACIÓN CONTEXTUAL */}
            {item.tipo === 'tickets' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <FontAwesomeIcon icon={faPlane} className="mr-2 text-red-600" />
                  <span className="font-medium text-red-800">Tickets Aéreos - Alta Prioridad</span>
                </div>
                <p className="text-sm text-red-700">
                  Los precios de tickets pueden cambiar en cualquier momento. 
                  Se recomienda comprar lo antes posible.
                </p>
              </div>
            )}

            {item.tipo === 'hotel' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <FontAwesomeIcon icon={faHotel} className="mr-2 text-blue-600" />
                  <span className="font-medium text-blue-800">Alojamiento</span>
                </div>
                <p className="text-sm text-blue-700">
                  Las reservas hoteleras suelen tener más flexibilidad en fechas, 
                  pero la disponibilidad puede cambiar.
                </p>
              </div>
            )}

            {/* ✅ BOTONES DE ACCIÓN */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={updating}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={updating || !!errors.date}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
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
    </div>
  );
};

import PropTypes from 'prop-types';

DeadlineUpdateModal.propTypes = {
  item: PropTypes.shape({
    fecha_limite_compra: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Date)
    ]),
    tipo: PropTypes.string,
    descripcion: PropTypes.string
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  updating: PropTypes.bool
};

export default DeadlineUpdateModal;