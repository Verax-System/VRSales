import axios from 'axios';
import { message } from 'antd';

const apiClient = axios.create({
  // Esta baseURL está correta e será a base para todas as chamadas.
  baseURL: '/api/v1',
});


// Interceptor para adicionar o token JWT (está perfeito)
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


// Interceptor para tratar erros de autenticação de forma global (está perfeito)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('accessToken');
      message.error('A sua sessão expirou. Por favor, faça o login novamente.');
      // Força um reload para que o AuthContext lide com o redirecionamento
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

const ApiService = {
  // --- AUTENTICAÇÃO ---
  login: (email, password) => {
    const params = new URLSearchParams();
    params.append('username', email); // O backend espera 'username'
    params.append('password', password);
    
    // CORREÇÃO: A rota estava errada. O correto é /login/access-token
    // O serviço deve apenas retornar a promessa da chamada, não gerir o token.
    return apiClient.post('/login/access-token', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },
  logout: () => { 
    localStorage.removeItem('accessToken'); 
    window.location.href = '/login'; 
  },

  // --- UTILIZADORES ---
  // CORREÇÃO: Removido o prefixo /api/v1/ duplicado
  getUsers: () => apiClient.get('/users/'),
  createUser: (userData) => apiClient.post('/users/', userData),
  updateUser: (id, userData) => apiClient.put(`/users/${id}`, userData),
  deleteUser: (id) => apiClient.delete(`/users/${id}`),
  
  // --- PRODUTOS ---
  // CORREÇÃO: Removido o prefixo /api/v1/ duplicado
  getProducts: () => apiClient.get('/products/?limit=1000'),
  createProduct: (productData) => apiClient.post('/products/', productData),
  updateProduct: (id, productData) => apiClient.put(`/products/${id}`, productData),
  deleteProduct: (id) => apiClient.delete(`/products/${id}`),
  lookupProduct: (query) => apiClient.get(`/products/lookup/?query=${query}`),
  adjustStock: (productId, adjustmentData) => apiClient.post(`/products/${productId}/stock-adjustment`, adjustmentData),

  // --- CLIENTES ---
  // CORREÇÃO: Removido o prefixo /api/v1/ duplicado e adicionados métodos em falta
  getCustomers: () => apiClient.get('/customers/'),
  createCustomer: (customerData) => apiClient.post('/customers/', customerData),
  updateCustomer: (id, customerData) => apiClient.put(`/customers/${id}`, customerData),
  deleteCustomer: (id) => apiClient.delete(`/customers/${id}`),
  getCustomerSalesHistory: (customerId) => apiClient.get(`/customers/${customerId}/sales`),

  // --- MESAS E COMANDAS ---
  getTables: () => apiClient.get('/tables/'),
  createTable: (tableData) => apiClient.post('/tables/', tableData),
  updateTableLayout: (layoutData) => apiClient.put('/tables/layout', layoutData),
  createOrderForTable: (tableId) => apiClient.post('/orders/table', { table_id: tableId }),
  getOpenOrderByTable: (tableId) => apiClient.get(`/orders/table/${tableId}/open`),
  addItemToOrder: (orderId, itemData) => apiClient.post(`/orders/${orderId}/items`, itemData),
  cancelOrder: (orderId) => apiClient.delete(`/orders/${orderId}`),
  getKitchenOrders: () => apiClient.get('/orders/kitchen/'),
  updateOrderItemStatus: (itemId, status) => apiClient.put(`/orders/items/${itemId}/status?status=${status}`),

  // --- VENDAS ---
  createSale: (saleData) => apiClient.post('/sales/', saleData),

  // --- CAIXA ---
  openCashRegister: (data) => apiClient.post('/cash-register/open', data),
  getCashRegisterStatus: () => apiClient.get('/cash-register/status'),
  closeCashRegister: (data) => apiClient.post('/cash-register/close', data),

  // --- RELATÓRIOS E DASHBOARDS ---
  getDashboardSummary: () => apiClient.get('/reports/dashboard'),
  getPurchaseSuggestions: () => apiClient.get('/reports/purchase-suggestions'),

  // --- SUPER ADMIN ---
  getGlobalDashboardSummary: () => apiClient.get('/super-admin/dashboard'),
  getStores: () => apiClient.get('/stores/'),
  createStore: (storeData) => apiClient.post('/stores/', storeData),
  updateStore: (storeId, storeData) => apiClient.put(`/stores/${storeId}`, storeData),
  
  // --- FORNECEDORES ---
  // CORREÇÃO: Removido o prefixo /api/v1/ duplicado
  getSuppliers: () => apiClient.get('/suppliers/'),
  createSupplier: (supplierData) => apiClient.post('/suppliers/', supplierData),
  updateSupplier: (id, supplierData) => apiClient.put(`/suppliers/${id}`, supplierData),
  deleteSupplier: (id) => apiClient.delete(`/suppliers/${id}`),

  // --- MARKETING ---
  getMarketingCampaigns: () => apiClient.get('/marketing/campaigns'),
  createMarketingCampaign: (campaignData) => apiClient.post('/marketing/campaigns', campaignData),
  updateMarketingCampaign: (id, campaignData) => apiClient.put(`/marketing/campaigns/${id}`, campaignData),
  deleteMarketingCampaign: (id) => apiClient.delete(`/marketing/campaigns/${id}`),

  // --- CONTROLE DE VALIDADE (LOTES) ---
  getProductBatches: () => apiClient.get('/batches/'),
  createProductBatch: (batchData) => apiClient.post('/batches/', batchData),
};

export default ApiService;