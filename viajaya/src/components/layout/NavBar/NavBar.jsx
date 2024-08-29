import style from './NavBar.module.css';
import logo from "../../../assets/logo2.png";
import { Link as ScrollLink } from "react-scroll";
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';

// Importa los íconos de redes sociales
import { FaFacebookF, FaInstagram, FaTiktok, FaTelegramPlane, FaWhatsapp } from 'react-icons/fa';

const NavBar = ({ showFullMenu = true }) => {
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
    // You might not need this part if `ruta` is correctly passed
    // if (linkRef.current && (ruta?.includes("/detail") || ruta?.includes("/pay"))) {
    //   setTimeout(() => linkRef.current.click(), 2000);
    // }
  }, []);

  // Obtén la ruta actual usando `window.location.pathname`
  const currentPath = window.location.pathname;

  // Verifica si estamos en la página `/about`
  const isAboutPage = currentPath === '/about';

  return (
    <nav className={style.nav}>
      <RouterLink to="/" className={style.noLink}>
        <img className={style.logo} src={logo} alt="Logo" />
      </RouterLink>
      <ul className={style.ul}>
        {isAboutPage ? (
          <>
            <RouterLink to="/" className={style.noLink}>
              <li className={style.li}>Inicio</li>
            </RouterLink>
            {!user && (
              <li className={style.libutton} onClick={() => navigate("/login")}>Ingresar</li>
            )}
          </>
        ) : (
          <>
         
            <RouterLink to="/about" className={style.noLink}>
              <li className={style.li}>Nosotros</li>
            </RouterLink>
            <ScrollLink to="proyectos" smooth={true} duration={500}>
              <li ref={linkRef} className={style.li}>Paquetes</li>
            </ScrollLink>
            
            <RouterLink to="/productos" className={style.noLink}>
              <li className={style.li}>Productos</li>
            </RouterLink>
            
            <ScrollLink to="contactanos" smooth={true} duration={500}>
              <li className={style.li}>Obtén Descuentos</li>
            </ScrollLink>
            {!user && (
              <li className={style.libutton} onClick={() => navigate("/login")}>Ingresar</li>
            )}
          </>
        )}
        {user && (
          <li className={style.libutton} onClick={() => navigate(`/profile`)}>{user.name}</li>
        )}
        {!isAboutPage && (
          <li className={style.socialMenu}>
            <button onClick={() => setShowSocialMenu(!showSocialMenu)} className={style.socialButton}>
              Redes
            </button>
            {showSocialMenu && (
              <div className={style.socialIcons}>
                <a href="https://wa.link/28unmk" target="_blank" rel="noopener noreferrer" className={style.icon}>
                  <FaWhatsapp />
                </a>
                <a href="https://www.facebook.com/oficialviajaya/" target="_blank" rel="noopener noreferrer" className={style.icon}>
                  <FaFacebookF />
                </a>
                <a href="https://www.instagram.com/viajaya_pagina_oficial/" target="_blank" rel="noopener noreferrer" className={style.icon}>
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
        )}
      </ul>
    </nav>
  );
};

export default NavBar;






