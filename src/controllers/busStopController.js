const { connectDB } = require("../config/db");
const Node = require("../models/Node");
const RouteNode = require("../models/RouteNode");

// Lấy tất cả bến 
exports.getAllBusStops = async (req, res) => {
    try {
        const pool = await connectDB();
        const busStops = await Node.findBusStops(pool);
        res.json(busStops);
    } catch (err) {
        console.error('Error fetching bus stops:', err);
        res.status(500).json({ error: err.message });
    }
};

// Lấy bến theo id nút
exports.getBusStopById = async (req, res) => {
    try {
        const pool = await connectDB();
        const node = await Node.findById(pool, req.params.id);
        if (!node || node.is_bus_stop !== 1) {
            return res.status(404).json({ message: 'Bus stop not found' });
        }
        res.json(node);
    } catch (err) {
        console.error('Error fetching bus stop by ID:', err);
        res.status(500).json({ error: err.message });
    }
};

// Lấy tuyến chứa bến
exports.getRoutesByBusStop = async (req, res) => {
    try {
        const pool = await connectDB();
        const routeNodes = await RouteNode.findByNode(pool, req.params.id);
        // Lấy danh sách route_id từ các RouteNode
        const routeIds = routeNodes.map(rn => rn.route_id);
        if (routeIds.length === 0) {
            return res.json([]);
        }
        // Lấy thông tin các tuyến từ bảng Route
        const result = await pool.request()
            .query(`SELECT id, number, name, direction, start_point, end_point FROM Route WHERE id IN ('${routeIds.join("','")}')`);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching routes by bus stop:', err);
        res.status(500).json({ error: err.message });
    }
};
