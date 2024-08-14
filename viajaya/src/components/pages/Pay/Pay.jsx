import ShortNav from '../../layout/ShortNav/ShortNav';
import style from './Pay.module.css'
import {Link, useNavigate} from "react-router-dom"
import {MdBusAlert, MdPayment} from "react-icons/md"
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { useState } from 'react';
import {Toaster, toast} from "react-hot-toast" 
import dayjs from "dayjs"
import {Navigate} from "react-router-dom"

const Pay = () => {

  const [passenger, setPassenger] = useState()
  const [pack, setPack] = useState()
  const [promo, setPromo] = useState()
  const refe = new Date().getTime().toString()
  const dataPay = JSON.parse(localStorage.getItem("pay"))
  const [user,setUser]= useState()
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if(dataPay?.id !== "promo"){
    axios.get(`/pack/${dataPay?.id}`).then(data => setPack(data.data))
    axios.get(`/user/verify/${localStorage.getItem("token")}`).then(data => {setUser(data.data); setTimeout(() => {
      setLoading(false)
    }, 500)})
  }else{
    axios.get(`/promo`).then(data => setPromo(data.data))
    axios.get(`/user/verify/${localStorage.getItem("token")}`).then(data => {setUser(data.data); setTimeout(() => {
      setLoading(false)
    }, 500)})
  }
  },[])

  if(localStorage.getItem("token") == null){
    return <Navigate to="/login" replace />
}

  const pay = () => {
    const total = `${dataPay?.person*pack?.price}00`
    var checkout = new WidgetCheckout({
      currency: 'COP',
      amountInCents: total,
      reference: refe,
      publicKey: 'pub_prod_HEgZ1pvNEzFzbZvyz6TYo9uhUghfZDGi',
      // publicKey: 'pub_test_w28dxS2v9clmkb8UbFrlkw3GxBUx3bsq',
    })
    checkout.open(function ( result ) {
      var transaction = result.transaction
      if(transaction.status == "APPROVED"){
        toast.success("Compra exitosa")
        axios.post("/buy",{
          transaction: transaction,
          userId:user.id,
          packId:pack.id,
          reserva:false,
          person: dataPay.person,
          inicio:dataPay.inicio,
          fin:dataPay.fin,
          email: user.email,
          passenger: passenger,
          comprado: dayjs().format('YYYY-MM-DD'),
        })
        // TODO: ENVIAR COMPROBANTE Y DATOS DE LOS PASAJEROS AL CORREO DE VIAJAYA
        setTimeout(() => {
          navigate("/profile")
        },2000)
      }else{
        toast.error("No pudimos realizar el pago")
      }
    })
  }

  const payreserva = () => {
    const total = `${dataPay?.person*pack?.reserva}00`
    var checkout = new WidgetCheckout({
      currency: 'COP',
      amountInCents: total,
      reference: refe,
      publicKey: 'pub_prod_HEgZ1pvNEzFzbZvyz6TYo9uhUghfZDGi',
    })
    checkout.open(function ( result ) {
      var transaction = result.transaction
      if(transaction.status == "APPROVED"){
        toast.success("Compra exitosa")
        axios.post("/buy",{
          transaction: transaction,
          userId:user.id,
          packId:pack.id,
          person: dataPay.person,
          reserva: true,
          inicio:dataPay.inicio,
          fin:dataPay.fin,
          email: user.email,
          passenger: passenger,
          comprado: dayjs().format('YYYY-MM-DD'),
        })
        // TODO: ENVIAR COMPROBANTE Y DATOS DE LOS PASAJEROS AL CORREO DE VIAJAYA
        setTimeout(() => {
          navigate("/profile")
        },2000)
      }else{
        toast.error("No pudimos realizar el pago")
      }
    })
  }

  const pay2 = () => {
    const total = `${dataPay?.person*promo?.price}00`
    var checkout = new WidgetCheckout({
      currency: 'COP',
      amountInCents: total,
      reference: refe,
      publicKey: 'pub_prod_HEgZ1pvNEzFzbZvyz6TYo9uhUghfZDGi',
    })
    checkout.open(function ( result ) {
      var transaction = result.transaction
      if(transaction.status == "APPROVED"){
        toast.success("Compra exitosa")
        axios.post("/buy",{
          transaction: transaction,
          userId:user.id,
          packId:"promo",
          person: dataPay.person,
          inicio:dataPay.inicio,
          reserva:false,
          fin:dataPay.fin,
          email: user.email,
          passenger: passenger,
          comprado: dayjs().format('YYYY-MM-DD'),
        })
        // TODO: ENVIAR COMPROBANTE Y DATOS DE LOS PASAJEROS AL CORREO DE VIAJAYA
        setTimeout(() => {
          navigate("/profile")
        },2000)
      }else{
        toast.error("No pudimos realizar el pago")
      }
    })
  }

  const handlePassengers = (e) => {
    setPassenger({
      ...passenger,
      [e.target.name] : e.target.value
    })
  }

  const passengers = Array.from({ length: dataPay?.person }, (_, index) => {
    if(index == 0) return (<><p className={style.passenger}>Titular</p>
    <form className={style.form}>
      <input className={style.inputForm} name={`name${index+1}`} value={passenger && passenger[`name${index+1}`]} onChange={handlePassengers} placeholder="Nombre completo"/>
      <input className={style.inputForm} name={`doc${index+1}`} value={passenger &&passenger[`doc${index+1}`]} onChange={handlePassengers} placeholder="Documento"/>
      <input className={style.inputForm} name={`phone${index+1}`} value={passenger &&passenger[`phone${index+1}`]} onChange={handlePassengers} placeholder="Numero de contacto"/>
      <input className={style.inputForm} name={`location${index+1}`} value={passenger &&passenger[`location${index+1}`]} onChange={handlePassengers} placeholder="Direccion y ciudad"/>
      <input className={style.inputForm} type="date" name={`date${index+1}`} value={passenger &&passenger[`date${index+1}`]} onChange={handlePassengers} placeholder="Fecha de nacimiento"/>
      <input className={style.inputForm} name={`mail${index+1}`} value={passenger &&passenger[`mail${index+1}`]} onChange={handlePassengers} placeholder="Email"/>
    </form></>)
    return (<><p className={style.passenger}>Pasajero {index+1}</p>
    <form className={style.form}>
      <input className={style.inputForm} name={`name${index+1}`} value={passenger && passenger[`name${index+1}`]} onChange={handlePassengers} placeholder="Nombre completo"/>
      <input className={style.inputForm} name={`doc${index+1}`} value={passenger &&passenger[`doc${index+1}`]} onChange={handlePassengers} placeholder="Documento"/>
      <input className={style.inputForm} type="date" name={`date${index+1}`} value={passenger &&passenger[`date${index+1}`]} onChange={handlePassengers} placeholder="Fecha de nacimiento"/>
    </form></>)})

    const subtotal = dataPay?.person*pack?.price
    const subtotalr = dataPay?.person*pack?.reserva
    const promoSubtotal = dataPay?.person*promo?.price
  return(
    <>
    <ShortNav/>
    <Toaster/>
    {loading ? <div className={style.ldsellipsis}><div></div><div></div><div></div><div></div></div> :
    dataPay ? <div className={style.detailContainer}>
        <div className={style.detailPay}>
        {dataPay?.id !== "promo" ? <>
            <div className={style.datosComprador}>
              <h2 className={style.title}>Revisa y confirma tu compra</h2>
              {passengers}
            </div>
            <div className={style.resumenCompra}>
              <p className={style.resume}>Resumen de la compra</p>
              <div className={style.details}>
              <img src={pack?.images[0]} className={style.imgProduct}/>
              <div>
              <b>{pack?.title}</b>
              <p style={{margin:"3px 0px"}}>{dataPay?.inicio}</p>
              <p style={{margin:"3px 0px"}}>{dataPay?.person} personas</p>
              <p className={style.price}>${pack?.price.toLocaleString()} p/p</p>
              </div>
              </div>
              <p className={style.subtotal}>Subtotal: <b>${subtotal.toLocaleString()}</b></p>
              <p className={style.subtotal}>Subtotal reserva: <b>${subtotalr.toLocaleString()}</b></p>
              <div className={style.buttons}>
                <button className={style.button} onClick={pay}><MdPayment className={style.payIcon}/> Pagar todo</button>
                <button className={style.button} onClick={payreserva}><MdPayment className={style.payIcon}/> Pagar solo reserva</button>
                <Link to="/"><button style={{width:"200px"}} className={style.button}>Seguir comprando</button></Link>
              </div>
            </div></>:<>
            <div className={style.datosComprador}>
              <h2 className={style.title}>Revisa y confirma tu compra</h2>
              {passengers}
            </div>
            <div className={style.resumenCompra}>
              <p className={style.resume}>Resumen de la compra</p>
              <div className={style.details}>
              <img src={promo?.image} className={style.imgProduct}/>
              <div>
              <b>Promocion YA PA YA</b>
              <p style={{margin:"3px 0px"}}>{dataPay?.inicio}</p>
              <p style={{margin:"3px 0px"}}>{dataPay?.person} personas</p>
              <p className={style.price}>${promo?.price.toLocaleString()} p/p</p>
              </div>
              </div>
              <p className={style.subtotal}>Subtotal: <b>${promoSubtotal.toLocaleString()}</b></p>
              <div className={style.buttons}>
                <button className={style.button} onClick={pay2}><MdPayment className={style.payIcon}/> Pagar ahora</button>
                <Link to="/"><button style={{width:"200px"}} className={style.button}>Seguir comprando</button></Link>
              </div>
            </div></>}
        </div>
      </div>: <h1 className={style.clearCar}>Aún no has agregado nada al carrito</h1>}
      </>
  )
};

export default Pay