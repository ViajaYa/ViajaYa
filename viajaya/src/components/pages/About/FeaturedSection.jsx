import React from "react";
import galardones1 from '../../../assets/sn/galardones1.jpg'
import galardones2 from '../../../assets/sn/galardones2.jpg'
import galardones3 from '../../../assets/sn/galardones3.jpg'
import galardones4 from '../../../assets/sn/galardones4.jpg'
import galardones5 from '../../../assets/sn/galardones5.jpg'
import nochegalardones from '../../../assets/sn/nochegalardones.png'

const FeaturedSection = () => {
  const items = [
    {
      imageUrl:galardones1, // Reemplazar con tu imagen
      title: "Título 1",
      description: "Descripción llamativa del primer ítem.",
      reverse: false,
    },
    {
      imageUrl:galardones2, // Reemplazar con tu imagen
      title: "Título 2",
      description: "Descripción llamativa del segundo ítem.",
      reverse: true,
    },
    {
      imageUrl:galardones3, // Reemplazar con tu imagen
      title: "Título 3",
      description: "Descripción llamativa del tercer ítem.",
      reverse: false,
    },
    {
        imageUrl:galardones4, // Reemplazar con tu imagen
        title: "Título 3",
        description: "Descripción llamativa del tercer ítem.",
        reverse: true,
      },
      {
        imageUrl:galardones5, // Reemplazar con tu imagen
        title: "Título 3",
        description: "Descripción llamativa del tercer ítem.",
        reverse: false,
      },
  ];

  return (
    <div>
      {/* Banner de ancho completo */}
      <div className="w-full h-96 bg-cover bg-center bg-galardones" >
        <div className="w-full h-full bg-black bg-opacity-50 flex items-center justify-center">
          <h1 className="text-galardoneslogo text-4xl md:text-6xl font-bold font-nunito text-center  ">Galardonados  En La Noche de los Mejores 
            <br></br>FENALCO 2023</h1>
        </div>
      </div>

     {/* Sección de dos imágenes */}
     <div className="container mx-auto py-16 px-4">
        <div className="flex flex-col md:flex-row items-center justify-between ">
          {/* Primera imagen (lado izquierdo en pantallas grandes) */}
          <div className="w-full md:w-1/2 mb-6 md:mb-0 mr-2">
            <img
              src={galardones1}
              alt="Galardón 1"
              className="w-full h-full object-cover rounded-lg shadow-lg"
            />
          </div>

          {/* Segunda imagen (lado derecho en pantallas grandes) */}
          <div className="w-full md:w-1/2 mb-6 md:mb-0">
            <img
              src={galardones5}
              alt="Galardón 2"
              className="w-full h-full object-cover rounded-lg shadow-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
export default FeaturedSection;
