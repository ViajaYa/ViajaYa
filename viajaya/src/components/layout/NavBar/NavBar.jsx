import style from './NavBar.module.css';
import logo from "../../../assets/logo2.png";
import { Link as ScrollLink } from "react-scroll";
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';

const NavBar = ({ ruta, showFullMenu = true }) => { // Añadido `showFullMenu`
  const navigate = useNavigate();
  const [user, setUser] = useState();
  const linkRef = useRef();

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
            <ScrollLink to="home" smooth={true} duration={500}>
              <li className={style.li}>Inicio</li>
            </ScrollLink>
            <RouterLink to="/about" style={{ textDecoration: "none" }}>
              <li className={style.li}>Sobre Nosotros</li>
            </RouterLink>
            <ScrollLink to="proyectos" smooth={true} duration={500}>
              <li ref={linkRef} className={style.li}>Promociones</li>
            </ScrollLink>
            <ScrollLink to="servicios" smooth={true} duration={500}>
              <li className={style.li}>Destinos</li>
            </ScrollLink>
            <ScrollLink to="clientes" smooth={true} duration={500}>
              <li className={style.li}>Aliados</li>
            </ScrollLink>
            <ScrollLink to="contactanos" smooth={true} duration={500}>
              <li className={style.li}>Trabaja con nosotros</li>
            </ScrollLink>
          </>
        ) : (
          <RouterLink to="/" style={{ textDecoration: "none" }}>
          <li className={style.li}>Inicio</li>
        </RouterLink>
        )}
        {user ? (
          <li className={style.libutton} onClick={() => navigate(`/profile`)}>{user.name}</li>
        ) : (
          <li className={style.libutton} onClick={() => navigate("/login")}>Ingresar</li>
        )}
      </ul>
    </nav>
  );
};

export default NavBar;
