const jwt = require('jsonwebtoken');
const { User } = require('../db');

// Middleware para verificar token JWT
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ 
                message: 'Token de acceso requerido',
                error: 'NO_TOKEN'
            });
        }

        // Verificar token
        const decoded = jwt.verify(
            token, 
            process.env.JWT_SECRET || 'fallback_secret_key_change_in_production'
        );

        // Verificar que el usuario existe y está activo
        const user = await User.findOne({
            where: {
                id: decoded.id,
                is_active: true
            },
            attributes: [
                'id', 'name', 'lastname', 'email', 'role', 'phone', 
                'image', 'supervisor_id', 'is_active_seller'
            ]
        });

        if (!user) {
            return res.status(401).json({ 
                message: 'Usuario no encontrado o inactivo',
                error: 'USER_NOT_FOUND'
            });
        }

        // Adjuntar información del usuario a la request
        req.user = user;
        req.token = decoded;
        next();

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                message: 'Token expirado',
                error: 'TOKEN_EXPIRED'
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                message: 'Token inválido',
                error: 'INVALID_TOKEN'
            });
        }

        return res.status(500).json({ 
            message: 'Error interno del servidor',
            error: 'SERVER_ERROR'
        });
    }
};

// Middleware para verificar roles específicos
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                message: 'Usuario no autenticado',
                error: 'NOT_AUTHENTICATED'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: 'No tienes permisos para acceder a este recurso',
                error: 'INSUFFICIENT_PERMISSIONS',
                requiredRoles: allowedRoles,
                userRole: req.user.role
            });
        }

        next();
    };
};

// Middleware para verificar jerarquía (supervisor puede acceder a datos de sus subordinados)
const authorizeHierarchy = async (req, res, next) => {
    try {
        const targetUserId = req.params.userId || req.body.userId;
        const currentUser = req.user;

        // Si es el mismo usuario, permitir acceso
        if (currentUser.id == targetUserId) {
            return next();
        }

        // Si es Owner o Admin, permitir acceso total
        if (currentUser.role >= 5) { // Admin, Contador, Owner
            return next();
        }

        // Verificar si el usuario actual es supervisor del usuario objetivo
        const targetUser = await User.findByPk(targetUserId);
        
        if (!targetUser) {
            return res.status(404).json({ 
                message: 'Usuario objetivo no encontrado',
                error: 'TARGET_USER_NOT_FOUND'
            });
        }

        // Verificar jerarquía: Gerente > Líder > Asesor
        let hasAccess = false;

        if (currentUser.role === 4) { // Gerente
            // El gerente puede acceder a líderes y asesores bajo su supervisión
            if (targetUser.supervisor_id === currentUser.id) {
                hasAccess = true;
            } else {
                // Verificar si es asesor bajo un líder del gerente
                if (targetUser.role === 2) { // Asesor
                    const lider = await User.findOne({
                        where: {
                            id: targetUser.supervisor_id,
                            supervisor_id: currentUser.id,
                            role: 3
                        }
                    });
                    if (lider) hasAccess = true;
                }
            }
        } else if (currentUser.role === 3) { // Líder
            // El líder puede acceder solo a asesores bajo su supervisión directa
            if (targetUser.supervisor_id === currentUser.id && targetUser.role === 2) {
                hasAccess = true;
            }
        }

        if (!hasAccess) {
            return res.status(403).json({ 
                message: 'No tienes permisos para acceder a la información de este usuario',
                error: 'HIERARCHY_ACCESS_DENIED'
            });
        }

        next();

    } catch (error) {
        return res.status(500).json({ 
            message: 'Error verificando jerarquía',
            error: 'HIERARCHY_CHECK_ERROR'
        });
    }
};

// Middleware para verificar si puede crear cotizaciones
const canCreateQuotes = (req, res, next) => {
    const userRole = req.user.role;
    
    // Solo Asesores (2), Líderes (3), Gerentes (4) y superiores pueden crear cotizaciones
    if (userRole >= 2) {
        return next();
    }

    return res.status(403).json({ 
        message: 'No tienes permisos para crear cotizaciones',
        error: 'CANNOT_CREATE_QUOTES'
    });
};

// Middleware para verificar si puede aprobar documentos soporte
const canApproveSupportDocs = (req, res, next) => {
    const userRole = req.user.role;
    
    // Solo Owner (7) puede aprobar documentos soporte
    if (userRole === 7) {
        return next();
    }

    return res.status(403).json({ 
        message: 'Solo el Owner puede aprobar documentos soporte',
        error: 'CANNOT_APPROVE_SUPPORT_DOCS'
    });
};

module.exports = {
    authenticateToken,
    authorizeRoles,
    authorizeHierarchy,
    canCreateQuotes,
    canApproveSupportDocs
};
