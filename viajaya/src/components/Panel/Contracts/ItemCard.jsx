import  { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarAlt,
  faMoneyBillWave,
  faTruck,
 
  faUpload,
  faCheck,
  faChevronDown,
  faChevronUp,
  faFileImage,
  faFilePdf,
  faExternalLinkAlt,
  faEdit,
  faClock,
  faUser,
  faClipboard
} from '@fortawesome/free-solid-svg-icons';

const ItemCard = ({
  item,
  config,
  alertStatus,
  alertConfig,
  onUpload,
  onUpdateDeadline,
  onMarkPaymentCompleted,
  uploading,
  updatingDeadline,
  markingPayment
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);

  // ✅ CONFIGURACIÓN DE COLORES Y ESTADOS
  const alertStyles = alertConfig[alertStatus] || alertConfig['no-deadline'];
  const itemStyles = config || {
    icon: faClipboard,
    color: '#6b7280',
    name: item.tipo,
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  };

  // ✅ CALCULAR DIFERENCIA DE PRECIO
  const precioCotizado = parseFloat(item.precio_total || 0);
  const precioComprado = item.Purchases?.[0] ? parseFloat(item.Purchases[0].costo || 0) : 0;
  const diferencia = precioComprado - precioCotizado;

  // ✅ FORMATEAR FECHA
  const formatDate = (dateString) => {
    if (!dateString) return 'No definida';
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ✅ DETERMINAR TIEMPO RESTANTE
  const getTimeRemaining = () => {
    if (!item.fecha_limite_compra) return null;
    
    const now = new Date();
    const deadline = new Date(item.fecha_limite_compra);
    const diffMs = deadline - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMs < 0) return { text: 'Vencido', color: 'text-red-600' };
    if (diffDays > 0) return { text: `${diffDays} días`, color: 'text-blue-600' };
    if (diffHours > 0) return { text: `${diffHours} horas`, color: 'text-orange-600' };
    return { text: 'Menos de 1 hora', color: 'text-red-600' };
  };

  const timeRemaining = getTimeRemaining();

  // ✅ DETERMINAR ICON DEL COMPROBANTE
  const getReceiptIcon = (url) => {
    if (!url) return faFileImage;
    return url.toLowerCase().includes('.pdf') ? faFilePdf : faFileImage;
  };

  // ✅ MANEJAR CONFIRMACIÓN DE PAGO
  const handlePaymentConfirmation = (purchaseId) => {
    onMarkPaymentCompleted(purchaseId, 'Pago confirmado desde dashboard');
    setShowPaymentConfirm(false);
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg border-l-4 ${alertStyles.border} hover:shadow-xl transition-all duration-200`}>
      {/* ✅ HEADER PRINCIPAL */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          {/* ✅ INFO PRINCIPAL */}
          <div className="flex items-start space-x-4 flex-1">
            {/* ✅ ICONO DEL TIPO */}
            <div className={`${itemStyles.bgColor} ${itemStyles.borderColor} border rounded-lg p-3`}>
              <FontAwesomeIcon 
                icon={itemStyles.icon} 
                className="text-2xl"
                style={{ color: itemStyles.color }}
              />
            </div>

            {/* ✅ DETALLES DEL ITEM */}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  {item.descripcion}
                </h3>
                {/* ✅ BADGE DE ESTADO DE ALERTA */}
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${alertStyles.bg} ${alertStyles.text} border ${alertStyles.border}`}>
                  <FontAwesomeIcon icon={alertStyles.icon} className="mr-1" />
                  {alertStyles.label}
                </span>
                {/* ✅ BADGE DE TIPO */}
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                  {itemStyles.name}
                </span>
              </div>

              {/* ✅ DETALLE Y CANTIDAD */}
              {item.detalle && (
                <p className="text-gray-600 mb-2">{item.detalle}</p>
              )}
              
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                {item.cantidad && (
                  <span>
                    <FontAwesomeIcon icon={faClipboard} className="mr-1" />
                    Cantidad: {item.cantidad}
                  </span>
                )}
                {item.precio_unitario && (
                  <span>
                    <FontAwesomeIcon icon={faMoneyBillWave} className="mr-1" />
                    Unitario: ${parseFloat(item.precio_unitario).toLocaleString('es-CO')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ✅ PRECIO Y ACCIONES */}
          <div className="text-right">
            <div className="mb-4">
              <p className="text-2xl font-bold text-gray-900">
                ${precioCotizado.toLocaleString('es-CO')}
              </p>
              <p className="text-sm text-gray-500">Precio cotizado</p>
              
              {/* ✅ DIFERENCIA DE PRECIO */}
              {precioComprado > 0 && (
                <div className={`mt-2 text-sm ${diferencia >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {diferencia >= 0 ? '+' : ''}${diferencia.toLocaleString('es-CO')}
                  <span className="text-gray-500 ml-1">
                    ({diferencia >= 0 ? 'sobrecosto' : 'ahorro'})
                  </span>
                </div>
              )}
            </div>

            {/* ✅ ACCIONES PRINCIPALES */}
            <div className="space-y-2">
              {/* ✅ BOTÓN DE SUBIR COMPROBANTE */}
              {item.requiere_compra && item.status === 'pendiente_compra' && (
                <button
                  onClick={onUpload}
                  disabled={uploading}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faUpload} className="mr-2" />
                  {uploading ? 'Subiendo...' : 'Subir Comprobante'}
                </button>
              )}

              {/* ✅ BOTÓN DE MARCAR PAGO COMPLETADO */}
              {item.status === 'comprado_pendiente' && item.Purchases?.[0] && (
                <button
                  onClick={() => setShowPaymentConfirm(true)}
                  disabled={markingPayment}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faCheck} className="mr-2" />
                  {markingPayment ? 'Marcando...' : 'Marcar Pagado'}
                </button>
              )}

              {/* ✅ BOTÓN DE FECHA LÍMITE */}
              {item.requiere_compra && (
                <button
                  onClick={onUpdateDeadline}
                  disabled={updatingDeadline}
                  className="w-full bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                  {updatingDeadline ? 'Actualizando...' : 'Fecha Límite'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ✅ FECHA LÍMITE Y TIEMPO RESTANTE */}
        {item.requiere_compra && (
          <div className="mt-4 flex justify-between items-center pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                Fecha límite: {formatDate(item.fecha_limite_compra)}
              </span>
              {timeRemaining && (
                <span className={`text-sm font-medium ${timeRemaining.color}`}>
                  <FontAwesomeIcon icon={faClock} className="mr-2" />
                  {timeRemaining.text}
                </span>
              )}
            </div>

            {/* ✅ BOTÓN EXPANDIR/CONTRAER */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              <FontAwesomeIcon 
                icon={expanded ? faChevronUp : faChevronDown} 
                className="mr-2" 
              />
              {expanded ? 'Menos detalles' : 'Más detalles'}
            </button>
          </div>
        )}
      </div>

      {/* ✅ SECCIÓN EXPANDIBLE - DETALLES Y COMPRAS */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ✅ INFORMACIÓN ADICIONAL */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">
                <FontAwesomeIcon icon={faClipboard} className="mr-2 text-blue-600" />
                Información del Item
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <span className={`font-medium ${
                    item.status === 'comprado_pagado' ? 'text-green-600' :
                    item.status === 'comprado_pendiente' ? 'text-yellow-600' :
                    item.status === 'pendiente_compra' ? 'text-blue-600' :
                    'text-gray-600'
                  }`}>
                    {item.status?.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Requiere compra:</span>
                  <span className={`font-medium ${item.requiere_compra ? 'text-blue-600' : 'text-gray-600'}`}>
                    {item.requiere_compra ? 'Sí' : 'No'}
                  </span>
                </div>
                {item.prioridad && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Prioridad:</span>
                    <span className={`font-medium ${
                      item.prioridad === 'critica' ? 'text-red-600' :
                      item.prioridad === 'alta' ? 'text-orange-600' :
                      item.prioridad === 'media' ? 'text-yellow-600' :
                      'text-gray-600'
                    }`}>
                      {item.prioridad?.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ✅ HISTORIAL DE COMPRAS */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">
                <FontAwesomeIcon icon={faTruck} className="mr-2 text-green-600" />
                Historial de Compras ({item.Purchases?.length || 0})
              </h4>
              
              {item.Purchases && item.Purchases.length > 0 ? (
                <div className="space-y-3">
                  {item.Purchases.map((purchase, index) => (
                    <div key={purchase.id} className="bg-white rounded border p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-sm">
                            <FontAwesomeIcon icon={faUser} className="mr-2 text-blue-600" />
                            {purchase.proveedor || 'Proveedor no especificado'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(purchase.fecha_compra)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm">
                            ${parseFloat(purchase.costo || 0).toLocaleString('es-CO')}
                          </p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            purchase.estado_pago === 'pagado' ? 'bg-green-100 text-green-800' :
                            purchase.estado_pago === 'vencido' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {purchase.estado_pago?.toUpperCase() || 'PENDIENTE'}
                          </span>
                        </div>
                      </div>

                      {/* ✅ COMPROBANTE */}
                      {purchase.comprobante_url && (
                        <div className="flex items-center justify-between bg-gray-50 rounded p-2 mt-2">
                          <div className="flex items-center">
                            <FontAwesomeIcon 
                              icon={getReceiptIcon(purchase.comprobante_url)} 
                              className="mr-2 text-blue-600" 
                            />
                            <span className="text-sm">Comprobante disponible</span>
                          </div>
                          <a
                            href={purchase.comprobante_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 text-sm"
                          >
                            <FontAwesomeIcon icon={faExternalLinkAlt} className="mr-1" />
                            Ver
                          </a>
                        </div>
                      )}

                      {/* ✅ OBSERVACIONES */}
                      {purchase.observaciones && (
                        <p className="text-xs text-gray-600 mt-2 italic">
                          "{purchase.observaciones}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <FontAwesomeIcon icon={faTruck} className="text-3xl mb-2" />
                  <p className="text-sm">No hay compras registradas</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ✅ MODAL DE CONFIRMACIÓN DE PAGO */}
      {showPaymentConfirm && item.Purchases?.[0] && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirmar Pago Completado</h3>
            <p className="text-gray-600 mb-4">
              ¿Estás seguro de que deseas marcar el pago a <strong>{item.Purchases[0].proveedor}</strong> como completado?
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Monto: <strong>${parseFloat(item.Purchases[0].costo || 0).toLocaleString('es-CO')}</strong>
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => handlePaymentConfirmation(item.Purchases[0].id)}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                <FontAwesomeIcon icon={faCheck} className="mr-2" />
                Confirmar Pago
              </button>
              <button
                onClick={() => setShowPaymentConfirm(false)}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import PropTypes from 'prop-types';

ItemCard.propTypes = {
  item: PropTypes.shape({
    tipo: PropTypes.string.isRequired,
    descripcion: PropTypes.string,
    detalle: PropTypes.string,
    cantidad: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    precio_unitario: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    precio_total: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    requiere_compra: PropTypes.bool,
    status: PropTypes.string,
    prioridad: PropTypes.string,
    fecha_limite_compra: PropTypes.string,
    Purchases: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        proveedor: PropTypes.string,
        fecha_compra: PropTypes.string,
        costo: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        estado_pago: PropTypes.string,
        comprobante_url: PropTypes.string,
        observaciones: PropTypes.string
      })
    )
  }).isRequired,
  config: PropTypes.object,
  alertStatus: PropTypes.string,
  alertConfig: PropTypes.object.isRequired,
  onUpload: PropTypes.func,
  onUpdateDeadline: PropTypes.func,
  onMarkPaymentCompleted: PropTypes.func,
  uploading: PropTypes.bool,
  updatingDeadline: PropTypes.bool,
  markingPayment: PropTypes.bool
};

export default ItemCard;