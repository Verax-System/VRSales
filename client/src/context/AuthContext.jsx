import React, { createContext, useState, useContext, useEffect } from 'react';
import ApiService from '../api/ApiService';
import { useNavigate } from 'react-router-dom';
import { Spin } from 'antd';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          // Busca os dados reais do usuário no backend
          const response = await ApiService.getMe();
          setUser(response.data);
        } catch (error) {
          // Se o token for inválido, limpa tudo
          localStorage.removeItem('accessToken');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (username, password) => {
    try {
      // 1. Faz o login e obtém o token
      await ApiService.login(username, password);
      
      // 2. Com o token salvo, busca os dados do usuário
      const response = await ApiService.getMe();
      setUser(response.data);

      // 3. Redireciona com base na ROLE REAL do usuário
      if (response.data.role === 'cashier') {
        navigate('/pos');
      } else {
        navigate('/');
      }

    } catch (error) {
      setUser(null);
      throw error;
    }
  };

  const logout = () => {
    ApiService.logout();
    setUser(null);
    navigate('/login');
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};