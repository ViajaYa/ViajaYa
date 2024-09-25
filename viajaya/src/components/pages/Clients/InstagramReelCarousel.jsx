import React, { useEffect } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { useSelector, useDispatch } from 'react-redux';
import { fetchVideos } from '../../../redux/NewActions/newActions';

const InstagramReel = () => {
  const dispatch = useDispatch(); // Crear una instancia de dispatch
  const videos = useSelector((state) => state.videos);
  
  console.log('Videos desde Redux:', videos);

  useEffect(() => {
    dispatch(fetchVideos()); // Llamar a la acción para obtener los videos

    // Cargar el script de Instagram para incrustar el contenido correctamente
    const script = document.createElement('script');
    script.async = true;
    script.src = "https://www.instagram.com/embed.js";
    document.body.appendChild(script);

    // Ejecutar el script para incrustar contenido después de la renderización
    script.onload = () => {
      window.instgrm.Embeds.process();
    };

    return () => {
      document.body.removeChild(script);
    };
  }, [dispatch]);

  // Manejar estados de carga y error
  if (!videos || videos.length === 0) return <div>No hay videos disponibles.</div>;

  // Configuración del slider
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3, // Muestra 3 videos en pantallas grandes
    slidesToScroll: 1,
    responsive: [
      {
        breakpoint: 768, // Cambia a una sola diapositiva en pantallas más pequeñas
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  return (
    <div className="mx-auto max-w-5xl">
    <Slider {...settings}>
      {videos.map((video) => (
        <div key={video.id} className="flex justify-center my-4">
          <blockquote
            className="instagram-media "
            data-instgrm-permalink={video.url} // Aquí se establece la URL del video
            data-instgrm-version="14"
            style={{
              background: '#FFF',
              border: 0,
              borderRadius: '3px',
              boxShadow: '0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)',
              margin: '1px',
              maxWidth: '540px',
              minWidth: '326px',
              padding: 0,
              width: '99.375%',
              
            }}
          ></blockquote>
        </div>
      ))}
    </Slider>
    </div>
  );
};

export default InstagramReel;






