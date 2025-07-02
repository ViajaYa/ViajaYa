import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaRegCopy } from "react-icons/fa6";
import { MdPayment, MdExitToApp } from "react-icons/md";
import axios from "axios";
import { findUsers, setUsers } from "../../../redux/actions/actions";
import { useDispatch, useSelector } from "react-redux";
import { toast, Toaster } from "react-hot-toast";
import dayjs from "dayjs";
import "dayjs/locale/es";

// ✅ CORREGIR IMPORTS - cambiar selectLoading por selectAuthLoading
import { 
  logout, 
  selectUser, 
  selectIsAuthenticated, 
  selectAuthLoading, // ✅ Corregido: era selectLoading
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
  
  // ✅ Usar selectores del authSlice con nombres correctos
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const authLoading = useSelector(selectAuthLoading); // ✅ Nombre correcto
  
  const [changePass, setChangePass] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // ✅ Estados locales para el formulario
  const [formData, setFormData] = useState({
    name: '',
    lastname: '',
    email: '',
    phone: '',
    passwordLast: '',
    password2: '',
    password3: ''
  });

  // ✅ Protección de ruta
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  // ✅ Generar link de referido usando el usuario del authSlice
  const referralLink = user?.referral_code 
    ? `https://viajaya.com/login/${user.referral_code}` 
    : '';

  const users = useSelector((s) => s.users);

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

  useEffect(() => {
    // ✅ Cargar datos solo si está autenticado
    if (isAuthenticated) {
      // Cargar usuarios (para admin)
      axios.get("/user").then((data) => {
        dispatch(setUsers(data.data));
        setTimeout(() => {
          setLoading(false);
        }, 500);
      }).catch((error) => {
        console.error('Error loading users:', error);
        setLoading(false);
      });
    }
  }, [dispatch, isAuthenticated]);

  // ✅ Sincronizar formData con el usuario del authSlice
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

  const handleUser = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const findUsuarios = (e) => {
    dispatch(findUsers(e.target.value));
  };

  // ✅ Función de actualización mejorada usando authSlice
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

        // ✅ Usar acción del authSlice para cambiar contraseña
        await dispatch(changePassword({
          currentPassword: formData.passwordLast,
          newPassword: formData.password2
        })).unwrap();

        toast.success("Contraseña actualizada exitosamente");
        setChangePass(false);
        setFormData({
          ...formData,
          passwordLast: '',
          password2: '',
          password3: ''
        });

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

        // ✅ Usar acción del authSlice para actualizar perfil
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
      toast.error(error || 'Error al actualizar datos');
    }
  };

  // ✅ Función de subida de imagen (usando fetch directo por ahora)
  const uploadUserImage = async (e) => {
    try {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      // ✅ Subir a Cloudinary (como en el código original)
      const data = new FormData();
      data.append("file", files[0]);
      data.append("upload_preset", "viajaya");
      data.append("api_key", "612393625364863");
      data.append("timestamp", 0);
      
      const res = await axios.post(
        "https://api.cloudinary.com/v1_1/dftvenl2z/image/upload",
        data
      );

      // Actualizar perfil con nueva imagen
      await dispatch(updateProfile({
        image: res.data.secure_url
      })).unwrap();

      toast.success("Imagen actualizada exitosamente");

    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Error al subir la imagen');
    }
  };

  // ✅ Función de logout mejorada
  const handleLogout = async () => {
    try {
      dispatch(logout());
      navigate("/");
    } catch (error) {
      console.error('Error during logout:', error);
      navigate("/");
    }
  };

  // ✅ Mostrar loading mientras se cargan los datos
  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed top-0 left-0 z-50 w-full">
        <NavBar />
      </div>
      <div className="flex flex-col md:flex-row min-h-screen">
        {/* Contenedor principal */}
        <div className="flex flex-grow mt-8 ">
          <div className="w-full lg:w-1/2 p-12 flex flex-col justify-center items-center  ">
            <Toaster />
            <div className=" opacity-70 text-white p-4 rounded-lg shadow-md mb-4 w-full">
              <nav className="flex items-center">
                <div className="relative">
                  <img
                    className="w-24 h-24 rounded-full border-2 border-gray-300 cursor-pointer mb-4 mr-4 object-cover hidden sm:block"
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
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={uploadUserImage} // ✅ Usar función mejorada
                  />
                </div>

                <div className="flex flex-col">
                  <ul className="flex-col space-y-2 mt-2">
                    {/* ✅ Mostrar botón solo si hay código de referido */}
                    {user?.referral_code && (
                      <>
                        <button 
                          onClick={copyToClipboard} 
                          className="p-1 text-gray-800 font-nunito font-semibold rounded bg-ColorAzul hover:bg-blue-300 flex items-center"
                        >
                          Refiere y Gana YA 
                          <FaRegCopy className="ml-2" />
                        </button>
                        <p className="text-gray-800 font-nunito text-xs">{referralLink}</p>
                      </>
                    )}
                    
                    <li>
                      <button
                        onClick={() => navigate("/userReservas")}
                        className={`p-1 rounded text-gray-600 font-nunito ${
                          page === 1
                            ? "bg-ColorMorado text-gray-900"
                            : "hover:bg-pink-600"
                        }`}
                      >
                        Mis Reservas
                        <MdPayment className="inline-block ml-1" />
                      </button>
                    </li>
                    
                    {/* ✅ Verificar roles con el usuario del authSlice */}
                    {user?.role >= 7 && (
                      <li>
                        <Link
                          to="/panel"
                          className="px-6 py-2 rounded font-nunito bg-ColorMorado hover:bg-pink-600"
                        >
                          Panel
                        </Link>
                      </li>
                    )}
                    
                    {user?.role >= 2 && (
                      <li>
                        <Link
                          to="/capacitacion"
                          className="px-6 py-2 rounded font-nunito bg-ColorMorado hover:bg-pink-600"
                        >
                          Capacitaciones
                        </Link>
                      </li>
                    )}
                    
                    <li>
                      <button
                        onClick={handleLogout} // ✅ Usar función mejorada
                        className="p-1 text-gray-600 font-nunito rounded hover:bg-pink-600"
                      >
                        Cerrar sesión{" "}
                        <MdExitToApp className="inline-block ml-1" />
                      </button>
                    </li>
                  </ul>
                </div>
              </nav>
            </div>
            
            {page === 0 && (
              <div className="w-full max-w-md mx-auto bg-white p-2 rounded-lg shadow-lg">
                <form onSubmit={(e) => e.preventDefault()}>
                  {!changePass ? (
                    <>
                      <span className="text-lg font-bold font-nunito text-center text-gray-700">
                        Mis Datos
                      </span>
                      <div className="flex space-x-4 mb-4 mt-6">
                        <div className="flex-1">
                          <input
                            className="w-full p-2 border font-nunito border-gray-300 rounded"
                            onChange={handleUser}
                            name="name"
                            value={formData.name}
                            placeholder="Nombre"
                          />
                          <input
                            className="w-full p-2 border font-nunito border-gray-300 rounded mt-2"
                            onChange={handleUser}
                            name="lastname"
                            value={formData.lastname}
                            placeholder="Apellido"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            className="w-full p-2 border font-nunito border-gray-300 rounded"
                            onChange={handleUser}
                            name="email"
                            value={formData.email}
                            placeholder="Email"
                          />
                          <input
                            className="w-full p-2 border font-nunito border-gray-300 rounded mt-2"
                            onChange={handleUser}
                            name="phone"
                            value={formData.phone}
                            placeholder="Teléfono"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-lg font-bold font-nunito text-center text-gray-700">
                        Cambiar Contraseña
                      </span>
                      <div className="mb-4 mt-6">
                        <input
                          className="w-full p-2 border font-nunito border-gray-300 rounded"
                          onChange={handleUser}
                          name="passwordLast"
                          type="password"
                          value={formData.passwordLast}
                          placeholder="Contraseña actual"
                        />
                        <input
                          className="w-full p-2 border font-nunito border-gray-300 rounded mt-2"
                          onChange={handleUser}
                          name="password2"
                          type="password"
                          value={formData.password2}
                          placeholder="Nueva contraseña"
                        />
                        <input
                          className="w-full p-2 border font-nunito border-gray-300 rounded mt-2"
                          onChange={handleUser}
                          name="password3"
                          type="password"
                          value={formData.password3}
                          placeholder="Confirmar nueva contraseña"
                        />
                      </div>
                    </>
                  )}
                  <button
                    onClick={updateUser}
                    disabled={authLoading}
                    className="w-full bg-ColorMorado font-nunito text-white p-2 rounded hover:bg-pink-600 disabled:opacity-50"
                  >
                    {authLoading 
                      ? "Actualizando..." 
                      : changePass 
                        ? "Actualizar contraseña" 
                        : "Actualizar datos"
                    }
                  </button>
                  <button
                    onClick={() => setChangePass(!changePass)}
                    className="w-full mt-2 font-nunito text-slate-700 hover:underline"
                  >
                    {changePass
                      ? "Cancelar cambio de contraseña"
                      : "Cambiar contraseña"}
                  </button>
                </form>
              </div>
            )}
            
            {page === 1 && (
              <div className="w-full max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
                {/* Aquí puedes agregar el contenido de las compras */}
              </div>
            )}
          </div>

          {/* Imagen en la mitad izquierda */}
          <div className="w-full lg:w-1/2 items-center justify-center mt-40 lg:mt-32 hidden sm:block">
            <Link to="/productos">
              <img
                src="/tarjeta.png"
                alt="Tarjeta"
                className="w-1/2 h-auto max-w-md ml-32 cursor-pointer border-4 border-ColorAzul"
              />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;