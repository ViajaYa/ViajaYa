import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPack } from '../../../redux/NewActions/newActions';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import NavBar from '../../layout/NavBar/NavBar';
import logo from '../../../assets/mascota.png';

const MAP_LAYER_ATTRIBUTION =
  "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors";
const MAP_LAYER_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

const DetailNuevo = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const pack = useSelector((state) => state.pack);
  const loading = useSelector((state) => state.loading);
  const error = useSelector((state) => state.error);

  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    if (id) {
      dispatch(fetchPack(id));
    }
  }, [dispatch, id]);

  if (loading) {
    return <div className="text-center mt-8">Cargando...</div>;
  }

  if (error) {
    return <div className="text-center mt-8 text-red-500">Error al cargar el paquete. Inténtalo de nuevo más tarde.</div>;
  }

  if (!pack || Object.keys(pack).length === 0) {
    return <div className="text-center mt-8">No se encontró el paquete</div>;
  }

  const center = [parseFloat(pack.lat), parseFloat(pack.lng)];

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  return (
    <div className="min-h-screen pt-20 bg-gray-50">
      <div className='fixed top-0 left-0 z-50 w-full'>
        <NavBar />
      </div>
      <div className="fixed top-16 right-0 z-50">
        <img src={logo} alt="Logo" className="w-32 h-32 mr-4 mt-8 transform scale-x-[-1]" />
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
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer url={MAP_LAYER_URL} attribution={MAP_LAYER_ATTRIBUTION} />
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
          <h2 className="text-4xl font-bold font-nunito text-gray-700 mb-4">{pack.title}</h2>

          <div className="bg-white rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300 p-4 space-y-4">
            <h3 className="text-xl font-bold font-nunito text-ColorMorado">Detalles del Paquete</h3>
            <p className="text-lg text-gray-700 flex justify-start">
              <span className="font-bold font-nunito "></span> {pack.location}
            </p>
           
            <hr className="border-gray-300" />
            <p className="text-lg text-gray-700 flex justify-between">
              <span className="font-semibold font-nunito">Precio:</span> ${pack.price}
            </p>
            <hr className="border-gray-300" />
            <p className="text-lg text-gray-700 flex justify-between">
              <span className="font-semibold font-nunito">Días:</span> {pack.days}
            </p>
            <hr className="border-gray-300" />
            <p className="text-lg text-gray-700 flex justify-between">
              <span className="font-semibold font-nunito">Ciudad:</span> {pack.city}
            </p>
            <p className="text-lg text-gray-700">
              <span className="font-semibold font-nunito">Descripción:</span> {pack.detail}
            </p>
            <hr className="border-gray-300" />
           

            {/* Date Selection */}
            <div className="mt-6">
              <h3 className="text-xl font-bold font-nunito mb-3 text-ColorMorado">Selecciona una fecha</h3>
              <select 
                value={selectedDate} 
                required
                onChange={handleDateChange} 
                className="w-full px-4 py-2 font-nunito border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ColorAzul"
              >
                <option value="">Selecciona una fecha</option>
                {pack.fechas && pack.fechas.map((fecha, index) => (
                  <option key={index} value={`${fecha.salida} a ${fecha.vuelta}`}>
                    {fecha.salida} - {fecha.vuelta}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Button */}
            <Link to={`/pay/${id}`}>
              <button className="bg-ColorAzul hover:bg-ColorMorado text-white font-nunito font-semibold py-3 px-6 rounded-md mt-6 transition duration-300 ease-in-out w-full">
                Reservar
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailNuevo;





