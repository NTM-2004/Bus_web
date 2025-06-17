const express = require('express');
const router = express.Router();
const { findRoute } = require('../controllers/routeFinderController');

// Tìm đường đi giữa hai điểm
router.post('/find-route', findRoute);

module.exports = router;
