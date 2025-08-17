import { useState } from 'react';
import PropTypes from 'prop-types';
import { formatDateDisplay } from '../../../utils/dateUtils';

const PaymentsList = ({ payments, loading, pagination, onPageChange, onReceiptView }) => {
  const [expandedPayments, setExpandedPayments] = useState(new Set());

  // 🔄 TOGGLE DETALLES DE PAGO
  const togglePaymentDetails = (paymentId) => {
    const newExpanded = new Set(expandedPayments);
    if (newExpanded.has(paymentId)) {
      newExpanded.delete(paymentId);
    } else {
      newExpanded.add(paymentId);
    }
    setExpandedPayments(newExpanded);
  };

  // 🎨 COLOR ESTADO
  const getStatusColor = (status) => {
    const colors = {
      'confirmado': 'bg-green-100 text-green-800',
      'pendiente': 'bg-yellow-100 text-yellow-800',
      'rechazado': 'bg-red-100 text-red-800',
      'en_revision': 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // 📄 VER COMPROBANTE
  const handleReceiptView = (receiptUrl, paymentId) => {
    if (receiptUrl) {
      onReceiptView(receiptUrl, paymentId);
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

  if (!payments || payments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 text-center">
          <div className="text-6xl mb-4">💳</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay pagos registrados
          </h3>
          <p className="text-gray-500">
            No se encontraron pagos con los filtros aplicados
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
          💳 Lista de Pagos ({pagination.totalItems} total)
        </h3>
      </div>

      {/* 📋 LISTA DE PAGOS */}
      <div className="divide-y divide-gray-200">
        {payments.map((payment) => (
          <div key={payment.id} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {/* 🏷️ INFO PRINCIPAL */}
                <div className="flex items-center space-x-4 mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    #{payment.id}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                    {payment.status?.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-lg font-semibold text-green-600">
                    {formatCurrency(payment.amount)}
                  </span>
                </div>

                {/* 📄 INFO CONTRATO */}
                <div className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Contrato:</span> {payment.Contract?.contractNumber}
                  <span className="mx-2">•</span>
                  <span className="font-medium">Cliente:</span> {payment.Contract?.User?.name}
                  <span className="mx-2">•</span>
                  <span className="font-medium">Fecha:</span> {formatDate(payment.paymentDate)}
                </div>

                {/* 💡 MÉTODO Y DESCRIPCIÓN */}
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Método:</span> {payment.paymentMethod}
                  {payment.description && (
                    <>
                      <span className="mx-2">•</span>
                      <span>{payment.description}</span>
                    </>
                  )}
                </div>
              </div>

              {/* 🎛️ ACCIONES */}
              <div className="flex items-center space-x-3">
                {/* 📄 COMPROBANTE */}
                {payment.receiptUrl && (
                  <button
                    onClick={() => handleReceiptView(payment.receiptUrl, payment.id)}
                    className="px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors duration-200"
                    title="Ver comprobante"
                  >
                    📄 Ver Comprobante
                  </button>
                )}

                {/* 👀 DETALLES */}
                <button
                  onClick={() => togglePaymentDetails(payment.id)}
                  className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors duration-200"
                >
                  {expandedPayments.has(payment.id) ? '▲ Ocultar' : '▼ Detalles'}
                </button>
              </div>
            </div>

            {/* 📖 DETALLES EXPANDIDOS */}
            {expandedPayments.has(payment.id) && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Información del Pago</h4>
                    <div className="space-y-1 text-gray-600">
                      <p><span className="font-medium">ID:</span> {payment.id}</p>
                      <p><span className="font-medium">Tipo:</span> {payment.paymentType}</p>
                      <p><span className="font-medium">Cuota:</span> {payment.installmentNumber || 'N/A'}</p>
                      <p><span className="font-medium">Registrado:</span> {formatDate(payment.createdAt)}</p>
                      {payment.updatedAt !== payment.createdAt && (
                        <p><span className="font-medium">Actualizado:</span> {formatDate(payment.updatedAt)}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Información del Contrato</h4>
                    <div className="space-y-1 text-gray-600">
                      <p><span className="font-medium">Número:</span> {payment.Contract?.contractNumber}</p>
                      <p><span className="font-medium">Cliente:</span> {payment.Contract?.User?.name}</p>
                      <p><span className="font-medium">Email:</span> {payment.Contract?.User?.email}</p>
                      <p><span className="font-medium">Total Contrato:</span> {formatCurrency(payment.Contract?.totalPrice || 0)}</p>
                    </div>
                  </div>
                </div>

                {/* 💬 NOTAS ADICIONALES */}
                {payment.notes && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Notas</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                      {payment.notes}
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
              Mostrando {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} - {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} de {pagination.totalItems} pagos
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

PaymentsList.propTypes = {
  payments: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    amount: PropTypes.number.isRequired,
    status: PropTypes.string.isRequired,
    paymentMethod: PropTypes.string.isRequired,
    paymentType: PropTypes.string,
    installmentNumber: PropTypes.number,
    description: PropTypes.string,
    notes: PropTypes.string,
    receiptUrl: PropTypes.string,
    paymentDate: PropTypes.string.isRequired,
    createdAt: PropTypes.string,
    updatedAt: PropTypes.string,
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
    totalItems: PropTypes.number.isRequired,
    itemsPerPage: PropTypes.number.isRequired
  }),
  onPageChange: PropTypes.func.isRequired,
  onReceiptView: PropTypes.func.isRequired
};

export default PaymentsList;
