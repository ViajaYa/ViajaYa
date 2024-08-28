import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useDropzone } from 'react-dropzone';
import { createPack } from '../../redux/NewActions/newActions'; 
import MapView from '../MapView';
import "leaflet/dist/leaflet.css";

const NewPack = () => {
  const [title, setTitle] = useState('');
  const [days, setDays] = useState('');
  const [location, setLocation] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [images, setImages] = useState([]); // Unificando el estado de imágenes
  const [selectedChars, setSelectedChars] = useState([]);

  const dispatch = useDispatch();

  // Función para manejar la carga de imágenes
  const onDrop = (acceptedFiles) => {
    setImages(acceptedFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file) // Generando vista previa
    })));
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png']
    },
    onDrop
  });

  // Función para manejar el cambio de coordenadas desde el mapa
  const handleCoordinatesChange = ([latitude, longitude]) => {
    setLat(latitude);
    setLng(longitude);
  };

  // Función para manejar el envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Formulario enviado")
    const formData = new FormData();
    
    formData.append('title', title);
    formData.append('days', days);
    formData.append('location', location);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('lat', lat);
    formData.append('lng', lng);

    // Añadir cada caracter (chars) individualmente
    selectedChars.forEach((char, index) => {
        formData.append(`chars[${index}]`, char);
    });

    // Añadir cada imagen al FormData
    images.forEach((image, index) => {
        formData.append(`images[${index}]`, image);  // Cambié 'images' a `images[${index}]`
    });

    // Realizar la solicitud usando formData
    dispatch(createPack(formData));
};

  return (
    <div className="container mx-auto mt-12 p-4">
      <h2 className="bg-ColorMorado text-3xl font-bold font-nunito text-white mb-8">Crear Paquete</h2>
      <form onSubmit={handleSubmit} className="space-y-4 grid grid-cols-2 gap-6">
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
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full p-2 font-nunito border border-gray-300 rounded-md"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-nunito font-medium">Destino</label>
          <textarea
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mt-1 block w-full p-2 font-nunito border border-gray-300 rounded-md"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-nunito font-medium">Días</label>
          <input
            type="number"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="mt-1 block w-full p-2 font-nunito border border-gray-300 rounded-md"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-nunito font-medium">Precio</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-1 block w-full p-2 font-nunito border border-gray-300 rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-nunito font-medium">Latitud</label>
          <input
            type="text"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            className="mt-1 block w-full p-2 font-nunito border border-gray-300 rounded-md"
            readOnly
          />
        </div>
        <div>
          <label className="block text-sm font-nunito font-medium">Longitud</label>
          <input
            type="text"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            className="mt-1 block w-full p-2 font-nunito border border-gray-300 rounded-md"
            readOnly
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-nunito font-medium">Características</label>
          <select
            multiple
            value={selectedChars}
            onChange={(e) => setSelectedChars(Array.from(e.target.selectedOptions, option => option.value))}
            className="mt-1 block w-full p-2 font-nunito border border-gray-300 rounded-md"
          >
            <option value="Wifi">Wifi</option>
            <option value="Parqueadero">Parqueadero</option>
            <option value="Piscina">Piscina</option>
            <option value="Jacuzzi">Jacuzzi</option>
            <option value="Cama Doble">Cama Doble</option>
            <option value="Gimnasio">Gimnasio</option>
          </select>
        </div>

        <div {...getRootProps()} className="mt-1 block w-full p-4 border-2 border-dashed border-gray-300 rounded-md text-center cursor-pointer">
          <input {...getInputProps()} />
          <p>Arrastra y suelta tus imágenes aquí, o haz clic para seleccionarlas</p>
        </div>

        {images.length > 0 && ( // Cambiar files a images
          <div className="previews">
            {images.map((image) => ( // Cambiar files.map a images.map
              <div key={image.name}>
                <img src={image.preview} alt={image.name} style={{ width: '200px' }} />
              </div>
            ))}
          </div>
        )}

        {/* Integrando el componente MapView */}
        <div className="col-span-2">
          <label className="block text-sm font-nunito font-medium mb-2">Ubicación en el Mapa</label>
          <MapView
            initialCoordinates={[lat || -34.603722, lng || -58.381592]} // Coordenadas iniciales (ejemplo: Buenos Aires)
            onCoordinatesChange={handleCoordinatesChange}
            onSave={(newCoordinates) => {
              setLat(newCoordinates[0]);
              setLng(newCoordinates[1]);
            }}
          />
        </div>

        <div className="col-span-2">
          <button
            type="submit"
            className="bg-ColorMorado hover:bg-ColorMoradoOscuro text-white font-nunito font-semibold py-2 px-4 rounded-md"
          >
            Crear Paquete
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewPack;



