import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleBasedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Verificando permissões...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isAuthorized = user && allowedRoles.includes(user.role);

  return isAuthorized ? <Outlet /> : <Navigate to="/unauthorized" replace />;
};

export default RoleBasedRoute;