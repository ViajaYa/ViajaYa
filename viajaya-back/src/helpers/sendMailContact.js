const nodemailer = require("nodemailer")

module.exports = async (info) => {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          // TODO: replace `user` and `pass` values from <https://forwardemail.net>
          user: 'edgarrios412@gmail.com',
          pass: 'scefolxtxfuqtgqy'
        }
      });

      await transporter.sendMail({
        from: '"Viaja Ya!" <viajaya@gmail.com>', // sender address
        to:  `${info.email}, edgarrios412@gmail.com`, // list of receivers
        subject: "Mensaje desde ViajaYa.com", // Subject line
        html: `
        <h2>Has recibido un mensaje desde la pagina</h2>
        <br></br>
        <p><b>Nombre:</b> ${info.name}</p>
        <p><b>Telefono:</b> ${info.phone}</p>
        <p><b>Email:</b> ${info.mail}</p>
        <p><b>Asunto:</b> ${info.subject}</p>
        <p><b>Mensaje:</b> ${info.message}</p>
        `, // html body
      });
}