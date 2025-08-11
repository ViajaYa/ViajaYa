
const { QuoteCalculation, Quote, User, CommissionConfig } = require('../db');
const { calcularPersonasQuePagan } = require('../utils/quoteCalculations');

const quoteCalculationController = {



    // ✅ NUEVO: Obtener comisiones específicas por trip_type
  getCommissionsByTripType: async (req, res) => {
    try {
      const { quoteId, tripType } = req.params;
      
      // Obtener el quote con la jerarquía
      const quote = await Quote.findByPk(quoteId, {
        include: [
          { model: User, as: 'Asesor', attributes: ['id'] },
          { model: User, as: 'Lider', attributes: ['id'] },
          { model: User, as: 'Gerente', attributes: ['id'] },
          { model: User, as: 'Admin', attributes: ['id'] }
        ]
      });

      if (!quote) {
        return res.status(404).json({ message: 'Cotización no encontrada' });
      }

      // Calcular comisiones según la jerarquía y trip_type
      const comisiones = {
        asesor: { porcentaje: 0, valor_fijo: 0, valor_por_persona: 0, tipo_calculo: 'percentage', total: 0 },
        lider: { porcentaje: 0, valor_fijo: 0, valor_por_persona: 0, tipo_calculo: 'percentage', total: 0 },
        gerente: { porcentaje: 0, valor_fijo: 0, valor_por_persona: 0, tipo_calculo: 'percentage', total: 0 },
        admin: { porcentaje: 0, valor_fijo: 0, valor_por_persona: 0, tipo_calculo: 'percentage', total: 0 },
        total_comisiones: 0
      };

      // Obtener comisiones para cada rol si existe
      if (quote.Asesor) {
        const asesorConfig = await CommissionConfig.findOne({
          where: { role: 'asesor', trip_type: tripType, is_active: true }
        });
        if (asesorConfig) {
          comisiones.asesor.tipo_calculo = asesorConfig.calculation_type;
          comisiones.asesor.porcentaje = parseFloat(asesorConfig.percentage || 0);
          comisiones.asesor.valor_fijo = parseFloat(asesorConfig.fixed_amount || 0);
          comisiones.asesor.valor_por_persona = parseFloat(asesorConfig.amount_per_person || 0);
        }
      }

      if (quote.Lider) {
        const liderConfig = await CommissionConfig.findOne({
          where: { role: 'lider', trip_type: tripType, is_active: true }
        });
        if (liderConfig) {
          comisiones.lider.tipo_calculo = liderConfig.calculation_type;
          comisiones.lider.porcentaje = parseFloat(liderConfig.percentage || 0);
          comisiones.lider.valor_fijo = parseFloat(liderConfig.fixed_amount || 0);
          comisiones.lider.valor_por_persona = parseFloat(liderConfig.amount_per_person || 0);
        }
      }

      if (quote.Gerente) {
        const gerenteConfig = await CommissionConfig.findOne({
          where: { role: 'gerente', trip_type: tripType, is_active: true }
        });
        if (gerenteConfig) {
          comisiones.gerente.tipo_calculo = gerenteConfig.calculation_type;
          comisiones.gerente.porcentaje = parseFloat(gerenteConfig.percentage || 0);
          comisiones.gerente.valor_fijo = parseFloat(gerenteConfig.fixed_amount || 0);
          comisiones.gerente.valor_por_persona = parseFloat(gerenteConfig.amount_per_person || 0);
        }
      }

      if (quote.Admin) {
        const adminConfig = await CommissionConfig.findOne({
          where: { role: 'admin', trip_type: tripType, is_active: true }
        });
        if (adminConfig) {
          comisiones.admin.tipo_calculo = adminConfig.calculation_type;
          comisiones.admin.porcentaje = parseFloat(adminConfig.percentage || 0);
          comisiones.admin.valor_fijo = parseFloat(adminConfig.fixed_amount || 0);
          comisiones.admin.valor_por_persona = parseFloat(adminConfig.amount_per_person || 0);
        }
      }

      res.json({ comisiones });
    } catch (error) {
      console.error('Error obteniendo comisiones por trip_type:', error);
      res.status(500).json({ message: 'Error al obtener comisiones', error: error.message });
    }
  },

  // ✅ NUEVO: Obtener cálculo por quote_id (UUID)
  getCalculationByQuoteId: async (req, res) => {
    try {
      const { quoteId } = req.params;
      const calc = await QuoteCalculation.findOne({ where: { quote_id: quoteId } });
      if (!calc) return res.status(404).json({ message: 'Cálculo no encontrado para esta cotización' });
      res.json(calc);
    } catch (error) {
      console.error('Error obteniendo cálculo por quote_id:', error);
      res.status(500).json({ message: 'Error al obtener el cálculo por quote_id', error: error.message });
    }
  },
  // ✅ NUEVO: Obtener datos base para calculadora desde un Quote
  getCalculationBaseData: async (req, res) => {
    try {
      const { quoteId } = req.params;
      
      // Obtener el quote con toda la jerarquía de ventas
      const quote = await Quote.findByPk(quoteId, {
        include: [
          { model: User, as: 'Asesor', attributes: ['id', 'name', 'lastname'] },
          { model: User, as: 'Lider', attributes: ['id', 'name', 'lastname'] },
          { model: User, as: 'Gerente', attributes: ['id', 'name', 'lastname'] },
          { model: User, as: 'Admin', attributes: ['id', 'name', 'lastname'] },
          { model: User, as: 'Cliente', attributes: ['id', 'name', 'lastname', 'email'] }
        ]
      });

      if (!quote) {
        return res.status(404).json({ message: 'Cotización no encontrada' });
      }

      // Obtener configuraciones de comisión según el tipo de viaje
      const trip_type = quote.trip_type || 'nacional';
      
      // Calcular comisiones según la jerarquía existente
      const comisiones = {
        asesor: { porcentaje: 0, valor_fijo: 0, valor_por_persona: 0, tipo_calculo: 'percentage', total: 0 },
        lider: { porcentaje: 0, valor_fijo: 0, valor_por_persona: 0, tipo_calculo: 'percentage', total: 0 },
        gerente: { porcentaje: 0, valor_fijo: 0, valor_por_persona: 0, tipo_calculo: 'percentage', total: 0 },
        admin: { porcentaje: 0, valor_fijo: 0, valor_por_persona: 0, tipo_calculo: 'percentage', total: 0 },
        total_comisiones: 0
      };

      // Obtener comisiones para cada rol si existe
      if (quote.Asesor) {
        const asesorConfig = await CommissionConfig.findOne({
          where: { 
            role: 'asesor', 
            trip_type,
            is_active: true 
          }
        });
        if (asesorConfig) {
          comisiones.asesor.tipo_calculo = asesorConfig.calculation_type;
          comisiones.asesor.porcentaje = parseFloat(asesorConfig.percentage || 0);
          comisiones.asesor.valor_fijo = parseFloat(asesorConfig.fixed_amount || 0);
          comisiones.asesor.valor_por_persona = parseFloat(asesorConfig.amount_per_person || 0);
        }
      }

      if (quote.Lider) {
        const liderConfig = await CommissionConfig.findOne({
          where: { 
            role: 'lider', 
            trip_type,
            is_active: true 
          }
        });
        if (liderConfig) {
          comisiones.lider.tipo_calculo = liderConfig.calculation_type;
          comisiones.lider.porcentaje = parseFloat(liderConfig.percentage || 0);
          comisiones.lider.valor_fijo = parseFloat(liderConfig.fixed_amount || 0);
          comisiones.lider.valor_por_persona = parseFloat(liderConfig.amount_per_person || 0);
        }
      }

      if (quote.Gerente) {
        const gerenteConfig = await CommissionConfig.findOne({
          where: { 
            role: 'gerente', 
            trip_type,
            is_active: true 
          }
        });
        if (gerenteConfig) {
          comisiones.gerente.tipo_calculo = gerenteConfig.calculation_type;
          comisiones.gerente.porcentaje = parseFloat(gerenteConfig.percentage || 0);
          comisiones.gerente.valor_fijo = parseFloat(gerenteConfig.fixed_amount || 0);
          comisiones.gerente.valor_por_persona = parseFloat(gerenteConfig.amount_per_person || 0);
        }
      }

      if (quote.Admin) {
        const adminConfig = await CommissionConfig.findOne({
          where: { 
            role: 'admin', 
            trip_type,
            is_active: true 
          }
        });
        if (adminConfig) {
          comisiones.admin.tipo_calculo = adminConfig.calculation_type;
          comisiones.admin.porcentaje = parseFloat(adminConfig.percentage || 0);
          comisiones.admin.valor_fijo = parseFloat(adminConfig.fixed_amount || 0);
          comisiones.admin.valor_por_persona = parseFloat(adminConfig.amount_per_person || 0);
        }
      }

      // Datos base para la calculadora
      const baseData = {
        quote_info: {
          id: quote.id,
          numero_personas: quote.numero_personas,
          // ✅ AGREGAR INFORMACIÓN DETALLADA DE PASAJEROS
          adultos: quote.adultos || 0,
          menores: quote.menores || 0,
          infantes: quote.infantes || 0,
          edades_menores: quote.edades_menores || [],
          edades_infantes: quote.edades_infantes || [],
          personas_que_pagan: calcularPersonasQuePagan({
            adultos: quote.adultos,
            menores: quote.menores,
            infantes: quote.infantes
          }),
          destino: quote.destino,
          origen: quote.origen,
          trip_type: quote.trip_type,
          fecha_ida: quote.fecha_ida,
          fecha_regreso: quote.fecha_regreso,
          acomodacion: quote.acomodacion,
          tipo_hotel: quote.tipo_hotel,
          traslado: quote.traslado,
          alimentacion: quote.alimentacion,
          // ✅ CAMPOS ELIMINADOS: ninos, edades_ninos (reemplazados por menores/edades_menores)
        },
        jerarquia_ventas: {
          asesor: quote.Asesor,
          lider: quote.Lider,
          gerente: quote.Gerente,
          admin: quote.Admin,
          cliente: quote.Cliente
        },
        comisiones_configuradas: comisiones,
        calculadora_defaults: {
          tiquetes: {
            tipo: 'ida_vuelta',
            origen: quote.origen,
            destino: quote.destino,
            fecha_ida: quote.fecha_ida,
            fecha_vuelta: quote.fecha_regreso
          },
          hotel: {
            acomodacion: quote.acomodacion || 'doble',
            categoria: quote.tipo_hotel || '3_estrellas',
            noches: quote.fecha_ida && quote.fecha_regreso ? 
              Math.ceil((new Date(quote.fecha_regreso) - new Date(quote.fecha_ida)) / (1000 * 60 * 60 * 24)) : 0
          },
          traslados: {
            aeropuerto_hotel_ida: { incluido: quote.traslado, costo: 0 },
            hotel_aeropuerto_vuelta: { incluido: quote.traslado, costo: 0 }
          },
          alimentacion: {
            tipo: quote.alimentacion ? 'desayuno' : 'ninguna'
          },
          // ✅ INFORMACIÓN DE PASAJEROS ACTUALIZADA
          num_personas: quote.numero_personas,
          num_personas_que_pagan: calcularPersonasQuePagan({
            adultos: quote.adultos,
            menores: quote.menores,
            infantes: quote.infantes
          }),
          adultos: quote.adultos || 0,
          menores: quote.menores || 0,
          infantes: quote.infantes || 0,
          fecha_viaje_inicio: quote.fecha_ida,
          fecha_viaje_fin: quote.fecha_regreso
        }
      };

      res.json(baseData);

    } catch (error) {
      console.error('Error obteniendo datos base para calculadora:', error);
      res.status(500).json({ 
        message: 'Error al obtener datos base para calculadora', 
        error: error.message 
      });
    }
  },

  // Crear cálculo temporal
  createCalculation: async (req, res) => {
    try {
      const data = req.body;
      
      // ✅ NUEVO: Logging detallado para debugging
      console.log('📊 DATOS RECIBIDOS EN createCalculation:', {
        keys: Object.keys(data),
        excursiones: data.excursiones ? 'PRESENTE' : 'AUSENTE',
        extras: data.extras ? 'PRESENTE' : 'AUSENTE', 
        items: data.items ? 'PRESENTE' : 'AUSENTE',
        excursiones_length: Array.isArray(data.excursiones) ? data.excursiones.length : 'NO ES ARRAY',
        extras_length: Array.isArray(data.extras) ? data.extras.length : 'NO ES ARRAY'
      });
      
      // ✅ NUEVO: Procesar y validar actividades antes de guardar
      if (data.excursiones && Array.isArray(data.excursiones)) {
        console.log('🎯 Excursiones procesadas:', data.excursiones.length, 'items');
        data.excursiones.forEach((exc, index) => {
          console.log(`  Excursión ${index + 1}:`, {
            nombre: exc.nombre,
            costo: exc.costo,
            keys: Object.keys(exc)
          });
        });
      }
      
      if (data.extras && Array.isArray(data.extras)) {
        console.log('🎯 Extras procesados:', data.extras.length, 'items');
        data.extras.forEach((ext, index) => {
          console.log(`  Extra ${index + 1}:`, {
            nombre: ext.nombre,
            costo: ext.costo,
            keys: Object.keys(ext)
          });
        });
      }
      
      // Si viene quote_id, verificar si ya existe un cálculo para esa cotización
      if (data.quote_id) {
        const existingCalc = await QuoteCalculation.findOne({ 
          where: { quote_id: data.quote_id } 
        });
        
        if (existingCalc) {
          // Actualizar el cálculo existente
          console.log('🔄 Actualizando cálculo existente para quote_id:', data.quote_id);
          await existingCalc.update(data);
          return res.json(existingCalc);
        }
      }
      
      // Si no existe, crear uno nuevo
      console.log('✨ Creando nuevo cálculo');
      const calc = await QuoteCalculation.create(data);
      res.json(calc);
    } catch (error) {
      console.error('Error creando/actualizando cálculo:', error);
      res.status(500).json({ message: 'Error al crear/actualizar el cálculo', error: error.message });
    }
  },

  // Crear o actualizar cálculo (upsert)
  upsertCalculation: async (req, res) => {
    try {
      const data = req.body;
      
      // ✅ NUEVO: Logging detallado para debugging de actividades
      console.log('📊 DATOS RECIBIDOS EN upsertCalculation:', {
        quote_id: data.quote_id,
        keys: Object.keys(data),
        excursiones: data.excursiones ? 'PRESENTE' : 'AUSENTE',
        extras: data.extras ? 'PRESENTE' : 'AUSENTE',
        items: data.items ? 'PRESENTE' : 'AUSENTE'
      });
      
      // ✅ NUEVO: Log específico del contenido de arrays
      if (data.excursiones) {
        console.log('🎯 EXCURSIONES DETALLE:', {
          es_array: Array.isArray(data.excursiones),
          longitud: data.excursiones.length,
          contenido: data.excursiones,
          primer_elemento: data.excursiones[0] || 'VACÍO'
        });
      }
      
      if (data.extras) {
        console.log('🎪 EXTRAS DETALLE:', {
          es_array: Array.isArray(data.extras),
          longitud: data.extras.length,
          contenido: data.extras,
          primer_elemento: data.extras[0] || 'VACÍO'
        });
      }
      
      // ✅ NUEVO: Log de campos de pasajeros
      console.log('👥 PASAJEROS RECIBIDOS:', {
        adultos: data.adultos,
        menores: data.menores,
        infantes: data.infantes,
        edades_menores: data.edades_menores,
        edades_infantes: data.edades_infantes,
        num_personas: data.num_personas
      });
      
      if (!data.quote_id) {
        return res.status(400).json({ message: 'quote_id es requerido para upsert' });
      }

      // Buscar cálculo existente
      const existingCalc = await QuoteCalculation.findOne({ 
        where: { quote_id: data.quote_id } 
      });

      if (existingCalc) {
        // Actualizar existente
        console.log('🔄 Actualizando cálculo existente ID:', existingCalc.id, 'para quote_id:', data.quote_id);
        
        // Remover id y timestamps del data para evitar conflictos
        const { id, createdAt, updatedAt, ...updateData } = data;
        
        await existingCalc.update(updateData);
        const updatedCalc = await QuoteCalculation.findByPk(existingCalc.id);
        return res.json(updatedCalc);
      } else {
        // Crear nuevo
        console.log('✨ Creando nuevo cálculo para quote_id:', data.quote_id);
        const calc = await QuoteCalculation.create(data);
        return res.json(calc);
      }
    } catch (error) {
      console.error('Error en upsert de cálculo:', error);
      res.status(500).json({ message: 'Error al crear/actualizar el cálculo', error: error.message });
    }
  },

  // Obtener cálculo por ID
  getCalculationById: async (req, res) => {
    try {
      const calc = await QuoteCalculation.findByPk(req.params.id);
      if (!calc) return res.status(404).json({ message: 'Cálculo no encontrado' });
      res.json(calc);
    } catch (error) {
      console.error('Error obteniendo cálculo:', error);
      res.status(500).json({ message: 'Error al obtener el cálculo', error: error.message });
    }
  },

  // Confirmar cálculo y asociar a cotización
  confirmCalculation: async (req, res) => {
    try {
      const { quote_id } = req.body;
      const calc = await QuoteCalculation.findByPk(req.params.id);
      if (!calc) return res.status(404).json({ message: 'Cálculo no encontrado' });
      calc.estado = 'confirmado';
      calc.quote_id = quote_id;
      await calc.save();
      res.json(calc);
    } catch (error) {
      console.error('Error confirmando cálculo:', error);
      res.status(500).json({ message: 'Error al confirmar el cálculo', error: error.message });
    }
  },
};

module.exports = quoteCalculationController;
