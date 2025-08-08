# Sistema de Gestión de Agencia de Viajes - Nueva Arquitectura

## 1. ROLES Y JERARQUÍA DE USUARIOS

### Roles:
- **1. Cliente**: Usuario final que compra paquetes
- **2. Asesor**: Vendedor de base que genera cotizaciones
- **3. Líder**: Maneja varios asesores, recibe comisiones de sus ventas
- **4. Gerente**: Maneja varios líderes, recibe comisiones de toda su red
- **5. Admin**: Completa cotizaciones, maneja contratos
- **6. Contador**: Maneja facturación y documentos soporte
- **7. Owner**: Dueño del negocio, aprueba todo

### Estructura del Modelo User Actualizado:
```javascript
// Nuevos campos para User:
{
  role: {
    1: 'Cliente',
    2: 'Asesor', 
    3: 'Líder',
    4: 'Gerente',
    5: 'Admin',
    6: 'Contador',
    7: 'Owner'
  },
  supervisor_id: 'ID del supervisor directo (líder/gerente)',
  team_members: 'Array de IDs de miembros del equipo',
  commission_limit: 'Límite para documentos soporte (1,400,000)',
  current_commission_used: 'Comisión usada en el período actual'
}
```

## 2. NUEVOS MODELOS NECESARIOS

### A. Cotización (Quote)
```javascript
{
  id: 'UUID',
  quote_number: 'Número de cotización único',
  // Datos del solicitante
  asesor_id: 'ID del asesor',
  lider_id: 'ID del líder', 
  gerente_id: 'ID del gerente',
  cliente_id: 'ID del cliente',
  
  // Datos del viaje
  numero_personas: 'Número',
  fecha_ida: 'Date',
  fecha_regreso: 'Date', 
  destino: 'String',
  origen: 'String',
  acomodacion: 'String',
  tipo_hotel: 'String',
  ninos: 'Number',
  edades_ninos: 'Array',
  observaciones: 'Text',
  
  // Estados
  status: 'pending/completed/approved/rejected',
  precio_total: 'Decimal',
  
  // Fechas importantes
  created_at: 'Date',
  completed_at: 'Date',
  approved_at: 'Date'
}
```

### B. Contrato (Contract)
```javascript
{
  id: 'UUID',
  quote_id: 'Referencia a cotización',
  contract_number: 'Número único',
  cliente_id: 'ID del cliente',
  
  // Detalles del contrato
  precio_total: 'Decimal',
  forma_pago: 'contado/cuotas',
  numero_cuotas: 'Number',
  valor_cuota: 'Decimal',
  fecha_vencimiento_cuotas: 'Array de fechas',
  
  // Estados
  status: 'draft/sent/signed/completed',
  fecha_firma: 'Date',
  fecha_inicio_viaje: 'Date',
  fecha_fin_viaje: 'Date',
  
  // Control de pagos
  total_pagado: 'Decimal',
  saldo_pendiente: 'Decimal'
}
```

### C. Pagos (Payment)
```javascript
{
  id: 'UUID',
  contract_id: 'Referencia al contrato',
  tipo_pago: 'wompi/transferencia/efectivo',
  monto: 'Decimal',
  fecha_pago: 'Date',
  referencia_pago: 'String',
  comprobante_url: 'String',
  status: '1',
  recibo_pdf_url: 'String'
}
```

### D. Compras del Paquete (PackagePurchase)
```javascript
{
  id: 'UUID',
  contract_id: 'Referencia al contrato',
  tipo_compra: 'vuelo/hotel/transporte/seguro/otros',
  proveedor: 'String',
  monto: 'Decimal',
  fecha_compra: 'Date',
  fecha_limite: 'Date', // Para alertas
  status: 'pending/purchased/cancelled',
  prioridad: 'alta/media/baja', // Vuelos = alta
  comprobante_url: 'String'
}
```

### E. Comisiones (Commission)
```javascript
{
  id: 'UUID',
  contract_id: 'Referencia al contrato',
  vendedor_id: 'ID del vendedor (asesor/líder/gerente)',
  tipo_vendedor: 'asesor/lider/gerente',
  porcentaje: 'Decimal',
  monto_comision: 'Decimal',
  status: 'pending/generated/paid',
  fecha_generacion: 'Date',
  fecha_pago: 'Date'
}
```

### F. Documentos Soporte (SupportDocument)
```javascript
{
  id: 'UUID',
  vendedor_id: 'ID del vendedor',
  vendedor_real_id: 'ID real (para casos de límite excedido)',
  monto: 'Decimal',
  numero_documento: 'String',
  fecha_generacion: 'Date',
  fecha_aprobacion: 'Date',
  fecha_pago: 'Date',
  status: 'generated/approved/paid',
  owner_approval: 'Boolean',
  comisiones_incluidas: 'Array de commission_ids'
}
```

### G. Mensajes Automáticos (AutoMessage)
```javascript
{
  id: 'UUID',
  contract_id: 'Referencia al contrato',
  tipo_mensaje: 'recordatorio_pago/tramite/general',
  contenido: 'Text',
  fecha_programada: 'Date',
  fecha_enviado: 'Date',
  status: 'scheduled/sent/failed',
  cliente_id: 'ID del cliente'
}
```

### H. Facturas (Invoice)
```javascript
{
  id: 'UUID',
  contract_id: 'Referencia al contrato',
  numero_factura: 'String',
  fecha_factura: 'Date',
  
  // Ítems de la factura
  monto_compras: 'Decimal',
  monto_comisiones: 'Decimal', 
  monto_ganancia: 'Decimal',
  monto_total: 'Decimal',
  
  status: 'generated/sent/paid',
  pdf_url: 'String'
}
```

## 3. FLUJO DEL PROCESO

### Fase 1: Cotización
1. Asesor/Líder/Gerente crea solicitud de cotización
2. Admin completa los datos y precios
3. Sistema envía cotización por email al cliente
4. Cliente aprueba/rechaza

### Fase 2: Contrato
5. Admin y Owner crean el contrato
6. Se define forma de pago y cuotas
7. Se envía para firma digital
8. Cliente firma el contrato

### Fase 3: Pagos y Compras
9. Cliente puede pagar desde su dashboard
10. Sistema genera alertas para compras prioritarias (vuelos 24h)
11. Se programan compras del paquete
12. Control de cuotas y fechas límite

### Fase 4: Comisiones
13. Se calculan comisiones por cada venta
14. Vendedores generan documentos de cobro
15. Owner aprueba y paga comisiones
16. Control de límites de $1,400,000

### Fase 5: Cierre
17. Al regreso del pasajero se genera factura
18. Se cierra el contrato

## 4. ALERTAS Y NOTIFICACIONES

- Vuelos por comprar (24h)
- Cuotas por vencer
- 45 días antes del viaje (pago completo)
- Mensajes programados
- Documentos soporte pendientes
- Comisiones por pagar

## 5. DASHBOARD POR ROL

### Cliente:
- Ver reservas activas
- Realizar pagos
- Descargar recibos
- Ver itinerario

### Asesor/Líder/Gerente:
- Crear cotizaciones
- Ver comisiones
- Generar documentos soporte
- Dashboard de ventas

### Admin:
- Completar cotizaciones
- Crear contratos
- Gestionar compras
- Dashboard general

### Owner:
- Aprobar documentos soporte
- Ver reportes generales
- Configurar mensajes automáticos
- Dashboard ejecutivo

### Contador:
- Generar facturas
- Control de documentos soporte
- Reportes financieros
