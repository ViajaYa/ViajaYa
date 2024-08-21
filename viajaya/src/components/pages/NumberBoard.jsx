import { useState, useEffect } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';



const NumberBoard = ({ onSelect }) => {
  const [numbers, setNumbers] = useState([]);
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [paginationData, setPaginationData] = useState({
    totalPages: 1,
    currentPage: 1,
  });
  const [loading, setLoading] = useState(true); // Estado de carga
  const numbersPerPage = 100;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNumbers = async () => {
      setLoading(true); // Iniciar la carga
      try {
        const response = await axios.get(
          `https://numberboard.onrender.com/numbers/available?page=${paginationData.currentPage}&limit=${numbersPerPage}`
        );
        if (response.data && response.data.availableNumbers) {
          setNumbers(response.data.availableNumbers);
          setPaginationData((prevData) => ({
            ...prevData,
            totalPages: response.data.totalPages,
            currentPage: response.data.currentPage,
          }));
        } else {
          console.error('La respuesta de la API no tiene la estructura esperada:', response.data);
        }
      } catch (error) {
        console.error('Error fetching numbers:', error);
      } finally {
        setLoading(false); 
      }
    };

    fetchNumbers();
  }, [paginationData.currentPage]);

  const selectNumber = (number) => {
    if (selectedNumbers.includes(number)) {
      setSelectedNumbers(selectedNumbers.filter((n) => n !== number));
    } else {
      setSelectedNumbers([...selectedNumbers, number]);
    }
  };

  const handlePageChange = (pageNumber) => {
    setPaginationData((prevData) => ({
      ...prevData,
      currentPage: pageNumber,
    }));
  };

  const confirmSelection = () => {
    onSelect(selectedNumbers);
    navigate('/form');
  };

  return (
    <div className="min-h-screen flex flex-col bg-secondary">
      {loading ? (
        <div className="flex justify-center items-center flex-grow">
          <p className="text-2xl text-yellow font-bold">Aguarda un Instante, estamos cargando los números disponibles...</p>
        </div>
      ) : (
        <>
          <div className="py-10 px-4 sm:px-2 md:px-8 grid gap-1 sm:gap-2 grid-cols-5 sm:grid-cols-6 md:grid-cols-6 lg:grid-cols-10">
            {numbers.map((num) => (
              <div
                key={num.value}
                className={`w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 flex items-center justify-center border rounded cursor-pointer ${
                  selectedNumbers.includes(num.value) ? 'bg-amber-300 text-white' : 'bg-white'
                }`}
                onClick={() => selectNumber(num.value)}
              >
                {num.value}
              </div>
            ))}
          </div>

          {/* Paginación */}
          <div className="flex justify-center items-center mt-4 space-x-2">
            {[...Array(paginationData.totalPages)].map((_, index) => (
              <button
                key={index + 1}
                className={`px-2 py-1 border rounded ${
                  paginationData.currentPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-white text-blue-500'
                }`}
                onClick={() => handlePageChange(index + 1)}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {/* Botón de confirmación */}
          <div className="flex justify-center mt-8">
            <button
              className="text-white py-2 px-4 rounded bg-amber-300 border-spacing-16"
              onClick={confirmSelection}
              disabled={selectedNumbers.length === 0}
            >
              Confirmar Selección
            </button>
          </div>
        </>
      )}
    </div>
  );
};

NumberBoard.propTypes = {
  onSelect: PropTypes.func.isRequired,
};

export default NumberBoard;

















