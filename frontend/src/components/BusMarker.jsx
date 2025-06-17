import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Tạo icon cho xe buýt
const busIcon = L.divIcon({
  className: 'bus-icon',
  html: `<div style="
    background-color: #e74c3c;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid white;
    box-shadow: 0 0 4px rgba(0,0,0,0.5);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const BusMarker = ({ bus }) => {
  if (!bus || !bus.latitude || !bus.longitude) return null;

  // Format speed directly
  const formattedSpeed = bus.speed == null ? 'N/A' : `${bus.speed} km/h`;

  return (
    <Marker 
      position={[parseFloat(bus.latitude), parseFloat(bus.longitude)]}
      icon={busIcon}
    >
      <Popup>
        <div>
          <h4>Xe buýt</h4>
          <p>ID: {bus.busId}</p>
          <p>Tuyến: {bus.routeId}</p>
          <p>Tốc độ: {formattedSpeed}</p>
        </div>
      </Popup>
    </Marker>
  );
};

export default BusMarker;