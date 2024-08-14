const {Promo} = require("../db")

module.exports = {
    getPromo: async () => {
        const promo = await Promo.findOne({
            where:{
                id:1
            }
        })
        return promo
    },
    putPromo: async (p) => {
        const promo = await Promo.findOne({
            where:{
                id:1
            }
        })
        if(promo){
            if(p.title) promo.title = p.title
            if(p.image) promo.image = p.image
            if(p.details) promo.details = p.details
            if(p.price) promo.price = p.price
            if(p.fechas) promo.fechas = p.fechas
            if(p.days) promo.days = p.days
            await promo.save()
            return "Promo actualizada"
        }else return "No lo encontramos"
    },
    postPromo: async (p) => {
        await Promo.create(p)
        return "Promo creada"
    }
}