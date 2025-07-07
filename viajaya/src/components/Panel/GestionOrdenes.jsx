import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  fetchReservations, 
  updateReservation,
  selectReservations,
  selectLoadingReservations,
  selectErrorReservations,
  clearReservationError
} from "../../redux/slices/reservationSlice";
import { toast } from "react-toastify";
import NavBar from "../layout/NavBar/NavBar";

const OrderManagement = () => {
  const dispatch = useDispatch();
  
  // ✅ Usar selectores del reservationSlice
  const reservations = useSelector(selectReservations);
  const loading = useSelector(selectLoadingReservations);
  const error = useSelector(selectErrorReservations);
  const users = useSelector((state) => state.users);
  
  // ✅ Estados locales
  const [filterPaid, setFilterPaid] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editedOrders, setEditedOrders] = useState({});

  // ✅ Debug
  console.log('Reservations:', reservations);
  console.log('Users:', users);

  // ✅ Cargar reservaciones al montar el componente
  useEffect(() => {
    dispatch(fetchReservations());
  }, [dispatch]);

  // ✅ Manejar errores
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearReservationError());
    }
  }, [error, dispatch]);

  // ✅ Filtrar órdenes por estado de pago
  const filteredOrders = filterPaid
    ? reservations.filter((order) => order.isPaid)
    : reservations;

  // ✅ Eliminar duplicados por idOrder
  const uniqueOrders = filteredOrders.filter(
    (order, index, self) =>
      index === self.findIndex((o) => o.idOrder === order.idOrder)
  );

  // ✅ Obtener email por ID de usuario
  const getEmailByUserId = (userId) => {
    const user = users.find((user) => user.id === userId);
    return user ? user.email : "Email no encontrado";
  };

  // ✅ Formatear fecha
  const formatDate = (dateString) => {
    const options = { day: "2-digit", month: "2-digit", year: "2-digit" };
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", options);
  };

  // ✅ Manejar cambios en los inputs de edición
  const handleChange = (idOrder, e) => {
    const { name, value } = e.target;
    
    setEditedOrders((prevState) => {
      const currentOrder = prevState[idOrder] || {};
      
      // Manejar fechas anidadas
      if (name.includes('.')) {
        const [parent, child] = name.split('.');
        return {
          ...prevState,
          [idOrder]: {
            ...currentOrder,
            [parent]: {
              ...currentOrder[parent],
              [child]: value,
            },
          },
        };
      }
      
      // Manejar campos normales
      return {
        ...prevState,
        [idOrder]: {
          ...currentOrder,
          [name]: value,
        },
      };
    });
  };

  // ✅ Guardar cambios usando el slice moderno
  const handleSave = async (idOrder) => {
    if (!editedOrders[idOrder]) return;

    try {
      await dispatch(updateReservation({ 
        id: idOrder, 
        updates: editedOrders[idOrder] 
      })).unwrap();
      
      toast.success("Orden actualizada con éxito");
      setEditingOrder(null);
      setEditedOrders((prevState) => {
        const updatedOrders = { ...prevState };
        delete updatedOrders[idOrder];
        return updatedOrders;
      });
      
      // Recargar las reservaciones
      dispatch(fetchReservations());
    } catch (error) {
      toast.error("Error al actualizar la orden: " + error);
    }
  };

  // ✅ Estados de carga y error
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-4 text-gray-600">Cargando órdenes...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-600 text-center">
          <h3 className="text-lg font-semibold mb-2">Error al cargar órdenes</h3>
          <p>{error}</p>
          <button 
            onClick={() => dispatch(fetchReservations())}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-12 p-6">
      <div className="fixed top-0 left-0 z-50 w-full">
        <NavBar />
      </div>
      <div className="min-h-screen pt-20 bg-gray-100">
        <div className="container mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold text-gray-700 mb-6 font-nunito">
            Gestión de Órdenes
          </h2>

          {/* ✅ Filtros mejorados */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="flex items-center font-nunito">
                <input
                  type="checkbox"
                  checked={filterPaid}
                  onChange={(e) => setFilterPaid(e.target.checked)}
                  className="mr-2"
                />
                Mostrar solo órdenes pagadas
              </label>
              
              <div className="text-sm text-gray-600 font-nunito">
                Total: {uniqueOrders.length} órdenes
              </div>
            </div>

            <button
              onClick={() => dispatch(fetchReservations())}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition font-nunito"
            >
              🔄 Actualizar
            </button>
          </div>

          {uniqueOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white font-nunito">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Reserva
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paquete
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha de salida
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha de llegada
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Personas
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio total
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pagada
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {uniqueOrders.map((order) => (
                    <tr key={order.idOrder} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingOrder === order.idOrder ? (
                          <input
                            type="date"
                            name="bookingDate"
                            value={
                              editedOrders[order.idOrder]?.bookingDate ||
                              order.bookingDate?.split('T')[0] // Para input tipo date
                            }
                            onChange={(e) => handleChange(order.idOrder, e)}
                            className="border rounded px-2 py-1 w-full"
                          />
                        ) : (
                          formatDate(order.bookingDate)
                        )}
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingOrder === order.idOrder ? (
                          <input
                            type="email"
                            name="email"
                            value={
                              editedOrders[order.idOrder]?.email ||
                              getEmailByUserId(order.userId)
                            }
                            onChange={(e) => handleChange(order.idOrder, e)}
                            className="border rounded px-2 py-1 w-full"
                          />
                        ) : (
                          getEmailByUserId(order.userId)
                        )}
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.pack ? order.pack.title : "Sin título"}
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingOrder === order.idOrder ? (
                          <input
                            type="date"
                            name="fechas.salida"
                            value={
                              editedOrders[order.idOrder]?.fechas?.salida ||
                              order.fechas?.salida?.split('T')[0]
                            }
                            onChange={(e) => handleChange(order.idOrder, e)}
                            className="border rounded px-2 py-1 w-full"
                          />
                        ) : (
                          formatDate(order.fechas?.salida)
                        )}
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingOrder === order.idOrder ? (
                          <input
                            type="date"
                            name="fechas.llegada"
                            value={
                              editedOrders[order.idOrder]?.fechas?.llegada ||
                              order.fechas?.llegada?.split('T')[0]
                            }
                            onChange={(e) => handleChange(order.idOrder, e)}
                            className="border rounded px-2 py-1 w-full"
                          />
                        ) : (
                          formatDate(order.fechas?.llegada)
                        )}
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingOrder === order.idOrder ? (
                          <input
                            type="number"
                            name="numberOfPeople"
                            min="1"
                            value={
                              editedOrders[order.idOrder]?.numberOfPeople ||
                              order.numberOfPeople
                            }
                            onChange={(e) => handleChange(order.idOrder, e)}
                            className="border rounded px-2 py-1 w-20"
                          />
                        ) : (
                          order.numberOfPeople
                        )}
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingOrder === order.idOrder ? (
                          <input
                            type="number"
                            name="totalPrice"
                            min="0"
                            step="0.01"
                            value={
                              editedOrders[order.idOrder]?.totalPrice ||
                              order.totalPrice
                            }
                            onChange={(e) => handleChange(order.idOrder, e)}
                            className="border rounded px-2 py-1 w-24"
                          />
                        ) : (
                          `$${order.totalPrice?.toLocaleString() || 0}`
                        )}
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingOrder === order.idOrder ? (
                          <select
                            name="isPaid"
                            value={
                              editedOrders[order.idOrder]?.isPaid !== undefined
                                ? editedOrders[order.idOrder]?.isPaid
                                : order.isPaid
                            }
                            onChange={(e) => handleChange(order.idOrder, e)}
                            className="border rounded px-2 py-1"
                          >
                            <option value={true}>Sí</option>
                            <option value={false}>No</option>
                          </select>
                        ) : (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            order.isPaid 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {order.isPaid ? "Pagada" : "Pendiente"}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingOrder === order.idOrder ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleSave(order.idOrder)}
                              disabled={loading}
                              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 transition font-nunito text-sm"
                            >
                              💾 Guardar
                            </button>
                            <button
                              onClick={() => setEditingOrder(null)}
                              className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition font-nunito text-sm"
                            >
                              ❌ Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingOrder(order.idOrder)}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition font-nunito text-sm"
                          >
                            ✏️ Editar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg font-nunito">
                📋 No hay órdenes disponibles
              </div>
              <p className="text-gray-400 text-sm mt-2">
                {filterPaid ? 'No hay órdenes pagadas' : 'No se encontraron órdenes'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderManagement;
