import axios from 'axios';

// A URL base da sua API. O Vite proxy vai nos ajudar com o CORS em desenvolvimento.
const API_URL = '/api/v1/products';

const ApiService = {
  // Busca a lista de produtos
  getProducts: async (skip = 0, limit = 100) => {
    try {
      const response = await axios.get(`${API_URL}/?skip=${skip}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      throw error;
    }
  },

  // Cria um novo produto
  createProduct: async (productData) => {
    try {
      // O backend espera: name, description, price, stock
      const response = await axios.post(`${API_URL}/`, productData);
      return response.data;
    } catch (error) {
      console.error("Erro ao criar produto:", error);
      throw error;
    }
  },

  // (Futuro) Atualizar um produto
  // updateProduct: async (productId, productData) => { ... }

  // (Futuro) Deletar um produto
  // deleteProduct: async (productId) => { ... }
};

export default ApiService;