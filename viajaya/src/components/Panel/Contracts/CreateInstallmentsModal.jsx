import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes, faCoins, faCalendarAlt, faMoneyBillWave,
  faSpinner, faExclamationTriangle, faInfoCircle
} from '@fortawesome/free-solid-svg-icons';

const CreateInstallmentsModal = ({ item, onClose, onSubmit, creating }) => {
  const [formData, setFormData] = useState({
    tipo_pago: 'cuotas',
    numero_cuotas: 3,
    monto_total: item?.precio_total || 0,
    observaciones: '',
    proveedor: '',
    fecha_compra: new Date().toISOString().split('T')[0] // Fecha actual por defecto
  });

  const [cuotas, setCuotas] = useState([
    { numero: 1, monto: 0, fecha_vencimiento: '' },
    { numero: 2, monto: 0, fecha_vencimiento: '' },
    { numero: 3, monto: 0, fecha_vencimiento: '' }
  ]);

  const [errors, setErrors] = useState({});

  // Actualizar cuotas cuando cambie SOLO el número de cuotas (preservar montos existentes)
  const updateCuotas = useCallback((numeroCuotas) => {
    const nuevasCuotas = [];
    
    for (let i = 1; i <= numeroCuotas; i++) {
      const cuotaExistente = cuotas.find(c => c.numero === i);
      nuevasCuotas.push({
        numero: i,
        monto: cuotaExistente?.monto || 0, // Preservar monto existente o 0
        fecha_vencimiento: cuotaExistente?.fecha_vencimiento || ''
      });
    }
    
    setCuotas(nuevasCuotas);
  }, [cuotas]);

  // Inicializar cuotas cuando cambie SOLO el número de cuotas
  useEffect(() => {
    updateCuotas(formData.numero_cuotas);
  }, [formData.numero_cuotas, updateCuotas]);

  // Calcular monto por cuota
  const montoPorCuota = formData.monto_total / formData.numero_cuotas;

  // Distribuir monto total equitativamente entre cuotas
  const distribuirMontoEquitativo = () => {
    const montoPorCuota = formData.monto_total / formData.numero_cuotas;
    const nuevasCuotas = cuotas.map(cuota => ({
      ...cuota,
      monto: montoPorCuota
    }));
    setCuotas(nuevasCuotas);
  };

  // Sincronizar monto total con la suma de cuotas
  const sincronizarMontoTotal = () => {
    const sumaCuotas = cuotas.reduce((sum, cuota) => sum + cuota.monto, 0);
    setFormData(prev => ({
      ...prev,
      monto_total: sumaCuotas
    }));
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};

    if (!formData.numero_cuotas || formData.numero_cuotas < 2) {
      newErrors.numero_cuotas = 'Debe tener al menos 2 cuotas';
    }

    if (!formData.monto_total || formData.monto_total <= 0) {
      newErrors.monto_total = 'El monto total debe ser mayor a 0';
    }

    if (!formData.proveedor?.trim()) {
      newErrors.proveedor = 'El proveedor es requerido';
    }

    if (!formData.fecha_compra) {
      newErrors.fecha_compra = 'La fecha de compra es requerida';
    }

    // Validar fechas y montos de cuotas
    cuotas.forEach((cuota, index) => {
      if (!cuota.fecha_vencimiento) {
        newErrors[`fecha_cuota_${index}`] = `La fecha de la cuota ${cuota.numero} es requerida`;
      }
      if (!cuota.monto || cuota.monto <= 0) {
        newErrors[`monto_cuota_${index}`] = `El monto de la cuota ${cuota.numero} debe ser mayor a 0`;
      }
    });

    // Validar que la suma de cuotas coincida con el monto total
    const sumaCuotas = cuotas.reduce((sum, cuota) => sum + cuota.monto, 0);
    if (Math.abs(sumaCuotas - formData.monto_total) > 0.01) {
      newErrors.suma_cuotas = `La suma de las cuotas (${sumaCuotas.toLocaleString('es-CO')}) debe coincidir con el monto total (${formData.monto_total.toLocaleString('es-CO')})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'numero_cuotas' || name === 'monto_total' ? parseFloat(value) || 0 : value
    }));

    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Manejar cambios en fechas de cuotas
  const handleCuotaDateChange = (index, fecha) => {
    const nuevasCuotas = [...cuotas];
    nuevasCuotas[index].fecha_vencimiento = fecha;
    setCuotas(nuevasCuotas);

    // Limpiar error de fecha
    const errorKey = `fecha_cuota_${index}`;
    if (errors[errorKey]) {
      setErrors(prev => ({
        ...prev,
        [errorKey]: undefined
      }));
    }
  };

  // Manejar cambios en montos de cuotas
  const handleCuotaAmountChange = (index, monto) => {
    const nuevasCuotas = [...cuotas];
    nuevasCuotas[index].monto = parseFloat(monto) || 0;
    setCuotas(nuevasCuotas);

    // Limpiar errores relacionados con montos
    const errorKey = `monto_cuota_${index}`;
    if (errors[errorKey] || errors.suma_cuotas) {
      setErrors(prev => ({
        ...prev,
        [errorKey]: undefined,
        suma_cuotas: undefined
      }));
    }
  };

  // Calcular suma actual de cuotas
  const sumaCuotas = cuotas.reduce((sum, cuota) => sum + (cuota.monto || 0), 0);
  const diferencia = sumaCuotas - formData.monto_total;

  // Manejar envío
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      const dataToSubmit = {
        proveedor: formData.proveedor,
        costo: formData.monto_total,
        fecha_compra: formData.fecha_compra,
        tipo_pago: formData.tipo_pago,
        cuotas_plan: cuotas.map(cuota => ({
          monto: cuota.monto,
          fecha_vencimiento: cuota.fecha_vencimiento,
          observaciones: cuota.observaciones || null
        })),
        observaciones: formData.observaciones,
        tipo_comprobante: 'voucher',
        moneda: 'COP'
      };
      onSubmit(dataToSubmit);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full my-8 max-h-screen overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <FontAwesomeIcon icon={faCoins} className="text-2xl text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Crear Compra con Cuotas
              </h2>
              <p className="text-sm text-gray-600">
                {item?.tipo} - {item?.nombre}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2"
            disabled={creating}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6">
          {/* Información del item */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <FontAwesomeIcon icon={faInfoCircle} className="text-blue-600" />
              <span className="font-medium text-blue-800">Información del Item</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Tipo:</span>
                <span className="ml-2 font-medium">{item?.tipo}</span>
              </div>
              <div>
                <span className="text-gray-600">Precio cotizado:</span>
                <span className="ml-2 font-medium">
                  ${parseFloat(item?.precio_total || 0).toLocaleString('es-CO')}
                </span>
              </div>
            </div>
          </div>

          {/* Configuración de cuotas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Proveedor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proveedor *
              </label>
              <input
                type="text"
                name="proveedor"
                value={formData.proveedor}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.proveedor ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Nombre del proveedor"
                disabled={creating}
              />
              {errors.proveedor && (
                <p className="text-red-500 text-xs mt-1">{errors.proveedor}</p>
              )}
            </div>

            {/* Fecha de compra */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Compra *
              </label>
              <input
                type="date"
                name="fecha_compra"
                value={formData.fecha_compra}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.fecha_compra ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={creating}
              />
              {errors.fecha_compra && (
                <p className="text-red-500 text-xs mt-1">{errors.fecha_compra}</p>
              )}
            </div>

            {/* Número de cuotas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Cuotas *
              </label>
              <select
                name="numero_cuotas"
                value={formData.numero_cuotas}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.numero_cuotas ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={creating}
              >
                <option value={2}>2 cuotas</option>
                <option value={3}>3 cuotas</option>
                <option value={4}>4 cuotas</option>
                <option value={5}>5 cuotas</option>
                <option value={6}>6 cuotas</option>
                <option value={12}>12 cuotas</option>
              </select>
              {errors.numero_cuotas && (
                <p className="text-red-500 text-xs mt-1">{errors.numero_cuotas}</p>
              )}
            </div>

            {/* Monto total */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto Total *
              </label>
              <input
                type="number"
                name="monto_total"
                value={formData.monto_total}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.monto_total ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
                min="0"
                step="0.01"
                disabled={creating}
              />
              {errors.monto_total && (
                <p className="text-red-500 text-xs mt-1">{errors.monto_total}</p>
              )}
            </div>
          </div>

          {/* Resumen de cuotas */}
          {formData.numero_cuotas > 0 && formData.monto_total > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-800 mb-3 flex items-center">
                <FontAwesomeIcon icon={faMoneyBillWave} className="mr-2 text-green-600" />
                Resumen de Cuotas
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Monto por cuota:</span>
                  <p className="text-lg font-semibold text-green-600">
                    ${montoPorCuota.toLocaleString('es-CO', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Total cuotas:</span>
                  <p className="text-lg font-semibold text-blue-600">
                    {formData.numero_cuotas}
                  </p>
                </div>
              </div>

              {/* Configuración de Cuotas Individuales */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-medium text-gray-700">
                    Configurar Cuotas Individuales:
                  </h4>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={distribuirMontoEquitativo}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      disabled={creating}
                    >
                      Distribuir Equitativamente
                    </button>
                    <button
                      type="button"
                      onClick={sincronizarMontoTotal}
                      className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                      disabled={creating}
                    >
                      Sincronizar Total
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  {cuotas.map((cuota, index) => (
                    <div key={cuota.numero} className="bg-gray-50 p-3 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-start">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-600">
                            Cuota {cuota.numero}
                          </span>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Monto:</label>
                          <input
                            type="number"
                            value={cuota.monto}
                            onChange={(e) => handleCuotaAmountChange(index, e.target.value)}
                            className={`w-full px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-blue-500 ${
                              errors[`monto_cuota_${index}`] ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="0"
                            disabled={creating}
                            
                          />
                          {errors[`monto_cuota_${index}`] && (
                            <p className="text-red-500 text-xs mt-1">{errors[`monto_cuota_${index}`]}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Fecha vencimiento:</label>
                          <input
                            type="date"
                            value={cuota.fecha_vencimiento}
                            onChange={(e) => handleCuotaDateChange(index, e.target.value)}
                            className={`w-full px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-blue-500 ${
                              errors[`fecha_cuota_${index}`] ? 'border-red-500' : 'border-gray-300'
                            }`}
                            disabled={creating}
                          />
                          {errors[`fecha_cuota_${index}`] && (
                            <p className="text-red-500 text-xs mt-1">{errors[`fecha_cuota_${index}`]}</p>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center">
                          ${cuota.monto.toLocaleString('es-CO', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Mostrar error de suma total */}
                {errors.suma_cuotas && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    {errors.suma_cuotas}
                  </div>
                )}
                
                {/* Mostrar suma actual y validación */}
                <div className={`mt-3 p-3 rounded border ${
                  Math.abs(sumaCuotas - formData.monto_total) < 0.01 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex justify-between items-center text-sm">
                    <span className={`${
                      Math.abs(sumaCuotas - formData.monto_total) < 0.01 
                        ? 'text-green-700' 
                        : 'text-red-700'
                    }`}>
                      Suma de cuotas:
                    </span>
                    <span className={`font-semibold ${
                      Math.abs(sumaCuotas - formData.monto_total) < 0.01 
                        ? 'text-green-800' 
                        : 'text-red-800'
                    }`}>
                      ${sumaCuotas.toLocaleString('es-CO', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className={`${
                      Math.abs(sumaCuotas - formData.monto_total) < 0.01 
                        ? 'text-green-700' 
                        : 'text-red-700'
                    }`}>
                      Monto total:
                    </span>
                    <span className={`font-semibold ${
                      Math.abs(sumaCuotas - formData.monto_total) < 0.01 
                        ? 'text-green-800' 
                        : 'text-red-800'
                    }`}>
                      ${formData.monto_total.toLocaleString('es-CO', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </span>
                  </div>
                  
                  {/* Mostrar diferencia si existe */}
                  {Math.abs(diferencia) >= 0.01 && (
                    <div className="flex justify-between items-center text-sm mt-2 pt-2 border-t border-red-300">
                      <span className="text-red-700 font-medium">Diferencia:</span>
                      <span className="font-bold text-red-800">
                        ${Math.abs(diferencia).toLocaleString('es-CO', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })} {diferencia > 0 ? '(exceso)' : '(faltante)'}
                      </span>
                    </div>
                  )}

                  {/* Mensaje de estado */}
                  <div className="mt-2 text-center">
                    {Math.abs(diferencia) < 0.01 ? (
                      <span className="text-green-700 text-sm font-medium">
                        ✓ Los montos coinciden correctamente
                      </span>
                    ) : (
                      <span className="text-red-700 text-sm font-medium">
                        ⚠ Los montos no coinciden - Ajuste las cuotas o el total
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Observaciones */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones
            </label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Observaciones adicionales sobre la compra..."
              disabled={creating}
            />
          </div>

          {/* Advertencias */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-2">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-600 mt-1" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Importante:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Una vez creada la compra con cuotas, no se puede modificar el número de cuotas</li>
                  <li>Cada cuota tendrá su fecha de vencimiento automática</li>
                  <li>Podrás gestionar el pago de cada cuota individualmente</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              disabled={creating}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              disabled={creating}
            >
              {creating && <FontAwesomeIcon icon={faSpinner} className="animate-spin" />}
              <span>{creating ? 'Creando...' : 'Crear Compra con Cuotas'}</span>
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

CreateInstallmentsModal.propTypes = {
  item: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  creating: PropTypes.bool
};

export default CreateInstallmentsModal;
