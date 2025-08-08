import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faEdit } from "@fortawesome/free-solid-svg-icons";
import {
  fetchAllPackages,
  updatePackage,
  deletePackage,
  selectPackages,
  selectPackageLoading,
  selectPackageError,
  clearPackageError,
} from "../../redux/slices/packageSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import NavBar from "../layout/NavBar/NavBar";

const PackManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // ✅ Usar selectores del packageSlice con validación
  const packages = useSelector(selectPackages) || [];
  const loading = useSelector(selectPackageLoading);
  const error = useSelector(selectPackageError);

  const [editPack, setEditPack] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const packsPerPage = 12;

  // ✅ Cargar paquetes al montar el componente
  useEffect(() => {
    dispatch(fetchAllPackages());
  }, [dispatch]);

  // ✅ Manejar errores
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearPackageError());
    }
  }, [error, dispatch]);

  // ✅ Debug: Logs para depurar
  useEffect(() => {
    console.log('PackManagement - packages:', packages);
    console.log('PackManagement - loading:', loading);
    console.log('PackManagement - error:', error);
  }, [packages, loading, error]);

  const handleEdit = (pack) => {
    setEditPack(pack);
  };

  // ✅ Guardar cambios usando el slice moderno
  const handleSave = async () => {
    if (!editPack) {
      toast.error("No hay paquete para guardar.");
      return;
    }

    try {
      await dispatch(updatePackage(editPack)).unwrap();
      toast.success("Paquete actualizado con éxito");
      setEditPack(null);
      // No necesitamos recargar manualmente, el slice se actualiza automáticamente
    } catch (error) {
      toast.error("Error al guardar el paquete: " + error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditPack((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ✅ Eliminar paquete usando el slice moderno
  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este paquete?")) {
      try {
        await dispatch(deletePackage(id)).unwrap();
        toast.success("Paquete eliminado con éxito");
        // No necesitamos recargar manualmente, el slice se actualiza automáticamente
      } catch (error) {
        toast.error("Error al eliminar el paquete: " + error);
      }
    }
  };

  const indexOfLastPack = currentPage * packsPerPage;
  const indexOfFirstPack = indexOfLastPack - packsPerPage;
  
  // ✅ Filtrar elementos nulos y asegurar que el array esté bien formado
  const validPackages = Array.isArray(packages) ? packages.filter(pack => pack && pack.id) : [];
  const currentPacks = validPackages.slice(indexOfFirstPack, indexOfLastPack);

  const totalPages = Math.ceil(validPackages.length / packsPerPage);

  const handleNextPage = () => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const handleCreatePack = () => {
    navigate("/panel/newPack"); 
  };

  // ✅ Estados de carga y error mejorados
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-4 text-gray-600">Cargando paquetes...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-600 text-center">
          <h3 className="text-lg font-semibold mb-2">Error al cargar paquetes</h3>
          <p>{error}</p>
          <button 
            onClick={() => dispatch(fetchAllPackages())}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const handleDateChange = (e, index, type) => {
    const { value } = e.target;
    
    if (!editPack || !editPack.fechas) return;
    
    const updatedFechas = [...editPack.fechas];
    if (updatedFechas[index]) {
      updatedFechas[index][type] = value;
      setEditPack({
        ...editPack,
        fechas: updatedFechas,
      });
    }
  };

  return (
    <div className=" mx-auto mt-12 p-6">
       <div className='fixed top-0 left-0 z-50 w-full'>
            <NavBar />
          </div>
      <h2 className="bg-ColorMorado text-2xl font-bold font-nunito text-gray-200 mb-8 mt-10 p-2">
        Listar y Modificar Paquetes
      </h2>

      <div className="flex justify-between items-center mb-4">
        <button
          onClick={handleCreatePack}
          className="bg-ColorAzul text-gray-700 py-2 px-4 rounded font-nunito hover:bg-gray-200"
        >
          Crear Nuevo Paquete
        </button>

        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600 font-nunito">
            Total: {validPackages.length} paquetes
          </div>
          <button
            onClick={() => dispatch(fetchAllPackages())}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition font-nunito"
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray border border-gray-400 rounded-md">
          <thead>
            <tr className="bg-gray-600 font-nunito text-gray-200">
              
              <th className="py-2 px-4 border-b">Title</th>
              <th className="py-2 px-4 border-b">Days</th>
              <th className="py-2 px-4 border-b">Location</th>
              <th className="py-2 px-4 border-b">Price</th>
            
              <th className="py-2 px-4 border-b" colSpan={2}>
                Fechas
              </th>
              <th className="py-2 px-4 border-b">isActive</th>
              <th className="py-2 px-4 border-b">isYapaya</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>

          <tbody>
            {currentPacks.length > 0 ? (
              currentPacks.map((pack) => (
                <tr key={pack.id}>
                 
                  <td className="py-2 font-nunito px-4 border-b">
                    {editPack?.id === pack.id ? (
                      <input
                        type="text"
                        name="title"
                        value={editPack.title || ''}
                        onChange={handleChange}
                        className="p-1 border border-gray-300 rounded w-32"
                      />
                    ) : (
                      pack.title || 'Sin título'
                    )}
                  </td>
                  <td className="py-2 font-nunito px-4 border-b">
                    {editPack?.id === pack.id ? (
                      <input
                        type="number"
                        name="days"
                        value={editPack.days || ''}
                        onChange={handleChange}
                        maxLength={2} // Limita a dos dígitos
                        className="p-1 border border-gray-300 rounded w-16"
                      />
                    ) : (
                      pack.days || 0
                    )}
                  </td>
                  <td className="py-2 font-nunito px-4 border-b">
                    {editPack?.id === pack.id ? (
                      <input
                        type="text"
                        name="location"
                        value={editPack.location || ''}
                        onChange={handleChange}
                        className="p-1 border border-gray-300 rounded w-32"
                      />
                    ) : (
                      pack.location || 'Sin ubicación'
                    )}
                  </td>
                  
                  <td className="py-2 font-nunito px-4 border-b">
                    {editPack?.id === pack.id ? (
                      <input
                        type="number"
                        name="price"
                        value={editPack.price || ''}
                        onChange={handleChange}
                        className="p-1 border border-gray-300 rounded w-24"
                      />
                    ) : (
                      pack.price || 0
                    )}
                  </td>
            
                  
                  {/* Fechas de salida */}
                  <td className="py-2 font-nunito px-4 border-b">
                    {editPack?.id === pack.id ? (
                      <ul>
                        {(editPack.fechas || []).map((fecha, index) => (
                          <li key={index}>
                            <input
                              type="date"
                              name={`fechas[${index}].salida`}
                              value={fecha.salida || ''}
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
                        {(pack.fechas || []).map((fecha, index) => (
                          <li key={index}>{fecha.salida || 'Sin fecha'}</li>
                        ))}
                      </ul>
                    )}
                  </td>
                  {/* Fechas de vuelta */}
                  <td className="py-2 font-nunito px-4 border-b">
                    {editPack?.id === pack.id ? (
                      <ul>
                        {(editPack.fechas || []).map((fecha, index) => (
                          <li key={index}>
                            <input
                              type="date"
                              name={`fechas[${index}].vuelta`}
                              value={fecha.vuelta || ''}
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
                        {(pack.fechas || []).map((fecha, index) => (
                          <li key={index}>{fecha.vuelta || 'Sin fecha'}</li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="py-2 font-nunito px-4 border-b">
                    {editPack?.id === pack.id ? (
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={editPack.isActive || false}
                        onChange={handleChange}
                        className="p-1 border border-gray-300 rounded"
                      />
                    ) : (
                      <input
                        type="checkbox"
                        checked={pack.isActive || false}
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
                        checked={editPack.isYapaya || false}
                        onChange={handleChange}
                        className="p-1 border border-gray-300 rounded"
                      />
                    ) : (
                      <input
                        type="checkbox"
                        checked={pack.isYapaya || false}
                        readOnly
                        className="p-1 border border-gray-300 rounded"
                      />
                    )}
                  </td>
                  <td className="py-2 px-4 border-b flex items-center gap-4">
                    {editPack?.id === pack.id ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSave}
                          disabled={loading}
                          className="bg-green-500 text-white py-1 px-4 rounded hover:bg-green-600 disabled:opacity-50 transition font-nunito"
                        >
                          {loading ? "Guardando..." : "💾 Guardar"}
                        </button>
                        <button
                          onClick={() => setEditPack(null)}
                          className="bg-gray-500 text-white py-1 px-4 rounded hover:bg-gray-600 transition font-nunito"
                        >
                          ❌ Cancelar
                        </button>
                      </div>
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
                          disabled={loading}
                          className="bg-ColorMorado text-gray-700 py-1 px-4 rounded hover:bg-pink-500 disabled:opacity-50 transition"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="py-8 text-center text-gray-500 font-nunito">
                  📦 No hay paquetes disponibles
                </td>
              </tr>
            )}
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
