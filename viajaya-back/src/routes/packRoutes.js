const {Router} = require("express")

const {getPacks, getPackById, postPack, putPack, deletePack, getChars} = require("../controllers/packController")

const packRoutes = Router()

packRoutes.get("/", async (req,res) => {
    // Traer todos los paquete
    try {
        const pack = await getPacks()
        res.status(200).json(pack)
    } catch (error) {
        res.status(404).json({message:error})
    }
})

packRoutes.get("/chars", async (req,res) => {
    // Traer todos los paquete
    try {
        const pack = await getChars()
        res.status(200).json(pack)
    } catch (error) {
        res.status(404).json({message:error})
    }
})

packRoutes.get("/:id", async (req,res) => {
    // Traer todos los paquete
    const {id} = req.params
    try {
        const pack = await getPackById(id)
        res.status(200).json(pack)
    } catch (error) {
        res.status(404).json({message:error})
    }
})

packRoutes.post("/", async (req,res) => {
    // Crear un paquete
    const p = req.body
    try {
        const pack = await postPack(p)
        res.status(200).json({message:pack})
    } catch (error) {
        res.status(404).json({message:error})
    }
})
packRoutes.put("/", async (req,res) => {
    // Editar un paquete
    const pack = req.body
    try {
        const packEdit = await putPack(pack)
        res.status(200).json({message:packEdit})
    } catch (error) {
        res.status(404).json({message:error})
    }
})
packRoutes.delete("/:id", async (req,res) => {
    // Borrar un paquete
    const {id} = req.params
    try {
        const pack = await deletePack(id)
        res.status(200).json({message:pack})
    } catch (error) {
        res.status(404).json({message:error})
    }
})

module.exports = packRoutes