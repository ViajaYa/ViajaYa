const { Quote, User, Contract } = require("../db");

const quoteController = {
  // Crear nueva cotización
 createQuote: async (req, res) => {
  try {
    const {
      asesor_id,
      lider_id,
      gerente_id,
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
    } = req.body;

    // Buscar cliente por email si no hay cliente_id
    let clienteIdFinal = cliente_id || null;
    if (email_cliente) {
      const existingUser = await User.findOne({ where: { email: email_cliente } });
      if (existingUser) {
        clienteIdFinal = existingUser.id;
      }
    }

    // Si no hay asesor_id, buscar el primer owner (role: 5)
    let asesorIdFinal = asesor_id || null;
    if (!asesorIdFinal) {
      const owner = await User.findOne({ where: { role: 7 }, order: [['id', 'ASC']] });
      if (owner) {
        asesorIdFinal = owner.id;
      } else {
        return res.status(400).json({ message: "No hay owner disponible para asignar la cotización." });
      }
    }

    // Generar número de cotización único
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");

    const lastQuote = await Quote.findOne({
      where: {
        quote_number: {
          [require("sequelize").Op.startsWith]: `COT-${year}${month}${day}-`,
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

    const newQuote = await Quote.create({
      quote_number,
      asesor_id: asesorIdFinal,
      lider_id,
      gerente_id,
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
      nombre_cliente: clienteIdFinal ? null : nombre_cliente,
      email_cliente: clienteIdFinal ? null : email_cliente,
      telefono_cliente: clienteIdFinal ? null : telefono_cliente,
      status: "pending",
    });

    // Incluir información de los usuarios relacionados
    const quoteWithUsers = await Quote.findByPk(newQuote.id, {
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
          as: "Cliente",
          attributes: ["id", "name", "lastname", "email", "phone"],
        },
      ],
    });

    res.status(201).json({
      message: "Cotización creada exitosamente",
      quote: quoteWithUsers,
    });
  } catch (error) {
    console.error("Error creating quote:", error);
    res.status(500).json({
      message: "Error al crear la cotización",
      error: error.message,
    });
  }
},

  // Obtener todas las cotizaciones
  getAllQuotes: async (req, res) => {
    try {
      const {
        status,
        asesor_id,
        lider_id,
        gerente_id,
        page = 1,
        limit = 10,
      } = req.query;

      const offset = (page - 1) * limit;
      const where = {};

      if (status) where.status = status;
      if (asesor_id) where.asesor_id = asesor_id;
      if (lider_id) where.lider_id = lider_id;
      if (gerente_id) where.gerente_id = gerente_id;

      const quotes = await Quote.findAndCountAll({
        where,
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
      console.error("Error fetching quotes:", error);
      res.status(500).json({
        message: "Error al obtener las cotizaciones",
        error: error.message,
      });
    }
  },

  // Obtener cotización por ID
  getQuoteById: async (req, res) => {
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
            as: "Cliente",
            attributes: ["id", "name", "lastname", "email", "phone"],
          },
          { model: Contract },
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

  // Actualizar cotización (completar por Admin)
  updateQuote: async (req, res) => {
    try {
      const { id } = req.params;
      const { precio_total, observaciones, status } = req.body;

      const quote = await Quote.findByPk(id);

      if (!quote) {
        return res.status(404).json({ message: "Cotización no encontrada" });
      }

      await quote.update({
        precio_total,
        observaciones: observaciones || quote.observaciones,
        status: status || quote.status,
        completed_at: status === "completed" ? new Date() : quote.completed_at,
      });

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

  // Aprobar cotización (por parte del cliente)
  approveQuote: async (req, res) => {
    try {
      const { id } = req.params;

      const quote = await Quote.findByPk(id);

      if (!quote) {
        return res.status(404).json({ message: "Cotización no encontrada" });
      }

      if (quote.status !== "completed") {
        return res.status(400).json({
          message: "La cotización debe estar completada antes de ser aprobada",
        });
      }

      await quote.update({
        status: "approved",
        approved_at: new Date(),
      });

      res.json({
        message: "Cotización aprobada exitosamente",
        quote,
      });
    } catch (error) {
      console.error("Error approving quote:", error);
      res.status(500).json({
        message: "Error al aprobar la cotización",
        error: error.message,
      });
    }
  },

  // Rechazar cotización
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
        observaciones: `${
          quote.observaciones || ""
        }\n\nMOTIVO DE RECHAZO: ${motivo_rechazo}`,
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

  // Obtener cotizaciones por vendedor
  getQuotesByVendedor: async (req, res) => {
    try {
      const { vendedor_id, tipo } = req.params; // tipo: 'asesor', 'lider', 'gerente'
      const { status, page = 1, limit = 10 } = req.query;

      const offset = (page - 1) * limit;
      const where = {};

      if (status) where.status = status;

      // Filtrar por tipo de vendedor
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
        default:
          return res.status(400).json({ message: "Tipo de vendedor inválido" });
      }

      const quotes = await Quote.findAndCountAll({
        where,
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

module.exports = quoteController;
