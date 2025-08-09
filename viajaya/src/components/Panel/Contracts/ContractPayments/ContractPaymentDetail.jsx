import  { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';

const ContractPaymentDetail = ({ 
  contract, 
  payments, 
  loading, 
  onBack, 
  onPaymentUpload, 
  onPaymentRegister 
}) => {
  const [activeTab, setActiveTab] = useState('overview'); // overview, payments, schedule

  // ✅ CALCULAR INFORMACIÓN FINANCIERA DETALLADA
  const financialDetails = useMemo(() => {
    const precioTotal = parseFloat(contract.precio_total || 0);
    const totalPagado = parseFloat(contract.total_pagado || 0);
    const saldoPendiente = parseFloat(contract.saldo_pendiente || precioTotal);
    const porcentajePagado = precioTotal > 0 ? (totalPagado / precioTotal) * 100 : 0;

    return {
      precioTotal,
      totalPagado,
      saldoPendiente,
      porcentajePagado,
      completamentePagado: saldoPendiente <= 0
    };
  }, [contract]);

  // ✅ GENERAR CRONOGRAMA DE PAGOS
  const paymentSchedule = useMemo(() => {
    const schedule = [];
    const today = new Date();

    // Cuota inicial si existe
    if (contract.tiene_cuota_inicial) {
      schedule.push({
        id: 'initial',
        type: 'cuota_inicial',
        description: 'Cuota Inicial',
        amount: parseFloat(contract.cuota_inicial_monto || 0),
        dueDate: new Date(contract.fecha_vencimiento_inicial),
        isPaid: contract.cuota_inicial_pagada,
        paidDate: contract.fecha_pago_inicial ? new Date(contract.fecha_pago_inicial) : null,
        isOverdue: !contract.cuota_inicial_pagada && new Date(contract.fecha_vencimiento_inicial) < today,
        daysUntilDue: !contract.cuota_inicial_pagada ? 
          Math.ceil((new Date(contract.fecha_vencimiento_inicial) - today) / (1000 * 60 * 60 * 24)) : null
      });
    }

    // Cuotas restantes
    if (contract.fechas_vencimiento_cuotas && contract.fechas_vencimiento_cuotas.length > 0) {
      contract.fechas_vencimiento_cuotas.forEach((fecha, index) => {
        const dueDate = new Date(fecha);
        const isPaid = contract.cuotas_pagadas && contract.cuotas_pagadas[index];
        const paidDate = contract.fechas_pago_cuotas && contract.fechas_pago_cuotas[index] ? 
          new Date(contract.fechas_pago_cuotas[index]) : null;

        schedule.push({
          id: `cuota_${index + 1}`,
          type: 'cuota',
          description: `Cuota ${index + 1}`,
          amount: parseFloat(contract.valor_cuota_restante || 0),
          dueDate,
          isPaid,
          paidDate,
          isOverdue: !isPaid && dueDate < today,
          daysUntilDue: !isPaid ? Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24)) : null
        });
      });
    }

    // Si es pago de contado
    if (contract.forma_pago === 'contado' && !financialDetails.completamentePagado) {
      schedule.push({
        id: 'contado',
        type: 'contado',
        description: 'Pago Total',
        amount: financialDetails.saldoPendiente,
        dueDate: new Date(contract.fecha_inicio_viaje),
        isPaid: false,
        paidDate: null,
        isOverdue: new Date(contract.fecha_inicio_viaje) < today,
        daysUntilDue: Math.ceil((new Date(contract.fecha_inicio_viaje) - today) / (1000 * 60 * 60 * 24))
      });
    }

    return schedule.sort((a, b) => a.dueDate - b.dueDate);
  }, [contract, financialDetails]);

  // ✅ ESTADÍSTICAS DEL CRONOGRAMA
  const scheduleStats = useMemo(() => {
    const stats = {
      total: paymentSchedule.length,
      paid: 0,
      overdue: 0,
      upcoming: 0,
      nextPayment: null
    };

    paymentSchedule.forEach(item => {
      if (item.isPaid) {
        stats.paid++;
      } else if (item.isOverdue) {
        stats.overdue++;
      } else if (item.daysUntilDue <= 7) {
        stats.upcoming++;
      }
    });

    // Próximo pago
    const nextUnpaid = paymentSchedule.find(item => !item.isPaid);
    if (nextUnpaid) {
      stats.nextPayment = nextUnpaid;
    }

    return stats;
  }, [paymentSchedule]);

  // ✅ PAGOS VERIFICADOS Y PENDIENTES
  const paymentsStats = useMemo(() => {
    if (!payments) return { verified: [], pending: [], rejected: [] };

    return {
      verified: payments.filter(p => p.status === 'verified'),
      pending: payments.filter(p => p.status === 'pending'),
      rejected: payments.filter(p => p.status === 'rejected')
    };
  }, [payments]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified': return '✅';
      case 'pending': return '⏳';
      case 'rejected': return '❌';
      default: return '📄';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'verified': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'danger';
      default: return 'default';
    }
  };

  const getScheduleItemClass = (item) => {
    if (item.isPaid) return 'paid';
    if (item.isOverdue) return 'overdue';
    if (item.daysUntilDue <= 3) return 'urgent';
    if (item.daysUntilDue <= 7) return 'warning';
    return 'pending';
  };

  if (loading) {
    return (
      <div className="contract-detail-loading">
        <div className="spinner"></div>
        <p>Cargando detalles del contrato...</p>
      </div>
    );
  }

  return (
    <div className="contract-payment-detail">
      {/* Header */}
      <div className="detail-header">
        <button className="back-btn" onClick={onBack}>
          ← Volver a la lista
        </button>
        <div className="contract-info">
          <h1>{contract.contract_number}</h1>
          <p>{contract.Quote?.nombre_cliente} - {contract.Quote?.destino}</p>
        </div>
        <button 
          className="primary-btn"
          onClick={() => onPaymentUpload(contract)}
        >
          💰 Registrar Pago
        </button>
      </div>

      {/* Resumen financiero */}
      <div className="financial-summary">
        <div className="summary-card">
          <h3>Resumen Financiero</h3>
          <div className="financial-grid">
            <div className="financial-item">
              <span className="label">Precio Total:</span>
              <span className="value total">${financialDetails.precioTotal.toLocaleString()}</span>
            </div>
            <div className="financial-item">
              <span className="label">Total Pagado:</span>
              <span className="value paid">${financialDetails.totalPagado.toLocaleString()}</span>
            </div>
            <div className="financial-item">
              <span className="label">Saldo Pendiente:</span>
              <span className="value pending">${financialDetails.saldoPendiente.toLocaleString()}</span>
            </div>
            <div className="financial-item">
              <span className="label">Progreso:</span>
              <span className="value progress">{financialDetails.porcentajePagado.toFixed(1)}%</span>
            </div>
          </div>
          
          <div className="progress-bar-container">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${financialDetails.porcentajePagado}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Próximo pago */}
        {scheduleStats.nextPayment && (
          <div className="next-payment-card">
            <h4>Próximo Pago</h4>
            <div className="next-payment-info">
              <span className="payment-description">{scheduleStats.nextPayment.description}</span>
              <span className="payment-amount">${scheduleStats.nextPayment.amount.toLocaleString()}</span>
              <span className={`payment-due ${scheduleStats.nextPayment.isOverdue ? 'overdue' : ''}`}>
                {scheduleStats.nextPayment.isOverdue 
                  ? `Vencido hace ${Math.abs(scheduleStats.nextPayment.daysUntilDue)} días`
                  : `Vence en ${scheduleStats.nextPayment.daysUntilDue} días`
                }
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs de navegación */}
      <div className="detail-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Resumen
        </button>
        <button 
          className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          📅 Cronograma ({scheduleStats.total})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          💳 Pagos Registrados ({payments?.length || 0})
        </button>
      </div>

      {/* Contenido de las tabs */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-content">
            {/* Estadísticas rápidas */}
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-icon">✅</span>
                <div className="stat-info">
                  <span className="stat-number">{scheduleStats.paid}</span>
                  <span className="stat-label">Pagos Completados</span>
                </div>
              </div>
              <div className="stat-card overdue">
                <span className="stat-icon">🚨</span>
                <div className="stat-info">
                  <span className="stat-number">{scheduleStats.overdue}</span>
                  <span className="stat-label">Pagos Vencidos</span>
                </div>
              </div>
              <div className="stat-card warning">
                <span className="stat-icon">⚠️</span>
                <div className="stat-info">
                  <span className="stat-number">{scheduleStats.upcoming}</span>
                  <span className="stat-label">Próximos 7 días</span>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">📄</span>
                <div className="stat-info">
                  <span className="stat-number">{paymentsStats.pending.length}</span>
                  <span className="stat-label">Pagos Pendientes</span>
                </div>
              </div>
            </div>

            {/* Información del contrato */}
            <div className="contract-details">
              <h4>Detalles del Contrato</h4>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="label">Tipo de Pago:</span>
                  <span className="value">
                    {contract.forma_pago === 'cuotas' ? (
                      <>📅 {contract.numero_cuotas_restantes} cuotas</>
                    ) : (
                      <>💳 Pago de contado</>
                    )}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">Fecha de Inicio:</span>
                  <span className="value">{format(new Date(contract.fecha_inicio_viaje), 'dd/MM/yyyy')}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Fecha de Fin:</span>
                  <span className="value">{format(new Date(contract.fecha_fin_viaje), 'dd/MM/yyyy')}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Pasajeros:</span>
                  <span className="value">👥 {contract.numero_pasajeros} personas</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="schedule-content">
            <div className="schedule-header">
              <h4>Cronograma de Pagos</h4>
              <p>Gestiona el calendario de pagos del contrato</p>
            </div>
            
            <div className="schedule-list">
              {paymentSchedule.map(item => (
                <div key={item.id} className={`schedule-item ${getScheduleItemClass(item)}`}>
                  <div className="schedule-icon">
                    {item.isPaid ? '✅' : item.isOverdue ? '🚨' : '⏳'}
                  </div>
                  
                  <div className="schedule-info">
                    <div className="schedule-title">
                      <span className="description">{item.description}</span>
                      <span className="amount">${item.amount.toLocaleString()}</span>
                    </div>
                    
                    <div className="schedule-dates">
                      <span className="due-date">
                        Vence: {format(item.dueDate, 'dd/MM/yyyy')}
                      </span>
                      {item.isPaid && item.paidDate && (
                        <span className="paid-date">
                          Pagado: {format(item.paidDate, 'dd/MM/yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="schedule-status">
                    {item.isPaid ? (
                      <span className="status-badge paid">Pagado</span>
                    ) : item.isOverdue ? (
                      <span className="status-badge overdue">
                        Vencido ({Math.abs(item.daysUntilDue)} días)
                      </span>
                    ) : (
                      <span className={`status-badge ${item.daysUntilDue <= 7 ? 'warning' : 'pending'}`}>
                        {item.daysUntilDue > 0 
                          ? `${item.daysUntilDue} días`
                          : 'Vence hoy'
                        }
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="payments-content">
            <div className="payments-header">
              <h4>Historial de Pagos</h4>
              <div className="payments-summary">
                <span className="summary-item success">✅ {paymentsStats.verified.length} Verificados</span>
                <span className="summary-item warning">⏳ {paymentsStats.pending.length} Pendientes</span>
                <span className="summary-item danger">❌ {paymentsStats.rejected.length} Rechazados</span>
              </div>
            </div>
            
            {payments && payments.length > 0 ? (
              <div className="payments-list">
                {payments.map(payment => (
                  <div key={payment.id} className={`payment-item ${getStatusClass(payment.status)}`}>
                    <div className="payment-icon">
                      {getStatusIcon(payment.status)}
                    </div>
                    
                    <div className="payment-info">
                      <div className="payment-header">
                        <span className="payment-amount">${parseFloat(payment.monto).toLocaleString()}</span>
                        <span className="payment-type">{payment.tipo_pago}</span>
                        <span className={`payment-status ${getStatusClass(payment.status)}`}>
                          {payment.status === 'verified' ? 'Verificado' :
                           payment.status === 'pending' ? 'Pendiente' : 'Rechazado'}
                        </span>
                      </div>
                      
                      <div className="payment-details">
                        <span className="payment-date">
                          {format(new Date(payment.fecha_pago), 'dd/MM/yyyy HH:mm')}
                        </span>
                        {payment.referencia_pago && (
                          <span className="payment-reference">Ref: {payment.referencia_pago}</span>
                        )}
                        {payment.pagador_nombre && (
                          <span className="payment-payer">Por: {payment.pagador_nombre}</span>
                        )}
                      </div>
                      
                      {payment.observaciones && (
                        <div className="payment-notes">
                          <span className="notes-label">Observaciones:</span>
                          <span className="notes-text">{payment.observaciones}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="payment-actions">
                      {payment.comprobante_url && (
                        <button 
                          className="view-receipt-btn"
                          onClick={() => window.open(payment.comprobante_url, '_blank')}
                          title="Ver comprobante"
                        >
                          📄
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-payments">
                <p>No hay pagos registrados para este contrato</p>
                <button 
                  className="primary-btn"
                  onClick={() => onPaymentUpload(contract)}
                >
                  Registrar Primer Pago
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

ContractPaymentDetail.propTypes = {
  contract: PropTypes.object.isRequired,
  payments: PropTypes.array,
  loading: PropTypes.bool.isRequired,
  onBack: PropTypes.func.isRequired,
  onPaymentUpload: PropTypes.func.isRequired,
  onPaymentRegister: PropTypes.func.isRequired,
};

export default ContractPaymentDetail;