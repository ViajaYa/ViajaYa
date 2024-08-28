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
        { src: europa, title: "Reservá", description: "Europa." },
        { src: internacional, title: "Reservá", description: "Internacionales." },
        { src: llano, title: "Reservá", description: "Nacionales." },
        { src: nacionales3, title: "Reservá", description: "Llano." },
        { src: nacionales2, title: "Reservá", description: "Por Tierra." }
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
                        <div
                            key={index}
                            className="relative w-1/5 h-full"
                            style={{
                                backgroundImage: `url(${image.src})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                height: '500px'
                            }}
                        >
                            <div className="absolute inset-0 flex items-center justify-center">
                                <h2 className="text-white text-2xl font-bold bg-black bg-opacity-50 p-2 rounded font-nunito rounded-xl">
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
                        <div
                            key={index}
                            className="relative w-full h-full flex-shrink-0 flex items-center"
                            style={{
                                backgroundImage: `url(${image.src})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                height: '500px',
                            }}
                        >
                            <div className="w-full h-full flex flex-col justify-center items-end mr-16 text-white ">
                                <Title styleAdd="text-4xl sm:text-4xl font-nunito animate-fade-up animate-ease-in-out bg-black bg-opacity-50 p-2 border-2 rounded-xl">
                                    <a href="/reserva" onClick={() => alert(`Clicked on ${image.title}`)}>
                                        {image.title}
                                    </a>
                                </Title>
                                {/* <Title styleAdd="text-xl font-nunito sm:text-2xl animate-fade-up animate-delay-200 animate-ease-in-out ">
                                    {image.description}
                                </Title> */}
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













