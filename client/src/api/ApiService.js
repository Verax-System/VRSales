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

// --- INÍCIO DO MOCK DE DADOS PARA USUÁRIOS ---
// Este bloco simula o banco de dados de usuários.
// Remova ou comente este bloco quando seu colega implementar o backend real.
let mockUsers = [
    { id: 1, full_name: 'Admin Dev', email: 'admin@example.com', role: 'admin', is_active: true, created_at: '2023-10-01T10:00:00Z' },
    { id: 2, full_name: 'João Gerente', email: 'gerente@example.com', role: 'manager', is_active: true, created_at: '2023-10-01T11:00:00Z' },
    { id: 3, full_name: 'Ana Caixa', email: 'caixa@example.com', role: 'cashier', is_active: false, created_at: '2023-10-01T12:00:00Z' },
];
let nextUserId = 4;
// --- FIM DO MOCK DE DADOS ---


const ApiService = {
  // --- AUTENTICAÇÃO ---
  login: async (username, password) => {
    // Para o login funcionar no modo dev sem backend, vamos simular a resposta
    if (import.meta.env.DEV) {
        console.log("MOCK: Login com", { username, password });
        // Simula a criação de um token JWT simples (sem criptografia real)
        const payload = btoa(JSON.stringify({ sub: username }));
        const signature = btoa('dev-signature');
        const token = `header.${payload}.${signature}`;
        return Promise.resolve({ access_token: token, token_type: 'bearer' });
    }
    // Lógica real para produção
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    const response = await apiClient.post('/login/token', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    if (response.data.access_token) {
      localStorage.setItem('accessToken', response.data.access_token);
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
  },

  // --- USUÁRIOS (NOVO COM MOCK) ---
  getUsers: async () => {
    console.log("MOCK: Buscando usuários...");
    // Simula uma chamada de API com um pequeno atraso
    return new Promise(resolve => setTimeout(() => resolve({ data: mockUsers }), 500));
  },
  
  createUser: async (userData) => {
    console.log("MOCK: Criando usuário...", userData);
    const newUser = { 
        ...userData, 
        id: nextUserId++, 
        is_active: true,
        created_at: new Date().toISOString()
    };
    mockUsers.push(newUser);
    return new Promise(resolve => setTimeout(() => resolve({ data: newUser }), 500));
  },

  updateUser: async (id, userData) => {
    console.log("MOCK: Atualizando usuário...", id, userData);
    mockUsers = mockUsers.map(user => 
        user.id === id ? { ...user, ...userData } : user
    );
    const updatedUser = mockUsers.find(u => u.id === id);
    return new Promise(resolve => setTimeout(() => resolve({ data: updatedUser }), 500));
  },

  deleteUser: async (id) => {
     console.log("MOCK: Deletando usuário...", id);
     mockUsers = mockUsers.filter(user => user.id !== id);
     return new Promise(resolve => setTimeout(() => resolve({ data: { detail: "Usuário deletado" } }), 500));
  },

  // --- PRODUTOS ---
  getProducts: () => apiClient.get('/products/?limit=1000'),
  createProduct: (productData) => apiClient.post('/products/', productData),
  updateProduct: (id, productData) => apiClient.put(`/products/${id}`, productData),
  deleteProduct: (id) => apiClient.delete(`/products/${id}`),
  lookupProduct: (query) => apiClient.get(`/products/lookup/?query=${query}`),

  // --- CLIENTES ---
  getCustomers: () => apiClient.get('/customers/'),
  createCustomer: (customerData) => apiClient.post('/customers/', customerData),

  // --- MESAS E COMANDAS ---
  getTables: () => apiClient.get('/tables/'),
  createOrderForTable: (tableId) => apiClient.post('/orders/table', tableId),
  getOpenOrderByTable: (tableId) => apiClient.get(`/orders/table/${tableId}/open`),

  // --- VENDAS ---
  createSale: (saleData) => apiClient.post('/sales/', saleData),
  
  // --- RELATÓRIOS ---
  getSalesByPeriod: (startDate, endDate) => 
    apiClient.get(`/reports/sales-by-period?start_date=${startDate}&end_date=${endDate}`),
  
  getTopSellingProducts: (limit = 5) => 
    apiClient.get(`/reports/top-selling-products?limit=${limit}`),

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