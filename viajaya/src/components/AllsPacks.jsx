import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { fetchPacks } from '../redux/NewActions/newActions';
import { Link, useLocation } from 'react-router-dom'; // Importar useLocation para obtener parámetros de la URL
import NavBar from './layout/NavBar/NavBar';
import { FaPlaneDeparture, FaTag, FaCoins } from 'react-icons/fa';

const AllPacks = () => {
  const dispatch = useDispatch();
  const location = useLocation(); // Obtener la ubicación actual para leer los parámetros de la URL

  // Obtener los paquetes del estado
  const packs = useSelector((state) => state.packs);

  // Obtener el parámetro 'destino' de la URL
  const queryParams = new URLSearchParams(location.search);
  const destinoFilter = queryParams.get('destino');

  // Filtrar los paquetes según el destino y si están activos
  const filteredPacks = destinoFilter
    ? packs.filter(pack => pack.destino === destinoFilter && pack.isActive)
    : packs.filter(pack => pack.isActive); // Filtrar solo los que están activos

  useEffect(() => {
    dispatch(fetchPacks());
  }, [dispatch]);

  return (
    <div className="container mx-auto mt-12 p-4">
      <div className='fixed top-0 left-0 z-50 w-full'>
        <NavBar />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-20 p-6">
        {filteredPacks.length > 0 ? (
          filteredPacks.map((pack) => (
               <Link key={pack.id} to={`/detail/${pack.id}`} className="block hover:shadow-xl transition-shadow duration-300 rounded-lg"> {/* Link envuelve toda la tarjeta */}
            <div key={pack.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <img 
                src={pack.images[0]} 
                alt={pack.title} 
                className="w-full aspect-square object-cover" // Square image
              />
              <div className="p-5 flex-grow flex flex-col"> {/* Consistent padding */}
                <div>
                  <h3 className="text-xl font-bold font-nunito text-gray-800 mb-1 truncate uppercase" title={pack.title}>
                    {pack.title}
                  </h3>
                  <p className="text-base text-gray-600 font-nunito mb-3">
                    Destino: {pack.destino}
                  </p>
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-2">
                    <p className="text-2xl text-green-700 font-bold font-nunito">
                      <FaCoins className="inline-block mr-1.5 text-yellow-500" />
                      {Number(pack.price).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                    <span className="bg-ColorAzul text-white text-sm sm:text-base font-semibold font-nunito px-3 py-1.5 rounded-md self-start sm:self-center">
                      {pack.days} días
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex justify-start items-center">
                
                    <FaPlaneDeparture className="text-ColorAzul hover:text-gray-400 text-2xl cursor-pointer" />
                    <span className="text-gray-600 hover:text-gray-400 font-semibold font-nunito text-lg">Reserva</span>
                 
                </div>
              </div>
            </div>
             </Link>
          ))
        ) : (
          <p className="text-center text-gray-600">No se encontraron paquetes para el destino seleccionado.</p>
        )}
      </div>
    </div>
  );
};

export default AllPacks;

