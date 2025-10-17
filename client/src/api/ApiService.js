import axios from 'axios';

// 1. Cria a instância base do Axios
const ApiService = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
});

// 2. Adiciona o interceptor de requisição à instância
// Esta função será executada ANTES de cada requisição ser enviada
ApiService.interceptors.request.use(
  (config) => {
    // Pega o token do localStorage
    const token = localStorage.getItem('accessToken');
    if (token) {
      // Se o token existir, anexa ao cabeçalho de autorização
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config; // Retorna a configuração modificada para a requisição continuar
  },
  (error) => {
    // Se ocorrer um erro na configuração da requisição, ele é rejeitado
    return Promise.reject(error);
  }
);

// 3. Adiciona o interceptor de resposta para tratar erros globais
// Esta função será executada DEPOIS que uma resposta for recebida
ApiService.interceptors.response.use(
  // Para respostas bem-sucedidas (status 2xx), simplesmente as retorna
  (response) => {
    return response;
  },
  // Para respostas com erro
  (error) => {
    // Se o erro for 401 (Não Autorizado), desloga o usuário
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('accessToken');
      // Redireciona para a página de login para uma nova autenticação
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    // Rejeita a promise para que o erro possa ser tratado no local da chamada (ex: no .catch do LoginPage)
    return Promise.reject(error);
  }
);

// --- CORREÇÃO NA LÓGICA DE LOGIN ---
// A função de login agora é uma função separada que usa a instância do ApiService
// Isso evita a exportação confusa que causava o problema
export const login = (email, password) => {
  const params = new URLSearchParams();
  params.append('username', email);
  params.append('password', password);
  return ApiService.post('/login/access-token', params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
};


// 4. Exporta a instância do ApiService como padrão
// Agora, quando você importar 'ApiService' em outros arquivos,
// você estará usando esta instância única com os interceptores já configurados.
export default ApiService;