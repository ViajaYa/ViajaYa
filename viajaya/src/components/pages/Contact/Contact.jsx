import style from './Contact.module.css'
import { GrLocation } from "react-icons/gr"
import { Element } from "react-scroll"
import { Toaster, toast } from 'react-hot-toast';
import { useInView } from 'react-intersection-observer';
import { useAnimation, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup
} from "react-leaflet";
import iconLogo from "../../layout/Map/Icono"

// Definición de las capas del mapa
const MAP_LAYER_ATTRIBUTION =
  "&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors";
const MAP_LAYER_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

// Datos de las ubicaciones
const locations = [
  { id: 1, name: 'Restrepo Meta', address: 'Centro Comercial Plaza Roma Calle 7 No 5-48 oficina 105', position: [4.2614043, -73.567862] },
  { id: 2, name: 'Bogotá', address: 'Calle 38A Sur No 34d-51', position: [4.3911921, -74.2122951] },
  { id: 3, name: 'Villavicencio', address: 'Av. Villavicencio Tv. 63 Bogotá piso 2', position: [4.1483808188657125, -73.64202505854918] },
  { id: 4, name: 'Guaviare', address: 'Cra.22 10-30 San José del Gaviare', position: [2.570166, -72.642707] },
  { id: 5, name: 'Bogotá', address: 'Cra.51 59c Sur-93 a Centro Comercial Gran Plaza el Ensueño piso 2- local 206', position: [4.582930, -74.15611] }
];

const Contact = () => {
  const [contact, setContact] = useState({
    name: "",
    phone: "",
    mail: "",
    subject: "",
    message: ""
  });

  // Estado para la ubicación seleccionada
  const [currentLocation, setCurrentLocation] = useState(locations[0]);

  const mapRef = useRef();
  const { ref, inView } = useInView({
    // threshold: 0.1
  })
  const animation = useAnimation()

  const [zoom, setZoom] = useState(8);
  const [center, setCenter] = useState([4.3214043, -73.807862]);

  useEffect(() => {
    if (inView) {
      animation.start({
        opacity: 1,
        transition: {
          type: "spring",
          duration: 1,
          bounce: 0.3
        }
      })
    } else {
      animation.start({
        opacity: 0
      })
    }
  }, [inView])

  const changeContact = (e) => {
    setContact({
      ...contact,
      [e.target.name]: e.target.value
    })
  }

  const sendMail = (e) => {
    e.preventDefault()
    if (!contact.name.length || !contact.phone.length || !contact.mail.length || !contact.subject.length || !contact.message.length) return toast.error("Rellena todos los campos")
    axios.post("/user/contact", contact).then((data) => toast.success(data.data.message))
    setContact({
      name: "",
      phone: "",
      mail: "",
      subject: "",
      message: ""
    })
  }

  const handleLocationChange = (location) => {
    setCurrentLocation(location);
    mapRef.current.flyTo(location.position, 15);
  }

  return (
    <Element name="contactanos">
      <Toaster />
      <motion.div ref={ref} animate={animation} className={style.contact} id="contactanos">
        <div className={style.contactContainer}>
          <div className={style.infoContacto}>
      
            <div className={style.mapa}>
              <div>
                <div className={style.mapContainer}>
                  <MapContainer
                    ref={mapRef}
                    center={currentLocation.position}
                    zoom={15}
                    scrollWheelZoom={false}
                    className={style.map}
                  >
                    <TileLayer url={MAP_LAYER_URL} attribution={MAP_LAYER_ATTRIBUTION} />
                    {locations.map(location => (
                      <Marker
                        key={location.id}
                        icon={iconLogo}
                        position={location.position}
                      >
                        <Popup>{location.address}</Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de sedes como slice */}
          <div className="w-full md:w-1/3 flex flex-col space-y-4 mt-8 md:mt-0 p-4 bg-MoradoSuave rounded-lg shadow-md">
            <h2 className="text-lg font-nunito font-bold text-white text-center">Selecciona una sede</h2>
            <div className="flex flex-col space-y-2">
              {locations.map(location => (
                <button
                  key={location.id}
                  onClick={() => handleLocationChange(location)}
                  className="px-4 py-2 text-lg border border-gray-300 rounded-md hover:bg-ColorMorado text-gray-700 font-nunito"
                >
                  {location.name}
                </button>
              ))}
            </div>
          </div>

          {/* Formulario de contacto */}
          <form className="w-full md:w-1/3 flex flex-col space-y-4 mt-8 md:mt-0 p-4 bg-MoradoSuave  rounded-lg shadow-md">
            <div className="flex flex-col space-y-4">
              <div className="flex space-x-4">
                <input
                  className="w-full px-4 py-2 text-lg font-nunito border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  onChange={changeContact}
                  value={contact.name}
                  name="name"
                  placeholder="Nombre"
                />
                <input
                  className="w-full px-4 py-2 text-lg font-nunito border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  onChange={changeContact}
                  value={contact.phone}
                  name="phone"
                  placeholder="Teléfono"
                />
              </div>
              <div className="flex space-x-4">
                <input
                  className="w-full px-4 py-2 text-lg border font-nunito border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  onChange={changeContact}
                  value={contact.mail}
                  name="mail"
                  placeholder="Correo"
                />
                <input
                  className="w-full px-4 py-2 text-lg border font-nunito border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  onChange={changeContact}
                  value={contact.subject}
                  name="subject"
                  placeholder="Asunto"
                />
              </div>
              <textarea
                className="w-full h-28 px-4 py-2 text-lg border font-nunito border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                onChange={changeContact}
                value={contact.message}
                name="message"
                placeholder="Mensaje"
              />
              <button
                onClick={sendMail}
                className="px-6 py-3 text-lg text-gray-600 font-bold font-nunito bg-ColorAzul rounded-md hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500">
                Enviar
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </Element>
  )
};

export default Contact



