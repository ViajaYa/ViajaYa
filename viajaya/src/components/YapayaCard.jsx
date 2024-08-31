import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { fetchPacks } from '../redux/NewActions/newActions';
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

import logo from '../assets/sn/logoYapaYa.png'; // Asegúrate de que la ruta al logo sea correcta

const YapayaCard = () => {
  const dispatch = useDispatch();
  const packs = useSelector((state) => state.packs);

  useEffect(() => {
    dispatch(fetchPacks());
  }, [dispatch]);

  const settings = {
    dots: true,
    infinite: packs.length > 3,
    speed: 500,
    slidesToShow: Math.min(packs.length, 3),  // Mostrar 1 o 2 según la cantidad de packs
    slidesToScroll: 1,
    centerMode: packs.length < 3, // Centrar si hay menos de 3 packs
    centerPadding: packs.length === 1 ? '25%' : packs.length === 2 ? '10%' : '0px',
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: packs.length >= 2 ? 2 : 1, // Mostrar 1 o 2 según la cantidad de packs
          slidesToScroll: 1,
          infinite: packs.length > 3,
          centerPadding: packs.length === 1 ? '25%' : '10%',
        }
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          centerPadding: '0px', // Sin padding para pantallas pequeñas
        }
      }
    ]
  };

  const iconMap = {
    Wifi: <HiWifi className="text-2xl text-gray-600" />,
    Desayuno: <GrCafeteria className="text-2xl text-gray-600" />,
    aereos: <MdAirplaneTicket className="text-2xl text-gray-600" />,
    piscina: <PiSwimmingPoolThin className="text-2xl text-gray-600" />,
    gym: <CgGym className="text-2xl text-gray-600" />,
    Hotel: <RiHotelBedLine className="text-2xl text-gray-600" />,
  };

  const filteredPacks = packs.filter(pack => pack.isActive && pack.isYapaya);

  return (
    <div>
      <h1 className='font-nunito bg-ColorAzul text-gray-700 font-bold p-4 text-2xl w-screen mx-0 px-0 text-center mb-4 mt-4'>CONOCE LAS OFERTAS DEL DIA</h1>
      
      <div className="relative w-full h-125 justify-center mx-auto mt-6 p-8 mr-0 ml-0">
        
        <Slider {...settings} className="px-4">
          {filteredPacks.map((pack) => (
            <div
              key={pack.id}
              className=" bg-moradito rounded-3xl shadow-lg hover:shadow-2xl cursor-pointer flex flex-col p-2 m-10 transform hover:scale-105 transition-transform duration-300 relative border-8 border-white"
              style={{ 
                width: packs.length === 1 ? '80%' : packs.length === 2 ? '50%' : '90%',
                margin: packs.length < 3 ? '0 auto' : '0',
                boxSizing: 'border-box',
                animation: 'shine 2s infinite linear',
                overflow: 'hidden' // Evita el recorte
              }}
            >
              <img
                src={pack.images[0]}
                alt={pack.title}
                className="w-full h-60 object-cover rounded-t-lg" 
              />

              {/* Logo en la esquina */}
              <img
                src={logo}
                alt="Logo"
                className="absolute -top-6 -right-14 lg:w-72 lg:h-40 md:w-32 md:h-32"
                style={{ 
                  zIndex: 10 // Asegura que el logo no se vea afectado por la animación de la tarjeta
                }}
              />

              <div className="p-4 flex-grow flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-semibold font-nunito text-gray-600">{pack.title}</h3> 
                  <p className="text-gray-600 font-nunito">Destinos {pack.destino}</p>
                  
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-green-600 font-bold font-nunito text-lg">
                      <FaCoins className="inline-block mr-1 text-yellow-500" />
                      {pack.price}       
                    </p>
                    <span className="bg-ColorAzul text-gray-600 text-lg font-semibold font-nunito border-2 px-6 py-1 rounded-md"> 
                      {pack.days} días
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex justify-start items-center">
                  <Link to={`/detail/${pack.id}`} className="flex items-center gap-2">
                    <FaPlaneDeparture className="text-ColorAzul hover:text-gray-400 text-2xl cursor-pointer" />
                    <span className="text-gray-600 hover:text-gray-400 font-semibold font-nunito text-lg">Reserva</span>
                  </Link>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {pack?.chars.map((char, index) => (
                    <div key={index} className="flex items-center gap-1">
                      {iconMap[char] || <span className="text-gray-600">{char}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </Slider>

        <div className="text-center mt-6">
          <Link to="/allpacks">
            <button className="bg-ColorAzul text-xs hover:bg-ColorMorado text-white text-center font-nunito font-semibold py-1 px-2 rounded-md transition duration-300 ease-in-out">
              Ver todos
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default YapayaCard;




