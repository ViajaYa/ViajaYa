# 📧 Guía para Configurar Zoho Mail - Cliente ViajaYa

## ¿Qué necesitamos?

Para que el sistema pueda enviar emails desde tu dominio `@viajaya.com.co`, necesitamos configurar el acceso SMTP de Zoho Mail. Esta guía te explica paso a paso cómo obtener toda la información necesaria.

---

## 📋 Datos que necesitamos de ti

Al finalizar esta guía, deberás proporcionarnos:

1. ✅ **Email completo**: `asistenciagerencia@viajaya.com.co` (ya lo tenemos)
2. 🔑 **Contraseña de aplicación de Zoho** (la generaremos juntos)
3. ✅ **Servidor SMTP**: `smtp.zoho.com` (ya configurado)
4. ✅ **Puerto**: `587` (ya configurado)

---

## 🚀 Pasos para obtener la contraseña de aplicación

### **Opción A: Sin autenticación de dos factores (2FA)**

Si **NO** tienes activada la verificación en dos pasos en tu cuenta de Zoho:

#### 1. Iniciar sesión en Zoho Mail
- Ve a: **https://mail.zoho.com**
- Inicia sesión con tu cuenta: `asistenciagerencia@viajaya.com.co`

#### 2. Obtener tu contraseña
- **Usa tu contraseña habitual de Zoho Mail** directamente
- Proporciónanosla de forma segura (WhatsApp, llamada, etc.)

⚠️ **Nota**: Si Zoho bloquea el acceso por "seguridad", sigue los pasos de la Opción B.

---

### **Opción B: Con autenticación de dos factores (2FA) - RECOMENDADO**

Si tienes activada la verificación en dos pasos (más seguro), necesitas crear una **contraseña de aplicación específica**:

#### 1. Acceder a tu cuenta de Zoho
- Ve a: **https://accounts.zoho.com**
- Inicia sesión con tu cuenta: `asistenciagerencia@viajaya.com.co`

#### 2. Ir a configuración de seguridad
- Haz clic en tu **foto de perfil** (esquina superior derecha)
- Selecciona **"My Account"** o **"Mi Cuenta"**
- En el menú lateral, busca **"Security"** o **"Seguridad"**

#### 3. Generar contraseña de aplicación
- Dentro de Security, busca la sección **"App Passwords"** o **"Contraseñas de aplicación"**
- Haz clic en **"Generate New Password"** o **"Generar nueva contraseña"**

#### 4. Configurar la contraseña
Verás un formulario como este:

```
┌─────────────────────────────────────────┐
│ Generate App-Specific Password          │
├─────────────────────────────────────────┤
│                                         │
│ App Name: [ViajaYa Backend System    ] │
│                                         │
│          [Generate Password Button]     │
└─────────────────────────────────────────┘
```

- **App Name**: Escribe `ViajaYa Backend System` (o el nombre que prefieras)
- Haz clic en **"Generate"** o **"Generar"**

#### 5. Copiar la contraseña generada
- Zoho te mostrará una contraseña de 16 caracteres (algo como: `abcd efgh ijkl mnop`)
- **⚠️ IMPORTANTE**: Esta contraseña solo se muestra UNA VEZ
- **Copia la contraseña completa** (incluyendo espacios si los tiene)
- Guárdala temporalmente en un lugar seguro

#### 6. Enviarnos la contraseña
- Envíanos la contraseña por un canal seguro (WhatsApp, email, llamada)
- La usaremos SOLO para configurar el sistema de envío de emails

---

## 🔒 Verificar acceso SMTP en Zoho Mail

Antes de generar la contraseña, verifica que el acceso SMTP esté habilitado:

### 1. Acceder a Zoho Mail
- Ve a: **https://mail.zoho.com**
- Inicia sesión

### 2. Ir a Configuración
- Haz clic en el **ícono de engranaje** ⚙️ (esquina superior derecha)
- Selecciona **"Mail Accounts Settings"** o **"Configuración de cuentas"**

### 3. Habilitar acceso SMTP
- Busca la pestaña **"IMAP/POP Access"** o **"Acceso IMAP/POP"**
- Verifica que esté **habilitado** el acceso SMTP/IMAP
- Si está deshabilitado, actívalo con el switch

Debería verse algo así:
```
┌─────────────────────────────────────────┐
│ IMAP Access                             │
│ ● Enabled  ○ Disabled                   │
│                                         │
│ POP Access                              │
│ ● Enabled  ○ Disabled                   │
│                                         │
│ SMTP Details:                           │
│ Server: smtp.zoho.com                   │
│ Port: 587 (TLS) or 465 (SSL)           │
└─────────────────────────────────────────┘
```

---

## 📤 Información de configuración SMTP (referencia)

Una vez tengamos tu contraseña, nosotros configuraremos:

| **Campo** | **Valor** |
|-----------|-----------|
| **Servidor SMTP** | `smtp.zoho.com` |
| **Puerto** | `587` (STARTTLS) |
| **Seguridad** | STARTTLS (TLS) |
| **Usuario** | `asistenciagerencia@viajaya.com.co` |
| **Contraseña** | La contraseña de aplicación que generes |
| **Email remitente** | `asistenciagerencia@viajaya.com.co` |

---

## ❓ Preguntas frecuentes

### **¿Es seguro compartir mi contraseña?**
- **Opción 1 (contraseña normal)**: Es tu contraseña de Zoho, así que úsala con precaución.
- **Opción 2 (contraseña de aplicación)**: Es MÁS SEGURA porque es específica para esta aplicación y puedes revocarla en cualquier momento sin cambiar tu contraseña principal.

### **¿Puedo revocar el acceso más tarde?**
Sí, si usas **contraseña de aplicación**:
1. Ve a **Zoho Accounts** → **Security** → **App Passwords**
2. Busca "ViajaYa Backend System"
3. Haz clic en **"Revoke"** o **"Revocar"**

### **¿Qué pasa si no funciona?**
Posibles causas:
- Contraseña incorrecta (verifica espacios o mayúsculas)
- Acceso SMTP deshabilitado en Zoho Mail
- Restricciones de seguridad de Zoho (revisa tu email por alertas)

---

## 📞 ¿Necesitas ayuda?

Si tienes problemas siguiendo estos pasos:
1. Toma **capturas de pantalla** de la sección donde te quedaste
2. Envíanoslas junto con una descripción del problema
3. Te ayudaremos a resolverlo

---

## ✅ Checklist final

Antes de enviarnos la información, verifica:

- [ ] Has iniciado sesión en Zoho Mail correctamente
- [ ] El acceso SMTP está habilitado en configuración de Zoho
- [ ] Has generado la contraseña de aplicación (si tienes 2FA)
- [ ] Tienes la contraseña copiada y lista para compartir
- [ ] Has verificado que el email es: `asistenciagerencia@viajaya.com.co`

---

## 📨 Enviar la información

**Una vez tengas todo listo, envíanos:**

```
Email: asistenciagerencia@viajaya.com.co
Contraseña: [tu contraseña de aplicación aquí]
¿Tienes 2FA activado?: [Sí/No]
```

¡Listo! Nosotros nos encargamos del resto de la configuración.

---

**Última actualización**: Enero 2026  
**Equipo técnico ViajaYa**
