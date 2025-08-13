import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createQuoteCalculation, upsertQuoteCalculation, fetchCalculationBaseData } from '../../../redux/slices/quoteCalculationSlice';
import { selectUser } from '../../../redux/slices/authSlice';
import { fetchCommissionsByTripType, selectConfiguredCommissions } from '../../../redux/slices/commissionSlice';
import { toast } from 'react-toastify';

const AdvancedQuoteCalculator = ({ quote_id,
  onContinue,
  existingCalculation,
  quoteData }) => {
  const dispatch = useDispatch();
  const { loading, error, baseData, baseDataLoading } = useSelector(state => state.quoteCalculation || {});
  const user = useSelector(selectUser);
  const configuredCommissions = useSelector(selectConfiguredCommissions);

  // ✅ REF: Para detectar cambios en quote_id
  const prevQuoteIdRef = useRef(null);

  // ✅ FUNCIÓN: Convertir fecha ISO a formato yyyy-MM-dd para inputs HTML
  const formatDateForInput = (isoDate) => {
    if (!isoDate) return '';
    try {
      const date = new Date(isoDate);
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.warn('Error formateando fecha:', error);
      return '';
    }
  };

  // ✅ FUNCIÓN: Resetear formulario a valores por defecto (para nuevas cotizaciones)
  const resetFormToDefault = useCallback(() => {
    console.log('🔄 CALCULADORA: Reseteando formulario a valores por defecto');
    setForm({
      // Datos base
      quote_id: quote_id,
      user_id: user?.id,
      num_personas: 1,
      adultos: 1,
      menores: 0,
      infantes: 0,
      edades_menores: [],
      edades_infantes: [],
      personas_atencion_especial: 0,
      trip_type: '',

      // Categorías de costos - valores por defecto limpios
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
        asistencia_medica: { incluido: false, tipo: 'ninguna', costo: 0, proveedor: '' },
        cancelacion: { incluido: false, costo: 0, proveedor: '' },
        otros: [],
        costo_total: 0
      },
      actividades_adicionales: {
        incluidas: false,
        detalle: '',
        costo_por_persona: 0,
        proveedor: ''
      },
      excursiones: [],
      extras: [],
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
      costo_base: 0,
      total_comisiones: 0,
      total_ganancia: 0,
      precio_final_total: 0,
      precio_final_por_persona: 0,
      estado: 'temporal',
      observaciones_generales: ''
    });
    setShouldRecalculate(false);
  }, [quote_id, user?.id]);

  // ✅ FUNCIÓN: Calcular personas que realmente pagan (excluyendo infantes <2 años)
  const calcularPersonasQuePagan = () => {
    const adultos = parseInt(form.adultos) || 0;
    const menores = parseInt(form.menores) || 0;
    let total = adultos + menores;

    // ✅ VALIDACIÓN: Si el total no coincide con numero_personas menos infantes, ajustar
    const totalEsperado = parseInt(form.num_personas) - parseInt(form.infantes || 0);
    if (total === 0 && totalEsperado > 0) {
      console.log(`🔧 CORRECCIÓN: total=0 pero esperado=${totalEsperado}, usando totalEsperado`);
      total = totalEsperado;
    }

    // ✅ DEBUG: Log para ver los valores
    console.log(`🧮 calcularPersonasQuePagan: adultos=${adultos}, menores=${menores}, total=${total}`);
    console.log(`🧮 form.adultos=${form.adultos}, form.menores=${form.menores}, form.infantes=${form.infantes}`);
    console.log(`🧮 num_personas=${form.num_personas}, totalEsperado=${totalEsperado}`);

    // Los infantes (<2 años) NO pagan
    return Math.max(1, total); // Mínimo 1 persona que paga
  };

  // ✅ FUNCIÓN: Calcular total de actividades extras (por persona)
  const calcularTotalActividadesExtras = () => {
    if (!form.actividades_adicionales?.incluidas) return 0;

    let totalPorPersona = 0;

    // Actividades básicas (por persona)
    if (form.actividades_adicionales?.actividades?.length > 0) {
      totalPorPersona += form.actividades_adicionales.actividades.reduce((acc, actividad) => {
        return acc + parseFloat(actividad.costo || 0);
      }, 0);
    }

    // Excursiones (por persona)
    if (form.excursiones?.length > 0) {
      totalPorPersona += form.excursiones.reduce((acc, exc) => {
        return acc + parseFloat(exc.costo || 0);
      }, 0);
    }

    // Extras/servicios (costo total dividido entre personas que pagan)
    if (form.extras?.length > 0) {
      const totalServicios = form.extras.reduce((acc, extra) => {
        return acc + parseFloat(extra.costo || 0);
      }, 0);
      totalPorPersona += totalServicios / calcularPersonasQuePagan();
    }

    return totalPorPersona;
  };

  const [activeTab, setActiveTab] = useState('transporte');
  const [shouldRecalculate, setShouldRecalculate] = useState(false);
  const [form, setForm] = useState({
    // Datos base
    quote_id: quote_id,
    user_id: user?.id,
    num_personas: 1,
    // ✅ NUEVOS: Datos detallados de pasajeros
    adultos: 1,
    menores: 0,
    infantes: 0,
    edades_menores: [],
    edades_infantes: [],
    personas_atencion_especial: 0,
    trip_type: '',

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
      asistencia_medica: { incluido: false, tipo: 'ninguna', costo: 0, proveedor: '' },
      cancelacion: { incluido: false, costo: 0, proveedor: '' },
      otros: [],
      costo_total: 0
    },
    // ✅ NUEVO: Actividades adicionales
    actividades_adicionales: {
      incluidas: false,
      detalle: '',
      costo_por_persona: 0,
      proveedor: ''
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
    if (quote_id && quote_id !== 'new') {
      dispatch(fetchCalculationBaseData(quote_id));
    }
  }, [dispatch, quote_id]);

  useEffect(() => {
    console.log('🔄 CALCULADORA: Verificando datos existentes...');
    console.log('📋 CALCULADORA: quote_id:', quote_id);
    console.log('📋 CALCULADORA: existingCalculation:', existingCalculation);
    console.log('📋 CALCULADORA: quoteData:', quoteData);

    // ✅ Si no hay quote_id o es 'new', resetear formulario
    if (!quote_id || quote_id === 'new') {
      console.log('🆕 CALCULADORA: Nueva cotización - reseteando formulario');
      resetFormToDefault();
      return;
    }

    if (existingCalculation && Object.keys(existingCalculation).length > 0) {
      console.log('✅ CALCULADORA: Cargando datos existentes en formulario');

      // ✅ CARGAR: Datos básicos
      setForm(prevForm => ({
        ...prevForm,
        quote_id: existingCalculation.quote_id || quote_id,
        user_id: existingCalculation.user_id || prevForm.user_id,
        num_personas: existingCalculation.num_personas || quoteData?.numero_personas || 1,
        // ✅ NUEVOS: Cargar datos detallados de pasajeros - QuoteEdit ya distribuyó correctamente
        adultos: existingCalculation.adultos || quoteData?.adultos || 1,
        menores: existingCalculation.menores || quoteData?.menores || 0,
        infantes: existingCalculation.infantes || quoteData?.infantes || 0,
        edades_menores: existingCalculation.edades_menores || quoteData?.edades_menores || [],
        edades_infantes: existingCalculation.edades_infantes || quoteData?.edades_infantes || [],
        personas_atencion_especial: existingCalculation.personas_atencion_especial || quoteData?.personas_atencion_especial || 0,
        trip_type: existingCalculation.trip_type || quoteData?.trip_type || '',

        // ✅ CARGAR: Tiquetes con formato correcto de fechas
        tiquetes: {
          ...prevForm.tiquetes,
          ...(existingCalculation.tiquetes || {}),
          fecha_ida: formatDateForInput(existingCalculation.tiquetes?.fecha_ida) || prevForm.tiquetes.fecha_ida,
          fecha_vuelta: formatDateForInput(existingCalculation.tiquetes?.fecha_vuelta) || prevForm.tiquetes.fecha_vuelta
        },

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

        // ✅ CARGAR: Actividades adicionales
        actividades_adicionales: existingCalculation.actividades_adicionales || prevForm.actividades_adicionales,

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
      // ✅ MARCAR: Necesita recalcular después de que calcularTotales esté disponible
      setShouldRecalculate(true);
    } else {
      console.log('ℹ️ CALCULADORA: No hay datos existentes, usando valores por defecto');

      // ✅ CARGAR: Al menos datos básicos de la cotización
      if (quoteData) {
        setForm(prevForm => ({
          ...prevForm,
          quote_id: quote_id,
          num_personas: quoteData.numero_personas || 1,
          // ✅ NUEVOS: Cargar datos detallados de pasajeros desde quoteData
          adultos: quoteData.adultos || 1,
          menores: quoteData.menores || 0,
          infantes: quoteData.infantes || 0,
          edades_menores: quoteData.edades_menores || [],
          edades_infantes: quoteData.edades_infantes || [],
          personas_atencion_especial: quoteData.personas_atencion_especial || 0,
          trip_type: quoteData.trip_type || '',
        }));
      }
    }
  }, [existingCalculation, quoteData, quote_id, resetFormToDefault]);

  // Sincronizar número de personas y tipo de viaje desde backend al cargar datos base
  useEffect(() => {
    // ✅ Solo sincronizar si no es nueva cotización
    if (baseData && baseData.quote_info && quote_id && quote_id !== 'new') {
      setForm(prev => ({
        ...prev,
        num_personas: baseData.quote_info.numero_personas || 1,
        // ✅ NUEVOS: Cargar datos detallados desde baseData con lógica mejorada
        adultos: baseData.quote_info.adultos ||
          Math.max(1, (baseData.quote_info.numero_personas - (baseData.quote_info.ninos || 0))),
        menores: baseData.quote_info.menores || baseData.quote_info.ninos || 0,
        infantes: baseData.quote_info.infantes || 0,
        edades_menores: baseData.quote_info.edades_menores || [],
        edades_infantes: baseData.quote_info.edades_infantes || [],
        personas_atencion_especial: baseData.quote_info.personas_atencion_especial || 0,
        trip_type: baseData.quote_info.trip_type || '',
      }));
    }
  }, [baseData, quote_id]);

  // Pre-llenar formulario con datos base y comisiones configuradas
  useEffect(() => {
    // ✅ Solo pre-llenar si no es nueva cotización
    if (baseData && baseData.calculadora_defaults && quote_id && quote_id !== 'new') {
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
  }, [baseData, quote_id]);

  // ✅ DEBUG: useEffect para monitorear cambios en datos de personas
  useEffect(() => {
    console.log('👥 DEBUG datos de personas:', {
      num_personas: form.num_personas,
      adultos: form.adultos,
      menores: form.menores,
      infantes: form.infantes,
      calcularPersonasQuePagan: calcularPersonasQuePagan()
    });
  }, [form.num_personas, form.adultos, form.menores, form.infantes]);

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

  // ✅ NUEVO: Detectar cambio de cotización y resetear formulario para nueva cotización
  useEffect(() => {
    // Si cambia quote_id y es una nueva cotización, resetear completamente
    if (quote_id && prevQuoteIdRef.current && quote_id !== prevQuoteIdRef.current && quote_id === 'new') {
      console.log('🔄 CALCULADORA: Detectado cambio a nueva cotización, reseteando formulario');
      resetFormToDefault();
    }
    
    // Si no hay cálculo existente y es una nueva cotización, asegurar reset limpio
    if (quote_id === 'new' && !existingCalculation) {
      console.log('🔄 CALCULADORA: Nueva cotización sin datos existentes, aplicando reset limpio');
      resetFormToDefault();
    }
    
    // Actualizar referencia
    prevQuoteIdRef.current = quote_id;
  }, [quote_id, existingCalculation, resetFormToDefault]);

  // Calcular totales automáticamente, solo sumar comisiones si costo base > 0
  const calcularTotales = useCallback(() => {
    let costoBase = 0;
    const numPersonas = parseInt(form.num_personas || 1);
    const personasQuePagan = calcularPersonasQuePagan(); // ✅ Solo adultos + menores

    console.log('🧮 DEBUGGING CALCULAR TOTALES:');
    console.log('Personas que pagan:', personasQuePagan);
    console.log('Tiquetes costo_total (por persona):', form.tiquetes.costo_total);
    console.log('Hotel costo_total (por persona):', form.hotel.costo_total);
    console.log('Traslados costo_total (por persona):', form.traslados.costo_total);
    console.log('Alimentacion costo_total (por persona):', form.alimentacion.costo_total);

    // ✅ CORREGIDO: Los costos son POR PERSONA, necesitamos multiplicar por personas que pagan
    costoBase += parseFloat(form.tiquetes.costo_total || 0) * personasQuePagan;
    costoBase += parseFloat(form.traslados.costo_total || 0) * personasQuePagan;
    costoBase += parseFloat(form.hotel.costo_total || 0) * personasQuePagan;
    costoBase += parseFloat(form.alimentacion.costo_total || 0) * personasQuePagan;
    costoBase += parseFloat(form.equipaje.costo_total || 0) * personasQuePagan;
    costoBase += parseFloat(form.seguros.costo_total || 0) * personasQuePagan;
    costoBase += parseFloat(form.seguros?.asistencia_medica?.costo || 0) * personasQuePagan;
    
    console.log('🎯 COSTO BASE DESPUÉS DE SERVICIOS BÁSICOS:');
    console.log('- Tiquetes total:', parseFloat(form.tiquetes.costo_total || 0) * personasQuePagan);
    console.log('- Hotel total:', parseFloat(form.hotel.costo_total || 0) * personasQuePagan);
    console.log('- Traslados total:', parseFloat(form.traslados.costo_total || 0) * personasQuePagan);
    console.log('- Alimentación total:', parseFloat(form.alimentacion.costo_total || 0) * personasQuePagan);
    console.log('- Equipaje total:', parseFloat(form.equipaje.costo_total || 0) * personasQuePagan);
    console.log('- Seguros total:', parseFloat(form.seguros.costo_total || 0) * personasQuePagan);
    console.log('- Asistencia médica total:', parseFloat(form.seguros?.asistencia_medica?.costo || 0) * personasQuePagan);
    console.log('- Costo base parcial:', costoBase);

    // ✅ ACTUALIZADO: Calcular extras combinados según el nuevo sistema
    let totalExtrasPersonas = 0;
    let totalExtrasGenerales = 0;

    if (form.actividades_adicionales?.incluidas) {
      // Actividades básicas agregadas (por persona)
      if (form.actividades_adicionales?.actividades?.length > 0) {
        const totalActividades = form.actividades_adicionales.actividades.reduce((acc, actividad) => {
          return acc + parseFloat(actividad.costo || 0);
        }, 0);
        totalExtrasPersonas += totalActividades;
      }

      // Excursiones (por persona)
      if (form.excursiones?.length > 0) {
        const totalExcursiones = form.excursiones.reduce((acc, exc) => {
          return acc + parseFloat(exc.costo || 0);
        }, 0);
        totalExtrasPersonas += totalExcursiones;
      }

      // Extras/servicios (costo total, no por persona)
      if (form.extras?.length > 0) {
        const totalServicios = form.extras.reduce((acc, extra) => {
          return acc + parseFloat(extra.costo || 0);
        }, 0);
        totalExtrasGenerales += totalServicios;
      }
    }

    // Sumar al costo base: extras por persona se multiplican por personas que pagan
    costoBase += (totalExtrasPersonas * personasQuePagan) + totalExtrasGenerales;

    console.log('🎯 COSTO BASE FINAL (después de actividades):', costoBase);
    console.log('- Total extras por persona:', totalExtrasPersonas, 'x', personasQuePagan, '=', totalExtrasPersonas * personasQuePagan);
    console.log('- Total extras generales:', totalExtrasGenerales);

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
            // ✅ CORRECTO: Solo se comisiona por personas que pagan (excluye infantes <2 años)
            totalRol = parseFloat(comision.valor_por_persona || 0) * personasQuePagan;
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

    // Calcular ganancia sobre el costo base (sin comisiones)
    const porcentajeGanancia = parseFloat(form.ganancia.porcentaje || 0);
    const valorFijoGanancia = parseFloat(form.ganancia.valor_fijo || 0);
    const totalGanancia = (costoBase * porcentajeGanancia / 100) + valorFijoGanancia;

    // Precio final = costo base + comisiones + ganancia
    const precioFinalTotal = costoBase + totalComisiones + totalGanancia;
    const precioFinalPorPersona = personasQuePagan > 0 ? precioFinalTotal / personasQuePagan : 0; // ✅ Dividir por personas que pagan

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
    
    console.log('🎯 RESULTADO FINAL CALCULAR TOTALES:');
    console.log('- Costo Base (total para', personasQuePagan, 'personas):', costoBase);
    console.log('- Total Comisiones:', totalComisiones);
    console.log('- Total Ganancia:', totalGanancia);
    console.log('- Precio Final Total:', precioFinalTotal);
    console.log('- Precio Final Por Persona (', personasQuePagan, 'que pagan):', precioFinalPorPersona);
  }, [
    form.tiquetes.costo_total,
    form.traslados.costo_total,
    form.hotel.costo_total,
    form.alimentacion.costo_total,
    form.equipaje.costo_total,
    form.seguros.costo_total,
    form.seguros?.asistencia_medica?.costo,
    form.excursiones,
    // ✅ NUEVA: Dependencia para actividades adicionales
    form.actividades_adicionales?.costo_por_persona,
    form.actividades_adicionales?.incluidas,
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
    form.num_personas,
    // ✅ NUEVAS: Dependencias para recalcular cuando cambian los pasajeros
    form.adultos,
    form.menores,
    form.infantes
  ]);

  // ✅ RECALCULAR: Cuando se cargan datos existentes
  useEffect(() => {
    if (shouldRecalculate) {
      console.log('🔄 CALCULADORA: Recalculando totales después de cargar datos existentes...');
      calcularTotales();
      setShouldRecalculate(false);
    }
  }, [shouldRecalculate, calcularTotales]);

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

        // ✅ NUEVO: Calcular automáticamente noches del hotel cuando cambien las fechas
        if (categoria === 'tiquetes' && (campo === 'fecha_ida' || campo === 'fecha_vuelta')) {
          const fechaIda = newForm.tiquetes.fecha_ida;
          const fechaVuelta = newForm.tiquetes.fecha_vuelta;
          
          if (fechaIda && fechaVuelta) {
            const fechaIdaDate = new Date(fechaIda);
            const fechaVueltaDate = new Date(fechaVuelta);
            
            if (fechaVueltaDate > fechaIdaDate) {
              const diffTime = fechaVueltaDate.getTime() - fechaIdaDate.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              const noches = Math.max(0, diffDays - 1);
              
              // Actualizar automáticamente las noches del hotel
              newForm.hotel.noches = noches;
              
              // Recalcular costo total del hotel si ya hay costo por noche
              if (newForm.hotel.costo_noche) {
                newForm.hotel.costo_total = noches * parseFloat(newForm.hotel.costo_noche || 0);
              }
            }
          }
        }

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

  // ✅ NUEVO: Funciones para manejar excursiones
  const addExcursion = () => {
    setForm(prev => ({
      ...prev,
      excursiones: [...prev.excursiones, {
        nombre: '',
        descripcion: '',
        duracion: '',
        costo: 0,
        proveedor: '',
        obligatoria: false
      }]
    }));
  };

  const removeExcursion = (index) => {
    setForm(prev => ({
      ...prev,
      excursiones: prev.excursiones.filter((_, i) => i !== index)
    }));
  };

  const handleExcursionChange = (index, field, value) => {
    setForm(prev => {
      const newExcursiones = [...prev.excursiones];
      newExcursiones[index][field] = value;
      return {
        ...prev,
        excursiones: newExcursiones
      };
    });
  };

  // ✅ NUEVO: Funciones para manejar extras
  const addExtra = () => {
    setForm(prev => ({
      ...prev,
      extras: [...prev.extras, {
        nombre: '',
        descripcion: '',
        costo: 0,
        proveedor: ''
      }]
    }));
  };

  const removeExtra = (index) => {
    setForm(prev => ({
      ...prev,
      extras: prev.extras.filter((_, i) => i !== index)
    }));
  };

  const handleExtraChange = (index, field, value) => {
    setForm(prev => {
      const newExtras = [...prev.extras];
      newExtras[index][field] = value;
      return {
        ...prev,
        extras: newExtras
      };
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
    console.log("🏥 COMPONENTE: Asistencia médica:", form.seguros?.asistencia_medica);
    console.log("🎯 COMPONENTE: Excursiones:", form.excursiones);
    console.log("🎪 COMPONENTE: Actividades adicionales:", form.actividades_adicionales);
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

   // ✅ VALIDACIÓN: Verificar que trip_type esté seleccionado
  if (!form.trip_type) {
    alert("Por favor selecciona el tipo de viaje antes de guardar la cotización");
    return;
  }
  
  // ✅ VALIDACIÓN: Verificar que hay un precio calculado
  if (form.precio_final_total <= 0) {
    console.warn("⚠️ COMPONENTE: Advertencia - El precio final es 0 o negativo");
    if (!confirm("El precio final es $0. ¿Deseas continuar?")) {
      return;
    }
  }

    console.log("📤 COMPONENTE: Enviando datos vía dispatch...");

    // ✅ NUEVO: Log específico para debugging de excursiones/extras antes de enviar
    console.log("🔍 DEBUGGING EXCURSIONES/EXTRAS ANTES DE ENVIAR:");
    console.log("  - Excursiones:", {
      length: form.excursiones?.length || 0,
      data: form.excursiones,
      isArray: Array.isArray(form.excursiones)
    });
    console.log("  - Extras:", {
      length: form.extras?.length || 0,
      data: form.extras,
      isArray: Array.isArray(form.extras)
    });
    console.log("  - Actividades adicionales:", {
      incluidas: form.actividades_adicionales?.incluidas,
      data: form.actividades_adicionales,
    });

    // ✅ NUEVO: Combinar todas las actividades en un solo array de "extras"
    const combinedExtras = [];

    // Solo incluir si actividades están habilitadas
    if (form.actividades_adicionales?.incluidas) {
      // Agregar actividades básicas si existen
      if (form.actividades_adicionales?.actividades?.length > 0) {
        form.actividades_adicionales.actividades.forEach(actividad => {
          if (actividad.descripcion && actividad.costo > 0) {
            combinedExtras.push({
              nombre: actividad.descripcion,
              descripcion: actividad.descripcion,
              costo: parseFloat(actividad.costo),
              proveedor: actividad.proveedor || '',
              tipo: 'actividad_basica'
            });
          }
        });
      }

      // Agregar excursiones
      if (form.excursiones?.length > 0) {
        form.excursiones.forEach(excursion => {
          if (excursion.nombre && excursion.costo > 0) {
            combinedExtras.push({
              nombre: excursion.nombre,
              descripcion: excursion.descripcion || '',
              costo: parseFloat(excursion.costo),
              proveedor: excursion.proveedor || '',
              tipo: 'excursion'
            });
          }
        });
      }

      // Agregar extras
      if (form.extras?.length > 0) {
        form.extras.forEach(extra => {
          if (extra.nombre && extra.costo > 0) {
            combinedExtras.push({
              nombre: extra.nombre,
              descripcion: extra.descripcion || '',
              costo: parseFloat(extra.costo),
              proveedor: extra.proveedor || '',
              tipo: 'servicio_extra'
            });
          }
        });
      }
    }

    console.log("🔄 COMBINANDO ACTIVIDADES EN EXTRAS:");
    console.log("  - Total items combinados:", combinedExtras.length);
    console.log("  - Array combinado:", combinedExtras);

    // ✅ NUEVO: Preparar datos modificados para enviar
    const dataToSend = {
      ...form,
      extras: combinedExtras, // ✅ Solo enviar el array combinado como "extras"
      excursiones: [], // ✅ Vaciar excursiones porque van en extras
      actividades_adicionales: { // ✅ Mantener solo el flag de inclusión
        incluidas: form.actividades_adicionales?.incluidas || false,
        detalle: '',
        costo_por_persona: 0,
        proveedor: ''
      },
      trip_type: form.trip_type,
      // ✅ NUEVO: Asegurar que las fechas se envíen correctamente
      fecha_viaje_inicio: form.tiquetes?.fecha_ida || null,
      fecha_viaje_fin: form.tiquetes?.fecha_vuelta || null,
      // ✅ NUEVO: Marcar que la cotización está lista para ser completada
      ready_for_completion: form.trip_type && form.precio_final_total > 0
    };

    console.log('🗓️ FECHAS ENVIADAS AL BACKEND:', {
      fecha_ida_calculadora: form.tiquetes?.fecha_ida,
      fecha_vuelta_calculadora: form.tiquetes?.fecha_vuelta,
      fecha_viaje_inicio: dataToSend.fecha_viaje_inicio,
      fecha_viaje_fin: dataToSend.fecha_viaje_fin
    });

    console.log("📤 DATOS FINALES A ENVIAR:", dataToSend);
    console.log("📤 EXTRAS FINALES:", dataToSend.extras);
    console.log("🏥 ASISTENCIA MÉDICA ENVIADA:", dataToSend.seguros?.asistencia_medica);
    console.log("🍽️ ALIMENTACIÓN ENVIADA:", dataToSend.alimentacion);
    console.log("🛡️ SEGUROS COMPLETO:", dataToSend.seguros);

    try {
      console.log("💾 CALCULADORA: Usando upsertQuoteCalculation para guardar/actualizar");
      
      // ✅ NUEVO: Mostrar notificación de inicio de guardado
      const toastId = toast.loading("Guardando calculadora de presupuesto...");
      
      const result = await dispatch(upsertQuoteCalculation(dataToSend));
      console.log("📨 CALCULADORA: Resultado del dispatch:", result);

      if (result.meta.requestStatus === 'fulfilled') {
        console.log("✅ COMPONENTE: Cálculo guardado exitosamente");
        console.log("✅ COMPONENTE: Payload de respuesta:", result.payload);

        // ✅ NUEVO: Actualizar notificación de éxito
        toast.update(toastId, {
          render: "✅ Presupuesto guardado exitosamente",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });

        // ✅ NUEVO: Alert de confirmación adicional
        alert(`✅ Presupuesto guardado correctamente\n\n` +
              `💰 Precio final: $${form.precio_final_total?.toLocaleString()}\n` +
              `👥 Por persona: $${form.precio_final_por_persona?.toLocaleString()}\n` +
              `🧑‍🤝‍🧑 Personas que pagan: ${calcularPersonasQuePagan()}`);

        if (onContinue) {
          console.log("🔄 COMPONENTE: Ejecutando callback onContinue...");
          onContinue(result.payload);
        }
      } else {
        console.error("❌ COMPONENTE: El dispatch fue rechazado:", result.error);
        
        // ✅ NUEVO: Actualizar notificación de error
        toast.update(toastId, {
          render: "❌ Error al guardar el presupuesto",
          type: "error",
          isLoading: false,
          autoClose: 5000,
        });
        
        alert("❌ Error al guardar el presupuesto. Por favor intenta nuevamente.");
      }
    } catch (error) {
      console.error("❌ COMPONENTE: Error en try-catch del handleSubmit:", error);
      console.error("❌ COMPONENTE: Error stack:", error.stack);
      
      // ✅ NUEVO: Notificación de error en catch
      toast.error("❌ Error inesperado al guardar el presupuesto");
      alert("❌ Error inesperado al guardar el presupuesto. Revisa la consola para más detalles.");
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
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Viaje</label>
            <select
              value={form.trip_type}
              onChange={(e) => handleInputChange('', 'trip_type', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Seleccionar tipo de viaje --</option>
              <option value="nacional">Viaje Nacional</option>
              <option value="internacional">Viaje Internacional</option>
              <option value="operadorLlano">Operador Llano</option>
              <option value="hotel">Hotel</option>
            </select>
            {!form.trip_type && (
              <p className="text-sm text-amber-600 mt-1">
                ⚠️ Selecciona el tipo de viaje para calcular comisiones correctamente
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Fecha de Ida</label>
            <input
              type="date"
              value={form.tiquetes?.fecha_ida || ''}
              onChange={(e) => handleInputChange('tiquetes', 'fecha_ida', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Fecha de Regreso</label>
            <input
              type="date"
              value={form.tiquetes?.fecha_vuelta || ''}
              onChange={(e) => handleInputChange('tiquetes', 'fecha_vuelta', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
        </div>

        {/* ✅ MEJORADA: Información detallada sobre viaje y pasajeros */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Tipo de Viaje</h4>
              <div className="text-sm">
                {form.trip_type ? (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md font-medium">
                    {form.trip_type === 'nacional' && 'Viaje Nacional'}
                    {form.trip_type === 'internacional' && 'Viaje Internacional'}
                    {form.trip_type === 'operadorLlano' && 'Operador Llano'}
                    {form.trip_type === 'hotel' && 'Hotel'}
                  </span>
                ) : (
                  <span className="text-gray-500 italic">No seleccionado</span>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-2">Número de Personas</h4>
              <div className="text-lg font-semibold text-gray-900">{form.num_personas}</div>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-2">Desglose de Costos</h4>
              <div className="text-sm">
                <div className="flex items-center">
                  <span className="font-medium text-green-700">
                    {calcularPersonasQuePagan()} persona(s) que pagan
                  </span>
                </div>
                {form.infantes > 0 && (
                  <div className="text-blue-600 mt-1">
                    + {form.infantes} infante(s) (gratis)
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  Los costos se calculan solo para adultos y menores
                </div>
              </div>
            </div>
          </div>

          {/* ✅ NUEVA: Información de fechas y duración */}
          {(form.tiquetes?.fecha_ida || form.tiquetes?.fecha_vuelta) && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-700 mb-2">Información del Viaje</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {form.tiquetes?.fecha_ida && (
                  <div>
                    <span className="text-gray-600">Fecha de ida:</span>
                    <div className="font-medium">
                      {new Date(form.tiquetes.fecha_ida).toLocaleDateString('es-ES', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                )}
                {form.tiquetes?.fecha_vuelta && (
                  <div>
                    <span className="text-gray-600">Fecha de regreso:</span>
                    <div className="font-medium">
                      {new Date(form.tiquetes.fecha_vuelta).toLocaleDateString('es-ES', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                )}
                {form.tiquetes?.fecha_ida && form.tiquetes?.fecha_vuelta && (
                  <div>
                    <span className="text-gray-600">Duración:</span>
                    <div className="font-medium">
                      {(() => {
                        const fechaIda = new Date(form.tiquetes.fecha_ida);
                        const fechaVuelta = new Date(form.tiquetes.fecha_vuelta);
                        const diffTime = fechaVuelta.getTime() - fechaIda.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return `${diffDays} día${diffDays !== 1 ? 's' : ''} (${diffDays > 0 ? diffDays - 1 : 0} noche${diffDays !== 2 ? 's' : ''})`;
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
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
                    {/* <div>
                      <label className="block text-sm font-medium mb-1">Valor (por persona)</label>
                      <input
                        type="number"
                        value={form.tiquetes.costo_ida}
                        onChange={e => handleInputChange('tiquetes', 'costo_ida', e.target.value)}
                        className="w-full border rounded px-3 py-2"
                        placeholder="0"
                      />
                    </div> */}
                    {form.tiquetes.tipo === 'ida_vuelta' && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Valor (por persona)</label>
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
                <strong>Total para {calcularPersonasQuePagan()} persona(s) que pagan: ${Number(form.tiquetes.costo_total * calcularPersonasQuePagan()).toLocaleString()}</strong>
                {form.infantes > 0 && (
                  <div className="text-sm text-gray-600 mt-1">
                    + {form.infantes} infante(s) (gratis)
                  </div>
                )}
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
                <strong>Total para {calcularPersonasQuePagan()} persona(s) que pagan: ${Number(form.traslados.costo_total * calcularPersonasQuePagan()).toLocaleString()}</strong>
                {form.infantes > 0 && (
                  <div className="text-sm text-gray-600 mt-1">
                    + {form.infantes} infante(s) (gratis)
                  </div>
                )}
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
                  <label className="block text-sm font-medium mb-1">Valor por Noche (por persona)</label>
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
                <strong>Total para {calcularPersonasQuePagan()} persona(s) que pagan: ${Number(form.hotel.costo_total * calcularPersonasQuePagan()).toLocaleString()}</strong>
                {form.infantes > 0 && (
                  <div className="text-sm text-gray-600 mt-1">
                    + {form.infantes} infante(s) (gratis)
                  </div>
                )}
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
                    <option value="desayuno">Desayuno</option>
                    <option value="media_pension">Desayuno y cena</option>
                    <option value="pension_completa">Desayuno, almuerzo y cena</option>
                    <option value="todo_incluido">Todo Incluido (Desayuno, almuerzo y cena + bebidas y licores + snacks)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Valor Total (por persona)</label>
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
                <strong>Total para {calcularPersonasQuePagan()} persona(s) que pagan: ${Number(form.alimentacion.costo_total * calcularPersonasQuePagan()).toLocaleString()}</strong>
                {form.infantes > 0 && (
                  <div className="text-sm text-gray-600 mt-1">
                    + {form.infantes} infante(s) (gratis)
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sección Servicios */}
        {activeTab === 'servicios' && (
          <div className="space-y-6">
            {/* Seguros */}
            {/* <div className="border rounded-lg p-4">
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
                <strong>Total para {calcularPersonasQuePagan()} persona(s) que pagan: ${Number(form.seguros.costo_total * calcularPersonasQuePagan()).toLocaleString()}</strong>
                {form.infantes > 0 && (
                  <div className="text-sm text-gray-600 mt-1">
                    + {form.infantes} infante(s) (gratis)
                  </div>
                )}
              </div>
            </div> */}

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

                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Valor Total Equipaje (por persona)</label>
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
                <strong>Total para {calcularPersonasQuePagan()} persona(s) que pagan: ${Number(form.equipaje.costo_total * calcularPersonasQuePagan()).toLocaleString()}</strong>
                {form.infantes > 0 && (
                  <div className="text-sm text-gray-600 mt-1">
                    + {form.infantes} infante(s) (gratis)
                  </div>
                )}
              </div>
            </div>

            {/* Asistencia Médica */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">Asistencia Médica</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo de Asistencia</label>
                  <select
                    value={form.seguros?.asistencia_medica?.tipo || 'ninguna'}
                    onChange={e => handleInputChange('seguros', 'asistencia_medica', e.target.value, 'tipo')}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="ninguna">Ninguna</option>
                    <option value="basica">Básica</option>
                    <option value="completa">Completa</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Valor Total (por persona)</label>
                  <input
                    type="number"
                    value={form.seguros?.asistencia_medica?.costo || 0}
                    onChange={e => handleInputChange('seguros', 'asistencia_medica', e.target.value, 'costo')}
                    className="w-full border rounded px-3 py-2"
                    min="0"
                  />
                </div>
              </div>
              <div className="mt-3 p-2 bg-blue-50 rounded">
                <strong>Total Asistencia Médica por persona: ${Number(form.seguros?.asistencia_medica?.costo || 0).toLocaleString()}</strong>
                <br />
                <strong>Total para {calcularPersonasQuePagan()} persona(s) que pagan: ${Number((form.seguros?.asistencia_medica?.costo || 0) * calcularPersonasQuePagan()).toLocaleString()}</strong>
                {form.infantes > 0 && (
                  <div className="text-sm text-gray-600 mt-1">
                    + {form.infantes} infante(s) (gratis)
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sección Actividades */}
        {activeTab === 'actividades' && (
          <div className="space-y-6">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">Actividades Adicionales</h4>

              {/* ✅ NUEVO: Checkbox para incluir actividades */}
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="incluir-actividades"
                  checked={form.actividades_adicionales?.incluidas || false}
                  onChange={(e) => handleInputChange('actividades_adicionales', 'incluidas', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="incluir-actividades" className="text-sm font-medium">
                  Incluir actividades adicionales
                </label>
              </div>

              {/* ✅ NUEVO: Campos de actividades cuando está habilitado */}
              {form.actividades_adicionales?.incluidas && (
                <div className="space-y-4">



                  {/* ✅ SECCIÓN: Excursiones */}
                  <div className="mt-6 border rounded-lg p-4 bg-gray-50">
                    <h5 className="font-medium mb-3 text-gray-700">Excursiones Específicas</h5>

                    {form.excursiones.map((excursion, idx) => (
                      <div key={idx} className="mb-4 p-4 border rounded-lg bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Nombre de la excursión *
                            </label>
                            <input
                              type="text"
                              placeholder="Ej: City Tour, Excursión en barco"
                              value={excursion.nombre || ''}
                              onChange={(e) => handleExcursionChange(idx, 'nombre', e.target.value)}
                              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Valor por persona *
                            </label>
                            <input
                              type="number"
                              placeholder="0"
                              value={excursion.costo || ''}
                              onChange={(e) => handleExcursionChange(idx, 'costo', e.target.value)}
                              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Descripción
                            </label>
                            <input
                              type="text"
                              placeholder="Descripción detallada de la excursión"
                              value={excursion.descripcion || ''}
                              onChange={(e) => handleExcursionChange(idx, 'descripcion', e.target.value)}
                              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Proveedor
                            </label>
                            <input
                              type="text"
                              placeholder="Nombre del proveedor"
                              value={excursion.proveedor || ''}
                              onChange={(e) => handleExcursionChange(idx, 'proveedor', e.target.value)}
                              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-600">
                            Total para {calcularPersonasQuePagan()} persona(s): ${Number((excursion.costo || 0) * calcularPersonasQuePagan()).toLocaleString()}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeExcursion(idx)}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addExcursion}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      + Agregar Excursión
                    </button>

                    {form.excursiones.length > 0 && (
                      <div className="mt-3 p-2 bg-green-50 rounded">
                        <strong>Total Excursiones: ${form.excursiones.reduce((acc, exc) => acc + Number(exc.costo || 0), 0).toLocaleString()} por persona</strong>
                        <br />
                        <strong>Total para {calcularPersonasQuePagan()} persona(s) que pagan: ${(form.excursiones.reduce((acc, exc) => acc + Number(exc.costo || 0), 0) * calcularPersonasQuePagan()).toLocaleString()}</strong>
                      </div>
                    )}
                  </div>

                  {/* ✅ SECCIÓN: Servicios Extras */}
                  <div className="mt-6 border rounded-lg p-4 bg-gray-50">
                    <h5 className="font-medium mb-3 text-gray-700">Servicios Extras</h5>

                    {form.extras.map((extra, idx) => (
                      <div key={idx} className="mb-4 p-4 border rounded-lg bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Nombre del servicio *
                            </label>
                            <input
                              type="text"
                              placeholder="Ej: Seguro adicional, Wi-Fi"
                              value={extra.nombre || ''}
                              onChange={(e) => handleExtraChange(idx, 'nombre', e.target.value)}
                              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Valor total del servicio *
                            </label>
                            <input
                              type="number"
                              placeholder="0"
                              value={extra.costo || ''}
                              onChange={(e) => handleExtraChange(idx, 'costo', e.target.value)}
                              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Descripción
                            </label>
                            <input
                              type="text"
                              placeholder="Descripción del servicio extra"
                              value={extra.descripcion || ''}
                              onChange={(e) => handleExtraChange(idx, 'descripcion', e.target.value)}
                              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Proveedor
                            </label>
                            <input
                              type="text"
                              placeholder="Nombre del proveedor"
                              value={extra.proveedor || ''}
                              onChange={(e) => handleExtraChange(idx, 'proveedor', e.target.value)}
                              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-600">
                            Costo total del servicio: ${Number(extra.costo || 0).toLocaleString()}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeExtra(idx)}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addExtra}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      + Agregar Servicio Extra
                    </button>

                    {form.extras.length > 0 && (
                      <div className="mt-3 p-2 bg-blue-50 rounded">
                        <strong>Total Servicios Extras: ${form.extras.reduce((acc, ext) => acc + Number(ext.costo || 0), 0).toLocaleString()}</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* ✅ NUEVO: Mostrar total calculado */}
            <div className="mt-3 p-2 bg-blue-50 rounded">
              <strong>Total Actividades por persona: ${Number(calcularTotalActividadesExtras()).toLocaleString()}</strong>
              <br />
              <strong>Total para {calcularPersonasQuePagan()} persona(s) que pagan: ${Number(calcularTotalActividadesExtras() * calcularPersonasQuePagan()).toLocaleString()}</strong>
              {form.infantes > 0 && (
                <div className="text-sm text-gray-600 mt-1">
                  + {form.infantes} infante(s) (gratis)
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sección Comisiones */}
        {activeTab === 'comisiones' && (
          <div className="space-y-6">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">Comisiones por Jerarquía</h4>

              {/* ✅ NUEVA: Información sobre cálculo de comisiones */}
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-sm text-yellow-800">
                  <strong>Nota:</strong> Las comisiones por persona se calculan solo para {calcularPersonasQuePagan()} persona(s) que pagan.
                  {form.infantes > 0 && ` Los ${form.infantes} infante(s) no generan comisión.`}
                </div>
              </div>

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
                {/* ✅ CORREGIDO: Los costo_total ya son por persona, mostrarlos directamente */}
                <div className="flex justify-between">
                  <span>Tiquetes (por persona):</span>
                  <span>${Number(form.tiquetes.costo_total || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Hotel (por persona):</span>
                  <span>${Number(form.hotel.costo_total || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Traslados (por persona):</span>
                  <span>${Number(form.traslados.costo_total || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Alimentación (por persona):</span>
                  <span>${Number(form.alimentacion.costo_total || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Seguros (por persona):</span>
                  <span>${Number(form.seguros.costo_total || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Equipaje (por persona):</span>
                  <span>${Number(form.equipaje.costo_total || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Asistencia Médica (por persona):</span>
                  <span>${Number(form.seguros?.asistencia_medica?.costo || 0).toLocaleString()}</span>
                </div>
                {/* ✅ NUEVA: Actividades adicionales detalladas en el resumen */}
                {form.actividades_adicionales?.incluidas && (
                  <>
                    <div className="border-t pt-2 mt-2">
                      <h5 className="font-medium text-gray-700 mb-2">Actividades Extras Incluidas:</h5>

                      {/* Actividades Básicas */}
                      {form.actividades_adicionales?.actividades?.length > 0 && (
                        <div className="ml-4 mb-2">
                          <div className="text-sm font-medium text-blue-600 mb-1">Actividades Básicas:</div>
                          {form.actividades_adicionales.actividades.map((actividad, index) => (
                            <div key={index} className="flex justify-between text-sm ml-2">
                              <span>• {actividad.descripcion}</span>
                              <span>${Number(actividad.costo).toLocaleString()} x {calcularPersonasQuePagan()} = ${Number(actividad.costo * calcularPersonasQuePagan()).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Excursiones */}
                      {form.excursiones?.length > 0 && (
                        <div className="ml-4 mb-2">
                          <div className="text-sm font-medium text-green-600 mb-1">Excursiones:</div>
                          {form.excursiones.map((excursion, index) => (
                            <div key={index} className="flex justify-between text-sm ml-2">
                              <span>• {excursion.descripcion}</span>
                              <span>${Number(excursion.costo).toLocaleString()} x {calcularPersonasQuePagan()} = ${Number(excursion.costo * calcularPersonasQuePagan()).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Servicios Extras */}
                      {form.extras?.length > 0 && (
                        <div className="ml-4 mb-2">
                          <div className="text-sm font-medium text-purple-600 mb-1">Servicios Extras:</div>
                          {form.extras.map((extra, index) => (
                            <div key={index} className="flex justify-between text-sm ml-2">
                              <span>• {extra.descripcion}</span>
                              <span>${Number(extra.costo).toLocaleString()} (costo total)</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Total de actividades */}
                      <div className="flex justify-between font-medium text-orange-600 mt-2 pt-2 border-t">
                        <span>Total Actividades Extras (por persona):</span>
                        <span>${Number(calcularTotalActividadesExtras()).toLocaleString()}</span>
                      </div>
                    </div>
                  </>
                )}
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Costo Base Total ({calcularPersonasQuePagan()} persona(s) que pagan):</span>
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
                    {/* ✅ NUEVA: Información sobre el cálculo */}
                    <div className="text-sm text-gray-600 mt-2 text-center">
                      Precio calculado para {calcularPersonasQuePagan()} persona(s) que pagan
                      {form.infantes > 0 && ` • ${form.infantes} infante(s) incluido(s) gratis`}
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
