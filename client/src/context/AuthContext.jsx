import React, { createContext, useState, useContext, useEffect } from 'react';
import ApiService from '../api/ApiService';
import { useNavigate } from 'react-router-dom';
import { Spin } from 'antd';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

// Esta função simula a obtenção de dados do usuário a partir de um token.
// Quando o backend estiver pronto, você substituirá isso por uma chamada de API real.
const mockGetCurrentUser = (token) => {
  try {
    const decoded = jwtDecode(token);
    if (decoded.sub === 'admin@example.com') {
      return { name: 'Admin Dev', email: 'admin@example.com', role: 'admin' };
    }
    if (decoded.sub === 'gerente@example.com') {
      return { name: 'João Gerente', email: 'gerente@example.com', role: 'manager' };
    }
    return { name: 'Ana Caixa', email: 'caixa@example.com', role: 'cashier' };
  } catch (error) {
    // Se o token for inválido (como o nosso mock 'dev-token'), criamos um usuário padrão
    return { name: 'Admin Dev', email: 'admin@example.com', role: 'admin' };
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      // --- INÍCIO DA MODIFICAÇÃO: LÓGICA DE LOGIN AUTOMÁTICO ---
      if (import.meta.env.DEV && !localStorage.getItem('accessToken')) {
        // Em modo de desenvolvimento, se não houver token, criamos um falso
        // e logamos como admin para pular a tela de login.
        localStorage.setItem('accessToken', 'dev-token');
      }
      // --- FIM DA MODIFICAÇÃO ---

      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const userData = mockGetCurrentUser(token);
          setUser(userData);
        } catch (error) {
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
      const { access_token } = await ApiService.login(username, password);
      localStorage.setItem('accessToken', access_token);
      
      const userData = mockGetCurrentUser(access_token);
      setUser(userData);

      if (userData.role === 'cashier') {
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