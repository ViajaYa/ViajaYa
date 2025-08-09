import { useState, useMemo } from 'react';
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
  const [activeTab, setActiveTab] = useState('overview');

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

    const nextUnpaid = paymentSchedule.find(item => !item.isPaid);
    if (nextUnpaid) {
      stats.nextPayment = nextUnpaid;
    }

    return stats;
  }, [paymentSchedule]);

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

  const getStatusBadgeClasses = (status) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case 'verified': return `${baseClasses} bg-green-100 text-green-800`;
      case 'pending': return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'rejected': return `${baseClasses} bg-red-100 text-red-800`;
      default: return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getScheduleItemClasses = (item) => {
    const baseClasses = "bg-white border-l-4 border rounded-lg p-4 shadow-sm";
    if (item.isPaid) return `${baseClasses} border-l-green-500 bg-green-50`;
    if (item.isOverdue) return `${baseClasses} border-l-red-500 bg-red-50`;
    if (item.daysUntilDue <= 3) return `${baseClasses} border-l-orange-500 bg-orange-50`;
    if (item.daysUntilDue <= 7) return `${baseClasses} border-l-yellow-500 bg-yellow-50`;
    return `${baseClasses} border-l-blue-500`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando detalles del contrato...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={onBack}
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver a la lista
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{contract.contract_number}</h1>
                <p className="text-gray-600">{contract.Quote?.nombre_cliente} - {contract.Quote?.destino}</p>
              </div>
            </div>
            <button 
              onClick={() => onPaymentUpload(contract)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              💰 Registrar Pago
            </button>
          </div>
        </div>
      </div>

      {/* Resumen financiero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Card principal de resumen financiero */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen Financiero</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Precio Total</div>
                <div className="text-xl font-bold text-gray-900">${financialDetails.precioTotal.toLocaleString()}</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-sm text-green-600">Total Pagado</div>
                <div className="text-xl font-bold text-green-700">${financialDetails.totalPagado.toLocaleString()}</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-sm text-red-600">Saldo Pendiente</div>
                <div className="text-xl font-bold text-red-700">${financialDetails.saldoPendiente.toLocaleString()}</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-600">Progreso</div>
                <div className="text-xl font-bold text-blue-700">{financialDetails.porcentajePagado.toFixed(1)}%</div>
              </div>
            </div>
            
            {/* Barra de progreso */}
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${financialDetails.porcentajePagado}%` }}
              ></div>
            </div>
            <div className="text-center mt-2 text-sm text-gray-600">
              {financialDetails.porcentajePagado.toFixed(1)}% completado
            </div>
          </div>

          {/* Card de próximo pago */}
          {scheduleStats.nextPayment && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Próximo Pago</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{scheduleStats.nextPayment.description}</span>
                  <span className="font-semibold text-gray-900">
                    ${scheduleStats.nextPayment.amount.toLocaleString()}
                  </span>
                </div>
                <div className={`text-sm p-2 rounded-md ${
                  scheduleStats.nextPayment.isOverdue 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {scheduleStats.nextPayment.isOverdue 
                    ? `⚠️ Vencido hace ${Math.abs(scheduleStats.nextPayment.daysUntilDue)} días`
                    : `⏰ Vence en ${scheduleStats.nextPayment.daysUntilDue} días`
                  }
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs de navegación */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button 
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'overview' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('overview')}
              >
                📊 Resumen
              </button>
              <button 
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'schedule' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('schedule')}
              >
                📅 Cronograma ({scheduleStats.total})
              </button>
              <button 
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'payments' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('payments')}
              >
                💳 Pagos Registrados ({payments?.length || 0})
              </button>
            </nav>
          </div>

          {/* Contenido de las tabs */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Estadísticas rápidas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">✅</span>
                      <div>
                        <div className="text-2xl font-bold text-green-600">{scheduleStats.paid}</div>
                        <div className="text-sm text-green-800">Pagos Completados</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">🚨</span>
                      <div>
                        <div className="text-2xl font-bold text-red-600">{scheduleStats.overdue}</div>
                        <div className="text-sm text-red-800">Pagos Vencidos</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">⚠️</span>
                      <div>
                        <div className="text-2xl font-bold text-yellow-600">{scheduleStats.upcoming}</div>
                        <div className="text-sm text-yellow-800">Próximos 7 días</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">📄</span>
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{paymentsStats.pending.length}</div>
                        <div className="text-sm text-blue-800">Pagos Pendientes</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Información del contrato */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Detalles del Contrato</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tipo de Pago:</span>
                      <span className="font-medium text-gray-900">
                        {contract.forma_pago === 'cuotas' ? (
                          <>📅 {contract.numero_cuotas_restantes} cuotas</>
                        ) : (
                          <>💳 Pago de contado</>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fecha de Inicio:</span>
                      <span className="font-medium text-gray-900">
                        {format(new Date(contract.fecha_inicio_viaje), 'dd/MM/yyyy')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fecha de Fin:</span>
                      <span className="font-medium text-gray-900">
                        {format(new Date(contract.fecha_fin_viaje), 'dd/MM/yyyy')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pasajeros:</span>
                      <span className="font-medium text-gray-900">👥 {contract.numero_pasajeros} personas</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-semibold text-gray-900">Cronograma de Pagos</h4>
                  <p className="text-gray-600">Gestiona el calendario de pagos del contrato</p>
                </div>
                
                <div className="space-y-4">
                  {paymentSchedule.map(item => (
                    <div key={item.id} className={getScheduleItemClasses(item)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-2xl">
                            {item.isPaid ? '✅' : item.isOverdue ? '🚨' : '⏳'}
                          </div>
                          <div>
                            <div className="flex items-center space-x-3">
                              <span className="font-medium text-gray-900">{item.description}</span>
                              <span className="font-bold text-lg text-gray-900">
                                ${item.amount.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                              <span>Vence: {format(item.dueDate, 'dd/MM/yyyy')}</span>
                              {item.isPaid && item.paidDate && (
                                <span className="text-green-600">
                                  Pagado: {format(item.paidDate, 'dd/MM/yyyy')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          {item.isPaid ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Pagado
                            </span>
                          ) : item.isOverdue ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Vencido ({Math.abs(item.daysUntilDue)} días)
                            </span>
                          ) : (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              item.daysUntilDue <= 7 ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {item.daysUntilDue > 0 
                                ? `${item.daysUntilDue} días`
                                : 'Vence hoy'
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-semibold text-gray-900">Historial de Pagos</h4>
                  <div className="flex space-x-4 text-sm">
                    <span className="inline-flex items-center text-green-600">
                      ✅ {paymentsStats.verified.length} Verificados
                    </span>
                    <span className="inline-flex items-center text-yellow-600">
                      ⏳ {paymentsStats.pending.length} Pendientes
                    </span>
                    <span className="inline-flex items-center text-red-600">
                      ❌ {paymentsStats.rejected.length} Rechazados
                    </span>
                  </div>
                </div>
                
                {payments && payments.length > 0 ? (
                  <div className="space-y-4">
                    {payments.map(payment => (
                      <div key={payment.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="text-2xl">
                              {getStatusIcon(payment.status)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-4 mb-2">
                                <span className="text-xl font-bold text-gray-900">
                                  ${parseFloat(payment.monto).toLocaleString()}
                                </span>
                                <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                  {payment.tipo_pago}
                                </span>
                                <span className={getStatusBadgeClasses(payment.status)}>
                                  {payment.status === 'verified' ? 'Verificado' :
                                   payment.status === 'pending' ? 'Pendiente' : 'Rechazado'}
                                </span>
                              </div>
                              
                              <div className="space-y-1 text-sm text-gray-600">
                                <div>{format(new Date(payment.fecha_pago), 'dd/MM/yyyy HH:mm')}</div>
                                {payment.referencia_pago && (
                                  <div>Ref: {payment.referencia_pago}</div>
                                )}
                                {payment.pagador_nombre && (
                                  <div>Por: {payment.pagador_nombre}</div>
                                )}
                              </div>
                              
                              {payment.observaciones && (
                                <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                                  <span className="font-medium text-gray-700">Observaciones:</span>
                                  <div className="text-gray-600">{payment.observaciones}</div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {payment.comprobante_url && (
                            <button 
                              onClick={() => window.open(payment.comprobante_url, '_blank')}
                              className="text-blue-600 hover:text-blue-800 p-2 rounded-md hover:bg-blue-50 transition-colors duration-200"
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
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <div className="text-4xl mb-4">💳</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pagos registrados</h3>
                    <p className="text-gray-600 mb-4">Este contrato aún no tiene pagos registrados</p>
                    <button 
                      onClick={() => onPaymentUpload(contract)}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                    >
                      Registrar Primer Pago
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
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