import  { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUpload,
  faFileImage,
  faFilePdf,
  faTimes,
  faCloudUploadAlt,
  faSpinner,
  faMoneyBillWave,
  faUser,
  faCalendarAlt,
  faClipboard,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';

const PurchaseUploadModal = ({ item, onClose, onSubmit, uploading }) => {
  const [formData, setFormData] = useState({
    proveedor: '',
    costo: '',
    fecha_compra: new Date().toISOString().split('T')[0],
    fecha_vencimiento_pago: '',
    tipo_comprobante: 'factura',
    moneda: 'COP',
    observaciones: ''
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState({});

  // ✅ VALIDAR FORMULARIO
  const validateForm = () => {
    const newErrors = {};

    if (!formData.proveedor.trim()) {
      newErrors.proveedor = 'El proveedor es obligatorio';
    }

    if (!formData.costo || parseFloat(formData.costo) <= 0) {
      newErrors.costo = 'El costo debe ser mayor a 0';
    }

    if (!selectedFile) {
      newErrors.file = 'El comprobante es obligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ MANEJAR CAMBIOS EN EL FORMULARIO
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar errores al escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // ✅ MANEJAR SELECCIÓN DE ARCHIVO
  const handleFileSelect = (file) => {
    if (!file) return;

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, file: 'Solo se permiten archivos JPG, PNG o PDF' }));
      return;
    }

    // Validar tamaño (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, file: 'El archivo no debe superar los 10MB' }));
      return;
    }

    setSelectedFile(file);
    setErrors(prev => ({ ...prev, file: null }));

    // Crear preview para imágenes
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  // ✅ MANEJAR DROP DE ARCHIVOS
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  // ✅ ENVIAR FORMULARIO
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const submitFormData = new FormData();
    
    // Agregar datos del formulario con validación de fechas
    Object.keys(formData).forEach(key => {
      let value = formData[key];
      
      // ✅ VALIDAR FECHAS VACÍAS
      if ((key === 'fecha_vencimiento_pago' || key === 'fecha_compra') && value === '') {
        // No agregar campos de fecha vacíos al FormData
        return;
      }
      
      submitFormData.append(key, value);
    });
    
    // Agregar archivo con debug
    submitFormData.append('comprobante', selectedFile);
    
    // 🐛 DEBUG: Log del archivo que se está subiendo
    console.log('📤 Uploading file:', {
      name: selectedFile.name,
      type: selectedFile.type,
      size: selectedFile.size,
      isPDF: selectedFile.type === 'application/pdf'
    });

    // 🐛 DEBUG: Log de los datos del formulario
    console.log('📤 Form data being sent:');
    for (let [key, value] of submitFormData.entries()) {
      console.log(`${key}:`, value);
    }

    try {
      await onSubmit(submitFormData);
    } catch (error) {
      console.error('Error en upload:', error);
    }
  };

  // ✅ CALCULAR DIFERENCIA DE PRECIO
  const precioCotizado = parseFloat(item.precio_total || 0);
  const precioIngresado = parseFloat(formData.costo || 0);
  const diferencia = precioIngresado - precioCotizado;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* ✅ HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              <FontAwesomeIcon icon={faUpload} className="mr-3 text-blue-600" />
              Subir Comprobante de Compra
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {item.descripcion} - ${precioCotizado.toLocaleString('es-CO')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
            disabled={uploading}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* ✅ FORMULARIO */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* ✅ INFORMACIÓN DEL PROVEEDOR */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FontAwesomeIcon icon={faUser} className="mr-2 text-blue-600" />
                  Proveedor *
                </label>
                <input
                  type="text"
                  name="proveedor"
                  value={formData.proveedor}
                  onChange={handleInputChange}
                  placeholder="Nombre del proveedor"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.proveedor ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={uploading}
                />
                {errors.proveedor && (
                  <p className="text-red-500 text-xs mt-1">{errors.proveedor}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FontAwesomeIcon icon={faMoneyBillWave} className="mr-2 text-green-600" />
                  Costo Real *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="costo"
                    value={formData.costo}
                    onChange={handleInputChange}
                    placeholder="0"
                    step="0.01"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.costo ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={uploading}
                  />
                  <select
                    name="moneda"
                    value={formData.moneda}
                    onChange={handleInputChange}
                    className="absolute right-2 top-2 border-0 bg-transparent text-sm"
                    disabled={uploading}
                  >
                    <option value="COP">COP</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                {errors.costo && (
                  <p className="text-red-500 text-xs mt-1">{errors.costo}</p>
                )}
                
                {/* ✅ MOSTRAR DIFERENCIA DE PRECIO */}
                {precioIngresado > 0 && (
                  <div className={`mt-2 p-2 rounded text-sm ${
                    diferencia >= 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                  }`}>
                    <FontAwesomeIcon 
                      icon={diferencia >= 0 ? faExclamationTriangle : faUpload} 
                      className="mr-2" 
                    />
                    {diferencia >= 0 ? 'Sobrecosto' : 'Ahorro'}: 
                    ${Math.abs(diferencia).toLocaleString('es-CO')}
                  </div>
                )}
              </div>
            </div>

            {/* ✅ FECHAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-purple-600" />
                  Fecha de Compra
                </label>
                <input
                  type="date"
                  name="fecha_compra"
                  value={formData.fecha_compra}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={uploading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-orange-600" />
                  Vencimiento de Pago
                </label>
                <input
                  type="date"
                  name="fecha_vencimiento_pago"
                  value={formData.fecha_vencimiento_pago}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={uploading}
                />
              </div>
            </div>

            {/* ✅ TIPO DE COMPROBANTE */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FontAwesomeIcon icon={faClipboard} className="mr-2 text-indigo-600" />
                Tipo de Comprobante
              </label>
              <select
                name="tipo_comprobante"
                value={formData.tipo_comprobante}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={uploading}
              >
                <option value="factura">Factura</option>
                <option value="recibo">Recibo</option>
                <option value="confirmacion">Confirmación</option>
                <option value="voucher">Voucher</option>
                <option value="ticket">Ticket</option>
              </select>
            </div>

            {/* ✅ ZONA DE SUBIDA DE ARCHIVOS */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FontAwesomeIcon icon={faCloudUploadAlt} className="mr-2 text-blue-600" />
                Comprobante *
              </label>
              
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragOver ? 'border-blue-500 bg-blue-50' :
                  errors.file ? 'border-red-500 bg-red-50' :
                  'border-gray-300 hover:border-gray-400'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                {selectedFile ? (
                  <div className="space-y-3">
                    {/* ✅ PREVIEW DEL ARCHIVO */}
                    {filePreview ? (
                      <img 
                        src={filePreview} 
                        alt="Preview" 
                        className="max-w-32 max-h-32 mx-auto rounded"
                      />
                    ) : (
                      <FontAwesomeIcon 
                        icon={faFilePdf} 
                        className="text-4xl text-red-600 mx-auto" 
                      />
                    )}
                    
                    <div>
                      <p className="font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setFilePreview(null);
                      }}
                      className="text-red-600 hover:text-red-700 text-sm"
                      disabled={uploading}
                    >
                      <FontAwesomeIcon icon={faTimes} className="mr-1" />
                      Remover archivo
                    </button>
                  </div>
                ) : (
                  <div>
                    <FontAwesomeIcon 
                      icon={faCloudUploadAlt} 
                      className="text-4xl text-gray-400 mb-3" 
                    />
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      Arrastra tu comprobante aquí
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      O haz clic para seleccionar (JPG, PNG, PDF - Máx 10MB)
                    </p>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => handleFileSelect(e.target.files[0])}
                      className="hidden"
                      id="file-input"
                      disabled={uploading}
                    />
                    <label
                      htmlFor="file-input"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer inline-block transition-colors"
                    >
                      <FontAwesomeIcon icon={faUpload} className="mr-2" />
                      Seleccionar Archivo
                    </label>
                  </div>
                )}
              </div>
              
              {errors.file && (
                <p className="text-red-500 text-xs mt-1">{errors.file}</p>
              )}
            </div>

            {/* ✅ OBSERVACIONES */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FontAwesomeIcon icon={faClipboard} className="mr-2 text-gray-600" />
                Observaciones
              </label>
              <textarea
                name="observaciones"
                value={formData.observaciones}
                onChange={handleInputChange}
                rows={3}
                placeholder="Comentarios adicionales sobre la compra..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={uploading}
              />
            </div>
          </div>

          {/* ✅ BOTONES DE ACCIÓN */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={uploading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {uploading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                  Subiendo...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faUpload} className="mr-2" />
                  Subir Comprobante
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import PropTypes from 'prop-types';

PurchaseUploadModal.propTypes = {
  item: PropTypes.shape({
    descripcion: PropTypes.string.isRequired,
    precio_total: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  uploading: PropTypes.bool
};

export default PurchaseUploadModal;