import style from './Paquetes.module.css'
import {Element} from "react-scroll"
import ModalProject from '../../layout/ModalProject/ModalProject';
import { useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { useAnimation, motion} from 'framer-motion';
import { useEffect } from 'react';
import {Link, useNavigate} from "react-router-dom"
import {RiRefreshFill} from "react-icons/ri"
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
import { useRef } from "react";
import { map } from 'leaflet';
import axios from 'axios';
import Select from "react-select"
import {BiCurrentLocation} from "react-icons/bi"
import {filterPacksChar, setPaquetes, filterPacksTitle} from "../../../redux/actions/actions"
import { useDispatch, useSelector } from 'react-redux';
const MAP_LAYER_ATTRIBUTION =
  "&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors";
const MAP_LAYER_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";


const Paquetes = () => {
  const [projectId, setProjectId] = useState(null)
  const {ref, inView} = useInView({
    threshold:0.05
  })
  const animation = useAnimation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const word = useSelector(s => s.word)
  // MAPA

  const [zoom, setZoom] = useState(15)
  const [coord, setCoord] = useState([5.0267284, -74.0093039]);
  const mapRef= useRef()
  const paquetes = useSelector(s => s.paquetes)

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

  const [chars, setChars] = useState()

  useEffect(() => {
    axios.get("/pack").then((data) => dispatch(setPaquetes(data.data)))
    axios.get("/pack/chars").then((data) => setChars(data.data))
  },[])

  const filterPacks = (e) => {
    const chars = e.map(c => c.label)
    dispatch(filterPacksChar(chars))
  }

  const filterPackTitle = (e) => {
    dispatch(filterPacksTitle(e.target.value))
  }

  const options = chars?.map(c => { return {value:c.id,label:c.name}})

  return(
    <>
    { projectId && <ModalProject id={projectId} close={() => setProjectId(null)}/>}
    <Element name="proyectos">
    <motion.div ref={ref} animate={animation} className={style.paquetes} id="proyectos">
      <h2 className={style.titleSection}>Promociones</h2>
      <div className={style.selectContainer}>
        {/* <RiRefreshFill className={style.refresh}/> */}
        <Select placeholder="Caracteristicas" isMulti className={style.select} onChange={filterPacks} options={options}/>
        <input placeholder="Buscar" value={word} onChange={filterPackTitle} className={style.select2}/>
      </div>
      <div className={style.container}>
        <div className={style.paquetesContainer}>
          {paquetes?.map( t =>
          <div className={style.paquete} onMouseOver={() => mapRef.current.flyTo([t.lat,t.lng],15)} onClick={() => navigate(`/detail/${t.id}`)}>
          <div className={style.planTop}>
                <img src={t.images[0]} className={style.imgPlan}/>
                <div className={style.planDetail}>
                  <div className={style.nameAndPrice}>
                    <b className={style.planName}>{t.title}</b>
                    <b className={style.planPrice}>${t.price.toLocaleString()} p/p</b>
                  </div>
                  <p>Hotel maracana - Todo incluido</p>
                  <div className={style.tags}>
                    {t.chars.map(c => <span className={style.tag}>{c.name}</span>)}
                  </div>
                </div>
              </div>
          </div>)}
        </div>
        <div className={style.mapa}>
        <div>
    <div className={style.mapContainer} style={{height:`60vh`,width:`36vw`}}>
      <MapContainer
        ref={mapRef}
        center={coord}
        zoom={zoom}
        scrollWheelZoom={false}
        className={style.map}
        style={{height:`60vh`,width:`36vw`}}
      >
        <TileLayer url={MAP_LAYER_URL} attribution={MAP_LAYER_ATTRIBUTION}/>
        {/* <Marker draggable={true} position={[5.0267284, -74.0093039]} icon={myIcon}>
          <Popup>
            <div>Voy hasta acá</div>
          </Popup>
          </Marker> */}
        {paquetes.map((p,i) => <Marker key={i} icon={iconLogo} position={[p.lat,p.lng]}>
        <Popup>Viaje #{i}</Popup>
      </Marker>)}
      {/* <LocationMarker/> */}
      </MapContainer>
    </div>
    </div>
        </div>
      </div>
    </motion.div>
    </Element>
    </>
  )
};

export default Paquetes