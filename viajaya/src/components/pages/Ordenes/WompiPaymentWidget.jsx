/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { updateOrder } from "../../../redux/NewActions/newActions"; // Asegúrate de importar tu acción
import { toast } from 'react-toastify';
import useScript from '../../../useScript';
import { useNavigate } from 'react-router-dom'; // Si estás usando react-router-dom v6

const WompiPaymentWidget = ({ selectedReservation }) => {
  const publicKey = import.meta.env.VITE_WOMPI_PUBLIC_KEY;
  const dispatch = useDispatch();
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const navigate = useNavigate(); // Hook para la navegación en React Router
  const { loaded: scriptLoaded, error: scriptError } = useScript('https://checkout.wompi.co/widget.js');

  useEffect(() => {
    if (!scriptLoaded || scriptError) return;

    if (selectedReservation) {
      const checkout = new window.WidgetCheckout({
        currency: "COP",
        amountInCents: Number(selectedReservation.totalPrice) * 100,
        reference: selectedReservation.idOrder,
        publicKey,
        redirectUrl: 'http://localhost:5173/thanks',
      });

      checkout.open((result) => {
        const transaction = result.transaction;

        if (transaction.status === "APPROVED") {
          setPaymentSuccess(true);
          handlePaymentSuccess();
        } else {
          toast.error("Pago fallido, por favor intenta nuevamente.");
        }
      });
    }
  }, [selectedReservation, scriptLoaded, scriptError]);

  const handlePaymentSuccess = () => {
    if (selectedReservation) {
      const updatedOrder = { ...selectedReservation, isPaid: true };
      dispatch(updateOrder(selectedReservation.idOrder, updatedOrder));
      toast.success("Pago exitoso, reserva actualizada.");
    }
  };

  // Redirigir a la página de "thanks" después de un pago exitoso
  useEffect(() => {
    if (paymentSuccess) {
      navigate("/thanks"); // Redirige manualmente
    }
  }, [paymentSuccess, navigate]);

  return (
    <div>
      {paymentSuccess ? (
        <p className="text-green-500">Pago exitoso. Gracias por tu compra.</p>
      ) : (
        <div id="wompi-widget" className="w-full h-full"></div>
      )}
    </div>
  );
};

export default WompiPaymentWidget;




// {
//   "idOrder": "1ed11e54-3cd4-4918-874d-7e0341061324",
//   "userId": 3,
//   "packId": 1,
//   "bookingDate": "2024-09-30T12:13:58.975Z",
//   "numberOfPeople": 1,
//   "totalPrice": "84000.00",
//   "fechas": {
//       "salida": "2024-10-05",
//       "llegada": "2024-10-21"
//   },
//   "isPaid": false,
//   "pack": {
//       "id": 1,
//       "title": "Prueba 1",
//       "destino": "Internacionales",
//       "cupos": null,
//       "days": 15,
//       "location": "Eiffel",
//       "city": "Paris",
//       "isActive": true,
//       "isYapaya": false,
//       "detail": "Prueba 1",
//       "created": null,
//       "lat": "48.8583701",
//       "lng": "2.2944813",
//       "price": 84000,
//       "fechas": [
//           {
//               "salida": "2024-10-01",
//               "vuelta": "2024-09-14"
//           },
//           {
//               "salida": "2024-10-05",
//               "vuelta": "2024-10-21"
//           }
//       ],
//       "images": [
//           "https://res.cloudinary.com/dbxwx3m3l/image/upload/v1727472016/packs/europa_szcicn.jpg"
//       ],
//       "chars": [
//           "Hotel",
//           "aereos",
//           "piscina",
//           "Desayuno",
//           "Wifi",
//           "gym"
//       ]
//   }
// }