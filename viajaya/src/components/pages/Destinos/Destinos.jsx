import style from './Destinos.module.css'
import Slider from "react-slick"
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import {Element} from "react-scroll"
import { useState } from 'react';
import ModalDestino from '../../layout/ModalPoli/ModalDestino';
import { useInView } from 'react-intersection-observer';
import { useAnimation,motion } from 'framer-motion';
import { useEffect } from 'react';
import nacionales from "../../../assets/nacionales.png"
 
const Destinos = () => {

  const [destinoId, setDestinoId] = useState(null)


  const settings = {
    infinite: true,
    slidesToScroll: 1,
    slidesToShow: 3,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    style:{
      margin:"0px 100px",
    }
  };
  const {ref, inView} = useInView({
    threshold:0.05
  })
  const animation = useAnimation()

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

  return(
    <>
    { destinoId && <ModalDestino id={destinoId} close={() => setDestinoId(null)}/>}
    <Element name="servicios">
    <motion.div animate={animation} ref={ref} className={style.services} id="servicios">
      <div className={style.header}>
      <h2 className={style.titleSection}>Destinos</h2>
      <button className={style.button2}><a target="_blank" className={style.noLink} href="https://wa.link/28unmk">Hablar con un asesor</a></button>
      </div>
      <div className={style.servicesContainer}>
        <div className={style.service} onClick={() => setDestinoId(1)}>
          <img src={nacionales} className={style.img}/>
          <button className={style.button}>Nacionales</button>
        </div>
        <div className={style.service} onClick={() => setDestinoId(2)}>
          <img src="https://tipsparatuviaje.com/wp-content/uploads/2017/05/1.-Cuba.jpg" className={style.img}/>
          <button className={style.button}>Internacionales</button>
        </div>
        <div className={style.service} onClick={() => setDestinoId(3)}>
          <img src="https://elcomercio.pe/resizer/oxPDjKIAr2KW2fb4Eof6FteJ99Q=/980x0/smart/filters:format(jpeg):quality(75)/cloudfront-us-east-1.images.arcpublishing.com/elcomercio/XRPSNHBEQZH3RFI6CAEPYHKBAQ.jpg" className={style.img}/>
          <button className={style.button}>Cruceros</button>
        </div>
        </div>
    </motion.div>
    </Element>
    </>
  )
};

export default Destinos