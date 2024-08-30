import  { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPack } from '../../../redux/NewActions/newActions';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

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

  // Fetch pack when component mounts
  useEffect(() => {
    if (id) {
      dispatch(fetchPack(id));
    }
  }, [dispatch, id]);

  if (loading) return <div className="text-center mt-8">Cargando...</div>;
  if (error) return <div className="text-center mt-8 text-red-500">Error: {error}</div>;

  if (!pack || Object.keys(pack).length === 0) return <div>No se encontró el paquete</div>;

  const center = [parseFloat(pack.lat), parseFloat(pack.lng)];

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };
  
  return (
    <div className="container mx-auto mt-8 p-4">
      <h2 className="text-4xl font-bold font-nunito text-ColorMorado mb-8">{pack.title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <img src={pack.images[0]} alt={pack.title} className="w-full h-auto rounded-md shadow-md" />
          <div className="mt-4">
            <h3 className="text-2xl font-bold mb-2">Detalles del Paquete</h3>
            <p className="text-lg">{pack.detail}</p>
            <p className="text-lg mt-2">Precio: ${pack.price}</p>
            <p className="text-lg mt-2">Días: {pack.days}</p>
            <p className="text-lg mt-2">Ciudad: {pack.city}</p>
            <p className="text-lg mt-2">Destino: {pack.location}</p>
            <div className="mt-4">
              <h3 className="text-2xl font-bold mb-2">Selecciona una fecha</h3>
              <select 
                value={selectedDate} 
                onChange={handleDateChange} 
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Selecciona una fecha</option>
                {pack.fechas && pack.fechas.map((fecha, index) => (
                  <option key={index} value={`${fecha.salida} a ${fecha.vuelta}`}>
                    {fecha.salida} - {fecha.vuelta}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Link to="/pay">
          <button className="bg-ColorAzul hover:bg-ColorMorado text-white font-nunito font-semibold py-2 px-4 rounded-md mt-4">
            Pagar
          </button>
          </Link>
        </div>

        <div>
          <h3 className="text-2xl font-bold mb-4">Ubicación</h3>
          <div style={{ height: '400px', width: '50%' }}>
            <MapContainer
              center={center}
              zoom={13}
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer url={MAP_LAYER_URL} attribution={MAP_LAYER_ATTRIBUTION} />
              <Marker position={center}>
                <Popup>
                  {pack.title}
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailNuevo;


