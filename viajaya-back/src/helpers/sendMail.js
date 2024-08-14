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
      console.log(info.passenger)
      const pasajeros = Array.from({ length: info.person }, (_, index) => {
        if(index == 0) return (`<p className={style.passenger}>Titular</p>
        <p><b>Nombre:</b> ${info.passenger[`name${index+1}`]}</p>
        <p><b>Documento:</b> ${info.passenger[`doc${index+1}`]}</p>
        <p><b>Telefono:</b> ${info.passenger[`phone${index+1}`]}</p>
        <p><b>Email:</b> ${info.passenger[`mail${index+1}`]}</p>
        <p><b>Direccion:</b> ${info.passenger[`location${index+1}`]}</p>
        <p><b>Fecha de nacimiento:</b> ${info.passenger[`date${index+1}`]}</p>
        <br></br>
        `)
        return(`<p className={style.passenger}>Pasajero ${index+1}</p>
        <p><b>Nombre:</b> ${info.passenger[`name${index+1}`]}</p>
        <p><b>Documento:</b> ${info.passenger[`doc${index+1}`]}</p>
        <p><b>Fecha de nacimiento:</b> ${info.passenger[`date${index+1}`]}</p>
        <br></br>
        `)
      })

      await transporter.sendMail({
        from: '"Viaja Ya!" <viajaya@gmail.com>', // sender address
        to:  `${info.email}, edgarrios412@gmail.com`, // list of receivers
        subject: "Comprobante de pago", // Subject line
        html: `
        <h2>Comprobante de pago</h2>
        ${info.reserva ? "<p><b>Pago de reserva</b></p>":"<p><b>Pago completo</b></p>"}
        <br></br>
        <p><b>ID de la transacción </b>${info.transaction.id}</p>
        <p><b>Referencia:</b> ${info.transaction.reference}</p>
        <p><b>Pagado:</b> ${info.transaction.amountInCents/100} COP</p>
        <p><b>Telefono del comprador:</b> ${info.transaction.customerData.phoneNumber}</p>
        <p><b>Metodo de pago:</b> ${info.transaction.paymentMethod.type}</p>
        <p><b>Estado:</b> ${info.transaction.status}</p>
        <br></br><br></br>
        <h2>Detalles del paquete</h2>
        <p><b>Fecha de inicio:</b> ${info.inicio}</p>
        <p><b>Fecha de fin:</b> ${info.fin}</p>
        <p><b>Personas:</b> ${info.person}</p>
        <br></br>
        <h3>Pasajeros<h4/>
        ${pasajeros}
        `, // html body
      });
}