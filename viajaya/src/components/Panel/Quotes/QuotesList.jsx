import  { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// ✅ Importar utilidades de fecha con Luxon para manejar zona horaria de Colombia
import { formatDateDisplay } from "../../../utils/dateUtils";
import {
  faPlus,
  faPaperPlane,
  faCheck,
  faTimes,
  faRedo,
  faFileContract,
  faFilePdf,
  faEye,
  faEdit,
  faFilter,
  faSearch,
  faUsers,
  faDownload,
  faExternalLinkAlt,
  faSpinner, // ✅ NUEVO
} from "@fortawesome/free-solid-svg-icons";

// ✅ Importar funciones del slice ACTUALIZADAS
import {
  fetchQuotes,
  markExpiredQuotes,
  sendQuoteToClient,
  approveQuote,
  rejectQuote,
  requestRequote,
  updateQuote,
  updateFilters,
  clearFilters,
  setPagination,
  clearQuoteError,
  // ✅ NUEVAS FUNCIONES PDF
  previewQuotePDF,
  downloadQuotePDF,
  regenerateQuotePDF,
  clearPDFError,
  clearLastPreviewUrl,
  QUOTE_STATUSES,
  // Selectores
  selectQuotes,
  selectQuoteLoading,
  selectQuoteError,
  selectQuoteFilters,
  selectQuotePagination,
  selectQuoteStats,
  // ✅ NUEVOS SELECTORES PDF
  selectPDFOperations,
  selectPDFLoading,
  selectPDFError,
  selectLastPreviewUrl,
  fetchQuoteById,
} from "../../../redux/slices/quoteSlice";

// ✅ Importar selectores de auth
import {
  selectUser,
  selectIsAuthenticated,
} from "../../../redux/slices/authSlice";

// ✅ Importar hook de permisos
import { useRolePermissions } from "../../../redux/hooks/hooks";

// ✅ Importar helpers PDF
import {
  cleanupBlobUrl,
  hasGeneratedPDF,
  canGeneratePDF,
} from "../../../utils/pdfPreview";

// ✅ Importar componentes
import NavBar from "../../layout/NavBar/NavBar";
import QuotePopup from "../../popups/QuotePopup";
import PassengerModal from "../../popups/PassengerModal";

const QuotesList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // ✅ Hook de permisos
  const { hasAnyRole, USER_ROLES } = useRolePermissions();

  // ✅ Selectores de Redux
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const quotes = useSelector(selectQuotes);
  const loading = useSelector(selectQuoteLoading);
  const error = useSelector(selectQuoteError);
  const filters = useSelector(selectQuoteFilters);
  const pagination = useSelector(selectQuotePagination);
  const stats = useSelector(selectQuoteStats);

  // ✅ NUEVOS SELECTORES PDF
  const pdfOperations = useSelector(selectPDFOperations);
  const pdfLoading = useSelector(selectPDFLoading);
  const pdfError = useSelector(selectPDFError);
  const lastPreviewUrl = useSelector(selectLastPreviewUrl);

  // ✅ Estados locales
  const [showCreateQuote, setShowCreateQuote] = useState(false);
  const [selectedQuotes, setSelectedQuotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  // ✅ NUEVO: Estado para modal de vista previa PDF
  const [pdfPreviewModal, setPdfPreviewModal] = useState({
    isOpen: false,
    pdfUrl: null,
    filename: null,
  });

  const [passengerModal, setPassengerModal] = useState({
    isOpen: false,
    quote: null,
  });

  // ✅ NUEVA FUNCIÓN: Filtrar cotizaciones según jerarquía
  const getFilteredQuotesByHierarchy = useMemo(() => {
    if (!user || !quotes.length) return [];

    const userRole = user.role;
    const userId = user.id;

    console.log("🔍 Filtrando cotizaciones para usuario:", {
      id: userId,
      role: userRole,
      name: `${user.name} ${user.lastname}`,
      liderId: user.lider_id,
      gerenteId: user.gerente_id,
    });

    switch (userRole) {
      case 7: // Owner
      case 5: // Admin
      case 6: // Contador
        console.log(
          "👑 Usuario con permisos totales - mostrando todas las cotizaciones"
        );
        return quotes;

      case 4: {
        // Gerente
        const gerenteQuotes = quotes.filter((quote) => {
          if (quote.gerente_id === userId) return true;
          if (quote.admin_id === userId) return true;
          return false;
        });

        console.log("👨‍💼 Gerente - cotizaciones filtradas:", {
          total: quotes.length,
          filtered: gerenteQuotes.length,
          criteria: `gerente_id === ${userId} OR admin_id === ${userId}`,
        });

        return gerenteQuotes;
      }
      case 3: {
        // Líder
        const liderQuotes = quotes.filter((quote) => {
          if (quote.lider_id === userId) return true;
          if (quote.admin_id === userId) return true;
          return false;
        });

        console.log("👨‍🏫 Líder - cotizaciones filtradas:", {
          total: quotes.length,
          filtered: liderQuotes.length,
          criteria: `lider_id === ${userId} OR admin_id === ${userId}`,
        });

        return liderQuotes;
      }
      case 2: {
        // Asesor
        const asesorQuotes = quotes.filter((quote) => {
          if (quote.asesor_id === userId) return true;
          if (quote.admin_id === userId) return true;
          return false;
        });

        console.log("👨‍💼 Asesor - cotizaciones filtradas:", {
          total: quotes.length,
          filtered: asesorQuotes.length,
          criteria: `asesor_id === ${userId} OR admin_id === ${userId}`,
        });

        return asesorQuotes;
      }

      case 1: // Cliente
        console.log("🚫 Cliente - sin acceso a cotizaciones");
        return [];

      default:
        console.log("❓ Rol desconocido - sin acceso");
        return [];
    }
  }, [quotes, user]);

  // ✅ NUEVA FUNCIÓN: Verificar permisos de edición
  const canEditQuote = (quote) => {
    if (!user) return false;

    // Solo Owner y Admin pueden editar TODAS las cotizaciones
    if (hasAnyRole([USER_ROLES.OWNER, USER_ROLES.ADMIN])) {
      return true;
    }

    // Los demás roles NO pueden editar (según tu requerimiento)
    return false;
  };

  // ✅ NUEVA FUNCIÓN: Verificar permisos para acciones específicas
  const canPerformAction = (action, quote) => {
    if (!user) return false;

    switch (action) {
      case "edit":
        return canEditQuote(quote);

      case "send":
        // Líderes y superiores pueden enviar
        return (
          hasAnyRole([
            USER_ROLES.LIDER,
            USER_ROLES.GERENTE,
            USER_ROLES.ADMIN,
            USER_ROLES.OWNER,
          ]) && quote.status === QUOTE_STATUSES.COMPLETED
        );

      case "approve":
      case "reject":
        // Gerentes y superiores pueden aprobar/rechazar
        return (
          hasAnyRole([
            USER_ROLES.GERENTE,
            USER_ROLES.ADMIN,
            USER_ROLES.OWNER,
          ]) && quote.status === QUOTE_STATUSES.SENT
        );

      case "convert":
        // Gerentes y superiores pueden convertir a contrato
        return (
          hasAnyRole([
            USER_ROLES.GERENTE,
            USER_ROLES.ADMIN,
            USER_ROLES.OWNER,
          ]) && quote.status === QUOTE_STATUSES.APPROVED
        );

      case "delete":
        // Solo Owner puede eliminar
        return (
          hasAnyRole([USER_ROLES.OWNER]) &&
          quote.status === QUOTE_STATUSES.PENDING
        );

      case "view":
        // Todos los roles pueden ver y duplicar sus cotizaciones asignadas
        return true;

      // ✅ NUEVOS CASOS PARA PDF
      case "pdf_preview":
        // Todos pueden ver vista previa si la cotización tiene precio
        return canGeneratePDF(quote);

      case "pdf_download":
        // Todos pueden descargar si ya se generó PDF
        return hasGeneratedPDF(quote);

      case "pdf_regenerate":
        // Líderes y superiores pueden regenerar PDF
        return (
          hasAnyRole([
            USER_ROLES.LIDER,
            USER_ROLES.GERENTE,
            USER_ROLES.ADMIN,
            USER_ROLES.OWNER,
          ]) && canGeneratePDF(quote)
        );

      default:
        return false;
    }
  };

  // ✅ Cargar cotizaciones al montar
  useEffect(() => {
    if (isAuthenticated && user) {
      dispatch(
        fetchQuotes({
          page: pagination.page,
          limit: pagination.limit,
          filters: {
            ...filters,
          },
        })
      );
    }
  }, [
    dispatch,
    isAuthenticated,
    user,
    pagination.page,
    pagination.limit,
    filters,
  ]);

  // ✅ Limpiar errores
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearQuoteError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  // ✅ NUEVO: Limpiar errores PDF
  useEffect(() => {
    if (pdfError) {
      const timer = setTimeout(() => {
        dispatch(clearPDFError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [pdfError, dispatch]);

  // ✅ NUEVO: Limpiar URL de vista previa al desmontar
  useEffect(() => {
    return () => {
      if (lastPreviewUrl) {
        dispatch(clearLastPreviewUrl());
      }
      // Limpiar URL del modal si existe
      if (pdfPreviewModal.pdfUrl) {
        cleanupBlobUrl(pdfPreviewModal.pdfUrl);
      }
    };
  }, [lastPreviewUrl, pdfPreviewModal.pdfUrl, dispatch]);

  // ✅ Cotizaciones filtradas por jerarquía Y búsqueda
  const filteredQuotes = useMemo(() => {
    const hierarchyFilteredQuotes = getFilteredQuotesByHierarchy;

    if (!searchTerm.trim()) return hierarchyFilteredQuotes;

    return hierarchyFilteredQuotes.filter(
      (quote) =>
        quote.nombre_cliente
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        quote.email_cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.destino?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.id?.toString().includes(searchTerm) ||
        quote.quote_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.Asesor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.Asesor?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [getFilteredQuotesByHierarchy, searchTerm]);

  // ✅ Función para obtener el color del estado
  const getStatusColor = (status) => {
    const statusColors = {
      [QUOTE_STATUSES.PENDING]: "bg-yellow-100 text-yellow-800",
      [QUOTE_STATUSES.COMPLETED]: "bg-blue-100 text-blue-800",
      [QUOTE_STATUSES.SENT]: "bg-indigo-100 text-indigo-800",
      [QUOTE_STATUSES.APPROVED]: "bg-green-100 text-green-800",
      [QUOTE_STATUSES.REJECTED]: "bg-red-100 text-red-800",
      [QUOTE_STATUSES.REQUOTE]: "bg-orange-100 text-orange-800",
      [QUOTE_STATUSES.EXPIRED]: "bg-gray-100 text-gray-800",
      [QUOTE_STATUSES.CONVERTED]: "bg-purple-100 text-purple-800",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  // ✅ Función para obtener el texto del estado
  const getStatusText = (status) => {
    const statusTexts = {
      [QUOTE_STATUSES.PENDING]: "Pendiente",
      [QUOTE_STATUSES.COMPLETED]: "Completada",
      [QUOTE_STATUSES.SENT]: "Enviada",
      [QUOTE_STATUSES.APPROVED]: "Aprobada",
      [QUOTE_STATUSES.REJECTED]: "Rechazada",
      [QUOTE_STATUSES.REQUOTE]: "Re-cotización",
      [QUOTE_STATUSES.EXPIRED]: "Expirada",
      [QUOTE_STATUSES.CONVERTED]: "Convertida",
    };
    return statusTexts[status] || "Desconocido";
  };

  const handleMarkExpiredQuotes = async () => {
    await dispatch(markExpiredQuotes());
    // Opcional: recargar la lista de cotizaciones
    dispatch(fetchQuotes({ page: 1, limit: 10 }));
  };

  // ✅ ACTUALIZAR: Función de vista previa PDF con modal
  const handlePDFPreview = async (quoteId) => {
    try {
      setActionLoading((prev) => ({
        ...prev,
        [`pdf_preview_${quoteId}`]: true,
      }));

      console.log("🔍 Iniciando vista previa PDF para cotización:", quoteId);

      const result = await dispatch(previewQuotePDF(quoteId)).unwrap();

      console.log("✅ Vista previa PDF - Resultado:", {
        quoteId: result.quoteId,
        filename: result.filename,
        blobSize: result.blobSize,
        hasUrl: !!result.pdfUrl,
      });

      if (!result.pdfUrl) {
        throw new Error("No se pudo generar la URL del PDF");
      }

      // ✅ Abrir en modal en lugar de nueva ventana
      setPdfPreviewModal({
        isOpen: true,
        pdfUrl: result.pdfUrl,
        filename: result.filename,
      });

      console.log("✅ Vista previa PDF abierta en modal");
    } catch (error) {
      console.error("❌ Error en vista previa PDF:", error);

      // ✅ Mensaje de error más descriptivo
      let errorMessage = "Error al generar vista previa del PDF";

      if (typeof error === "string") {
        errorMessage = error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(`${errorMessage}\n\nDetalles: ${error}`);
    } finally {
      setActionLoading((prev) => ({
        ...prev,
        [`pdf_preview_${quoteId}`]: false,
      }));
    }
  };

  // ✅ Función para cerrar modal de PDF
  const closePDFModal = () => {
    // Limpiar URL del blob si existe
    if (pdfPreviewModal.pdfUrl) {
      cleanupBlobUrl(pdfPreviewModal.pdfUrl);
    }

    setPdfPreviewModal({
      isOpen: false,
      pdfUrl: null,
      filename: null,
    });
  };

  const handlePassengersClick = async (quote) => {
    try {
      setActionLoading((prev) => ({
        ...prev,
        [`passengers_${quote.id}`]: true,
      }));

      // Cargar datos completos de la cotización incluyendo pasajeros
      const fullQuote = await dispatch(fetchQuoteById(quote.id)).unwrap();

      setPassengerModal({
        isOpen: true,
        quote: fullQuote,
      });
    } catch (error) {
      console.error("Error cargando datos de la cotización:", error);
      alert("Error cargando datos de la cotización");
    } finally {
      setActionLoading((prev) => ({
        ...prev,
        [`passengers_${quote.id}`]: false,
      }));
    }
  };

  // ✅ AGREGAR: Función para cerrar modal de pasajeros
  const closePassengerModal = () => {
    setPassengerModal({
      isOpen: false,
      quote: null,
    });
  };

  const handlePDFDownload = async (quoteId) => {
    try {
      setActionLoading((prev) => ({
        ...prev,
        [`pdf_download_${quoteId}`]: true,
      }));

      console.log("🔍 Iniciando descarga PDF para cotización:", quoteId);

      await dispatch(downloadQuotePDF(quoteId)).unwrap();

      console.log("✅ Descarga PDF completada exitosamente");
    } catch (error) {
      console.error("❌ Error en descarga PDF:", error);
      alert(`Error al descargar PDF: ${error.message || error}`);
    } finally {
      setActionLoading((prev) => ({
        ...prev,
        [`pdf_download_${quoteId}`]: false,
      }));
    }
  };

  const handlePDFRegenerate = async (quoteId) => {
    try {
      if (
        !window.confirm(
          "¿Estás seguro de regenerar el PDF? Esto sobrescribirá el archivo actual."
        )
      ) {
        return;
      }

      setActionLoading((prev) => ({
        ...prev,
        [`pdf_regenerate_${quoteId}`]: true,
      }));

      console.log("🔍 Regenerando PDF para cotización:", quoteId);

      await dispatch(regenerateQuotePDF(quoteId)).unwrap();

      alert("PDF regenerado exitosamente");
      console.log("✅ PDF regenerado exitosamente");
    } catch (error) {
      console.error("❌ Error regenerando PDF:", error);
      alert(`Error al regenerar PDF: ${error.message || error}`);
    } finally {
      setActionLoading((prev) => ({
        ...prev,
        [`pdf_regenerate_${quoteId}`]: false,
      }));
    }
  };

  // ✅ ACTUALIZAR: Manejo de acciones con validación de permisos
  const handleAction = async (action, quoteId, data = {}) => {
    const quote = quotes.find((q) => q.id === quoteId);

    if (!quote) {
      alert("Cotización no encontrada");
      return;
    }

    if (!canPerformAction(action, quote)) {
      alert("No tienes permisos para realizar esta acción");
      return;
    }

    // ✅ MANEJAR ACCIONES PDF DIRECTAMENTE
    if (action === "pdf_preview") {
      return handlePDFPreview(quoteId);
    }
    if (action === "pdf_download") {
      return handlePDFDownload(quoteId);
    }
    if (action === "pdf_regenerate") {
      return handlePDFRegenerate(quoteId);
    }

    setActionLoading((prev) => ({ ...prev, [quoteId]: true }));

    try {
      switch (action) {
        case "send":
          await dispatch(sendQuoteToClient(quoteId)).unwrap();
          alert(
            "✅ Cotización enviada exitosamente al cliente con PDF adjunto!"
          );
          break;
        case "approve":
          await dispatch(
            approveQuote({ quoteId, approvalData: data })
          ).unwrap();
          break;
        case "reject":
          await dispatch(
            rejectQuote({ quoteId, reason: data.reason })
          ).unwrap();
          break;
        case "requote":
          await dispatch(
            requestRequote({ quoteId, requote_reason: data.reason })
          ).unwrap();
          break;
        case "convert":
          await handleConvertToContract(quoteId, data);
          break;

        default:
          break;
      }
    } catch (error) {
      console.error(`Error en acción ${action}:`, error);
      alert(`Error: ${error.message || error}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [quoteId]: false }));
    }
  };

  // ✅ Funciones auxiliares para acciones no implementadas
  const handleConvertToContract = async (quoteId) => {
    await dispatch(
      updateQuote({
        id: quoteId,
        updates: {
          status: QUOTE_STATUSES.CONVERTED,
          converted_at: new Date().toISOString(),
        },
      })
    ).unwrap();
    alert("Cotización marcada como convertida a contrato");
  };

  // const handleDeleteQuote = async (quoteId) => {
  //   alert('Funcionalidad de eliminación en desarrollo');
  // };

  // ✅ Manejo de filtros
  const handleFilterChange = (filterType, value) => {
    dispatch(updateFilters({ [filterType]: value }));
  };

  // ✅ Manejo de paginación
  const handlePageChange = (newPage) => {
    dispatch(setPagination({ page: newPage }));
  };

  // ✅ ACTUALIZAR: Renderizar botones de acción con funcionalidades PDF
  const renderActionButtons = (quote) => {
    const isLoading = actionLoading[quote.id];
    const isPDFPreviewLoading = actionLoading[`pdf_preview_${quote.id}`];
    const isPDFDownloadLoading = actionLoading[`pdf_download_${quote.id}`];
    const isPDFRegenerateLoading = actionLoading[`pdf_regenerate_${quote.id}`];
    const isPassengersLoading = actionLoading[`passengers_${quote.id}`];

    const passengers = quote.Passengers || [];
    const hasPassengers = passengers.length > 0;
    const passengersComplete = passengers.length === quote.numero_personas;

    console.log("stats:", stats);
    return (
      <div className="flex items-center gap-1">
        {/* Ver detalles - Todos pueden ver */}
        {canPerformAction("view", quote) && (
          <button
            onClick={() => navigate(`/quotes/${quote.id}/edit`)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Ver detalles"
          >
            <FontAwesomeIcon icon={faEye} size="sm" />
          </button>
        )}
        {quote.status === QUOTE_STATUSES.SENT && (
          <button
            onClick={() => handlePassengersClick(quote)}
            disabled={isPassengersLoading}
            className={`p-2 rounded transition-colors disabled:opacity-50 ${
              passengersComplete
                ? "text-green-600 hover:bg-green-50"
                : hasPassengers
                ? "text-orange-600 hover:bg-orange-50"
                : "text-gray-400 hover:bg-gray-50"
            }`}
            title={
              passengersComplete
                ? "Pasajeros completos - Click para revisar"
                : hasPassengers
                ? "Pasajeros incompletos - Click para completar"
                : "Sin datos de pasajeros - Click para verificar"
            }
          >
            {isPassengersLoading ? (
              <FontAwesomeIcon icon={faSpinner} spin size="sm" />
            ) : (
              <FontAwesomeIcon icon={faUsers} size="sm" />
            )}
          </button>
        )}

        {/* Editar - Solo Owner y Admin */}
        {canPerformAction("edit", quote) &&
          (quote.status === QUOTE_STATUSES.PENDING ||
            quote.status === QUOTE_STATUSES.APPROVED ||
            quote.status === QUOTE_STATUSES.EXPIRED) && (
            <button
              onClick={() => navigate(`/quotes/${quote.id}/edit`)}
              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
              title="Editar"
            >
              <FontAwesomeIcon icon={faEdit} size="sm" />
            </button>
          )}

        {/* ✅ Vista previa PDF - Todos pueden ver si tiene precio */}
        {canPerformAction("pdf_preview", quote) && (
          <button
            onClick={() => handleAction("pdf_preview", quote.id)}
            disabled={isPDFPreviewLoading || pdfLoading}
            className="p-2 text-purple-600 hover:bg-purple-50 rounded transition-colors disabled:opacity-50"
            title="Vista previa PDF"
          >
            {isPDFPreviewLoading ? (
              <FontAwesomeIcon icon={faSpinner} spin size="sm" />
            ) : (
              <FontAwesomeIcon icon={faExternalLinkAlt} size="sm" />
            )}
          </button>
        )}

        {/* ✅ Descargar PDF - Si ya tiene PDF generado */}
        {canPerformAction("pdf_download", quote) && (
          <button
            onClick={() => handleAction("pdf_download", quote.id)}
            disabled={isPDFDownloadLoading || pdfLoading}
            className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
            title="Descargar PDF"
          >
            {isPDFDownloadLoading ? (
              <FontAwesomeIcon icon={faSpinner} spin size="sm" />
            ) : (
              <FontAwesomeIcon icon={faDownload} size="sm" />
            )}
          </button>
        )}

        {/* ✅ Regenerar PDF - Líderes y superiores */}
        {canPerformAction("pdf_regenerate", quote) &&
          hasGeneratedPDF(quote) && (
            <button
              onClick={() => handleAction("pdf_regenerate", quote.id)}
              disabled={isPDFRegenerateLoading || pdfLoading}
              className="p-2 text-orange-600 hover:bg-orange-50 rounded transition-colors disabled:opacity-50"
              title="Regenerar PDF"
            >
              {isPDFRegenerateLoading ? (
                <FontAwesomeIcon icon={faSpinner} spin size="sm" />
              ) : (
                <FontAwesomeIcon icon={faRedo} size="sm" />
              )}
            </button>
          )}

        {/* ✅ Enviar - Ahora envía con PDF y email automáticamente */}
        {canPerformAction("send", quote) && (
          <button
            onClick={() => handleAction("send", quote.id)}
            disabled={isLoading}
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded transition-colors disabled:opacity-50"
            title="Enviar al cliente (con PDF)"
          >
            {isLoading ? (
              <FontAwesomeIcon icon={faSpinner} spin size="sm" />
            ) : (
              <FontAwesomeIcon icon={faPaperPlane} size="sm" />
            )}
          </button>
        )}

        {/* Aprobar - Gerentes y superiores */}
        {canPerformAction("approve", quote) && (
          <button
            onClick={() => handleAction("approve", quote.id)}
            disabled={isLoading}
            className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
            title="Aprobar"
          >
            <FontAwesomeIcon icon={faCheck} size="sm" />
          </button>
        )}

        {/* Rechazar - Gerentes y superiores */}
        {canPerformAction("reject", quote) && (
          <button
            onClick={() => {
              const reason = window.prompt("Motivo del rechazo:");
              if (reason) handleAction("reject", quote.id, { reason });
            }}
            disabled={isLoading}
            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
            title="Rechazar"
          >
            <FontAwesomeIcon icon={faTimes} size="sm" />
          </button>
        )}

        {/* Convertir a contrato - Gerentes y superiores */}
        {canPerformAction("convert", quote) && (
          <button
           onClick={() => navigate("/contractsList")}
            disabled={isLoading}
            className="p-2 text-purple-600 hover:bg-purple-50 rounded transition-colors disabled:opacity-50"
            title="Convertir a contrato"
          >
            <FontAwesomeIcon icon={faFileContract} size="sm" />
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

  // ✅ Verificar permisos para ver cotizaciones
  if (
    !hasAnyRole([
      USER_ROLES.ASESOR,
      USER_ROLES.LIDER,
      USER_ROLES.GERENTE,
      USER_ROLES.ADMIN,
      USER_ROLES.CONTADOR,
      USER_ROLES.OWNER,
    ])
  ) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="fixed top-0 left-0 z-50 w-full">
          <NavBar />
        </div>
        <div className="flex justify-center items-center h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Sin Permisos
            </h2>
            <p className="text-gray-600 mb-4">
              No tienes permisos para acceder a las cotizaciones.
            </p>
            <button
              onClick={() => navigate("/panel")}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Volver al Panel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="fixed top-0 left-0 z-50 w-full">
        <NavBar />
      </div>

      {/* Header con información de jerarquía */}
      <div className="bg-ColorMorado text-2xl font-bold font-nunito p-4 text-gray-200 mb-8 mt-28 rounded-lg">
        <div className="flex justify-between items-center">
          <div>
            <h2>Gestión de Cotizaciones</h2>
            <p className="text-sm font-normal text-gray-300 mt-1">
              {user.role === 7 && "Vista completa - Owner"}
              {user.role === 5 && "Vista completa - Admin"}
              {user.role === 6 && "Vista completa - Contador"}
              {user.role === 4 && "Vista de Gerente - Tu equipo y subordinados"}
              {user.role === 3 && "Vista de Líder - Tu equipo de asesores"}
              {user.role === 2 && "Vista de Asesor - Tus cotizaciones"}
            </p>
          </div>
          {hasAnyRole([
            USER_ROLES.ASESOR,
            USER_ROLES.LIDER,
            USER_ROLES.GERENTE,
            USER_ROLES.ADMIN,
            USER_ROLES.OWNER,
          ]) && (
           <>
        <button
          onClick={() => setShowCreateQuote(true)}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-base font-medium"
        >
          <FontAwesomeIcon icon={faPlus} />
          Nueva Cotización
        </button>
        <button
          onClick={() => navigate("/contractsList")}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-base font-medium"
        >
          <FontAwesomeIcon icon={faFileContract} />
          Ir a Contratos
        </button>
      </>
            
          )}
        </div>
      </div>

      {/* ✅ Mensaje de error PDF */}
      {pdfError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faFilePdf} className="mr-2" />
            <span>Error PDF: {pdfError}</span>
          </div>
        </div>
      )}

      {/* Estadísticas con información de filtrado */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-500 text-white p-4 rounded-lg">
          <h3 className="text-lg font-semibold">Visible para ti</h3>
          <p className="text-2xl font-bold">
            {getFilteredQuotesByHierarchy.length}
          </p>
          <p className="text-sm opacity-80">de {quotes.length} totales</p>
        </div>
        <div className="bg-yellow-500 text-white p-4 rounded-lg">
          <h3 className="text-lg font-semibold">Pendientes</h3>
          <p className="text-2xl font-bold">
            {
              getFilteredQuotesByHierarchy.filter(
                (q) => q.status === QUOTE_STATUSES.PENDING
              ).length
            }
          </p>
        </div>
        <div className="bg-green-500 text-white p-4 rounded-lg">
          <h3 className="text-lg font-semibold">Aprobadas</h3>
          <p className="text-2xl font-bold">
            {
              getFilteredQuotesByHierarchy.filter(
                (q) => q.status === QUOTE_STATUSES.APPROVED
              ).length
            }
          </p>
        </div>
        <div className="bg-red-500 text-white p-4 rounded-lg">
          <h3 className="text-lg font-semibold">Rechazadas</h3>
          <p className="text-2xl font-bold">
            {
              getFilteredQuotesByHierarchy.filter(
                (q) => q.status === QUOTE_STATUSES.REJECTED
              ).length
            }
          </p>
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
            value={filters.status || "all"}
            onChange={(e) =>
              handleFilterChange(
                "status",
                e.target.value === "all" ? "" : e.target.value
              )
            }
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
                ? "bg-blue-500 text-white border-blue-500"
                : "border-gray-300 hover:bg-gray-50"
            }`}
          >
            <FontAwesomeIcon icon={faFilter} className="mr-2" />
            Filtros
          </button>

          {/* Limpiar filtros */}
          <button
            onClick={() => {
              dispatch(clearFilters());
              setSearchTerm("");
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
                  value={filters.startDate || ""}
                  onChange={(e) =>
                    handleFilterChange("startDate", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha hasta
                </label>
                <input
                  type="date"
                  value={filters.endDate || ""}
                  onChange={(e) =>
                    handleFilterChange("endDate", e.target.value)
                  }
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
                  value={filters.destino || ""}
                  onChange={(e) =>
                    handleFilterChange("destino", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mensaje de error general */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {stats && stats.expiredCount > 0 && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 flex items-center justify-between">
          <div>
            <strong>¡Atención!</strong> Hay <b>{stats.expiredCount}</b>{" "}
            cotizaciones enviadas que superaron las 48hs y deben ser marcadas
            como <b>expiradas</b>.
          </div>
          {/* Botón para refrescar o marcar como expiradas si tienes esa función */}
          <button
            onClick={handleMarkExpiredQuotes}
            className="ml-4 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
          >
            Marcar como expiradas
          </button>
        </div>
      )}

      {/* ✅ Tabla de cotizaciones con columna de PDF */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                
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
                {/* ✅ Columna para PDF */}
                
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
                  <td colSpan="9" className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2">Cargando cotizaciones...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredQuotes.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    {searchTerm
                      ? "No se encontraron cotizaciones que coincidan con la búsqueda"
                      : "No hay cotizaciones disponibles para tu rol"}
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((quote) => {
                  const isExpiredButSent =
                    Array.isArray(stats?.expiredQuotes) &&
                    stats.expiredQuotes.some((q) => q.id === quote.id);
                  return (
                    <tr
                      key={quote.id}
                      className={`hover:bg-gray-50 ${
                        isExpiredButSent
                          ? "bg-yellow-50 border-l-4 border-yellow-500"
                          : ""
                      }`}
                    >
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {quote.nombre_cliente || "Sin nombre"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {quote.email_cliente || "Sin email"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-medium">{quote.destino}</div>
                        <div className="text-gray-500 text-xs">
                          desde {quote.origen}
                        </div>
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
                      {/* ✅ Columna PDF */}
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            quote.status
                          )}`}
                        >
                          {getStatusText(quote.status)}
                        </span>
                        {isExpiredButSent && (
                          <span className="ml-2 px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs font-semibold">
                            Expirada (48hs)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {/* ✅ Usar Luxon para formatear fecha manteniendo zona horaria de Colombia */}
                        {formatDateDisplay(quote.created_at || quote.fecha_creacion)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {renderActionButtons(quote)}
                      </td>
                    </tr>
                  );
                })
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
                  Mostrando{" "}
                  <span className="font-medium">
                    {(pagination.page - 1) * pagination.limit + 1}
                  </span>{" "}
                  a{" "}
                  <span className="font-medium">
                    {Math.min(
                      pagination.page * pagination.limit,
                      filteredQuotes.length
                    )}
                  </span>{" "}
                  de{" "}
                  <span className="font-medium">{filteredQuotes.length}</span>{" "}
                  resultados
                </p>
              </div>
              <div>
                <nav
                  className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>

                  {/* Números de página */}
                  {Array.from(
                    { length: Math.min(5, pagination.totalPages) },
                    (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === pagination.page
                              ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    }
                  )}

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

      {/* ✅ NUEVO: Modal de vista previa PDF */}
      {pdfPreviewModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-4xl max-h-[90vh] w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Vista Previa PDF - {pdfPreviewModal.filename}
              </h3>
              <button
                onClick={closePDFModal}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                title="Cerrar"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="h-[70vh]">
              <iframe
                src={pdfPreviewModal.pdfUrl}
                className="w-full h-full border rounded"
                title="Vista previa PDF"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={closePDFModal}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Cerrar
              </button>
              <a
                href={pdfPreviewModal.pdfUrl}
                download={pdfPreviewModal.filename}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Descargar
              </a>
            </div>
          </div>
        </div>
      )}

      {passengerModal.isOpen && (
        <PassengerModal
          isOpen={passengerModal.isOpen}
          onClose={closePassengerModal}
          quote={passengerModal.quote}
        />
      )}

      {/* Modal para crear nueva cotización */}
      {showCreateQuote && (
        <QuotePopup
          isOpen={showCreateQuote}
          onClose={() => setShowCreateQuote(false)}
          onSuccess={() => {
            setShowCreateQuote(false);
            dispatch(
              fetchQuotes({
                page: pagination.page,
                limit: pagination.limit,
                filters,
              })
            );
          }}
        />
      )}

      {/* Modal para crear nueva cotización */}
      {showCreateQuote && (
        <QuotePopup
          isOpen={showCreateQuote}
          onClose={() => setShowCreateQuote(false)}
          onSuccess={() => {
            setShowCreateQuote(false);
            dispatch(
              fetchQuotes({
                page: pagination.page,
                limit: pagination.limit,
                filters,
              })
            );
          }}
        />
      )}
    </div>
  );
};

export default QuotesList;
