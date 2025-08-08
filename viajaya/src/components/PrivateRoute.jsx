import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import LoadingSpinner from './LoadingSpinner';

const PrivateRoute = ({ children, redirectTo = "/login" }) => {
  // ✅ Usar selectores directos sin useState ni useEffect para evitar loops
  const user = useSelector(state => state.auth?.user);
  const isAuthenticated = useSelector(state => state.auth?.isAuthenticated);
  const loading = useSelector(state => state.auth?.loading);
  
  // ✅ Verificación directa del token sin useEffect
  const hasToken = !!localStorage.getItem('token');

  // ✅ Si no hay token, redirigir inmediatamente
  if (!hasToken) {
    return <Navigate to={redirectTo} replace />;
  }

  // ✅ Solo mostrar loading si realmente está cargando Y no tenemos datos aún
  if (loading && !user && !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // ✅ Si ya tenemos token y está autenticado con usuario, permitir acceso
  if (hasToken && isAuthenticated && user) {
    // ✅ Verificar si el usuario está inactivo
    if (user.isActive === false) {
      const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
      };

      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
            <div className="mb-4">
              <svg 
                className="mx-auto h-12 w-12 text-red-500" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.96-.833-2.73 0L3.084 16.5c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Cuenta Inactiva
            </h2>
            <p className="text-gray-600 mb-4">
              Tu cuenta ha sido desactivada temporalmente. 
              Por favor contacta al administrador para más información.
            </p>
            <button
              onClick={handleLogout}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Iniciar Sesión con Otra Cuenta
            </button>
          </div>
        </div>
      );
    }

    // ✅ Usuario activo, mostrar contenido
    return children;
  }

  // ✅ Si hay problemas con la autenticación, redirigir al login
  return <Navigate to={redirectTo} replace />;
};

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
  redirectTo: PropTypes.string
};

export default PrivateRoute;