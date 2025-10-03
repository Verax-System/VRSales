import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Um componente de rota que verifica se o usuário logado tem uma das funções permitidas.
 * @param {object} props
 * @param {string[]} props.allowedRoles - Um array de strings com as funções permitidas.
 */
const RoleBasedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isAuthorized = user && allowedRoles.includes(user.role);

  return isAuthorized ? <Outlet /> : <Navigate to="/unauthorized" replace />;
};

export default RoleBasedRoute;