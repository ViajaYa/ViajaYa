import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import PropTypes from "prop-types";
import { USER_ROLES } from './RoleRoute';
import RoleRoute from './RoleRoute';
import PrivateRoute from './PrivateRoute';
import LoadingSpinner from './LoadingSpinner';

// Lazy loading de componentes
const Landing = lazy(() => import("./pages/Landing/Landing"));
const Login = lazy(() => import("./pages/Login/Login"));
const ProfileAdmin = lazy(() => import("./pages/ProfileAdmin/Profile"));
const DetailNuevo = lazy(() => import("./pages/Detail/DetailNuevo"));
const UserReservation = lazy(() => import("./pages/ProfileAdmin/UserReservations"));
const OrdenReserva = lazy(() => import("./pages/Ordenes/OrdenReserva"));
const WompiPaymentWidget = lazy(() => import("./pages/Ordenes/WompiPaymentWidget"));
const ThankYouPage = lazy(() => import("./pages/Ordenes/ThankYouPage"));
const ReferralInfo = lazy(() => import("./ReferralInfo"));
const Rifa = lazy(() => import("./pages/Rifa"));
const NumberBoard = lazy(() => import("./pages/NumberBoard"));
const Form = lazy(() => import("./pages/Form"));
const SelectedNumbersList = lazy(() => import("./pages/SelectedNumberList"));
const AsesoresVideos = lazy(() => import("./Panel/AsesoresVideos"));
const Capacitaciones = lazy(() => import("./pages/Capacitaciones"));
const PanelPage = lazy(() => import("./Panel/PanelPage"));
const GestionOrdenes = lazy(() => import("./Panel/GestionOrdenes"));
const UserManagement = lazy(() => import("./Panel/UserManagment"));  
const PackManagement = lazy(() => import("./Panel/PackManagement"));
const NewPack = lazy(() => import("./Panel/NewPack"));
const ManagePopup = lazy(() => import("./popups/ManagePopup"));
const GestionarPagina = lazy(() => import("./Panel/GestionarPagina"));
const InstaVideoUploader = lazy(() => import("./Panel/InstaVideoUploader"));
const UploadCarouselImage  = lazy(() => import("./Panel/UploadCarouselImage "));
const About = lazy(() => import("./pages/About/About"));
const Politicas = lazy(() => import("./pages/Politicas/Politicas"));
const Terminos = lazy(() => import("./pages/Politicas/Terminos"));
const AllsPacks = lazy(() => import("./AllsPacks"));
const TabbedImages = lazy(() => import("./pages/Operador/TabbedImages"));
const Popup = lazy(() => import("./popups/Popup"));
const QuotesList = lazy(() => import("./Panel/Quotes/QuotesList"));
const QuoteEdit = lazy(() => import("./Panel/Quotes/QuoteEdit"));
const CreateStaff = lazy(() => import("./Panel/CreateStaff"));

const AppRoutes = ({ selectedNumbers, showForm, handleFormBack }) => {
  return (
    <Routes>
      {/* ✅ RUTAS PÚBLICAS - accesibles para todos */}
      <Route path="/login" element={
        <Suspense fallback={<LoadingSpinner />}>
          <Login />
        </Suspense>
      } />
      
      <Route path="/login/:referral_code" element={
        <Suspense fallback={<LoadingSpinner />}>
          <Login />
        </Suspense>
      } />
      
      <Route path="/about" element={
        <Suspense fallback={<LoadingSpinner />}>
          <About />
        </Suspense>
      } />
      
      <Route path="/politicas" element={
        <Suspense fallback={<LoadingSpinner />}>
          <Politicas />
        </Suspense>
      } />
      
      <Route path="/terminos" element={
        <Suspense fallback={<LoadingSpinner />}>
          <Terminos />
        </Suspense>
      } />
      
      <Route path="/detail/:id" element={
        <Suspense fallback={<LoadingSpinner />}>
          <DetailNuevo />
        </Suspense>
      } />
      
      <Route path="/allpacks" element={
        <Suspense fallback={<LoadingSpinner />}>
          <AllsPacks />
        </Suspense>
      } />
      
      <Route path="/productos" element={
        <Suspense fallback={<LoadingSpinner />}>
          <TabbedImages />
        </Suspense>
      } />
      
      <Route path="/Panel/popup/popup" element={
        <Suspense fallback={<LoadingSpinner />}>
          <Popup />
        </Suspense>
      } />
      
      <Route path="/" element={
        <Suspense fallback={<LoadingSpinner />}>
          <Landing />
        </Suspense>
      } />

      {/* ✅ RUTAS PARA CLIENTES AUTENTICADOS */}
      <Route path="/profile" element={
        <PrivateRoute>
          <Suspense fallback={<LoadingSpinner />}>
            <ProfileAdmin />
          </Suspense>
        </PrivateRoute>
      } />
      
      <Route path="/userReservas" element={
        <PrivateRoute>
          <Suspense fallback={<LoadingSpinner />}>
            <UserReservation />
          </Suspense>
        </PrivateRoute>
      } />
      
      <Route path="/ordenReserva/:id" element={
        <PrivateRoute>
          <Suspense fallback={<LoadingSpinner />}>
            <OrdenReserva />
          </Suspense>
        </PrivateRoute>
      } />
      
      <Route path="/pay" element={
        <PrivateRoute>
          <Suspense fallback={<LoadingSpinner />}>
            <WompiPaymentWidget />
          </Suspense>
        </PrivateRoute>
      } />
      
      <Route path="/thanks" element={
        <PrivateRoute>
          <Suspense fallback={<LoadingSpinner />}>
            <ThankYouPage />
          </Suspense>
        </PrivateRoute>
      } />
      
      <Route path="/puntos" element={
        <PrivateRoute>
          <Suspense fallback={<LoadingSpinner />}>
            <ReferralInfo />
          </Suspense>
        </PrivateRoute>
      } />

      {/* ✅ RUTAS PARA ASESORES Y SUPERIORES */}
      <Route path="/rifa" element={
        <RoleRoute allowedRoles={[USER_ROLES.ASESOR, USER_ROLES.LIDER, USER_ROLES.GERENTE, USER_ROLES.ADMIN, USER_ROLES.OWNER]}>
          <Suspense fallback={<LoadingSpinner />}>
            <Rifa />
          </Suspense>
        </RoleRoute>
      } />
      
      <Route path="/number" element={
        <RoleRoute allowedRoles={[USER_ROLES.ASESOR, USER_ROLES.LIDER, USER_ROLES.GERENTE, USER_ROLES.ADMIN, USER_ROLES.OWNER]}>
          <Suspense fallback={<LoadingSpinner />}>
            <NumberBoard />
          </Suspense>
        </RoleRoute>
      } />
      
      <Route path="/selectedTrue" element={
        <RoleRoute allowedRoles={[USER_ROLES.ASESOR, USER_ROLES.LIDER, USER_ROLES.GERENTE, USER_ROLES.ADMIN, USER_ROLES.OWNER]}>
          <Suspense fallback={<LoadingSpinner />}>
            <SelectedNumbersList />
          </Suspense>
        </RoleRoute>
      } />
      
      <Route path="/asesores" element={
        <RoleRoute allowedRoles={[USER_ROLES.ASESOR, USER_ROLES.LIDER, USER_ROLES.GERENTE, USER_ROLES.ADMIN, USER_ROLES.OWNER]}>
          <Suspense fallback={<LoadingSpinner />}>
            <AsesoresVideos />
          </Suspense>
        </RoleRoute>
      } />
      
      <Route path="/capacitacion" element={
        <RoleRoute allowedRoles={[USER_ROLES.ASESOR, USER_ROLES.LIDER, USER_ROLES.GERENTE, USER_ROLES.ADMIN, USER_ROLES.OWNER]}>
          <Suspense fallback={<LoadingSpinner />}>
            <Capacitaciones />
          </Suspense>
        </RoleRoute>
      } />

      {/* ✅ RUTAS PARA LÍDERES Y SUPERIORES */}
      <Route path="/panel" element={
        <RoleRoute allowedRoles={[USER_ROLES.LIDER, USER_ROLES.GERENTE, USER_ROLES.ADMIN, USER_ROLES.OWNER]}>
          <Suspense fallback={<LoadingSpinner />}>
            <PanelPage />
          </Suspense>
        </RoleRoute>
      } />
      
      <Route path="/panel/reservas" element={
        <RoleRoute allowedRoles={[USER_ROLES.LIDER, USER_ROLES.GERENTE, USER_ROLES.ADMIN, USER_ROLES.OWNER]}>
          <Suspense fallback={<LoadingSpinner />}>
            <GestionOrdenes />
          </Suspense>
        </RoleRoute>
      } />

      {/* ✅ RUTAS PARA ADMINISTRADORES Y SUPERIORES */}
      <Route path="/panel/user" element={
        <RoleRoute allowedRoles={[ USER_ROLES.OWNER]}>
          <Suspense fallback={<LoadingSpinner />}>
            <UserManagement />
          </Suspense>
        </RoleRoute>
      } />
      
      <Route path="/panel/pack" element={
        <RoleRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.OWNER]}>
          <Suspense fallback={<LoadingSpinner />}>
            <PackManagement />
          </Suspense>
        </RoleRoute>
      } />
      
      <Route path="/panel/newPack" element={
        <RoleRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.OWNER]}>
          <Suspense fallback={<LoadingSpinner />}>
            <NewPack />
          </Suspense>
        </RoleRoute>
      } />
      
      <Route path="/panel/popup" element={
        <RoleRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.OWNER]}>
          <Suspense fallback={<LoadingSpinner />}>
            <ManagePopup />
          </Suspense>
        </RoleRoute>
      } />
      
      <Route path="/panelGestion" element={
        <RoleRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.OWNER]}>
          <Suspense fallback={<LoadingSpinner />}>
            <GestionarPagina />
          </Suspense>
        </RoleRoute>
      } />
      
      <Route path="/panelInstagram" element={
        <RoleRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.OWNER]}>
          <Suspense fallback={<LoadingSpinner />}>
            <InstaVideoUploader />
          </Suspense>
        </RoleRoute>
      } />
      
      <Route path="/panelCarousel" element={
        <RoleRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.OWNER]}>
          <Suspense fallback={<LoadingSpinner />}>
            <UploadCarouselImage />
          </Suspense>
        </RoleRoute>
      } />

      <Route path="/quotesList" element={
        <RoleRoute allowedRoles={[USER_ROLES.LIDER, USER_ROLES.ADMIN, USER_ROLES.GERENTE, USER_ROLES.ASESOR, USER_ROLES.OWNER]}>
          <Suspense fallback={<LoadingSpinner />}>
            <QuotesList />
          </Suspense>
        </RoleRoute>
      } />
      <Route path="/quotes/:id/edit" element={
        <RoleRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.OWNER]}>
          <Suspense fallback={<LoadingSpinner />}>
            <QuoteEdit />
          </Suspense>
        </RoleRoute>
      } />

      <Route path="/createStaff" element={
        <RoleRoute allowedRoles={[ USER_ROLES.OWNER]}>
          <Suspense fallback={<LoadingSpinner />}>
            <CreateStaff />
          </Suspense>
        </RoleRoute>
      } />

      {/* ✅ RUTAS ESPECIALES CON LÓGICA PERSONALIZADA */}
      <Route path="/form" element={
        showForm ? (
          <Suspense fallback={<LoadingSpinner />}>
            <Form selectedNumbers={selectedNumbers} onBack={handleFormBack} />
          </Suspense>
        ) : (
          <RoleRoute allowedRoles={[USER_ROLES.ASESOR, USER_ROLES.LIDER, USER_ROLES.GERENTE, USER_ROLES.ADMIN, USER_ROLES.OWNER]}>
            <Suspense fallback={<LoadingSpinner />}>
              <Form />
            </Suspense>
          </RoleRoute>
        )
      } />
    </Routes>
  );
};

// ✅ PropTypes
AppRoutes.propTypes = {
  selectedNumbers: PropTypes.array,
  showForm: PropTypes.bool,
  handleFormBack: PropTypes.func,
  handleSelect: PropTypes.func,
  rutaAnterior: PropTypes.any,
};

export default AppRoutes;
