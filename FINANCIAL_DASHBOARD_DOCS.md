# Dashboard Financiero - ViajaYa

## 📊 Descripción General

El Dashboard Financiero es una herramienta completa para el análisis y gestión financiera que permite monitorear ingresos, gastos y ganancias en tiempo real.

## 🎯 Características Principales

### 📈 Resumen Financiero
- **Tarjetas de Métricas**: Visualización de ingresos totales, gastos totales, ganancia neta y margen de ganancia
- **Gráfico de Tendencias**: Análisis mensual con barras comparativas de ingresos vs gastos
- **Actualización en Tiempo Real**: Datos sincronizados con el backend

### 💳 Gestión de Pagos
- **Lista Completa**: Visualización paginada de todos los pagos registrados
- **Filtros Avanzados**: Por contrato, rango de fechas (predefinidos y personalizados)
- **Detalles Expandibles**: Información completa del pago y contrato asociado
- **Visualización de Comprobantes**: Modal para ver recibos (imágenes y PDFs)

### 🛒 Gestión de Compras
- **Lista Completa**: Visualización paginada de todas las compras registradas
- **Categorización**: Filtros por tipo de compra (transporte, hospedaje, alimentación, etc.)
- **Gestión de Proveedores**: Información detallada de proveedores
- **Visualización de Comprobantes**: Modal para ver facturas y recibos

## 🔐 Control de Acceso

El dashboard está restringido a los siguientes roles:
- **Gerente** (rol 4)
- **Admin** (rol 5)
- **Contador** (rol 6)
- **Owner** (rol 7)

## 🛣️ Rutas y Navegación

### Ruta Principal
```
/financial-dashboard
```

### Estructura de Pestañas
1. **Resumen** - Dashboard principal con métricas y gráficos
2. **Pagos** - Gestión completa de pagos recibidos
3. **Compras** - Gestión completa de gastos y compras

## 🎨 Interfaz de Usuario

### Componentes Principales

#### 1. FinancialDashboard.jsx
- Componente principal con navegación por pestañas
- Gestión de estado global y filtros
- Integración con Redux para manejo de datos

#### 2. FinancialSummaryCards.jsx
- Tarjetas responsive con métricas clave
- Formateo de moneda en pesos colombianos
- Indicadores visuales con colores

#### 3. FinancialChart.jsx
- Gráfico de barras interactivo
- Comparación mensual ingresos vs gastos
- Tooltips informativos

#### 4. FinancialFilters.jsx
- Filtros por contrato y fechas
- Opciones predefinidas (hoy, últimos 7 días, mes actual, etc.)
- Rango personalizado con selección de fechas

#### 5. PaymentsList.jsx
- Lista paginada de pagos
- Estados visuales (confirmado, pendiente, rechazado)
- Expandible para ver detalles completos

#### 6. PurchasesList.jsx
- Lista paginada de compras
- Categorización por colores
- Información de proveedores

#### 7. ReceiptModal.jsx
- Visualización de comprobantes
- Soporte para imágenes y PDFs
- Opción de descarga

## 🔧 Backend Integration

### Endpoints Utilizados

#### Resumen Financiero
```
GET /api/financial/summary
```
Retorna métricas generales y datos mensuales para gráficos.

#### Lista de Pagos
```
GET /api/financial/payments
```
Parámetros:
- `page`: Número de página
- `limit`: Elementos por página
- `contractId`: Filtro por contrato (opcional)
- `dateRange`: Filtro por fechas (opcional)

#### Lista de Compras
```
GET /api/financial/purchases
```
Parámetros:
- `page`: Número de página
- `limit`: Elementos por página
- `contractId`: Filtro por contrato (opcional)
- `dateRange`: Filtro por fechas (opcional)

## 📱 Funcionalidades Interactivas

### Filtros de Fecha
- **Hoy**: Transacciones del día actual
- **Ayer**: Transacciones del día anterior
- **Últimos 7 días**: Semana completa
- **Últimos 30 días**: Mes completo
- **Este mes**: Mes calendario actual
- **Mes pasado**: Mes calendario anterior
- **Últimos 3 meses**: Trimestre
- **Últimos 6 meses**: Semestre
- **Este año**: Año calendario actual
- **Año pasado**: Año calendario anterior
- **Rango personalizado**: Selección manual de fechas

### Paginación
- Navegación entre páginas
- Información de registros mostrados
- Controles de página anterior/siguiente

### Visualización de Comprobantes
- Soporte para JPG, PNG, PDF
- Vista previa en modal
- Descarga directa
- Manejo de errores de carga

## 🎯 Estados de Pagos

### Estados Disponibles
- **Confirmado**: Pago verificado y aprobado
- **Pendiente**: Pago en proceso de verificación
- **Rechazado**: Pago no aprobado
- **En Revisión**: Pago bajo análisis

### Códigos de Color
- Verde: Confirmado
- Amarillo: Pendiente
- Rojo: Rechazado
- Azul: En Revisión

## 🛒 Categorías de Compras

### Tipos Disponibles
- **Transporte**: Vuelos, buses, transfers
- **Hospedaje**: Hoteles, alojamientos
- **Alimentación**: Comidas, catering
- **Actividades**: Tours, excursiones
- **Seguros**: Pólizas de viaje
- **Otros**: Gastos diversos

## 📊 Métricas del Dashboard

### Tarjetas de Resumen
1. **Ingresos Totales**: Suma de todos los pagos confirmados
2. **Gastos Totales**: Suma de todas las compras
3. **Ganancia Neta**: Diferencia entre ingresos y gastos
4. **Margen de Ganancia**: Porcentaje de rentabilidad

### Formato de Moneda
Todas las cantidades se muestran en pesos colombianos (COP) con formato localizado.

## 🔄 Actualizaciones en Tiempo Real

### Botón de Actualización
- Refresca datos según la pestaña activa
- Indicador visual de carga
- Sincronización con servidor

### Auto-actualización
- Los filtros activan automáticamente la búsqueda
- Cambios de página cargan nuevos datos
- Estado preservado entre navegaciones

## 🎨 Diseño Responsive

### Breakpoints
- **Desktop**: Diseño completo con todas las funciones
- **Tablet**: Adaptación de columnas y tarjetas
- **Mobile**: Vista optimizada para pantallas pequeñas

### Elementos Adaptativos
- Grid de tarjetas responsive
- Tablas con scroll horizontal en móvil
- Modales ajustables al tamaño de pantalla

## 🔧 Configuración de Desarrollo

### Dependencias Principales
- React 18+
- Redux Toolkit
- React Router DOM
- PropTypes para validación

### Estructura de Archivos
```
src/components/pages/Financial/
├── FinancialDashboard.jsx      # Componente principal
├── FinancialSummaryCards.jsx   # Tarjetas de métricas
├── FinancialChart.jsx          # Gráfico de tendencias
├── FinancialFilters.jsx        # Filtros de búsqueda
├── PaymentsList.jsx            # Lista de pagos
├── PurchasesList.jsx           # Lista de compras
└── ReceiptModal.jsx            # Modal de comprobantes
```

### Redux Slice
```
src/redux/slices/financialSlice.js
```
Maneja todo el estado relacionado con datos financieros, filtros y paginación.

## 🚀 Próximas Mejoras

### Funcionalidades Planeadas
- Exportación a Excel/PDF
- Gráficos adicionales (torta, líneas)
- Alertas y notificaciones
- Dashboard personalizable
- Comparaciones año/año
- Reportes automáticos

### Optimizaciones
- Cache de datos
- Lazy loading de componentes
- Optimización de consultas
- Mejoras de rendimiento
