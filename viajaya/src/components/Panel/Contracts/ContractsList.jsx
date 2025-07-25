import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import NavBar from "../../layout/NavBar/NavBar";
import api from "../../../utils/api";
import {
  faEye,
  faEdit,
  faPaperPlane,
  faDownload,
  faFileContract,
  faFilter,
  faSearch,
  faSpinner,
  faCheck,
  faClock,
  faExclamationTriangle,
  faUser,
  faMapMarkerAlt,
  faDollarSign,
  faCalendarAlt,
  faChevronLeft,
  faChevronRight,
  faPlus,
  faCheckCircle,
  faCoins,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import {
  fetchContractById,
  fetchContracts,
  selectContractsWithDetails,
  selectContractLoading,
  selectContractSummary,
  selectContractPagination,
  generateContractPDF,

} from "../../../redux/slices/contractSlice";
import SendContractModal from "./SendContractModal";

const ContractsList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const contracts = useSelector(selectContractsWithDetails);
  const loading = useSelector(selectContractLoading);
  const summary = useSelector(selectContractSummary);
  const pagination = useSelector(selectContractPagination);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  // Estados locales
  const [filters, setFilters] = useState({
    status: "all",
    search: "",
    dateRange: "all",
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    dispatch(
      fetchContracts({
        page: pagination.page,
        limit: pagination.limit,
        filters,
      })
    );
  }, [dispatch, pagination.page, pagination.limit, filters]);

  // Función para obtener el color del estado
  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Función para obtener el icono del estado
  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return faCheck;
      case "draft":
        return faClock;
      case "completed":
        return faFileContract;
      case "cancelled":
        return faExclamationTriangle;
      default:
        return faClock;
    }
  };

  // Función para manejar acciones
  const handleAction = async (action, contractId, contract = null) => {
    switch (action) {
      case "view": {
        const pdfUrl = `${import.meta.env.VITE_API_URL}/contracts/pdf/${contractId}`;
        window.open(pdfUrl, '_blank');
        break;
      }
      case "edit":
        navigate(`/contracts/${contractId}/edit`);
        break;
      case 'send':
        // ✅ IMPLEMENTAR: Lógica de envío con modal
        console.log('🔄 Abriendo modal de envío para contrato:', contractId);
        setSelectedContract(contract || contracts.find(c => c.id === contractId));
        setShowSendModal(true);
        break;
      case "download":
        // ✅ MEJORAR: Acción de descarga
        if (contract?.contrato_pdf_url) {
          const pdfUrl = `${import.meta.env.VITE_API_URL}/${contract.contrato_pdf_url}`;
          const link = document.createElement('a');
          link.href = pdfUrl;
          link.download = `contrato-${contract.contract_number}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          // Generar y descargar
          dispatch(generateContractPDF(contractId));
        }
        break;
      case "approve":
        // ✅ NUEVA ACCIÓN: Aprobar contrato y generar comisiones
        await handleApproveContract(contractId);
        break;
      default:
        break;
    }
  };

  const handleSendSuccess = () => {
    console.log('✅ Contrato enviado exitosamente, recargando lista...');
    // Recargar la lista de contratos
    dispatch(fetchContracts({
      page: pagination.page,
      limit: pagination.limit,
      filters
    }));
  };

  const handleCloseSendModal = () => {
    console.log('🔄 Cerrando modal de envío');
    setShowSendModal(false);
    setSelectedContract(null);
  };

  // ✅ NUEVA FUNCIÓN: Aprobar contrato
  const handleApproveContract = async (contractId) => {
    if (
      !confirm(
        "¿Está seguro de aprobar este contrato? Esto generará las comisiones correspondientes."
      )
    ) {
      return;
    }

    try {
      const response = await api.patch(`/contracts/${contractId}/approve`, {
        observaciones: "Contrato aprobado desde el panel administrativo",
      });

      if (response.data.success) {
        alert(
          `Contrato aprobado exitosamente. ${response.data.commissionSummary?.commissions?.length || 0
          } comisiones generadas.`
        );
        // Recargar la lista
        dispatch(
          fetchContracts({
            page: pagination.page,
            limit: pagination.limit,
            filters,
          })
        );
      } else {
        alert("Error al aprobar el contrato: " + response.data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      alert(
        "Error de conexión al aprobar el contrato: " +
        (error.response?.data?.message || error.message)
      );
    }
  };

  // Función para cambiar página
  const handlePageChange = (newPage) => {
    dispatch(
      fetchContracts({
        page: newPage,
        limit: pagination.limit,
        filters,
      })
    );
  };

  // Función para aplicar filtros
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  if (loading && contracts.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <FontAwesomeIcon
          icon={faSpinner}
          spin
          size="2x"
          className="text-blue-500"
        />
        <span className="ml-3 text-lg">Cargando contratos...</span>
      </div>
    );
  }

  return (
       <div className="mb-64 pt-20 p-8"> {/* Agregado pt-20 para el margen superior */}
      <div className='fixed top-0 left-0 z-50 w-full'>
            <NavBar />
          </div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate("/panel")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Volver
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contratos</h1>
          <p className="text-gray-600 mt-1">Gestión de contratos de viaje</p>
        </div>
        <button
          onClick={() => navigate("/quotesList")}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faPlus} />
          Desde Cotización
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Contratos
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.total}
              </p>
            </div>
            <FontAwesomeIcon
              icon={faFileContract}
              className="text-blue-500 text-2xl"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Activos</p>
              <p className="text-2xl font-bold text-green-600">
                {summary.active}
              </p>
            </div>
            <FontAwesomeIcon
              icon={faCheck}
              className="text-green-500 text-2xl"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">
                {summary.pending}
              </p>
            </div>
            <FontAwesomeIcon
              icon={faClock}
              className="text-yellow-500 text-2xl"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold text-blue-600">
                ${summary.totalValue?.toLocaleString()}
              </p>
            </div>
            <FontAwesomeIcon
              icon={faDollarSign}
              className="text-blue-500 text-2xl"
            />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Búsqueda */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Buscar por número de contrato, cliente..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filtro por estado */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos los estados</option>
            <option value="draft">Borrador</option>
            <option value="active">Activo</option>
            <option value="completed">Completado</option>
            <option value="cancelled">Cancelado</option>
          </select>

          {/* Botón de filtros avanzados */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faFilter} />
            Filtros
          </button>
        </div>

        {/* Filtros avanzados (collapsible) */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={filters.dateRange}
                onChange={(e) =>
                  handleFilterChange("dateRange", e.target.value)
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas las fechas</option>
                <option value="today">Hoy</option>
                <option value="week">Esta semana</option>
                <option value="month">Este mes</option>
                <option value="year">Este año</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Lista de contratos */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {contracts.length === 0 ? (
          <div className="p-8 text-center">
            <FontAwesomeIcon
              icon={faFileContract}
              className="text-gray-300 text-4xl mb-4"
            />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay contratos
            </h3>
            <p className="text-gray-600 mb-4">
              No se encontraron contratos con los filtros aplicados.
            </p>
            <button
              onClick={() => navigate("/quotesList")}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Crear desde cotización
            </button>
          </div>
        ) : (
          <>
            {/* Header de la tabla */}
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                <div className="col-span-2">Contrato</div>
                <div className="col-span-2">Cliente</div>
                <div className="col-span-2">Destino</div>
                <div className="col-span-1">Estado</div>
                <div className="col-span-1">Valor</div>
                <div className="col-span-2">Fechas Viaje</div>
                <div className="col-span-1">Progreso</div>
                <div className="col-span-1">Acciones</div>
              </div>
            </div>

            {/* Filas de contratos */}
            <div className="divide-y divide-gray-200">
              {contracts.map((contract) => (
                <div
                  key={contract.id}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Número de contrato */}
                    <div className="col-span-2">
                      <div className="font-medium text-gray-900">
                        {contract.contract_number}
                      </div>
                      <div className="text-sm text-gray-500">
                        {contract.quoteNumber}
                      </div>
                    </div>

                    {/* Cliente */}
                    <div className="col-span-2">
                      <div className="flex items-center">
                        <FontAwesomeIcon
                          icon={faUser}
                          className="text-gray-400 mr-2"
                        />
                        <div>
                          <div className="font-medium text-gray-900">
                            {contract.clienteName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {contract.clienteEmail}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Destino */}
                    <div className="col-span-2">
                      <div className="flex items-center">
                        <FontAwesomeIcon
                          icon={faMapMarkerAlt}
                          className="text-gray-400 mr-2"
                        />
                        <div>
                          <div className="font-medium text-gray-900">
                            {contract.destino}
                          </div>
                          <div className="text-sm text-gray-500">
                            desde {contract.origen}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Estado */}
                    <div className="col-span-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          contract.status
                        )}`}
                      >
                        <FontAwesomeIcon
                          icon={getStatusIcon(contract.status)}
                          className="mr-1"
                        />
                        {contract.status === "draft" && "Borrador"}
                        {contract.status === "active" && "Activo"}
                        {contract.status === "completed" && "Completado"}
                        {contract.status === "cancelled" && "Cancelado"}
                      </span>
                    </div>

                    {/* Valor */}
                    <div className="col-span-1">
                      <div className="font-medium text-gray-900">
                        ${parseFloat(contract.precio_total).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {contract.forma_pago === "cuotas"
                          ? "Cuotas"
                          : "Contado"}
                      </div>
                    </div>

                    {/* Fechas de viaje */}
                    <div className="col-span-2">
                      <div className="flex items-center text-sm">
                        <FontAwesomeIcon
                          icon={faCalendarAlt}
                          className="text-gray-400 mr-2"
                        />
                        <div>
                          <div className="text-gray-900">
                            {new Date(
                              contract.fecha_inicio_viaje
                            ).toLocaleDateString("es-ES")}
                          </div>
                          <div className="text-gray-500">
                            al{" "}
                            {new Date(
                              contract.fecha_fin_viaje
                            ).toLocaleDateString("es-ES")}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progreso de pago */}
                    <div className="col-span-1">
                      <div className="text-sm font-medium text-gray-900">
                        {contract.paymentProgress}%
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${contract.paymentProgress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="col-span-1">
                      <div className="flex items-center gap-1">


                        {/* Editar */}
                        {contract.status === "draft" && (
                          <button
                            onClick={() => handleAction("edit", contract.id)}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                            title="Editar"
                          >
                            <FontAwesomeIcon icon={faEdit} size="sm" />
                          </button>
                        )}

                        {/* Ver */}
                        <button
                          onClick={() => handleAction("view", contract.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Ver detalles"
                        >
                          <FontAwesomeIcon icon={faEye} size="sm" />
                        </button>

                        {/* Enviar */}
                        {(contract.status === "draft" ||
                          contract.status === "active") && (
                            <button
                              onClick={() =>
                                handleAction("send", contract.id, contract)
                              }
                              className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Enviar al cliente"
                            >
                              <FontAwesomeIcon icon={faPaperPlane} size="sm" />
                            </button>
                          )}

                        {/* ✅ NUEVO BOTÓN: Aprobar y generar comisiones */}
                        {(contract.status === "signed" ||
                          contract.status === "draft") && (
                            <button
                              onClick={() => handleAction("approve", contract.id)}
                              className="p-2 text-orange-600 hover:bg-orange-50 rounded transition-colors"
                              title="Aprobar contrato y generar comisiones"
                            >
                              <FontAwesomeIcon icon={faCheckCircle} size="sm" />
                            </button>
                          )}

                        {/* Ver comisiones */}
                        {(contract.status === "completed" ||
                          contract.status === "active") && (
                            <button
                              onClick={() =>
                                navigate(
                                  `/contracts/${contract.id}/commissions`
                                )
                              }
                              className="p-2 text-teal-600 hover:bg-teal-50 rounded transition-colors"
                              title="Ver comisiones generadas"
                            >
                              <FontAwesomeIcon icon={faCoins} size="sm" />
                            </button>
                          )}

                        {/* Descargar */}
                        <button
                          onClick={() => handleAction("download", contract.id)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                          title="Descargar PDF"
                        >
                          <FontAwesomeIcon icon={faDownload} size="sm" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Información del asesor (fila adicional) */}
                  {contract.asesor && (
                    <div className="mt-2 pl-4 border-l-2 border-blue-200">
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">Asesor:</span>{" "}
                        {contract.asesor.name} {contract.asesor.lastname}
                        {contract.lider && (
                          <span className="ml-4">
                            <span className="font-medium">Líder:</span>{" "}
                            {contract.lider.name} {contract.lider.lastname}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            Mostrando {(pagination.page - 1) * pagination.limit + 1} a{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} de{" "}
            {pagination.total} contratos
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>

            {/* Números de página */}
            {Array.from(
              { length: Math.min(5, pagination.totalPages) },
              (_, i) => {
                const pageNum = Math.max(1, pagination.page - 2) + i;
                if (pageNum <= pagination.totalPages) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 rounded transition-colors ${pageNum === pagination.page
                          ? "bg-blue-500 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
                return null;
              }
            )}

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        </div>
      )}
      <SendContractModal
        isOpen={showSendModal}
        onClose={handleCloseSendModal}
        contract={selectedContract}
        onSuccess={handleSendSuccess}
      />
    </div>
  );
};

export default ContractsList;
