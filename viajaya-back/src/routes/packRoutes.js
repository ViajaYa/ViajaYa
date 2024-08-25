const express = require('express');
const router = express.Router();
const { getPacks, getChars, getPackById, putPack, postPack, deletePack } = require('../controllers/packController');

router.get('/', async (req, res) => {
    try {
        const packs = await getPacks();
        res.json(packs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/chars', async (req, res) => {
    try {
        const chars = await getChars();
        res.json(chars);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const pack = await getPackById(req.params.id);
        res.json(pack);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const updatedPack = await putPack(req.body);
        res.json(updatedPack);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const message = await postPack(req.body);
        res.json({ message });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const message = await deletePack(req.params.id);
        res.json({ message });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
});

module.exports = router;