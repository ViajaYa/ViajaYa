const express = require('express');
const router = express.Router();
const {getVideos, createVideo, deleteVideo}= require('../controllers/instagramVideoController');
const instagramVideoController = require('../controllers/instagramVideoController');

// Rutas para los videos de Instagram
router.post('/videosI', instagramVideoController.createVideo);
router.get('/videosI', getVideos);
router.delete('/videosI/:id', deleteVideo);

module.exports = router;
