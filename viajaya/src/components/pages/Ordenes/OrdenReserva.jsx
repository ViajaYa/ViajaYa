import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPackageById,
  selectCurrentPackage,
  selectPackageLoading,
  selectPackageError,
  clearPackageError
} from "../../../redux/slices/packageSlice";
import {
  createReservation,
  selectLoadingReservations,
  selectErrorReservations,
  clearReservationError
} from "../../../redux/slices/reservationSlice";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import NavBar from "../../layout/NavBar/NavBar";
import logo from "../../../assets/mascota.png";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const MAP_LAYER_ATTRIBUTION =
  "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors";
const MAP_LAYER_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

const OrdenReserva = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Estados locales
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedReturnDate, setSelectedReturnDate] = useState("");
  const [persons, setPersons] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);

  // ✅ Usar selectores de los slices
  const pack = useSelector(selectCurrentPackage);
  const packageLoading = useSelector(selectPackageLoading);
  const packageError = useSelector(selectPackageError);
  const reservationLoading = useSelector(selectLoadingReservations);
  const reservationError = useSelector(selectErrorReservations);
  
  // ✅ Obtener estado de autenticación de Redux como respaldo
  const authState = useSelector((state) => state.auth);
  const isAuthenticated = useSelector((state) => state.auth?.isAuthenticated);
  const userFromRedux = useSelector((state) => state.auth?.user);

  // ✅ Obtener datos del estado del DetailNuevo si están disponibles
  const { selectedDate: preselectedDate, pack: preselectedPack } = location.state || {};

  // ✅ Función mejorada para verificar usuario
  const verify = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("No hay token en localStorage");
        toast.error("No hay token de sesión. Por favor, inicia sesión.");
        navigate("/login");
        return;
      }

      console.log("Verificando token:", token);
      
      // Usar la URL completa del backend
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await axios.get(`${baseURL}/user/verify/${token}`);
      
      console.log("Respuesta completa de verificación:", response);
      console.log("Data de la respuesta:", response.data);
      
      // Verificar que la respuesta sea un objeto válido y no HTML
      if (typeof response.data === 'string' || !response.data || !response.data.id) {
        console.error("Respuesta inválida del servidor:", response.data);
        throw new Error("Respuesta inválida del servidor de autenticación");
      }
      
      setUser(response.data.id);
      console.log("Usuario verificado con éxito. ID:", response.data.id);
      console.log("Datos del usuario:", response.data);
    } catch (error) {
      console.error("Error al verificar usuario:", error);
      console.error("Detalles del error:", error.response?.data);
      
      // Si el error es de autenticación (401), limpiar el token y redirigir
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        toast.error("Sesión expirada. Por favor, inicia sesión nuevamente.");
        navigate("/login");
      } else {
        toast.error("Error al verificar el usuario. Por favor, inicia sesión.");
        // No redirigir automáticamente si no es error 401, podría ser problema temporal
      }
    } finally {
      setLoadingUser(false);
    }
  };

  // ✅ Cargar usuario al montar (SIN DEPENDENCIAS PROBLEMÁTICAS)
  useEffect(() => {
    verify();
  }, []); // Sin dependencias que causen loops

  // ✅ Efecto para usar el usuario de Redux como respaldo (OPTIMIZADO)
  useEffect(() => {
    if (!loadingUser && !user && isAuthenticated && userFromRedux) {
      console.log("Usando usuario de Redux como respaldo:", userFromRedux);
      // Si userFromRedux es un objeto, extraer el ID
      if (typeof userFromRedux === 'object' && userFromRedux.id) {
        setUser(userFromRedux.id);
      } else if (typeof userFromRedux === 'string' || typeof userFromRedux === 'number') {
        setUser(userFromRedux);
      }
    }
  }, [loadingUser, isAuthenticated]); // Solo dependencias esenciales

  // ✅ Cargar paquete si no está disponible o es diferente
  useEffect(() => {
    if (id && (!pack || pack.id !== parseInt(id))) {
      dispatch(fetchPackageById(id));
    }
  }, [dispatch, id, pack]);

  // ✅ Configurar fecha preseleccionada del DetailNuevo
  useEffect(() => {
    if (preselectedDate && !selectedDate) {
      // Parsear la fecha preseleccionada "fecha1 a fecha2"
      const [salida, llegada] = preselectedDate.split(' a ');
      if (salida && llegada) {
        setSelectedDate(salida.trim());
        setSelectedReturnDate(llegada.trim());
      }
    }
  }, [preselectedDate, selectedDate]);

  // ✅ Calcular precio total
  useEffect(() => {
    if (pack && pack.price && persons) {
      setTotalPrice(pack.price * persons);
    }
  }, [pack, persons]);

  // ✅ Auto-seleccionar fecha única
  useEffect(() => {
    if (pack?.fechas && pack.fechas.length === 1 && !selectedDate) {
      const uniqueDate = pack.fechas[0];
      setSelectedDate(uniqueDate.salida);
      setSelectedReturnDate(uniqueDate.vuelta);
    }
  }, [pack, selectedDate]);

  // ✅ Manejar errores
  useEffect(() => {
    if (packageError) {
      toast.error(packageError);
      dispatch(clearPackageError());
    }
    if (reservationError) {
      toast.error(reservationError);
      dispatch(clearReservationError());
    }
  }, [packageError, reservationError, dispatch]);

  const handleDateChange = (e) => {
    const selectedIndex = e.target.value;
    if (pack?.fechas && pack.fechas[selectedIndex]) {
      const selectedPackDate = pack.fechas[selectedIndex];
      setSelectedDate(selectedPackDate.salida);
      setSelectedReturnDate(selectedPackDate.vuelta);
    }
  };

  const formatDate = (date) => {
    try {
      // Asegurarse de que la fecha esté en el formato correcto: 'YYYY-MM-DD'
      const formattedDate = new Date(date).toISOString().split("T")[0];
      return formattedDate;
    } catch (error) {
      console.error("Error formatting date:", error);
      return date; // Devolver la fecha original si hay error
    }
  };

  // ✅ Función mejorada para manejar reserva usando el slice
  const handleReservation = async () => {
    console.log("handleReservation - Estados:", {
      user,
      loadingUser,
      isAuthenticated,
      userFromRedux,
      authState
    });
    
    if (loadingUser) {
      toast.error("Verificando usuario, por favor espera...");
      return;
    }
    
    // Verificar autenticación usando el estado local o Redux
    const currentUser = user || (isAuthenticated && userFromRedux);
    
    if (!currentUser) {
      console.log("Usuario no autenticado, redirigiendo al login");
      toast.error("Debes estar logueado para confirmar la reserva");
      navigate("/login");
      return;
    }

    if (!selectedDate || !selectedReturnDate) {
      toast.error("Debes seleccionar una fecha para confirmar la reserva");
      return;
    }

    if (!pack || !pack.id) {
      toast.error("No se pudo cargar la información del paquete");
      return;
    }

    if (persons < 1) {
      toast.error("Debe haber al menos una persona");
      return;
    }

    const parsedPackId = parseInt(id, 10);
    if (isNaN(parsedPackId)) {
      toast.error("ID del paquete inválido");
      return;
    }

    // Extraer el ID del usuario (podría ser un objeto o un valor primitivo)
    let userId;
    if (typeof currentUser === 'object' && currentUser.id) {
      userId = currentUser.id;
    } else {
      userId = currentUser;
    }

    const reservationData = {
      userId: userId,
      packId: parsedPackId,
      numberOfPeople: persons,
      totalPrice,
      fechas: {
        salida: formatDate(selectedDate),
        llegada: formatDate(selectedReturnDate),
      },
    };

    try {
      console.log("Enviando reserva:", reservationData);
      const result = await dispatch(createReservation(reservationData)).unwrap();
      console.log("Reserva creada exitosamente:", result);

      toast.success("Reserva confirmada exitosamente. Ya puede abonarla.");
      console.log("Navegando a /userReservas");
      navigate("/userReservas");
    } catch (error) {
      console.error("Error al confirmar la reserva:", error);
      toast.error(`Error al confirmar la reserva: ${error || "Ocurrió un error"}`);
    }
  };

  // ✅ Estados de carga y error mejorados
  if (packageLoading || loadingUser) {
    return (
      <div className="min-h-screen pt-20 bg-gray-50">
        <div className="fixed top-0 left-0 z-50 w-full">
          <NavBar />
        </div>
        <div className="flex justify-center items-center h-96 mt-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600 font-nunito">
            {loadingUser ? "Verificando usuario..." : "Cargando datos del paquete..."}
          </span>
        </div>
      </div>
    );
  }

  if (packageError) {
    return (
      <div className="min-h-screen pt-20 bg-gray-50">
        <div className="fixed top-0 left-0 z-50 w-full">
          <NavBar />
        </div>
        <div className="flex justify-center items-center h-96 mt-20">
          <div className="text-red-600 text-center">
            <h3 className="text-lg font-semibold mb-2 font-nunito">Error al cargar el paquete</h3>
            <p className="font-nunito mb-4">{packageError}</p>
            <div className="space-x-4">
              <button 
                onClick={() => dispatch(fetchPackageById(id))}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-nunito"
              >
                Reintentar
              </button>
              <button 
                onClick={() => navigate("/packages")}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 font-nunito"
              >
                Volver a paquetes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!pack || Object.keys(pack).length === 0) {
    return (
      <div className="min-h-screen pt-20 bg-gray-50">
        <div className="fixed top-0 left-0 z-50 w-full">
          <NavBar />
        </div>
        <div className="flex justify-center items-center h-96 mt-20">
          <div className="text-gray-600 text-center">
            <h3 className="text-lg font-semibold mb-2 font-nunito">Paquete no encontrado</h3>
            <p className="font-nunito mb-4">El paquete que intentas reservar no existe.</p>
            <button 
              onClick={() => navigate("/packages")}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-nunito"
            >
              Ver todos los paquetes
            </button>
          </div>
        </div>
      </div>
    );
  }

  const center = pack.lat && pack.lng ? [parseFloat(pack.lat), parseFloat(pack.lng)] : [4.5709, -74.2973];

  return (
    <div className="min-h-screen pt-20 bg-gray-50">
      <div className="fixed top-0 left-0 z-50 w-full">
        <NavBar />
      </div>
      <div className="fixed top-16 right-0 z-50">
        <img
          src={logo}
          alt="Logo"
          className="w-32 h-32 mr-4 mt-8 transform scale-x-[-1]"
        />
      </div>
      <div className="container mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg flex flex-col md:flex-row gap-8">
        {/* Left Side - Image and Map */}
        <div className="md:w-1/2 flex flex-col gap-6">
          {pack.images && pack.images.length > 0 ? (
            <img
              src={pack.images[0]}
              alt={pack.title || 'Paquete turístico'}
              className="w-full h-64 object-cover rounded-md shadow-md"
              onError={(e) => {
                e.target.src = '/placeholder-image.jpg';
              }}
            />
          ) : (
            <div className="w-full h-64 bg-gray-200 rounded-md shadow-md flex items-center justify-center">
              <span className="text-gray-500 font-nunito">📷 No hay imagen disponible</span>
            </div>
          )}

          {pack.lat && pack.lng ? (
            <div className="w-full h-64 rounded-md overflow-hidden shadow-md">
              <MapContainer
                center={center}
                zoom={13}
                scrollWheelZoom={false}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  url={MAP_LAYER_URL}
                  attribution={MAP_LAYER_ATTRIBUTION}
                />
                <Marker position={center}>
                  <Popup>{pack.title || 'Ubicación del paquete'}</Popup>
                </Marker>
              </MapContainer>
            </div>
          ) : (
            <div className="w-full h-64 bg-gray-200 rounded-md shadow-md flex items-center justify-center">
              <span className="text-gray-500 font-nunito">🗺️ Mapa no disponible</span>
            </div>
          )}
        </div>

        {/* Right Side - Package Details */}
        <div className="md:w-1/2">
          <h2 className="text-4xl font-bold font-nunito text-gray-700 mb-4">
            {pack.title || 'Paquete turístico'}
          </h2>

          <div className="bg-white rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300 p-4 space-y-4">
            <h3 className="text-xl font-bold font-nunito text-ColorMorado">
              🎫 Confirmar Reserva
            </h3>
            
            <p className="text-lg text-gray-700">
              <span className="font-semibold font-nunito">💰 Precio por persona:</span>
              {pack.price ? 
                Number(pack.price).toLocaleString("es-CO", {
                  style: "currency",
                  currency: "COP",
                })
                : 'Precio a consultar'
              }
            </p>
            
            <hr className="border-gray-300" />

            {/* Date Selection */}
            <div className="mt-6">
              <h3 className="text-xl font-bold font-nunito mb-3 text-ColorMorado">
                📅 Seleccionar Fechas
              </h3>
              {pack.fechas && pack.fechas.length > 0 ? (
                <select
                  value={pack.fechas.findIndex(
                    (fecha) => fecha.salida === selectedDate
                  )}
                  required
                  onChange={handleDateChange}
                  className="w-full px-4 py-2 font-nunito border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ColorAzul"
                >
                  <option value={-1}>Selecciona una fecha</option>
                  {pack.fechas.map((fecha, index) => (
                    <option key={index} value={index}>
                      📅 Salida: {fecha.salida} - 🔄 Regreso: {fecha.vuelta}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-4 bg-gray-100 rounded-md text-center text-gray-600 font-nunito">
                  ❌ No hay fechas disponibles
                </div>
              )}
            </div>

            {/* Selected dates display */}
            {selectedDate && selectedReturnDate && (
              <div className="bg-blue-50 p-4 rounded-md">
                <h4 className="font-semibold font-nunito text-blue-800 mb-2">Fechas seleccionadas:</h4>
                <p className="text-blue-700 font-nunito">
                  ✈️ Salida: {selectedDate} | 🔄 Regreso: {selectedReturnDate}
                </p>
              </div>
            )}

            {/* Select number of persons */}
            <div className="flex flex-col gap-2 mt-4">
              <label className="text-lg font-nunito font-semibold">👥 Número de Personas</label>
              <input
                type="number"
                min="1"
                max="10"
                className="p-2 border rounded font-nunito focus:outline-none focus:ring-2 focus:ring-ColorAzul"
                value={persons}
                onChange={(e) => setPersons(Math.max(1, Number(e.target.value)))}
                placeholder="Ingresa el número de personas"
              />
              {persons > 1 && (
                <p className="text-sm text-gray-600 font-nunito">
                  👨‍👩‍👧‍👦 Total de personas: {persons}
                </p>
              )}
            </div>

            {/* Total Price */}
            <div className="bg-green-50 p-4 rounded-md">
              <p className="text-xl font-nunito font-bold text-green-800">
                💵 Precio Total: {" "}
                {pack.price ? 
                  Number(totalPrice).toLocaleString("es-CO", {
                    style: "currency",
                    currency: "COP",
                  })
                  : 'A consultar'
                }
              </p>
              {pack.price && persons > 1 && (
                <p className="text-sm text-green-600 font-nunito mt-1">
                  ({Number(pack.price).toLocaleString("es-CO", { style: "currency", currency: "COP" })} × {persons} personas)
                </p>
              )}
            </div>

            {/* Reservation Button */}
            <button
              onClick={handleReservation}
              disabled={!selectedDate || !selectedReturnDate || reservationLoading || !pack.price}
              className={`font-nunito font-semibold py-3 px-6 rounded-md mt-6 transition duration-300 ease-in-out w-full ${
                (!selectedDate || !selectedReturnDate || reservationLoading || !pack.price)
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-ColorAzul hover:bg-ColorMorado text-white'
              }`}
            >
              {reservationLoading 
                ? "⏳ Procesando reserva..." 
                : (!selectedDate || !selectedReturnDate)
                  ? "📅 Selecciona fechas primero"
                  : !pack.price
                    ? "💰 Precio no disponible"
                    : "🎯 Confirmar Reserva"
              }
            </button>

            {/* Debug info para desarrollo */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
                <h5 className="font-semibold text-yellow-800 mb-2">🐛 Debug Info:</h5>
                <div className="text-xs text-yellow-700 space-y-1">
                  <p><strong>Local user:</strong> {user ? String(user) : 'null'}</p>
                  <p><strong>Loading user:</strong> {String(loadingUser)}</p>
                  <p><strong>Redux authenticated:</strong> {String(isAuthenticated)}</p>
                  <p><strong>Redux user:</strong> {userFromRedux ? JSON.stringify(userFromRedux) : 'null'}</p>
                  <p><strong>Token exists:</strong> {String(!!localStorage.getItem('token'))}</p>
                </div>
              </div>
            )}

            {/* Info adicional */}
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm text-gray-600 font-nunito">
                ℹ️ Al confirmar la reserva, podrás proceder con el pago. 
                La reserva se mantendrá por 24 horas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdenReserva;
