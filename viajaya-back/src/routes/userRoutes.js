const {Router} = require("express")
const {getUsers, putUser, postUser, deleteUser, authUser, getUserById, verifyToken, recoveryPass} = require("../controllers/userController")
const sendMail = require("../helpers/sendMailContact")
const Recovery = require("../helpers/Recovery")
const userRoutes = Router()

userRoutes.get("/", async (req,res) => {
    // Traer todos los usuarios
    try {
        const users = await getUsers()
        res.status(200).json(users)
    } catch (error) {
        res.status(404).json({message:error})
    }
})

userRoutes.post("/contact", async (req,res) => {
    // Traer todos los usuarios
    try {
        sendMail(req.body)
        res.status(200).json({message:"Email enviado"})
    } catch (error) {
        res.status(404).json({message:error})
    }
})

userRoutes.get("/verify/:token", async (req,res) => {
    // Traer todos los usuarios
    const {token} = req.params
    try {
        const users = await verifyToken(token)
        res.status(200).json(users)
    } catch (error) {
        res.status(404).json({message:error})
    }
})

userRoutes.get("/:id", async (req,res) => {
    // Traer todos los usuarios
    const {id} = req.params
    try {
        const users = await getUserById(id)
        res.status(200).json(users)
    } catch (error) {
        res.status(404).json({message:error})
    }
})

userRoutes.get("/recovery/:email", async (req,res) => {
    // Traer todos los usuarios
    const {email} = req.params
    try {
        const users = await recoveryPass(email)
        Recovery(users)
        res.status(200).json(users)
    } catch (error) {
        res.status(404).json({message:error})
    }
})

userRoutes.post("/", async (req,res) => {
    // Crear un usuarios
    const user = req.body
    try {
        const users = await postUser(user)
        res.status(200).json({message:users})
    } catch (error) {
        res.status(404).json({mensaje:error})
    }
})



userRoutes.put("/", async (req,res) => {
    // Editar un usuario
    const user = req.body
    try {
        const users = await putUser(user)
        res.status(200).json({message:users})
    } catch (error) {
        res.status(404).json({message:error})
    }
})

userRoutes.delete("/:id", async(req,res)=>{
    try {
        const user = await deleteUser(id)
        res.status(200).json({message:user})
    } catch (error) {
        res.status(404).json({message:error})
    }
})

userRoutes.post("/auth", async(req,res)=>{
    const user = req.body
    try {
        const auth = await authUser(user)
        res.status(200).json(auth)
    } catch (error) {
        res.status(404).json({message:error})
    }
})



module.exports = userRoutes