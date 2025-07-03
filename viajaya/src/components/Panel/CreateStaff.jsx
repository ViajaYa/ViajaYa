import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faEnvelope,
  faPhone,
  faLock,
  faUserTie,
  faImage,
  faUsers,
  faSave,
  faArrowLeft,
  faSpinner,
  faEye,
  faEyeSlash,
  faShieldAlt,
  faExclamationTriangle,
  faCheckCircle,
  faBuilding,
  faIdCard,
  faCalendarAlt,
  faMapMarkerAlt,
  faUniversity,
  faCreditCard,
  faPercentage
} from '@fortawesome/free-solid-svg-icons';

// ✅ Importar acciones del userSlice
import {
  registerUser,
  fetchAllUsers,
  clearUserError
} from '../../redux/slices/userSlice';

// ✅ Importar selectores de auth
import { selectUser } from '../../redux/slices/authSlice';

// ✅ Importar componentes
import NavBar from '../layout/NavBar/NavBar';

const CreateStaff = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // ✅ Selectores de Redux
  const currentUser = useSelector(selectUser);
  const { loading, error } = useSelector(state => state.user);

  // ✅ Estados del formulario ACTUALIZADO con todos los nuevos campos
  const [formData, setFormData] = useState({
    // Información básica
    name: '',
    lastname: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 2, // Asesor por defecto
    image: '',
    
    // ✅ NUEVOS campos de jerarquía organizacional
    lider_id: null,
    gerente_id: null,
    
    // Estados
    is_active: true,
    is_active_seller: false,
    
    // Referidos
    referral_code: '',
    referred_by: '',
    
    // ✅ NUEVOS campos de comisiones
    commission_percentage: '',
    commission_limit: 1400000.00,
    
    // ✅ NUEVOS campos bancarios
    banco: '',
    numero_cuenta: '',
    tipo_cuenta: '',
    
    // ✅ NUEVOS campos de información personal
    documento_identidad: '',
    tipo_documento: '',
    fecha_nacimiento: '',
    fecha_ingreso: new Date().toISOString().split('T')[0], // Fecha actual por defecto
    direccion: '',
    ciudad: '',
    pais: 'Colombia',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // ✅ Definir roles según tu sistema ACTUALIZADO
  const roleOptions = [
    { value: 1, label: 'Cliente', description: 'Cliente con cotizaciones', color: 'bg-gray-100 text-gray-800' },
    { value: 2, label: 'Asesor', description: 'Vendedor básico', color: 'bg-blue-100 text-blue-800' },
    { value: 3, label: 'Líder', description: 'Líder de equipo', color: 'bg-green-100 text-green-800' },
    { value: 4, label: 'Gerente', description: 'Gerente regional', color: 'bg-orange-100 text-orange-800' },
    { value: 5, label: 'Admin', description: 'Administrador', color: 'bg-red-100 text-red-800' },
    { value: 6, label: 'Contador', description: 'Manejo contable', color: 'bg-purple-100 text-purple-800' },
    { value: 7, label: 'Owner', description: 'Propietario', color: 'bg-indigo-100 text-indigo-800' },
  ];

  // ✅ NUEVAS opciones para campos específicos
  const tipoDocumentoOptions = [
    { value: 'cc', label: 'Cédula de Ciudadanía (CC)' },
  { value: 'ce', label: 'Cédula de Extranjería (CE)' },
  { value: 'ti', label: 'Tarjeta de Identidad (TI)' },
  { value: 'rc', label: 'Registro Civil (RC)' },
  { value: 'passport', label: 'Pasaporte' },
  { value: 'pep', label: 'Permiso Especial de Permanencia (PEP)' },
  { value: 'ppt', label: 'Permiso por Protección Temporal (PPT)' },
  { value: 'nit', label: 'Número de Identificación Tributaria (NIT)' },
  { value: 'nuip', label: 'Número Único de Identificación Personal (NUIP)' },
  { value: 'dni', label: 'Documento Nacional de Identidad (DNI)' },
  { value: 'salvoconducto', label: 'Salvoconducto' },
  { value: 'cedula_diplomatica', label: 'Cédula Diplomática' },
];

  const tipoCuentaOptions = [
    { value: 'ahorros', label: 'Cuenta de Ahorros' },
    { value: 'corriente', label: 'Cuenta Corriente' },
  ];

  // ✅ Estados para usuarios disponibles según jerarquía
  const [availableLideres, setAvailableLideres] = useState([]);
  const [availableGerentes, setAvailableGerentes] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  // ✅ Cargar usuarios existentes para jerarquía
  useEffect(() => {
    dispatch(fetchAllUsers()).then((result) => {
      if (result.payload) {
        setAllUsers(result.payload);
        
        // Filtrar líderes (rol 3)
        const lideres = result.payload.filter(user => user.role === 3 && user.is_active);
        setAvailableLideres(lideres);
        
        // Filtrar gerentes (rol 4)
        const gerentes = result.payload.filter(user => user.role === 4 && user.is_active);
        setAvailableGerentes(gerentes);
      }
    });
  }, [dispatch]);

  // ✅ Limpiar errores
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearUserError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  // ✅ Limpiar mensaje de éxito
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // ✅ Manejo de cambios en el formulario ACTUALIZADO
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Limpiar error específico
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }

    // ✅ NUEVA lógica para manejar jerarquía automática
    if (name === 'role') {
      const roleValue = parseInt(value);
      
      // Auto-configurar según el rol
      let updates = {
        role: roleValue,
        is_active_seller: roleValue <= 4, // Roles 1-4 son vendedores
      };

      // ✅ Limpiar jerarquía según el rol
      switch (roleValue) {
        case 1: // Cliente
        case 5: // Admin  
        case 6: // Contador
        case 7: // Owner
          updates.lider_id = null;
          updates.gerente_id = null;
          updates.is_active_seller = roleValue <= 4;
          break;
        case 2: // Asesor - requiere líder
          updates.gerente_id = null; // Se asignará automáticamente
          break;
        case 3: // Líder - requiere gerente
          updates.lider_id = null;
          break;
        case 4: // Gerente
          updates.lider_id = null;
          updates.gerente_id = null;
          break;
      }

      setFormData(prev => ({ ...prev, ...updates }));
    }

    // ✅ Auto-asignar gerente cuando se selecciona líder
    if (name === 'lider_id' && value) {
      const selectedLider = availableLideres.find(lider => lider.id === parseInt(value));
      if (selectedLider && selectedLider.gerente_id) {
        setFormData(prev => ({
          ...prev,
          gerente_id: selectedLider.gerente_id
        }));
      }
    }
  };

  // ✅ Generar código de referido UUID
  const generateReferralCode = () => {
    const fullUuid = uuidv4();
    setFormData(prev => ({ ...prev, referral_code: fullUuid }));
  };

  // ✅ Validación del formulario ACTUALIZADA
  const validateForm = () => {
    const newErrors = {};

    // Validaciones básicas
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    if (!formData.lastname.trim()) {
      newErrors.lastname = 'El apellido es requerido';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Formato de email inválido';
      }
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    }
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirma la contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }
    if (!formData.role) {
      newErrors.role = 'Selecciona un rol';
    }

    // ✅ NUEVAS validaciones de jerarquía
    const role = parseInt(formData.role);
    
    if (role === 2 && !formData.lider_id) {
      newErrors.lider_id = 'Un Asesor debe tener un Líder asignado';
    }
    
    if (role === 3 && !formData.gerente_id) {
      newErrors.gerente_id = 'Un Líder debe tener un Gerente asignado';
    }

    // ✅ Validaciones de comisión
    if (formData.commission_percentage && (
      isNaN(formData.commission_percentage) || 
      formData.commission_percentage < 0 || 
      formData.commission_percentage > 100
    )) {
      newErrors.commission_percentage = 'El porcentaje debe estar entre 0 y 100';
    }

    // ✅ Validaciones bancarias (si se proporcionan)
    if (formData.numero_cuenta && !formData.banco) {
      newErrors.banco = 'El banco es requerido si proporcionas número de cuenta';
    }
    if (formData.banco && !formData.numero_cuenta) {
      newErrors.numero_cuenta = 'El número de cuenta es requerido si proporcionas banco';
    }

    // Validación de permisos
    if (currentUser?.role && parseInt(formData.role) >= currentUser.role) {
      newErrors.role = 'No puedes crear usuarios con rol igual o superior al tuyo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Enviar formulario ACTUALIZADO
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaveLoading(true);
    try {
      // ✅ Preparar datos para envío con TODOS los nuevos campos
      const userData = {
        // Información básica
        name: formData.name.trim(),
        lastname: formData.lastname.trim(),
        email: formData.email.toLowerCase().trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: parseInt(formData.role),
        image: formData.image.trim() || null,
        
        // ✅ Jerarquía organizacional
        lider_id: formData.lider_id || null,
        gerente_id: formData.gerente_id || null,
        
        // Estados
        is_active: formData.is_active,
        is_active_seller: formData.is_active_seller,
        
        // Referidos
        referral_code: formData.referral_code.trim() || null,
        referred_by: formData.referred_by.trim() || null,
        
        // ✅ Comisiones
        commission_percentage: formData.commission_percentage ? parseFloat(formData.commission_percentage) : null,
        commission_limit: parseFloat(formData.commission_limit),
        
        // ✅ Información bancaria
        banco: formData.banco.trim() || null,
        numero_cuenta: formData.numero_cuenta.trim() || null,
        tipo_cuenta: formData.tipo_cuenta || null,
        
        // ✅ Información personal
        documento_identidad: formData.documento_identidad.trim() || null,
        tipo_documento: formData.tipo_documento || null,
        fecha_nacimiento: formData.fecha_nacimiento || null,
        fecha_ingreso: formData.fecha_ingreso || new Date().toISOString().split('T')[0],
        direccion: formData.direccion.trim() || null,
        ciudad: formData.ciudad.trim() || null,
        pais: formData.pais.trim() || 'Colombia',
      };

      console.log('✅ Datos a enviar:', userData);

      const result = await dispatch(registerUser(userData)).unwrap();
      
      // Éxito
      setSuccessMessage('Usuario creado exitosamente con toda la información organizacional');
      
      // ✅ Limpiar formulario ACTUALIZADO
      setFormData({
        name: '',
        lastname: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: 2,
        image: '',
        lider_id: null,
        gerente_id: null,
        is_active: true,
        is_active_seller: false,
        referral_code: '',
        referred_by: '',
        commission_percentage: '',
        commission_limit: 1400000.00,
        banco: '',
        numero_cuenta: '',
        tipo_cuenta: '',
        documento_identidad: '',
        tipo_documento: '',
        fecha_nacimiento: '',
        fecha_ingreso: new Date().toISOString().split('T')[0],
        direccion: '',
        ciudad: '',
        pais: 'Colombia',
      });

      // Opcional: Redirigir después de 2 segundos
      setTimeout(() => {
        navigate('/panel/users');
      }, 2000);

    } catch (error) {
      console.error('Error creando usuario:', error);
    } finally {
      setSaveLoading(false);
    }
  };

  // ✅ Obtener información del rol seleccionado
  const selectedRole = roleOptions.find(role => role.value === parseInt(formData.role));

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
                onClick={() => navigate('/panel/users')}
                className="mr-4 p-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <FontAwesomeIcon icon={faArrowLeft} size="lg" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <FontAwesomeIcon icon={faUserTie} className="mr-3 text-blue-500" />
                  Crear Usuario de Staff
                </h1>
                <p className="text-gray-600">
                  Registra un nuevo miembro del equipo con estructura organizacional completa
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mensajes */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex items-center">
            <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6 flex items-center">
            <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
            {successMessage}
          </div>
        )}

        {/* Formulario */}
        <div className="bg-white rounded-lg shadow-md">
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            
            {/* ✅ 1. Información Personal */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FontAwesomeIcon icon={faUser} className="mr-2 text-blue-500" />
                Información Personal
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nombre"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    name="lastname"
                    value={formData.lastname}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.lastname ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Apellido"
                  />
                  {errors.lastname && <p className="text-red-500 text-sm mt-1">{errors.lastname}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FontAwesomeIcon icon={faEnvelope} className="mr-1" />
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="usuario@empresa.com"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FontAwesomeIcon icon={faPhone} className="mr-1" />
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="+57 300 123 4567"
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FontAwesomeIcon icon={faImage} className="mr-1" />
                    URL de Imagen (Opcional)
                  </label>
                  <input
                    type="url"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                </div>
              </div>
            </div>

            {/* ✅ 2. Identificación y Documentos */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FontAwesomeIcon icon={faIdCard} className="mr-2 text-green-500" />
                Identificación y Documentos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Documento
                  </label>
                  <select
                    name="tipo_documento"
                    value={formData.tipo_documento}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar tipo</option>
                    {tipoDocumentoOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Documento
                  </label>
                  <input
                    type="text"
                    name="documento_identidad"
                    value={formData.documento_identidad}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-1" />
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    name="fecha_nacimiento"
                    value={formData.fecha_nacimiento}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* ✅ 3. Ubicación */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-red-500" />
                Ubicación
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección
                  </label>
                  <input
                    type="text"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Calle 123 #45-67"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    name="ciudad"
                    value={formData.ciudad}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Bogotá"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    País
                  </label>
                  <input
                    type="text"
                    name="pais"
                    value={formData.pais}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Colombia"
                  />
                </div>
              </div>
            </div>

            {/* ✅ 4. Credenciales */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FontAwesomeIcon icon={faLock} className="mr-2 text-purple-500" />
                Credenciales de Acceso
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 ${
                        errors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Mínimo 6 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Contraseña *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 ${
                        errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Repite la contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>
            </div>

            {/* ✅ 5. Rol y Jerarquía Organizacional */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FontAwesomeIcon icon={faShieldAlt} className="mr-2 text-indigo-500" />
                Rol y Jerarquía Organizacional
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rol del Usuario *
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.role ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Selecciona un rol</option>
                    {roleOptions
                      .filter(role => !currentUser?.role || role.value < currentUser.role)
                      .map(role => (
                        <option key={role.value} value={role.value}>
                          {role.label} - {role.description}
                        </option>
                      ))
                    }
                  </select>
                  {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role}</p>}
                  
                  {selectedRole && (
                    <div className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedRole.color}`}>
                      {selectedRole.label}: {selectedRole.description}
                    </div>
                  )}
                </div>

                {/* ✅ Mostrar selector de líder solo para Asesores */}
                {parseInt(formData.role) === 2 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FontAwesomeIcon icon={faUsers} className="mr-1" />
                      Líder Asignado *
                    </label>
                    <select
                      name="lider_id"
                      value={formData.lider_id || ''}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.lider_id ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Seleccionar líder</option>
                      {availableLideres.map(lider => (
                        <option key={lider.id} value={lider.id}>
                          {lider.name} {lider.lastname}
                        </option>
                      ))}
                    </select>
                    {errors.lider_id && <p className="text-red-500 text-sm mt-1">{errors.lider_id}</p>}
                  </div>
                )}

                {/* ✅ Mostrar selector de gerente para Líderes */}
                {parseInt(formData.role) === 3 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FontAwesomeIcon icon={faBuilding} className="mr-1" />
                      Gerente Asignado *
                    </label>
                    <select
                      name="gerente_id"
                      value={formData.gerente_id || ''}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.gerente_id ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Seleccionar gerente</option>
                      {availableGerentes.map(gerente => (
                        <option key={gerente.id} value={gerente.id}>
                          {gerente.name} {gerente.lastname}
                        </option>
                      ))}
                    </select>
                    {errors.gerente_id && <p className="text-red-500 text-sm mt-1">{errors.gerente_id}</p>}
                  </div>
                )}

                {/* ✅ Mostrar gerente auto-asignado para Asesores */}
                {parseInt(formData.role) === 2 && formData.gerente_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gerente (Auto-asignado)
                    </label>
                    <input
                      type="text"
                      value={(() => {
                        const gerente = availableGerentes.find(g => g.id === formData.gerente_id);
                        return gerente ? `${gerente.name} ${gerente.lastname}` : '';
                      })()}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-1" />
                    Fecha de Ingreso
                  </label>
                  <input
                    type="date"
                    name="fecha_ingreso"
                    value={formData.fecha_ingreso}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* ✅ Estados */}
              <div className="mt-6 space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    Usuario activo (puede iniciar sesión)
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active_seller"
                    checked={formData.is_active_seller}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    Habilitado como vendedor (puede gestionar ventas)
                  </span>
                </label>
              </div>
            </div>

            {/* ✅ 6. Comisiones */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FontAwesomeIcon icon={faPercentage} className="mr-2 text-green-500" />
                Configuración de Comisiones
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Porcentaje de Comisión (%)
                  </label>
                  <input
                    type="number"
                    name="commission_percentage"
                    value={formData.commission_percentage}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    step="0.01"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.commission_percentage ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ej: 5.00"
                  />
                  {errors.commission_percentage && <p className="text-red-500 text-sm mt-1">{errors.commission_percentage}</p>}
                  <p className="text-sm text-gray-500 mt-1">
                    Porcentaje específico de comisión para este usuario
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Límite de Comisión (COP)
                  </label>
                  <input
                    type="number"
                    name="commission_limit"
                    value={formData.commission_limit}
                    onChange={handleInputChange}
                    min="0"
                    step="1000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1400000"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Límite para documentos soporte
                  </p>
                </div>
              </div>
            </div>

            {/* ✅ 7. Información Bancaria */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FontAwesomeIcon icon={faUniversity} className="mr-2 text-blue-500" />
                Información Bancaria (Opcional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banco
                  </label>
                  <input
                    type="text"
                    name="banco"
                    value={formData.banco}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.banco ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Banco de Colombia"
                  />
                  {errors.banco && <p className="text-red-500 text-sm mt-1">{errors.banco}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FontAwesomeIcon icon={faCreditCard} className="mr-1" />
                    Número de Cuenta
                  </label>
                  <input
                    type="text"
                    name="numero_cuenta"
                    value={formData.numero_cuenta}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.numero_cuenta ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="1234567890"
                  />
                  {errors.numero_cuenta && <p className="text-red-500 text-sm mt-1">{errors.numero_cuenta}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Cuenta
                  </label>
                  <select
                    name="tipo_cuenta"
                    value={formData.tipo_cuenta}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar tipo</option>
                    {tipoCuentaOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* ✅ 8. Códigos de Referido */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FontAwesomeIcon icon={faUsers} className="mr-2 text-orange-500" />
                Códigos de Referido
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código de Referido del Usuario (UUID)
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      name="referral_code"
                      value={formData.referral_code}
                      onChange={handleInputChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      placeholder="UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      readOnly
                    />
                    <button
                      type="button"
                      onClick={generateReferralCode}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Generar UUID
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    UUID único que otros usuarios pueden usar para registrarse bajo este usuario
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Referido Por (Opcional)
                  </label>
                  <input
                    type="text"
                    name="referred_by"
                    value={formData.referred_by}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    placeholder="UUID del usuario que lo refirió"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Si este usuario fue referido por otro usuario
                  </p>
                </div>
              </div>
            </div>

          </form>

          {/* ✅ Botones de acción */}
          <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/panel/users')}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={saveLoading}
              className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              {saveLoading ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : (
                <FontAwesomeIcon icon={faSave} />
              )}
              Crear Usuario Completo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateStaff;