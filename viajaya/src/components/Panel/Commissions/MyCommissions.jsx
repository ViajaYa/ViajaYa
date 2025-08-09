import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCoins,
  faFileInvoice,
  faMoneyBillWave,
  faDownload,
  faCheck,
  faClock,
  faExclamationTriangle,
  faSpinner
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-hot-toast";
import api from "../../../utils/api";
import PaymentRequestModal from "./PaymentRequestModal";
import PaymentReceiptModal from "./PaymentReceiptModal"

const MyCommissions = () => {
  
  const { user } = useSelector(state => state.auth);
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    status: 'all',
    page: 1,
    limit: 10
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState(null);
  const [stats, setStats] = useState({});
  const [showReceiptModal, setShowReceiptModal] = useState(false);
const [selectedReceipt, setSelectedReceipt] = useState(null);


  useEffect(() => {
    if (user?.id) {
      loadMyCommissions();
      loadStats();
    }
  }, [user, filters]);

  const loadMyCommissions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        userId: user.id,
        ...filters
      });

      const response = await api.get(`/commissions?${params}`);
      
      if (response.data.success) {
        setCommissions(response.data.commissions);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      toast.error('Error al cargar comisiones');
      console.error('Error loading commissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get(`/commissions/stats?userId=${user.id}`);
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleRequestPayment = (commission) => {
    setSelectedCommission(commission);
    setShowPaymentModal(true);
  };

  const handleShowPaymentReceipt = (commission) => {
  const receiptUrl = commission.DocumentoSoporte?.comprobante_pago_url;
  
  if (!receiptUrl) {
    toast.error('No hay comprobante de pago disponible');
    return;
  }

  setSelectedReceipt({
    url: receiptUrl,
    commission: commission,
    title: `Comprobante - ${commission.Contract?.contract_number}`,
    paidBy: commission.PagadoPor,
    paymentDate: commission.fecha_pago
  });
  setShowReceiptModal(true);
};

 const handleDownloadDocument = async (documentId, numeroDocumento) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('No se encontró token de autorización');
        return;
      }

      // ✅ Usar fetch en lugar de window.open para enviar headers correctamente
      const response = await fetch(`${api.defaults.baseURL}/commissions/document/${documentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al descargar documento');
      }

      // Convertir respuesta a blob
      const blob = await response.blob();
      
      // Crear URL del blob y descargar
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cuenta-cobro-${numeroDocumento}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Documento descargado exitosamente');

    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error(error.message || 'Error al descargar documento');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'generated':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'paid':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return faClock;
      case 'generated':
        return faFileInvoice;
      case 'approved':
        return faCheck;
      case 'paid':
        return faCoins;
      default:
        return faExclamationTriangle;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-CO');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Comisiones</h1>
          <p className="text-gray-600">Gestiona tus comisiones y solicita pagos</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faCoins} className="text-yellow-500 text-2xl mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Comisiones</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.totalAmount || 0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faClock} className="text-orange-500 text-2xl mr-3" />
            <div>
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold">
                {stats.byStatus?.find(s => s.status === 'pending')?.count || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faCheck} className="text-green-500 text-2xl mr-3" />
            <div>
              <p className="text-sm text-gray-600">Aprobadas</p>
              <p className="text-2xl font-bold">
                {stats.byStatus?.find(s => s.status === 'approved')?.count || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faCoins} className="text-blue-500 text-2xl mr-3" />
            <div>
              <p className="text-sm text-gray-600">Pagadas</p>
              <p className="text-2xl font-bold">
                {stats.byStatus?.find(s => s.status === 'paid')?.count || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-wrap gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value, page: 1})}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="generated">Documento Generado</option>
            <option value="approved">Aprobada</option>
            <option value="paid">Pagada</option>
          </select>
        </div>
      </div>

      {/* Commissions Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contrato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto Base
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  % Comisión
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comisión
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center">
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-500">Cargando comisiones...</span>
                  </td>
                </tr>
              ) : commissions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    No hay comisiones disponibles
                  </td>
                </tr>
              ) : (
                commissions.map((commission) => (
                  <tr key={commission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">
                          {commission.Contract?.contract_number}
                        </div>
                        <div className="text-sm text-gray-500">
                          {commission.Contract?.Quote?.nombre_cliente}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                        {commission.tipo_vendedor}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(commission.monto_base)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {commission.porcentaje}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-green-600">
                        {formatCurrency(commission.monto_comision)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(commission.status)}`}>
                        <FontAwesomeIcon 
                          icon={getStatusIcon(commission.status)} 
                          className="mr-1" 
                        />
                        {commission.status === 'pending' && 'Pendiente'}
                        {commission.status === 'generated' && 'Documento Generado'}
                        {commission.status === 'approved' && 'Aprobada'}
                        {commission.status === 'paid' && 'Pagada'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(commission.fecha_generacion)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {commission.status === 'pending' && (
                          <button
                            onClick={() => handleRequestPayment(commission)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Solicitar Pago"
                          >
                            <FontAwesomeIcon icon={faFileInvoice} />
                          </button>
                        )}
                        
                        {commission.documento_soporte_id && (
                          <button
                            onClick={() => handleDownloadDocument(
                              commission.documento_soporte_id,
                              commission.id
                            )}
                            className="text-green-600 hover:text-green-900"
                            title="Descargar Documento"
                          >
                            <FontAwesomeIcon icon={faDownload} />
                          </button>
                        )}
                         {commission.status === 'paid' && commission.DocumentoSoporte?.comprobante_pago_url && (
      <button
        onClick={() => handleShowPaymentReceipt(commission)}
        className="text-green-600 hover:text-green-900"
        title="Ver comprobante de pago"
      >
        <FontAwesomeIcon icon={faMoneyBillWave} />
      </button>
    )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                {pagination.total} resultados
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilters({...filters, page: pagination.page - 1})}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setFilters({...filters, page: pagination.page + 1})}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Request Modal */}
      {showPaymentModal && (
        <PaymentRequestModal
          commission={selectedCommission}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedCommission(null);
          }}
          onSuccess={() => {
            loadMyCommissions();
            setShowPaymentModal(false);
            setSelectedCommission(null);
          }}
        />
      )}
      {showReceiptModal && selectedReceipt && (
  <PaymentReceiptModal
    receipt={selectedReceipt}
    onClose={() => {
      setShowReceiptModal(false);
      setSelectedReceipt(null);
    }}
  />
)}
    </div>
  );
};

export default MyCommissions;