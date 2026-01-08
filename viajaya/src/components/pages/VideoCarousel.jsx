import { useEffect } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { useSelector, useDispatch } from 'react-redux';
import { fetchVideos } from '../../redux/NewActions/newActions';

const VideoCarousel = () => {
  const dispatch = useDispatch();
  
  // Obtener los videos del estado global (Redux)
  const videos = useSelector((state) => state.videos?.videos || []);
  console.log('Videos desde Redux:', videos);

  useEffect(() => {
    // Llamar la acción para obtener los videos al montar el componente
    dispatch(fetchVideos());
  }, [dispatch]);

  // Si no hay videos disponibles, mostrar un mensaje
  if (!videos || videos.length === 0) {
    return <div>No hay videos disponibles.</div>;
  }

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3, // Muestra 3 videos en pantallas grandes
    slidesToScroll: 1,
    centerMode: false, // Centra el video
    centerPadding: '10%',
    responsive: [
      {
        breakpoint: 768, // Cambia a una sola diapositiva en pantallas más pequeñas
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          centerMode: true
        },
      },
    ],
  };

  return (
    <div className="mb-8">
    <div className="flex items-center  mt-0 justify-center bg-ColorAzul mb-16 pt-2 ">

  <h1 className="font-nunito text-gray-700 font-bold text-2xl p-4 ">
  CLIENTES FELICES
  </h1>
</div>
    <div className="h-full mx-auto max-w-5xl ">

<Slider {...settings}>

      
        {videos.map((video, index) => (
          <div key={index} className="flex justify-center">
            <video
              className="w-full h-auto max-w-[90%] object-cover rounded-lg"
              controls
              src={video.url} // Usar la URL del video desde Redux
              style={{ aspectRatio: '9/16' }} // Asegurar formato vertical
            />
          </div>
        ))}
        </Slider>
      </div>
      </div>
  );
};

export default VideoCarousel;


