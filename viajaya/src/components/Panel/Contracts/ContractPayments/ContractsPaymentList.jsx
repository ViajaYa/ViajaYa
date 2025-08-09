
import PropTypes from 'prop-types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const ContractsPaymentList = ({ contracts, loading, onContractSelect, onPaymentUpload }) => {
  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Cargando contratos...</p>
      </div>
    );
  }

  if (!contracts.length) {
    return (
      <div className="empty-state">
        <h3>No hay contratos firmados pendientes de pago</h3>
        <p>Los contratos aparecerán aquí cuando estén firmados y requieran gestión de pagos.</p>
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

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 3: return 'urgent';
      case 2: return 'warning';
      default: return 'normal';
    }
  };

  const getStatusBadge = (paymentStatus) => {
    switch (paymentStatus.type) {
      case 'completed':
        return <span className="status-badge completed">Completado</span>;
      case 'partial':
        return <span className="status-badge partial">Pago Parcial</span>;
      case 'overdue':
        return <span className="status-badge overdue">Vencido</span>;
      default:
        return <span className="status-badge pending">Pendiente</span>;
    }
  };

  return (
    <div className="contracts-list">
      <div className="list-header">
        <h2>Contratos Firmados ({contracts.length})</h2>
        <p>Gestiona los pagos de contratos que requieren atención</p>
      </div>
      
      <div className="contracts-grid">
        {contracts.map(contract => (
          <div 
            key={contract.id} 
            className={`contract-card ${getPriorityClass(contract.paymentStatus.priority)}`}
            onClick={() => onContractSelect(contract)}
          >
            {/* Header del card */}
            <div className="card-header">
              <div className="contract-info">
                <div className="priority-icon">
                  {getPriorityIcon(contract.paymentStatus.priority)}
                </div>
                <div className="contract-number">
                  <strong>{contract.contract_number}</strong>
                  {getStatusBadge(contract.paymentStatus)}
                </div>
              </div>
              <div className="quick-actions">
                <button
                  className="quick-pay-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPaymentUpload(contract);
                  }}
                  title="Registrar pago"
                >
                  💰
                </button>
              </div>
            </div>

            {/* Información del cliente */}
            <div className="client-info">
              <h4>{contract.Quote?.nombre_cliente}</h4>
              <p>{contract.Quote?.destino}</p>
              <div className="dates">
                <span>🗓️ {new Date(contract.fecha_inicio_viaje).toLocaleDateString()}</span>
                {contract.numero_pasajeros && (
                  <span>👥 {contract.numero_pasajeros} pax</span>
                )}
              </div>
            </div>

            {/* Información financiera */}
            <div className="financial-info">
              <div className="amounts">
                <div className="total-amount">
                  <span className="label">Total:</span>
                  <span className="value">${parseFloat(contract.precio_total).toLocaleString()}</span>
                </div>
                <div className="paid-amount">
                  <span className="label">Pagado:</span>
                  <span className="value success">${parseFloat(contract.total_pagado || 0).toLocaleString()}</span>
                </div>
                <div className="pending-amount">
                  <span className="label">Pendiente:</span>
                  <span className="value pending">${parseFloat(contract.saldo_pendiente || contract.precio_total).toLocaleString()}</span>
                </div>
              </div>
              
              <div className="payment-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${((parseFloat(contract.total_pagado || 0) / parseFloat(contract.precio_total)) * 100)}%` 
                    }}
                  ></div>
                </div>
                <span className="progress-text">
                  {((parseFloat(contract.total_pagado || 0) / parseFloat(contract.precio_total)) * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Alertas y mensajes */}
            {contract.paymentStatus.alerts.length > 0 && (
              <div className="alerts-section">
                {contract.paymentStatus.alerts.map((alert, index) => (
                  <div key={index} className="alert-item">
                    <span className="alert-icon">⚠️</span>
                    <span className="alert-text">{alert}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Información del tipo de pago */}
            <div className="payment-type-info">
              <span className="payment-type-badge">
                {contract.forma_pago === 'cuotas' ? (
                  <>
                    📅 {contract.tiene_cuota_inicial ? 'Cuota inicial + ' : ''}{contract.numero_cuotas_restantes} cuotas
                  </>
                ) : (
                  '💳 Pago de contado'
                )}
              </span>
            </div>

            {/* Footer con fecha de firma */}
            <div className="card-footer">
              <span className="firma-date">
                Firmado {formatDistanceToNow(new Date(contract.fecha_firma || contract.created_at), { 
                  addSuffix: true, 
                  locale: es 
                })}
              </span>
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
