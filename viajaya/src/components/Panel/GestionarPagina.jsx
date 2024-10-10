import { Link } from 'react-router-dom';
import NavBar from '../layout/NavBar/NavBar';


const GestionarPagina = () => {
  return (

    <div className="mb-64 pt-20 p-8"> {/* Agregado pt-20 para el margen superior */}
      <div className='fixed top-0 left-0 z-50 w-full'>
            <NavBar />
          </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 font-nunito lg:grid-cols-3 gap-6 mt-14">
        <Link
          to="/panelInstagram"
          className="bg-white font-nunito border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out transform hover:scale-105 p-6 flex items-center justify-center"
        >
          <div className="text-center">
            <h2 className="text-xl font-semibold font-nunito  text-blue-500 mb-2">Enlaces Instagram</h2>
            <p className="text-gray-600 font-nunito ">Administra instagram clientes Felices.</p>
          </div>
        </Link>
        <Link
          to="/asesores"
          className="bg-white font-nunito border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out transform hover:scale-105 p-6 flex items-center justify-center"
        >
          <div className="text-center">
          <h2 className="text-xl font-semibold font-nunito  text-blue-500 mb-2">Videos Capacitación</h2>
            <p className="text-gray-600 font-nunito ">Gestiona Videos para Asesores</p>
            
          </div>
        </Link>
        <Link
          to="/panel/popup"
          className="bg-white border font-nunito  border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out transform hover:scale-105 p-6 flex items-center justify-center"
        >
          <div className="text-center">
            <h2 className="text-xl font-semibold font-nunito  text-blue-500 mb-2">Gestionar Popups</h2>
            <p className="text-gray-600 font-nunito ">Administra tus popups, edita y agrega nuevos.</p>
          </div>
        </Link>
        <Link
          to="/selectedTrue"
          className="bg-white font-nunito border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out transform hover:scale-105 p-6 flex items-center justify-center"
        >
          <div className="text-center">
            <h2 className="text-xl font-semibold font-nunito  text-blue-500 mb-2">Numeros Rifa</h2>
            <p className="text-gray-600 font-nunito ">Administra Pagos Rifa</p>
          </div>
        </Link>
        <Link
          to="/panelCarousel"
          className="bg-white font-nunito border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out transform hover:scale-105 p-6 flex items-center justify-center"
        >
          <div className="text-center">
            <h2 className="text-xl font-semibold font-nunito  text-blue-500 mb-2">Cargar Imagenes Slice Principal</h2>
            <p className="text-gray-600 font-nunito ">Administra imágenes página principal.</p>
          </div>
        </Link>
        
        
      </div>

    </div>
  );
};

export default GestionarPagina;


