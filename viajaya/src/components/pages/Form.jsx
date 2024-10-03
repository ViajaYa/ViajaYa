// Form.js
import { useState } from "react";
import jsPDF from "jspdf";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import pdf from "../../assets/rifa/pdf.png";
import NavBar from "../layout/NavBar/NavBar";
import QRImage from "../../assets/rifa/pagoRifa.jpeg";

const generatePDF = (numbers, name, phone) => {
  const a4Width = 100;
  const a4Height = 210;
  const halfWidth = a4Width / 2;
  const halfHeight = a4Height / 2;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [halfWidth, halfHeight],
  });

  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const formattedDate = `${day}-${month}-${year}`;

  const backgroundImage = new Image();
  backgroundImage.src = pdf;
  backgroundImage.onload = () => {
    const imgWidth = doc.internal.pageSize.getWidth();
    const imgHeight = doc.internal.pageSize.getHeight();
    doc.addImage(backgroundImage, "JPEG", 0, 0, imgWidth, imgHeight);

    doc.setFontSize(8);
    doc.setTextColor(255);

    const marginLeft = 15;
    const marginTop = 30;

    doc.text(`${name}`, marginLeft + 9, marginTop + 6);
    doc.text(` ${phone}`, marginLeft + 3, marginTop + 13);
    doc.text(` ${numbers.join(", ")}`, marginLeft + 5, marginTop + 20);
    doc.text(`${formattedDate}`, marginLeft, marginTop + 26);
    doc.save("datos-seleccionados.pdf");
  };
};

const Form = ({ selectedNumbers, onBack }) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
 
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await sendDataToBackend(selectedNumbers, name, phone);
    generatePDF(selectedNumbers, name, phone);
    navigate("/");
  };

  const sendDataToBackend = async (numbers, name, phone) => {
    try {
      await axios.post("/numbers/select", {
        numbers,
        name,
        phone,
      });
      alert("Datos enviados con éxito");
    } catch (error) {
      console.error("Error al enviar datos al backend:", error);
      alert("Error al enviar datos al backend");
    }
  };

  return (
    <div className="max-w-full mx-auto mt-32 mr-16 ml-16 p-8 border rounded shadow">
      <div className="fixed top-0 left-0 z-50 w-full">
        <NavBar />
      </div>
      <h2 className="text-xl font-bold mb-4">
        Datos de los números seleccionados
      </h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="mb-4">
            <label className="block text-gray-700">Nombre:</label>
            <input
              type="text"
              className="mt-1 block w-full border rounded py-2 px-3"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Teléfono:</label>
            <input
              type="tel"
              className="mt-1 block w-full border rounded py-2 px-3"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-between">
            <button
              type="button"
              className="bg-gray-500 text-white py-2 px-4 rounded"
              onClick={onBack}
            >
              Volver
            </button>
            
            

          </div><h1 className="text-3xl font-nunito mt-16">
          Haz el pago en los medios autorizados y envíanos el comprobante por WhatsApp
      </h1>
        </div>
        <div className="flex-row ">
          <img
            src={QRImage}
            alt="Código QR"
            className="w-[480px] h-[480px]" // Limita el tamaño máximo de la imagen
          />
          <button
              type="submit"
              className="bg-ColorAzul text-gray-600 text-xl font-nunito py-3 px-4 rounded mt-2 items-center"
            >
              DESCARGAR PDF
            </button>
        </div>
      </form>
    </div>
  );
  
  
};

Form.propTypes = {
  selectedNumbers: PropTypes.arrayOf(PropTypes.number).isRequired,
  onBack: PropTypes.func.isRequired,
};

// eslint-disable-next-line react-refresh/only-export-components
export { generatePDF };
export default Form;
