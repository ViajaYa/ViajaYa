const express = require('express');
const router = express.Router();
const multer = require('multer');
const {createCarouselImage, getAllCarouselImages, deleteCarouselImage,}= require('../controllers/carouselController');

const upload = multer(); 
// Rutas para los videos de Instagram
router.post('/', createCarouselImage);
router.get('/', getAllCarouselImages);
router.delete('/:id', deleteCarouselImage);

module.exports = router;