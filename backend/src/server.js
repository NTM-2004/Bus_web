const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');
const { connectDB } = require('./config/db');
require('dotenv').config();

const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { logging } = require('./middleware/loggingMiddleware');

// nhập các định tuyến
const routeRoutes = require('./routes/routeRoutes');
const busStopRoutes = require('./routes/busStopRoutes');
const routeFinderRoutes = require('./routes/routeFinderRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const logDirectory = path.join(__dirname, 'logs');
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(logging);

// Kết nối db
connectDB().catch(err => {
  console.error('Failed to connect to database', err);
  process.exit(1);
});

// Routes
app.use('/api', routeRoutes);
app.use('/api', busStopRoutes);
app.use('/api', routeFinderRoutes);
app.use('/api', userRoutes);

app.use(notFound);
app.use(errorHandler);

// WebSocket
io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Lưu trữ các xe buýt đang được mô phỏng
  const simulatedBuses = {};
  
  // Hàm lấy dữ liệu tuyến xe buýt từ cơ sở dữ liệu
  const getBusRouteData = async (routeId) => {
    try {
      const pool = await connectDB();
      // Lấy tất cả các điểm nút của tuyến theo thứ tự
      const result = await pool.request()
        .input('routeId', routeId)
        .query(`
          SELECT n.id, n.latitude, n.longitude, rn.order_in_route
          FROM Node n
          JOIN Route_node rn ON n.id = rn.node_id
          WHERE rn.route_id = @routeId
          ORDER BY rn.order_in_route
        `);
      
      return result.recordset;
    } catch (error) {
      console.error('Error fetching route data:', error);
      return [];
    }
  };
  
  // Hàm mô phỏng xe buýt di chuyển
  const simulateBusMovement = async (routeId, busId) => {
    // Nếu chưa có dữ liệu tuyến, lấy từ cơ sở dữ liệu
    if (!simulatedBuses[busId]) {
      const routeData = await getBusRouteData(routeId);
      if (routeData.length === 0) return;
      
      simulatedBuses[busId] = {
        routeData,
        currentIndex: 0,
        progress: 0, 
        routeId
      };
    }
    
    const bus = simulatedBuses[busId];
    const currentPoint = bus.routeData[bus.currentIndex];
    const nextIndex = (bus.currentIndex + 1) % bus.routeData.length;
    const nextPoint = bus.routeData[nextIndex];
    
    // Tính toán vị trí hiện tại dựa trên progress
    const currentLat = currentPoint.latitude + (nextPoint.latitude - currentPoint.latitude) * bus.progress;
    const currentLng = currentPoint.longitude + (nextPoint.longitude - currentPoint.longitude) * bus.progress;
    
    // Tính toán hướng di chuyển
    const direction = Math.atan2(
      nextPoint.longitude - currentPoint.longitude,
      nextPoint.latitude - currentPoint.latitude
    ) * 180 / Math.PI;
    
    // Gửi dữ liệu vị trí xe buýt đến client
    io.emit('busLocation', {
      busId,
      routeId: bus.routeId,
      latitude: currentLat,
      longitude: currentLng,
      direction,
      speed: 30 // Giả định tốc độ 30km/h
    });
    
    // Cập nhật progress
    bus.progress += 0.05; // Mỗi lần tăng 5%
    
    // Nếu đã đến điểm tiếp theo
    if (bus.progress >= 1) {
      bus.currentIndex = nextIndex;
      bus.progress = 0;
    }
  };
  
  // Xử lý yêu cầu theo dõi xe buýt từ client
  socket.on('trackBus', async ({ routeId }) => {
    try {
      const pool = await connectDB();
      // Lấy danh sách xe buýt trên tuyến
      const result = await pool.request()
        .input('routeId', routeId)
        .query(`
          SELECT license_plate 
          FROM Bus 
          WHERE route_id_forward = @routeId OR route_id_backward = @routeId
        `);
      
      const buses = result.recordset;
      
      // Nếu không có xe, tạo một xe ảo
      if (buses.length === 0) {
        const virtualBusId = `virtual_${routeId}`;
        // Bắt đầu mô phỏng
        const simulationInterval = setInterval(() => {
          simulateBusMovement(routeId, virtualBusId);
        }, 3000);
        
        // Lưu interval để có thể clear khi disconnect
        socket.simulationIntervals = socket.simulationIntervals || [];
        socket.simulationIntervals.push(simulationInterval);
      } else {
        // Mô phỏng cho mỗi xe thực
        buses.forEach(bus => {
          const simulationInterval = setInterval(() => {
            simulateBusMovement(routeId, bus.license_plate);
          }, 3000);
          
          socket.simulationIntervals = socket.simulationIntervals || [];
          socket.simulationIntervals.push(simulationInterval);
        });
      }
    } catch (error) {
      console.error('Error tracking buses:', error);
    }
  });
  
  // Dừng theo dõi xe buýt
  socket.on('stopTracking', () => {
    if (socket.simulationIntervals) {
      socket.simulationIntervals.forEach(interval => clearInterval(interval));
      socket.simulationIntervals = [];
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
    // Dừng tất cả các mô phỏng khi client ngắt kết nối
    if (socket.simulationIntervals) {
      socket.simulationIntervals.forEach(interval => clearInterval(interval));
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
