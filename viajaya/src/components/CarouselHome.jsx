import { useState } from "react";
import nacionales from "../assets/flipcard/destinacionales.jpg";
import europoa from "../assets/flipcard/europoa.jpg";
import internacionales from "../assets/flipcard/internacionales.jpg";
import macarena from "../assets/flipcard/lamacarena.jpg";
import tierra from "../assets/flipcard/portierra.jpg";
import Title from "./utils/Title";
import europa from "../assets/flipcard/EuropaCarousel.png";
import internacional from "../assets/flipcard/internacionales.png";
import llano from "../assets/flipcard/llano.png";
import nacionales3 from "../assets/flipcard/nacionales3.png";
import nacionales2 from "../assets/flipcard/nacionales2.png";

const CarouselHome = () => {
    const initialImages = [
        { src: nacionales, title: "Nacionales", description: "Explora destinos nacionales increíbles." },
        { src: europoa, title: "Europa", description: "Descubre las maravillas de Europa." },
        { src: internacionales, title: "Internacionales", description: "Viaja por todo el mundo con nuestras opciones internacionales." },
        { src: macarena, title: "LLano", description: "Conoce los paisajes únicos del llano colombiano." },
        { src: tierra, title: "Por Tierra", description: "Viaja por tierra y descubre nuevas aventuras." }
    ];

    const newImages = [
        { src: europa, title: "Europa", description: "Descubre las maravillas de Europa." },
        { src: internacional, title: "Internacionales", description: "Viaja por todo el mundo." },
        { src: llano, title: "LLano", description: "Conoce los paisajes únicos del llano." },
        { src: nacionales3, title: "Nacionales", description: "Explora destinos nacionales increíbles." },
        { src: nacionales2, title: "Por Tierra", description: "Explora aún más destinos nacionales." }
    ];

    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAll, setShowAll] = useState(true);

    const handlePrev = () => {
        if (!showAll) {
            setCurrentIndex((prevIndex) =>
                prevIndex === 0 ? newImages.length - 1 : prevIndex - 1
            );
        }
    };

    const handleNext = () => {
        if (showAll) {
            setShowAll(false);
            setCurrentIndex(0);
        } else {
            setCurrentIndex((prevIndex) => {
                if (prevIndex === newImages.length - 1) {
                    setShowAll(true);
                    return 0;
                } else {
                    return prevIndex + 1;
                }
            });
        }
    };

    return (
        <div className="relative w-full h-125 overflow-hidden mt-16 bg-slate-200">
            {/* Contenedor de imágenes */}
            {showAll ? (
                <div className="flex justify-center transition-transform duration-500 ease-in-out">
                    {initialImages.map((image, index) => (
                        <div key={index} className="relative w-1/5 h-full">
                            <img
                                src={image.src}
                                alt={`Slide ${index}`}
                                className="w-full h-full object-cover"
                                style={{ height: '500px' }} // Establecer altura fija
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <h2 className="text-white text-2xl font-bold bg-black bg-opacity-50 p-2 rounded font-nunito">
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
                    {newImages.map((image, index) => (
                        <div key={index} className="relative w-full h-full flex-shrink-0 flex items-center">
                            <div className="w-1/2 h-full">
                                <img
                                    src={image.src}
                                    alt={`Slide ${index}`}
                                    className="w-full h-full object-contain"
                                    style={{ height: '500px', marginLeft: '10%' }} // Asegurar altura consistente
                                />
                            </div>
                            <div className="w-1/2 h-full flex flex-col justify-center items-center text-gray-700">
                                <Title styleAdd="text-4xl sm:text-4xl font-nunito animate-fade-up animate-ease-in-out">
                                    <a href="#" onClick={() => alert(`Clicked on ${image.title}`)}>
                                        {image.title}
                                    </a>
                                </Title>
                                <Title styleAdd="text-xl font-nunito sm:text-2xl animate-fade-up animate-delay-200 animate-ease-in-out">
                                    {image.description}
                                </Title>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Botón Anterior */}
            <button
                className="absolute top-1/2 left-5 transform -translate-y-1/2 bg-gray-800 text-white px-2 py-1"
                onClick={handlePrev}
                disabled={showAll}
            >
                &#10094;
            </button>

            {/* Botón Siguiente */}
            <button
                className="absolute top-1/2 right-5 transform -translate-y-1/2 bg-gray-800 text-white px-2 py-1"
                onClick={handleNext}
            >
                &#10095;
            </button>
        </div>
    );
};

export default CarouselHome;












