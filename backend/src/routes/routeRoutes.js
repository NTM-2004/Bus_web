const express = require('express');
const router = express.Router();
const {
    getAllRoutes,
    getRouteById,
    getBusStopsInRoute,
    getRouteNodes,
    // getRoutesByNumber
} = require('../controllers/routeController');

// Lấy tất cả tuyến xe buýt
router.get('/routes', getAllRoutes);

// Lấy tuyến theo số tuyến
//router.get('/routes/by-number/:number', getRoutesByNumber);

// Lấy tuyến xe buýt theo ID
router.get('/routes/:id', getRouteById);

// Lấy bến xe buýt trong tuyến
router.get('/routes/:id/bus-stops', getBusStopsInRoute);

// Lấy tất cả các điểm nút trong tuyến
router.get('/routes/:id/nodes', getRouteNodes);

module.exports = router;
