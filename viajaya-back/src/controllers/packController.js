const { Pack, Char } = require("../db");


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

    // Actualizar un pack
    putPack: async (p) => {
        try {
            const pack = await Pack.findOne({
                where: { id: p.id }
            });

            if (!pack) {
                throw new Error('Pack not found');
            }

            // Actualizar campos
            if (p.status !== undefined) pack.status = !pack.status;
            if (p.title) pack.title = p.title;
            if (p.detail) pack.detail = p.detail;
            if (p.price) pack.price = p.price;
            if (p.days) pack.days = p.days;
            if (p.location) pack.location = p.location;
            if (p.city) pack.city = p.city;
            if (p.lat) pack.lat = p.lat;
            if (p.lng) pack.lng = p.lng;
            if (p.images) pack.images = p.images;

            await pack.save();
            return pack;
        } catch (error) {
            console.error('Error updating pack:', error);
            throw new Error('Error updating pack');
        }
    },

    // Crear un nuevo pack
    postPack: async (pack) => {
        try {
            const newPack = await Pack.create(pack);
            if (pack.chars) {
                await newPack.addChars(pack.chars);
            }
            return "Pack created successfully";
        } catch (error) {
            console.error('Error creating pack:', error);
            throw new Error('Error creating pack');
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
