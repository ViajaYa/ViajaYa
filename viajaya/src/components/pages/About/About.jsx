import style from './About.module.css'
import {Element} from "react-scroll"
import { useInView } from 'react-intersection-observer';
import {motion} from "framer-motion"
import { useEffect } from 'react';
import { useAnimation } from 'framer-motion';
// import about from "../../../assets/miembros/f8-min.jpg"
import about1 from "../../../assets/miembros/f1-min.jpg"
import about2 from "../../../assets/miembros/f2-min.jpg"
import about3 from "../../../assets/miembros/f3-min.jpg"
import about4 from "../../../assets/miembros/f4-min.jpg"
import about5 from "../../../assets/miembros/f5-min.jpg"
import about6 from "../../../assets/miembros/f6-min.jpg"
import about7 from "../../../assets/miembros/f7-min.jpg"
import about9 from "../../../assets/miembros/f9-min.jpg"

import va1 from "../../../assets/va1.mp4"
import va2 from "../../../assets/va2.mp4"


const About = () => {

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
    <Element name="nosotros">
    <motion.div animate={animation} ref={ref} className={style.about} id="nosotros">
      <h2 className={style.titleSection}>Quienes somos</h2>
      <div className={style.aboutContainer}>
        {/* <h4 className={style.desc}>VIDEOS</h4> */}
        <div className={style.row}>
          <div className={style.column}>
            <img src={about9} className={style.video}/>
          </div>
          <div className={style.column}>
            <img src={about4} className={style.video}/>
            <img src={about5} className={style.video}/>
          </div>
          <div className={style.column}>
          <img src={about2} className={style.video}/>
          <img src={about6} className={style.video}/>
          </div>
          <div className={style.column}>
            <img src={about1} className={style.video}/>
            {/* <img src={about7} className={style.video}/> */}
            <img src={about3} className={style.video}/>
          </div>
        </div>
      </div>
    </motion.div>
      </Element>
  )
};

export default About