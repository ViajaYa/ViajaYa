import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  fetchPackageById,
  selectCurrentPackage,
  selectPackageLoading,
  selectPackageError,
  clearPackageError
} from "../../../redux/slices/packageSlice";
import { useParams, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "react-toastify";
import NavBar from "../../layout/NavBar/NavBar";
import logo from "../../../assets/mascota.png";

const MAP_LAYER_ATTRIBUTION =
  "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors";
const MAP_LAYER_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

const DetailNuevo = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  
  // ✅ Usar selectores del packageSlice
  const pack = useSelector(selectCurrentPackage);
  const loading = useSelector(selectPackageLoading);
  const error = useSelector(selectPackageError);

  const [selectedDate, setSelectedDate] = useState("");

  // ✅ Cargar paquete específico por ID
  useEffect(() => {
    if (id) {
      dispatch(fetchPackageById(id));
    }
  }, [dispatch, id]);

  // ✅ Manejar errores
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearPackageError());
    }
  }, [error, dispatch]);

  // ✅ Debug: Log para verificar datos del paquete
  useEffect(() => {
    if (pack) {
      console.log('DetailNuevo - Pack loaded:', pack);
      console.log('DetailNuevo - Has dates:', pack.fechas?.length || 0);
    }
  }, [pack]);

  // ✅ Estados de carga y error mejorados
  if (loading) {
    return (
      <div className="min-h-screen pt-20 bg-gray-50">
        <div className="fixed top-0 left-0 z-50 w-full">
          <NavBar />
        </div>
        <div className="flex justify-center items-center h-96 mt-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600 font-nunito">Cargando detalles del paquete...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-20 bg-gray-50">
        <div className="fixed top-0 left-0 z-50 w-full">
          <NavBar />
        </div>
        <div className="flex justify-center items-center h-96 mt-20">
          <div className="text-red-600 text-center">
            <h3 className="text-lg font-semibold mb-2 font-nunito">Error al cargar el paquete</h3>
            <p className="font-nunito mb-4">{error}</p>
            <div className="space-x-4">
              <button 
                onClick={() => dispatch(fetchPackageById(id))}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-nunito"
              >
                Reintentar
              </button>
              <Link 
                to="/packages"
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 font-nunito"
              >
                Volver a paquetes
              </Link>
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
            <p className="font-nunito mb-4">El paquete que buscas no existe o ha sido eliminado.</p>
            <Link 
              to="/packages"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-nunito"
            >
              Ver todos los paquetes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const center = pack.lat && pack.lng ? [parseFloat(pack.lat), parseFloat(pack.lng)] : [4.5709, -74.2973]; // Bogotá como fallback

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

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
      <div className="container mx-auto mt-20 p-6 bg-white rounded-lg shadow-lg flex flex-col md:flex-row gap-8">
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
              Detalles del Paquete
            </h3>
            
            {pack.location && (
              <p className="text-lg text-gray-700 flex justify-start">
                <span className="font-bold font-nunito">📍 </span> {pack.location}
              </p>
            )}

            <hr className="border-gray-300" />
            
            <p className="text-lg text-gray-700 flex justify-between">
              <span className="font-semibold font-nunito">💰 Precio:</span>
              {pack.price ? 
                Number(pack.price).toLocaleString("es-CO", {
                  style: "currency",
                  currency: "COP",
                })
                : 'Precio a consultar'
              }
            </p>
            
            <hr className="border-gray-300" />
            
            <p className="text-lg text-gray-700 flex justify-between">
              <span className="font-semibold font-nunito">⏰ Días:</span>
              {pack.days || 'No especificado'}
            </p>
            
            <hr className="border-gray-300" />
            
            {pack.city && (
              <>
                <p className="text-lg text-gray-700 flex justify-between">
                  <span className="font-semibold font-nunito">🏙️ Ciudad:</span>
                  {pack.city}
                </p>
                <hr className="border-gray-300" />
              </>
            )}
            
            {pack.detail && (
              <p className="text-lg text-gray-700">
                <span className="font-semibold font-nunito">📝 Descripción:</span>
                <br />
                <span className="text-gray-600">{pack.detail}</span>
              </p>
            )}

            {/* Date Selection */}
            <div className="mt-6">
              <h3 className="text-xl font-bold font-nunito mb-3 text-ColorMorado">
                📅 Fechas Disponibles
              </h3>
              {pack.fechas && pack.fechas.length > 0 ? (
                <select
                  value={selectedDate}
                  required
                  onChange={handleDateChange}
                  className="w-full px-4 py-2 font-nunito border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ColorAzul"
                >
                  <option value="">Selecciona una fecha</option>
                  {pack.fechas.map((fecha, index) => (
                    <option
                      key={index}
                      value={`${fecha.salida} a ${fecha.vuelta}`}
                    >
                      {fecha.salida} - {fecha.vuelta}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-4 bg-gray-100 rounded-md text-center text-gray-600 font-nunito">
                  No hay fechas disponibles en este momento
                </div>
              )}
            </div>

            {/* Payment Button */}
            {pack.fechas && pack.fechas.length > 0 ? (
              <Link to={`/ordenReserva/${pack.id}`} state={{ selectedDate, pack }}>
                <button 
                  className={`font-nunito font-semibold py-3 px-6 rounded-md mt-6 transition duration-300 ease-in-out w-full ${
                    selectedDate 
                      ? 'bg-ColorAzul hover:bg-ColorMorado text-white' 
                      : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  }`}
                  disabled={!selectedDate}
                >
                  {selectedDate ? '🎫 Reservar Ahora' : '📅 Selecciona una fecha primero'}
                </button>
              </Link>
            ) : (
              <button 
                className="bg-gray-400 text-white font-nunito font-semibold py-3 px-6 rounded-md mt-6 w-full cursor-not-allowed"
                disabled
              >
                📵 No disponible para reserva
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailNuevo;
