# Fix: Error de Vista Previa de PDF en Cotizaciones

## Problema
- El endpoint `GET /quotes/:id/preview-pdf` devolvía error 500
- El log mostraba: "Error generando buffer de PDF"
- El envío de PDF al cliente funcionaba perfectamente
- Solo fallaba la vista previa desde QuotesList

## Causa Raíz
La función `previewQuotePDF` no estaba enriqueciendo la cotización con los datos calculados necesarios antes de generar el PDF, específicamente:

1. **Datos de precio calculados**: `precio_por_persona`, `personas_que_pagan`
2. **Datos formateados para PDF**: `pdf_data` con fechas y precios formateados
3. **Información del asesor**: `asesor_info` con datos del responsable

La función `generateQuotePDF` esperaba recibir una cotización con estos campos enriquecidos, pero `previewQuotePDF` solo pasaba la cotización "cruda" de la base de datos.

## Solución Implementada

### 1. Enriquecimiento de datos en `previewQuotePDF`
Se agregó el mismo enriquecimiento que usa `sendQuote`:

```javascript
// ✅ FIX: Enriquecer cotización con cálculos
let precio_por_persona = 0;
let personasQuePagan = 0;

if (quote.precio_total) {
  personasQuePagan = calcularPersonasQuePagan({
    adultos: quote.adultos,
    menores: quote.menores,
    infantes: quote.infantes
  });
  
  if (personasQuePagan > 0) {
    precio_por_persona = parseFloat(quote.precio_total) / personasQuePagan;
  }
}

const enrichedQuote = {
  ...quote.toJSON(),
  precio_por_persona: precio_por_persona,
  precio_por_persona_formateado: precio_por_persona.toFixed(2),
  personas_que_pagan: personasQuePagan,
  pdf_data: {
    precio_total_cop: quote.precio_total ? `$${parseFloat(quote.precio_total).toLocaleString('es-CO')}` : null,
    precio_por_persona_cop: precio_por_persona > 0 ? `$${precio_por_persona.toLocaleString('es-CO')}` : null,
    fecha_ida_formatted: quote.fecha_ida ? formatForPDF(quote.fecha_ida) : null,
    fecha_regreso_formatted: quote.fecha_regreso ? formatForPDF(quote.fecha_regreso) : null,
    trip_type_label: getTripTypeLabel(quote.trip_type),
  },
  asesor_info: {
    // ... información del responsable
  }
};
```

### 2. Fix en `regenerateQuotePDF`
También se encontró y corrigió el mismo problema en la función `regenerateQuotePDF`, donde las fechas se estaban formateando incorrectamente:

**ANTES:**
```javascript
fecha_ida_formatted: quote.fecha_ida ? new Date(quote.fecha_ida).toLocaleDateString('es-ES') : null,
```

**DESPUÉS:**
```javascript
fecha_ida_formatted: quote.fecha_ida ? formatForPDF(quote.fecha_ida) : null,
```

### 3. Uso de la función `formatForPDF`
Se aseguró que todas las funciones usen `formatForPDF` de `dateUtils.js` para formatear fechas consistentemente con la zona horaria de Colombia.

## Archivos Modificados
- `quoteController.js` - Funciones `previewQuotePDF` y `regenerateQuotePDF`

## Resultado
- ✅ Vista previa de PDF funciona correctamente desde QuotesList
- ✅ Las fechas se muestran formateadas consistentemente
- ✅ Los precios se calculan y muestran correctamente
- ✅ La información del asesor responsable aparece en el PDF
- ✅ Mantiene compatibilidad con el envío de PDF al cliente

## Prueba de Funcionamiento
1. Acceder a QuotesList
2. Hacer clic en "Ver PDF" de cualquier cotización con precio
3. El PDF se debería abrir correctamente en el navegador
4. Verificar que las fechas y precios aparezcan formateados

## Nota Técnica
El problema era que `generateQuotePDF` está diseñado para trabajar con cotizaciones "enriquecidas" (con datos calculados), pero las funciones de vista previa solo pasaban la cotización básica de la base de datos. La solución fue aplicar el mismo patrón de enriquecimiento que ya funcionaba correctamente en `sendQuote`.
