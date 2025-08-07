import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createQuoteCalculation, upsertQuoteCalculation, fetchCalculationBaseData } from '../../../redux/slices/quoteCalculationSlice';
import { selectUser } from '../../../redux/slices/authSlice';
import { fetchCommissionsByTripType, selectConfiguredCommissions } from '../../../redux/slices/commissionSlice';

const AdvancedQuoteCalculator = ({ quote_id, 
  onContinue, 
  existingCalculation, 
  quoteData }) => {
  const dispatch = useDispatch();
  const { loading, error, baseData, baseDataLoading } = useSelector(state => state.quoteCalculation || {});
  const user = useSelector(selectUser);
  const configuredCommissions = useSelector(selectConfiguredCommissions);

  const [activeTab, setActiveTab] = useState('transporte');
  const [form, setForm] = useState({
    // Datos base
    quote_id: quote_id,
    user_id: user?.id,
    num_personas: 1,
    trip_type: 'nacional',
    
    // Categorías de costos
    tiquetes: {
      tipo: 'ida_vuelta',
      origen: '',
      destino: '',
      fecha_ida: '',
      fecha_vuelta: '',
      costo_ida: 0,
      costo_vuelta: 0,
      costo_total: 0,
      proveedor: '',
      observaciones: ''
    },
    traslados: {
      aeropuerto_hotel_ida: { incluido: false, costo: 0, proveedor: '' },
      hotel_aeropuerto_vuelta: { incluido: false, costo: 0, proveedor: '' },
      otros: [],
      costo_total: 0
    },
    hotel: {
      nombre: '',
      categoria: '3_estrellas',
      acomodacion: 'doble',
      noches: 0,
      costo_noche: 0,
      costo_total: 0,
      ubicacion: '',
      proveedor: '',
      observaciones: ''
    },
    alimentacion: {
      tipo: 'ninguna',
      costo_total: 0,
      proveedor: '',
      observaciones: ''
    },
    equipaje: {
      cabina: { incluido: true, costo: 0 },
      bodega: { incluido: false, costo: 0 },
      equipaje_extra: { incluido: false, costo: 0 },
      costo_total: 0
    },
    seguros: {
      asistencia_medica: { incluido: false, tipo: '', costo: 0, proveedor: '' },
      cancelacion: { incluido: false, costo: 0, proveedor: '' },
      otros: [],
      costo_total: 0
    },
    asistencia_medica: {
      tipo: 'ninguna',
      costo_total: 0,
      proveedor: '',
      observaciones: ''
    },
    excursiones: [],
    extras: [],
    
    // Comisiones y ganancia
    comisiones: {
      asesor: { porcentaje: 0, valor_fijo: 0, valor_por_persona: 0, tipo_calculo: 'percentage', total: 0 },
      lider: { porcentaje: 0, valor_fijo: 0, valor_por_persona: 0, tipo_calculo: 'percentage', total: 0 },
      gerente: { porcentaje: 0, valor_fijo: 0, valor_por_persona: 0, tipo_calculo: 'percentage', total: 0 },
      admin: { porcentaje: 0, valor_fijo: 0, valor_por_persona: 0, tipo_calculo: 'percentage', total: 0 },
      total_comisiones: 0
    },
    ganancia: {
      porcentaje: 15,
      valor_fijo: 0,
      total: 0
    },
    
    // Totales
    costo_base: 0,
    total_comisiones: 0,
    total_ganancia: 0,
    precio_final_total: 0,
    precio_final_por_persona: 0,
    
    estado: 'temporal',
    observaciones_generales: ''
  });

  // Cargar datos base al montar el componente
  useEffect(() => {
    if (quote_id) {
      dispatch(fetchCalculationBaseData(quote_id));
    }
  }, [dispatch, quote_id]);

  useEffect(() => {
    console.log('🔄 CALCULADORA: Verificando datos existentes...');
    console.log('📋 CALCULADORA: existingCalculation:', existingCalculation);
    console.log('📋 CALCULADORA: quoteData:', quoteData);
    
    if (existingCalculation && Object.keys(existingCalculation).length > 0) {
      console.log('✅ CALCULADORA: Cargando datos existentes en formulario');
      
      // ✅ CARGAR: Datos básicos
      setForm(prevForm => ({
        ...prevForm,
        quote_id: existingCalculation.quote_id || quote_id,
        user_id: existingCalculation.user_id || prevForm.user_id,
        num_personas: existingCalculation.num_personas || quoteData?.numero_personas || 1,
        trip_type: existingCalculation.trip_type || quoteData?.trip_type || 'nacional',
        
        // ✅ CARGAR: Tiquetes
        tiquetes: existingCalculation.tiquetes || prevForm.tiquetes,
        
        // ✅ CARGAR: Hotel
        hotel: existingCalculation.hotel || prevForm.hotel,
        
        // ✅ CARGAR: Traslados
        traslados: existingCalculation.traslados || prevForm.traslados,
        
        // ✅ CARGAR: Alimentación
        alimentacion: existingCalculation.alimentacion || prevForm.alimentacion,
        
        // ✅ CARGAR: Equipaje
        equipaje: existingCalculation.equipaje || prevForm.equipaje,
        
        // ✅ CARGAR: Seguros
        seguros: existingCalculation.seguros || prevForm.seguros,
        
        // ✅ CARGAR: Asistencia médica
        asistencia_medica: existingCalculation.asistencia_medica || prevForm.asistencia_medica,
        
        // ✅ CARGAR: Excursiones
        excursiones: Array.isArray(existingCalculation.excursiones) 
          ? existingCalculation.excursiones 
          : prevForm.excursiones,
        
        // ✅ CARGAR: Extras
        extras: Array.isArray(existingCalculation.extras) 
          ? existingCalculation.extras 
          : prevForm.extras,
        
        // ✅ CARGAR: Comisiones
        comisiones: existingCalculation.comisiones || prevForm.comisiones,
        
        // ✅ CARGAR: Ganancia
        ganancia: existingCalculation.ganancia || prevForm.ganancia,
        
        // ✅ CARGAR: Totales calculados
        costo_base: existingCalculation.costo_base || 0,
        total_comisiones: existingCalculation.total_comisiones || 0,
        total_ganancia: existingCalculation.total_ganancia || 0,
        precio_final_total: existingCalculation.precio_final_total || 0,
        precio_final_por_persona: existingCalculation.precio_final_por_persona || 0,
        
        // ✅ CARGAR: Estados y observaciones
        estado: existingCalculation.estado || 'draft',
        observaciones_generales: existingCalculation.observaciones_generales || ''
      }));
      
      console.log('✅ CALCULADORA: Datos cargados exitosamente');
    } else {
      console.log('ℹ️ CALCULADORA: No hay datos existentes, usando valores por defecto');
      
      // ✅ CARGAR: Al menos datos básicos de la cotización
      if (quoteData) {
        setForm(prevForm => ({
          ...prevForm,
          quote_id: quote_id,
          num_personas: quoteData.numero_personas || 1,
          trip_type: quoteData.trip_type || 'nacional',
        }));
      }
    }
  }, [existingCalculation, quoteData, quote_id]);

  // Sincronizar número de personas y tipo de viaje desde backend al cargar datos base
  useEffect(() => {
    if (baseData && baseData.quote_info) {
      setForm(prev => ({
        ...prev,
        num_personas: baseData.quote_info.numero_personas || 1,
        trip_type: baseData.quote_info.trip_type || 'nacional',
      }));
    }
  }, [baseData]);

  // Pre-llenar formulario con datos base y comisiones configuradas
  useEffect(() => {
    if (baseData && baseData.calculadora_defaults) {
      setForm(prev => ({
        ...prev,
        // Pre-llenar tiquetes
        tiquetes: {
          ...prev.tiquetes,
          ...baseData.calculadora_defaults.tiquetes
        },
        // Pre-llenar hotel
        hotel: {
          ...prev.hotel,
          ...baseData.calculadora_defaults.hotel
        },
        // Pre-llenar traslados
        traslados: {
          ...prev.traslados,
          ...baseData.calculadora_defaults.traslados
        },
        // Pre-llenar alimentación
        alimentacion: {
          ...prev.alimentacion,
          ...baseData.calculadora_defaults.alimentacion
        },
        // Pre-llenar comisiones configuradas
        comisiones: JSON.parse(JSON.stringify(baseData.comisiones_configuradas)),
        // Fechas
        fecha_viaje_inicio: baseData.calculadora_defaults.fecha_viaje_inicio,
        fecha_viaje_fin: baseData.calculadora_defaults.fecha_viaje_fin
      }));
    }
  }, [baseData]);

  // ✅ NUEVO: Actualizar comisiones cuando cambia el trip_type
  useEffect(() => {
    if (form.trip_type && quote_id) {
      console.log('🔄 Trip type cambió, recargando comisiones para:', form.trip_type);
      dispatch(fetchCommissionsByTripType({ 
        quoteId: quote_id, 
        tripType: form.trip_type 
      }));
    }
  }, [form.trip_type, quote_id, dispatch]);

  // ✅ Aplicar las nuevas comisiones configuradas cuando se cargan
  useEffect(() => {
    if (configuredCommissions && Object.keys(configuredCommissions).length > 0) {
      console.log('✅ Aplicando nuevas comisiones configuradas:', configuredCommissions);
      setForm(prev => ({
        ...prev,
        comisiones: JSON.parse(JSON.stringify(configuredCommissions))
      }));
    }
  }, [configuredCommissions]);

  // Calcular totales automáticamente, solo sumar comisiones si costo base > 0
  const calcularTotales = useCallback(() => {
    let costoBase = 0;
    const numPersonas = parseInt(form.num_personas || 1);

    // Sumar todos los costos (por persona y multiplicar por número de personas)
    costoBase += parseFloat(form.tiquetes.costo_total || 0) * numPersonas;
    costoBase += parseFloat(form.traslados.costo_total || 0) * numPersonas;
    costoBase += parseFloat(form.hotel.costo_total || 0) * numPersonas;
    costoBase += parseFloat(form.alimentacion.costo_total || 0) * numPersonas;
    costoBase += parseFloat(form.equipaje.costo_total || 0) * numPersonas;
    costoBase += parseFloat(form.seguros.costo_total || 0) * numPersonas;
    costoBase += parseFloat(form.asistencia_medica.costo_total || 0) * numPersonas;

    // Sumar excursiones
    const totalExcursiones = form.excursiones.reduce((acc, exc) => acc + parseFloat(exc.costo || 0), 0);
    costoBase += totalExcursiones * numPersonas;

    // Sumar extras
    const totalExtras = form.extras.reduce((acc, extra) => acc + parseFloat(extra.costo || 0), 0);
    costoBase += totalExtras * numPersonas;

    // Calcular comisiones sobre el costo base SOLO si costoBase > 0
    let totalComisiones = 0;
    const comisionesActualizadas = JSON.parse(JSON.stringify(form.comisiones));

    if (costoBase > 0) {
      Object.keys(comisionesActualizadas).forEach(rol => {
        if (rol !== 'total_comisiones' && comisionesActualizadas[rol]) {
          const comision = comisionesActualizadas[rol];
          let totalRol = 0;

          // Calcular según el tipo de comisión
          if (comision.tipo_calculo === 'fixed_per_person') {
            totalRol = parseFloat(comision.valor_por_persona || 0) * numPersonas;
          } else if (comision.tipo_calculo === 'percentage') {
            const porcentaje = parseFloat(comision.porcentaje || 0);
            totalRol = costoBase * porcentaje / 100;
          } else if (comision.tipo_calculo === 'fixed_total') {
            totalRol = parseFloat(comision.valor_fijo || 0);
          }

          comisionesActualizadas[rol] = {
            ...comisionesActualizadas[rol],
            total: totalRol
          };
          totalComisiones += totalRol;
        }
      });
    } else {
      // Si no hay costo base, todas las comisiones son 0
      Object.keys(comisionesActualizadas).forEach(rol => {
        if (rol !== 'total_comisiones' && comisionesActualizadas[rol]) {
          comisionesActualizadas[rol].total = 0;
        }
      });
      totalComisiones = 0;
    }
    comisionesActualizadas.total_comisiones = totalComisiones;

    // Calcular ganancia
    const porcentajeGanancia = parseFloat(form.ganancia.porcentaje || 0);
    const valorFijoGanancia = parseFloat(form.ganancia.valor_fijo || 0);
    const totalGanancia = (costoBase * porcentajeGanancia / 100) + valorFijoGanancia;

    // Precio final
    const precioFinalTotal = costoBase + totalComisiones + totalGanancia;
    const precioFinalPorPersona = precioFinalTotal / numPersonas;

    setForm(prev => ({
      ...prev,
      costo_base: costoBase,
      comisiones: comisionesActualizadas,
      total_comisiones: totalComisiones,
      ganancia: {
        ...prev.ganancia,
        total: totalGanancia
      },
      total_ganancia: totalGanancia,
      precio_final_total: precioFinalTotal,
      precio_final_por_persona: precioFinalPorPersona
    }));
  }, [
    form.tiquetes.costo_total,
    form.traslados.costo_total,
    form.hotel.costo_total,
    form.alimentacion.costo_total,
    form.equipaje.costo_total,
    form.seguros.costo_total,
    form.asistencia_medica.costo_total,
    form.excursiones,
    form.extras,
    form.comisiones.asesor.porcentaje,
    form.comisiones.asesor.valor_fijo,
    form.comisiones.asesor.valor_por_persona,
    form.comisiones.lider.porcentaje,
    form.comisiones.lider.valor_fijo,
    form.comisiones.lider.valor_por_persona,
    form.comisiones.gerente.porcentaje,
    form.comisiones.gerente.valor_fijo,
    form.comisiones.gerente.valor_por_persona,
    form.comisiones.admin.porcentaje,
    form.comisiones.admin.valor_fijo,
    form.comisiones.admin.valor_por_persona,
    form.ganancia.porcentaje,
    form.ganancia.valor_fijo,
    form.num_personas
  ]);

  // Pre-llenar formulario con datos base
  useEffect(() => {
    if (baseData && baseData.calculadora_defaults) {
      setForm(prev => ({
        ...prev,
        // Pre-llenar tiquetes
        tiquetes: {
          ...prev.tiquetes,
          ...baseData.calculadora_defaults.tiquetes
        },
        
        // Pre-llenar hotel
        hotel: {
          ...prev.hotel,
          ...baseData.calculadora_defaults.hotel
        },
        
        // Pre-llenar traslados
        traslados: {
          ...prev.traslados,
          ...baseData.calculadora_defaults.traslados
        },
        
        // Pre-llenar alimentación
        alimentacion: {
          ...prev.alimentacion,
          ...baseData.calculadora_defaults.alimentacion
        },
        
        // Pre-llenar comisiones configuradas
        comisiones: JSON.parse(JSON.stringify(baseData.comisiones_configuradas)),
        
        // Fechas
        fecha_viaje_inicio: baseData.calculadora_defaults.fecha_viaje_inicio,
        fecha_viaje_fin: baseData.calculadora_defaults.fecha_viaje_fin
      }));
    }
  }, [baseData]);

  // ...existing code...

  useEffect(() => {
    calcularTotales();
  }, [calcularTotales]);

  // Actualizar comisiones cuando cambie el tipo de viaje
  useEffect(() => {
    if (quote_id && form.trip_type) {
      console.log('🔄 Tipo de viaje cambió a:', form.trip_type, '- Obteniendo nuevas comisiones...');
      dispatch(fetchCommissionsByTripType({ 
        quoteId: quote_id, 
        tripType: form.trip_type 
      }));
    }
  }, [form.trip_type, quote_id, dispatch]);

  // Aplicar comisiones configuradas cuando se reciban
  useEffect(() => {
    if (configuredCommissions && Object.keys(configuredCommissions).length > 0) {
      console.log('✅ Aplicando nuevas comisiones configuradas:', configuredCommissions);
      setForm(prev => ({
        ...prev,
        comisiones: JSON.parse(JSON.stringify(configuredCommissions))
      }));
    }
  }, [configuredCommissions]);

  const handleInputChange = (categoria, campo, valor, subcampo = null) => {
    setForm(prev => {
      const newForm = JSON.parse(JSON.stringify(prev));
      
      if (!categoria) {
        // Para campos del nivel raíz como trip_type, num_personas, estado
        newForm[campo] = valor;
      } else if (subcampo) {
        newForm[categoria][campo][subcampo] = valor;
        
        // Recalcular totales de categoría específica
        if (categoria === 'tiquetes') {
          newForm.tiquetes.costo_total = 
            parseFloat(newForm.tiquetes.costo_ida || 0) + 
            parseFloat(newForm.tiquetes.costo_vuelta || 0);
        } else if (categoria === 'hotel') {
          newForm.hotel.costo_total = 
            parseFloat(newForm.hotel.noches || 0) * 
            parseFloat(newForm.hotel.costo_noche || 0);
        } else if (categoria === 'traslados') {
          let totalTraslados = 0;
          
          // Sumar aeropuerto_hotel_ida si está incluido
          if (newForm.traslados.aeropuerto_hotel_ida.incluido) {
            totalTraslados += parseFloat(newForm.traslados.aeropuerto_hotel_ida.costo || 0);
          }
          
          // Sumar hotel_aeropuerto_vuelta si está incluido
          if (newForm.traslados.hotel_aeropuerto_vuelta.incluido) {
            totalTraslados += parseFloat(newForm.traslados.hotel_aeropuerto_vuelta.costo || 0);
          }
          
          // Sumar otros traslados
          newForm.traslados.otros.forEach(traslado => {
            totalTraslados += parseFloat(traslado.costo || 0);
          });
          
          newForm.traslados.costo_total = totalTraslados;
        }
      } else {
        newForm[categoria][campo] = valor;
        
        // Recalcular totales cuando cambian campos directos de categoría
        if (categoria === 'tiquetes' && (campo === 'costo_ida' || campo === 'costo_vuelta')) {
          newForm.tiquetes.costo_total = 
            parseFloat(newForm.tiquetes.costo_ida || 0) + 
            parseFloat(newForm.tiquetes.costo_vuelta || 0);
        } else if (categoria === 'hotel' && (campo === 'noches' || campo === 'costo_noche')) {
          newForm.hotel.costo_total = 
            parseFloat(newForm.hotel.noches || 0) * 
            parseFloat(newForm.hotel.costo_noche || 0);
        }
      }
      
      return newForm;
    });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  console.log("📤 COMPONENTE: Iniciando envío de datos al backend");
  console.log("📋 COMPONENTE: Datos del formulario completo:", form);
  
  // ✅ AGREGAR: Log detallado de cada sección
  console.log("✈️ COMPONENTE: Tiquetes:", form.tiquetes);
  console.log("🏨 COMPONENTE: Hotel:", form.hotel);
  console.log("🚗 COMPONENTE: Traslados:", form.traslados);
  console.log("🍽️ COMPONENTE: Alimentación:", form.alimentacion);
  console.log("🛡️ COMPONENTE: Seguros:", form.seguros);
  console.log("🎒 COMPONENTE: Equipaje:", form.equipaje);
  console.log("🏥 COMPONENTE: Asistencia médica:", form.asistencia_medica);
  console.log("🎯 COMPONENTE: Excursiones:", form.excursiones);
  console.log("➕ COMPONENTE: Extras:", form.extras);
  
  // ✅ AGREGAR: Log de comisiones y totales
  console.log("💼 COMPONENTE: Comisiones:", form.comisiones);
  console.log("💰 COMPONENTE: Ganancia:", form.ganancia);
  
  // ✅ AGREGAR: Log de totales calculados
  console.log("📊 COMPONENTE: Totales calculados:");
  console.log("  - Costo base:", form.costo_base);
  console.log("  - Total comisiones:", form.total_comisiones);
  console.log("  - Total ganancia:", form.total_ganancia);
  console.log("  - Precio final total:", form.precio_final_total);
  console.log("  - Precio final por persona:", form.precio_final_por_persona);
  
  // ✅ AGREGAR: Log de configuración
  console.log("⚙️ COMPONENTE: Configuración:");
  console.log("  - Quote ID:", form.quote_id);
  console.log("  - User ID:", form.user_id);
  console.log("  - Número de personas:", form.num_personas);
  console.log("  - Tipo de viaje:", form.trip_type);
  console.log("  - Estado:", form.estado);
  
  // ✅ AGREGAR: Validaciones básicas antes de enviar
  if (!form.quote_id) {
    console.error("❌ COMPONENTE: Error - No hay quote_id");
    alert("Error: No se encontró el ID de la cotización");
    return;
  }
  
  if (!form.user_id) {
    console.error("❌ COMPONENTE: Error - No hay user_id");
    alert("Error: No se encontró el ID del usuario");
    return;
  }
  
  if (form.precio_final_total <= 0) {
    console.warn("⚠️ COMPONENTE: Advertencia - El precio final es 0 o negativo");
  }
  
  console.log("📤 COMPONENTE: Enviando datos vía dispatch...");
  
  try {
   console.log("💾 CALCULADORA: Usando upsertQuoteCalculation para guardar/actualizar");
      const result = await dispatch(upsertQuoteCalculation(form));
      console.log("📨 CALCULADORA: Resultado del dispatch:", result);
      
    
    if (result.meta.requestStatus === 'fulfilled') {
      console.log("✅ COMPONENTE: Cálculo guardado exitosamente");
      console.log("✅ COMPONENTE: Payload de respuesta:", result.payload);
      
      if (onContinue) {
        console.log("🔄 COMPONENTE: Ejecutando callback onContinue...");
        onContinue(result.payload);
      }
    } else {
      console.error("❌ COMPONENTE: El dispatch fue rechazado:", result.error);
    }
  } catch (error) {
    console.error("❌ COMPONENTE: Error en try-catch del handleSubmit:", error);
    console.error("❌ COMPONENTE: Error stack:", error.stack);
  }
};

  const tabs = [
    { id: 'transporte', label: 'Transporte', icon: '✈️' },
    { id: 'alojamiento', label: 'Alojamiento', icon: '🏨' },
    { id: 'servicios', label: 'Servicios', icon: '🛡️' },
    { id: 'actividades', label: 'Actividades', icon: '🎯' },
    { id: 'comisiones', label: 'Comisiones', icon: '💼' },
    { id: 'resumen', label: 'Resumen', icon: '📊' }
  ];

  if (baseDataLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Cargando datos de la cotización...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Calculadora de Presupuesto</h2>
      
      {/* Información de la cotización */}
      {baseData && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-700 mb-2">Información de la Cotización</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div><strong>Cliente:</strong> {baseData.quote_info.nombre_cliente || baseData.jerarquia_ventas.cliente?.name || '-'}</div>
            <div><strong>Destino:</strong> {baseData.quote_info.destino}</div>
            <div><strong>Personas:</strong> {baseData.quote_info.numero_personas}</div>
            <div><strong>Tipo:</strong> {baseData.quote_info.trip_type}</div>
          </div>
        </div>
      )}

      {/* Tabs de navegación */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Configuración general */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Viaje</label>
            <select
              value={form.trip_type}
              onChange={(e) => handleInputChange('', 'trip_type', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="nacional">Nacional</option>
              <option value="internacional">Internacional</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Número de Personas</label>
            <input
              type="number"
              min="1"
              value={form.num_personas}
              onChange={(e) => handleInputChange('', 'num_personas', parseInt(e.target.value) || 1)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Estado</label>
            <select
              value={form.estado}
              onChange={(e) => handleInputChange('', 'estado', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="temporal">Temporal</option>
              <option value="confirmado">Confirmado</option>
            </select>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Sección Transporte */}
        {activeTab === 'transporte' && (
          <div className="space-y-6">
            {/* Tiquetes Aéreos */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">Tiquetes Aéreos</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo de Tiquete</label>
                  <select
                    value={form.tiquetes.tipo}
                    onChange={e => handleInputChange('tiquetes', 'tipo', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="ida">Solo Ida</option>
                    <option value="ida_vuelta">Ida y Vuelta</option>
                    <option value="sin_tiquetes">Sin Tiquetes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Proveedor</label>
                  <input
                    type="text"
                    value={form.tiquetes.proveedor}
                    onChange={e => handleInputChange('tiquetes', 'proveedor', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Ej: Avianca, LATAM"
                  />
                </div>
                {form.tiquetes.tipo !== 'sin_tiquetes' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Costo Ida (por persona)</label>
                      <input
                        type="number"
                        value={form.tiquetes.costo_ida}
                        onChange={e => handleInputChange('tiquetes', 'costo_ida', e.target.value)}
                        className="w-full border rounded px-3 py-2"
                        placeholder="0"
                      />
                    </div>
                    {form.tiquetes.tipo === 'ida_vuelta' && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Costo Vuelta (por persona)</label>
                        <input
                          type="number"
                          value={form.tiquetes.costo_vuelta}
                          onChange={e => handleInputChange('tiquetes', 'costo_vuelta', e.target.value)}
                          className="w-full border rounded px-3 py-2"
                          placeholder="0"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="mt-3 p-2 bg-blue-50 rounded">
                <strong>Total Tiquetes por persona: ${Number(form.tiquetes.costo_total).toLocaleString()}</strong>
                <br />
                <strong>Total para {form.num_personas} persona(s): ${Number(form.tiquetes.costo_total * form.num_personas).toLocaleString()}</strong>
              </div>
            </div>

            {/* Traslados */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">Traslados</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={form.traslados.aeropuerto_hotel_ida.incluido}
                    onChange={e => handleInputChange('traslados', 'aeropuerto_hotel_ida', e.target.checked, 'incluido')}
                    className="rounded"
                  />
                  <label className="flex-1">Aeropuerto → Hotel (Ida)</label>
                  <div className="w-32">
                    <input
                      type="number"
                      value={form.traslados.aeropuerto_hotel_ida.costo}
                      onChange={e => handleInputChange('traslados', 'aeropuerto_hotel_ida', e.target.value, 'costo')}
                      className="w-full border rounded px-2 py-1"
                      placeholder="0"
                      disabled={!form.traslados.aeropuerto_hotel_ida.incluido}
                    />
                    <small className="text-gray-500">por persona</small>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={form.traslados.hotel_aeropuerto_vuelta.incluido}
                    onChange={e => handleInputChange('traslados', 'hotel_aeropuerto_vuelta', e.target.checked, 'incluido')}
                    className="rounded"
                  />
                  <label className="flex-1">Hotel → Aeropuerto (Vuelta)</label>
                  <div className="w-32">
                    <input
                      type="number"
                      value={form.traslados.hotel_aeropuerto_vuelta.costo}
                      onChange={e => handleInputChange('traslados', 'hotel_aeropuerto_vuelta', e.target.value, 'costo')}
                      className="w-full border rounded px-2 py-1"
                      placeholder="0"
                      disabled={!form.traslados.hotel_aeropuerto_vuelta.incluido}
                    />
                    <small className="text-gray-500">por persona</small>
                  </div>
                </div>
              </div>
              <div className="mt-3 p-2 bg-blue-50 rounded">
                <strong>Total Traslados por persona: ${Number(form.traslados.costo_total).toLocaleString()}</strong>
                <br />
                <strong>Total para {form.num_personas} persona(s): ${Number(form.traslados.costo_total * form.num_personas).toLocaleString()}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Sección Alojamiento */}
        {activeTab === 'alojamiento' && (
          <div className="space-y-6">
            {/* Hotel */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">Hotel</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre del Hotel</label>
                  <input
                    type="text"
                    value={form.hotel.nombre}
                    onChange={e => handleInputChange('hotel', 'nombre', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Nombre del hotel"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Categoría</label>
                  <select
                    value={form.hotel.categoria}
                    onChange={e => handleInputChange('hotel', 'categoria', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="1_estrella">1 Estrella</option>
                    <option value="2_estrellas">2 Estrellas</option>
                    <option value="3_estrellas">3 Estrellas</option>
                    <option value="4_estrellas">4 Estrellas</option>
                    <option value="5_estrellas">5 Estrellas</option>
                    <option value="boutique">Boutique</option>
                    <option value="resort">Resort</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Acomodación</label>
                  <select
                    value={form.hotel.acomodacion}
                    onChange={e => handleInputChange('hotel', 'acomodacion', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="sencilla">Sencilla</option>
                    <option value="doble">Doble</option>
                    <option value="triple">Triple</option>
                    <option value="cuadruple">Cuádruple</option>
                    <option value="suite">Suite</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Noches</label>
                  <input
                    type="number"
                    value={form.hotel.noches}
                    onChange={e => handleInputChange('hotel', 'noches', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Costo por Noche (por persona)</label>
                  <input
                    type="number"
                    value={form.hotel.costo_noche}
                    onChange={e => handleInputChange('hotel', 'costo_noche', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    min="0"
                  />
                </div>
              </div>
              <div className="mt-3 p-2 bg-blue-50 rounded">
                <strong>Total Hotel por persona: ${Number(form.hotel.costo_total).toLocaleString()}</strong>
                <br />
                <strong>Total para {form.num_personas} persona(s): ${Number(form.hotel.costo_total * form.num_personas).toLocaleString()}</strong>
              </div>
            </div>

            {/* Alimentación */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">Alimentación</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo de Alimentación</label>
                  <select
                    value={form.alimentacion.tipo}
                    onChange={e => handleInputChange('alimentacion', 'tipo', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="ninguna">Ninguna</option>
                    <option value="desayuno">Solo Desayuno</option>
                    <option value="media_pension">Media Pensión</option>
                    <option value="pension_completa">Pensión Completa</option>
                    <option value="todo_incluido">Todo Incluido</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Costo Total (por persona)</label>
                  <input
                    type="number"
                    value={form.alimentacion.costo_total}
                    onChange={e => handleInputChange('alimentacion', 'costo_total', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    min="0"
                  />
                </div>
              </div>
              <div className="mt-3 p-2 bg-blue-50 rounded">
                <strong>Total Alimentación por persona: ${Number(form.alimentacion.costo_total).toLocaleString()}</strong>
                <br />
                <strong>Total para {form.num_personas} persona(s): ${Number(form.alimentacion.costo_total * form.num_personas).toLocaleString()}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Sección Servicios */}
        {activeTab === 'servicios' && (
          <div className="space-y-6">
            {/* Seguros */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">Seguros</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo de Seguro</label>
                  <select
                    value={form.seguros.asistencia_medica?.tipo || 'ninguno'}
                    onChange={e => handleInputChange('seguros', 'asistencia_medica', e.target.value, 'tipo')}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="ninguno">Ninguno</option>
                    <option value="basico">Básico</option>
                    <option value="completo">Completo</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Costo Total (por persona)</label>
                  <input
                    type="number"
                    value={form.seguros.costo_total}
                    onChange={e => handleInputChange('seguros', 'costo_total', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    min="0"
                  />
                </div>
              </div>
              <div className="mt-3 p-2 bg-blue-50 rounded">
                <strong>Total Seguros por persona: ${Number(form.seguros.costo_total).toLocaleString()}</strong>
                <br />
                <strong>Total para {form.num_personas} persona(s): ${Number(form.seguros.costo_total * form.num_personas).toLocaleString()}</strong>
              </div>
            </div>

            {/* Equipaje */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">Equipaje</h4>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={form.equipaje.equipaje_extra.incluido}
                      onChange={e => handleInputChange('equipaje', 'equipaje_extra', e.target.checked, 'incluido')}
                    />
                    <label className="text-sm font-medium">Equipaje Extra</label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Costo Equipaje Extra (por persona)</label>
                    <input
                      type="number"
                      value={form.equipaje.equipaje_extra.costo}
                      onChange={e => handleInputChange('equipaje', 'equipaje_extra', e.target.value, 'costo')}
                      className="w-full border rounded px-3 py-2"
                      min="0"
                      disabled={!form.equipaje.equipaje_extra.incluido}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Costo Total Equipaje (por persona)</label>
                  <input
                    type="number"
                    value={form.equipaje.costo_total}
                    onChange={e => handleInputChange('equipaje', 'costo_total', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    min="0"
                  />
                </div>
              </div>
              <div className="mt-3 p-2 bg-blue-50 rounded">
                <strong>Total Equipaje por persona: ${Number(form.equipaje.costo_total).toLocaleString()}</strong>
                <br />
                <strong>Total para {form.num_personas} persona(s): ${Number(form.equipaje.costo_total * form.num_personas).toLocaleString()}</strong>
              </div>
            </div>

            {/* Asistencia Médica */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">Asistencia Médica</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo de Asistencia</label>
                  <select
                    value={form.asistencia_medica?.tipo || 'ninguna'}
                    onChange={e => handleInputChange('asistencia_medica', 'tipo', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="ninguna">Ninguna</option>
                    <option value="basica">Básica</option>
                    <option value="completa">Completa</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Costo Total (por persona)</label>
                  <input
                    type="number"
                    value={form.asistencia_medica?.costo_total || 0}
                    onChange={e => handleInputChange('asistencia_medica', 'costo_total', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    min="0"
                  />
                </div>
              </div>
              <div className="mt-3 p-2 bg-blue-50 rounded">
                <strong>Total Asistencia Médica por persona: ${Number(form.asistencia_medica?.costo_total || 0).toLocaleString()}</strong>
                <br />
                <strong>Total para {form.num_personas} persona(s): ${Number((form.asistencia_medica?.costo_total || 0) * form.num_personas).toLocaleString()}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Sección Actividades */}
        {activeTab === 'actividades' && (
          <div className="space-y-6">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">Excursiones y Actividades</h4>
              <p className="text-gray-600">Esta sección estará disponible próximamente para agregar excursiones y actividades adicionales.</p>
            </div>
          </div>
        )}

        {/* Sección Comisiones */}
        {activeTab === 'comisiones' && (
          <div className="space-y-6">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">Comisiones por Jerarquía</h4>
              {baseData && baseData.comisiones_configuradas && (
                <div className="space-y-3">
                  {Object.entries(baseData.comisiones_configuradas).map(([rol, datos]) => 
                    rol !== 'total_comisiones' && datos && (
                      <div key={rol} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium capitalize">{rol}:</span>
                          <span className="ml-2 text-sm text-gray-600">
                            {datos.tipo_calculo === 'fixed_per_person' 
                              ? `$${Number(datos.valor_por_persona || 0).toLocaleString()} por persona`
                              : datos.tipo_calculo === 'percentage'
                              ? `${datos.porcentaje}%`
                              : `$${Number(datos.valor_fijo || 0).toLocaleString()} fijo`
                            }
                          </span>
                        </div>
                        <div className="font-semibold text-green-600">
                          ${Number(form.comisiones[rol]?.total || 0).toLocaleString()}
                        </div>
                      </div>
                    )
                  )}
                  <div className="border-t pt-3">
                    <div className="flex justify-between font-bold">
                      <span>Total Comisiones:</span>
                      <span>${Number(form.total_comisiones).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">Ganancia de la Empresa</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Porcentaje (%)</label>
                  <input
                    type="number"
                    value={form.ganancia.porcentaje}
                    onChange={e => handleInputChange('ganancia', 'porcentaje', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Valor Fijo</label>
                  <input
                    type="number"
                    value={form.ganancia.valor_fijo}
                    onChange={e => handleInputChange('ganancia', 'valor_fijo', e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    min="0"
                  />
                </div>
              </div>
              <div className="mt-3 p-2 bg-green-50 rounded">
                <strong>Total Ganancia: ${Number(form.total_ganancia).toLocaleString()}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Sección Resumen */}
        {activeTab === 'resumen' && (
          <div className="space-y-6">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">Resumen del Presupuesto</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Tiquetes (por persona):</span>
                  <span>${Number(form.tiquetes.costo_total).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Hotel (por persona):</span>
                  <span>${Number(form.hotel.costo_total).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Traslados (por persona):</span>
                  <span>${Number(form.traslados.costo_total).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Alimentación (por persona):</span>
                  <span>${Number(form.alimentacion.costo_total).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Seguros (por persona):</span>
                  <span>${Number(form.seguros.costo_total).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Equipaje (por persona):</span>
                  <span>${Number(form.equipaje.costo_total).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Asistencia Médica (por persona):</span>
                  <span>${Number(form.asistencia_medica?.costo_total || 0).toLocaleString()}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Costo Base Total ({form.num_personas} persona(s)):</span>
                    <span>${Number(form.costo_base).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-orange-600">
                    <span>+ Comisiones:</span>
                    <span>${Number(form.total_comisiones).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>+ Ganancia:</span>
                    <span>${Number(form.total_ganancia).toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>PRECIO TOTAL:</span>
                      <span>${Number(form.precio_final_total).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-blue-600">
                      <span>PRECIO POR PERSONA:</span>
                      <span>${Number(form.precio_final_por_persona).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <label className="block text-sm font-medium mb-2">Observaciones Generales</label>
              <textarea
                value={form.observaciones_generales}
                onChange={e => handleInputChange('observaciones_generales', '', e.target.value)}
                rows={3}
                className="w-full border rounded px-3 py-2"
                placeholder="Comentarios adicionales sobre el presupuesto..."
              />
            </div>
          </div>
        )}

        {/* Navegación y botones */}
        <div className="flex justify-between pt-6 border-t">
          <div className="text-lg font-bold text-blue-600">
            Precio por persona: ${Number(form.precio_final_por_persona).toLocaleString()}
          </div>
          <div className="space-x-3">
            <button
              type="button"
              onClick={() => setActiveTab(tabs[Math.max(0, tabs.findIndex(t => t.id === activeTab) - 1)].id)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={activeTab === tabs[0].id}
            >
              Anterior
            </button>
            {activeTab !== 'resumen' ? (
              <button
                type="button"
                onClick={() => setActiveTab(tabs[Math.min(tabs.length - 1, tabs.findIndex(t => t.id === activeTab) + 1)].id)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Siguiente
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar y Usar Presupuesto'}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
      </form>
    </div>
  );
};

export default AdvancedQuoteCalculator;
