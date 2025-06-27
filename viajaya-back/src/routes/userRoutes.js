const {Router} = require("express")
const {
    getUsers, 
    putUser, 
    postUser, 
    deleteUser, 
    authUser, 
    getUserById, 
    verifyToken, 
    recoveryPass,
    changePassword,
    resetPassword,
    unlockAccount
} = require("../controllers/userController")
const sendMail = require("../helpers/sendMailContact")
const Recovery = require("../helpers/Recovery")
const {
    authenticateToken,
    authorizeRoles,
    authorizeHierarchy
} = require("../middlewares/authMiddleware")

const userRoutes = Router()

// Rutas públicas (sin autenticación)
userRoutes.post("/register", async (req, res) => {
    try {
        const result = await postUser(req.body);
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ 
            success: false,
            message: error.message 
        });
    }
});

userRoutes.post("/login", async(req,res) => {
    try {
        const result = await authUser(req.body);
        
        if (result.message) {
            res.status(200).json({
                success: true,
                ...result
            });
        } else {
            res.status(401).json({
                success: false,
                message: result.error || "Credenciales inválidas"
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error interno del servidor"
        });
    }
});

userRoutes.post("/contact", async (req,res) => {
    try {
        sendMail(req.body);
        res.status(200).json({message:"Email enviado"});
    } catch (error) {
        res.status(500).json({message: "Error enviando email"});
    }
});

userRoutes.get("/recovery/:email", async (req,res) => {
    const {email} = req.params;
    try {
        const user = await recoveryPass(email);
        if (user) {
            Recovery(user);
            res.status(200).json({message: "Email de recuperación enviado"});
        } else {
            res.status(404).json({message: "Email no encontrado"});
        }
    } catch (error) {
        res.status(500).json({message: "Error en recuperación de contraseña"});
    }
});

// Rutas protegidas (requieren autenticación)
userRoutes.get("/verify/token", authenticateToken, async (req,res) => {
    try {
        res.status(200).json({
            valid: true,
            user: req.user
        });
    } catch (error) {
        res.status(401).json({
            valid: false,
            message: "Token inválido"
        });
    }
});

userRoutes.get("/profile", authenticateToken, async (req,res) => {
    try {
        res.status(200).json({
            success: true,
            user: req.user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error obteniendo perfil"
        });
    }
});

// Solo admins y superiores pueden ver todos los usuarios
userRoutes.get("/", authenticateToken, authorizeRoles(5, 6, 7), async (req,res) => {
    try {
        const users = await getUsers();
        res.status(200).json({
            success: true,
            users: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error obteniendo usuarios"
        });
    }
});

// Obtener usuario por ID (con verificación de jerarquía)
userRoutes.get("/:id", authenticateToken, authorizeHierarchy, async (req,res) => {
    const {id} = req.params;
    try {
        const user = await getUserById(id);
        if (user) {
            // Remover información sensible
            const {password, ...userInfo} = user.toJSON();
            res.status(200).json({
                success: true,
                user: userInfo
            });
        } else {
            res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error obteniendo usuario"
        });
    }
});

// Actualizar usuario (con verificación de jerarquía)
userRoutes.put("/update/:id", authenticateToken, authorizeHierarchy, async (req,res) => {
    try {
        const userData = {
            ...req.body,
            id: req.params.id
        };
        const result = await putUser(userData);
        res.status(200).json({
            success: true,
            message: result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Cambiar contraseña propia
userRoutes.put("/change-password", authenticateToken, async (req,res) => {
    const {currentPassword, newPassword} = req.body;
    try {
        const result = await changePassword(req.user.id, currentPassword, newPassword);
        res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Resetear contraseña (solo admins)
userRoutes.put("/reset-password/:userId", authenticateToken, authorizeRoles(5, 6, 7), async (req,res) => {
    const {userId} = req.params;
    const {newPassword} = req.body;
    try {
        const result = await resetPassword(userId, newPassword);
        res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Desbloquear cuenta (solo admins)
userRoutes.put("/unlock/:userId", authenticateToken, authorizeRoles(5, 6, 7), async (req,res) => {
    const {userId} = req.params;
    try {
        const result = await unlockAccount(userId);
        res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Eliminar usuario (solo admins y superiores)
userRoutes.delete("/:id", authenticateToken, authorizeRoles(5, 6, 7), async (req, res) => {
    const { id } = req.params;
    try {
        const result = await deleteUser(id);
        if (result) {
            res.status(200).json({
                success: true,
                message: "Usuario eliminado con éxito"
            });
        } else {
            res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al eliminar el usuario"
        });
    }
});



module.exports = userRoutes