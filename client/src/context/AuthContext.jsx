import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// --- INÍCIO DA CORREÇÃO ---
// Importa a instância padrão e a função de login nomeada
import ApiService, { login as apiLogin } from '../api/ApiService';
// --- FIM DA CORREÇÃO ---


const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const logout = () => {
    setUser(null);
    localStorage.removeItem('accessToken');
    navigate('/login');
  };

  const fetchAndSetUser = async () => {
    try {
      const response = await ApiService.get('/users/me');
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error("Falha ao buscar dados do usuário, sessão encerrada.", error);
      logout();
      return null;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        await fetchAndSetUser();
      }
      setLoading(false);
    };
    initializeAuth();
  }, []);

  const login = async (email, password) => {
    // Usa a função de login importada
    const response = await apiLogin(email, password);
    const { access_token } = response.data;
    localStorage.setItem('accessToken', access_token);
    
    const userData = await fetchAndSetUser();
    return userData;
  };

  if (loading) {
    return <div>A carregar sistema...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);