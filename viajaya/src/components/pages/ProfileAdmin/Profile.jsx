import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AiOutlineUser } from "react-icons/ai";
import { MdPayment, MdExitToApp, MdHome } from "react-icons/md";
import axios from 'axios';
import { findUsers, setUsers } from '../../../redux/actions/actions';
import { useDispatch, useSelector } from 'react-redux';
import { toast, Toaster } from "react-hot-toast";
import dayjs from "dayjs";
import "dayjs/locale/es";
import backgroundImage from '../../../assets/rifa/logoviaja.png';

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

    const users = useSelector(s => s.users);

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
            [name]: value
        });
    };

    const findUsuarios = (e) => {
        dispatch(findUsers(e.target.value));
    };

    const updateUser = () => {
        if (changePass) {
            if (!user?.password2?.length || user.password2.length < 8) return toast.error("La contraseña debe tener al menos 8 caracteres");
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
            if (!user?.name?.length || user.name.length < 2) return toast.error("El nombre debe tener al menos 2 caracteres");
            if (!user?.lastname?.length || user.lastname.length < 2) return toast.error("El apellido debe tener al menos 2 caracteres");
            if (!emailReg.test(user?.email)) return toast.error("Ingresa un email válido");
            if (!phoneReg.test(user?.phone)) return toast.error("Ingresa un número válido");
            axios.put("/user", user).then(() => toast.success("Datos actualizados"));
        }
    };

    const uploadUserImage = async (e) => {
        const files = e.target.files;
        const data = new FormData();
        data.append("file", files[0]);
        data.append("upload_preset", "viajaya");
        const res = await axios.post("https://api.cloudinary.com/v1_1/dbxwx3m3l/image/upload", data);
        setUser({
            ...user,
            image: res.data.secure_url
        });
    };

    const handleGoHome = () => {
        navigate("/");
    };

    return (
        <>
            {loading ? (
                <div 
                    className="flex items-center justify-center h-screen w-screen bg-cover bg-center"
                >
                    <div className="lds-ellipsis"><div></div><div></div><div></div><div></div></div>
                </div>
            ) : (
                <div className="flex min-h-screen ">
                    {/* Contenedor principal que ocupa toda la pantalla */}
                    <div className="flex flex-grow">
                        {/* Imagen de fondo en la mitad izquierda */}
                        <div 
                            className="w-1/2  bg-cover  bg-center hidden lg:block" 
                            style={{ backgroundImage: `url(${backgroundImage})` }}
                        ></div>

                        {/* Contenido del perfil en la mitad derecha */}
                        <div className="w-full lg:w-1/2  p-12 mt-32 overflow-y-auto flex flex-col rounded-lg shadow-lg ">
                            <Toaster />
                            <div className="bg-slate-600 opacity-70 text-white p-4 rounded-lg shadow-md mb-4">
                                <nav className="flex items-center">
                                    <img 
                                        className="w-12 h-12 rounded-full border-2 border-gray-300 cursor-pointer mb-4 mr-4" 
                                        src={user?.image ? user.image : "https://cdn.landesa.org/wp-content/uploads/default-user-image.png"} 
                                        alt="Perfil" 
                                        onClick={() => document.getElementById('fileInput').click()} 
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-lg font-semibold uppercase">{user?.name + " " + user?.lastname || "Mi perfil"}</span>

                                        <ul className="flex space-x-2 mt-2">
                                            <li>
                                                <button 
                                                    onClick={() => setPage(0)} 
                                                    className={`p-2 rounded ${page === 0 ? 'bg-ColorMorado text-gray-900' : 'hover:bg-gray-700'}`}
                                                >
                                                    <AiOutlineUser className="inline-block mr-1" /> Información Personal
                                                </button>
                                            </li>
                                            <li>
                                                <button 
                                                    onClick={() => setPage(1)} 
                                                    className={`p-2 rounded ${page === 1 ? 'bg-ColorMorado text-gray-900' : 'hover:bg-gray-700'}`}
                                                >
                                                    <MdPayment className="inline-block mr-1" /> Mis compras
                                                </button>
                                            </li>
                                            <li>
                                                <button 
                                                    onClick={() => { navigate("/"); localStorage.removeItem("token"); dispatch(setUser(false)) }} 
                                                    className="p-2 rounded hover:bg-gray-700"
                                                >
                                                    <MdExitToApp className="inline-block mr-1" /> Cerrar sesión
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
                                <div className="w-full max-w-md mx-auto bg-white p-6 ">
                                    <form onSubmit={e => e.preventDefault()}>
                                        {!changePass ? (
                                            <>
                                             <span className="text-lg font-semibold"> Mis Datos</span>
                                                <div className="flex space-x-4 mb-4 mt-10">
                                               
                                                    <div className="flex-1">
                                                        <input className="w-full p-2 border border-gray-300 rounded" onChange={handleUser} name="name" value={user?.name || ''} placeholder="Nombre" />
                                                        <input className="w-full p-2 border border-gray-300 rounded mt-2" onChange={handleUser} name="lastname" value={user?.lastname || ''} placeholder="Apellido" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <input className="w-full p-2 border border-gray-300 rounded" onChange={handleUser} name="email" value={user?.email || ''} placeholder="Email" />
                                                        <input className="w-full p-2 border border-gray-300 rounded mt-2" onChange={handleUser} name="phone" value={user?.phone || ''} placeholder="Teléfono" />
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="mb-4">
                                                    <input className="w-full p-2 border border-gray-300 rounded" onChange={handleUser} name="passwordLast" type="password" placeholder="Contraseña actual" />
                                                    <input className="w-full p-2 border border-gray-300 rounded mt-2" onChange={handleUser} name="password2" type="password" placeholder="Nueva contraseña" />
                                                    <input className="w-full p-2 border border-gray-300 rounded mt-2" onChange={handleUser} name="password3" type="password" placeholder="Confirmar nueva contraseña" />
                                                </div>
                                            </>
                                        )}

                                        <button 
                                            onClick={updateUser} 
                                            className="w-full bg-ColorMorado text-white p-2 rounded hover:bg-slate-700"
                                        >
                                            {changePass ? 'Actualizar contraseña' : 'Actualizar datos'}
                                        </button>
                                        <button 
                                            onClick={() => setChangePass(!changePass)} 
                                            className="w-full mt-2 text-slate-700 hover:underline"
                                        >
                                            {changePass ? 'Cancelar cambio de contraseña' : 'Cambiar contraseña'}
                                        </button>
                                    </form>
                                    
                                </div>
                                
                            )}
 {/* Botón para ir a la página principal */}
 <button 
                                onClick={handleGoHome} 
                                className="w-full bg-ColorMorado text-white p-2 rounded hover:bg-slate-700 mb-4"
                            >
                                <MdHome className="inline-block mr-1" /> Ir a la página principal
                            </button>
                            {page === 1 && (
                                <div className="w-full max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
                                    {/* Aquí puedes agregar el contenido de las compras */}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Profile;

