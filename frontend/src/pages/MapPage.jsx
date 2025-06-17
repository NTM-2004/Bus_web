import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import MapView from '../components/MapView';
// Remove MapService import
import '../styles/MapPage.css';

const MapPage = () => {
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [pathData, setPathData] = useState(null);
  const [trackingBuses, setTrackingBuses] = useState(false);
  const [selectionMode, setSelectionMode] = useState(null); // 'start' or 'end' or null
  const [startPoint, setStartPoint] = useState({ lat: '', lng: '' });
  const [endPoint, setEndPoint] = useState({ lat: '', lng: '' });

  // Add this function to clear all map-related states
  const handleClearMap = () => {
    setSelectedRouteId(null);
    setPathData(null);
    setTrackingBuses(false);
    setSelectionMode(null);
    setStartPoint({ lat: '', lng: '' });
    setEndPoint({ lat: '', lng: '' });
  };

  // Handle route selection from Sidebar
  const handleRouteSelect = (routeId) => {
    setSelectedRouteId(routeId);
    if (!routeId) {
      setPathData(null);
    }
    setTrackingBuses(!!routeId);
  };

  // Handle path data changes
  const handlePathDataChange = (data) => {
    setPathData(data);
    setSelectedRouteId(null);
    setTrackingBuses(false);
  };

  // Handle location selection request from Sidebar
  const handleLocationSelectRequest = (type) => {
    setSelectionMode(type);
  };

  // Handle location selection on map
  const handleLocationSelect = (latlng, type) => {
    // Format latlng directly
    const formatted = {
      lat: latlng.lat.toFixed(6),
      lng: latlng.lng.toFixed(6)
    };
    if (type === 'start') {
      setStartPoint(formatted);
    } else if (type === 'end') {
      setEndPoint(formatted);
    }
    setSelectionMode(null);
  };

  return (
    <div className="map-page">
      {/* Sidebar with route finding and path finding features */}
      <Sidebar 
        onRouteSelect={handleRouteSelect}
        onPathDataChange={handlePathDataChange}
        onLocationSelectRequest={handleLocationSelectRequest}
        startPoint={startPoint}
        endPoint={endPoint}
        onModeChange={handleClearMap}
        onStartPointChange={setStartPoint}   // <-- add this
        onEndPointChange={setEndPoint}       // <-- add this
      />
      
      {/* Map View */}
      <MapView 
        selectedRouteId={selectedRouteId}
        pathData={pathData}
        trackingBuses={trackingBuses}
        onLocationSelect={handleLocationSelect}
        selectionMode={selectionMode}
        startPoint={startPoint}
        endPoint={endPoint}
      />
    </div>
  );
};

export default MapPage;
