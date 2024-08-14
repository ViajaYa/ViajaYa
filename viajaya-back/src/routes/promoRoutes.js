const {Router} = require("express")
const {putPromo, getPromo, postPromo} = require("../controllers/promoController")

const promoRoutes = Router()

promoRoutes.get("/", async (req,res) => {
    // Traer la promo
        try {
            const promo = await getPromo()
            res.status(200).json(promo)
        } catch (error) {
            res.status(404).json({message:error})
        }
})
promoRoutes.put("/", async (req,res) => {
    // Editar la promo
    const promo = req.body
    try {
        const response = await putPromo(promo)
        res.status(200).json({message:response})
    } catch (error) {
        res.status(404).json({message:error})
    }
})

promoRoutes.post("/", async (req,res) => {
    // Editar la promo
    const promo = req.body
    try {
        const response = await postPromo(promo)
        res.status(200).json({message:response})
    } catch (error) {
        res.status(404).json({message:error})
    }
})

module.exports = promoRoutes