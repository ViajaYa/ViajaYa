const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');
const { Resend } = require('resend');
require('dotenv').config();

// Detectar qué servicio de email usar (prioridad: Resend > SendGrid > SMTP)
const useResend = !!process.env.RESEND_API_KEY;
const useSendGrid = !useResend && !!process.env.SENDGRID_API_KEY;

let transporter;
let resend;

if (useResend) {
  // Configuración con Resend API HTTP (RECOMENDADO)
  console.log('📧 Usando Resend API HTTP para envío de emails');
  resend = new Resend(process.env.RESEND_API_KEY);
  console.log('✅ Resend API configurada correctamente');
} else if (useSendGrid) {
  // Configuración con SendGrid API HTTP (NO SMTP)
  console.log('📧 Usando SendGrid API HTTP para envío de emails');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('✅ SendGrid API configurada correctamente');
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

  // Para SMTP tradicional, intentamos verificar la conexión
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Error al verificar SMTP:', error.message);
    } else {
      console.log('✅ Servidor SMTP listo para enviar correos');
    }
  });
}

// Función para enviar el correo
const sendEmail = async (mailOptions) => {
  try {
    console.log('📤 Preparando envío de email a:', mailOptions?.to);
    
    if (!mailOptions || !mailOptions.to || !mailOptions.to.includes('@')) {
       console.error('❌ Error: Destinatario inválido:', mailOptions?.to);
       return;
    }

    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
    const fromName = 'Viaja Ya';

    if (useResend) {
      // Usar Resend API HTTP
      const emailData = {
        from: `${fromName} <${fromEmail}>`,
        to: [mailOptions.to],
        subject: mailOptions.subject,
        html: mailOptions.html,
      };

      // Agregar adjuntos si existen
      if (mailOptions.attachments && mailOptions.attachments.length > 0) {
        emailData.attachments = mailOptions.attachments.map(att => ({
          content: att.content, // Ya viene en base64
          filename: att.filename,
        }));
      }

      console.log('📧 Enviando desde (Resend API):', fromEmail);
      const { data, error } = await resend.emails.send(emailData);
      
      if (error) {
        console.error('❌ Error de Resend:', error);
        throw new Error(error.message);
      }
      
      console.log('✅ Email enviado exitosamente vía Resend API');
      console.log('📊 Resend response ID:', data.id);
      return { messageId: data.id };
      
    } else if (useSendGrid) {
      // Usar SendGrid API HTTP
      const msg = {
        to: mailOptions.to,
        from: {
          email: fromEmail,
          name: fromName
        },
        subject: mailOptions.subject,
        html: mailOptions.html,
      };

      // Agregar adjuntos si existen (ya deben venir en base64)
      if (mailOptions.attachments && mailOptions.attachments.length > 0) {
        msg.attachments = mailOptions.attachments.map(att => ({
          content: att.content, // Ya viene en base64 desde el controller
          filename: att.filename,
          type: att.type || att.contentType || 'application/pdf',
          disposition: att.disposition || 'attachment'
        }));
      }

      console.log('📧 Enviando desde (SendGrid API):', msg.from.email);
      const response = await sgMail.send(msg);
      console.log('✅ Email enviado exitosamente vía SendGrid API');
      console.log('📊 SendGrid response:', response[0].statusCode);
      return { messageId: response[0].headers['x-message-id'] };
    } else {
      // Usar SMTP tradicional (nodemailer)
      const optionsToSend = {
        from: `"${fromName}" <${fromEmail}>`,
        ...mailOptions,
      };

      console.log('📧 Enviando desde (SMTP):', optionsToSend.from);
      let info = await transporter.sendMail(optionsToSend);
      console.log('✅ Correo enviado exitosamente vía SMTP. ID:', info.messageId);
      return info;
    }
  } catch (error) {
    console.error('❌ Error al enviar email:', error.message);
    if (error.response) {
      console.error('📋 Detalles del error:', error.response.body || error.response);
    }
    throw error;
  }
};

module.exports = { sendEmail };