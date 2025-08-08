import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import ItemCard from './ItemCard';
import PurchaseUploadModal from './PurchaseUploadModal';
import DeadlineUpdateModal from './DeadlineUpdateModal';
import {
  // Actions
  fetchContractItemsWithPurchases,
  uploadPurchaseReceipt,
  updateItemDeadline,
  markPaymentCompleted,
  fetchContractPurchaseStats,
  convertQuoteToContractItems,
  
  // Selectors
  selectPurchaseManagement,
  selectPurchaseItems,
  selectPurchaseStats,
  selectPurchaseLoading,
  selectPurchaseError,
  selectUploadingReceipt,
  selectUpdatingDeadline,
  selectMarkingPayment,
  selectCriticalItems,
  selectOverdueItems,
  selectPendingPurchases,
  selectCompletedPurchases
} from '../../../redux/slices/contractSlice';

// Icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShoppingCart, faPlane, faHotel, faCar, faUtensils,
  faSuitcase, faShieldAlt, faMapMarkedAlt, faGift,
  faExclamationTriangle, faCheckCircle, faTimesCircle,
  faUpload, faEye, faCalendarAlt, faMoneyBillWave,
  faClock, faSort, faFilter, faSpinner, faDownload,
  faBell, faPercent, faChartLine, faWarning, faCoins
} from '@fortawesome/free-solid-svg-icons';

const ContractPurchaseManager = () => {
  const { contractId } = useParams();
  const dispatch = useDispatch();
  
  // Redux selectors
  const purchaseManagement = useSelector(selectPurchaseManagement);
  const items = useSelector(selectPurchaseItems);
  const stats = useSelector(selectPurchaseStats);
  const loading = useSelector(selectPurchaseLoading);
  const error = useSelector(selectPurchaseError);
  const uploadingReceipt = useSelector(selectUploadingReceipt);
  const updatingDeadline = useSelector(selectUpdatingDeadline);
  const markingPayment = useSelector(selectMarkingPayment);
  
  // Selectores calculados
  const criticalItems = useSelector(selectCriticalItems);
  const overdueItems = useSelector(selectOverdueItems);
  const pendingPurchases = useSelector(selectPendingPurchases);
  const completedPurchases = useSelector(selectCompletedPurchases);
  
  // Estados locales
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('priority');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // ✅ CONFIGURACIÓN DE TIPOS DE ITEMS
  const itemConfig = React.useMemo(() => ({
    tickets: {
      icon: faPlane,
      color: '#dc2626',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      name: 'Tickets Aéreos',
      priority: 1
    },
    hotel: {
      icon: faHotel,
      color: '#2563eb',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      name: 'Alojamiento',
      priority: 2
    },
    traslados: {
      icon: faCar,
      color: '#059669',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      name: 'Traslados',
      priority: 3
    },
    alimentacion: {
      icon: faUtensils,
      color: '#d97706',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      name: 'Alimentación',
      priority: 4
    },
    equipaje: {
      icon: faSuitcase,
      color: '#7c3aed',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      name: 'Equipaje',
      priority: 5
    },
    seguro_asistencia: {
      icon: faShieldAlt,
      color: '#10b981',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      name: 'Seguro Asistencia',
      priority: 2
    },
    seguro_cancelacion: {
      icon: faShieldAlt,
      color: '#f59e0b',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      name: 'Seguro Cancelación',
      priority: 3
    },
    excursiones: {
      icon: faMapMarkedAlt,
      color: '#f59e0b',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      name: 'Excursiones',
      priority: 6
    },
    extras: {
      icon: faGift,
      color: '#8b5cf6',
      bgColor: 'bg-violet-50',
      borderColor: 'border-violet-200',
      name: 'Extras',
      priority: 7
    },
    comisiones: {
      icon: faPercent,
      color: '#64748b',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      name: 'Comisiones',
      priority: 8
    },
    ganancia_empresa: {
      icon: faCoins,
      color: '#64748b',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      name: 'Ganancia Empresa',
      priority: 9
    }
  }), []);

  // ✅ FUNCIÓN PARA DETERMINAR COLOR DE ALERTA
  const getAlertStatus = useCallback((item) => {
    if (!item.requiere_compra) return 'no-required';
    if (item.status === 'comprado_pagado') return 'completed';
    if (item.status === 'vencido') return 'expired';
    
    if (item.fecha_limite_compra) {
      const now = new Date();
      const deadline = new Date(item.fecha_limite_compra);
      const diffHours = (deadline - now) / (1000 * 60 * 60);
      
      if (diffHours < 0) return 'expired';
      if (diffHours < 24) return 'critical';
      if (diffHours < 72) return 'warning';
      return 'normal';
    }
    
    return 'no-deadline';
  }, []);

  // ✅ CONFIGURACIÓN DE COLORES DE ALERTA
  const alertConfig = {
    'expired': {
      bg: 'bg-red-100',
      border: 'border-red-500',
      text: 'text-red-800',
      icon: faTimesCircle,
      label: 'Vencido'
    },
    'critical': {
      bg: 'bg-red-50',
      border: 'border-red-400',
      text: 'text-red-700',
      icon: faExclamationTriangle,
      label: 'Crítico (<24h)'
    },
    'warning': {
      bg: 'bg-yellow-50',
      border: 'border-yellow-400',
      text: 'text-yellow-700',
      icon: faWarning,
      label: 'Advertencia (<72h)'
    },
    'normal': {
      bg: 'bg-blue-50',
      border: 'border-blue-400',
      text: 'text-blue-700',
      icon: faClock,
      label: 'Normal'
    },
    'completed': {
      bg: 'bg-green-50',
      border: 'border-green-400',
      text: 'text-green-700',
      icon: faCheckCircle,
      label: 'Completado'
    },
    'no-deadline': {
      bg: 'bg-gray-50',
      border: 'border-gray-400',
      text: 'text-gray-700',
      icon: faCalendarAlt,
      label: 'Sin fecha límite'
    },
    'no-required': {
      bg: 'bg-gray-100',
      border: 'border-gray-300',
      text: 'text-gray-600',
      icon: faCheckCircle,
      label: 'No requiere compra'
    }
  };

  // ✅ CARGAR DATOS AL MONTAR
  useEffect(() => {
    if (contractId) {
      dispatch(fetchContractItemsWithPurchases(contractId));
    }
  }, [dispatch, contractId]);

  // ✅ MANEJAR ERRORES
  useEffect(() => {
    if (error) {
      toast.error(`Error: ${error}`);
    }
  }, [error]);

  // ✅ FILTRAR Y ORDENAR ITEMS
  const filteredAndSortedItems = React.useMemo(() => {
    let filtered = [...items];

    // Aplicar filtros
    switch (filter) {
      case 'pending':
        filtered = filtered.filter(item => item.status === 'pendiente_compra');
        break;
      case 'completed':
        filtered = filtered.filter(item => item.status === 'comprado_pagado');
        break;
      case 'critical':
        filtered = filtered.filter(item => {
          const alertStatus = getAlertStatus(item);
          return alertStatus === 'critical' || alertStatus === 'expired';
        });
        break;
      case 'overdue':
        filtered = filtered.filter(item => getAlertStatus(item) === 'expired');
        break;
      default:
        // 'all' - no filtrar
        break;
    }

    // Aplicar ordenamiento
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority': {
          const priorityA = itemConfig[a.tipo]?.priority || 999;
          const priorityB = itemConfig[b.tipo]?.priority || 999;
          return priorityA - priorityB;
        }
        
        case 'date': {
          if (!a.fecha_limite_compra && !b.fecha_limite_compra) return 0;
          if (!a.fecha_limite_compra) return 1;
          if (!b.fecha_limite_compra) return -1;
          return new Date(a.fecha_limite_compra) - new Date(b.fecha_limite_compra);
        }
        
        case 'price': {
          return (parseFloat(b.precio_total) || 0) - (parseFloat(a.precio_total) || 0);
        }
        
        case 'status': {
          const statusOrder = {
            'vencido': 0,
            'pendiente_compra': 1,
            'comprado_pendiente': 2,
            'comprado_pagado': 3,
            'no_requiere': 4
          };
          return (statusOrder[a.status] || 5) - (statusOrder[b.status] || 5);
        }
        
        default: {
          return 0;
        }
      }
    });

    return filtered;
  }, [items, filter, sortBy, getAlertStatus, itemConfig]);

  // ✅ CALCULAR ESTADÍSTICAS DETALLADAS
  const calculatedStats = React.useMemo(() => {
    const itemsWithPurchase = items.filter(item => item.requiere_compra !== false);
    
    const totals = itemsWithPurchase.reduce((acc, item) => {
      acc.total++;
      
      const alertStatus = getAlertStatus(item);
      switch (alertStatus) {
        case 'completed':
          acc.completed++;
          break;
        case 'expired':
          acc.expired++;
          break;
        case 'critical':
          acc.critical++;
          break;
        case 'warning':
          acc.warning++;
          break;
        default:
          acc.pending++;
      }
      
      acc.totalCotizado += parseFloat(item.precio_total || 0);
      if (item.Purchases && item.Purchases.length > 0) {
        acc.totalComprado += parseFloat(item.Purchases[0].costo || 0);
      }
      
      return acc;
    }, {
      total: 0,
      completed: 0,
      pending: 0,
      expired: 0,
      critical: 0,
      warning: 0,
      totalCotizado: 0,
      totalComprado: 0
    });

    const diferenciaPrecio = totals.totalComprado - totals.totalCotizado;
    const progresoCompletado = totals.total > 0 ? (totals.completed / totals.total) * 100 : 0;

    return {
      ...totals,
      diferenciaPrecio,
      progresoCompletado: Math.round(progresoCompletado)
    };
  }, [items, getAlertStatus]);

  // ✅ MANEJAR SUBIDA DE COMPROBANTE
  const handleUploadReceipt = async (formData) => {
    try {
      await dispatch(uploadPurchaseReceipt({
        itemId: selectedItem.id,
        formData
      })).unwrap();
      
      toast.success('Comprobante subido exitosamente');
      setShowUploadModal(false);
      setSelectedItem(null);
      
      // Recargar datos
      dispatch(fetchContractItemsWithPurchases(contractId));
    } catch (error) {
      toast.error(`Error subiendo comprobante: ${error}`);
    }
  };

  // ✅ MANEJAR ACTUALIZACIÓN DE FECHA LÍMITE
  const handleUpdateDeadline = async (fecha_limite_compra) => {
    try {
      await dispatch(updateItemDeadline({
        itemId: selectedItem.id,
        fecha_limite_compra
      })).unwrap();
      
      toast.success('Fecha límite actualizada');
      setShowDeadlineModal(false);
      setSelectedItem(null);
    } catch (error) {
      toast.error(`Error actualizando fecha límite: ${error}`);
    }
  };

  // ✅ MANEJAR MARCAR PAGO COMPLETADO
  const handleMarkPaymentCompleted = async (purchaseId, observaciones = '') => {
    try {
      await dispatch(markPaymentCompleted({
        purchaseId,
        observaciones
      })).unwrap();
      
      toast.success('Pago marcado como completado');
    } catch (error) {
      toast.error(`Error marcando pago: ${error}`);
    }
  };

  // ✅ RENDERIZAR LOADING
  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <FontAwesomeIcon 
            icon={faSpinner} 
            className="text-4xl text-blue-600 animate-spin mb-4" 
          />
          <p className="text-lg text-gray-600">Cargando gestión de compras...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* ✅ HEADER DEL DASHBOARD */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            <FontAwesomeIcon icon={faShoppingCart} className="mr-3 text-blue-600" />
            Gestión de Compras - Contrato #{contractId?.slice(-8)}
          </h1>
          <div className="flex space-x-3">
            <button 
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              onClick={() => dispatch(convertQuoteToContractItems(contractId))}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faDownload} className="mr-2" />
              Importar desde Cotización
            </button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <FontAwesomeIcon icon={faUpload} className="mr-2" />
              Subir Masivo
            </button>
          </div>
        </div>

        {/* ✅ TARJETAS DE ESTADÍSTICAS */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <StatCard 
            icon={faShoppingCart}
            label="Total Items"
            value={calculatedStats.total}
            color="blue"
          />
          <StatCard 
            icon={faCheckCircle}
            label="Completados"
            value={calculatedStats.completed}
            color="green"
          />
          <StatCard 
            icon={faExclamationTriangle}
            label="Críticos"
            value={calculatedStats.critical + calculatedStats.expired}
            color="red"
          />
          <StatCard 
            icon={faClock}
            label="Advertencia"
            value={calculatedStats.warning}
            color="yellow"
          />
          <StatCard 
            icon={faMoneyBillWave}
            label="Cotizado"
            value={`$${calculatedStats.totalCotizado.toLocaleString('es-CO')}`}
            color="gray"
            isAmount
          />
          <StatCard 
            icon={faChartLine}
            label="Diferencia"
            value={`${calculatedStats.diferenciaPrecio >= 0 ? '+' : ''}$${calculatedStats.diferenciaPrecio.toLocaleString('es-CO')}`}
            color={calculatedStats.diferenciaPrecio >= 0 ? 'red' : 'green'}
            isAmount
          />
        </div>

        {/* ✅ BARRA DE PROGRESO */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">Progreso de Compras</span>
            <span>{calculatedStats.progresoCompletado}% completado</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-green-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${calculatedStats.progresoCompletado}%` }}
            ></div>
          </div>
        </div>

        {/* ✅ CONTROLES DE FILTRO Y ORDENAMIENTO */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faFilter} className="text-gray-500" />
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos ({items.length})</option>
              <option value="pending">Pendientes ({pendingPurchases.length})</option>
              <option value="completed">Completados ({completedPurchases.length})</option>
              <option value="critical">Críticos ({criticalItems.length})</option>
              <option value="overdue">Vencidos ({overdueItems.length})</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faSort} className="text-gray-500" />
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="priority">Prioridad</option>
              <option value="date">Fecha Límite</option>
              <option value="price">Precio</option>
              <option value="status">Estado</option>
            </select>
          </div>

          {/* ✅ ALERTAS RÁPIDAS */}
          {criticalItems.length > 0 && (
            <div className="flex items-center bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
              <FontAwesomeIcon icon={faBell} className="mr-2" />
              {criticalItems.length} items críticos
            </div>
          )}
        </div>
      </div>

      {/* ✅ LISTA DE ITEMS */}
      <div className="space-y-4">
        {filteredAndSortedItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <FontAwesomeIcon icon={faShoppingCart} className="text-6xl text-gray-300 mb-4" />
            <p className="text-xl text-gray-500 mb-2">No hay items para mostrar</p>
            <p className="text-gray-400">
              {filter === 'all' 
                ? 'No se han encontrado items en este contrato'
                : `No hay items que coincidan con el filtro "${filter}"`
              }
            </p>
          </div>
        ) : (
          filteredAndSortedItems.map((item) => (
            <ItemCard 
              key={item.id} 
              item={item}
              config={itemConfig[item.tipo]}
              alertStatus={getAlertStatus(item)}
              alertConfig={alertConfig}
              onUpload={() => {
                setSelectedItem(item);
                setShowUploadModal(true);
              }}
              onUpdateDeadline={() => {
                setSelectedItem(item);
                setShowDeadlineModal(true);
              }}
              onMarkPaymentCompleted={handleMarkPaymentCompleted}
              uploading={uploadingReceipt}
              updatingDeadline={updatingDeadline}
              markingPayment={markingPayment}
            />
          ))
        )}
      </div>

      {/* ✅ MODALES */}
      {showUploadModal && selectedItem && (
        <PurchaseUploadModal
          item={selectedItem}
          onClose={() => {
            setShowUploadModal(false);
            setSelectedItem(null);
          }}
          onSubmit={handleUploadReceipt}
          uploading={uploadingReceipt}
        />
      )}

      {showDeadlineModal && selectedItem && (
        <DeadlineUpdateModal
          item={selectedItem}
          onClose={() => {
            setShowDeadlineModal(false);
            setSelectedItem(null);
          }}
          onSubmit={handleUpdateDeadline}
          updating={updatingDeadline}
        />
      )}
    </div>
  );
};

// ✅ COMPONENTE AUXILIAR: StatCard
import PropTypes from 'prop-types';

const StatCard = ({ icon, label, value, color, isAmount = false }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    red: 'bg-red-50 border-red-200 text-red-600',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600',
    gray: 'bg-gray-50 border-gray-200 text-gray-600',
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center">
        <FontAwesomeIcon icon={icon} className="text-2xl mr-3" />
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className={`${isAmount ? 'text-lg' : 'text-2xl'} font-bold`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};

StatCard.propTypes = {
  icon: PropTypes.oneOfType([PropTypes.object, PropTypes.string]).isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  color: PropTypes.string.isRequired,
  isAmount: PropTypes.bool
};

export default ContractPurchaseManager;