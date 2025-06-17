import React, { useState, useEffect } from 'react';
import { routeAPI, routeFinderAPI } from '../services/api'; 
import '../styles/Sidebar.css';
import axios from 'axios';

const Sidebar = ({ 
  onRouteSelect, 
  onPathDataChange, 
  startPoint: externalStartPoint, 
  endPoint: externalEndPoint,
  onModeChange,
  onStartPointChange,   
  onEndPointChange      
}) => {
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [loadingStops, setLoadingStops] = useState(false);
  const [errorRoutes, setErrorRoutes] = useState(null);
  const [errorStops, setErrorStops] = useState(null);
  const [busStops, setBusStops] = useState([]);

  const [showPathFinder, setShowPathFinder] = useState(false);
  const [localStartPoint, setLocalStartPoint] = useState({ lat: '', lng: '' });
  const [localEndPoint, setLocalEndPoint] = useState({ lat: '', lng: '' });
  const [loadingPath, setLoadingPath] = useState(false);
  const [errorPath, setErrorPath] = useState(null);
  const [pathData, setPathData] = useState(null);
  const [expandedSegments, setExpandedSegments] = useState({});

  const [startSearch, setStartSearch] = useState('');
  const [endSearch, setEndSearch] = useState('');
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [endSuggestions, setEndSuggestions] = useState([]);

  // Api tìm điểm bắt đầu
  useEffect(() => {
    if (startSearch.length > 2) {
      const fetch = setTimeout(async () => {
        const res = await axios.get('https://nominatim.openstreetmap.org/search', {
          params: {
            q: startSearch,
            format: 'json',
            addressdetails: 1,
            limit: 5,
            viewbox: '105.5,21.5,106.5,20.5', // Giới hạn khu vực tìm kiếm Hà Nội
            bounded: 1
          }
        });
        setStartSuggestions(res.data);
      }, 400);
      return () => clearTimeout(fetch);
    } else {
      setStartSuggestions([]);
    }
  }, [startSearch]);

  // api tìm điểm kết thúc
  useEffect(() => {
    if (endSearch.length > 2) {
      const fetch = setTimeout(async () => {
        const res = await axios.get('https://nominatim.openstreetmap.org/search', {
          params: {
            q: endSearch,
            format: 'json',
            addressdetails: 1,
            limit: 5,
            viewbox: '105.5,21.5,106.5,20.5', // Giới hạn khu vực tìm kiếm Hà Nội
            bounded: 1
          }
        });
        setEndSuggestions(res.data);
      }, 400);
      return () => clearTimeout(fetch);
    } else {
      setEndSuggestions([]);
    }
  }, [endSearch]);

  useEffect(() => {
    if (externalStartPoint && externalStartPoint.lat && externalStartPoint.lng) {
      setLocalStartPoint(externalStartPoint);
    }
  }, [externalStartPoint]);
  
  useEffect(() => {
    if (externalEndPoint && externalEndPoint.lat && externalEndPoint.lng) {
      setLocalEndPoint(externalEndPoint);
    }
  }, [externalEndPoint]);

  // lấy tuyến 
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        setLoadingRoutes(true);
        const data = await routeAPI.getAllRoutes(); 
        setRoutes(data);
        setErrorRoutes(null);
      } catch (err) {
        console.error('Error fetching routes:', err);
        setErrorRoutes('Không thể tải danh sách tuyến xe buýt');
      } finally {
        setLoadingRoutes(false);
      }
    };

    fetchRoutes();
  }, []);

  // chọn tuyến
  const handleRouteSelect = async (route) => {
    try {
      setSelectedRoute(route);
      onRouteSelect(route.id);
      
      setPathData(null);
      if (onPathDataChange) {
        onPathDataChange(null);
      }
      
      // lấy bến trong tuyến
      setLoadingStops(true);
      const stopsData = await routeAPI.getBusStopsInRoute(route.id);
      setBusStops(stopsData);
      setErrorStops(null);
    } catch (err) {
      console.error('Error fetching bus stops:', err);
      setErrorStops('Không thể tải danh sách bến xe trên tuyến');
    } finally {
      setLoadingStops(false);
    }
  };

  // chạy tìm đường
  const handleFindPath = async (e) => {
    e.preventDefault();
    
    const startCoord = externalStartPoint && externalStartPoint.lat && externalStartPoint.lng ? 
      externalStartPoint : localStartPoint;
    const endCoord = externalEndPoint && externalEndPoint.lat && externalEndPoint.lng ? 
      externalEndPoint : localEndPoint;
    
    if (!startCoord.lat || !startCoord.lng || !endCoord.lat || !endCoord.lng) {
      setErrorPath('Vui lòng chọn điểm bắt đầu và điểm kết thúc');
      return;
    }
    
    try {
      setLoadingPath(true);
      setErrorPath(null);
      
      const data = await routeFinderAPI.findRoute(startCoord, endCoord);
      
      setPathData(data);
      if (onPathDataChange) {
        onPathDataChange(data);
      }
      
      setSelectedRoute(null);
      onRouteSelect(null);
    } catch (err) {
      console.error('Error finding path:', err);
      setErrorPath('Không thể tìm đường đi.');
    } finally {
      setLoadingPath(false);
    }
  };

  // danh sách đường chi tiết
  const toggleSegmentDetails = (index) => {
    setExpandedSegments(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // sắp xếp
  const filteredRoutes = routes.filter(route => 
    route.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // hàm chuyển chức năng
  const handleSwitchMode = (showPath) => {
    setShowPathFinder(showPath);
    if (onModeChange) {
      onModeChange(); 
    }
    setLocalStartPoint({ lat: '', lng: '' });
    setLocalEndPoint({ lat: '', lng: '' });
    setStartSearch('');
    setEndSearch('');
    setStartSuggestions([]);
    setEndSuggestions([]);
    setPathData(null);
    setSelectedRoute(null);
    setBusStops([]);
  };

  return (
    <div className="sidebar">
      {/* Nút chuyển giữa tìm tuyến và tìm đường */}
      <div className="toggle-container">
        <button 
          className={`toggle-btn ${!showPathFinder ? 'active' : ''}`} 
          onClick={() => handleSwitchMode(false)}
        >
          Tìm tuyến
        </button>
        <button 
          className={`toggle-btn ${showPathFinder ? 'active' : ''}`} 
          onClick={() => handleSwitchMode(true)}
        >
          Tìm đường
        </button>
      </div>

      {/* phần tìm tuyến */}
      {!showPathFinder && (
        <>
          {!selectedRoute ? (
            <>
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Tìm kiếm tuyến"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="route-search-input"
                />
              </div>

              <div className="routes-list">
                {loadingRoutes && <div className="loading">Đang tải...</div>}
                {errorRoutes && <div className="error">{errorRoutes}</div>}

                {filteredRoutes.map(route => (
                  <div 
                    key={route.id} 
                    className={`route-item ${selectedRoute?.id === route.id ? 'selected' : ''}`}
                    onClick={() => handleRouteSelect(route)}
                  >
                    <div className="route-number">Tuyến {route.number}</div>
                    <div className="route-name">{route.name}</div>
                    {/* Hiển thị chiều đi/chiều về */}
                    <div className="route-direction" style={{ fontSize: '13px', color: '#337ab7' }}>
                      {route.direction === 'forward'
                        ? 'Chiều đi'
                        : route.direction === 'backward'
                        ? 'Chiều về'
                        : route.direction || 'Không rõ chiều'}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="route-details-container">
              <button 
                className="back-button" 
                onClick={() => {
                  setSelectedRoute(null);
                  onRouteSelect(null); 
                }}
              >
                Quay lại
              </button>
              <h3>Thông tin chi tiết</h3>
              <p><strong>Số tuyến:</strong> {selectedRoute.number}</p>
              <p><strong>Tên tuyến:</strong> {selectedRoute.name}</p>
              <p><strong>Thời gian hoạt động:</strong> {selectedRoute.operation_time || '05:00 - 23:00'}</p>
              <p><strong>Giá vé:</strong> {selectedRoute.ticket_price || '10000 VND'}</p>
              
              <button 
                className="track-bus-btn"
                onClick={() => onRouteSelect(selectedRoute.id)}
              >
                Theo dõi xe buýt trên tuyến
              </button>
              
              <h4>Bến xe trên tuyến:</h4>
              {loadingStops && <div className="loading">Đang tải...</div>}
              {errorStops && <div className="error">{errorStops}</div>}
              
              {busStops.length > 0 ? (
                <ul className="bus-stops-list">
                  {busStops.map((stop) => (
                    <li key={stop.id} className="bus-stop-item">
                      <span className="stop-order">{stop.order_in_route}.</span> {stop.address}
                    </li>
                  ))}
                </ul>
              ) : (
                !loadingStops && <p>Không có bến xe nào trên tuyến này.</p>
              )}
            </div>
          )}
        </>
      )}

      {/* Tìm đường */}
      {showPathFinder && (
        <div className="find-path-container">
          <h3>Tìm đường</h3>
          <form onSubmit={handleFindPath}>
            <div className="input-group">
              <label>Điểm đi:</label>
              <div className="location-input" style={{ flexDirection: 'column', gap: 0, position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Nhập địa chỉ hoặc tên địa điểm"
                  value={startSearch}
                  onChange={e => setStartSearch(e.target.value)}
                  className="route-search-input"
                  autoComplete="off"
                />
                {startSuggestions.length > 0 && (
                  <ul className="suggestions-list">
                    {startSuggestions.map((item, idx) => (
                      <li
                        key={item.place_id}
                        onClick={() => {
                          setLocalStartPoint({ lat: item.lat, lng: item.lon });
                          setStartSearch(item.display_name);
                          setStartSuggestions([]);
                          if (onStartPointChange) {
                            onStartPointChange({ lat: item.lat, lng: item.lon });
                          }
                        }}
                      >
                        {item.display_name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="input-group">
              <label>Điểm đến:</label>
              <div className="location-input" style={{ flexDirection: 'column', gap: 0, position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Nhập địa chỉ hoặc tên địa điểm"
                  value={endSearch}
                  onChange={e => setEndSearch(e.target.value)}
                  className="route-search-input"
                  autoComplete="off"
                />
                {endSuggestions.length > 0 && (
                  <ul className="suggestions-list">
                    {endSuggestions.map((item, idx) => (
                      <li
                        key={item.place_id}
                        onClick={() => {
                          setLocalEndPoint({ lat: item.lat, lng: item.lon });
                          setEndSearch(item.display_name);
                          setEndSuggestions([]);
                          if (onEndPointChange) {
                            onEndPointChange({ lat: item.lat, lng: item.lon });
                          }
                        }}
                      >
                        {item.display_name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <button 
              type="submit" 
              className="find-path-btn"
              disabled={loadingPath || !localStartPoint.lat || !localStartPoint.lng || !localEndPoint.lat || !localEndPoint.lng}
            >
              {loadingPath ? 'Đang tìm...' : 'Tìm đường'}
            </button>
          </form>
          
          {errorPath && <div className="error">{errorPath}</div>}
          
          {/* hiển thị kết quả */}
          {pathData && (
            <div className="path-details">
              <h3>Kết quả tìm đường</h3>
              {/* hiển thị bến bắt đầu, kết thúc */}
              {/*pathData.routes && pathData.routes[0] && (
                <div className="bus-stop-summary">
                  <p>
                    <strong>Bến bắt đầu:</strong>{" "}
                    {pathData.routes[0].stops && pathData.routes[0].stops[0]
                      ? pathData.routes[0].stops[0].address
                      : "Không xác định"}
                  </p>
                  <p>
                    <strong>Bến kết thúc:</strong>{" "}
                    {pathData.routes[0].stops && pathData.routes[0].stops.length > 0
                      ? pathData.routes[0].stops[pathData.routes[0].stops.length - 1].address
                      : "Không xác định"}
                  </p>
                </div>
              )*/}

              {pathData.routes && pathData.routes.map((route, index) => (
                <div key={index} className="route-info">
                  {/* Show route sequence and transfers */}
                  <div className="route-sequence">
                    <strong>Hành trình:</strong>
                    <ul>
                      {route.routes && route.routes.length > 0 && route.routeDetails && route.routeDetails.length > 0 && (
                        route.routes.map((routeId, idx) => (
                          <li key={routeId}>
                            Tuyến {route.routeDetails[idx]?.number || routeId}
                            <span style={{ color: '#337ab7', marginLeft: '5px' }}>
                              ({route.routeDetails[idx]?.direction === 'forward' ? 'Chiều đi' : 'Chiều về'})
                            </span>
                            <div style={{ marginLeft: '20px', fontSize: '0.9em' }}>
                              Bắt đầu tại: {route.stops[idx]?.address || 'Không xác định'}
                              <br />
                              Kết thúc tại: {route.stops[idx + 1]?.address || 'Không xác định'}
                            </div>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                  <button
                    className="show-on-map-btn"
                    style={{ marginBottom: 8 }}
                    onClick={() => {
                      if (onPathDataChange) {
                        onPathDataChange({
                          ...pathData,
                          routes: [route]
                        });
                      }
                    }}
                  >
                    Hiển thị trên bản đồ
                  </button>
                  {/* Thêm hiển thị tổng quãng đường */}
                  <div style={{ marginBottom: 8 }}>
                    <strong>Tổng quãng đường:</strong> {route.totalDistance ? route.totalDistance.toFixed(2) : '0.00'} km
                  </div>
                  {/* <div 
                    className="segment-header" 
                    onClick={() => toggleSegmentDetails(index)}
                  >
                    <span className={`segment-type ${route.type === 'walking' ? 'walking' : 'bus'}`}>
                      {route.type === 'walking' ? 'Đi bộ' : `Xe buýt ${route.routeDetails?.[0]?.number || ''}`}
                    </span>
                    <span className={`expand-icon ${expandedSegments[index] ? 'expanded' : ''}`}>▼</span>
                  </div> */}
                  {/* {expandedSegments[index] && (
                    <div className="segment-details">
                      <p><strong>Từ:</strong> {route.stops[0]?.address || 'Điểm không xác định'}</p>
                      <p><strong>Đến:</strong> {route.stops[route.stops.length - 1]?.address || 'Điểm không xác định'}</p>
                      {route.type === 'bus' && (
                        <div className="bus-stops">
                          <p><strong>Các bến trung gian:</strong></p>
                          <ul>
                            {route.stops.slice(1, -1).map((stop, stopIndex) => (
                              <li key={stopIndex}>{stop.address || 'Điểm không xác định'}</li>
                            ))}
                          </ul>
                          {route.segments && route.segments.map((segment, segIdx) => (
                            <div key={segIdx}>
                              <p>Đoạn {segIdx + 1} ({segment.from} → {segment.to}):</p>
                              <ul>
                                {segment.nodes && segment.nodes.map((node, nodeIdx) => (
                                  <li key={nodeIdx}>
                                    {node.address} ({node.latitude}, {node.longitude})
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )} */}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Sidebar;