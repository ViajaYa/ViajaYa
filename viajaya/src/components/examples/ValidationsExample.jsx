// ✅ Ejemplo de uso de las validaciones colombianas
// Archivo: src/components/examples/ValidationsExample.jsx

import React, { useState } from 'react';
import { 
  validatePhoneNumber, 
  validateEmail, 
  validateName, 
  validateDocument, 
  validateAge,
  getDocumentTypes,
  formatPhoneNumber,
  formatDocumentNumber
} from '../../utils/validations';

const ValidationsExample = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    tipo_documento: 'CC',
    documento: '',
    fecha_nacimiento: ''
  });

  const [errors, setErrors] = useState({});
  const [validations, setValidations] = useState({});

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validar en tiempo real
    let validation;
    switch (field) {
      case 'nombre':
      case 'apellido':
        validation = validateName(value, field);
        break;
      case 'email':
        validation = validateEmail(value);
        break;
      case 'telefono':
        validation = validatePhoneNumber(value);
        if (validation.isValid) {
          // Auto-formatear teléfono
          setFormData(prev => ({ 
            ...prev, 
            [field]: validation.formatted 
          }));
        }
        break;
      case 'documento':
        validation = validateDocument(formData.tipo_documento, value);
        if (validation.isValid && validation.formatted) {
          // Auto-formatear documento
          setFormData(prev => ({ 
            ...prev, 
            [field]: validation.formatted 
          }));
        }
        break;
      case 'fecha_nacimiento':
        validation = validateAge(value, 'adulto');
        break;
      default:
        return;
    }

    setValidations(prev => ({ ...prev, [field]: validation }));
    setErrors(prev => ({ 
      ...prev, 
      [field]: validation.isValid ? null : validation.message 
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validar todo el formulario
    const allValidations = {
      nombre: validateName(formData.nombre, 'nombre'),
      apellido: validateName(formData.apellido, 'apellido'),
      email: validateEmail(formData.email),
      telefono: validatePhoneNumber(formData.telefono),
      documento: validateDocument(formData.tipo_documento, formData.documento),
      fecha_nacimiento: validateAge(formData.fecha_nacimiento, 'adulto')
    };

    const newErrors = {};
    Object.keys(allValidations).forEach(field => {
      if (!allValidations[field].isValid) {
        newErrors[field] = allValidations[field].message;
      }
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      alert('¡Formulario válido! Datos listos para enviar.');
      console.log('Datos validados:', formData);
    }
  };

  const getInputClassName = (field) => {
    const baseClass = "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2";
    if (errors[field]) {
      return `${baseClass} border-red-500 focus:ring-red-500`;
    }
    if (validations[field]?.isValid) {
      return `${baseClass} border-green-500 focus:ring-green-500`;
    }
    return `${baseClass} border-gray-300 focus:ring-blue-500`;
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Ejemplo de Validaciones Colombianas
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nombre y Apellido */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => handleInputChange('nombre', e.target.value)}
              className={getInputClassName('nombre')}
              placeholder="Ej: Juan Carlos"
            />
            {errors.nombre && (
              <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>
            )}
            {validations.nombre?.isValid && (
              <p className="text-green-500 text-xs mt-1">✓ Nombre válido</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Apellido *
            </label>
            <input
              type="text"
              value={formData.apellido}
              onChange={(e) => handleInputChange('apellido', e.target.value)}
              className={getInputClassName('apellido')}
              placeholder="Ej: Pérez García"
            />
            {errors.apellido && (
              <p className="text-red-500 text-xs mt-1">{errors.apellido}</p>
            )}
            {validations.apellido?.isValid && (
              <p className="text-green-500 text-xs mt-1">✓ Apellido válido</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={getInputClassName('email')}
            placeholder="Ej: juan.perez@correo.com"
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
          )}
          {validations.email?.isValid && (
            <p className="text-green-500 text-xs mt-1">✓ Email válido</p>
          )}
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Teléfono *
          </label>
          <input
            type="tel"
            value={formData.telefono}
            onChange={(e) => handleInputChange('telefono', e.target.value)}
            className={getInputClassName('telefono')}
            placeholder="Ej: 3001234567 o 6011234567"
          />
          {errors.telefono && (
            <p className="text-red-500 text-xs mt-1">{errors.telefono}</p>
          )}
          {validations.telefono?.isValid && (
            <div className="text-green-500 text-xs mt-1">
              ✓ Teléfono válido ({validations.telefono.type === 'mobile' ? 'Celular' : 'Fijo'})
            </div>
          )}
        </div>

        {/* Documento */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Documento *
            </label>
            <select
              value={formData.tipo_documento}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, tipo_documento: e.target.value }));
                // Re-validar documento con nuevo tipo
                if (formData.documento) {
                  handleInputChange('documento', formData.documento);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {getDocumentTypes().map(tipo => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Documento *
            </label>
            <input
              type="text"
              value={formData.documento}
              onChange={(e) => handleInputChange('documento', e.target.value)}
              className={getInputClassName('documento')}
              placeholder={
                formData.tipo_documento === 'CC' ? 'Ej: 12345678' :
                formData.tipo_documento === 'PA' ? 'Ej: AB123456' :
                'Número de documento'
              }
            />
            {errors.documento && (
              <p className="text-red-500 text-xs mt-1">{errors.documento}</p>
            )}
            {validations.documento?.isValid && (
              <p className="text-green-500 text-xs mt-1">✓ Documento válido</p>
            )}
          </div>
        </div>

        {/* Fecha de Nacimiento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha de Nacimiento *
          </label>
          <input
            type="date"
            value={formData.fecha_nacimiento}
            onChange={(e) => handleInputChange('fecha_nacimiento', e.target.value)}
            className={getInputClassName('fecha_nacimiento')}
          />
          {errors.fecha_nacimiento && (
            <p className="text-red-500 text-xs mt-1">{errors.fecha_nacimiento}</p>
          )}
          {validations.fecha_nacimiento?.isValid && (
            <p className="text-green-500 text-xs mt-1">
              ✓ Edad válida: {validations.fecha_nacimiento.age} {validations.fecha_nacimiento.unit}
            </p>
          )}
        </div>

        {/* Botón de envío */}
        <div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
          >
            Validar Formulario
          </button>
        </div>
      </form>

      {/* Información de ayuda */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-800 mb-2">
          Formatos Válidos:
        </h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li><strong>Teléfonos:</strong> 3001234567, 6011234567, +573001234567</li>
          <li><strong>Cédula:</strong> 12345678 (se formatea automáticamente)</li>
          <li><strong>Pasaporte:</strong> AB123456 (letras y números)</li>
          <li><strong>Email:</strong> usuario@dominio.com</li>
          <li><strong>Nombres:</strong> Solo letras, espacios y acentos</li>
        </ul>
      </div>
    </div>
  );
};

export default ValidationsExample;
