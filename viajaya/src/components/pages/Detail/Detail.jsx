import { useEffect, useState } from 'react';
import Modal from '../../layout/Modal/Modal';
import style from './Detail.module.css'
import { Link, useNavigate, useParams } from 'react-router-dom';
import ShortNav from '../../layout/ShortNav/ShortNav';
import axios from 'axios';
import {toast, Toaster} from "react-hot-toast"
import "flatpickr/dist/themes/light.css";
import Flatpickr from "react-flatpickr";
import { Spanish } from "flatpickr/dist/l10n/es.js";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { useDispatch } from 'react-redux';
import { setDataPay } from '../../../redux/actions/actions';
import {Navigate} from "react-router-dom"
import { GrRestaurant } from 'react-icons/gr';

dayjs.locale("es");
 
const Detail = () => {
    const {id} = useParams()
    const [open, setOpen] = useState(false)
    const [promo, setPromo] = useState()
    const navigate= useNavigate()
    const [count, setCount] = useState(1)
    const [pack, setPack] = useState()
    const [img, setImg] = useState(0)
    const [disable, setDisable] = useState(["2023-06-10", "2023-06-11"]);
    const [dateFinal, setDateFinal] = useState()
    const [loading, setLoading] = useState(true)
    // const imgs = ["https://img.freepik.com/fotos-premium/impresionante-fondo-playa-verano-paisaje-al-atardecer-formato-cuadrado-banner-icono-pareja-luna-miel_663265-6789.jpg?w=2000","https://media.gettyimages.com/photos/tropical-beach-background-picture-id1145474071","https://img.freepik.com/fotos-premium/impresionante-fondo-playa-verano-paisaje-al-atardecer-formato-cuadrado-banner-icono-pareja-luna-miel_663265-6789.jpg?w=2000"]
  
    useEffect(() => {
      if(id !== "promo"){
      axios.get(`/pack/${id}`).then(data => {setPack(data.data); setTimeout(() => {
        setLoading(false)
      }, 500)})
      }else{
        axios.get(`/promo`).then(data => {setPromo(data.data); setTimeout(() => {
          setLoading(false)
        }, 500)})
      }      
    },[])

    const [fecha, setFecha] = useState()
    const dispatch = useDispatch()

    const addCar = () => {
      if(!fecha) return toast.error("Debes seleccionar una fecha")
      if(id !== "promo"){
      localStorage.setItem("pay", JSON.stringify({id:pack?.id, person: count, inicio:fecha, fin:dateFinal}))
      dispatch(setDataPay({id:pack?.id, person: count, inicio:fecha, fin:dateFinal}))
      }else{
        localStorage.setItem("pay", JSON.stringify({id:"promo", person: count, inicio:fecha, fin:dateFinal}))
      dispatch(setDataPay({id:"promo", person: count, inicio:fecha, fin:dateFinal}))
      }
      navigate("/pay")
    }

    const flatpickrOptions = {
      locale: Spanish,
      minDate: dayjs(new Date()).format("YYYY-MM-DD"),
      enableTime: false,
      disable: disable,
      defaultDate: "Hola",
    };

    const selectDate = (date) => {
      if(id !== "promo"){
        setFecha(date)
      const fechaFinal = new Date(date);
      fechaFinal.setDate(fechaFinal.getDate() + pack?.days);
      setDateFinal(fechaFinal.toISOString().split('T')[0])
      }else{
        setFecha(date)
        const fechaFinal = new Date(date);
      fechaFinal.setDate(fechaFinal.getDate() + promo?.days);
      setDateFinal(fechaFinal.toISOString().split('T')[0])
      }
    }
    if(localStorage.getItem("token") == null){
      return <Navigate to="/login" replace />
  }

  const fechaFinal = (date) => {
    const fechaFinal = new Date(date);
      fechaFinal.setDate(fechaFinal.getDate() + pack?.days);
      return fechaFinal.toISOString().split('T')[0]
  }

  const fechaFinalPromo = (date) => {
    const fechaFinal = new Date(date);
    fechaFinal.setDate(fechaFinal.getDate() + promo?.days);
      return fechaFinal.toISOString().split('T')[0]
  }

    return(
    <>
    <ShortNav/>
    <Toaster/>
    {loading ? <div className={style.ldsellipsis}><div></div><div></div><div></div><div></div></div> :
      <div className={style.detailContainer}>
        {id !== "promo" ? <>
        <div className={style.sliderImg}>
            <img src={pack?.images[0]} onClick={() => setImg(0)} className={style.img}></img>
            <img src={pack?.images[1]} onClick={() => setImg(1)} className={style.img}></img>
            <img src={pack?.images[2]} onClick={() => setImg(2)} className={style.img}></img>
        </div>
        <img src={pack?.images[img]} className={style.bigImg}></img>
        <div className={style.detail}>
            <h2 className={style.title}>{pack?.title}</h2>
            <p className={style.location}>{pack?.location} - Todo incluido</p>
            <b className={style.price}>${pack?.price.toLocaleString()} p/p</b> <span className={style.more} onClick={() => count > 1 ? setCount(count-1) : ""}>-</span><span className={style.cantidad}>{count}</span><span className={style.more} onClick={() => setCount(count+1)}>+</span>
            <select style={{border:"none"}} onChange={(e) => selectDate(e.target.value)}>
            <option selected value={null}>Seleccionar fecha</option>
              {pack?.fechas.map( f => <option value={f}>{f.replaceAll("-","/")} - {fechaFinal(f).replaceAll("-","/")}</option>)}
            </select>
            {/* <Flatpickr
          value={fecha}
          style={{fontFamily:"system-ui", fontSize:"15px",display:"inline-block", width:"77px", padding: "5px 15px", borderRadius: "10px", border: "none" }}
          options={flatpickrOptions}
          // ref={refCalendar}
          placeholder='Fecha inicio'
          onChange={([date]) => selectDate(date)}
            /> */}
            {/* <span style={{fontFamily:"system-ui",fontSize:"15px"}}> - {dateFinal}</span> */}
            <p style={{width:"400px", height:"200px", overflowX:"scroll", whiteSpace: 'pre-line'}}>{pack?.detail}</p>
            <div className={style.tags}>
              {pack?.chars.map(c => <span className={style.tag}>{c.name}</span>)}
                  </div>
            <button onClick={addCar} className={style.addCar}>Comprar paquete</button>
        </div></>:<>
        <img src={promo?.image} className={style.bigImg}></img>
        <div className={style.detail}>
            <h2 className={style.title}>Promocion YA PA YA</h2>
            {/* <p className={style.location}>{pack?.location} - Todo incluido</p> */}
            <b className={style.price}>${promo?.price.toLocaleString()} p/p</b> <span className={style.more} onClick={() => count > 1 ? setCount(count-1) : ""}>-</span><span className={style.cantidad}>{count}</span><span className={style.more} onClick={() => setCount(count+1)}>+</span>
            <select style={{border:"none"}} onChange={(e) => selectDate(e.target.value)}>
            <option selected value={null}>Seleccionar fecha</option>
              {promo?.fechas.map( f => <option value={f}>{f} - {fechaFinalPromo(f).replaceAll("-","/")}</option>)}
            </select>
            {/* <span style={{fontFamily:"system-ui",fontSize:"15px"}}>- {dateFinal}</span> */}
            <p style={{width:"400px", height:"200px", overflowX:"scroll", whiteSpace: 'pre-line'}}>{promo?.details}</p>
            <button onClick={addCar} className={style.addCar}>Comprar paquete</button>
        </div></>
        }
      </div>}
    </>
  )
};

export default Detail