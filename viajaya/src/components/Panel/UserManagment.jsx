import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

// ✅ Importar desde userSlice
import { 
  fetchAllUsers,
  updateUser,
  deleteUser
} from '../../redux/slices/userSlice';

// ✅ Importar selectores del authSlice
import { 
  selectUser, 
  selectIsAuthenticated, 
  selectAuthLoading
} from '../../redux/slices/authSlice';
import useAuthGuard from '../hooks/useAuthGuard'; // ✅ Usar el hook mejorado
import NavBar from '../layout/NavBar/NavBar';

const UserManagment = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // ✅ Comentar useAuthGuard para evitar múltiples llamadas - ya se ejecuta en App.jsx
  // useAuthGuard();
  
  // ✅ Selectores simplificados
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const authLoading = useSelector(selectAuthLoading);
  
  // ✅ Estado del userSlice - simplificado
  const users = useSelector((state) => state.user?.users || []);
  const loading = useSelector((state) => state.user?.loading || false);
  const error = useSelector((state) => state.user?.error || null);

  // Estados locales simplificados
  const [email, setEmail] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [filteredUser, setFilteredUser] = useState(null);
  const [hasLoadedUsers, setHasLoadedUsers] = useState(false);

  // ✅ Verificar autorización y cargar usuarios
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role < 7) {
        navigate("/");
        return;
      }
      
      // Solo cargar una vez
      if (!hasLoadedUsers && !loading) {
        console.log('Cargando usuarios...');
        setHasLoadedUsers(true);
        dispatch(fetchAllUsers());
      }
    }
  }, [dispatch, navigate, user, isAuthenticated, hasLoadedUsers, loading]);

  // ✅ Protecciones básicas
  if (authLoading || !user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-2">Cargando...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  if (user.role < 7) {
    return (
      <div className="container mx-auto p-4">
        <div className='fixed top-0 left-0 z-50 w-full'>
          <NavBar />
        </div>
        <div className="flex justify-center items-center h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h2>
            <p className="text-gray-600 mb-4">No tienes permisos para acceder a esta página.</p>
            <button 
              onClick={() => navigate("/")}
              className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Volver al Inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className='fixed top-0 left-0 z-50 w-full'>
          <NavBar />
        </div>
        <div className="flex justify-center items-center h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error al cargar usuarios</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => {
                setHasLoadedUsers(false);
                dispatch(fetchAllUsers());
              }}
              className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Funciones simplificadas
  const handleEdit = (userToEdit) => {
    setEditUser(userToEdit);
  };

  const handleSearch = () => {
    if (!Array.isArray(users) || users.length === 0) {
      console.warn('No hay usuarios para buscar');
      return;
    }
    const foundUser = users.find((userItem) => userItem.email === email);
    setFilteredUser(foundUser || null);
  };

  const handleSave = async () => {
    if (!editUser) return;

    try {
      await dispatch(updateUser(editUser)).unwrap();
      setEditUser(null);
      console.log('Usuario actualizado exitosamente');
    } catch (error) {
      console.error('Error al guardar el usuario:', error);
      if (error.includes('401') || error.includes('Token')) {
        localStorage.removeItem('token');
        navigate("/login");
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditUser((prev) => ({
      ...prev,
      [name]: name === 'role' || name === 'points' ? parseInt(value) : value,
    }));
  };

  const handleDelete = async (id) => {
    if (id === user.id) {
      alert("No puedes eliminar tu propio usuario.");
      return;
    }

    if (window.confirm("¿Estás seguro de que deseas eliminar este usuario?")) {
      try {
        await dispatch(deleteUser(id)).unwrap();
        console.log('Usuario eliminado exitosamente');
      } catch (error) {
        console.error('Error al eliminar el usuario:', error);
        if (error.includes('401') || error.includes('Token')) {
          localStorage.removeItem('token');
          navigate("/login");
        }
      }
    }
  };

  const getRoleText = (roleValue) => {
    switch (roleValue) {
      case 1: return "Cliente";
      case 2: return "Asesor";
      case 3: return "Líder";
      case 4: return "Gerente";
      case 5: return "Admin";
      case 6: return "Contador";
      default: return "Cliente";
    }
  };

  // ✅ Sin useMemo - cálculo directo y simple
  const safeUsers = Array.isArray(users) ? users : [];
  const displayUsers = filteredUser ? [filteredUser] : safeUsers;

  if (loading && safeUsers.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-2">Cargando usuarios...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className='fixed top-0 left-0 z-50 w-full'>
        <NavBar />
      </div>
      
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-100 p-2 mb-4 mt-20 rounded text-sm">
          <strong>Debug:</strong> Users: {safeUsers.length}, Loading: {loading.toString()}, HasLoaded: {hasLoadedUsers.toString()}, Error: {error || 'none'}
        </div>
      )}
      
      {/* Header */}
      <div className="bg-ColorMorado text-2xl font-bold font-nunito p-4 text-gray-200 mb-8 mt-28 rounded-lg">
        <div className="flex justify-between items-center">
          <h2>Gestión de Usuarios</h2>
          <div className="text-sm">
            <span>Administrador: {user?.name || 'Admin'}</span>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-500 text-white p-4 rounded-lg">
          <h3 className="text-lg font-semibold">Total Usuarios</h3>
          <p className="text-2xl font-bold">{safeUsers.length}</p>
        </div>
        <div className="bg-green-500 text-white p-4 rounded-lg">
          <h3 className="text-lg font-semibold">Clientes</h3>
          <p className="text-2xl font-bold">{safeUsers.filter(u => u.role === 1).length}</p>
        </div>
        <div className="bg-purple-500 text-white p-4 rounded-lg">
          <h3 className="text-lg font-semibold">Asesores</h3>
          <p className="text-2xl font-bold">{safeUsers.filter(u => u.role >= 2).length}</p>
        </div>
      </div>

      {/* Botón recarga */}
      <div className="mb-4">
        <button
          onClick={() => {
            setHasLoadedUsers(false);
            dispatch(fetchAllUsers());
          }}
          disabled={loading}
          className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
        >
          {loading ? 'Cargando...' : 'Recargar Usuarios'}
        </button>
      </div>

      {/* Búsqueda */}
      <div className="mb-6 bg-gray-100 p-4 rounded-lg">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Buscar por email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 p-3 border border-gray-300 rounded-lg font-nunito"
          />
          <button
            onClick={handleSearch}
            disabled={safeUsers.length === 0}
            className="bg-ColorAzul text-white py-3 px-6 rounded-lg font-nunito hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            Buscar
          </button>
          {filteredUser && (
            <button
              onClick={() => {
                setFilteredUser(null);
                setEmail('');
              }}
              className="bg-gray-500 text-white py-3 px-6 rounded-lg font-nunito hover:bg-gray-600 transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Tabla simplificada */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-400 font-nunito text-lg text-white">
              <th className="py-3 px-4 text-left">ID</th>
              <th className="py-3 px-4 text-left">Nombre</th>
              <th className="py-3 px-4 text-left">Email</th>
              <th className="py-3 px-4 text-left">Role</th>
              <th className="py-3 px-4 text-left">Código Referido</th>
              <th className="py-3 px-4 text-left">Puntos</th>
              <th className="py-3 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {displayUsers.length > 0 ? (
              displayUsers.map((userItem) => (
                <tr key={userItem.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 font-nunito px-4">{userItem.id}</td>
                  <td className="py-3 font-nunito px-4">
                    {userItem.name} {userItem.lastname}
                  </td>
                  <td className="py-3 font-nunito px-4">
                    {editUser?.id === userItem.id ? (
                      <input
                        type="email"
                        name="email"
                        value={editUser.email}
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded-lg w-full"
                      />
                    ) : (
                      userItem.email
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {editUser?.id === userItem.id ? (
                      <select
                        name="role"
                        value={editUser.role}
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded-lg"
                      >
                        <option value={1}>Cliente</option>
                        <option value={2}>Asesor</option>
                        <option value={3}>Líder</option>
                        <option value={4}>Gerente</option>
                        <option value={5}>Admin</option>
                        <option value={6}>Contador</option>
                        <option value={7}>Owner</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        userItem.role >= 7 ? 'bg-red-100 text-red-800' :
                        userItem.role >= 2 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {getRoleText(userItem.role)}
                      </span>
                    )}
                  </td>
                  <td className="py-3 font-nunito px-4">
                    <code className="bg-gray-100 px-2 py-1 rounded">
                      {userItem.referral_code || 'N/A'}
                    </code>
                  </td>
                  <td className="py-3 px-4 font-nunito">
                    {editUser?.id === userItem.id ? (
                      <input
                        type="number"
                        name="points"
                        value={editUser.points || 0}
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded-lg w-20"
                      />
                    ) : (
                      <span className="font-semibold text-blue-600">
                        {userItem.points || 0}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      {editUser?.id === userItem.id ? (
                        <>
                          <button
                            onClick={handleSave}
                            disabled={loading}
                            className="bg-green-500 font-nunito text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                          >
                            {loading ? 'Guardando...' : 'Guardar'}
                          </button>
                          <button
                            onClick={() => setEditUser(null)}
                            className="bg-gray-500 font-nunito text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(userItem)}
                            disabled={loading}
                            className="bg-ColorAzul font-nunito text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                          >
                            Editar
                          </button>
                          {userItem.id !== user.id && (
                            <button
                              onClick={() => handleDelete(userItem.id)}
                              disabled={loading}
                              className="bg-ColorMorado text-white py-2 px-3 rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
                              title="Eliminar usuario"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="py-8 text-center text-gray-500">
                  {safeUsers.length === 0 
                    ? 'No hay usuarios disponibles' 
                    : 'No se encontró ningún usuario con ese email'
                  }
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagment;