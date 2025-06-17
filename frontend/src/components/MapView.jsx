import React, { useState, useEffect, useRef} from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { routeAPI } from '../services/api';
import socketService from '../services/socketService';
import BusMarker from './BusMarker';
import '../styles/MapView.css';
import busStopMarkerUrl from '../assets/bus-stop-icon.png';
import startFlagIconUrl from '../assets/flag.png';
import endFlagIconUrl from '../assets/destination.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const startIcon = new L.Icon({
  iconUrl: startFlagIconUrl, 
  iconSize: [40, 40],        
  iconAnchor: [20, 40],      
  popupAnchor: [0, -40]
});

const endIcon = new L.Icon({
  iconUrl: endFlagIconUrl, 
  iconSize: [40, 40],        
  iconAnchor: [20, 40],      
  popupAnchor: [0, -40]
});

const startBSIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const endBSIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const transferIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// điều chỉnh trung tâm bản đồ
function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (map && center && center.length === 2) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

// click chọn vị trí 
// function LocationPicker({ onLocationSelect, selectionMode }) {
//   useMapEvents({
//     click(e) {
//       if (onLocationSelect && selectionMode) {
//         onLocationSelect(e.latlng, selectionMode);
//       }
//     },
//   });
//   return null;
// }

const SEGMENT_COLORS = ['#2196f3', '#e91e63', '#ff9800']; // Blue, Pink, Orange

const busStopIcon = new L.Icon({
  iconUrl: busStopMarkerUrl, 
  iconSize: [40, 40],        
  iconAnchor: [20, 40],     
  popupAnchor: [0, -40]
});

const MapView = ({ 
  selectedRouteId, 
  pathData, 
  // onLocationSelect, 
  // selectionMode, 
  startPoint, 
  endPoint 
}) => {
  const [busStops, setBusStops] = useState([]);
  const [routePolyline, setRoutePolyline] = useState([]);
  const [busPolyline, setBusPolyline] = useState([]);
  const [loadingStops, setLoadingStops] = useState(false);
  const [loadingNodes, setLoadingNodes] = useState(false);
  const [errorStops, setErrorStops] = useState(null);
  const [errorNodes, setErrorNodes] = useState(null);
  const [mapCenter, setMapCenter] = useState([21.0285, 105.8542]); 
  const [mapZoom, setMapZoom] = useState(13);
  const mapRef = useRef(null);
  const [buses, setBuses] = useState([]);

  useEffect(() => {
    const socket = socketService.connect();
    
    // vị trí xe buýt
    socketService.onBusLocation((busData) => {
      setBuses(prevBuses => {
        // Update bus position if it exists, or add new
        const existingBusIndex = prevBuses.findIndex(bus => bus.busId === busData.busId);
        if (existingBusIndex >= 0) {
          const updatedBuses = [...prevBuses];
          updatedBuses[existingBusIndex] = busData;
          return updatedBuses;
        } else {
          return [...prevBuses, busData];
        }
      });
    });
    
    return () => {
      socketService.offBusLocation();
      socketService.disconnect();
    };
  }, []);

  useEffect(() => {
    if (selectedRouteId) {
      socketService.trackBus(selectedRouteId);      
      setBuses([]);
    } else {
      socketService.stopTracking();
      
      // bỏ hiển thị tuyến 
      if (!pathData) {
        setBusStops([]);
        setRoutePolyline([]);
        setBuses([]);
      }
    }
  }, [selectedRouteId, pathData]);

  // Lấy bến trong tuyến
  useEffect(() => {
    if (selectedRouteId) {
      const fetchBusStops = async () => {
        try {
          setLoadingStops(true);
          const data = await routeAPI.getBusStopsInRoute(selectedRouteId);
          setBusStops(data);
          
          if (data && data.length > 0) {
            setMapCenter([parseFloat(data[0].latitude), parseFloat(data[0].longitude)]);
          }

          setErrorStops(null);
        } catch (err) {
          console.error('Error fetching bus stops:', err);
          setErrorStops('Không thể tải danh sách bến xe.');
        } finally {
          setLoadingStops(false);
        }
      };

      fetchBusStops();
    }
  }, [selectedRouteId]);

  // lấy điểm nút trong tuyến 
  useEffect(() => {
    if (selectedRouteId) {
      const fetchRouteNodes = async () => {
        try {
          setLoadingNodes(true);
          const data = await routeAPI.getRouteNodes(selectedRouteId);
          const sortedNodes = data.sort((a, b) => a.order_in_route - b.order_in_route); 
          
          if (sortedNodes.length > 0) {
            const points = sortedNodes.map(node => [parseFloat(node.latitude), parseFloat(node.longitude)]);
            setRoutePolyline(points);
            
            const midIndex = Math.floor(points.length / 2);
            if (points[midIndex]) {
              setMapCenter(points[midIndex]);
              setMapZoom(14);
            }
          }
          
          setErrorNodes(null);
        } catch (err) {
          console.error('Error fetching route nodes:', err);
          setErrorNodes('Không thể tải danh sách điểm nút.');
        } finally {
          setLoadingNodes(false);
        }
      };

      fetchRouteNodes();
    }
  }, [selectedRouteId]);

  // trả về đường tìm thấy
  useEffect(() => {
    if (pathData && pathData.routes) {
      const busSegments = [];
      pathData.routes.forEach((route) => {
        if (route.segments && Array.isArray(route.segments)) {
          route.segments.forEach(segment => {
            if (segment.nodes && segment.nodes.length > 0) {
              busSegments.push(
                segment.nodes.map(node => [
                  parseFloat(node.latitude),
                  parseFloat(node.longitude)
                ])
              );
            }
          });
        }
      });
      setBusPolyline(busSegments);
    } else {
      setBusPolyline([]);
    }
  }, [pathData]);

  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current.invalidateSize();
      }, 100);
    }
  }, []);

  return (
    <div className="map-container">
      {loadingStops && <div className="loading">Đang tải bến xe...</div>}
      {errorStops && <div className="error">{errorStops}</div>}
      {loadingNodes && <div className="loading">Đang tải lộ trình...</div>}
      {errorNodes && <div className="error">{errorNodes}</div>}

      <MapContainer 
        center={mapCenter} 
        zoom={mapZoom} 
        style={{ height: '100%', width: '100%' }}
        className="leaflet-container"
        whenCreated={(map) => { mapRef.current = map; }}
      >
        <MapUpdater center={mapCenter} zoom={mapZoom} />
        
        {/* <LocationPicker 
          onLocationSelect={onLocationSelect} 
          selectionMode={selectionMode} 
        /> */}
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Hiển thị marker vị trí bắt đầu (người dùng nhập) */}
        {startPoint && startPoint.lat && startPoint.lng && (
          <Marker 
            position={[parseFloat(startPoint.lat), parseFloat(startPoint.lng)]} 
            icon={startIcon}
          >
            <Popup>Vị trí bắt đầu</Popup>
          </Marker>
        )}
        
        {/* Hiển thị marker vị trí kết thúc (người dùng nhập) */}
        {endPoint && endPoint.lat && endPoint.lng && (
          <Marker 
            position={[parseFloat(endPoint.lat), parseFloat(endPoint.lng)]} 
            icon={endIcon}
          >
            <Popup>Vị trí kết thúc</Popup>
          </Marker>
        )}
        
        {/* Hiển thị các bến bắt đầu, kết thúc, chuyển tuyến khi tìm đường */}
        {pathData && pathData.routes && pathData.routes.map((route, idx) => (
          <React.Fragment key={idx}>
            {route.stops && route.stops[0] && (
              <Marker
                position={[
                  parseFloat(route.stops[0].latitude),
                  parseFloat(route.stops[0].longitude)
                ]}
                icon={startBSIcon}
              >
                <Popup>
                  <strong>Bến bắt đầu</strong><br />
                  {route.stops[0].address}
                </Popup>
              </Marker>
            )}
            {route.stops && route.stops.length > 1 && (
              <Marker
                position={[
                  parseFloat(route.stops[route.stops.length - 1].latitude),
                  parseFloat(route.stops[route.stops.length - 1].longitude)
                ]}
                icon={endBSIcon}
              >
                <Popup>
                  <strong>Bến kết thúc</strong><br />
                  {route.stops[route.stops.length - 1].address}
                </Popup>
              </Marker>
            )}
            {route.stops && route.stops.length > 2 && route.stops.slice(1, -1).map((stop, tIdx) => (
              <Marker
                key={`transfer-${idx}-${tIdx}`}
                position={[
                  parseFloat(stop.latitude),
                  parseFloat(stop.longitude)
                ]}
                icon={transferIcon}
              >
                <Popup>
                  <strong>Bến chuyển tuyến</strong><br />
                  {stop.address}
                </Popup>
              </Marker>
            ))}
          </React.Fragment>
        ))}
        
        {busStops.map(stop => (
          <Marker 
            key={stop.id} 
            position={[parseFloat(stop.latitude), parseFloat(stop.longitude)]}
            icon={busStopIcon} 
          >
            <Popup>
              <h3>{stop.address}</h3>
              <p>Bến xe</p>
            </Popup>
          </Marker>
        ))}

        {/* vẽ tuyến */}
        {routePolyline.length > 0 && (
          <Polyline 
            positions={routePolyline}
            color="blue"
            weight={5}
            opacity={0.8}
          />
        )}
        
        {/* vẽ các đoạn tuyến đường */}
        {busPolyline.map((polyline, index) => (
          <Polyline 
            key={`bus-${index}`}
            positions={polyline}
            color={SEGMENT_COLORS[index % SEGMENT_COLORS.length]}
            weight={5}
            opacity={0.8}
          />
        ))}
        
        {/* hiển thị xe buýt */}
        {buses.map((bus) => (
          <BusMarker 
            key={bus.busId} 
            position={[parseFloat(bus.latitude), parseFloat(bus.longitude)]} 
            bus={bus} 
          />
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;
