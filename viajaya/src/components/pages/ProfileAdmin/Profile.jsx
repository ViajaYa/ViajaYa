/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaRegCopy } from "react-icons/fa6";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { MdPayment } from "react-icons/md";
import api from "../../../utils/api";
import { useDispatch, useSelector } from "react-redux";
import { toast, Toaster } from "react-hot-toast";
import QuotePopup from "../../popups/QuotePopup";
import {
  faPlus,
  faUsers,
  faChartLine,
  faCoins,
  faChartArea,
} from "@fortawesome/free-solid-svg-icons";

// ✅ Imports necesarios
import { useRolePermissions } from "../../../redux/hooks/hooks";
import DocumentationAlert from "../../DocumentationAlert";
import DocumentModal from "../../DocumentModal";
import logoImage from "../../../assets/logo.png";
import {
  selectUser,
  selectAuthLoading,
  updateProfile,
  changePassword,
} from "../../../redux/slices/authSlice";

import NavBar from "../../layout/NavBar/NavBar";

// Expresiones regulares para validación
const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneReg = /^[0-9]{10}$/;

const Profile = () => {
  const navigate = useNavigate();

  // ✅ Redux state
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const authLoading = useSelector(selectAuthLoading);

  // ✅ Hook de permisos
  const {
    canCreateQuotes,
    getRoleName,
    canAccessPanel,
    canViewOrganization,
  } = useRolePermissions();

  // ✅ Estados locales necesarios
  const [changePass, setChangePass] = useState(false);
  const [showCreateQuote, setShowCreateQuote] = useState(false);
  const [showDocumentManager, setShowDocumentManager] = useState(false);

  // ✅ Estados del formulario
  const [formData, setFormData] = useState({
    name: "",
    lastname: "",
    email: "",
    phone: "",
    passwordLast: "",
    password2: "",
    password3: "",
  });

  // ✅ Protección de ruta
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [navigate, user, authLoading]);

  // ✅ Generar link de referido
  const referralLink = user?.referral_code
    ? `https://viajaya.com/login/${user.referral_code}`
    : "";

  // ✅ Función para copiar al portapapeles
  const copyToClipboard = () => {
    if (referralLink) {
      navigator.clipboard
        .writeText(referralLink)
        .then(() =>
          toast.success("Ya Puedes pegar tu codigo Refiere y Gana YA")
        )
        .catch((err) => console.error("Error al copiar el enlace: ", err));
    } else {
      toast.error("No hay código de referido disponible");
    }
  };

  // ✅ Sincronizar formData con usuario
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        lastname: user.lastname || "",
        email: user.email || "",
        phone: user.phone || "",
        passwordLast: "",
        password2: "",
        password3: "",
      });
    }
  }, [user]);

  // ✅ Manejar cambios en inputs
  const handleUser = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

        await dispatch(
          changePassword({
            currentPassword: formData.passwordLast,
            newPassword: formData.password2,
          })
        ).unwrap();

        toast.success("Contraseña actualizada exitosamente");
        setChangePass(false);
        setFormData((prev) => ({
          ...prev,
          passwordLast: "",
          password2: "",
          password3: "",
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

        await dispatch(
          updateProfile({
            name: formData.name,
            lastname: formData.lastname,
            email: formData.email,
            phone: formData.phone,
          })
        ).unwrap();

        toast.success("Datos actualizados exitosamente");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error(error?.message || "Error al actualizar datos");
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

      const res = await api.post(
        "https://api.cloudinary.com/v1_1/dftvenl2z/image/upload",
        data
      );

      await dispatch(
        updateProfile({
          image: res.data.secure_url,
        })
      ).unwrap();

      toast.success("Imagen actualizada exitosamente");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Error al subir la imagen");
    }
  };



  // ✅ Estados de carga
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user && localStorage.getItem("token")) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!user && !localStorage.getItem("token")) {
    return null;
  }

  // ✅ Configuración de acciones simplificada
  const userActions = {
    personal: [
      ...(user?.referral_code
        ? [
            {
              label: "Refiere y Gana YA",
              action: copyToClipboard,
              icon: <FaRegCopy />,
              color: "bg-blue-500 hover:bg-blue-600",
              show: true,
            },
          ]
        : []),
      {
        label: "Mis Reservas",
        action: () => navigate("/userReservas"),
        icon: <MdPayment />,
        color: "bg-purple-500 hover:bg-purple-600",
        show: true,
      },
      ...(user?.role >= 2 && user?.role <= 4
        ? [
            {
              label: "Mis Comisiones",
              link: "/my-commissions",
              icon: <FontAwesomeIcon icon={faCoins} />,
              color: "bg-emerald-500 hover:bg-emerald-600",
              show: true,
            },
          ]
        : []),
      ...(user?.role >= 2
        ? [
            {
              label: "Capacitaciones",
              link: "/capacitacion",
              icon: "📚",
              color: "bg-yellow-500 hover:bg-yellow-600",
              show: true,
            },
          ]
        : []),
    ],

    management: [
      ...(canCreateQuotes() && user?.role >= 2
        ? [
            {
              label: "Nueva Cotización",
              action: () => setShowCreateQuote(true),
              icon: <FontAwesomeIcon icon={faPlus} />,
              color: "bg-green-500 hover:bg-green-600",
              show: true,
            },
          ]
        : []),
      ...(canAccessPanel() && user?.role >= 5
        ? [
            {
              label: "Panel Admin",
              link: "/panel",
              icon: <FontAwesomeIcon icon={faUsers} />,
              color: "bg-red-500 hover:bg-red-600",
              show: true,
            },
          ]
        : []),
      ...(user?.role >= 4
        ? [
            {
              label: "Dashboard Financiero",
              link: "/financial-dashboard",
              icon: <FontAwesomeIcon icon={faChartArea} />,
              color: "bg-indigo-500 hover:bg-indigo-600",
              show: true,
            },
          ]
        : []),
      ...(canViewOrganization() && user?.role >= 3
        ? [
            {
              label: "Mi Equipo",
              link: "/panel/organization",
              icon: <FontAwesomeIcon icon={faChartLine} />,
              color: "bg-cyan-500 hover:bg-cyan-600",
              show: true,
            },
          ]
        : []),
      ...(user?.role >= 5
        ? [
            {
              label: "Todos los Equipos",
              link: "/panel/all-teams",
              icon: <FontAwesomeIcon icon={faUsers} />,
              color: "bg-pink-500 hover:bg-pink-600",
              show: true,
            },
          ]
        : []),
    ],
  };

  return (
    <>
      <div className="fixed top-0 left-0 z-50 w-full">
        <NavBar />
      </div>

      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Toaster />

          {/* Header del perfil */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8">
              <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
                {/* Imagen de perfil */}
                <div className="relative">
                  <img
                    className="w-32 h-32 rounded-full border-4 border-white cursor-pointer object-cover shadow-lg hover:shadow-xl transition-all duration-300"
                    src={user?.image ? user.image : logoImage}
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
                  <div className="absolute bottom-2 right-2 bg-white text-blue-600 rounded-full p-2 cursor-pointer shadow-lg hover:bg-gray-50 transition-colors">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                    </svg>
                  </div>
                </div>

                {/* Información del usuario */}
                <div className="flex-1 text-center md:text-left text-white">
                  <h1 className="text-3xl font-bold font-nunito mb-2">
                    {user?.name} {user?.lastname}
                  </h1>
                  <div className="space-y-1">
                    <p className="text-blue-100 text-lg">
                      {getRoleName(user?.role)}
                    </p>
                    <p className="text-blue-200 flex items-center justify-center md:justify-start">
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                      {user?.email}
                    </p>
                    {user?.phone && (
                      <p className="text-blue-200 flex items-center justify-center md:justify-start">
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                        {user.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Herramientas de gestión en el header */}
                <div className="flex flex-wrap gap-3 justify-center md:justify-end">
                  {userActions.management
                    .filter((action) => action.show)
                    .map((action, index) => (
                      <ActionButton
                        key={index}
                        action={{ ...action, size: "compact" }}
                      />
                    ))}
                </div>
              </div>

              {/* Link de referido */}
              {user?.referral_code && (
                <div className="mt-6 p-4 bg-white bg-opacity-10 rounded-lg backdrop-blur-sm">
                  <p className="text-blue-100 text-sm mb-2">
                    Tu enlace de referido:
                  </p>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 text-white bg-black bg-opacity-20 px-3 py-2 rounded text-sm font-mono break-all">
                      {referralLink}
                    </code>
                    <button
                      onClick={copyToClipboard}
                      className="p-2 bg-white bg-opacity-20 rounded hover:bg-opacity-30 transition-colors"
                      title="Copiar enlace"
                    >
                      <FaRegCopy className="text-white" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Alerta de documentación - SOLO para empleados */}
          {user?.role >= 2 && user?.role <= 4 && (
            <DocumentationAlert
              user={user}
              onOpenDocuments={() => setShowDocumentManager(true)}
            />
          )}

          {/* Sección de Acciones Personales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {userActions.personal.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6 lg:col-span-2">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Acciones Personales
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {userActions.personal.map(
                    (action, index) =>
                      action.show && (
                        <ActionButton key={index} action={action} />
                      )
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Formulario de edición de perfil */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Formulario de datos personales */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                {changePass ? "Cambiar Contraseña" : "Mis Datos Personales"}
              </h3>

              <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                {!changePass ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre
                        </label>
                        <input
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-nunito"
                          onChange={handleUser}
                          name="name"
                          value={formData.name}
                          placeholder="Nombre"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Apellido
                        </label>
                        <input
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-nunito"
                          onChange={handleUser}
                          name="lastname"
                          value={formData.lastname}
                          placeholder="Apellido"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-nunito"
                        onChange={handleUser}
                        name="email"
                        type="email"
                        value={formData.email}
                        placeholder="Email"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono
                      </label>
                      <input
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-nunito"
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contraseña actual
                      </label>
                      <input
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-nunito"
                        onChange={handleUser}
                        name="passwordLast"
                        type="password"
                        value={formData.passwordLast}
                        placeholder="Contraseña actual"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nueva contraseña
                      </label>
                      <input
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-nunito"
                        onChange={handleUser}
                        name="password2"
                        type="password"
                        value={formData.password2}
                        placeholder="Nueva contraseña (mín. 8 caracteres)"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirmar nueva contraseña
                      </label>
                      <input
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-nunito"
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

                <div className="pt-4 space-y-3">
                  <button
                    onClick={updateUser}
                    disabled={authLoading}
                    className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-nunito font-semibold"
                  >
                    {authLoading
                      ? "Actualizando..."
                      : changePass
                      ? "Actualizar contraseña"
                      : "Actualizar datos"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setChangePass(!changePass)}
                    className="w-full text-gray-600 hover:text-gray-800 hover:underline transition-colors font-nunito"
                  >
                    {changePass
                      ? "Cancelar cambio de contraseña"
                      : "Cambiar contraseña"}
                  </button>
                </div>
              </form>
            </div>

            {/* Imagen promocional */}
            <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center justify-center">
              <Link to="/productos" className="group mb-6">
                <img
                  src="/tarjeta.png"
                  alt="Tarjeta ViajaYa"
                  className="w-full max-w-sm h-auto cursor-pointer border-4 border-blue-200 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105 group-hover:border-blue-400"
                />
              </Link>

              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                  ¡Descubre nuestros destinos!
                </h3>
                <p className="text-gray-600 mb-4">
                  Explora los mejores paquetes turísticos y vive experiencias
                  inolvidables
                </p>
                <Link
                  to="/productos"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105"
                >
                  Ver Paquetes
                  <svg
                    className="ml-2 w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Popups y Modales */}
        {showCreateQuote && (
          <QuotePopup
            isOpen={showCreateQuote}
            onClose={() => setShowCreateQuote(false)}
            prefilledData={{
              created_by_name: `${user?.name || ""} ${user?.lastname || ""}`,
              created_by_role: user?.role,
              created_by_id: user?.id,
              created_by_email: user?.email,
            }}
          />
        )}

        {/* Modal de documentos solo para empleados */}
        {user?.role >= 2 && user?.role <= 4 && (
          <DocumentModal
            isOpen={showDocumentManager}
            onClose={() => setShowDocumentManager(false)}
            user={user}
          />
        )}
      </div>
    </>
  );
};

// Componente para los botones de acción
const ActionButton = ({ action }) => {
  const isCompact = action.size === "compact";

  const buttonClass = isCompact
    ? `${action.color} text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 hover:shadow-lg transform hover:scale-105 font-nunito font-medium text-sm`
    : `w-full ${action.color} text-white p-3 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 hover:shadow-lg transform hover:scale-105 font-nunito font-medium`;

  if (action.link) {
    return (
      <Link to={action.link} className={buttonClass}>
        <span className={isCompact ? "text-sm" : "text-lg"}>{action.icon}</span>
        <span className={isCompact ? "hidden sm:inline" : ""}>
          {action.label}
        </span>
      </Link>
    );
  }

  return (
    <button onClick={action.action} className={buttonClass}>
      <span className={isCompact ? "text-sm" : "text-lg"}>{action.icon}</span>
      <span className={isCompact ? "hidden sm:inline" : ""}>
        {action.label}
      </span>
    </button>
  );
};

export default Profile;