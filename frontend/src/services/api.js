import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor để thêm token vào header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// API calls cho tuyến xe buýt
export const routeAPI = {
  getAllRoutes: async () => {
    const response = await api.get('/routes');
    return response.data;
  },
  getRouteById: async (id) => {
    const response = await api.get(`/routes/${id}`);
    return response.data;
  },
  // getRoutesByNumber: async (number) => {
  //   const response = await api.get(`/routes/by-number/${number}`);
  //   return response.data;
  // },
  getBusStopsInRoute: async (id) => {
    const response = await api.get(`/routes/${id}/bus-stops`);
    return response.data;
  },
  getRouteNodes: async (id) => {
    const response = await api.get(`/routes/${id}/nodes`);
    return response.data;
  }
};

// API calls cho bến xe buýt
// export const busStopAPI = {
//   getAllBusStops: async () => {
//     const response = await api.get('/bus-stops');
//     return response.data;
//   },
//   getBusStopById: async (id) => {
//     const response = await api.get(`/bus-stops/${id}`);
//     return response.data;
//   },
//   getRoutesByBusStop: async (id) => {
//     const response = await api.get(`/bus-stops/${id}/routes`);
//     return response.data;
//   },
//   getNearbyBusStops: async (lat, lng) => {
//     const response = await api.get(`/nearby-bus-stops?lat=${lat}&lng=${lng}`);
//     return response.data;
//   }
// };

// API calls cho tìm đường
export const routeFinderAPI = {
  findRoute: async (startPoint, endPoint) => {
    const response = await api.post('/find-route', {
      startPoint,
      endPoint
    });
    return response.data;
  }
};

// API calls cho xác thực
export const authAPI = {
  login: async (username, password) => {
    const response = await api.post('/users/login', {
      username,
      password
    });
    return response.data;
  },
  register: async (userData) => {
    const response = await api.post('/users/register', userData);
    return response.data;
  },
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },
  updateProfile: async (data) => {
    const response = await api.put('/users/profile', data);
    return response.data;
  }
};

export const userAPI = {
  getUserTickets: async () => {
    const response = await api.get('/users/tickets');
    return response.data;
  },
  addMonthlyTicket: async (ticketData) => {
    const response = await api.post('/users/tickets', ticketData);
    return response.data;
  },
  // getTicketQRCode: async (id) => {
  //   const response = await api.get(`/users/tickets/${id}/qrcode`);
  //   return response.data;
  // },
  getAllClients: async () => {
    const response = await api.get('/users/clients');
    return response.data;
  },
  getAllClientsWithTickets: async () => {
    const response = await api.get('/users/clients-with-tickets');
    return response.data;
  },
  deleteMonthlyTicket: async (id) => {
    const response = await api.delete(`/users/tickets/${id}`);
    return response.data;
  },
};
export default api;
