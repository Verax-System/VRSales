import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api/v1', 
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});


const ApiService = {
  // Funções genéricas
  get: (url, config) => apiClient.get(url, config),
  post: (url, data, config) => apiClient.post(url, data, config),
  patch: (url, data, config) => apiClient.patch(url, data, config),
  delete: (url, config) => apiClient.delete(url, config),

  // --- CORREÇÃO APLICADA AQUI ---
  // A rota foi alterada de '/auth/token' para '/login/token'
  login: (email, password) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    return ApiService.post('/login/token', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },
  // --- FIM DA CORREÇÃO ---

  getCurrentUser: () => {
    return ApiService.get('/users/me');
  },

  getCashRegisterStatus: () => {
    return ApiService.get('/cash-registers/status');
  },
  
  openCashRegister: (data) => {
    return ApiService.post('/cash-registers/open', data);
  },

  lookupProduct: (barcodeOrName) => {
    return ApiService.get(`/products/lookup?q=${barcodeOrName}`);
  },

  createSale: (saleData) => {
    return ApiService.post('/sales/', saleData);
  },

  cancelOrder: (orderId) => {
    return ApiService.patch(`/orders/${orderId}/cancel`);
  },
};

export default ApiService;