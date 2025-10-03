import React, { createContext, useState, useContext, useEffect } from 'react';
import ApiService from '../api/ApiService';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // --- INÍCIO DA MODIFICAÇÃO ---
    // Em modo de desenvolvimento, pula a autenticação
    if (import.meta.env.DEV) {
      setIsAuthenticated(true);
      setLoading(false);
      return;
    }
    // --- FIM DA MODIFICAÇÃO ---

    // Lógica original para produção
    const token = localStorage.getItem('accessToken');
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      await ApiService.login(username, password);
      setIsAuthenticated(true);
      navigate('/'); // Redireciona para o dashboard após o login
    } catch (error) {
      setIsAuthenticated(false);
      throw error; // Lança o erro para a página de login tratar
    }
  };

  const logout = () => {
    ApiService.logout();
    setIsAuthenticated(false);
    navigate('/login');
  };

  if (loading) {
    return <div>Carregando...</div>; // Ou um componente de spinner/loading
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook customizado para facilitar o uso do contexto
export const useAuth = () => {
  return useContext(AuthContext);
};