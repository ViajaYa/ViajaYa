import  { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import marker from '../assets/mascota.png';
import "leaflet/dist/leaflet.css";

const customMarkerIcon = L.icon({
    iconUrl: marker,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
});

// eslint-disable-next-line react/prop-types
function MapView({ initialCoordinates, onCoordinatesChange, onSave }) {
    const [position, setPosition] = useState(initialCoordinates);
    const [showTooltip, setShowTooltip] = useState(false);

    useEffect(() => {
        setPosition(initialCoordinates);
    }, [initialCoordinates]);

    const handleMarkerMove = (e) => {
        const latlng = e.target.getLatLng();
        setPosition([latlng.lat, latlng.lng]);
        onCoordinatesChange([latlng.lat, latlng.lng]);
    };

    const handleSave = () => {
        onSave(position);
    };

    const handleMouseOut = () => {
        setShowTooltip(false);
    };

    return (
        <MapContainer center={position} zoom={13} style={{ height: "400px", width: "100%" }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker
                position={position}
                draggable={true}
                icon={customMarkerIcon}
                eventHandlers={{
                    dragend: handleMarkerMove,
                    mouseout: handleMouseOut,
                }}
            >
                {showTooltip && (
                    <Tooltip permanent>
                        <div>Ubica el marcador donde necesitas</div>
                        <div>Haz click para guardar las coordenadas.</div>
                    </Tooltip>
                )}
                <Popup>
                    <div>
                        {position && (
                            <>
                                <p>Latitud: {position[0]}</p>
                                <p>Longitud: {position[1]}</p>
                                <button onClick={handleSave}>Guardar coordenadas</button>
                            </>
                        )}
                    </div>
                </Popup>
            </Marker>
        </MapContainer>
    );
}

export default MapView;





