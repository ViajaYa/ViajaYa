import { Navigate } from 'react-router-dom';
import { useAuth } from '../redux/hooks/hooks';
import LoadingSpinner from './LoadingSpinner';
import PropTypes from 'prop-types';

const USER_ROLES = {
  CLIENTE: 1,
  ASESOR: 2,
  LIDER: 3,
  GERENTE: 4,
  ADMIN: 5,
  CONTADOR: 6,
  OWNER: 7
};

const RoleRoute = ({ children, allowedRoles = [], redirectTo = "/", showError = true }) => {
  const { user, isAuthenticated, loading } = useAuth();

  // Mostrar spinner mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner message="Verificando permisos..." />
      </div>
    );
  }

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si no hay usuario o no tiene rol
  if (!user || !user.role) {
    return <Navigate to="/login" replace />;
  }

  // Si el usuario no está activo
  if (!user.is_active) {
    return <Navigate to="/login" replace />;
  }

  // Si no se especifican roles permitidos, permitir acceso
  if (allowedRoles.length === 0) {
    return children;
  }

  // Verificar si el rol del usuario está en los roles permitidos
  const hasPermission = allowedRoles.includes(user.role);

  if (!hasPermission) {
    if (showError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
            <div className="mb-4">
              <svg 
                className="mx-auto h-12 w-12 text-yellow-500" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 15v2m-6 0h12a2 2 0 002-2v-9a2 2 0 00-2-2H6a2 2 0 00-2 2v9a2 2 0 002 2z" 
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Acceso Denegado
            </h2>
            <p className="text-gray-600 mb-4">
              No tienes permisos suficientes para acceder a esta página.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Rol actual: <span className="font-medium">{getRoleName(user.role)}</span>
            </p>
            <button
              onClick={() => window.history.back()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Volver
            </button>
          </div>
        </div>
      );
    } else {
      return <Navigate to={redirectTo} replace />;
    }
  }

  return children;
};

// Función auxiliar para obtener el nombre del rol
const getRoleName = (roleId) => {
  const roleNames = {
    1: 'Cliente',
    2: 'Asesor',
    3: 'Líder',
    4: 'Gerente',
    5: 'Administrador',
    6: 'Contador',
    7: 'Propietario'
  };
  return roleNames[roleId] || 'Desconocido';
};

RoleRoute.propTypes = {
  children: PropTypes.node,
  allowedRoles: PropTypes.array,
  redirectTo: PropTypes.string,
  showError: PropTypes.bool
};

export { USER_ROLES };
export default RoleRoute;
