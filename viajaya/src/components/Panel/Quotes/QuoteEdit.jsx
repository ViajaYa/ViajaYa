// React y hooks
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

// FontAwesome
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSave,
  faArrowLeft,
  faPaperPlane,
  faCalendarAlt,
  faMapMarkerAlt,
  faUsers,
  faChild,
  faHotel,
  faCar,
  faDollarSign,
  faStickyNote,
  faSpinner,
  faExclamationTriangle,
  faShieldAlt,
  faEye,
  faEdit,
  faDownload,
  faSync,
  faFilePdf,
  faCheck,
  faFileAlt,
  faBuilding,
  faBed,
  faStar,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";

// Redux slices y acciones
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
import { updateUser, selectUser } from "../../../redux/slices/authSlice";

import {
  createQuoteCalculation,
  upsertQuoteCalculation,
  fetchCalculationBaseData,
  confirmQuoteCalculation,
  fetchQuoteCalculationByQuoteId,
  selectCalculation,
  selectCalculationLoading,
  selectCalculationError,
  selectBaseData,
} from "../../../redux/slices/quoteCalculationSlice";

// Importar thunk de comisiones del slice correcto
import {
  fetchCommissionsByTripType,
  selectConfiguredCommissions,
} from "../../../redux/slices/commissionSlice";

// Permisos y hooks
import { useRolePermissions } from "../../../redux/hooks/hooks";

// Componentes UI
import NavBar from "../../layout/NavBar/NavBar";
import AdvancedQuoteCalculator from "./AdvancedQuoteCalculator_Fixed";

// Utils
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

  // ✅ Selectores para calculation
  const calculation = useSelector(selectCalculation);
  const calculationLoading = useSelector(selectCalculationLoading);
  const calculationError = useSelector(selectCalculationError);
  const baseData = useSelector(selectBaseData);

  // ✅ Selectores para comisiones configuradas
  const configuredCommissions = useSelector(selectConfiguredCommissions);

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
    trip_type: "nacional", // ✅ CORREGIDO: Valor por defecto
    origen: "",
    acomodacion: "Doble",
    tipo_hotel: "3 Estrellas",
    traslado: false,
    alimentacion: "",
    ninos: 0,
    edades_ninos: [],
    observaciones: "",
    precio_por_persona: "", // ✅ AGREGADO: Campo para precio por persona
    precio_total: "",
    servicios_detalle: "", // ✅ NUEVO: Campo para detalles de servicios (JSON string)
  });

  const [saveLoading, setSaveLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [hasCalculatorData, setHasCalculatorData] = useState(false);
const [showRequoteInfo, setShowRequoteInfo] = useState(false);
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
      alert(
        "La cotización debe tener un precio por persona para generar el PDF"
      );
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
      alert(
        "La cotización debe tener un precio por persona para regenerar el PDF"
      );
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
      // ✅ PASO 0: PRIMERO guardar la cotización con los datos actuales del formulario
      console.log("🔄 Guardando cotización antes de crear contrato...");
      const quoteUpdateData = {
        ...formData,
        precio_total: formData.precio_total
          ? parseFloat(formData.precio_total)
          : null,
        numero_personas: parseInt(formData.numero_personas),
        ninos: parseInt(formData.ninos),
        status: "approved", // Marcarla como aprobada para crear contrato
      };

      console.log("🔍 Datos de cotización a actualizar:", {
        trip_type: quoteUpdateData.trip_type,
        destino: quoteUpdateData.destino,
      });

      await dispatch(
        updateQuote({ id: currentQuote.id, updates: quoteUpdateData })
      ).unwrap();

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
        trip_type: formData.trip_type, // ✅ AGREGADO: Enviar explícitamente el trip_type del formulario
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
  console.log('🔍 COMPONENTE: Verificando datos de calculadora existentes');
  console.log('📋 COMPONENTE: calculation:', calculation);
  console.log('📋 COMPONENTE: currentQuote status:', currentQuote?.status);
  
  // ✅ CONDICIÓN EXPANDIDA: Permitir usar calculadora en más estados
  if (calculation && calculation.precio_final_total > 0) {
    console.log('✅ COMPONENTE: Se encontró cálculo existente, habilitando recotización');
    setHasCalculatorData(true);
  } else {
    console.log('❌ COMPONENTE: No hay datos de calculadora o precio es 0');
    setHasCalculatorData(false);
  }
}, [calculation, currentQuote?.status]);

  // Al montar, cargar la cotización y el cálculo asociado si existe
  useEffect(() => {
    if (id) {
      dispatch(fetchQuoteById(id));
      // Buscar cálculo asociado a la cotización usando el quote_id (UUID)
      dispatch(fetchQuoteCalculationByQuoteId(id));
    }
  }, [dispatch, id]);

  // Cuando se carga la cotización o el cálculo, hidratar el formulario y el resumen
  // Cuando se carga la cotización o el cálculo, hidratar el formulario y el resumen
  useEffect(() => {
    if (currentQuote) {
      // Si hay cálculo asociado, usarlo para hidratar el formulario y el resumen
      if (calculation && calculation.quote_id === currentQuote.id) {
        setFormData((prev) => ({
          ...prev,
          numero_personas:
            calculation.num_personas || currentQuote.numero_personas || 1,
          fecha_ida: currentQuote.fecha_ida
            ? new Date(currentQuote.fecha_ida).toISOString().split("T")[0]
            : "",
          fecha_regreso: currentQuote.fecha_regreso
            ? new Date(currentQuote.fecha_regreso).toISOString().split("T")[0]
            : "",
          destino: currentQuote.destino || "",
          trip_type: currentQuote.trip_type || "nacional",
          origen: currentQuote.origen || "",
          acomodacion: currentQuote.acomodacion || "Doble",
          tipo_hotel: currentQuote.tipo_hotel || "3 Estrellas",
          traslado: currentQuote.traslado || false,
          alimentacion: currentQuote.alimentacion || "",
          ninos: currentQuote.ninos || 0,
          edades_ninos: currentQuote.edades_ninos || [],
          observaciones:
            calculation.observaciones_generales ||
            currentQuote.observaciones ||
            "",
          precio_por_persona: calculation.precio_final_por_persona || "",
          precio_total: calculation.precio_final_total || "",
          servicios_detalle: currentQuote.servicios_detalle || "",
        }));
        // Calculation comes from Redux, no need to set it locally
      } else {
        // Si no hay cálculo, hidratar solo con datos de la cotización
        const precioPorPersona =
          currentQuote.precio_total && currentQuote.numero_personas
            ? (
                parseFloat(currentQuote.precio_total) /
                parseInt(currentQuote.numero_personas)
              ).toFixed(2)
            : "";
        setFormData({
          numero_personas: currentQuote.numero_personas || 1,
          fecha_ida: currentQuote.fecha_ida
            ? new Date(currentQuote.fecha_ida).toISOString().split("T")[0]
            : "",
          fecha_regreso: currentQuote.fecha_regreso
            ? new Date(currentQuote.fecha_regreso).toISOString().split("T")[0]
            : "",
          destino: currentQuote.destino || "",
          trip_type: currentQuote.trip_type || "nacional",
          origen: currentQuote.origen || "",
          acomodacion: currentQuote.acomodacion || "Doble",
          tipo_hotel: currentQuote.tipo_hotel || "3 Estrellas",
          traslado: currentQuote.traslado || false,
          alimentacion: currentQuote.alimentacion || "",
          ninos: currentQuote.ninos || 0,
          edades_ninos: currentQuote.edades_ninos || [],
          observaciones: currentQuote.observaciones || "",
          precio_por_persona: precioPorPersona,
          precio_total: currentQuote.precio_total || "",
          servicios_detalle: currentQuote.servicios_detalle || "",
        });
      }
    }
  }, [currentQuote, calculation]);

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

  // ✅ NUEVO: Calcular precio total automáticamente
  useEffect(() => {
    const precioPorPersona = parseFloat(formData.precio_por_persona);
    const numeroPersonas = parseInt(formData.numero_personas);

    if (precioPorPersona > 0 && numeroPersonas > 0) {
      const precioTotal = (precioPorPersona * numeroPersonas).toFixed(2);
      setFormData((prev) => ({
        ...prev,
        precio_total: precioTotal,
      }));
    } else if (!formData.precio_por_persona) {
      // Si se borra el precio por persona, limpiar precio total
      setFormData((prev) => ({
        ...prev,
        precio_total: "",
      }));
    }
  }, [formData.precio_por_persona, formData.numero_personas]);

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
    if (!formData.trip_type) {
      newErrors.trip_type = "Debe seleccionar el tipo de viaje";
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
      (!formData.precio_por_persona || formData.precio_por_persona <= 0)
    ) {
      newErrors.precio_por_persona =
        "El precio por persona es requerido y debe ser mayor a 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

 

  const handleSendToClient = async () => {
    if (!canSendQuote()) {
      alert("No tienes permisos para enviar cotizaciones");
      return;
    }
    if (!hasCalculatorData) {
    alert("Debe completar el cálculo en la calculadora antes de enviar la cotización");
    return;
  }

    if (!validateForm()) {
      alert("Por favor, completa todos los campos requeridos antes de enviar");
      return;
    }

    if (!formData.precio_por_persona || formData.precio_por_persona <= 0) {
      alert(
        "Debes establecer un precio por persona antes de enviar la cotización"
      );
      return;
    }

    if (!currentQuote.email_cliente) {
      alert("La cotización debe tener un email de cliente válido");
      return;
    }

    if (
      window.confirm(
        "¿Estás seguro de enviar esta cotización al cliente? Podrás editarla posteriormente si el cliente solicita cambios."
      )
    ) {
      setSendLoading(true);
      try {
        // ✅ PASO 1: Actualizar todos los datos de la cotización
        const updateData = {
          ...formData,
          precio_total: parseFloat(formData.precio_total),
          numero_personas: parseInt(formData.numero_personas),
          ninos: parseInt(formData.ninos),
          status: "completed",
          // Asegurar que los servicios detallados se incluyan
          servicios_detalle: formData.servicios_detalle || null,
          // ✅ Asegurar que trip_type se incluya explícitamente
          trip_type: formData.trip_type,
        };

        console.log(
          "💾 Actualizando cotización antes de enviar (incluyendo trip_type):",
          {
            trip_type: updateData.trip_type,
            destino: updateData.destino,
            status: updateData.status,
          }
        );
        await dispatch(updateQuote({ id, updates: updateData })).unwrap();

        // ✅ PASO 2: Enviar al cliente
        console.log("📧 Enviando cotización al cliente...");
        await dispatch(sendQuoteToClient(id)).unwrap();

        // ✅ PASO 3: Recargar para sincronizar
        console.log("🔄 Recargando datos actualizados...");
        await dispatch(fetchQuoteById(id));

        alert("✅ Cotización enviada exitosamente al cliente");
        navigate("/panel");
      } catch (error) {
        console.error("❌ Error enviando cotización:", error);
        alert("Error al enviar la cotización: " + (error.message || error));
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
  // ✅ CAMBIO: Permitir editar cotizaciones enviadas para modificaciones del cliente
  const isReadOnly =
    currentQuote?.status === QUOTE_STATUSES.APPROVED ||
    currentQuote?.status === QUOTE_STATUSES.REJECTED;

    const canRequote = () => {
  if (!user || !currentQuote || typeof hasAnyRole !== "function") return false;
  
  // ✅ Permitir recotización en estados: SENT y COMPLETED
  const canRequoteStatuses = [QUOTE_STATUSES.SENT, QUOTE_STATUSES.COMPLETED];
  
  // Solo usuarios con permisos de envío pueden recotizar
  return canRequoteStatuses.includes(currentQuote.status) && hasAnyRole([
    USER_ROLES.LIDER,
    USER_ROLES.GERENTE,
    USER_ROLES.ADMIN,
    USER_ROLES.CONTADOR,
    USER_ROLES.OWNER,
  ]);
};

  // ✅ Función para manejar el guardado desde la calculadora
const handleCalculationSave = async (calculationData) => {
  try {
    console.log('💾 RECOTIZACIÓN: Guardando cálculo desde calculadora:', calculationData);
    
    // ✅ DETECTAR: Si es una recotización
    const isRequoting = currentQuote?.status === QUOTE_STATUSES.SENT;
    
    if (isRequoting) {
      console.log('🔄 RECOTIZACIÓN: Detectada recotización de cotización enviada');
    }

    // Actualizar el precio por persona en el formulario usando los campos correctos
    if (
      calculationData.precio_final_por_persona &&
      calculationData.precio_final_total
    ) {
      console.log("💰 Actualizando precios desde calculadora:", {
        precio_final_por_persona: calculationData.precio_final_por_persona,
        precio_final_total: calculationData.precio_final_total,
        num_personas: calculationData.num_personas,
      });

      // ✅ EXTRAER: Detalles de servicios para el cliente (SIN precios de costo)
      const serviciosDetalle = [];

      // Tiquetes
      if (
        calculationData.tiquetes &&
        calculationData.tiquetes.costo_total > 0
      ) {
        serviciosDetalle.push({
          categoria: "Transporte",
          descripcion: `${
            calculationData.tiquetes.tipo === "ida_vuelta"
              ? "Tiquetes ida y vuelta"
              : "Tiquete ida"
          } - ${calculationData.tiquetes.origen} ↔ ${
            calculationData.tiquetes.destino
          }`,
          proveedor: calculationData.tiquetes.proveedor || "",
          fechas: `${calculationData.tiquetes.fecha_ida || ""} ${
            calculationData.tiquetes.fecha_vuelta
              ? "- " + calculationData.tiquetes.fecha_vuelta
              : ""
          }`,
          observaciones: calculationData.tiquetes.observaciones || "",
        });
      }

      // Hotel
      if (calculationData.hotel && calculationData.hotel.costo_total > 0) {
        serviciosDetalle.push({
          categoria: "Alojamiento",
          descripcion: `${calculationData.hotel.nombre || "Hotel"} - ${
            calculationData.hotel.categoria || ""
          } (${calculationData.hotel.noches || 0} noches)`,
          proveedor: calculationData.hotel.proveedor || "",
          ubicacion: calculationData.hotel.ubicacion || "",
          acomodacion: calculationData.hotel.acomodacion || "",
          categoria_hotel: calculationData.hotel.categoria || "",
          observaciones: calculationData.hotel.observaciones || "",
        });
      }

      // Traslados
      if (
        calculationData.traslados &&
        calculationData.traslados.costo_total > 0
      ) {
        const trasladosIncluidos = [];
        if (calculationData.traslados.aeropuerto_hotel_ida?.incluido) {
          trasladosIncluidos.push("Aeropuerto → Hotel");
        }
        if (calculationData.traslados.hotel_aeropuerto_vuelta?.incluido) {
          trasladosIncluidos.push("Hotel → Aeropuerto");
        }
        if (trasladosIncluidos.length > 0) {
          serviciosDetalle.push({
            categoria: "Traslados",
            descripcion: trasladosIncluidos.join(", "),
            observaciones: "Traslados incluidos en el paquete",
          });
        }
      }

      // Alimentación
      if (
        calculationData.alimentacion &&
        calculationData.alimentacion.costo_total > 0
      ) {
        serviciosDetalle.push({
          categoria: "Alimentación",
          descripcion:
            calculationData.alimentacion.tipo || "Plan alimentario",
          proveedor: calculationData.alimentacion.proveedor || "",
          observaciones: calculationData.alimentacion.observaciones || "",
        });
      }

      // Equipaje
      if (
        calculationData.equipaje &&
        calculationData.equipaje.costo_total > 0
      ) {
        const equipajeIncluido = [];
        if (calculationData.equipaje.cabina?.incluido) {
          equipajeIncluido.push("Equipaje de cabina");
        }
        if (calculationData.equipaje.bodega?.incluido) {
          equipajeIncluido.push("Equipaje de bodega");
        }
        if (calculationData.equipaje.equipaje_extra?.incluido) {
          equipajeIncluido.push("Equipaje extra");
        }
        if (equipajeIncluido.length > 0) {
          serviciosDetalle.push({
            categoria: "Equipaje",
            descripcion: equipajeIncluido.join(", "),
            observaciones: "Equipaje incluido en el paquete",
          });
        }
      }

      // Seguros
      if (
        calculationData.seguros &&
        calculationData.seguros.costo_total > 0
      ) {
        const segurosIncluidos = [];
        if (calculationData.seguros.asistencia_medica?.incluido) {
          segurosIncluidos.push(
            `Asistencia médica ${
              calculationData.seguros.asistencia_medica.tipo || ""
            }`
          );
        }
        if (calculationData.seguros.cancelacion?.incluido) {
          segurosIncluidos.push("Seguro de cancelación");
        }
        if (segurosIncluidos.length > 0) {
          serviciosDetalle.push({
            categoria: "Seguros",
            descripcion: segurosIncluidos.join(", "),
            observaciones: "Seguros incluidos en el paquete",
          });
        }
      }

      // Asistencia médica (si está separada)
      if (
        calculationData.asistencia_medica &&
        calculationData.asistencia_medica.costo_total > 0
      ) {
        serviciosDetalle.push({
          categoria: "Asistencia Médica",
          descripcion: calculationData.asistencia_medica.tipo || "Asistencia médica",
          proveedor: calculationData.asistencia_medica.proveedor || "",
          observaciones: calculationData.asistencia_medica.observaciones || "",
        });
      }

      // Excursiones
      if (
        Array.isArray(calculationData.excursiones) &&
        calculationData.excursiones.length > 0
      ) {
        calculationData.excursiones.forEach((excursion) => {
          if (excursion.costo > 0) {
            serviciosDetalle.push({
              categoria: "Excursiones",
              descripcion: excursion.nombre || "Excursión",
              observaciones: excursion.descripcion || "",
            });
          }
        });
      }

      // Extras
      if (
        Array.isArray(calculationData.extras) &&
        calculationData.extras.length > 0
      ) {
        calculationData.extras.forEach((extra) => {
          if (extra.costo > 0) {
            serviciosDetalle.push({
              categoria: "Servicios Adicionales",
              descripcion: extra.nombre || "Servicio adicional",
              observaciones: extra.descripcion || "",
            });
          }
        });
      }

      console.log(
        "📋 Servicios extraídos para el cliente:",
        serviciosDetalle
      );

      // ✅ PASO 1: Actualizar formData local
      setFormData((prev) => ({
        ...prev,
        precio_por_persona:
          calculationData.precio_final_por_persona.toString(),
        precio_total: calculationData.precio_final_total.toString(),
        numero_personas: calculationData.num_personas.toString(),
        servicios_detalle: JSON.stringify(serviciosDetalle),
      }));

      // ✅ PASO 2: Guardar/actualizar el cálculo usando upsert
      console.log("💾 RECOTIZACIÓN: Guardando/actualizando cálculo...");
      await dispatch(upsertQuoteCalculation(calculationData)).unwrap();

      // ✅ PASO 3: Actualizar la cotización
      console.log("💾 RECOTIZACIÓN: Actualizando cotización...");
      const updateData = {
        precio_total: parseFloat(calculationData.precio_final_total),
        numero_personas: parseInt(calculationData.num_personas),
        servicios_detalle: JSON.stringify(serviciosDetalle),
        // ✅ IMPORTANTE: Cambiar status según el contexto
        status: isRequoting ? "completed" : (calculationData.precio_final_total > 0 ? "completed" : "pending"),
        // ✅ CRÍTICO: Incluir campos del formulario actual
        trip_type: formData.trip_type,
        destino: formData.destino,
        origen: formData.origen,
        fecha_ida: formData.fecha_ida,
        fecha_regreso: formData.fecha_regreso,
        acomodacion: formData.acomodacion,
        tipo_hotel: formData.tipo_hotel,
        traslado: formData.traslado,
        alimentacion: formData.alimentacion,
        ninos: parseInt(formData.ninos),
        edades_ninos: formData.edades_ninos,
        observaciones: formData.observaciones,
      };

      console.log("🔍 RECOTIZACIÓN: Datos de actualización que se van a enviar:", {
        trip_type: updateData.trip_type,
        destino: updateData.destino,
        precio_total: updateData.precio_total,
        status: updateData.status,
        isRequoting: isRequoting
      });

      await dispatch(
        updateQuote({ id: currentQuote.id, updates: updateData })
      ).unwrap();

      // ✅ PASO 4: Recargar datos para sincronizar
      console.log("🔄 RECOTIZACIÓN: Recargando datos actualizados...");
      await dispatch(fetchQuoteById(currentQuote.id));
      await dispatch(fetchQuoteCalculationByQuoteId(currentQuote.id));

      // ✅ PASO 5: Actualizar estado local
      setHasCalculatorData(true);

      // ✅ MENSAJE ESPECÍFICO según el contexto
      const message = isRequoting 
        ? '✅ Recotización guardada exitosamente. Puede reenviar los cambios al cliente.' 
        : '✅ Cálculo guardado exitosamente. La cotización ha sido actualizada.';
        
      console.log('✅ RECOTIZACIÓN: Guardado completado');
      alert(message);
    }
  } catch (error) {
    console.error('❌ RECOTIZACIÓN: Error en handleCalculationSave:', error);
    alert(`Error al guardar el cálculo: ${error.message || error}`);
  }
};

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

              {canSendQuote() &&
    !isReadOnly &&
    hasCalculatorData && // ✅ NUEVA CONDICIÓN: Solo si hay datos de calculadora
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

        {/* ✅ NUEVO: Resumen Visual de la Cotización */}
        {currentQuote && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 mb-6 text-white">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <FontAwesomeIcon icon={faFileAlt} className="mr-3" />
              Resumen de la Cotización
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Información del Viaje */}
              <div className="bg-white/10 rounded-lg p-4">
                <h3 className="font-semibold mb-2 flex items-center">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2" />
                  Destino & Fechas
                </h3>
                <div className="space-y-1 text-sm">
                  <div>
                    <strong>Destino:</strong>{" "}
                    {formData.destino || "Por definir"}
                  </div>
                  <div>
                    <strong>Origen:</strong> {formData.origen || "Por definir"}
                  </div>
                  <div>
                    <strong>Tipo:</strong>{" "}
                    {formData.trip_type === "nacional"
                      ? "Nacional"
                      : "Internacional"}
                  </div>
                  {formData.fecha_ida && (
                    <div>
                      <strong>Ida:</strong>{" "}
                      {new Date(formData.fecha_ida).toLocaleDateString("es-ES")}
                    </div>
                  )}
                  {formData.fecha_regreso && (
                    <div>
                      <strong>Regreso:</strong>{" "}
                      {new Date(formData.fecha_regreso).toLocaleDateString(
                        "es-ES"
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Información de Personas */}
              <div className="bg-white/10 rounded-lg p-4">
                <h3 className="font-semibold mb-2 flex items-center">
                  <FontAwesomeIcon icon={faUsers} className="mr-2" />
                  Viajeros
                </h3>
                <div className="space-y-1 text-sm">
                  <div>
                    <strong>Personas:</strong> {formData.numero_personas || 1}
                  </div>
                  <div>
                    <strong>Niños:</strong> {formData.ninos || 0}
                  </div>
                  <div>
                    <strong>Acomodación:</strong> {formData.acomodacion}
                  </div>
                  <div>
                    <strong>Hotel:</strong> {formData.tipo_hotel}
                  </div>
                  {formData.traslado && (
                    <div className="text-green-300">✓ Incluye traslados</div>
                  )}
                </div>
              </div>

              {/* Información de Precios */}
              <div className="bg-white/10 rounded-lg p-4">
                <h3 className="font-semibold mb-2 flex items-center">
                  <FontAwesomeIcon icon={faDollarSign} className="mr-2" />
                  Precios
                </h3>
                <div className="space-y-1 text-sm">
                  {formData.precio_por_persona && (
                    <div>
                      <strong>Por persona:</strong> $
                      {parseFloat(formData.precio_por_persona).toLocaleString(
                        "es-CO"
                      )}
                    </div>
                  )}
                  {formData.precio_total && (
                    <div className="text-lg font-bold text-yellow-300">
                      <strong>Total:</strong> $
                      {parseFloat(formData.precio_total).toLocaleString(
                        "es-CO"
                      )}
                    </div>
                  )}
                  <div
                    className={`text-sm px-2 py-1 rounded ${
                      currentQuote.status === "pending"
                        ? "bg-yellow-500"
                        : currentQuote.status === "completed"
                        ? "bg-blue-500"
                        : currentQuote.status === "sent"
                        ? "bg-green-500"
                        : currentQuote.status === "approved"
                        ? "bg-green-600"
                        : "bg-gray-500"
                    }`}
                  >
                    Estado:{" "}
                    {currentQuote.status === "pending"
                      ? "Pendiente"
                      : currentQuote.status === "completed"
                      ? "Completada"
                      : currentQuote.status === "sent"
                      ? "Enviada"
                      : currentQuote.status === "approved"
                      ? "Aprobada"
                      : currentQuote.status}
                  </div>
                </div>
              </div>
            </div>

            {/* Cliente */}
            <div className="mt-4 p-3 bg-white/10 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <strong>Cliente:</strong> {currentQuote.nombre_cliente}
                  <span className="ml-4">
                    <strong>Email:</strong> {currentQuote.email_cliente}
                  </span>
                  {currentQuote.telefono_cliente && (
                    <span className="ml-4">
                      <strong>Tel:</strong> {currentQuote.telefono_cliente}
                    </span>
                  )}
                </div>
                {currentQuote.sent_at && (
                  <div className="text-sm">
                    Enviada:{" "}
                    {new Date(currentQuote.sent_at).toLocaleDateString("es-ES")}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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

        {/* ✅ MEJORADO: Mostrar servicios detallados que verá el cliente */}
        {formData.servicios_detalle && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mt-6 shadow-sm">
            <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center">
              <FontAwesomeIcon
                icon={faFileAlt}
                className="mr-3 text-blue-600"
              />
              Servicios Incluidos en el Paquete
            </h3>
            <div className="bg-blue-100 border-l-4 border-blue-500 p-3 mb-4 rounded">
              <div className="text-sm text-blue-700 font-medium">
                💡 Esta información se comparte con el cliente y aparece en el
                PDF de la cotización
              </div>
            </div>
            {(() => {
              try {
                const servicios = JSON.parse(formData.servicios_detalle);
                return (
                  <div className="grid gap-4 md:grid-cols-2">
                    {servicios.map((servicio, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center mb-3">
                          <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                          <h4 className="font-bold text-blue-900 text-lg">
                            {servicio.categoria}
                          </h4>
                        </div>

                        <div className="text-gray-700 mb-3 text-sm leading-relaxed">
                          {servicio.descripcion}
                        </div>

                        <div className="space-y-2">
                          {servicio.proveedor && (
                            <div className="flex items-center text-sm text-gray-600">
                              <FontAwesomeIcon
                                icon={faBuilding}
                                className="mr-2 text-gray-400 w-4"
                              />
                              <span className="font-medium">Proveedor:</span>
                              <span className="ml-1">{servicio.proveedor}</span>
                            </div>
                          )}

                          {servicio.fechas && (
                            <div className="flex items-center text-sm text-gray-600">
                              <FontAwesomeIcon
                                icon={faCalendarAlt}
                                className="mr-2 text-gray-400 w-4"
                              />
                              <span className="font-medium">Fechas:</span>
                              <span className="ml-1">{servicio.fechas}</span>
                            </div>
                          )}

                          {servicio.ubicacion && (
                            <div className="flex items-center text-sm text-gray-600">
                              <FontAwesomeIcon
                                icon={faMapMarkerAlt}
                                className="mr-2 text-gray-400 w-4"
                              />
                              <span className="font-medium">Ubicación:</span>
                              <span className="ml-1">{servicio.ubicacion}</span>
                            </div>
                          )}

                          {servicio.acomodacion && (
                            <div className="flex items-center text-sm text-gray-600">
                              <FontAwesomeIcon
                                icon={faBed}
                                className="mr-2 text-gray-400 w-4"
                              />
                              <span className="font-medium">Acomodación:</span>
                              <span className="ml-1">
                                {servicio.acomodacion}
                              </span>
                            </div>
                          )}

                          {servicio.categoria === "Hotel" &&
                            servicio.categoria_hotel && (
                              <div className="flex items-center text-sm text-gray-600">
                                <FontAwesomeIcon
                                  icon={faStar}
                                  className="mr-2 text-yellow-400 w-4"
                                />
                                <span className="font-medium">Categoría:</span>
                                <span className="ml-1">
                                  {servicio.categoria_hotel}
                                </span>
                              </div>
                            )}

                          {servicio.observaciones && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
                              <FontAwesomeIcon
                                icon={faInfoCircle}
                                className="mr-2 text-gray-400 w-4"
                              />
                              <span className="font-medium">Detalles:</span>
                              <div className="mt-1">
                                {servicio.observaciones}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Indicador visual del tipo de servicio */}
                        <div className="mt-3 pt-2 border-t border-gray-100">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              servicio.categoria === "Hotel"
                                ? "bg-blue-100 text-blue-800"
                                : servicio.categoria === "Tiquetes"
                                ? "bg-green-100 text-green-800"
                                : servicio.categoria === "Traslados"
                                ? "bg-yellow-100 text-yellow-800"
                                : servicio.categoria === "Seguros"
                                ? "bg-purple-100 text-purple-800"
                                : servicio.categoria === "Excursiones"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {servicio.categoria}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              } catch (e) {
                return (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center text-red-600">
                      <FontAwesomeIcon
                        icon={faExclamationTriangle}
                        className="mr-2"
                      />
                      <span>
                        Error al mostrar servicios detallados. Verifica el
                        formato de datos.
                      </span>
                    </div>
                  </div>
                );
              }
            })()}
          </div>
        )}

        {/* Mostrar calculadora solo para usuarios internos */}
        {hasAnyRole([
          USER_ROLES.ASESOR,
          USER_ROLES.LIDER,
          USER_ROLES.GERENTE,
          USER_ROLES.ADMIN,
          USER_ROLES.OWNER,
        ]) && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h3 className="text-lg font-bold mb-4">
              Calculadora de Costos Interna
            </h3>
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Panel de resumen de la cotización */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 w-full lg:w-1/3">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
                  <FontAwesomeIcon icon={faFileAlt} className="mr-2" />
                  Resumen de Cotización
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Cliente:</strong>{" "}
                    {currentQuote?.nombre_cliente ||
                      currentQuote?.Cliente?.nombre ||
                      "-"}
                  </div>
                  <div>
                    <strong>Email:</strong>{" "}
                    {currentQuote?.email_cliente ||
                      currentQuote?.Cliente?.email ||
                      "-"}
                  </div>
                  <div>
                    <strong>Destino:</strong> {currentQuote?.destino || "-"}
                  </div>
                  <div>
                    <strong>Origen:</strong> {currentQuote?.origen || "-"}
                  </div>
                  <div>
                    <strong>Tipo de viaje:</strong>{" "}
                    {currentQuote?.trip_type || "-"}
                  </div>
                  <div>
                    <strong>Fecha ida:</strong>{" "}
                    {currentQuote?.fecha_ida
                      ? new Date(currentQuote.fecha_ida).toLocaleDateString()
                      : "-"}
                  </div>
                  <div>
                    <strong>Fecha regreso:</strong>{" "}
                    {currentQuote?.fecha_regreso
                      ? new Date(
                          currentQuote.fecha_regreso
                        ).toLocaleDateString()
                      : "-"}
                  </div>
                  <div>
                    <strong>Número de personas:</strong>{" "}
                    {currentQuote?.numero_personas || "-"}
                  </div>
                  <div>
                    <strong>Estado:</strong> {currentQuote?.status || "-"}
                  </div>
                </div>
              </div>
              {/* Calculadora */}
             <div className="w-full lg:w-2/3">
  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
    <div className="text-sm text-green-700">
      <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
      <strong>Importante:</strong> Al usar el botón "Confirmar
      Cálculo" de la calculadora, se guardará automáticamente
      tanto el cálculo interno como se actualizará la cotización
      con los precios finales y servicios detallados para el
      cliente.
    </div>
  </div>
  
  {/* ✅ AGREGAR: Mensaje informativo si hay datos existentes */}
  {calculation && (
    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="text-sm text-blue-700">
        <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
        <strong>Cálculo existente detectado:</strong> Los datos se cargarán automáticamente en la calculadora para su modificación.
      </div>
    </div>
  )}
  
  <AdvancedQuoteCalculator
    quote_id={currentQuote?.id}
    onContinue={handleCalculationSave}
    existingCalculation={calculation} // ✅ NUEVO: Pasar datos existentes
    quoteData={currentQuote} // ✅ NUEVO: Pasar datos de la cotización
  />
</div>
            </div>
          </div>
        )}

        {/* Mostrar resumen del cálculo si existe */}
        {calculation && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mt-6 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-700 mb-3 flex items-center">
              <FontAwesomeIcon icon={faEye} className="mr-2" />
              Resumen de Cálculo Interno (Solo visible para el equipo)
            </h3>
            <div className="text-sm text-yellow-600 mb-4">
              Esta información NO se comparte con el cliente. El cliente solo ve
              el precio final.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <strong>Costo base:</strong> $
                {Number(calculation.costo_base || 0).toLocaleString()}
              </div>
              <div>
                <strong>Total comisiones:</strong> $
                {Number(calculation.total_comisiones || 0).toLocaleString()}
              </div>
              <div>
                <strong>Total ganancia:</strong> $
                {Number(calculation.total_ganancia || 0).toLocaleString()}
              </div>
              <div>
                <strong>Margen de ganancia:</strong>{" "}
                {calculation.ganancia?.porcentaje || 0}%
              </div>
              <div>
                <strong>Precio final total:</strong> $
                {Number(calculation.precio_final_total || 0).toLocaleString()}
              </div>
              <div className="md:col-span-2">
                <strong>Precio final por persona:</strong> $
                {Number(
                  calculation.precio_final_por_persona || 0
                ).toLocaleString()}
              </div>
            </div>
            {/* Mostrar desglose de comisiones */}
            {calculation.comisiones && (
              <div className="mb-4">
                <strong>Desglose de Comisiones:</strong>
                <ul className="list-disc ml-6 mt-2">
                  {calculation.comisiones.asesor?.total > 0 && (
                    <li>
                      Asesor: $
                      {Number(
                        calculation.comisiones.asesor.total
                      ).toLocaleString()}
                    </li>
                  )}
                  {calculation.comisiones.lider?.total > 0 && (
                    <li>
                      Líder: $
                      {Number(
                        calculation.comisiones.lider.total
                      ).toLocaleString()}
                    </li>
                  )}
                  {calculation.comisiones.gerente?.total > 0 && (
                    <li>
                      Gerente: $
                      {Number(
                        calculation.comisiones.gerente.total
                      ).toLocaleString()}
                    </li>
                  )}
                  {calculation.comisiones.admin?.total > 0 && (
                    <li>
                      Admin: $
                      {Number(
                        calculation.comisiones.admin.total
                      ).toLocaleString()}
                    </li>
                  )}
                </ul>
              </div>
            )}
            {/* Mostrar servicios principales */}
            <div className="mb-4">
              <strong>Servicios Incluidos:</strong>
              <ul className="list-disc ml-6 mt-2">
                {calculation.tiquetes && (
                  <li>
                    Tiquetes ({calculation.tiquetes.tipo}): $
                    {Number(
                      calculation.tiquetes.costo_total || 0
                    ).toLocaleString()}
                  </li>
                )}
                {calculation.hotel && (
                  <li>
                    Hotel ({calculation.hotel.noches} noches): $
                    {Number(
                      calculation.hotel.costo_total || 0
                    ).toLocaleString()}
                  </li>
                )}
                {calculation.traslados && (
                  <li>
                    Traslados: $
                    {Number(
                      calculation.traslados.costo_total || 0
                    ).toLocaleString()}
                  </li>
                )}
                {calculation.alimentacion && (
                  <li>
                    Alimentación ({calculation.alimentacion.tipo}): $
                    {Number(
                      calculation.alimentacion.costo_total || 0
                    ).toLocaleString()}
                  </li>
                )}
                {calculation.equipaje &&
                  calculation.equipaje.costo_total > 0 && (
                    <li>
                      Equipaje: $
                      {Number(
                        calculation.equipaje.costo_total || 0
                      ).toLocaleString()}
                    </li>
                  )}
                {calculation.seguros && calculation.seguros.costo_total > 0 && (
                  <li>
                    Seguros: $
                    {Number(
                      calculation.seguros.costo_total || 0
                    ).toLocaleString()}
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Botones de acción fijos en la parte inferior */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40">
  <div className="container mx-auto flex justify-end gap-3">
    <button
      onClick={() => navigate("/quotesList")}
      className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
    >
      {isReadOnly ? "Volver" : "Cancelar"}
    </button>
  {canRequote() && (
    <button
      onClick={() => setShowRequoteInfo(true)}
      className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
      title="Recotizar - Modificar precios y servicios"
    >
      <FontAwesomeIcon icon={faEdit} />
      Recotizar
    </button>
  )}
           {canSendQuote() &&
    !isReadOnly &&
    hasCalculatorData &&
    (currentQuote?.status !== QUOTE_STATUSES.SENT || canRequote()) && (
      <button
        onClick={handleSendToClient}
        disabled={sendLoading}
        className={`${
          currentQuote?.status === QUOTE_STATUSES.SENT 
            ? 'bg-orange-500 hover:bg-orange-600' 
            : 'bg-green-500 hover:bg-green-600'
        } disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2`}
      >
        {sendLoading ? (
          <FontAwesomeIcon icon={faSpinner} spin />
        ) : (
          <FontAwesomeIcon icon={faPaperPlane} />
        )}
        {currentQuote?.status === QUOTE_STATUSES.SENT ? 'Reenviar Cambios' : 'Enviar al Cliente'}
      </button>
    )}
          </div>
        </div>

        {/* Espacio para los botones fijos */}
        <div className="h-20"></div>
      </div>

    {showRequoteInfo && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-md">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
        <FontAwesomeIcon icon={faEdit} className="mr-2 text-yellow-500" />
        Recotizar Cotización
      </h3>
      
      <div className="space-y-3 text-sm text-gray-700 mb-6">
        <p>
          <strong>Esta cotización ya fue enviada al cliente.</strong>
        </p>
        <p>
          Para realizar cambios:
        </p>
        <ul className="list-disc ml-5 space-y-1">
          <li>Use la calculadora de costos para ajustar precios y servicios</li>
          <li>Los datos existentes se cargarán automáticamente</li>
          <li>Modifique lo que necesite y guarde</li>
          <li>Use "Reenviar Cambios" para notificar al cliente</li>
        </ul>
        <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-3">
          <div className="flex items-center text-blue-700">
            <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
            <span className="text-xs">
              El cliente recibirá la cotización actualizada con los nuevos precios
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-3">
        <button
          onClick={() => setShowRequoteInfo(false)}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Entendido
        </button>
        <button
          onClick={() => {
            setShowRequoteInfo(false);
            // Scroll hacia la calculadora
            const calculator = document.querySelector('.bg-white.rounded-lg.shadow-md.p-6.mt-6');
            if (calculator) {
              calculator.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
        >
          Ir a Calculadora
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};
export default QuoteEdit;
