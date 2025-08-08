# Mejoras de Autenticación - Sistema ViajaYa

## ✅ Implementaciones Realizadas

### 1. **Seguridad de Contraseñas**
- ✅ Hashing con bcrypt (12 rounds)
- ✅ Validación de fortaleza de contraseña (mínimo 6 caracteres)
- ✅ Migración automática de contraseñas en texto plano

### 2. **Protección Contra Ataques**
- ✅ Límite de intentos de login (5 intentos)
- ✅ Bloqueo temporal de cuenta (30 minutos)
- ✅ Validación de formato de email
- ✅ JWT con expiración configurada (24 horas)

### 3. **Sistema de Roles y Jerarquía**
- ✅ 7 roles definidos: Cliente, Asesor, Líder, Gerente, Admin, Contador, Owner
- ✅ Middleware de autorización por roles
- ✅ Control de jerarquía (supervisores pueden acceder a datos de subordinados)
- ✅ Restricciones específicas por funcionalidad

### 4. **Nuevos Campos de Seguridad en User**
```javascript
is_active: Boolean - Estado activo del usuario
last_login: Date - Último login exitoso
failed_login_attempts: Integer - Intentos fallidos consecutivos
account_locked_until: Date - Fecha hasta la cual está bloqueada la cuenta
password_changed_at: Date - Última vez que cambió la contraseña
email_verified: Boolean - Si el email está verificado
email_verification_token: String - Token para verificación de email
password_reset_token: String - Token para reset de contraseña
password_reset_expires: Date - Expiración del token de reset
```

### 5. **Nuevas Rutas de Autenticación**
```
POST /api/users/register - Registro con validaciones
POST /api/users/login - Login mejorado con protecciones
GET /api/users/verify/token - Verificación de token JWT
GET /api/users/profile - Perfil del usuario autenticado
PUT /api/users/change-password - Cambio de contraseña propia
PUT /api/users/reset-password/:userId - Reset por admin
PUT /api/users/unlock/:userId - Desbloqueo por admin
```

### 6. **Middlewares de Seguridad**
- ✅ `authenticateToken` - Verificación de JWT
- ✅ `authorizeRoles(...roles)` - Autorización por roles
- ✅ `authorizeHierarchy` - Control de jerarquía de supervisión
- ✅ `canCreateQuotes` - Permisos para crear cotizaciones
- ✅ `canApproveSupportDocs` - Solo Owner puede aprobar documentos soporte

## 🔧 Configuración Requerida

### 1. **Variables de Entorno**
Crear archivo `.env` basado en `.env.example`:
```bash
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_2024
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCK_TIME=30
```

### 2. **Migración de Datos Existentes**
```bash
# Migrar contraseñas existentes y crear admin inicial
npm run migrate-auth

# Solo migrar contraseñas
npm run migrate-passwords

# Solo crear usuario admin
npm run create-admin
```

### 3. **Usuario Administrador Inicial**
El script crea un usuario Owner con:
- **Email:** admin@viajaya.com
- **Contraseña temporal:** Admin123!
- **⚠️ IMPORTANTE:** Cambiar inmediatamente después del primer login

## 🛡️ Jerarquía de Roles

### Roles Numéricos:
1. **Cliente** - Usuario final que compra paquetes
2. **Asesor** - Vendedor base, puede crear cotizaciones
3. **Líder** - Supervisa asesores, recibe comisiones
4. **Gerente** - Supervisa líderes, recibe comisiones de toda su red
5. **Admin** - Completa cotizaciones, maneja contratos
6. **Contador** - Maneja facturación y documentos soporte
7. **Owner** - Acceso completo, aprueba todo

### Permisos por Jerarquía:
- **Gerente** puede acceder a datos de sus Líderes y Asesores
- **Líder** puede acceder solo a datos de sus Asesores
- **Admin/Contador/Owner** tienen acceso completo según su rol

## 🔄 Próximos Pasos

### Para el Frontend:
1. Actualizar Redux store para manejar nuevos estados de auth
2. Implementar Redux Thunk para acciones asíncronas
3. Crear componentes de login/registro mejorados
4. Implementar manejo de tokens y refresh
5. Crear dashboards específicos por rol

### Funcionalidades Adicionales a Implementar:
1. Verificación de email
2. Reset de contraseña por email
3. Two-factor authentication (2FA)
4. Logs de auditoría de seguridad
5. Sesiones concurrentes controladas

## 🚨 Notas de Seguridad

1. **JWT Secret:** Usar una clave robusta en producción
2. **HTTPS:** Implementar SSL/TLS en producción
3. **Rate Limiting:** Considerar implementar rate limiting global
4. **Logs:** Implementar logging de eventos de seguridad
5. **Backups:** Asegurar backups regulares de la base de datos

## 📋 Testing

Para probar las nuevas funcionalidades:

```bash
# 1. Ejecutar migración
npm run migrate-auth

# 2. Iniciar servidor
npm run dev

# 3. Probar endpoints con Postman o similar:
POST /api/users/login
{
  "email": "admin@viajaya.com",
  "password": "Admin123!"
}
```

Las respuestas ahora incluyen mejor manejo de errores y información más estructurada.
