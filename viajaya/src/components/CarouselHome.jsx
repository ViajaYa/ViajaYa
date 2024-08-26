import  { useState } from "react";
import bannercañon from "../assets/bannercañon.jpg"

const CarouselHome = () => {
    const images=[
        bannercañon,
        bannercañon,
        bannercañon

    ]
  

  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  return (
    <div className="relative w-full h-64 overflow-hidden">
      {/* Slide Images */}
      <div className="flex transition-transform duration-500 ease-in-out"
           style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
        {images.map((image, index) => (
          <img
            key={index}
            src={image}
            alt={`Slide ${index}`}
            className="w-full h-full object-cover"
          />
        ))}
      </div>
      
      {/* Previous Button */}
      <button
        className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-gray-800 text-white px-2 py-1"
        onClick={handlePrev}
      >
        &#10094;
      </button>

      {/* Next Button */}
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
