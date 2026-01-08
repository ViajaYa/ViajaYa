import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVideos, removeVideo } from '../../redux/NewActions/newActions'; 
import { openCloudinaryWidget } from '../../cloudinaryConfig'; // Tu función para abrir el widget
import axios from 'axios';
import NavBar from '../layout/NavBar/NavBar';
import { FaTrash } from 'react-icons/fa';

const VideoUploader = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    
    const dispatch = useDispatch();
    const videos = useSelector((state) => state.videos?.videos || []);

    // Fetch videos on component mount
    useEffect(() => {
      dispatch(fetchVideos());
    }, [dispatch]);

    // Handle video upload from Cloudinary and send to backend
    const handleUpload = () => {
      setLoading(true);
      setError(null);
      setSuccess(false);

      openCloudinaryWidget(async (url) => {
        // URL del video de Cloudinary se recupera aquí
        console.log('Uploaded video URL:', url);

        try {
          // Enviar la URL al backend
          const response = await axios.post("/insta/videosI", { url });
          console.log(response.data); // Manejar la respuesta del backend si es necesario
          setSuccess(true);
          dispatch(fetchVideos()); // Refrescar la lista de videos
        } catch (err) {
          setError('Error al guardar el video. Intenta de nuevo.');
        } finally {
          setLoading(false);
        }
      });
    };

    const handleDelete = (id) => {
      const confirmed = window.confirm('¿Estás seguro de que deseas eliminar este video?');
      if (confirmed) {
        dispatch(removeVideo(id)); // Assuming removeVideo handles deletion from Cloudinary/backend
      }
    };

    return (
      <div className="container mx-auto p-4 mt-10">
        <div className='fixed top-0 left-0 z-50 w-full'>
          <NavBar />
        </div>
        <h1 className="bg-ColorMorado text-2xl font-bold font-nunito p-2 text-gray-200 mb-8 mt-28">Cargar Video</h1>
        {error && <p className="text-red-500">{error}</p>}
        {success && <p className="text-green-500 font-nunito">¡Video guardado exitosamente!</p>}

        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleUpload}
              className={`bg-ColorAzul hover:bg-blue-300 text-gray-600 font-bold font-nunito py-2 px-4 rounded focus:outline-none focus:shadow-outline ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              {loading ? 'Cargando...' : 'Subir Video'}
            </button>
          </div>
        </div>

        {/* Sección de videos cargados */}
        <h1 className="bg-ColorMorado text-2xl font-bold font-nunito p-2 text-gray-200 mb-8">Videos Cargados</h1>
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          {videos.length === 0 ? (
            <p className="text-gray-500">No hay videos cargados.</p>
          ) : (
            <ul className="space-y-4">
              {videos.map(video => (
                <li key={video.id} className="flex justify-between items-center border-b pb-2 font-nunito">
                  <span className="text-gray-700">{video.url}</span>
                  <button onClick={() => handleDelete(video.id)} className="text-red-500 hover:text-red-700">
                    <FaTrash />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
};

export default VideoUploader;
