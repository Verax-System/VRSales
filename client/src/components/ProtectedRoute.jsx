import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    // Redireciona para a página de login se não estiver autenticado
    return <Navigate to="/login" />;
  }

  // Se estiver autenticado, renderiza o conteúdo da rota (nosso layout principal)
  return <Outlet />;
};

export default ProtectedRoute;