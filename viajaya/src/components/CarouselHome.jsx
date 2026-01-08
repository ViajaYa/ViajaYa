import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import nacionales from "../assets/flipcard/destinacionales.jpg";
import europoa from "../assets/flipcard/europoa.jpg";
import internacionales from "../assets/flipcard/internacionales.jpg";
import macarena from "../assets/flipcard/lamacarena.jpg";
import tierra from "../assets/flipcard/portierra.jpg";
import Title from "../utils/Title";
import axios from 'axios';


const CarouselHome = () => {
    const navigate = useNavigate();
    const [newImages, setNewImages] = useState([]);

    const initialImages = [
        { src: nacionales, title: "NACIONALES", description: "Explora destinos nacionales increíbles." },
        { src: europoa, title: "EUROPA", description: "Descubre las maravillas de Europa." },
        { src: internacionales, title: "INTERNACIONALES", description: "Viaja por todo el mundo con nuestras opciones internacionales." },
        { src: macarena, title: "LLANOS ORIENTALES", description: "Conoce los paisajes únicos del llano colombiano." },
        { src: tierra, title: "POR TIERRA", description: "Viaja por tierra y descubre nuevas aventuras." }
    ];


    useEffect(() => {
        const fetchImages = async () => {
            try {
                const response = await axios.get("/carousel");
                const data = response.data;

                setNewImages(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Error al obtener las imágenes del carrusel:', error);
                setNewImages([]);
            }
        };

        fetchImages();
    }, []);


    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAll, setShowAll] = useState(true);

    const handlePrev = () => {
        if (!showAll && newImages && newImages.length > 0) {
            setCurrentIndex((prevIndex) =>
                prevIndex === 0 ? newImages.length - 1 : prevIndex - 1
            );
        }
    };

    const handleNext = () => {
        if (showAll) {
            // Solo cambiar si hay imágenes nuevas disponibles
            if (newImages && Array.isArray(newImages) && newImages.length > 0) {
                setShowAll(false);
                setCurrentIndex(0);
            }
        } else {
            if (newImages && newImages.length > 0) {
                setCurrentIndex((prevIndex) => {
                    if (prevIndex === newImages.length - 1) {
                        setShowAll(true);
                        return 0;
                    } else {
                        return prevIndex + 1;
                    }
                });
            }
        }
    };

    const handleImageClick = (destino) => {
        navigate(`/allpacks?destino=${destino}`);
    };

    return (
        <div className="relative w-full h-auto overflow-hidden mt-16 bg-slate-200">
            {showAll ? (
                <div className="flex flex-wrap justify-center transition-transform duration-500 ease-in-out">
                    {initialImages.map((image, index) => (
                        <div
                            key={index}
                            className="relative w-full sm:w-1/2 lg:w-1/5 h-64  sm:h-80 lg:h-[600px]"
                            style={{
                                backgroundImage: `url(${image.src})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                cursor: 'pointer'
                            }}
                        >
                            <div className="absolute inset-0 flex items-center justify-center">
                                <h2 className="text-white text-lg sm:text-xl font-semibold font-nunito bg-black bg-opacity-50 p-2 rounded-xl">
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
                    {newImages && newImages.length > 0 ? (
                        newImages.map((image, index) => (
                            <div
                                key={index}
                                className="relative w-full h-64 sm:h-80 lg:h-[600px] flex-shrink-0 flex items-center object-cover"
                                style={{
                                    backgroundImage: `url(${image.src})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat',
                                    cursor: 'pointer'
                                }}
                                onClick={() => handleImageClick(image.destino)}
                            >
                                <div className="w-full h-full flex flex-col justify-center items-end mr-4 sm:mr-16 text-white">
                                    <Title styleAdd="text-xl sm:text-2xl lg:text-4xl font-nunito bg-black bg-opacity-50 p-2 border-2 rounded-xl">
                                        <a href="#">{image.destino}</a>
                                    </Title>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="w-full h-64 flex items-center justify-center text-gray-500">
                            No hay imágenes disponibles
                        </div>
                    )}
                </div>
            )}

            {/* Botón Anterior */}
            <button
                className="absolute top-1/2 left-2 sm:left-5 transform -translate-y-1/2 bg-gray-800 text-white px-2 sm:px-3 py-1 sm:py-2"
                onClick={handlePrev}
                disabled={showAll}
            >
                &#10094;
            </button>

            {/* Botón Siguiente */}
            <button
                className="absolute top-1/2 right-2 sm:right-5 transform -translate-y-1/2 bg-gray-800 text-white px-2 sm:px-3 py-1 sm:py-2"
                onClick={handleNext}
            >
                &#10095;
            </button>
        </div>
    );
};

export default CarouselHome;















