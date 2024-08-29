import React, { useEffect } from 'react';
import { Element } from 'react-scroll';
import { useInView } from 'react-intersection-observer';
import { useAnimation, motion } from 'framer-motion';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Instagram from './InstagramReel'
import InstagramReelCarousel from './InstagramReelCarousel';
import l1 from "../../../assets/aliados/13.png";
import l2 from "../../../assets/aliados/2.png";
import l3 from "../../../assets/aliados/12.webp";
import l4 from "../../../assets/aliados/4.png";
import l5 from "../../../assets/aliados/5.png";
import l6 from "../../../assets/aliados/6.png";
import l7 from "../../../assets/aliados/7.png";
import l8 from "../../../assets/aliados/8.png";
import l9 from "../../../assets/aliados/9.png";
import l10 from "../../../assets/aliados/10.png";
import l11 from "../../../assets/aliados/11.png";

import c1 from "../../../assets/c1.mp4";
import c2 from "../../../assets/c2.jpeg";
import c3 from "../../../assets/c3.jpeg";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

const Clients2 = () => {

  const { ref, inView } = useInView({
    threshold: 0.05
  });
  const animation = useAnimation();
  const reelUrl = "https://www.instagram.com/reel/C_O6gHfAAQt/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA=="; //https://www.instagram.com/reel/C_O6gHfAAQt/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==// Reemplaza con la URL de tu reel
  useEffect(() => {
    if (inView) {
      animation.start({
        opacity: 1,
        transition: {
          type: "spring",
          duration: 1,
          bounce: 0.3
        }
      });
    } else {
      animation.start({
        opacity: 0
      });
    }
  }, [inView]);

  const settings = {
    infinite: true,
    slidesToScroll: 1,
    slidesToShow: 3,
    autoplay: true,
    autoplaySpeed: 5000,
    pauseOnHover: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
        }
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
        }
      }
    ]
  };

  return (
    <Element name="clientes">
      <motion.div animate={animation} ref={ref} className="flex flex-col items-center py-8 mb-24" id="clientes">

        <h1 className="font-nunito bg-ColorAzul text-gray-700 font-bold p-4 text-2xl w-full text-center mb-8">
          NUESTROS CLIENTES
        </h1>
        <div>
     
      <Instagram reelUrl={reelUrl} />
    </div>


        <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20">
          <Slider key={Math.random()} {...settings}>
            <div className="flex justify-center">
              <img src={c2} className="object-cover w-full h-80 rounded-lg shadow-lg" alt="Cliente 1" />
            </div>
            <div className="flex justify-center">
              <img src={c3} className="object-cover w-full h-80 rounded-lg shadow-lg" alt="Cliente 2" />
            </div>
            <div className="flex justify-center">
              <img src={c1} className="object-cover w-full h-80 rounded-lg shadow-lg" alt="Cliente 3" />
            </div>
            <div className="flex justify-center">
              <img src={l4} className="object-cover w-full h-80 rounded-lg shadow-lg" alt="Cliente 4" />
            </div>
            {/* <div className="flex justify-center">
              <img src={l5} className="object-cover w-full h-80 rounded-lg shadow-lg" alt="Cliente 5" />
            </div>
            <div className="flex justify-center">
              <img src={l6} className="object-cover w-full h-80 rounded-lg shadow-lg" alt="Cliente 6" />
            </div>
            <div className="flex justify-center">
              <img src={l7} className="object-cover w-full h-80 rounded-lg shadow-lg" alt="Cliente 7" />
            </div>
            <div className="flex justify-center">
              <img src={l8} className="object-cover w-full h-80 rounded-lg shadow-lg" alt="Cliente 8" />
            </div>
            <div className="flex justify-center">
              <img src={l9} className="object-cover w-full h-80 rounded-lg shadow-lg" alt="Cliente 9" />
            </div>
            <div className="flex justify-center">
              <img src={l10} className="object-cover w-full h-80 rounded-lg shadow-lg" alt="Cliente 10" />
            </div>
            <div className="flex justify-center">
              <img src={l11} className="object-cover w-full h-80 rounded-lg shadow-lg" alt="Cliente 11" />
            </div> */}
          </Slider>
        </div>

      
          <button className="bg-ColorAzul text-gray-600 font-bold font-nunito px-8 py-2 rounded-lg shadow-lg hover:bg-ColorMorado mt-2">
            <a href="https://www.instagram.com/stories/highlights/17846810168704295/" target="_blank" rel="noopener noreferrer">
              Mas testimonios
            </a>
          </button>
        
      </motion.div>
    </Element>
  );
};

export default Clients2;
