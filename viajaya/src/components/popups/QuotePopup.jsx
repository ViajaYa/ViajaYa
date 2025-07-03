import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { createQuote } from '../../redux/slices/quoteSlice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faUser, faCalendarAlt, faMapMarkerAlt, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { useRolePermissions } from '../../redux/hooks/hooks';

const QuotePopup = ({ isOpen, onClose, prefilledData = {} }) => {
  const dispatch = useDispatch();
  const auth = useSelector(state => state.auth);
  const user = auth.user;
  const isAuthenticated = auth.isAuthenticated;
  
  // ✅ Usar el hook de permisos - CORREGIDO
  const { canManageQuotes, hasAnyRole, getRoleName, USER_ROLES } = useRolePermissions();

  const [form, setForm] = useState({
    nombre_cliente: prefilledData.nombre_cliente || '',
    email_cliente: prefilledData.email_cliente || '',
    telefono_cliente: prefilledData.telefono_cliente || '',
    destino: prefilledData.destino || '',
    origen: prefilledData.origen || '',
    fecha_ida: prefilledData.fecha_ida || '',
    fecha_regreso: prefilledData.fecha_regreso || '',
    numero_personas: prefilledData.numero_personas || 1,
    acomodacion: prefilledData.acomodacion || '',
    tipo_hotel: prefilledData.tipo_hotel || '',
    ninos: prefilledData.ninos || 0,
    edades_ninos: prefilledData.edades_ninos || '',
    observaciones: prefilledData.observaciones || '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // ✅ Validación del formulario
  const validateForm = () => {
    const newErrors = {};

    if (!form.nombre_cliente.trim()) {
      newErrors.nombre_cliente = 'El nombre del cliente es requerido';
    }
    if (!form.email_cliente.trim()) {
      newErrors.email_cliente = 'El email del cliente es requerido';
    } else if (!/\S+@\S+\.\S+/.test(form.email_cliente)) {
      newErrors.email_cliente = 'El email no es válido';
    }
    if (!form.telefono_cliente.trim()) {
      newErrors.telefono_cliente = 'El teléfono es requerido';
    }
    if (!form.destino.trim()) {
      newErrors.destino = 'El destino es requerido';
    }
    if (!form.fecha_ida) {
      newErrors.fecha_ida = 'La fecha de ida es requerida';
    }
    if (!form.numero_personas || form.numero_personas < 1) {
      newErrors.numero_personas = 'Debe ser al menos 1 persona';
    }
    if (form.fecha_ida && form.fecha_regreso && new Date(form.fecha_ida) >= new Date(form.fecha_regreso)) {
      newErrors.fecha_regreso = 'La fecha de regreso debe ser posterior a la fecha de ida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error específico
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // ✅ Función mejorada para asignar según el rol
      const getRolePayload = (user) => {
        if (!user) return {};
        
        switch (user.role) {
          case USER_ROLES.ASESOR:
            return { 
              asesor_id: user.id,
              created_by: `${user.name} ${user.lastname} (Asesor)`
            };
          case USER_ROLES.LIDER:
            return { 
              lider_id: user.id,
              created_by: `${user.name} ${user.lastname} (Líder)`
            };
          case USER_ROLES.GERENTE:
            return { 
              gerente_id: user.id,
              created_by: `${user.name} ${user.lastname} (Gerente)`
            };
          case USER_ROLES.ADMIN:
          case USER_ROLES.CONTADOR:
          case USER_ROLES.OWNER:
            return { 
              admin_id: user.id,
              created_by: `${user.name} ${user.lastname} (${getRoleName(user.role)})`
            };
          default: 
            return { 
              cliente_id: user.id,
              created_by: `${user.name} ${user.lastname} (Cliente)`
            };
        }
      };

      const payload = {
        ...form,
        ...(isAuthenticated && user ? getRolePayload(user) : {}),
        created_at: new Date().toISOString(),
        status: 'pending'
      };

      console.log('✅ Payload de cotización:', payload);

      await dispatch(createQuote(payload)).unwrap();
      
      // ✅ Mostrar mensaje de éxito
      alert('Cotización creada exitosamente');
      
      // ✅ Cerrar popup
      if (onClose) onClose();
      
    } catch (error) {
      console.error('Error creando cotización:', error);
      alert('Error al crear la cotización: ' + (error.message || error));
    } finally {
      setLoading(false);
    }
  };

  // ✅ Validar permisos - CORREGIDO
  if (isAuthenticated && user && !hasAnyRole([USER_ROLES.ASESOR, USER_ROLES.LIDER, USER_ROLES.GERENTE, USER_ROLES.ADMIN, USER_ROLES.CONTADOR, USER_ROLES.OWNER])) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
          <div className="text-center">
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 text-4xl mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Sin Permisos</h2>
            <p className="text-gray-600 mb-4">No tienes permisos para crear cotizaciones.</p>
            <button
              onClick={onClose}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
        
        {/* ✅ Header del popup */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <FontAwesomeIcon icon={faCalendarAlt} className="mr-3 text-blue-500" />
            Solicitar Cotización
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* ✅ Identificación del creador - CORREGIDO */}
        {isAuthenticated && user && hasAnyRole([USER_ROLES.ASESOR, USER_ROLES.LIDER, USER_ROLES.GERENTE, USER_ROLES.ADMIN, USER_ROLES.CONTADOR, USER_ROLES.OWNER]) && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faUser} className="text-blue-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Cotización creada por:
                </p>
                <p className="text-lg font-bold text-blue-900">
                  {user.name || ''} {user.lastname || ''} - {getRoleName(user.role)}
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* ✅ Información del cliente */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <FontAwesomeIcon icon={faUser} className="mr-2 text-gray-500" />
              Información del Cliente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  name="nombre_cliente"
                  placeholder="Nombre completo del cliente *"
                  value={form.nombre_cliente}
                  onChange={handleChange}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.nombre_cliente ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.nombre_cliente && <p className="text-red-500 text-xs mt-1">{errors.nombre_cliente}</p>}
              </div>
              
              <div>
                <input
                  type="email"
                  name="email_cliente"
                  placeholder="Correo electrónico *"
                  value={form.email_cliente}
                  onChange={handleChange}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.email_cliente ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.email_cliente && <p className="text-red-500 text-xs mt-1">{errors.email_cliente}</p>}
              </div>
              
              <div className="md:col-span-2">
                <input
                  type="text"
                  name="telefono_cliente"
                  placeholder="Teléfono *"
                  value={form.telefono_cliente}
                  onChange={handleChange}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.telefono_cliente ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.telefono_cliente && <p className="text-red-500 text-xs mt-1">{errors.telefono_cliente}</p>}
              </div>
            </div>
          </div>

          {/* ✅ Información del viaje */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-green-500" />
              Detalles del Viaje
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  name="destino"
                  placeholder="Destino *"
                  value={form.destino}
                  onChange={handleChange}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.destino ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.destino && <p className="text-red-500 text-xs mt-1">{errors.destino}</p>}
              </div>
              
              <input
                type="text"
                name="origen"
                placeholder="Origen"
                value={form.origen}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              <div>
                <input
                  type="date"
                  name="fecha_ida"
                  value={form.fecha_ida}
                  onChange={handleChange}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.fecha_ida ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <label className="text-xs text-gray-500">Fecha de ida *</label>
                {errors.fecha_ida && <p className="text-red-500 text-xs mt-1">{errors.fecha_ida}</p>}
              </div>
              
              <div>
                <input
                  type="date"
                  name="fecha_regreso"
                  value={form.fecha_regreso}
                  onChange={handleChange}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.fecha_regreso ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <label className="text-xs text-gray-500">Fecha de regreso</label>
                {errors.fecha_regreso && <p className="text-red-500 text-xs mt-1">{errors.fecha_regreso}</p>}
              </div>
              
              <div>
                <input
                  type="number"
                  name="numero_personas"
                  placeholder="Número de personas *"
                  value={form.numero_personas}
                  onChange={handleChange}
                  min={1}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.numero_personas ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.numero_personas && <p className="text-red-500 text-xs mt-1">{errors.numero_personas}</p>}
              </div>
              
              <input
                type="number"
                name="ninos"
                placeholder="Número de niños"
                value={form.ninos}
                onChange={handleChange}
                min={0}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* ✅ Preferencias de alojamiento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="acomodacion"
              placeholder="Tipo de acomodación preferida"
              value={form.acomodacion}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              name="tipo_hotel"
              placeholder="Categoría de hotel"
              value={form.tipo_hotel}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* ✅ Información adicional */}
          <div className="space-y-4">
            <input
              type="text"
              name="edades_ninos"
              placeholder="Edades de los niños (separadas por coma)"
              value={form.edades_ninos}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <textarea
              name="observaciones"
              placeholder="Observaciones y solicitudes especiales"
              value={form.observaciones}
              onChange={handleChange}
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* ✅ Botones de acción */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creando...
                </>
              ) : (
                'Crear Cotización'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuotePopup;