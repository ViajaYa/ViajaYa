import style from './Footer.module.css'
import {AiOutlineWhatsApp} from "react-icons/ai"
import {BiLogoFacebookCircle, BiShield} from "react-icons/bi"
import {FiInstagram} from "react-icons/fi"
import {FaTiktok,FaTelegramPlane} from "react-icons/fa"
import {LuShieldQuestion} from "react-icons/lu"
import { useState } from 'react'
import ModalDestino from '../ModalDestino/ModalDestino'
import { useNavigate } from 'react-router-dom'
import {Link} from "react-scroll"
const Footer = () => {

  const navigate = useNavigate()
  return(
    <>
    <footer className={style.footer}>
      <div className={style.footerContent}>
      <a className={style.noLink} href="https://www.codeandcoffee.tech" target="_blank"><h5 className={style.createdBy}>Hecho con ☕ por Code & Coffee</h5></a>
      <div className={style.redes}>
        <a className={style.noLink} href="https://wa.link/28unmk" target="_blank"><div className={style.facebook}><AiOutlineWhatsApp className={style.icons} /></div></a>
        <a className={style.noLink} href="https://www.facebook.com/oficialviajaya/" target="_blank"><div className={style.facebook}><BiLogoFacebookCircle className={style.icons}/></div></a>
        <a className={style.noLink} href="https://www.instagram.com/viajaya_pagina_oficial/" target="_blank"><div className={style.facebook}><FiInstagram className={style.icons}/></div></a>
        <a className={style.noLink} href="https://www.tiktok.com/@agenciadeviajesviajaya" target="_blank"><div><FaTiktok className={style.icons}/></div></a>
        <a className={style.noLink} href="https://www.t.me/+jVPYyJBifRJiMjdh" target="_blank"><div><FaTelegramPlane className={style.icons}/></div></a>
        <Link to="home" smooth={false} style={{cursor:"pointer"}} duration={0}><div onClick={() => navigate("/terminos")}><LuShieldQuestion className={style.icons}/></div></Link>
      </div>
      </div>
    </footer>
    </>
  )
};

export default Footer