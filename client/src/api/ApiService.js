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

   // --- UTILIZADORES ---
  getUsers: () => apiClient.get('/api/v1/users/'),
  createUser: (userData) => apiClient.post('/api/v1/users/', userData),
  updateUser: (id, userData) => apiClient.put(`/api/v1/users/${id}`, userData),
  deleteUser: (id) => apiClient.delete(`/api/v1/users/${id}`),
  
  // --- PRODUTOS ---
  getProducts: () => apiClient.get('/api/v1/products/?limit=1000'),
  createProduct: (productData) => apiClient.post('/api/v1/products/', productData),
  updateProduct: (id, productData) => apiClient.put(`/api/v1/products/${id}`, productData),
  deleteProduct: (id) => apiClient.delete(`/api/v1/products/${id}`),
  lookupProduct: (query) => apiClient.get(`/api/v1/products/lookup/?query=${query}`),
  adjustStock: (productId, adjustmentData) => apiClient.post(`/api/v1/products/${productId}/stock-adjustment`, adjustmentData),

   // --- CLIENTES ---
  getCustomers: () => apiClient.get('/api/v1/customers/'),
  createCustomer: (customerData) => apiClient.post('/api/v1/customers/', customerData),
  getCustomerSalesHistory: (customerId) => apiClient.get(`/api/v1/customers/${customerId}/sales`),

  // --- MESAS E COMANDAS ---
  getTables: () => apiClient.get('/api/v1/tables/'),
  createTable: (tableData) => apiClient.post('/api/v1/tables/', tableData),
  updateTableLayout: (layoutData) => apiClient.put('/api/v1/tables/layout', layoutData),
  createOrderForTable: (tableId) => apiClient.post('/api/v1/orders/table', { table_id: tableId }),
  getOpenOrderByTable: (tableId) => apiClient.get(`/api/v1/orders/table/${tableId}/open`),
  addItemToOrder: (orderId, itemData) => apiClient.post(`/api/v1/orders/${orderId}/items`, itemData),
  cancelOrder: (orderId) => apiClient.delete(`/api/v1/orders/${orderId}`),
  getKitchenOrders: () => apiClient.get('/api/v1/orders/kitchen/'),
  updateOrderItemStatus: (itemId, status) => apiClient.put(`/api/v1/orders/items/${itemId}/status?status=${status}`),

  // --- VENDAS ---
  createSale: (saleData) => apiClient.post('/api/v1/sales/', saleData),

  // --- CAIXA ---
  openCashRegister: (data) => apiClient.post('/api/v1/cash-register/open', data),
  getCashRegisterStatus: () => apiClient.get('/api/v1/cash-register/status'),
  closeCashRegister: (data) => apiClient.post('/api/v1/cash-register/close', data),

  // --- RELATÓRIOS E DASHBOARDS ---
  getDashboardSummary: () => apiClient.get('/api/v1/reports/dashboard'),
  getPurchaseSuggestions: () => apiClient.get('/api/v1/reports/purchase-suggestions'),

  // --- SUPER ADMIN ---
  getGlobalDashboardSummary: () => apiClient.get('/api/v1/super-admin/dashboard'),
  getStores: () => apiClient.get('/api/v1/stores/'),
  createStore: (storeData) => apiClient.post('/api/v1/stores/', storeData),
  updateStore: (storeId, storeData) => apiClient.put(`/api/v1/stores/${storeId}`, storeData),
  
  // --- MARKETING ---
  getMarketingCampaigns: () => apiClient.get('/marketing/campaigns'),
  createMarketingCampaign: (campaignData) => apiClient.post('/marketing/campaigns', campaignData),
  updateMarketingCampaign: (id, campaignData) => apiClient.put(`/marketing/campaigns/${id}`, campaignData),
  deleteMarketingCampaign: (id) => apiClient.delete(`/marketing/campaigns/${id}`),

  // --- CONTROLE DE VALIDADE (LOTES) ---
  getProductBatches: () => apiClient.get('/batches/'),
  createProductBatch: (batchData) => apiClient.post('/batches/', batchData),

 // --- FORNECEDORES ---
  getSuppliers: () => apiClient.get('/api/v1/suppliers/'),
  createSupplier: (supplierData) => apiClient.post('/api/v1/suppliers/', supplierData),
  updateSupplier: (id, supplierData) => apiClient.put(`/api/v1/suppliers/${id}`, supplierData),
  deleteSupplier: (id) => apiClient.delete(`/api/v1/suppliers/${id}`),

};



export default ApiService;