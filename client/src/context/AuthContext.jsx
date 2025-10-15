import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import ApiService from '../api/ApiService';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const decodedUser = jwtDecode(token);
        if (decodedUser.exp * 1000 > Date.now()) {
          setUser({
            id: decodedUser.sub,
            name: decodedUser.name || 'Utilizador',
            role: decodedUser.role,
            store_id: decodedUser.store_id,
          });
        } else {
          localStorage.removeItem('accessToken');
        }
      }
    } catch (error) {
      console.error("Falha ao processar o token de autenticação.", error);
      localStorage.removeItem('accessToken');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const response = await ApiService.login(email, password);
    const { access_token } = response.data;

    localStorage.setItem('accessToken', access_token);
    
    // --- INÍCIO DA CORREÇÃO ---
    // A linha abaixo foi removida porque ApiService.js não tem o método 'init'
    // e o interceptor já faz o trabalho de adicionar o token.
    // ApiService.init(access_token); 
    // --- FIM DA CORREÇÃO ---
    
    const decodedUser = jwtDecode(access_token);
    setUser({
      id: decodedUser.sub,
      name: decodedUser.name || 'Utilizador',
      role: decodedUser.role,
      store_id: decodedUser.store_id,
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('accessToken');
    // Não é necessário chamar ApiService aqui, o interceptor irá simplesmente
    // deixar de encontrar um token no localStorage.
    navigate('/login');
  };

  if (loading) {
    return <div>A carregar...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);