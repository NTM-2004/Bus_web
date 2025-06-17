import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3000';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL);
      
      this.socket.on('connect', () => {
        console.log('Connected to WebSocket server');
        this.connected = true;
      });
      
      this.socket.on('disconnect', () => {
        console.log('Disconnected from WebSocket server');
        this.connected = false;
      });
      
      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        this.connected = false;
      });
    }
    
    return this.socket;
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }
  
  trackBus(routeId) {
    if (this.socket) {
      this.socket.emit('trackBus', { routeId });
    }
  }
  
  stopTracking() {
    if (this.socket) {
      this.socket.emit('stopTracking');
    }
  }
  
  onBusLocation(callback) {
    if (this.socket) {
      this.socket.on('busLocation', callback);
    }
  }
  
  offBusLocation() {
    if (this.socket) {
      this.socket.off('busLocation');
    }
  }
}

export default new SocketService();