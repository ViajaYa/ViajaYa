import React from "react";


const ThankYouPage = () => {
    
    
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-3xl font-bold text-ColorMorado text-center mb-6">
          ¡Gracias por tu compra!
        </h1>
        <p className="text-gray-700 text-center mb-4">
          Tu pedido ha sido procesado con éxito. Agradecemos tu confianza en
          nosotros y esperamos que disfrutes de tu viaje.
        </p>
        <div className=" p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold text-ColorMorado mb-2">
            ¿Qué sigue?
          </h2>
          <p className="text-gray-600">
            Puedes revisar los detalles de tu reserva {" "}
            <span className="font-semibold text-ColorMorado">Mis Reservas</span>{" "}
            de tu perfil. Allí encontrarás toda la información necesaria los detalles de la reserva.
          </p>
        </div>
        <p className="text-gray-700 text-center">
          Si tienes alguna pregunta o necesitas asistencia, no dudes en{" "}
          <span className="font-semibold text-ColorMorado">contactarnos</span>. 
          Estamos aquí para ayudarte en lo que necesites.
        </p>
        <button
          className="mt-6 w-full bg-ColorMorado text-white py-2 px-4 rounded-md hover:bg-ColorMorado focus:outline-none focus:ring-2 focus:ring-green-500"
          onClick={() => window.location.href = `/userReservas`}
        >
          Ir a Mis Reservas
        </button>
      </div>
    </div>
  );
};

export default ThankYouPage;
