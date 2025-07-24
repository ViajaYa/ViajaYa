import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSave,
  faArrowLeft,
  faPaperPlane,
  faCalendarAlt,
  faMapMarkerAlt,
  faUsers,
  faFileContract,
  faChild,
  faBed,
  faHotel,
  faCar,
  faUtensils,
  faDollarSign,
  faStickyNote,
  faSpinner,
  faExclamationTriangle,
  faShieldAlt,
  faEye,
  faDownload,
  faSync,
  faFilePdf,
  faCheck,
  faTimes
} from "@fortawesome/free-solid-svg-icons";

// ✅ Importar acciones del slice
import {
  fetchQuoteById,
  updateQuote,
  sendQuoteToClient,
  previewQuotePDF,
  downloadQuotePDF,
  regenerateQuotePDF,
  clearQuoteError,
  clearPDFError,
  clearLastPreviewUrl,
  QUOTE_STATUSES,
  selectCurrentQuote,
  selectQuoteLoading,
  selectQuoteError,
  selectPDFOperations,
  selectPDFLoading,
  selectPDFError,
  selectLastPreviewUrl,
  selectPDFRegenerating,
} from "../../../redux/slices/quoteSlice";

import { createContract } from "../../../redux/slices/contractSlice";

import { updateUser } from "../../../redux/slices/userSlice";

// ✅ Importar selectores de auth y permisos
import { selectUser } from "../../../redux/slices/authSlice";
import { useRolePermissions } from "../../../redux/hooks/hooks";

// ✅ Importar componentes
import NavBar from "../../layout/NavBar/NavBar";
import {
  openPDFPreview,
  canGeneratePDF,
  hasGeneratedPDF,
} from "../../../utils/pdfPreview";

const QuoteEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // ✅ TODOS LOS HOOKS PRIMERO - Sin condiciones
  const currentQuote = useSelector(selectCurrentQuote);
  const loading = useSelector(selectQuoteLoading);
  const error = useSelector(selectQuoteError);
  const user = useSelector(selectUser);

  // ✅ Nuevos selectores para PDF
  const pdfOperations = useSelector(selectPDFOperations);
  const pdfLoading = useSelector(selectPDFLoading);
  const pdfError = useSelector(selectPDFError);
  const lastPreviewUrl = useSelector(selectLastPreviewUrl);
  const pdfRegenerating = useSelector(selectPDFRegenerating);

  // ✅ Hook de permisos - CORREGIDO
  const {
    hasAnyRole = () => false,
    USER_ROLES = {},
    canManageQuotes = false,
  } = useRolePermissions() || {};

  // ✅ Estados del formulario
  const [formData, setFormData] = useState({
    numero_personas: "",
    fecha_ida: "",
    fecha_regreso: "",
    destino: "",
    origen: "",
    acomodacion: "Doble",
    tipo_hotel: "3 Estrellas",
    traslado: false,
    alimentacion: "",
    ninos: 0,
    edades_ninos: [],
    observaciones: "",
    precio_total: "",
  });

  const [saveLoading, setSaveLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [showContractModal, setShowContractModal] = useState(false);
  const [contractData, setContractData] = useState({
    numero_personas: "",
    forma_pago: "contado",
    numero_cuotas: 1,
    fecha_inicio_viaje: "",
    fecha_fin_viaje: "",
    tiene_cuota_inicial: false,
    cuota_inicial_porcentaje: 30,
    fecha_vencimiento_inicial: "",
    fechas_vencimiento_cuotas: [],

    // Datos del cliente para el contrato
    cliente_documento: "",
    cliente_tipo_documento: "cc",
    cliente_fecha_nacimiento: "",
    cliente_direccion: "",
    cliente_ciudad: "",
    cliente_pais: "Colombia",
  });
  const [contractLoading, setContractLoading] = useState(false);

  // ✅ Opciones para selects
  const acomodacionOptions = [
    "Simple",
    "Doble",
    "Triple",
    "Cuádruple",
    "Familiar",
  ];
  const tipoHotelOptions = [
    "1 Estrella",
    "2 Estrellas",
    "3 Estrellas",
    "4 Estrellas",
    "5 Estrellas",
    "Boutique",
    "Resort",
  ];

  // ✅ TODAS LAS FUNCIONES DESPUÉS DE LOS HOOKS
  const canEditQuote = () => {
    if (!user || !currentQuote || typeof hasAnyRole !== "function")
      return false;

    // Owner puede editar todas
    if (hasAnyRole([USER_ROLES.OWNER])) return true;

    // Admin/Contador pueden editar todas
    if (hasAnyRole([USER_ROLES.ADMIN, USER_ROLES.CONTADOR])) return true;

    // Gerente puede editar las suyas y de su equipo
    if (hasAnyRole([USER_ROLES.GERENTE]) && currentQuote.gerente_id === user.id)
      return true;

    // Líder puede editar las suyas y de su equipo
    if (hasAnyRole([USER_ROLES.LIDER]) && currentQuote.lider_id === user.id)
      return true;

    // Asesor puede editar solo las suyas
    if (hasAnyRole([USER_ROLES.ASESOR]) && currentQuote.asesor_id === user.id)
      return true;

    return false;
  };

  const canSendQuote = () => {
    if (!user || !currentQuote || typeof hasAnyRole !== "function")
      return false;

    // Solo Líder y superiores pueden enviar
    return hasAnyRole([
      USER_ROLES.LIDER,
      USER_ROLES.GERENTE,
      USER_ROLES.ADMIN,
      USER_ROLES.CONTADOR,
      USER_ROLES.OWNER,
    ]);
  };

  const canConvertToContract = () => {
    if (!user || !currentQuote || typeof hasAnyRole !== "function")
      return false;
    return (
      currentQuote.status === QUOTE_STATUSES.APPROVED &&
      hasAnyRole([
        USER_ROLES.GERENTE,
        USER_ROLES.ADMIN,
        USER_ROLES.ASESOR,
        USER_ROLES.OWNER,
      ])
    );
  };

  const handlePreviewPDF = async () => {
    if (!canGeneratePDF(currentQuote)) {
      alert("La cotización debe tener un precio total para generar el PDF");
      return;
    }

    try {
      const result = await dispatch(previewQuotePDF(id)).unwrap();
      openPDFPreview(result.pdfUrl, result.filename);
    } catch (error) {
      console.error("Error generando vista previa:", error);
      alert("Error al generar vista previa del PDF: " + error);
    }
  };

  const handleDownloadPDF = async () => {
    if (!hasGeneratedPDF(currentQuote)) {
      alert("No hay PDF generado para esta cotización");
      return;
    }

    try {
      await dispatch(downloadQuotePDF(id)).unwrap();
    } catch (error) {
      console.error("Error descargando PDF:", error);
      alert("Error al descargar el PDF: " + error);
    }
  };

  const handleRegeneratePDF = async () => {
    if (!canGeneratePDF(currentQuote)) {
      alert("La cotización debe tener un precio total para regenerar el PDF");
      return;
    }

    if (
      window.confirm(
        "¿Estás seguro de regenerar el PDF? Esto sobrescribirá el archivo actual."
      )
    ) {
      try {
        await dispatch(regenerateQuotePDF(id)).unwrap();
        alert("PDF regenerado exitosamente");
      } catch (error) {
        console.error("Error regenerando PDF:", error);
        alert("Error al regenerar el PDF: " + error);
      }
    }
  };

  const handleOpenContractModal = () => {
    // Pre-llenar datos desde la cotización
    const fechaInicio = currentQuote.fecha_ida
      ? new Date(currentQuote.fecha_ida)
      : new Date();
    const fechaFin = currentQuote.fecha_regreso
      ? new Date(currentQuote.fecha_regreso)
      : new Date();

    setContractData({
      numero_personas: "",
      forma_pago: "contado",
      numero_cuotas: 1,
      fecha_inicio_viaje: fechaInicio.toISOString().split("T")[0],
      fecha_fin_viaje: fechaFin.toISOString().split("T")[0],
      tiene_cuota_inicial: false,
      cuota_inicial_porcentaje: 30,
      fecha_vencimiento_inicial: "",
      fechas_vencimiento_cuotas: [],

      // Pre-llenar datos del cliente si existen
      cliente_documento: currentQuote.Cliente?.documento_identidad || "",
      cliente_tipo_documento: currentQuote.Cliente?.tipo_documento || "cc",
      cliente_fecha_nacimiento: currentQuote.Cliente?.fecha_nacimiento
        ? new Date(currentQuote.Cliente.fecha_nacimiento)
            .toISOString()
            .split("T")[0]
        : "",
      cliente_direccion: currentQuote.Cliente?.direccion || "",
      cliente_ciudad: currentQuote.Cliente?.ciudad || "",
      cliente_pais: currentQuote.Cliente?.pais || "Colombia",
    });

    setShowContractModal(true);
  };

  const handleContractInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setContractData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const generateCuotasDates = (numCuotas, startDate) => {
    const dates = [];
    const start = new Date(startDate);

    for (let i = 1; i <= numCuotas; i++) {
      const date = new Date(start);
      date.setMonth(date.getMonth() + i);
      dates.push(date.toISOString().split("T")[0]);
    }

    return dates;
  };

  const handleCreateContract = async () => {
    if (!contractData.fecha_inicio_viaje || !contractData.fecha_fin_viaje) {
      alert("Por favor completa las fechas del viaje");
      return;
    }

    if (
      contractData.forma_pago === "cuotas" &&
      contractData.numero_cuotas < 2
    ) {
      alert("Para forma de pago en cuotas, debe tener al menos 2 cuotas");
      return;
    }

    if (
      !contractData.cliente_documento ||
      !contractData.cliente_fecha_nacimiento
    ) {
      alert(
        "Por favor completa el documento y fecha de nacimiento del cliente"
      );
      return;
    }

    setContractLoading(true);

    try {
      // ✅ PASO 1: Actualizar datos del cliente si existe
      if (currentQuote.Cliente?.id) {
        await dispatch(
          updateUser({
            id: currentQuote.Cliente.id,
            updates: {
              documento_identidad: contractData.cliente_documento,
              tipo_documento: contractData.cliente_tipo_documento,
              fecha_nacimiento: contractData.cliente_fecha_nacimiento,
              direccion: contractData.cliente_direccion,
              ciudad: contractData.cliente_ciudad,
              pais: contractData.cliente_pais,
            },
          })
        ).unwrap();

        console.log("✅ Datos del cliente actualizados");
      }

      // ✅ PASO 2: Calcular fechas de vencimiento automáticamente
      let fechasVencimiento = [];
      if (contractData.forma_pago === "cuotas") {
        fechasVencimiento = generateCuotasDates(
          parseInt(contractData.numero_cuotas),
          contractData.fecha_inicio_viaje
        );
      }

      // ✅ PASO 3: Crear contrato con todos los datos
      const contractPayload = {
        quote_id: currentQuote.id,
        cliente_id: currentQuote.Cliente?.id,
        forma_pago: contractData.forma_pago,
        numero_cuotas:
          contractData.forma_pago === "cuotas"
            ? parseInt(contractData.numero_cuotas)
            : 1,
        fecha_inicio_viaje: contractData.fecha_inicio_viaje,
        fecha_fin_viaje: contractData.fecha_fin_viaje,
        fecha_vencimiento_cuotas: fechasVencimiento,

        // Datos de cuota inicial si aplica
        ...(contractData.tiene_cuota_inicial && {
          tiene_cuota_inicial: true,
          cuota_inicial_porcentaje: parseFloat(
            contractData.cuota_inicial_porcentaje
          ),
          fecha_vencimiento_inicial: contractData.fecha_vencimiento_inicial,
        }),
      };

      console.log("🔍 Creando contrato con datos:", contractPayload);

      await dispatch(createContract(contractPayload)).unwrap();

      // ✅ PASO 4: Actualizar estado de la cotización a convertida
      await dispatch(
        updateQuote({
          id: currentQuote.id,
          updates: {
            status: QUOTE_STATUSES.APPROVED,
            converted_at: new Date().toISOString(),
          },
        })
      ).unwrap();

      alert("✅ Contrato creado exitosamente!");
      setShowContractModal(false);

      // Opcional: navegar a la lista de contratos
      navigate("/panel/contracts");
    } catch (error) {
      console.error("❌ Error creando contrato:", error);
      alert(`Error al crear el contrato: ${error.message || error}`);
    } finally {
      setContractLoading(false);
    }
  };

  // ✅ TODOS LOS useEffect DESPUÉS DE LAS FUNCIONES
  useEffect(() => {
    if (id) {
      dispatch(fetchQuoteById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (currentQuote) {
      setFormData({
        numero_personas: currentQuote.numero_personas || 1,
        fecha_ida: currentQuote.fecha_ida
          ? new Date(currentQuote.fecha_ida).toISOString().split("T")[0]
          : "",
        fecha_regreso: currentQuote.fecha_regreso
          ? new Date(currentQuote.fecha_regreso).toISOString().split("T")[0]
          : "",
        destino: currentQuote.destino || "",
        origen: currentQuote.origen || "",
        acomodacion: currentQuote.acomodacion || "Doble",
        tipo_hotel: currentQuote.tipo_hotel || "3 Estrellas",
        traslado: currentQuote.traslado || false,
        alimentacion: currentQuote.alimentacion || "",
        ninos: currentQuote.ninos || 0,
        edades_ninos: currentQuote.edades_ninos || [],
        observaciones: currentQuote.observaciones || "",
        precio_total: currentQuote.precio_total || "",
      });
    }
  }, [currentQuote]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearQuoteError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (pdfError) {
      const timer = setTimeout(() => {
        dispatch(clearPDFError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [pdfError, dispatch]);

  useEffect(() => {
    const numNinos = formData.edades_ninos.length;
    if (numNinos !== formData.ninos) {
      setFormData((prev) => ({ ...prev, ninos: numNinos }));
    }
  }, [formData.edades_ninos, formData.ninos]);

  useEffect(() => {
    return () => {
      if (lastPreviewUrl) {
        dispatch(clearLastPreviewUrl());
      }
    };
  }, [dispatch, lastPreviewUrl]);

  // ✅ FUNCIONES DE MANEJO DESPUÉS DE TODOS LOS HOOKS
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleEdadNinoChange = (index, edad) => {
    const newEdades = [...formData.edades_ninos];
    newEdades[index] = parseInt(edad);
    setFormData((prev) => ({ ...prev, edades_ninos: newEdades }));
  };

  const addEdadNino = () => {
    setFormData((prev) => ({
      ...prev,
      edades_ninos: [...prev.edades_ninos, 0],
    }));
  };

  const removeEdadNino = (index) => {
    const newEdades = formData.edades_ninos.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, edades_ninos: newEdades }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.destino.trim()) {
      newErrors.destino = "El destino es requerido";
    }
    if (!formData.origen.trim()) {
      newErrors.origen = "El origen es requerido";
    }
    if (!formData.fecha_ida) {
      newErrors.fecha_ida = "La fecha de ida es requerida";
    }
    if (!formData.fecha_regreso) {
      newErrors.fecha_regreso = "La fecha de regreso es requerida";
    }
    if (
      formData.fecha_ida &&
      formData.fecha_regreso &&
      new Date(formData.fecha_ida) >= new Date(formData.fecha_regreso)
    ) {
      newErrors.fecha_regreso =
        "La fecha de regreso debe ser posterior a la fecha de ida";
    }
    if (formData.numero_personas < 1) {
      newErrors.numero_personas = "Debe ser al menos 1 persona";
    }
    if (
      canSendQuote() &&
      (!formData.precio_total || formData.precio_total <= 0)
    ) {
      newErrors.precio_total =
        "El precio total es requerido y debe ser mayor a 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaveLoading(true);
    try {
      const updateData = {
        ...formData,
        precio_total: formData.precio_total
          ? parseFloat(formData.precio_total)
          : null,
        numero_personas: parseInt(formData.numero_personas),
        ninos: parseInt(formData.ninos),
        status:
          formData.precio_total && formData.precio_total > 0
            ? "completed"
            : "pending",
      };

      await dispatch(updateQuote({ id, updates: updateData })).unwrap();

      alert("Cotización guardada exitosamente");
    } catch (error) {
      console.error("Error guardando cotización:", error);
      alert("Error al guardar la cotización: " + error);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSendToClient = async () => {
    if (!canSendQuote()) {
      alert("No tienes permisos para enviar cotizaciones");
      return;
    }

    if (!validateForm()) {
      alert("Por favor, completa todos los campos requeridos antes de enviar");
      return;
    }

    if (!formData.precio_total || formData.precio_total <= 0) {
      alert("Debes establecer un precio total antes de enviar la cotización");
      return;
    }

    if (!currentQuote.email_cliente) {
      alert("La cotización debe tener un email de cliente válido");
      return;
    }

    if (
      window.confirm(
        "¿Estás seguro de enviar esta cotización al cliente? Una vez enviada no podrás editarla."
      )
    ) {
      setSendLoading(true);
      try {
        const updateData = {
          ...formData,
          precio_total: parseFloat(formData.precio_total),
          numero_personas: parseInt(formData.numero_personas),
          ninos: parseInt(formData.ninos),
          status: "completed",
        };

        await dispatch(updateQuote({ id, updates: updateData })).unwrap();

        await dispatch(sendQuoteToClient(id)).unwrap();

        alert("Cotización enviada exitosamente al cliente");
        navigate("/panel");
      } catch (error) {
        console.error("Error enviando cotización:", error);
        alert("Error al enviar la cotización: " + error);
      } finally {
        setSendLoading(false);
      }
    }
  };

  // ✅ RENDERS CONDICIONALES AL FINAL - Después de todos los hooks

  // Loading state
  if (loading && !currentQuote) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="fixed top-0 left-0 z-50 w-full">
          <NavBar />
        </div>
        <div className="flex justify-center items-center h-screen">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-lg">Cargando cotización...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !currentQuote) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="fixed top-0 left-0 z-50 w-full">
          <NavBar />
        </div>
        <div className="flex justify-center items-center h-screen">
          <div className="text-center">
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              className="text-red-500 text-6xl mb-4"
            />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Error al cargar la cotización
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => navigate("/panel/quotes")}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Volver a cotizaciones
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Validar permisos de acceso
  if (!loading && currentQuote && !canEditQuote()) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="fixed top-0 left-0 z-50 w-full">
          <NavBar />
        </div>
        <div className="flex justify-center items-center h-screen">
          <div className="text-center max-w-md">
            <FontAwesomeIcon
              icon={faShieldAlt}
              className="text-red-500 text-6xl mb-4"
            />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Sin Permisos
            </h2>
            <p className="text-gray-600 mb-4">
              No tienes permisos para editar esta cotización.
            </p>
            <button
              onClick={() => navigate("/panel/quotes")}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Volver a cotizaciones
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Verificar si la cotización puede ser editada por estado
  const isReadOnly =
    currentQuote?.status === QUOTE_STATUSES.SENT ||
    currentQuote?.status === QUOTE_STATUSES.APPROVED ||
    currentQuote?.status === QUOTE_STATUSES.REJECTED


  // ✅ RENDER PRINCIPAL
  // ✅ RENDER PRINCIPAL COMPLETO
return (
  <div className="min-h-screen bg-gray-50">
    <div className="fixed top-0 left-0 z-50 w-full">
      <NavBar />
    </div>

    <div className="container mx-auto p-4 mt-28">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate("/panel/quotes")}
              className="mr-4 p-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <FontAwesomeIcon icon={faArrowLeft} size="lg" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isReadOnly ? "Ver Cotización" : "Editar Cotización"}
              </h1>
              <p className="text-gray-600">
                {currentQuote?.quote_number} -{" "}
                {currentQuote?.nombre_cliente || "Cliente sin nombre"}
              </p>
              {isReadOnly && (
                <p className="text-sm text-orange-600 font-medium">
                  Esta cotización no puede ser editada debido a su estado
                  actual
                </p>
              )}
              {currentQuote?.status === QUOTE_STATUSES.APPROVED && (
                <div className="mt-2 flex items-center gap-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <FontAwesomeIcon icon={faCheck} className="mr-1" />
                    Cotización Aprobada
                  </span>
                  {canConvertToContract() && (
                    <button
                      onClick={handleOpenContractModal}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
                    >
                      <FontAwesomeIcon icon={faFileContract} />
                      Crear Contrato
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ✅ BOTONES DE ACCIÓN ACTUALIZADOS */}
          <div className="flex gap-3">
            {/* Botones de PDF */}
            {canGeneratePDF(currentQuote) && (
              <button
                onClick={handlePreviewPDF}
                disabled={pdfLoading}
                className="bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                title="Vista previa PDF"
              >
                {pdfLoading ? (
                  <FontAwesomeIcon icon={faSpinner} spin />
                ) : (
                  <FontAwesomeIcon icon={faEye} />
                )}
                Vista previa
              </button>
            )}

            {hasGeneratedPDF(currentQuote) && (
              <button
                onClick={handleDownloadPDF}
                disabled={pdfLoading}
                className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                title="Descargar PDF"
              >
                {pdfLoading ? (
                  <FontAwesomeIcon icon={faSpinner} spin />
                ) : (
                  <FontAwesomeIcon icon={faDownload} />
                )}
                Descargar PDF
              </button>
            )}

            {hasGeneratedPDF(currentQuote) &&
              canSendQuote() &&
              !isReadOnly && (
                <button
                  onClick={handleRegeneratePDF}
                  disabled={pdfRegenerating}
                  className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  title="Regenerar PDF"
                >
                  {pdfRegenerating ? (
                    <FontAwesomeIcon icon={faSpinner} spin />
                  ) : (
                    <FontAwesomeIcon icon={faSync} />
                  )}
                  Regenerar PDF
                </button>
              )}

            {!isReadOnly && (
              <button
                onClick={handleSave}
                disabled={saveLoading}
                className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                {saveLoading ? (
                  <FontAwesomeIcon icon={faSpinner} spin />
                ) : (
                  <FontAwesomeIcon icon={faSave} />
                )}
                Guardar
              </button>
            )}

            {canSendQuote() &&
              !isReadOnly &&
              currentQuote?.status !== QUOTE_STATUSES.SENT && (
                <button
                  onClick={handleSendToClient}
                  disabled={sendLoading}
                  className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  {sendLoading ? (
                    <FontAwesomeIcon icon={faSpinner} spin />
                  ) : (
                    <FontAwesomeIcon icon={faPaperPlane} />
                  )}
                  Enviar al Cliente
                </button>
              )}
          </div>
        </div>

        {/* ✅ INFORMACIÓN DE PDF */}
        {hasGeneratedPDF(currentQuote) && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <FontAwesomeIcon icon={faFilePdf} />
              <span>PDF generado: {currentQuote.pdf_filename}</span>
              <span className="text-blue-500">
                (
                {new Date(currentQuote.pdf_generated_at).toLocaleString(
                  "es-ES"
                )}
                )
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Mensajes de error */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {pdfError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          Error PDF: {pdfError}
        </div>
      )}

      {/* Formulario */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <form className="space-y-8">
          {/* Información del Viaje */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FontAwesomeIcon
                icon={faMapMarkerAlt}
                className="mr-2 text-blue-500"
              />
              Información del Viaje
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destino *
                </label>
                <input
                  type="text"
                  name="destino"
                  value={formData.destino}
                  onChange={handleInputChange}
                  disabled={isReadOnly}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.destino ? "border-red-500" : "border-gray-300"
                  } ${isReadOnly ? "bg-gray-100" : ""}`}
                  placeholder="Ej: París, Francia"
                />
                {errors.destino && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.destino}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Origen *
                </label>
                <input
                  type="text"
                  name="origen"
                  value={formData.origen}
                  onChange={handleInputChange}
                  disabled={isReadOnly}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.origen ? "border-red-500" : "border-gray-300"
                  } ${isReadOnly ? "bg-gray-100" : ""}`}
                  placeholder="Ej: Buenos Aires, Argentina"
                />
                {errors.origen && (
                  <p className="text-red-500 text-sm mt-1">{errors.origen}</p>
                )}
              </div>
            </div>
          </div>

          {/* Fechas */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FontAwesomeIcon
                icon={faCalendarAlt}
                className="mr-2 text-green-500"
              />
              Fechas del Viaje
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Ida *
                </label>
                <input
                  type="date"
                  name="fecha_ida"
                  value={formData.fecha_ida}
                  onChange={handleInputChange}
                  disabled={isReadOnly}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.fecha_ida ? "border-red-500" : "border-gray-300"
                  } ${isReadOnly ? "bg-gray-100" : ""}`}
                />
                {errors.fecha_ida && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.fecha_ida}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Regreso *
                </label>
                <input
                  type="date"
                  name="fecha_regreso"
                  value={formData.fecha_regreso}
                  onChange={handleInputChange}
                  disabled={isReadOnly}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.fecha_regreso
                      ? "border-red-500"
                      : "border-gray-300"
                  } ${isReadOnly ? "bg-gray-100" : ""}`}
                />
                {errors.fecha_regreso && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.fecha_regreso}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Información de Pasajeros */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FontAwesomeIcon
                icon={faUsers}
                className="mr-2 text-purple-500"
              />
              Información de Pasajeros
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Personas *
                </label>
                <input
                  type="number"
                  name="numero_personas"
                  value={formData.numero_personas}
                  onChange={handleInputChange}
                  disabled={isReadOnly}
                  min="1"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.numero_personas
                      ? "border-red-500"
                      : "border-gray-300"
                  } ${isReadOnly ? "bg-gray-100" : ""}`}
                />
                {errors.numero_personas && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.numero_personas}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Acomodación
                </label>
                <select
                  name="acomodacion"
                  value={formData.acomodacion}
                  onChange={handleInputChange}
                  disabled={isReadOnly}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isReadOnly ? "bg-gray-100" : ""
                  }`}
                >
                  {acomodacionOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Edades de niños */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  <FontAwesomeIcon
                    icon={faChild}
                    className="mr-2 text-yellow-500"
                  />
                  Edades de Niños ({formData.edades_ninos.length})
                </label>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={addEdadNino}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    Agregar Niño
                  </button>
                )}
              </div>
              {formData.edades_ninos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {formData.edades_ninos.map((edad, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="number"
                        value={edad}
                        onChange={(e) =>
                          handleEdadNinoChange(index, e.target.value)
                        }
                        disabled={isReadOnly}
                        min="0"
                        max="17"
                        className={`w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          isReadOnly ? "bg-gray-100" : ""
                        }`}
                        placeholder="Edad"
                      />
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => removeEdadNino(index)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Información del Hotel */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FontAwesomeIcon
                icon={faHotel}
                className="mr-2 text-indigo-500"
              />
              Información del Alojamiento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Hotel
                </label>
                <select
                  name="tipo_hotel"
                  value={formData.tipo_hotel}
                  onChange={handleInputChange}
                  disabled={isReadOnly}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isReadOnly ? "bg-gray-100" : ""
                  }`}
                >
                  {tipoHotelOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alimentación
                </label>
                <input
                  type="text"
                  name="alimentacion"
                  value={formData.alimentacion}
                  onChange={handleInputChange}
                  disabled={isReadOnly}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isReadOnly ? "bg-gray-100" : ""
                  }`}
                  placeholder="Ej: Desayuno incluido, Media pensión, etc."
                />
              </div>
            </div>

            {/* Traslados */}
            <div className="mt-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="traslado"
                  checked={formData.traslado}
                  onChange={handleInputChange}
                  disabled={isReadOnly}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  <FontAwesomeIcon
                    icon={faCar}
                    className="mr-2 text-blue-500"
                  />
                  Incluir traslados aeropuerto-hotel
                </span>
              </label>
            </div>
          </div>

          {/* Precio - Solo visible para Líder y superiores */}
          {hasAnyRole([
            USER_ROLES.LIDER,
            USER_ROLES.GERENTE,
            USER_ROLES.ADMIN,
            USER_ROLES.CONTADOR,
            USER_ROLES.OWNER,
          ]) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FontAwesomeIcon
                  icon={faDollarSign}
                  className="mr-2 text-green-500"
                />
                Información de Precio
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio Total * 
                  </label>
                  <input
                    type="number"
                    name="precio_total"
                    value={formData.precio_total}
                    onChange={handleInputChange}
                    disabled={isReadOnly}
                    min="0"
                    step="0.01"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.precio_total
                        ? "border-red-500"
                        : "border-gray-300"
                    } ${isReadOnly ? "bg-gray-100" : ""}`}
                    placeholder="0.00"
                  />
                  {errors.precio_total && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.precio_total}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Observaciones */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FontAwesomeIcon
                icon={faStickyNote}
                className="mr-2 text-orange-500"
              />
              Observaciones
            </h3>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleInputChange}
              disabled={isReadOnly}
              rows={4}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isReadOnly ? "bg-gray-100" : ""
              }`}
              placeholder="Comentarios adicionales, solicitudes especiales, etc."
            />
          </div>
        </form>
      </div>

      {/* Botones de acción fijos en la parte inferior */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40">
        <div className="container mx-auto flex justify-end gap-3">
          <button
            onClick={() => navigate("/panel/quotes")}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            {isReadOnly ? "Volver" : "Cancelar"}
          </button>

          {!isReadOnly && (
            <button
              onClick={handleSave}
              disabled={saveLoading}
              className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              {saveLoading ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : (
                <FontAwesomeIcon icon={faSave} />
              )}
              Guardar
            </button>
          )}

          {canSendQuote() &&
            !isReadOnly &&
            currentQuote?.status !== QUOTE_STATUSES.SENT && (
              <button
                onClick={handleSendToClient}
                disabled={sendLoading}
                className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                {sendLoading ? (
                  <FontAwesomeIcon icon={faSpinner} spin />
                ) : (
                  <FontAwesomeIcon icon={faPaperPlane} />
                )}
                Enviar al Cliente
              </button>
            )}
        </div>
      </div>

      {/* Espacio para los botones fijos */}
      <div className="h-20"></div>
    </div>

    {/* ✅ MODAL DE CREACIÓN DE CONTRATO */}
    {showContractModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">Crear Contrato</h3>
            <button
              onClick={() => setShowContractModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <FontAwesomeIcon icon={faTimes} size="lg" />
            </button>
          </div>

          <form className="space-y-6">
            {/* Información base del contrato */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Información de la Cotización</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Cliente:</span> {currentQuote?.nombre_cliente}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {currentQuote?.email_cliente}
                </div>
                <div>
                  <span className="font-medium">Destino:</span> {currentQuote?.destino}
                </div>
                <div>
                  <span className="font-medium">Origen:</span> {currentQuote?.origen}
                </div>
                <div>
                  <span className="font-medium">Precio Total:</span> ${currentQuote?.precio_total?.toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Pasajeros:</span> {currentQuote?.numero_personas}
                </div>
              </div>
            </div>

            {/* Datos del cliente para el contrato */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Datos del Cliente para el Contrato</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Documento *
                  </label>
                  <select
                    name="cliente_tipo_documento"
                    value={contractData.cliente_tipo_documento}
                    onChange={handleContractInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="cc">Cédula de Ciudadanía</option>
                    <option value="ce">Cédula de Extranjería</option>
                    <option value="ti">Tarjeta de Identidad</option>
                    <option value="passport">Pasaporte</option>
                    <option value="nit">NIT</option>
                    <option value="dni">DNI</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Documento *
                  </label>
                  <input
                    type="text"
                    name="cliente_documento"
                    value={contractData.cliente_documento}
                    onChange={handleContractInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    placeholder="Ej: 12345678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Nacimiento *
                  </label>
                  <input
                    type="date"
                    name="cliente_fecha_nacimiento"
                    value={contractData.cliente_fecha_nacimiento}
                    onChange={handleContractInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    name="cliente_ciudad"
                    value={contractData.cliente_ciudad}
                    onChange={handleContractInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Bogotá"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    name="cliente_direccion"
                    value={contractData.cliente_direccion}
                    onChange={handleContractInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Calle 123 #45-67"
                  />
                </div>
              </div>
            </div>

            {/* Fechas del viaje */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Fechas del Viaje</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Inicio *
                  </label>
                  <input
                    type="date"
                    name="fecha_inicio_viaje"
                    value={contractData.fecha_inicio_viaje}
                    onChange={handleContractInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Fin *
                  </label>
                  <input
                    type="date"
                    name="fecha_fin_viaje"
                    value={contractData.fecha_fin_viaje}
                    onChange={handleContractInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Forma de pago */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Forma de Pago</h4>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="contado"
                    name="forma_pago"
                    value="contado"
                    checked={contractData.forma_pago === 'contado'}
                    onChange={handleContractInputChange}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                  />
                  <label htmlFor="contado" className="ml-2 text-sm font-medium text-gray-700">
                    Pago de Contado
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="cuotas"
                    name="forma_pago"
                    value="cuotas"
                    checked={contractData.forma_pago === 'cuotas'}
                    onChange={handleContractInputChange}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                  />
                  <label htmlFor="cuotas" className="ml-2 text-sm font-medium text-gray-700">
                    Pago en Cuotas
                  </label>
                </div>
              </div>
            </div>

            {/* Configuración de cuotas */}
            {contractData.forma_pago === 'cuotas' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Cuotas
                  </label>
                  <select
                    name="numero_cuotas"
                    value={contractData.numero_cuotas}
                    onChange={handleContractInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {[2,3,4,5,6,7,8,9,10,11,12].map(num => (
                      <option key={num} value={num}>{num} cuotas</option>
                    ))}
                  </select>
                </div>

                {/* Cuota inicial opcional */}
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="tiene_cuota_inicial"
                      checked={contractData.tiene_cuota_inicial}
                      onChange={handleContractInputChange}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      Incluir cuota inicial (seña)
                    </span>
                  </label>
                </div>

                {contractData.tiene_cuota_inicial && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Porcentaje de Cuota Inicial (%)
                      </label>
                      <input
                        type="number"
                        name="cuota_inicial_porcentaje"
                        value={contractData.cuota_inicial_porcentaje}
                        onChange={handleContractInputChange}
                        min="10"
                        max="50"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha Vencimiento Cuota Inicial
                      </label>
                      <input
                        type="date"
                        name="fecha_vencimiento_inicial"
                        value={contractData.fecha_vencimiento_inicial}
                        onChange={handleContractInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* Preview de cuotas */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">Resumen de Cuotas</h5>
                  <div className="text-sm text-gray-600">
                    {contractData.tiene_cuota_inicial ? (
                      <div>
                        <p>• Cuota inicial: ${((currentQuote?.precio_total || 0) * (contractData.cuota_inicial_porcentaje / 100)).toLocaleString()}</p>
                        <p>• {contractData.numero_cuotas} cuotas de: ${(((currentQuote?.precio_total || 0) * (1 - contractData.cuota_inicial_porcentaje / 100)) / contractData.numero_cuotas).toLocaleString()}</p>
                      </div>
                    ) : (
                      <p>• {contractData.numero_cuotas} cuotas de: ${((currentQuote?.precio_total || 0) / contractData.numero_cuotas).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </form>

          {/* Botones del modal */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
            <button
              onClick={() => setShowContractModal(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateContract}
              disabled={contractLoading}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {contractLoading ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : (
                <FontAwesomeIcon icon={faFileContract} />
              )}
              Crear Contrato
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
}
export default QuoteEdit;
