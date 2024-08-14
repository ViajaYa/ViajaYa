import style from './Operador.module.css'
import {Element} from "react-scroll"
import { useInView } from 'react-intersection-observer';
import {motion} from "framer-motion"
import { useEffect, useState } from 'react';
import { useAnimation } from 'framer-motion';
import mascota from "../../../assets/mascota.png"

const Operador = () => {

  const {ref, inView} = useInView({
    threshold:0.05
  })
  const animation = useAnimation()
  const [modal, setModal] = useState(false)
  const [promo, setPromo] = useState()
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
    <Element name="operador">
    {/* {modal && <ModalProject detail={promo?.details} close={() => setModal(false)}/>} */}
    <motion.div animate={animation} ref={ref} className={style.Promo} id="operador">
      <img className={style.bg} src={mascota}/>
      <div className={style.PromoContainer}>
        <h4 className={style.desc}>
            <div className={style.titleContainer}>
            <h2 className={style.titleSection}>Tours al llano</h2>
            {/* <img className={style.yapaya} src={yapaya}/> */}
            </div>
        </h4>
      </div>
      <div className={style.servicesContainer}>
        <div className={style.service}>
        <a className={style.noLink} target="_blank" href=""><img src="https://periodico.unal.edu.co/uploads/UN_Periodico_Digital/Imagenes/2021/04-Abril/0408/pm/01-LLanos_cc0.jpg" className={style.img}/>
          <button className={style.button}>Embrujo llanero</button></a>
        </div>
        <div className={style.service}>
        <a className={style.noLink} target="_blank" href="https://drive.google.com/file/d/14yE4CEhINubE6cHk3uRywct6nFJUzdH-/view?usp=drive_link"><img src="https://www.eltiempo.com/files/image_640_428/files/crop/uploads/2020/09/29/5f73775f1a5e7.r_1601492272849.0-1213-2961-2682.jpeg" className={style.img}/>
          <button className={style.button}>Amanecer llanero</button></a>
        </div>
        <div className={style.service}>
          <a className={style.noLink} target="_blank" href="https://drive.google.com/file/d/1-hSjK9145gJQ59W-NgTTyX3-qNyMZoxI/view"><img src="https://canaltrece.com.co/uploads/newsarticle/83ce7f036c904f39a33dc6533a098064/llanos-orientales-colombia.jpg" className={style.img}/>
          <button className={style.button}>Pie de monte llanero</button></a>
        </div>
        </div>
    </motion.div>
    </Element>
  )
};

export default Operador