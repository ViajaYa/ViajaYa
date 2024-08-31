// Form.js
import { useState } from 'react';
import jsPDF from 'jspdf';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import pdf from '../../assets/rifa/pdf.png';


const generatePDF = (numbers, name, phone) => {
  const a4Width = 100;
  const a4Height = 210;
  const halfWidth = a4Width / 2;
  const halfHeight = a4Height / 2;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [halfWidth, halfHeight]
  });

  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0'); 
  const year = now.getFullYear();
  const formattedDate = `${day}-${month}-${year}`;

  const backgroundImage = new Image();
  backgroundImage.src = pdf;
  backgroundImage.onload = () => {
    const imgWidth = doc.internal.pageSize.getWidth();
    const imgHeight = doc.internal.pageSize.getHeight();
    doc.addImage(backgroundImage, 'JPEG', 0, 0, imgWidth, imgHeight);

    doc.setFontSize(8);
    doc.setTextColor(255);

    const marginLeft = 15;
    const marginTop = 30;

    doc.text(`${name}`, marginLeft + 9, marginTop + 6);
    doc.text(` ${phone}`, marginLeft + 3, marginTop + 13);
    doc.text(` ${numbers.join(', ')}`, marginLeft + 5, marginTop + 20);
    doc.text(`${formattedDate}`, marginLeft, marginTop + 26);
    doc.save('datos-seleccionados.pdf');
  };
};

const Form = ({ selectedNumbers, onBack }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await sendDataToBackend(selectedNumbers, name, phone);
    generatePDF(selectedNumbers, name, phone);
    navigate('/');
  };

  const sendDataToBackend = async (numbers, name, phone) => {
    try {
      await axios.post('https://numberboard.onrender.com/numbers/select', {
        numbers,
        name,
        phone,
      });
      alert('Datos enviados con éxito');
    } catch (error) {
      console.error('Error al enviar datos al backend:', error);
      alert('Error al enviar datos al backend');
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 border rounded shadow">
      <h2 className="text-xl font-bold mb-4">Datos de los números seleccionados</h2>
      <form onSubmit={handleSubmit}>
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
          <button type="button" className="bg-gray-500 text-white py-2 px-4 rounded" onClick={onBack}>
            Volver
          </button>
          <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded">
            Descargar PDF
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










