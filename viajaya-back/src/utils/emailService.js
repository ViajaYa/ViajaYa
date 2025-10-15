const nodemailer = require('nodemailer');
require('dotenv').config();

// Configurar el transporte de Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587, // Puerto 587 para STARTTLS
  secure: false, // false para puerto 587, usa STARTTLS
  auth: {
    user: process.env.SMTP_USER, // Tu correo de Gmail
    pass: process.env.SMTP_PASSWORD, // Tu contraseña de aplicación
  },
  tls: {
    // No fallar en certificados inválidos (útil para desarrollo, pero considera eliminar en producción)
    rejectUnauthorized: false
  },
  // Aumentar timeout para conexiones lentas
  connectionTimeout: 10000, // 10 segundos
  greetingTimeout: 10000,
  socketTimeout: 10000,
});
transporter.verify((error, success) => {
  if (error) {
    console.error('Error al verificar la configuración SMTP:', error);
  } else {
    console.log('Servidor SMTP listo para enviar correos');
  }
});

// Función para enviar el correo
const sendEmail = async (mailOptions) => {
  try {
    // *** LOG DETALLADO ***
    console.log('Opciones de correo recibidas en sendEmail:', mailOptions); 
    
    if (!mailOptions || !mailOptions.to || !mailOptions.to.includes('@')) {
       console.error('Error en sendEmail: Destinatario inválido o faltante:', mailOptions?.to);
       // Puedes decidir lanzar un error aquí o simplemente no enviar
       // throw new Error(`Destinatario inválido o faltante: ${mailOptions?.to}`); 
       return; // No intentar enviar si el 'to' es inválido
    }

    // Asegúrate de que el 'from' esté configurado, ya sea aquí o en las opciones por defecto del transporter
    const optionsToSend = {
      from: `"Viaja Ya" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`, // Dirección 'from'
      ...mailOptions, // Incluye 'to', 'subject', 'text', 'attachments', etc.
    };

    // *** LOG DETALLADO ***
    console.log('Opciones finales pasadas a transporter.sendMail:', optionsToSend);

    let info = await transporter.sendMail(optionsToSend);
    console.log('Correo enviado: %s', info.messageId);
    return info;
  } catch (error) {
    // *** LOG DETALLADO ***
    console.error('Error DETALLADO dentro de sendEmail:', error);
    // Propagar el error para que notificationManager lo capture si es necesario
    throw error; 
  }
};
module.exports = { sendEmail };