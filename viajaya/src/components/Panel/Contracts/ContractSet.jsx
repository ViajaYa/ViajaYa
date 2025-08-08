import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSave,
  faArrowLeft,
  faUser,
  faCreditCard,
  faMapMarkerAlt,
  faDollarSign,
  faFileContract,
  faSpinner,
  faExclamationTriangle,
  faUsers,
  faCrown,
} from "@fortawesome/free-solid-svg-icons";

import {
  fetchContractById,
  updateContract,
  selectCurrentContract,
  selectContractLoading,
  generateContractPDF,
  selectQuoteCalculationAnalysis, // ✅ NUEVO
  selectConversionStatus, // ✅ NUEVO
  selectCanConvertQuote, // ✅ NUEVO
  selectFinancialSummary, // ✅ NUEVO
  selectItemsRequireingPurchase, // ✅ NUEVO
  convertQuoteToContractItems, // ✅ NUEVO - acción
} from "../../../redux/slices/contractSlice";

const ContractSet = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const contract = useSelector(selectCurrentContract);
  const loading = useSelector(selectContractLoading);
  const calculationAnalysis = useSelector(selectQuoteCalculationAnalysis); // ✅ NUEVO
  const conversionStatus = useSelector(selectConversionStatus); // ✅ NUEVO
  const canConvert = useSelector(selectCanConvertQuote); // ✅ NUEVO
  const financialSummary = useSelector(selectFinancialSummary); // ✅ NUEVO
  const itemsRequiringPurchase = useSelector(selectItemsRequireingPurchase); // ✅ NUEVO
  console.log("🔍 Contract data:", contract);

  const CONTRACT_ITEM_TYPES = [
    { value: "tickets", label: "Tickets" },
    { value: "asistencia_medica", label: "Asistencia Médica" },
    { value: "equipaje", label: "Equipaje" },
    { value: "alimentacion", label: "Alimentación" },
    { value: "alojamiento", label: "Alojamiento" },
    { value: "traslados", label: "Traslados" },
    { value: "excursiones", label: "Excursiones" },
    { value: "seguro", label: "Seguro" },
    { value: "contacto de urgencia", label: "Contacto de Urgencia" },
    { value: "otros", label: "Otros" },
  ];

  // Estados del formulario
  const [formData, setFormData] = useState({
    // Datos del cliente
    cliente_fecha_nacimiento: "",
    cliente_tipo_documento: "cc",
    cliente_documento_identidad: "",
    cliente_direccion: "",
    cliente_ciudad: "",
    cliente_pais: "Colombia",
    cliente_nacionalidad: "Colombiana",
    cliente_codigo_postal: "",

    // Datos del contrato
    fecha_firma: "",
    observaciones: "",
    condiciones_especiales: "",
    contractItem: [
      {
        tipo: "",
        descripcion: "",
        detalle: "",
      },
    ],

    // Forma de pago
    forma_pago: "contado",
    tiene_cuota_inicial: false,
    cuota_inicial_porcentaje: 0,
    cuota_inicial_monto: 0,
    fecha_vencimiento_inicial: "",
    numero_cuotas_restantes: 0,
    monto_restante: 0,
    valor_cuota_restante: 0,
    fechas_vencimiento_cuotas: [],
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [convertingItems, setConvertingItems] = useState(false);
  const [showCalculationDetails, setShowCalculationDetails] = useState(true);
  const handleConvertQuoteToItems = async () => {
    console.log("🔄 INICIANDO conversión de cotización a items...");
    console.log("📋 canConvert:", canConvert);
    console.log("📋 contract.contract.id:", contract.contract?.id);

    if (!canConvert) {
      console.log("❌ No se puede convertir - canConvert es false");
      return;
    }

    setConvertingItems(true);
    try {
      console.log("📤 Enviando dispatch para convertir items...");
      const result = await dispatch(
        convertQuoteToContractItems(contract.contract.id)
      ).unwrap();
      console.log("✅ Resultado de conversión:", result);

      // Recargar el contrato para ver los items generados
      console.log("🔄 Recargando contrato después de conversión...");
      const reloadedContract = await dispatch(fetchContractById(id));
      console.log("📋 Contrato recargado:", reloadedContract);

      alert("✅ Items del contrato generados exitosamente desde la cotización");
    } catch (error) {
      console.error("❌ Error completo convirtiendo cotización:", error);
      console.error("❌ Error message:", error.message);
      console.error("❌ Error stack:", error.stack);
      alert(`❌ Error: ${error.message || error}`);
    } finally {
      setConvertingItems(false);
      console.log("🏁 Proceso de conversión finalizado");
    }
  };

  const cleanDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    return isNaN(d.getTime()) ? null : d.toISOString();
  };

  const getDateInputValue = (date) => {
    const cleaned = cleanDate(date);
    return cleaned ? cleaned.split("T")[0] : "";
  };

  const getPassengers = () => {
    if (contract?.passengers_summary?.all_passengers) {
      return contract.passengers_summary.all_passengers;
    }
    if (contract?.contract?.Quote?.Passengers) {
      return contract.contract.Quote.Passengers;
    }
    return [];
  };

  const renderPassengersList = () => {
    const passengers = getPassengers();

    if (!passengers || passengers.length === 0) {
      return (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-sm">
            No hay información de pasajeros disponible
          </p>
        </div>
      );
    }

    const titularPassenger = passengers.find((p) => p.titular === true);
    const nonTitularPassengers = passengers.filter((p) => !p.titular);

    return (
      <div className="mt-4 space-y-3">
        {/* Pasajero Titular */}
        {titularPassenger && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <FontAwesomeIcon
                icon={faCrown}
                className="text-blue-600 text-sm"
              />
              <span className="font-medium text-blue-900 text-sm">Titular</span>
            </div>
            <div className="text-sm">
              <p className="font-semibold text-gray-900">
                {titularPassenger.nombre} {titularPassenger.apellido}
              </p>
              <p className="text-gray-600">
                {titularPassenger.tipo_documento?.toUpperCase()}:{" "}
                {titularPassenger.documento_identidad}
              </p>
              <p className="text-gray-600">
                {new Date(titularPassenger.fecha_nacimiento).toLocaleDateString(
                  "es-ES"
                )}
              </p>
            </div>
          </div>
        )}

        {/* Otros Pasajeros */}
        {nonTitularPassengers.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">
              Acompañantes ({nonTitularPassengers.length})
            </p>
            {nonTitularPassengers.map((passenger, index) => (
              <div
                key={passenger.id}
                className="bg-gray-50 border border-gray-200 rounded-lg p-3"
              >
                <div className="text-sm">
                  <p className="font-medium text-gray-900">
                    {passenger.nombre} {passenger.apellido}
                  </p>
                  <p className="text-gray-600">
                    {passenger.tipo_documento?.toUpperCase()}:{" "}
                    {passenger.documento_identidad}
                  </p>
                  <p className="text-gray-600">
                    {new Date(passenger.fecha_nacimiento).toLocaleDateString(
                      "es-ES"
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    if (id) {
      dispatch(fetchContractById(id));
    }
  }, [dispatch, id]);

  // ✅ CORREGIR: Inicialización del formulario
  useEffect(() => {
    if (contract && contract.contract) {
      const contractData = contract.contract;
      console.log("🔍 Inicializando formulario con contractData:");

      setFormData((prev) => ({
        ...prev,
        // ✅ DATOS DEL CLIENTE
        cliente_fecha_nacimiento: getDateInputValue(
          contractData.Cliente?.fecha_nacimiento
        ),
        cliente_documento_identidad:
          contractData.Cliente?.documento_identidad ||
          contractData.Quote?.Passengers?.find((p) => p.titular)
            ?.documento_identidad ||
          "",
        cliente_tipo_documento: contractData.Cliente?.tipo_documento || "cc",
        cliente_direccion: contractData.Cliente?.direccion || "",
        cliente_ciudad: contractData.Cliente?.ciudad || "",
        cliente_pais: contractData.Cliente?.pais || "Colombia",
        cliente_nacionalidad: contractData.cliente_nacionalidad || "Colombiana",
        cliente_codigo_postal: contractData.cliente_codigo_postal || "",

        // Datos del contrato
        fecha_firma: getDateInputValue(contractData.fecha_firma),
        observaciones: contractData.observaciones || "",
        condiciones_especiales: contractData.condiciones_especiales || "",

        // ✅ FORMA DE PAGO
        forma_pago: contractData.forma_pago,
        tiene_cuota_inicial: contractData.tiene_cuota_inicial,
        cuota_inicial_porcentaje: contractData.cuota_inicial_porcentaje || 0,
        cuota_inicial_monto: contractData.cuota_inicial_monto || 0,
        fecha_vencimiento_inicial: getDateInputValue(
          contractData.fecha_vencimiento_inicial
        ),
        numero_cuotas_restantes: contractData.numero_cuotas_restantes || 3,
        monto_restante:
          contractData.monto_restante || parseFloat(contractData.precio_total),
        valor_cuota_restante:
          contractData.valor_cuota_restante ||
          parseFloat(contractData.precio_total) / 3,
        fechas_vencimiento_cuotas: Array.isArray(
          contractData.fechas_vencimiento_cuotas
        )
          ? contractData.fechas_vencimiento_cuotas.map(getDateInputValue)
          : [],
      }));

      console.log("✅ FormData inicializado con datos reales");
    }
  }, [contract]);

  // ✅ FUNCIÓN: Generar fechas de vencimiento de cuotas
  const generatePaymentDates = (numCuotas) => {
    const fechaInicioViaje = contract?.contract?.fecha_inicio_viaje;
    if (!fechaInicioViaje || numCuotas < 1) {
      // fallback a la lógica anterior
      const fechas = [];
      const fechaBase = new Date();
      for (let i = 1; i <= numCuotas; i++) {
        const fecha = new Date(fechaBase);
        fecha.setMonth(fecha.getMonth() + i);
        fechas.push(fecha.toISOString().split("T")[0]);
      }
      setFormData((prev) => ({
        ...prev,
        fechas_vencimiento_cuotas: fechas,
        numero_cuotas_restantes: numCuotas,
      }));
      return;
    }

    const fechas = [];
    const fechaUltimaCuota = new Date(fechaInicioViaje);
    fechaUltimaCuota.setDate(fechaUltimaCuota.getDate() - 30);

    const fechaHoy = new Date();
    fechaHoy.setHours(0, 0, 0, 0); // Solo fecha, sin hora

    const fechaLimite =
      fechaUltimaCuota < fechaHoy ? fechaHoy : fechaUltimaCuota;

    const fechaPrimeraCuota = fechaHoy;
    const diffTime = fechaUltimaCuota.getTime() - fechaPrimeraCuota.getTime();
    const diasDisponibles = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    let cuotas = numCuotas;
    if (cuotas > 1 && diasDisponibles < cuotas - 1) {
      cuotas = Math.max(1, diasDisponibles + 1);
    }

    if (cuotas <= 1) {
      // Si la fecha límite ya pasó, usa hoy
      fechas.push(fechaLimite.toISOString().split("T")[0]);
    } else {
      const intervalo = diffTime / (cuotas - 1);
      for (let i = 0; i < cuotas; i++) {
        const fecha = new Date(fechaPrimeraCuota.getTime() + intervalo * i);
        fechas.push(fecha.toISOString().split("T")[0]);
      }
    }

    setFormData((prev) => ({
      ...prev,
      fechas_vencimiento_cuotas: fechas,
      numero_cuotas_restantes: cuotas,
    }));
  };

  // ✅ FUNCIÓN: Actualizar fecha de cuota específica
  const updatePaymentDate = (index, newDate) => {
    const newDates = [...formData.fechas_vencimiento_cuotas];
    newDates[index] = newDate;

    setFormData((prev) => ({
      ...prev,
      fechas_vencimiento_cuotas: newDates,
    }));
  };

  // ✅ CORREGIR: Función para manejar cambios en el formulario
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Limpiar error del campo
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }

    // ✅ CORREGIR: Usar contract.contract.precio_total
    const precioTotal = parseFloat(contract.contract?.precio_total || 0);

    // Cálculos automáticos para forma de pago
    if (field === "forma_pago") {
      if (value === "contado") {
        setFormData((prev) => ({
          ...prev,
          tiene_cuota_inicial: false,
          numero_cuotas_restantes: 0,
          fechas_vencimiento_cuotas: [],
          monto_restante: precioTotal,
          valor_cuota_restante: 0,
        }));
      } else if (value === "cuotas") {
        // ✅ CONFIGURAR: Valores por defecto para cuotas
        setFormData((prev) => ({
          ...prev,
          numero_cuotas_restantes: 3,
          monto_restante: precioTotal,
          valor_cuota_restante: precioTotal / 3,
        }));

        // ✅ GENERAR: Fechas automáticamente
        generatePaymentDates(3);
      }
    }

    if (field === "tiene_cuota_inicial") {
      if (!value) {
        // ✅ Si no tiene cuota inicial, todo el monto va a cuotas
        setFormData((prev) => ({
          ...prev,
          cuota_inicial_porcentaje: 0,
          cuota_inicial_monto: 0,
          fecha_vencimiento_inicial: "",
          monto_restante: precioTotal,
          valor_cuota_restante:
            prev.numero_cuotas_restantes > 0
              ? precioTotal / prev.numero_cuotas_restantes
              : 0,
        }));
      } else {
        // ✅ Si tiene cuota inicial, configurar 30% por defecto
        const porcentajeDefault = 30;
        const montoInicial = (precioTotal * porcentajeDefault) / 100;
        const montoRestante = precioTotal - montoInicial;

        setFormData((prev) => ({
          ...prev,
          cuota_inicial_porcentaje: porcentajeDefault,
          cuota_inicial_monto: montoInicial,
          monto_restante: montoRestante,
          valor_cuota_restante:
            prev.numero_cuotas_restantes > 0
              ? montoRestante / prev.numero_cuotas_restantes
              : 0,
        }));
      }
    }

    // ✅ NUEVO: Cálculo cuando cambia el porcentaje de cuota inicial
    if (field === "cuota_inicial_porcentaje") {
      const porcentaje = parseFloat(value || 0);
      const montoInicial = (precioTotal * porcentaje) / 100;
      const montoRestante = precioTotal - montoInicial;

      setFormData((prev) => ({
        ...prev,
        cuota_inicial_monto: montoInicial,
        monto_restante: montoRestante,
        valor_cuota_restante:
          prev.numero_cuotas_restantes > 0
            ? montoRestante / prev.numero_cuotas_restantes
            : 0,
      }));
    }

    // ✅ NUEVO: Cálculo cuando cambia el monto de cuota inicial directamente
    if (field === "cuota_inicial_monto") {
      const montoInicial = parseFloat(value || 0);
      const porcentaje =
        precioTotal > 0 ? (montoInicial / precioTotal) * 100 : 0;
      const montoRestante = precioTotal - montoInicial;

      setFormData((prev) => ({
        ...prev,
        cuota_inicial_porcentaje: porcentaje,
        monto_restante: montoRestante,
        valor_cuota_restante:
          prev.numero_cuotas_restantes > 0
            ? montoRestante / prev.numero_cuotas_restantes
            : 0,
      }));
    }

    // ✅ CORREGIR: Cuando cambia el número de cuotas
    if (field === "numero_cuotas_restantes") {
      const numCuotas = parseInt(value) || 0;
      const montoRestante = formData.monto_restante || precioTotal;
      const valorCuota = numCuotas > 0 ? montoRestante / numCuotas : 0;

      setFormData((prev) => ({
        ...prev,
        valor_cuota_restante: valorCuota,
      }));

      // ✅ GENERAR: Fechas de vencimiento automáticamente
      if (numCuotas > 0) {
        generatePaymentDates(numCuotas);
      } else {
        setFormData((prev) => ({
          ...prev,
          fechas_vencimiento_cuotas: [],
        }));
      }
    }

    // ✅ NUEVO: Cuando cambia el valor de cuota directamente
    if (field === "valor_cuota_restante") {
      const valorCuota = parseFloat(value || 0);
      const numCuotas = formData.numero_cuotas_restantes || 0;
      const nuevoMontoRestante = valorCuota * numCuotas;
      const nuevaSeña = precioTotal - nuevoMontoRestante;
      const nuevoPorcentaje =
        precioTotal > 0 ? (nuevaSeña / precioTotal) * 100 : 0;

      setFormData((prev) => ({
        ...prev,
        monto_restante: nuevoMontoRestante,
        cuota_inicial_monto: nuevaSeña >= 0 ? nuevaSeña : 0,
        cuota_inicial_porcentaje: nuevoPorcentaje >= 0 ? nuevoPorcentaje : 0,
      }));
    }
  };

  // ✅ VALIDACIÓN: Función de validación del formulario
  const validateForm = () => {
    const newErrors = {};

    if (formData.forma_pago === "cuotas") {
      if (formData.tiene_cuota_inicial && !formData.fecha_vencimiento_inicial) {
        newErrors.fecha_vencimiento_inicial =
          "La fecha de vencimiento de la cuota inicial es requerida";
      }

      if (formData.numero_cuotas_restantes <= 0) {
        newErrors.numero_cuotas_restantes =
          "Debe especificar el número de cuotas";
      }

      if (
        formData.fechas_vencimiento_cuotas.length !==
        formData.numero_cuotas_restantes
      ) {
        newErrors.fechas_vencimiento_cuotas =
          "Debe especificar todas las fechas de vencimiento";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ CORREGIR: Función para guardar el contrato
  // ✅ CORREGIR: Función para guardar el contrato
const handleSave = async () => {
  if (!validateForm()) {
    return;
  }

  setSaving(true);
  try {
    // ✅ PASO 1: Actualizar contrato
    console.log("📝 Actualizando contrato...");
    console.log("📋 FormData a enviar:", formData);
    
    await dispatch(
      updateContract({
        id: contract.contract.id,
        updates: formData,
      })
    ).unwrap();

    console.log("✅ Contrato actualizado exitosamente");

    // ✅ PASO 2: Generar PDF automáticamente
    console.log("📄 Generando PDF del contrato...");
    try {
      const pdfResult = await dispatch(
        generateContractPDF(contract.contract.id)
      ).unwrap();

      console.log("✅ PDF generado exitosamente:", pdfResult);
      alert("✅ Contrato actualizado y PDF generado exitosamente");
    } catch (pdfError) {
      console.error("⚠️ Error generando PDF:", pdfError);
      alert(
        "✅ Contrato actualizado, pero hubo un error generando el PDF. Puede generarlo manualmente."
      );
    }

    // ✅ PASO 3: Navegar de vuelta
    navigate(`/contractsList`);
  } catch (error) {
    console.error("❌ Error saving contract:", error);
    alert(`❌ Error al guardar: ${error.message || error}`);
  } finally {
    setSaving(false);
  }
};
  if (loading && !contract) {
    return (
      <div className="flex justify-center items-center h-64">
        <FontAwesomeIcon
          icon={faSpinner}
          spin
          size="2x"
          className="text-blue-500"
        />
        <span className="ml-3 text-lg">Cargando contrato...</span>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="text-center p-8">
        <FontAwesomeIcon
          icon={faExclamationTriangle}
          className="text-red-500 text-4xl mb-4"
        />
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Contrato no encontrado
        </h2>
        <button
          onClick={() => navigate("/contractsList")}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Volver a la lista
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* ✅ 1. HEADER - Debe ir PRIMERO */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/contractsList")}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Editar Contrato
            </h1>
            <p className="text-gray-600">
              {contract.contract?.contract_number}
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          {saving ? (
            <FontAwesomeIcon icon={faSpinner} spin />
          ) : (
            <FontAwesomeIcon icon={faSave} />
          )}
          {saving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>

      {/* ✅ 2. DASHBOARD DE COTIZACIÓN - Después del header */}
      {calculationAnalysis && (
        <div className="mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold mb-2">
                  📊 Análisis de Cotización
                </h2>
                <p className="text-blue-100">
                  {calculationAnalysis.total_items_potenciales} items
                  disponibles •{calculationAnalysis.items_requieren_compra}{" "}
                  requieren compra • Valor total: $
                  {calculationAnalysis.valor_total_compras.toLocaleString()}
                </p>
              </div>
              <button
                onClick={() =>
                  setShowCalculationDetails(!showCalculationDetails)
                }
                className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors"
              >
                {showCalculationDetails ? "🔽 Ocultar" : "🔼 Mostrar"} Detalles
              </button>
            </div>
          </div>
{showCalculationDetails && (
  <div className="grid grid-cols-1 gap-6 mb-6">
    {/* Items completos del cálculo */}
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        📋 Detalles Completos del Cálculo
        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
          {calculationAnalysis.total_items_potenciales} items analizados
        </span>
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {calculationAnalysis.items_detallados.map((item, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 ${
              item.requiere_compra 
                ? 'border-orange-200 bg-orange-50' 
                : 'border-blue-200 bg-blue-50'
            }`}
          >
            {/* Header del item */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  item.tipo === 'tickets' ? 'bg-red-100 text-red-800' :
                  item.tipo === 'hotel' ? 'bg-green-100 text-green-800' :
                  item.tipo === 'traslados' ? 'bg-yellow-100 text-yellow-800' :
                  item.tipo === 'seguros' ? 'bg-purple-100 text-purple-800' :
                  item.tipo === 'comisiones' ? 'bg-gray-100 text-gray-800' :
                  'bg-indigo-100 text-indigo-800'
                }`}>
                  {item.tipo.toUpperCase()}
                </span>
                
                <span className={`px-2 py-1 rounded text-xs ${
                  item.prioridad === 'critica' ? 'bg-red-100 text-red-800' :
                  item.prioridad === 'alta' ? 'bg-orange-100 text-orange-800' :
                  item.prioridad === 'media' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {item.prioridad}
                </span>
              </div>

              <span className={`font-bold text-lg ${
                item.requiere_compra ? 'text-orange-600' : 'text-blue-600'
              }`}>
                ${item.valor.toLocaleString()}
              </span>
            </div>

            {/* Descripción principal */}
            <h4 className="font-semibold text-gray-900 mb-2">
              {item.descripcion}
            </h4>

            {/* Detalles específicos por tipo */}
            <div className="text-sm text-gray-700 space-y-1">
              {/* TICKETS */}
              {item.tipo === 'tickets' && item.detalles && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div><strong>Origen:</strong> {item.detalles.origen}</div>
                    <div><strong>Destino:</strong> {item.detalles.destino}</div>
                    <div><strong>Tipo:</strong> {item.detalles.tipo === 'ida_vuelta' ? 'Ida y Vuelta' : 'Solo Ida'}</div>
                    <div><strong>Proveedor:</strong> {item.detalles.proveedor || 'No especificado'}</div>
                  </div>
                  <div className="mt-2 pt-2 border-t">
                    <div><strong>Fecha ida:</strong> {new Date(item.detalles.fecha_ida).toLocaleDateString('es-ES')}</div>
                    {item.detalles.fecha_vuelta && (
                      <div><strong>Fecha vuelta:</strong> {new Date(item.detalles.fecha_vuelta).toLocaleDateString('es-ES')}</div>
                    )}
                  </div>
                </>
              )}

              {/* HOTEL */}
              {item.tipo === 'hotel' && item.detalles && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div><strong>Hotel:</strong> {item.detalles.nombre || 'No especificado'}</div>
                    <div><strong>Categoría:</strong> {item.detalles.categoria}</div>
                    <div><strong>Acomodación:</strong> {item.detalles.acomodacion}</div>
                    <div><strong>Noches:</strong> {item.detalles.noches}</div>
                  </div>
                  <div className="mt-2 pt-2 border-t">
                    <div><strong>Costo por noche:</strong> ${Number(item.detalles.costo_noche).toLocaleString()}</div>
                    {item.detalles.ubicacion && (
                      <div><strong>Ubicación:</strong> {item.detalles.ubicacion}</div>
                    )}
                    {item.detalles.proveedor && (
                      <div><strong>Proveedor:</strong> {item.detalles.proveedor}</div>
                    )}
                  </div>
                </>
              )}

              {/* TRASLADOS */}
              {item.tipo === 'traslados' && item.detalles && (
                <>
                  <div className="space-y-1">
                    {item.detalles.aeropuerto_hotel_ida?.incluido && (
                      <div className="flex justify-between">
                        <span>Aeropuerto → Hotel:</span>
                        <span className="font-medium">${Number(item.detalles.aeropuerto_hotel_ida.costo).toLocaleString()}</span>
                      </div>
                    )}
                    {item.detalles.hotel_aeropuerto_vuelta?.incluido && (
                      <div className="flex justify-between">
                        <span>Hotel → Aeropuerto:</span>
                        <span className="font-medium">${Number(item.detalles.hotel_aeropuerto_vuelta.costo).toLocaleString()}</span>
                      </div>
                    )}
                    {item.detalles.otros && item.detalles.otros.length > 0 && (
                      <div className="mt-2 pt-2 border-t">
                        <strong>Otros traslados:</strong>
                        {item.detalles.otros.map((traslado, idx) => (
                          <div key={idx} className="text-xs">
                            • {traslado.descripcion}: ${traslado.costo.toLocaleString()}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* SEGUROS */}
              {item.tipo === 'seguros' && item.detalles && (
                <>
                  <div className="space-y-1">
                    {item.detalles.asistencia_medica && (
                      <div>
                        <strong>Asistencia médica:</strong> {item.detalles.asistencia_medica.tipo}
                        {item.detalles.asistencia_medica.proveedor && (
                          <span> - {item.detalles.asistencia_medica.proveedor}</span>
                        )}
                      </div>
                    )}
                    {item.detalles.cancelacion?.incluido && (
                      <div>
                        <strong>Seguro cancelación:</strong> ${Number(item.detalles.cancelacion.costo).toLocaleString()}
                        {item.detalles.cancelacion.proveedor && (
                          <span> - {item.detalles.cancelacion.proveedor}</span>
                        )}
                      </div>
                    )}
                    {item.detalles.otros && item.detalles.otros.length > 0 && (
                      <div className="mt-2 pt-2 border-t">
                        <strong>Otros seguros:</strong>
                        {item.detalles.otros.map((seguro, idx) => (
                          <div key={idx} className="text-xs">
                            • {seguro.descripcion}: ${seguro.costo.toLocaleString()}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* COMISIONES */}
              {item.tipo === 'comisiones' && item.detalles && (
                <>
                  <div className="space-y-1">
                    {Object.entries(item.detalles).map(([rol, comision]) => {
                      if (rol === 'total_comisiones' || !comision.total || comision.total === 0) return null;
                      return (
                        <div key={rol} className="flex justify-between">
                          <span className="capitalize">{rol}:</span>
                          <div className="text-right">
                            <div className="font-medium">${Number(comision.total).toLocaleString()}</div>
                            <div className="text-xs text-gray-500">
                              {comision.tipo_calculo === 'fixed_per_person' && `$${Number(comision.valor_por_persona).toLocaleString()}/persona`}
                              {comision.tipo_calculo === 'percentage' && `${comision.porcentaje}%`}
                              {comision.tipo_calculo === 'fixed_total' && 'Valor fijo'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* GANANCIA EMPRESA */}
              {item.tipo === 'ganancia_empresa' && item.detalles && (
                <>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Margen de ganancia:</span>
                      <span className="font-medium">{item.detalles.porcentaje}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Valor total:</span>
                      <span className="font-medium">${Number(item.detalles.total).toLocaleString()}</span>
                    </div>
                    {item.detalles.valor_fijo > 0 && (
                      <div className="flex justify-between">
                        <span>Valor fijo adicional:</span>
                        <span className="font-medium">${Number(item.detalles.valor_fijo).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer del item */}
            <div className="mt-3 pt-2 border-t flex items-center justify-between">
              <span className={`text-xs font-medium ${
                item.requiere_compra ? 'text-orange-700' : 'text-blue-700'
              }`}>
                {item.requiere_compra ? '🛒 Requiere compra' : 'ℹ️ Solo información'}
              </span>
              
              {item.requiere_compra && (
                <span className={`px-2 py-1 rounded text-xs ${
                  item.prioridad === 'critica' ? 'bg-red-100 text-red-700' :
                  item.prioridad === 'alta' ? 'bg-orange-100 text-orange-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {item.prioridad === 'critica' ? '🔴 Urgente' :
                   item.prioridad === 'alta' ? '🟠 Prioritario' : '🟡 Normal'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Resumen financiero expandido */}
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="font-semibold text-gray-900 mb-4">💰 Desglose Financiero Completo</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Costos base */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-red-800 mb-2">🛒 Costos Base</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Costo productos:</span>
              <span className="font-semibold">${calculationAnalysis.financials.costo_base.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Items a comprar:</span>
              <span className="font-semibold">${calculationAnalysis.valor_total_compras.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Comisiones */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">💼 Comisiones</h4>
          <div className="space-y-1 text-sm">
            {contract.contract.Quote.Calculation.comisiones && Object.entries(contract.contract.Quote.Calculation.comisiones)
              .filter(([key, value]) => key !== 'total_comisiones' && value.total > 0)
              .map(([rol, comision]) => (
                <div key={rol} className="flex justify-between">
                  <span className="capitalize">{rol}:</span>
                  <span className="font-semibold">${Number(comision.total).toLocaleString()}</span>
                </div>
              ))
            }
            <div className="border-t pt-1 mt-2">
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>${calculationAnalysis.financials.total_comisiones.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ganancia */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 mb-2">📈 Ganancia</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Margen:</span>
              <span className="font-semibold">{contract.contract.Quote.Calculation.ganancia.porcentaje}%</span>
            </div>
            <div className="flex justify-between">
              <span>Valor:</span>
              <span className="font-semibold">${calculationAnalysis.financials.total_ganancia.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Total final */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-semibold text-purple-800 mb-2">💰 Total Final</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Precio total:</span>
              <span className="font-bold text-lg text-purple-700">
                ${calculationAnalysis.financials.precio_final_total.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Por persona:</span>
              <span>${(calculationAnalysis.financials.precio_final_total / contract.numero_pasajeros).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metadata adicional */}
      {calculationAnalysis.calculation_metadata && (
        <div className="mt-4 pt-4 border-t bg-gray-50 rounded-lg p-3">
          <h5 className="font-semibold text-gray-800 mb-2">📊 Información del Cálculo</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Estado:</span>
              <span className="ml-2 font-medium capitalize">{calculationAnalysis.calculation_metadata.estado}</span>
            </div>
            <div>
              <span className="text-gray-600">Personas:</span>
              <span className="ml-2 font-medium">{calculationAnalysis.calculation_metadata.num_personas}</span>
            </div>
            <div>
              <span className="text-gray-600">Duración:</span>
              <span className="ml-2 font-medium">{contract.trip_details?.duracion_dias} días</span>
            </div>
          </div>
          {calculationAnalysis.calculation_metadata.observaciones && (
            <div className="mt-2">
              <span className="text-gray-600">Observaciones:</span>
              <p className="text-sm text-gray-800 mt-1">{calculationAnalysis.calculation_metadata.observaciones}</p>
            </div>
          )}
        </div>
      )}
    </div>
  </div>
)}
          {/* Detalles expandibles */}
          {showCalculationDetails && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              {/* Items que requieren compra */}
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  🛒 Items que requieren compra (
                  {calculationAnalysis.items_requieren_compra})
                </h3>
                <div className="space-y-2">
                  {calculationAnalysis.items_detallados
                    .filter((item) => item.requiere_compra)
                    .map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded"
                      >
                        <div>
                          <span className="font-medium">
                            {item.descripcion}
                          </span>
                          <span
                            className={`ml-2 px-2 py-1 rounded text-xs ${
                              item.prioridad === "critica"
                                ? "bg-red-100 text-red-800"
                                : item.prioridad === "alta"
                                ? "bg-orange-100 text-orange-800"
                                : item.prioridad === "media"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {item.prioridad}
                          </span>
                        </div>
                        <span className="font-semibold text-green-600">
                          ${item.valor.toLocaleString()}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Resumen financiero */}
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  💰 Resumen Financiero
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Precio final cotizado:</span>
                    <span className="font-semibold">
                      $
                      {calculationAnalysis.financials.precio_final_total.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Costo base productos:</span>
                    <span>
                      $
                      {calculationAnalysis.valor_total_compras.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total comisiones:</span>
                    <span>
                      $
                      {calculationAnalysis.financials.total_comisiones.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ganancia empresa:</span>
                    <span>
                      $
                      {calculationAnalysis.financials.total_ganancia.toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Margen bruto:</span>
                      <span className="text-green-600">
                        {financialSummary?.margen_bruto}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botón de conversión */}
          {conversionStatus &&
            !conversionStatus.items_generated &&
            canConvert && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-yellow-800 mb-1">
                      🔄 Convertir cotización a items del contrato
                    </h4>
                    <p className="text-yellow-700 text-sm">
                      Los items de la cotización aún no se han convertido a
                      items del contrato. Esto generará{" "}
                      {calculationAnalysis.items_requieren_compra} items que
                      requieren compra.
                    </p>
                  </div>
                  <button
                    onClick={handleConvertQuoteToItems}
                    disabled={convertingItems}
                    className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    {convertingItems ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} spin />
                        Convirtiendo...
                      </>
                    ) : (
                      <>🔄 Convertir Items</>
                    )}
                  </button>
                </div>
              </div>
            )}

          {/* Estado de items generados */}
          {conversionStatus?.items_generated && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-green-800 mb-1 flex items-center gap-2">
                ✅ Items del contrato generados
              </h4>
              <p className="text-green-700 text-sm">
                Se han generado {contract.contract_items_analysis?.total || 0}{" "}
                items del contrato. Ahora puedes gestionar las compras de cada
                item.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ✅ 3. SECCIÓN DE ITEMS DEL CONTRATO - Independiente */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FontAwesomeIcon icon={faFileContract} className="text-blue-500" />
          Items del Contrato
          {contract.contract_items_analysis && (
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
              {contract.contract_items_analysis.total} items
            </span>
          )}
        </h3>

        {/* Si hay items generados desde cotización */}
        {contract.contract_items_analysis?.total > 0 ? (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">
                📋 Items generados desde cotización:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Total items:</span>
                  <span className="font-semibold ml-1">
                    {contract.contract_items_analysis.total}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">Requieren compra:</span>
                  <span className="font-semibold ml-1">
                    {contract.contract_items_analysis.requieren_compra}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">Valor cotizado:</span>
                  <span className="font-semibold ml-1">
                    $
                    {contract.contract_items_analysis.valor_total_cotizado.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600">
              💡 Los items del contrato han sido generados automáticamente desde
              la cotización. Puedes gestionarlos desde el módulo de gestión de
              compras.
            </p>
          </div>
        ) : (
          /* Items manuales como backup */
          <>
            {formData.contractItem.map((item, idx) => (
              <div key={idx} className="mb-6 border-b pb-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FontAwesomeIcon
                    icon={faFileContract}
                    className="text-blue-500"
                  />
                  Item del contrato #{idx + 1}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo *
                    </label>
                    <select
                      value={item.tipo}
                      onChange={(e) => {
                        const newItems = [...formData.contractItem];
                        newItems[idx].tipo = e.target.value;
                        setFormData({ ...formData, contractItem: newItems });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Seleccione tipo</option>
                      {CONTRACT_ITEM_TYPES.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción *
                    </label>
                    <input
                      type="text"
                      value={item.descripcion}
                      onChange={(e) => {
                        const newItems = [...formData.contractItem];
                        newItems[idx].descripcion = e.target.value;
                        setFormData({ ...formData, contractItem: newItems });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Detalle
                    </label>
                    <input
                      type="text"
                      value={item.detalle}
                      onChange={(e) => {
                        const newItems = [...formData.contractItem];
                        newItems[idx].detalle = e.target.value;
                        setFormData({ ...formData, contractItem: newItems });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
                {formData.contractItem.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const newItems = formData.contractItem.filter(
                        (_, i) => i !== idx
                      );
                      setFormData({ ...formData, contractItem: newItems });
                    }}
                    className="mt-2 text-red-500 text-sm"
                  >
                    Eliminar ítem
                  </button>
                )}
              </div>
            ))}

            {/* Botón para agregar item manual */}
            <button
              type="button"
              onClick={() =>
                setFormData({
                  ...formData,
                  contractItem: [
                    ...formData.contractItem,
                    { tipo: "", descripcion: "", detalle: "" },
                  ],
                })
              }
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              ➕ Agregar ítem manual
            </button>
          </>
        )}
      </div>

      {/* ✅ 4. GRID PRINCIPAL - Información del viaje + Formulario */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda - Información del viaje */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FontAwesomeIcon
                icon={faMapMarkerAlt}
                className="text-blue-500"
              />
              Información del Viaje
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Destino
                </label>
                <p className="text-gray-900">
                  {contract.contract?.Quote?.destino}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Origen
                </label>
                <p className="text-gray-900">
                  {contract.contract?.Quote?.origen}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fecha de inicio
                </label>
                <p className="text-gray-900">
                  {new Date(
                    contract.contract?.fecha_inicio_viaje
                  ).toLocaleDateString("es-ES")}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fecha de fin
                </label>
                <p className="text-gray-900">
                  {new Date(
                    contract.contract?.fecha_fin_viaje
                  ).toLocaleDateString("es-ES")}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Número de personas
                </label>
                <p className="text-gray-900">
                  {contract.contract?.Quote?.numero_personas}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Precio total
                </label>
                <p className="text-2xl font-bold text-blue-600">
                  $
                  {parseFloat(contract.contract?.precio_total).toLocaleString()}
                </p>
              </div>

              {/* Información de pasajeros */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FontAwesomeIcon icon={faUsers} className="mr-2" />
                  Pasajeros
                </label>
                {renderPassengersList()}
              </div>
            </div>
          </div>

          {/* Resumen de pagos */}
          {formData.forma_pago === "cuotas" && (
            <div className="bg-blue-50 rounded-lg shadow-md p-6">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <FontAwesomeIcon
                  icon={faDollarSign}
                  className="text-blue-600"
                />
                📊 Resumen de Pagos
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total del viaje:</span>
                  <span className="font-semibold">
                    $
                    {parseFloat(
                      contract.contract?.precio_total || 0
                    ).toLocaleString()}
                  </span>
                </div>
                {formData.tiene_cuota_inicial && (
                  <div className="flex justify-between text-blue-700">
                    <span>
                      Cuota Inicial (
                      {Number(formData.cuota_inicial_porcentaje || 0).toFixed(
                        1
                      )}
                      %):
                    </span>
                    <span className="font-semibold">
                      $
                      {Number(
                        formData.cuota_inicial_monto || 0
                      ).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>En {formData.numero_cuotas_restantes} cuotas:</span>
                  <span className="font-semibold">
                    ${parseFloat(formData.monto_restante || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>Valor por cuota:</span>
                  <span className="font-bold text-blue-700">
                    $
                    {parseFloat(
                      formData.valor_cuota_restante || 0
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Columna derecha - Formulario principal */}
        <div className="lg:col-span-2">
          <div className="space-y-6">
            {/* Datos del cliente */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faUser} className="text-blue-500" />
                Datos del Cliente
              </h3>

              {/* Información actual del cliente */}
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h4 className="font-semibold text-blue-900 mb-2">
                  Información actual del cliente:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <p>
                    <strong>Nombre:</strong> {contract.contract?.Cliente?.name}{" "}
                    {contract.contract?.Cliente?.lastname}
                  </p>
                  <p>
                    <strong>Email:</strong> {contract.contract?.Cliente?.email}
                  </p>
                  <p>
                    <strong>Teléfono:</strong>{" "}
                    {contract.contract?.Cliente?.phone}
                  </p>
                  <p>
                    <strong>Documento titular:</strong>{" "}
                    {contract.contract?.Quote?.Passengers?.find(
                      (p) => p.titular
                    )
                      ? `${
                          contract.contract.Quote.Passengers.find(
                            (p) => p.titular
                          ).tipo_documento?.toUpperCase() || ""
                        } ${
                          contract.contract.Quote.Passengers.find(
                            (p) => p.titular
                          ).documento_identidad || ""
                        }`
                      : `${
                          contract.contract?.Cliente?.tipo_documento?.toUpperCase() ||
                          ""
                        } ${
                          contract.contract?.Cliente?.documento_identidad || ""
                        }`}
                  </p>
                </div>
              </div>
            </div>

            {/* Forma de pago */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FontAwesomeIcon
                  icon={faCreditCard}
                  className="text-blue-500"
                />
                Forma de Pago
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de pago
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="forma_pago"
                        value="contado"
                        checked={formData.forma_pago === "contado"}
                        onChange={(e) =>
                          handleInputChange("forma_pago", e.target.value)
                        }
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium">Pago de Contado</div>
                        <div className="text-sm text-gray-600">
                          Pago único completo
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="forma_pago"
                        value="cuotas"
                        checked={formData.forma_pago === "cuotas"}
                        onChange={(e) =>
                          handleInputChange("forma_pago", e.target.value)
                        }
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium">Pago en Cuotas</div>
                        <div className="text-sm text-gray-600">
                          Pago fraccionado
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Configuración de cuotas */}
                {formData.forma_pago === "cuotas" && (
                  <div className="space-y-4 border-t pt-4">
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.tiene_cuota_inicial}
                          onChange={(e) =>
                            handleInputChange(
                              "tiene_cuota_inicial",
                              e.target.checked
                            )
                          }
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Tiene cuota inicial (seña)
                        </span>
                      </label>
                    </div>

                    {formData.tiene_cuota_inicial && (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pl-6 border-l-2 border-blue-200">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Porcentaje (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={formData.cuota_inicial_porcentaje}
                            onChange={(e) =>
                              handleInputChange(
                                "cuota_inicial_porcentaje",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Monto ($)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.cuota_inicial_monto}
                            onChange={(e) =>
                              handleInputChange(
                                "cuota_inicial_monto",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fecha de vencimiento *
                          </label>
                          <input
                            type="date"
                            value={formData.fecha_vencimiento_inicial}
                            onChange={(e) =>
                              handleInputChange(
                                "fecha_vencimiento_inicial",
                                e.target.value
                              )
                            }
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors.fecha_vencimiento_inicial
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          />
                          {errors.fecha_vencimiento_inicial && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.fecha_vencimiento_inicial}
                            </p>
                          )}
                        </div>

                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs text-gray-600">
                            <div>
                              Total: $
                              {parseFloat(
                                contract.contract?.precio_total || 0
                              ).toLocaleString()}
                            </div>
                            <div>
                              Seña: $
                              {parseFloat(
                                formData.cuota_inicial_monto || 0
                              ).toLocaleString()}
                            </div>
                            <div>
                              Restante: $
                              {parseFloat(
                                formData.monto_restante || 0
                              ).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Número de cuotas *
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="12"
                          value={formData.numero_cuotas_restantes}
                          onChange={(e) =>
                            handleInputChange(
                              "numero_cuotas_restantes",
                              e.target.value
                            )
                          }
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.numero_cuotas_restantes
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                        />
                        {errors.numero_cuotas_restantes && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.numero_cuotas_restantes}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Monto restante ($)
                        </label>
                        <input
                          type="number"
                          value={parseFloat(
                            formData.monto_restante || 0
                          ).toFixed(2)}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Valor por cuota ($)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={parseFloat(
                            formData.valor_cuota_restante || 0
                          ).toFixed(2)}
                          onChange={(e) =>
                            handleInputChange(
                              "valor_cuota_restante",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Acciones
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            generatePaymentDates(
                              formData.numero_cuotas_restantes
                            )
                          }
                          className="w-full px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                        >
                          Regenerar Fechas
                        </button>
                      </div>
                    </div>

                    {/* Fechas de vencimiento de cuotas */}
                    {formData.numero_cuotas_restantes > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fechas de vencimiento de cuotas
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {formData.fechas_vencimiento_cuotas.map(
                            (fecha, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2"
                              >
                                <span className="text-sm font-medium text-gray-600 w-16">
                                  Cuota {index + 1}:
                                </span>
                                <input
                                  type="date"
                                  value={fecha}
                                  onChange={(e) =>
                                    updatePaymentDate(index, e.target.value)
                                  }
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                            )
                          )}
                        </div>
                        {errors.fechas_vencimiento_cuotas && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.fechas_vencimiento_cuotas}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Información adicional */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FontAwesomeIcon
                  icon={faFileContract}
                  className="text-blue-500"
                />
                Información Adicional
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de firma del contrato
                  </label>
                  <input
                    type="date"
                    value={formData.fecha_firma}
                    onChange={(e) =>
                      handleInputChange("fecha_firma", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condiciones especiales
                  </label>
                  <textarea
                    value={formData.condiciones_especiales}
                    onChange={(e) =>
                      handleInputChange(
                        "condiciones_especiales",
                        e.target.value
                      )
                    }
                    rows={3}
                    placeholder="Condiciones especiales acordadas..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observaciones
                  </label>
                  <textarea
                    value={formData.observaciones}
                    onChange={(e) =>
                      handleInputChange("observaciones", e.target.value)
                    }
                    rows={3}
                    placeholder="Observaciones adicionales..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ 5. BOTONES DE ACCIÓN FIJOS - Al final */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-10">
        <div className="container mx-auto max-w-6xl flex justify-end gap-4">
          <button
            onClick={() => navigate("/contractsList")}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            {saving ? (
              <FontAwesomeIcon icon={faSpinner} spin />
            ) : (
              <FontAwesomeIcon icon={faSave} />
            )}
            {saving ? "Guardando..." : "Guardar Contrato"}
          </button>
        </div>
      </div>

      {/* Espacio para evitar que el contenido se oculte detrás de los botones fijos */}
      <div className="h-20"></div>
    </div>
  );
};
export default ContractSet;
