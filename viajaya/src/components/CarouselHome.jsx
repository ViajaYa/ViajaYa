import { useState } from "react";
import nacionales from "../assets/flipcard/destinacionales.jpg";
import europoa from "../assets/flipcard/europoa.jpg";
import internacionales from "../assets/flipcard/internacionales.jpg";
import macarena from "../assets/flipcard/lamacarena.jpg";
import tierra from "../assets/flipcard/portierra.jpg";

const CarouselHome = () => {
    const initialImages = [
        { src: nacionales, title: "Nacionales" },
        { src: europoa, title: "Europa" },
        { src: internacionales, title: "Internacionales" },
        { src: macarena, title: "LLano" },
        { src: tierra, title: "Por Tierra" }
    ];

    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAll, setShowAll] = useState(true);

    const handlePrev = () => {
        if (!showAll) {
            setCurrentIndex((prevIndex) =>
                prevIndex === 0 ? initialImages.length - 1 : prevIndex - 1
            );
        }
    };

    const handleNext = () => {
        if (showAll) {
            setShowAll(false);
            setCurrentIndex(0);
        } else {
            setCurrentIndex((prevIndex) => {
                if (prevIndex === initialImages.length - 1) {
                    // Si estamos en la última imagen, volvemos a mostrar todas las imágenes
                    setShowAll(true);
                    return 0; // Reiniciamos el índice
                } else {
                    return prevIndex + 1;
                }
            });
        }
    };

    return (
        <div className="relative w-full h-125 overflow-hidden mt-20">
            {/* Contenedor de imágenes */}
            {showAll ? (
                <div className="flex justify-center transition-transform duration-500 ease-in-out">
                    {initialImages.map((image, index) => (
                        <div key={index} className="relative w-1/5 h-full">
                            <img
                                src={image.src}
                                alt={`Slide ${index}`}
                                className="w-full h-full object-cover"
                                style={{ maxHeight: '500px' }}
                            />
                            {/* Título superpuesto */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <h2 className="text-white  text-3xl font-bold bg-black bg-opacity-50 p-2 rounded font-nunito">
                                    {image.title}
                                </h2>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
              <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
              {initialImages.map((image, index) => (
                  <div key={index} className="relative w-full h-full flex-shrink-0 flex items-center">
                      {/* Imagen del lado izquierdo */}
                      <div className="w-full h-full flex flex-row  bg-slate-900">
                          <img
                              src={image.src}
                              alt={`Slide ${index}`}
                              className="w-full h-full object-contain mt-2 p-6 rounded-2xl"
                              style={{ maxHeight: '500px' }}
                          />

<div className="w-1/2 h-full flex flex-col justify-center p-8 bg-ColorMorado text-white mt-32 mr-48 border-4 rounded-2xl">
                          <h2 className="text-3xl font-bold mb-4 font-nunito">{image.title}</h2>
                          <p className="text-lg font-nunito">
                              Descripción breve del lugar. Aquí puedes agregar información adicional
                              sobre el destino, incluyendo detalles interesantes y aspectos destacados.
                          </p>
                      </div>

                      </div>
                      
                      {/* Título y descripción del lado derecho */}
                     
                  </div>
              ))}
                </div>
            )}

            {/* Botón Anterior */}
            <button
                className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-gray-800 text-white px-2 py-1"
                onClick={handlePrev}
                disabled={showAll}
            >
                &#10094;
            </button>

            {/* Botón Siguiente */}
            <button
                className="absolute top-1/2 right-0 transform -translate-y-1/2 bg-gray-800 text-white px-2 py-1"
                onClick={handleNext}
            >
                &#10095;
            </button>
        </div>
    );
};

export default CarouselHome;







