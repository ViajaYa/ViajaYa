/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllOrders,
  deleteOrder,
} from "../../../redux/NewActions/newActions"; // Make sure to import deleteOrder
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import QRImage from "../../../assets/QR.png";
import axios from "axios";
import {
  FaQrcode,
  FaMoneyBillWave,
  FaWhatsapp,
  FaUser,
  FaCalendarAlt,
} from "react-icons/fa";
import { GiAirplaneDeparture } from "react-icons/gi";
import NavBar from "../../layout/NavBar/NavBar";
import WompiPaymentWidget from "../Ordenes/WompiPaymentWidget";

const PaymentMethods = ({ onSelect }) => {
  const [selectedMethod, setSelectedMethod] = useState(null);

  const handleSelectMethod = (method) => {
    setSelectedMethod(method);
    onSelect(method);
  };

  return (
    <div className="flex flex-wrap space-x-4 justify-center mt-4">
      <div
        onClick={() => handleSelectMethod("QR")}
        className={`p-4 flex flex-col items-center bg-blue-100 rounded-lg cursor-pointer hover:scale-105 transition-transform w-32 h-32 md:w-36 md:h-36 justify-center ${
          selectedMethod === "QR" ? "ring-4 ring-blue-500" : ""
        }`}
      >
        <FaQrcode className="text-4xl text-blue-500" />
        <p className="mt-2 text-gray-800 text-center">QR</p>
      </div>
      <div
        onClick={() => handleSelectMethod("Wompi")}
        className={`p-4 flex flex-col items-center bg-green-100 rounded-lg cursor-pointer hover:scale-105 transition-transform w-32 h-32 md:w-36 md:h-36 justify-center ${
          selectedMethod === "Wompi" ? "ring-4 ring-green-500" : ""
        }`}
      >
        <FaMoneyBillWave className="text-4xl text-green-500" />
        <p className="mt-2 text-gray-800 text-center">Wompi</p>
      </div>
      <div
        onClick={() => handleSelectMethod("WhatsApp")}
        className={`p-4 flex flex-col items-center bg-yellow-100 rounded-lg cursor-pointer hover:scale-105 transition-transform w-32 h-32 md:w-36 md:h-36 justify-center ${
          selectedMethod === "WhatsApp" ? "ring-4 ring-yellow-500" : ""
        }`}
      >
        <FaWhatsapp className="text-4xl text-green-600" />
        <p className="mt-2 text-gray-800 text-center">WhatsApp</p>
      </div>
    </div>
  );
};

const UserReservations = () => {
  const dispatch = useDispatch();
  const reservations = useSelector((state) => state.reservations);
  const { loadingReservations, errorReservations } = useSelector(
    (state) => state.reservations
  );
  const [user, setUser] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [isQrPopupOpen, setIsQrPopupOpen] = useState(false); // Estado para el popup

  const verify = async () => {
    try {
      const data = await axios.get(
        `/user/verify/${localStorage.getItem("token")}`
      );
      setUser(data.data.id);
    } catch (error) {
      toast.error("Por favor, inicia sesión para ver tus reservas", {
        position: "top-right",
      });
    }
  };

  useEffect(() => {
    verify();
  }, []);

  useEffect(() => {
    if (user) {
      dispatch(getAllOrders(user));
    }
  }, [dispatch, user]);

  const handleCancelReservation = (idOrder) => {
    console.log("Attempting to delete reservation with ID:", idOrder); // Log the ID being deleted
    console.log("Current reservations before deletion:", reservations); // Log current reservations

    dispatch(deleteOrder(idOrder)); // Asegúrate de pasar el idOrder aquí

    // Opcionalmente re-fetch orders después de la eliminación
    if (user) {
      dispatch(getAllOrders(user));
    }
  };

  if (loadingReservations) {
    return <div className="text-center mt-8">Cargando reservas...</div>;
  }

  if (errorReservations) {
    return (
      <div className="text-center mt-8 text-red-500">{errorReservations}</div>
    );
  }

  return (
    <>
      <div className="fixed top-0 left-0 z-50 w-full">
        <NavBar />
      </div>
      <div className="min-h-screen pt-20 bg-gray-50 font-nunito">
        <div className="container mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold text-gray-200 mb-6 font-nunito text-center bg-ColorMorado">
            Mis Reservas
          </h2>
          {reservations.length > 0 ? (
            <div className="space-y-6 font-nunito">
              {reservations.map((reserva, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-md shadow-md space-y-6"
                >
                  <h3 className="text-xl font-semibold text-ColorMorado">
                    {reserva.pack?.title || "Paquete no disponible"}
                  </h3>
                  <div className="border-b border-gray-300 pb-2 font-nunito space-y-4 text-lg ">
                    <p className="flex items-center">
                      <FaUser className="mr-2 text-gray-500" />{" "}
                      {/* Icono de personas */}
                      <strong>Cantidad de Personas:</strong>&nbsp;{" "}
                      {reserva.numberOfPeople || "No especificado"}
                    </p>
                    <p className="flex items-center">
                      <GiAirplaneDeparture className="mr-2 text-gray-500" />{" "}
                      {/* Icono de avión */}
                      <strong>Destino:</strong>&nbsp;{" "}
                      {reserva.pack?.title || "Destino no especificado"}
                    </p>
                    <p className="flex items-center">
                      <FaMoneyBillWave className="mr-2 text-gray-500" />{" "}
                      {/* Icono de dinero */}
                      <strong>Precio Total:</strong>&nbsp;{" "}
                      {Number(reserva.totalPrice).toLocaleString("es-CO", {
                        style: "currency",
                        currency: "COP",
                      })}
                    </p>
                    <p className="flex items-center">
                      <FaCalendarAlt className="inline mr-2 text-gray-500" />
                      <strong>Fecha de salida:</strong>&nbsp;{" "}
                      {new Date(reserva.fechas?.salida).toLocaleDateString(
                        "es-CO",
                        { day: "2-digit", month: "2-digit", year: "2-digit" }
                      ) || "Fecha no disponible"}
                    </p>
                    <p className="flex items-center">
                      <FaCalendarAlt className="inline mr-2 text-gray-500" />
                      <strong>Fecha de llegada:</strong>&nbsp;{" "}
                      {new Date(reserva.fechas?.llegada).toLocaleDateString(
                        "es-CO",
                        { day: "2-digit", month: "2-digit", year: "2-digit" }
                      ) || "Fecha no disponible"}
                    </p>
                  </div>
                  <div className="flex justify-end mt-4">
                    <button
                      onClick={() => handleCancelReservation(reserva.idOrder)} // Call deleteOrder with reserva ID
                      className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-nunito"
                    >
                      Anular Reserva
                    </button>
                  </div>

                  {!reserva.isPaid && (
                    <div className="mt-4">
                      <p className="text-ColorMorado font-nunito text-center font-semibold text-xl">
                        ABONA TU RESERVA
                      </p>
                      <PaymentMethods
                        onSelect={(method) => setSelectedPaymentMethod(method)}
                      />
                      {selectedPaymentMethod === "QR" && (
                        <div className="mt-4 text-center">
                          <button
                            onClick={() => setIsQrPopupOpen(true)}
                            className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-nunito"
                          >
                            Ver QR completo
                          </button>
                        </div>
                      )}
                      {selectedPaymentMethod === "Wompi" && (
                        <div className="mt-4 text-center">
                          <p className="text-xl">
                            Realiza el pago a través de Wompi:
                          </p>
                          {/* Llamar al componente WompiPaymentWidget */}
                          <WompiPaymentWidget selectedReservation={reserva} />
                        </div>
                      )}
                      {selectedPaymentMethod === "WhatsApp" && (
                        <div className="mt-4 text-center">
                          <p>
                            Para continuar, comunícate con nosotros vía{" "}
                            <a
                              href="https://wa.link/28unmk"
                              className="text-green-500 underline font-nunito"
                            >
                              WhatsApp
                            </a>
                            .
                          </p>
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

      {/* Popup del QR */}
      {isQrPopupOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
          <div className="bg-white p-8 rounded-lg shadow-lg relative">
            <button
              onClick={() => setIsQrPopupOpen(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              &#10005;
            </button>
            <img
              src={QRImage}
              alt="Código QR"
              className="w-[350px] h-[480px]" // Usando Tailwind para definir el tamaño en px
            />
          </div>
        </div>
      )}
    </>
  );
};

export default UserReservations;
