import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaRegCopy } from "react-icons/fa6";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { MdPayment, MdExitToApp } from "react-icons/md";
import api from "../../../utils/api";
import { findUsers, setUsers } from "../../../redux/actions/actions";
import { useDispatch, useSelector } from "react-redux";
import { toast, Toaster } from "react-hot-toast";
import dayjs from "dayjs";
import "dayjs/locale/es";
import QuotePopup from "../../popups/QuotePopup";
import { 
  faPlus, 
  faFileInvoice,
  faUsers,
  faChartLine,
  faCoins
} from '@fortawesome/free-solid-svg-icons';

// ✅ Importar hook de permisos desde la ubicación correcta
import { useRolePermissions, USER_ROLES } from "../../../redux/hooks/hooks";
// ✅ Importar componente de alerta de documentación
import DocumentationAlert from "../../DocumentationAlert";
import DocumentModal from "../../DocumentModal";

// ✅ Imports del authSlice corregidos
import { 
  logout, 
  selectUser, 
  selectIsAuthenticated, 
  selectAuthLoading,
  updateProfile,
  changePassword
} from "../../../redux/slices/authSlice";

import NavBar from "../../layout/NavBar/NavBar";

dayjs.locale("es");

// Define regular expressions for validation
const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneReg = /^[0-9]{10}$/;

const Profile = () => {
  const [page, setPage] = useState(0);
  const navigate = useNavigate();
  
  // ✅ Redux state
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const authLoading = useSelector(selectAuthLoading);
  const users = useSelector((s) => s.users);
  
  // ✅ Hook de permisos - solo una llamada
  const { 
    hasAnyRole, 
    canManageQuotes, 
    canCreateQuotes, 
    getRoleName,
    canAccessPanel,
    canViewOrganization
  } = useRolePermissions();
  
  // ✅ Estados locales
  const [changePass, setChangePass] = useState(false);
  const [loading, setLoading] = useState(false); // ✅ Cambiar a false inicialmente
  const [showCreateQuote, setShowCreateQuote] = useState(false);
  const [showDocumentManager, setShowDocumentManager] = useState(false);
  
  // ✅ Estados del formulario
  const [formData, setFormData] = useState({
    name: '',
    lastname: '',
    email: '',
    phone: '',
    passwordLast: '',
    password2: '',
    password3: ''
  });

  // ✅ Protección de ruta - Simplificada
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate("/login");
      return;
    }
    
    // Si tenemos token pero no user, esperamos a que se cargue
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [navigate, user, authLoading]);

  // ✅ Generar link de referido
  const referralLink = user?.referral_code 
    ? `https://viajaya.com/login/${user.referral_code}` 
    : '';

  // ✅ Función para copiar al portapapeles
  const copyToClipboard = () => {
    if (referralLink) {
      navigator.clipboard
        .writeText(referralLink)
        .then(() => toast.success("Ya Puedes pegar tu codigo Refiere y Gana YA"))
        .catch((err) => console.error("Error al copiar el enlace: ", err));
    } else {
      toast.error("No hay código de referido disponible");
    }
  };

  // ✅ Cargar datos iniciales - Solo para admins que necesiten ver todos los usuarios
  useEffect(() => {
    if (user && user.role >= 5) { // Solo Admin, Contador, Owner
      setLoading(true);
      api.get("/user")  // ✅ CORREGIDO: usar api en lugar de axios
        .then((data) => {
          dispatch(setUsers(data.data));
        })
        .catch((error) => {
          console.error('Error loading users:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
    // No hay else - para usuarios con role < 5, loading ya está en false por defecto
  }, [dispatch, user?.id, user?.role]); // Cambié las dependencias

  // ✅ Sincronizar formData con usuario
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        lastname: user.lastname || '',
        email: user.email || '',
        phone: user.phone || '',
        passwordLast: '',
        password2: '',
        password3: ''
      });
    }
  }, [user]);

  // ✅ Manejar cambios en inputs
  const handleUser = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // ✅ Buscar usuarios
  const findUsuarios = (e) => {
    dispatch(findUsers(e.target.value));
  };

  // ✅ Actualizar usuario
  const updateUser = async () => {
    try {
      if (changePass) {
        // Validaciones para cambio de contraseña
        if (!formData.password2?.length || formData.password2.length < 8) {
          return toast.error("La contraseña debe tener al menos 8 caracteres");
        }
        if (formData.password2 !== formData.password3) {
          return toast.error("Las contraseñas no coinciden");
        }
        if (!formData.passwordLast?.length) {
          return toast.error("Debes ingresar tu contraseña actual");
        }

        await dispatch(changePassword({
          currentPassword: formData.passwordLast,
          newPassword: formData.password2
        })).unwrap();

        toast.success("Contraseña actualizada exitosamente");
        setChangePass(false);
        setFormData(prev => ({
          ...prev,
          passwordLast: '',
          password2: '',
          password3: ''
        }));

      } else {
        // Validaciones para datos personales
        if (!formData.name?.length || formData.name.length < 2) {
          return toast.error("El nombre debe tener al menos 2 caracteres");
        }
        if (!formData.lastname?.length || formData.lastname.length < 2) {
          return toast.error("El apellido debe tener al menos 2 caracteres");
        }
        if (!emailReg.test(formData.email)) {
          return toast.error("Ingresa un email válido");
        }
        if (!phoneReg.test(formData.phone)) {
          return toast.error("Ingresa un número válido");
        }

        await dispatch(updateProfile({
          name: formData.name,
          lastname: formData.lastname,
          email: formData.email,
          phone: formData.phone
        })).unwrap();

        toast.success("Datos actualizados exitosamente");
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error?.message || 'Error al actualizar datos');
    }
  };

  // ✅ Subir imagen de usuario
 const uploadUserImage = async (e) => {
  try {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const data = new FormData();
    data.append("file", files[0]);
    data.append("upload_preset", "viajaya");
    data.append("api_key", "612393625364863");
    data.append("timestamp", 0);
    
    // ✅ Esta llamada está bien porque es directa a Cloudinary
    const res = await api.post(  // ✅ Usar api aunque sea para Cloudinary para consistencia
      "https://api.cloudinary.com/v1_1/dftvenl2z/image/upload",
      data
    );

    await dispatch(updateProfile({
      image: res.data.secure_url
    })).unwrap();

    toast.success("Imagen actualizada exitosamente");

  } catch (error) {
    console.error('Error uploading image:', error);
    toast.error('Error al subir la imagen');
  }
};

  // ✅ Cerrar sesión
  const handleLogout = async () => {
    try {
      dispatch(logout());
      navigate("/");
    } catch (error) {
      console.error('Error during logout:', error);
      navigate("/");
    }
  };

  // ✅ Estados de carga - Simplificados
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // ✅ Mostrar loading si estamos cargando usuarios (solo para admin)
  if (loading && user?.role >= 5) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos de usuarios...</p>
        </div>
      </div>
    );
  }

  // ✅ Mostrar si no hay usuario pero hay token (esperando carga)
  if (!user && localStorage.getItem('token')) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  // ✅ Redirección si no hay token ni usuario
  if (!user && !localStorage.getItem('token')) {
    return null;
  }

  return (
    <>
      <div className="fixed top-0 left-0 z-50 w-full">
        <NavBar />
      </div>
      
      <div className="flex flex-col md:flex-row min-h-screen">
        {/* ✅ Contenedor principal */}
        <div className="flex flex-grow mt-8">
          
          {/* ✅ Columna izquierda - Perfil y formulario */}
          <div className="w-full lg:w-1/2 p-12 flex flex-col justify-center items-center">
            <Toaster />
            
            {/* ✅ Header del perfil */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 text-gray-800 p-6 rounded-lg shadow-md mb-6 w-full">
              <div className="flex flex-col md:flex-row items-start md:items-center">
                
                {/* ✅ Imagen de perfil */}
                <div className="relative mb-4 md:mb-0 md:mr-6">
                  <img
                    className="w-24 h-24 rounded-full border-4 border-blue-200 cursor-pointer object-cover shadow-lg hover:border-blue-300 transition-colors"
                    src={
                      user?.image
                        ? user.image
                        : "https://cdn.landesa.org/wp-content/uploads/default-user-image.png"
                    }
                    alt="Perfil"
                    onClick={() => document.getElementById("fileInput").click()}
                  />
                  <input
                    id="fileInput"
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={uploadUserImage}
                  />
                  <div className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-1 cursor-pointer">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                    </svg>
                  </div>
                </div>

                {/* ✅ Información del usuario */}
                <div className="flex-1">
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-gray-800">
                      {user?.name} {user?.lastname}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {getRoleName(user?.role)} • {user?.email}
                    </p>
                    {user?.phone && (
                      <p className="text-sm text-gray-500">
                        📱 {user.phone}
                      </p>
                    )}
                  </div>

                  {/* ✅ Botones de acción */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    {/* ✅ Referidos */}
                    {user?.referral_code && (
                      <button 
                        onClick={copyToClipboard} 
                        className="px-4 py-2 text-white font-nunito font-semibold rounded-lg bg-blue-500 hover:bg-blue-600 transition-colors flex items-center justify-center text-sm"
                      >
                        Refiere y Gana YA 
                        <FaRegCopy className="ml-2" />
                      </button>
                    )}
                    
                    {/* ✅ Mis Reservas */}
                    <button
                      onClick={() => navigate("/userReservas")}
                      className="px-4 py-2 text-white font-nunito font-semibold rounded-lg bg-purple-500 hover:bg-purple-600 transition-colors flex items-center justify-center text-sm"
                    >
                      Mis Reservas
                      <MdPayment className="ml-2" />
                    </button>

                    {user?.role >= 2 && user?.role <= 4 && (
                      <Link
                        to="/my-commissions"
                        className="px-4 py-2 text-white font-nunito font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-600 transition-colors flex items-center justify-center text-sm"
                      >
                        <FontAwesomeIcon icon={faCoins} className="mr-2" />
                        Mis Comisiones
                      </Link>
                    )}

                    {/* ✅ Nueva Cotización */}
                    {canCreateQuotes() && (
                      <button
                        onClick={() => setShowCreateQuote(true)}
                        className="px-4 py-2 text-white font-nunito font-semibold rounded-lg bg-green-500 hover:bg-green-600 transition-colors flex items-center justify-center text-sm"
                      >
                        <FontAwesomeIcon icon={faPlus} className="mr-2" />
                        Nueva Cotización
                      </button>
                    )}

                    {/* ✅ Panel Admin */}
                    {canAccessPanel() && user?.role >= 5 && (
                      <Link
                        to="/panel"
                        className="px-4 py-2 text-white font-nunito font-semibold rounded-lg bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center text-sm"
                      >
                        <FontAwesomeIcon icon={faUsers} className="mr-2" />
                        Panel Admin
                      </Link>
                    )}

                    {/* ✅ Gestión de Cotizaciones */}
                    {canManageQuotes() && (
                      <Link
                        to="/quotesList"
                        className="px-4 py-2 text-white font-nunito font-semibold rounded-lg bg-orange-500 hover:bg-orange-600 transition-colors flex items-center justify-center text-sm"
                      >
                        <FontAwesomeIcon icon={faFileInvoice} className="mr-2" />
                        Gestionar Cotizaciones
                      </Link>
                    )}

                    {/* ✅ Mi Equipo */}
                    {canViewOrganization() && (
                      <Link
                        to="/panel/organization"
                        className="px-4 py-2 text-white font-nunito font-semibold rounded-lg bg-indigo-500 hover:bg-indigo-600 transition-colors flex items-center justify-center text-sm"
                      >
                        <FontAwesomeIcon icon={faChartLine} className="mr-2" />
                        Mi Equipo
                      </Link>
                    )}

                    {/* ✅ Todos los Equipos - Solo para Admin, Contador, Owner */}
                    {user?.role >= 5 && (
                      <Link
                        to="/panel/all-teams"
                        className="px-4 py-2 text-white font-nunito font-semibold rounded-lg bg-pink-500 hover:bg-pink-600 transition-colors flex items-center justify-center text-sm"
                      >
                        <FontAwesomeIcon icon={faUsers} className="mr-2" />
                        Todos los Equipos
                      </Link>
                    )}

                    {/* ✅ Capacitaciones */}
                    {user?.role >= 2 && (
                      <Link
                        to="/capacitacion"
                        className="px-4 py-2 text-white font-nunito font-semibold rounded-lg bg-yellow-500 hover:bg-yellow-600 transition-colors flex items-center justify-center text-sm"
                      >
                        📚 Capacitaciones
                      </Link>
                    )}

                    {/* ✅ Cerrar Sesión */}
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 text-white font-nunito font-semibold rounded-lg bg-gray-500 hover:bg-gray-600 transition-colors flex items-center justify-center text-sm"
                    >
                      Cerrar sesión
                      <MdExitToApp className="ml-2" />
                    </button>
                  </div>

                  {/* ✅ Link de referido */}
                  {user?.referral_code && (
                    <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Tu enlace de referido:</p>
                      <p className="text-gray-700 font-mono text-xs break-all">
                        {referralLink}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* ✅ Alerta de documentación para empleados (roles 2,3,4) */}
            <DocumentationAlert 
              user={user} 
              onOpenDocuments={() => setShowDocumentManager(true)}
            />
            
            {/* ✅ Formulario de datos */}
            {page === 0 && (
              <div className="w-full max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
                <form onSubmit={(e) => e.preventDefault()}>
                  {!changePass ? (
                    <>
                      <h3 className="text-lg font-bold font-nunito text-center text-gray-700 mb-6">
                        Mis Datos Personales
                      </h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <input
                            className="w-full p-3 border font-nunito border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            onChange={handleUser}
                            name="name"
                            value={formData.name}
                            placeholder="Nombre"
                            required
                          />
                          <input
                            className="w-full p-3 border font-nunito border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            onChange={handleUser}
                            name="lastname"
                            value={formData.lastname}
                            placeholder="Apellido"
                            required
                          />
                        </div>
                        <input
                          className="w-full p-3 border font-nunito border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          onChange={handleUser}
                          name="email"
                          type="email"
                          value={formData.email}
                          placeholder="Email"
                          required
                        />
                        <input
                          className="w-full p-3 border font-nunito border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          onChange={handleUser}
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          placeholder="Teléfono (10 dígitos)"
                          required
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-bold font-nunito text-center text-gray-700 mb-6">
                        Cambiar Contraseña
                      </h3>
                      <div className="space-y-4">
                        <input
                          className="w-full p-3 border font-nunito border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          onChange={handleUser}
                          name="passwordLast"
                          type="password"
                          value={formData.passwordLast}
                          placeholder="Contraseña actual"
                          required
                        />
                        <input
                          className="w-full p-3 border font-nunito border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          onChange={handleUser}
                          name="password2"
                          type="password"
                          value={formData.password2}
                          placeholder="Nueva contraseña (mín. 8 caracteres)"
                          required
                        />
                        <input
                          className="w-full p-3 border font-nunito border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          onChange={handleUser}
                          name="password3"
                          type="password"
                          value={formData.password3}
                          placeholder="Confirmar nueva contraseña"
                          required
                        />
                      </div>
                    </>
                  )}
                  
                  <div className="mt-6 space-y-3">
                    <button
                      onClick={updateUser}
                      disabled={authLoading}
                      className="w-full bg-blue-500 font-nunito text-white p-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {authLoading 
                        ? "Actualizando..." 
                        : changePass 
                          ? "Actualizar contraseña" 
                          : "Actualizar datos"
                      }
                    </button>
                    <button
                      type="button"
                      onClick={() => setChangePass(!changePass)}
                      className="w-full font-nunito text-gray-600 hover:text-gray-800 hover:underline transition-colors"
                    >
                      {changePass
                        ? "Cancelar cambio de contraseña"
                        : "Cambiar contraseña"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* ✅ Columna derecha - Imagen promocional */}
          <div className="w-full lg:w-1/2 mt-40 lg:mt-32 hidden lg:flex lg:items-center lg:justify-center">
            <div className="flex flex-col items-center space-y-6">
              <Link to="/productos" className="group">
                <img
                  src="/tarjeta.png"
                  alt="Tarjeta ViajaYa"
                  className="w-80 h-auto max-w-md cursor-pointer border-4 border-blue-400 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105"
                />
              </Link>
              
              {/* ✅ Información adicional para el usuario */}
              <div className="text-center max-w-md">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  ¡Descubre nuestros destinos!
                </h3>
                <p className="text-gray-600 text-sm">
                  Explora los mejores paquetes turísticos y vive experiencias inolvidables
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Popup de cotización */}
        {showCreateQuote && (
          <QuotePopup
            isOpen={showCreateQuote}
            onClose={() => setShowCreateQuote(false)}
            prefilledData={{
              created_by_name: `${user?.name || ''} ${user?.lastname || ''}`,
              created_by_role: user?.role,
              created_by_id: user?.id,
              created_by_email: user?.email
            }}
          />
        )}

        {/* ✅ Modal de gestión de documentos */}
        <DocumentModal
          isOpen={showDocumentManager}
          onClose={() => setShowDocumentManager(false)}
          user={user}
        />
      </div>
    </>
  );
};

export default Profile;