import  { useState, useRef } from 'react';
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

  // ✅ MANEJAR CAMBIOS EN FORMULARIO
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // ✅ MANEJAR SELECCIÓN DE ARCHIVO
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    
    if (!file) return;
    
    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({ 
        ...prev, 
        file: 'Formato no válido. Solo se permiten imágenes (JPG, PNG, WebP) y PDFs' 
      }));
      return;
    }
    
    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ 
        ...prev, 
        file: 'El archivo es muy grande. Máximo 5MB permitido' 
      }));
      return;
    }
    
    setSelectedFile(file);
    setErrors(prev => ({ ...prev, file: '' }));
    
    // Generar preview para imágenes
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  // ✅ VALIDAR FORMULARIO
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

  // ✅ MANEJAR ENVÍO
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      await onSubmit(formData, selectedFile);
    } catch (error) {
      console.error('Error submitting payment:', error);
    }
  };

  // ✅ CALCULAR INFORMACIÓN FINANCIERA
  const financialInfo = {
    precioTotal: parseFloat(contract.precio_total || 0),
    totalPagado: parseFloat(contract.total_pagado || 0),
    saldoPendiente: parseFloat(contract.saldo_pendiente || contract.precio_total)
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="payment-upload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Registrar Pago - {contract.contract_number}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        {/* Información del contrato */}
        <div className="contract-summary">
          <div className="summary-item">
            <span className="label">Cliente:</span>
            <span className="value">{contract.Quote?.nombre_cliente}</span>
          </div>
          <div className="summary-item">
            <span className="label">Total Contrato:</span>
            <span className="value">${financialInfo.precioTotal.toLocaleString()}</span>
          </div>
          <div className="summary-item">
            <span className="label">Ya Pagado:</span>
            <span className="value success">${financialInfo.totalPagado.toLocaleString()}</span>
          </div>
          <div className="summary-item">
            <span className="label">Saldo Pendiente:</span>
            <span className="value pending">${financialInfo.saldoPendiente.toLocaleString()}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="payment-form">
          {/* Información básica del pago */}
          <div className="form-section">
            <h3>Información del Pago</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="tipo_pago">Tipo de Pago *</label>
                <select
                  id="tipo_pago"
                  name="tipo_pago"
                  value={formData.tipo_pago}
                  onChange={handleInputChange}
                  className={errors.tipo_pago ? 'error' : ''}
                >
                  <option value="transferencia">Transferencia Bancaria</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta de Crédito/Débito</option>
                  <option value="cheque">Cheque</option>
                </select>
                {errors.tipo_pago && <span className="error-text">{errors.tipo_pago}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="monto">Monto a Registrar *</label>
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
                  className={errors.monto ? 'error' : ''}
                />
                {errors.monto && <span className="error-text">{errors.monto}</span>}
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fecha_pago">Fecha del Pago *</label>
                <input
                  type="date"
                  id="fecha_pago"
                  name="fecha_pago"
                  value={formData.fecha_pago}
                  onChange={handleInputChange}
                  max={new Date().toISOString().split('T')[0]}
                  className={errors.fecha_pago ? 'error' : ''}
                />
                {errors.fecha_pago && <span className="error-text">{errors.fecha_pago}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="referencia_pago">Referencia/Número</label>
                <input
                  type="text"
                  id="referencia_pago"
                  name="referencia_pago"
                  value={formData.referencia_pago}
                  onChange={handleInputChange}
                  placeholder="Número de transacción, cheque, etc."
                />
              </div>
            </div>
            
            {formData.tipo_pago === 'transferencia' && (
              <div className="form-group">
                <label htmlFor="banco_origen">Banco de Origen</label>
                <input
                  type="text"
                  id="banco_origen"
                  name="banco_origen"
                  value={formData.banco_origen}
                  onChange={handleInputChange}
                  placeholder="Nombre del banco"
                />
              </div>
            )}
          </div>

          {/* Información del pagador */}
          <div className="form-section">
            <h3>Información del Pagador</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="pagador_nombre">Nombre Completo *</label>
                <input
                  type="text"
                  id="pagador_nombre"
                  name="pagador_nombre"
                  value={formData.pagador_nombre}
                  onChange={handleInputChange}
                  placeholder="Nombre de quien realiza el pago"
                  className={errors.pagador_nombre ? 'error' : ''}
                />
                {errors.pagador_nombre && <span className="error-text">{errors.pagador_nombre}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="pagador_email">Email</label>
                <input
                  type="email"
                  id="pagador_email"
                  name="pagador_email"
                  value={formData.pagador_email}
                  onChange={handleInputChange}
                  placeholder="email@ejemplo.com"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="pagador_telefono">Teléfono</label>
              <input
                type="tel"
                id="pagador_telefono"
                name="pagador_telefono"
                value={formData.pagador_telefono}
                onChange={handleInputChange}
                placeholder="Número de contacto"
              />
            </div>
          </div>

          {/* Comprobante */}
          <div className="form-section">
            <h3>Comprobante de Pago {formData.tipo_pago === 'transferencia' && '*'}</h3>
            
            <div className="file-upload-area">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,.pdf"
                style={{ display: 'none' }}
              />
              
              {!selectedFile ? (
                <div 
                  className="upload-placeholder"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span className="upload-icon">📎</span>
                  <span className="upload-text">
                    Haz clic para seleccionar el comprobante
                    <br />
                    <small>Formatos: JPG, PNG, WebP, PDF (máx. 5MB)</small>
                  </span>
                </div>
              ) : (
                <div className="file-preview">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="image-preview" />
                  ) : (
                    <div className="pdf-preview">
                      <span className="pdf-icon">📄</span>
                      <span className="pdf-name">{selectedFile.name}</span>
                    </div>
                  )}
                  
                  <div className="file-info">
                    <span className="file-name">{selectedFile.name}</span>
                    <span className="file-size">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                    <button
                      type="button"
                      className="remove-file-btn"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              )}
              
              {errors.file && <span className="error-text">{errors.file}</span>}
            </div>
          </div>

          {/* Observaciones */}
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="observaciones">Observaciones</label>
              <textarea
                id="observaciones"
                name="observaciones"
                value={formData.observaciones}
                onChange={handleInputChange}
                placeholder="Notas adicionales sobre el pago..."
                rows="3"
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="modal-actions">
            <button 
              type="button" 
              className="secondary-btn" 
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="primary-btn" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-small"></span>
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