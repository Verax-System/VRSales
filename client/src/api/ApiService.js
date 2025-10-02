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
      // window.location.href = '/login'; // Descomente quando a tela de login for criada
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

  logout: () => {
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
  },

  // --- PRODUTOS ---
  getProducts: () => apiClient.get('/products/?limit=1000'),
  createProduct: (productData) => apiClient.post('/products/', productData),
  updateProduct: (id, productData) => apiClient.put(`/products/${id}`, productData),
  deleteProduct: (id) => apiClient.delete(`/products/${id}`),
  getLowStockProducts: () => apiClient.get('/products/low-stock/'),
  lookupProduct: (query) => apiClient.get(`/products/lookup/?query=${query}`),

  // --- VENDAS ---
  createSale: (saleData) => apiClient.post('/sales/', saleData),
  
  // --- RELATÓRIOS ---
  getSalesByPeriod: (startDate, endDate) => 
    apiClient.get(`/reports/sales-by-period?start_date=${startDate}&end_date=${endDate}`),
  
  getTopSellingProducts: (limit = 5) => 
    apiClient.get(`/reports/top-selling-products?limit=${limit}`),
// Adicione estas funções dentro do objeto ApiService

  // --- CONTROLE DE VALIDADE (LOTES) ---
  getProductBatches: () => apiClient.get('/batches/'),
  createProductBatch: (batchData) => apiClient.post('/batches/', batchData),

// ... (mantenha o resto do código)
 getSuppliers: () => apiClient.get('/suppliers/'),
 createSupplier: (supplierData) => apiClient.post('/suppliers/', supplierData),
 updateSupplier: (id, supplierData) => apiClient.put(`/suppliers/${id}`, supplierData),
 deleteSupplier: (id) => apiClient.delete(`/suppliers/${id}`),

};

export default ApiService;