const {User} = require("../db")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const { Op } = require("sequelize")
require('dotenv').config()

module.exports = {
    getUsers: async () => {
        const users = await User.findAll()
        return users
    },
    putUser: async (u) => {
        try {
            const user = await User.findOne({
                where: { id: u.id }
            });
    
            if (!user) {
                throw new Error("Usuario no encontrado");
            }
    
            // Define los campos que pueden ser actualizados
            const fieldsToUpdate = [
                'name', 'lastname', 'email', 'phone', 'password', 'role', 'image', 'points', 'referredBy'
            ];
    
            // Actualiza solo los campos que están definidos en u
            fieldsToUpdate.forEach(field => {
                if (u[field] !== undefined) {
                    user[field] = u[field];
                }
            });
    
            await user.save();
            return "Usuario actualizado";
        } catch (error) {
            console.error('Error al actualizar el usuario:', error);
            return `Error: ${error.message}`;
        }
    },
    
   postUser: async (user) => {
        try {
            // Validaciones básicas
            if (!user.email || !user.password) {
                throw new Error("Email y contraseña son requeridos");
            }

            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(user.email)) {
                throw new Error("Formato de email inválido");
            }

            // Validar fortaleza de contraseña
            if (user.password.length < 6) {
                throw new Error("La contraseña debe tener al menos 6 caracteres");
            }

            // Verifica si el email ya existe
            const existingUser = await User.findOne({
                where: {
                    email: user.email.toLowerCase()
                }
            });
            if (existingUser) {
                throw new Error("Email ya registrado");
            }

            // Encriptar contraseña
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(user.password, saltRounds);

            // Verifica si hay un código de referido
            if (user.referral_code || user.referred_by) {
                const referralCode = user.referral_code || user.referred_by;
                const referringUser = await User.findOne({
                    where: {
                        referral_code: referralCode
                    }
                });
        
                if (referringUser) {
                    user.referred_by = referringUser.referral_code;
                } else {
                    throw new Error("Código de referido inválido");
                }
            }
        
            // ✅ Preparar datos del usuario con campos consistentes
            const userData = {
                ...user,
                email: user.email.toLowerCase(),
                password: hashedPassword,
                is_active: true,                    // ✅ Usuario activo por defecto
                is_active_seller: user.is_active_seller || false, // ✅ Vendedor solo si se especifica
                last_login: null,
                failed_login_attempts: 0,
                account_locked_until: null,
                points: 0,                          // ✅ Puntos iniciales
            };

            // Crea el nuevo usuario
            const newUser = await User.create(userData);
            
            // ✅ Respuesta normalizada sin contraseña
            const userResponse = { ...newUser.toJSON() };
            delete userResponse.password;
            delete userResponse.failed_login_attempts;
            delete userResponse.account_locked_until;
            
            return { 
                success: true,
                message: "Usuario creado con éxito", 
                user: userResponse 
            };

        } catch (error) {
            throw new Error(error.message);
        }
    },
    
   
    recoveryPass: async (email) => {
        const user = await User.findOne({
            where:{
                email:email
            }
        })
        return user
    },
    deleteUser:  async (id) => {
        try {
            const user = await User.findOne({
                where: {
                    id: id
                }
            });
    
            if (user) {
                await user.destroy();
                return "Usuario eliminado con éxito";
            } else {
                return null; // Cambié esto para que retorne null si el usuario no existe
            }
        } catch (error) {
            throw new Error("Error al eliminar el usuario");
        }
    },
authUser: async ({email, password}) => {
        try {
            // Validaciones básicas
            if (!email || !password) {
                throw new Error("Email y contraseña son requeridos");
            }

            // Buscar usuario por email
            const user = await User.findOne({
                where: {
                    email: email.toLowerCase()
                }
            });

            if (!user) {
                throw new Error("Credenciales inválidas");
            }

            // Verificar si la cuenta está bloqueada
            if (user.account_locked_until && new Date() < user.account_locked_until) {
                const lockTime = Math.ceil((user.account_locked_until - new Date()) / (1000 * 60));
                throw new Error(`Cuenta bloqueada. Intenta nuevamente en ${lockTime} minutos`);
            }

            // Verificar contraseña
            const isValidPassword = await bcrypt.compare(password, user.password);
            
            if (!isValidPassword) {
                // Incrementar intentos fallidos
                const failedAttempts = (user.failed_login_attempts || 0) + 1;
                let updateData = { failed_login_attempts: failedAttempts };

                // Bloquear cuenta después de 5 intentos fallidos
                if (failedAttempts >= 5) {
                    updateData.account_locked_until = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
                }

                await User.update(updateData, { where: { id: user.id } });
                
                throw new Error("Credenciales inválidas");
            }

            // ✅ CORREGIR: Verificar is_active (no is_active_seller)
            if (!user.is_active) {
                throw new Error("Cuenta desactivada. Contacta al administrador");
            }

            // ✅ OPCIONAL: También verificar is_active_seller si es necesario
            // if (!user.is_active_seller) {
            //     throw new Error("Usuario no habilitado como vendedor");
            // }

            // Login exitoso - resetear intentos fallidos y actualizar último login
            await User.update({
                failed_login_attempts: 0,
                account_locked_until: null,
                last_login: new Date()
            }, { 
                where: { id: user.id } 
            });

            // Generar token JWT
            const tokenPayload = {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
            };

            const token = jwt.sign(
                tokenPayload, 
                process.env.JWT_SECRET || 'fallback_secret_key_change_in_production',
                { algorithm: 'HS256' }
            );

            // ✅ MEJORAR: Preparar respuesta con campos normalizados
            const userResponse = {
                id: user.id,
                name: user.name,
                lastname: user.lastname,
                email: user.email,
                role: user.role,
                phone: user.phone,
                image: user.image,
                supervisor_id: user.supervisor_id,
                // ✅ Incluir ambos campos para compatibilidad
                is_active: user.is_active,           // Campo principal
                is_active_seller: user.is_active_seller, // Campo específico
                // ✅ Campos adicionales útiles
                referral_code: user.referral_code,
                points: user.points || 0,
                last_login: user.last_login,
            };

            return {
                success: true, // ✅ Consistente con la respuesta mostrada
                message: true,
                user: userResponse,
                token,
                expiresIn: '24h'
            };

        } catch (error) {
            return {
                success: false, // ✅ Consistente en errores
                message: false,
                error: error.message
            };
        }
    },
    getUserById: async (id) => {
        const user = await User.findOne({
            where:{
                id:id
            }
        })
        return user
    },
     verifyToken: async (token) => {
        try {
            if (!token) {
                throw new Error("Token no proporcionado");
            }

            // Verificar y decodificar el token
            const decoded = jwt.verify(
                token, 
                process.env.JWT_SECRET || 'fallback_secret_key_change_in_production'
            );

            // ✅ Verificar que el usuario todavía existe y está activo
            const user = await User.findOne({
                where: {
                    id: decoded.id,
                    is_active: true // ✅ Verificar el campo correcto
                },
                attributes: [
                    'id', 'name', 'lastname', 'email', 'role', 'phone', 
                    'image', 'supervisor_id', 'is_active_seller', 'is_active', // ✅ Incluir ambos
                    'last_login', 'referral_code', 'points'
                ]
            });

            if (!user) {
                throw new Error("Usuario no encontrado o inactivo");
            }

            // ✅ Respuesta normalizada
            const userResponse = {
                id: user.id,
                name: user.name,
                lastname: user.lastname,
                email: user.email,
                role: user.role,
                phone: user.phone,
                image: user.image,
                supervisor_id: user.supervisor_id,
                is_active: user.is_active,
                is_active_seller: user.is_active_seller,
                referral_code: user.referral_code,
                points: user.points || 0,
                last_login: user.last_login,
            };

            return {
                valid: true,
                user: userResponse,
                decoded: decoded
            };

        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    },

    // Nueva función para cambiar contraseña
    changePassword: async (userId, currentPassword, newPassword) => {
        try {
            // Validaciones básicas
            if (!currentPassword || !newPassword) {
                throw new Error("Contraseña actual y nueva contraseña son requeridas");
            }

            if (newPassword.length < 6) {
                throw new Error("La nueva contraseña debe tener al menos 6 caracteres");
            }

            // Buscar usuario
            const user = await User.findByPk(userId);
            if (!user) {
                throw new Error("Usuario no encontrado");
            }

            // Verificar contraseña actual
            const isValidCurrentPassword = await bcrypt.compare(currentPassword, user.password);
            if (!isValidCurrentPassword) {
                throw new Error("Contraseña actual incorrecta");
            }

            // Encriptar nueva contraseña
            const saltRounds = 12;
            const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

            // Actualizar contraseña
            await User.update(
                { password: hashedNewPassword },
                { where: { id: userId } }
            );

            return { message: "Contraseña actualizada exitosamente" };

        } catch (error) {
            throw new Error(error.message);
        }
    },

    // Nueva función para resetear contraseña (para admins)
    resetPassword: async (userId, newPassword) => {
        try {
            if (!newPassword || newPassword.length < 6) {
                throw new Error("La nueva contraseña debe tener al menos 6 caracteres");
            }

            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

            await User.update(
                { 
                    password: hashedPassword,
                    failed_login_attempts: 0,
                    account_locked_until: null
                },
                { where: { id: userId } }
            );

            return { message: "Contraseña reseteada exitosamente" };

        } catch (error) {
            throw new Error(error.message);
        }
    },

    // Función para desbloquear cuenta
    unlockAccount: async (userId) => {
        try {
            await User.update(
                { 
                    failed_login_attempts: 0,
                    account_locked_until: null
                },
                { where: { id: userId } }
            );

            return { message: "Cuenta desbloqueada exitosamente" };

        } catch (error) {
            throw new Error(error.message);
        }
    }
}