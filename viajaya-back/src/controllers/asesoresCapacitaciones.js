const { AsesoresCapacitacion } = require("../db");

// Crear un nuevo video
module.exports = {
  createCapacitacion: async (req, res) => {
    try {
      const { url } = req.body;
      const newCapacitacion = await AsesoresCapacitacion.create({ url });
      res.status(201)
        .json({
          message: "capacitacion created successfully",
          data: newCapacitacion,
        });
    } catch (error) {
      res.status(500).json({ message: "Error creating capacitacion", error });
    }
  },

  // Obtener todos los capacitacions
  getCapacitaciones: async (req, res) => {
    try {
      const capacitaciones = await AsesoresCapacitacion.findAll();
      res.status(200).json({ data: capacitaciones });
    } catch (error) {
      res.status(500).json({ message: "Error fetching capacitacions", error });
    }
  },

  // Eliminar un video
  deleteCapacitacion: async (req, res) => {
    try {
      const { id } = req.params;
      await AsesoresCapacitacion.destroy({ where: { id } });
      res.status(200).json({ message: "Capacitacion deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting Capacitacion", error });
    }
  },
};
