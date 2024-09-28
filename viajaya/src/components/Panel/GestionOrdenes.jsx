import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllOrders, updateOrder } from "../../redux/NewActions/newActions"; // Asegúrate de tener la action `updateOrder`
import { toast } from 'react-toastify';

const OrderManagement = () => {
  const dispatch = useDispatch();
  const { reservations, loadingReservations, errorReservations } = useSelector(state => state);
  const [filterPaid, setFilterPaid] = useState(false); // Estado para el filtro por `isPaid`
  const [editingOrder, setEditingOrder] = useState(null); // Para identificar la orden que se está editando
  const [editedOrders, setEditedOrders] = useState({}); // Almacenar los cambios realizados a la orden

  // Obtener todas las órdenes
  useEffect(() => {
    dispatch(getAllOrders());
  }, [dispatch]);

  // Filtrar órdenes por `isPaid`
  const filteredOrders = filterPaid ? reservations.filter(order => order.isPaid) : reservations;

  // Manejar el cambio en los campos editables
  const handleChange = (idOrder, e) => {
    const { name, value } = e.target;
    setEditedOrders(prevState => ({
      ...prevState,
      [idOrder]: {
        ...prevState[idOrder],
        [name]: value,
      },
    }));
  };

  // Guardar cambios en la orden
  const handleSave = (idOrder) => {
    if (!editedOrders[idOrder]) return;

    dispatch(updateOrder(idOrder, editedOrders[idOrder]))
      .then(() => {
        toast.success("Orden actualizada con éxito");
        setEditingOrder(null); // Finalizar edición
        setEditedOrders(prevState => {
          const updatedOrders = { ...prevState };
          delete updatedOrders[idOrder]; // Limpiar el estado editado para esa orden
          return updatedOrders;
        });
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
    <div className="min-h-screen pt-20 bg-gray-100">
      <div className="container mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-gray-700 mb-6">Gestión de Órdenes</h2>

        {/* Filtro por isPaid */}
        <div className="mb-4">
          <label>
            <input
              type="checkbox"
              checked={filterPaid}
              onChange={(e) => setFilterPaid(e.target.checked)}
            />{" "}
            Mostrar solo órdenes pagadas
          </label>
        </div>

        {/* Listar las órdenes */}
        {filteredOrders.length > 0 ? (
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="px-4 py-2">Paquete</th>
                <th className="px-4 py-2">Fecha de salida</th>
                <th className="px-4 py-2">Fecha de llegada</th>
                <th className="px-4 py-2">Número de personas</th>
                <th className="px-4 py-2">Precio total</th>
                <th className="px-4 py-2">Pagada</th>
                <th className="px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.idOrder}>
                  {/* Datos de la orden */}
                  <td className="border px-4 py-2">{order.pack.title}</td>
                  
                  {/* Fechas de la reserva */}
                  <td className="border px-4 py-2">
                    {editingOrder === order.idOrder ? (
                      <input
                        type="date"
                        name="fechas.salida"
                        value={editedOrders[order.idOrder]?.fechas?.salida || order.fechas.salida}
                        onChange={(e) => handleChange(order.idOrder, e)}
                      />
                    ) : (
                      order.fechas.salida
                    )}
                  </td>

                  <td className="border px-4 py-2">
                    {editingOrder === order.idOrder ? (
                      <input
                        type="date"
                        name="fechas.llegada"
                        value={editedOrders[order.idOrder]?.fechas?.llegada || order.fechas.llegada}
                        onChange={(e) => handleChange(order.idOrder, e)}
                      />
                    ) : (
                      order.fechas.llegada
                    )}
                  </td>

                  {/* Número de personas */}
                  <td className="border px-4 py-2">
                    {editingOrder === order.idOrder ? (
                      <input
                        type="number"
                        name="numberOfPeople"
                        value={editedOrders[order.idOrder]?.numberOfPeople || order.numberOfPeople}
                        onChange={(e) => handleChange(order.idOrder, e)}
                      />
                    ) : (
                      order.numberOfPeople
                    )}
                  </td>

                  {/* Precio total */}
                  <td className="border px-4 py-2">
                    {editingOrder === order.idOrder ? (
                      <input
                        type="number"
                        name="totalPrice"
                        value={editedOrders[order.idOrder]?.totalPrice || order.totalPrice}
                        onChange={(e) => handleChange(order.idOrder, e)}
                      />
                    ) : (
                      order.totalPrice
                    )}
                  </td>

                  {/* Estado de pago */}
                  <td className="border px-4 py-2">
                    {editingOrder === order.idOrder ? (
                      <select
                        name="isPaid"
                        value={editedOrders[order.idOrder]?.isPaid !== undefined ? editedOrders[order.idOrder]?.isPaid : order.isPaid}
                        onChange={(e) => handleChange(order.idOrder, e)}
                      >
                        <option value={true}>Sí</option>
                        <option value={false}>No</option>
                      </select>
                    ) : (
                      order.isPaid ? "Sí" : "No"
                    )}
                  </td>

                  {/* Acciones: Editar/Guardar */}
                  <td className="border px-4 py-2">
                    {editingOrder === order.idOrder ? (
                      <button
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                        onClick={() => handleSave(order.idOrder)}
                      >
                        Guardar
                      </button>
                    ) : (
                      <button
                        className="bg-yellow-500 text-white px-4 py-2 rounded"
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
          <div>No hay órdenes disponibles.</div>
        )}
      </div>
    </div>
  );
};

export default OrderManagement;

