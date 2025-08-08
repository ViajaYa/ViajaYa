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
        <Link
          to="/quotesList"
          className="bg-white border font-nunito  border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out transform hover:scale-105 p-6 flex items-center justify-center"
        >
          <div className="text-center">
            <h2 className="text-xl font-semibold font-nunito  text-blue-500 mb-2">Gestionar Cotizaciones</h2>
            <p className="text-gray-600 font-nunito ">Gestión de Cotizaciones </p>
          </div>
        </Link>
<Link
          to="/contractsList"
          className="bg-white border font-nunito  border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out transform hover:scale-105 p-6 flex items-center justify-center"
        >
          <div className="text-center">
            <h2 className="text-xl font-semibold font-nunito  text-blue-500 mb-2">Gestionar Contratos</h2>
            <p className="text-gray-600 font-nunito ">Gestión de Contratos </p>
          </div>
        </Link>

        <Link
          to="/createStaff"
          className="bg-white border font-nunito  border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out transform hover:scale-105 p-6 flex items-center justify-center"
        >
          <div className="text-center">
            <h2 className="text-xl font-semibold font-nunito  text-blue-500 mb-2">Gestionar Cuentas de clientes y Staff</h2>
            <p className="text-gray-600 font-nunito ">Gestión de Staff </p>
          </div>
        </Link>

        <Link
          to="/commissionsList"
          className="bg-white border font-nunito  border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out transform hover:scale-105 p-6 flex items-center justify-center"
        >
          <div className="text-center">
            <h2 className="text-xl font-semibold font-nunito  text-blue-500 mb-2">Gestionar Comisiones</h2>
            <p className="text-gray-600 font-nunito ">Administrar y revisar comisiones del equipo</p>
          </div>
        </Link>

        <Link
          to="/commission-config"
          className="bg-white border font-nunito  border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out transform hover:scale-105 p-6 flex items-center justify-center"
        >
          <div className="text-center">
            <h2 className="text-xl font-semibold font-nunito  text-blue-500 mb-2">Configurar Comisiones</h2>
            <p className="text-gray-600 font-nunito ">Configurar montos globales por rol y tipo de viaje</p>
          </div>
        </Link>

        <Link
          to="/panel/documents-review"
          className="bg-white border font-nunito  border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out transform hover:scale-105 p-6 flex items-center justify-center"
        >
          <div className="text-center">
            <h2 className="text-xl font-semibold font-nunito  text-blue-500 mb-2">Revisar Documentación</h2>
            <p className="text-gray-600 font-nunito ">Aprobar/Rechazar documentos de empleados</p>
          </div>
        </Link>
         <Link
          to="/contractsList"
          className="bg-white border font-nunito border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out transform hover:scale-105 p-6 flex items-center justify-center"
        >
          <div className="text-center">
            <h2 className="text-xl font-semibold font-nunito text-blue-500 mb-2">Gestión de Compras</h2>
            <p className="text-gray-600 font-nunito">Administrar compras y pagos de contratos activos</p>
          </div>
        </Link>
        
      </div>

    </div>
  );
};

export default PanelPage;