import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllOrders } from "../../../redux/NewActions/newActions";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Asegúrate de tener esto importado
import QRImage from '../../../assets/QR.png'; // Imagen del QR
import axios from "axios";
import { FaQrcode, FaMoneyBillWave, FaWhatsapp } from "react-icons/fa";

// Componente de métodos de pago
const PaymentMethods = ({ onSelect }) => {
  const [selectedMethod, setSelectedMethod] = useState(null);

  const handleSelectMethod = (method) => {
    setSelectedMethod(method);
    onSelect(method); // Devuelve el método seleccionado al componente padre
  };

  return (
    <div className="flex space-x-4 justify-center mt-4">
      <div 
        onClick={() => handleSelectMethod("QR")}
        className={`p-4 flex flex-col items-center bg-blue-100 rounded-lg cursor-pointer hover:scale-105 transition-transform ${
          selectedMethod === "QR" ? "ring-4 ring-blue-500" : ""
        }`}
      >
        <FaQrcode className="text-4xl text-blue-500" />
        <p className="mt-2 text-gray-800">QR</p>
      </div>
      <div 
        onClick={() => handleSelectMethod("Wompi")}
        className={`p-4 flex flex-col items-center bg-green-100 rounded-lg cursor-pointer hover:scale-105 transition-transform ${
          selectedMethod === "Wompi" ? "ring-4 ring-green-500" : ""
        }`}
      >
        <FaMoneyBillWave className="text-4xl text-green-500" />
        <p className="mt-2 text-gray-800">Wompi</p>
      </div>
      <div 
        onClick={() => handleSelectMethod("WhatsApp")}
        className={`p-4 flex flex-col items-center bg-yellow-100 rounded-lg cursor-pointer hover:scale-105 transition-transform ${
          selectedMethod === "WhatsApp" ? "ring-4 ring-yellow-500" : ""
        }`}
      >
        <FaWhatsapp className="text-4xl text-green-600" />
        <p className="mt-2 text-gray-800">WhatsApp</p>
      </div>
    </div>
  );
};

const UserReservations = () => {
  const dispatch = useDispatch();
  const reservations = useSelector(state => state.reservations);
  const { loadingReservations, errorReservations } = useSelector(state => state.reservations);
  const [user, setUser] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  // Verificar usuario logueado
  const verify = async () => {
    try {
      const data = await axios.get(`/user/verify/${localStorage.getItem("token")}`);
      setUser(data.data.id);
    } catch (error) {
      console.log("Error al verificar usuario:", error);
      toast.error("Por favor, inicia sesión para ver tus reservas", { position: "top-right" });
    }
  };

  // Obtener reservas del usuario
  useEffect(() => {
    verify();
  }, []);

  useEffect(() => {
    if (user) {
      dispatch(getAllOrders(user));
    }
  }, [dispatch, user]);

  if (loadingReservations) {
    return <div className="text-center mt-8">Cargando reservas...</div>;
  }

  if (errorReservations) {
    return <div className="text-center mt-8 text-red-500">{errorReservations}</div>;
  }

  return (
    <div className="min-h-screen pt-20 bg-gray-50">
      <div className="container mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-gray-700 mb-6">Mis Reservas</h2>

        {/* Mostrar las reservas */}
        {reservations.length > 0 ? (
          <div className="space-y-6">
            {reservations.map((reserva, index) => (
              <div key={index} className="p-4 border rounded-md shadow-md">
                {/* Verificación si pack está definido */}
                <h3 className="text-xl font-semibold text-ColorMorado">
                  {reserva.pack?.title ? reserva.pack.title : "Paquete no disponible"}
                </h3>
                <p><strong>Fecha de salida:</strong> {reserva.fechas?.salida || "Fecha no disponible"}</p>
                <p><strong>Fecha de llegada:</strong> {reserva.fechas?.llegada || "Fecha no disponible"}</p>
                <p><strong>Total Personas:</strong> {reserva.numberOfPeople || "No especificado"}</p>
                <p><strong>Precio Total:</strong> {Number(reserva.totalPrice).toLocaleString("es-CO", { style: "currency", currency: "COP" })}</p>
                
                {/* Mostrar los métodos de pago si la reserva no está pagada */}
                {!reserva.isPaid && (
                  <div className="mt-4">
                    <p className="text-red-500 font-semibold">Reserva no pagada</p>
                    
                    {/* Componente de métodos de pago */}
                    <PaymentMethods onSelect={(method) => setSelectedPaymentMethod(method)} />

                    {/* Mostrar el QR o información adicional según el método seleccionado */}
                    {selectedPaymentMethod === "QR" && (
                      <div className="mt-4">
                        <img src={QRImage} alt="Código QR para pagar" className="w-48 h-48 mt-4 mx-auto" />
                      </div>
                    )}
                    {selectedPaymentMethod === "Wompi" && (
                      <div className="mt-4 text-center">
                        <p>Realiza el pago a través de Wompi <a href="https://www.wompi.co" className="text-blue-500 underline">aquí</a>.</p>
                      </div>
                    )}
                    {selectedPaymentMethod === "WhatsApp" && (
                      <div className="mt-4 text-center">
                        <p>Para continuar, comunícate con nosotros vía <a href="https://wa.me/123456789" className="text-green-500 underline">WhatsApp</a>.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-600">No tienes reservas.</div>
        )}
      </div>
    </div>
  );
};

export default UserReservations;

