# 🔐 Verificación de Dominio en SendGrid - ViajaYa

## ¿Por qué verificar el dominio?

La verificación de dominio en SendGrid:
- ✅ **Desbloquea el envío de emails** desde tu dominio `@viajaya.com.co`
- ✅ **Evita que los emails vayan a spam**
- ✅ **Mejora la reputación del remitente**
- ✅ **Funciona en Railway** (API HTTP, no SMTP)

---

## 📋 Paso 1: Obtener registros DNS de SendGrid

### 1.1. Iniciar sesión en SendGrid

1. Ve a: **https://app.sendgrid.com**
2. Inicia sesión con tu cuenta actual

### 1.2. Ir a Sender Authentication

1. En el menú lateral, ve a **Settings** → **Sender Authentication**
2. Busca la sección **"Domain Authentication"**
3. Haz clic en **"Authenticate Your Domain"**

### 1.3. Configurar la verificación

Verás un formulario con varias opciones:

#### **DNS Host:**
- Selecciona: **"Other Host"** (o "I'm not sure" si no sabes)
- SendGrid funciona con cualquier proveedor DNS

#### **Brand your links with:**
- Ingresa: `viajaya.com.co`
- Esto hace que los links en tus emails también usen tu dominio

#### **Would you also like to brand the links for this domain?**
- Marca: **Yes** (recomendado)

#### **Advanced Settings (opcional):**
- Deja los valores por defecto

4. Haz clic en **"Next"**

### 1.4. Copiar registros DNS

SendGrid te mostrará una pantalla con **3 registros CNAME** para agregar:

**Ejemplo de registros (los tuyos serán diferentes):**

```
Tipo: CNAME
Host: s1._domainkey.viajaya.com.co
Value/Points to: s1.domainkey.u1234567.wl.sendgrid.net
TTL: 300 (o automático)

Tipo: CNAME
Host: s2._domainkey.viajaya.com.co
Value/Points to: s2.domainkey.u1234567.wl.sendgrid.net
TTL: 300 (o automático)

Tipo: CNAME
Host: em1234.viajaya.com.co
Value/Points to: u1234567.wl.sendgrid.net
TTL: 300 (o automático)
```

⚠️ **IMPORTANTE**: Copia estos registros exactamente como aparecen. NO cierres esta ventana todavía.

---

## 📋 Paso 2: Agregar registros DNS en Zoho

Zoho Mail gestiona el DNS de `viajaya.com.co`. Necesitas agregar los 3 registros CNAME ahí.

### Opción A: Si gestionas DNS en Zoho Mail Admin

#### 2.1. Acceder al panel de DNS

1. Ve a: **https://mailadmin.zoho.com**
2. Inicia sesión con tu cuenta de administrador
3. Ve a **Domains** → Selecciona **viajaya.com.co**
4. Haz clic en **DNS Records** o **DNS Settings**

#### 2.2. Agregar los registros CNAME

Para cada uno de los 3 registros que te dio SendGrid:

1. Haz clic en **"Add Record"** o **"Add DNS Record"**
2. Configura:
   - **Type**: CNAME
   - **Name/Host**: Copia el valor de "Host" de SendGrid
     - **Solo la parte antes del dominio**: `s1._domainkey` (NO incluyas `.viajaya.com.co`)
   - **Value/Points to**: Copia el valor completo de SendGrid
   - **TTL**: 300 o deja automático
3. Guarda el registro
4. Repite para los otros 2 registros

### Opción B: Si usas otro proveedor de DNS

Si el DNS de `viajaya.com.co` está en otro proveedor (GoDaddy, Cloudflare, Namecheap, etc.):

1. Accede al panel de control de tu proveedor de DNS
2. Busca la sección de **DNS Management** o **DNS Records**
3. Agrega los 3 registros CNAME siguiendo el mismo proceso

**Ejemplo en Cloudflare:**
- Type: CNAME
- Name: `s1._domainkey`
- Target: `s1.domainkey.u1234567.wl.sendgrid.net`
- Proxy status: DNS only (gris)
- TTL: Auto

---

## 📋 Paso 3: Verificar en SendGrid

### 3.1. Esperar propagación DNS

- **Tiempo estimado**: 5-30 minutos (puede tomar hasta 48 horas)
- **Recomendación**: Espera al menos 15 minutos antes de verificar

### 3.2. Verificar registros DNS (opcional)

Puedes verificar si los registros se propagaron usando esta herramienta:
- **MXToolbox**: https://mxtoolbox.com/SuperTool.aspx
- Ingresa: `s1._domainkey.viajaya.com.co`
- Tipo: CNAME Lookup
- Deberías ver el valor que apunta a SendGrid

### 3.3. Verificar en SendGrid

1. Vuelve a la pantalla de SendGrid donde te mostró los registros
2. Haz clic en **"Verify"** o **"I've added these records"**
3. SendGrid verificará automáticamente

**Si la verificación es exitosa:**
- ✅ Verás un mensaje: **"Domain authenticated successfully"**
- ✅ El estado cambiará a **"Verified"** con un check verde

**Si falla la verificación:**
- ❌ Revisa que los registros estén exactamente como los proporcionó SendGrid
- ❌ Espera más tiempo para propagación DNS
- ❌ Verifica que no haya espacios extras en los valores

---

## 📋 Paso 4: Configurar en Railway

Una vez verificado el dominio:

### 4.1. Variables de entorno en Railway

1. Ve a tu proyecto en Railway
2. Servicio de backend → **Variables**
3. **Asegúrate de tener:**
   ```
   SENDGRID_API_KEY = SG.tu_sendgrid_api_key_aqui
   SMTP_FROM = asistenciagerencia@viajaya.com.co
   ```

4. **Elimina estas variables** (si existen):
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASSWORD`
   - `RESEND_API_KEY` (si la agregaste)

5. Railway reiniciará automáticamente

### 4.2. Verificar logs en Railway

Deberías ver en los logs:
```
📧 Usando SendGrid API HTTP para envío de emails
✅ SendGrid API configurada correctamente
```

---

## 📋 Paso 5: Probar el envío

1. Envía una cotización a un cliente
2. Verifica que el email llegue correctamente
3. Revisa que el remitente sea: `asistenciagerencia@viajaya.com.co`

---

## 🔍 Verificación de Estado en SendGrid

### Dashboard de SendGrid

1. Ve a **Activity** en el menú lateral
2. Verás todos los emails enviados con:
   - Estado (Delivered, Processed, Bounced, etc.)
   - Destinatario
   - Asunto
   - Fecha/hora

### Estadísticas

- **Settings** → **Sender Authentication** → Verás el estado **"Verified"**
- **Activity** → Estadísticas de envío

---

## ❓ Problemas Comunes

### **"DNS records not found"**

**Causa**: Registros DNS no propagados o mal configurados

**Solución**:
1. Verifica que los registros estén exactamente como los proporcionó SendGrid
2. Espera 30-60 minutos más
3. Usa MXToolbox para verificar propagación
4. Revisa que el nombre del registro sea solo `s1._domainkey` (sin el dominio completo)

### **"Invalid CNAME record"**

**Causa**: Valor del registro incorrecto

**Solución**:
1. Verifica que no haya espacios al inicio/final
2. Copia y pega directamente desde SendGrid
3. Asegúrate de que el valor termine en `.sendgrid.net`

### **"Domain already verified by another account"**

**Causa**: El dominio ya está verificado en otra cuenta de SendGrid

**Solución**:
1. Si tienes otra cuenta de SendGrid, elimina el dominio de ahí primero
2. O usa un subdominio: `mail.viajaya.com.co`

---

## 📊 Comparación: Con vs Sin verificación

| Característica | Sin verificar | Con dominio verificado |
|---|---|---|
| **Remitente** | `onboarding@sendgrid.net` | `asistenciagerencia@viajaya.com.co` |
| **Confiabilidad** | Media | Alta |
| **Probabilidad spam** | Alta | Baja |
| **Límite diario** | 100 emails | 100 emails |
| **Reputación** | Compartida | Tu propia reputación |

---

## ✅ Checklist de Verificación

- [ ] Iniciar sesión en SendGrid
- [ ] Ir a Settings → Sender Authentication
- [ ] Authenticate Your Domain
- [ ] Copiar los 3 registros CNAME
- [ ] Acceder al panel DNS (Zoho Mail Admin u otro)
- [ ] Agregar los 3 registros CNAME
- [ ] Esperar 15-30 minutos
- [ ] Verificar en SendGrid
- [ ] Ver estado "Verified" ✅
- [ ] Configurar variables en Railway
- [ ] Probar envío de cotización
- [ ] Verificar email recibido desde `@viajaya.com.co`

---

## 🎯 Próximos Pasos

1. **Obtén los registros DNS de SendGrid** (sigue Paso 1)
2. **Agrégalos en Zoho** (sigue Paso 2)
3. **Espera 15-30 minutos**
4. **Verifica en SendGrid** (sigue Paso 3)
5. **Prueba el envío**

---

**Última actualización**: Enero 2026  
**Equipo técnico ViajaYa**
