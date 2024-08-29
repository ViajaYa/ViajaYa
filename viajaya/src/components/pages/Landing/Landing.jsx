// eslint-disable-next-line no-unused-vars
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getPopup } from '../../../redux/actions/actions'
import Popup from '../../../components/popups/Popup'


 import TabbedImages from '../Operador/TabbedImages';
import NavBar from "../../layout/NavBar/NavBar"
import Footer from "../../layout/Footer/Footer"
import Home from "../Home/Home"
import Paquetes from "../Paquetes/Paquetes"
import Destinos from "../Destinos/Destinos"
import Clients from "../Clients/Clients"
import Clients2 from '../Clients/Clientes2';
import Contact from "../Contact/Contact"
import Promo from "../Promo/Promo"
//import Operador from "../Operador/Operador"
import WhatssapButton from './WhatssapButton'

// eslint-disable-next-line react/prop-types
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
      
     
      <Destinos/>

      {/* <Promo /> */}
      {/* <Operador /> */}
      
      <Paquetes />
    <Clients2/>
      <Clients />
      <Contact />
      <Footer />
      <WhatssapButton />
      {popup && popup.isActive && <Popup content={popup.content} />}



     


    </>
  );
};

export default Landing;