import logo from '../../../assets/mascota.png';
import L from 'leaflet';

const iconLogo = L.icon({
  iconUrl: logo, // Ruta a la imagen del icono
  iconSize: [38, 48] // Tamaño del icono
//   iconAnchor: [22, 94], // Punto de anclaje del icono
//   popupAnchor: [-3, -76] // Punto de anclaje del popup
});

export default iconLogo;