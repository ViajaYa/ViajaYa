import iconHuman from '../../../assets/me.png';
import L from 'leaflet';

const myIcon = L.icon({
  iconUrl: iconHuman, // Ruta a la imagen del icono
  iconSize: [38, 38] // Tamaño del icono
//   iconAnchor: [22, 94], // Punto de anclaje del icono
//   popupAnchor: [-3, -76] // Punto de anclaje del popup
});


export default myIcon;