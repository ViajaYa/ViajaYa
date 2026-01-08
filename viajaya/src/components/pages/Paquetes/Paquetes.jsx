import style from './Paquetes.module.css';
import { Element } from 'react-scroll';
import ModalProject from '../../layout/ModalProject/ModalProject';
import { useState, useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { useAnimation, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import iconLogo from '../../layout/Map/Icono';
import axios from 'axios';
import Select from 'react-select';
import { filterPacksChar, setPaquetes, filterPacksTitle } from '../../../redux/actions/actions';
import { useDispatch, useSelector } from 'react-redux';

const MAP_LAYER_ATTRIBUTION =
  "&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors";
const MAP_LAYER_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

const Paquetes = () => {
  const [projectId, setProjectId] = useState(null);
  const { ref, inView } = useInView({ threshold: 0.05 });
  const animation = useAnimation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const word = useSelector(s => s.word);
  const [zoom, setZoom] = useState(15);
  const [coord, setCoord] = useState([5.0267284, -74.0093039]);
  const mapRef = useRef();
  const paquetes = useSelector(s => s.paquetes);
  const [chars, setChars] = useState([]);

  useEffect(() => {
    if (inView) {
      animation.start({
        opacity: 1,
        transition: { type: "spring", duration: 1, bounce: 0.3 }
      });
    } else {
      animation.start({ opacity: 0 });
    }
  }, [inView]);

  useEffect(() => {
    axios.get("/pack").then((data) => dispatch(setPaquetes(data.data)));
    axios.get("/pack/chars").then((data) => {
      setChars(Array.isArray(data.data) ? data.data : []);
    }).catch(error => {
      console.error('Error al obtener características:', error);
      setChars([]);
    });
  }, []);

  const filterPacks = (e) => {
    if (!e || !Array.isArray(e)) {
      dispatch(filterPacksChar([]));
      return;
    }
    const chars = e.map(c => c.label);
    dispatch(filterPacksChar(chars));
  };

  const filterPackTitle = (e) => {
    dispatch(filterPacksTitle(e.target.value));
  };

  const options = Array.isArray(chars) ? chars.map(c => ({ value: c.id, label: c.name })) : [];

  return (
    <>
      {projectId && <ModalProject id={projectId} close={() => setProjectId(null)} />}
      <Element name="proyectos">
        <motion.div ref={ref} animate={animation} className={style.paquetes} id="proyectos">
        <h1  className='font-nunito bg-ColorAzul text-gray-700 font-bold p-4 text-2xl w-screen mx-0 px-0 text-center mb-4'>HAZ TU RESERVA</h1>
      
          <div className={style.selectContainer}>
            <Select placeholder="Características" isMulti className={style.select} onChange={filterPacks} options={options} />
            <input placeholder="Buscar" value={word} onChange={filterPackTitle} className={style.select2} />
          </div>
          <div className={style.container}>
            <div className={style.paquetesContainer}>
              {paquetes?.map(t => (
                <div className={style.paquete} onMouseOver={() => mapRef.current.flyTo([t.lat, t.lng], 15)} onClick={() => navigate(`/detail/${t.id}`)} key={t.id}>
                  <div className={style.planTop}>
                    <img src={t.images[0]} className={style.imgPlan} alt={t.title} />
                    <div className={style.planDetail}>
                      <div className={style.nameAndPrice}>
                        <b className={style.planName}>{t.title}</b>
                        <b className={style.planPrice}>${t.price.toLocaleString()} p/p</b>
                      </div>
                      
                      <div className={style.tags}>
                        {t.chars.map(c => <span className={style.tag} key={c.id}>{c.name}</span>)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className={style.mapa}>
              <MapContainer ref={mapRef} center={coord} zoom={zoom} scrollWheelZoom={false} className={style.map}>
                <TileLayer url={MAP_LAYER_URL} attribution={MAP_LAYER_ATTRIBUTION} />
                {paquetes.map((p, i) => (
                  <Marker key={i} icon={iconLogo} position={[p.lat, p.lng]}>
                    <Popup>Viaje #{i}</Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        </motion.div>
      </Element>
    </>
  );
};

export default Paquetes;
