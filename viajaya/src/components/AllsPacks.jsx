import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { 
  fetchAllPackages,
  selectPackages,
  selectPackageLoading,
  selectPackageError,
  clearPackageError
} from '../redux/slices/packageSlice';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import NavBar from './layout/NavBar/NavBar';
import { FaPlaneDeparture, FaTag, FaCoins } from 'react-icons/fa';

const AllPacks = () => {
  const dispatch = useDispatch();
  const location = useLocation();

  // ✅ Usar selectores del packageSlice con validación
  const packages = useSelector(selectPackages) || [];
  const loading = useSelector(selectPackageLoading);
  const error = useSelector(selectPackageError);

  // Obtener el parámetro 'destino' de la URL
  const queryParams = new URLSearchParams(location.search);
  const destinoFilter = queryParams.get('destino');

  // ✅ Filtrar paquetes con validación de datos
  const filteredPacks = destinoFilter
    ? packages.filter(pack => pack && pack.destino === destinoFilter && pack.isActive)
    : packages.filter(pack => pack && pack.isActive);

  // ✅ Cargar paquetes al montar el componente
  useEffect(() => {
    dispatch(fetchAllPackages());
  }, [dispatch]);

  // ✅ Manejar errores
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearPackageError());
    }
  }, [error, dispatch]);

  // ✅ Debug: Log para verificar filtros
  useEffect(() => {
    console.log('AllsPacks - Total packages:', packages.length);
    console.log('AllsPacks - Filtered packages:', filteredPacks.length);
    console.log('AllsPacks - Destino filter:', destinoFilter);
  }, [packages, filteredPacks, destinoFilter]);

  // ✅ Estados de carga y error
  if (loading) {
    return (
      <div className="container mx-auto mt-12 p-4">
        <div className='fixed top-0 left-0 z-50 w-full'>
          <NavBar />
        </div>
        <div className="flex justify-center items-center h-96 mt-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600 font-nunito">Cargando paquetes...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto mt-12 p-4">
        <div className='fixed top-0 left-0 z-50 w-full'>
          <NavBar />
        </div>
        <div className="flex justify-center items-center h-96 mt-20">
          <div className="text-red-600 text-center">
            <h3 className="text-lg font-semibold mb-2 font-nunito">Error al cargar paquetes</h3>
            <p className="font-nunito">{error}</p>
            <button 
              onClick={() => dispatch(fetchAllPackages())}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-nunito"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto mt-12 p-4">
      <div className='fixed top-0 left-0 z-50 w-full'>
        <NavBar />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-20 p-6">
        {filteredPacks.length > 0 ? (
          filteredPacks.map((pack) => (
            <Link key={pack.id} to={`/detail/${pack.id}`} className="block hover:shadow-xl transition-shadow duration-300 rounded-lg">
              <div className="bg-white rounded-lg shadow-md overflow-hidden h-full">
                <img 
                  src={pack.images?.[0] || '/placeholder-image.jpg'} 
                  alt={pack.title || 'Paquete turístico'} 
                  className="w-full aspect-square object-cover"
                  onError={(e) => {
                    e.target.src = '/placeholder-image.jpg';
                  }}
                />
                <div className="p-5 flex-grow flex flex-col">
                  <div>
                    <h3 className="text-xl font-bold font-nunito text-gray-800 mb-1 truncate uppercase" title={pack.title || 'Sin título'}>
                      {pack.title || 'Sin título'}
                    </h3>
                    <p className="text-base text-gray-600 font-nunito mb-3">
                      Destino: {pack.destino || 'No especificado'}
                    </p>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-2">
                      <p className="text-2xl text-green-700 font-bold font-nunito">
                        <FaCoins className="inline-block mr-1.5 text-yellow-500" />
                        {pack.price ? 
                          Number(pack.price).toLocaleString('es-CO', { 
                            style: 'currency', 
                            currency: 'COP', 
                            minimumFractionDigits: 0, 
                            maximumFractionDigits: 0 
                          })
                          : 'Precio a consultar'
                        }
                      </p>
                      <span className="bg-ColorAzul text-white text-sm sm:text-base font-semibold font-nunito px-3 py-1.5 rounded-md self-start sm:self-center">
                        {pack.days || 0} días
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
          <div className="col-span-full text-center py-12">
            <div className="text-gray-500 text-lg font-nunito mb-4">
              📦 No se encontraron paquetes
            </div>
            <p className="text-gray-400 font-nunito">
              {destinoFilter 
                ? `No hay paquetes disponibles para el destino "${destinoFilter}"`
                : 'No hay paquetes activos disponibles en este momento'
              }
            </p>
            <button 
              onClick={() => dispatch(fetchAllPackages())}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-nunito"
            >
              🔄 Actualizar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllPacks;

