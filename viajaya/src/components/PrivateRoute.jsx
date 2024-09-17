import { Navigate } from 'react-router-dom';

// Componente PrivateRoute
const PrivateRoute = ({ children }) => {
  // Obtener el token de localStorage
  const token = localStorage.getItem('token');

  // Si no hay token, redirige al usuario a la página de inicio de sesión
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Si hay token, renderiza los hijos (la ruta privada)
  return children;
};

export default PrivateRoute;

