import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { fetchPacks } from '../redux/NewActions/newActions';
import { Link } from 'react-router-dom'; // Importar el componente Link
import NavBar from './layout/NavBar/NavBar';
import { FaPlaneDeparture, FaTag, FaCoins} from 'react-icons/fa';

const AllPacks = () => {
  const dispatch = useDispatch();

  // Obtener los paquetes del estado
  const packs = useSelector((state) => state.packs);

  useEffect(() => {
    dispatch(fetchPacks());
  }, [dispatch]);

  return (
    
    <div className="container mx-auto mt-12 p-4">
      <div className='fixed top-0 left-0 z-50 w-full'>
        <NavBar />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
        {packs.map((pack) => (
          <div key={pack.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <img src={pack.images[0]} alt={pack.title} className="w-full h-48 object-cover" />
            <div className="p-4">
              <h3 className="text-xl font-semibold font-nunito">{pack.title}</h3>
              <p className="text-gray-600 font-nunito">Destinos {pack.destino}</p>
              <div className="flex justify-between items-center mt-4">
              <p className="text-green-600 font-bold font-nunito text-lg"><FaCoins className="inline-block mr-1 text-yellow-500" />
                  {pack.price}   <FaTag className="inline-block mr-1 text-gray-600" />    
                        </p>
                <span className="bg-ColorAzul text-gray-600 text-lg font-semibold font-nunito border-2 px-6 py-1 rounded-md"> 
                    {pack.days} días
                  </span>
              </div>
              <div className="mt-2">
                {/* <span className="text-sm text-ColorAzul font-nunito">Destinos {pack.destino}</span> */}
              </div>
              <div className="mt-2 flex justify-start items-center">
                <Link to={`/detail/${pack.id}`} className="flex items-center gap-2">
                  <FaPlaneDeparture className="text-ColorAzul hover:text-gray-400 text-2xl cursor-pointer" />
                  <span className="text-gray-600 hover:text-gray-400 font-semibold font-nunito text-lg">Reserva</span>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllPacks;
