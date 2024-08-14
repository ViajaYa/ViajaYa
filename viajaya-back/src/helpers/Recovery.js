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
        subject: "Recupera tu cuenta ViajaYa", // Subject line
        html: `
        <p><b>Tu contraseña:</b> ${info.password}</p>
        `, // html body
      });
}