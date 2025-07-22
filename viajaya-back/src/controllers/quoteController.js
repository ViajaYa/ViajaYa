const { Quote, User, Contract } = require("../db");
const { Op } = require("sequelize");
const { sendEmail } = require('../utils/emailService');
const { generateQuotePDF } = require('../utils/generateQuotePDF');
const path = require('path');



const createClientUser = async (quoteData) => {
  try {
    const { nombre_cliente, email_cliente, telefono_cliente } = quoteData;
    
    // Verificar si ya existe un usuario con ese email
    let existingUser = await User.findOne({ 
      where: { email: email_cliente } 
    });
    
    if (existingUser) {
      console.log('✅ Usuario cliente ya existe:', existingUser.id);
      return existingUser;
    }
    
    // Generar password temporal
    const tempPassword = Math.random().toString(36).slice(-8) + 'Temp123!';
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    // Crear nuevo usuario cliente
    const newUser = await User.create({
      name: nombre_cliente.split(' ')[0] || nombre_cliente,
      lastname: nombre_cliente.split(' ').slice(1).join(' ') || '',
      email: email_cliente,
      phone: telefono_cliente,
      password: hashedPassword,
      role: 1, // Cliente
      is_active: true,
      email_verified: false, // Requerirá verificación
      password_changed_at: null // Indicará que debe cambiar password
    });
    
    console.log('✅ Usuario cliente creado:', {
      id: newUser.id,
      email: newUser.email,
      tempPassword // ⚠️ SOLO PARA LOG - enviarlo por email después
    });
    
    // TODO: Enviar email con credenciales temporales
    
    return newUser;
    
  } catch (error) {
    console.error('❌ Error creando usuario cliente:', error);
    throw error;
  }
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
        fecha_ida,
        fecha_regreso,
        destino,
        origen,
        acomodacion,
        tipo_hotel,
        ninos,
        edades_ninos,
        observaciones,
        nombre_cliente,
        email_cliente,
        telefono_cliente,
        created_by,
        source = 'internal', // ✅ NUEVO: Indicar origen de la cotización
      } = req.body;

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
            attributes: ['id', 'name', 'lastname', 'role', 'lider_id', 'gerente_id']
          });
          
          if (asesor && asesor.role === 2) {
            asesorIdFinal = asesor.id;
            liderIdFinal = asesor.lider_id;
            gerenteIdFinal = asesor.gerente_id;
          }
        } else if (lider_id) {
          const lider = await User.findByPk(lider_id, {
            attributes: ['id', 'name', 'lastname', 'role', 'gerente_id']
          });
          
          if (lider && lider.role === 3) {
            liderIdFinal = lider.id;
            gerenteIdFinal = lider.gerente_id;
          }
        } else if (gerente_id) {
          const gerente = await User.findByPk(gerente_id, {
            attributes: ['id', 'name', 'lastname', 'role']
          });
          
          if (gerente && gerente.role === 4) {
            gerenteIdFinal = gerente.id;
          }
        } else if (admin_id) {
          const admin = await User.findByPk(admin_id, {
            attributes: ['id', 'name', 'lastname', 'role']
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
            is_active: true 
          },
          order: [["id", "ASC"]], // Primer Owner encontrado
          attributes: ['id', 'name', 'lastname', 'role']
        });
        
        if (owner) {
          adminIdFinal = owner.id;
          console.log(`✅ Cotización externa asignada al Owner: ${owner.name} ${owner.lastname} (ID: ${owner.id})`);
        } else {
          return res.status(400).json({
            message: "No hay Owner disponible para asignar la cotización externa.",
          });
        }
      }

      // ✅ Si no se pudo determinar ningún responsable (solo para cotizaciones internas), buscar Owner como fallback
      if (!isExternalQuote && !asesorIdFinal && !liderIdFinal && !gerenteIdFinal && !adminIdFinal) {
        const owner = await User.findOne({
          where: { role: 7 },
          order: [["id", "ASC"]],
        });
        
        if (owner) {
          adminIdFinal = owner.id;
        } else {
          return res.status(400).json({
            message: "No hay responsable disponible para asignar la cotización.",
          });
        }
      }

      // ✅ Generar número de cotización único
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const day = String(currentDate.getDate()).padStart(2, "0");

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

      const quote_number = `COT-${year}${month}${day}-${String(sequence).padStart(3, "0")}`;

      // ✅ Crear la cotización con metadatos
      const newQuote = await Quote.create({
        quote_number,
        asesor_id: asesorIdFinal,
        lider_id: liderIdFinal,
        gerente_id: gerenteIdFinal,
        admin_id: adminIdFinal,
        cliente_id: clienteIdFinal,
        numero_personas,
        fecha_ida,
        fecha_regreso,
        destino,
        origen,
        acomodacion,
        tipo_hotel,
        ninos: ninos || 0,
        edades_ninos: edades_ninos || [],
        observaciones,
        nombre_cliente: nombre_cliente,      // ✅ Cambiar de: clienteIdFinal ? null : nombre_cliente
  email_cliente: email_cliente,        // ✅ Cambiar de: clienteIdFinal ? null : email_cliente  
  telefono_cliente: telefono_cliente,  // ✅ Cambiar de: clienteIdFinal ? null : telefono_cliente
        status: "pending",
        source: source,
        is_external: isExternalQuote,
        created_by: created_by || (isExternalQuote ? 'Web Pública - Usuario no registrado' : 'Sistema'),
        priority: isExternalQuote ? 'high' : 'normal',
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
          type: isExternalQuote ? 'external' : 'internal',
          assigned_to: {
            asesor: asesorIdFinal,
            lider: liderIdFinal,
            gerente: gerenteIdFinal,
            admin: adminIdFinal,
          },
          priority: isExternalQuote ? 'high' : 'normal',
          reason: isExternalQuote ? 'Auto-asignado al Owner (cotización externa)' : 'Asignación manual'
        }
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
        source: 'external',
        created_by: 'Web Pública - Usuario no registrado',
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
        attributes: ['id', 'name', 'lastname', 'role', 'lider_id', 'gerente_id']
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
            created_by: `${creator.name} ${creator.lastname} (Asesor)`
          };
          break;
          
        case 3: // Líder
          assignmentData = {
            lider_id: creator.id,
            gerente_id: creator.gerente_id,
            created_by: `${creator.name} ${creator.lastname} (Líder)`
          };
          break;
          
        case 4: // Gerente
          assignmentData = {
            gerente_id: creator.id,
            created_by: `${creator.name} ${creator.lastname} (Gerente)`
          };
          break;
          
        case 5: // Admin
        case 6: // Contador
        case 7: // Owner
          assignmentData = {
            admin_id: creator.id,
            created_by: `${creator.name} ${creator.lastname} (${getRoleName(creator.role)})`
          };
          break;
          
        default:
          return res.status(403).json({ 
            message: "No tienes permisos para crear cotizaciones" 
          });
      }

      // Combinar datos de la cotización con la asignación automática
      const completeQuoteData = {
        ...quoteData,
        ...assignmentData
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

       const now = new Date();
    const expiredQuotes = quotes.rows.filter(
      q => q.status === "sent" && q.expires_at && new Date(q.expires_at) < now
    );

      res.json({
      quotes: quotes.rows,
      total: quotes.count,
      totalPages: Math.ceil(quotes.count / limit),
      currentPage: parseInt(page),
      expiredQuotes, // <-- Aquí tienes las expiradas
      expiredCount: expiredQuotes.length
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
        // ✅ CORREGIR: Especificar el alias para Contract
        {
          model: Contract,
          as: "Contract", // o el alias que hayas definido en las asociaciones
          required: false // hacer que sea opcional
        },
      ],
    });

    if (!quote) {
      return res.status(404).json({ message: "Cotización no encontrada" });
    }

    res.json(quote);
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
        is_external: true
      };

      // Si owner_only es true, filtrar solo las asignadas a Owners
      if (owner_only === 'true') {
        const owners = await User.findAll({
          where: { role: 7 },
          attributes: ['id']
        });
        
        const ownerIds = owners.map(o => o.id);
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
          ['priority', 'DESC'],
          ["created_at", "ASC"] // Más antiguas primero para que el Owner las vea en orden
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      res.json({
        quotes: quotes.rows,
        total: quotes.count,
        totalPages: Math.ceil(quotes.count / limit),
        currentPage: parseInt(page),
        type: 'external_quotes_owner_assigned'
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
          message: "Solo se pueden reasignar cotizaciones externas" 
        });
      }

      // Validar que se está asignando a un vendedor válido
      let newAssignment = {};
      
      if (asesor_id) {
        const asesor = await User.findByPk(asesor_id, {
          attributes: ['id', 'role', 'lider_id', 'gerente_id']
        });
        
        if (asesor && asesor.role === 2) {
          newAssignment = {
            asesor_id: asesor.id,
            lider_id: asesor.lider_id,
            gerente_id: asesor.gerente_id,
            admin_id: null // Quitar del Owner
          };
        }
      } else if (lider_id) {
        const lider = await User.findByPk(lider_id, {
          attributes: ['id', 'role', 'gerente_id']
        });
        
        if (lider && lider.role === 3) {
          newAssignment = {
            asesor_id: null,
            lider_id: lider.id,
            gerente_id: lider.gerente_id,
            admin_id: null // Quitar del Owner
          };
        }
      } else if (gerente_id) {
        const gerente = await User.findByPk(gerente_id, {
          attributes: ['id', 'role']
        });
        
        if (gerente && gerente.role === 4) {
          newAssignment = {
            asesor_id: null,
            lider_id: null,
            gerente_id: gerente.id,
            admin_id: null // Quitar del Owner
          };
        }
      }

      if (Object.keys(newAssignment).length === 0) {
        return res.status(400).json({
          message: "Debe proporcionar un vendedor válido para la reasignación"
        });
      }

      await quote.update({
        ...newAssignment,
        reassigned_at: new Date(),
        reassignment_reason: reason || 'Reasignación desde Owner a vendedor'
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
        message: "Cotización externa reasignada exitosamente desde Owner a vendedor",
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
        attributes: ['id', 'role']
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
            { asesor_id: { [Op.in]: await getUsersByLider(userId) } }
          ];
          break;
        case 4: // Gerente
          where[Op.or] = [
            { gerente_id: userId },
            { lider_id: { [Op.in]: await getUsersByGerente(userId) } },
            { asesor_id: { [Op.in]: await getAsesoresByGerente(userId) } }
          ];
          break;
        case 5: // Admin
        case 6: // Contador
        case 7: // Owner
          // Pueden ver todas las cotizaciones
          break;
        default:
          return res.status(403).json({ 
            message: "No tienes permisos para ver cotizaciones" 
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
        userRole: user.role
      });
    } catch (error) {
      console.error("Error fetching quotes by user:", error);
      res.status(500).json({
        message: "Error al obtener las cotizaciones del usuario",
        error: error.message,
      });
    }
  },




  // ✅ REEMPLAZAR sendQuote con esta versión mejorada
  sendQuote: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      console.log('🚀 Iniciando envío de cotización al cliente:', { quoteId: id, userId });

      // ✅ Buscar la cotización con todas las relaciones
      const quote = await Quote.findByPk(id, {
        include: [
          { model: User, as: 'Asesor', attributes: ['id', 'name', 'lastname', 'email'] },
          { model: User, as: 'Lider', attributes: ['id', 'name', 'lastname', 'email'] },
          { model: User, as: 'Gerente', attributes: ['id', 'name', 'lastname', 'email'] },
          { model: User, as: 'Admin', attributes: ['id', 'name', 'lastname', 'email'] }
        ]
      });

      if (!quote) {
        return res.status(404).json({ 
          success: false, 
          message: 'Cotización no encontrada' 
        });
      }

      // ✅ Validaciones mejoradas
      if (quote.status !== "completed") {
        return res.status(400).json({
          success: false,
          message: "La cotización debe estar completada antes de ser enviada",
        });
      }

      if (!quote.precio_total || quote.precio_total <= 0) {
        return res.status(400).json({
          success: false,
          message: 'La cotización debe tener un precio total antes de enviarla'
        });
      }

      if (!quote.email_cliente || !quote.email_cliente.includes('@')) {
        return res.status(400).json({
          success: false,
          message: 'La cotización debe tener un email de cliente válido'
        });
      }

      // ✅ Validar que no se haya enviado ya
      if (quote.status === 'sent') {
        return res.status(400).json({
          success: false,
          message: 'Esta cotización ya fue enviada al cliente'
        });
      }

      // ✅ PASO 1: Generar PDF
      console.log('📄 Generando PDF de la cotización...');
      const pdfInfo = await generateQuotePDF(quote);

      // ✅ PASO 2: Preparar fechas
      const sentAt = new Date();
      const expiresAt = new Date(sentAt.getTime() + 48 * 60 * 60 * 1000);

      // ✅ PASO 3: Actualizar la cotización con PDF y estado
      await quote.update({
        status: "sent",
        sent_at: sentAt,
        expires_at: expiresAt,
        pdf_path: pdfInfo.filepath,
        pdf_filename: pdfInfo.filename,
        pdf_generated_at: new Date(),
        email_sent_to: quote.email_cliente
      });

      // ✅ PASO 4: Preparar el email
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
            <h2>Estimado/a ${quote.nombre_cliente || 'Cliente'},</h2>
            
            <p>Nos complace presentarle la cotización solicitada para su viaje a <strong>${quote.destino}</strong>.</p>
            
            <div class="quote-details">
              <h3>📋 Detalles del Viaje:</h3>
              <ul>
                <li><strong>🏖️ Destino:</strong> ${quote.destino}</li>
                <li><strong>📍 Origen:</strong> ${quote.origen}</li>
                <li><strong>📅 Fecha de ida:</strong> ${new Date(quote.fecha_ida).toLocaleDateString('es-ES')}</li>
                <li><strong>📅 Fecha de regreso:</strong> ${new Date(quote.fecha_regreso).toLocaleDateString('es-ES')}</li>
                <li><strong>👥 Número de personas:</strong> ${quote.numero_personas}</li>
                ${quote.ninos > 0 ? `<li><strong>👶 Niños:</strong> ${quote.ninos} (Edades: ${quote.edades_ninos.join(', ')})</li>` : ''}
                <li><strong>🏨 Tipo de acomodación:</strong> ${quote.acomodacion}</li>
                <li><strong>⭐ Tipo de hotel:</strong> ${quote.tipo_hotel}</li>
                ${quote.traslado ? '<li><strong>🚗 Traslados:</strong> Incluidos</li>' : ''}
                ${quote.alimentacion ? `<li><strong>🍽️ Alimentación:</strong> ${quote.alimentacion}</li>` : ''}
              </ul>
            </div>
            
            <div class="price">
              <h2>💰 Precio Total: USD $${quote.precio_total.toLocaleString()}</h2>
            </div>

            ${quote.observaciones ? `
              <div class="quote-details">
                <h3>📝 Observaciones importantes:</h3>
                <p>${quote.observaciones}</p>
              </div>
            ` : ''}
            
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

      // ✅ PASO 5: Enviar email con PDF adjunto
      console.log('📧 Enviando email al cliente...');
      
      const mailOptions = {
        to: quote.email_cliente,
        subject: emailSubject,
        html: emailHTML,
        attachments: [
          {
            filename: pdfInfo.filename,
            path: pdfInfo.filepath,
            contentType: 'application/pdf'
          }
        ]
      };

      const emailResult = await sendEmail(mailOptions);
      console.log('✅ Email enviado exitosamente:', emailResult.messageId);

      // ✅ PASO 6: Actualizar fecha de envío del email
      await quote.update({
        sent_at: new Date()
      });

      // ✅ Obtener cotización actualizada con relaciones
      const updatedQuote = await Quote.findByPk(id, {
        include: [
          { model: User, as: 'Asesor', attributes: ['id', 'name', 'lastname', 'email'] },
          { model: User, as: 'Lider', attributes: ['id', 'name', 'lastname', 'email'] },
          { model: User, as: 'Gerente', attributes: ['id', 'name', 'lastname', 'email'] },
          { model: User, as: 'Admin', attributes: ['id', 'name', 'lastname', 'email'] }
        ]
      });

      // ✅ Respuesta exitosa
      res.json({
        success: true,
        message: "Cotización enviada exitosamente al cliente",
        quote: updatedQuote,
        email_info: {
          email_sent_to: quote.email_cliente,
          pdf_generated: true,
          pdf_filename: pdfInfo.filename,
          sent_at: sentAt.toISOString(),
          expires_at: expiresAt.toISOString()
        }
      });

    } catch (error) {
      console.error('❌ Error enviando cotización al cliente:', error);
      
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al enviar la cotización',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
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
          message: 'Cotización no encontrada' 
        });
      }

      if (!quote.pdf_path || !quote.pdf_filename) {
        return res.status(404).json({
          success: false,
          message: 'PDF no disponible para esta cotización'
        });
      }

      // Verificar que el archivo existe
      const fs = require('fs');
      if (!fs.existsSync(quote.pdf_path)) {
        return res.status(404).json({
          success: false,
          message: 'Archivo PDF no encontrado en el servidor'
        });
      }

      // Configurar headers para descarga
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${quote.pdf_filename}"`);
      
      // Enviar archivo
      res.sendFile(path.resolve(quote.pdf_path));
      
    } catch (error) {
      console.error('❌ Error descargando PDF:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // ✅ NUEVO MÉTODO: Regenerar PDF de cotización
  regenerateQuotePDF: async (req, res) => {
    try {
      const { id } = req.params;
      
      const quote = await Quote.findByPk(id, {
        include: [
          { model: User, as: 'Asesor', attributes: ['id', 'name', 'lastname', 'email'] },
          { model: User, as: 'Lider', attributes: ['id', 'name', 'lastname', 'email'] },
          { model: User, as: 'Gerente', attributes: ['id', 'name', 'lastname', 'email'] },
          { model: User, as: 'Admin', attributes: ['id', 'name', 'lastname', 'email'] }
        ]
      });
      
      if (!quote) {
        return res.status(404).json({ 
          success: false, 
          message: 'Cotización no encontrada' 
        });
      }

      if (!quote.precio_total) {
        return res.status(400).json({
          success: false,
          message: 'La cotización debe tener un precio total para generar el PDF'
        });
      }

      // Regenerar PDF
      const pdfInfo = await generateQuotePDF(quote);

      // Actualizar información del PDF en la base de datos
      await quote.update({
        pdf_path: pdfInfo.filepath,
        pdf_filename: pdfInfo.filename,
        pdf_generated_at: new Date()
      });

      res.json({
        success: true,
        message: 'PDF regenerado exitosamente',
        pdf_info: {
          filename: pdfInfo.filename,
          generated_at: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error('❌ Error regenerando PDF:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
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
        origen,
        acomodacion,
        tipo_hotel,
        ninos,
        edades_ninos,
      } = req.body;

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
        ninos,
        edades_ninos,
        observaciones: observaciones || quote.observaciones,
        status: status || quote.status,
      };

      if (status === "completed" && quote.status !== "completed") {
        updateData.completed_at = new Date();
      }

      await quote.update(updateData);

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

    const quote = await Quote.findByPk(id);

    if (!quote) {
      return res.status(404).json({ message: "Cotización no encontrada" });
    }

    if (quote.status !== "completed" && quote.status !== "sent") {
      return res.status(400).json({
        message: "La cotización debe estar completada o enviada antes de ser aprobada",
        current_status: quote.status,
        required_status: "completed o sent"
      });
    }

    console.log('✅ Aprobando cotización:', {
      id: quote.id,
      current_status: quote.status,
      quote_number: quote.quote_number
    });

    // Crear usuario cliente automáticamente si corresponde
    let clientUser = null;
    if (quote.email_cliente) {
      try {
        clientUser = await createClientUser({
          nombre_cliente: quote.nombre_cliente,
          email_cliente: quote.email_cliente,
          telefono_cliente: quote.telefono_cliente
        });
        console.log('✅ Usuario cliente procesado:', clientUser.id);
      } catch (userError) {
        console.error('⚠️ Error creando usuario cliente, continuando con aprobación:', userError);
      }
    }

    await quote.update({
      status: "approved",
      approved_at: new Date(),
      ...(clientUser && { cliente_id: clientUser.id })
    });

    // Crear contrato automáticamente si no existe
    const existingContract = await Contract.findOne({ where: { quote_id: quote.id } });
    let newContract = null;
    if (!existingContract) {
      // Generar número de contrato único
      const contractNumber = `CON-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      newContract = await Contract.create({
        contract_number: contractNumber,
        quote_id: quote.id,
        cliente_id: clientUser ? clientUser.id : quote.cliente_id,
        asesor_id: quote.asesor_id,
        lider_id: quote.lider_id,
        gerente_id: quote.gerente_id,
        precio_total: quote.precio_total,
        destino: quote.destino,
        origen: quote.origen,
        // Campos obligatorios típicos:
        forma_pago: 'contado', // o 'cuotas', según tu lógica
        fecha_inicio_viaje: quote.fecha_ida,
        fecha_fin_viaje: quote.fecha_regreso,
        saldo_pendiente: quote.precio_total || 0
      });
      console.log('✅ Contrato creado automáticamente al aprobar cotización:', newContract.id);
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
          required: false
        }
      ],
    });

    res.json({
      success: true,
      message: "Cotización aprobada exitosamente",
      quote: updatedQuote,
      contract: newContract,
      clientUser: clientUser ? {
        id: clientUser.id,
        email: clientUser.email,
        created: !clientUser.password_changed_at
      } : null
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

       if (quote.status !== "sent" && quote.status !== "expired" && quote.status !== "rejected") {
      return res.status(400).json({
        message: "Solo se pueden solicitar recotizaciones en cotizaciones enviadas o expiradas",
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
    
    console.log('🔍 Generando vista previa de PDF para cotización:', id);

    // ✅ CORREGIR: Buscar la cotización con todas las relaciones usando alias específicos
    const quote = await Quote.findByPk(id, {
      include: [
        { 
          model: User, 
          as: 'Asesor', 
          attributes: ['id', 'name', 'lastname', 'email'],
          required: false 
        },
        { 
          model: User, 
          as: 'Lider', 
          attributes: ['id', 'name', 'lastname', 'email'],
          required: false 
        },
        { 
          model: User, 
          as: 'Gerente', 
          attributes: ['id', 'name', 'lastname', 'email'],
          required: false 
        },
        { 
          model: User, 
          as: 'Admin', 
          attributes: ['id', 'name', 'lastname', 'email'],
          required: false 
        },
        { 
          model: User, 
          as: 'Owner', 
          attributes: ['id', 'name', 'lastname', 'email'],
          required: false 
        }
      ]
    });

    if (!quote) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cotización no encontrada' 
      });
    }

    // Validar que tenga precio para generar PDF
    if (!quote.precio_total || quote.precio_total <= 0) {
      return res.status(400).json({
        success: false,
        message: 'La cotización debe tener un precio total para generar el PDF'
      });
    }

    console.log('📄 Generando PDF para vista previa...');
    console.log('📋 Datos de la cotización:', {
      id: quote.id,
      quote_number: quote.quote_number,
      asesor: quote.Asesor?.name,
      lider: quote.Lider?.name,
      gerente: quote.Gerente?.name,
      admin: quote.Admin?.name,
      owner: quote.Owner?.name
    });
    
    // ✅ Generar PDF en memoria (sin guardar archivo)
    const pdfResult = await generateQuotePDF(quote, false);
    
    if (!pdfResult || !pdfResult.buffer) {
      throw new Error('Error generando buffer de PDF');
    }

    console.log('✅ PDF generado exitosamente para vista previa');

    // ✅ Configurar headers para PDF
    const filename = pdfResult.filename || `cotizacion-${quote.quote_number || quote.id}.pdf`;
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Content-Length': pdfResult.buffer.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    // ✅ Enviar el buffer directamente
    res.send(pdfResult.buffer);
    
  } catch (error) {
    console.error('❌ Error generando vista previa PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error generando vista previa del PDF: ' + error.message
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
    attributes: ['id']
  });
  return asesores.map(a => a.id);
};

const getUsersByGerente = async (gerenteId) => {
  const lideres = await User.findAll({
    where: { gerente_id: gerenteId, role: 3 },
    attributes: ['id']
  });
  return lideres.map(l => l.id);
};

const getAsesoresByGerente = async (gerenteId) => {
  const asesores = await User.findAll({
    where: { gerente_id: gerenteId, role: 2 },
    attributes: ['id']
  });
  return asesores.map(a => a.id);
};

const getRoleName = (role) => {
  const roleNames = {
    2: 'Asesor',
    3: 'Líder',
    4: 'Gerente',
    5: 'Admin',
    6: 'Contador',
    7: 'Owner'
  };
  return roleNames[role] || 'Usuario';
};

module.exports = quoteController;



