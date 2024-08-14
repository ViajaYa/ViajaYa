import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  Tooltip
} from "react-leaflet";
import myIcon from "./Iconos.jsx"
import iconLogo from "./Icono.jsx"
import style from "./Map.module.css"
import { useState, useEffect, useRef } from "react";

const MAP_LAYER_ATTRIBUTION =
  "&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors";
const MAP_LAYER_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

function Map({height, width, fn, center}) {
  const [zoom, setZoom] = useState(7)
  const [coord, setCoord] = useState([4.0267284, -74.0093039]);
  const mapRef= useRef()
  const [travels, setTravels] = useState([])

  const [position, setPosition] = useState(null)
  function LocationMarker() {
    const map = useMapEvents({
      click: (e) => {
        setPosition(e.latlng)
        setCoord([e.latlng.lat, e.latlng.lng])
        mapRef.current.flyTo(coord)
        // setTravels([...travels, e.latlng])
      },
    })
    return position === null ? null : (
      <Marker position={position}>
        {/* <Tooltip>Tooltip for Marker</Tooltip> */}
        <Popup>You are here</Popup>
      </Marker>
    )
  }
  if(center){
  mapRef?.current?.flyTo(center,11)
  }

  useEffect(() => {
    if(position){
    fn(position)
    }
  },[position])

  return (
    <div>
      {/* <button className={style.findMe} onClick={() => mapRef.current.flyTo(coord, 16)}>Donde estoy</button> */}
    <div className={style.mapContainer} style={{height:`${height}vh`,width:`${width}vw`}}>
      <MapContainer
        ref={mapRef}
        center={coord}
        zoom={zoom}
        scrollWheelZoom={false}
        className={style.map}
        style={{height:`${height}vh`,width:`${width}vw`}}
      >
        <TileLayer url={MAP_LAYER_URL} attribution={MAP_LAYER_ATTRIBUTION}/>
        {/* <Marker draggable={true} position={[5.0267284, -74.0093039]} icon={myIcon}>
          <Popup>
            <div>Aca estas tu</div>
          </Popup>
          </Marker> */}
        {travels.map((p,i) => { return(<Marker icon={iconLogo} key={p} position={p}>
        <Popup>Viaje #{i}</Popup>
      </Marker>)})}
      <LocationMarker/>
      </MapContainer>
    </div>
    </div>
  );
}

export default Map;
