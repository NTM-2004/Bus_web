const { connectDB, sql } = require("../config/db");
const Route = require("../models/Route");
const RouteNode = require("../models/RouteNode");

const findNearestBusStops = async (lat, lng, limit = 1) => {
    const pool = await connectDB();
    // Sử dụng haversine để tính khoảng cách
    const result = await pool.request()
        .input('lat', sql.Float, lat)
        .input('lng', sql.Float, lng)
        .input('limit', sql.Int, limit)
        .query(`
            SELECT TOP (@limit) id, latitude, longitude, address,
                (6371 * ACOS(
                    COS(RADIANS(@lat)) *
                    COS(RADIANS(latitude)) *
                    COS(RADIANS(longitude) - RADIANS(@lng)) +
                    SIN(RADIANS(@lat)) *
                    SIN(RADIANS(latitude))
                )) AS distance
            FROM Node
            WHERE is_bus_stop = 1
            ORDER BY distance ASC
        `);
    return result.recordset;
};

// Lấy thông tin chi tiết 1 tuyến
const getRouteDetails = async (routeId) => {
    const pool = await connectDB();
    const route = await Route.findById(pool, routeId);
    if (!route) return null;
    return {
        id: route.id,
        number: route.number,
        name: route.name,
        direction: route.direction,
        distance: route.distance,
        ticket_price: route.ticket_price
    };
};

// Lấy điểm nút giữa 2 tuyến 
const getNodesBetweenStops = async (routeId, fromStopId, toStopId) => {
    const pool = await connectDB();
    const routeNodes = await RouteNode.findByRoute(pool, routeId);
    const fromNode = routeNodes.find(rn => rn.node_id === fromStopId);
    const toNode = routeNodes.find(rn => rn.node_id === toStopId);
    if (!fromNode || !toNode) return [];
    
    const fromOrder = fromNode.order_in_route;
    const toOrder = toNode.order_in_route;
    
    // Đảm bảo fromOrder < toOrder
    if (fromOrder > toOrder) {
        return [];
    }
    
    // Lọc các nút nằm giữa 2 bến và sắp xếp theo thứ tự tăng dần
    const filteredNodes = routeNodes
        .filter(rn => rn.order_in_route >= fromOrder && rn.order_in_route <= toOrder)
        .sort((a, b) => a.order_in_route - b.order_in_route);
    
    const nodeIds = filteredNodes.map(rn => rn.node_id);
    if (!nodeIds.length) return [];
    
    const result = await pool.request().query(
        `SELECT id as node_id, latitude, longitude, address FROM Node WHERE id IN ('${nodeIds.join("','")}')`
    );
    
    const nodeMap = {};
    result.recordset.forEach(n => { nodeMap[n.node_id] = n; });
    
    return filteredNodes.map(rn => ({
        node_id: rn.node_id,
        latitude: nodeMap[rn.node_id]?.latitude,
        longitude: nodeMap[rn.node_id]?.longitude,
        address: nodeMap[rn.node_id]?.address,
        order_in_route: rn.order_in_route
    }));
};

// Tìm tuyến có trung chuyển bằng Bus Routes BFS
const findRoutesWithBusRoutesBFS = async (startStops, endStops, maxRoutes = 10, maxTransfers = 2) => {
    const pool = await connectDB();
    
    try {
        // Lấy tất cả các tuyến xe đi qua các điểm bắt đầu
        const startRoutesResult = await pool.request().query(`
            SELECT DISTINCT rn.route_id, r.direction, rn.order_in_route
            FROM Route_node rn 
            JOIN Route r ON rn.route_id = r.id
            WHERE rn.node_id IN (${startStops.map(s => `'${s.id}'`).join(',')})
        `);
        
        // Lấy tất cả các tuyến xe đi qua các điểm kết thúc
        const endRoutesResult = await pool.request().query(`
            SELECT DISTINCT rn.route_id, r.direction, rn.order_in_route
            FROM Route_node rn 
            JOIN Route r ON rn.route_id = r.id
            WHERE rn.node_id IN (${endStops.map(s => `'${s.id}'`).join(',')})
        `);
        
        if (!startRoutesResult.recordset.length || !endRoutesResult.recordset.length) {
            return [];
        }
        
        const startRoutes = startRoutesResult.recordset.map(r => ({ 
            id: r.route_id, 
            direction: r.direction,
            order: r.order_in_route 
        }));
        const endRoutes = new Map(endRoutesResult.recordset.map(r => [r.route_id, { 
            direction: r.direction,
            order: r.order_in_route 
        }]));
    
        // Xây dựng đồ thị có hướng kết nối giữa các tuyến xe
        const routeConnectionsResult = await pool.request().query(`
            WITH RouteStops AS (
                SELECT 
                    rn.route_id,
                    rn.node_id,
                    rn.order_in_route,
                    r.direction
                FROM Route_node rn
                JOIN Route r ON rn.route_id = r.id
                
            )
            SELECT DISTINCT 
                rs1.route_id as route1,
                rs2.route_id as route2,
                rs1.direction as direction1,
                rs2.direction as direction2,
                rs1.order_in_route as order1,
                rs2.order_in_route as order2
            FROM RouteStops rs1
            JOIN RouteStops rs2 ON rs1.node_id = rs2.node_id
            WHERE rs1.route_id <> rs2.route_id
            AND rs1.node_id = rs2.node_id
        `);
    
        // Tạo đồ thị có hướng kết nối giữa các tuyến
        const routeGraph = {};
        routeConnectionsResult.recordset.forEach(conn => {
            if (!routeGraph[conn.route1]) routeGraph[conn.route1] = [];
            routeGraph[conn.route1].push({
                routeId: conn.route2,
                direction: conn.direction2,
                transferOrder: conn.order2
            });
        });
    
        // Lấy thông tin về các bến xe thuộc mỗi tuyến
        const routeStopsResult = await pool.request().query(`
            SELECT rn.route_id, rn.node_id, n.latitude, n.longitude, n.address, rn.order_in_route
            FROM Route_node rn
            JOIN Node n ON rn.node_id = n.id
            WHERE n.is_bus_stop = 1
            ORDER BY rn.route_id, rn.order_in_route
        `);
    
        // Tạo map từ tuyến đến các bến xe
        const routeToStops = {};
        routeStopsResult.recordset.forEach(rs => {
            if (!routeToStops[rs.route_id]) {
                routeToStops[rs.route_id] = [];
            }
            routeToStops[rs.route_id].push({
                id: rs.node_id,
                latitude: rs.latitude,
                longitude: rs.longitude,
                address: rs.address,
                order: rs.order_in_route
            });
        });
    
        // Tìm các điểm chuyển tuyến giữa hai tuyến
        const findTransferStops = (route1, route2) => {
            const stops1 = routeToStops[route1] || [];
            const stops2 = routeToStops[route2] || [];
            
            return stops1.filter(stop1 => 
                stops2.some(stop2 => stop2.id === stop1.id)
            ).sort((a, b) => a.order - b.order);
        };
    
        // Tính khoảng cách giữa hai điểm bằng công thức Haversine
        const calculateDistance = (lat1, lon1, lat2, lon2) => {
            const R = 6371; // Bán kính trái đất (km)
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = 
                Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c;
        };
    
        // Tính tổng khoảng cách của một tuyến
        const calculateRouteDistance = (route) => {
            const stops = routeToStops[route] || [];
            let distance = 0;
            
            for (let i = 1; i < stops.length; i++) {
                distance += calculateDistance(
                    stops[i-1].latitude, stops[i-1].longitude,
                    stops[i].latitude, stops[i].longitude
                );
            }
            
            return distance;
        };
    
        // Tìm bến xe gần nhất trong một tuyến với một điểm
        const findNearestStopInRoute = (route, point) => {
            const stops = routeToStops[route] || [];
            let nearestStop = null;
            let minDistance = Infinity;
            
            stops.forEach(stop => {
                const distance = calculateDistance(
                    point.latitude, point.longitude,
                    stop.latitude, stop.longitude
                );
                
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestStop = stop;
                }
            });
            
            return { stop: nearestStop, distance: minDistance };
        };
    
        // BFS để tìm đường đi với đồ thị có hướng
        const allPaths = [];
        const queue = [];
        const visited = new Set();
    
        const startStopIds = startStops.map(s => s.id);
        const endStopIds = endStops.map(s => s.id);
    
        // Khởi tạo với các tuyến đi qua điểm bắt đầu
        startRoutes.forEach(route => {
            const nearestStartStop = findNearestStopInRoute(route.id, startStops[0]);
    
            if (nearestStartStop.stop) {
                queue.push({
                    routes: [route],
                    stops: [nearestStartStop.stop],
                    transferStops: [],
                    totalDistance: nearestStartStop.distance,
                    currentDirection: route.direction,
                    isForward: true
                });
                visited.add(`${route.id}-${route.direction}`);
            }
        });
    
        while (queue.length > 0 && allPaths.length < maxRoutes) {
            const current = queue.shift();
            const currentRoute = current.routes[current.routes.length - 1];
    
            // Nếu tuyến hiện tại đi qua điểm kết thúc
            if (endRoutes.has(currentRoute.id)) {
                const nearestEndStop = findNearestStopInRoute(currentRoute.id, endStops[0]);
    
                if (nearestEndStop.stop) {
                    // Kiểm tra thứ tự bến kết thúc phải lớn hơn bến bắt đầu
                    const startStop = current.stops[0];
                    if (nearestEndStop.stop.order > startStop.order) {
                        const totalDistance = current.totalDistance + nearestEndStop.distance;
    
                        allPaths.push({
                            routes: current.routes,
                            stops: [...current.stops, ...current.transferStops, nearestEndStop.stop],
                            totalDistance,
                            transfers: current.routes.length - 1,
                            isForward: current.isForward
                        });
                    }
                    continue;
                }
            }
    
            // Kiểm tra số lần chuyển tuyến
            if (current.routes.length - 1 >= maxTransfers) continue;
    
            // Thêm các tuyến kề vào hàng đợi (chỉ theo hướng di chuyển)
            (routeGraph[currentRoute.id] || []).forEach(nextRoute => {
                const visitedKey = `${nextRoute.routeId}-${nextRoute.direction}`;
                if (!visited.has(visitedKey) || current.routes.length <= 1) {
                    let transferStops = findTransferStops(currentRoute.id, nextRoute.routeId);
    
                    transferStops = transferStops.filter(stop => {
                        const stopOrder = routeToStops[currentRoute.id]?.find(s => s.id === stop.id)?.order;
                        const nextStopOrder = routeToStops[nextRoute.routeId]?.find(s => s.id === stop.id)?.order;
                        
                        if (!stopOrder || !nextStopOrder) return false;
                        
                        // Kiểm tra thứ tự bến phù hợp với hướng di chuyển
                        const lastStop = current.stops[current.stops.length - 1];
                        return stopOrder > lastStop.order;
                    });
    
                    if (transferStops.length > 0) {
                        const transferStop = transferStops[0];
    
                        const lastStop = current.stops[current.stops.length - 1];
                        const distanceToTransfer = calculateDistance(
                            lastStop.latitude, lastStop.longitude,
                            transferStop.latitude, transferStop.longitude
                        );
    
                        const nextRouteDistance = calculateRouteDistance(nextRoute.routeId);
    
                        queue.push({
                            routes: [...current.routes, { id: nextRoute.routeId, direction: nextRoute.direction }],
                            stops: [...current.stops],
                            transferStops: [...current.transferStops, transferStop],
                            totalDistance: current.totalDistance + distanceToTransfer + nextRouteDistance,
                            currentDirection: nextRoute.direction,
                            isForward: current.isForward
                        });
    
                        visited.add(visitedKey);
                    }
                }
            });
        }
    
        return allPaths.sort((a, b) => {
            if (a.transfers !== b.transfers) {
                return a.transfers - b.transfers;
            }
            return a.totalDistance - b.totalDistance;
        });
    } catch (error) {
        console.error('Error in findRoutesWithBusRoutesBFS:', error);
        throw new Error('Failed to find routes: ' + error.message);
    }
};

exports.findRoute = async (req, res) => {
    const { startPoint, endPoint } = req.body;
    
    try {
        if (!startPoint || !endPoint || !startPoint.lat || !startPoint.lng || !endPoint.lat || !endPoint.lng) {
            return res.status(400).json({ 
                message: 'Invalid start or end point coordinates' 
            });
        }

        // Tìm 3 bến gần nhất cho cả điểm bắt đầu và điểm kết thúc
        const nearestStartStops = await findNearestBusStops(startPoint.lat, startPoint.lng, 3);
        const nearestEndStops = await findNearestBusStops(endPoint.lat, endPoint.lng, 3);

        if (nearestStartStops.length === 0 || nearestEndStops.length === 0) {
            return res.status(404).json({ 
                message: 'Không tìm thấy bến xe buýt gần điểm xuất phát hoặc điểm đến' 
            });
        }

        // Truyền cả 3 bến vào thuật toán tìm đường
        let routes = await findRoutesWithBusRoutesBFS(nearestStartStops, nearestEndStops, 10, 2);

        if (!routes || routes.length === 0) {
            return res.status(404).json({
                message: 'Không tìm thấy đường đi phù hợp'
            });
        }

        const seen = new Set();
        routes = routes.filter(route => {
            const stopSeq = route.stops.map(stop => stop.id).join('-');
            if (seen.has(stopSeq)) return false;
            seen.add(stopSeq);
            return true;
        });

        // Lấy thông tin chi tiết về các tuyến và các node theo từng đoạn
        for (const route of routes) {
            const details = [];
            for (const routeId of route.routes) {
                details.push(await getRouteDetails(routeId.id));
            }
            route.routeDetails = details;

            route.segments = [];
            for (let i = 0; i < route.stops.length - 1; i++) {
                const fromStop = route.stops[i];
                const toStop = route.stops[i + 1];
                const routeId = route.routes[Math.min(i, route.routes.length - 1)].id;
                const nodes = await getNodesBetweenStops(routeId, fromStop.id, toStop.id);
                
                // Lọc bỏ các bến chuyển tuyến khỏi danh sách nodes
                const filteredNodes = nodes.filter(node => {
                    // Giữ lại bến bắt đầu và kết thúc của segment
                    if (node.node_id === fromStop.id || node.node_id === toStop.id) {
                        return true;
                    }
                    // Giữ lại các node không phải là bến xe buýt
                    return !node.is_bus_stop;
                });

                route.segments.push({
                    routeId,
                    from: fromStop.id,
                    to: toStop.id,
                    nodes: filteredNodes
                });
            }
        }

        // Lọc các đường đi có thứ tự điểm nút đúng
        routes = routes.filter(route => {
            // Kiểm tra từng segment
            for (let i = 0; i < route.segments.length; i++) {
                const segment = route.segments[i];
                const nodes = segment.nodes;
                
                // Nếu mảng nodes rỗng, loại bỏ route này
                if (!nodes || nodes.length === 0) {
                    return false;
                }
                
                // Kiểm tra thứ tự tăng dần của các node trong segment
                for (let j = 1; j < nodes.length; j++) {
                    if (nodes[j].order_in_route < nodes[j-1].order_in_route) {
                        return false;
                    }
                }
            }
            return true;
        });

        res.json({
            routes: routes.map(route => ({
                ...route,
                totalDistance: route.totalDistance
            })),
            startStops: nearestStartStops,
            endStops: nearestEndStops
        });
    } catch (err) {
        console.error('Lỗi tìm đường:', err);
        res.status(500).json({ 
            message: 'Lỗi khi tìm đường đi',
            error: err.message 
        });
    }
};
