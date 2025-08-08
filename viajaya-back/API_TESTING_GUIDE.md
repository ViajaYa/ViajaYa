# ViajaYa API - Guía de Testing

## 🚀 Configuración Inicial

### 1. Importar Colección en Insomnia
1. Abrir Insomnia
2. Ir a `Application` > `Preferences` > `Data` > `Import Data`
3. Seleccionar el archivo `insomnia-collection.json`
4. La colección se importará con todas las rutas organizadas

### 2. Variables de Entorno
La colección incluye estas variables:
- `base_url`: http://localhost:3001
- `token`: Se actualizará automáticamente después del login

### 3. Iniciar el Servidor
```bash
cd viajaya-back
npm run dev
```

## 📋 Flujo de Testing Recomendado

### Paso 1: Ejecutar Migración de Autenticación
```bash
npm run migrate-auth
```
Esto creará el usuario administrador inicial:
- **Email:** admin@viajaya.com
- **Password:** Admin123!

### Paso 2: Hacer Login y Obtener Token
1. Usar el endpoint `🔐 Authentication > Login User`
2. Copiar el `token` de la respuesta
3. Actualizar la variable `token` en el entorno de Insomnia

### Paso 3: Verificar Autenticación
Usar `🔐 Authentication > Verify Token` para confirmar que el token funciona

## 🔗 Documentación de Endpoints

### 🔐 Authentication

#### POST /api/user/register
Registra un nuevo usuario
```json
{
  "name": "Juan",
  "lastname": "Pérez", 
  "email": "juan.perez@example.com",
  "password": "123456",
  "phone": "3001234567",
  "role": 2,
  "documento_identidad": "12345678",
  "tipo_documento": "cedula",
  "ciudad": "Bogotá"
}
```

#### POST /api/user/login
Autentica un usuario
```json
{
  "email": "admin@viajaya.com",
  "password": "Admin123!"
}
```

#### GET /api/user/verify/token
Verifica si el token JWT es válido
- **Headers:** `Authorization: Bearer {token}`

#### GET /api/user/profile
Obtiene el perfil del usuario autenticado
- **Headers:** `Authorization: Bearer {token}`

#### PUT /api/user/change-password
Cambia la contraseña del usuario actual
```json
{
  "currentPassword": "Admin123!",
  "newPassword": "NewPassword123!"
}
```

### 👥 Users Management

#### GET /api/user
Obtiene todos los usuarios (Solo Admin+)
- **Headers:** `Authorization: Bearer {token}`
- **Roles requeridos:** 5, 6, 7 (Admin, Contador, Owner)

#### GET /api/user/:id
Obtiene usuario por ID (con verificación de jerarquía)
- **Headers:** `Authorization: Bearer {token}`

#### PUT /api/user/update/:id
Actualiza un usuario (con verificación de jerarquía)
- **Headers:** `Authorization: Bearer {token}`

### 📋 Quotes

#### POST /api/quotes
Crea una nueva cotización
- **Headers:** `Authorization: Bearer {token}`
- **Roles requeridos:** 2+ (Asesor, Líder, Gerente y superiores)
```json
{
  "asesor_id": 2,
  "lider_id": 3,
  "gerente_id": 4,
  "cliente_id": 1,
  "numero_personas": 2,
  "fecha_ida": "2024-12-15",
  "fecha_regreso": "2024-12-22",
  "destino": "Cartagena",
  "origen": "Bogotá",
  "acomodacion": "Doble",
  "tipo_hotel": "4 estrellas",
  "ninos": 0,
  "edades_ninos": [],
  "observaciones": "Solicitud de cotización para luna de miel"
}
```

#### GET /api/quotes
Obtiene todas las cotizaciones
- **Headers:** `Authorization: Bearer {token}`
- **Roles requeridos:** 5+ (Admin, Contador, Owner)
- **Query params:**
  - `status`: pending, completed, approved, rejected
  - `page`: número de página
  - `limit`: elementos por página

#### GET /api/quotes/:id
Obtiene una cotización por ID
- **Headers:** `Authorization: Bearer {token}`

#### PUT /api/quotes/:id
Actualiza una cotización (Solo Admin)
- **Headers:** `Authorization: Bearer {token}`
- **Roles requeridos:** 5+ (Admin, Contador, Owner)
```json
{
  "precio_total": 2500000,
  "observaciones": "Cotización completada con precios actualizados",
  "status": "completed"
}
```

#### PATCH /api/quotes/:id/approve
Aprueba una cotización
- **Headers:** `Authorization: Bearer {token}`

#### PATCH /api/quotes/:id/reject
Rechaza una cotización
- **Headers:** `Authorization: Bearer {token}`
```json
{
  "motivo_rechazo": "Precio muy alto para el presupuesto del cliente"
}
```

#### GET /api/quotes/vendedor/:tipo/:vendedor_id
Obtiene cotizaciones por vendedor
- **Headers:** `Authorization: Bearer {token}`
- **Params:**
  - `tipo`: asesor, lider, gerente
  - `vendedor_id`: ID del vendedor
- **Query params:**
  - `status`: filtrar por estado
  - `page`: número de página

## 🎯 Roles y Permisos

### Roles Numéricos:
1. **Cliente** - Usuario final
2. **Asesor** - Vendedor base, puede crear cotizaciones
3. **Líder** - Supervisa asesores
4. **Gerente** - Supervisa líderes
5. **Admin** - Gestiona cotizaciones y contratos
6. **Contador** - Maneja facturación
7. **Owner** - Acceso completo

### Matriz de Permisos:
| Endpoint | Cliente | Asesor | Líder | Gerente | Admin | Contador | Owner |
|----------|---------|--------|-------|---------|-------|----------|-------|
| POST /quotes | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /quotes (all) | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| PUT /quotes | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| GET /users | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |

## 🧪 Casos de Prueba Sugeridos

### 1. Testing de Autenticación
1. Registrar usuarios con diferentes roles
2. Intentar login con credenciales incorrectas (verificar bloqueo después de 5 intentos)
3. Cambiar contraseña
4. Verificar expiración de token (24 horas)

### 2. Testing de Jerarquía
1. Crear estructura: Gerente > Líder > Asesor
2. Verificar que cada nivel solo puede acceder a sus subordinados
3. Probar acceso cruzado (debe fallar)

### 3. Testing de Cotizaciones
1. Crear cotización como Asesor
2. Completar como Admin
3. Aprobar como Cliente
4. Rechazar cotización

### 4. Testing de Errores
1. Intentar acceder sin token
2. Usar token expirado
3. Intentar acciones sin permisos
4. Crear cotización con datos inválidos

## 🐛 Troubleshooting

### Error: "Token de acceso requerido"
- Verificar que el header `Authorization` esté presente
- Formato correcto: `Bearer {token}`

### Error: "Usuario no encontrado o inactivo"
- El usuario puede haber sido desactivado
- Verificar que el token corresponda a un usuario existente

### Error: "No tienes permisos para acceder"
- Verificar que el rol del usuario tenga los permisos necesarios
- Revisar la jerarquía si aplica

### Error: "Cuenta bloqueada"
- Esperar 30 minutos o usar endpoint de desbloqueo (Admin)

## 📊 Respuestas de Ejemplo

### Login Exitoso:
```json
{
  "success": true,
  "message": true,
  "user": {
    "id": 1,
    "name": "Administrador",
    "lastname": "Principal",
    "email": "admin@viajaya.com",
    "role": 7
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h"
}
```

### Cotización Creada:
```json
{
  "message": "Cotización creada exitosamente",
  "quote": {
    "id": 1,
    "quote_number": "COT-20241226-001",
    "status": "pending",
    "numero_personas": 2,
    "destino": "Cartagena",
    "Asesor": {
      "name": "Juan",
      "lastname": "Pérez"
    }
  }
}
```

### Error de Permisos:
```json
{
  "message": "No tienes permisos para acceder a este recurso",
  "error": "INSUFFICIENT_PERMISSIONS",
  "requiredRoles": [5, 6, 7],
  "userRole": 2
}
```
