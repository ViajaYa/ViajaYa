import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Login from "./components/pages/Login/Login";
import ProfileAdmin from "./components/pages/ProfileAdmin/Profile";
import DetailNuevo from "./components/pages/Detail/DetailNuevo";
import Politicas from "./components/pages/Politicas/Politicas";
import Terminos from "./components/pages/Politicas/Terminos";
import { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";

import { useDispatch } from "react-redux";
import { Suspense, lazy } from "react";
import style from "./Spinner.module.css";
import About from "./components/pages/About/About";
import Rifa from "./components/pages/Rifa";
import NumberBoard from "./components/pages/NumberBoard";
import Form from "./components/pages/Form";
import SelectedNumbersList from "./components/pages/SelectedNumberList";
import UserManagement from "./components/Panel/UserManagment";
import PackManagement from "./components/Panel/PackManagement";
import NewPack from "./components/Panel/NewPack";
import PanelPage from "./components/Panel/Panel2";
import TabbedImages from "./components/pages/Operador/TabbedImages";
import ManagePopup from "./components/popups/ManagePopup";
import Popup from "./components/popups/Popup";
import AllPacks from "./components/AllsPacks";
import PrivateRoute from "./components/PrivateRoute";
import GestionarPagina from "./components/Panel/GestionarPagina";
import GestionOrdenes from "./components/Panel/GestionOrdenes";
import InstaVideoUploader from "./components/Panel/InstaVideoUploader";
import UploadCarouselImage from "./components/Panel/UploadCarouselImage ";
import OrdenReserva from "./components/pages/Ordenes/OrdenReserva";
import UserReservation from "./components/pages/ProfileAdmin/UserReservations";
import WompiPaymentWidget from "./components/pages/Ordenes/WompiPaymentWidget";
import "react-toastify/dist/ReactToastify.css";
import ThankYouPage from "./components/pages/Ordenes/ThankYouPage";

const Landing = lazy(() => import("./components/pages/Landing/Landing"));

function App() {
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const verify = () => {
    const token = localStorage.getItem("token");
    alert(token);
    if (token == null) return false;
    // axios.get(`/user/verify/${token}`).then(() => dispatch(setUser({...data.data, status:true})))
    return true;
  };

  const location = useLocation();
  const [rutaAnterior, setRutaAnterior] = useState(null);

  useEffect(() => {
    if (location.pathname != "/") {
      setRutaAnterior(location.pathname);
    }
  }, [location.pathname]);

  const handleFormBack = () => {
    setShowForm(false);
  };
  const handleSelect = (numbers) => {
    setSelectedNumbers(numbers);
    setShowForm(true);
  };

  return (
    <>
      <ToastContainer />
      <Routes>
        <Route exact path="/login" element={<Login />} />
        <Route exact path="/rifa" element={<Rifa />} />
        <Route
          path="/number"
          element={<NumberBoard onSelect={handleSelect} />}
        />
        <Route
          path="/form"
          element={
            showForm ? (
              <Form selectedNumbers={selectedNumbers} onBack={handleFormBack} />
            ) : null
          }
        />
        <Route
          path="/selectedTrue"
          element={
            <PrivateRoute>
              <SelectedNumbersList />
            </PrivateRoute>
          }
        />
        <Route exact path="/about" element={<About />} />
        <Route
          exact
          path="/profile"
          element={
            <PrivateRoute>
              <ProfileAdmin />
            </PrivateRoute>
          }
        />
        <Route
          exact
          path="/panel"
          element={
            <PrivateRoute>
              <PanelPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/panel/user"
          element={
            <PrivateRoute>
              <UserManagement />
            </PrivateRoute>
          }
        />

        <Route
          path="/panel/pack"
          element={
            <PrivateRoute>
              <PackManagement />
            </PrivateRoute>
          }
        />
        <Route
          path="/panel/newPack"
          element={
            <PrivateRoute>
              <NewPack />
            </PrivateRoute>
          }
        />
        <Route
          path="/panel/popup"
          element={
            <PrivateRoute>
              <ManagePopup />
            </PrivateRoute>
          }
        />
        <Route
          path="/thanks"
          element={
            <PrivateRoute>
              <ThankYouPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/pay"
          element={
            <PrivateRoute>
              <WompiPaymentWidget />
            </PrivateRoute>
          }
        />
        <Route
          path="/panelGestion"
          element={
            ///panelInstagram
            <PrivateRoute>
              <GestionarPagina />
            </PrivateRoute>
          }
        />
        <Route
          path="/panelInstagram"
          element={
            <PrivateRoute>
              <InstaVideoUploader />
            </PrivateRoute>
          }
        />
        <Route
          path="/panelCarousel"
          element={
            <PrivateRoute>
              <UploadCarouselImage />
            </PrivateRoute>
          }
        />

        <Route
          path="/panel/reservas"
          element={
            <PrivateRoute>
              <GestionOrdenes />
            </PrivateRoute>
          }
        />
        <Route path="/panel/popup/popup" element={<Popup />} />
        <Route exact path="/politicas" element={<Politicas />} />
        <Route exact path="/userReservas" element={<UserReservation />} />
        <Route exact path="/terminos" element={<Terminos />} />
        <Route exact path="/ordenReserva/:id" element={<OrdenReserva />} />
        <Route path="/detail/:id" element={<DetailNuevo />} />
        <Route path="/allpacks" element={<AllPacks />} />
        <Route exact path="/productos" element={<TabbedImages />} />
        <Route
          exact
          path="/"
          element={
            <Suspense
              fallback={
                <div className={style.ldsellipsis}>
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
              }
            >
              <Landing ruta={rutaAnterior} />
            </Suspense>
          }
        />
      </Routes>
    </>
  );
}

export default App;
