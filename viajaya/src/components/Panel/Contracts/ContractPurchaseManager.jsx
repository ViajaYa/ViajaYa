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
  signContractWithAutoConversion, // ✅ Ya lo tienes
  convertQuoteToContractItems,
  
  // Selectors existentes
  selectPurchaseItems,
  selectPurchaseLoading,
  selectPurchaseError,
  selectUploadingReceipt,
  selectUpdatingDeadline,
  selectMarkingPayment,
  selectCriticalItems,
  selectOverdueItems,
  selectPendingPurchases,
  selectCompletedPurchases,
  selectHasAutoConvertedItems,
  selectAutoConversionSummary,
  selectIsSignedWithItems
} from '../../../redux/slices/contractSlice';

// Icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShoppingCart, faPlane, faHotel, faCar, faUtensils,
  faSuitcase, faShieldAlt, faMapMarkedAlt, faGift,
  faExclamationTriangle, faCheckCircle, faTimesCircle,
  faUpload, faCalendarAlt, faMoneyBillWave,
  faClock, faSort, faFilter, faSpinner, faDownload,
  faBell, faPercent, faChartLine, faWarning, faCoins,
  faHeartbeat
} from '@fortawesome/free-solid-svg-icons';

const ContractPurchaseManager = () => {
  const { contractId } = useParams();
  const dispatch = useDispatch();
  
  // Redux selectors
  const items = useSelector(selectPurchaseItems);
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
  const hasAutoConvertedItems = useSelector(selectHasAutoConvertedItems);
  const autoConversionSummary = useSelector(selectAutoConversionSummary);
  const isSignedWithItems = useSelector(selectIsSignedWithItems);
  // Estados locales
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('priority');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // ✅ CONFIGURACIÓN DE TIPOS DE ITEMS - AJUSTADO AL MODELO REAL
  const itemConfig = React.useMemo(() => ({
    tickets: {
      icon: faPlane,
      color: '#dc2626',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      name: 'Tickets Aéreos',
      priority: 1
    },
    alojamiento: { // ✅ CORREGIDO: "hotel" -> "alojamiento"
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
    seguro: { // ✅ CORREGIDO: "seguro_asistencia" -> "seguro" (singular)
      icon: faShieldAlt,
      color: '#10b981',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      name: 'Seguro',
      priority: 2
    },
    // ✅ AGREGADO: Tipos que están en el modelo
    asistencia_medica: {
      icon: faHeartbeat,
      color: '#ef4444',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      name: 'Asistencia Médica',
      priority: 2
    },
    'contacto de urgencia': {
      icon: faBell,
      color: '#f97316',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      name: 'Contacto Urgencia',
      priority: 8
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

  // ✅ FUNCIÓN PARA DETERMINAR COLOR DE ALERTA - AJUSTADA AL MODELO
  const getAlertStatus = useCallback((item) => {
    // ✅ CORREGIDO: El modelo no tiene "requiere_compra", usar "status" para determinar si requiere compra
    if (item.status === 'no_requiere') return 'no-required';
    if (item.status === 'comprado_pagado') return 'completed';
    if (item.status === 'vencido') return 'expired';
    
    // ✅ CORREGIDO: Usar "fecha_vencimiento_pago" en lugar de "fecha_limite_compra"
    if (item.fecha_vencimiento_pago) {
      const now = new Date();
      const deadline = new Date(item.fecha_vencimiento_pago);
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

  // ✅ FILTRAR Y ORDENAR ITEMS - AJUSTADO AL MODELO
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
          // ✅ CORREGIDO: Usar "fecha_vencimiento_pago"
          if (!a.fecha_vencimiento_pago && !b.fecha_vencimiento_pago) return 0;
          if (!a.fecha_vencimiento_pago) return 1;
          if (!b.fecha_vencimiento_pago) return -1;
          return new Date(a.fecha_vencimiento_pago) - new Date(b.fecha_vencimiento_pago);
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
            'no_requiere': 4,
            'cancelado': 5 // ✅ AGREGADO estado que faltaba
          };
          return (statusOrder[a.status] || 6) - (statusOrder[b.status] || 6);
        }
        
        default: {
          return 0;
        }
      }
    });

    return filtered;
  }, [items, filter, sortBy, getAlertStatus, itemConfig]);

  // ✅ CALCULAR ESTADÍSTICAS DETALLADAS - AJUSTADO AL MODELO
  const calculatedStats = React.useMemo(() => {
    // ✅ CORREGIDO: Filtrar por status en lugar de "requiere_compra"
    const itemsWithPurchase = items.filter(item => item.status !== 'no_requiere');
    
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

  const handleConvertFromQuote = async () => {
    try {
      console.log('🔄 Iniciando conversión manual de cotización...');
      
      await dispatch(convertQuoteToContractItems(contractId)).unwrap();
      
      toast.success('✅ Items importados desde cotización exitosamente');
      
      // Recargar items automáticamente
      dispatch(fetchContractItemsWithPurchases(contractId));
      
    } catch (error) {
      console.error('❌ Error en conversión manual:', error);
      toast.error(`Error importando items: ${error.message || error}`);
    }
  };

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

  // ✅ MANEJAR ACTUALIZACIÓN DE FECHA LÍMITE - CORREGIDO NOMBRE DEL CAMPO
  const handleUpdateDeadline = async (fecha_vencimiento_pago) => {
    try {
      await dispatch(updateItemDeadline({
        itemId: selectedItem.id,
        fecha_vencimiento_pago // ✅ CORREGIDO nombre del campo
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

 // ✅ RETURN COMPLETO CON TODAS LAS MEJORAS
return (
  <div className="max-w-7xl mx-auto px-4 py-6">
    {/* ✅ HEADER DEL DASHBOARD - MEJORADO */}
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            <FontAwesomeIcon icon={faShoppingCart} className="mr-3 text-blue-600" />
            Gestión de Compras - Contrato #{contractId?.slice(-8)}
          </h1>
          
          {/* ✅ INFORMACIÓN DE CONVERSIÓN AUTOMÁTICA */}
          {hasAutoConvertedItems && autoConversionSummary && (
            <div className="mt-2 flex items-center space-x-2">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                ✅ Items auto-convertidos
              </span>
              <span className="text-sm text-gray-600">
                Total: {autoConversionSummary.total} | 
                Requieren compra: {autoConversionSummary.requieren_compra} |
                Informativos: {autoConversionSummary.no_requieren_compra}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex space-x-3">
          {/* ✅ BOTÓN DE IMPORTACIÓN INTELIGENTE */}
          <button 
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleConvertFromQuote}
            disabled={loading}
          >
            <FontAwesomeIcon 
              icon={loading ? faSpinner : faDownload} 
              className={`mr-2 ${loading ? 'animate-spin' : ''}`} 
            />
            {hasAutoConvertedItems 
              ? 'Re-importar desde Cotización' 
              : 'Importar desde Cotización'
            }
          </button>
          
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <FontAwesomeIcon icon={faUpload} className="mr-2" />
            Subir Masivo
          </button>
        </div>
      </div>

      {/* ✅ BANNER INFORMATIVO CUANDO NO HAY ITEMS */}
      {items.length === 0 && !loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faBell} className="text-blue-600 mr-3" />
            <div>
              <h3 className="text-blue-800 font-medium">No hay items para gestionar</h3>
              <p className="text-blue-700 text-sm mt-1">
                {hasAutoConvertedItems 
                  ? 'Los items fueron convertidos automáticamente pero no se pudieron cargar. Intenta recargar la página.' 
                  : 'Para comenzar la gestión de compras, primero importa los items desde la cotización.'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ✅ ESTADÍSTICAS - SOLO SI HAY ITEMS */}
      {items.length > 0 && (
        <>
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

            {overdueItems.length > 0 && (
              <div className="flex items-center bg-red-200 text-red-900 px-3 py-1 rounded-full text-sm">
                <FontAwesomeIcon icon={faTimesCircle} className="mr-2" />
                {overdueItems.length} items vencidos
              </div>
            )}
          </div>
        </>
      )}
    </div>

    {/* ✅ LISTA DE ITEMS CON MEJOR MANEJO DE ESTADOS */}
    <div className="space-y-4">
      {filteredAndSortedItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <FontAwesomeIcon icon={faShoppingCart} className="text-6xl text-gray-300 mb-4" />
          <p className="text-xl text-gray-500 mb-2">
            {items.length === 0 
              ? 'No hay items en este contrato' 
              : 'No hay items para mostrar'
            }
          </p>
          <p className="text-gray-400 mb-4">
            {items.length === 0 
              ? hasAutoConvertedItems 
                ? 'Los items fueron convertidos automáticamente pero hay un problema cargándolos.'
                : 'Importa los items desde la cotización para comenzar la gestión de compras.'
              : `No hay items que coincidan con el filtro "${filter}"`
            }
          </p>
          
          {/* ✅ BOTÓN DE ACCIÓN EN ESTADO VACÍO */}
          {items.length === 0 && (
            <button
              onClick={handleConvertFromQuote}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FontAwesomeIcon 
                icon={loading ? faSpinner : faDownload} 
                className={`mr-2 ${loading ? 'animate-spin' : ''}`} 
              />
              {loading ? 'Importando...' : 'Importar Items desde Cotización'}
            </button>
          )}
          
          {/* ✅ BOTÓN PARA LIMPIAR FILTROS CUANDO NO HAY RESULTADOS */}
          {items.length > 0 && filter !== 'all' && (
            <button
              onClick={() => setFilter('all')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors mt-4"
            >
              <FontAwesomeIcon icon={faFilter} className="mr-2" />
              Mostrar todos los items
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ✅ INDICADOR DE FILTROS ACTIVOS */}
          {filter !== 'all' && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faFilter} className="text-blue-600 mr-2" />
                  <p className="text-blue-800">
                    Mostrando {filteredAndSortedItems.length} items filtrados por: <strong>{filter}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setFilter('all')}
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  Limpiar filtro
                </button>
              </div>
            </div>
          )}

          {/* ✅ LISTA DE ITEMS */}
          {filteredAndSortedItems.map((item) => (
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
          ))}

          {/* ✅ RESUMEN AL FINAL DE LA LISTA */}
          {filteredAndSortedItems.length > 5 && (
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-gray-600">
                Mostrando {filteredAndSortedItems.length} de {items.length} items totales
              </p>
              {filter !== 'all' && (
                <button
                  onClick={() => setFilter('all')}
                  className="text-blue-600 hover:text-blue-800 text-sm underline ml-2"
                >
                  Ver todos los items
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>

    {/* ✅ FLOATING ACTION BUTTON PARA ACCIONES RÁPIDAS */}
    {items.length > 0 && (criticalItems.length > 0 || overdueItems.length > 0) && (
      <div className="fixed bottom-6 right-6 z-40">
        <div className="bg-red-600 text-white p-3 rounded-full shadow-lg">
          <div className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faExclamationTriangle} />
            <span className="text-sm font-medium">
              {criticalItems.length + overdueItems.length} items necesitan atención
            </span>
            <button
              onClick={() => setFilter('critical')}
              className="bg-red-700 hover:bg-red-800 px-2 py-1 rounded text-xs"
            >
              Ver
            </button>
          </div>
        </div>
      </div>
    )}

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

    {/* ✅ TOAST CONTAINER PARA NOTIFICACIONES */}
    {/* Asumiendo que ya tienes ToastContainer en tu App.js, si no, agrégalo aquí */}
  </div>
);
}
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