# 📧 Configuración de Resend - ViajaYa

## ¿Por qué Resend?

- ✅ **100 emails/día gratis** (más que SendGrid)
- ✅ **API HTTP** (funciona en Railway, no usa SMTP bloqueado)
- ✅ **Configuración en 5 minutos**
- ✅ **Permite enviar desde tu dominio** `@viajaya.com.co`
- ✅ **Moderna y fácil de usar**

---

## 🚀 Pasos de Configuración

### **1. Crear cuenta en Resend**

1. Ve a: **https://resend.com/signup**
2. Regístrate con tu email
3. Verifica tu email

### **2. Obtener API Key**

1. En el dashboard, ve a **API Keys** (menú lateral)
2. Haz clic en **"Create API Key"**
3. Configura:
   - **Name**: `ViajaYa Production`
   - **Permission**: `Sending access` (Full access no es necesario)
   - **Domain**: `All domains` (o selecciona `viajaya.com.co` si ya lo verificaste)
4. Haz clic en **"Create"**
5. **Copia la API Key** (empieza con `re_...`)
   - ⚠️ **Solo se muestra una vez**, guárdala en lugar seguro

### **3. Verificar tu dominio (Opcional pero recomendado)**

Para enviar desde `asistenciagerencia@viajaya.com.co` en lugar de `onboarding@resend.dev`:

#### 3.1. Agregar dominio en Resend

1. Ve a **Domains** en el menú lateral
2. Haz clic en **"Add Domain"**
3. Ingresa: `viajaya.com.co`
4. Resend te mostrará **registros DNS** para agregar

#### 3.2. Configurar DNS en Zoho

Resend te dará 3 registros DNS:

```
Tipo: TXT
Nombre: resend._domainkey
Valor: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GN...
```

**Pasos en Zoho:**

1. Ve a tu panel de administración de dominio (donde gestionas DNS)
2. Si usas **Zoho Mail**, ve a: https://mailadmin.zoho.com
3. **Domains** → **viajaya.com.co** → **DNS Settings**
4. Agrega los 3 registros que Resend te proporcionó
5. Espera 24-48 horas para propagación DNS
6. Vuelve a Resend y verifica el dominio

⚠️ **Nota**: Si no verificas el dominio, los emails se enviarán desde `onboarding@resend.dev` pero mostrarán tu email en Reply-To.

---

## 🔧 Configuración en el Proyecto

### **Desarrollo Local (.env)**

Tu archivo `.env` ya está configurado para usar Zoho SMTP en desarrollo local:

```env
# Zoho SMTP para desarrollo local (funciona)
SMTP_HOST=smtp.zoho.com
SMTP_PORT=587
SMTP_USER=asistenciagerencia@viajaya.com.co
SMTP_PASSWORD=C4mila22#
SMTP_FROM=asistenciagerencia@viajaya.com.co
```

### **Producción Railway**

Configura estas variables en Railway:

```env
RESEND_API_KEY=re_tu_api_key_aqui
SMTP_FROM=asistenciagerencia@viajaya.com.co
```

**Pasos en Railway:**

1. Ve a tu proyecto en Railway
2. Selecciona tu servicio de backend
3. Ve a la pestaña **Variables**
4. **Elimina o comenta** estas variables si existen:
   - `SENDGRID_API_KEY`
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASSWORD`
5. **Agrega estas nuevas variables**:
   ```
   RESEND_API_KEY = re_tu_api_key_de_resend
   SMTP_FROM = asistenciagerencia@viajaya.com.co
   ```
6. Railway reiniciará automáticamente el servicio

---

## 📊 Prioridad de Servicios de Email

El sistema selecciona automáticamente en este orden:

1. **Resend** (si `RESEND_API_KEY` existe) ← Producción en Railway
2. **SendGrid** (si `SENDGRID_API_KEY` existe)
3. **SMTP** (Zoho/Gmail/otro) ← Desarrollo local

---

## ✅ Verificar que funciona

### En la consola del servidor verás:

```bash
📧 Usando Resend API HTTP para envío de emails
✅ Resend API configurada correctamente
```

### Al enviar un email:

```bash
📤 Preparando envío de email a: cliente@example.com
📧 Enviando desde (Resend API): asistenciagerencia@viajaya.com.co
✅ Email enviado exitosamente vía Resend API
📊 Resend response ID: abc123-def456-ghi789
```

---

## 🔍 Monitoreo y Logs

### Dashboard de Resend

1. Ve a **Emails** en el menú lateral
2. Verás todos los emails enviados con:
   - Estado (Delivered, Bounced, etc.)
   - Destinatario
   - Asunto
   - Fecha/hora
   - ID del email

### Límites del Plan Gratuito

- **100 emails/día**
- **Sin costo**
- **Sin tarjeta de crédito requerida**

### Upgrade (si necesitas más)

- **$20/mes**: 50,000 emails/mes
- **Custom**: Planes empresariales

---

## ❓ Preguntas Frecuentes

### **¿Puedo usar mi dominio sin verificarlo?**

Sí, pero los emails se enviarán desde `onboarding@resend.dev` con tu email en Reply-To. Para usar tu dominio real, debes verificarlo en DNS.

### **¿Qué pasa si excedo los 100 emails/día?**

Los emails adicionales se quedarán en cola y fallarán. Considera actualizar al plan de pago.

### **¿Funcionará en Railway?**

Sí, Resend usa **API HTTP**, no SMTP, por lo que NO está bloqueado en Railway.

### **¿Puedo seguir usando Zoho SMTP en local?**

Sí, el sistema usa automáticamente SMTP (Zoho) si no hay `RESEND_API_KEY` configurada. Perfecto para desarrollo local.

---

## 🆚 Comparación: Resend vs SendGrid vs SMTP

| Característica | Resend | SendGrid | Zoho SMTP |
|---|---|---|---|
| **Límite gratis** | 100/día | 100/día | Según plan |
| **Funciona en Railway** | ✅ Sí | ✅ Sí | ❌ No (puerto bloqueado) |
| **Configuración** | 5 minutos | Verificación DNS | Solo credenciales |
| **Documentación** | Excelente | Buena | Regular |
| **Soporte** | Email | Email | Email |

---

## 📝 Checklist de Implementación

- [ ] Crear cuenta en Resend
- [ ] Obtener API Key
- [ ] (Opcional) Verificar dominio en DNS
- [ ] Configurar `RESEND_API_KEY` en Railway
- [ ] Configurar `SMTP_FROM` en Railway
- [ ] Eliminar variables SMTP de Railway
- [ ] Reiniciar servicio en Railway
- [ ] Probar envío de cotización
- [ ] Verificar email recibido correctamente

---

## 🎯 Próximos Pasos

1. **Crea tu cuenta en Resend**: https://resend.com/signup
2. **Obtén tu API Key**
3. **Configura en Railway** las dos variables necesarias
4. **Prueba el envío** de una cotización
5. **(Opcional) Verifica tu dominio** para enviar desde `@viajaya.com.co`

---

## 📞 Soporte

- **Documentación Resend**: https://resend.com/docs
- **Ejemplos de código**: https://resend.com/docs/send-with-nodejs
- **Status de Resend**: https://resend.com/status

---

**Última actualización**: Enero 2026  
**Equipo técnico ViajaYa**
