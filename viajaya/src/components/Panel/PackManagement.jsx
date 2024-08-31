import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faEdit } from "@fortawesome/free-solid-svg-icons";
import {
  fetchPacks,
  updatePack,
  deletePack,
} from "../../redux/NewActions/newActions";
import { useNavigate } from "react-router-dom";
import NavBar from "../layout/NavBar/NavBar";

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
      console.error("No hay paquete para guardar.");
      return;
    }

    try {
      const response = await dispatch(updatePack(editPack));
      if (response.success) {
        setEditPack(null); // Limpiar estado después de guardar
        dispatch(fetchPacks()); // Actualizar la lista de paquetes
      } else {
        console.error("Error al guardar los cambios:", response.errorMessage);
      }
    } catch (error) {
      console.error("Error al guardar el paquete:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditPack((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
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
    navigate("/panel/newPack"); // Redirige al componente de creación de paquete
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  const handleDateChange = (e, index, type) => {
    const { value } = e.target;
    const updatedFechas = [...editPack.fechas];
    updatedFechas[index][type] = value;
    setEditPack({
      ...editPack,
      fechas: updatedFechas,
    });
  };

  return (
    <div className="container mx-auto mt-12 p-6">
       <div className='fixed top-0 left-0 z-50 w-full'>
            <NavBar />
          </div>
      <h2 className="bg-ColorMorado text-2xl font-bold font-nunito text-gray-200 mb-8 mt-10 p-2">
        Listar y Modificar Paquetes
      </h2>

      <button
        onClick={handleCreatePack}
        className="bg-ColorAzul text-gray-700 py-2 px-4 rounded mb-4 font-nunito hover:bg-gray-200 "
      >
        Crear Nuevo Paquete
      </button>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray border border-gray-400 rounded-md">
          <thead>
            <tr className="bg-gray-600 font-nunito text-sm text-gray-200">
              <th className="py-2 px-4 border-b">ID</th>
              <th className="py-2 px-4 border-b">Title</th>
              <th className="py-2 px-4 border-b">Days</th>
              <th className="py-2 px-4 border-b">Location</th>
              <th className="py-2 px-4 border-b">Price</th>
              <th className="py-2 px-4 border-b">Latitud</th>
              <th className="py-2 px-4 border-b">Longitud</th>
              <th className="py-2 px-4 border-b">Chars</th>
              <th className="py-2 px-4 border-b" colSpan={2}>
                Fechas
              </th>
              <th className="py-2 px-4 border-b">isActive</th>
              <th className="py-2 px-4 border-b">isYapaya</th>
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
                      className="p-1 border border-gray-300 rounded w-32"
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
                      maxLength={2} // Limita a dos dígitos
                      className="p-1 border border-gray-300 rounded w-16"
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
                      className="p-1 border border-gray-300 rounded w-32"
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
                      className="p-1 border border-gray-300 rounded w-24"
                    />
                  ) : (
                    pack.price
                  )}
                </td>
                <td className="py-2 font-nunito px-4 border-b">
                  {editPack?.id === pack.id ? (
                    <input
                      type="text"
                      name="lat"
                      value={editPack.lat}
                      onChange={handleChange}
                      className="p-1 border border-gray-300 rounded w-32"
                    />
                  ) : (
                    pack.lat
                  )}
                </td>
                <td className="py-2 font-nunito px-4 border-b">
                  {editPack?.id === pack.id ? (
                    <input
                      type="text"
                      name="lng"
                      value={editPack.lng}
                      onChange={handleChange}
                      className="p-1 border border-gray-300 rounded w-32"
                    />
                  ) : (
                    pack.lng
                  )}
                </td>
                <td className="py-2 font-nunito px-4 border-b">
                  {pack.chars.map((char) => (
                    <span
                      key={char.name}
                      className="bg-gray-200 p-1 rounded mr-1"
                    >
                      {char.name}
                    </span>
                  ))}
                </td>
                {/* Fechas de salida */}
                <td className="py-2 font-nunito px-4 border-b">
                  {editPack?.id === pack.id ? (
                    <ul>
                      {editPack.fechas.map((fecha, index) => (
                        <li key={index}>
                          <input
                            type="date"
                            name={`fechas[${index}].salida`}
                            value={fecha.salida}
                            onChange={(e) =>
                              handleDateChange(e, index, "salida")
                            }
                            className="p-1 border border-gray-300 rounded w-32"
                          />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <ul>
                      {pack.fechas.map((fecha, index) => (
                        <li key={index}>{fecha.salida}</li>
                      ))}
                    </ul>
                  )}
                </td>
                {/* Fechas de vuelta */}
                <td className="py-2 font-nunito px-4 border-b">
                  {editPack?.id === pack.id ? (
                    <ul>
                      {editPack.fechas.map((fecha, index) => (
                        <li key={index}>
                          <input
                            type="date"
                            name={`fechas[${index}].vuelta`}
                            value={fecha.vuelta}
                            onChange={(e) =>
                              handleDateChange(e, index, "vuelta")
                            }
                            className="p-1 border border-gray-300 rounded w-32"
                          />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <ul>
                      {pack.fechas.map((fecha, index) => (
                        <li key={index}>{fecha.vuelta}</li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="py-2 font-nunito px-4 border-b">
                  {editPack?.id === pack.id ? (
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={editPack.isActive}
                      onChange={handleChange}
                      className="p-1 border border-gray-300 rounded"
                    />
                  ) : (
                    <input
                      type="checkbox"
                      checked={pack.isActive}
                      readOnly
                      className="p-1 border border-gray-300 rounded"
                    />
                  )}
                </td>
                <td className="py-2 font-nunito px-4 border-b">
                  {editPack?.id === pack.id ? (
                    <input
                      type="checkbox"
                      name="isYapaya"
                      checked={editPack.isYapaya}
                      onChange={handleChange}
                      className="p-1 border border-gray-300 rounded"
                    />
                  ) : (
                    <input
                      type="checkbox"
                      checked={pack.isYapaya}
                      readOnly
                      className="p-1 border border-gray-300 rounded"
                    />
                  )}
                </td>
                <td className="py-2 px-4 border-b flex items-center gap-4">
                  {editPack?.id === pack.id ? (
                    <button
                      onClick={handleSave}
                      className="bg-ColorAzul font-nunito text-gray-700 py-1 px-4 rounded hover:bg-gray-200"
                    >
                      Save
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(pack)}
                        className="bg-ColorAzul font-nunito text-gray-700 py-1 px-4 rounded hover:bg-gray-200"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={() => handleDelete(pack.id)}
                        className="bg-ColorMorado text-gray-700 py-1 px-4 rounded hover:bg-pink-500"
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
          className="bg-ColorAzul font-nunito text-gray-700 py-2 px-4 rounded hover:bg-gray-700 "
        >
          Anterior
        </button>
        <span className="font-nunito">
          Página {currentPage} de {totalPages}
        </span>
        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          className="bg-ColorAzul font-nunito text-gray-700 py-2 px-4 rounded hover:bg-gray-700 "
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default PackManagement;
