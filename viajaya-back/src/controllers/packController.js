const { Pack, Char } = require("../db");
const cloudinary = require('../config/cloudinaryConfig');

module.exports = {
    // Obtener todos los packs
    getPacks: async () => {
        try {
            const packs = await Pack.findAll({
                include: {
                    model: Char,
                    attributes: ['name'],
                    through: { attributes: [] }
                }
            });
            return packs;
        } catch (error) {
            console.error('Error fetching packs:', error);
            throw new Error('Error fetching packs');
        }
    },

    // Obtener todos los chars
    getChars: async () => {
        try {
            const chars = await Char.findAll();
            return chars;
        } catch (error) {
            console.error('Error fetching chars:', error);
            throw new Error('Error fetching chars');
        }
    },

    // Obtener un pack por ID
    getPackById: async (id) => {
        try {
            const pack = await Pack.findOne({
                where: { id },
                include: {
                    model: Char,
                    attributes: ['name'],
                    through: { attributes: [] }
                }
            });

            if (!pack) {
                throw new Error('Pack not found');
            }

            return pack;
        } catch (error) {
            console.error(`Error fetching pack with ID ${id}:`, error);
            throw new Error(`Error fetching pack with ID ${id}`);
        }
    },

   
    putPack: async (p) => {
        try {
            const pack = await Pack.findOne({
                where: { id: p.id }
            });
    
            if (!pack) {
                throw new Error('Pack not found');
            }
    
            if (p.isActive !== undefined) pack.isActive = p.isActive;
            if (p.isYapaya !== undefined) pack.isYapaya = p.isYapaya;
            if (p.title) pack.title = p.title;
            if (p.detail) pack.detail = p.detail;
            if (p.price) pack.price = p.price;
            if (p.days) pack.days = p.days;
            if (p.location) pack.location = p.location;
            if (p.destino) pack.destino = p.destino;
            if (p.city) pack.city = p.city;
            if (p.lat) pack.lat = p.lat;
            if (p.lng) pack.lng = p.lng;
            if (p.images) pack.images = p.images;
            if (p.fechas) pack.fechas = p.fechas;
    
            await pack.save();
            return pack;
        } catch (error) {
            console.error('Error updating pack:', error);
            throw new Error('Error updating pack');
        }
    },

    
     postPack : async (req, res) => {
        try {
          console.log('Datos del cuerpo:', req.body);
          // Las URLs de las imágenes están en req.body.images
      
          // Si `fechas` es una cadena JSON, conviértela a un objeto
          const fechas = req.body.fechas ? JSON.parse(req.body.fechas) : [];
      
          // Crear el nuevo pack en la base de datos
          const newPack = await Pack.create({
            title: req.body.title,
            days: parseInt(req.body.days, 10),
            location: req.body.location,
            city: req.body.city,
            detail: req.body.detail,
            destino:req.body.destino,
            price: parseInt(req.body.price, 10),
            lat: req.body.lat,
            lng: req.body.lng,
            fechas: fechas,
            images: req.body.images // Usa las URLs proporcionadas
          });
      
          res.status(201).json({ message: 'Pack created successfully', newPack });
        } catch (error) {
          console.error('Error creando el pack:', error);
          res.status(500).json({ error: 'Error creating pack' });
        }
      },
      
      getYapayaPacks: async () => {
        try {
            const yapayaPacks = await Pack.findAll({
                where: { isYapaya: true },
                include: {
                    model: Char,
                    attributes: ['name'],
                    through: { attributes: [] }
                }
            });
            return yapayaPacks;
        } catch (error) {
            console.error('Error fetching Yapaya packs:', error);
            throw new Error('Error fetching Yapaya packs');
        }
    },

    getActivePacks: async () => {
        try {
            const activePacks = await Pack.findAll({
                where: { isActive: true },
                include: {
                    model: Char,
                    attributes: ['name'],
                    through: { attributes: [] }
                }
            });
            return activePacks;
        } catch (error) {
            console.error('Error fetching active packs:', error);
            throw new Error('Error fetching active packs');
        }
    },
    
    

    // Eliminar un pack
    deletePack: async (id) => {
        try {
            const pack = await Pack.findOne({
                where: { id }
            });

            if (!pack) {
                throw new Error('Pack not found');
            }

            await pack.destroy();
            return "Pack deleted successfully";
        } catch (error) {
            console.error(`Error deleting pack with ID ${id}:`, error);
            throw new Error(`Error deleting pack with ID ${id}`);
        }
    }
};

