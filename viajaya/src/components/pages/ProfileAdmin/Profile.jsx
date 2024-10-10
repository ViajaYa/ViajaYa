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

//import tarjeta from 'src/assets/newImg/viajaYaImg/tarjeta.png';

import NavBar from "../../layout/NavBar/NavBar";

dayjs.locale("es");

// Define regular expressions for validation
const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneReg = /^[0-9]{10}$/;

const Profile = () => {
  const [page, setPage] = useState(0);
  const navigate = useNavigate();
  const [user, setUser] = useState(null); // Inicializar con null para evitar errores antes de que cargue el usuario
  const [changePass, setChangePass] = useState(false);
  const dispatch = useDispatch();
  
  const [loading, setLoading] = useState(true);
  const referralLink = `http://localhost:5173/login/${user?.referral_code}`;

  console.log(referralLink);

  const users = useSelector((s) => s.users);

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(referralLink)
      .then(() =>  toast.success("Ya Puedes pegar tu codigo Refiere y Gana YA "))
      
      .catch((err) => console.error("Error al copiar el enlace: ", err));
  };

  useEffect(() => {
    axios.get("/user").then((data) => {
      dispatch(setUsers(data.data));
      setTimeout(() => {
        setLoading(false);
      }, 500);
    });

    axios.get(`/user/verify/${localStorage.getItem("token")}`).then((data) => {
      axios.get(`/user/${data.data.id}`).then((data) => setUser(data.data));
    });
  }, [dispatch]);

  const handleUser = (e) => {
    const { name, value } = e.target;
    setUser({
      ...user,
      [name]: value,
    });
  };

  const findUsuarios = (e) => {
    dispatch(findUsers(e.target.value));
  };

  const updateUser = () => {
    if (changePass) {
      if (!user?.password2?.length || user.password2.length < 8)
        return toast.error("La contraseña debe tener al menos 8 caracteres");
      if (user.passwordLast === user.password) {
        if (user.password2 === user.password3) {
          axios.put("/user", { ...user, password: user.password2 }).then(() => {
            toast.success("Contraseña actualizada");
            setChangePass(false);
          });
        } else {
          return toast.error("Las contraseñas no coinciden");
        }
      } else {
        return toast.error("Esa no es tu contraseña");
      }
    } else {
      if (!user?.name?.length || user.name.length < 2)
        return toast.error("El nombre debe tener al menos 2 caracteres");
      if (!user?.lastname?.length || user.lastname.length < 2)
        return toast.error("El apellido debe tener al menos 2 caracteres");
      if (!emailReg.test(user?.email))
        return toast.error("Ingresa un email válido");
      if (!phoneReg.test(user?.phone))
        return toast.error("Ingresa un número válido");
      axios.put("/user", user).then(() => toast.success("Datos actualizados"));
    }
  };

  const uploadUserImage = async (e) => {
    const files = e.target.files;
    const data = new FormData();
    data.append("file", files[0]);
    data.append("upload_preset", "viajaya");
    const res = await axios.post(
      "https://api.cloudinary.com/v1_1/dbxwx3m3l/image/upload",
      data
    );
    setUser({
      ...user,
      image: res.data.secure_url,
    });
  };

  
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
                    onChange={(e) => {
                      /* Tu lógica para manejar la selección de archivos */
                    }}
                  />
                </div>

                <div className="flex flex-col">
                  {/* <span className="text-lg text-gray-600 font-semibold font-nunito uppercase">
                    {user?.name + " " + user?.lastname || "Mi perfil"}
                  </span> */}
                  <ul className="flex-col space-y-2 mt-2">
                   
                  <button 
        onClick={copyToClipboard} 
        className="p-1 text-gray-800 font-nunito font-semibold rounded bg-ColorAzul hover:bg-blue-300 flex items-center" // Añadido 'flex items-center' para centrar el ícono
      >
        Refiere y Gana YA 
        <FaRegCopy className="ml-2" /> {/* Espacio entre el texto y el ícono */}
      </button>
                    <p className="text-gray-800 font-nunito text-xs"> {referralLink}  </p>
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
                    {user?.role === 3 && (
                      <li>
                        <Link
                          to="/panel"
                          className="px-6 py-2 rounded font-nunito bg-ColorMorado hover:bg-pink-600"
                        >
                          Panel
                        </Link>
                      </li>
                    )}
                    {user?.role === 2 && (
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
                        onClick={() => {
                          navigate("/");
                          localStorage.removeItem("token");
                          dispatch(setUser(false));
                        }}
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
            <input
              id="fileInput"
              type="file"
              className="hidden"
              onChange={uploadUserImage}
            />
            {page === 0 && (
              <div className="w-full max-w-md mx-auto bg-white p-2 rounded-lg shadow-lg">
                <form onSubmit={(e) => e.preventDefault()}>
                  {!changePass ? (
                    <>
                      <span className="text-lg font-bold font-nunito text-center text-gray-700">
                        {" "}
                        Mis Datos
                      </span>
                      <div className="flex space-x-4 mb-4 mt-6">
                        <div className="flex-1">
                          <input
                            className="w-full p-2 border font-nunito border-gray-300 rounded"
                            onChange={handleUser}
                            name="name"
                            value={user?.name || ""}
                            placeholder="Nombre"
                          />
                          <input
                            className="w-full p-2 border font-nunito border-gray-300 rounded mt-2"
                            onChange={handleUser}
                            name="lastname"
                            value={user?.lastname || ""}
                            placeholder="Apellido"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            className="w-full p-2 border font-nunito border-gray-300 rounded"
                            onChange={handleUser}
                            name="email"
                            value={user?.email || ""}
                            placeholder="Email"
                          />
                          <input
                            className="w-full p-2 border font-nunito border-gray-300 rounded mt-2"
                            onChange={handleUser}
                            name="phone"
                            value={user?.phone || ""}
                            placeholder="Teléfono"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mb-4">
                        <input
                          className="w-full p-2 border font-nunito border-gray-300 rounded"
                          onChange={handleUser}
                          name="passwordLast"
                          type="password"
                          placeholder="Contraseña actual"
                        />
                        <input
                          className="w-full p-2 border font-nunito border-gray-300 rounded mt-2"
                          onChange={handleUser}
                          name="password2"
                          type="password"
                          placeholder="Nueva contraseña"
                        />
                        <input
                          className="w-full p-2 border font-nunito border-gray-300 rounded mt-2"
                          onChange={handleUser}
                          name="password3"
                          type="password"
                          placeholder="Confirmar nueva contraseña"
                        />
                      </div>
                    </>
                  )}
                  <button
                    onClick={updateUser}
                    className="w-full bg-ColorMorado font-nunito text-white p-2 rounded hover:bg-pink-600"
                  >
                    {changePass ? "Actualizar contraseña" : "Actualizar datos"}
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
            {/* <button
                    onClick={handleGoHome}
                    className="w-full bg-ColorMorado text-white p-2 rounded font-nunito hover:bg-pink-600 mb-4"
                  >
                    <MdHome className="inline-block mr-1" /> Ir a la página principal
                  </button> */}
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
      )
    </>
  );
};
export default Profile;
