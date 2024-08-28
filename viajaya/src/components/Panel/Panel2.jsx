import { Link } from 'react-router-dom';


const PanelPage = () => {
  return (

    <div className="mb-64 pt-20 p-8"> {/* Agregado pt-20 para el margen superior */}
      <h1 className="text-3xl font-bold mb-6">Panel de Administración</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          to="/panel/clients/create"
          className="bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out transform hover:scale-105 p-6 flex items-center justify-center"
        >
          <div className="text-center">
            <h2 className="text-xl font-semibold text-blue-500 mb-2">Crear Paquetes</h2>
            <p className="text-gray-600">Administra y visualiza los detalles de los clientes.</p>
          </div>
        </Link>
        <Link
          to="/panel/products/create"
          className="bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out transform hover:scale-105 p-6 flex items-center justify-center"
        >
          <div className="text-center">
            <h2 className="text-xl font-semibold text-blue-500 mb-2">Gestionar Productos</h2>
            <p className="text-gray-600">Administra tus productos, edita y agrega nuevos.</p>
          </div>
        </Link>
        <Link
          to="/panel/invoices"
          className="bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out transform hover:scale-105 p-6 flex items-center justify-center"
        >
          <div className="text-center">
            <h2 className="text-xl font-semibold text-blue-500 mb-2">Gestionar Facturación</h2>
            <p className="text-gray-600">Gestiona las facturas y el historial de transacciones.</p>
          </div>
        </Link>
        <Link
          to="/register"
          className="bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out transform hover:scale-105 p-6 flex items-center justify-center"
        >
          <div className="text-center">
            <h2 className="text-xl font-semibold text-blue-500 mb-2">Gestionar Administrador</h2>
            <p className="text-gray-600">Crear nuevo Administrador.</p>
          </div>
        </Link>
        <Link
          to="/panel/clients/list"
          className="bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out transform hover:scale-105 p-6 flex items-center justify-center"
        >
          <div className="text-center">
            <h2 className="text-xl font-semibold text-blue-500 mb-2">Listar Clientes</h2>
            <p className="text-gray-600">Listar y Editar Clientes Siigo</p>
          </div>
        </Link>
        <Link
          to="/panel/invoices/prueba"
          className="bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out transform hover:scale-105 p-6 flex items-center justify-center"
        >
          <div className="text-center">
            <h2 className="text-xl font-semibold text-blue-500 mb-2">Prueba</h2>
            <p className="text-gray-600">Probar Factura</p>
          </div>
        </Link>
      </div>

    </div>
  );
};

export default PanelPage;