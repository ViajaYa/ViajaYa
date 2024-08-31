import style from './Clients.module.css'
import Slider from "react-slick"
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import {Element} from "react-scroll"
import { useInView } from 'react-intersection-observer';
import { useAnimation, motion } from 'framer-motion';
import { useEffect } from 'react';
import l1 from "../../../assets/bodytech.png"
import l2 from "../../../assets/code.png"
import l3 from "../../../assets/fenalco.png"
import l4 from "../../../assets/fedearroz.png"
import l5 from "../../../assets/llanogas.png"


 
const Convenios = () => {

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
       
        </Slider>

     
    </motion.div>
    </Element>
  )
};

export default Convenios