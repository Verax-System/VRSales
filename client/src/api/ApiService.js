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
  
  // --- CORREÇÃO AQUI ---
  // Adicionando o método PUT que estava em falta para as operações de atualização.
  put: (url, data, config) => apiClient.put(url, data, config),
  // --- FIM DA CORREÇÃO ---
  
  patch: (url, data, config) => apiClient.patch(url, data, config),
  delete: (url, config) => apiClient.delete(url, config),

  login: (email, password) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    return ApiService.post('/login/token', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },

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
  
  // Adicione outras chamadas específicas da API aqui conforme necessário
  getKitchenOrders: () => ApiService.get('/orders/kitchen'), // Exemplo
  updateOrderItemStatus: (itemId, status) => ApiService.patch(`/orders/items/${itemId}/status`, { status }), // Exemplo
  getStores: () => ApiService.get('/stores'),
  createStore: (data) => ApiService.post('/stores', data),
  updateStore: (id, data) => ApiService.put(`/stores/${id}`, data),
  getGlobalDashboardSummary: () => ApiService.get('/super-admin/dashboard'),
  
};

export default ApiService;