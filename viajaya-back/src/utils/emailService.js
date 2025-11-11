const nodemailer = require('nodemailer');
require('dotenv').config();

// Detectar si se usa SendGrid o SMTP tradicional
const useSendGrid = !!process.env.SENDGRID_API_KEY;

let transporter;

if (useSendGrid) {
  // Configuración con SendGrid (API)
  console.log('📧 Usando SendGrid para envío de emails');
  transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false, // STARTTLS
    auth: {
      user: 'apikey', // Usuario fijo para SendGrid
      pass: process.env.SENDGRID_API_KEY,
    },
  });
} else {
  // Configuración SMTP tradicional (Gmail, Zoho SMTP, etc.)
  console.log('📧 Usando SMTP tradicional para envío de emails');
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // false para puerto 587, usa STARTTLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });
}

// Verificar configuración
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Error al verificar la configuración de email:', error.message);
  } else {
    console.log('✅ Servidor de email listo para enviar correos');
  }
});

// Función para enviar el correo
const sendEmail = async (mailOptions) => {
  try {
    console.log('📤 Preparando envío de email a:', mailOptions?.to);
    
    if (!mailOptions || !mailOptions.to || !mailOptions.to.includes('@')) {
       console.error('❌ Error: Destinatario inválido:', mailOptions?.to);
       return;
    }

    // Configurar el remitente (usa SMTP_FROM si está configurado)
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
    const fromName = 'Viaja Ya';
    
    const optionsToSend = {
      from: `"${fromName}" <${fromEmail}>`,
      ...mailOptions,
    };

    console.log('📧 Enviando desde:', optionsToSend.from);

    let info = await transporter.sendMail(optionsToSend);
    console.log('✅ Correo enviado exitosamente. ID:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error al enviar email:', error.message);
    throw error;
  }
};
module.exports = { sendEmail };