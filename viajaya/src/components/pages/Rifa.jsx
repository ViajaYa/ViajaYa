import { Link } from 'react-router-dom';
import ban1 from '../../assets/rifa/ban1.png';
import ban2 from '../../assets/rifa/ban2.png';
import ban3 from '../../assets/rifa/ban3.png';
import ban4 from '../../assets/rifa/ban4.png';
import ban5 from '../../assets/rifa/ban5.png';
import Footer from '../../assets/rifa/Footer.png'

const Rifa = () => {
  return (
    <div className="min-h-screen flex flex-col bg-secondary">
      <div className="w-full bg-secondary text-white py-4">
        <div className="container mx-auto flex justify-between items-center">
          {/* Añadir contenido aquí si es necesario */}
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center">
        <img 
          src={ban1} 
          alt="Imagen Superior" 
          className="w-full md:w-1/2 object-cover"
        />
      </div>
      <div className="w-full bg-verde text-white py-4">
        <div className="container mx-auto text-center">
          <Link to="/number">
            <button className="text-white py-4 px-8 rounded bg-blue-500 text-2xl">
              Seleccionar Números
            </button>
          </Link>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center">
        <img 
          src={ban2}
          alt="Imagen Inferior" 
          className="w-full md:w-1/2 object-cover"
        />
      </div>
      
      
      <div className="flex justify-center mt-8 space-x-4">
        <img 
          src={ban3} 
          alt="Imagen 3" 
          className="w-full md:w-1/3 object-cover"
        />
        <img 
          src={ban4} 
          alt="Imagen 4" 
          className="w-full md:w-1/3 object-cover"
        />
        <img 
          src={ban5} 
          alt="Imagen 5" 
          className="w-full md:w-1/3 object-cover"
        />
      </div>
      <div className=" flex-1 flex flex-col items-center py-6 justify-center">
        <img 
          src={Footer}
          alt="Footer" 
          className="w-full  object-cover"
        />
      </div>
    </div>
  );
};

export default Rifa;