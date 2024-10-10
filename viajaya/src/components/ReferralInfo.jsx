import { useEffect, useState } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setUsers } from "../redux/actions/actions"; // Importa tus acciones
import NavBar from './layout/NavBar/NavBar';
import { Link } from 'react-router-dom'; // Asegúrate de tener configurado react-router-dom

const ReferralInfo = () => {
  const [user, setUser] = useState(null); // Estado para el usuario logueado
  const [loading, setLoading] = useState(true); // Estado de carga
  const dispatch = useDispatch();

  // Obtener el usuario logueado desde el estado global si ya está en Redux
  const loggedUser = useSelector((state) => state.users);

  useEffect(() => {
    // Si ya hay un usuario logueado en Redux, no hacer la llamada a la API
    if (loggedUser?.id) {
      setUser(loggedUser);
      setLoading(false); // Desactivar el estado de carga si los datos ya están en Redux
    } else {
      // Verificar el token y obtener la información del usuario si no está en Redux
      axios.get(`/user/verify/${localStorage.getItem("token")}`).then((response) => {
        const userId = response.data.id;
        
        // Obtener los datos completos del usuario por su ID
        axios.get(`/user/${userId}`).then((response) => {
          setUser(response.data); // Guardar los datos del usuario en el estado
          dispatch(setUsers(response.data)); // Guardar en Redux
          setLoading(false); // Desactivar estado de carga
        });
      }).catch(() => {
        // En caso de error (e.g. token inválido), desactivar loading
        setLoading(false);
      });
    }
  }, [dispatch, loggedUser]);

  if (loading) {
    return <div>Loading...</div>;
  }

  // Si no hay usuario, mostrar mensaje y enlace a login
  if (!user) {
    return (
      <div className="relative bg-cover bg-center h-screen bg-ColorMorado">
        <div className="fixed top-0 left-0 z-50 w-full">
          <NavBar />
        </div>
        <div className="w-full h-full flex flex-col justify-center items-center p-6">
          <div className="bg-gray-100 bg-opacity-90 rounded-lg shadow-lg max-w-3xl text-center p-6">
            <h1 className="text-2xl font-nunito font-bold text-gray-800 mb-4">¡Refiere y Gana YA!</h1>
            <p className="text-lg font-nunito text-gray-700 mb-6">
            ¿Te encanta viajar y recomendar experiencias inolvidables a tus amigos y familiares? ¡Ahora puedes ganar increíbles recompensas mientras lo haces!.  
            <br /> <br />
            Parece que no has iniciado sesión. Por favor, <Link to="/login" className="text-blue-600 font-bold">inicia sesión aquí</Link> 
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-cover bg-center h-screen bg-ColorMorado">
      <div className="fixed top-0 left-0 z-50 w-full">
        <NavBar />
      </div>
      <div className="w-full h-full flex flex-col justify-center items-center p-6">
        <div className="bg-gray-100 bg-opacity-90 rounded-lg shadow-lg max-w-3xl text-center p-4">
          <h1 className="text-2xl font-nunito font-bold text-gray-800 mb-4">¡Bienvenido, {user?.email}!</h1>
          <p className="text-xl font-nunito font-semibold text-green-600 mb-6">Puntos acumulados: {user?.points}</p>
          
          <p className="text-gray-700 mb-6 font-nunito text-xl">
            ¿Te encanta viajar y recomendar experiencias inolvidables a tus amigos y familiares? ¡Ahora puedes ganar increíbles recompensas mientras lo haces!
            <br /> <br />
            Con nuestro exclusivo programa <span className="font-bold text-blue-600">Refiere y Gana YA</span>, por cada persona que compre un paquete de viaje gracias a tu recomendación, ¡acumularás puntos que podrás canjear por premios irresistibles!
            <br /> <br />
            <span className="font-bold text-blue-600">Regístrate. Comparte tu código y Gana YA</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReferralInfo;




