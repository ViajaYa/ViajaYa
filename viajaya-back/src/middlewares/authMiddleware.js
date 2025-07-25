const jwt = require('jsonwebtoken');
const { User } = require('../db');
require('dotenv').config();

// ✅ Middleware para autenticar token JWT
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        let token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        
        // ✅ Si no hay token en header, buscar en query params (para vistas previas)
        if (!token && req.query.token) {
            token = req.query.token;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token de acceso requerido'
            });
        }

        // Verificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key_change_in_production');

        // Buscar el usuario actualizado en la base de datos
        const user = await User.findOne({
            where: { 
                id: decoded.id, 
                is_active: true 
            },
            attributes: [
                'id', 'name', 'lastname', 'email', 'role', 'phone', 'image',
                'lider_id', 'gerente_id', 'is_active_seller', 'is_active',
                'commission_limit', 'current_commission_used',
                'referral_code', 'points', 'last_login'
            ]
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado o inactivo'
            });
        }

        // Agregar usuario a la request
        req.user = user;
        next();

    } catch (error) {
        console.error('Error en autenticación:', error);
        return res.status(403).json({
            success: false,
            message: 'Token inválido o expirado'
        });
    }
};

// ✅ Middleware para autorizar por roles específicos
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const userRole = req.user.role;

            if (!allowedRoles.includes(userRole)) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos suficientes para esta acción',
                    required_roles: allowedRoles,
                    your_role: userRole
                });
            }

            next();
        } catch (error) {
            console.error('Error en autorización por roles:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno en verificación de permisos'
            });
        }
    };
};

// ✅ Middleware ACTUALIZADO para autorizar jerarquía organizacional
const authorizeHierarchy = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }

        const currentUser = req.user;
        const targetUserId = parseInt(req.params.id || req.params.userId || req.params.managerId);
        const currentUserId = currentUser.id;
        const currentUserRole = currentUser.role;

        // ✅ CASOS DONDE SE PERMITE EL ACCESO:

        // 1. Acceso a su propio perfil/datos
        if (currentUserId === targetUserId) {
            return next();
        }

        // 2. Roles administrativos (Admin, Super Admin, Owner) - acceso total
        if (currentUserRole >= 5) {
            return next();
        }

        // 3. Verificación por jerarquía organizacional
        const targetUser = await User.findByPk(targetUserId, {
            attributes: ['id', 'role', 'lider_id', 'gerente_id', 'name', 'lastname']
        });

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'Usuario objetivo no encontrado'
            });
        }

        const targetUserRole = targetUser.role;
        let hasHierarchicalAccess = false;

        // ✅ VERIFICACIÓN JERÁRQUICA SEGÚN ROLES:

        switch (currentUserRole) {
            case 4: // Gerente
                // Puede acceder a sus líderes directos y asesores de esos líderes
                if (targetUserRole === 3 && targetUser.gerente_id === currentUserId) {
                    hasHierarchicalAccess = true; // Líder directo
                } else if (targetUserRole === 2) {
                    // Verificar si el asesor pertenece a un líder de este gerente
                    const asesorLider = await User.findByPk(targetUser.lider_id);
                    if (asesorLider && asesorLider.gerente_id === currentUserId) {
                        hasHierarchicalAccess = true; // Asesor indirecto
                    }
                }
                break;

            case 3: // Líder
                // Puede acceder solo a sus asesores directos
                if (targetUserRole === 2 && targetUser.lider_id === currentUserId) {
                    hasHierarchicalAccess = true; // Asesor directo
                }
                break;

            case 2: // Asesor
                // Los asesores solo pueden acceder a su propio perfil (ya verificado arriba)
                hasHierarchicalAccess = false;
                break;

            default:
                // Otros roles sin permisos jerárquicos específicos
                hasHierarchicalAccess = false;
                break;
        }

        if (!hasHierarchicalAccess) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para acceder a este usuario',
                details: {
                    your_role: currentUserRole,
                    target_role: targetUserRole,
                    access_type: 'hierarchical_restriction'
                }
            });
        }

        // ✅ Agregar información del usuario objetivo a la request
        req.targetUser = targetUser;
        next();

    } catch (error) {
        console.error('Error en autorización jerárquica:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno en verificación de jerarquía'
        });
    }
};

// ✅ NUEVO Middleware específico para endpoints organizacionales
const authorizeOrganizationalAccess = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }

        const currentUser = req.user;
        const targetUserId = parseInt(req.params.userId || req.params.managerId);
        const currentUserId = currentUser.id;
        const currentUserRole = currentUser.role;

        // ✅ Roles administrativos tienen acceso total
        if (currentUserRole >= 5) {
            return next();
        }

        // ✅ Acceso a su propia organización
        if (currentUserId === targetUserId) {
            return next();
        }

        // ✅ Verificación jerárquica para ver equipos subordinados
        const targetUser = await User.findByPk(targetUserId, {
            attributes: ['id', 'role', 'lider_id', 'gerente_id', 'name', 'lastname']
        });

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'Usuario objetivo no encontrado'
            });
        }

        let canAccess = false;

        // ✅ Lógica específica para acceso organizacional
        switch (currentUserRole) {
            case 4: // Gerente
                // Puede ver la organización de sus líderes directos
                if (targetUser.role === 3 && targetUser.gerente_id === currentUserId) {
                    canAccess = true;
                }
                break;

            case 3: // Líder
                // Solo puede ver su propia organización (ya verificado arriba)
                canAccess = false;
                break;

            default:
                canAccess = false;
                break;
        }

        if (!canAccess) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para ver la estructura organizacional de este usuario',
                details: {
                    your_role: currentUserRole,
                    target_user_role: targetUser.role,
                    required_permission: 'organizational_access'
                }
            });
        }

        req.targetUser = targetUser;
        next();

    } catch (error) {
        console.error('Error en autorización organizacional:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno en verificación organizacional'
        });
    }
};

// ✅ NUEVO Middleware para validar permisos de métricas
const authorizeMetricsAccess = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }

        const currentUser = req.user;
        const managerId = parseInt(req.params.managerId);
        const currentUserId = currentUser.id;
        const currentUserRole = currentUser.role;

        // ✅ Solo Gerentes y superiores pueden ver métricas
        if (currentUserRole < 4) {
            return res.status(403).json({
                success: false,
                message: 'Solo Gerentes y superiores pueden acceder a métricas de equipos',
                required_minimum_role: 4,
                your_role: currentUserRole
            });
        }

        // ✅ Roles administrativos tienen acceso total
        if (currentUserRole >= 5) {
            return next();
        }

        // ✅ Los gerentes solo pueden ver sus propias métricas
        if (currentUserRole === 4 && currentUserId !== managerId) {
            return res.status(403).json({
                success: false,
                message: 'Solo puedes ver las métricas de tu propio equipo'
            });
        }

        next();

    } catch (error) {
        console.error('Error en autorización de métricas:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno en verificación de métricas'
        });
    }
};

// ✅ Middleware para logging de acciones (opcional)
const logAction = (action) => {
    return (req, res, next) => {
        const user = req.user;
        const timestamp = new Date().toISOString();
        
        console.log(`[${timestamp}] ${action} - Usuario: ${user?.id || 'Unknown'} (${user?.email || 'Unknown'}) - Rol: ${user?.role || 'Unknown'}`);
        
        next();
    };
};

module.exports = {
    authenticateToken,
    authorizeRoles,
    authorizeHierarchy,
    authorizeOrganizationalAccess,
    authorizeMetricsAccess,
    logAction
};