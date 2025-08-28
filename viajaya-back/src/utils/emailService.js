const nodemailer = require('nodemailer');
require('dotenv').config();

// Configurar el transporte de Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true', // true para el puerto 465, false para otros puertos
  auth: {
    user: process.env.SMTP_USER, // Tu correo de Gmail
    pass: process.env.SMTP_PASSWORD, // Tu contraseña de aplicación
  },
  family: 4 // Fuerza IPv4
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
// Endpoint temporal para probar conectividad SMTP desde Railway
const net = require('net');
const addSmtpTestEndpoint = (app) => {
  app.get('/test-smtp', (req, res) => {
    const socket = net.createConnection(465, 'smtp.gmail.com');
    socket.setTimeout(5000);
    socket.on('connect', () => {
      res.send('Conexión SMTP exitosa');
      socket.end();
    });
    socket.on('timeout', () => {
      res.status(500).send('Timeout al conectar al SMTP');
      socket.destroy();
    });
    socket.on('error', (err) => {
      res.status(500).send('Error al conectar al SMTP: ' + err.message);
    });
  });
};

module.exports = { sendEmail, addSmtpTestEndpoint };