// eslint-disable-next-line no-unused-vars
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getPopup } from '../../../redux/actions/actions'
import Popup from '../../../components/popups/Popup'
// eslint-disable-next-line no-unused-vars
import { useNavigate } from 'react-router-dom'
// eslint-disable-next-line no-unused-vars
import { animateScroll as scroll } from 'react-scroll';

//import style from './Landing.module.css'
 
import NavBar from "../../layout/NavBar/NavBar"
import Footer from "../../layout/Footer/Footer"
import Home from "../Home/Home"
// import About from "../About/About"
import Paquetes from "../Paquetes/Paquetes"
import Destinos from "../Destinos/Destinos"
import Clients from "../Clients/Clients"
import Contact from "../Contact/Contact"
import Promo from "../Promo/Promo"
import Operador from "../Operador/Operador"
import WhatssapButton from './WhatssapButton'

const Landing = ({ ruta }) => {
  const dispatch = useDispatch();
  const popup = useSelector((state) => state.popup);

  useEffect(() => {
    dispatch(getPopup());
  }, [dispatch]);

  return (
    <>
      <NavBar ruta={ruta} />
      <Home />
      <Promo />
      {/* <About /> */}
      <Operador />
      <Paquetes />
      <Destinos />
      <Clients />
      <Contact />
      <Footer />
      <WhatssapButton />
      {popup && popup.isActive && <Popup content={popup.content} />}



     


    </>
  );
};

export default Landing;