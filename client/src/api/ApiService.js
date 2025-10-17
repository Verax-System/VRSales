import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api/v1', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercetor de REQUISIÇÃO: Adiciona o token a cada chamada
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// --- INÍCIO DA NOVA LÓGICA ---
// Intercetor de RESPOSTA: Lida com erros, especialmente o 401
apiClient.interceptors.response.use(
  (response) => response, // Se a resposta for bem-sucedida, não faz nada
  (error) => {
    // Verifica se o erro é por falta de autorização
    if (error.response && error.response.status === 401) {
      // Limpa o token antigo
      localStorage.removeItem('accessToken');
      
      // Remove o cabeçalho de autorização para futuras requisições
      delete apiClient.defaults.headers.common['Authorization'];

      // Redireciona para a página de login
      // Usamos window.location para forçar um recarregamento completo da aplicação,
      // o que limpa qualquer estado antigo do React.
      if (!window.location.pathname.includes('/login')) {
        // Mostra a mensagem apenas uma vez para não sobrecarregar
        if (!sessionStorage.getItem('logout-message')) {
            sessionStorage.setItem('logout-message', 'true');
            alert('A sua sessão expirou. Por favor, faça login novamente.');
        }
        window.location.href = '/login';
      }
    }
    
    // Para todos os outros erros, apenas os rejeita para que possam ser tratados localmente
    return Promise.reject(error);
  }
);
// --- FIM DA NOVA LÓGICA ---


const ApiService = {
  // Funções genéricas
  get: (url, config) => apiClient.get(url, config),
  post: (url, data, config) => apiClient.post(url, data, config),
  put: (url, data, config) => apiClient.put(url, data, config),
  patch: (url, data, config) => apiClient.patch(url, data, config),
  delete: (url, config) => apiClient.delete(url, config),

  login: (email, password) => {
    // Limpa a flag da mensagem de logout ao tentar fazer login
    sessionStorage.removeItem('logout-message');
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
  
  getKitchenOrders: () => ApiService.get('/orders/kitchen'),
  updateOrderItemStatus: (itemId, status) => ApiService.patch(`/orders/items/${itemId}/status`, { status }),
  getStores: () => ApiService.get('/stores'),
  createStore: (data) => ApiService.post('/stores', data),
  updateStore: (id, data) => ApiService.put(`/stores/${id}`, data),
  getGlobalDashboardSummary: () => ApiService.get('/super-admin/dashboard'),

  processPartialPayment: (orderId, paymentData) => {
    return ApiService.post(`/orders/${orderId}/partial-payment`, paymentData);
  },
};

export default ApiService;