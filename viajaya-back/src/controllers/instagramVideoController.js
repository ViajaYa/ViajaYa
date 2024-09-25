const { InstagramVideo} = require('../db');

// Crear un nuevo video
module.exports = {
    createVideo: async (req, res) => {
  try {
    const { url } = req.body;
    const newVideo = await InstagramVideo.create({ url });
    res.status(201).json({ message: 'Video created successfully', data: newVideo });
  } catch (error) {
    res.status(500).json({ message: 'Error creating video', error });
  }
},

// Obtener todos los videos
getVideos: async (req, res) => {
  try {
    const videos = await InstagramVideo.findAll();
    res.status(200).json({ data: videos });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching videos', error });
  }
},

// Eliminar un video
deleteVideo: async (req, res) => {
  try {
    const { id } = req.params;
    await InstagramVideo.destroy({ where: { id } });
    res.status(200).json({ message: 'Video deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting video', error });
  }
}}
