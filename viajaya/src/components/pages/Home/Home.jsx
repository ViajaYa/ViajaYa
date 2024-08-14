import style from './Home.module.css'
import {Element} from "react-scroll" 
import video from "../../../assets/vf.mp4"
import { Link } from "react-scroll";
import { useDispatch } from 'react-redux';
import { filterPacksTitle } from '../../../redux/actions/actions';
import logo from "../../../assets/mascota.png"

const Home = () => {

  const dispatch = useDispatch()

  return(
    <Element name="home">
    <div className={style.home} id="home">
      {/* <div className={style.pantalla}>
        <img className={style.imgfondo}src={fondo}/>
      </div> */}
      <div className={style.videoContainer}>
    <video autoPlay muted loop className={style.video} src={video}/>
    </div>
      <div className={style.nombre}>
        <h1 className={style.nombre1}>Planeemos juntos tus proximas vacaciones</h1>
        <h2 className={style.nombre2}>Somos operador turístico y agencias de viajes ViajaYa con RNT 122035 el canal intermediario que facilita la compra y reserva de vacaciones programadas entre los viajeros y proveedores por medio de plataformas digitales, convenios directos, asesores externos profesionales; resaltando la cultura de los destinos empaquetando {"("}Alojamiento, vuelos, transportes y receptivos{")"} entregando planes turísticos con información verídica cumpliendo con las normas vigentes del turismo</h2>
        <Link to="proyectos" smooth={true} duration={500}><button className={style.button}>Reservar ahora</button></Link>
      </div>
      <img src={logo} className={style.imgLogo}></img>
      <div className={style.videosContainer}>
        <p className={style.titleLlano}>¡Disfruta del llano!</p>
      <Link to="proyectos" onClick={() => dispatch(filterPacksTitle("llanero"))} smooth={true} duration={500}><img src="https://periodico.unal.edu.co/uploads/UN_Periodico_Digital/Imagenes/2021/04-Abril/0408/pm/01-LLanos_cc0.jpg" className={style.videos}/></Link>
      <Link to="proyectos" onClick={() => dispatch(filterPacksTitle("llanero"))} smooth={true} duration={500}><img src="https://www.eltiempo.com/files/image_640_428/files/crop/uploads/2020/09/29/5f73775f1a5e7.r_1601492272849.0-1213-2961-2682.jpeg" className={style.videos}/></Link>
      <Link to="proyectos" onClick={() => dispatch(filterPacksTitle("llanero"))} smooth={true} duration={500}><img src="https://estaticos.elcolombiano.com/binrepository/580x386/0c22/580d365/none/11101/TOPK/mvichada-turismo-159_37841543_20210611122849.jpg" className={style.videos}/></Link>
      </div>
    </div>
    </Element>
  )
};

export default Home