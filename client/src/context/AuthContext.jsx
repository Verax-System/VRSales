import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../api/ApiService'; // Apenas a importação padrão é necessária agora

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('accessToken');
    // Limpa o cabeçalho de autorização para futuras requisições
    delete ApiService.defaults?.headers?.common['Authorization'];
    navigate('/login');
  }, [navigate]);

  const fetchAndSetUser = useCallback(async () => {
    try {
      const response = await ApiService.getCurrentUser();
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error("Falha ao buscar dados do usuário, sessão encerrada.", error);
      logout();
      return null;
    }
  }, [logout]);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        await fetchAndSetUser();
      }
      setLoading(false);
    };
    initializeAuth();
  }, [fetchAndSetUser]);

  const login = async (email, password) => {
    // Usa a função de login do ApiService
    const response = await ApiService.login(email, password);
    const { access_token } = response.data;
    localStorage.setItem('accessToken', access_token);
    
    const userData = await fetchAndSetUser();
    return userData;
  };

  if (loading) {
    // Pode adicionar um componente de Spinner/Loading aqui
    return <div>Carregando sistema...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);