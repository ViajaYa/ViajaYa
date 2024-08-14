const {Router} = require("express")
const {getClass, postClass, putClass, deleteClass} = require("../controllers/classController")

const classRoutes = Router()

classRoutes.get("/", async (req,res) => {
    // Traer todos las clases
    try {
        const clase = await getClass()
        res.status(200).json(clase)
    } catch (error) {
        res.status(404).json({message:error})
    }
})
classRoutes.post("/", async (req,res) => {
    // Crear una clase
    const p = req.body
    try {
        const clase = await postClass(p)
        res.status(200).json({message:clase})
    } catch (error) {
        res.status(404).json({message:error})
    }
})
classRoutes.put("/", async (req,res) => {
    // Editar una clase
    const clase = req.body
    try {
        const claseEdit = await putClass(clase)
        res.status(200).json({message:claseEdit})
    } catch (error) {
        res.status(404).json({message:error})
    }
})
classRoutes.delete("/:id", async (req,res) => {
    // Borrar una clase
    const {id} = req.params
    try {
        const clase = await deleteClass(id)
        res.status(200).json({message:clase})
    } catch (error) {
        res.status(404).json({message:error})
    }
})

module.exports = classRoutes