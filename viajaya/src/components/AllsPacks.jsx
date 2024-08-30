import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { fetchPacks } from '../redux/NewActions/newActions';
import { Link } from 'react-router-dom'; // Importar el componente Link
import NavBar from './layout/NavBar/NavBar';

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
              <p className="text-gray-600 font-nunito">{pack.detail}</p>
              <div className="flex justify-between items-center mt-4">
                <span className="text-ColorMorado font-bold font-nunito">${pack.price}</span>
                <span className="text-sm text-gray-500 font-nunito">{pack.days} días</span>
              </div>
              <div className="mt-2">
                <span className="text-sm text-ColorAzul font-nunito">{pack.destino}</span>
              </div>
              <div className="mt-4 flex justify-between">
                
                <Link to={`/detail/${pack.id}`}>
                  <button className="bg-ColorAzul hover:bg-gray-400 text-white font-nunito font-semibold py-2 px-4 rounded-md">
                    Ver más
                  </button>
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
