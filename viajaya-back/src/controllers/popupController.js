const { Popup } = require("../db");

module.exports = {
  // Obtener popup activo
  getPopup: async (req, res) => {
    try {
      const popup = await Popup.findOne({ where: { isActive: true } });
      res.json(popup);
    } catch (error) {
      res.status(500).json({ error: "Error fetching popup" });
    }
  },

  getAllPopups: async (req, res) => {
    try {
      const popups = await Popup.findAll(); 
      res.json(popups);
    } catch (error) {
      res.status(500).json({ error: "Error fetching all popups" });
    }
  },

  // Actualizar popup existente
  putPopup: async (req, res) => {
    try {
      const { id } = req.params;
      const { content, isActive, title, boton } = req.body;
      const popup = await Popup.findByPk(id);
      if (popup) {
        popup.content = content;
        popup.isActive = isActive;
        popup.title = title
        popup.boton = boton

        await popup.save();
        res.json(popup);
      } else {
        res.status(404).json({ error: "Popup not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Error updating popup" });
    }
  },

  // Crear o actualizar popup
  postPopup: async (req, res) => {
    try {
      const { content, isActive,  title, boton } = req.body;
      let popup = await Popup.findOne({ where: { isActive: true } });

      if (popup) {
        popup.content = content;
        popup.isActive = isActive;
        popup.title = title
        popup.boton = boton

        await popup.save();
      } else {
        popup = await Popup.create({ content, isActive,  });
      }

      res.json(popup);
    } catch (error) {
      res.status(500).json({ error: "Error creating/updating popup" });
    }
  },
};
