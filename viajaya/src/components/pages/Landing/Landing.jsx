import style from './Landing.module.css'
 
import NavBar from "../../layout/NavBar/NavBar"
import Footer from "../../layout/Footer/Footer"
import Home from "../Home/Home"
import About from "../About/About"
import Paquetes from "../Paquetes/Paquetes"
import Destinos from "../Destinos/Destinos"
import Clients from "../Clients/Clients"
import Contact from "../Contact/Contact"
import Promo from "../Promo/Promo"
import Operador from "../Operador/Operador"
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { animateScroll as scroll } from 'react-scroll';

const Landing = ({ruta}) => {

  return(
    <>
      <NavBar ruta={ruta}/>
      <Home/>
      <Promo/>
      <About/>
      <Operador/>
      <Paquetes/>
      <Destinos/>
      <Clients/>
      <Contact/>
      <Footer/>
    </>
  )
};

export default Landing