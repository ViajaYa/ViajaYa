const { Quote, User, Contract, Passenger, QuoteCalculation } = require("../db");
const { Op } = require("sequelize");
const { sendEmail } = require("../utils/emailService");
const { generateQuotePDF } = require("../utils/generateQuotePDF");
const { 
  calcularPersonasQuePagan, 
  calcularPrecioConEdades, 
  validarDatosPasajeros, 
  convertirDatosLegacy 
} = require("../utils/quoteCalculations");
const path = require("path");
const crypto = require('crypto');
// ✅ Importar utilidades de fecha con Luxon para Colombia
const { formatForPDF, nowInColombia, toFrontend } = require("../utils/dateUtils"); 

// ✅ Función auxiliar para convertir trip_type a etiqueta legible
const getTripTypeLabel = (tripType) => {
  switch (tripType) {
    case 'nacional':
      return 'Nacional';
    case 'internacional':
      return 'Internacional';
    case 'operadorLlano':
      return 'Operador Llano';
    case 'hotel':
      return 'Hotel';
    default:
      return tripType || 'No especificado';
  }
};

const createClientUser = async (quoteData) => {
  try {
    const { nombre_cliente, email_cliente, telefono_cliente } = quoteData;

    // Verificar si ya existe un usuario con ese email
    let existingUser = await User.findOne({
      where: { email: email_cliente },
    });

    if (existingUser) {
      console.log("✅ Usuario cliente ya existe:", existingUser.id);
      return existingUser;
    }

    // Generar password temporal
    const tempPassword = Math.random().toString(36).slice(-8) + "Temp123!";
    const bcrypt = require("bcrypt");
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Crear nuevo usuario cliente
    const newUser = await User.create({
      name: nombre_cliente.split(" ")[0] || nombre_cliente,
      lastname: nombre_cliente.split(" ").slice(1).join(" ") || "",
      email: email_cliente,
      phone: telefono_cliente,
      password: hashedPassword,
      role: 1, // Cliente
      is_active: true,
      email_verified: false, // Requerirá verificación
      password_changed_at: null, // Indicará que debe cambiar password
    });

    console.log("✅ Usuario cliente creado:", {
      id: newUser.id,
      email: newUser.email,
      tempPassword, // ⚠️ SOLO PARA LOG - enviarlo por email después
    });

    // TODO: Enviar email con credenciales temporales

    return newUser;
  } catch (error) {
    console.error("❌ Error creando usuario cliente:", error);
    throw error;
  }
};

// ✅ NUEVO: Función helper para validar que todos los pasajeros tengan datos completos (para generar contrato)
const validatePassengersForContract = async (quoteId) => {
  const passengers = await Passenger.findAll({
    where: { quote_id: quoteId }
  });

  const errors = [];

  passengers.forEach((passenger, index) => {
    const missingFields = [];

    if (!passenger.nombre?.trim()) missingFields.push('nombre');
    if (!passenger.apellido?.trim()) missingFields.push('apellido');
    if (!passenger.documento_identidad?.trim()) missingFields.push('documento_identidad');
    if (!passenger.tipo_documento?.trim()) missingFields.push('tipo_documento');
    if (!passenger.fecha_nacimiento) missingFields.push('fecha_nacimiento');

    if (missingFields.length > 0) {
      errors.push(`Pasajero ${index + 1} (${passenger.nombre || 'Sin nombre'}): Faltan campos ${missingFields.join(', ')}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

const quoteController = {
  // Crear nueva cotización
  createQuote: async (req, res) => {
    try {
      const {
        asesor_id,
        lider_id,
        gerente_id,
        admin_id,
        cliente_id,
        numero_personas,
        // ✅ NUEVOS CAMPOS DETALLADOS DE PASAJEROS
        adultos,
        menores,
        infantes,
        edades_menores,
        edades_infantes,
        personas_atencion_especial,
        detalles_atencion_especial,
        fecha_ida,
        fecha_regreso,
        destino,
        trip_type, // ✅ NUEVO: Campo explícito para tipo de viaje
        origen,
        acomodacion,
        tipo_hotel,
        // ✅ CAMPOS ELIMINADOS: ninos, edades_ninos (ahora usamos menores/edades_menores)
        observaciones,
        nombre_cliente,
        email_cliente,
        telefono_cliente,
        created_by,
        source = "internal", // ✅ NUEVO: Indicar origen de la cotización
      } = req.body;

      // ✅ LÓGICA DE COMPATIBILIDAD: Usar utilidad para convertir datos legacy
      let adultosCalculados = adultos;
      let menoresCalculados = menores;
      let infantesCalculados = infantes;
      let edadesMenoresCalculadas = edades_menores;
      let edadesInfantesCalculadas = edades_infantes;

      // Si no vienen los nuevos campos pero sí los legacy, convertir usando utilidad
      if ((adultos === undefined || menores === undefined || infantes === undefined) && 
          numero_personas !== undefined) {
        
        console.log('🔄 Convirtiendo datos legacy a nuevo formato');
        const datosConvertidos = convertirDatosLegacy({
          numero_personas,
          // Los campos ninos/edades_ninos ya no se usan
        });
        
        adultosCalculados = datosConvertidos.adultos;
        menoresCalculados = datosConvertidos.menores;
        infantesCalculados = datosConvertidos.infantes;
        edadesMenoresCalculadas = datosConvertidos.edades_menores;
        edadesInfantesCalculadas = datosConvertidos.edades_infantes;
        
        console.log('✅ Datos convertidos:', datosConvertidos);
      }

      // ✅ Validar datos de pasajeros
      const validacion = validarDatosPasajeros({
        numero_personas,
        adultos: adultosCalculados,
        menores: menoresCalculados,
        infantes: infantesCalculados,
        edades_menores: edadesMenoresCalculadas,
        edades_infantes: edadesInfantesCalculadas
      });

      if (!validacion.isValid) {
        return res.status(400).json({
          message: "Datos de pasajeros inconsistentes",
          errors: validacion.errors
        });
      }

      // ✅ Validación: asegurar que los números sean consistentes
      const totalCalculado = (adultosCalculados || 0) + (menoresCalculados || 0) + (infantesCalculados || 0);
      const numeroPersonasFinal = numero_personas || totalCalculado;

      // ✅ Buscar cliente por email si no hay cliente_id
      let clienteIdFinal = cliente_id || null;
      if (email_cliente) {
        const existingUser = await User.findOne({
          where: { email: email_cliente },
        });
        if (existingUser) {
          clienteIdFinal = existingUser.id;
        }
      }

      // ✅ LÓGICA MEJORADA: Asignación inteligente de responsables
      let asesorIdFinal = null;
      let liderIdFinal = null;
      let gerenteIdFinal = null;
      let adminIdFinal = null;
      let isExternalQuote = false;

      // Caso 1: Cotización interna (desde el sistema con jerarquía)
      if (asesor_id || lider_id || gerente_id || admin_id) {
        if (asesor_id) {
          const asesor = await User.findByPk(asesor_id, {
            attributes: [
              "id",
              "name",
              "lastname",
              "role",
              "lider_id",
              "gerente_id",
            ],
          });

          if (asesor && asesor.role === 2) {
            asesorIdFinal = asesor.id;
            liderIdFinal = asesor.lider_id;
            gerenteIdFinal = asesor.gerente_id;
          }
        } else if (lider_id) {
          const lider = await User.findByPk(lider_id, {
            attributes: ["id", "name", "lastname", "role", "gerente_id"],
          });

          if (lider && lider.role === 3) {
            liderIdFinal = lider.id;
            gerenteIdFinal = lider.gerente_id;
          }
        } else if (gerente_id) {
          const gerente = await User.findByPk(gerente_id, {
            attributes: ["id", "name", "lastname", "role"],
          });

          if (gerente && gerente.role === 4) {
            gerenteIdFinal = gerente.id;
          }
        } else if (admin_id) {
          const admin = await User.findByPk(admin_id, {
            attributes: ["id", "name", "lastname", "role"],
          });

          if (admin && admin.role >= 5) {
            adminIdFinal = admin.id;
          }
        }
      }

      // Caso 2: Cotización externa (desde web pública sin autenticación)
      else {
        isExternalQuote = true;

        // ✅ NUEVA LÓGICA: Para cotizaciones externas, asignar directamente al Owner
        const owner = await User.findOne({
          where: {
            role: 7,
            is_active: true,
          },
          order: [["id", "ASC"]], // Primer Owner encontrado
          attributes: ["id", "name", "lastname", "role"],
        });

        if (owner) {
          adminIdFinal = owner.id;
          console.log(
            `✅ Cotización externa asignada al Owner: ${owner.name} ${owner.lastname} (ID: ${owner.id})`
          );
        } else {
          return res.status(400).json({
            message:
              "No hay Owner disponible para asignar la cotización externa.",
          });
        }
      }

      // ✅ Si no se pudo determinar ningún responsable (solo para cotizaciones internas), buscar Owner como fallback
      if (
        !isExternalQuote &&
        !asesorIdFinal &&
        !liderIdFinal &&
        !gerenteIdFinal &&
        !adminIdFinal
      ) {
        const owner = await User.findOne({
          where: { role: 7 },
          order: [["id", "ASC"]],
        });

        if (owner) {
          adminIdFinal = owner.id;
        } else {
          return res.status(400).json({
            message:
              "No hay responsable disponible para asignar la cotización.",
          });
        }
      }

      // ✅ Generar número de cotización único
      // ✅ Usar Luxon para generar número de cotización con fecha consistente en Colombia
      const currentDate = nowInColombia();
      const year = currentDate.toFormat('yyyy');
      const month = currentDate.toFormat('LL');
      const day = currentDate.toFormat('dd');

      const lastQuote = await Quote.findOne({
        where: {
          quote_number: {
            [Op.startsWith]: `COT-${year}${month}${day}-`,
          },
        },
        order: [["created_at", "DESC"]],
      });

      let sequence = 1;
      if (lastQuote) {
        const lastSequence = parseInt(lastQuote.quote_number.split("-")[2]);
        sequence = lastSequence + 1;
      }

      const quote_number = `COT-${year}${month}${day}-${String(
        sequence
      ).padStart(3, "0")}`;

      // ✅ Crear la cotización con metadatos
      const newQuote = await Quote.create({
        quote_number,
        asesor_id: asesorIdFinal,
        lider_id: liderIdFinal,
        gerente_id: gerenteIdFinal,
        admin_id: adminIdFinal,
        cliente_id: clienteIdFinal,
        numero_personas: numeroPersonasFinal,
        // ✅ NUEVOS CAMPOS DETALLADOS DE PASAJEROS
        adultos: adultosCalculados || 0,
        menores: menoresCalculados || 0,
        infantes: infantesCalculados || 0,
        edades_menores: edadesMenoresCalculadas || [],
        edades_infantes: edadesInfantesCalculadas || [],
        personas_atencion_especial: personas_atencion_especial || 0,
        detalles_atencion_especial: detalles_atencion_especial || null,
        fecha_ida,
        fecha_regreso,
        destino,
        trip_type: trip_type || null, // ✅ CORREGIDO: No establecer valor por defecto
        origen,
        acomodacion: acomodacion || 'doble',
        tipo_hotel: tipo_hotel || 'basico',
        // ✅ CAMPOS ELIMINADOS: ninos, edades_ninos (reemplazados por menores/edades_menores)
        observaciones,
        nombre_cliente: nombre_cliente, // ✅ Cambiar de: clienteIdFinal ? null : nombre_cliente
        email_cliente: email_cliente, // ✅ Cambiar de: clienteIdFinal ? null : email_cliente
        telefono_cliente: telefono_cliente, // ✅ Cambiar de: clienteIdFinal ? null : telefono_cliente
        status: "pending",
        source: source,
        is_external: isExternalQuote,
        created_by:
          created_by ||
          (isExternalQuote ? "Web Pública - Usuario no registrado" : "Sistema"),
        priority: isExternalQuote ? "high" : "normal",
      });
      console.log(newQuote);

      // ✅ Incluir información completa de los usuarios relacionados
      const quoteWithUsers = await Quote.findByPk(newQuote.id, {
        include: [
          {
            model: User,
            as: "Asesor",
            attributes: ["id", "name", "lastname", "email", "role"],
          },
          {
            model: User,
            as: "Lider",
            attributes: ["id", "name", "lastname", "email", "role"],
          },
          {
            model: User,
            as: "Gerente",
            attributes: ["id", "name", "lastname", "email", "role"],
          },
          {
            model: User,
            as: "Admin",
            attributes: ["id", "name", "lastname", "email", "role"],
          },
          {
            model: User,
            as: "Cliente",
            attributes: ["id", "name", "lastname", "email", "phone"],
          },
        ],
      });

      res.status(201).json({
        message: "Cotización creada exitosamente",
        quote: quoteWithUsers,
        assignment_info: {
          type: isExternalQuote ? "external" : "internal",
          assigned_to: {
            asesor: asesorIdFinal,
            lider: liderIdFinal,
            gerente: gerenteIdFinal,
            admin: adminIdFinal,
          },
          priority: isExternalQuote ? "high" : "normal",
          reason: isExternalQuote
            ? "Auto-asignado al Owner (cotización externa)"
            : "Asignación manual",
        },
      });
    } catch (error) {
      console.error("Error creating quote:", error);
      res.status(500).json({
        message: "Error al crear la cotización",
        error: error.message,
      });
    }
  },

  // ✅ NUEVO: Endpoint específico para cotizaciones externas
  createExternalQuote: async (req, res) => {
    try {
      // Forzar parámetros para cotizaciones externas
      const externalQuoteData = {
        ...req.body,
        source: "external",
        created_by: "Web Pública - Usuario no registrado",
        // No incluir ningún ID para forzar asignación automática al Owner
        asesor_id: null,
        lider_id: null,
        gerente_id: null,
        admin_id: null,
      };

      // Reutilizar la lógica del createQuote
      req.body = externalQuoteData;
      return quoteController.createQuote(req, res);
    } catch (error) {
      console.error("Error creating external quote:", error);
      res.status(500).json({
        message: "Error al crear la cotización externa",
        error: error.message,
      });
    }
  },
  // ✅ NUEVO: Método para crear cotización desde el frontend con auto-asignación
  createQuoteFromUser: async (req, res) => {
    try {
      const { userId } = req.params; // ID del usuario que está creando
      const quoteData = req.body;

      // Obtener el usuario que está creando la cotización
      const creator = await User.findByPk(userId, {
        attributes: [
          "id",
          "name",
          "lastname",
          "role",
          "lider_id",
          "gerente_id",
        ],
      });

      if (!creator) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      // ✅ Auto-asignar según el rol del creador
      let assignmentData = {};

      switch (creator.role) {
        case 2: // Asesor
          assignmentData = {
            asesor_id: creator.id,
            lider_id: creator.lider_id,
            gerente_id: creator.gerente_id,
            created_by: `${creator.name} ${creator.lastname} (Asesor)`,
          };
          break;

        case 3: // Líder
          assignmentData = {
            lider_id: creator.id,
            gerente_id: creator.gerente_id,
            created_by: `${creator.name} ${creator.lastname} (Líder)`,
          };
          break;

        case 4: // Gerente
          assignmentData = {
            gerente_id: creator.id,
            created_by: `${creator.name} ${creator.lastname} (Gerente)`,
          };
          break;

        case 5: // Admin
        case 6: // Contador
        case 7: // Owner
          assignmentData = {
            admin_id: creator.id,
            created_by: `${creator.name} ${creator.lastname} (${getRoleName(
              creator.role
            )})`,
          };
          break;

        default:
          return res.status(403).json({
            message: "No tienes permisos para crear cotizaciones",
          });
      }

      // Combinar datos de la cotización con la asignación automática
      const completeQuoteData = {
        ...quoteData,
        ...assignmentData,
      };

      // Usar el método createQuote existente
      req.body = completeQuoteData;
      return quoteController.createQuote(req, res);
    } catch (error) {
      console.error("Error creating quote from user:", error);
      res.status(500).json({
        message: "Error al crear la cotización",
        error: error.message,
      });
    }
  },

  // ✅ ACTUALIZAR: getAllQuotes con nuevos includes
  getAllQuotes: async (req, res) => {
    try {
      const {
        status,
        asesor_id,
        lider_id,
        gerente_id,
        admin_id,
        page = 1,
        limit = 10,
      } = req.query;

      const offset = (page - 1) * limit;
      const where = {};

      if (status) where.status = status;
      if (asesor_id) where.asesor_id = asesor_id;
      if (lider_id) where.lider_id = lider_id;
      if (gerente_id) where.gerente_id = gerente_id;
      if (admin_id) where.admin_id = admin_id;

      const quotes = await Quote.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: "Asesor",
            attributes: ["id", "name", "lastname", "email", "role"],
          },
          {
            model: User,
            as: "Lider",
            attributes: ["id", "name", "lastname", "email", "role"],
          },
          {
            model: User,
            as: "Gerente",
            attributes: ["id", "name", "lastname", "email", "role"],
          },
          {
            model: User,
            as: "Admin", // ✅ Nueva relación
            attributes: ["id", "name", "lastname", "email", "role"],
          },
          {
            model: User,
            as: "Cliente",
            attributes: ["id", "name", "lastname", "email", "phone"],
          },
        ],
        order: [["created_at", "DESC"]],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      // ✅ Usar Luxon para verificar quotas expiradas con zona horaria de Colombia
      const now = nowInColombia().toJSDate();
      const expiredQuotes = quotes.rows.filter(
        (q) =>
          q.status === "sent" && q.expires_at && new Date(q.expires_at) < now
      );

      res.json({
        quotes: quotes.rows,
        total: quotes.count,
        totalPages: Math.ceil(quotes.count / limit),
        currentPage: parseInt(page),
        expiredQuotes, // <-- Aquí tienes las expiradas
        expiredCount: expiredQuotes.length,
      });
    } catch (error) {
      console.error("Error fetching quotes:", error);
      res.status(500).json({
        message: "Error al obtener las cotizaciones",
        error: error.message,
      });
    }
  },

  // ✅ ACTUALIZAR: getQuoteById con nuevos includes
getQuoteById: async (req, res) => {
  try {
    const { id } = req.params;

    const quote = await Quote.findByPk(id, {
      include: [
        {
          model: User,
          as: "Asesor",
          attributes: ["id", "name", "lastname", "email", "role"],
        },
        {
          model: User,
          as: "Lider",
          attributes: ["id", "name", "lastname", "email", "role"],
        },
        {
          model: User,
          as: "Gerente",
          attributes: ["id", "name", "lastname", "email", "role"],
        },
        {
          model: User,
          as: "Admin",
          attributes: ["id", "name", "lastname", "email", "role"],
        },
        {
          model: User,
          as: "Cliente",
          attributes: ["id", "name", "lastname", "email", "phone"],
        },
        {
          model: Contract,
          as: "Contract",
          required: false,
        },
        {
          model: Passenger,
          as: "Passengers",
          required: false,
          order: [
            ['titular', 'DESC'],
            ['nombre', 'ASC']
          ]
        }
      ],
    });

    if (!quote) {
      return res.status(404).json({ message: "Cotización no encontrada" });
    }

    // ✅ CALCULAR PRECIO POR PERSONA QUE PAGA (excluyendo infantes)
    let precio_por_persona = 0;
    let personasQuePagan = 0;
    
    if (quote.precio_total) {
      // Usar nueva lógica para calcular personas que pagan
      personasQuePagan = calcularPersonasQuePagan({
        adultos: quote.adultos,
        menores: quote.menores,
        infantes: quote.infantes
      });
      
      if (personasQuePagan > 0) {
        precio_por_persona = parseFloat(quote.precio_total) / personasQuePagan;
      }
      
      console.log('💰 CÁLCULO DE PRECIO POR PERSONA QUE PAGA:', {
        precio_total: quote.precio_total,
        total_pasajeros: quote.numero_personas,
        personas_que_pagan: personasQuePagan,
        adultos: quote.adultos,
        menores: quote.menores,
        infantes: quote.infantes,
        precio_por_persona_que_paga: precio_por_persona.toFixed(2)
      });
    }

    // ✅ NUEVO: Enriquecer la respuesta con campos calculados
    const quoteResponse = {
      ...quote.toJSON(), // Convertir a objeto plano para poder agregar propiedades
      
      // ✅ AGREGADO: Información de precios y personas que pagan
      precio_por_persona: precio_por_persona,
      precio_por_persona_formateado: precio_por_persona.toFixed(2),
      personas_que_pagan: personasQuePagan,
      
      // ✅ AGREGADO: Metadatos útiles para el frontend
      calculation_metadata: {
        has_price: !!quote.precio_total,
        has_passengers: quote.numero_personas > 0,
        price_per_person_available: !!(quote.precio_total && personasQuePagan > 0),
        total_passengers_registered: quote.Passengers ? quote.Passengers.length : 0,
        passengers_complete: quote.Passengers ? quote.Passengers.length === quote.numero_personas : false,
        infants_dont_pay: true, // ✅ Indicar que infantes no pagan
      },

      // ✅ AGREGADO: Información de formato para PDF
      pdf_data: {
        precio_total_cop: quote.precio_total ? `$${parseFloat(quote.precio_total).toLocaleString('es-CO')}` : null,
        precio_por_persona_cop: precio_por_persona > 0 ? `$${precio_por_persona.toLocaleString('es-CO')}` : null,
        // ✅ Formatear fechas usando Luxon para mantener consistencia con zona horaria de Colombia
        fecha_ida_formatted: quote.fecha_ida ? formatForPDF(quote.fecha_ida) : null,
        fecha_regreso_formatted: quote.fecha_regreso ? formatForPDF(quote.fecha_regreso) : null,
        trip_type_label: getTripTypeLabel(quote.trip_type),
      },

      // ✅ AGREGADO: Información del asesor responsable (para PDF)
      asesor_info: {
        nombre_completo: quote.Asesor ? `${quote.Asesor.name} ${quote.Asesor.lastname}` : 
                        quote.Lider ? `${quote.Lider.name} ${quote.Lider.lastname}` :
                        quote.Gerente ? `${quote.Gerente.name} ${quote.Gerente.lastname}` :
                        quote.Admin ? `${quote.Admin.name} ${quote.Admin.lastname}` : 'No asignado',
        email: quote.Asesor?.email || quote.Lider?.email || quote.Gerente?.email || quote.Admin?.email || null,
        rol: quote.Asesor ? 'Asesor' : 
             quote.Lider ? 'Líder' : 
             quote.Gerente ? 'Gerente' : 
             quote.Admin ? 'Administrador' : 'No asignado'
      }
    };

    res.json(quoteResponse);
  } catch (error) {
    console.error("Error fetching quote:", error);
    res.status(500).json({
      message: "Error al obtener la cotización",
      error: error.message,
    });
  }
},

  getExternalQuotes: async (req, res) => {
    try {
      const { page = 1, limit = 10, owner_only = true } = req.query;
      const offset = (page - 1) * limit;

      const where = {
        is_external: true,
      };

      // Si owner_only es true, filtrar solo las asignadas a Owners
      if (owner_only === "true") {
        const owners = await User.findAll({
          where: { role: 7 },
          attributes: ["id"],
        });

        const ownerIds = owners.map((o) => o.id);
        where.admin_id = { [Op.in]: ownerIds };
      }

      const quotes = await Quote.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: "Admin",
            attributes: ["id", "name", "lastname", "email", "role"],
          },
          {
            model: User,
            as: "Cliente",
            attributes: ["id", "name", "lastname", "email", "phone"],
          },
        ],
        order: [
          ["priority", "DESC"],
          ["created_at", "ASC"], // Más antiguas primero para que el Owner las vea en orden
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      res.json({
        quotes: quotes.rows,
        total: quotes.count,
        totalPages: Math.ceil(quotes.count / limit),
        currentPage: parseInt(page),
        type: "external_quotes_owner_assigned",
      });
    } catch (error) {
      console.error("Error fetching external quotes:", error);
      res.status(500).json({
        message: "Error al obtener cotizaciones externas",
        error: error.message,
      });
    }
  },

  reassignExternalQuote: async (req, res) => {
    try {
      const { id } = req.params;
      const { asesor_id, lider_id, gerente_id, reason } = req.body;

      const quote = await Quote.findByPk(id);

      if (!quote) {
        return res.status(404).json({ message: "Cotización no encontrada" });
      }

      if (!quote.is_external) {
        return res.status(400).json({
          message: "Solo se pueden reasignar cotizaciones externas",
        });
      }

      // Validar que se está asignando a un vendedor válido
      let newAssignment = {};

      if (asesor_id) {
        const asesor = await User.findByPk(asesor_id, {
          attributes: ["id", "role", "lider_id", "gerente_id"],
        });

        if (asesor && asesor.role === 2) {
          newAssignment = {
            asesor_id: asesor.id,
            lider_id: asesor.lider_id,
            gerente_id: asesor.gerente_id,
            admin_id: null, // Quitar del Owner
          };
        }
      } else if (lider_id) {
        const lider = await User.findByPk(lider_id, {
          attributes: ["id", "role", "gerente_id"],
        });

        if (lider && lider.role === 3) {
          newAssignment = {
            asesor_id: null,
            lider_id: lider.id,
            gerente_id: lider.gerente_id,
            admin_id: null, // Quitar del Owner
          };
        }
      } else if (gerente_id) {
        const gerente = await User.findByPk(gerente_id, {
          attributes: ["id", "role"],
        });

        if (gerente && gerente.role === 4) {
          newAssignment = {
            asesor_id: null,
            lider_id: null,
            gerente_id: gerente.id,
            admin_id: null, // Quitar del Owner
          };
        }
      }

      if (Object.keys(newAssignment).length === 0) {
        return res.status(400).json({
          message: "Debe proporcionar un vendedor válido para la reasignación",
        });
      }

      await quote.update({
        ...newAssignment,
        // ✅ Usar Luxon para fecha de reasignación en zona horaria de Colombia
        reassigned_at: nowInColombia().toJSDate(),
        reassignment_reason: reason || "Reasignación desde Owner a vendedor",
      });

      const updatedQuote = await Quote.findByPk(id, {
        include: [
          {
            model: User,
            as: "Asesor",
            attributes: ["id", "name", "lastname", "email", "role"],
          },
          {
            model: User,
            as: "Lider",
            attributes: ["id", "name", "lastname", "email", "role"],
          },
          {
            model: User,
            as: "Gerente",
            attributes: ["id", "name", "lastname", "email", "role"],
          },
          {
            model: User,
            as: "Admin",
            attributes: ["id", "name", "lastname", "email", "role"],
          },
        ],
      });

      res.json({
        message:
          "Cotización externa reasignada exitosamente desde Owner a vendedor",
        quote: updatedQuote,
      });
    } catch (error) {
      console.error("Error reassigning external quote:", error);
      res.status(500).json({
        message: "Error al reasignar la cotización",
        error: error.message,
      });
    }
  },

  // ✅ NUEVO: Obtener cotizaciones por usuario (según su rol)
  getQuotesByUser: async (req, res) => {
    try {
      const { userId } = req.params;
      const { status, page = 1, limit = 10 } = req.query;

      const user = await User.findByPk(userId, {
        attributes: ["id", "role"],
      });

      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      const offset = (page - 1) * limit;
      const where = {};

      if (status) where.status = status;

      // ✅ Filtrar según el rol del usuario
      switch (user.role) {
        case 2: // Asesor
          where.asesor_id = userId;
          break;
        case 3: // Líder
          where[Op.or] = [
            { lider_id: userId },
            { asesor_id: { [Op.in]: await getUsersByLider(userId) } },
          ];
          break;
        case 4: // Gerente
          where[Op.or] = [
            { gerente_id: userId },
            { lider_id: { [Op.in]: await getUsersByGerente(userId) } },
            { asesor_id: { [Op.in]: await getAsesoresByGerente(userId) } },
          ];
          break;
        case 5: // Admin
        case 6: // Contador
        case 7: // Owner
          // Pueden ver todas las cotizaciones
          break;
        default:
          return res.status(403).json({
            message: "No tienes permisos para ver cotizaciones",
          });
      }

      const quotes = await Quote.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: "Asesor",
            attributes: ["id", "name", "lastname", "email", "role"],
          },
          {
            model: User,
            as: "Lider",
            attributes: ["id", "name", "lastname", "email", "role"],
          },
          {
            model: User,
            as: "Gerente",
            attributes: ["id", "name", "lastname", "email", "role"],
          },
          {
            model: User,
            as: "Admin",
            attributes: ["id", "name", "lastname", "email", "role"],
          },
          {
            model: User,
            as: "Cliente",
            attributes: ["id", "name", "lastname", "email", "phone"],
          },
        ],
        order: [["created_at", "DESC"]],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      res.json({
        quotes: quotes.rows,
        total: quotes.count,
        totalPages: Math.ceil(quotes.count / limit),
        currentPage: parseInt(page),
        userRole: user.role,
      });
    } catch (error) {
      console.error("Error fetching quotes by user:", error);
      res.status(500).json({
        message: "Error al obtener las cotizaciones del usuario",
        error: error.message,
      });
    }
  },

 getPassengersByQuote: async (req, res) => {
  try {
    const { quoteId } = req.params;

    // Verificar que la cotización existe
    const quote = await Quote.findByPk(quoteId);

    console.log('🔍 Quote encontrada:', quote ? 'SÍ' : 'NO');
    console.log('🔍 Datos directos de quote:', {
      nombre_cliente: quote?.nombre_cliente,
      email_cliente: quote?.email_cliente,
      telefono_cliente: quote?.telefono_cliente,
      cliente_id: quote?.cliente_id
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: "Cotización no encontrada"
      });
    }

    // Obtener pasajeros
    const passengers = await Passenger.findAll({
      where: { quote_id: quoteId },
      order: [
        ['titular', 'DESC'], // Titular primero
        ['nombre', 'ASC']    // Luego por nombre
      ]
    });

    // Precarga de datos del cliente/titular
    let clientData = null;

    if (quote.cliente_id) {
      // Buscar usuario cliente en la base
      const user = await User.findByPk(quote.cliente_id, {
        attributes: [
          'name', 'lastname', 'email', 'phone',
          'documento_identidad', 'tipo_documento',
          'fecha_nacimiento', 'direccion', 'ciudad', 'pais'
        ]
      });
      if (user) {
        clientData = {
          nombre: user.name || '',
          apellido: user.lastname || '',
          email: user.email || '',
          telefono: user.phone || '',
          documento_identidad: user.documento_identidad || '',
          tipo_documento: user.tipo_documento || 'cc',
          fecha_nacimiento: user.fecha_nacimiento || '',
          direccion: user.direccion || '',
          ciudad: user.ciudad || '',
          pais: user.pais || 'Colombia'
        };
        console.log('✅ Datos del cliente desde User:', clientData);
      }
    }

    // Si no hay usuario, usar datos de la cotización como antes
    if (!clientData && (quote.nombre_cliente || quote.email_cliente)) {
      const nombreCompleto = quote.nombre_cliente || '';
      const partesNombre = nombreCompleto.trim().split(' ');
      const nombre = partesNombre[0] || '';
      const apellido = partesNombre.slice(1).join(' ') || '';

      const nombreFinal = nombre || nombreCompleto;
      const apellidoFinal = apellido || '';

      clientData = {
        nombre: nombreFinal,
        apellido: apellidoFinal,
        email: quote.email_cliente || '',
        telefono: quote.telefono_cliente || '',
        documento_identidad: '',
        tipo_documento: 'cc',
        fecha_nacimiento: '',
        direccion: '',
        ciudad: '',
        pais: 'Colombia'
      };
      console.log('✅ Datos del cliente para precarga (cotización):', clientData);
    }

    if (!clientData) {
      console.log('⚠️ No hay datos del cliente en la cotización ni usuario asociado');
    }

    res.json({
      success: true,
      passengers,
      total: passengers.length,
      quote: {
        id: quote.id,
        destino: quote.destino,
        quote_number: quote.quote_number,
        numero_personas: quote.numero_personas,
        status: quote.status
      },
      clientData
    });

  } catch (error) {
    console.error("Error fetching passengers:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los pasajeros",
      error: error.message
    });
  }
},

  // ✅ NUEVO: Crear o actualizar pasajeros de una cotización
  createOrUpdatePassengers: async (req, res) => {
    try {
      const { quoteId } = req.params;
      const { passengers } = req.body; // Array de pasajeros

      // Validaciones
      if (!passengers || !Array.isArray(passengers) || passengers.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Debe proporcionar al menos un pasajero"
        });
      }

      // Verificar que la cotización existe
      const quote = await Quote.findByPk(quoteId);
      if (!quote) {
        return res.status(404).json({
          success: false,
          message: "Cotización no encontrada"
        });
      }

      // ✅ MODIFICADO: Validar que el número de pasajeros no exceda el límite (puede ser menor si faltan datos)
      if (passengers.length > quote.numero_personas) {
        return res.status(400).json({
          success: false,
          message: `El número de pasajeros (${passengers.length}) no puede exceder el número de personas de la cotización (${quote.numero_personas})`
        });
      }

      // Validar que haya exactamente un titular
      const titulares = passengers.filter(p => p.titular === true);
      if (titulares.length !== 1) {
        return res.status(400).json({
          success: false,
          message: "Debe haber exactamente un pasajero titular"
        });
      }

      // Eliminar pasajeros existentes para esta cotización
      await Passenger.destroy({
        where: { quote_id: quoteId }
      });

      // Crear nuevos pasajeros
      const newPassengers = await Promise.all(
        passengers.map(async (passengerData, index) => {

          // ✅ MODIFICADO: Validaciones flexibles según si es titular o no
          if (passengerData.titular) {
            // TITULAR: Validar todos los campos obligatorios
            const requiredFields = ['nombre', 'apellido', 'documento_identidad', 'tipo_documento', 'fecha_nacimiento'];
            for (const field of requiredFields) {
              if (!passengerData[field]) {
                throw new Error(`El campo '${field}' es obligatorio para el pasajero titular`);
              }
            }

            // Validar campos adicionales del titular
            if (!passengerData.email || !passengerData.telefono) {
              throw new Error('El email y teléfono son obligatorios para el pasajero titular');
            }
          } else {
            // NO TITULAR: Permitir datos incompletos - Solo validar formato si hay datos
            // Los datos se validarán completamente al generar el contrato
            if (passengerData.email && !passengerData.email.includes('@')) {
              throw new Error(`Pasajero ${index + 1}: Email inválido`);
            }

            // No requerir campos obligatorios para no titulares en esta etapa
            console.log(`✅ Pasajero no titular ${index + 1}: Permitiendo datos incompletos para completar después`);
          }

          // ✅ NUEVO: Si es titular, crear o actualizar usuario
          if (passengerData.titular) {
            // Buscar si ya existe un usuario con ese email
            let user = await User.findOne({
              where: { email: passengerData.email.toLowerCase() }
            });

            if (user) {
              // ✅ Usuario existe - actualizar datos si es necesario
              await user.update({
                name: passengerData.nombre.trim(),
                lastname: passengerData.apellido.trim(),
                phone: passengerData.telefono.trim(),
                documento_identidad: passengerData.documento_identidad.trim(),
                tipo_documento: passengerData.tipo_documento.toLowerCase(), // ✅ CORREGIDO: Convertir a minúsculas para el ENUM
                fecha_nacimiento: passengerData.fecha_nacimiento,
                direccion: passengerData.direccion?.trim() || user.direccion,
                ciudad: passengerData.ciudad?.trim() || user.ciudad,
                pais: passengerData.pais || user.pais
              });
              console.log(`✅ Usuario actualizado: ${user.email}`);
            } else {
              // ✅ Usuario nuevo - crear


              const resetToken = crypto.randomBytes(32).toString('hex');
              const resetExpires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 horas

              user = await User.create({
                name: passengerData.nombre.trim(),
                lastname: passengerData.apellido.trim(),
                email: passengerData.email.toLowerCase(),
                phone: passengerData.telefono.trim(),
                documento_identidad: passengerData.documento_identidad.trim(),
                tipo_documento: passengerData.tipo_documento.toLowerCase(),
                fecha_nacimiento: passengerData.fecha_nacimiento,
                direccion: passengerData.direccion?.trim(),
                ciudad: passengerData.ciudad?.trim(),
                pais: passengerData.pais || 'Colombia',
                role: 1,
                password: 'temp123', // Hasheada por el modelo/hook, pero no la uses en el email
                email_verified: false,
                password_reset_token: resetToken,
                password_reset_expires: resetExpires,
              });
              console.log(`✅ Usuario creado: ${user.email}`);

              // ✅ Enviar email con link para establecer contraseña
              const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
              await sendEmail({
                to: user.email,
                subject: "Activa tu cuenta en ViajaYa",
                html: `
      <p>¡Bienvenido/a a ViajaYa!</p>
      <p>Para activar tu cuenta y definir tu contraseña, haz clic en el siguiente enlace:</p>
      <a href="${resetLink}">Establecer contraseña</a>
      <p>Este enlace es válido por 24 horas.</p>
    `
              });
            }

            // Actualizar la cotización con el cliente_id si no lo tenía
            if (!quote.cliente_id) {
              await quote.update({ cliente_id: user.id });
            }
          }

          // ✅ MODIFICADO: Crear pasajero con datos parciales permitidos para no titulares
          const hasMinimumData = passengerData.titular || // Titular siempre se crea
            (passengerData.nombre?.trim()); // No titular: al menos el nombre

          if (hasMinimumData) {
            return await Passenger.create({
              quote_id: quoteId,
              nombre: passengerData.nombre?.trim() || '',
              apellido: passengerData.apellido?.trim() || '',
              documento_identidad: passengerData.documento_identidad?.trim() || null,
              tipo_documento: passengerData.tipo_documento?.toLowerCase() || 'cc', // ✅ CORREGIDO: Minúsculas y default 'cc'
              fecha_nacimiento: passengerData.fecha_nacimiento || null,
              titular: passengerData.titular || false
            });
          }

          return null; // No crear registro si no hay datos mínimos completos
        })
      );

      // Filtrar nulls
      const validPassengers = newPassengers.filter(p => p !== null);

      // Actualizar status de la cotización si estaba pendiente de pasajeros
      if (quote.status === 'pending_passengers') {
        await quote.update({
          status: 'completed'
        });
      }

      // ✅ AGREGADO: Obtener información del titular y usuario creado
      const titular = passengers.find(p => p.titular);
      let userInfo = null;
      if (titular && titular.email) {
        const user = await User.findOne({
          where: { email: titular.email.toLowerCase() },
          attributes: ['id', 'email', 'name', 'lastname', 'phone']
        });
        userInfo = user;
      }

      res.status(201).json({
        success: true,
        message: `Pasajeros guardados exitosamente. Se crearon ${validPassengers.length} de ${quote.numero_personas} pasajeros.`,
        passengers: validPassengers,
        total: validPassengers.length,
        expected: quote.numero_personas,
        // ✅ AGREGADO: Información del usuario creado/actualizado
        userCreated: userInfo ? {
          id: userInfo.id,
          email: userInfo.email,
          name: `${userInfo.name} ${userInfo.lastname}`,
          phone: userInfo.phone
        } : null
      });

    } catch (error) {
      console.error("Error creating/updating passengers:", error);
      res.status(500).json({
        success: false,
        message: "Error al guardar los pasajeros",
        error: error.message
      });
    }
  },

  // ✅ NUEVO: Crear un pasajero individual
  createPassenger: async (req, res) => {
    try {
      const { quoteId } = req.params;
      const { nombre, apellido, documento_identidad, tipo_documento, fecha_nacimiento, titular } = req.body;

      // Verificar que la cotización existe
      const quote = await Quote.findByPk(quoteId);
      if (!quote) {
        return res.status(404).json({
          success: false,
          message: "Cotización no encontrada"
        });
      }

      // Validar campos obligatorios
      if (!nombre || !apellido || !documento_identidad || !tipo_documento || !fecha_nacimiento) {
        return res.status(400).json({
          success: false,
          message: "Todos los campos son obligatorios"
        });
      }

      // Verificar que no exceda el número de personas
      const existingPassengers = await Passenger.count({
        where: { quote_id: quoteId }
      });

      if (existingPassengers >= quote.numero_personas) {
        return res.status(400).json({
          success: false,
          message: `No puede agregar más pasajeros. Máximo permitido: ${quote.numero_personas}`
        });
      }

      // Si es titular, verificar que no haya otro titular
      if (titular) {
        const existingTitular = await Passenger.findOne({
          where: {
            quote_id: quoteId,
            titular: true
          }
        });

        if (existingTitular) {
          return res.status(400).json({
            success: false,
            message: "Ya existe un pasajero titular para esta cotización"
          });
        }
      }

      const newPassenger = await Passenger.create({
        quote_id: quoteId,
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        documento_identidad: documento_identidad.trim(),
        tipo_documento,
        fecha_nacimiento,
        titular: titular || false
      });

      res.status(201).json({
        success: true,
        message: "Pasajero creado exitosamente",
        passenger: newPassenger
      });

    } catch (error) {
      console.error("Error creating passenger:", error);
      res.status(500).json({
        success: false,
        message: "Error al crear el pasajero",
        error: error.message
      });
    }
  },

  // ✅ NUEVO: Actualizar un pasajero
  updatePassenger: async (req, res) => {
    try {
      const { passengerId } = req.params;
      const { nombre, apellido, documento_identidad, tipo_documento, fecha_nacimiento, titular } = req.body;

      const passenger = await Passenger.findByPk(passengerId);
      if (!passenger) {
        return res.status(404).json({
          success: false,
          message: "Pasajero no encontrado"
        });
      }

      // Si se está cambiando a titular, verificar que no haya otro titular
      if (titular && !passenger.titular) {
        const existingTitular = await Passenger.findOne({
          where: {
            quote_id: passenger.quote_id,
            titular: true,
            id: { [Op.ne]: passengerId } // Excluir el pasajero actual
          }
        });

        if (existingTitular) {
          return res.status(400).json({
            success: false,
            message: "Ya existe un pasajero titular para esta cotización"
          });
        }
      }

      await passenger.update({
        nombre: nombre?.trim() || passenger.nombre,
        apellido: apellido?.trim() || passenger.apellido,
        documento_identidad: documento_identidad?.trim() || passenger.documento_identidad,
        tipo_documento: tipo_documento || passenger.tipo_documento,
        fecha_nacimiento: fecha_nacimiento || passenger.fecha_nacimiento,
        titular: titular !== undefined ? titular : passenger.titular
      });

      res.json({
        success: true,
        message: "Pasajero actualizado exitosamente",
        passenger
      });

    } catch (error) {
      console.error("Error updating passenger:", error);
      res.status(500).json({
        success: false,
        message: "Error al actualizar el pasajero",
        error: error.message
      });
    }
  },

  // ✅ NUEVO: Eliminar un pasajero
  deletePassenger: async (req, res) => {
    try {
      const { passengerId } = req.params;

      const passenger = await Passenger.findByPk(passengerId);
      if (!passenger) {
        return res.status(404).json({
          success: false,
          message: "Pasajero no encontrado"
        });
      }

      await passenger.destroy();

      res.json({
        success: true,
        message: "Pasajero eliminado exitosamente"
      });

    } catch (error) {
      console.error("Error deleting passenger:", error);
      res.status(500).json({
        success: false,
        message: "Error al eliminar el pasajero",
        error: error.message
      });
    }
  },

  // ✅ NUEVO: Obtener enlace público para cargar pasajeros
  getPassengerFormLink: async (req, res) => {
    try {
      const { quoteId } = req.params;

      const quote = await Quote.findByPk(quoteId);
      if (!quote) {
        return res.status(404).json({
          success: false,
          message: "Cotización no encontrada"
        });
      }

      // Generar token o usar el ID de la cotización para el enlace público
      const publicLink = `${process.env.FRONTEND_URL}/passenger-form/${quoteId}`;

      res.json({
        success: true,
        link: publicLink,
        quote: {
          id: quote.id,
          quote_number: quote.quote_number,
          numero_personas: quote.numero_personas,
          destino: quote.destino,
          nombre_cliente: quote.nombre_cliente,
          email_cliente: quote.email_cliente
        }
      });

    } catch (error) {
      console.error("Error generating passenger form link:", error);
      res.status(500).json({
        success: false,
        message: "Error al generar el enlace",
        error: error.message
      });
    }
  },



  // ✅ REEMPLAZAR sendQuote con esta versión mejorada
  sendQuote: async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    console.log("🚀 Iniciando envío de cotización al cliente:", {
      quoteId: id,
      userId,
    });

    // ✅ Buscar la cotización con todas las relaciones (IGUAL QUE ANTES)
    const quote = await Quote.findByPk(id, {
      include: [
        {
          model: User,
          as: "Asesor",
          attributes: ["id", "name", "lastname", "email"],
        },
        {
          model: User,
          as: "Lider",
          attributes: ["id", "name", "lastname", "email"],
        },
        {
          model: User,
          as: "Gerente",
          attributes: ["id", "name", "lastname", "email"],
        },
        {
          model: User,
          as: "Admin",
          attributes: ["id", "name", "lastname", "email"],
        },
      ],
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: "Cotización no encontrada",
      });
    }

    // ✅ Validaciones mejoradas (IGUAL QUE ANTES)
    if (quote.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "La cotización debe estar completada antes de ser enviada",
      });
    }

    if (!quote.precio_total || quote.precio_total <= 0) {
      return res.status(400).json({
        success: false,
        message: "La cotización debe tener un precio total antes de enviarla",
      });
    }

    if (!quote.email_cliente || !quote.email_cliente.includes("@")) {
      return res.status(400).json({
        success: false,
        message: "La cotización debe tener un email de cliente válido",
      });
    }

    // ✅ Validar que no se haya enviado ya
    if (quote.status === "sent") {
      return res.status(400).json({
        success: false,
        message: "Esta cotización ya fue enviada al cliente",
      });
    }

    // ✅ NUEVO: Enriquecer cotización con cálculos (CORREGIDO - Solo personas que pagan)
    let precio_por_persona = 0;
    let personasQuePagan = 0;
    
    if (quote.precio_total) {
      // Calcular personas que pagan (excluyendo infantes)
      personasQuePagan = calcularPersonasQuePagan({
        adultos: quote.adultos,
        menores: quote.menores,
        infantes: quote.infantes
      });
      
      if (personasQuePagan > 0) {
        precio_por_persona = parseFloat(quote.precio_total) / personasQuePagan;
      }
      
      console.log('💰 SENDQUOTE - CÁLCULO DE PRECIO POR PERSONA QUE PAGA:', {
        precio_total: quote.precio_total,
        total_pasajeros: quote.numero_personas,
        personas_que_pagan: personasQuePagan,
        adultos: quote.adultos,
        menores: quote.menores,
        infantes: quote.infantes,
        precio_por_persona_que_paga: precio_por_persona.toFixed(2)
      });
    }

    // ✅ NUEVO: Crear versión enriquecida de la cotización
    const enrichedQuote = {
      ...quote.toJSON(), // Convertir a objeto plano
      
      // ✅ AGREGAR: Campos calculados
      precio_por_persona: precio_por_persona,
      precio_por_persona_formateado: precio_por_persona.toFixed(2),
      personas_que_pagan: personasQuePagan,
      
      // ✅ AGREGAR: Metadatos útiles
      calculation_metadata: {
        has_price: !!quote.precio_total,
        has_passengers: quote.numero_personas > 0,
        price_per_person_available: !!(quote.precio_total && personasQuePagan > 0),
        infants_dont_pay: true, // ✅ Indicar que infantes no pagan
      },

      // ✅ AGREGAR: Datos formateados para PDF
      pdf_data: {
        precio_total_cop: quote.precio_total ? `$${parseFloat(quote.precio_total).toLocaleString('es-CO')}` : null,
        precio_por_persona_cop: precio_por_persona > 0 ? `$${precio_por_persona.toLocaleString('es-CO')}` : null,
        fecha_ida_formatted: quote.fecha_ida ? new Date(quote.fecha_ida).toLocaleDateString('es-ES') : null,
        fecha_regreso_formatted: quote.fecha_regreso ? new Date(quote.fecha_regreso).toLocaleDateString('es-ES') : null,
        trip_type_label: getTripTypeLabel(quote.trip_type),
      },

      // ✅ AGREGAR: Información del asesor responsable
      asesor_info: {
        nombre_completo: quote.Asesor ? `${quote.Asesor.name} ${quote.Asesor.lastname}` : 
                        quote.Lider ? `${quote.Lider.name} ${quote.Lider.lastname}` :
                        quote.Gerente ? `${quote.Gerente.name} ${quote.Gerente.lastname}` :
                        quote.Admin ? `${quote.Admin.name} ${quote.Admin.lastname}` : 'No asignado',
        email: quote.Asesor?.email || quote.Lider?.email || quote.Gerente?.email || quote.Admin?.email || null,
        rol: quote.Asesor ? 'Asesor' : 
             quote.Lider ? 'Líder' : 
             quote.Gerente ? 'Gerente' : 
             quote.Admin ? 'Administrador' : 'No asignado'
      }
    };

    console.log('📋 SENDQUOTE - Datos enriquecidos para PDF:', {
      precio_por_persona: enrichedQuote.precio_por_persona,
      precio_por_persona_formateado: enrichedQuote.precio_por_persona_formateado,
      pdf_data_precio_cop: enrichedQuote.pdf_data?.precio_por_persona_cop
    });

    // ✅ PASO 1: Generar PDF (USAR enrichedQuote en lugar de quote)
    console.log("📄 Generando PDF de la cotización...");
    const pdfInfo = await generateQuotePDF(enrichedQuote); // ✅ CAMBIO CLAVE

    // ✅ PASO 2: Preparar fechas (IGUAL QUE ANTES)
    const sentAt = new Date();
    const expiresAt = new Date(sentAt.getTime() + 48 * 60 * 60 * 1000);
    const passengerFormLink = `${process.env.FRONTEND_URL}/passenger-form/${quote.id}`;

    // ✅ PASO 3: Actualizar la cotización con PDF y estado (IGUAL QUE ANTES)
    await quote.update({
      status: "sent",
      sent_at: sentAt,
      expires_at: expiresAt,
      pdf_path: pdfInfo.filepath,
      pdf_filename: pdfInfo.filename,
      pdf_generated_at: new Date(),
      email_sent_to: quote.email_cliente,
    });

    // ✅ PASO 4: Preparar el email (IGUAL QUE ANTES)
    const emailSubject = `Cotización de Viaje - ${quote.destino} | ${quote.quote_number || quote.id}`;

    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .quote-details { background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .price { background-color: #059669; color: white; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0; }
          .footer { background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b; }
          .highlight { background-color: #fef3c7; padding: 10px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>¡Tu cotización está lista! ✈️</h1>
          <p>Viaja Ya - Hacemos realidad tus sueños de viaje</p>
        </div>
        
        <div class="content">
          <h2>Estimado/a ${quote.nombre_cliente || "Cliente"},</h2>
          
          <p>Nos complace presentarle la cotización solicitada para su viaje a <strong>${quote.destino}</strong>.</p>
          
          <div class="quote-details">
            <h3>📋 Detalles del Viaje:</h3>
            <ul>
              <li><strong>🏖️ Destino:</strong> ${quote.destino}</li>
              <li><strong>📍 Origen:</strong> ${quote.origen}</li>
              <li><strong>📅 Fecha de ida:</strong> ${new Date(quote.fecha_ida).toLocaleDateString("es-ES")}</li>
              <li><strong>📅 Fecha de regreso:</strong> ${new Date(quote.fecha_regreso).toLocaleDateString("es-ES")}</li>
              <li><strong>👥 Número de personas:</strong> ${quote.numero_personas}</li>
              ${quote.menores > 0 ? `<li><strong>👶 Menores (2-14 años):</strong> ${quote.menores} (Edades: ${quote.edades_menores?.join(", ") || "No especificadas"})</li>` : ""}
              ${quote.infantes > 0 ? `<li><strong>🍼 Infantes (<2 años):</strong> ${quote.infantes} (Edades: ${quote.edades_infantes?.join(", ") || "No especificadas"})</li>` : ""}
              <li><strong>🏨 Tipo de acomodación:</strong> ${quote.acomodacion}</li>
              <li><strong>⭐ Tipo de hotel:</strong> ${quote.tipo_hotel}</li>
              ${quote.traslado ? "<li><strong>🚗 Traslados:</strong> Incluidos</li>" : ""}
              ${quote.alimentacion ? `<li><strong>🍽️ Alimentación:</strong> ${quote.alimentacion}</li>` : ""}
            </ul>
          </div>
          
          <div class="price">
           <h2>💰 Precio por persona: ${enrichedQuote.pdf_data?.precio_por_persona_cop || `COP $${Number(enrichedQuote.precio_por_persona || 0).toLocaleString('es-CO')}`}</h2>
          </div>
          
          <div class="passenger-section">
            <h3>👥 ¡IMPORTANTE! - Datos de Pasajeros</h3>
            <p>Para procesar su reserva, necesitamos que complete los datos de todos los pasajeros que viajarán.</p>
            <p><strong>Número de pasajeros a registrar: ${quote.numero_personas}</strong></p>
            
            <a href="${passengerFormLink}" class="btn-passenger" target="_blank">
              📝 COMPLETAR DATOS DE PASAJEROS
            </a>
            
            <p style="font-size: 14px; color: #666; margin-top: 15px;">
              ⚠️ <strong>Este paso es obligatorio</strong> para confirmar su reserva. 
              El enlace estará disponible hasta que complete todos los datos requeridos.
            </p>
          </div>

          ${quote.observaciones ? `
            <div class="quote-details">
              <h3>📝 Observaciones importantes:</h3>
              <p>${quote.observaciones}</p>
            </div>
          ` : ""}
          
          <div class="highlight">
            <p><strong>⏰ Esta cotización es válida por 48 Hs </strong> a partir de la fecha de emisión.</p>
          </div>
          
          <p>📎 En el archivo PDF adjunto encontrará todos los detalles completos de su cotización.</p>
          
          <p>Para confirmar su reserva o si tiene alguna consulta, no dude en contactarnos:</p>
          
          <div class="quote-details">
            <h3>👨‍💼 Su asesor de confianza:</h3>
            <ul>
              <li><strong>Nombre:</strong> ${quote.Asesor?.name || quote.Lider?.name || quote.Gerente?.name || quote.Admin?.name} ${quote.Asesor?.lastname || quote.Lider?.lastname || quote.Gerente?.lastname || quote.Admin?.lastname}</li>
              <li><strong>📧 Email:</strong> ${quote.Asesor?.email || quote.Lider?.email || quote.Gerente?.email || quote.Admin?.email}</li>
              <li><strong>📞 Teléfono general:</strong> +54 123 456 7890</li>
            </ul>
          </div>
          
          <p>¡Esperamos poder hacer realidad su viaje soñado! 🌟</p>
          
          <p>Saludos cordiales,<br>
          <strong>Equipo Viaja Ya</strong></p>
        </div>
        
        <div class="footer">
          <p>Viaja Ya | 📧 info@viajaya.com | 📞 +54 123 456 7890</p>
          <p>Este email fue enviado automáticamente, por favor responda al email de su asesor.</p>
        </div>
      </body>
      </html>
    `;

    // ✅ PASO 5: Enviar email con PDF adjunto (IGUAL QUE ANTES)
    console.log("📧 Enviando email al cliente...");

    const mailOptions = {
      to: quote.email_cliente,
      subject: emailSubject,
      html: emailHTML,
      attachments: [
        {
          filename: pdfInfo.filename,
          path: pdfInfo.filepath,
          contentType: "application/pdf",
        },
      ],
    };

    const emailResult = await sendEmail(mailOptions);
    console.log("✅ Email enviado exitosamente:", emailResult.messageId);

    // ✅ PASO 6: Actualizar fecha de envío del email (IGUAL QUE ANTES)
    await quote.update({
      sent_at: new Date(),
    });

    // ✅ Obtener cotización actualizada con relaciones (IGUAL QUE ANTES)
    const updatedQuote = await Quote.findByPk(id, {
      include: [
        {
          model: User,
          as: "Asesor",
          attributes: ["id", "name", "lastname", "email"],
        },
        {
          model: User,
          as: "Lider",
          attributes: ["id", "name", "lastname", "email"],
        },
        {
          model: User,
          as: "Gerente",
          attributes: ["id", "name", "lastname", "email"],
        },
        {
          model: User,
          as: "Admin",
          attributes: ["id", "name", "lastname", "email"],
        },
      ],
    });

    // ✅ Respuesta exitosa (IGUAL QUE ANTES)
    res.json({
      success: true,
      message: "Cotización enviada exitosamente al cliente",
      quote: updatedQuote,
      email_info: {
        email_sent_to: quote.email_cliente,
        pdf_generated: true,
        pdf_filename: pdfInfo.filename,
        passenger_form_link: passengerFormLink,
        sent_at: sentAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Error enviando cotización al cliente:", error);

    res.status(500).json({
      success: false,
      message: "Error interno del servidor al enviar la cotización",
      error: process.env.NODE_ENV === "development" ? error.message : "Error interno",
    });
  }
},



  // ✅ NUEVO MÉTODO: Descargar PDF de cotización
  downloadQuotePDF: async (req, res) => {
    try {
      const { id } = req.params;

      const quote = await Quote.findByPk(id);

      if (!quote) {
        return res.status(404).json({
          success: false,
          message: "Cotización no encontrada",
        });
      }

      if (!quote.pdf_path || !quote.pdf_filename) {
        return res.status(404).json({
          success: false,
          message: "PDF no disponible para esta cotización",
        });
      }

      // Verificar que el archivo existe
      const fs = require("fs");
      if (!fs.existsSync(quote.pdf_path)) {
        return res.status(404).json({
          success: false,
          message: "Archivo PDF no encontrado en el servidor",
        });
      }

      // Configurar headers para descarga
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${quote.pdf_filename}"`
      );

      // Enviar archivo
      res.sendFile(path.resolve(quote.pdf_path));
    } catch (error) {
      console.error("❌ Error descargando PDF:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  },

  // ✅ NUEVO MÉTODO: Regenerar PDF de cotización
  regenerateQuotePDF: async (req, res) => {
  try {
    const { id } = req.params;

    const quote = await Quote.findByPk(id, {
      include: [
        {
          model: User,
          as: "Asesor",
          attributes: ["id", "name", "lastname", "email"],
        },
        {
          model: User,
          as: "Lider",
          attributes: ["id", "name", "lastname", "email"],
        },
        {
          model: User,
          as: "Gerente",
          attributes: ["id", "name", "lastname", "email"],
        },
        {
          model: User,
          as: "Admin",
          attributes: ["id", "name", "lastname", "email"],
        },
      ],
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: "Cotización no encontrada",
      });
    }

    if (!quote.precio_total) {
      return res.status(400).json({
        success: false,
        message: "La cotización debe tener un precio total para generar el PDF",
      });
    }

    // ✅ NUEVO: Enriquecer cotización (CORREGIDO - Solo personas que pagan)
    let precio_por_persona = 0;
    let personasQuePagan = 0;
    
    if (quote.precio_total) {
      // Calcular personas que pagan (excluyendo infantes)
      personasQuePagan = calcularPersonasQuePagan({
        adultos: quote.adultos,
        menores: quote.menores,
        infantes: quote.infantes
      });
      
      if (personasQuePagan > 0) {
        precio_por_persona = parseFloat(quote.precio_total) / personasQuePagan;
      }
    }

    const enrichedQuote = {
      ...quote.toJSON(),
      precio_por_persona: precio_por_persona,
      precio_por_persona_formateado: precio_por_persona.toFixed(2),
      personas_que_pagan: personasQuePagan,
      calculation_metadata: {
        has_price: !!quote.precio_total,
        has_passengers: quote.numero_personas > 0,
        price_per_person_available: !!(quote.precio_total && personasQuePagan > 0),
        infants_dont_pay: true, // ✅ Indicar que infantes no pagan
      },
      pdf_data: {
        precio_total_cop: quote.precio_total ? `$${parseFloat(quote.precio_total).toLocaleString('es-CO')}` : null,
        precio_por_persona_cop: precio_por_persona > 0 ? `$${precio_por_persona.toLocaleString('es-CO')}` : null,
        fecha_ida_formatted: quote.fecha_ida ? formatForPDF(quote.fecha_ida) : null,
        fecha_regreso_formatted: quote.fecha_regreso ? formatForPDF(quote.fecha_regreso) : null,
        trip_type_label: getTripTypeLabel(quote.trip_type),
      },
      asesor_info: {
        nombre_completo: quote.Asesor ? `${quote.Asesor.name} ${quote.Asesor.lastname}` : 
                        quote.Lider ? `${quote.Lider.name} ${quote.Lider.lastname}` :
                        quote.Gerente ? `${quote.Gerente.name} ${quote.Gerente.lastname}` :
                        quote.Admin ? `${quote.Admin.name} ${quote.Admin.lastname}` : 'No asignado',
        email: quote.Asesor?.email || quote.Lider?.email || quote.Gerente?.email || quote.Admin?.email || null,
        rol: quote.Asesor ? 'Asesor' : 
             quote.Lider ? 'Líder' : 
             quote.Gerente ? 'Gerente' : 
             quote.Admin ? 'Administrador' : 'No asignado'
      }
    };

    // ✅ Regenerar PDF con datos enriquecidos
    const pdfInfo = await generateQuotePDF(enrichedQuote); // ✅ CAMBIO CLAVE

    // Actualizar información del PDF en la base de datos
    await quote.update({
      pdf_path: pdfInfo.filepath,
      pdf_filename: pdfInfo.filename,
      pdf_generated_at: new Date(),
    });

    res.json({
      success: true,
      message: "PDF regenerado exitosamente",
      pdf_info: {
        filename: pdfInfo.filename,
        generated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Error regenerando PDF:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
},

  updateQuote: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        precio_total,
        observaciones,
        status,
        numero_personas,
        fecha_ida,
        fecha_regreso,
        destino,
        trip_type, // ✅ AGREGADO: Campo faltante
        origen,
        acomodacion,
        tipo_hotel,
        // ✅ CAMPOS ELIMINADOS: ninos, edades_ninos
      } = req.body;

      console.log('🔍 DEBUG - updateQuote recibió trip_type:', trip_type);
      console.log('🔍 DEBUG - updateQuote fechas recibidas:', {
        fecha_ida,
        fecha_regreso,
        fecha_ida_type: typeof fecha_ida,
        fecha_regreso_type: typeof fecha_regreso
      });

      const quote = await Quote.findByPk(id);

      if (!quote) {
        return res.status(404).json({ message: "Cotización no encontrada" });
      }

      const updateData = {
        precio_total,
        numero_personas,
        fecha_ida,
        fecha_regreso,
        destino,
        origen,
        acomodacion,
        tipo_hotel,
        // ✅ CAMPOS ELIMINADOS: ninos, edades_ninos
        observaciones: observaciones || quote.observaciones,
        status: status || quote.status,
      };

      // ✅ CORREGIDO: Solo agregar trip_type si no está vacío
      if (trip_type !== undefined && trip_type !== '' && trip_type !== null) {
        updateData.trip_type = trip_type;
      }

      console.log('🔍 DEBUG - updateData antes de guardar:', {
        fecha_ida: updateData.fecha_ida,
        fecha_regreso: updateData.fecha_regreso,
        trip_type: updateData.trip_type,
        datos_completos: updateData
      });

      if (status === "completed" && quote.status !== "completed") {
        updateData.completed_at = new Date();
      }

      await quote.update(updateData);

      console.log('🔍 DEBUG - Quote actualizado, verificando fechas guardadas:', {
        fecha_ida_guardada: quote.fecha_ida,
        fecha_regreso_guardada: quote.fecha_regreso,
        trip_type_guardado: quote.trip_type
      });


      const existingCalculation = await QuoteCalculation.findOne({ 
        where: { quote_id: id } 
      });

      if (existingCalculation) {
        const calculationUpdateData = {};
        
        // Sincronizar fechas
        if (updateData.fecha_ida) {
          calculationUpdateData.fecha_viaje_inicio = updateData.fecha_ida;
          // También actualizar en la estructura de tiquetes si existe
          if (existingCalculation.tiquetes) {
            const tiquetesData = typeof existingCalculation.tiquetes === 'string' 
              ? JSON.parse(existingCalculation.tiquetes) 
              : existingCalculation.tiquetes;
            tiquetesData.fecha_ida = updateData.fecha_ida;
            calculationUpdateData.tiquetes = tiquetesData;
          }
        }
        
        if (updateData.fecha_regreso) {
          calculationUpdateData.fecha_viaje_fin = updateData.fecha_regreso;
          // También actualizar en la estructura de tiquetes si existe
          if (existingCalculation.tiquetes) {
            const tiquetesData = typeof existingCalculation.tiquetes === 'string' 
              ? JSON.parse(existingCalculation.tiquetes) 
              : existingCalculation.tiquetes;
            tiquetesData.fecha_vuelta = updateData.fecha_regreso;
            calculationUpdateData.tiquetes = tiquetesData;
          }
        }

        // Sincronizar otros campos importantes
        if (updateData.trip_type) calculationUpdateData.trip_type = updateData.trip_type;
        if (updateData.numero_personas) calculationUpdateData.num_personas = updateData.numero_personas;
        if (updateData.precio_total) calculationUpdateData.precio_final_total = updateData.precio_total;

        if (Object.keys(calculationUpdateData).length > 0) {
          console.log('🔄 SYNC: Sincronizando fechas de Quote a QuoteCalculation:', {
            quote_id: id,
            changes: calculationUpdateData
          });
          
          await existingCalculation.update(calculationUpdateData);
          console.log('✅ SYNC: QuoteCalculation actualizado exitosamente');
        }
      }

      const updatedQuote = await Quote.findByPk(id, {
        include: [
          {
            model: User,
            as: "Asesor",
            attributes: ["id", "name", "lastname", "email", "role"],
          },
          {
            model: User,
            as: "Lider",
            attributes: ["id", "name", "lastname", "email", "role"],
          },
          {
            model: User,
            as: "Gerente",
            attributes: ["id", "name", "lastname", "email", "role"],
          },
          {
            model: User,
            as: "Admin",
            attributes: ["id", "name", "lastname", "email", "role"],
          },
          {
            model: User,
            as: "Cliente",
            attributes: ["id", "name", "lastname", "email", "phone"],
          },
        ],
      });

      res.json({
        message: "Cotización actualizada exitosamente",
        quote: updatedQuote,
      });
    } catch (error) {
      console.error("Error updating quote:", error);
      res.status(500).json({
        message: "Error al actualizar la cotización",
        error: error.message,
      });
    }
  },

  approveQuote: async (req, res) => {
    try {
      const { id } = req.params;

      const quote = await Quote.findByPk(id, {
        include: [
          {
            model: Passenger,
            as: 'Passengers',
            attributes: [
              'id', 'nombre', 'apellido', 'documento_identidad',
              'tipo_documento', 'fecha_nacimiento', 'titular'
            ]
          }
        ]
      });

      if (!quote) {
        return res.status(404).json({ message: "Cotización no encontrada" });
      }

      if (quote.status !== "completed" && quote.status !== "sent") {
        return res.status(400).json({
          message:
            "La cotización debe estar completada o enviada antes de ser aprobada",
          current_status: quote.status,
          required_status: "completed o sent",
        });
      }
      if (!quote.Passengers || quote.Passengers.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No se puede aprobar: La cotización no tiene datos de pasajeros registrados",
          missing_data: "passengers"
        });
      }

      if (quote.Passengers.length !== quote.numero_personas) {
        return res.status(400).json({
          success: false,
          message: `No se puede aprobar: Faltan datos de pasajeros. Se esperan ${quote.numero_personas} pero solo hay ${quote.Passengers.length}`,
          expected: quote.numero_personas,
          actual: quote.Passengers.length,
          missing_data: "passengers"
        });
      }

      // ✅ AGREGAR: Verificar que hay un pasajero titular
      const titularPassenger = quote.Passengers.find(p => p.titular === true);
      if (!titularPassenger) {
        return res.status(400).json({
          success: false,
          message: "No se puede aprobar: Debe haber un pasajero titular designado",
          missing_data: "titular_passenger"
        });
      }


      console.log("✅ Aprobando cotización:", {
        id: quote.id,
        current_status: quote.status,
        quote_number: quote.quote_number,
        passengers_count: quote.Passengers.length,
        titular: `${titularPassenger.nombre} ${titularPassenger.apellido}`
      });

      // Crear usuario cliente automáticamente si corresponde
      let clientUser = null;
      if (quote.email_cliente) {
        try {
          clientUser = await createClientUser({
            nombre_cliente: quote.nombre_cliente,
            email_cliente: quote.email_cliente,
            telefono_cliente: quote.telefono_cliente,
          });
          console.log("✅ Usuario cliente procesado:", clientUser.id);
        } catch (userError) {
          console.error(
            "⚠️ Error creando usuario cliente, continuando con aprobación:",
            userError
          );
        }
      }

      await quote.update({
        status: "approved",
        approved_at: new Date(),
        ...(clientUser && { cliente_id: clientUser.id }),
      });

      // Crear contrato automáticamente si no existe
      const existingContract = await Contract.findOne({
        where: { quote_id: quote.id },
      });
      let newContract = null;
      if (!existingContract) {
        // Generar número de contrato único
        const contractNumber = `CON-${Date.now()}-${Math.floor(
          Math.random() * 1000
        )}`;

        // ✅ DEBUG: Verificar trip_type de la cotización
        console.log('🔍 DEBUG - approveQuote creando contrato con trip_type:', quote.trip_type);

        newContract = await Contract.create({
          contract_number: contractNumber,
          quote_id: quote.id,
          cliente_id: clientUser ? clientUser.id : quote.cliente_id,
          trip_type: quote.trip_type || 'nacional', // ✅ AGREGADO: Campo faltante
          asesor_id: quote.asesor_id,
          lider_id: quote.lider_id,
          gerente_id: quote.gerente_id,
          precio_total: quote.precio_total,
          destino: quote.destino,
          origen: quote.origen,
          // Campos obligatorios típicos:
          forma_pago: "contado", // o 'cuotas', según tu lógica
          fecha_inicio_viaje: quote.fecha_ida,
          fecha_fin_viaje: quote.fecha_regreso,
          saldo_pendiente: quote.precio_total || 0,
          numero_pasajeros: quote.Passengers.length,
          pasajero_titular: `${titularPassenger.nombre} ${titularPassenger.apellido}`,
          documento_titular: `${titularPassenger.tipo_documento}: ${titularPassenger.documento_identidad}`,
          status: 'draft'
        });
        console.log("✅ Contrato creado automáticamente al aprobar cotización:", {
          contract_id: newContract.id,
          contract_number: newContract.contract_number,
          passengers: quote.Passengers.length,
          titular: newContract.pasajero_titular
        });
      }

      // Obtener la cotización actualizada con relaciones
      const updatedQuote = await Quote.findByPk(id, {
        include: [
          {
            model: User,
            as: "Asesor",
            attributes: ["id", "name", "lastname", "email", "role"],
          },
          {
            model: User,
            as: "Lider",
            attributes: ["id", "name", "lastname", "email", "role"],
          },
          {
            model: User,
            as: "Gerente",
            attributes: ["id", "name", "lastname", "email", "role"],
          },
          {
            model: User,
            as: "Admin",
            attributes: ["id", "name", "lastname", "email", "role"],
          },
          {
            model: User,
            as: "Cliente",
            attributes: ["id", "name", "lastname", "email", "phone"],
            required: false,
          },
          {
            model: Passenger,
            as: 'Passengers',
            attributes: [
              'id', 'nombre', 'apellido', 'documento_identidad',
              'tipo_documento', 'fecha_nacimiento', 'titular'
            ]
          },
          // ✅ AGREGAR: Incluir el contrato creado si existe
          {
            model: Contract,
            as: 'Contract',
            attributes: [
              'id', 'contract_number', 'status', 'precio_total',
              'forma_pago', 'numero_pasajeros', 'pasajero_titular', 'documento_titular'
            ],
            required: false
          }
        ],
      });

      res.json({
        success: true,
        message: "Cotización aprobada exitosamente",
        quote: updatedQuote,
        contract: newContract,
        // ✅ AGREGAR: Resumen de pasajeros en la respuesta
        passengers_summary: {
          total: quote.Passengers.length,
          expected: quote.numero_personas,
          complete: quote.Passengers.length === quote.numero_personas,
          titular: titularPassenger ? {
            nombre: `${titularPassenger.nombre} ${titularPassenger.apellido}`,
            documento: `${titularPassenger.tipo_documento}: ${titularPassenger.documento_identidad}`
          } : null,
          all_passengers: quote.Passengers
        },
        clientUser: clientUser
          ? {
            id: clientUser.id,
            email: clientUser.email,
            created: !clientUser.password_changed_at,
          }
          : null,
      });
    } catch (error) {
      console.error("Error approving quote:", error);
      res.status(500).json({
        success: false,
        message: "Error al aprobar la cotización",
        error: error.message,
      });
    }
  },

  rejectQuote: async (req, res) => {
    try {
      const { id } = req.params;
      const { motivo_rechazo } = req.body;

      const quote = await Quote.findByPk(id);

      if (!quote) {
        return res.status(404).json({ message: "Cotización no encontrada" });
      }

      await quote.update({
        status: "rejected",
        rejected_at: new Date(),
        motivo_rechazo,
      });

      res.json({
        message: "Cotización rechazada",
        quote,
      });
    } catch (error) {
      console.error("Error rejecting quote:", error);
      res.status(500).json({
        message: "Error al rechazar la cotización",
        error: error.message,
      });
    }
  },

  requestRequote: async (req, res) => {
    try {
      const { id } = req.params;
      const { requote_reason } = req.body;

      const quote = await Quote.findByPk(id);

      if (!quote) {
        return res.status(404).json({ message: "Cotización no encontrada" });
      }

      if (
        quote.status !== "sent" &&
        quote.status !== "expired" &&
        quote.status !== "rejected"
      ) {
        return res.status(400).json({
          message:
            "Solo se pueden solicitar recotizaciones en cotizaciones enviadas o expiradas",
        });
      }

      await quote.update({
        status: "requote",
        requote_at: new Date(),
        requote_reason,
      });

      res.json({
        message: "Recotización solicitada exitosamente",
        quote,
      });
    } catch (error) {
      console.error("Error requesting requote:", error);
      res.status(500).json({
        message: "Error al solicitar recotización",
        error: error.message,
      });
    }
  },

  markExpiredQuotes: async (req, res) => {
    try {
      const expiredQuotes = await Quote.update(
        { status: "expired" },
        {
          where: {
            status: "sent",
            expires_at: { [Op.lt]: new Date() },
          },
        }
      );

      res.json({
        message: `${expiredQuotes[0]} cotizaciones marcadas como expiradas`,
        count: expiredQuotes[0],
      });
    } catch (error) {
      console.error("Error marking expired quotes:", error);
      res.status(500).json({
        message: "Error al marcar cotizaciones expiradas",
        error: error.message,
      });
    }
  },

  previewQuotePDF: async (req, res) => {
    try {
      const { id } = req.params;

      console.log("🔍 Generando vista previa de PDF para cotización:", id);

      // ✅ CORREGIR: Buscar la cotización con todas las relaciones usando alias específicos
      const quote = await Quote.findByPk(id, {
        include: [
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
          {
            model: User,
            as: "Owner",
            attributes: ["id", "name", "lastname", "email"],
            required: false,
          },
        ],
      });

      if (!quote) {
        return res.status(404).json({
          success: false,
          message: "Cotización no encontrada",
        });
      }

      // Validar que tenga precio para generar PDF
      if (!quote.precio_total || quote.precio_total <= 0) {
        return res.status(400).json({
          success: false,
          message:
            "La cotización debe tener un precio total para generar el PDF",
        });
      }

      console.log("📄 Generando PDF para vista previa...");
      console.log("📋 Datos de la cotización:", {
        id: quote.id,
        quote_number: quote.quote_number,
        asesor: quote.Asesor?.name,
        lider: quote.Lider?.name,
        gerente: quote.Gerente?.name,
        admin: quote.Admin?.name,
        owner: quote.Owner?.name,
      });

      // ✅ FIX: Enriquecer cotización con cálculos (IGUAL QUE EN sendQuote)
      let precio_por_persona = 0;
      let personasQuePagan = 0;
      
      if (quote.precio_total) {
        // Calcular personas que pagan (excluyendo infantes)
        personasQuePagan = calcularPersonasQuePagan({
          adultos: quote.adultos,
          menores: quote.menores,
          infantes: quote.infantes
        });
        
        if (personasQuePagan > 0) {
          precio_por_persona = parseFloat(quote.precio_total) / personasQuePagan;
        }
        
        console.log('💰 PREVIEW PDF - CÁLCULO DE PRECIO POR PERSONA QUE PAGA:', {
          precio_total: quote.precio_total,
          total_pasajeros: quote.numero_personas,
          personas_que_pagan: personasQuePagan,
          adultos: quote.adultos,
          menores: quote.menores,
          infantes: quote.infantes,
          precio_por_persona_que_paga: precio_por_persona.toFixed(2)
        });
      }

      // ✅ FIX: Crear versión enriquecida de la cotización (IGUAL QUE EN sendQuote)
      const enrichedQuote = {
        ...quote.toJSON(),
        precio_por_persona: precio_por_persona,
        precio_por_persona_formateado: precio_por_persona.toFixed(2),
        personas_que_pagan: personasQuePagan,
        calculation_metadata: {
          has_price: !!quote.precio_total,
          has_passengers: quote.numero_personas > 0,
          price_per_person_available: !!(quote.precio_total && personasQuePagan > 0),
          infants_dont_pay: true,
        },
        pdf_data: {
          precio_total_cop: quote.precio_total ? `$${parseFloat(quote.precio_total).toLocaleString('es-CO')}` : null,
          precio_por_persona_cop: precio_por_persona > 0 ? `$${precio_por_persona.toLocaleString('es-CO')}` : null,
          fecha_ida_formatted: quote.fecha_ida ? formatForPDF(quote.fecha_ida) : null,
          fecha_regreso_formatted: quote.fecha_regreso ? formatForPDF(quote.fecha_regreso) : null,
          trip_type_label: getTripTypeLabel(quote.trip_type),
        },
        asesor_info: {
          nombre_completo: quote.Asesor ? `${quote.Asesor.name} ${quote.Asesor.lastname}` : 
                          quote.Lider ? `${quote.Lider.name} ${quote.Lider.lastname}` :
                          quote.Gerente ? `${quote.Gerente.name} ${quote.Gerente.lastname}` :
                          quote.Admin ? `${quote.Admin.name} ${quote.Admin.lastname}` : 'No asignado',
          email: quote.Asesor?.email || quote.Lider?.email || quote.Gerente?.email || quote.Admin?.email || null,
          rol: quote.Asesor ? 'Asesor' : 
               quote.Lider ? 'Líder' : 
               quote.Gerente ? 'Gerente' : 
               quote.Admin ? 'Administrador' : 'No asignado'
        }
      };

      console.log('📋 PREVIEW PDF - Datos enriquecidos para PDF:', {
        precio_por_persona: enrichedQuote.precio_por_persona,
        precio_por_persona_formateado: enrichedQuote.precio_por_persona_formateado,
        pdf_data_precio_cop: enrichedQuote.pdf_data?.precio_por_persona_cop,
        pdf_data_fechas: {
          fecha_ida_formatted: enrichedQuote.pdf_data?.fecha_ida_formatted,
          fecha_regreso_formatted: enrichedQuote.pdf_data?.fecha_regreso_formatted
        }
      });

      // ✅ FIX: Generar PDF en memoria usando cotización enriquecida
      console.log("🔍 Llamando a generateQuotePDF con enrichedQuote...");
      const pdfResult = await generateQuotePDF(enrichedQuote, false);
      console.log("✅ generateQuotePDF completado, verificando resultado...");

      if (!pdfResult || !pdfResult.buffer) {
        console.error("❌ pdfResult:", pdfResult);
        throw new Error("Error generando buffer de PDF");
      }

      console.log("✅ PDF generado exitosamente para vista previa");

      // ✅ Configurar headers para PDF
      const filename =
        pdfResult.filename ||
        `cotizacion-${quote.quote_number || quote.id}.pdf`;

      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Content-Length": pdfResult.buffer.length,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      });

      // ✅ Enviar el buffer directamente
      res.send(pdfResult.buffer);
    } catch (error) {
      console.error("❌ Error generando vista previa PDF:", error);
      res.status(500).json({
        success: false,
        message: "Error generando vista previa del PDF: " + error.message,
      });
    }
  },

  getQuotesByVendedor: async (req, res) => {
    try {
      const { vendedor_id, tipo } = req.params;
      const { status, page = 1, limit = 10 } = req.query;

      const offset = (page - 1) * limit;
      const where = {};

      if (status) where.status = status;

      switch (tipo) {
        case "asesor":
          where.asesor_id = vendedor_id;
          break;
        case "lider":
          where.lider_id = vendedor_id;
          break;
        case "gerente":
          where.gerente_id = vendedor_id;
          break;
        case "admin":
          where.admin_id = vendedor_id;
          break;
        default:
          return res.status(400).json({ message: "Tipo de vendedor inválido" });
      }

      const quotes = await Quote.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: "Asesor",
            attributes: ["id", "name", "lastname", "email", "role"],
          },
          {
            model: User,
            as: "Lider",
            attributes: ["id", "name", "lastname", "email", "role"],
          },
          {
            model: User,
            as: "Gerente",
            attributes: ["id", "name", "lastname", "email", "role"],
          },
          {
            model: User,
            as: "Admin",
            attributes: ["id", "name", "lastname", "email", "role"],
          },
          {
            model: User,
            as: "Cliente",
            attributes: ["id", "name", "lastname", "email", "phone"],
          },
        ],
        order: [["created_at", "DESC"]],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      res.json({
        quotes: quotes.rows,
        total: quotes.count,
        totalPages: Math.ceil(quotes.count / limit),
        currentPage: parseInt(page),
      });
    } catch (error) {
      console.error("Error fetching quotes by vendedor:", error);
      res.status(500).json({
        message: "Error al obtener las cotizaciones del vendedor",
        error: error.message,
      });
    }
  },
};

// ✅ Funciones helper para obtener usuarios por jerarquía
const getUsersByLider = async (liderId) => {
  const asesores = await User.findAll({
    where: { lider_id: liderId, role: 2 },
    attributes: ["id"],
  });
  return asesores.map((a) => a.id);
};

const getUsersByGerente = async (gerenteId) => {
  const lideres = await User.findAll({
    where: { gerente_id: gerenteId, role: 3 },
    attributes: ["id"],
  });
  return lideres.map((l) => l.id);
};

const getAsesoresByGerente = async (gerenteId) => {
  const asesores = await User.findAll({
    where: { gerente_id: gerenteId, role: 2 },
    attributes: ["id"],
  });
  return asesores.map((a) => a.id);
};

const getRoleName = (role) => {
  const roleNames = {
    2: "Asesor",
    3: "Líder",
    4: "Gerente",
    5: "Admin",
    6: "Contador",
    7: "Owner",
  };
  return roleNames[role] || "Usuario";
};

// ✅ Endpoint para actualizar información detallada de pasajeros
quoteController.updatePassengerDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      adultos,
      menores,
      infantes,
      edades_menores,
      edades_infantes,
      personas_atencion_especial,
      detalles_atencion_especial,
      tipo_hotel,
      acomodacion
    } = req.body;

    const quote = await Quote.findByPk(id);
    if (!quote) {
      return res.status(404).json({
        message: "Cotización no encontrada",
        success: false
      });
    }

    // Validar datos de pasajeros usando la utilidad
    const { validatePassengerData } = require('../utils/passengerValidation');
    const validation = validatePassengerData({
      numero_personas: (adultos || 0) + (menores || 0) + (infantes || 0),
      adultos,
      menores,
      infantes,
      edades_menores,
      edades_infantes,
      personas_atencion_especial
    });

    if (!validation.isValid) {
      return res.status(400).json({
        message: "Datos de pasajeros inválidos",
        errors: validation.errors,
        warnings: validation.warnings,
        success: false
      });
    }

    // Actualizar la cotización
    await quote.update({
      adultos: adultos || 0,
      menores: menores || 0,
      infantes: infantes || 0,
      numero_personas: (adultos || 0) + (menores || 0) + (infantes || 0),
      edades_menores: edades_menores || [],
      edades_infantes: edades_infantes || [],
      personas_atencion_especial: personas_atencion_especial || 0,
      detalles_atencion_especial: detalles_atencion_especial || null,
      tipo_hotel: tipo_hotel || quote.tipo_hotel,
      acomodacion: acomodacion || quote.acomodacion
    });

    // Obtener resumen de pasajeros
    const resumen = quote.obtenerResumenPasajeros();

    res.json({
      message: "Información de pasajeros actualizada exitosamente",
      quote: quote,
      resumen_pasajeros: resumen,
      warnings: validation.warnings,
      success: true
    });

  } catch (error) {
    console.error('Error actualizando información de pasajeros:', error);
    res.status(500).json({
      message: "Error interno del servidor",
      error: error.message,
      success: false
    });
  }
};

// ✅ Endpoint para obtener resumen detallado de pasajeros
quoteController.getPassengerSummary = async (req, res) => {
  try {
    const { id } = req.params;

    const quote = await Quote.findByPk(id);
    if (!quote) {
      return res.status(404).json({
        message: "Cotización no encontrada",
        success: false
      });
    }

    const resumen = quote.obtenerResumenPasajeros();
    const { calculatePricingByAge, generatePassengerSummary } = require('../utils/passengerValidation');

    // Calcular precios si hay precio base
    let desglosePrecio = null;
    if (quote.precio_por_persona) {
      desglosePrecio = calculatePricingByAge(
        { adultos: quote.adultos, menores: quote.menores, infantes: quote.infantes },
        parseFloat(quote.precio_por_persona)
      );
    }

    // Generar resumen en texto
    const resumenTexto = generatePassengerSummary({
      adultos: quote.adultos,
      menores: quote.menores,
      infantes: quote.infantes,
      personas_atencion_especial: quote.personas_atencion_especial,
      edades_menores: quote.edades_menores,
      edades_infantes: quote.edades_infantes
    });

    res.json({
      quote_id: quote.id,
      quote_number: quote.quote_number,
      resumen_pasajeros: resumen,
      resumen_texto: resumenTexto,
      desglose_precio: desglosePrecio,
      success: true
    });

  } catch (error) {
    console.error('Error obteniendo resumen de pasajeros:', error);
    res.status(500).json({
      message: "Error interno del servidor",
      error: error.message,
      success: false
    });
  }
};

// ✅ Endpoint para migrar datos existentes (solo para administradores)
quoteController.migratePassengerData = async (req, res) => {
  try {
    // Verificar permisos de admin (role >= 5)
    if (req.user && req.user.role < 5) {
      return res.status(403).json({
        message: "No tienes permisos para ejecutar esta migración",
        success: false
      });
    }

    await Quote.migrarDatosExistentes();

    res.json({
      message: "Migración de datos de pasajeros completada exitosamente",
      success: true
    });

  } catch (error) {
    console.error('Error en migración de datos:', error);
    res.status(500).json({
      message: "Error durante la migración",
      error: error.message,
      success: false
    });
  }
};

module.exports = quoteController;
