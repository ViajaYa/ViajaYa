import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllOrders, updateOrder } from "../../redux/NewActions/newActions"; // Asegúrate de tener la action `updateOrder`
import { toast } from "react-toastify";
import NavBar from "../layout/NavBar/NavBar";

const OrderManagement = () => {
  const dispatch = useDispatch();
  const reservations = useSelector((state) => state.reservations);
  const { loadingReservations, errorReservations } = useSelector(
    (state) => state.reservations
  );
  const [filterPaid, setFilterPaid] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editedOrders, setEditedOrders] = useState({});
  const users = useSelector((state) => state.users);
  console.log(users);
  console.log(reservations);

  // Obtener todas las órdenes
  useEffect(() => {
    dispatch(getAllOrders());
  }, [dispatch]);

  // Filtrar órdenes por `isPaid`
  const filteredOrders = filterPaid
    ? reservations.filter((order) => order.isPaid)
    : reservations;
  // Verifica si hay órdenes y maneja duplicados
  const uniqueOrders = filteredOrders.filter(
    (order, index, self) =>
      index === self.findIndex((o) => o.idOrder === order.idOrder)
  );

  const getEmailByUserId = (userId) => {
    const user = users.find((user) => user.id === userId);
    return user ? user.email : "Email no encontrado";
  };

  const formatDate = (dateString) => {
    const options = { day: "2-digit", month: "2-digit", year: "2-digit" };
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", options);
  };

  const handleChange = (idOrder, e) => {
    const { name, value } = e.target;
    setEditedOrders((prevState) => ({
      ...prevState,
      [idOrder]: {
        ...prevState[idOrder],
        [name]: value,
      },
    }));
  };

  const handleSave = (idOrder) => {
    if (!editedOrders[idOrder]) return;

    dispatch(updateOrder(idOrder, editedOrders[idOrder]))
      .then(() => {
        toast.success("Orden actualizada con éxito");
        setEditingOrder(null); // Finalizar edición
        setEditedOrders((prevState) => {
          const updatedOrders = { ...prevState };
          delete updatedOrders[idOrder]; // Limpiar el estado editado para esa orden
          return updatedOrders;
        });
        dispatch(getAllOrders()); // Recargar las órdenes después de la actualización
      })
      .catch((error) => {
        toast.error("Error al actualizar la orden");
      });
  };

  if (loadingReservations) {
    return <div>Cargando órdenes...</div>;
  }

  if (errorReservations) {
    return <div>Error: {errorReservations}</div>;
  }

  return (
    <div className=" mx-auto mt-12 p-6">
      <div className="fixed top-0 left-0 z-50 w-full">
        <NavBar />
      </div>
      <div className="min-h-screen pt-20 bg-gray-100">
        <div className="container mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold text-gray-700 mb-6 font-nunito">
            Gestión de Órdenes
          </h2>

          <div className="mb-4 font-nunito">
            <label>
              <input
                type="checkbox"
                checked={filterPaid}
                onChange={(e) => setFilterPaid(e.target.checked)}
              />{" "}
              Mostrar solo órdenes pagadas
            </label>
          </div>

          {filteredOrders.length > 0 ? (
            <table className="min-w-full bg-white font-nunito">
              <thead>
                <tr>
                  <th className="px-4 py-2 font-nunito text-start">
                    Fecha Reserva
                  </th>
                  <th className="px-4 py-2 font-nunito text-start">Usuario</th>
                  <th className="px-4 py-2 font-nunito text-start">Paquete</th>
                  <th className="px-4 py-2 font-nunito text-start">
                    Fecha de salida
                  </th>
                  <th className="px-4 py-2 font-nunito text-start">
                    Fecha de llegada
                  </th>
                  <th className="px-4 py-2 font-nunito text-start">
                    Número de personas
                  </th>
                  <th className="px-4 py-2 font-nunito text-start">
                    Precio total
                  </th>
                  <th className="px-4 py-2 font-nunito text-start">Pagada</th>
                  <th className="px-4 py-2 font-nunito text-start">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {uniqueOrders.map((order) => (
                  <tr key={order.idOrder}>
                    <td className="border px-4 py-2">
                      {editingOrder === order.idOrder ? (
                        <input
                          type="number"
                          name="bookingDate"
                          value={
                            editedOrders[order.idOrder]?.bookingDate ||
                            order.bookingDate
                          }
                          onChange={(e) => handleChange(order.idOrder, e)}
                        />
                      ) : (
                        formatDate(order.bookingDate)
                      )}
                    </td>

                    <td className="border px-4 py-2">
                      {editingOrder === order.idOrder ? (
                        <input
                          type="email"
                          name="email"
                          value={
                            editedOrders[order.idOrder]?.email ||
                            getEmailByUserId(order.userId) // Aquí obtenemos el email del usuario
                          }
                          onChange={(e) => handleChange(order.idOrder, e)}
                        />
                      ) : (
                        getEmailByUserId(order.userId) // Mostrar el email del usuario si no está en modo edición
                      )}
                    </td>

                    <td className="border px-4 py-2">
                      {order.pack ? order.pack.title : "Sin título"}
                    </td>

                    <td className="border px-4 py-2">
                      {editingOrder === order.idOrder ? (
                        <input
                          type="date"
                          name="fechas.salida"
                          value={
                            editedOrders[order.idOrder]?.fechas?.salida ||
                            order.fechas.salida
                          }
                          onChange={(e) => handleChange(order.idOrder, e)}
                        />
                      ) : (
                        formatDate(order.fechas.salida)
                      )}
                    </td>

                    <td className="border px-4 py-2">
                      {editingOrder === order.idOrder ? (
                        <input
                          type="date"
                          name="fechas.llegada"
                          value={
                            editedOrders[order.idOrder]?.fechas?.llegada ||
                            order.fechas.llegada
                          }
                          onChange={(e) => handleChange(order.idOrder, e)}
                        />
                      ) : (
                        formatDate(order.fechas.llegada)
                      )}
                    </td>

                    <td className="border px-4 py-2">
                      {editingOrder === order.idOrder ? (
                        <input
                          type="number"
                          name="numberOfPeople"
                          value={
                            editedOrders[order.idOrder]?.numberOfPeople ||
                            order.numberOfPeople
                          }
                          onChange={(e) => handleChange(order.idOrder, e)}
                        />
                      ) : (
                        order.numberOfPeople
                      )}
                    </td>

                    <td className="border px-4 py-2">
                      {editingOrder === order.idOrder ? (
                        <input
                          type="number"
                          name="totalPrice"
                          value={
                            editedOrders[order.idOrder]?.totalPrice ||
                            order.totalPrice
                          }
                          onChange={(e) => handleChange(order.idOrder, e)}
                        />
                      ) : (
                        order.totalPrice
                      )}
                    </td>

                    <td className="border px-4 py-2">
                      {editingOrder === order.idOrder ? (
                        <select
                          name="isPaid"
                          value={
                            editedOrders[order.idOrder]?.isPaid !== undefined
                              ? editedOrders[order.idOrder]?.isPaid
                              : order.isPaid
                          }
                          onChange={(e) => handleChange(order.idOrder, e)}
                        >
                          <option value={true}>Sí</option>
                          <option value={false}>No</option>
                        </select>
                      ) : order.isPaid ? (
                        "Sí"
                      ) : (
                        "No"
                      )}
                    </td>

                    <td className="border px-4 py-2">
                      {editingOrder === order.idOrder ? (
                        <button
                          className="bg-blue-500 text-white px-4 py-2 rounded font-nunito"
                          onClick={() => handleSave(order.idOrder)}
                        >
                          Guardar
                        </button>
                      ) : (
                        <button
                          className="bg-yellow-500 text-white px-4 py-2 rounded font-nunito"
                          onClick={() => setEditingOrder(order.idOrder)}
                        >
                          Editar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="font-nunito">No hay órdenes disponibles.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderManagement;
