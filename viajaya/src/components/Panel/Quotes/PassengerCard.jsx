import React from 'react';

const PassengerCard = ({ passenger, index, onUpdate, isFirst }) => {
  const tiposDocumento = [
    { value: 'CC', label: 'Cédula de Ciudadanía' },
    { value: 'CE', label: 'Cédula de Extranjería' },
    { value: 'PS', label: 'Pasaporte' },
    { value: 'TI', label: 'Tarjeta de Identidad' },
  ];

  const handleInputChange = (field, value) => {
    onUpdate(index, field, value);
  };

  return (
    <div className={`bg-white rounded-lg border p-6 ${passenger.titular ? 'ring-2 ring-blue-200 bg-blue-50' : ''}`}>
      {/* Header de la tarjeta */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Pasajero {index + 1}
        </h3>
        
        {/* Toggle titular */}
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={passenger.titular || false}
            onChange={(e) => handleInputChange('titular', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 font-medium">
            Titular
          </span>
        </label>
      </div>

      {/* Formulario */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre *
          </label>
          <input
            type="text"
            value={passenger.nombre || ''}
            onChange={(e) => handleInputChange('nombre', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ingrese el nombre"
            required
          />
        </div>

        {/* Apellido */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Apellido *
          </label>
          <input
            type="text"
            value={passenger.apellido || ''}
            onChange={(e) => handleInputChange('apellido', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ingrese el apellido"
            required
          />
        </div>

        {/* Tipo de documento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Documento *
          </label>
          <select
            value={passenger.tipo_documento || 'CC'}
            onChange={(e) => handleInputChange('tipo_documento', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          >
            {tiposDocumento.map(tipo => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </select>
        </div>

        {/* Número de documento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número de Documento *
          </label>
          <input
            type="text"
            value={passenger.documento_identidad || ''}
            onChange={(e) => handleInputChange('documento_identidad', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ingrese el número"
            required
          />
        </div>

        {/* Fecha de nacimiento */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de Nacimiento *
          </label>
          <input
            type="date"
            value={passenger.fecha_nacimiento || ''}
            onChange={(e) => handleInputChange('fecha_nacimiento', e.target.value)}
            className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
      </div>

      {/* Indicador de titular */}
      {passenger.titular && (
        <div className="mt-4 flex items-center text-sm text-blue-600">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Pasajero titular de la reserva
        </div>
      )}
    </div>
  );
};

export default PassengerCard;