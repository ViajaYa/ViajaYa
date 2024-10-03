const { Router } = require("express");
const {
  getAllNumbers,
  selectNumbers,
  getAvailableNumbers,
  getSelectedNumbers,
  updateNumberPaymentStatus,
  resetNumbers,
} = require("../controllers/numberControllers");

const router = Router();

router.get("/", async (req, res) => {
    try {
        const allNumbers = await getAllNumbers(); // Llama al controlador
        res.json(allNumbers); // Envía los números como respuesta
    } catch (error) {
        console.error('Error al obtener todos los números:', error);
        res.status(500).json({ error: error.message });
    }
});
router.post("/select", async (req, res) => {
    try {
        const data = req.body; // Asegúrate de pasar los datos correctamente
        const result = await selectNumbers(data);
        res.json(result); // Envía el resultado como respuesta
    } catch (error) {
        console.error('Error al seleccionar números:', error);
        res.status(500).json({ error: error.message });
    }
});
router.get('/available', async (req, res) => {
    try {
        const pagination = req.query; // Asegúrate de que la paginación se pasa correctamente
        const availableNumbers = await getAvailableNumbers(pagination);
        res.json(availableNumbers);
    } catch (error) {
        console.error('Error al obtener números disponibles:', error);
        res.status(500).json({ error: error.message });
    }
});
router.get("/selected", async (req, res) => {
    try {
        const selectedNumbers = await getSelectedNumbers();
        res.json(selectedNumbers);
    } catch (error) {
        console.error('Error al obtener números seleccionados:', error);
        res.status(500).json({ error: error.message });
    }
});
router.put("/:id/pay", async (req, res) => {
    try {
        const data = { id: req.params.id, ...req.body };
        const result = await updateNumberPaymentStatus(data);
        res.json(result);
    } catch (error) {
        console.error('Error al actualizar el estado de pago:', error);
        res.status(500).json({ error: error.message });
    }
});
router.post("/reset", resetNumbers);

module.exports = router;
