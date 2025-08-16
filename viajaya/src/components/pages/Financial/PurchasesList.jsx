import { useState } from 'react';
import PropTypes from 'prop-types';
import { formatDateDisplay } from '../../../utils/dateUtils';

const PurchasesList = ({ purchases, loading, pagination, onPageChange, onReceiptView }) => {
  const [expandedPurchases, setExpandedPurchases] = useState(new Set());

  // 🐛 DEBUG: Log para diagnosticar datos de compras
  console.log('🔍 PurchasesList Debug:');
  console.log('🛒 Purchases received:', purchases);
  console.log('📊 Loading:', loading);
  if (purchases && purchases.length > 0) {
    console.log('📄 First purchase receiptUrl:', purchases[0]?.receiptUrl);
    console.log('🔗 URLs found:', purchases.filter(p => p.receiptUrl).length, 'of', purchases.length);
  }

  // 🔄 TOGGLE DETALLES DE COMPRA
  const togglePurchaseDetails = (purchaseId) => {
    const newExpanded = new Set(expandedPurchases);
    if (newExpanded.has(purchaseId)) {
      newExpanded.delete(purchaseId);
    } else {
      newExpanded.add(purchaseId);
    }
    setExpandedPurchases(newExpanded);
  };

  // 🎨 COLOR ESTADO
  const getStatusColor = (status) => {
    const colors = {
      'confirmado': 'bg-green-100 text-green-800',
      'pendiente': 'bg-yellow-100 text-yellow-800',
      'cancelado': 'bg-red-100 text-red-800',
      'en_proceso': 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // 📄 VER COMPROBANTE
  const handleReceiptView = (receiptUrl, purchaseId) => {
    console.log('🔍 PurchasesList handleReceiptView Debug:');
    console.log('🛒 Purchase ID:', purchaseId);
    console.log('🔗 Receipt URL:', receiptUrl);
    console.log('✅ URL Valid:', !!receiptUrl && receiptUrl.trim() !== '');
    
    if (receiptUrl) {
      onReceiptView(receiptUrl, purchaseId);
    }
  };

  // 💰 FORMATEAR MONEDA
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // 📅 FORMATEAR FECHA CON LUXON - SIN PROBLEMAS DE ZONA HORARIA
  const formatDate = (dateString) => {
    return formatDateDisplay(dateString, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) || 'N/A';
  };

  // 🏷️ OBTENER CATEGORÍA COLOR
  const getCategoryColor = (category) => {
    const colors = {
      'transporte': 'bg-blue-100 text-blue-800',
      'hospedaje': 'bg-purple-100 text-purple-800',
      'alimentacion': 'bg-orange-100 text-orange-800',
      'actividades': 'bg-green-100 text-green-800',
      'seguros': 'bg-red-100 text-red-800',
      'otros': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="border-b border-gray-200 pb-4 mb-4">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!purchases || purchases.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay compras registradas
          </h3>
          <p className="text-gray-500">
            No se encontraron compras con los filtros aplicados
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* 📊 HEADER */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          🛒 Lista de Compras ({pagination.total} total)
        </h3>
      </div>

      {/* 📋 LISTA DE COMPRAS */}
      <div className="divide-y divide-gray-200">
        {purchases.map((purchase) => (
          <div key={purchase.id} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {/* 🏷️ INFO PRINCIPAL */}
                <div className="flex items-center space-x-4 mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    #{purchase.id}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(purchase.status)}`}>
                    {purchase.status?.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(purchase.category)}`}>
                    {purchase.category?.toUpperCase()}
                  </span>
                  <span className="text-lg font-semibold text-red-600">
                    -{formatCurrency(purchase.amount)}
                  </span>
                </div>

                {/* 📄 INFO CONTRATO */}
                <div className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Contrato:</span> {purchase.Contract?.contractNumber}
                  <span className="mx-2">•</span>
                  <span className="font-medium">Proveedor:</span> {purchase.supplier}
                  <span className="mx-2">•</span>
                  <span className="font-medium">Fecha:</span> {formatDate(purchase.purchaseDate)}
                </div>

                {/* 💡 DESCRIPCIÓN */}
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Descripción:</span> {purchase.description}
                </div>
              </div>

              {/* 🎛️ ACCIONES */}
              <div className="flex items-center space-x-3">
                {/* 📄 COMPROBANTE */}
                {purchase.receiptUrl && (
                  <button
                    onClick={() => handleReceiptView(purchase.receiptUrl, purchase.id)}
                    className="px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors duration-200"
                    title="Ver comprobante"
                  >
                    📄 Ver Comprobante
                  </button>
                )}

                {/* 👀 DETALLES */}
                <button
                  onClick={() => togglePurchaseDetails(purchase.id)}
                  className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors duration-200"
                >
                  {expandedPurchases.has(purchase.id) ? '▲ Ocultar' : '▼ Detalles'}
                </button>
              </div>
            </div>

            {/* 📖 DETALLES EXPANDIDOS */}
            {expandedPurchases.has(purchase.id) && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Información de la Compra</h4>
                    <div className="space-y-1 text-gray-600">
                      <p><span className="font-medium">ID:</span> {purchase.id}</p>
                      <p><span className="font-medium">Categoría:</span> {purchase.category}</p>
                      <p><span className="font-medium">Proveedor:</span> {purchase.supplier}</p>
                      <p><span className="font-medium">Método de Pago:</span> {purchase.paymentMethod || 'N/A'}</p>
                      <p><span className="font-medium">Registrado:</span> {formatDate(purchase.createdAt)}</p>
                      {purchase.updatedAt !== purchase.createdAt && (
                        <p><span className="font-medium">Actualizado:</span> {formatDate(purchase.updatedAt)}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Información del Contrato</h4>
                    <div className="space-y-1 text-gray-600">
                      <p><span className="font-medium">Número:</span> {purchase.Contract?.contractNumber}</p>
                      <p><span className="font-medium">Cliente:</span> {purchase.Contract?.User?.name}</p>
                      <p><span className="font-medium">Email:</span> {purchase.Contract?.User?.email}</p>
                      <p><span className="font-medium">Total Contrato:</span> {formatCurrency(purchase.Contract?.totalPrice || 0)}</p>
                    </div>
                  </div>
                </div>

                {/* 📝 DESCRIPCIÓN COMPLETA */}
                {purchase.description && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Descripción Completa</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                      {purchase.description}
                    </p>
                  </div>
                )}

                {/* 💬 NOTAS ADICIONALES */}
                {purchase.notes && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Notas</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                      {purchase.notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 📄 PAGINACIÓN */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Mostrando {((pagination.currentPage - 1) * pagination.limit) + 1} - {Math.min(pagination.currentPage * pagination.limit, pagination.total)} de {pagination.total} compras
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onPageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="px-3 py-2 text-sm font-medium text-gray-700">
                Página {pagination.currentPage} de {pagination.totalPages}
              </span>
              <button
                onClick={() => onPageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

PurchasesList.propTypes = {
  purchases: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    amount: PropTypes.number.isRequired,
    status: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    supplier: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    paymentMethod: PropTypes.string,
    notes: PropTypes.string,
    receiptUrl: PropTypes.string,
    purchaseDate: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    updatedAt: PropTypes.string.isRequired,
    Contract: PropTypes.shape({
      contractNumber: PropTypes.string.isRequired,
      totalPrice: PropTypes.number,
      User: PropTypes.shape({
        name: PropTypes.string.isRequired,
        email: PropTypes.string.isRequired
      })
    })
  })),
  loading: PropTypes.bool.isRequired,
  pagination: PropTypes.shape({
    currentPage: PropTypes.number.isRequired,
    totalPages: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired,
    limit: PropTypes.number.isRequired
  }),
  onPageChange: PropTypes.func.isRequired,
  onReceiptView: PropTypes.func.isRequired
};

export default PurchasesList;
