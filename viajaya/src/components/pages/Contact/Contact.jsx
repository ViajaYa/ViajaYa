import style from './Contact.module.css'
import {FiMail, FiPhone} from "react-icons/fi"
import {GrLocation} from "react-icons/gr"
import {Element} from "react-scroll" 
import { Toaster, toast } from 'react-hot-toast';
import { useInView } from 'react-intersection-observer';
import { useAnimation,motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  Tooltip
} from "react-leaflet";
import myIcon from "../../layout/Map/Iconos"
import iconLogo from "../../layout/Map/Icono"
const MAP_LAYER_ATTRIBUTION =
  "&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors";
const MAP_LAYER_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

const Contact = () => {
  
  const [contact, setContact] = useState()
  const mapRef= useRef()
  const {ref, inView} = useInView({
    // threshold:0.1
  })
  const animation = useAnimation()

  const [zoom, setZoom] = useState(8)
  const [center, setCenter] = useState([4.3214043,-73.807862])

  useEffect(() => {
    if(inView){
      animation.start({
        opacity:1,
        transition:{
          type: "spring",
          duration:1,
          bounce:0.3
        }
      })
    }else{
      animation.start({
        opacity:0
      })
    }
  },[inView])

  const changeContact = (e) => {
    setContact({
      ...contact,
      [e.target.name] : e.target.value
    })
  }

  const sendMail = (e) => {
    e.preventDefault()
    if(!contact.name.length || !contact.phone.length || !contact.mail.length || !contact.subject.length || !contact.message.length) return toast.error("Rellena todos los campos")
    axios.post("/user/contact", contact).then((data) => toast.success(data.data.message))
    setContact({
      name:"",
      phone:"",
      mail:"",
      subject:"",
      message:""
    })
  }

  return(
  <Element name="contactanos">
    <Toaster></Toaster>
    <motion.div ref={ref} animate={animation} className={style.contact} id="contactanos">
      <h2 className={style.titleSection}>Trabaja con nosotros</h2>
      <div className={style.contactContainer}>
        <div className={style.infoContacto}>
          <h2 className={style.subtitleSection}>Informacion de contacto</h2>
          <div className={style.correos}>
        <div>
          <FiMail className={style.icon}/>
        </div>
        <div className={style.emails}>
          <h4 className={style.email}>viajaya.hotelesytodoincluido@gmail.com</h4>
        </div>
        </div>
        <div className={style.correos}>
        <div>
        <FiPhone className={style.icon}/>
        </div>
        <div className={style.numbers}>
          <a className={style.noLink} target="_blank" href="https://wa.link/28unmk"><h4 className={style.number}>{"(+57)"} 310 3361235</h4></a>
          {/* <a className={style.noLink} target="_blank" href="https://bit.ly/3MQvqXe"><h4 className={style.number}>{"(+57)"} NUMBER2</h4></a> */}
        </div>
        </div>
        <div className={style.locations} onMouseLeave={() => mapRef.current.flyTo(center,zoom)} onMouseOver={() => mapRef.current.flyTo([4.2614043,-73.567862],15)}>
        <div>
        <GrLocation className={style.icon}/>
        </div>
        <div className={style.numbers}>
          <h4 className={style.direccion}>Restrepo Meta- Centro Comercial Plaza Roma Calle 7 No 5-48 oficina 105</h4>
        </div>
        </div>
        <div className={style.locations} onMouseLeave={() => mapRef.current.flyTo(center,zoom)} onMouseOver={() => mapRef.current.flyTo([4.3911921,-74.2122951],15)}>
        <div>
        <GrLocation className={style.icon}/>
        </div>
        <div className={style.numbers}>
          <h4 className={style.direccion}>Bogota Calle 38A Sur No 34d-51 </h4>
          {/* <a className={style.noLink} target="_blank" href="https://bit.ly/3MQvqXe"><h4 className={style.direccion}>{"(+57)"} NUMBER2</h4></a> */}
        </div>
        </div>
        <div className={style.locations} onMouseLeave={() => mapRef.current.flyTo(center,zoom)} onMouseOver={() => mapRef.current.flyTo([4.582409,-74.1593002],15)}>
        <div>
        <GrLocation className={style.icon}/>
        </div>
        <div className={style.numbers}>
          <h4 className={style.direccion}>Av. Villavicencio Tv. 63 Bogotá piso 2</h4>
          {/* <a className={style.noLink} target="_blank" href="https://bit.ly/3MQvqXe"><h4 className={style.direccion}>{"(+57)"} NUMBER2</h4></a> */}
        </div>
        </div>
        <div className={style.mapa}>
        <div>
    <div className={style.mapContainer}>
      <MapContainer
        ref={mapRef}
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        className={style.map}
      >
        <TileLayer url={MAP_LAYER_URL} attribution={MAP_LAYER_ATTRIBUTION}/>
        <Marker icon={iconLogo} position={[4.2614043,-73.567862]}>
        </Marker>
        <Marker icon={iconLogo} position={[4.3911921,-74.2122951]}>
        </Marker>
        <Marker icon={iconLogo} position={[4.582409,-74.1593002]}>
        </Marker>
      </MapContainer>
    </div>
    </div>
        </div>
        </div>
        <form className={style.formContacto}>
          <div className={style.divisores}>
          <input className={style.input} onChange={changeContact} value={contact?.name} name="name" placeholder="Nombre"/>
          <input className={style.input} onChange={changeContact} value={contact?.phone} name="phone" placeholder="Telefono"/>
          </div>
          <div className={style.divisores}>
          <input className={style.input} onChange={changeContact} value={contact?.mail} name="mail" placeholder="Correo"/>
          <input className={style.input} onChange={changeContact} value={contact?.subject} name="subject" placeholder="Asunto"/>
          </div>
          <textarea className={style.inputsms} onChange={changeContact} value={contact?.message} name="message" placeholder="Mensaje"/>
          <button onClick={sendMail} className={style.button}>Enviar</button>
        </form>
      </div>
    </motion.div>
    </Element>
  )
};

export default Contact