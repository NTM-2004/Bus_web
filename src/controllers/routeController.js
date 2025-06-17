const { connectDB } = require("../config/db");
const Route = require("../models/Route");
const RouteNode = require("../models/RouteNode");

// Lấy toàn bộ tuyến 
exports.getAllRoutes = async (req, res) => {
    try {
        const pool = await connectDB();
        const routes = await Route.findAll(pool);
        res.json(routes);
    } catch (err) {
        console.error('Error fetching all routes:', err);
        res.status(500).json({ error: err.message });
    }
};

// Lấy tuyến theo id 
exports.getRouteById = async (req, res) => {
    try {
        const pool = await connectDB();
        const route = await Route.findById(pool, req.params.id);
        if (!route) {
            return res.status(404).json({ message: 'Route not found' });
        }
        res.json(route);
    } catch (err) {
        console.error('Error fetching route by ID:', err);
        res.status(500).json({ error: err.message });
    }
};

// lấy các bến trong tuyến 
exports.getBusStopsInRoute = async (req, res) => {
    try {
        const pool = await connectDB();
        const routeNodes = await RouteNode.findByRoute(pool, req.params.id);
        if (!routeNodes.length) return res.json([]);
        
        const nodeIds = routeNodes.map(rn => rn.node_id);
        if (!nodeIds.length) return res.json([]);
        
        const result = await pool.request().query(
            `SELECT id, latitude, longitude, address, is_bus_stop FROM Node WHERE id IN ('${nodeIds.join("','")}') AND is_bus_stop = 1`
        );
        
        const orderMap = {};
        routeNodes.forEach(rn => { orderMap[rn.node_id] = rn.order_in_route; });
        const busStops = result.recordset.map(n => ({
            ...n,
            order_in_route: orderMap[n.id]
        })).sort((a, b) => a.order_in_route - b.order_in_route);
        res.json(busStops);
    } catch (err) {
        console.error('Error fetching bus stops in route:', err);
        res.status(500).json({ error: err.message });
    }
};

// lấy tất cả điểm nút
exports.getRouteNodes = async (req, res) => {
    try {
        const pool = await connectDB();
        const routeNodes = await RouteNode.findByRoute(pool, req.params.id);
        if (!routeNodes.length) return res.json([]);
        const nodeIds = routeNodes.map(rn => rn.node_id);
        if (!nodeIds.length) return res.json([]);

        const result = await pool.request().query(
            `SELECT id, latitude, longitude, address, is_bus_stop FROM Node WHERE id IN ('${nodeIds.join("','")}')`
        );
       
        const orderMap = {};
        routeNodes.forEach(rn => { orderMap[rn.node_id] = rn.order_in_route; });
        const nodes = result.recordset.map(n => ({
            ...n,
            order_in_route: orderMap[n.id]
        })).sort((a, b) => a.order_in_route - b.order_in_route);
        res.json(nodes);
    } catch (err) {
        console.error('Error fetching route nodes:', err);
        res.status(500).json({ error: err.message });
    }
};

// lấy tuyến theo số 
exports.getRoutesByNumber = async (req, res) => {
    try {
        const pool = await connectDB();
        const allRoutes = await Route.findAll(pool);
        const filtered = allRoutes.filter(r => r.number === req.params.number);
        
        const result = filtered.map(r => ({
            id: r.id,
            number: r.number,
            name: r.name,
            direction: r.direction,
            start_point: r.start_point,
            end_point: r.end_point
        }));
        res.json(result);
    } catch (err) {
        console.error('Error fetching routes by number:', err);
        res.status(500).json({ error: err.message });
    }
};
