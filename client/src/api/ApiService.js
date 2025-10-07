import axios from 'axios';
import { message } from 'antd';

const apiClient = axios.create({
  baseURL: '/api/v1',
});

// Interceptor para adicionar o token JWT
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para tratar erros de autenticação de forma global
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
      message.error('Sua sessão expirou. Por favor, faça o login novamente.');
    }
    return Promise.reject(error);
  }
);

const ApiService = {
  // --- AUTENTICAÇÃO ---
  login: async (username, password) => {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    
    const response = await apiClient.post('/token', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    
    if (response.data.access_token) {
      localStorage.setItem('accessToken', response.data.access_token);
    }
    
    return response.data;
  },
  logout: () => { localStorage.removeItem('accessToken'); window.location.href = '/login'; },

  // --- USUÁRIOS ---
  getMe: () => apiClient.get('/users/me'),
  getUsers: () => apiClient.get('/users/'),
  createUser: (userData) => apiClient.post('/users/', userData),
  updateUser: (id, userData) => apiClient.put(`/users/${id}`, userData),
  deleteUser: (id) => apiClient.delete(`/users/${id}`),
  
  // --- PRODUTOS ---
  getProducts: () => apiClient.get('/products/?limit=1000'),
  createProduct: (productData) => apiClient.post('/products/', productData),
  updateProduct: (id, productData) => apiClient.put(`/products/${id}`, productData),
  deleteProduct: (id) => apiClient.delete(`/products/${id}`),
  lookupProduct: (query) => apiClient.get(`/products/lookup/?query=${query}`),
  getLowStockProducts: () => apiClient.get('/products/low-stock'),

  // --- CLIENTES ---
  getCustomers: () => apiClient.get('/customers/'),
  createCustomer: (customerData) => apiClient.post('/customers/', customerData),

  // --- MESAS E COMANDAS ---
getTables: () => apiClient.get('/tables/'),
  createTable: (tableData) => apiClient.post('/tables/', tableData), // <-- ADICIONE ESTA LINHA
  createOrderForTable: (tableId) => apiClient.post('/orders/table', tableId),
  getOpenOrderByTable: (tableId) => apiClient.get(`/orders/table/${tableId}/open`),
  getKitchenOrders: () => apiClient.get('/orders/kitchen/'),
  updateOrderItemStatus: (itemId, status) => apiClient.put(`/orders/items/${itemId}/status?status=${status}`),


  // --- VENDAS ---
  createSale: (saleData) => apiClient.post('/sales/', saleData),

  // --- RELATÓRIOS ---
  getSalesByPeriod: (startDate, endDate) => apiClient.get(`/reports/sales-by-period?start_date=${startDate}&end_date=${endDate}`),
  getTopSellingProducts: (limit = 5) => apiClient.get(`/reports/top-selling-products?limit=${limit}`),
  
  // --- MARKETING ---
  getMarketingCampaigns: () => apiClient.get('/marketing/campaigns'), // Assumindo que haverá um endpoint real
  createMarketingCampaign: (campaignData) => apiClient.post('/marketing/campaigns', campaignData),
  updateMarketingCampaign: (id, campaignData) => apiClient.put(`/marketing/campaigns/${id}`, campaignData),
  deleteMarketingCampaign: (id) => apiClient.delete(`/marketing/campaigns/${id}`),

  // --- CONTROLE DE VALIDADE (LOTES) ---
  getProductBatches: () => apiClient.get('/batches/'),
  createProductBatch: (batchData) => apiClient.post('/batches/', batchData),

  // --- FORNECEDORES ---
  getSuppliers: () => apiClient.get('/suppliers/'),
  createSupplier: (supplierData) => apiClient.post('/suppliers/', supplierData),
  updateSupplier: (id, supplierData) => apiClient.put(`/suppliers/${id}`, supplierData),
  deleteSupplier: (id) => apiClient.delete(`/suppliers/${id}`),
};

export default ApiService;