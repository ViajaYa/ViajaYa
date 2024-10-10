import { useEffect, useState } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setUsers } from "../redux/actions/actions"; // Importa tus acciones

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
      });
    }
  }, [dispatch, loggedUser]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Bienvenido, {user?.email}</h1>
      <p>Puntos acumulados: {user?.points}</p>
    </div>
  );
};

export default ReferralInfo;


