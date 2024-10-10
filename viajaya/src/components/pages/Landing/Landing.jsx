// eslint-disable-next-line no-unused-vars
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getPopup } from '../../../redux/actions/actions'
import Popup from '../../../components/popups/Popup'
import NavBar from "../../layout/NavBar/NavBar"
import Footer from "../../layout/Footer/Footer"
import Home from "../Home/Home"
//import Paquetes from "../Paquetes/Paquetes"
import Destinos from "../Destinos/Destinos"
import Clients from "../Clients/Clients"
import Contact from "../Contact/Contact"
import YapayaCard from "../../YapayaCard"
import ReferralInfo from '../../ReferralInfo';

//import Operador from "../Operador/Operador"
import WhatssapButton from './WhatssapButton'
//import InstagramCarousel from '../Clients/InstagramReelCarousel';
import PackCard from '../../../components/PackCard'
import Convenios from '../Clients/Convenios';
import VideoCarousel from '../VideoCarousel';

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
      <YapayaCard /> 

      <PackCard />
      
      <Destinos/>

     
      {/* <Operador /> */}
      
       
      {/* <InstagramCarousel/>  */}
     <VideoCarousel/>
      <Clients />
      <Contact />
      <Convenios/>
      <ReferralInfo/>
      <Footer />
      <WhatssapButton />
      {popup && popup.isActive && <Popup content={popup.content} />}



     


    </>
  );
};

export default Landing;