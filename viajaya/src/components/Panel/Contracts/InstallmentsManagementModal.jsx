import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes, faCoins, faMoneyBillWave, faCalendarAlt,
  faCheckCircle, faExclamationTriangle, faSpinner,
  faInfoCircle, faClock, faReceipt
} from '@fortawesome/free-solid-svg-icons';

const InstallmentsManagementModal = ({ 
  purchase, 
  installments, 
  onClose, 
  onPayInstallment, 
  loading, 
  payingInstallment 
}) => {
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [paymentData, setPaymentData] = useState({
    observaciones: '',
    fecha_pago: new Date().toISOString().split('T')[0]
  });

  // Calcular estadísticas
  const stats = {
    total: installments.length,
    paid: installments.filter(inst => inst.estado === 'pagado').length,
    pending: installments.filter(inst => inst.estado === 'pendiente').length,
    overdue: installments.filter(inst => {
      if (inst.estado === 'pagado') return false;
      return new Date(inst.fecha_vencimiento) < new Date();
    }).length
  };

  const totalAmount = installments.reduce((sum, inst) => sum + parseFloat(inst.monto_cuota || 0), 0);
  const paidAmount = installments
    .filter(inst => inst.estado === 'pagado')
    .reduce((sum, inst) => sum + parseFloat(inst.monto_cuota || 0), 0);
  const pendingAmount = totalAmount - paidAmount;

  // Obtener estado de cuota
  const getInstallmentStatus = (installment) => {
    if (installment.estado === 'pagado') return 'paid';
    
    const now = new Date();
    const dueDate = new Date(installment.fecha_vencimiento);
    
    if (dueDate < now) return 'overdue';
    
    const diffDays = (dueDate - now) / (1000 * 60 * 60 * 24);
    if (diffDays <= 3) return 'due-soon';
    
    return 'pending';
  };

  // Configuración de estados
  const statusConfig = {
    paid: {
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: faCheckCircle,
      label: 'Pagado'
    },
    overdue: {
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: faExclamationTriangle,
      label: 'Vencido'
    },
    'due-soon': {
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: faClock,
      label: 'Próximo a vencer'
    },
    pending: {
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: faCalendarAlt,
      label: 'Pendiente'
    }
  };

  // Manejar pago de cuota
  const handlePayInstallment = async (installmentId) => {
    try {
      await onPayInstallment(installmentId, paymentData);
      setSelectedInstallment(null);
      setPaymentData({
        observaciones: '',
        fecha_pago: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error paying installment:', error);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center">
          <FontAwesomeIcon icon={faSpinner} className="text-4xl text-blue-600 animate-spin mb-4" />
          <p className="text-lg text-gray-600">Cargando cuotas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8 max-h-screen overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <FontAwesomeIcon icon={faCoins} className="text-2xl text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Gestión de Cuotas
              </h2>
              <p className="text-sm text-gray-600">
                Compra #{purchase.id} - {purchase.proveedor}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto">
          {/* Estadísticas */}
          <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              <p className="text-sm text-gray-600">Total Cuotas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
              <p className="text-sm text-gray-600">Pagadas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-sm text-gray-600">Pendientes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              <p className="text-sm text-gray-600">Vencidas</p>
            </div>
          </div>

          {/* Resumen financiero */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-800">
                ${totalAmount.toLocaleString('es-CO')}
              </p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-green-600">
                ${paidAmount.toLocaleString('es-CO')}
              </p>
              <p className="text-sm text-gray-600">Pagado</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-red-600">
                ${pendingAmount.toLocaleString('es-CO')}
              </p>
              <p className="text-sm text-gray-600">Pendiente</p>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Progreso de Pagos</span>
              <span>{stats.total > 0 ? ((stats.paid / stats.total) * 100).toFixed(1) : 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-green-600 h-3 rounded-full transition-all duration-500"
                style={{ 
                  width: `${stats.total > 0 ? (stats.paid / stats.total) * 100 : 0}%` 
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Lista de cuotas */}
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Cuotas ({installments.length})
          </h3>

          {installments.length === 0 ? (
            <div className="text-center py-8">
              <FontAwesomeIcon icon={faInfoCircle} className="text-4xl text-gray-300 mb-4" />
              <p className="text-gray-500">No hay cuotas para mostrar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {[...installments]
                .sort((a, b) => a.numero_cuota - b.numero_cuota)
                .map((installment) => {
                  const status = getInstallmentStatus(installment);
                  const config = statusConfig[status];
                  
                  return (
                    <div
                      key={installment.id}
                      className={`border rounded-lg p-4 ${config.bg} ${config.border}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 rounded-full ${config.bg}`}>
                            <FontAwesomeIcon 
                              icon={config.icon} 
                              className={`${config.color}`} 
                            />
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-gray-900">
                              Cuota {installment.numero_cuota}
                            </h4>
                            <p className="text-sm text-gray-600">
                              Vence: {new Date(installment.fecha_vencimiento).toLocaleDateString('es-CO')}
                            </p>
                            {installment.fecha_pago && (
                              <p className="text-sm text-green-600">
                                Pagado: {new Date(installment.fecha_pago).toLocaleDateString('es-CO')}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-lg font-semibold text-gray-900">
                              ${parseFloat(installment.monto_cuota).toLocaleString('es-CO')}
                            </p>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${config.color} ${config.bg}`}>
                              {config.label}
                            </span>
                          </div>

                          {/* Botón de pago */}
                          {installment.estado === 'pendiente' && (
                            <button
                              onClick={() => setSelectedInstallment(installment)}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                              disabled={payingInstallment}
                            >
                              <FontAwesomeIcon icon={faMoneyBillWave} className="mr-2" />
                              Pagar
                            </button>
                          )}

                          {installment.estado === 'pagado' && installment.observaciones && (
                            <div className="text-right">
                              <FontAwesomeIcon icon={faInfoCircle} className="text-blue-500 mr-1" />
                              <span className="text-xs text-gray-600">Ver detalles</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Observaciones */}
                      {installment.observaciones && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-600">
                            <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
                            {installment.observaciones}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

        {/* Modal de pago */}
        {selectedInstallment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Registrar Pago - Cuota {selectedInstallment.numero_cuota}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Pago
                    </label>
                    <input
                      type="date"
                      value={paymentData.fecha_pago}
                      onChange={(e) => setPaymentData(prev => ({
                        ...prev,
                        fecha_pago: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observaciones
                    </label>
                    <textarea
                      value={paymentData.observaciones}
                      onChange={(e) => setPaymentData(prev => ({
                        ...prev,
                        observaciones: e.target.value
                      }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Detalles del pago, número de comprobante, etc."
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <FontAwesomeIcon icon={faReceipt} className="mr-2" />
                      Monto: ${parseFloat(selectedInstallment.monto_cuota).toLocaleString('es-CO')}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setSelectedInstallment(null)}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    disabled={payingInstallment}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handlePayInstallment(selectedInstallment.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
                    disabled={payingInstallment}
                  >
                    {payingInstallment && <FontAwesomeIcon icon={faSpinner} className="animate-spin" />}
                    <span>{payingInstallment ? 'Procesando...' : 'Confirmar Pago'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

InstallmentsManagementModal.propTypes = {
  purchase: PropTypes.object.isRequired,
  installments: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired,
  onPayInstallment: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  payingInstallment: PropTypes.bool
};

export default InstallmentsManagementModal;
