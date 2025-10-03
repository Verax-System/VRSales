import React, { createContext, useState, useContext, useEffect } from 'react';
import ApiService from '../api/ApiService';
import { useNavigate } from 'react-router-dom';
import { Spin } from 'antd';
import { jwtDecode } from 'jwt-decode'; // Precisaremos de uma biblioteca para decodificar o token

const AuthContext = createContext(null);

// Mock da função que seu colega irá implementar no backend
// Ela deve retornar os dados do usuário logado a partir do token
const mockGetCurrentUser = (token) => {
  const decoded = jwtDecode(token);
  // Em um caso real, você faria uma chamada para /api/v1/users/me
  // e o backend retornaria os dados do usuário, incluindo a role.
  // Por agora, vamos simular com base no email.
  if (decoded.sub === 'admin@example.com') {
    return { name: 'Admin Geral', email: 'admin@example.com', role: 'admin' };
  }
  if (decoded.sub === 'gerente@example.com') {
    return { name: 'João Gerente', email: 'gerente@example.com', role: 'manager' };
  }
  return { name: 'Ana Caixa', email: 'caixa@example.com', role: 'cashier' };
};


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          // Aqui você faria a chamada para o backend para obter os dados do usuário
          // const userData = await ApiService.getCurrentUser();
          const userData = mockGetCurrentUser(token); // Usando nosso mock por enquanto
          setUser(userData);
        } catch (error) {
          // Token inválido ou expirado
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
      
      // const userData = await ApiService.getCurrentUser();
      const userData = mockGetCurrentUser(access_token); // Usando nosso mock
      setUser(userData);

      // Redireciona com base na função
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