import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCapacitaciones } from '../../redux/NewActions/newActions';
import NavBar from '../layout/NavBar/NavBar';

const Capacitaciones = () => {
  const dispatch = useDispatch();
  
  // Obtener los videos del estado global (Redux)
  const capacitaciones = useSelector((state) => state.capacitaciones);
  console.log('capacitaciones desde Redux:', capacitaciones);

  useEffect(() => {
    // Llamar la acción para obtener los capacitaciones al montar el componente
    dispatch(fetchCapacitaciones());
  }, [dispatch]);

  // Si no hay capacitaciones disponibles, mostrar un mensaje
  if (!capacitaciones || capacitaciones.length === 0) {
    return <div>No hay capacitaciones disponibles.</div>;
  }

  return (
    <div className="max-w-full mx-auto mt-40 mr-16 ml-16 p-8 border bg-blue-300 rounded shadow ">
    
      <div className="fixed top-0 left-0 z-50 w-full">
        <NavBar />
      </div>
      

      <div className="flex flex-col items-center space-y-8">
        {capacitaciones.map((capacitacion, index) => (
          <div key={index} className="w-full max-w-3xl">
            <video
              className="w-full h-auto object-cover rounded-lg"
              controls
              src={capacitacion.url} // Usar la URL del video desde Redux
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Capacitaciones;




