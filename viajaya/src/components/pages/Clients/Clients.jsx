import style from './Clients.module.css'
import Slider from "react-slick"
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import logo from "../../../assets/logo2.jpg"
import {Element} from "react-scroll"
import { useInView } from 'react-intersection-observer';
import { useAnimation, motion } from 'framer-motion';
import { useEffect } from 'react';
import mascota from "../../../assets/mascota.png"

import l1 from "../../../assets/aliados/13.png"
import l2 from "../../../assets/aliados/2.png"
import l3 from "../../../assets/aliados/12.webp"
import l4 from "../../../assets/aliados/4.png"
import l5 from "../../../assets/aliados/5.png"
import l6 from "../../../assets/aliados/6.png"
import l7 from "../../../assets/aliados/7.png"
import l8 from "../../../assets/aliados/8.png"
import l9 from "../../../assets/aliados/9.png"
import l10 from "../../../assets/aliados/10.png"
import l11 from "../../../assets/aliados/11.png"
// import l4 from "../../../assets/aliados/4.png"

import c1 from "../../../assets/c1.mp4"
import c2 from "../../../assets/c2.jpeg"
import c3 from "../../../assets/c3.jpeg"
 
const Clients = () => {

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


  const settings = {
    infinite: true,
    slidesToScroll: 1,
    slidesToShow: 4,
    autoplay: true,
    autoplaySpeed: 5000,
    pauseOnHover: true,
    style:{
      margin:"0px 100px",
    }
  }
  if (window.innerWidth < 550) {
    settings.slidesToShow = 1;
  }
  else if (window.innerWidth < 750) {
    settings.slidesToShow = 2;
  } else if (window.innerWidth < 1200) {
    settings.slidesToShow = 3;
  } else if (window.innerWidth > 1200) {
    settings.slidesToShow = 4;
  }


  return(
    <Element name="clientes">
    <motion.div animate={animation} ref={ref} className={style.clients} id="clientes">
      <h2 className={style.titleSection}>Nuestros aliados</h2>
        <Slider key={Math.random()} {...settings}>
        <div className={style.client}>
          <img src={l1} className={style.img}></img>
        </div>
        <div className={style.client}>
        <img src={l2} className={style.img}></img>
        </div>
        <div className={style.client}>
        <img src={l3} className={style.img}></img>
        </div>
        <div className={style.client}>
        <img src={l4} className={style.img}></img>
        </div>
        <div className={style.client}>
        <img src={l5} className={style.img}></img>
        </div>
        <div className={style.client}>
        <img src={l6} className={style.img}></img>
        </div>
        <div className={style.client}>
        <img src={l7} className={style.img}></img>
        </div>
        <div className={style.client}>
        <img src={l8} className={style.img}></img>
        </div>
        <div className={style.client}>
        <img src={l9} className={style.img}></img>
        </div>
        <div className={style.client}>
        <img src={l10} className={style.img}></img>
        </div>
        <div className={style.client}>
        <img src={l11} className={style.img}></img>
        </div>
        </Slider>

      <div>
        <h3 className={style.titleSection}>Clientes felices</h3>
        
        <div className={style.row}>
            <img src={c3} className={style.video}/>
            <img src={c2} className={style.video}/>
          <video src={c1} controls className={style.video}/>
        </div>

        {/* <div className={style.valores}>
        <a className={style.noLink} href="https://www.instagram.com/viajaya_pagina_oficial/" target="_blank"><div className={style.valor}><img className={style.imgValores} src={logo}></img></div></a>
        <a className={style.noLink} href="https://www.instagram.com/viajaya_pagina_oficial/" target="_blank"><div className={style.valor}><img className={style.imgValores} src={logo}></img></div></a>
        <a className={style.noLink} href="https://www.instagram.com/viajaya_pagina_oficial/" target="_blank"><div className={style.valor}><img className={style.imgValores} src={logo}></img></div></a>
        </div> */}
      </div>
      <div><button className={style.button}><a className={style.noLink} target="_blank" href="https://www.instagram.com/stories/highlights/17846810168704295/">Mas testimonios</a></button></div>
    </motion.div>
    </Element>
  )
};

export default Clients