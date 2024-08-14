const {Router} = require("express")
const {postBuy, getBuy} = require("../controllers/buyController")
const sendMail = require("../helpers/sendMail")

const buyRoutes = Router()

buyRoutes.post("/", async (req,res) => {
    // Traer la promo
    const buy = req.body
        try {
            sendMail(buy)
            const buys = await postBuy(buy)
            res.status(200).json(buys)
        } catch (error) {
            res.status(404).json({message:error})
        }
})

buyRoutes.get("/:id", async (req,res) => {
    // Traer la promo
    const {id} = req.params
        try {
            const buys = await getBuy(id)
            res.status(200).json(buys)
        } catch (error) {
            res.status(404).json({message:error})
        }
})

module.exports = buyRoutes