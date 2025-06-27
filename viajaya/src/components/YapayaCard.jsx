import { useEffect } from 'react';
// ✅ Cambiar a los nuevos hooks de Redux Toolkit
import { useAppDispatch } from '../redux/hooks/hooks';
import { usePackages } from '../redux/hooks/hooks';
// ✅ Usar la nueva acción de packageSlice
import { fetchAllPackages } from '../redux/slices/packageSlice';
import { config } from '../utils/env';

import { FaPlaneDeparture, FaCoins } from 'react-icons/fa';
import { HiWifi } from 'react-icons/hi';
import { GrCafeteria } from 'react-icons/gr';
import { MdAirplaneTicket } from 'react-icons/md';
import { PiSwimmingPoolThin } from 'react-icons/pi';
import { CgGym } from 'react-icons/cg';
import { RiHotelBedLine } from 'react-icons/ri';
import { Link } from 'react-router-dom';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

import logo from '../assets/sn/logoYapaYa.png';

const YapayaCard = () => {
  // ✅ Usar los nuevos hooks de Redux Toolkit
  const dispatch = useAppDispatch();
  const { packages, loading, error } = usePackages();

  useEffect(() => {
    // ✅ Usar la nueva acción de packageSlice
    dispatch(fetchAllPackages());
  }, [dispatch]);

  // ✅ Manejo de loading y error
  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ColorAzul mx-auto mb-4"></div>
          <p className="text-gray-600 font-nunito">Cargando ofertas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    // ✅ Mostrar error solo en desarrollo
    if (config?.isDevelopment) {
      console.error('Error cargando paquetes:', error);
    }
    
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-nunito">Error al cargar las ofertas</p>
          <button 
            onClick={() => dispatch(fetchAllPackages())}
            className="mt-2 bg-ColorAzul text-white px-4 py-2 rounded hover:bg-ColorMorado transition"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // ✅ Filtrar paquetes YapaYa activos
  const filteredPacks = packages.filter(pack => pack.isYapaya && pack.isActive);

  // ✅ Si no hay paquetes, mostrar mensaje
  if (filteredPacks.length === 0) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 font-nunito text-lg">No hay ofertas disponibles en este momento</p>
          <Link to="/allpacks">
            <button className="mt-4 bg-ColorAzul text-white px-6 py-2 rounded hover:bg-ColorMorado transition">
              Ver todos los paquetes
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // ✅ Configuración del slider mejorada
  const settings = {
    dots: true,
    infinite: filteredPacks.length > 3,
    speed: 500,
    slidesToShow: Math.min(filteredPacks.length, 3),
    slidesToScroll: 1,
    centerMode: filteredPacks.length < 3,
    centerPadding: filteredPacks.length === 1 ? '25%' : filteredPacks.length === 2 ? '10%' : '0px',
    autoplay: filteredPacks.length > 1, // ✅ Auto-play solo si hay más de 1 paquete
    autoplaySpeed: 4000,
    pauseOnHover: true,
    arrows: filteredPacks.length > 1, // ✅ Flechas solo si hay más de 1 paquete
    
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: Math.min(filteredPacks.length, 2),
          slidesToScroll: 1,
          infinite: filteredPacks.length > 2,
          centerPadding: '0px',
          autoplay: filteredPacks.length > 1,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          centerPadding: '0px',
          autoplay: filteredPacks.length > 1,
        },
      },
    ],
  };

  // ✅ Mapa de iconos mejorado
  const iconMap = {
    Wifi: <HiWifi className="text-2xl text-gray-600" title="WiFi" />,
    Desayuno: <GrCafeteria className="text-2xl text-gray-600" title="Desayuno" />,
    aereos: <MdAirplaneTicket className="text-2xl text-gray-600" title="Vuelos" />,
    piscina: <PiSwimmingPoolThin className="text-2xl text-gray-600" title="Piscina" />,
    gym: <CgGym className="text-2xl text-gray-600" title="Gimnasio" />,
    Hotel: <RiHotelBedLine className="text-2xl text-gray-600" title="Hotel" />,
  };

  return (
    <div>
      <h1 className='font-nunito bg-ColorAzul text-gray-700 font-bold p-2 text-2xl w-screen mx-0 px-0 text-center mb-4 mt-4'>
        CONOCE LAS OFERTAS DEL DÍA
      </h1>
      
      <div className="relative w-full h-125 justify-center mt-6 mr-0 ml-0 p-2">
        <Slider {...settings} className="px-4">
          {filteredPacks.map((pack) => (
            <div
              key={pack.id}
              className="bg-moradito rounded-3xl shadow-lg hover:shadow-2xl cursor-pointer flex flex-col p-4 transform hover:scale-105 transition-transform duration-300 relative border-8 border-white my-12"
              style={{ 
                width: filteredPacks.length === 1 ? '70%' : filteredPacks.length === 2 ? '45%' : '80%',
                margin: filteredPacks.length < 3 ? '0 auto' : '10px',
                boxSizing: 'border-box',
                animation: 'shine 2s infinite linear',
                overflow: 'hidden',
              }}
            >
              {/* ✅ Manejo mejorado de imágenes */}
              <img
                src={pack.images?.[0] || '/placeholder-image.jpg'}
                alt={pack.title || 'Paquete turístico'}
                className="w-full h-80 object-cover rounded-t-lg"
                style={{ borderRadius: '12px' }}
                onError={(e) => {
                  e.target.src = '/placeholder-image.jpg'; // ✅ Imagen de respaldo
                }}
                loading="lazy" // ✅ Lazy loading para mejor rendimiento
              />
              
              {/* Logo en la esquina */}
              <img
                src={logo}
                alt="Logo YapaYa"
                className="absolute -top-8 -right-14 lg:w-72 lg:h-40 md:w-32 md:h-32"
                style={{ zIndex: 10 }}
                loading="lazy"
              />

              <div className="p-4 flex-grow flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-semibold font-nunito text-gray-600">
                    {pack.title || 'Paquete sin título'}
                  </h3>
                  <p className="text-gray-600 font-nunito">
                    Destino: {pack.destino || 'Por definir'}
                  </p>

                  <div className="flex justify-between items-center mt-2">
                    <p className="text-green-600 font-bold font-nunito text-lg">
                      <FaCoins className="inline-block mr-1 text-yellow-500" />
                      {/* ✅ Manejo seguro del precio */}
                      {pack.price ? 
                        Number(pack.price).toLocaleString('es-CO', { 
                          style: 'currency', 
                          currency: 'COP' 
                        }) : 
                        'Precio a consultar'
                      }
                    </p>
                    <span className="bg-ColorAzul text-gray-600 text-lg font-semibold font-nunito border-2 px-6 py-1 rounded-md"> 
                      {pack.days || 0} días
                    </span>
                  </div>
                </div>

                <div className="mt-2 flex justify-start items-center">
                  <Link 
                    to={`/detail/${pack.id}`} 
                    className="flex items-center gap-2 hover:scale-105 transition-transform"
                    aria-label={`Ver detalles de ${pack.title}`}
                  >
                    <FaPlaneDeparture className="text-ColorAzul hover:text-gray-400 text-2xl cursor-pointer" />
                    <span className="text-gray-600 hover:text-gray-400 font-semibold font-nunito text-lg">
                      Reserva
                    </span>
                  </Link>
                </div>

                {/* ✅ Características del paquete mejoradas */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {pack?.chars?.map((char, index) => (
                    <div key={index} className="flex items-center gap-1 tooltip">
                      {iconMap[char] || <span className="text-gray-600 text-sm">{char}</span>}
                    </div>
                  )) || (
                    <p className="text-gray-500 text-sm">Sin características especificadas</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </Slider>

        <div className="text-center mt-10">
          <Link to="/allpacks">
            <button className="bg-ColorAzul text-sm hover:bg-ColorMorado text-white text-center font-nunito font-semibold py-3 px-6 rounded-md transition duration-300 ease-in-out hover:scale-105 transform">
              Ver todos los paquetes
              <span className="ml-2">→</span>
            </button>
          </Link>
        </div>

        {/* ✅ Debug info solo en desarrollo */}
        {config?.isDevelopment && (
          <div className="mt-4 p-2 bg-gray-100 rounded text-sm text-gray-600">
            <p>Paquetes totales: {packages.length}</p>
            <p>Paquetes YapaYa activos: {filteredPacks.length}</p>
            <p>Estado: {loading ? 'Cargando...' : 'Cargado'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default YapayaCard;