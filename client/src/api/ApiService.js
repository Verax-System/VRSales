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

// --- MOCK DE DADOS ---
let mockUsers = [
    { id: 1, full_name: 'Admin Dev', email: 'admin@example.com', role: 'admin', is_active: true, created_at: '2023-10-01T10:00:00Z' },
    { id: 2, full_name: 'João Gerente', email: 'gerente@example.com', role: 'manager', is_active: true, created_at: '2023-10-01T11:00:00Z' },
    { id: 3, full_name: 'Ana Caixa', email: 'caixa@example.com', role: 'cashier', is_active: false, created_at: '2023-10-01T12:00:00Z' },
];
let nextUserId = 4;

const mockKitchenOrders = [
    { id: 101, table_number: '05', created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(), items: [ { id: 201, quantity: 2, notes: 'Sem cebola', status: 'pending', product: { id: 1, name: 'X-Salada' } }, { id: 202, quantity: 1, notes: null, status: 'pending', product: { id: 2, name: 'Batata Frita M' } } ] },
    { id: 102, table_number: '12', created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(), items: [ { id: 203, quantity: 1, notes: 'Bem passado', status: 'preparing', product: { id: 3, name: 'Bife à Parmegiana' } } ] },
    { id: 103, table_number: 'Delivery', created_at: new Date(Date.now() - 16 * 60 * 1000).toISOString(), items: [ { id: 204, quantity: 1, notes: 'Massa sem glúten', status: 'pending', product: { id: 4, name: 'Pizza Calabresa' } }, { id: 205, quantity: 1, notes: null, status: 'ready', product: { id: 5, name: 'Coca-Cola 2L' } } ] }
];

let mockCampaigns = [
    { id: 1, name: "Promoção de Fim de Ano", target_audience: 'all_customers', status: 'sent', send_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 2, name: "Reativação de Clientes", target_audience: 'inactive_60_days', status: 'scheduled', send_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 3, name: "Cupom para Clientes VIP", target_audience: 'top_10_spenders', status: 'draft', send_date: null }
];
let nextCampaignId = 4;
// --- FIM DOS MOCKS ---


const ApiService = {
  // --- AUTENTICAÇÃO ---
  login: async (username, password) => {
    if (import.meta.env.DEV) {
        const payload = btoa(JSON.stringify({ sub: username }));
        const signature = btoa('dev-signature');
        const token = `header.${payload}.${signature}`;
        return Promise.resolve({ access_token: token, token_type: 'bearer' });
    }
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    const response = await apiClient.post('/login/token', params, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    if (response.data.access_token) {
      localStorage.setItem('accessToken', response.data.access_token);
    }
    return response.data;
  },
  logout: () => { localStorage.removeItem('accessToken'); window.location.href = '/login'; },

  // --- USUÁRIOS ---
  getUsers: () => new Promise(resolve => setTimeout(() => resolve({ data: mockUsers }), 500)),
  createUser: (userData) => { const newUser = { ...userData, id: nextUserId++, is_active: true, created_at: new Date().toISOString() }; mockUsers.push(newUser); return new Promise(resolve => setTimeout(() => resolve({ data: newUser }), 500)); },
  updateUser: (id, userData) => { mockUsers = mockUsers.map(user => user.id === id ? { ...user, ...userData } : user); const updatedUser = mockUsers.find(u => u.id === id); return new Promise(resolve => setTimeout(() => resolve({ data: updatedUser }), 500)); },
  deleteUser: (id) => { mockUsers = mockUsers.filter(user => user.id !== id); return new Promise(resolve => setTimeout(() => resolve({ data: { detail: "Usuário deletado" } }), 500)); },

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
  createOrderForTable: (tableId) => apiClient.post('/orders/table', tableId),
  getOpenOrderByTable: (tableId) => apiClient.get(`/orders/table/${tableId}/open`),
  getKitchenOrders: () => new Promise(resolve => setTimeout(() => resolve({ data: mockKitchenOrders }), 500)),

  // --- VENDAS ---
  createSale: (saleData) => apiClient.post('/sales/', saleData),

  // --- RELATÓRIOS ---
  getSalesByPeriod: (startDate, endDate) => apiClient.get(`/reports/sales-by-period?start_date=${startDate}&end_date=${endDate}`),
  getTopSellingProducts: (limit = 5) => apiClient.get(`/reports/top-selling-products?limit=${limit}`),
  
  // --- MARKETING ---
  getMarketingCampaigns: () => new Promise(resolve => setTimeout(() => resolve({ data: mockCampaigns }), 500)),
  createMarketingCampaign: (campaignData) => {
    const newCampaign = { ...campaignData, id: nextCampaignId++, status: campaignData.send_date ? 'scheduled' : 'sent', created_at: new Date().toISOString() };
    if (!newCampaign.send_date) newCampaign.send_date = new Date().toISOString();
    mockCampaigns.push(newCampaign);
    return new Promise(resolve => setTimeout(() => resolve({ data: newCampaign }), 500));
  },
  updateMarketingCampaign: (id, campaignData) => {
      mockCampaigns = mockCampaigns.map(c => c.id === id ? { ...c, ...campaignData } : c);
      const updated = mockCampaigns.find(c => c.id === id);
      return new Promise(resolve => setTimeout(() => resolve({ data: updated }), 500));
  },
  deleteMarketingCampaign: (id) => {
      mockCampaigns = mockCampaigns.filter(c => c.id !== id);
      return new Promise(resolve => setTimeout(() => resolve({ data: {} }), 500));
  },

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