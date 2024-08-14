import style from './NavBar.module.css'
import logo from "../../../assets/logo2.png" 
import {Link, animateScroll} from "react-scroll"
import {useLocation, useNavigate} from 'react-router-dom'
import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRef } from 'react';


const NavBar = ({ruta}) => {
  const navigate = useNavigate()

  const [user,setUser] = useState();

  const linkRef = useRef()

  const verify = async () => {
    const data = await axios.get(`/user/verify/${localStorage.getItem("token")}`)
    setUser(data.data)
  }


  useEffect(()=>{
    verify()
    if(linkRef.current && (ruta?.includes("/detail") || ruta?.includes("/pay"))){
      setTimeout(() => linkRef.current.click(),2000)
    }
  },[])

  return(
    <nav className={style.nav}>
      <Link to="home" smooth={true} duration={500}><img className={style.logo} src={logo}/></Link>
      <ul className={style.ul}>
      <Link to="home" smooth={true} duration={500}><li className={style.li}>Inicio</li></Link>
        <Link to="nosotros" smooth={true} duration={500}><li className={style.li}>Quienes somos</li></Link>
        <Link to="proyectos" smooth={true} duration={500}><li  ref={linkRef} className={style.li}>Promociones</li></Link>
        <Link to="servicios" smooth={true} duration={500}><li className={style.li}>Destinos</li></Link>
        <Link to="clientes" smooth={true} duration={500}><li className={style.li}>Aliados</li></Link>
        <Link to="contactanos" smooth={true} duration={500}><li className={style.li}>Trabaja con nosotros</li></Link>
        { user ? <li className={style.libutton} onClick={() => navigate(`/profile`)}>{user.name}</li>
        :<li className={style.libutton} onClick={() => navigate("/login")}>Ingresar</li>}
      </ul>
    </nav>
  )
};

export default NavBar