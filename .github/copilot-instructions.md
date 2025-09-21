# ViajaYa - Guía de Desarrollo para IA

## Arquitectura General

ViajaYa es una plataforma de agencia de viajes con **arquitectura full-stack React/Node.js**:

- **Frontend (`viajaya/`)**: React 18 + Vite + Redux Toolkit + Tailwind CSS
- **Backend (`viajaya-back/`)**: Node.js + Express + Sequelize + PostgreSQL
- **Proyecto en Construcción (`EnConstrucción/`)**: Entorno de desarrollo/staging

## Modelo de Negocio Principal

ViajaYa opera como una **plataforma de ventas de viajes jerárquica** con estructuras de comisiones complejas:

- **Roles de Usuario**: Cliente(1) → Asesor(2) → Líder(3) → Gerente(4) → Admin(5) → Contador(6) → Owner(7)
- **Flujo de Ventas**: Cotizaciones → Contratos → Pagos → Comisiones → Facturas
- **Sistema de Comisiones**: Comisiones multinivel basadas en porcentajes calculadas sobre elementos de contrato

## Patrones Críticos de Desarrollo

### Base de Datos y Modelos

**Los modelos usan Sequelize con patrones específicos:**
```javascript
// Todos los modelos siguen este patrón en viajaya-back/src/models/
module.exports = (sequelize) => {
  sequelize.define('modelName', {
    // Claves primarias UUID para entidades de negocio (Quote, Contract, Commission)
    // Auto-incremento entero para entidades de usuario/contenido (User, Pack, Item)
  }, {timestamps: false}); // La mayoría de modelos deshabilitan timestamps
};
```

**Relaciones Complejas en `db.js`:**
- Los usuarios tienen relaciones jerárquicas (claves foráneas `gerente_id`)
- Cotizaciones → Contratos → ElementosContrato (flujo de negocio)
- Cálculos de comisiones a través de jerarquía de usuarios

### Arquitectura de API

**Organización de Rutas en `viajaya-back/src/routes/`:**
- Las rutas siguen patrones RESTful con middleware basado en roles
- Autenticación: `authenticateToken` + `authorizeRoles(1,2,3...)`
- Validación de jerarquía: `authorizeHierarchy` para operaciones gerente-subordinado

**Comunicación API del Frontend:**
- Slices de Redux Toolkit Query en `viajaya/src/redux/slices/`
- Configuración centralizada de API en `utils/env.js`
- Cambio de URL base para desarrollo/producción

### Gestión de Estado

**Patrón Redux:**
```javascript
// Todos los slices siguen este patrón:
export const fetchData = createAsyncThunk(
  'slice/fetchData',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/endpoint');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);
```

**Estructura del Store:** Organizado por dominio (auth, user, quote, contract, commission, etc.)

## Integraciones Externas

### Cloudinary (Gestión de Archivos)
- **Frontend**: Integración de Widget en `cloudinaryConfig.js`
- **Backend**: Subida directa vía `multerConfig.js` con almacenamiento Cloudinary
- **Patrón**: Todas las subidas de archivos van a través de Cloudinary, URLs almacenadas en base de datos

### Wompi (Procesamiento de Pagos)
- **Servicio**: `utils/WompiService.js` maneja el flujo de pagos
- **Webhook**: Backend procesa notificaciones de pago
- **Flujo**: Frontend crea transacción → Backend valida → Webhook confirma

### Email y Notificaciones
- Nodemailer para emails del sistema
- Sistema de auto-mensajes para comunicaciones con clientes
- Integración WhatsApp planificada (evidencia en modelo AutoMessage)

## Flujos de Desarrollo

### Desarrollo Local
```bash
# Backend
cd viajaya-back
npm run dev          # nodemon con recarga automática

# Frontend  
cd viajaya
npm run dev          # Servidor de desarrollo Vite (puerto 5173)
```

### Operaciones de Base de Datos
```bash
# Ejecutar migraciones
node run-migration.js

# Datos de prueba
npm start            # Ejecuta automáticamente insertNumbers() y seedCommissionConfigs()
```

### Despliegue
- **Frontend**: Vercel con configuración proxy al backend
- **Backend**: Render.com con PostgreSQL
- **Configuración**: `vercel.json` redirige llamadas API al backend

## Convenciones de Código

### Organización de Archivos
- **Componentes**: Carga lazy en `AppRoutes.jsx` con enrutamiento basado en roles
- **Hooks**: Hooks personalizados en `components/hooks/` (ej: `useAuthGuard`)
- **Utils**: Utilidades compartidas organizadas por dominio

### Patrones de Base de Datos
- **UUIDs**: Entidades de negocio (quotes, contracts, commissions)
- **Enteros**: Entidades de usuario/contenido (users, packs, items)
- **Enums**: Definidos en modelos para campos de estado y tipos
- **Relaciones**: Uso extensivo de alias en asociaciones

### Flujo de Autenticación
1. Login retorna JWT + rol de usuario
2. Frontend almacena token en estado Redux
3. Llamadas API incluyen token en header Authorization
4. Backend valida permisos de rol por ruta

## Reglas de Negocio Clave

### Cálculo de Comisiones
- Calculadas al completar contrato, no al crear cotización
- Multinivel: Porcentajes Asesor → Líder → Gerente → Owner
- Límites mensuales y configuraciones almacenadas en `CommissionConfig`

### Flujo Cotización-a-Contrato
1. Cotización creada por representante de ventas o formulario externo
2. Ítems de cotización calculados vía `QuoteCalculation`
3. Aprobación del cliente convierte a Contrato
4. Ítems de contrato generan registros de comisión

### Gestión de Pagos
- Soporte para pagos en cuotas (`PurchaseInstallment`)
- Subida de documentos para verificación de pago
- Integración con Wompi para pagos en línea

## Pruebas y Depuración

### Depuración de Base de Datos
- Configura `logging: console.log` en `db.js` para ver consultas SQL
- Usa `conn.sync({ alter: true })` para cambios de esquema

### Pruebas de API
- Colección de Insomnia disponible: `insomnia-collection.json`
- Scripts de prueba en directorio `scripts/`

### Problemas Comunes
- Configuración CORS para múltiples dominios en `app.js`
- Límites de subida de archivos en configuración multer
- Manejo de zona horaria para campos de fecha

## Patrones de Migración

Las migraciones de base de datos en `migrations/` siguen nomenclatura por fecha: `YYYYMMDD_descripcion.js`
Siempre prueba migraciones con datos de respaldo antes del despliegue en producción.