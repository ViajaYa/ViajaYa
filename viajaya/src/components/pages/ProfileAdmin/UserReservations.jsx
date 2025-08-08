import { useState, useEffect } from "react";
import { useReservations } from "../../hooks/useReservations";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import QRImage from "../../../assets/QR.png";
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
  console.log('🔄 UserReservations render ejecutado');
  
  // Usa el hook global
  const {
    reservations,
    loading,
    error,
    fetchReservations,
    deleteReservation,
  } = useReservations();

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [isQrPopupOpen, setIsQrPopupOpen] = useState(false);

  // ✅ Protección: Solo cargar reservaciones si estamos en la ruta correcta
  useEffect(() => {
    console.log('UserReservations - Componente montado en:', window.location.pathname);
    
    // Solo cargar si estamos en la ruta correcta
    if (window.location.pathname === '/userReservas') {
      console.log('UserReservations - Cargando reservaciones del usuario...');
      fetchReservations();
    } else {
      console.log('UserReservations - NO cargando (ruta incorrecta)');
    }
    // eslint-disable-next-line
  }, []);

  const handleCancelReservation = (idOrder) => {
    deleteReservation(idOrder)
      .unwrap()
      .then(() => {
        toast.success("Reserva anulada correctamente");
        // ✅ Solo recargar si estamos en la ruta correcta
        if (window.location.pathname === '/userReservas') {
          fetchReservations();
        }
      })
      .catch((error) => {
        toast.error(error || "Error al anular la reserva");
      });
  };

  if (loading) {
    return <div className="text-center mt-8">Cargando reservas...</div>;
  }

  if (error) {
    return (
      <div className="text-center mt-8 text-red-500">{error}</div>
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
                      <FaUser className="mr-2 text-gray-500" />
                      <strong>Cantidad de Personas:</strong>&nbsp;
                      {reserva.numberOfPeople || "No especificado"}
                    </p>
                    <p className="flex items-center">
                      <GiAirplaneDeparture className="mr-2 text-gray-500" />
                      <strong>Destino:</strong>&nbsp;
                      {reserva.pack?.title || "Destino no especificado"}
                    </p>
                    <p className="flex items-center">
                      <FaMoneyBillWave className="mr-2 text-gray-500" />
                      <strong>Precio Total:</strong>&nbsp;
                      {Number(reserva.totalPrice).toLocaleString("es-CO", {
                        style: "currency",
                        currency: "COP",
                      })}
                    </p>
                    <p className="flex items-center">
                      <FaCalendarAlt className="inline mr-2 text-gray-500" />
                      <strong>Fecha de salida:</strong>&nbsp;
                      {new Date(reserva.fechas?.salida).toLocaleDateString(
                        "es-CO",
                        { day: "2-digit", month: "2-digit", year: "2-digit" }
                      ) || "Fecha no disponible"}
                    </p>
                    <p className="flex items-center">
                      <FaCalendarAlt className="inline mr-2 text-gray-500" />
                      <strong>Fecha de llegada:</strong>&nbsp;
                      {new Date(reserva.fechas?.llegada).toLocaleDateString(
                        "es-CO",
                        { day: "2-digit", month: "2-digit", year: "2-digit" }
                      ) || "Fecha no disponible"}
                    </p>
                  </div>
                  <div className="flex justify-end mt-4">
                    <button
                      onClick={() => handleCancelReservation(reserva.idOrder)}
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
              className="w-[350px] h-[480px]"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default UserReservations;