const express = require('express');
const router = express.Router();
const { upload } = require('../config/multerConfig'); // Importar configuración de multer
const { getPacks, getChars, getPackById, putPack, postPack, deletePack } = require('../controllers/packController');

// Obtener todos los packs
router.get('/', async (req, res) => {
    try {
        const packs = await getPacks();
        res.json(packs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obtener todos los chars
router.get('/chars', async (req, res) => {
    try {
        const chars = await getChars();
        res.json(chars);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/yapaya', async (req, res) => {
    try {
        const yapayaPacks = await getYapayaPacks();
        res.json(yapayaPacks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obtener packs con isActive: true
router.get('/active', async (req, res) => {
    try {
        const activePacks = await getActivePacks();
        res.json(activePacks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obtener un pack por ID
router.get('/:id', async (req, res) => {
    try {
        const pack = await getPackById(req.params.id);
        res.json(pack);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
});

// Actualizar un pack
router.put('/:id', async (req, res) => {
    try {
        const updatedPack = await putPack(req.body);
        res.json(updatedPack);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Crear un pack con archivos
router.post('/', upload.array('images', 10), async (req, res) => {
    try {
        await postPack(req, res);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Eliminar un pack
router.delete('/:id', async (req, res) => {
    try {
        const message = await deletePack(req.params.id);
        res.json({ message });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
});

module.exports = router;