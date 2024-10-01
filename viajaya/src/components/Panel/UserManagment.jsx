import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { infoUsers as fetchInfoUsers, updateUser as updateUserAction, deleteUser as deleteUserAction } from '../../redux/NewActions/newActions';
import NavBar from '../layout/NavBar/NavBar';


const UserManagment = () => {
  const dispatch = useDispatch();
  const { infoUsers, loading } = useSelector((state) => ({
    
    infoUsers: state.users,
    loading: state.loading,
    
  }));

  // const infoUsers= useSelector((state) => state.users)
  console.log(infoUsers)
  const [email, setEmail] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [filteredUser, setFilteredUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 12;

  useEffect(() => {
    dispatch(fetchInfoUsers()); // Obtener la lista de usuarios
  }, [dispatch]);

  const handleEdit = (user) => {
    setEditUser(user);
  };
  console.log(infoUsers)
  const handleSearch = () => {
    const user = infoUsers.find((user) => user.email === email);
    setFilteredUser(user || null);
    setCurrentPage(1); // Resetear la paginación al buscar
  };

  const handleSave = async () => {
    if (!editUser) {
      console.error('No hay usuario para guardar.');
      return;
    }

    try {
      const response = await dispatch(updateUserAction(editUser));
      if (response.success) {
        setEditUser(null); // Limpiar estado después de guardar
        dispatch(fetchInfoUsers()); // Actualizar la lista de usuarios
      } else {
        console.error('Error al guardar los cambios:', response.errorMessage);
      }
    } catch (error) {
      console.error('Error al guardar el usuario:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDelete = (id) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este usuario?")) {
      dispatch(deleteUserAction(id)).then((result) => {
        if (result.success) {
          dispatch(fetchInfoUsers()); // Obtener la lista actualizada de usuarios
        } else {
          console.error(result.errorMessage);
        }
      });
    }
  };

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUser
    ? [filteredUser]
    : infoUsers.slice(indexOfFirstUser, indexOfLastUser);

  const totalPages = Math.ceil(infoUsers.length / usersPerPage);

  const handleNextPage = () => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="container mx-auto  p-4">
       <div className='fixed top-0 left-0 z-50 w-full'>
            <NavBar />
          </div>
      <h2 className="bg-ColorMorado text-2xl font-bold font-nunito p-2 text-gray-200 mb-8 mt-28">Listar y Modificar Usuarios</h2>

      {/* Formulario de Búsqueda */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="p-2 border border-gray-300 rounded"
        />
        <button
          onClick={handleSearch}
          className="bg-ColorAzul text-white py-2 px-4 rounded ml-2 font-nunito hover:bg-gray-200"
        >
          Buscar
        </button>
      </div>

      {/* Tabla de Usuarios */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-blue border border-gray-400 rounded-md">
          <thead>
            <tr className="bg-gray-400 font-nunito text-lg text-white">
              <th className="py-2 px-4 border-b">ID</th>
              <th className="py-2 px-4 border-b">Email</th>
              <th className="py-2 px-4 border-b">Role</th>
              <th className="py-2 px-4 border-b">Referral Code</th>
              <th className="py-2 px-4 border-b">Points</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user) => (
              <tr key={user.id}>
                <td className="py-2 font-nunito px-4 border-b">{user.id}</td>
                <td className="py-2 font-nunito px-4 border-b">
                  {editUser?.id === user.id ? (
                    <input
                      type="text"
                      name="email"
                      value={editUser.email}
                      onChange={handleChange}
                      className="p-1 border  border-gray-300 rounded"
                    />
                  ) : (
                    user.email
                  )}
                </td>
                <td className="py-2 px-4 border-b">
  {editUser?.id === user.id ? (
    <select
      name="role"
      value={editUser.role}
      onChange={handleChange}
      className="p-1 border border-gray-300 rounded"
    >
      <option value={1}>Cliente</option>
      <option value={2}>Asesor</option>
      <option value={3}>Admin</option>
    </select>
  ) : (
    user.role === 1 ? "Cliente" : user.role === 2 ? "Asesor" : "Admin"
  )}
</td>

                <td className="py-2 font-nunito px-4 border-b">{user.referral_code}</td>
                <td className="py-2 px-4 font-nunito border-b">
                  {editUser?.id === user.id ? (
                    <input
                      type="number"
                      name="points"
                      value={editUser.points}
                      onChange={handleChange}
                      className="p-1 border border-gray-300 rounded"
                    />
                  ) : (
                    user.points
                  )}
                </td>
                <td className="py-2 px-4 border-b flex items-center gap-4 ">
                  {editUser?.id === user.id ? (
                    <button
                      onClick={handleSave}
                      className="bg-ColorAzul font-nunito text-white py-1 px-4 rounded hover:bg-gray-200"
                    >
                      Save
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(user)}
                        className="bg-ColorAzul font-nunito text-white py-1 px-4 rounded hover:bg-gray-200 "
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="bg-ColorMorado text-white py-1 px-4 rounded hover:bg-gray-200 "
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex justify-between mt-4">
        <button
          onClick={handlePrevPage}
          disabled={currentPage === 1}
          className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-700"
        >
          Anterior
        </button>
        <p>Página {currentPage} de {totalPages}</p>
        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-700"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default UserManagment;




