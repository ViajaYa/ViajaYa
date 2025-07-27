import React, { useState } from 'react';
import { X, Upload, DollarSign, Calendar, User, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const PayCommissionModal = ({ commission, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error('Solo se permiten archivos JPG, PNG o PDF');
        return;
      }
      
      // Validar tamaño (10MB máximo)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('El archivo no puede ser mayor a 10MB');
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      
      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(droppedFile.type)) {
        toast.error('Solo se permiten archivos JPG, PNG o PDF');
        return;
      }
      
      // Validar tamaño (10MB máximo)
      if (droppedFile.size > 10 * 1024 * 1024) {
        toast.error('El archivo no puede ser mayor a 10MB');
        return;
      }
      
      setFile(droppedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      toast.error('Debe subir un comprobante de pago');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('comprobante', file);
      formData.append('observaciones', observaciones);

      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/commissions/${commission.id}/pay`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al procesar el pago');
      }

      toast.success('Comisión marcada como pagada exitosamente');
      onSuccess(); // Actualizar la lista
      onClose(); // Cerrar modal

    } catch (error) {
      console.error('Error al pagar comisión:', error);
      toast.error(error.message || 'Error al procesar el pago');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Marcar Comisión como Pagada</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Información de la comisión */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
            <FileText className="mr-2" size={20} />
            Información de la Comisión
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <User className="mr-2 text-blue-500" size={16} />
              <span className="text-gray-600">Vendedor:</span>
              <span className="ml-2 font-medium">
                {commission.Vendedor ? `${commission.Vendedor.name} ${commission.Vendedor.lastname}` : 'N/A'}
              </span>
            </div>
            
            <div className="flex items-center">
              <DollarSign className="mr-2 text-green-500" size={16} />
              <span className="text-gray-600">Monto:</span>
              <span className="ml-2 font-medium text-green-600">
                {formatCurrency(commission.comision_amount)}
              </span>
            </div>
            
            <div className="flex items-center">
              <Calendar className="mr-2 text-purple-500" size={16} />
              <span className="text-gray-600">Fecha Generación:</span>
              <span className="ml-2 font-medium">
                {formatDate(commission.fecha_generacion)}
              </span>
            </div>
            
            <div className="flex items-center">
              <FileText className="mr-2 text-orange-500" size={16} />
              <span className="text-gray-600">Contrato:</span>
              <span className="ml-2 font-medium">
                {commission.Contract?.contract_number || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          {/* Upload Area */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comprobante de Pago *
            </label>
            
            <div
              className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                dragActive 
                  ? 'border-blue-400 bg-blue-50' 
                  : file 
                    ? 'border-green-400 bg-green-50' 
                    : 'border-gray-300 hover:border-blue-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="text-center">
                {file ? (
                  <div className="flex items-center justify-center space-x-2">
                    <FileText className="text-green-500" size={24} />
                    <span className="text-green-700 font-medium">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto text-gray-400 mb-2" size={48} />
                    <p className="text-gray-600 mb-2">
                      Arrastra y suelta el comprobante de pago aquí
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      o haz clic para seleccionar
                    </p>
                    <input
                      type="file"
                      id="comprobante"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="comprobante"
                      className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer transition-colors"
                    >
                      Seleccionar Archivo
                    </label>
                  </>
                )}
              </div>
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              Formatos permitidos: JPG, PNG, PDF (máximo 10MB)
            </p>
          </div>

          {/* Observaciones */}
          <div className="mb-6">
            <label htmlFor="observaciones" className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones (Opcional)
            </label>
            <textarea
              id="observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Notas adicionales sobre el pago..."
            />
          </div>

          {/* Alerta importante */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start">
            <AlertCircle className="text-yellow-600 mr-3 mt-0.5" size={20} />
            <div>
              <h4 className="font-medium text-yellow-800 mb-1">Importante</h4>
              <p className="text-sm text-yellow-700">
                Una vez marcada como pagada, esta acción no se puede revertir. 
                Asegúrate de que el pago se haya procesado correctamente.
              </p>
            </div>
          </div>

          {/* Botones */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !file}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Procesando...' : 'Marcar como Pagada'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PayCommissionModal;
