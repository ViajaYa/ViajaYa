import style from './NavBar.module.css';
import logo from "../../../assets/logo2.png";
import { Link as ScrollLink } from "react-scroll";
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';

// Importa los íconos de redes sociales
import { FaFacebookF, FaInstagram, FaTiktok, FaTelegramPlane, FaWhatsapp } from 'react-icons/fa';

const NavBar = ({ ruta, showFullMenu = true }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState();
  const linkRef = useRef();
  const [showSocialMenu, setShowSocialMenu] = useState(false);

  const verify = async () => {
    const data = await axios.get(`/user/verify/${localStorage.getItem("token")}`);
    setUser(data.data);
  }

  useEffect(() => {
    verify();
    if (linkRef.current && (ruta?.includes("/detail") || ruta?.includes("/pay"))) {
      setTimeout(() => linkRef.current.click(), 2000);
    }
  }, [ruta]);

  return (
    <nav className={style.nav}>
      <ScrollLink to="home" smooth={true} duration={500}>
        <img className={style.logo} src={logo} alt="Logo" />
      </ScrollLink>
      <ul className={style.ul}>
        {showFullMenu ? (
          <>
           
            <RouterLink to="/about" className={style.noLink}>
              <li className={style.li}>Nosotros</li>
            </RouterLink>
            <ScrollLink to="proyectos" smooth={true} duration={500}>
              <li ref={linkRef} className={style.li}>Paquetes</li>
            </ScrollLink>
            <ScrollLink to="servicios" smooth={true} duration={500}>
              <li className={style.li}>Productos</li>
            </ScrollLink>
            
            <ScrollLink to="contactanos" smooth={true} duration={500}>
              <li className={style.li}>Obtén Descuentos</li>
            </ScrollLink>
          </>
        ) : (
          <RouterLink to="/" className={style.noLink}>
            <li className={style.li}>Inicio</li>
          </RouterLink>
        )}
        {user ? (
          <li className={style.libutton} onClick={() => navigate(`/profile`)}>{user.name}</li>
        ) : (
          <li className={style.libutton} onClick={() => navigate("/login")}>Ingresar</li>
        )}
        {/* Sección de redes sociales */}
        <li className={style.socialMenu}>
          <button onClick={() => setShowSocialMenu(!showSocialMenu)} className={style.socialButton}>
            Redes
          </button>
          {showSocialMenu && (
            <div className={style.socialIcons}>
              <a href="https://wa.link/28unmk"target="_blank" rel="noopener noreferrer" className={style.icon}>
                <FaWhatsapp />
              </a>
              <a href="https://www.facebook.com/oficialviajaya/" target="_blank" rel="noopener noreferrer" className={style.icon}>
                <FaFacebookF />
              </a>
              <a href="https://www.instagram.com/viajaya_pagina_oficial/"  target="_blank" rel="noopener noreferrer" className={style.icon}>
                <FaInstagram />
              </a>
              <a href="https://www.tiktok.com/@agenciadeviajesviajaya" target="_blank" rel="noopener noreferrer" className={style.icon}>
                <FaTiktok />
              </a>
              <a href="https://www.t.me/+jVPYyJBifRJiMjdh" target="_blank" rel="noopener noreferrer" className={style.icon}>
                <FaTelegramPlane />
              </a>
            </div>
          )}
        </li>
      </ul>
    </nav>
  );
};

export default NavBar;



