import { Route, Routes, useLocation, useNavigate } from "react-router-dom"
import Login from "./components/pages/Login/Login"
import ProfileAdmin from "./components/pages/ProfileAdmin/Profile"
import Detail from "./components/pages/Detail/Detail"
import Pay from "./components/pages/Pay/Pay"
import Politicas from "./components/pages/Politicas/Politicas"
import Terminos from "./components/pages/Politicas/Terminos"
import { useEffect, useState } from "react"
import axios from "axios"
import { useDispatch, useSelector } from "react-redux"
import { setUser } from "./redux/actions/actions"
import ProtectedRoute from "./components/utils/ProtectedRoute"
import {Suspense, lazy} from "react"
import style from "./Spinner.module.css"
import About from "./components/pages/About/About"
import Rifa from "./components/pages/Rifa"
import NumberBoard from "./components/pages/NumberBoard"
import Form from "./components/pages/Form"
import Panel from "./components/Panel/Panel"
import UserManagement from "./components/Panel/UserManagment"
import PackManagement from "./components/Panel/PackManagement"
import NewPack from "./components/Panel/NewPack"
import PanelPage from "./components/Panel/Panel2"


const Landing = lazy(() => import("./components/pages/Landing/Landing"))

function App() {
  const dispatch = useDispatch()
  const navigate = useNavigate();
  
  const verify = () => {
    const token = localStorage.getItem("token")
    alert(token)
    if(token == null) return false
    // axios.get(`/user/verify/${token}`).then(() => dispatch(setUser({...data.data, status:true})))
    return true
  }

  const location = useLocation()
  const [rutaAnterior, setRutaAnterior] = useState(null)

  useEffect(() => {
    if(location.pathname != "/"){
      setRutaAnterior(location.pathname)
    }
  },[location.pathname])

  const handleBack = () => {
    navigate('/number');  // Cambia '/number' a la ruta a la que quieras navegar cuando se haga clic en "Volver"
  };

  return (
    <>
    <Routes>

      <Route exact path="/login" element={<Login/>}/>
      <Route exact path="/rifa" element={<Rifa/>}/>
      <Route exact path="/number" element={<NumberBoard/>}/> 
      <Route 
          exact 
          path="/form" 
          element={<Form selectedNumbers={[]} onBack={handleBack} />}  // Pasar handleBack como prop onBack
        />
      <Route exact path="/about" element={<About/>}/>
      <Route exact path="/profile" element={<ProfileAdmin/>}/>
      <Route exact path="/panel" element={<PanelPage/>}/>
       <Route path="/panel/user" element={<UserManagement/>}/> 
       <Route path="/panel/pack" element={<PackManagement/>}/> 
       <Route path="/panel/newPack" element={<NewPack/>}/> 
      <Route exact path="/politicas" element={<Politicas/>}/>
      <Route exact path="/terminos" element={<Terminos/>}/>
      <Route exact path="/pay" element={<Pay/>}/>
      <Route exact path="/detail/:id" element={<Detail/>}/>
      <Route exact path="/" element={
      <Suspense fallback={<div className={style.ldsellipsis}><div></div><div></div><div></div><div></div></div>}>
      <Landing ruta={rutaAnterior}/>
      </Suspense>
      }/>
    </Routes>
    </>
  )
}

export default App
