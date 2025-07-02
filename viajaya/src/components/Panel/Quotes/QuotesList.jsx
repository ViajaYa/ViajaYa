import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faPaperPlane, 
  faCheck, 
  faTimes, 
  faRedo, 
  faFileContract,
  faFilePdf,
  faCopy,
  faTrash,
  faEye,
  faEdit,
  faFilter,
  faSearch
} from '@fortawesome/free-solid-svg-icons';

// ✅ Importar acciones del slice
import {
  fetchQuotes,
  sendQuoteToClient,
  approveQuote,
  rejectQuote,
  requestRequote,
  convertQuoteToContract,
  generateQuotePDF,
  duplicateQuote,
  deleteQuote,
  updateFilters,
  clearFilters,
  setPagination,
  clearQuoteError,
  QUOTE_STATUSES,
  // Selectores
  selectQuotes,
  selectQuoteLoading,
  selectQuoteError,
  selectQuoteFilters,
  selectQuotePagination,
  selectQuoteStats
} from '../../../redux/slices/quoteSlice';

// ✅ Importar selectores de auth
import { selectUser, selectIsAuthenticated } from '../../../redux/slices/authSlice';

// ✅ Importar componentes
import NavBar from '../../layout/NavBar/NavBar';
import QuotePopup from '../../popups/QuotePopup';

const QuotesList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // ✅ Selectores de Redux
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const quotes = useSelector(selectQuotes);
  const loading = useSelector(selectQuoteLoading);
  const error = useSelector(selectQuoteError);
  const filters = useSelector(selectQuoteFilters);
  const pagination = useSelector(selectQuotePagination);
  const stats = useSelector(selectQuoteStats);

  // ✅ Estados locales
  const [showCreateQuote, setShowCreateQuote] = useState(false);
  const [selectedQuotes, setSelectedQuotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  // ✅ Cargar cotizaciones al montar
  useEffect(() => {
    if (isAuthenticated && user) {
      dispatch(fetchQuotes({ 
        page: pagination.page, 
        limit: pagination.limit, 
        filters 
      }));
    }
  }, [dispatch, isAuthenticated, user, pagination.page, pagination.limit, filters]);

  // ✅ Limpiar errores
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearQuoteError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  // ✅ CORRECCIÓN: Cotizaciones filtradas usando campos reales
  const filteredQuotes = useMemo(() => {
    if (!searchTerm.trim()) return quotes;
    
    return quotes.filter(quote => 
      quote.nombre_cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.email_cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.destino?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.id?.toString().includes(searchTerm) ||
      quote.quote_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.Asesor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.Asesor?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [quotes, searchTerm]);

  // ✅ Función para obtener el color del estado
  const getStatusColor = (status) => {
    const statusColors = {
      [QUOTE_STATUSES.PENDING]: 'bg-yellow-100 text-yellow-800',
      [QUOTE_STATUSES.COMPLETED]: 'bg-blue-100 text-blue-800',
      [QUOTE_STATUSES.SENT]: 'bg-indigo-100 text-indigo-800',
      [QUOTE_STATUSES.APPROVED]: 'bg-green-100 text-green-800',
      [QUOTE_STATUSES.REJECTED]: 'bg-red-100 text-red-800',
      [QUOTE_STATUSES.REQUOTE]: 'bg-orange-100 text-orange-800',
      [QUOTE_STATUSES.EXPIRED]: 'bg-gray-100 text-gray-800',
      [QUOTE_STATUSES.CONVERTED]: 'bg-purple-100 text-purple-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  // ✅ Función para obtener el texto del estado
  const getStatusText = (status) => {
    const statusTexts = {
      [QUOTE_STATUSES.PENDING]: 'Pendiente',
      [QUOTE_STATUSES.COMPLETED]: 'Completada',
      [QUOTE_STATUSES.SENT]: 'Enviada',
      [QUOTE_STATUSES.APPROVED]: 'Aprobada',
      [QUOTE_STATUSES.REJECTED]: 'Rechazada',
      [QUOTE_STATUSES.REQUOTE]: 'Re-cotización',
      [QUOTE_STATUSES.EXPIRED]: 'Expirada',
      [QUOTE_STATUSES.CONVERTED]: 'Convertida'
    };
    return statusTexts[status] || 'Desconocido';
  };

  // ✅ Manejo de acciones
  const handleAction = async (action, quoteId, data = {}) => {
    setActionLoading(prev => ({ ...prev, [quoteId]: true }));
    
    try {
      switch (action) {
        case 'send':
          await dispatch(sendQuoteToClient(quoteId)).unwrap();
          break;
        case 'approve':
          await dispatch(approveQuote({ quoteId, approvalData: data })).unwrap();
          break;
        case 'reject':
          await dispatch(rejectQuote({ quoteId, reason: data.reason })).unwrap();
          break;
        case 'requote':
          await dispatch(requestRequote({ quoteId, requote_reason: data.reason })).unwrap();
          break;
        case 'convert':
          await dispatch(convertQuoteToContract({ quoteId, contractData: data })).unwrap();
          break;
        case 'pdf':
          await dispatch(generateQuotePDF(quoteId)).unwrap();
          break;
        case 'duplicate':
          await dispatch(duplicateQuote(quoteId)).unwrap();
          break;
        case 'delete':
          if (window.confirm('¿Estás seguro de eliminar esta cotización?')) {
            await dispatch(deleteQuote(quoteId)).unwrap();
          }
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(`Error en acción ${action}:`, error);
    } finally {
      setActionLoading(prev => ({ ...prev, [quoteId]: false }));
    }
  };

  // ✅ Manejo de filtros
  const handleFilterChange = (filterType, value) => {
    dispatch(updateFilters({ [filterType]: value }));
  };

  // ✅ Manejo de paginación
  const handlePageChange = (newPage) => {
    dispatch(setPagination({ page: newPage }));
  };

  // ✅ Renderizar botones de acción según el estado
  const renderActionButtons = (quote) => {
    const isLoading = actionLoading[quote.id];
    
    return (
      <div className="flex items-center gap-1">
        {/* Ver detalles */}
        <button
          onClick={() => navigate(`/panel/quotes/${quote.id}`)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
          title="Ver detalles"
        >
          <FontAwesomeIcon icon={faEye} size="sm" />
        </button>

        {/* Editar (solo si está pendiente o completada) */}
        {(quote.status === QUOTE_STATUSES.PENDING || quote.status === QUOTE_STATUSES.COMPLETED) && (
          <button
            onClick={() => navigate(`/panel/quotes/${quote.id}/edit`)}
            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
            title="Editar"
          >
            <FontAwesomeIcon icon={faEdit} size="sm" />
          </button>
        )}

        {/* Enviar (si está completada) */}
        {quote.status === QUOTE_STATUSES.COMPLETED && (
          <button
            onClick={() => handleAction('send', quote.id)}
            disabled={isLoading}
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded transition-colors disabled:opacity-50"
            title="Enviar al cliente"
          >
            <FontAwesomeIcon icon={faPaperPlane} size="sm" />
          </button>
        )}

        {/* Aprobar (si está enviada) */}
        {quote.status === QUOTE_STATUSES.SENT && user?.role >= 5 && (
          <button
            onClick={() => handleAction('approve', quote.id)}
            disabled={isLoading}
            className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
            title="Aprobar"
          >
            <FontAwesomeIcon icon={faCheck} size="sm" />
          </button>
        )}

        {/* Rechazar (si está enviada) */}
        {quote.status === QUOTE_STATUSES.SENT && user?.role >= 5 && (
          <button
            onClick={() => {
              const reason = window.prompt('Motivo del rechazo:');
              if (reason) handleAction('reject', quote.id, { reason });
            }}
            disabled={isLoading}
            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
            title="Rechazar"
          >
            <FontAwesomeIcon icon={faTimes} size="sm" />
          </button>
        )}

        {/* Convertir a contrato (si está aprobada) */}
        {quote.status === QUOTE_STATUSES.APPROVED && user?.role >= 5 && (
          <button
            onClick={() => handleAction('convert', quote.id, {})}
            disabled={isLoading}
            className="p-2 text-purple-600 hover:bg-purple-50 rounded transition-colors disabled:opacity-50"
            title="Convertir a contrato"
          >
            <FontAwesomeIcon icon={faFileContract} size="sm" />
          </button>
        )}

        {/* Generar PDF */}
        {(quote.status === QUOTE_STATUSES.COMPLETED || 
          quote.status === QUOTE_STATUSES.SENT || 
          quote.status === QUOTE_STATUSES.APPROVED) && (
          <button
            onClick={() => handleAction('pdf', quote.id)}
            disabled={isLoading}
            className="p-2 text-gray-600 hover:bg-gray-50 rounded transition-colors disabled:opacity-50"
            title="Generar PDF"
          >
            <FontAwesomeIcon icon={faFilePdf} size="sm" />
          </button>
        )}

        {/* Duplicar */}
        <button
          onClick={() => handleAction('duplicate', quote.id)}
          disabled={isLoading}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
          title="Duplicar"
        >
          <FontAwesomeIcon icon={faCopy} size="sm" />
        </button>

        {/* Eliminar (solo admins y si está pendiente) */}
        {user?.role >= 7 && quote.status === QUOTE_STATUSES.PENDING && (
          <button
            onClick={() => handleAction('delete', quote.id)}
            disabled={isLoading}
            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
            title="Eliminar"
          >
            <FontAwesomeIcon icon={faTrash} size="sm" />
          </button>
        )}
      </div>
    );
  };

  // ✅ Protección de ruta
  if (!isAuthenticated || !user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-2">Cargando...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className='fixed top-0 left-0 z-50 w-full'>
        <NavBar />
      </div>

      {/* Header */}
      <div className="bg-ColorMorado text-2xl font-bold font-nunito p-4 text-gray-200 mb-8 mt-28 rounded-lg">
        <div className="flex justify-between items-center">
          <h2>Gestión de Cotizaciones</h2>
          <button
            onClick={() => setShowCreateQuote(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-base font-medium"
          >
            <FontAwesomeIcon icon={faPlus} />
            Nueva Cotización
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-500 text-white p-4 rounded-lg">
          <h3 className="text-lg font-semibold">Total</h3>
          <p className="text-2xl font-bold">{stats.totalQuotes || quotes.length}</p>
        </div>
        <div className="bg-yellow-500 text-white p-4 rounded-lg">
          <h3 className="text-lg font-semibold">Pendientes</h3>
          <p className="text-2xl font-bold">{stats.pendingQuotes || 0}</p>
        </div>
        <div className="bg-green-500 text-white p-4 rounded-lg">
          <h3 className="text-lg font-semibold">Aprobadas</h3>
          <p className="text-2xl font-bold">{stats.approvedQuotes || 0}</p>
        </div>
        <div className="bg-red-500 text-white p-4 rounded-lg">
          <h3 className="text-lg font-semibold">Rechazadas</h3>
          <p className="text-2xl font-bold">{stats.rejectedQuotes || 0}</p>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <FontAwesomeIcon 
              icon={faSearch} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
            />
            <input
              type="text"
              placeholder="Buscar por cliente, destino, número, asesor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtro por estado */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos los estados</option>
            <option value={QUOTE_STATUSES.PENDING}>Pendientes</option>
            <option value={QUOTE_STATUSES.COMPLETED}>Completadas</option>
            <option value={QUOTE_STATUSES.SENT}>Enviadas</option>
            <option value={QUOTE_STATUSES.APPROVED}>Aprobadas</option>
            <option value={QUOTE_STATUSES.REJECTED}>Rechazadas</option>
            <option value={QUOTE_STATUSES.REQUOTE}>Re-cotización</option>
            <option value={QUOTE_STATUSES.EXPIRED}>Expiradas</option>
            <option value={QUOTE_STATUSES.CONVERTED}>Convertidas</option>
          </select>

          {/* Botón filtros avanzados */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-lg transition-colors ${
              showFilters 
                ? 'bg-blue-500 text-white border-blue-500' 
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <FontAwesomeIcon icon={faFilter} className="mr-2" />
            Filtros
          </button>

          {/* Limpiar filtros */}
          <button
            onClick={() => {
              dispatch(clearFilters());
              setSearchTerm('');
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Limpiar
          </button>
        </div>

        {/* Filtros avanzados */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha desde
                </label>
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha hasta
                </label>
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destino
                </label>
                <input
                  type="text"
                  placeholder="Filtrar por destino"
                  value={filters.destino || ''}
                  onChange={(e) => handleFilterChange('destino', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Tabla de cotizaciones */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Destino
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asesor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
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
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2">Cargando cotizaciones...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    {searchTerm ? 'No se encontraron cotizaciones que coincidan con la búsqueda' : 'No hay cotizaciones disponibles'}
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {quote.quote_number || quote.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {quote.nombre_cliente || 'Sin nombre'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {quote.email_cliente || 'Sin email'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-medium">{quote.destino}</div>
                      <div className="text-gray-500 text-xs">desde {quote.origen}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {quote.Asesor?.name} {quote.Asesor?.lastname}
                      </div>
                      <div className="text-sm text-gray-500">
                        {quote.Asesor?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {quote.precio_total ? (
                        <span className="font-semibold text-green-600">
                          ${quote.precio_total.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-gray-400">Pendiente</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(quote.status)}`}>
                        {getStatusText(quote.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(quote.created_at || quote.fecha_creacion).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {renderActionButtons(quote)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> a{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span> de{' '}
                  <span className="font-medium">{pagination.total}</span> resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  
                  {/* Números de página */}
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pagination.page
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal para crear nueva cotización */}
      {showCreateQuote && (
        <QuotePopup
          isOpen={showCreateQuote}
          onClose={() => setShowCreateQuote(false)}
          onSuccess={() => {
            setShowCreateQuote(false);
            // Recargar cotizaciones
            dispatch(fetchQuotes({ 
              page: pagination.page, 
              limit: pagination.limit, 
              filters 
            }));
          }}
        />
      )}
    </div>
  );
};

export default QuotesList;