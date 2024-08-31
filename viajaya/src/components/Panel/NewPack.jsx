import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createPack } from '../../redux/NewActions/newActions'; 
import "leaflet/dist/leaflet.css";
import { openCloudinaryWidget } from '../../cloudinaryConfig';
import NavBar from '../layout/NavBar/NavBar';

const NewPack = () => {
  const [title, setTitle] = useState('');
  const [days, setDays] = useState('');
  const [destino, setDestino] = useState('Internacionales');
  const [chars, setChars] = useState('');
  const[location, setLocation] = useState('') // Valor predeterminado
  const [fechas, setFechas] = useState([{ salida: '', vuelta: '' }]);
  const [city, setCity] = useState('');
  const [detail, setDetail] = useState('');
  const[ lat, setLat] = useState('')
  const[ lng, setLng] = useState('')
  const[ cupos, setCupos]= useState('')

  const [price, setPrice] = useState('');
  const [images, setImages] = useState([]);
  const [selectedChars, setSelectedChars] = useState([]);
  const [successMessage, setSuccessMessage] = useState(false);

  const dispatch = useDispatch();

  const handleWidget = () => {
    openCloudinaryWidget((uploadedImageUrl) => {
      setImages(prevImages => [...prevImages, uploadedImageUrl]);
    });
  };

  const handleFechaChange = (index, key, value) => {
    const newFechas = [...fechas];
    newFechas[index][key] = value;
    setFechas(newFechas);
  };

  const handleAddFechas = () => {
    setFechas([...fechas, { salida: '', vuelta: '' }]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('title', title);
    formData.append('days', days);
    formData.append('city', city);
    formData.append('chars', chars);
    formData.append('destino', destino);
    formData.append('lat', lat);
    formData.append('lng', lng);
    formData.append('location', location);
    formData.append('detail', detail);
    formData.append('price', price);
    formData.append('fechas', JSON.stringify(fechas));
    formData.append('cupos', cupos)

    images.forEach((url, index) => {
      formData.append(`images[${index}]`, url);
    });

    selectedChars.forEach((char, index) => {
      formData.append(`chars[${index}]`, char);
    });

    dispatch(createPack(formData))
      .then(() => {
        // Mostrar mensaje de éxito
        setSuccessMessage(true);

        // Limpiar formulario
        setTitle('');
        setDays('');
        setCity('');
        setDestino('Internacionales'); 
        setLocation('');
        setDetail('');
        setPrice('');
        setLat('');
        setLng('');
        setFechas([{ salida: '', vuelta: '' }]);
        setImages([]);
        setSelectedChars([]);
        setChars([])
        setCupos('')

        // Ocultar mensaje después de 3 segundos
        setTimeout(() => {
          setSuccessMessage(false);
        }, 3000);
      });
  };

  return (
    <div className="container mx-auto mt-12 p-4">
       <div className='fixed top-0 left-0 z-50 w-full'>
            <NavBar />
          </div>
      <h2 className="bg-ColorMorado text-2xl font-bold font-nunito p-2 text-gray-200 mb-8 mt-10">Crear Nuevo Paquete</h2>
  
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          Paquete creado con éxito.
        </div>
      )}
  
      <form onSubmit={handleSubmit} className="space-y-1 grid grid-cols-1 gap-3" encType="multipart/form-data">
        {/* Campos del formulario */}
        <div>
          <label className="block text-sm font-nunito font-medium">Nombre del Paquete</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full p-2 font-nunito border border-gray-300 rounded-md"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-nunito font-medium">Descripción</label>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            className="mt-1 block w-full p-2 font-nunito border border-gray-300 rounded-md"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-nunito font-medium">Destino</label>
          <select
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
            className="mt-1 block w-full p-2 font-nunito border border-gray-300 rounded-md"
            required
          >
            <option value="Internacionales">Internacionales</option>
            <option value="Europa">Europa</option>
            <option value="Nacionales">Nacionales</option>
            <option value="Llano">Llano</option>
            <option value="Por Tierra">Por Tierra</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-nunito font-medium">Cupos</label>
          <input
            type="number"
            value={cupos}
            onChange={(e) => setCupos(e.target.value)}
            className="mt-1 block w-32 p-2 font-nunito border border-gray-300 rounded-md"
            max="999"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-nunito font-medium">Ciudad</label>
          <textarea
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="mt-1 block w-full p-2 font-nunito border border-gray-300 rounded-md"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-nunito font-medium">Locación</label>
          <textarea
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mt-1 block w-full p-2 font-nunito border border-gray-300 rounded-md"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-nunito font-medium">Amenities</label>
          <select
            multiple
            value={selectedChars}
            onChange={(e) => setSelectedChars([...e.target.selectedOptions].map(option => option.value))}
            className="mt-1 block w-full p-2 font-nunito border border-gray-300 rounded-md"
            required
          >
            <option value="Hotel">Hotel</option>
            <option value="aereos">Aereos Incluidos</option>
            <option value="piscina">Piscina</option>
            <option value="Desayuno">Desayuno Incluido</option>
            <option value="Wifi">Wifi</option>
            <option value="gym">Gimnasio</option>
          </select>
        </div>
        <div className="flex space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-nunito font-medium">Latitud</label>
            <input
              type="text"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="mt-1 block w-full p-2 font-nunito border border-gray-300 rounded-md"
              required
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-nunito font-medium">Longitud</label>
            <input
              type="text"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              className="mt-1 block w-full p-2 font-nunito border border-gray-300 rounded-md"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-nunito font-medium">Días</label>
          <input
            type="number"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="mt-1 block w-32 p-2 font-nunito border border-gray-300 rounded-md"
            max="999"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-nunito font-medium">Precio</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-1 block w-32 p-2 font-nunito border border-gray-300 rounded-md"
            max="999999"
            required
          />
        </div>
  
        {fechas.map((fecha, index) => (
          <div key={index} className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-nunito font-medium">Fecha de Salida</label>
              <input
                type="date"
                value={fecha.salida}
                onChange={(e) => handleFechaChange(index, 'salida', e.target.value)}
                className="mt-1 block w-full p-2 font-nunito border border-gray-300 rounded-md"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-nunito font-medium">Fecha de Vuelta</label>
              <input
                type="date"
                value={fecha.vuelta}
                onChange={(e) => handleFechaChange(index, 'vuelta', e.target.value)}
                className="mt-1 block w-full p-2 font-nunito border border-gray-300 rounded-md"
                required
              />
            </div>
          </div>
        ))}
  
        <button
          type="button"
          onClick={handleAddFechas}
          className="bg-ColorAzul hover:bg-gray-400 text-black font-nunito font-semibold py-2 px-4 rounded-md mt-2"
        >
          Agregar Otra Fecha
        </button>
  
        <div>
          <label className="block text-sm font-nunito font-medium">Imágenes</label>
          <button type="button" onClick={handleWidget} className="bg-ColorAzul hover:bg-gray-400 text-white font-nunito font-semibold py-2 px-4 rounded-md">
            Selecciona las imágenes
          </button>
          <div className="mt-2 flex flex-wrap">
            {images.map((img, index) => (
              <img key={index} src={img} alt={`Uploaded ${index}`} className="w-32 h-32 object-cover rounded-md shadow-md mr-2 mb-2" />
            ))}
          </div>
        </div>
        
        <button type="submit" className="bg-ColorMorado hover:bg-ColorAzul text-white font-nunito font-semibold py-2 px-4 rounded-md mt-4">
          Crear Paquete
        </button>
      </form>
    </div>
  );
  
};

export default NewPack;








