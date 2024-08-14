const {Pack,Char} = require("../db")

module.exports = {
    getPacks: async () => {
        const packs = await Pack.findAll({
            include:{
            model: Char,
            attributes: ['name'],
            through: { attributes: [] }
        }})
        return packs
    },
    getChars: async () => {
        const chars = await Char.findAll()
        return chars
    },
    getPackById: async (id) => {
        const packs = await Pack.findOne({
            where:{
                id:id
            },
            include:{
                model: Char,
                attributes: ['name'],
                through: { attributes: [] }
            }
        })
        return packs
    },
    putPack: async (p) => {
        const pack = await Pack.findOne({
            where:{
                id:p.id
            }
        })
        if(pack){
            if(p.status) pack.status = !pack.status
            if(p.title) pack.title = p.title
            if(p.detail) pack.detail = p.detail
            if(p.price) pack.price = p.price
            if(p.days) pack.days = p.days
            if(p.location) pack.location = p.location
            if(p.city) pack.city = p.city
            if(p.lat) pack.lat = p.lat
            if(p.lng) pack.lng = p.lng
            if(p.images) pack.images = p.images
            await pack.save()
            return pack
        }else return "No lo encontramos"
    },
    postPack: async (pack) => {
        const newPack = await Pack.create(pack)
        await newPack.addChars(pack.chars)
        return "Paquete creado con exito"
    },
    deletePack: async (id) => {
        const pack = await Pack.findOne({
            where:{
                id:id
            }
        })
        if(pack){
            await pack.destroy()
            return "Paquete eliminado"
        }else return "No encontramos el usuario"
    }
}