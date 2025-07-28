import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaEye } from 'react-icons/fa';
import api from '../../../utils/api';
import { selectUser } from '../../../redux/slices/authSlice';
import NavBar from '../../layout/NavBar/NavBar';
import { Link } from 'react-router-dom';

const CommissionConfigManager = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectUser);

  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados del formulario
  const [formData, setFormData] = useState({
    role: 'asesor',
    trip_type: 'nacional',
    calculation_type: 'fixed_per_person',
    amount_per_person: '',
    percentage: '',
    fixed_amount: '',
    min_amount: '',
    max_amount: '',
    effective_from: new Date().toISOString().split('T')[0]
  });

  // Opciones para los selects
  const roleOptions = [
    { value: 'asesor', label: 'Asesor', color: 'bg-blue-100 text-blue-800' },
    { value: 'lider', label: 'Líder', color: 'bg-green-100 text-green-800' },
    { value: 'gerente', label: 'Gerente', color: 'bg-orange-100 text-orange-800' },
    { value: 'admin', label: 'Admin', color: 'bg-red-100 text-red-800' },
    { value: 'owner', label: 'Owner', color: 'bg-purple-100 text-purple-800' }
  ];

  const tripTypeOptions = [
    { value: 'nacional', label: 'Viajes Nacionales', color: 'bg-emerald-100 text-emerald-800' },
    { value: 'internacional', label: 'Viajes Internacionales', color: 'bg-indigo-100 text-indigo-800' }
  ];

  const calculationTypeOptions = [
    { value: 'fixed_per_person', label: 'Monto Fijo por Persona', description: 'Ej: $50,000 por cada pasajero' },
    { value: 'percentage', label: 'Porcentaje del Total', description: 'Ej: 5% del valor total del contrato' },
    { value: 'fixed_total', label: 'Monto Fijo Total', description: 'Ej: $100,000 por contrato sin importar pasajeros' }
  ];

  // Cargar configuraciones al montar el componente
  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando configuraciones...');
      const response = await api.get('/commission-configs/configs');
      console.log('📡 Respuesta del servidor:', response.data);

      // La respuesta viene como { success: true, configs: [...] }
      if (response.data && response.data.success && Array.isArray(response.data.configs)) {
        setConfigs(response.data.configs);
        console.log('✅ Configuraciones cargadas:', response.data.configs.length);
      } else {
        console.warn('⚠️ Estructura de respuesta inesperada:', response.data);
        setConfigs([]);
      }
    } catch (error) {
      console.error('❌ Error cargando configuraciones:', error);
      console.error('📄 Detalle del error:', error.response?.data);
      setError(error.response?.data?.message || 'Error al cargar las configuraciones');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.role) errors.role = 'El rol es obligatorio';
    if (!formData.trip_type) errors.trip_type = 'El tipo de viaje es obligatorio';
    if (!formData.calculation_type) errors.calculation_type = 'El tipo de cálculo es obligatorio';

    // Validaciones según el tipo de cálculo
    if (formData.calculation_type === 'fixed_per_person') {
      if (!formData.amount_per_person || formData.amount_per_person === '' || parseFloat(formData.amount_per_person) <= 0) {
        errors.amount_per_person = 'El monto por persona debe ser mayor a 0';
      }
    }

    if (formData.calculation_type === 'percentage') {
      if (!formData.percentage || formData.percentage === '' || parseFloat(formData.percentage) <= 0) {
        errors.percentage = 'El porcentaje debe ser mayor a 0';
      }
      if (parseFloat(formData.percentage) > 100) {
        errors.percentage = 'El porcentaje no puede ser mayor a 100';
      }
    }

    if (formData.calculation_type === 'fixed_total') {
      if (!formData.fixed_amount || formData.fixed_amount === '' || parseFloat(formData.fixed_amount) <= 0) {
        errors.fixed_amount = 'El monto fijo total debe ser mayor a 0';
      }
    }

    // Validaciones opcionales
    if (formData.min_amount && formData.min_amount !== '' && parseFloat(formData.min_amount) < 0) {
      errors.min_amount = 'El monto mínimo no puede ser negativo';
    }

    if (formData.max_amount && formData.max_amount !== '' && parseFloat(formData.max_amount) < 0) {
      errors.max_amount = 'El monto máximo no puede ser negativo';
    }

    if (formData.min_amount && formData.max_amount &&
      formData.min_amount !== '' && formData.max_amount !== '' &&
      parseFloat(formData.min_amount) > parseFloat(formData.max_amount)) {
      errors.max_amount = 'El monto máximo debe ser mayor al mínimo';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setError('Por favor corrige los errores en el formulario');
      return;
    }

    try {
      setLoading(true);

      // ✅ Limpiar y preparar datos para envío
      const cleanData = {
        role: formData.role,
        trip_type: formData.trip_type,
        calculation_type: formData.calculation_type,
        effective_from: formData.effective_from
      };

      // Solo agregar campos numéricos si tienen valores válidos
      if (formData.amount_per_person && formData.amount_per_person !== '') {
        cleanData.amount_per_person = parseFloat(formData.amount_per_person);
      }

      if (formData.percentage && formData.percentage !== '') {
        cleanData.percentage = parseFloat(formData.percentage);
      }

      if (formData.fixed_amount && formData.fixed_amount !== '') {
        cleanData.fixed_amount = parseFloat(formData.fixed_amount);
      }

      if (formData.min_amount && formData.min_amount !== '') {
        cleanData.min_amount = parseFloat(formData.min_amount);
      }

      if (formData.max_amount && formData.max_amount !== '') {
        cleanData.max_amount = parseFloat(formData.max_amount);
      }

      console.log('🔄 Enviando configuración limpia:', cleanData);
      console.log('👤 Usuario actual:', currentUser);

      if (editingConfig) {
        console.log('✏️ Actualizando configuración ID:', editingConfig.id);
        await api.put(`/commission-configs/configs/${editingConfig.id}`, cleanData);
        setSuccess('Configuración actualizada exitosamente');
      } else {
        console.log('➕ Creando nueva configuración');
        await api.post('/commission-configs/configs', cleanData);
        setSuccess('Configuración creada exitosamente');
      }

      resetForm();
      await loadConfigs();

    } catch (error) {
      console.error('❌ Error guardando configuración:', error);
      console.error('📄 Respuesta del error:', error.response?.data);
      setError(error.response?.data?.message || 'Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      role: 'asesor',
      trip_type: 'nacional',
      calculation_type: 'fixed_per_person',
      amount_per_person: '',
      percentage: '',
      fixed_amount: '',
      min_amount: '',
      max_amount: '',
      effective_from: new Date().toISOString().split('T')[0]
    });
    setShowForm(false);
    setEditingConfig(null);
  };

  const handleEdit = (config) => {
    setEditingConfig(config);
    setFormData({
      role: config.role,
      trip_type: config.trip_type,
      calculation_type: config.calculation_type,
      amount_per_person: config.amount_per_person || '',
      percentage: config.percentage || '',
      fixed_amount: config.fixed_amount || '',
      min_amount: config.min_amount || '',
      max_amount: config.max_amount || '',
      effective_from: new Date().toISOString().split('T')[0]
    });
    setShowForm(true);
  };

  const handleDelete = async (configId) => {
    if (!window.confirm('¿Estás seguro de que quieres desactivar esta configuración?')) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/commission-configs/configs/${configId}`);
      setSuccess('Configuración desactivada exitosamente');
      await loadConfigs();
    } catch (error) {
      console.error('Error desactivando configuración:', error);
      setError('Error al desactivar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getRoleInfo = (role) => roleOptions.find(r => r.value === role) || {};
  const getTripTypeInfo = (tripType) => tripTypeOptions.find(t => t.value === tripType) || {};

  if (loading && configs.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-nunito">
      <div className='fixed top-0 left-0 z-50 w-full'>
        <NavBar />
      </div>
      <div className="mb-8 pt-20 p-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Configuración de Comisiones
            </h1>
            <p className="text-gray-600 mt-2">
              Configura los montos de comisión por rol y tipo de viaje
            </p>
          </div>
          <>
            <Link
              to="/panel"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Volver al Panel
            </Link>
          
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <FaPlus /> Nueva Configuración
          </button>
          </>
        </div>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
          <button
            onClick={() => setError('')}
            className="float-right text-red-500 hover:text-red-700"
          >
            <FaTimes />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {success}
          <button
            onClick={() => setSuccess('')}
            className="float-right text-green-500 hover:text-green-700"
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <div className="mb-8 bg-white rounded-lg shadow-lg p-6 border">
          <h2 className="text-xl font-semibold mb-4">
            {editingConfig ? 'Editar Configuración' : 'Nueva Configuración'}
          </h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Rol */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rol
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {roleOptions.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo de Viaje */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Viaje
              </label>
              <select
                name="trip_type"
                value={formData.trip_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {tripTypeOptions.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo de Cálculo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Cálculo
              </label>
              <select
                name="calculation_type"
                value={formData.calculation_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {calculationTypeOptions.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Campos condicionales según el tipo de cálculo */}
            {formData.calculation_type === 'fixed_per_person' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto por Persona *
                </label>
                <input
                  type="number"
                  name="amount_per_person"
                  value={formData.amount_per_person}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: 50000"
                  min="0"
                  step="1000"
                  required
                />
              </div>
            )}

            {formData.calculation_type === 'percentage' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Porcentaje (%) *
                </label>
                <input
                  type="number"
                  name="percentage"
                  value={formData.percentage}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: 5"
                  min="0"
                  max="100"
                  step="0.1"
                  required
                />
              </div>
            )}

            {formData.calculation_type === 'fixed_total' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto Fijo Total *
                </label>
                <input
                  type="number"
                  name="fixed_amount"
                  value={formData.fixed_amount}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: 100000"
                  min="0"
                  step="1000"
                  required
                />
              </div>
            )}

            {/* Monto Mínimo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto Mínimo (Opcional)
              </label>
              <input
                type="number"
                name="min_amount"
                value={formData.min_amount}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: 25000"
                min="0"
                step="1000"
              />
            </div>

            {/* Monto Máximo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto Máximo (Opcional)
              </label>
              <input
                type="number"
                name="max_amount"
                value={formData.max_amount}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: 200000"
                min="0"
                step="1000"
              />
            </div>

            {/* Botones */}
            <div className="md:col-span-2 lg:col-span-3 flex gap-2 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                <FaSave /> {editingConfig ? 'Actualizar' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg flex items-center gap-2"
              >
                <FaTimes /> Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla de Configuraciones */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Configuraciones Activas
          </h2>
        </div>

        {configs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No hay configuraciones registradas</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Crear Primera Configuración
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo de Viaje
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Configuración
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Efectiva Desde
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {configs.map((config) => {
                  const roleInfo = getRoleInfo(config.role);
                  const tripTypeInfo = getTripTypeInfo(config.trip_type);

                  return (
                    <tr key={config.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleInfo.color}`}>
                          {roleInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${tripTypeInfo.color}`}>
                          {tripTypeInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {config.calculation_type === 'fixed_per_person' && (
                            <span>{formatCurrency(config.amount_per_person)} por persona</span>
                          )}
                          {config.calculation_type === 'percentage' && (
                            <span>{config.percentage}% del total</span>
                          )}
                          {config.calculation_type === 'fixed_total' && (
                            <span>{formatCurrency(config.fixed_amount)} por contrato</span>
                          )}
                        </div>
                        {(config.min_amount || config.max_amount) && (
                          <div className="text-xs text-gray-500">
                            {config.min_amount && `Mín: ${formatCurrency(config.min_amount)}`}
                            {config.min_amount && config.max_amount && ' - '}
                            {config.max_amount && `Máx: ${formatCurrency(config.max_amount)}`}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(config.effective_from).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(config)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(config.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Desactivar"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommissionConfigManager;
