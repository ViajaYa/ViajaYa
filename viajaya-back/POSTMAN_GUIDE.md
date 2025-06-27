# ViajaYa API - Postman Collection

Este archivo contiene la colección de Postman para probar la API de ViajaYa.

## Importar en Postman

1. Abrir Postman
2. Click en "Import"
3. Seleccionar el archivo `postman_collection.json`
4. Configurar las variables de entorno

## Variables de Entorno

Crear un environment en Postman con estas variables:

```
base_url: http://localhost:3001
token: (se actualizará después del login)
user_id: (se actualizará después del login)
```

## Scripts de Automatización

La colección incluye scripts automáticos para:
- Extraer el token después del login
- Configurar headers de autorización automáticamente
- Validar respuestas

## Orden de Ejecución Recomendado

1. **Authentication** > Login User
2. **Authentication** > Verify Token  
3. **Users** > Get Profile
4. **Quotes** > Create Quote
5. **Quotes** > Get All Quotes

## Testing Automatizado

Para ejecutar todos los tests automáticamente:
1. Click en la colección "ViajaYa API"
2. Click en "Run collection"
3. Seleccionar todos los requests
4. Click en "Run ViajaYa API"

Los tests incluyen validaciones automáticas de:
- Status codes
- Estructura de respuesta
- Campos obligatorios
- Tokens de autenticación
