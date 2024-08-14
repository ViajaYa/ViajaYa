import { useState } from 'react';
import style from './ShortNav.module.css'
import {BsCart4} from "react-icons/bs" 
import {FaRegUserCircle} from "react-icons/fa"
import { Link } from 'react-router-dom';
import axios from "axios"
import { useEffect } from 'react';

const ShortNav = () => {
  const [user,setUser] = useState();

  const verify = async () => {
    const data = await axios.get(`/user/verify/${localStorage.getItem("token")}`)
    setUser(data.data)
  }

  useEffect(()=>{
    verify()
  },[])
  return(
    <nav className={style.nav}>
      <Link className={style.noLink} to="/"><p className={style.inicio}>Inicio</p></Link>
      <Link className={style.noLink} to="/profile">
      <div className={style.profile}>
      <FaRegUserCircle className={style.user}/>
      <span className={style.nameUser}>{user?.name ? user.name : "Ingresar"}</span>
      </div>
      </Link>
    </nav>
  )
};

export default ShortNav