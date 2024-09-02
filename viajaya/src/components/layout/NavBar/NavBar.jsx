import style from './NavBar.module.css';
import logo from "../../../assets/logo2.png";
import { Link as ScrollLink } from "react-scroll";
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';

// Importa los íconos de redes sociales
import { FaFacebookF, FaInstagram, FaTiktok, FaTelegramPlane, FaWhatsapp, FaBars, FaTimes } from 'react-icons/fa';

const NavBar = ({ showFullMenu = true }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState();
  const linkRef = useRef();
  const [showSocialMenu, setShowSocialMenu] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const verify = async () => {
    const data = await axios.get(`/user/verify/${localStorage.getItem("token")}`);
    setUser(data.data);
  }

  useEffect(() => {
    verify();
  }, []);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  }
  // Obtén la ruta actual usando `window.location.pathname`
  const currentPath = window.location.pathname;

  // Verifica las condiciones para mostrar elementos específicos
  const isLoginPage = currentPath === '/login';
  const isProductsPage = currentPath === '/productos';
  const isAboutPage = currentPath === '/about';
  const isPanelPage = currentPath === '/panel';
  const isProfilePage = currentPath === '/profile';
  const isPanelUserPage = currentPath === '/panel/user';
  const isPanelPackPage = currentPath === '/panel/pack';
  const isPanelNewPage = currentPath ==='/panel/newPack';


  return (
    <nav className={style.nav}>
      <RouterLink to="/" className={style.noLink}>
        <img className={style.logo} src={logo} alt="Logo" />
      </RouterLink>
      {/* Botón de menú hamburguesa */}
      <button className={style.hamburger} onClick={toggleMenu}>
        {menuOpen ? <FaTimes /> : <FaBars />}
      </button>

       <ul className={`${style.ul} ${menuOpen ? style.menuOpen : ''}`}>
        {/* Mostrar "Inicio" en la página de login */}
        {isLoginPage && (
          <RouterLink to="/" className={style.noLink}>
            <li className={style.li}>Inicio</li>
          </RouterLink>
        )}
        {/* Mostrar "Ingresar" en la página de productos */}
        {isProductsPage && (
          <>
            <RouterLink to="/" className={style.noLink}>
              <li className={style.li}>Inicio</li>
            </RouterLink>
            {!user && (
              <li className={style.libutton} onClick={() => navigate("/login")}>Ingresar</li>
            )}
          </>
        )}
         
          {isPanelPage && (
          <>
            <RouterLink to="/" className={style.noLink}>
              <li className={style.li}>Inicio</li>
            </RouterLink>
            {!user && (
              <li className={style.libutton} onClick={() => navigate("/login")}>Ingresar</li>
            )}
          </>
        )}
        {isProfilePage && (
          <>
            <RouterLink to="/" className={style.noLink}>
              <li className={style.li}>Inicio</li>
            </RouterLink>
            {!user && (
              <li className={style.libutton} onClick={() => navigate("/login")}>Ingresar</li>
            )}
          </>
        )}
             {isPanelUserPage && (
          <>
            <RouterLink to="/panel" className={style.noLink}>
              <li className={style.li}>Panel</li>
            </RouterLink>
            {!user && (
              <li className={style.libutton} onClick={() => navigate("/login")}>Ingresar</li>
            )}
          </>
        )}
               {isPanelPackPage && (
          <>
            <RouterLink to="/panel" className={style.noLink}>
              <li className={style.li}>Panel</li>
            </RouterLink>
            {!user && (
              <li className={style.libutton} onClick={() => navigate("/login")}>Ingresar</li>
            )}
          </>
        )}
        {/* Mostrar "Ingresar" en la página de productos */}
        {isPanelNewPage && (
          <>
            <RouterLink to="/panel" className={style.noLink}>
              <li className={style.li}>Panel</li>
            </RouterLink>
            {!user && (
              <li className={style.libutton} onClick={() =>  navigate("/login")}>Ingresar</li>
            )}
          </>
        )}
        {/* Mostrar elementos generales */}
        {!isLoginPage && !isProductsPage && !isPanelPage && !isProfilePage && !isPanelUserPage && !isPanelPackPage && !isPanelNewPage && (
          <>
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
                  <li className={style.li} >Nosotros</li>
                </RouterLink>
                <RouterLink to="/allpacks" smooth={true} duration={500}>
                  <li ref={linkRef} className={style.li}>Paquetes</li>
                </RouterLink>
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
          </>
        )}
        {user && (
          <li className={style.libutton} onClick={() => navigate(`/profile`)}>{user.name}</li>
        )}
        {!isLoginPage && !isProductsPage && (
          <li className={style.socialMenu}>
            <button onClick={() => setShowSocialMenu(!showSocialMenu)} className={style.socialButton}>
              Redes
            </button>
            {showSocialMenu && (
              <div className={style.socialIcons}>
                <a href="https://wa.link/28unmk" target="_blank" rel="noopener noreferrer" className={style.icon}>
                  <FaWhatsapp />
                </a>
                <a href="https://www.facebook.com/share/w65jnMDrZaqF3ucy/?mibextid=qi2Omg" target="_blank" rel="noopener noreferrer" className={style.icon}>
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







