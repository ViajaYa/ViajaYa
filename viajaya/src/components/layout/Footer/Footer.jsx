import style from './Footer.module.css';
import { AiOutlineWhatsApp } from 'react-icons/ai';
import { BiLogoFacebookCircle } from 'react-icons/bi';
import { FiInstagram } from 'react-icons/fi';
import { FaTiktok, FaTelegramPlane } from 'react-icons/fa';
import { LuShieldQuestion } from 'react-icons/lu';
import { MdEmail } from 'react-icons/md'; // Importa el icono de correo electrónico
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-scroll';

const Footer = () => {
    const navigate = useNavigate();
    
    return (
        <footer className={style.footer} >
            <div className={style.footerContent}>
                <div className={style.redes}>
                <a className={style.noLink} href="mailto:viajaya.hotelesytodoincluido@gmail.com" target="_blank" rel="noopener noreferrer"> {/* Cambia esto a tu correo electrónico real */}
                        <MdEmail className={`${style.icons} ${style.email}`} /> {/* Agrega el icono de correo electrónico */}
                    </a>
                    <a className={style.noLink} href="https://wa.link/28unmk" target="_blank" rel="noopener noreferrer">
                        <AiOutlineWhatsApp className={`${style.icons} ${style.whatsapp}`} />
                    </a>
                    <a className={style.noLink} href="https://www.facebook.com/oficialviajaya/" target="_blank" rel="noopener noreferrer">
                        <BiLogoFacebookCircle className={`${style.icons} ${style.facebook}`} />
                    </a>
                    <a className={style.noLink} href="https://www.instagram.com/viajaya_pagina_oficial/" target="_blank" rel="noopener noreferrer">
                        <FiInstagram className={`${style.icons} ${style.instagram}`} />
                    </a>
                    <a className={style.noLink} href="https://www.tiktok.com/@agenciadeviajesviajaya" target="_blank" rel="noopener noreferrer">
                        <FaTiktok className={`${style.icons} ${style.tiktok}`} />
                    </a>
                    <a className={style.noLink} href="https://www.t.me/+jVPYyJBifRJiMjdh" target="_blank" rel="noopener noreferrer">
                        <FaTelegramPlane className={`${style.icons} ${style.telegram}`} />
                    </a>
                  
                    <Link to="home" smooth={false} style={{ cursor: 'pointer' }} duration={0}>
                        <div onClick={() => navigate("/terminos")}>
                            <LuShieldQuestion className={`${style.icons} ${style.terms}`} />
                        </div>
                    </Link>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

