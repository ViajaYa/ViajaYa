import axios from 'axios';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { setUsers } from '../../../redux/actions/actions';
import { fetchPack, createReservation } from '../../../redux/NewActions/newActions';

const Pay = () => {
  const dispatch = useDispatch();
  const { id } = useParams();
  const navigate = useNavigate();

  const pack = useSelector((state) => state.pack);
  const [loading, setLoading] = useState(true);
  const error = useSelector((state) => state.error); 
  const [user, setUser] = useState(null);
  const [quantity, setQuantity] = useState(1);
  
  useEffect(() => {
    axios.get("/user").then((response) => {
        dispatch(setUsers(response.data));
        setLoading(false);
    }).catch(err => {
        console.error('Error fetching users:', err);
        setLoading(false);
    });

    axios.get(`/user/verify/${localStorage.getItem("token")}`).then((response) => {
        axios.get(`/user/${response.data.id}`).then((response) => setUser(response.data))
          .catch(err => console.error('Error fetching user:', err));
    }).catch(err => console.error('Error verifying user:', err));
  }, [dispatch]);

  useEffect(() => {
    if (id) {
      dispatch(fetchPack(id));
    }
  }, [dispatch, id]);

  const handleReservation = () => {
    if (!user || !pack) {
      console.error('User or Pack data is missing');
      return;
    }
    
    const amount = pack.price * quantity;  // Calcular el monto total
    
    // Crear el mensaje a enviar por WhatsApp
    const message = `Hola, soy ${user.name}. Estoy interesado en el paquete "${pack.title}" con un precio total de $${amount}.`;
  
    // Generar la URL de WhatsApp
    const whatsappUrl = `https://wa.link/28unmk/?text=${encodeURIComponent(message)}`;
  
    // Abrir WhatsApp en una nueva ventana o pestaña
    window.open(whatsappUrl, '_blank');
  };

  if (loading) return <div className="text-center mt-8">Cargando...</div>;
  if (error) return <div className="text-center mt-8 text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="container mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Revisa tu Reserva</h1>
        {pack ? (
          <div>
            <div className="mb-6">
              <p className="text-lg text-gray-800">{pack.title}</p>
            </div>
            <div className="mb-6">
              <p className="text-lg text-gray-800">{pack.destino}</p>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-600">Días:</h3>
              <p className="text-lg text-gray-800">{pack.days}</p>
            </div>
            <div className="mb-6">
              <p className="text-lg text-gray-800">{pack.location}</p>
            </div>
            <div className="mb-6">
              <p className="text-lg text-gray-800">{pack.city}</p>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-600">Precio:</h3>
              <p className="text-lg text-gray-800">${pack.price}</p>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-600">Detalles:</h3>
              <p className="text-lg text-gray-800">{pack.detail}</p>
            </div>
            <div className="mb-6">
              <div className="flex flex-wrap gap-4">
                {pack.images.map((image, index) => (
                  <img key={index} src={image} alt={`Pack ${index}`} className="w-32 h-32 object-cover rounded-md shadow-md" />
                ))}
              </div>
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-600">Incluye</h3>
              <ul className="list-disc list-inside text-lg text-gray-800">
                {pack.chars.map((char, index) => (
                  <li key={index}>{char}</li>
                ))}
              </ul>
            </div>
            <div className="mb-6">
              <label className="block text-lg font-semibold text-gray-600 mb-2" htmlFor="quantity">Cantidad:</label>
              <input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleReservation}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-md transition duration-300 ease-in-out"
            >
              Reservar
            </button>
          </div>
        ) : (
          <p className="text-center text-gray-700">No se encontraron detalles del paquete.</p>
        )}
      </div>
    </div>
  );
};

export default Pay;




