import { Link } from 'react-router-dom';
import NavBar from '../layout/NavBar/NavBar';


const PanelPage = () => {
  return (

    <div className="mb-64 pt-20 p-8"> {/* Agregado pt-20 para el margen superior */}
      <div className='fixed top-0 left-0 z-50 w-full'>
            <NavBar />
          </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 font-nunito lg:grid-cols-3 gap-6 mt-14">
        <Link
          to="/panel/user"
          className="bg-white font-nunito border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out transform hover:scale-105 p-6 flex items-center justify-center"
        >
          <div className="text-center">
            <h2 className="text-xl font-semibold font-nunito  text-blue-500 mb-2">Listar Usuarios</h2>
            <p className="text-gray-600 font-nunito ">Administra y visualiza los detalles de los clientes.</p>
          </div>
        </Link>
        <Link
          to="/panel/pack"
          className="bg-white border font-nunito  border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out transform hover:scale-105 p-6 flex items-center justify-center"
        >
          <div className="text-center">
            <h2 className="text-xl font-semibold font-nunito  text-blue-500 mb-2">Gestionar Paquetes</h2>
            <p className="text-gray-600 font-nunito ">Administra tus paquetes, edita y agrega nuevos.</p>
          </div>
        </Link>
        <Link
          to="/panel/reservas"
          className="bg-white border font-nunito  border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out transform hover:scale-105 p-6 flex items-center justify-center"
        >
          <div className="text-center">
            <h2 className="text-xl font-semibold font-nunito  text-blue-500 mb-2">Gestionar Reservas</h2>
            <p className="text-gray-600 font-nunito ">Listar y Editar Reservas</p>
          </div>
        </Link>
       
        <Link
          to="/panelGestion"
          className="bg-white border font-nunito  border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out transform hover:scale-105 p-6 flex items-center justify-center"
        >
          <div className="text-center">
            <h2 className="text-xl font-semibold font-nunito  text-blue-500 mb-2">Gestionar Página</h2>
            <p className="text-gray-600 font-nunito ">Crea enlaces, promos, yapaya</p>
          </div>
        </Link>
        
      </div>

    </div>
  );
};

export default PanelPage;