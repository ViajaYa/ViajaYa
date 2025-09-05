import { useState } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarAlt, faUpload, faDownload,
  faCheckCircle, faClock, faEye,
  faSpinner, faBell, faCoins, faList,
  faPlus, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import ComprobanteViewerModal from './ComprobanteViewerModal';

const ItemCard = ({
  item,
  config,
  alertStatus,
  alertConfig,
  onUpload,
  onUpdateDeadline,
  onMarkPaymentCompleted,
  uploading = false,
  updatingDeadline = false,
  markingPayment = false,
  // ✅ NUEVO: Props para sistema de cuotas
  onCreateInstallments,
  onViewInstallments,
  creatingInstallments = false,
  loadingInstallments = false
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showConfirmPayment, setShowConfirmPayment] = useState(false);
  const [showComprobanteModal, setShowComprobanteModal] = useState(false);

  // ✅ FORMATEAR FECHA - USAR CAMPO CORRECTO
  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ✅ CALCULAR TIEMPO RESTANTE - USAR CAMPO CORRECTO DEL BACKEND
  const getTimeRemaining = () => {
    if (!item.fecha_limite_compra) return null; // ✅ CORREGIDO: usar campo del backend
    
    const now = new Date();
    const deadline = new Date(item.fecha_limite_compra); // ✅ CORREGIDO: usar campo del backend
    const diff = deadline - now;
    
    if (diff < 0) return 'Vencido';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h restantes`;
    return `${hours}h restantes`;
  };

  // ✅ NUEVO: Funciones helper para sistema de cuotas
  const purchaseHasInstallments = (purchase) => {
    return purchase && (purchase.numero_cuotas > 1 || 
           (purchase.PurchaseInstallments && purchase.PurchaseInstallments.length > 0));
  };

  const getPurchaseInstallments = (purchase) => {
    return purchase?.PurchaseInstallments || [];
  };

  const getInstallmentsSummary = (purchase) => {
    const installments = getPurchaseInstallments(purchase);
    if (!installments || installments.length === 0) return null;

    const total = installments.length;
    const paid = installments.filter(inst => inst.estado === 'pagado').length;
    const pending = total - paid;
    const progress = total > 0 ? Math.round((paid / total) * 100) : 0;
    
    const totalAmount = installments.reduce((sum, inst) => sum + parseFloat(inst.monto_cuota || 0), 0);
    const paidAmount = installments
      .filter(inst => inst.estado === 'pagado')
      .reduce((sum, inst) => sum + parseFloat(inst.monto_cuota || 0), 0);
    
    // Contar cuotas vencidas (pendientes con fecha de vencimiento pasada)
    const now = new Date();
    const overdue = installments.filter(inst => 
      inst.estado === 'pendiente' && 
      inst.fecha_vencimiento && 
      new Date(inst.fecha_vencimiento) < now
    ).length;

    return {
      total,
      paid,
      pending,
      progress,
      totalAmount,
      paidAmount,
      overdue
    };
  };

  // ✅ DETERMINAR SI PERMITE ACCIONES
  const canUpload = item.status === 'pendiente_compra'; // ✅ USAR STATUS CORRECTO
  const canUpdateDeadline = item.status !== 'no_requiere' && item.status !== 'comprado_pagado'; // ✅ USAR STATUS CORRECTO
  const canMarkCompleted = item.Purchases && item.Purchases.length > 0 && 
                           item.Purchases.some(p => p.estado_pago === 'pendiente');

  // ✅ OBTENER INFORMACIÓN DE COMPRA
  const purchaseInfo = item.Purchases && item.Purchases.length > 0 ? item.Purchases[0] : null;

  return (
    <div className={`bg-white rounded-lg shadow-lg border-l-4 ${config?.borderColor || 'border-gray-300'} mb-4`}>
      {/* ✅ HEADER DE LA TARJETA */}
      <div className={`p-4 ${config?.bgColor || 'bg-gray-50'} rounded-t-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div 
              className="p-2 rounded-lg text-white"
              style={{ backgroundColor: config?.color || '#6b7280' }}
            >
              <FontAwesomeIcon icon={config?.icon || faBell} className="text-lg" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900">{item.descripcion}</h3>
              <p className="text-sm text-gray-600">{config?.name || item.tipo}</p>
            </div>
          </div>
          
          {/* ✅ BADGE DE ESTADO DE ALERTA */}
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${alertConfig[alertStatus]?.bg} ${alertConfig[alertStatus]?.text} ${alertConfig[alertStatus]?.border} border`}>
            <FontAwesomeIcon icon={alertConfig[alertStatus]?.icon || faClock} className="mr-1" />
            {alertConfig[alertStatus]?.label || 'Unknown'}
          </div>
        </div>
      </div>

      {/* ✅ CONTENIDO PRINCIPAL */}
      <div className="p-4">
        {/* ✅ INFORMACIÓN BÁSICA */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Precio Total</p>
            <p className="text-lg font-semibold text-gray-900">
              ${parseFloat(item.precio_total || 0).toLocaleString('es-CO')}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              {item.tipo === 'ganancia_empresa' ? 'Cantidad' : 'Pasajeros'}
            </p>
            <p className="text-lg font-semibold text-gray-900">
              {item.tipo === 'ganancia_empresa' ? (item.cantidad || 1) : `${item.cantidad || 1} ${(item.cantidad || 1) === 1 ? 'pasajero' : 'pasajeros'}`}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              {item.tipo === 'ganancia_empresa' ? 'Precio Unitario' : 'Precio por Pasajero'}
            </p>
            <p className="text-lg font-semibold text-gray-900">
              ${parseFloat(item.precio_unitario || 0).toLocaleString('es-CO')}
            </p>
            {item.tipo !== 'ganancia_empresa' && item.cantidad > 1 && (
              <p className="text-xs text-blue-600 mt-1">
                ${parseFloat(item.precio_unitario || 0).toLocaleString('es-CO')} × {item.cantidad} = ${parseFloat(item.precio_total || 0).toLocaleString('es-CO')}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Estado</p>
            <p className="text-lg font-semibold text-gray-900 capitalize">
              {item.status?.replace('_', ' ')}
            </p>
          </div>
        </div>

        {/* ✅ INFORMACIÓN DE FECHA - CAMPO CORREGIDO PARA COINCIDIR CON BACKEND */}
        {item.fecha_limite_compra && ( // ✅ CORREGIDO: usar campo del backend
          <div className={`rounded-lg p-3 mb-4 ${
            item.tipo === 'tickets' && (alertStatus === 'critical' || alertStatus === 'warning') 
              ? 'bg-red-50 border border-red-200' 
              : 'bg-gray-50'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  {item.tipo === 'tickets' ? '✈️ Fecha Límite Tickets' : 'Fecha Límite de Compra'}
                </p>
                <p className="font-medium text-gray-900">
                  {formatDate(item.fecha_limite_compra)} {/* ✅ CORREGIDO: usar campo del backend */}
                </p>
                {/* ✅ MEJORA: Nota especial para tickets críticos */}
                {item.tipo === 'tickets' && alertStatus === 'critical' && (
                  <p className="text-xs text-red-600 mt-1 font-medium">
                    ⚡ Tickets críticos - Comprar urgentemente
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Tiempo Restante</p>
                <p className={`font-medium ${
                  alertStatus === 'expired' ? 'text-red-600' :
                  alertStatus === 'critical' ? 'text-red-500' :
                  alertStatus === 'warning' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {getTimeRemaining()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ✅ INFORMACIÓN DE COMPRA */}
        {purchaseInfo && (
          <div className="bg-blue-50 rounded-lg p-3 mb-4">
            <h4 className="font-medium text-blue-900 mb-2">Información de Compra</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-blue-600">Proveedor:</span>
                <span className="ml-2 text-blue-900">{purchaseInfo.proveedor || 'N/A'}</span>
              </div>
              <div>
                <span className="text-blue-600">Costo Real:</span>
                <span className="ml-2 text-blue-900 font-medium">
                  ${parseFloat(purchaseInfo.costo || 0).toLocaleString('es-CO')}
                </span>
              </div>
              <div>
                <span className="text-blue-600">Estado Pago:</span>
                <span className={`ml-2 font-medium capitalize ${
                  purchaseInfo.estado_pago === 'pagado' ? 'text-green-600' :
                  purchaseInfo.estado_pago === 'pendiente' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {purchaseInfo.estado_pago}
                </span>
              </div>
              <div>
                <span className="text-blue-600">Fecha Compra:</span>
                <span className="ml-2 text-blue-900">
                  {formatDate(purchaseInfo.fecha_compra)}
                </span>
              </div>
            </div>
            
            {/* ✅ DIFERENCIA DE PRECIO */}
            {purchaseInfo.costo && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="text-blue-600 font-medium">Diferencia de Precio:</span>
                  <span className={`font-bold ${
                    (purchaseInfo.costo - item.precio_total) > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {(purchaseInfo.costo - item.precio_total) > 0 ? '+' : ''}
                    ${(purchaseInfo.costo - item.precio_total).toLocaleString('es-CO')}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ✅ NUEVO: Información de cuotas */}
        {purchaseInfo && purchaseHasInstallments(purchaseInfo) && (
          <div className="bg-purple-50 rounded-lg p-3 mb-4">
            <h4 className="font-medium text-purple-900 mb-2 flex items-center">
              <FontAwesomeIcon icon={faCoins} className="mr-2" />
              Sistema de Cuotas
            </h4>
            
            {(() => {
              const summary = getInstallmentsSummary(purchaseInfo);
              return summary ? (
                <div className="space-y-3">
                  {/* Estadísticas básicas */}
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="text-center">
                      <p className="text-purple-600 font-medium">{summary.total}</p>
                      <p className="text-purple-700 text-xs">Total Cuotas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-green-600 font-medium">{summary.paid}</p>
                      <p className="text-purple-700 text-xs">Pagadas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-yellow-600 font-medium">{summary.pending}</p>
                      <p className="text-purple-700 text-xs">Pendientes</p>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-purple-700">Progreso de Pagos</span>
                      <span className="text-purple-700">{summary.progress}%</span>
                    </div>
                    <div className="w-full bg-purple-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${summary.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Resumen financiero */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-purple-600">Total:</span>
                      <span className="ml-2 text-purple-900 font-medium">
                        ${summary.totalAmount.toLocaleString('es-CO')}
                      </span>
                    </div>
                    <div>
                      <span className="text-purple-600">Pagado:</span>
                      <span className="ml-2 text-green-600 font-medium">
                        ${summary.paidAmount.toLocaleString('es-CO')}
                      </span>
                    </div>
                  </div>

                  {/* Alertas de cuotas vencidas */}
                  {summary.overdue > 0 && (
                    <div className="bg-red-100 border border-red-200 rounded p-2">
                      <p className="text-red-800 text-xs flex items-center">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                        {summary.overdue} cuota{summary.overdue !== 1 ? 's' : ''} vencida{summary.overdue !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-purple-700 text-sm">
                  Compra configurada con {purchaseInfo.numero_cuotas} cuotas - Cargando información...
                </p>
              );
            })()}
          </div>
        )}

        {/* ✅ DETALLE EXPANDIBLE */}
        {item.detalle && (
          <div className="mb-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
            >
              <FontAwesomeIcon icon={faEye} className="mr-1" />
              {showDetails ? 'Ocultar' : 'Ver'} detalles
            </button>
            
            {showDetails && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-700 text-sm">{item.detalle}</p>
                
                {item.observaciones && (
                  <div className="mt-2 pt-2 border-t border-gray-300">
                    <p className="text-xs text-gray-500 mb-1">Observaciones técnicas:</p>
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap bg-white p-2 rounded border">
                      {typeof item.observaciones === 'string' 
                        ? item.observaciones 
                        : JSON.stringify(JSON.parse(item.observaciones), null, 2)
                      }
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ✅ BOTONES DE ACCIÓN */}
        <div className="flex flex-wrap gap-2">
          {canUpload && (
            <button
              onClick={onUpload}
              disabled={uploading}
              className="flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FontAwesomeIcon 
                icon={uploading ? faSpinner : faUpload} 
                className={`mr-2 ${uploading ? 'animate-spin' : ''}`} 
              />
              {uploading ? 'Subiendo...' : 'Subir Comprobante'}
            </button>
          )}

          {canUpdateDeadline && (
            <button
              onClick={onUpdateDeadline}
              disabled={updatingDeadline}
              className="flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FontAwesomeIcon 
                icon={updatingDeadline ? faSpinner : faCalendarAlt} 
                className={`mr-2 ${updatingDeadline ? 'animate-spin' : ''}`} 
              />
              {updatingDeadline ? 'Actualizando...' : 'Actualizar Fecha'}
            </button>
          )}

          {canMarkCompleted && (
            <button
              onClick={() => setShowConfirmPayment(true)}
              disabled={markingPayment}
              className="flex items-center px-3 py-2 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FontAwesomeIcon 
                icon={markingPayment ? faSpinner : faCheckCircle} 
                className={`mr-2 ${markingPayment ? 'animate-spin' : ''}`} 
              />
              {markingPayment ? 'Procesando...' : 'Marcar como Pagado'}
            </button>
          )}

          {purchaseInfo?.comprobante_url && (
            <button
              onClick={() => setShowComprobanteModal(true)}
              className="flex items-center px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
            >
              <FontAwesomeIcon icon={faEye} className="mr-2" />
              Ver Comprobante
            </button>
          )}

          {/* ✅ BOTÓN DESCARGAR DIRECTO */}
          {purchaseInfo?.comprobante_url && (
            <a
              href={purchaseInfo.comprobante_url}
              download
              className="flex items-center px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
              title="Descargar comprobante directamente"
            >
              <FontAwesomeIcon icon={faDownload} className="mr-2" />
              Descargar
            </a>
          )}

          {/* ✅ NUEVO: Botones para sistema de cuotas */}
          {canUpload && onCreateInstallments && !purchaseInfo && (
            <button
              onClick={onCreateInstallments}
              disabled={creatingInstallments}
              className="flex items-center px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FontAwesomeIcon 
                icon={creatingInstallments ? faSpinner : faPlus} 
                className={`mr-2 ${creatingInstallments ? 'animate-spin' : ''}`} 
              />
              {creatingInstallments ? 'Creando...' : 'Crear con Cuotas'}
            </button>
          )}

          {purchaseInfo && purchaseHasInstallments(purchaseInfo) && onViewInstallments && (
            <button
              onClick={() => onViewInstallments(purchaseInfo)}
              disabled={loadingInstallments}
              className="flex items-center px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FontAwesomeIcon 
                icon={loadingInstallments ? faSpinner : faList} 
                className={`mr-2 ${loadingInstallments ? 'animate-spin' : ''}`} 
              />
              {loadingInstallments ? 'Cargando...' : 'Ver Cuotas'}
            </button>
          )}
        </div>

        {/* ✅ MODAL CONFIRMACIÓN DE PAGO */}
        {showConfirmPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Confirmar Pago Completado
              </h3>
              <p className="text-gray-600 mb-4">
                ¿Está seguro que desea marcar este pago como completado?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowConfirmPayment(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    onMarkPaymentCompleted(purchaseInfo.id, 'Marcado como pagado desde interfaz');
                    setShowConfirmPayment(false);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ✅ MODAL PARA VER COMPROBANTE */}
        {showComprobanteModal && purchaseInfo && (
          <ComprobanteViewerModal
            purchase={purchaseInfo}
            onClose={() => setShowComprobanteModal(false)}
          />
        )}
      </div>
    </div>
  );
};

ItemCard.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    tipo: PropTypes.string.isRequired,
    descripcion: PropTypes.string.isRequired,
    detalle: PropTypes.string,
    precio_total: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    cantidad: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    precio_unitario: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    status: PropTypes.string.isRequired,
    fecha_limite_compra: PropTypes.string, // ✅ CORREGIDO: usar campo correcto del backend
    requiere_compra: PropTypes.bool, // ✅ AGREGADO: campo del backend
    observaciones: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    Purchases: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      proveedor: PropTypes.string,
      costo: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      estado_pago: PropTypes.string,
      fecha_compra: PropTypes.string,
      comprobante_url: PropTypes.string,
    }))
  }).isRequired,
  config: PropTypes.shape({
    icon: PropTypes.object,
    color: PropTypes.string,
    bgColor: PropTypes.string,
    borderColor: PropTypes.string,
    name: PropTypes.string
  }),
  alertStatus: PropTypes.string.isRequired,
  alertConfig: PropTypes.object.isRequired,
  onUpload: PropTypes.func.isRequired,
  onUpdateDeadline: PropTypes.func.isRequired,
  onMarkPaymentCompleted: PropTypes.func.isRequired,
  uploading: PropTypes.bool,
  updatingDeadline: PropTypes.bool,
  markingPayment: PropTypes.bool,
  // ✅ NUEVO: PropTypes para sistema de cuotas
  onCreateInstallments: PropTypes.func,
  onViewInstallments: PropTypes.func,
  creatingInstallments: PropTypes.bool,
  loadingInstallments: PropTypes.bool
};

export default ItemCard;