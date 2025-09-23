const {User, SupportDocument, UserDocument} = require("../db")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const { Op } = require("sequelize")
require('dotenv').config()
const { sendEmail } = require("../utils/emailService");
const { v4: uuidv4 } = require('uuid');

const crypto = require("crypto");

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
    
            // ✅ Actualizar campos para incluir jerarquía
           const fieldsToUpdate = [
                'name', 'lastname', 'email', 'phone', 'password', 'role', 'image', 'points', 
                'referredBy', 'lider_id', 'gerente_id', 'is_active_seller',
                'commission_limit', 'current_commission_used', 'banco', 'numero_cuenta', 'tipo_cuenta',
                'fecha_ingreso', 'documento_identidad', 'tipo_documento', 'fecha_nacimiento', 
                'direccion', 'ciudad', 'pais'
            ];
    
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
    
   // ✅ POSTUSER ACTUALIZADO con jerarquía automática
postUser: async (user) => {
    try {
        // Validaciones básicas
        if (!user.email || !user.password) {
            throw new Error("Email y contraseña son requeridos");
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(user.email)) {
            throw new Error("Formato de email inválido");
        }

        if (user.password.length < 6) {
            throw new Error("La contraseña debe tener al menos 6 caracteres");
        }

        // Verifica si el email ya existe
        const existingUser = await User.findOne({
            where: { email: user.email.toLowerCase() }
        });
        if (existingUser) {
            throw new Error("Email ya registrado");
        }

        // Encriptar contraseña
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(user.password, saltRounds);

        // Verificar código de referido
        if (user.referred_by) {
            const referringUser = await User.findOne({
                where: { referral_code: user.referred_by }
            });
            if (!referringUser) {
                throw new Error("Código de referido inválido");
            }
        }

        // ✅ Generar código de referido único por defecto
        let referralCode = user.referral_code;
        if (!referralCode) {
            // Generar un UUID único si no se proporciona
            let isUnique = false;
            let attempts = 0;
            const maxAttempts = 10; // Evitar bucles infinitos
            
            while (!isUnique && attempts < maxAttempts) {
                referralCode = uuidv4();
                const existingCodeUser = await User.findOne({
                    where: { referral_code: referralCode }
                });
                if (!existingCodeUser) {
                    isUnique = true;
                }
                attempts++;
            }
            
            if (!isUnique) {
                throw new Error("No se pudo generar un código de referido único");
            }
        } else {
            // Verificar que el referral_code proporcionado no esté en uso
            const existingCodeUser = await User.findOne({
                where: { referral_code: referralCode }
            });
            if (existingCodeUser) {
                throw new Error("Código de referido ya está en uso");
            }
        }

        // ✅ Asignar jerarquía automáticamente según el rol
        const userDataWithHierarchy = await assignHierarchy(user);
        
        // ✅ Preparar datos del usuario - SIN asignación automática de comisión
        const userData = {
            ...userDataWithHierarchy,
            email: user.email.toLowerCase(),
            password: hashedPassword,
            is_active: user.is_active !== undefined ? user.is_active : true,
            is_active_seller: user.is_active_seller || false,
            last_login: null,
            failed_login_attempts: 0,
            account_locked_until: null,
            points: 0,
            referral_code: referralCode, // ✅ Ahora siempre tendrá un valor único
            referred_by: user.referred_by || null,
            // ✅ REMOVIDO: commission_percentage - ahora se maneja globalmente
            commission_limit: user.commission_limit || 1400000.00,
            current_commission_used: 0.00,
            banco: user.banco || null,
            numero_cuenta: user.numero_cuenta || null,
            tipo_cuenta: user.tipo_cuenta || null,
            fecha_ingreso: user.fecha_ingreso || new Date(),
            documento_identidad: user.documento_identidad || null,
            tipo_documento: user.tipo_documento || null,
            fecha_nacimiento: user.fecha_nacimiento || null,
            direccion: user.direccion || null,
            ciudad: user.ciudad || null,
            pais: user.pais || 'Colombia'
        };

        // Crear el nuevo usuario
        const newUser = await User.create(userData);
        
        // Respuesta sin datos sensibles
        const userResponse = { ...newUser.toJSON() };
        delete userResponse.password;
        delete userResponse.failed_login_attempts;
        delete userResponse.account_locked_until;
        delete userResponse.password_reset_token;
        delete userResponse.email_verification_token;
        
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
                lider_id: user.lider_id,
                gerente_id: user.gerente_id,
                is_active: user.is_active,
                is_active_seller: user.is_active_seller,
                referral_code: user.referral_code,
                points: user.points || 0,
                last_login: user.last_login,
                // ✅ REMOVIDO: commission_percentage - ahora se maneja globalmente
                commission_limit: user.commission_limit,
                current_commission_used: user.current_commission_used,
                banco: user.banco,
                numero_cuenta: user.numero_cuenta,
                tipo_cuenta: user.tipo_cuenta
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
                    'image', 'lider_id', 'gerente_id', 'is_active_seller', 'is_active', // ✅ Actualizado
                    'last_login', 'referral_code', 'points',
                    'commission_limit', 'current_commission_used', 'banco', 'numero_cuenta'
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
                lider_id: user.lider_id,
                gerente_id: user.gerente_id,
                is_active: user.is_active,
                is_active_seller: user.is_active_seller,
                referral_code: user.referral_code,
                points: user.points || 0,
                last_login: user.last_login,
                // ✅ REMOVIDO: commission_percentage - ahora se maneja globalmente
                commission_limit: user.commission_limit,
                current_commission_used: user.current_commission_used
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

  // Agregar este método a tu userController existente
getUserByEmail: async (email) => {
    try {
        if (!email) {
            throw new Error("Email es requerido");
        }

        const user = await User.findOne({
            where: { 
                email: email.toLowerCase(),
                is_active: true // Solo usuarios activos
            },
            attributes: [
                'id', 'name', 'lastname', 'email', 'phone', 'role',
                'documento_identidad', 'tipo_documento', 'fecha_nacimiento',
                'direccion', 'ciudad', 'pais', 'is_active', 'is_active_seller'
            ]
        });

        if (!user) {
            return {
                success: false,
                message: 'Usuario no encontrado'
            };
        }

        return {
            success: true,
            data: {
                user,
                exists: true
            }
        };

    } catch (error) {
        return {
            success: false,
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
    },

    getOrganizationStructure: async (req, res) => {
        try {
            const { userId } = req.params;
            const { includeCommissions = 'false', period = 'current_month' } = req.query;
            
            const user = await User.findByPk(userId, {
                include: [
                    {
                        model: User,
                        as: 'AsesoresDirectos',
                        attributes: ['id', 'name', 'lastname', 'email', 'role', 'is_active_seller']
                    },
                    {
                        model: User,
                        as: 'LideresDirectos',
                        attributes: ['id', 'name', 'lastname', 'email', 'role', 'is_active_seller'],
                        include: [{
                            model: User,
                            as: 'AsesoresDirectos',
                            attributes: ['id', 'name', 'lastname', 'email', 'role', 'is_active_seller']
                        }]
                    },
                    {
                        model: User,
                        as: 'AsesoresIndirectos',
                        attributes: ['id', 'name', 'lastname', 'email', 'role', 'is_active_seller']
                    },
                    {
                        model: User,
                        as: 'LiderDirecto',
                        attributes: ['id', 'name', 'lastname', 'email', 'role']
                    },
                    {
                        model: User,
                        as: 'GerenteDirecto',
                        attributes: ['id', 'name', 'lastname', 'email', 'role']
                    }
                ]
            });

            if (!user) {
                return res.status(404).json({ message: "Usuario no encontrado" });
            }

            // ✅ Calcular comisiones si se solicitan usando SQL recursivo
            let commissionSummary = null;
            if (includeCommissions === 'true') {
                commissionSummary = await calculateCommissionSummary(userId, period);
            }

            const organizationData = {
                manager: {
                    id: user.id,
                    name: user.name,
                    lastname: user.lastname,
                    email: user.email,
                    role: user.role,
                    // ✅ REMOVIDO: commission_percentage - ahora se maneja globalmente
                    total_team_members: (user.LideresDirectos?.length || 0) + 
                                      (user.AsesoresDirectos?.length || 0) + 
                                      (user.AsesoresIndirectos?.length || 0)
                },
                hierarchy: {
                    lideres_directos: user.LideresDirectos?.map(lider => ({
                        ...lider.toJSON(),
                        total_asesores: lider.AsesoresDirectos?.length || 0
                    })) || [],
                    asesores_directos: user.AsesoresDirectos || [],
                    asesores_indirectos: user.AsesoresIndirectos || []
                },
                commission_summary: commissionSummary
            };

            res.json({
                success: true,
                data: organizationData
            });

        } catch (error) {
            console.error("Error obteniendo estructura organizacional:", error);
            res.status(500).json({
                success: false,
                message: "Error al obtener la estructura organizacional",
                error: error.message
            });
        }
    },

    // ✅ NUEVO - Dashboard con métricas usando SQL recursivo
    getTeamMetrics: async (req, res) => {
        try {
            const { managerId } = req.params;
            const { period = 'current_month' } = req.query;

            const dateFilter = getDateFilterForPeriod(period);

            // ✅ SQL RECURSIVO para obtener métricas del equipo (simplificado)
            const teamMetrics = await sequelize.query(`
                WITH RECURSIVE team_hierarchy AS (
                    -- Usuario base (manager)
                    SELECT id, name, role, lider_id, gerente_id, 0 as level
                    FROM users 
                    WHERE id = :managerId
                    
                    UNION ALL
                    
                    -- Miembros del equipo recursivamente
                    SELECT u.id, u.name, u.role, u.lider_id, u.gerente_id, th.level + 1
                    FROM users u
                    INNER JOIN team_hierarchy th ON (
                        u.lider_id = th.id OR u.gerente_id = th.id
                    )
                    WHERE th.level < 5
                )
                SELECT 
                    COUNT(DISTINCT th.id) - 1 as total_team_members,
                    COUNT(DISTINCT CASE WHEN th.role = 2 THEN th.id END) as total_asesores,
                    COUNT(DISTINCT CASE WHEN th.role = 3 THEN th.id END) as total_lideres,
                    COUNT(DISTINCT CASE WHEN th.role = 4 THEN th.id END) as total_gerentes,
                    COUNT(DISTINCT CASE WHEN u.is_active_seller = true THEN th.id END) as active_members,
                    -- ✅ REMOVIDO: avg_commission_percentage - ahora se maneja globalmente
                    0 as total_sales,
                    0 as total_commissions,
                    0 as total_orders
                FROM team_hierarchy th
                LEFT JOIN users u ON u.id = th.id
                WHERE th.level > 0
            `, {
                replacements: {
                    managerId
                },
                type: sequelize.QueryTypes.SELECT
            });

            res.json({
                success: true,
                data: {
                    metrics: teamMetrics[0] || {},
                    period: period,
                    date_range: {
                        start: dateFilter.start,
                        end: dateFilter.end
                    },
                    generated_at: new Date()
                }
            });

        } catch (error) {
            console.error("Error obteniendo métricas del equipo:", error);
            res.status(500).json({
                success: false,
                message: "Error al obtener métricas",
                error: error.message
            });
        }
    },

    // ✅ Nuevo método para obtener datos bancarios del usuario autenticado
    getBankingData: async (req, res) => {
        try {
            const userId = req.user.id; // Viene del token JWT

            const user = await User.findByPk(userId, {
                attributes: [
                    'id', 'name', 'lastname', 'email', 'phone', 
                    'documento_identidad', 'tipo_documento',
                    'banco', 'numero_cuenta', 'tipo_cuenta', 
                    'nombre_titular', 'documento_titular'
                ]
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            // Mapear los datos existentes a los campos del formulario
            const bankingData = {
                banco: user.banco || '',
                numero_cuenta: user.numero_cuenta || '',
                tipo_cuenta: user.tipo_cuenta || 'ahorros',
                nombre_titular: user.nombre_titular || `${user.name || ''} ${user.lastname || ''}`.trim(),
                documento_titular: user.documento_titular || user.documento_identidad || '',
                telefono: user.phone || '',
                observaciones: ''
            };

            return res.json({
                success: true,
                data: bankingData
            });

        } catch (error) {
            console.error('Error obteniendo datos bancarios:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    },

    // ✅ Nuevo método para actualizar datos bancarios del usuario
    updateBankingData: async (req, res) => {
    try {
        const userId = req.user.id;
        const { banco, numero_cuenta, tipo_cuenta, nombre_titular, documento_titular, telefono } = req.body;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Buscar la firma digital aprobada
        const firmaDigital = await UserDocument.findOne({
            where: {
                user_id: userId,
                document_name: 'Firma Digital',
                status: 'approved'
            }
        });

        // Actualizar los datos bancarios
        await User.update({
            banco,
            numero_cuenta,
            tipo_cuenta,
            nombre_titular,
            documento_titular,
            phone: telefono || user.phone // Solo actualizar teléfono si se proporciona
        }, {
            where: { id: userId }
        });

        // Responder incluyendo la URL de la firma si existe
        return res.json({
            success: true,
            message: 'Datos bancarios actualizados correctamente',
            firma_digital_url: firmaDigital ? firmaDigital.file_url : null
        });

    } catch (error) {
        console.error('Error actualizando datos bancarios:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
},
    // ✅ VERIFICAR si un email ya existe en el sistema
    checkEmailExists: async (req, res) => {
        try {
            const { email } = req.params;
            
            console.log('🔍 Buscando email en BD:', email);
            
            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email es requerido'
                });
            }

            const user = await User.findOne({
                where: { email: email.toLowerCase() },
                attributes: ['id', 'name', 'lastname', 'email', 'phone', 'documento_identidad', 'fecha_nacimiento']
            });

            console.log('🔍 Usuario encontrado en BD:', user ? 'SÍ' : 'NO');
            if (user) {
                console.log('👤 Datos del usuario:', { id: user.id, email: user.email, name: user.name });
            }

            if (user) {
                return res.json({
                    success: true,
                    exists: true,
                    user: {
                        id: user.id,
                        name: user.name,
                        lastname: user.lastname,
                        email: user.email,
                        phone: user.phone,
                        documento_identidad: user.documento_identidad,
                        fecha_nacimiento: user.fecha_nacimiento
                    }
                });
            } else {
                return res.json({
                    success: true,
                    exists: false,
                    user: null
                });
            }

        } catch (error) {
            console.error('Error verificando email:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    },
    resendActivationLink: async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ where: { email: email.toLowerCase() } });
        if (!user) {
            return res.status(404).json({ success: false, message: "Usuario no encontrado" });
        }
        // Generar nuevo token y expiración
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 horas

        user.password_reset_token = resetToken;
        user.password_reset_expires = resetExpires;
        await user.save();

        // Enviar email
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        await sendEmail({
            to: user.email,
            subject: "Activa tu cuenta en ViajaYa",
            html: `
                <p>¡Bienvenido/a a ViajaYa!</p>
                <p>Para activar tu cuenta y definir tu contraseña, haz clic en el siguiente enlace:</p>
                <a href="${resetLink}">Establecer contraseña</a>
                <p>Este enlace es válido por 24 horas.</p>
            `
        });

        res.json({ success: true, message: "Enlace de activación reenviado correctamente" });
    } catch (error) {
        console.error("Error al reenviar link de activación:", error);
        res.status(500).json({ success: false, message: "Error al reenviar el enlace" });
    }
},
};

// ✅ FUNCIONES AUXILIARES

// Asignar jerarquía automáticamente (SIN comisión automática)
const assignHierarchy = async (userData) => {
    const { role, lider_id, gerente_id } = userData;
    
    switch (role) {
        case 2: // Asesor
            if (!lider_id) {
                throw new Error('Un Asesor debe tener un Líder asignado');
            }
            
            const lider = await User.findOne({
                where: { id: lider_id, role: 3 }
            });
            if (!lider) {
                throw new Error('Líder no encontrado o rol inválido');
            }
            
            userData.gerente_id = lider.gerente_id;
            break;
            
        case 3: // Líder
            if (!gerente_id) {
                throw new Error('Un Líder debe tener un Gerente asignado');
            }
            
            const gerente = await User.findOne({
                where: { id: gerente_id, role: 4 }
            });
            if (!gerente) {
                throw new Error('Gerente no encontrado o rol inválido');
            }
            
            userData.lider_id = null;
            break;
            
        case 4: // Gerente
        case 7: // Owner
            userData.lider_id = null;
            userData.gerente_id = null;
            break;
            
        default:
            userData.lider_id = null;
            userData.gerente_id = null;
            break;
    }
    
    return userData;
};

// Obtener filtro de fechas según período
const getDateFilterForPeriod = (period) => {
    const now = new Date();
    
    switch (period) {
        case 'current_month':
            return {
                start: new Date(now.getFullYear(), now.getMonth(), 1),
                end: new Date(now.getFullYear(), now.getMonth() + 1, 1)
            };
        case 'last_month':
            return {
                start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
                end: new Date(now.getFullYear(), now.getMonth(), 1)
            };
        case 'current_year':
            return {
                start: new Date(now.getFullYear(), 0, 1),
                end: new Date(now.getFullYear() + 1, 0, 1)
            };
        default:
            return {
                start: new Date(now.getFullYear(), now.getMonth(), 1),
                end: new Date(now.getFullYear(), now.getMonth() + 1, 1)
            };
    }
};

// Calcular resumen de comisiones usando SQL recursivo
const calculateCommissionSummary = async (userId, period) => {
    try {
        const dateFilter = getDateFilterForPeriod(period);

        const commissionData = await sequelize.query(`
            WITH RECURSIVE team_hierarchy AS (
                SELECT id, role, name, lastname, 0 as level
                FROM users WHERE id = :userId
                UNION ALL
                SELECT u.id, u.role, u.name, u.lastname, th.level + 1
                FROM users u
                INNER JOIN team_hierarchy th ON (u.lider_id = th.id OR u.gerente_id = th.id)
                WHERE th.level < 5
            )
            SELECT 
                th.role,
                th.name,
                th.lastname,
                -- ✅ REMOVIDO: commission_percentage - ahora se maneja globalmente
                COUNT(c.id) as total_commissions,
                COALESCE(SUM(c.monto_comision), 0) as total_amount,
                COALESCE(SUM(CASE WHEN c.status = 'paid' THEN c.monto_comision ELSE 0 END), 0) as paid_amount,
                COALESCE(SUM(CASE WHEN c.status = 'pending' THEN c.monto_comision ELSE 0 END), 0) as pending_amount
            FROM team_hierarchy th
            LEFT JOIN commissions c ON c.vendedor_id = th.id 
                AND c.created_at >= :startDate 
                AND c.created_at < :endDate
            WHERE th.level > 0
            GROUP BY th.id, th.role, th.name, th.lastname, th.commission_percentage
            ORDER BY th.role DESC, total_amount DESC
        `, {
            replacements: {
                userId,
                startDate: dateFilter.start,
                endDate: dateFilter.end
            },
            type: sequelize.QueryTypes.SELECT
        });

        const totals = commissionData.reduce((acc, item) => ({
            total_commissions: acc.total_commissions + parseInt(item.total_commissions),
            total_amount: acc.total_amount + parseFloat(item.total_amount),
            paid_amount: acc.paid_amount + parseFloat(item.paid_amount),
            pending_amount: acc.pending_amount + parseFloat(item.pending_amount)
        }), {
            total_commissions: 0,
            total_amount: 0,
            paid_amount: 0,
            pending_amount: 0
        });

        return {
            period,
            totals,
            detail: commissionData,
            generated_at: new Date()
        };

    } catch (error) {
        console.error('Error calculando resumen de comisiones:', error);
        return null;
    }
};



