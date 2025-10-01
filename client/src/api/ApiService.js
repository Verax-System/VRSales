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
      // Se o token for inválido/expirado, limpa o storage e redireciona para o login
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

  logout: () => {
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
  },

  // --- PRODUTOS ---
  getProducts: () => apiClient.get('/products/?limit=1000'),
  createProduct: (productData) => apiClient.post('/products/', productData),
  updateProduct: (id, productData) => apiClient.put(`/products/${id}`, productData),
  deleteProduct: (id) => apiClient.delete(`/products/${id}`),

  // --- VENDAS ---
  createSale: (saleData) => apiClient.post('/sales/', saleData),
};

export default ApiService;