
// eslint-disable-next-line no-unused-vars
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { fetchPacks, updatePack, deletePack } from '../../redux/NewActions/newActions';
import { useNavigate } from 'react-router-dom';


const PackManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { packs, loading } = useSelector((state) => ({
    packs: state.packs,
    loading: state.loading,
  }));
  
  const [editPack, setEditPack] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const packsPerPage = 12;

  useEffect(() => {
    dispatch(fetchPacks()); // Obtener la lista de paquetes
  }, [dispatch]);

  const handleEdit = (pack) => {
    setEditPack(pack);
  };

  const handleSave = async () => {
    if (!editPack) {
      console.error('No hay paquete para guardar.');
      return;
    }

    try {
      const response = await dispatch(updatePack(editPack));
      if (response.success) {
        setEditPack(null); // Limpiar estado después de guardar
        dispatch(fetchPacks()); // Actualizar la lista de paquetes
      } else {
        console.error('Error al guardar los cambios:', response.errorMessage);
      }
    } catch (error) {
      console.error('Error al guardar el paquete:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditPack((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDelete = (id) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este paquete?")) {
      dispatch(deletePack(id)).then((result) => {
        if (result.success) {
          dispatch(fetchPacks()); // Obtener la lista actualizada de paquetes
        } else {
          console.error(result.errorMessage);
        }
      });
    }
  };

  const indexOfLastPack = currentPage * packsPerPage;
  const indexOfFirstPack = indexOfLastPack - packsPerPage;
  const currentPacks = packs.slice(indexOfFirstPack, indexOfLastPack);

  const totalPages = Math.ceil(packs.length / packsPerPage);

  const handleNextPage = () => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const handleCreatePack = () => {
    navigate('/panel/newPack'); // Redirige al componente de creación de paquete
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="container mx-auto mt-12 p-4">
      <h2 className="bg-ColorMorado text-3xl font-bold font-nunito  text-white mb-8">Listar y Modificar Paquetes</h2>

      <button
        onClick={handleCreatePack}
        className="bg-ColorAzul text-white py-2 px-4 rounded mb-4 font-nunito hover:bg-blue-700"
      >
        Crear Nuevo Paquete
      </button>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-blue border border-gray-400 rounded-md">
          <thead>
            <tr className="bg-gray-400 font-nunito text-lg text-white">
              <th className="py-2 px-4 border-b">ID</th>
              <th className="py-2 px-4 border-b">Title</th>
              <th className="py-2 px-4 border-b">Days</th>
              <th className="py-2 px-4 border-b">Location</th>
              <th className="py-2 px-4 border-b">Price</th>
              <th className="py-2 px-4 border-b">Chars</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentPacks.map((pack) => (
              <tr key={pack.id}>
                <td className="py-2 font-nunito px-4 border-b">{pack.id}</td>
                <td className="py-2 font-nunito px-4 border-b">
                  {editPack?.id === pack.id ? (
                    <input
                      type="text"
                      name="title"
                      value={editPack.title}
                      onChange={handleChange}
                      className="p-1 border border-gray-300 rounded"
                    />
                  ) : (
                    pack.title
                  )}
                </td>
                <td className="py-2 font-nunito px-4 border-b">
                  {editPack?.id === pack.id ? (
                    <input
                      type="number"
                      name="days"
                      value={editPack.days}
                      onChange={handleChange}
                      className="p-1 border border-gray-300 rounded"
                    />
                  ) : (
                    pack.days
                  )}
                </td>
                <td className="py-2 font-nunito px-4 border-b">
                  {editPack?.id === pack.id ? (
                    <input
                      type="text"
                      name="location"
                      value={editPack.location}
                      onChange={handleChange}
                      className="p-1 border border-gray-300 rounded"
                    />
                  ) : (
                    pack.location
                  )}
                </td>
                <td className="py-2 font-nunito px-4 border-b">
                  {editPack?.id === pack.id ? (
                    <input
                      type="number"
                      name="price"
                      value={editPack.price}
                      onChange={handleChange}
                      className="p-1 border border-gray-300 rounded"
                    />
                  ) : (
                    pack.price
                  )}
                </td>
                <td className="py-2 font-nunito px-4 border-b">
                  {pack.chars.map((char) => (
                    <span key={char.name} className="bg-gray-200 p-1 rounded mr-1">
                      {char.name}
                    </span>
                  ))}
                </td>
                <td className="py-2 px-4 border-b flex items-center gap-4">
                  {editPack?.id === pack.id ? (
                    <button
                      onClick={handleSave}
                      className="bg-ColorAzul font-nunito text-white py-1 px-4 rounded hover:bg-blue-700"
                    >
                      Save
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(pack)}
                        className="bg-ColorAzul font-nunito text-white py-1 px-4 rounded hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(pack.id)}
                        className="bg-ColorMorado text-white py-1 px-4 rounded hover:bg-red-700"
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

export default PackManagement;
