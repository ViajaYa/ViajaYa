/* eslint-disable no-unused-vars */
import React, { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useDropzone } from 'react-dropzone';
import { createPack } from '../../redux/NewActions/newActions'; // Tu action para crear el pack

const NewPack = () => {
  const [title, setTitle] = useState('');
  const [days, setDays] = useState('');
  const [location, setLocation] = useState('');


  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [images, setImages] = useState([]);
  const [selectedChars, setSelectedChars] = useState([])
  const [imagePreview, setImagePreview] = useState([]);
  
  const dispatch = useDispatch();

  // Función para manejar la carga de imágenes
  const onDrop = useCallback((acceptedFiles) => {
    setImages(acceptedFiles);
    setImagePreview(acceptedFiles.map(file => URL.createObjectURL(file)));
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: 'image/*',
  });

  // Función para manejar el envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', title);
    formData.append('days', days);
    formData.append('location', location);
    formData.append('description', description);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('lat', lat);
    formData.append('lng', lng);
    formData.append('selectedChars', selectedChars)

    images.forEach((image) => {
      formData.append('images', image);
    });

    formData.append('chars', JSON.stringify(selectedChars)); 

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

        {imagePreview.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-4">
            {imagePreview.map((src, index) => (
              <div key={index} className="relative">
                <img src={src} alt={`Preview ${index}`} className="w-full h-auto rounded-md" />
                
              </div>
            ))}
          </div>
        )}

        <button
          type="submit"
          className="bg-ColorAzul text-gray-300 px-4 py-2 text-3xl font-bold font-nunito rounded-md hover:bg-blue-600"
        >
          Crear Paquete
        </button>
      </form>
    </div>
  );
};

export default NewPack;


