const {
  Contract,
  Quote,
  User,
  Passenger,
  Payment,
  PackagePurchase,
  Commission,
  Purchase,
  ContractItem,
  QuoteCalculation,
} = require("../db");

const { generateContractPDF } = require("../utils/generateContractPDF");
const commissionController = require("./commissionController");
const {
  generateSignatureToken,
  verifySignatureToken,
} = require("../utils/generateSignatureToken");
const {
  generateSignedContractPDF,
} = require("../utils/generateSignedContractPDF");

const contractController = {
  // Crear nuevo contrato basado en cotización aprobada
  createContract: async (req, res) => {
    console.log("Llamada a createContract", req.body);
    try {
      const {
        quote_id, // ✅ AGREGADO: Aceptar trip_type explícito del frontend
        forma_pago,
        numero_cuotas,
        fecha_inicio_viaje,
        fecha_fin_viaje,
        fecha_vencimiento_cuotas,
      } = req.body;

      // Verificar que la cotización existe y está aprobada
      const quote = await Quote.findByPk(quote_id, {
        include: [{ model: User, as: "Cliente" }],
      });
      console.log("Cotización encontrada:", quote?.status, quote?.id);

      if (!quote) {
        return res.status(404).json({ message: "Cotización no encontrada" });
      }

      if (quote.status !== "approved") {
        return res.status(400).json({
          message: "La cotización debe estar aprobada para crear un contrato",
        });
      }

      // Verificar que no existe ya un contrato para esta cotización
      const existingContract = await Contract.findOne({ where: { quote_id } });
      if (existingContract) {
        return res.status(400).json({
          message: "Ya existe un contrato para esta cotización",
        });
      }

      // Generar número de contrato único
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const day = String(currentDate.getDate()).padStart(2, "0");

      const lastContract = await Contract.findOne({
        where: {
          contract_number: {
            [require("sequelize").Op.startsWith]: `CONT-${year}${month}${day}-`,
          },
        },
        order: [["created_at", "DESC"]],
      });

      let sequence = 1;
      if (lastContract) {
        const lastSequence = parseInt(
          lastContract.contract_number.split("-")[2]
        );
        sequence = lastSequence + 1;
      }

      const contract_number = `CONT-${year}${month}${day}-${String(
        sequence
      ).padStart(3, "0")}`;

      // Calcular valores de cuotas
      const precio_total = quote.precio_total;
      let valor_cuota = precio_total;

      if (forma_pago === "cuotas" && numero_cuotas > 1) {
        valor_cuota = precio_total / numero_cuotas;
      }

      // ✅ DEBUG: Verificar trip_type de la cotización
      console.log(
        "🔍 DEBUG - createContract recibió quote con trip_type:",
        quote.trip_type
      );
      console.log(
        "🔍 DEBUG - createContract recibió trip_type explícito:",
        trip_type
      );
      console.log("🔍 DEBUG - Quote completa:", {
        id: quote.id,
        destino: quote.destino,
        trip_type: quote.trip_type,
        updatedAt: quote.updatedAt,
      });

      const finalTripType = trip_type || quote.trip_type || "nacional";
      console.log("🔍 DEBUG - Tipo final asignado al contrato:", finalTripType);

      const newContract = await Contract.create({
        contract_number,
        quote_id,
        cliente_id: quote.cliente_id,
        trip_type: quote.trip_type, // ✅ CORREGIDO: Usar valor explícito primero
        precio_total,
        forma_pago,
        numero_cuotas: forma_pago === "cuotas" ? numero_cuotas : 1,
        valor_cuota,
        fecha_vencimiento_cuotas: fecha_vencimiento_cuotas || [],
        fecha_inicio_viaje,
        fecha_fin_viaje,
        saldo_pendiente: precio_total,
        status: "draft",
      });

      const contractWithDetails = await Contract.findByPk(newContract.id, {
        include: [
          {
            model: Quote,
            as: "Quote", // ✅ AGREGAR EL ALIAS REQUERIDO
            attributes: [
              "id",
              "quote_number",
              "nombre_cliente",
              "email_cliente",
              "destino",
              "trip_type",
              "origen",
              "precio_total",
              "numero_personas",
              "fecha_ida",
              "fecha_regreso",
            ],
            include: [
              // ✅ MANTENER: Jerarquía de ventas de la cotización
              {
                model: User,
                as: "Asesor",
                attributes: ["id", "name", "lastname", "email", "role"],
                required: false,
              },
              {
                model: User,
                as: "Lider",
                attributes: ["id", "name", "lastname", "email", "role"],
                required: false,
              },
              {
                model: User,
                as: "Gerente",
                attributes: ["id", "name", "lastname", "email", "role"],
                required: false,
              },
              {
                model: User,
                as: "Admin",
                attributes: ["id", "name", "lastname", "email", "role"],
                required: false,
              },
            ],
          },
          // ✅ AGREGAR: Relación directa con el cliente del contrato
          {
            model: User,
            as: "Cliente", // ✅ Cliente directo del contrato
            attributes: ["id", "name", "lastname", "email", "phone"],
            required: false,
          },
        ],
      });

      res.status(201).json({
        message: "Contrato creado exitosamente",
        contract: contractWithDetails,
      });
    } catch (error) {
      console.error("Error creating contract:", error);
      res.status(500).json({
        message: "Error al crear el contrato",
        error: error.message,
      });
    }
  },

  // Obtener todos los contratos
  getAllContracts: async (req, res) => {
    try {
      const contracts = await Contract.findAndCountAll({
        include: [
          {
            model: Quote,
            as: "Quote", // ✅ AGREGAR ESTE ALIAS
            attributes: [
              "id",
              "quote_number",
              "nombre_cliente",
              "email_cliente",
              "destino",
              "trip_type",
              "origen",
              "precio_total",
              "numero_personas",
            ],
            include: [
              // ✅ Jerarquía de ventas desde la cotización
              {
                model: User,
                as: "Asesor",
                attributes: ["id", "name", "lastname", "email"],
                required: false,
              },
              {
                model: User,
                as: "Lider",
                attributes: ["id", "name", "lastname", "email"],
                required: false,
              },
              {
                model: User,
                as: "Gerente",
                attributes: ["id", "name", "lastname", "email"],
                required: false,
              },
              {
                model: User,
                as: "Admin",
                attributes: ["id", "name", "lastname", "email"],
                required: false,
              },
            ],
          },

          {
            model: User,
            as: "Cliente", // ✅ Cliente directo del contrato
            attributes: ["id", "name", "lastname", "email", "phone"],
            required: false,
          },
        ],
        order: [["created_at", "DESC"]],
      });

      res.json({
        success: true,
        contracts: contracts.rows,
        total: contracts.count,
      });
    } catch (error) {
      console.error("Error getting contracts:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener los contratos",
        error: error.message,
      });
    }
  },

  // Obtener contrato por ID
  getContractById: async (req, res) => {
  try {
    const { id } = req.params;

    const contract = await Contract.findByPk(id, {
      include: [
        {
          model: Quote,
          as: "Quote",
          attributes: [
            "id", "quote_number", "nombre_cliente", "email_cliente",
            "destino", "trip_type", "origen", "precio_total", 
            "numero_personas", "fecha_ida", "fecha_regreso"
          ],
          include: [
            // ✅ INCLUIR: Información del equipo de ventas
            {
              model: User,
              as: "Asesor",
              attributes: ["id", "name", "lastname", "email"],
              required: false,
            },
            {
              model: User,
              as: "Lider",
              attributes: ["id", "name", "lastname", "email"],
              required: false,
            },
            {
              model: User,
              as: "Gerente",
              attributes: ["id", "name", "lastname", "email"],
              required: false,
            },
            {
              model: User,
              as: "Admin",
              attributes: ["id", "name", "lastname", "email"],
              required: false,
            },
            // ✅ INCLUIR: Información de pasajeros
            {
              model: Passenger,
              as: "Passengers",
              attributes: [
                "id", "nombre", "apellido", "documento_identidad",
                "tipo_documento", "fecha_nacimiento", "titular"
              ],
            },
            // ✅ INCLUIR: Cálculo completo de cotización
             {
              model: QuoteCalculation,
              as: "Calculation",
              attributes: [
                // IDs y básicos
                "id", "user_id", "quote_id", "num_personas",
                // Estructuras JSONB 
                "tiquetes", "hotel", "traslados", "alimentacion", "equipaje", 
                "seguros", "excursiones", "extras", "comisiones", "ganancia",
                // Totales calculados
                "costo_base", "total_comisiones", "total_ganancia", "precio_final_total",
                // Metadatos
                "estado", "observaciones_generales", "fecha_viaje_inicio", "fecha_viaje_fin"
              ],
              required: false,
            },
          ],
        },
        // ✅ CLIENTE: Del contrato directamente
        {
          model: User,
          as: "Cliente",
          attributes: ["id", "name", "lastname", "email", "phone", "documento_identidad", "tipo_documento"],
          required: false,
        },
        // ✅ ITEMS: Items del contrato ya generados
        {
          model: ContractItem,
          as: "Items",
          attributes: [
            "id", "tipo", "descripcion", "detalle", "precio_total", "cantidad",
            "precio_unitario", "status", "fecha_vencimiento_pago", "proveedor",
            "observaciones", "created_at"
          ],
          include: [
            {
              model: Purchase,
              as: "Purchases",
              attributes:[
                "id", "costo", "fecha_compra", "comprobante_url", 
                "estado_pago", // ✅ CORREGIR: usar "estado_pago" en lugar de "status"
                "proveedor", "tipo_comprobante", "moneda", "diferencia_precio",
                "fecha_vencimiento_pago", "observaciones"
              ],
              required: false,
            }
          ],
          required: false,
        },
      ],
    });

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: "Contrato no encontrado",
      });
    }

     // ✅ PROCESAR: Información de pasajeros
    const passengers = contract.Quote?.Passengers || [];
    const titularPassenger = passengers.find((p) => p.titular === true);

    // ✅ PROCESAR: Análisis del cálculo usando estructura JSONB correcta
    let calculationAnalysis = null;
    if (contract.Quote?.Calculation) {
      const calc = contract.Quote.Calculation;
      const potentialItems = [];
      let totalItemsValue = 0;

      // ✅ TICKETS - Estructura JSONB correcta
      if (calc.tiquetes && typeof calc.tiquetes === 'object') {
        const tiquetesCosto = parseFloat(calc.tiquetes.costo_total || 0);
        if (tiquetesCosto > 0) {
          potentialItems.push({
            tipo: "tickets",
            descripcion: `Tickets aéreos ${calc.tiquetes.origen || contract.Quote.origen} - ${calc.tiquetes.destino || contract.Quote.destino}`,
            valor: tiquetesCosto,
            requiere_compra: true,
            prioridad: "critica",
            detalles: {
              tipo: calc.tiquetes.tipo,
              origen: calc.tiquetes.origen,
              destino: calc.tiquetes.destino,
              fecha_ida: calc.tiquetes.fecha_ida,
              fecha_vuelta: calc.tiquetes.fecha_vuelta,
              proveedor: calc.tiquetes.proveedor
            }
          });
          totalItemsValue += tiquetesCosto;
        }
      }

      // ✅ HOTEL - Estructura JSONB correcta
      if (calc.hotel && typeof calc.hotel === 'object') {
        const hotelCosto = parseFloat(calc.hotel.costo_total || 0);
        if (hotelCosto > 0) {
          potentialItems.push({
            tipo: "hotel",
            descripcion: `Alojamiento ${calc.hotel.categoria || calc.hotel.nombre || 'N/A'}`,
            valor: hotelCosto,
            requiere_compra: true,
            prioridad: "alta",
            detalles: {
              nombre: calc.hotel.nombre,
              categoria: calc.hotel.categoria,
              acomodacion: calc.hotel.acomodacion,
              noches: calc.hotel.noches,
              costo_noche: calc.hotel.costo_noche,
              ubicacion: calc.hotel.ubicacion,
              proveedor: calc.hotel.proveedor
            }
          });
          totalItemsValue += hotelCosto;
        }
      }

      // ✅ TRASLADOS - Estructura JSONB correcta
      if (calc.traslados && typeof calc.traslados === 'object') {
        const trasladosCosto = parseFloat(calc.traslados.costo_total || 0);
        if (trasladosCosto > 0) {
          potentialItems.push({
            tipo: "traslados",
            descripcion: "Traslados",
            valor: trasladosCosto,
            requiere_compra: true,
            prioridad: "media",
            detalles: calc.traslados
          });
          totalItemsValue += trasladosCosto;
        }
      }

      // ✅ ALIMENTACIÓN - Estructura JSONB correcta
      if (calc.alimentacion && typeof calc.alimentacion === 'object') {
        const alimentacionCosto = parseFloat(calc.alimentacion.costo_total || 0);
        if (alimentacionCosto > 0) {
          potentialItems.push({
            tipo: "alimentacion",
            descripcion: `Alimentación ${calc.alimentacion.tipo || 'incluida'}`,
            valor: alimentacionCosto,
            requiere_compra: true,
            prioridad: "media",
            detalles: calc.alimentacion
          });
          totalItemsValue += alimentacionCosto;
        }
      }

      // ✅ EQUIPAJE - Estructura JSONB correcta
      if (calc.equipaje && typeof calc.equipaje === 'object') {
        const equipajeCosto = parseFloat(calc.equipaje.costo_total || 0);
        if (equipajeCosto > 0) {
          potentialItems.push({
            tipo: "equipaje",
            descripcion: "Equipaje adicional",
            valor: equipajeCosto,
            requiere_compra: true,
            prioridad: "baja",
            detalles: calc.equipaje
          });
          totalItemsValue += equipajeCosto;
        }
      }

      // ✅ SEGUROS - Estructura JSONB correcta
      if (calc.seguros && typeof calc.seguros === 'object') {
        const segurosCosto = parseFloat(calc.seguros.costo_total || 0);
        if (segurosCosto > 0) {
          potentialItems.push({
            tipo: "seguros",
            descripcion: "Seguros de viaje",
            valor: segurosCosto,
            requiere_compra: true,
            prioridad: "alta",
            detalles: calc.seguros
          });
          totalItemsValue += segurosCosto;
        }
      }

      // ✅ EXCURSIONES - Array JSONB
      if (calc.excursiones && Array.isArray(calc.excursiones)) {
        calc.excursiones.forEach((excursion, index) => {
          const excursionCosto = parseFloat(excursion.costo || 0);
          if (excursionCosto > 0) {
            potentialItems.push({
              tipo: "excursiones",
              descripcion: excursion.nombre || `Excursión ${index + 1}`,
              valor: excursionCosto,
              requiere_compra: true,
              prioridad: "media",
              detalles: excursion
            });
            totalItemsValue += excursionCosto;
          }
        });
      }

      // ✅ EXTRAS - Array JSONB
      if (calc.extras && Array.isArray(calc.extras)) {
        calc.extras.forEach((extra, index) => {
          const extraCosto = parseFloat(extra.costo || 0);
          if (extraCosto > 0) {
            potentialItems.push({
              tipo: "extras",
              descripcion: extra.nombre || `Extra ${index + 1}`,
              valor: extraCosto,
              requiere_compra: true,
              prioridad: "baja",
              detalles: extra
            });
            totalItemsValue += extraCosto;
          }
        });
      }

      // ✅ COMISIONES - Estructura JSONB (NO REQUIEREN COMPRA)
      if (calc.comisiones && typeof calc.comisiones === 'object') {
        const totalComisiones = parseFloat(calc.comisiones.total_comisiones || calc.total_comisiones || 0);
        if (totalComisiones > 0) {
          potentialItems.push({
            tipo: "comisiones",
            descripcion: "Comisiones de ventas",
            valor: totalComisiones,
            requiere_compra: false,
            prioridad: "informativa",
            detalles: calc.comisiones
          });
        }
      }

      // ✅ GANANCIA - Estructura JSONB (NO REQUIERE COMPRA)
      if (calc.ganancia && typeof calc.ganancia === 'object') {
        const totalGanancia = parseFloat(calc.ganancia.total || calc.total_ganancia || 0);
        if (totalGanancia > 0) {
          potentialItems.push({
            tipo: "ganancia_empresa",
            descripcion: "Ganancia Empresa",
            valor: totalGanancia,
            requiere_compra: false,
            prioridad: "informativa",
            detalles: calc.ganancia
          });
        }
      }

      calculationAnalysis = {
        calculation_id: calc.id,
        total_items_potenciales: potentialItems.length,
        items_requieren_compra: potentialItems.filter(item => item.requiere_compra).length,
        items_informativos: potentialItems.filter(item => !item.requiere_compra).length,
        valor_total_compras: totalItemsValue,
        financials: {
          costo_base: parseFloat(calc.costo_base || 0),
          precio_final_total: parseFloat(calc.precio_final_total || 0),
          total_comisiones: parseFloat(calc.total_comisiones || 0),
          total_ganancia: parseFloat(calc.total_ganancia || 0),
        },
        items_detallados: potentialItems,
        calculation_metadata: {
          estado: calc.estado,
          observaciones: calc.observaciones_generales,
          fecha_viaje_inicio: calc.fecha_viaje_inicio,
          fecha_viaje_fin: calc.fecha_viaje_fin,
          num_personas: calc.num_personas
        }
      };
    }

    // ✅ PROCESAR: Análisis de items existentes (CORREGIR referencias a Purchase)
    const existingItems = contract.Items || [];
    const itemsAnalysis = {
      total: existingItems.length,
      requieren_compra: existingItems.filter(item => 
        ['pendiente_compra', 'comprado_pendiente'].includes(item.status)
      ).length,
      completados: existingItems.filter(item => item.status === 'comprado_pagado').length,
      vencidos: existingItems.filter(item => item.status === 'vencido').length,
      no_requieren: existingItems.filter(item => item.status === 'no_requiere').length,
      valor_total_cotizado: existingItems.reduce((sum, item) => 
        sum + parseFloat(item.precio_total || 0), 0
      ),
      // ✅ CORREGIR: Usar "estado_pago" en lugar de "status" para Purchases
      valor_total_comprado: existingItems.reduce((sum, item) => {
        if (item.Purchases && item.Purchases.length > 0) {
          const purchasesPagadas = item.Purchases.filter(purchase => purchase.estado_pago === 'pagado');
          if (purchasesPagadas.length > 0) {
            return sum + parseFloat(purchasesPagadas[0].costo || 0);
          }
        }
        return sum;
      }, 0),
      items_por_tipo: existingItems.reduce((acc, item) => {
        acc[item.tipo] = (acc[item.tipo] || 0) + 1;
        return acc;
      }, {}),
      items_por_status: existingItems.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {}),
      // ✅ AGREGAR: Análisis de compras por estado
      purchases_analysis: existingItems.reduce((acc, item) => {
        if (item.Purchases && item.Purchases.length > 0) {
          item.Purchases.forEach(purchase => {
            acc[purchase.estado_pago] = (acc[purchase.estado_pago] || 0) + 1;
          });
        }
        return acc;
      }, {})
    };

    // ✅ RESPUESTA: Información completa y estructurada
    res.json({
      success: true,
      contract,
      
      // Información de pasajeros
      passengers_summary: {
        total: passengers.length,
        expected: contract.Quote?.numero_personas || 0,
        complete: passengers.length === contract.Quote?.numero_personas,
        has_children: (contract.Quote?.ninos || 0) > 0,
        children_count: contract.Quote?.ninos || 0,
        children_ages: contract.Quote?.edades_ninos || [],
        titular: titularPassenger ? {
          nombre: `${titularPassenger.nombre} ${titularPassenger.apellido}`,
          documento: `${titularPassenger.tipo_documento}: ${titularPassenger.documento_identidad}`,
          fecha_nacimiento: titularPassenger.fecha_nacimiento
        } : null,
        all_passengers: passengers,
      },
      
      // ✅ ANÁLISIS: Del cálculo de cotización (lo que se puede convertir)
      quote_calculation_analysis: calculationAnalysis,
      
      // ✅ ANÁLISIS: De items existentes (lo que ya está convertido)  
      contract_items_analysis: itemsAnalysis,
      
      // ✅ STATUS: Del proceso de conversión
      conversion_status: {
        calculation_exists: !!contract.Quote?.Calculation,
        items_generated: existingItems.length > 0,
        can_convert: !!contract.Quote?.Calculation && existingItems.length === 0,
        ready_for_purchase_management: existingItems.length > 0,
        has_purchases: existingItems.some(item => 
          item.Purchases && item.Purchases.length > 0
        ),
      },

      // ✅ INFORMACIÓN: Adicional del viaje
      trip_details: {
        origen: contract.Quote?.origen,
        destino: contract.Quote?.destino,
        trip_type: contract.Quote?.trip_type,
        fecha_ida: contract.Quote?.fecha_ida,
        fecha_regreso: contract.Quote?.fecha_regreso,
        duracion_dias: contract.Quote?.fecha_ida && contract.Quote?.fecha_regreso ? 
          Math.ceil((new Date(contract.Quote.fecha_regreso) - new Date(contract.Quote.fecha_ida)) / (1000 * 60 * 60 * 24)) : 0,
        numero_personas: contract.Quote?.numero_personas,
        acomodacion: contract.Quote?.acomodacion,
        incluye_traslado: contract.Quote?.traslado,
        tipo_hotel: contract.Quote?.tipo_hotel,
        alimentacion: contract.Quote?.alimentacion,
      }
    });

  } catch (error) {
    console.error("Error getting contract with calculation:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el contrato con cálculo de cotización",
      error: error.message,
    });
  }
},

  convertQuoteToContractItems: async (req, res) => {
    try {
      const { contractId } = req.params;

      const contract = await Contract.findByPk(contractId, {
        include: [
          {
            model: Quote,
            as: "Quote",
            include: [
              {
                model: QuoteCalculation,
                as: "Calculation",
              },
            ],
          },
        ],
      });

      if (!contract) {
        return res.status(404).json({
          success: false,
          message: "Contrato no encontrado",
        });
      }

      if (!contract.Quote?.Calculation) {
        return res.status(400).json({
          success: false,
          message: "El contrato no tiene cálculo de cotización asociado",
        });
      }

      const calc = contract.Quote.Calculation;
      const items = [];

      // ✅ CONVERTIR: Cálculo a items de contrato
      if (calc.tiquetes_costo > 0) {
        items.push({
          contract_id: contractId,
          quote_id: contract.quote_id,
          quote_calculation_id: calc.id,
          tipo: "tickets",
          descripcion: `Tickets aéreos ${calc.tiquetes_origen} - ${calc.tiquetes_destino}`,
          detalle: `${calc.tiquetes_tipo} para ${calc.num_personas} personas`,
          precio_total: calc.tiquetes_costo,
          precio_cotizado: calc.tiquetes_costo, // Para comparar después
          cantidad: calc.num_personas,
          precio_unitario: calc.tiquetes_costo / calc.num_personas,
          status: "pendiente_compra",
          requiere_compra: true,
          compra_automatica_sugerida: true, // Para tickets = 24h automático
          prioridad: "critica",
        });
      }

      if (calc.hotel_costo_total > 0) {
        items.push({
          contract_id: contractId,
          quote_id: contract.quote_id,
          quote_calculation_id: calc.id,
          tipo: "hotel",
          descripcion: `Alojamiento ${calc.hotel_categoria}`,
          detalle: `${calc.hotel_noches} noches, acomodación ${calc.hotel_acomodacion}`,
          precio_total: calc.hotel_costo_total,
          precio_cotizado: calc.hotel_costo_total,
          cantidad: calc.hotel_noches,
          precio_unitario: calc.hotel_costo_total / calc.hotel_noches,
          status: "pendiente_compra",
          requiere_compra: true,
          prioridad: "alta",
        });
      }

      if (calc.traslados_costo > 0) {
        items.push({
          contract_id: contractId,
          quote_id: contract.quote_id,
          quote_calculation_id: calc.id,
          tipo: "traslados",
          descripcion: "Traslados",
          detalle:
            calc.traslados_detalle || "Traslados aeropuerto-hotel-aeropuerto",
          precio_total: calc.traslados_costo,
          precio_cotizado: calc.traslados_costo,
          cantidad: 1,
          precio_unitario: calc.traslados_costo,
          status: "pendiente_compra",
          requiere_compra: true,
          prioridad: "media",
        });
      }

      if (calc.seguro_costo > 0) {
        items.push({
          contract_id: contractId,
          quote_id: contract.quote_id,
          quote_calculation_id: calc.id,
          tipo: "seguro_asistencia",
          descripcion: "Seguro de Asistencia",
          detalle: `Cobertura para ${calc.num_personas} personas`,
          precio_total: calc.seguro_costo,
          precio_cotizado: calc.seguro_costo,
          cantidad: calc.num_personas,
          precio_unitario: calc.seguro_costo / calc.num_personas,
          status: "pendiente_compra",
          requiere_compra: true,
          prioridad: "alta",
        });
      }

      // Items que NO requieren compra (comisiones y ganancia)
      if (calc.comision_asesor > 0) {
        items.push({
          contract_id: contractId,
          quote_id: contract.quote_id,
          quote_calculation_id: calc.id,
          tipo: "comisiones",
          descripcion: "Comisión Asesor",
          detalle: `Comisión para el asesor`,
          precio_total: calc.comision_asesor,
          precio_cotizado: calc.comision_asesor,
          cantidad: 1,
          precio_unitario: calc.comision_asesor,
          status: "no_requiere",
          requiere_compra: false,
          prioridad: "baja",
        });
      }

      if (calc.ganancia_empresa > 0) {
        items.push({
          contract_id: contractId,
          quote_id: contract.quote_id,
          quote_calculation_id: calc.id,
          tipo: "ganancia_empresa",
          descripción: "Ganancia Empresa",
          detalle: "Margen de ganancia para la empresa",
          precio_total: calc.ganancia_empresa,
          precio_cotizado: calc.ganancia_empresa,
          cantidad: 1,
          precio_unitario: calc.ganancia_empresa,
          status: "no_requiere",
          requiere_compra: false,
          prioridad: "baja",
        });
      }

      // ✅ CREAR: Items en batch
      const createdItems = await ContractItem.bulkCreate(items, {
        returning: true,
      });

      res.json({
        success: true,
        message: `${createdItems.length} items creados desde la cotización`,
        items: createdItems,
        summary: {
          total: createdItems.length,
          requieren_compra: createdItems.filter((item) => item.requiere_compra)
            .length,
          no_requieren_compra: createdItems.filter(
            (item) => !item.requiere_compra
          ).length,
        },
      });
    } catch (error) {
      console.error("Error convirtiendo cotización a items:", error);
      res.status(500).json({
        success: false,
        message: "Error al convertir cotización a items",
        error: error.message,
      });
    }
  },

  // Actualizar contrato
  updateContract: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      console.log("🔍 DEBUG - updateContract recibió datos:", updateData);

      const contract = await Contract.findByPk(id);

      if (!contract) {
        return res.status(404).json({ message: "Contrato no encontrado" });
      }

      // ✅ FUNCIÓN AUXILIAR para validar fechas
      const validateAndCleanDate = (dateValue, fieldName) => {
        if (!dateValue) return null;

        if (
          dateValue === "Invalid date" ||
          dateValue === "null" ||
          dateValue === "undefined"
        ) {
          console.log(
            `⚠️ ${fieldName} inválida, estableciendo como null:`,
            dateValue
          );
          return null;
        }

        const fecha = new Date(dateValue);
        if (isNaN(fecha.getTime())) {
          console.log(
            `⚠️ ${fieldName} inválida, estableciendo como null:`,
            dateValue
          );
          return null;
        }

        return dateValue; // Mantener el valor original si es válido
      };

      // ✅ LIMPIAR TODAS LAS FECHAS antes de actualizar
      const cleanUpdateData = { ...updateData };

      // ✅ MANEJO ESPECIAL PARA FORMA DE PAGO
      if (cleanUpdateData.forma_pago === "contado") {
        console.log("💰 Contrato de contado - limpiando campos de cuotas");

        // Para pago de contado, limpiar todos los campos relacionados con cuotas
        cleanUpdateData.tiene_cuota_inicial = false;
        cleanUpdateData.cuota_inicial_porcentaje = 0;
        cleanUpdateData.cuota_inicial_monto = 0;
        cleanUpdateData.fecha_vencimiento_inicial = null; // ✅ Esto era el problema principal
        cleanUpdateData.numero_cuotas_restantes = 0;
        cleanUpdateData.monto_restante = 0;
        cleanUpdateData.valor_cuota_restante = 0;
        cleanUpdateData.fechas_vencimiento_cuotas = [];
        cleanUpdateData.cuotas_pagadas = [];
        cleanUpdateData.fechas_pago_cuotas = [];

        // Para contado, el saldo pendiente debe ser el precio total (hasta que se marque como pagado)
        if (cleanUpdateData.precio_total && !cleanUpdateData.total_pagado) {
          cleanUpdateData.saldo_pendiente = cleanUpdateData.precio_total;
        }
      }

      // Lista de campos de fecha a validar (solo si no son parte de cuotas en contado)
      const dateFields = [
        "fecha_firma",
        "fecha_pago_inicial",
        "fecha_inicio_viaje",
        "fecha_fin_viaje",
      ];

      // ✅ Solo validar fecha_vencimiento_inicial si NO es contado
      if (cleanUpdateData.forma_pago !== "contado") {
        dateFields.push("fecha_vencimiento_inicial");
      }

      // Validar cada campo de fecha
      dateFields.forEach((field) => {
        if (cleanUpdateData[field] !== undefined) {
          cleanUpdateData[field] = validateAndCleanDate(
            cleanUpdateData[field],
            field
          );
        }
      });

      // ✅ VALIDAR arrays de fechas solo si NO es contado
      if (cleanUpdateData.forma_pago !== "contado") {
        if (
          cleanUpdateData.fechas_vencimiento_cuotas &&
          Array.isArray(cleanUpdateData.fechas_vencimiento_cuotas)
        ) {
          cleanUpdateData.fechas_vencimiento_cuotas =
            cleanUpdateData.fechas_vencimiento_cuotas
              .map((fecha, index) =>
                validateAndCleanDate(
                  fecha,
                  `fechas_vencimiento_cuotas[${index}]`
                )
              )
              .filter((fecha) => fecha !== null); // Remover fechas null del array
        }

        if (
          cleanUpdateData.fechas_pago_cuotas &&
          Array.isArray(cleanUpdateData.fechas_pago_cuotas)
        ) {
          cleanUpdateData.fechas_pago_cuotas =
            cleanUpdateData.fechas_pago_cuotas
              .map((fecha, index) =>
                validateAndCleanDate(fecha, `fechas_pago_cuotas[${index}]`)
              )
              .filter((fecha) => fecha !== null); // Remover fechas null del array
        }
      }

      console.log("🔍 DEBUG - datos después de limpieza:", cleanUpdateData);

      await contract.update(cleanUpdateData);

      // ✅ REGENERAR PDF automáticamente si se cambiaron datos importantes
      const shouldRegeneratePDF =
        cleanUpdateData.hasOwnProperty("forma_pago") ||
        cleanUpdateData.hasOwnProperty("precio_total") ||
        cleanUpdateData.hasOwnProperty("numero_cuotas_restantes") ||
        cleanUpdateData.hasOwnProperty("cuota_inicial_monto") ||
        cleanUpdateData.hasOwnProperty("fecha_vencimiento_inicial") ||
        cleanUpdateData.hasOwnProperty("valor_cuota_restante");

      let pdfRegenerated = false;

      if (shouldRegeneratePDF && contract.contrato_pdf_url) {
        try {
          console.log(
            "🔄 Regenerando PDF automáticamente tras actualización de contrato..."
          );

          // Obtener contrato con todas las relaciones necesarias para el PDF
          const contractForPDF = await Contract.findByPk(id, {
            include: [
              {
                model: Quote,
                as: "Quote",
                include: [
                  {
                    model: User,
                    as: "Cliente",
                    attributes: ["id", "name", "lastname", "email", "phone"],
                  },
                  {
                    model: Passenger,
                    as: "Passengers",
                    attributes: [
                      "id",
                      "nombre",
                      "apellido",
                      "documento_identidad",
                      "tipo_documento",
                      "fecha_nacimiento",
                      "titular",
                    ],
                  },
                ],
              },
              {
                model: User,
                as: "Cliente",
                attributes: [
                  "id",
                  "name",
                  "lastname",
                  "email",
                  "phone",
                  "documento_identidad",
                  "tipo_documento",
                ],
              },
            ],
          });

          const {
            generateContractPDF,
          } = require("../utils/generateContractPDF");
          const pdfResult = await generateContractPDF(contractForPDF, true);

          // Actualizar URL del PDF regenerado
          await contract.update({
            contrato_pdf_url: pdfResult.relativePath,
          });

          pdfRegenerated = true;
          console.log("✅ PDF regenerado exitosamente:", pdfResult.filename);
        } catch (pdfError) {
          console.error("⚠️ Error regenerando PDF automáticamente:", pdfError);
          // No fallar la actualización si el PDF falla
        }
      }

      const updatedContract = await Contract.findByPk(id, {
        include: [
          {
            model: Quote,
            as: "Quote",
            include: [
              {
                model: User,
                as: "Cliente",
                attributes: ["id", "name", "lastname", "email", "phone"],
              },
            ],
          },
        ],
      });

      res.json({
        message: "Contrato actualizado exitosamente",
        contract: updatedContract,
        pdf_regenerated: pdfRegenerated, // ✅ Informar si se regeneró el PDF
      });
    } catch (error) {
      console.error("Error updating contract:", error);
      res.status(500).json({
        message: "Error al actualizar el contrato",
        error: error.message,
      });
    }
  },

  // Firmar contrato
  signContract: async (req, res) => {
    try {
      const { id } = req.params;
      const { signature, signer_info, signed_at, signature_token, ip_address } =
        req.body;

      // ✅ VERIFICAR token de firma
      const {
        verifySignatureToken,
      } = require("../utils/generateSignatureToken");
      try {
        const tokenData = verifySignatureToken(signature_token);
        if (tokenData.contractId !== id) {
          return res
            .status(400)
            .json({ message: "Token de firma inválido para este contrato" });
        }
      } catch (error) {
        return res
          .status(400)
          .json({ message: "Token de firma inválido o expirado" });
      }

      const contract = await Contract.findByPk(id, {
        include: [
          {
            model: Quote,
            as: "Quote",
            include: [
              { model: User, as: "Cliente" },
              { model: Passenger, as: "Passengers" },
            ],
          },
          { model: User, as: "Cliente" },
        ],
      });

      if (!contract) {
        return res.status(404).json({ message: "Contrato no encontrado" });
      }

      if (contract.status === "signed") {
        return res.status(400).json({ message: "El contrato ya está firmado" });
      }

      // ✅ GUARDAR datos de firma
      const signatureData = {
        signature_image: signature,
        signer_name: signer_info.nombre,
        signer_document: signer_info.documento,
        signer_email: signer_info.email,
        signer_role: signer_info.cargo,
        signed_at: signed_at,
        signature_ip: ip_address,
        signature_token: signature_token,
      };

      // ✅ ACTUALIZAR contrato con datos de firma
      await contract.update({
        status: "signed",
        fecha_firma: new Date(signed_at),
        signature_data: JSON.stringify(signatureData),
      });

      // ✅ REGENERAR PDF con firma
      try {
        console.log("📄 Regenerando PDF con firma...");
        const {
          generateSignedContractPDF,
        } = require("../utils/generateSignedContractPDF");
        const pdfResult = await generateSignedContractPDF(
          contract,
          signatureData
        );

        // Actualizar con la nueva URL del PDF firmado
        await contract.update({
          contrato_pdf_url: pdfResult.relativePath,
          signed_pdf_generated: true,
        });

        console.log("✅ PDF con firma generado:", pdfResult.filename);
      } catch (pdfError) {
        console.error("⚠️ Error generando PDF con firma:", pdfError);
        // No fallar la firma si el PDF falla, se puede regenerar después
      }

      // ✅ ENVIAR email de confirmación (opcional)
      try {
        const { sendEmail } = require("../utils/emailService");
        await sendEmail({
          to: signer_info.email,
          subject: `✅ Contrato Firmado - ${contract.contract_number}`,
          html: `
          <h2>¡Contrato firmado exitosamente!</h2>
          <p>Su contrato <strong>${contract.contract_number}</strong> ha sido firmado digitalmente.</p>
          <p>Recibirá una copia del contrato firmado en breve.</p>
          <p>Gracias por elegir ViajaYa.</p>
        `,
        });
      } catch (emailError) {
        console.error("Error enviando email de confirmación:", emailError);
      }

      res.json({
        success: true,
        message: "Contrato firmado exitosamente",
        contract: {
          id: contract.id,
          contract_number: contract.contract_number,
          status: "signed",
          signed_at: signed_at,
          signer_name: signer_info.nombre,
        },
      });
    } catch (error) {
      console.error("Error signing contract:", error);
      res.status(500).json({
        success: false,
        message: "Error al firmar el contrato",
        error: error.message,
      });
    }
  },

  // Enviar contrato para firma
  // ✅ AGREGAR: Función para previsualizar email del contrato
  // ✅ CORREGIR: previewContractEmail para incluir pasajeros
  previewContractEmail: async (req, res) => {
    try {
      const { id } = req.params;

      const contract = await Contract.findByPk(id, {
        include: [
          {
            model: Quote,
            as: "Quote",
            include: [
              {
                model: User,
                as: "Cliente",
                attributes: ["id", "name", "lastname", "email", "phone"],
              },
              {
                model: Passenger,
                as: "Passengers",
                attributes: [
                  "id",
                  "nombre",
                  "apellido",
                  "documento_identidad",
                  "tipo_documento",
                  "fecha_nacimiento",
                  "titular",
                ],
                required: false,
              },
            ],
          },
          {
            model: User,
            as: "Cliente",
            attributes: [
              "id",
              "name",
              "lastname",
              "email",
              "phone",
              "documento_identidad",
              "tipo_documento",
            ],
          },
        ],
      });

      if (!contract) {
        return res.status(404).json({ message: "Contrato no encontrado" });
      }

      // ✅ OBTENER PASAJEROS
      const passengers = contract.Quote?.Passengers || [];

      // ✅ GENERAR HTML DEL EMAIL (usa el mismo código que sendContract)
      const emailSubject = `📋 Contrato de Viaje - ${contract.Quote?.destino} | ${contract.contract_number}`;

      // ✅ USAR EL MISMO HTML QUE EN sendContract para consistencia
      const emailHtml = `[AQUÍ VA EL MISMO HTML QUE EN sendContract - para evitar duplicación, usaremos una función helper]`;

      // ✅ DATOS PARA EL FRONTEND
      const emailData = {
        to: contract.Cliente?.email,
        subject: emailSubject,
        html: emailHtml,
        contractInfo: {
          contract_number: contract.contract_number,
          cliente_name: `${contract.Cliente?.name} ${contract.Cliente?.lastname}`,
          destino: contract.Quote?.destino,
          precio_total: contract.precio_total,
          fecha_viaje: `${new Date(
            contract.fecha_inicio_viaje
          ).toLocaleDateString("es-ES")} - ${new Date(
            contract.fecha_fin_viaje
          ).toLocaleDateString("es-ES")}`,
        },
      };

      res.json({
        success: true,
        emailData,
      });
    } catch (error) {
      console.error("Error previewing contract email:", error);
      res.status(500).json({
        message: "Error al generar preview del email",
        error: error.message,
      });
    }
  },

  // ✅ ACTUALIZAR: sendContract para usar el servicio de email
  // ✅ CORREGIR: sendContract para usar el servicio de email correctamente
 sendContract: async (req, res) => {
  try {
    const { id } = req.params;
    const { email, subject, customMessage } = req.body;

    const contract = await Contract.findByPk(id, {
      include: [
        {
          model: Quote,
          as: "Quote",
          include: [
            {
              model: User,
              as: "Cliente",
              attributes: ["id", "name", "lastname", "email", "phone"],
            },
            {
              model: Passenger,
              as: "Passengers",
              attributes: [
                "id",
                "nombre",
                "apellido",
                "documento_identidad",
                "tipo_documento",
                "fecha_nacimiento",
                "titular",
              ],
              required: false,
            },
            // ✅ AGREGAR: Cálculo completo de cotización
            {
              model: QuoteCalculation,
              as: "Calculation",
              attributes: [
                "id", "user_id", "quote_id", "num_personas",
                "tiquetes", "hotel", "traslados", "alimentacion", "equipaje", 
                "seguros", "excursiones", "extras", "comisiones", "ganancia",
                "costo_base", "total_comisiones", "total_ganancia", "precio_final_total",
                "estado", "observaciones_generales", "fecha_viaje_inicio", "fecha_viaje_fin"
              ],
              required: false,
            },
          ],
        },
        {
          model: User,
          as: "Cliente",
          attributes: [
            "id",
            "name",
            "lastname",
            "email",
            "phone",
            "documento_identidad",
            "tipo_documento",
          ],
        },
      ],
    });

    if (!contract) {
      return res.status(404).json({ message: "Contrato no encontrado" });
    }

    // ✅ VERIFICAR que el PDF ya existe
    if (!contract.contrato_pdf_url) {
      return res.status(400).json({
        message: "Debe generar el PDF del contrato antes de enviarlo",
        action: "generate_pdf_first",
      });
    }

    const path = require("path");
    const fs = require("fs");
    const pdfFilePath = path.join(
      __dirname,
      "../../",
      contract.contrato_pdf_url
    );

    if (!fs.existsSync(pdfFilePath)) {
      return res.status(404).json({
        message: "Archivo PDF no encontrado. Regenere el PDF del contrato.",
        action: "regenerate_pdf",
      });
    }

    // ✅ PROCESAR: Análisis del cálculo (SIN PRECIOS) - IGUAL QUE EN getContractById
    let calculationAnalysis = null;
    let preciosPorPersona = null;
    
    if (contract.Quote?.Calculation) {
      const calc = contract.Quote.Calculation;
      const serviciosIncluidos = [];
      const numPersonas = calc.num_personas || contract.Quote?.numero_personas || 1;
      
      // ✅ CALCULAR: Precio por persona
      const precioTotal = parseFloat(contract.precio_total || 0);
      const precioPorPersona = precioTotal / numPersonas;
      
      preciosPorPersona = {
        precio_total: precioTotal,
        precio_por_persona: precioPorPersona,
        numero_personas: numPersonas,
        precio_por_persona_formateado: precioPorPersona.toLocaleString('es-CO')
      };

      // ✅ TICKETS - Estructura JSONB (SIN PRECIOS)
      if (calc.tiquetes && typeof calc.tiquetes === 'object') {
        const tiquetesCosto = parseFloat(calc.tiquetes.costo_total || 0);
        if (tiquetesCosto > 0) {
          serviciosIncluidos.push({
            tipo: "tickets",
            descripcion: `Tickets aéreos ${calc.tiquetes.origen || contract.Quote.origen} - ${calc.tiquetes.destino || contract.Quote.destino}`,
            incluido: true,
            detalles: {
              tipo: calc.tiquetes.tipo === 'ida_vuelta' ? 'Ida y Vuelta' : 'Solo Ida',
              origen: calc.tiquetes.origen,
              destino: calc.tiquetes.destino,
              fecha_ida: calc.tiquetes.fecha_ida,
              fecha_vuelta: calc.tiquetes.fecha_vuelta,
              proveedor: calc.tiquetes.proveedor || 'Por confirmar'
            }
          });
        }
      }

      // ✅ HOTEL - Estructura JSONB (SIN PRECIOS)
      if (calc.hotel && typeof calc.hotel === 'object') {
        const hotelCosto = parseFloat(calc.hotel.costo_total || 0);
        if (hotelCosto > 0) {
          serviciosIncluidos.push({
            tipo: "hotel",
            descripcion: `Alojamiento ${calc.hotel.categoria || calc.hotel.nombre || 'N/A'}`,
            incluido: true,
            detalles: {
              nombre: calc.hotel.nombre || 'Por confirmar',
              categoria: calc.hotel.categoria,
              acomodacion: calc.hotel.acomodacion,
              noches: calc.hotel.noches,
              ubicacion: calc.hotel.ubicacion || 'Por confirmar',
              proveedor: calc.hotel.proveedor || 'Por confirmar'
            }
          });
        }
      }

      // ✅ TRASLADOS - Estructura JSONB (SIN PRECIOS)
      if (calc.traslados && typeof calc.traslados === 'object') {
        const trasladosCosto = parseFloat(calc.traslados.costo_total || 0);
        if (trasladosCosto > 0) {
          const trasladosDetalles = [];
          
          if (calc.traslados.aeropuerto_hotel_ida?.incluido) {
            trasladosDetalles.push('Aeropuerto → Hotel');
          }
          if (calc.traslados.hotel_aeropuerto_vuelta?.incluido) {
            trasladosDetalles.push('Hotel → Aeropuerto');
          }
          if (calc.traslados.otros && calc.traslados.otros.length > 0) {
            calc.traslados.otros.forEach(traslado => {
              trasladosDetalles.push(traslado.descripcion);
            });
          }
          
          serviciosIncluidos.push({
            tipo: "traslados",
            descripcion: "Traslados",
            incluido: true,
            detalles: {
              servicios: trasladosDetalles,
              descripcion: trasladosDetalles.join(', ')
            }
          });
        }
      }

      // ✅ ALIMENTACIÓN - Estructura JSONB (SIN PRECIOS)
      if (calc.alimentacion && typeof calc.alimentacion === 'object') {
        const alimentacionCosto = parseFloat(calc.alimentacion.costo_total || 0);
        if (alimentacionCosto > 0) {
          serviciosIncluidos.push({
            tipo: "alimentacion",
            descripcion: `Alimentación ${calc.alimentacion.tipo || 'incluida'}`,
            incluido: true,
            detalles: {
              tipo: calc.alimentacion.tipo,
              proveedor: calc.alimentacion.proveedor || 'Por confirmar',
              observaciones: calc.alimentacion.observaciones
            }
          });
        } else if (calc.alimentacion.tipo === 'ninguna') {
          serviciosIncluidos.push({
            tipo: "alimentacion",
            descripcion: "Alimentación no incluida",
            incluido: false,
            detalles: {
              nota: "La alimentación no está incluida en este paquete"
            }
          });
        }
      }

      // ✅ EQUIPAJE - Estructura JSONB (SIN PRECIOS)
      if (calc.equipaje && typeof calc.equipaje === 'object') {
        const equipajeDetalles = [];
        
        if (calc.equipaje.cabina?.incluido) {
          equipajeDetalles.push('Equipaje de cabina incluido');
        }
        if (calc.equipaje.bodega?.incluido) {
          equipajeDetalles.push('Equipaje de bodega incluido');
        }
        if (calc.equipaje.equipaje_extra?.incluido) {
          equipajeDetalles.push('Equipaje extra incluido');
        }
        
        if (equipajeDetalles.length > 0) {
          serviciosIncluidos.push({
            tipo: "equipaje",
            descripcion: "Equipaje",
            incluido: true,
            detalles: {
              servicios: equipajeDetalles,
              descripcion: equipajeDetalles.join(', ')
            }
          });
        }
      }

      // ✅ SEGUROS - Estructura JSONB (SIN PRECIOS)
      if (calc.seguros && typeof calc.seguros === 'object') {
        const segurosCosto = parseFloat(calc.seguros.costo_total || 0);
        if (segurosCosto > 0) {
          const segurosDetalles = [];
          
          if (calc.seguros.asistencia_medica?.tipo) {
            segurosDetalles.push(`Asistencia médica: ${calc.seguros.asistencia_medica.tipo}`);
          }
          if (calc.seguros.cancelacion?.incluido) {
            segurosDetalles.push('Seguro de cancelación');
          }
          if (calc.seguros.otros && calc.seguros.otros.length > 0) {
            calc.seguros.otros.forEach(seguro => {
              segurosDetalles.push(seguro.descripcion);
            });
          }
          
          serviciosIncluidos.push({
            tipo: "seguros",
            descripcion: "Seguros de viaje",
            incluido: true,
            detalles: {
              servicios: segurosDetalles,
              descripcion: segurosDetalles.join(', ')
            }
          });
        }
      }

      // ✅ EXCURSIONES - Array JSONB (SIN PRECIOS)
      if (calc.excursiones && Array.isArray(calc.excursiones)) {
        calc.excursiones.forEach((excursion, index) => {
          const excursionCosto = parseFloat(excursion.costo || 0);
          if (excursionCosto > 0) {
            serviciosIncluidos.push({
              tipo: "excursiones",
              descripcion: excursion.nombre || `Excursión ${index + 1}`,
              incluido: true,
              detalles: {
                nombre: excursion.nombre,
                descripcion: excursion.descripcion,
                duracion: excursion.duracion,
                incluye: excursion.incluye
              }
            });
          }
        });
      }

      // ✅ EXTRAS - Array JSONB (SIN PRECIOS)
      if (calc.extras && Array.isArray(calc.extras)) {
        calc.extras.forEach((extra, index) => {
          const extraCosto = parseFloat(extra.costo || 0);
          if (extraCosto > 0) {
            serviciosIncluidos.push({
              tipo: "extras",
              descripcion: extra.nombre || `Extra ${index + 1}`,
              incluido: true,
              detalles: {
                nombre: extra.nombre,
                descripcion: extra.descripcion,
                observaciones: extra.observaciones
              }
            });
          }
        });
      }

      calculationAnalysis = {
        servicios_incluidos: serviciosIncluidos,
        resumen: {
          total_servicios: serviciosIncluidos.filter(s => s.incluido).length,
          servicios_no_incluidos: serviciosIncluidos.filter(s => !s.incluido).length,
          tipos_servicio: [...new Set(serviciosIncluidos.map(s => s.tipo))]
        },
        metadata: {
          estado: calc.estado,
          observaciones: calc.observaciones_generales,
          fecha_viaje_inicio: calc.fecha_viaje_inicio,
          fecha_viaje_fin: calc.fecha_viaje_fin,
          num_personas: calc.num_personas
        }
      };
    }

    // ✅ GENERAR EMAIL HTML ACTUALIZADO
    const emailSubject = subject || `📋 Contrato de Viaje - ${contract.Quote?.destino} | ${contract.contract_number}`;
    const passengers = contract.Quote?.Passengers || [];
    const signatureToken = generateSignatureToken(contract.id);

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contrato de Viaje - ViajaYa</title>
        <style>
          body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; }
          .header { background: linear-gradient(135deg, #421261, #573b58); color: white; padding: 30px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
          .header p { margin: 5px 0 0 0; font-size: 14px; opacity: 0.9; }
          .content { padding: 30px 20px; }
          .contract-info { background: linear-gradient(135deg, #dc86c7, #cdb2d5); padding: 20px; border-radius: 10px; margin: 20px 0; color: white; }
          .contract-info h2 { margin: 0 0 15px 0; font-size: 20px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; }
          .info-item { background: rgba(255,255,255,0.2); padding: 10px; border-radius: 5px; }
          .info-item label { font-weight: bold; font-size: 12px; opacity: 0.9; display: block; }
          .info-item value { font-size: 14px; }
          .price-highlight { background: #2be0e9; color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .price-highlight .amount { font-size: 24px; font-weight: bold; }
          .price-highlight .label { font-size: 12px; opacity: 0.9; }
          .payment-info { background: #f8f9fa; border-left: 4px solid #421261; padding: 15px; margin: 20px 0; }
          .payment-info h3 { margin: 0 0 10px 0; color: #421261; }
          .passengers-section { background: #f0f8ff; border-radius: 8px; padding: 15px; margin: 20px 0; }
          .passenger { background: white; padding: 10px; margin: 5px 0; border-radius: 5px; border-left: 3px solid #2be0e9; }
          .passenger.titular { border-left-color: #421261; background: #faf5ff; }
          .services-section { background: #f8f9fa; border-radius: 8px; padding: 15px; margin: 20px 0; }
          .service-item { background: white; padding: 12px; margin: 8px 0; border-radius: 5px; border-left: 3px solid #28a745; }
          .service-item.not-included { border-left-color: #dc3545; opacity: 0.7; }
          .service-header { display: flex; justify-content: between; align-items: center; margin-bottom: 5px; }
          .service-type { background: #e9ecef; padding: 2px 8px; border-radius: 12px; font-size: 11px; text-transform: uppercase; }
          .service-details { font-size: 13px; color: #6c757d; margin-top: 5px; }
          .instructions { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .instructions h3 { margin: 0 0 10px 0; color: #856404; }
          .footer { background: #421261; color: white; padding: 20px; text-align: center; }
          .footer a { color: #2be0e9; text-decoration: none; }
          .cta-button { background: #2be0e9; color: white; padding: 12px 25px; border-radius: 5px; text-decoration: none; display: inline-block; margin: 15px 0; font-weight: bold; }
          @media (max-width: 600px) {
            .info-grid { grid-template-columns: 1fr; }
            .container { margin: 0; }
            .content { padding: 20px 15px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <h1>📋 CONTRATO DE VIAJE</h1>
            <p>ViajaYa - Operador Turístico | RNT 122035</p>
          </div>

          <!-- Content -->
          <div class="content">
            <h2>¡Estimado/a ${contract.Cliente?.name} ${contract.Cliente?.lastname}!</h2>
            
            <p>Nos complace enviarle su <strong>contrato de viaje</strong> para revisión y confirmación. Este documento contiene todos los detalles de su reserva y las condiciones del servicio.</p>

            <!-- Información del Contrato -->
            <div class="contract-info">
              <h2>🏖️ ${contract.Quote?.destino?.toUpperCase()}</h2>
              
              <div class="info-grid">
                <div class="info-item">
                  <label>📅 FECHA DE SALIDA</label>
                  <value>${new Date(contract.fecha_inicio_viaje).toLocaleDateString("es-ES", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}</value>
                </div>
                
                <div class="info-item">
                  <label>📅 FECHA DE REGRESO</label>
                  <value>${new Date(contract.fecha_fin_viaje).toLocaleDateString("es-ES", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}</value>
                </div>
                
                <div class="info-item">
                  <label>🛫 ORIGEN</label>
                  <value>${contract.Quote?.origen}</value>
                </div>
                
                <div class="info-item">
                  <label>🎯 DESTINO</label>
                  <value>${contract.Quote?.destino}</value>
                </div>
                
                <div class="info-item">
                  <label>👥 PASAJEROS</label>
                  <value>${contract.Quote?.numero_personas} personas</value>
                </div>
                
                <div class="info-item">
                  <label>📋 N° CONTRATO</label>
                  <value>${contract.contract_number}</value>
                </div>
              </div>
            </div>

            <!-- ✅ NUEVO: Precio por persona -->
            <div class="price-highlight">
              <div class="amount">$${preciosPorPersona?.precio_por_persona_formateado || '0'}</div>
              <div class="label">PRECIO POR PERSONA</div>
              ${preciosPorPersona?.numero_personas > 1 ? `
                <div style="margin-top: 10px; font-size: 14px; opacity: 0.8;">
                  Total para ${preciosPorPersona.numero_personas} personas: $${preciosPorPersona.precio_total.toLocaleString('es-CO')}
                </div>
              ` : ''}
            </div>

            <!-- ✅ NUEVO: Servicios incluidos (SIN PRECIOS) -->
            ${calculationAnalysis?.servicios_incluidos?.length > 0 ? `
            <div class="services-section">
              <h3>✅ SERVICIOS INCLUIDOS EN SU PAQUETE</h3>
              ${calculationAnalysis.servicios_incluidos.map(servicio => `
                <div class="service-item ${servicio.incluido ? '' : 'not-included'}">
                  <div class="service-header">
                    <strong>${servicio.incluido ? '✅' : '❌'} ${servicio.descripcion}</strong>
                    <span class="service-type">${servicio.tipo}</span>
                  </div>
                  ${servicio.detalles ? `
                    <div class="service-details">
                      ${servicio.tipo === 'tickets' && servicio.detalles ? `
                        • Tipo: ${servicio.detalles.tipo}<br>
                        • Aerolínea: ${servicio.detalles.proveedor}<br>
                        • Ida: ${servicio.detalles.fecha_ida ? new Date(servicio.detalles.fecha_ida).toLocaleDateString('es-ES') : 'Por confirmar'}<br>
                        ${servicio.detalles.fecha_vuelta ? `• Regreso: ${new Date(servicio.detalles.fecha_vuelta).toLocaleDateString('es-ES')}` : ''}
                      ` : ''}
                      ${servicio.tipo === 'hotel' && servicio.detalles ? `
                        • Hotel: ${servicio.detalles.nombre}<br>
                        • Categoría: ${servicio.detalles.categoria}<br>
                        • Acomodación: ${servicio.detalles.acomodacion}<br>
                        • Noches: ${servicio.detalles.noches}
                        ${servicio.detalles.ubicacion ? `<br>• Ubicación: ${servicio.detalles.ubicacion}` : ''}
                      ` : ''}
                      ${servicio.tipo === 'traslados' && servicio.detalles?.descripcion ? `
                        • ${servicio.detalles.descripcion}
                      ` : ''}
                      ${servicio.tipo === 'seguros' && servicio.detalles?.descripcion ? `
                        • ${servicio.detalles.descripcion}
                      ` : ''}
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
            ` : ''}

            <!-- Información de Pago -->
            ${contract.forma_pago === "cuotas" ? `
            <div class="payment-info">
              <h3>💳 FORMA DE PAGO: EN CUOTAS</h3>
              ${contract.tiene_cuota_inicial ? `
                <p><strong>Cuota Inicial:</strong> $${parseFloat(contract.cuota_inicial_monto || 0).toLocaleString("es-CO")} (${contract.cuota_inicial_porcentaje}%)</p>
                <p><strong>Fecha límite cuota inicial:</strong> ${contract.fecha_vencimiento_inicial ? new Date(contract.fecha_vencimiento_inicial).toLocaleDateString("es-ES") : "N/A"}</p>
              ` : ""}
              <p><strong>Número de cuotas:</strong> ${contract.numero_cuotas_restantes || "N/A"}</p>
              <p><strong>Valor por cuota:</strong> $${parseFloat(contract.valor_cuota_restante || 0).toLocaleString("es-CO")}</p>
              <p><strong>Saldo restante:</strong> $${parseFloat(contract.monto_restante || contract.saldo_pendiente || 0).toLocaleString("es-CO")}</p>
            </div>
            ` : `
            <div class="payment-info">
              <h3>💳 FORMA DE PAGO: CONTADO</h3>
              <p>Pago único por el valor total del contrato.</p>
            </div>
            `}

            <!-- Información de Pasajeros -->
            <div class="passengers-section">
              <h3>👥 INFORMACIÓN DE PASAJEROS</h3>
              ${passengers.length > 0 ? passengers.map(passenger => `
                <div class="passenger ${passenger.titular ? "titular" : ""}">
                  <strong>${passenger.nombre} ${passenger.apellido}</strong> ${passenger.titular ? "👑 (Titular)" : ""}
                  <br>
                  <small>${passenger.tipo_documento?.toUpperCase()}: ${passenger.documento_identidad} | 
                  Nacimiento: ${new Date(passenger.fecha_nacimiento).toLocaleDateString("es-ES")}</small>
                </div>
              `).join("") : `
                <div class="passenger titular">
                  <strong>${contract.Cliente?.name} ${contract.Cliente?.lastname}</strong> 👑 (Titular)
                  <br>
                  <small>${contract.Cliente?.tipo_documento?.toUpperCase()}: ${contract.Cliente?.documento_identidad}</small>
                </div>
              `}
            </div>

            <!-- Instrucciones -->
            <div class="instructions">
              <h3>📋 INSTRUCCIONES IMPORTANTES</h3>
              <ol>
                <li><strong>Revise cuidadosamente</strong> todos los detalles del contrato adjunto.</li>
                <li><strong>Confirme su aceptación</strong> respondiendo a este email dentro de las próximas <strong>48 horas</strong>.</li>
                <li><strong>Realice los pagos</strong> según el cronograma establecido en el contrato.</li>
                <li><strong>Envíe los soportes de pago</strong> a: <a href="mailto:soportedepagosviajaya@gmail.com">soportedepagosviajaya@gmail.com</a></li>
              </ol>
            </div>

            <!-- Cuentas Bancarias -->
            <div class="payment-info">
              <h3>🏦 CUENTAS PARA PAGOS</h3>
              <p><strong>Bancolombia - Cuenta de Ahorros</strong></p>
              <p>No. 846-772-51165</p>
              <p>Titular: MAYERLY ALEJANDRA HENAO HIGUERA</p>
              <p>CC: 1032406128</p>
            </div>

            <!-- Botón de Confirmación -->
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/contract-signature/${contract.id}?token=${signatureToken}" class="cta-button">
                ✅ FIRMAR CONTRATO DIGITALMENTE
              </a>
            </div>

            <p style="margin-top: 30px;">
              <strong>🎯 ¡Estamos emocionados de hacer realidad su viaje a ${contract.Quote?.destino}!</strong>
            </p>

            <p>Para cualquier consulta o aclaración, no dude en contactarnos:</p>
            <ul>
              <li>📧 Email: <a href="mailto:info@viajaya.com">info@viajaya.com</a></li>
              <li>📱 WhatsApp: <a href="https://wa.me/573001234567">+57 300 123 4567</a></li>
              <li>📍 Oficina: Centro Comercial Plaza En Sueño 2 PISO, Bogotá</li>
            </ul>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p><strong>ViajaYa - Operador Turístico y Agencia de Viajes</strong></p>
            <p>🌟 Hacemos realidad tus sueños de viaje 🌟</p>
            <p>📧 info@viajaya.com | 📱 +57 300 123 4567</p>
            <p>📍 Bogotá, Colombia | 📋 RNT 122035</p>
            <p>📸 Síguenos: <a href="https://instagram.com/viajaya_pagina_oficial">@viajaya_pagina_oficial</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    // ✅ PREPARAR EMAIL
    const finalEmail = email || contract.Cliente?.email;

    const mailOptions = {
      to: finalEmail,
      subject: emailSubject,
      html: customMessage ? `
        <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #421261;">
          <h3 style="color: #421261; margin: 0 0 10px 0;">💬 Mensaje Personalizado:</h3>
          <p style="margin: 0; white-space: pre-line;">${customMessage}</p>
        </div>
        ${emailHtml}
      ` : emailHtml,
      attachments: [
        {
          filename: `contrato-${contract.contract_number}.pdf`,
          path: pdfFilePath,
          contentType: "application/pdf",
        },
      ],
    };

    // ✅ ENVIAR EMAIL
    console.log("📧 Enviando email a:", finalEmail);
    const { sendEmail } = require("../utils/emailService");
    const emailResult = await sendEmail(mailOptions);

    // ✅ ACTUALIZAR ESTADO DEL CONTRATO
    await contract.update({
      status: "sent",
      sent_at: new Date(),
      email_sent_to: finalEmail,
    });

    console.log("✅ Contrato enviado exitosamente");

    res.json({
      success: true,
      message: "Contrato enviado exitosamente",
      contract: {
        id: contract.id,
        contract_number: contract.contract_number,
        status: "sent",
      },
      email_info: {
        sent_to: finalEmail,
        pdf_attached: true,
        sent_at: new Date().toISOString(),
        message_id: emailResult?.messageId || "no-message-id",
        precio_por_persona: preciosPorPersona?.precio_por_persona_formateado,
        servicios_incluidos: calculationAnalysis?.resumen?.total_servicios || 0,
      },
    });
  } catch (error) {
    console.error("Error sending contract:", error);
    res.status(500).json({
      success: false,
      message: "Error al enviar el contrato",
      error: error.message,
    });
  }
},

 generateContractPDF: async (req, res) => {
  try {
    const { id } = req.params;
    const { preview = false } = req.query; // ?preview=true para vista previa

    const contract = await Contract.findByPk(id, {
      include: [
        {
          model: Quote,
          as: "Quote",
          include: [
            {
              model: User,
              as: "Cliente",
              attributes: ["id", "name", "lastname", "email", "phone"],
            },
            {
              model: Passenger,
              as: "Passengers",
              attributes: [
                "id",
                "nombre",
                "apellido",
                "documento_identidad",
                "tipo_documento",
                "fecha_nacimiento",
                "titular",
              ],
            },
            // ✅ AGREGAR: Cálculo completo de cotización para el PDF
            {
              model: QuoteCalculation,
              as: "Calculation",
              attributes: [
                "id", "user_id", "quote_id", "num_personas",
                "tiquetes", "hotel", "traslados", "alimentacion", "equipaje", 
                "seguros", "excursiones", "extras", "comisiones", "ganancia",
                "costo_base", "total_comisiones", "total_ganancia", "precio_final_total",
                "estado", "observaciones_generales", "fecha_viaje_inicio", "fecha_viaje_fin"
              ],
              required: false,
            },
          ],
        },
        {
          model: User,
          as: "Cliente",
          attributes: [
            "id",
            "name",
            "lastname",
            "email",
            "phone",
            "documento_identidad",
            "tipo_documento",
          ],
        },
      ],
    });

    if (!contract) {
      return res.status(404).json({ message: "Contrato no encontrado" });
    }

    // ✅ GENERAR PDF (siempre guardamos el archivo)
    const { generateContractPDF } = require("../utils/generateContractPDF");
    const pdfResult = await generateContractPDF(contract, true); // Siempre guardar

    // ✅ ACTUALIZAR contrato con la URL del PDF
    await contract.update({
      contrato_pdf_url: pdfResult.relativePath,
    });

    if (preview === "true") {
      // ✅ VISTA PREVIA: Devolver el PDF directamente en el response
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${pdfResult.filename}"`
      );

      const fs = require("fs");
      const fileBuffer = fs.readFileSync(pdfResult.filepath);
      res.send(fileBuffer);
    } else {
      // ✅ RESPUESTA JSON: Info del PDF generado
      res.json({
        success: true,
        message: "PDF del contrato generado exitosamente",
        pdf: {
          filename: pdfResult.filename,
          url: pdfResult.relativePath,
          filepath: pdfResult.filepath,
        },
        contract: {
          id: contract.id,
          contract_number: contract.contract_number,
          contrato_pdf_url: pdfResult.relativePath,
        },
        // ✅ OPCIONAL: Información adicional sobre el contenido del PDF
        calculation_info: contract.Quote?.Calculation ? {
          has_calculation: true,
          num_personas: contract.Quote.Calculation.num_personas,
          estado: contract.Quote.Calculation.estado,
          precio_final_total: contract.Quote.Calculation.precio_final_total
        } : {
          has_calculation: false
        }
      });
    }
  } catch (error) {
    console.error("Error generating contract PDF:", error);
    res.status(500).json({
      success: false,
      message: "Error al generar el PDF del contrato",
      error: error.message,
    });
  }
},

  // ✅ NUEVO: Descargar PDF del contrato
  downloadContractPDF: async (req, res) => {
    try {
      const { id } = req.params;

      const contract = await Contract.findByPk(id);

      if (!contract) {
        return res.status(404).json({ message: "Contrato no encontrado" });
      }

      if (!contract.contrato_pdf_url) {
        return res
          .status(404)
          .json({ message: "PDF del contrato no encontrado" });
      }

      const filePath = path.join(
        __dirname,
        "../../",
        contract.contrato_pdf_url
      );

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "Archivo PDF no existe" });
      }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="contrato-${contract.contract_number}.pdf"`
      );

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error("Error downloading contract PDF:", error);
      res.status(500).json({
        message: "Error al descargar el PDF del contrato",
        error: error.message,
      });
    }
  },

servePDF: async (req, res) => {
  try {
    const { id } = req.params;
    const { t: timestamp } = req.query; // Detectar si viene con timestamp anti-cache

    const contract = await Contract.findByPk(id, {
      include: [
        {
          model: Quote,
          as: "Quote",
          include: [
            {
              model: User,
              as: "Cliente",
              attributes: ["id", "name", "lastname", "email", "phone"],
            },
            {
              model: Passenger,
              as: "Passengers",
              attributes: [
                "id",
                "nombre",
                "apellido",
                "documento_identidad",
                "tipo_documento",
                "fecha_nacimiento",
                "titular",
              ],
            },
            // ✅ AGREGAR: Cálculo de cotización para regeneración automática
            {
              model: QuoteCalculation,
              as: "Calculation",
              attributes: [
                "id", "user_id", "quote_id", "num_personas",
                "tiquetes", "hotel", "traslados", "alimentacion", "equipaje", 
                "seguros", "excursiones", "extras", "comisiones", "ganancia",
                "costo_base", "total_comisiones", "total_ganancia", "precio_final_total",
                "estado", "observaciones_generales", "fecha_viaje_inicio", "fecha_viaje_fin"
              ],
              required: false,
            },
          ],
        },
        {
          model: User,
          as: "Cliente",
          attributes: [
            "id",
            "name",
            "lastname",
            "email",
            "phone",
            "documento_identidad",
            "tipo_documento",
          ],
        },
      ],
    });

    if (!contract) {
      return res.status(404).json({ message: "Contrato no encontrado" });
    }

    const path = require("path");
    const fs = require("fs");
    let filePath = null;
    let shouldGeneratePDF = false;

    // ✅ VERIFICAR si existe PDF y archivo físico
    if (contract.contrato_pdf_url) {
      filePath = path.join(__dirname, "../../", contract.contrato_pdf_url);
      if (!fs.existsSync(filePath)) {
        console.log("⚠️ PDF referenciado no existe en disco, regenerando...");
        shouldGeneratePDF = true;
      }
    } else {
      console.log("⚠️ No hay PDF generado para este contrato, generando...");
      shouldGeneratePDF = true;
    }

    // ✅ GENERAR PDF automáticamente si no existe
    if (shouldGeneratePDF) {
      try {
        console.log(
          "🔄 Generando PDF automáticamente para contrato:",
          contract.contract_number
        );
        const {
          generateContractPDF,
        } = require("../utils/generateContractPDF");
        const pdfResult = await generateContractPDF(contract, true);

        // Actualizar contrato con nueva URL
        await contract.update({
          contrato_pdf_url: pdfResult.relativePath,
        });

        filePath = pdfResult.filepath;
        console.log("✅ PDF generado automáticamente:", pdfResult.filename);
      } catch (pdfError) {
        console.error("❌ Error generando PDF automáticamente:", pdfError);
        return res.status(500).json({
          message: "Error generando PDF del contrato: " + pdfError.message,
        });
      }
    }

    // ✅ VERIFICAR una vez más que el archivo existe
    if (!fs.existsSync(filePath)) {
      return res.status(500).json({
        message: "Error: PDF no se pudo generar correctamente",
      });
    }

    // ✅ ESTABLECER headers para PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="contrato-${contract.contract_number}.pdf"`
    );

    // ✅ MEJORAR: Headers anti-cache si viene con timestamp
    if (timestamp) {
      console.log(
        "🔄 Sirviendo PDF con headers anti-cache (timestamp:",
        timestamp,
        ")"
      );
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.setHeader("Last-Modified", new Date().toUTCString());
      res.setHeader("ETag", `"${Date.now()}"`); // ETag único para forzar revalidación
    } else {
      res.setHeader("Cache-Control", "private, max-age=3600"); // Cache por 1 hora solo si no hay timestamp
    }

    // ✅ ENVIAR archivo
    res.sendFile(filePath);
  } catch (error) {
    console.error("Error sirviendo PDF:", error);
    res
      .status(500)
      .json({ message: "Error interno del servidor: " + error.message });
  }
},

  // Completar contrato (después del viaje)
  completeContract: async (req, res) => {
    try {
      const { id } = req.params;

      const contract = await Contract.findByPk(id);

      if (!contract) {
        return res.status(404).json({ message: "Contrato no encontrado" });
      }

      // Verificar que el viaje ya terminó
      const currentDate = new Date();
      if (new Date(contract.fecha_fin_viaje) > currentDate) {
        return res.status(400).json({
          message:
            "El contrato no puede completarse antes de que termine el viaje",
        });
      }

      // Verificar que todo esté pagado
      if (contract.saldo_pendiente > 0) {
        return res.status(400).json({
          message: "No se puede completar el contrato con saldo pendiente",
        });
      }

      await contract.update({
        status: "completed",
      });

      res.json({
        message: "Contrato completado exitosamente",
        contract,
      });
    } catch (error) {
      console.error("Error completing contract:", error);
      res.status(500).json({
        message: "Error al completar el contrato",
        error: error.message,
      });
    }
  },

  // Obtener contratos por cliente
  getContractsByCliente: async (req, res) => {
    try {
      const { clienteId } = req.params;

      const contracts = await Contract.findAll({
        where: { cliente_id: clienteId },
        include: [
          {
            model: Quote,
            as: "Quote", // ✅ AGREGAR ESTE ALIAS
            attributes: [
              "id",
              "quote_number",
              "destino",
              "origen",
              "fecha_ida",
              "fecha_regreso",
              "numero_personas",
            ],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      res.json({
        success: true,
        contracts,
      });
    } catch (error) {
      console.error("Error getting contracts by cliente:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener los contratos del cliente",
        error: error.message,
      });
    }
  },
  createContractItem: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        tipo,
        descripcion,
        detalle,
        precio_unitario,
        cantidad,
        precio_total,
        costo_proveedor,
        proveedor,
        proveedor_contacto,
        fecha_inicio,
        fecha_fin,
        fecha_vencimiento_pago,
        observaciones,
      } = req.body;

      // Verifica que el contrato existe
      const contract = await Contract.findByPk(id);
      if (!contract) {
        return res.status(404).json({
          success: false,
          message: "Contrato no encontrado",
        });
      }

      // ✅ CORREGIR: Usar ContractItem en lugar de ContractItems
      const item = await ContractItem.create({
        contract_id: id,
        tipo,
        descripcion,
        detalle,
        precio_unitario,
        cantidad,
        precio_total,
        costo_proveedor,
        proveedor,
        proveedor_contacto,
        fecha_inicio,
        fecha_fin,
        fecha_vencimiento_pago,
        observaciones,
      });

      res.status(201).json({
        success: true,
        message: "Item creado exitosamente",
        item,
      });
    } catch (error) {
      console.error("Error creando item:", error);
      res.status(500).json({
        success: false,
        message: "Error creando item",
        error: error.message,
      });
    }
  },

  // Listar items de un contrato
  getContractItems: async (req, res) => {
    try {
      const { id } = req.params;

      // ✅ CORREGIR: Usar ContractItem
      const items = await ContractItem.findAll({
        where: { contract_id: id },
        order: [
          ["tipo", "ASC"],
          ["descripcion", "ASC"],
        ],
      });

      res.json({
        success: true,
        items,
      });
    } catch (error) {
      console.error("Error obteniendo items:", error);
      res.status(500).json({
        success: false,
        message: "Error obteniendo items",
        error: error.message,
      });
    }
  },

  // Actualizar un item
  updateContractItem: async (req, res) => {
    try {
      const { itemId } = req.params;
      const updateData = req.body;

      // ✅ CORREGIR: Usar ContractItem
      const item = await ContractItem.findByPk(itemId);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: "Item no encontrado",
        });
      }

      await item.update(updateData);
      res.json({
        success: true,
        message: "Item actualizado exitosamente",
        item: await ContractItem.findByPk(itemId),
      });
    } catch (error) {
      console.error("Error actualizando item:", error);
      res.status(500).json({
        success: false,
        message: "Error actualizando item",
        error: error.message,
      });
    }
  },

  // Eliminar un item
  deleteContractItem: async (req, res) => {
    try {
      const { itemId } = req.params;

      // ✅ CORREGIR: Usar ContractItem
      const item = await ContractItem.findByPk(itemId);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: "Item no encontrado",
        });
      }

      await item.destroy();
      res.json({
        success: true,
        message: "Item eliminado exitosamente",
      });
    } catch (error) {
      console.error("Error eliminando item:", error);
      res.status(500).json({
        success: false,
        message: "Error eliminando item",
        error: error.message,
      });
    }
  },

  // ✅ NUEVA FUNCIÓN: Aprobar contrato y generar comisiones
  approveContract: async (req, res) => {
    try {
      const { id } = req.params;
      const { observaciones } = req.body;

      const contract = await Contract.findByPk(id, {
        include: [
          {
            model: Quote,
            as: "Quote",
            include: [
              {
                model: User,
                as: "Asesor",
                attributes: ["id", "name", "lastname"],
              },
              {
                model: User,
                as: "Lider",
                attributes: ["id", "name", "lastname"],
              },
              {
                model: User,
                as: "Gerente",
                attributes: ["id", "name", "lastname"],
              },
            ],
          },
        ],
      });

      if (!contract) {
        return res.status(404).json({ message: "Contrato no encontrado" });
      }

      if (contract.status !== "signed" && contract.status !== "draft") {
        return res.status(400).json({
          message: "Solo se pueden aprobar contratos firmados o en borrador",
        });
      }

      // Actualizar estado del contrato
      await contract.update({
        status: "completed", // o 'active' según tu lógica de negocio
        observaciones: observaciones || "Contrato aprobado manualmente",
      });

      // ✅ GENERAR COMISIONES
      let commissionsGenerated = false;
      let commissionResult = null;

      try {
        commissionResult = await commissionController.generateCommissions(id);
        commissionsGenerated = true;
        console.log(
          "✅ Comisiones generadas para contrato aprobado:",
          commissionResult
        );
      } catch (commissionError) {
        console.error("❌ Error generando comisiones:", commissionError);
      }

      res.json({
        success: true,
        message: "Contrato aprobado exitosamente",
        contract: await Contract.findByPk(id, {
          include: [
            {
              model: Quote,
              as: "Quote",
              attributes: [
                "quote_number",
                "nombre_cliente",
                "destino",
                "precio_total",
              ],
            },
          ],
        }),
        commissionsGenerated,
        commissionSummary: commissionResult,
      });
    } catch (error) {
      console.error("Error aprobando contrato:", error);
      res.status(500).json({
        message: "Error al aprobar el contrato",
        error: error.message,
      });
    }
  },
};

module.exports = contractController;
