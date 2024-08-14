import { useState } from 'react';
import style from './Login.module.css'
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {FcGoogle} from "react-icons/fc";
import axios from "axios"
import {toast, Toaster} from "react-hot-toast"
import { useEffect } from 'react';
 
const Login = () => {
    const [login, setLogin] = useState(true)
    const [newUser, setNewUser] = useState()
    const [user, setUser] = useState()
    const navigate = useNavigate()

    const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneReg = /^\d{10}$/;

    const createUser = () => {
        if(!newUser?.name.length ||newUser?.name.length < 3) return toast.error("El nombre debe tener al menos 3 caracteres")
        if(newUser?.lastname.length < 3) return toast.error("El apellido debe tener al menos 3 caracteres")
        if(!phoneReg.test(newUser?.phone)) return toast.error("Debes ingresar un numero valido")
        if(!emailReg.test(newUser?.email)) return toast.error("Debes ingresar un email valido")
        if(!newUser?.password.length || newUser?.password.length < 8) return toast.error("La contraseña debe tener al menos 8 caracteres")
        if(newUser?.password !== newUser?.password2) return toast.error("Las contraseñas no coinciden")
        axios.post("/user", newUser).then(() => {
            setLogin(true)
            //Limpiar form y enviar toast
            toast.success("Te has registrado exitosamente")
            setNewUser({
                name:"",
                lastname:"",
                phone:"",
                email:"",
                password:"",
                password2:"",
            })
        }, (err) => toast.error("Email existente"))
    }

    const authUser = async () => {
        const auth = await axios.post("/user/auth", user)
        if(auth.data.message){
            localStorage.setItem("token",auth.data.token)
            navigate("/profile")
        }else return toast.error("Datos invalidos")
    }

    const handleChange = (e) => {
        const {name,value} = e.target
        setNewUser({
            ...newUser,
            [name]:value
        })
    }
    const handleLogin = (e) => {
        const {name,value} = e.target
        setUser({
            ...user,
            [name]:value
        })
    }

    const recoveryPass = () => {
        axios.get(`/user/recovery/${user.email}`)
        .then(() => {
            setLogin(1)
            toast.success("Email de recuperación enviado")
        })
    }

    if(localStorage.getItem("token") !== null){
        return <Navigate to="/profile" replace />
    }
  return(
    <div className={style.login}>
        <Toaster
  position="top-center"
  reverseOrder={false}
/>

        {login == 2 && <div className={style.loginContainer}>
            <h2 className={style.title}>Recupera tu cuenta</h2>
            <form className={style.form} onSubmit={(e) => {recoveryPass(); e.preventDefault()}}>
                <input onChange={handleLogin} key={2} value={user?.email} name="email" type="email" className={style.input} placeholder="Ingresa tu email"/>
                <button type="submit" className={style.button}>Recuperar</button>
                {/* <button className={style.buttonGoogle}><FcGoogle className={style.google}/> <span>Entra con google</span></button> */}
            </form>
            <p className={style.register}>¿Aun no tienes cuenta?<p onClick={() => setLogin(0)} className={style.buttonRegister}>Registrate</p></p>
        </div>}

        {login == 1 && <div className={style.loginContainer}>
            <h2 className={style.title}>Iniciar sesion</h2>
            <form className={style.form} onSubmit={(e) => {authUser(); e.preventDefault()}}>
                <input onChange={handleLogin} key={1} value={user?.email} name="email" type="email" className={style.input} placeholder="Email"/>
                <input onChange={handleLogin} key={2} value={user?.password} name="password" type="password" className={style.input} placeholder="Contraseña"/>
                <button type="submit" className={style.button}>Entrar</button>
                {/* <button className={style.buttonGoogle}><FcGoogle className={style.google}/> <span>Entra con google</span></button> */}

            </form>
            <p className={style.register}><p onClick={() => setLogin(2)} className={style.buttonRegister}>Olvide mi contraseña</p></p>
            <p className={style.register}>¿Aun no tienes cuenta?<p onClick={() => setLogin(0)} className={style.buttonRegister}>Registrate</p></p>
        </div>}
        {login == 0 && <div className={style.loginContainer}>
        <h2 className={style.title}>Registrarme</h2>
        <form className={style.form}>
            <input onChange={handleChange} key={3} value={newUser?.name} name="name" type="text" className={style.input} placeholder="Nombre"/>
            <input onChange={handleChange} key={4} value={newUser?.lastname} name="lastname" type="text" className={style.input} placeholder="Apellido"/>
            <input onChange={handleChange} key={5} value={newUser?.phone} name="phone" type="text" className={style.input} placeholder="Telefono"/>
            <input onChange={handleChange} key={8} value={newUser?.email} name="email" type="email" className={style.input} placeholder="Email"/>
            <input onChange={handleChange} key={6} value={newUser?.password} name="password" type="password" className={style.input} placeholder="Contraseña"/>
            <input onChange={handleChange} key={7} value={newUser?.password2} name="password2" type="password" className={style.input} placeholder="Repetir contraseña"/>
            <input onClick={createUser} type="button" value="Registrarme" className={style.button}/>
            {/* <button className={style.buttonGoogle}><FcGoogle className={style.google}/> <span>Registrate con google</span></button> */}
        </form>
        <p className={style.register}>¿Ya tienes cuenta?<p onClick={() => setLogin(1)} className={style.buttonRegister}>Ingresa</p></p>
    </div>
        }
    </div>
  )
};

export default Login