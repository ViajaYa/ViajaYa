import { useState, useEffect } from "react";
import axios from "axios";
import { generatePDF } from "./Form";

import NavBar from "../layout/NavBar/NavBar";

const SelectedNumberList = () => {
  const [selectedNumbers, setSelectedNumbers] = useState([]);

  useEffect(() => {
    const fetchSelectedNumbers = async () => {
      try {
        const response = await axios.get("/numbers/selected");
        console.log("Números seleccionados:", response.data);
        setSelectedNumbers(response.data);
      } catch (error) {
        console.error("Error al obtener números seleccionados:", error);
      }
    };

    fetchSelectedNumbers();
  }, []);

  const handleDownloadPDF = (number) => {
    const { value, name, phone } = number;
    generatePDF([value], name, phone);
  };

  const handlePaymentStatusChange = async (number) => {
    try {
      const updatedNumber = { ...number, isPaid: !number.isPaid };
      console.log(`/numbers/${number.id}/pay`);
      await axios.put(`/numbers/${number.id}/pay`, {
        isPaid: updatedNumber.isPaid,
      });

      // Actualiza el estado local
      setSelectedNumbers((prevNumbers) =>
        prevNumbers.map((num) => (num.id === number.id ? updatedNumber : num))
      );
    } catch (error) {
      console.error("Error al actualizar el estado de pago:", error);
    }
  };

  return (
    <div className="overflow-x-auto">
      <div className="fixed top-0 left-0 z-50 w-full">
        <NavBar />
      </div>
      <table className="min-w-full bg-white border mt-32 border-gray-200">
        <thead>
          <tr className="bg-gray-100">
            <th className="border-b-2 border-gray-300 px-4 py-2">Valor</th>
            <th className="border-b-2 border-gray-300 px-4 py-2">Nombre</th>
            <th className="border-b-2 border-gray-300 px-4 py-2">Teléfono</th>
            <th className="border-b-2 border-gray-300 px-4 py-2">Pagado</th>
            <th className="border-b-2 border-gray-300 px-4 py-2">Acción</th>
          </tr>
        </thead>
        <tbody>
          {selectedNumbers.map((number) => (
            <tr key={number.id} className="text-center">
              <td className="border-b border-gray-200 px-4 py-2">
                {number.value}
              </td>
              <td className="border-b border-gray-200 px-4 py-2">
                {number.name}
              </td>
              <td className="border-b border-gray-200 px-4 py-2">
                {number.phone}
              </td>
              <td className="border-b border-gray-200 px-4 py-2">
                <input
                  type="checkbox"
                  checked={number.isPaid}
                  onChange={() => handlePaymentStatusChange(number)}
                />
              </td>
              <td className="border-b border-gray-200 px-4 py-2">
                <button
                  onClick={() => handleDownloadPDF(number)}
                  className="bg-blue-500 text-white py-1 px-2 rounded"
                >
                  Descargar PDF
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SelectedNumberList;
