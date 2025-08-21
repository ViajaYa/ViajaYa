import  { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  fetchContractPaymentDetails, 
  registerPayment, 
  uploadPaymentReceipt 
} from '../../../../redux/slices/contractPaymentSlice';
import PropTypes from 'prop-types';

const ContractPaymentDetail = ({ contractId, isOpen, onClose, onPaymentSuccess }) => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('overview');
  const [newPayment, setNewPayment] = useState({
    amount: '',
    date: '',
    method: 'transferencia',
    description: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const { 
    currentContract,
    planPagos,
    pagosRealizados,
    resumenFinanciero,
    loading, 
    error 
  } = useSelector(state => state.contractPayment);

  useEffect(() => {
    if (contractId && isOpen) {
      console.log('🔍 ContractPaymentDetail: Loading details for contract:', contractId);
      dispatch(fetchContractPaymentDetails(contractId));
    }
  }, [dispatch, contractId, isOpen]);

  console.log('🎯 ContractPaymentDetail state:', { 
    contractId, 
    isOpen, 
    currentContract,
    planPagos,
    pagosRealizados,
    resumenFinanciero,
    loading, 
    error 
  });

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="text-center">Cargando detalles del contrato...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="text-center text-red-600">Error: {error}</div>
          <button 
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  const handleNewPayment = async (e) => {
    e.preventDefault();
    try {
      await dispatch(registerPayment({
        contractId,
        paymentData: newPayment,
        comprobante: selectedFile // Incluir archivo
      }));
      setNewPayment({
        amount: '',
        date: '',
        method: 'transferencia',
        description: ''
      });
      setSelectedFile(null); // Limpiar archivo seleccionado
      // Recargar detalles después del pago
      dispatch(fetchContractPaymentDetails(contractId));
      
      // 🔄 Notificar al componente padre que se registró un pago exitosamente
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
    } catch (error) {
      console.error('Error registrando pago:', error);
    }
  };

  const handleScheduleItemClick = (item) => {
    // Pre-llenar el formulario con los datos de la cuota seleccionada
    setNewPayment({
      amount: item.monto.toString(),
      date: new Date().toISOString().split('T')[0], // Fecha actual
      method: 'transferencia',
      description: `Pago de ${item.descripcion}`
    });
    
    // Cambiar a la pestaña de pagos
    setActiveTab('payments');
  };

  const handleFileUpload = async (paymentId) => {
    if (!selectedFile) return;
    
    try {
      await dispatch(uploadPaymentReceipt({
        contractId,
        paymentId,
        file: selectedFile
      }));
      setSelectedFile(null);
      // Recargar detalles después de subir archivo
      dispatch(fetchContractPaymentDetails(contractId));
    } catch (error) {
      console.error('Error subiendo comprobante:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return 'Fecha no disponible';
    try {
      const parsedDate = new Date(date);
      if (parsedDate.toString() === 'Invalid Date') {
        return 'Fecha inválida';
      }
      return format(parsedDate, 'dd/MM/yyyy', { locale: es });
    } catch (error) {
      console.error('Error formateando fecha:', date, error);
      return 'Fecha inválida';
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-semibold";
    switch (status) {
      case 'pending': return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'completed': return `${baseClasses} bg-green-100 text-green-800`;
      case 'overdue': return `${baseClasses} bg-red-100 text-red-800`;
      case 'rejected': return `${baseClasses} bg-red-100 text-red-800`;
      default: return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getScheduleItemClasses = (item) => {
    const baseClasses = "bg-white border-l-4 border rounded-lg p-4 shadow-sm";
    const clickableClasses = (item.estado === 'pendiente' || item.estado === 'parcial') ? " cursor-pointer hover:shadow-md transition-shadow duration-200" : "";
    
    if (item.estado === 'pagada') return `${baseClasses} border-l-green-500 bg-green-50${clickableClasses}`;
    if (item.estado === 'parcial') return `${baseClasses} border-l-yellow-500 bg-yellow-50${clickableClasses}`;
    if (item.estado === 'vencido') return `${baseClasses} border-l-red-500 bg-red-50${clickableClasses}`;
    return `${baseClasses} border-l-blue-500${clickableClasses}`;
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Resumen Financiero */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumen Financiero</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-600">Valor Total</div>
            <div className="text-xl font-bold text-gray-800">
              {formatCurrency(resumenFinanciero?.precio_total || 0)}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-600">Total Pagado</div>
            <div className="text-xl font-bold text-green-600">
              {formatCurrency(resumenFinanciero?.total_pagado || 0)}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-600">Saldo Pendiente</div>
            <div className="text-xl font-bold text-red-600">
              {formatCurrency(resumenFinanciero?.saldo_pendiente || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Información del Contrato */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Información del Contrato</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-600">Cliente:</span>
            <div className="font-medium">
              {currentContract?.Quote?.Cliente?.name} {currentContract?.Quote?.Cliente?.lastname}
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-600">Destino:</span>
            <div className="font-medium">{currentContract?.Quote?.destino}</div>
          </div>
          <div>
            <span className="text-sm text-gray-600">Fecha de Viaje:</span>
            <div className="font-medium">
              {currentContract?.fecha_inicio_viaje ? 
                formatDate(currentContract.fecha_inicio_viaje) : 'No definida'}
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-600">Estado del Contrato:</span>
            <span className={getStatusBadge(currentContract?.status)}>
              {currentContract?.status || 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderScheduleTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Plan de Pagos</h3>
        <div className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
          💡 Haz click en una cuota para pagarla
        </div>
      </div>
      {planPagos?.length > 0 ? (
        <div className="space-y-3">
          {planPagos.map((item, index) => (
            <div 
              key={index} 
              className={getScheduleItemClasses(item)}
              onClick={(item.estado === 'pendiente' || item.estado === 'parcial') ? () => handleScheduleItemClick(item) : undefined}
              title={(item.estado === 'pendiente' || item.estado === 'parcial') ? "Click para pagar esta cuota" : ""}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-gray-800">
                      Cuota {item.numero}: {item.descripcion}
                    </span>
                    <span className={getStatusBadge(item.estado)}>
                      {item.estado === 'pendiente' ? 'Pendiente' : 
                       item.estado === 'pagado' ? 'Pagado' : 
                       item.estado === 'vencido' ? 'Vencido' : item.estado}
                    </span>
                    {item.estado === 'pendiente' && (
                      <span className="text-xs text-blue-600 font-medium">
                        🎯 Click para pagar
                      </span>
                    )}
                  </div>
                  {item.estado !== 'pagada' && (
                    <div className="text-sm text-gray-600">
                      Fecha límite: {formatDate(item.fecha_vencimiento)}
                    </div>
                  )}
                  {item.fecha_pago && (
                    <div className="text-sm text-green-600">
                      Pagado el: {formatDate(item.fecha_pago)}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-800">
                    {formatCurrency(item.monto)}
                  </div>
                  {item.porcentaje && (
                    <div className="text-sm text-gray-500">
                      ({item.porcentaje}% del total)
                    </div>
                  )}
                  {item.estado === 'pendiente' && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors">
                        💳 Pagar ahora
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No hay plan de pagos definido para este contrato
        </div>
      )}
    </div>
  );

  const renderPaymentsTab = () => (
    <div className="space-y-6">
      {/* Formulario para nuevo pago */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Registrar Nuevo Pago</h3>
        <form onSubmit={handleNewPayment} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto
              </label>
              <input
                type="number"
                value={newPayment.amount}
                onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha
              </label>
              <input
                type="date"
                value={newPayment.date}
                onChange={(e) => setNewPayment({...newPayment, date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Método de Pago
              </label>
              <select
                value={newPayment.method}
                onChange={(e) => setNewPayment({...newPayment, method: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="transferencia">Transferencia</option>
                <option value="efectivo">Efectivo</option>
                <option value="cheque">Cheque</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="wompi">Wompi (Pago en línea)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <input
                type="text"
                value={newPayment.description}
                onChange={(e) => setNewPayment({...newPayment, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Descripción del pago"
              />
            </div>
            
            {/* 📎 Campo para subir comprobante */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comprobante de Pago
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {selectedFile && (
                <p className="text-sm text-gray-600 mt-1">
                  Archivo seleccionado: {selectedFile.name}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Formatos aceptados: PDF, JPG, PNG (máx. 10MB)
              </p>
            </div>
          </div>
          <button
            type="submit"
            className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Registrar Pago
          </button>
        </form>
      </div>

      {/* Lista de pagos existentes */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Historial de Pagos</h3>
        {pagosRealizados?.length > 0 ? (
          <div className="space-y-3">
            {pagosRealizados.map((payment) => (
              <div key={payment.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-800">
                        {formatCurrency(payment.monto)}
                      </span>
                      <span className={getStatusBadge(payment.status)}>
                        {payment.status === 'completed' ? 'Completado' : 
                         payment.status === 'pending' ? 'Pendiente' : 
                         payment.status === 'rejected' ? 'Rechazado' : payment.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Fecha: {formatDate(payment.fecha_pago)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Método: {payment.tipo_pago}
                    </div>
                    {payment.observaciones && (
                      <div className="text-sm text-gray-600">
                        Descripción: {payment.observaciones}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    {payment.comprobante_url ? (
                      <a 
                        href={payment.comprobante_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Ver comprobante
                      </a>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="file"
                          onChange={(e) => setSelectedFile(e.target.files[0])}
                          className="text-xs"
                          accept=".pdf,.jpg,.png"
                        />
                        {selectedFile && (
                          <button
                            onClick={() => handleFileUpload(payment.id)}
                            className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Subir
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No hay pagos registrados para este contrato
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Detalles de Pago - Contrato #{contractId}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex">
            {[
              { id: 'overview', label: 'Resumen' },
              { id: 'schedule', label: 'Plan de Pagos' },
              { id: 'payments', label: 'Pagos' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'schedule' && renderScheduleTab()}
          {activeTab === 'payments' && renderPaymentsTab()}
        </div>
      </div>
    </div>
  );
};
ContractPaymentDetail.propTypes = {
  contractId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onPaymentSuccess: PropTypes.func
};

export default ContractPaymentDetail;

