import { Link } from 'react-router-dom'; 
import ban1 from '../../assets/rifa/ban1.png';
import ban2 from '../../assets/rifa/ban2.png';
import ban3 from '../../assets/rifa/ban3.png';
import ban4 from '../../assets/rifa/ban4.png';

const Rifa = () => {
  return (
    <div className="min-h-screen flex flex-col bg-secondary">
      {/* Encabezado */}
      <div className="w-full bg-secondary text-white py-4">
        <div className="container mx-auto flex justify-between items-center">
          {/* Puedes añadir contenido aquí si es necesario */}
        </div>
      </div>
      
      {/* Imagen superior */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 md:px-0">
        <img 
          src={ban1} 
          alt="Imagen Superior" 
          className="w-full max-w-screen-md md:w-1/2 object-cover rounded-lg"
        />
      </div>

      {/* Botón */}
      <div className="w-full bg-verde text-white py-6">
        <div className="container mx-auto text-center">
          <Link to="/number">
            <button className="text-white py-3 px-6 rounded bg-blue-500 text-xl sm:text-2xl hover:bg-blue-600 transition">
              Seleccionar Números
            </button>
          </Link>
        </div>
      </div>

      {/* Imagen inferior */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 md:px-0">
        <img 
          src={ban2}
          alt="Imagen Inferior" 
          className="w-full max-w-screen-md md:w-1/2 object-cover rounded-lg"
        />
      </div>
      
      {/* Imágenes pequeñas en la parte inferior */}
      <div className="flex flex-col md:flex-row justify-center items-center mt-8 space-y-4 md:space-y-0 md:space-x-4 px-4">
        <img 
          src={ban3} 
          alt="Imagen 3" 
          className="w-full max-w-screen-md md:w-1/3 object-cover rounded-lg"
        />
        <img 
          src={ban4} 
          alt="Imagen 4" 
          className="w-full max-w-screen-md md:w-1/3 object-cover rounded-lg"
        />
      </div>
    </div>
  );
};

export default Rifa;
