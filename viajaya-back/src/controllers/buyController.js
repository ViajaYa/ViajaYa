const {Item,Pack,Char} = require("../db")

module.exports = {
    getBuy: async (id) => {
        const buys = await Item.findAll({
            where:{
                userId:id
            },
            include:{
                model: Pack,
                include: Char
            }
        })
        return buys
    },
    postBuy: async (p) => {
        await Item.create(p)
        return "Item creado"
    }
}