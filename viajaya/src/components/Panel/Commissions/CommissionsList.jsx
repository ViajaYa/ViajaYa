import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCoins,
  faCheck,
  faClock,
  faUser,
  faFileContract,
  faDollarSign,
  faCalendarAlt,
  faFilter,
  faSearch,
  faSpinner,
  faEye,
  faCheckCircle,
  faCreditCard,
  faChevronLeft,
  faChevronRight,
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import {
  fetchCommissions,
  approveCommission,
  payCommission,
  selectCommissions,
  selectCommissionLoading,
  selectCommissionError,
  selectCommissionPagination
} from '../../../redux/slices/commissionSlice';

const CommissionsList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const commissions = useSelector(selectCommissions);
  const loading = useSelector(selectCommissionLoading);
  const error = useSelector(selectCommissionError);
  const pagination = useSelector(selectCommissionPagination);

  // Estados locales
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    dispatch(fetchCommissions({ 
      page: pagination.page, 
      limit: pagination.limit,
      filters 
    }));
  }, [dispatch, pagination.page, pagination.limit, filters]);

  // Función para obtener el color del estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'generated':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Función para obtener el icono del estado
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return faClock;
      case 'approved':
        return faCheckCircle;
      case 'paid':
        return faCreditCard;
      case 'generated':
        return faCoins;
      default:
        return faClock;
    }
  };

  // Función para obtener el texto del estado
  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'approved':
        return 'Aprobada';
      case 'paid':
        return 'Pagada';
      case 'generated':
        return 'Generada';
      default:
        return 'Desconocido';
    }
  };

  // Función para formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Función para manejar acciones
  const handleAction = async (action, commissionId) => {
    switch (action) {
      case 'approve':
        await handleApproveCommission(commissionId);
        break;
      case 'pay':
        await handlePayCommission(commissionId);
        break;
      case 'view':
        // Implementar vista de detalles
        console.log('Ver detalles:', commissionId);
        break;
      default:
        break;
    }
  };

  // Función para aprobar comisión
  const handleApproveCommission = async (commissionId) => {
    if (!confirm('¿Está seguro de aprobar esta comisión?')) {
      return;
    }

    try {
      await dispatch(approveCommission({ 
        id: commissionId, 
        observaciones: 'Comisión aprobada desde el panel administrativo' 
      })).unwrap();
      
      // Recargar la lista
      dispatch(fetchCommissions({ 
        page: pagination.page, 
        limit: pagination.limit,
        filters 
      }));
    } catch (error) {
      alert('Error al aprobar la comisión: ' + error);
    }
  };

  // Función para marcar como pagada
  const handlePayCommission = async (commissionId) => {
    if (!confirm('¿Está seguro de marcar esta comisión como pagada?')) {
      return;
    }

    try {
      await dispatch(payCommission({ 
        id: commissionId, 
        observaciones: 'Comisión marcada como pagada desde el panel administrativo' 
      })).unwrap();
      
      // Recargar la lista
      dispatch(fetchCommissions({ 
        page: pagination.page, 
        limit: pagination.limit,
        filters 
      }));
    } catch (error) {
      alert('Error al marcar la comisión como pagada: ' + error);
    }
  };

  // Función para cambiar página
  const handlePageChange = (newPage) => {
    dispatch(fetchCommissions({ 
      page: newPage, 
      limit: pagination.limit,
      filters 
    }));
  };

  // Función para aplicar filtros
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (loading && commissions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-blue-500 mb-4" />
          <p className="text-gray-600">Cargando comisiones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error al cargar las comisiones: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
         <button
          onClick={() => navigate("/panel")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Volver
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comisiones</h1>
          <p className="text-gray-600">Gestión de comisiones de ventas</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              showFilters 
                ? 'bg-blue-50 text-blue-600 border-blue-200' 
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <FontAwesomeIcon icon={faFilter} className="mr-2" />
            Filtros
          </button>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Pendiente</option>
                <option value="approved">Aprobada</option>
                <option value="paid">Pagada</option>
                <option value="generated">Generada</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha inicio
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha fin
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <div className="relative">
                <FontAwesomeIcon 
                  icon={faSearch} 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Buscar vendedor o contrato..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm font-medium">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-900">
                {commissions.filter(c => c.status === 'pending').length}
              </p>
            </div>
            <FontAwesomeIcon icon={faClock} className="text-yellow-500 text-2xl" />
          </div>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Aprobadas</p>
              <p className="text-2xl font-bold text-blue-900">
                {commissions.filter(c => c.status === 'approved').length}
              </p>
            </div>
            <FontAwesomeIcon icon={faCheckCircle} className="text-blue-500 text-2xl" />
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Pagadas</p>
              <p className="text-2xl font-bold text-green-900">
                {commissions.filter(c => c.status === 'paid').length}
              </p>
            </div>
            <FontAwesomeIcon icon={faCreditCard} className="text-green-500 text-2xl" />
          </div>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Total Monto</p>
              <p className="text-2xl font-bold text-purple-900">
                {formatCurrency(
                  commissions.reduce((sum, c) => sum + parseFloat(c.monto_comision), 0)
                )}
              </p>
            </div>
            <FontAwesomeIcon icon={faDollarSign} className="text-purple-500 text-2xl" />
          </div>
        </div>
      </div>

      {/* Lista de comisiones */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contrato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Porcentaje
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto Base
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
              {commissions.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center">
                    <FontAwesomeIcon icon={faCoins} className="text-4xl text-gray-300 mb-4" />
                    <p className="text-gray-500">No hay comisiones registradas</p>
                  </td>
                </tr>
              ) : (
                commissions.map((commission) => (
                  <tr key={commission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FontAwesomeIcon icon={faFileContract} className="text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {commission.Contract?.contract_number || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {commission.Contract?.Quote?.nombre_cliente || 'Cliente N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FontAwesomeIcon icon={faUser} className="text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {commission.Vendedor?.name} {commission.Vendedor?.lastname}
                          </div>
                          <div className="text-sm text-gray-500">
                            {commission.Vendedor?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 capitalize">
                        {commission.tipo_vendedor}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {commission.porcentaje}%
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(commission.monto_base)}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-green-600">
                        {formatCurrency(commission.monto_comision)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(commission.status)}`}>
                        <FontAwesomeIcon 
                          icon={getStatusIcon(commission.status)} 
                          className="mr-1" 
                        />
                        {getStatusText(commission.status)}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400 mr-2" />
                        {new Date(commission.fecha_generacion).toLocaleDateString('es-CO')}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAction('view', commission.id)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Ver detalles"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                        
                        {commission.status === 'pending' && (
                          <button
                            onClick={() => handleAction('approve', commission.id)}
                            className="text-green-600 hover:text-green-900 p-1 rounded"
                            title="Aprobar comisión"
                          >
                            <FontAwesomeIcon icon={faCheck} />
                          </button>
                        )}
                        
                        {commission.status === 'approved' && (
                          <button
                            onClick={() => handleAction('pay', commission.id)}
                            className="text-purple-600 hover:text-purple-900 p-1 rounded"
                            title="Marcar como pagada"
                          >
                            <FontAwesomeIcon icon={faCreditCard} />
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

        {/* Paginación */}
        {pagination.totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                {pagination.total} resultados
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="mr-1" />
                  Anterior
                </button>
                
                <span className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-md">
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                  <FontAwesomeIcon icon={faChevronRight} className="ml-1" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommissionsList;
