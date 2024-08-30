import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { fetchPacks } from '../redux/NewActions/newActions';
import { Link } from 'react-router-dom';
import { FaPlaneDeparture } from 'react-icons/fa';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

const PackCard = () => {
  const dispatch = useDispatch();
  const packs = useSelector((state) => state.packs);

  useEffect(() => {
    dispatch(fetchPacks());
  }, [dispatch]);

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    centerMode: true,
    centerPadding: '20px',
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          infinite: true,
          dots: true,
          centerPadding: '10px',
        }
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          centerPadding: '5px',
        }
      }
    ]
  };

  return (
    <div className="container mx-auto mt-6 p-4">
      <h1 className='font-nunito bg-ColorAzul text-gray-700 font-bold p-4 text-2xl w-screen mx-0 px-0 text-center mb-4 mt-4'>Paquetes Disponibles</h1>
      
      <Slider {...settings} className="px-4">
        {packs.map((pack) => (
          <div
            key={pack.id}
            className="bg-white rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300 cursor-pointer flex flex-col p-6"
          >
            <img
              src={pack.images[0]}
              alt={pack.title}
              className="w-full h-60 object-cover rounded-t-lg" 
            />
            <div className="p-4 flex-grow flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-semibold font-nunito text-gray-600">{pack.title}</h3> 
                <div className="flex justify-between items-center mt-2">
                  <span className="text-ColorMorado font-bold font-nunito text-lg">${pack.price}</span>
                  <span className="bg-ColorAzul text-gray-600 text-lg font-semibold font-nunito border-2 px-6 py-1 rounded-md"> 
                    {pack.days} días
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-sm text-ColorAzul">{pack.destino}</span>
                </div>
              </div>
              <div className="mt-2 flex justify-start items-center">
                <Link to={`/detail/${pack.id}`} className="flex items-center gap-2">
                  <FaPlaneDeparture className="text-ColorAzul hover:text-gray-400 text-2xl cursor-pointer" />
                  <span className="text-ColorAzul hover:text-gray-400 font-semibold font-nunito text-lg">Reservá</span>
                </Link>
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
  );
};

export default PackCard;






