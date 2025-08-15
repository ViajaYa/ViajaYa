import  { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchContracts,
  selectContracts,
  selectContractLoading
} from '../../../../redux/slices/contractSlice';
import {
  registerClientPayment,
  fetchPaymentsByContract,
  selectRegisteringPayment,
  selectContractPayments
} from '../../../../redux/slices/paymentSlice';
import ContractsPaymentList from './ContractsPaymentList';
import ContractPaymentDetail from './ContractPaymentDetail';
import PaymentUploadModal from './PaymentUploadModal';

const ContractPaymentsManager = () => {
  const dispatch = useDispatch();
  
  // Estados locales
  const [selectedContract, setSelectedContract] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [filters, setFilters] = useState({
    paymentStatus: 'all',
    sortBy: 'priority',
    search: ''
  });
  const [alertsOnly, setAlertsOnly] = useState(false);

  // Estados del store corregidos
  const allContracts = useSelector(selectContracts);
  const contractPayments = useSelector(selectContractPayments);
  const loading = useSelector(selectContractLoading);
  const registeringPayment = useSelector(selectRegisteringPayment);

  // Filtrar contratos firmados
  const signedContracts = useMemo(() => {
    return allContracts.filter(contract => contract.status === 'completed');
  }, [allContracts]);

  // Cargar contratos al montar
  useEffect(() => {
    dispatch(fetchContracts());
  }, [dispatch]);

  // Función para calcular estado de pagos
  const calculatePaymentStatus = (contract) => {
    const today = new Date();
    const precioTotal = parseFloat(contract.precio_total || 0);
    const totalPagado = parseFloat(contract.total_pagado || 0);
    const saldoPendiente = parseFloat(contract.saldo_pendiente || precioTotal);
    
    let status = {
      type: 'pending',
      priority: 1,
      message: '',
      daysUntilDue: null,
      overdayDays: 0,
      alerts: []
    };

    if (saldoPendiente <= 0) {
      status.type = 'completed';
      status.priority = 1;
      status.message = 'Pago completo';
      return status;
    }

    if (contract.forma_pago === 'cuotas') {
      const alerts = [];
      
      if (contract.tiene_cuota_inicial && !contract.cuota_inicial_pagada) {
        const vencimientoInicial = new Date(contract.fecha_vencimiento_inicial);
        const diffTime = vencimientoInicial.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
          alerts.push(`Cuota inicial vencida hace ${Math.abs(diffDays)} días`);
          status.priority = 3;
          status.overdayDays = Math.abs(diffDays);
        } else if (diffDays <= 3) {
          alerts.push(`Cuota inicial vence en ${diffDays} días`);
          status.priority = 2;
          status.daysUntilDue = diffDays;
        }
      }
      
      if (contract.fechas_vencimiento_cuotas && contract.cuotas_pagadas) {
        contract.fechas_vencimiento_cuotas.forEach((fecha, index) => {
          if (!contract.cuotas_pagadas[index]) {
            const vencimiento = new Date(fecha);
            const diffTime = vencimiento.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays < 0) {
              alerts.push(`Cuota ${index + 1} vencida hace ${Math.abs(diffDays)} días`);
              status.priority = 3;
              status.overdayDays = Math.max(status.overdayDays, Math.abs(diffDays));
            } else if (diffDays <= 7) {
              alerts.push(`Cuota ${index + 1} vence en ${diffDays} días`);
              status.priority = Math.max(status.priority, 2);
              status.daysUntilDue = Math.min(status.daysUntilDue || diffDays, diffDays);
            }
          }
        });
      }
      
      status.alerts = alerts;
      
      if (totalPagado > 0) {
        status.type = alerts.length > 0 ? 'overdue' : 'partial';
        status.message = `${alerts.length > 0 ? 'Con vencimientos' : 'Pagos parciales'} - $${totalPagado.toLocaleString()} de $${precioTotal.toLocaleString()}`;
      } else {
        status.type = alerts.length > 0 ? 'overdue' : 'pending';
        status.message = alerts.length > 0 ? 'Con vencimientos pendientes' : 'Sin pagos registrados';
      }
    } else {
      const fechaViaje = new Date(contract.fecha_inicio_viaje);
      const diffTime = fechaViaje.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 0) {
        status.alerts.push('Viaje iniciado - Pago urgente');
        status.priority = 3;
        status.type = 'overdue';
      } else if (diffDays <= 7) {
        status.alerts.push(`Viaje en ${diffDays} días - Confirmar pago`);
        status.priority = 2;
        status.type = 'pending';
        status.daysUntilDue = diffDays;
      }
      
      status.message = totalPagado > 0 
        ? `Pago parcial: $${totalPagado.toLocaleString()} de $${precioTotal.toLocaleString()}`
        : 'Pago de contado pendiente';
    }

    return status;
  };

  const processedContracts = useMemo(() => {
    if (!signedContracts || signedContracts.length === 0) return [];
    
    return signedContracts.map(contract => ({
      ...contract,
      paymentStatus: calculatePaymentStatus(contract)
    }));
  }, [signedContracts]);

  const filteredContracts = useMemo(() => {
    let filtered = [...processedContracts];
    
    if (filters.paymentStatus !== 'all') {
      filtered = filtered.filter(contract => {
        switch (filters.paymentStatus) {
          case 'pending':
            return contract.paymentStatus.type === 'pending';
          case 'partial':
            return contract.paymentStatus.type === 'partial';
          case 'overdue':
            return contract.paymentStatus.type === 'overdue';
          case 'alerts':
            return contract.paymentStatus.alerts.length > 0;
          default:
            return true;
        }
      });
    }
    
    if (alertsOnly) {
      filtered = filtered.filter(contract => 
        contract.paymentStatus.priority >= 2
      );
    }
    
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(contract =>
        contract.contract_number.toLowerCase().includes(search) ||
        contract.Quote?.nombre_cliente.toLowerCase().includes(search) ||
        contract.Quote?.destino.toLowerCase().includes(search)
      );
    }
    
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'priority':
          if (b.paymentStatus.priority !== a.paymentStatus.priority) {
            return b.paymentStatus.priority - a.paymentStatus.priority;
          }
          if (a.paymentStatus.daysUntilDue !== null && b.paymentStatus.daysUntilDue !== null) {
            return a.paymentStatus.daysUntilDue - b.paymentStatus.daysUntilDue;
          }
          return a.paymentStatus.overdayDays - b.paymentStatus.overdayDays;
          
        case 'date':
          return new Date(b.created_at) - new Date(a.created_at);
          
        case 'amount':
          return parseFloat(b.saldo_pendiente || 0) - parseFloat(a.saldo_pendiente || 0);
          
        case 'client':
          return (a.Quote?.nombre_cliente || '').localeCompare(b.Quote?.nombre_cliente || '');
          
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [processedContracts, filters, alertsOnly]);

  const contractStats = useMemo(() => {
    const stats = {
      total: processedContracts.length,
      pending: 0,
      partial: 0,
      overdue: 0,
      completed: 0,
      alerts: 0,
      totalPendingAmount: 0
    };
    
    processedContracts.forEach(contract => {
      stats[contract.paymentStatus.type]++;
      if (contract.paymentStatus.alerts.length > 0) {
        stats.alerts++;
      }
      stats.totalPendingAmount += parseFloat(contract.saldo_pendiente || 0);
    });
    
    return stats;
  }, [processedContracts]);

  // Handlers
  const handleContractSelect = (contract) => {
    setSelectedContract(contract);
    dispatch(fetchPaymentsByContract(contract.id));
  };

  const handlePaymentUpload = (contract) => {
    setSelectedContract(contract);
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (paymentData, comprobante) => {
    try {
      await dispatch(registerClientPayment({
        contractId: selectedContract.id,
        paymentData,
        comprobante
      })).unwrap();
      
      dispatch(fetchContracts());
      dispatch(fetchPaymentsByContract(selectedContract.id));
      setShowPaymentModal(false);
    } catch (error) {
      console.error('Error registrando pago:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando contratos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con estadísticas */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Gestión de Pagos - Contratos Firmados
              </h1>
              <p className="text-gray-600">
                Administra los pagos de contratos que requieren seguimiento
              </p>
            </div>
            
            {/* Estadísticas rápidas */}
            <div className="mt-6 lg:mt-0 grid grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Total Contratos */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">
                  {contractStats.total}
                </div>
                <div className="text-sm text-blue-800">Total Contratos</div>
              </div>
              
              {/* Vencimientos */}
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-600">
                  {contractStats.overdue}
                </div>
                <div className="text-sm text-red-800">Con Vencimientos</div>
              </div>
              
              {/* Pagos Parciales */}
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-600">
                  {contractStats.partial}
                </div>
                <div className="text-sm text-yellow-800">Pagos Parciales</div>
              </div>
              
              {/* Completados */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">
                  {contractStats.completed}
                </div>
                <div className="text-sm text-green-800">Completados</div>
              </div>
              
              {/* Monto Total */}
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 col-span-2 lg:col-span-1">
                <div className="text-lg font-bold text-purple-600">
                  ${contractStats.totalPendingAmount.toLocaleString()}
                </div>
                <div className="text-sm text-purple-800">Saldo Pendiente</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros y controles */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            {/* Filtros principales */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              {/* Filtro por estado */}
              <select 
                value={filters.paymentStatus} 
                onChange={(e) => setFilters(prev => ({...prev, paymentStatus: e.target.value}))}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos los estados</option>
                <option value="overdue">Con vencimientos</option>
                <option value="partial">Pagos parciales</option>
                <option value="pending">Sin pagos</option>
                <option value="alerts">Solo alertas</option>
              </select>
              
              {/* Ordenamiento */}
              <select 
                value={filters.sortBy} 
                onChange={(e) => setFilters(prev => ({...prev, sortBy: e.target.value}))}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="priority">Por prioridad</option>
                <option value="date">Por fecha</option>
                <option value="amount">Por monto</option>
                <option value="client">Por cliente</option>
              </select>
              
              {/* Buscador */}
              <input
                type="text"
                placeholder="Buscar por contrato, cliente o destino..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({...prev, search: e.target.value}))}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-0 sm:min-w-[300px]"
              />
            </div>
            
            {/* Toggle solo alertas */}
            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={alertsOnly}
                  onChange={(e) => setAlertsOnly(e.target.checked)}
                  className="sr-only"
                />
                <div className="relative">
                  <div className={`block bg-gray-600 w-14 h-8 rounded-full transition-colors duration-200 ease-in-out ${
                    alertsOnly ? 'bg-red-500' : 'bg-gray-400'
                  }`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-200 ease-in-out ${
                    alertsOnly ? 'transform translate-x-6' : ''
                  }`}></div>
                </div>
                <span className="ml-3 text-sm font-medium text-gray-700">
                  Solo alertas urgentes
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!selectedContract ? (
          <ContractsPaymentList
            contracts={filteredContracts}
            loading={loading}
            onContractSelect={handleContractSelect}
            onPaymentUpload={handlePaymentUpload}
          />
        ) : (
          <ContractPaymentDetail
            contract={selectedContract}
            payments={contractPayments}
            loading={loading}
            onBack={() => setSelectedContract(null)}
            onPaymentUpload={() => handlePaymentUpload(selectedContract)}
            onPaymentRegister={handlePaymentSubmit}
          />
        )}
      </div>

      {/* Modal de carga de pagos */}
      {showPaymentModal && (
        <PaymentUploadModal
          contract={selectedContract}
          onClose={() => setShowPaymentModal(false)}
          onSubmit={handlePaymentSubmit}
          loading={registeringPayment}
        />
      )}
    </div>
  );
};

export default ContractPaymentsManager;