# Fix: Error de Validación de Documento del Titular

## Problema
El formulario de pasajeros mostraba errores de validación para el documento del titular, pero funcionaba correctamente para otros pasajeros.

## Causa Raíz
1. **Inconsistencia en los tipos de documento**: En `PassengerCard.jsx` se convertían los tipos de documento a minúsculas:
   ```javascript
   const tiposDocumento = getDocumentTypes().map(doc => ({
     value: doc.value.toLowerCase(),  // cc, pa, ti, etc.
     label: doc.label
   }));
   ```

2. **Función de validación esperaba mayúsculas**: En `validations.js`, la función `validateDocument` usa tipos en mayúsculas:
   ```javascript
   const documentRules = {
     'CC': { ... },  // Cédula de Ciudadanía
     'PA': { ... },  // Pasaporte
     'TI': { ... }   // Tarjeta de Identidad
   };
   ```

3. **Falta de re-validación**: Cuando se cambiaba el tipo de documento, no se re-validaba automáticamente el número de documento existente.

## Solución Implementada

### 1. Fix en validación de documento
```javascript
case 'documento_identidad': {
  if (value.trim()) {
    // ✅ FIX: Convertir tipo de documento a mayúsculas para la validación
    const docType = passenger.tipo_documento?.toUpperCase() || 'CC';
    const documentValidation = validateDocument(docType, value);
    // ...
  }
}
```

### 2. Re-validación automática al cambiar tipo de documento
```javascript
// ✅ FIX: Si se cambia el tipo de documento, re-validar el número de documento
if (field === 'tipo_documento' && updated[index].documento_identidad?.trim()) {
  const docType = value.toUpperCase();
  const docValidation = validateDocument(docType, updated[index].documento_identidad);
  updated[index] = {
    ...updated[index],
    documento_identidad_validation: {
      isValid: docValidation.isValid,
      message: docValidation.message
    }
  };
  
  // Formatear el documento según el nuevo tipo
  if (docValidation.isValid && docValidation.formatted) {
    updated[index].documento_identidad = docValidation.formatted;
  }
}
```

### 3. Fix en validaciones de precarga y envío
Se aplicó el mismo fix en:
- `validatePreloadedData()` - Para datos precargados
- `validateForm()` - Para validación antes del envío

## Resultado
- ✅ El documento del titular se valida correctamente
- ✅ Al cambiar el tipo de documento se re-valida automáticamente
- ✅ Los documentos se formatean según el tipo (ej: cédula con puntos)
- ✅ Los mensajes de error son específicos y útiles

## Archivos Modificados
- `PassengerForm.jsx` - Función `validateAndFormatField` y `updatePassenger`
- `PassengerForm.jsx` - Funciones `validatePreloadedData` y `validateForm`

## Nota
El componente `PassengerCard.jsx` mantiene los tipos en minúsculas en el UI para consistencia, pero la conversión a mayúsculas se hace solo para la validación interna.
