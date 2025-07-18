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
} from "@fortawesome/free-solid-svg-icons";

import {
  fetchContractById,
  updateContract,
  selectCurrentContract,
  selectContractLoading,
} from "../../../redux/slices/contractSlice";

const ContractSet = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const contract = useSelector(selectCurrentContract);
  const loading = useSelector(selectContractLoading);
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

  const cleanDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

const getDateInputValue = (date) => {
  const cleaned = cleanDate(date);
  return cleaned ? cleaned.split("T")[0] : "";
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
      console.log(
        "🔍 Inicializando formulario con contractData:",
        contractData
      );

      setFormData((prev) => ({
        ...prev,
        // ✅ DATOS DEL CLIENTE
         cliente_fecha_nacimiento: getDateInputValue(contractData.Cliente?.fecha_nacimiento),
         cliente_documento_identidad: contractData.Cliente?.documento_identidad || "",
        cliente_tipo_documento: contractData.Cliente?.tipo_documento || "cc",
        cliente_direccion: contractData.Cliente?.direccion || "",
        cliente_ciudad: contractData.Cliente?.ciudad || "",
        cliente_pais: contractData.Cliente?.pais || "Colombia",
        cliente_nacionalidad: contractData.cliente_nacionalidad || "Colombiana",

        cliente_codigo_postal: contractData.cliente_codigo_postal || "",

        // ✅ DATOS DEL CONTRATO
        fecha_firma: getDateInputValue(contractData.fecha_firma),
        observaciones: contractData.observaciones || "",
        condiciones_especiales: contractData.condiciones_especiales || "",

        // ✅ FORMA DE PAGO
        forma_pago: contractData.forma_pago,
        tiene_cuota_inicial: contractData.tiene_cuota_inicial,
        cuota_inicial_porcentaje: contractData.cuota_inicial_porcentaje || 0,
        cuota_inicial_monto: contractData.cuota_inicial_monto || 0,
        fecha_vencimiento_inicial: getDateInputValue(contractData.fecha_vencimiento_inicial),
        numero_cuotas_restantes: contractData.numero_cuotas_restantes || 3,
        monto_restante:
          contractData.monto_restante || parseFloat(contractData.precio_total),
        valor_cuota_restante:
          contractData.valor_cuota_restante ||
          parseFloat(contractData.precio_total) / 3,
        fechas_vencimiento_cuotas: Array.isArray(contractData.fechas_vencimiento_cuotas)
    ? contractData.fechas_vencimiento_cuotas.map(getDateInputValue)
    : [],
}));

      console.log("✅ FormData inicializado con datos reales");
    }
  }, [contract]);

  // ✅ FUNCIÓN: Generar fechas de vencimiento de cuotas
  const generatePaymentDates = (numCuotas) => {
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

    // ✅ Validaciones de identificación
    if (!formData.cliente_fecha_nacimiento) {
      newErrors.cliente_fecha_nacimiento =
        "La fecha de nacimiento es requerida";
    }

    if (!formData.cliente_tipo_documento) {
      newErrors.cliente_tipo_documento = "El tipo de documento es requerido";
    }

    if (!formData.cliente_documento_identidad) {
      newErrors.cliente_documento_identidad =
        "El número de documento es requerido";
    }

    if (!formData.cliente_direccion) {
      newErrors.cliente_direccion = "La dirección es requerida";
    }

    if (!formData.cliente_ciudad) {
      newErrors.cliente_ciudad = "La ciudad es requerida";
    }

    // ✅ Validaciones de forma de pago
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
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      await dispatch(
        updateContract({
          id: contract.contract.id, // ✅ CORREGIR: Usar contract.contract.id
          updates: formData,
        })
      ).unwrap();

      alert("✅ Contrato actualizado exitosamente");
      navigate(`/contractsList`); // ✅ CORREGIR
    } catch (error) {
      console.error("Error saving contract:", error);
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
      {/* Header */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información del viaje (solo lectura) */}
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
            </div>
          </div>

          {/* ✅ AGREGAR: Resumen de pagos */}
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

        {/* Formulario principal */}
        <div className="lg:col-span-2">
          <div className="space-y-6">
            {/* Datos del cliente */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faUser} className="text-blue-500" />
                Datos del Cliente
              </h3>

              {/* ✅ AGREGAR: Información actual del cliente */}
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
                    <strong>Documento:</strong>{" "}
                    {contract.contract?.Cliente?.tipo_documento?.toUpperCase()}{" "}
                    {contract.contract?.Cliente?.documento_identidad}
                  </p>
                </div>
                <p className="text-sm text-blue-700 mt-2">
                  💡 Complete o actualice los campos adicionales necesarios para
                  el contrato
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ✅ ACTUALIZAR: Fecha de nacimiento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Nacimiento *
                  </label>
                  <input
                    type="date"
                    value={formData.cliente_fecha_nacimiento}
                    onChange={(e) =>
                      handleInputChange(
                        "cliente_fecha_nacimiento",
                        e.target.value
                      )
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.cliente_fecha_nacimiento
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.cliente_fecha_nacimiento && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.cliente_fecha_nacimiento}
                    </p>
                  )}
                </div>

                {/* ✅ NUEVO: Tipo de documento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Documento *
                  </label>
                  <select
                    value={formData.cliente_tipo_documento}
                    onChange={(e) =>
                      handleInputChange(
                        "cliente_tipo_documento",
                        e.target.value
                      )
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.cliente_tipo_documento
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  >
                    <option value="cc">Cédula de Ciudadanía (CC)</option>
                    <option value="ce">Cédula de Extranjería (CE)</option>
                    <option value="ti">Tarjeta de Identidad (TI)</option>
                    <option value="rc">Registro Civil (RC)</option>
                    <option value="passport">Pasaporte</option>
                    <option value="pep">
                      Permiso Especial de Permanencia (PEP)
                    </option>
                    <option value="ppt">
                      Permiso por Protección Temporal (PPT)
                    </option>
                    <option value="nit">
                      Número de Identificación Tributaria (NIT)
                    </option>
                    <option value="nuip">
                      Número Único de Identificación Personal (NUIP)
                    </option>
                    <option value="dni">
                      Documento Nacional de Identidad (DNI)
                    </option>
                    <option value="salvoconducto">Salvoconducto</option>
                    <option value="cedula_diplomatica">
                      Cédula Diplomática
                    </option>
                  </select>
                  {errors.cliente_tipo_documento && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.cliente_tipo_documento}
                    </p>
                  )}
                </div>

                {/* ✅ NUEVO: Número de documento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Documento *
                  </label>
                  <input
                    type="text"
                    value={formData.cliente_documento_identidad}
                    onChange={(e) =>
                      handleInputChange(
                        "cliente_documento_identidad",
                        e.target.value
                      )
                    }
                    placeholder="Ej: 12345678, AB123456, etc."
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.cliente_documento_identidad
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.cliente_documento_identidad && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.cliente_documento_identidad}
                    </p>
                  )}
                </div>

                {/* ✅ ACTUALIZAR: Nacionalidad */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nacionalidad
                  </label>
                  <select
                    value={formData.cliente_nacionalidad}
                    onChange={(e) =>
                      handleInputChange("cliente_nacionalidad", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Colombiana">Colombiana</option>
                    <option value="Argentina">Argentina</option>
                    <option value="Venezolana">Venezolana</option>
                    <option value="Ecuatoriana">Ecuatoriana</option>
                    <option value="Peruana">Peruana</option>
                    <option value="Brasileña">Brasileña</option>
                    <option value="Chilena">Chilena</option>
                    <option value="Uruguaya">Uruguaya</option>
                    <option value="Boliviana">Boliviana</option>
                    <option value="Paraguaya">Paraguaya</option>
                    <option value="Mexicana">Mexicana</option>
                    <option value="Española">Española</option>
                    <option value="Estadounidense">Estadounidense</option>
                    <option value="Otra">Otra</option>
                  </select>
                </div>

                {/* ✅ NUEVO: Teléfono de emergencia */}
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono de Emergencia
                  </label>
                  <input
                    type="tel"
                    value={formData.cliente_telefono_emergencia}
                    onChange={(e) =>
                      handleInputChange(
                        "cliente_telefono_emergencia",
                        e.target.value
                      )
                    }
                    placeholder="+57 300 123 4567"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div> */}

                {/* ✅ NUEVO: Contacto de emergencia */}
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contacto de Emergencia
                  </label>
                  <input
                    type="text"
                    value={formData.cliente_contacto_emergencia}
                    onChange={(e) =>
                      handleInputChange(
                        "cliente_contacto_emergencia",
                        e.target.value
                      )
                    }
                    placeholder="Nombre del contacto de emergencia"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div> */}

                {/* ✅ NUEVO: Dirección completa */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección *
                  </label>
                  <textarea
                    value={formData.cliente_direccion}
                    onChange={(e) =>
                      handleInputChange("cliente_direccion", e.target.value)
                    }
                    rows={2}
                    placeholder="Calle, carrera, número, barrio, localidad"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.cliente_direccion
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.cliente_direccion && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.cliente_direccion}
                    </p>
                  )}
                </div>

                {/* ✅ NUEVO: Ciudad */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ciudad *
                  </label>
                  <input
                    type="text"
                    value={formData.cliente_ciudad}
                    onChange={(e) =>
                      handleInputChange("cliente_ciudad", e.target.value)
                    }
                    placeholder="Ej: Bogotá, Medellín, Cali"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.cliente_ciudad
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.cliente_ciudad && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.cliente_ciudad}
                    </p>
                  )}
                </div>

                {/* ✅ NUEVO: País */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    País de Residencia
                  </label>
                  <select
                    value={formData.cliente_pais}
                    onChange={(e) =>
                      handleInputChange("cliente_pais", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Colombia">Colombia</option>
                    <option value="Argentina">Argentina</option>
                    <option value="Venezuela">Venezuela</option>
                    <option value="Ecuador">Ecuador</option>
                    <option value="Perú">Perú</option>
                    <option value="Brasil">Brasil</option>
                    <option value="Chile">Chile</option>
                    <option value="Uruguay">Uruguay</option>
                    <option value="Bolivia">Bolivia</option>
                    <option value="Paraguay">Paraguay</option>
                    <option value="México">México</option>
                    <option value="España">España</option>
                    <option value="Estados Unidos">Estados Unidos</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>
            </div>

            {formData.contractItem.map((item, idx) => (
              <div key={idx} className="mb-6 border-b pb-4">
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
                {/* Botón para eliminar el item si hay más de uno */}
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

            {/* Botón para agregar un nuevo item */}
            <button
              type="button"
              onClick={() =>
                setFormData({
                  ...formData,
                  contractItem: [
                    ...formData.contractItem,
                    {
                      tipo: "",
                      descripcion: "",
                      detalle: "",
                    },
                  ],
                })
              }
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
            >
              Agregar ítem
            </button>

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

                        {/* ✅ MONTO - AHORA EDITABLE */}
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

                        {/* ✅ RESUMEN */}
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

                      {/* ✅ VALOR POR CUOTA - AHORA EDITABLE */}
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

                      {/* ✅ BOTÓN PARA REGENERAR FECHAS */}
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

      {/* Botones de acción fijos */}
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
