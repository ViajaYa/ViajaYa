import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../redux/hooks/hooks';
import LoadingSpinner from './LoadingSpinner';

const PrivateRoute = ({ children, redirectTo = "/login" }) => {
  const { isAuthenticated, loading, user } = useAuth();

  // Mostrar spinner mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Si no está autenticado, redirigir
  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Si el token existe pero el usuario no está activo
  if (!user.is_active) {
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
            onClick={() => {
              localStorage.removeItem('token');
              window.location.href = '/login';
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Iniciar Sesión con Otra Cuenta
          </button>
        </div>
      </div>
    );
  }

  // Si todo está bien, renderizar el componente hijo
  return children;
};
PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
  redirectTo: PropTypes.string
};

export default PrivateRoute;
