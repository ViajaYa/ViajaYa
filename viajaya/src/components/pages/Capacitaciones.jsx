import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCapacitaciones } from '../../redux/NewActions/newActions';

const Capacitaciones = () => {
  const dispatch = useDispatch();
  
  // Obtener los videos del estado global (Redux)
  const capacitaciones = useSelector((state) => state.capacitaciones);
  console.log('capacitaciones desde Redux:', capacitaciones);

  useEffect(() => {
    // Llamar la acción para obtener los cpacitaciones al montar el componente
    dispatch(fetchCapacitaciones());
  }, [dispatch]);

  // Si no hay cpacitaciones disponibles, mostrar un mensaje
  if (!capacitaciones || capacitaciones.length === 0) {
    return <div>No hay cpacitaciones disponibles.</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h3 className="text-lg font-bold mb-4">Video Carousel</h3>

     
      <div className="relative w-full h-96 overflow-y-auto">
        <div className="flex flex-col space-y-4">
          {capacitaciones.map((capacitacion, index) => (
            <div key={index} className="w-full h-64">
              <video
                className="w-full h-full object-cover rounded-lg"
                controls
                src={capacitacion.url} // Usar la URL del video desde Redux
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Capacitaciones;


