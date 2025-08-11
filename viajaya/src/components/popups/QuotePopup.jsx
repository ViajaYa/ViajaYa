import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { createQuote } from '../../redux/slices/quoteSlice';
import { checkEmailExists, clearEmailValidation, selectEmailValidation } from '../../redux/slices/userSlice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faUser, faCalendarAlt, faMapMarkerAlt, 
  faExclamationTriangle, faCheck, faSearch  } from '@fortawesome/free-solid-svg-icons';
import { useRolePermissions } from '../../redux/hooks/hooks';

const QuotePopup = ({ isOpen, onClose, prefilledData = {} }) => {
  const dispatch = useDispatch();
  const auth = useSelector(state => state.auth);
  const emailValidation = useSelector(selectEmailValidation); // ✅ Usar selector
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
    // ✅ NUEVOS CAMPOS DETALLADOS DE PASAJEROS
    adultos: prefilledData.adultos || 1,
    menores: prefilledData.menores || 0,
    infantes: prefilledData.infantes || 0,
    edades_menores: prefilledData.edades_menores || [],
    edades_infantes: prefilledData.edades_infantes || [],
    personas_atencion_especial: prefilledData.personas_atencion_especial || 0,
    detalles_atencion_especial: prefilledData.detalles_atencion_especial || '',
    acomodacion: prefilledData.acomodacion || 'doble',
    tipo_hotel: prefilledData.tipo_hotel || 'basico',
    ninos: prefilledData.ninos || 0, // ⚠️ LEGACY: mantener por compatibilidad
    edades_ninos: prefilledData.edades_ninos || '', // ⚠️ LEGACY: mantener por compatibilidad
    observaciones: prefilledData.observaciones || '',
    cliente_id: null
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // ✅ Recalcular número total de personas automáticamente
  useEffect(() => {
    const total = (parseInt(form.adultos) || 0) + (parseInt(form.menores) || 0) + (parseInt(form.infantes) || 0);
    if (total !== form.numero_personas) {
      setForm(prev => ({ ...prev, numero_personas: total }));
    }
  }, [form.adultos, form.menores, form.infantes]);

  // ✅ Función para agregar/quitar edades de menores
  const handleEdadMenor = (index, edad) => {
    const nuevasEdades = [...form.edades_menores];
    if (edad === '') {
      nuevasEdades.splice(index, 1);
    } else {
      nuevasEdades[index] = parseInt(edad);
    }
    setForm(prev => ({ ...prev, edades_menores: nuevasEdades }));
  };

  // ✅ Función para agregar/quitar edades de infantes (en meses)
  const handleEdadInfante = (index, meses) => {
    const nuevasEdades = [...form.edades_infantes];
    if (meses === '') {
      nuevasEdades.splice(index, 1);
    } else {
      nuevasEdades[index] = parseInt(meses);
    }
    setForm(prev => ({ ...prev, edades_infantes: nuevasEdades }));
  };

   useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (form.email_cliente && form.email_cliente.trim() && /\S+@\S+\.\S+/.test(form.email_cliente)) {
        dispatch(checkEmailExists(form.email_cliente.trim().toLowerCase()));
      } else {
        dispatch(clearEmailValidation());
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [form.email_cliente, dispatch]);

  // ✅ Autocompletar cuando se encuentra usuario
  // ✅ Autocompletar cuando se encuentra usuario
useEffect(() => {
  if (emailValidation.exists && emailValidation.userData) {
    const userData = emailValidation.userData;
    setForm(prev => ({
      ...prev,
      cliente_id: userData.id, // ✅ AGREGAR: Guardar ID del cliente existente
      nombre_cliente: userData.name && userData.lastname 
        ? `${userData.name} ${userData.lastname}`
        : prev.nombre_cliente,
      telefono_cliente: userData.phone || prev.telefono_cliente
    }));
  } else {
    // ✅ AGREGAR: Limpiar cliente_id si no existe el usuario
    setForm(prev => ({
      ...prev,
      cliente_id: null
    }));
  }
}, [emailValidation.exists, emailValidation.userData]);

  // ✅ Renderizar indicador de estado del email
  const renderEmailStatus = () => {
    if (emailValidation.isChecking) {
      return (
        <div className="flex items-center text-blue-500 text-sm mt-1">
          <FontAwesomeIcon icon={faSearch} className="animate-spin mr-1" />
          Verificando email...
        </div>
      );
    }

    if (emailValidation.exists && emailValidation.userData) {
      return (
        <div className="flex items-center text-green-500 text-sm mt-1">
          <FontAwesomeIcon icon={faCheck} className="mr-1" />
          Cliente encontrado - Datos autocompletados
        </div>
      );
    }

    if (!emailValidation.isChecking && form.email_cliente && /\S+@\S+\.\S+/.test(form.email_cliente) && !emailValidation.exists) {
      return (
        <div className="flex items-center text-orange-500 text-sm mt-1">
          <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1" />
          Cliente nuevo - Complete los datos
        </div>
      );
    }

    return null;
  };

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
    
    // ✅ Validaciones de pasajeros
    const totalPasajeros = (form.adultos || 0) + (form.menores || 0) + (form.infantes || 0);
    if (totalPasajeros < 1) {
      newErrors.numero_personas = 'Debe haber al menos 1 pasajero';
    }
    
    if (form.adultos < 0) {
      newErrors.adultos = 'El número de adultos no puede ser negativo';
    }
    
    if (form.menores < 0) {
      newErrors.menores = 'El número de menores no puede ser negativo';
    }
    
    if (form.infantes < 0) {
      newErrors.infantes = 'El número de infantes no puede ser negativo';
    }
    
    // ✅ Validar edades de menores
    if (form.menores > 0 && form.edades_menores.length !== form.menores) {
      newErrors.edades_menores = 'Debe especificar la edad de todos los menores';
    }
    
    if (form.edades_menores.some(edad => edad < 2 || edad > 14)) {
      newErrors.edades_menores = 'Las edades de menores deben estar entre 2 y 14 años';
    }
    
    // ✅ Validar edades de infantes
    if (form.infantes > 0 && form.edades_infantes.length !== form.infantes) {
      newErrors.edades_infantes = 'Debe especificar la edad de todos los infantes';
    }
    
    if (form.edades_infantes.some(meses => meses < 0 || meses >= 24)) {
      newErrors.edades_infantes = 'Las edades de infantes deben estar entre 0 y 23 meses';
    }
    
    // ✅ Validar personas con atención especial
    if (form.personas_atencion_especial > totalPasajeros) {
      newErrors.personas_atencion_especial = 'No puede haber más personas con atención especial que el total de pasajeros';
    }
    
    if (form.fecha_ida && form.fecha_regreso && new Date(form.fecha_ida) >= new Date(form.fecha_regreso)) {
      newErrors.fecha_regreso = 'La fecha de regreso debe ser posterior a la fecha de ida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = e => {
    const { name, value } = e.target;
    
    // ✅ Manejar campos numéricos especiales
    if (['adultos', 'menores', 'infantes', 'personas_atencion_especial', 'numero_personas', 'ninos'].includes(name)) {
      const numValue = parseInt(value) || 0;
      setForm(prev => ({ ...prev, [name]: Math.max(0, numValue) }));
      
      // ✅ Si se cambia menores, ajustar array de edades
      if (name === 'menores') {
        const currentEdades = form.edades_menores.length;
        const newCount = numValue;
        
        if (newCount > currentEdades) {
          // Agregar slots vacíos
          const nuevasEdades = [...form.edades_menores, ...Array(newCount - currentEdades).fill(2)];
          setForm(prev => ({ ...prev, edades_menores: nuevasEdades }));
        } else if (newCount < currentEdades) {
          // Remover edades extra
          const nuevasEdades = form.edades_menores.slice(0, newCount);
          setForm(prev => ({ ...prev, edades_menores: nuevasEdades }));
        }
      }
      
      // ✅ Si se cambia infantes, ajustar array de edades en meses
      if (name === 'infantes') {
        const currentEdades = form.edades_infantes.length;
        const newCount = numValue;
        
        if (newCount > currentEdades) {
          // Agregar slots vacíos (6 meses por defecto)
          const nuevasEdades = [...form.edades_infantes, ...Array(newCount - currentEdades).fill(6)];
          setForm(prev => ({ ...prev, edades_infantes: nuevasEdades }));
        } else if (newCount < currentEdades) {
          // Remover edades extra
          const nuevasEdades = form.edades_infantes.slice(0, newCount);
          setForm(prev => ({ ...prev, edades_infantes: nuevasEdades }));
        }
      }
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
    
    // Limpiar error específico
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }

    if (name === 'email_cliente') {
      dispatch(clearEmailValidation());
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

    // ✅ CLAVE: Preparar datos del cliente (desde DB si existe, sino desde el formulario)
    const getClientData = () => {
      // ✅ Usar cliente_id del estado (ya se setea en useEffect)
      const baseData = {
        cliente_id: form.cliente_id, // ✅ Usar del estado
        destino: form.destino,
        origen: form.origen,
        fecha_ida: form.fecha_ida,
        fecha_regreso: form.fecha_regreso,
        numero_personas: form.numero_personas,
        // ✅ NUEVOS CAMPOS DETALLADOS DE PASAJEROS
        adultos: form.adultos,
        menores: form.menores,
        infantes: form.infantes,
        edades_menores: form.edades_menores,
        edades_infantes: form.edades_infantes,
        personas_atencion_especial: form.personas_atencion_especial,
        detalles_atencion_especial: form.detalles_atencion_especial,
        acomodacion: form.acomodacion,
        tipo_hotel: form.tipo_hotel,
        ninos: form.ninos, // ⚠️ LEGACY: mantener por compatibilidad
        edades_ninos: form.edades_ninos, // ⚠️ LEGACY: mantener por compatibilidad
        observaciones: form.observaciones
      };

      if (emailValidation.exists && emailValidation.userData) {
        // Usuario existe - usar datos de DB
        const userData = emailValidation.userData;
        return {
          ...baseData,
          nombre_cliente: `${userData.name} ${userData.lastname}`.trim(),
          email_cliente: userData.email,
          telefono_cliente: userData.phone || form.telefono_cliente
        };
      } else {
        // Cliente nuevo - usar datos del formulario
        return {
          ...baseData,
          nombre_cliente: form.nombre_cliente,
          email_cliente: form.email_cliente,
          telefono_cliente: form.telefono_cliente
        };
      }
    };

    const payload = {
      ...getClientData(), // ✅ Usar datos del cliente (DB o formulario)
      ...(isAuthenticated && user ? getRolePayload(user) : {}), // ✅ Datos del creador
      created_at: new Date().toISOString(),
      status: 'pending'
    };

    console.log('✅ Payload de cotización:', payload);
    console.log('✅ Cliente desde DB:', emailValidation.exists ? 'SÍ' : 'NO');
    console.log('✅ Datos del cliente:', {
      nombre: payload.nombre_cliente,
      email: payload.email_cliente,
      telefono: payload.telefono_cliente,
      cliente_id: payload.cliente_id || 'N/A'
    });

    await dispatch(createQuote(payload)).unwrap();

    alert('Cotización creada exitosamente');
   
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
      {/* ✅ Agregar indicador de estado */}
      {renderEmailStatus()}
    </div>
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
                placeholder="Origen (Colombia) *"
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
                  min={form.fecha_ida || undefined}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.fecha_regreso ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <label className="text-xs text-gray-500">Fecha de regreso</label>
                {errors.fecha_regreso && <p className="text-red-500 text-xs mt-1">{errors.fecha_regreso}</p>}
              </div>
            </div>
          </div>

          {/* ✅ NUEVA SECCIÓN: Información detallada de pasajeros */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <FontAwesomeIcon icon={faUser} className="mr-2 text-blue-500" />
              Información de Pasajeros
            </h3>
            
            {/* Resumen total */}
            <div className="bg-white p-3 rounded-lg mb-4 border-l-4 border-blue-500">
              <p className="text-lg font-bold text-blue-800">
                Total de pasajeros: {form.numero_personas}
              </p>
              <p className="text-sm text-gray-600">
                {form.adultos} adulto(s) + {form.menores} menor(es) + {form.infantes} infante(s)
              </p>
            </div>

            {/* Campos de conteo por categoría */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <input
                  type="number"
                  name="adultos"
                  placeholder="Adultos (14+ años)"
                  value={form.adultos}
                  onChange={handleChange}
                  min={0}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.adultos ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <label className="text-xs text-gray-500">Adultos (14+ años) *</label>
                {errors.adultos && <p className="text-red-500 text-xs mt-1">{errors.adultos}</p>}
              </div>

              <div>
                <input
                  type="number"
                  name="menores"
                  placeholder="Menores (2-14 años)"
                  value={form.menores}
                  onChange={handleChange}
                  min={0}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.menores ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <label className="text-xs text-gray-500">Menores (2-14 años)</label>
                {errors.menores && <p className="text-red-500 text-xs mt-1">{errors.menores}</p>}
              </div>

              <div>
                <input
                  type="number"
                  name="infantes"
                  placeholder="Infantes (<2 años)"
                  value={form.infantes}
                  onChange={handleChange}
                  min={0}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.infantes ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <label className="text-xs text-gray-500">Infantes (&lt;2 años)</label>
                {errors.infantes && <p className="text-red-500 text-xs mt-1">{errors.infantes}</p>}
              </div>
            </div>

            {/* Edades específicas de menores */}
            {form.menores > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Edades específicas de menores (2-14 años):
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Array.from({ length: form.menores }, (_, index) => (
                    <div key={index}>
                      <input
                        type="number"
                        placeholder={`Menor ${index + 1}`}
                        value={form.edades_menores[index] || ''}
                        onChange={(e) => handleEdadMenor(index, e.target.value)}
                        min={2}
                        max={14}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <label className="text-xs text-gray-500">años</label>
                    </div>
                  ))}
                </div>
                {errors.edades_menores && <p className="text-red-500 text-xs mt-1">{errors.edades_menores}</p>}
              </div>
            )}

            {/* Edades específicas de infantes */}
            {form.infantes > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Edades específicas de infantes (en meses):
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Array.from({ length: form.infantes }, (_, index) => (
                    <div key={index}>
                      <input
                        type="number"
                        placeholder={`Infante ${index + 1}`}
                        value={form.edades_infantes[index] || ''}
                        onChange={(e) => handleEdadInfante(index, e.target.value)}
                        min={0}
                        max={23}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <label className="text-xs text-gray-500">meses</label>
                    </div>
                  ))}
                </div>
                {errors.edades_infantes && <p className="text-red-500 text-xs mt-1">{errors.edades_infantes}</p>}
              </div>
            )}

            {/* Atención especial */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  type="number"
                  name="personas_atencion_especial"
                  placeholder="Personas con necesidades especiales"
                  value={form.personas_atencion_especial}
                  onChange={handleChange}
                  min={0}
                  max={form.numero_personas}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.personas_atencion_especial ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <label className="text-xs text-gray-500">Atención especial</label>
                {errors.personas_atencion_especial && <p className="text-red-500 text-xs mt-1">{errors.personas_atencion_especial}</p>}
              </div>

              {form.personas_atencion_especial > 0 && (
                <div>
                  <textarea
                    name="detalles_atencion_especial"
                    placeholder="Detalles de las necesidades especiales..."
                    value={form.detalles_atencion_especial}
                    onChange={handleChange}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <label className="text-xs text-gray-500">Detalles específicos</label>
                </div>
              )}
            </div>
          </div>

          {/* ✅ Preferencias de alojamiento mejoradas */}
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Preferencias de Alojamiento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <select
                  name="tipo_hotel"
                  value={form.tipo_hotel}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="basico">Hotel Básico</option>
                  <option value="superior">Hotel Superior</option>
                </select>
                <label className="text-xs text-gray-500">Tipo de hotel</label>
              </div>

              <div>
                <select
                  name="acomodacion"
                  value={form.acomodacion}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="sencilla">Habitación Sencilla</option>
                  <option value="doble">Habitación Doble</option>
                  <option value="triple">Habitación Triple</option>
                  <option value="cuadruple">Habitación Cuádruple</option>
                </select>
                <label className="text-xs text-gray-500">Tipo de acomodación</label>
              </div>
            </div>
         </div>

          {/* ✅ Información adicional y compatibilidad legacy */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            
            </div>
            
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