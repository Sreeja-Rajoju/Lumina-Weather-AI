import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon issues in React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Helper to handle map resizing and centering
function MapController({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, zoom || map.getZoom());
        }
        // Crucial for Leaflet maps in modals
        setTimeout(() => {
            map.invalidateSize();
        }, 300);
    }, [center, zoom, map]);
    return null;
}

function LocationMarker({ onLocationSelect }) {
    const [position, setPosition] = useState(null);
    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng);
            onLocationSelect(e.latlng, false);
        },
    });

    return position === null ? null : (
        <Marker position={position}>
            <Popup className="custom-leaflet-popup">
                <div className="weather-popup">
                    <h3 style={{ color: '#7c4dff', marginBottom: '5px' }}>Location Tagged</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem' }}>Lat: {position.lat.toFixed(4)}</p>
                    <p style={{ margin: 0, fontSize: '0.8rem' }}>Lon: {position.lng.toFixed(4)}</p>
                    <button 
                        className="popup-fetch-btn"
                        onClick={() => onLocationSelect(position, true)}
                        style={{
                            marginTop: '10px',
                            background: 'var(--accent-purple)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                        }}
                    >
                        See Weather here
                    </button>
                </div>
            </Popup>
        </Marker>
    );
}

export function WeatherMapModal({ isOpen, onClose, onSelectLocation, initialCenter }) {
    const [selectedCoords, setSelectedCoords] = useState(null);
    const defaultCenter = initialCenter || [20, 0];
    const defaultZoom = initialCenter ? 8 : 2;

    if (!isOpen) return null;

    return (
        <div className={`map-modal ${isOpen ? 'active' : ''}`}>
            <div className="map-modal-content">
                <div className="map-modal-header">
                    <h2><i className="fas fa-earth-americas"></i> World Weather Explorer</h2>
                    <button className="close-btn" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <div className="map-modal-body">
                    <div className="map-instruction">
                        <i className="fas fa-info-circle"></i>
                        Click anywhere on the map to drop a pin and see local weather insights.
                    </div>
                    <div id="worldMap">
                        <MapContainer 
                            center={defaultCenter} 
                            zoom={defaultZoom} 
                            style={{ height: '100%', width: '100%' }}
                            zoomControl={true}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                            <MapController center={defaultCenter} zoom={defaultZoom} />
                            <LocationMarker onLocationSelect={(coords, immediate) => {
                                if (immediate) {
                                    onSelectLocation(coords.lat, coords.lng);
                                    onClose();
                                } else {
                                    setSelectedCoords(coords);
                                }
                            }} />
                        </MapContainer>
                    </div>
                    {selectedCoords ? (
                        <div className="map-footer-action">
                            <button 
                                className="fetch-btn-premium"
                                onClick={() => {
                                    onSelectLocation(selectedCoords.lat, selectedCoords.lng);
                                    onClose();
                                }}
                            >
                                <i className="fas fa-cloud-sun"></i> See Weather for this Spot
                            </button>
                        </div>
                    ) : (
                        <div className="map-footer-action">
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                <i className="fas fa-hand-pointer"></i> Click on map to select
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
