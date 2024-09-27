import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPack, createOrderReservation } from "../../../redux/NewActions/newActions"; 
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import NavBar from "../../layout/NavBar/NavBar";
import logo from "../../../assets/mascota.png";
import axios from 'axios';

const MAP_LAYER_ATTRIBUTION =
  "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors";
const MAP_LAYER_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

const OrdenReserva = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [user, setUser] = useState(null); // Inicialmente null
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedReturnDate, setSelectedReturnDate] = useState("");
  const [persons, setPersons] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);

  const pack = useSelector((state) => state.pack);
  const loading = useSelector((state) => state.loading);
  const error = useSelector((state) => state.error);

  // Función para verificar si el usuario está logueado
  const verify = async () => {
    try {
      const data = await axios.get(`/user/verify/${localStorage.getItem("token")}`);
      setUser(data.data.id); // Guardar el ID de usuario
    } catch (error) {
      console.log("Error al verificar usuario:", error);
    }
  };

  useEffect(() => {
    verify();
  }, []);

  useEffect(() => {
    if (id) {
      dispatch(fetchPack(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (pack && pack.price && persons) {
      setTotalPrice(pack.price * persons);
    }
  }, [pack, persons]);

  const handleDateChange = (e) => {
    const [salida, vuelta] = e.target.value.split(" ");
    setSelectedDate(salida);
    setSelectedReturnDate(vuelta);
  };

  const formatDate = (date) => {
    // Asegurarse de que la fecha esté en el formato correcto: 'YYYY-MM-DD'
    const formattedDate = new Date(date).toISOString().split("T")[0];
    return formattedDate;
  };
  

  const handleReservation = async () => {
    if (!user) {
      alert("Debes estar logueado para confirmar la reserva");
      navigate("/login");
      return;
    }

    if (!selectedDate || !selectedReturnDate) {
      alert("Debes seleccionar las fechas de salida y llegada.");
      return;
    }

    // Asegurarse de que packId es un número entero
    const parsedPackId = parseInt(id, 10);

    const reservationData = {
      userId: user, // Usar el ID del usuario logueado
      packId: parsedPackId,
      numberOfPeople: persons,
      totalPrice,
      fechas: {
        salida: formatDate(selectedDate), // Formatear la fecha
        llegada: formatDate(selectedReturnDate), // Formatear la fecha
      },
    };

    // Verificar el objeto antes de enviarlo
    console.log("Datos de reserva a enviar:", reservationData);

    try {
      // Despachar la acción y esperar a que se resuelva
      await dispatch(createOrderReservation(reservationData));

      // Si es exitoso, mostrar alerta y redirigir a la página de reservas
      alert("Reserva confirmada exitosamente");
      navigate("/reservas");
    } catch (error) {
      // Si ocurre un error, mostrar una alerta o manejar el error adecuadamente
      alert(`Error al confirmar la reserva: ${error.message || "Ocurrió un error"}`);
    }
  };



  if (loading) {
    return <div className="text-center mt-8">Cargando...</div>;
  }

  if (!pack || Object.keys(pack).length === 0) {
    return <div className="text-center mt-8">No se encontró el paquete</div>;
  }

  const center = [parseFloat(pack.lat), parseFloat(pack.lng)];

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
              alt={pack.title}
              className="w-full h-64 object-cover rounded-md shadow-md"
            />
          ) : (
            <div className="w-full h-64 bg-gray-200 rounded-md shadow-md flex items-center justify-center">
              <span className="text-gray-500">No hay imagen disponible</span>
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
                  <Popup>{pack.title}</Popup>
                </Marker>
              </MapContainer>
            </div>
          ) : (
            <div className="w-full h-64 bg-gray-200 rounded-md shadow-md flex items-center justify-center">
              <span className="text-gray-500">Mapa no disponible</span>
            </div>
          )}
        </div>

        {/* Right Side - Package Details */}
        <div className="md:w-1/2">
          <h2 className="text-4xl font-bold font-nunito text-gray-700 mb-4">
            {pack.title}
          </h2>

          <div className="bg-white rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300 p-4 space-y-4">
            <h3 className="text-xl font-bold font-nunito text-ColorMorado">
              Detalles del Paquete
            </h3>
            <p className="text-lg text-gray-700">
              <span className="font-semibold font-nunito">Precio por persona:</span>{" "}
              {Number(pack.price).toLocaleString("es-CO", {
                style: "currency",
                currency: "COP",
              })}
            </p>
            <hr className="border-gray-300" />

            {/* Date Selection */}
            <div className="mt-6">
              <h3 className="text-xl font-bold font-nunito mb-3 text-ColorMorado">
                Seleccionar Fechas
              </h3>
              <select
                value={selectedDate}
                required
                onChange={handleDateChange}
                className="w-full px-4 py-2 font-nunito border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ColorAzul"
              >
                {pack.fechas &&
                  pack.fechas.map((fecha, index) => (
                    <option
                      key={index}
                      value={`${fecha.salida} ${fecha.vuelta}`}
                    >
                      Fecha salida: {fecha.salida} - Fecha vuelta: {fecha.vuelta}
                    </option>
                  ))}
              </select>
            </div>

            {/* Select number of persons */}
            <div className="flex flex-col gap-2 mt-4">
              <label className="text-lg font-nunito">Número de Personas</label>
              <input
                type="number"
                min="1"
                className="p-2 border rounded"
                value={persons}
                onChange={(e) => setPersons(Number(e.target.value))}
              />
            </div>

            {/* Total Price */}
            <p className="text-lg font-nunito mt-4">
              <span className="font-semibold">Precio Total:</span>{" "}
              {Number(totalPrice).toLocaleString("es-CO", {
                style: "currency",
                currency: "COP",
              })}
            </p>

            {/* Payment Button */}
            <button
              onClick={handleReservation}
              className="bg-ColorAzul hover:bg-ColorMorado text-white font-nunito font-semibold py-3 px-6 rounded-md mt-6 transition duration-300 ease-in-out w-full"
            >
              Confirmar Reserva
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdenReserva;
