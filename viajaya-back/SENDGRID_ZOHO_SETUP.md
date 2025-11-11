# Configuración SendGrid con Email de Zoho

## 📧 ¿Por qué usar SendGrid con Zoho?

- **SendGrid**: Servicio de envío de emails profesional (100 emails/día gratis)
- **Zoho**: Tu dominio profesional (ej: info@viajaya.com.co)
- **Resultado**: Envías desde tu email de Zoho usando la infraestructura de SendGrid

---

## 🚀 Pasos de Configuración

### 1️⃣ Crear cuenta en SendGrid

1. Ve a [https://sendgrid.com/](https://sendgrid.com/)
2. Regístrate (Free plan: 100 emails/día)
3. Verifica tu email

### 2️⃣ Crear API Key en SendGrid

1. En SendGrid, ve a **Settings** → **API Keys**
2. Click en **"Create API Key"**
3. Nombre: `ViajaYa Production` (o el que prefieras)
4. Permisos: **"Full Access"** (o "Mail Send" como mínimo)
5. **Copia la API Key** (solo se muestra una vez)
   ```
   SG.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

### 3️⃣ Verificar tu Dominio en SendGrid

**Opción A: Verificación de Dominio Completo (RECOMENDADA)**

1. Ve a **Settings** → **Sender Authentication**
2. Click en **"Authenticate Your Domain"**
3. Selecciona tu proveedor DNS (probablemente **"Other Host"** si Zoho maneja tu DNS)
4. Ingresa tu dominio: `viajaya.com.co`
5. SendGrid te dará **registros DNS** para agregar:
   - **3 registros CNAME** para autenticación
   - Ejemplo:
     ```
     s1._domainkey.viajaya.com.co → s1.domainkey.uXXXXXX.wl.sendgrid.net
     s2._domainkey.viajaya.com.co → s2.domainkey.uXXXXXX.wl.sendgrid.net
     em1234.viajaya.com.co → u1234567.wl.sendgrid.net
     ```

6. **Agrega estos registros en tu panel de Zoho** (o donde tengas el DNS):
   - Ve a Zoho Mail → **Email Control Panel** → **Domains** → **DNS Settings**
   - O si usas otro proveedor DNS (Cloudflare, GoDaddy, etc.), agrégalos ahí

7. Espera 24-48 horas para propagación DNS
8. Verifica en SendGrid que aparezca como **"Verified"**

**Opción B: Verificación de Email Individual (MÁS RÁPIDA)**

1. Ve a **Settings** → **Sender Authentication**
2. Click en **"Verify a Single Sender"**
3. Completa el formulario:
   - **From Name**: `Viaja Ya`
   - **From Email Address**: `info@viajaya.com.co` (tu email de Zoho)
   - **Reply To**: `info@viajaya.com.co`
   - **Nickname**: `ViajaYa Notifications`
   - Dirección de la empresa
4. Recibirás un email en `info@viajaya.com.co` (revisa tu Zoho)
5. Click en el link de verificación

⚠️ **Importante**: Con verificación individual, solo puedes enviar desde ese email específico.

### 4️⃣ Configurar Variables de Entorno

Edita tu archivo `.env` en `viajaya-back/`:

```env
# ====================================
# SENDGRID CONFIGURATION (RECOMENDADO)
# ====================================
SENDGRID_API_KEY=SG.tu_api_key_aqui_muy_larga

# Email que aparecerá como remitente (tu email de Zoho)
SMTP_FROM=info@viajaya.com.co

# ====================================
# SMTP TRADICIONAL (BACKUP - opcional)
# ====================================
# Si SendGrid falla, puedes dejar estos configurados como fallback
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=viajayadev@gmail.com
SMTP_PASSWORD=mmohxpryyoenvabv
```

### 5️⃣ Configurar en Render (Producción)

1. Ve a tu servicio en Render.com
2. **Environment** → **Add Environment Variable**
3. Agrega:
   ```
   SENDGRID_API_KEY = SG.tu_api_key_aqui
   SMTP_FROM = info@viajaya.com.co
   ```
4. Click **"Save Changes"** (reiniciará el servicio automáticamente)

---

## 🧪 Probar la Configuración

### Opción 1: Desde Postman/Insomnia

```http
POST http://localhost:3001/quote/send-email
Content-Type: application/json
Authorization: Bearer tu_token_jwt

{
  "quote_id": "uuid-de-una-cotizacion-existente",
  "recipient_email": "tu-email-de-prueba@gmail.com"
}
```

### Opción 2: Desde el Frontend

1. Crea una cotización
2. Click en "Enviar por Email"
3. Revisa los logs del backend

### Verificar Logs

Deberías ver en consola:
```
📧 Usando SendGrid para envío de emails
✅ Servidor de email listo para enviar correos
Correo enviado: <mensaje-id>
```

---

## ❓ Preguntas Frecuentes

### ¿Puedo usar mi email de Zoho directamente sin SendGrid?

**Sí, pero NO en Render free tier**. Zoho SMTP usa puerto 587 que está bloqueado en Render free. Opciones:

1. **SendGrid** (gratis, recomendado) ✅
2. **Render Paid Plan** ($7/mes para desbloquear puertos)
3. **Otro hosting** que no bloquee puertos SMTP

### ¿Los emails llegarán desde mi dominio de Zoho?

**Sí**, si configuras correctamente:
- `SMTP_FROM=info@viajaya.com.co`
- Verificas el dominio o email en SendGrid

Los destinatarios verán: **"De: Viaja Ya <info@viajaya.com.co>"**

### ¿Cuántos emails puedo enviar?

**Plan Free de SendGrid**: 100 emails/día
**Plan Essentials**: $19.95/mes = 50,000 emails/mes

### ¿Qué pasa si no verifico el dominio?

SendGrid puede marcar tus emails como spam o no entregarlos. **La verificación es crítica**.

### ¿Puedo usar Gmail en lugar de Zoho?

Sí, solo cambia `SMTP_FROM=tu-email@gmail.com` y verifica ese email en SendGrid.

---

## 🔍 Troubleshooting

### Error: "The from address does not match a verified Sender Identity"

**Solución**: Verifica tu email/dominio en SendGrid (Paso 3)

### Error: "Invalid API Key"

**Solución**: 
1. Verifica que la API Key esté correcta en `.env`
2. Revisa que no tenga espacios extra
3. Crea una nueva API Key si es necesario

### Los emails van a SPAM

**Solución**:
1. Completa la verificación de dominio (registros DNS)
2. Agrega registro SPF: `v=spf1 include:sendgrid.net ~all`
3. Agrega registro DMARC: `v=DMARC1; p=none;`

---

## 📚 Recursos

- [SendGrid Docs](https://docs.sendgrid.com/)
- [Verificación de Dominio](https://docs.sendgrid.com/ui/account-and-settings/how-to-set-up-domain-authentication)
- [API Keys](https://docs.sendgrid.com/ui/account-and-settings/api-keys)
- [Zoho DNS Settings](https://www.zoho.com/mail/help/adminconsole/domain-settings.html)

---

## ✅ Checklist Final

- [ ] Cuenta SendGrid creada
- [ ] API Key generada y guardada
- [ ] Email/Dominio verificado en SendGrid
- [ ] `SENDGRID_API_KEY` en `.env` local
- [ ] `SENDGRID_API_KEY` en Render
- [ ] `SMTP_FROM` configurado con tu email de Zoho
- [ ] Email de prueba enviado correctamente
- [ ] Email recibido y no está en spam

**¡Listo para producción!** 🚀
