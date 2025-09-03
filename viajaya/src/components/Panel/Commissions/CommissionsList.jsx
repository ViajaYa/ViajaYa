import { useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
  faArrowLeft,
  faFilePdf,
  faExclamationTriangle,
  faFileAlt,
  faBan,
  faMoneyBillWave,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import {
  fetchCommissions,
  approveCommission,
  fetchVendorLimitSummary,
  selectCommissions,
  selectCommissionLoading,
  selectCommissionError,
  selectCommissionPagination,
  selectVendorLimitSummaries,
} from "../../../redux/slices/commissionSlice";
import api from "../../../utils/api";
import { toast } from "react-hot-toast";
import NavBar from "../../layout/NavBar/NavBar";
import PayCommissionModal from "./PayCommissionModal";
import PaymentReceiptModal from "./PaymentReceiptModal"

const CommissionsList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const commissions = useSelector(selectCommissions);
  const loading = useSelector(selectCommissionLoading);
  const error = useSelector(selectCommissionError);
  const pagination = useSelector(selectCommissionPagination);
  const vendorLimitSummaries = useSelector(selectVendorLimitSummaries);

  // Estados locales
  const [filters, setFilters] = useState({
    status: "all",
    search: "",
    startDate: "",
    endDate: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedCommissionToPay, setSelectedCommissionToPay] = useState(null);

  const loadCommissions = useCallback(async () => {
    // Filtrar parámetros vacíos
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(
        ([, value]) => value && value !== "all" && value !== ""
      )
    );

    const result = await dispatch(
      fetchCommissions({
        page: pagination.page,
        limit: pagination.limit,
        filters: cleanFilters,
      })
    );

    // Cargar límites mensuales para vendedores únicos
    if (result.payload?.commissions) {
      const uniqueVendorIds = [...new Set(
        result.payload.commissions
          .map(commission => commission.vendedor_id)
          .filter(id => id && !vendorLimitSummaries[id])
      )];

      // Cargar límites para vendedores que no tenemos en cache
      uniqueVendorIds.forEach(vendorId => {
        dispatch(fetchVendorLimitSummary(vendorId));
      });
    }
  }, [filters, pagination.page, pagination.limit, dispatch, vendorLimitSummaries]);

  useEffect(() => {
    loadCommissions();
  }, [loadCommissions]);

  // 🎨 Función para obtener el color del estado de la comisión
  const getCommissionRowColor = (commission) => {
    switch (commission.status) {
      case "pending":
        return "bg-gray-50 hover:bg-gray-100 border-l-4 border-gray-400"; // Esperando primer pago
      case "generated":
        if (commission.DocumentoSoporte) {
          // Tiene documento, lista para aprobar
          return "bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-400";
        } else {
          // No tiene documento, esperando que vendedor suba
          return "bg-yellow-50 hover:bg-yellow-100 border-l-4 border-yellow-400";
        }
      case "approved":
        return "bg-purple-50 hover:bg-purple-100 border-l-4 border-purple-400"; // Lista para pagar
      case "paid":
        return "bg-green-50 hover:bg-green-100 border-l-4 border-green-400"; // Completada
      default:
        return "bg-white hover:bg-gray-50";
    }
  };

  // ✅ Función para verificar si se puede aprobar
  const canApprove = (commission) => {
    return commission.status === "generated" && commission.DocumentoSoporte;
  };

  // ✅ Función para verificar si se puede pagar
  const canPay = (commission) => {
    return commission.status === "approved";
  };

  // ✅ Función para obtener texto del estado más descriptivo
  const getStatusText = (status, hasDocument = false) => {
    switch (status) {
      case "pending":
        return "Esperando primer pago";
      case "generated":
        return hasDocument ? "Lista para aprobar" : "Esperando documento";
      case "approved":
        return "Aprobada - Lista para pagar";
      case "paid":
        return "Pagada";
      default:
        return "Desconocido";
    }
  };

  // ✅ Función para obtener el icono del estado
  const getStatusIcon = (status, hasDocument = false) => {
    switch (status) {
      case "pending":
        return faClock;
      case "generated":
        return hasDocument ? faCheckCircle : faExclamationTriangle;
      case "approved":
        return faCheckCircle;
      case "paid":
        return faCreditCard;
      default:
        return faExclamationTriangle;
    }
  };

  // ✅ Función para obtener el color del badge de estado
  const getStatusColor = (status, hasDocument = false) => {
    switch (status) {
      case "pending":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "generated":
        return hasDocument
          ? "bg-blue-100 text-blue-800 border-blue-200"
          : "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "approved":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "paid":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // 💰 Función para formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Función para obtener el indicador de límite mensual del vendedor
  const getVendorLimitIndicator = (vendorId) => {
    const limitSummary = vendorLimitSummaries[vendorId];
    
    if (!limitSummary) {
      return (
        <div className="text-xs text-gray-400 mt-1">
          <FontAwesomeIcon icon={faClock} className="mr-1" />
          Cargando límite...
        </div>
      );
    }

    const statusColors = {
      safe: "text-green-600 bg-green-50",
      warning: "text-yellow-600 bg-yellow-50", 
      critical: "text-red-600 bg-red-50"
    };

    const statusIcons = {
      safe: faCheckCircle,
      warning: faExclamationTriangle,
      critical: faExclamationTriangle
    };

    return (
      <div className="text-xs mt-1">
        <div className={`inline-flex items-center px-2 py-1 rounded-full ${statusColors[limitSummary.status] || 'text-gray-600 bg-gray-50'}`}>
          <FontAwesomeIcon 
            icon={statusIcons[limitSummary.status] || faInfoCircle} 
            className="mr-1 h-2 w-2" 
          />
          {formatCurrency(limitSummary.pagadoMes)} / {formatCurrency(limitSummary.limite)}
          <span className="ml-1">({limitSummary.porcentajeUsado}%)</span>
        </div>
      </div>
    );
  };

  // 🔍 Vista previa del documento
  const handlePreviewDocument = async (commission) => {
    try {
      if (!commission.DocumentoSoporte || !commission.DocumentoSoporte.id) {
        toast.error("No hay documento de soporte disponible");
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No estás autenticado");
        return;
      }

      const previewUrl = `${api.defaults.baseURL}/commissions/document/${commission.DocumentoSoporte.id}/preview?token=${token}`;

      const popup = window.open(
        previewUrl,
        "DocumentPreview",
        "width=900,height=700,scrollbars=yes,resizable=yes,toolbar=no,location=no,status=no"
      );

      if (!popup) {
        toast.error(
          "El navegador bloqueó la ventana emergente. Por favor permite ventanas emergentes para este sitio."
        );
      } else {
        popup.focus();
      }
    } catch (error) {
      console.error("Error abriendo vista previa:", error);
      toast.error("Error al abrir vista previa del documento");
    }
  };

  // ✅ Aprobar comisión
  const handleApproveCommission = async (commissionId) => {
    if (!window.confirm("¿Está seguro de aprobar esta comisión?")) {
      return;
    }

    setActionLoading(commissionId);
    try {
      await dispatch(
        approveCommission({
          id: commissionId,
          observaciones: "Comisión aprobada desde el panel administrativo",
        })
      ).unwrap();

      toast.success("Comisión aprobada exitosamente");
      loadCommissions(); // Recargar lista
    } catch (error) {
      toast.error("Error al aprobar la comisión: " + error);
    } finally {
      setActionLoading(null);
    }
  };

//   const handleShowPaymentReceipt = (commission) => {
//     const receiptUrl = commission.DocumentoSoporte?.comprobante_pago_url;

//     if (!receiptUrl) {
//       toast.error("No hay comprobante de pago disponible");
//       return;
//     }

//     // ✅ Para Cloudinary, abrir directamente en nueva pestaña
//     window.open(receiptUrl, "_blank", "noopener,noreferrer");
//   };

  // ✅ AGREGAR: Modal para vista previa de comprobante
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const handlePreviewPaymentReceipt = (commission) => {
    const receiptUrl = commission.DocumentoSoporte?.comprobante_pago_url;

    if (!receiptUrl) {
      toast.error("No hay comprobante de pago disponible");
      return;
    }

    setSelectedReceipt({
      url: receiptUrl,
      commission: commission,
      title: `Comprobante - ${commission.Contract?.contract_number}`,
    });
    setShowReceiptModal(true);
  };

  // 💳 Abrir modal para marcar como pagada con comprobante
  const handlePayCommission = (commission) => {
    setSelectedCommissionToPay(commission);
    setPayModalOpen(true);
  };

  // ✅ Callback cuando se completa el pago
  const handlePaymentSuccess = () => {
    setPayModalOpen(false);
    setSelectedCommissionToPay(null);
    loadCommissions(); // Recargar lista
  };

  // 📄 Ver detalles de la comisión
  const handleViewDetails = (commissionId) => {
    // Aquí puedes implementar una modal o navegación a detalles
    console.log("Ver detalles de comisión:", commissionId);
    toast.info("Funcionalidad de detalles en desarrollo");
  };

  // 🔄 Cambiar página
  const handlePageChange = (newPage) => {
    dispatch(
      fetchCommissions({
        page: newPage,
        limit: pagination.limit,
        filters: Object.fromEntries(
          Object.entries(filters).filter(
            ([, value]) => value && value !== "all" && value !== ""
          )
        ),
      })
    );
  };

  // 🔧 Aplicar filtros
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // 🗑️ Limpiar filtros
  const clearFilters = () => {
    setFilters({
      status: "all",
      search: "",
      startDate: "",
      endDate: "",
    });
  };

  // 📊 Calcular estadísticas dinámicas
  const stats = {
    pending: commissions.filter((c) => c.status === "pending").length,
    generatedWithoutDoc: commissions.filter(
      (c) => c.status === "generated" && !c.DocumentoSoporte
    ).length,
    generatedWithDoc: commissions.filter(
      (c) => c.status === "generated" && c.DocumentoSoporte
    ).length,
    approved: commissions.filter((c) => c.status === "approved").length,
    paid: commissions.filter((c) => c.status === "paid").length,
    totalAmount: commissions.reduce(
      (sum, c) => sum + parseFloat(c.monto_comision || 0),
      0
    ),
    withDocuments: commissions.filter((c) => c.DocumentoSoporte).length,
  };

  if (loading && commissions.length === 0) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="fixed top-0 left-0 z-50 w-full">
          <NavBar />
        </div>
        <div className="text-center">
          <FontAwesomeIcon
            icon={faSpinner}
            spin
            className="text-4xl text-blue-500 mb-4"
          />
          <p className="text-gray-600">Cargando comisiones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-20 p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">
            Error al cargar las comisiones: {error}
          </p>
          <button
            onClick={loadCommissions}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 p-8">
      <div className="fixed top-0 left-0 z-50 w-full">
        <NavBar />
      </div>

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
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Comisiones</h1>
            <p className="text-gray-600">Gestión de comisiones de ventas</p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => navigate("/monthly-limits")}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              title="Ver límites mensuales de comisiones"
            >
              <FontAwesomeIcon icon={faMoneyBillWave} className="text-sm" />
              Límites Mensuales
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                showFilters
                  ? "bg-blue-50 text-blue-600 border-blue-200"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
            >
              <FontAwesomeIcon icon={faFilter} className="mr-2" />
              Filtros
            </button>
          </div>
        </div>

        {/* Filtros */}
        {showFilters && (
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Todos los estados</option>
                  <option value="pending">En espera (sin primer pago)</option>
                  <option value="generated">
                    Activas (primer pago recibido)
                  </option>
                  <option value="approved">
                    Aprobadas (listas para pagar)
                  </option>
                  <option value="paid">Pagadas</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha inicio
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    handleFilterChange("startDate", e.target.value)
                  }
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
                  onChange={(e) =>
                    handleFilterChange("endDate", e.target.value)
                  }
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
                    onChange={(e) =>
                      handleFilterChange("search", e.target.value)
                    }
                    placeholder="Buscar vendedor o contrato..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <FontAwesomeIcon icon={faBan} className="mr-2" />
                Limpiar filtros
              </button>
            </div>
          </div>
        )}

        {/* Estadísticas actualizadas para el nuevo flujo */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">En Espera</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.pending}
                </p>
                <p className="text-xs text-gray-600">Esperando primer pago</p>
              </div>
              <FontAwesomeIcon
                icon={faClock}
                className="text-gray-500 text-xl"
              />
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm font-medium">
                  Sin Documento
                </p>
                <p className="text-xl font-bold text-yellow-900">
                  {stats.generatedWithoutDoc}
                </p>
                <p className="text-xs text-yellow-600">Vendedor debe subir</p>
              </div>
              <FontAwesomeIcon
                icon={faExclamationTriangle}
                className="text-yellow-500 text-xl"
              />
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">
                  Para Aprobar
                </p>
                <p className="text-xl font-bold text-blue-900">
                  {stats.generatedWithDoc}
                </p>
                <p className="text-xs text-blue-600">Con documento subido</p>
              </div>
              <FontAwesomeIcon
                icon={faFileAlt}
                className="text-blue-500 text-xl"
              />
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">
                  Para Pagar
                </p>
                <p className="text-xl font-bold text-purple-900">
                  {stats.approved}
                </p>
                <p className="text-xs text-purple-600">Aprobadas</p>
              </div>
              <FontAwesomeIcon
                icon={faCheckCircle}
                className="text-purple-500 text-xl"
              />
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Pagadas</p>
                <p className="text-xl font-bold text-green-900">{stats.paid}</p>
                <p className="text-xs text-green-600">Completadas</p>
              </div>
              <FontAwesomeIcon
                icon={faCreditCard}
                className="text-green-500 text-xl"
              />
            </div>
          </div>

          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-600 text-sm font-medium">
                  Total Monto
                </p>
                <p className="text-lg font-bold text-indigo-900">
                  {formatCurrency(stats.totalAmount)}
                </p>
              </div>
              <FontAwesomeIcon
                icon={faDollarSign}
                className="text-indigo-500 text-xl"
              />
            </div>
          </div>
        </div>

        {/* Tabla de comisiones */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
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
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <FontAwesomeIcon
                        icon={faCoins}
                        className="text-4xl text-gray-300 mb-4"
                      />
                      <p className="text-gray-500">
                        No hay comisiones que coincidan con los filtros
                      </p>
                      {Object.values(filters).some((f) => f && f !== "all") && (
                        <button
                          onClick={clearFilters}
                          className="mt-2 text-blue-600 hover:text-blue-800"
                        >
                          Limpiar filtros
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  commissions.map((commission) => (
                    <tr
                      key={commission.id}
                      className={getCommissionRowColor(commission)}
                    >
                      {/* Contrato */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FontAwesomeIcon
                            icon={faFileContract}
                            className="text-gray-400 mr-2"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {commission.Contract?.contract_number || "N/A"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {commission.Contract?.Quote?.nombre_cliente ||
                                "Cliente N/A"}
                            </div>
                          </div>
                        </div>
                      </td>
                      {/* Vendedor */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FontAwesomeIcon
                            icon={faUser}
                            className="text-gray-400 mr-2"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {commission.Vendedor?.name}{" "}
                              {commission.Vendedor?.lastname}
                            </div>
                            <div className="text-sm text-gray-500 capitalize">
                              {commission.tipo_vendedor}
                            </div>
                            {/* Indicador de límite mensual */}
                            {getVendorLimitIndicator(commission.vendedor_id)}
                          </div>
                        </div>
                      </td>
                      {/* Tipo */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 capitalize">
                          {commission.tipo_vendedor}
                        </span>
                      </td>
                      {/* Comisión */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">
                          {formatCurrency(commission.monto_comision)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {commission.porcentaje}% de{" "}
                          {formatCurrency(commission.monto_base)}
                        </div>
                      </td>
                      {/* Estado */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                            commission.status,
                            !!commission.DocumentoSoporte
                          )}`}
                        >
                          <FontAwesomeIcon
                            icon={getStatusIcon(
                              commission.status,
                              !!commission.DocumentoSoporte
                            )}
                            className="mr-1"
                          />
                          {getStatusText(
                            commission.status,
                            !!commission.DocumentoSoporte
                          )}
                        </span>
                      </td>
                      {/* Fecha */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <FontAwesomeIcon
                            icon={faCalendarAlt}
                            className="text-gray-400 mr-2"
                          />
                          {new Date(
                            commission.fecha_generacion || commission.created_at
                          ).toLocaleDateString("es-CO")}
                        </div>
                      </td>
                      {/* Acciones */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-1">
                          {/* Vista previa del documento - solo si existe */}
                          {commission.DocumentoSoporte && (
                            <button
                              onClick={() => handlePreviewDocument(commission)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                              title="Vista previa del documento"
                            >
                              <FontAwesomeIcon icon={faFilePdf} size="sm" />
                            </button>
                          )}

                          {/* Ver detalles */}
                          <button
                            onClick={() => handleViewDetails(commission.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Ver detalles"
                          >
                            <FontAwesomeIcon icon={faEye} size="sm" />
                          </button>

                          {/* Aprobar - solo para generated CON documento */}
                          {canApprove(commission) && (
                            <button
                              onClick={() =>
                                handleApproveCommission(commission.id)
                              }
                              disabled={actionLoading === commission.id}
                              className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                              title="Aprobar comisión (documento revisado)"
                            >
                              {actionLoading === commission.id ? (
                                <FontAwesomeIcon
                                  icon={faSpinner}
                                  spin
                                  size="sm"
                                />
                              ) : (
                                <FontAwesomeIcon icon={faCheck} size="sm" />
                              )}
                            </button>
                          )}

                          {/* Marcar como pagada - solo para approved */}
                          {canPay(commission) && (
                            <button
                              onClick={() => handlePayCommission(commission)}
                              disabled={actionLoading === commission.id}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded transition-colors disabled:opacity-50"
                              title="Marcar como pagada"
                            >
                              {actionLoading === commission.id ? (
                                <FontAwesomeIcon
                                  icon={faSpinner}
                                  spin
                                  size="sm"
                                />
                              ) : (
                                <FontAwesomeIcon
                                  icon={faMoneyBillWave}
                                  size="sm"
                                />
                              )}
                            </button>
                          )}

                          {/* Indicadores visuales */}
                          {commission.status === "generated" &&
                            !commission.DocumentoSoporte && (
                              <span
                                className="p-2 text-orange-500"
                                title="Esperando que el vendedor suba su cuenta-cobro"
                              >
                                <FontAwesomeIcon
                                  icon={faExclamationTriangle}
                                  size="sm"
                                />
                              </span>
                            )}

                          {commission.status === "pending" && (
                            <span
                              className="p-2 text-gray-500"
                              title="Esperando primer pago del contrato"
                            >
                              <FontAwesomeIcon icon={faClock} size="sm" />
                            </span>
                          )}

                          {commission.status === "paid" &&
                            commission.DocumentoSoporte
                              ?.comprobante_pago_url && (
                              <button
                                onClick={() =>
                                  handlePreviewPaymentReceipt(commission)
                                }
                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                title="Ver comprobante de pago"
                              >
                                <FontAwesomeIcon
                                  icon={faMoneyBillWave}
                                  size="sm"
                                />
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
                  Mostrando {(pagination.page - 1) * pagination.limit + 1} a{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{" "}
                  de {pagination.total} resultados
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

      {/* Modal para marcar como pagada */}
      {payModalOpen && selectedCommissionToPay && (
        <PayCommissionModal
          commission={selectedCommissionToPay}
          onClose={() => setPayModalOpen(false)}
          onSuccess={handlePaymentSuccess}
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

export default CommissionsList;
