import PropTypes from 'prop-types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const ContractsPaymentList = ({ contracts, loading, onContractSelect, onPaymentUpload }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando contratos...</p>
        </div>
      </div>
    );
  }

  if (!contracts.length) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <div className="text-6xl mb-4">📄</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay contratos firmados pendientes de pago</h3>
        <p className="text-gray-600">Los contratos aparecerán aquí cuando estén firmados y requieran gestión de pagos.</p>
      </div>
    );
  }

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 3: return '🚨';
      case 2: return '⚠️';
      default: return '📋';
    }
  };

  const getPriorityBorderClass = (priority) => {
    switch (priority) {
      case 3: return 'border-l-red-500 bg-red-50';
      case 2: return 'border-l-yellow-500 bg-yellow-50';
      default: return 'border-l-blue-500 bg-white';
    }
  };

  const getStatusBadge = (paymentStatus) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    switch (paymentStatus.type) {
      case 'completed':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>✅ Completado</span>;
      case 'partial':
        return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>💰 Pago Parcial</span>;
      case 'overdue':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>🚨 Vencido</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>⏳ Pendiente</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header de la lista */}
      <div className="text-center lg:text-left">
        <h2 className="text-2xl font-bold text-gray-900">Contratos Firmados ({contracts.length})</h2>
        <p className="mt-1 text-gray-600">Gestiona los pagos de contratos que requieren atención</p>
      </div>
      
      {/* Grid de contratos */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {contracts.map(contract => (
          <div 
            key={contract.id} 
            className={`bg-white border-l-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer overflow-hidden ${getPriorityBorderClass(contract.paymentStatus.priority)}`}
            onClick={() => onContractSelect(contract)}
          >
            {/* Header del card */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getPriorityIcon(contract.paymentStatus.priority)}</span>
                  <span className="font-bold text-gray-900">{contract.contract_number}</span>
                </div>
                <button
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPaymentUpload(contract);
                  }}
                  title="Registrar pago"
                >
                  💰
                </button>
              </div>
              <div className="flex justify-center">
                {getStatusBadge(contract.paymentStatus)}
              </div>
            </div>

            {/* Información del cliente */}
            <div className="p-4 border-b border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-1">{contract.Quote?.nombre_cliente}</h4>
              <p className="text-gray-600 mb-3">{contract.Quote?.destino}</p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span className="flex items-center">
                  🗓️ {new Date(contract.fecha_inicio_viaje).toLocaleDateString()}
                </span>
                {contract.numero_pasajeros && (
                  <span className="flex items-center">
                    👥 {contract.numero_pasajeros} pax
                  </span>
                )}
              </div>
            </div>

            {/* Información financiera */}
            <div className="p-4 border-b border-gray-100">
              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div>
                  <div className="text-xs text-gray-500">Total</div>
                  <div className="font-semibold text-gray-900 text-sm">
                    ${parseFloat(contract.precio_total).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-green-600">Pagado</div>
                  <div className="font-semibold text-green-700 text-sm">
                    ${parseFloat(contract.total_pagado || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-red-600">Pendiente</div>
                  <div className="font-semibold text-red-700 text-sm">
                    ${parseFloat(contract.saldo_pendiente || contract.precio_total).toLocaleString()}
                  </div>
                </div>
              </div>
              
              {/* Barra de progreso */}
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${((parseFloat(contract.total_pagado || 0) / parseFloat(contract.precio_total)) * 100)}%` 
                    }}
                  ></div>
                </div>
                <div className="text-center text-xs text-gray-600">
                  {((parseFloat(contract.total_pagado || 0) / parseFloat(contract.precio_total)) * 100).toFixed(1)}% completado
                </div>
              </div>
            </div>

            {/* Alertas y mensajes */}
            {contract.paymentStatus.alerts.length > 0 && (
              <div className="p-3 bg-red-50 border-t border-red-100">
                {contract.paymentStatus.alerts.map((alert, index) => (
                  <div key={index} className="flex items-center text-sm text-red-800 mb-1 last:mb-0">
                    <span className="mr-2">⚠️</span>
                    <span>{alert}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Información del tipo de pago y footer */}
            <div className="p-4 bg-gray-50">
              <div className="flex items-center justify-between text-sm mb-3">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {contract.forma_pago === 'cuotas' ? (
                    <>
                      📅 {contract.tiene_cuota_inicial ? 'Cuota inicial + ' : ''}{contract.numero_cuotas_restantes} cuotas
                    </>
                  ) : (
                    '💳 Pago de contado'
                  )}
                </span>
              </div>
              
              {/* Botones de acción */}
              <div className="flex space-x-2 mb-2">
                <button
                  onClick={() => onContractSelect(contract)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                >
                  📊 Ver Plan de Pagos
                </button>
                <button
                  onClick={() => onPaymentUpload(contract)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-3 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                >
                  💳 Cargar Pago
                </button>
              </div>
              
              <div className="text-xs text-gray-500 text-center">
                Firmado {formatDistanceToNow(new Date(contract.fecha_firma || contract.created_at), { 
                  addSuffix: true, 
                  locale: es 
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

ContractsPaymentList.propTypes = {
  contracts: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  onContractSelect: PropTypes.func.isRequired,
  onPaymentUpload: PropTypes.func.isRequired,
};

export default ContractsPaymentList;