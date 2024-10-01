// controllers/carouselController.js
const {Carousel} = require("../db");
// const axios = require('axios');
// const FormData = require('form-data');
// Crear una nueva imagen para el carrusel
// Crear una nueva imagen para el carrusel
const createCarouselImage = async (req, res) => {
    const { title, description, imageUrl, destino } = req.body;
  
    // Verificar si la URL de la imagen se ha recibido
    if (!imageUrl) {
      return res.status(400).json({ message: 'No se ha recibido ninguna imagen.' });
    }
  
    try {
      // Guardar la URL de Cloudinary en la base de datos
      const newImage = await Carousel.create({
        src: imageUrl,
        title,
        description,
        destino,
      });
  
      res.status(201).json(newImage);
    } catch (error) {
      console.error('Error al guardar la imagen en la base de datos:', error);
      res.status(500).json({ message: 'Error al guardar la imagen', error });
    }
  };
// Obtener todas las imágenes del carrusel
const getAllCarouselImages = async (req, res) => {
  try {
    const images = await Carousel.findAll();
    res.status(200).json(images);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las imágenes', error });
  }
};

// Eliminar una imagen del carrusel por ID
const deleteCarouselImage = async (req, res) => {
  const { id } = req.params;

  try {
    const image = await Carousel.findByPk(id);
    if (!image) {
      return res.status(404).json({ message: 'Imagen no encontrada' });
    }

    await image.destroy();
    res.status(200).json({ message: 'Imagen eliminada con éxito' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar la imagen', error });
  }
};

module.exports = {
  createCarouselImage,
  getAllCarouselImages,
  deleteCarouselImage,
};
