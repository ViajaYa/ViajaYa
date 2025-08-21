
import PropTypes from 'prop-types';
import { toDateInput } from '../../../utils/dateUtils';
// ✅ Importar validaciones colombianas para documentos y nombres
import { getDocumentTypes } from '../../../utils/validations';

const PassengerCard = ({ passenger, index, onUpdate, isFirst }) => {
 // ✅ Usar tipos de documento estándar de Colombia
 const tiposDocumento = getDocumentTypes().map(doc => ({
   value: doc.value.toLowerCase(),
   label: doc.label
 }));

  // 📅 FECHA MEJORADA CON LUXON - SIN PROBLEMAS DE ZONA HORARIA
  const getDateInputValue = (date) => {
    return toDateInput(date); // Usa la utilidad de Luxon
  };

  const handleInputChange = (field, value) => {
    onUpdate(index, field, value);
  };

  // ✅ NUEVA: Función para obtener estilos de input basado en validación
  const getInputClassName = (field) => {
    const baseClass = "w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:outline-none";
    const validation = passenger[`${field}_validation`];
    
    if (validation) {
      if (validation.isValid) {
        return `${baseClass} border-green-500 focus:ring-green-500 focus:border-green-500`;
      } else {
        return `${baseClass} border-red-500 focus:ring-red-500 focus:border-red-500`;
      }
    }
    
    return `${baseClass} border-gray-300 focus:ring-blue-500 focus:border-blue-500`;
  };

  // ✅ NUEVA: Función para mostrar mensaje de validación
  const renderValidationMessage = (field) => {
    const validation = passenger[`${field}_validation`];
    
    if (!validation) return null;
    
    if (validation.isValid && passenger[field]?.trim()) {
      return (
        <p className="text-green-600 text-xs mt-1 flex items-center">
          <span className="mr-1">✓</span>
          {field === 'documento_identidad' ? 'Documento válido' :
           field === 'telefono' ? 'Teléfono válido' :
           field === 'email' ? 'Email válido' :
           'Válido'}
        </p>
      );
    } else if (!validation.isValid && validation.message) {
      return (
        <p className="text-red-600 text-xs mt-1 flex items-center">
          <span className="mr-1">⚠️</span>
          {validation.message}
        </p>
      );
    }
    
    return null;
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
            Nombre {passenger.titular ? '*' : ''}
          </label>
          <input
            type="text"
            value={passenger.nombre || ''}
            onChange={(e) => handleInputChange('nombre', e.target.value)}
            className={getInputClassName('nombre')}
            placeholder="Ingrese el nombre"
            required={passenger.titular}
          />
          {renderValidationMessage('nombre')}
        </div>

        {/* Apellido */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Apellido {passenger.titular ? '*' : ''}
          </label>
          <input
            type="text"
            value={passenger.apellido || ''}
            onChange={(e) => handleInputChange('apellido', e.target.value)}
            className={getInputClassName('apellido')}
            placeholder="Ingrese el apellido"
            required={passenger.titular}
          />
          {renderValidationMessage('apellido')}
        </div>

        {/* Tipo de documento */}
       <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Documento {passenger.titular ? '*' : ''}
          </label>
          <select
            value={passenger.tipo_documento || 'cc'}
            onChange={(e) => handleInputChange('tipo_documento', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required={passenger.titular}
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
            Número de Documento {passenger.titular ? '*' : ''}
          </label>
          <input
            type="text"
            value={passenger.documento_identidad || ''}
            onChange={(e) => handleInputChange('documento_identidad', e.target.value)}
            className={getInputClassName('documento_identidad')}
            placeholder={
              passenger.tipo_documento === 'cc' ? 'Ej: 12345678' :
              passenger.tipo_documento === 'pa' ? 'Ej: AB123456' :
              'Número de documento'
            }
            required={passenger.titular}
          />
          {renderValidationMessage('documento_identidad')}
        </div>

        {/* Fecha de nacimiento */}
        <div className="md:col-span-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Fecha de Nacimiento {passenger.titular ? '*' : ''}
      </label>
      <input
        type="date"
        value={getDateInputValue(passenger.fecha_nacimiento)}
        onChange={(e) => handleInputChange('fecha_nacimiento', e.target.value)}
        className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        required={passenger.titular}
      />
      </div>

        {/* ✅ CAMPOS ADICIONALES PARA TITULAR */}
        {passenger.titular && (
          <>
            <div className="md:col-span-2">
              <div className="border-t border-gray-200 pt-4 mb-4">
                <h4 className="text-md font-medium text-blue-700 mb-3">
                  🔹 Información adicional del titular
                </h4>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo Electrónico *
              </label>
              <input
                type="email"
                value={passenger.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={getInputClassName('email')}
                placeholder="ejemplo@correo.com"
                required
              />
              {renderValidationMessage('email')}
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono *
              </label>
              <input
                type="tel"
                value={passenger.telefono || ''}
                onChange={(e) => handleInputChange('telefono', e.target.value)}
                className={getInputClassName('telefono')}
                placeholder="300 123 4567 o 601 123 4567"
                required
              />
              {renderValidationMessage('telefono')}
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección
              </label>
              <input
                type="text"
                value={passenger.direccion || ''}
                onChange={(e) => handleInputChange('direccion', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Calle 123 #45-67"
              />
            </div>

            {/* Ciudad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ciudad
              </label>
              <input
                type="text"
                value={passenger.ciudad || ''}
                onChange={(e) => handleInputChange('ciudad', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Bogotá"
              />
            </div>

            {/* País */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                País
              </label>
              <select
                value={passenger.pais || 'Colombia'}
                onChange={(e) => handleInputChange('pais', e.target.value)}
                className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Colombia">Colombia</option>
                <option value="Argentina">Argentina</option>
                <option value="Brasil">Brasil</option>
                <option value="Chile">Chile</option>
                <option value="Ecuador">Ecuador</option>
                <option value="México">México</option>
                <option value="Perú">Perú</option>
                <option value="Venezuela">Venezuela</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* Indicador de titular */}
      {passenger.titular && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center text-sm text-blue-600">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Pasajero titular de la reserva
          </div>
          
          {/* ✅ AGREGADO: Indicador de datos precargados */}
          {(passenger.nombre || passenger.email) && (
            <div className="flex items-center text-sm text-green-600">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
              </svg>
              Datos precargados del solicitante
            </div>
          )}
        </div>
      )}

      {/* ✅ AGREGADO: Indicador para pasajeros opcionales */}
      {!passenger.titular && (
        <div className="mt-4 flex items-center text-sm text-gray-500">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Datos opcionales - pueden completarse después
        </div>
      )}
    </div>
  );
};
PassengerCard.propTypes = {
  passenger: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  onUpdate: PropTypes.func.isRequired
};

export default PassengerCard;
