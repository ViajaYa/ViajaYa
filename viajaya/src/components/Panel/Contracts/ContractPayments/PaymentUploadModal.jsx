import { useState, useRef } from 'react';
import PropTypes from 'prop-types';

const PaymentUploadModal = ({ contract, onClose, onSubmit, loading }) => {
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    tipo_pago: 'transferencia',
    monto: '',
    fecha_pago: new Date().toISOString().split('T')[0],
    referencia_pago: '',
    banco_origen: '',
    observaciones: '',
    pagador_nombre: contract.Quote?.nombre_cliente || '',
    pagador_email: contract.Quote?.email || '',
    pagador_telefono: contract.Quote?.telefono || ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;
    
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({ 
        ...prev, 
        file: 'Formato no válido. Solo se permiten imágenes (JPG, PNG, WebP) y PDFs' 
      }));
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ 
        ...prev, 
        file: 'El archivo es muy grande. Máximo 5MB permitido' 
      }));
      return;
    }
    
    setSelectedFile(file);
    setErrors(prev => ({ ...prev, file: '' }));
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      newErrors.monto = 'El monto es requerido y debe ser mayor a 0';
    }
    
    const saldoPendiente = parseFloat(contract.saldo_pendiente || contract.precio_total);
    if (parseFloat(formData.monto) > saldoPendiente + 1) {
      newErrors.monto = `El monto no puede exceder el saldo pendiente ($${saldoPendiente.toLocaleString()})`;
    }
    
    if (!formData.tipo_pago) {
      newErrors.tipo_pago = 'El tipo de pago es requerido';
    }
    
    if (!formData.fecha_pago) {
      newErrors.fecha_pago = 'La fecha de pago es requerida';
    }
    
    if (formData.tipo_pago === 'transferencia' && !selectedFile) {
      newErrors.file = 'El comprobante es requerido para transferencias';
    }
    
    if (!formData.pagador_nombre.trim()) {
      newErrors.pagador_nombre = 'El nombre del pagador es requerido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      await onSubmit(formData, selectedFile);
    } catch (error) {
      console.error('Error submitting payment:', error);
    }
  };

  const financialInfo = {
    precioTotal: parseFloat(contract.precio_total || 0),
    totalPagado: parseFloat(contract.total_pagado || 0),
    saldoPendiente: parseFloat(contract.saldo_pendiente || contract.precio_total)
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Registrar Pago - {contract.contract_number}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-200"
          >
            ×
          </button>
        </div>
        
        {/* Información del contrato */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-600">Cliente</div>
              <div className="font-semibold text-gray-900">{contract.Quote?.nombre_cliente}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Total Contrato</div>
              <div className="font-semibold text-gray-900">${financialInfo.precioTotal.toLocaleString()}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-green-600">Ya Pagado</div>
              <div className="font-semibold text-green-700">${financialInfo.totalPagado.toLocaleString()}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-red-600">Saldo Pendiente</div>
              <div className="font-semibold text-red-700">${financialInfo.saldoPendiente.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Información básica del pago */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Información del Pago
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label htmlFor="tipo_pago" className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Pago *
                </label>
                <select
                  id="tipo_pago"
                  name="tipo_pago"
                  value={formData.tipo_pago}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.tipo_pago ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                >
                  <option value="transferencia">Transferencia Bancaria</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta de Crédito/Débito</option>
                  <option value="cheque">Cheque</option>
                </select>
                {errors.tipo_pago && <p className="mt-1 text-sm text-red-600">{errors.tipo_pago}</p>}
              </div>
              
              <div>
                <label htmlFor="monto" className="block text-sm font-medium text-gray-700 mb-2">
                  Monto a Registrar *
                </label>
                <input
                  type="number"
                  id="monto"
                  name="monto"
                  value={formData.monto}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  max={financialInfo.saldoPendiente}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.monto ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                />
                {errors.monto && <p className="mt-1 text-sm text-red-600">{errors.monto}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label htmlFor="fecha_pago" className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha del Pago *
                </label>
                <input
                  type="date"
                  id="fecha_pago"
                  name="fecha_pago"
                  value={formData.fecha_pago}
                  onChange={handleInputChange}
                  max={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.fecha_pago ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                />
                {errors.fecha_pago && <p className="mt-1 text-sm text-red-600">{errors.fecha_pago}</p>}
              </div>
              
              <div>
                <label htmlFor="referencia_pago" className="block text-sm font-medium text-gray-700 mb-2">
                  Referencia/Número
                </label>
                <input
                  type="text"
                  id="referencia_pago"
                  name="referencia_pago"
                  value={formData.referencia_pago}
                  onChange={handleInputChange}
                  placeholder="Número de transacción, cheque, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            {formData.tipo_pago === 'transferencia' && (
              <div>
                <label htmlFor="banco_origen" className="block text-sm font-medium text-gray-700 mb-2">
                  Banco de Origen
                </label>
                <input
                  type="text"
                  id="banco_origen"
                  name="banco_origen"
                  value={formData.banco_origen}
                  onChange={handleInputChange}
                  placeholder="Nombre del banco"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
          </div>

          {/* Información del pagador */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Información del Pagador
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label htmlFor="pagador_nombre" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  id="pagador_nombre"
                  name="pagador_nombre"
                  value={formData.pagador_nombre}
                  onChange={handleInputChange}
                  placeholder="Nombre de quien realiza el pago"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.pagador_nombre ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                />
                {errors.pagador_nombre && <p className="mt-1 text-sm text-red-600">{errors.pagador_nombre}</p>}
              </div>
              
              <div>
                <label htmlFor="pagador_email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="pagador_email"
                  name="pagador_email"
                  value={formData.pagador_email}
                  onChange={handleInputChange}
                  placeholder="email@ejemplo.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="pagador_telefono" className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                id="pagador_telefono"
                name="pagador_telefono"
                value={formData.pagador_telefono}
                onChange={handleInputChange}
                placeholder="Número de contacto"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Comprobante */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Comprobante de Pago {formData.tipo_pago === 'transferencia' && <span className="text-red-500">*</span>}
            </h3>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,.pdf"
                className="hidden"
              />
              
              {!selectedFile ? (
                <div 
                  className="text-center cursor-pointer hover:bg-gray-50 py-4 rounded-lg transition-colors duration-200"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="text-4xl mb-4">📎</div>
                  <p className="text-gray-600">
                    Haz clic para seleccionar el comprobante
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Formatos: JPG, PNG, WebP, PDF (máx. 5MB)
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="max-w-full h-48 object-contain mx-auto rounded" />
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">📄</div>
                      <div className="font-medium text-gray-900">{selectedFile.name}</div>
                    </div>
                  )}
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{selectedFile.name}</div>
                        <div className="text-sm text-gray-600">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors duration-200"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {errors.file && <p className="mt-2 text-sm text-red-600">{errors.file}</p>}
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label htmlFor="observaciones" className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones
            </label>
            <textarea
              id="observaciones"
              name="observaciones"
              value={formData.observaciones}
              onChange={handleInputChange}
              placeholder="Notas adicionales sobre el pago..."
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-6 border-t border-gray-200">
            <button 
              type="button" 
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Registrando...
                </>
              ) : (
                'Registrar Pago'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

PaymentUploadModal.propTypes = {
  contract: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
};

export default PaymentUploadModal;