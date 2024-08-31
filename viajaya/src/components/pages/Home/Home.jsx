import style from './Home.module.css'
import { Element } from "react-scroll"
import { Link } from "react-scroll";
import { useDispatch } from 'react-redux';
import { filterPacksTitle } from '../../../redux/actions/actions';
import logo from "../../../assets/mascota.png"
import CarouselHome from '../../CarouselHome'; // Asegúrate de ajustar la ruta según corresponda
//import Destinos from '../Destinos/Destinos'
const Home = () => {

  const dispatch = useDispatch();

  return (
    <Element name="home">
      <div className={style.home} id="home">
        {/* Reemplaza el video por el componente CarouselHome */}
        <div className={style.carouselContainer}>
          <CarouselHome />
        </div>
        {/* <div className={style.nombre}>
          <h1 className={style.nombre1}>Planeemos juntos tus proximas vacaciones</h1>
          <h2 className={style.nombre2}>Somos operador turístico y agencias de viajes ViajaYa con RNT 122035 el canal intermediario que facilita la compra y reserva de vacaciones programadas entre los viajeros y proveedores por medio de plataformas digitales, convenios directos, asesores externos profesionales; resaltando la cultura de los destinos empaquetando {"("}Alojamiento, vuelos, transportes y receptivos{")"} entregando planes turísticos con información verídica cumpliendo con las normas vigentes del turismo</h2>
          <Link to="proyectos" smooth={true} duration={500}>
            <button className={style.button}>Reservar ahora</button>
          </Link>
        </div>
        <img src={logo} className={style.imgLogo} alt="Logo" /> */}
              {/* <div >
  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-5xl font-bold font-dancing text-gray-700  text-center mt-8 mb-8">Tours al llano</h1>
  <Destinos/>
  </div> */}
      </div>
    </Element>
  )
};

export default Home;
