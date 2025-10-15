import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'; // Corrigido para a importação correta
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
        // O `exp` está em segundos, Date.now() em milissegundos
        if (decodedUser.exp * 1000 > Date.now()) {
          // O token ainda é válido, vamos buscar os detalhes completos do utilizador
          ApiService.init(token);
          // Idealmente, teríamos um endpoint /users/me para buscar nome, etc.
          // Por agora, vamos extrair do token o que for possível.
          setUser({
            id: decodedUser.sub,
            name: decodedUser.name || 'Utilizador', // Adicione 'name' ao payload do seu token no backend
            role: decodedUser.role,
            store_id: decodedUser.store_id,
          });
        } else {
          // Token expirado
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
    ApiService.init(access_token);
    
    const decodedUser = jwtDecode(access_token);
    setUser({
      id: decodedUser.sub,
      name: decodedUser.name || 'Utilizador', // Adicione 'name' ao payload do seu token no backend
      role: decodedUser.role,
      store_id: decodedUser.store_id,
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('accessToken');
    ApiService.init(null);
    navigate('/login');
  };

  if (loading) {
    // Pode adicionar um componente de Spinner/Loading de ecrã inteiro aqui
    return <div>A carregar...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);