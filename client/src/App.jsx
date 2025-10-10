import React, { useState, useMemo } from 'react';
import { Layout, Menu, Typography, Avatar, Space, Dropdown } from 'antd';
import {
  DesktopOutlined,
  AppstoreOutlined,
  AreaChartOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  TeamOutlined,
  CalendarOutlined,
  BarcodeOutlined,
  TableOutlined,
  LineChartOutlined,
  SafetyCertificateOutlined,
  FireOutlined,
  RocketOutlined,
  LayoutOutlined,
} from '@ant-design/icons';
import { Routes, Route, useNavigate, useLocation, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import RoleBasedRoute from './components/RoleBasedRoute';
import LoginPage from './pages/LoginPage';
import ProductPage from './pages/ProductPage';
import DashboardPage from './pages/DashboardPage';
import SupplierPage from './pages/SupplierPage';
import ExpirationControlPage from './pages/ExpirationControlPage';
import POSPage from './pages/POSPage';
import TableManagementPage from './pages/TableManagementPage';
import ReportsPage from './pages/ReportsPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import KDSPage from './pages/KDSPage';
import MarketingPage from './pages/MarketingPage';
import FloorPlanSettingsPage from './pages/FloorPlanSettingsPage';
import UsersPage from './pages/UsersPage';
import OpenCashRegisterPage from './pages/OpenCashRegisterPage'; // Importe a nova página

import './App.css';

const { Header, Content, Sider } = Layout;

const allMenuItems = [
    { key: '/pos', icon: <BarcodeOutlined />, label: 'Frente de Caixa', roles: ['admin', 'manager', 'cashier'] },
    { key: '/tables', icon: <TableOutlined />, label: 'Gestão de Mesas', roles: ['admin', 'manager', 'cashier'] },
    { key: '/kds', icon: <FireOutlined />, label: 'Painel da Cozinha', roles: ['admin', 'manager'] },
    { type: 'divider', roles: ['admin', 'manager'] },
    { key: '/', icon: <AreaChartOutlined />, label: 'Análise', roles: ['admin', 'manager'] },
    { key: '/reports', icon: <LineChartOutlined />, label: 'Relatórios', roles: ['admin', 'manager'] },
    { key: '/marketing', icon: <RocketOutlined />, label: 'Marketing', roles: ['admin', 'manager'] },
    { type: 'divider', roles: ['admin', 'manager'] },
    { key: '/products', icon: <AppstoreOutlined />, label: 'Produtos', roles: ['admin', 'manager'] },
    { key: '/suppliers', icon: <TeamOutlined />, label: 'Fornecedores', roles: ['admin', 'manager'] },
    { key: '/expiration', icon: <CalendarOutlined />, label: 'Validade', roles: ['admin', 'manager'] },
    { type: 'divider', roles: ['admin'] },
    { key: '/users', icon: <SafetyCertificateOutlined />, label: 'Usuários', roles: ['admin'] },
    { key: '/settings/floor-plan', icon: <LayoutOutlined />, label: 'Layout do Salão', roles: ['admin'] },
];

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const accessibleMenuItems = useMemo(() => {
    if (!user) return [];
    return allMenuItems.filter(item => !item.roles || item.roles.includes(user.role));
  }, [user]);

  const handleMenuClick = ({ key }) => {
    if (key === 'logout') {
      logout();
    } else {
      navigate(key);
    }
  };

  const userMenuItems = (
    <Menu onClick={handleMenuClick}>
      <Menu.Item key="profile" icon={<UserOutlined />}>Meu Perfil</Menu.Item>
      <Menu.Item key="settings" icon={<SettingOutlined />}>Configurações</Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} danger>Sair</Menu.Item>
    </Menu>
  );

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="dark">
        <div className="logo-vertical">
          <DesktopOutlined style={{ fontSize: '24px', color: '#fff' }} />
          {!collapsed && <span className="logo-text">VR Sales</span>}
        </div>
        <Menu theme="dark" selectedKeys={[location.pathname]} mode="inline" items={accessibleMenuItems} onClick={handleMenuClick} />
      </Sider>
      <Layout className="site-layout">
        <Header className="site-header">
          <div />
          <Dropdown overlay={userMenuItems} trigger={['click']}>
            <a onClick={(e) => e.preventDefault()} style={{ color: 'white', cursor: 'pointer' }}>
              <Space>
                <Avatar style={{ backgroundColor: '#1890ff' }} icon={<UserOutlined />} />
                <span>{user.name}</span>
              </Space>
            </a>
          </Dropdown>
        </Header>
        <Content style={{ margin: '16px', overflow: 'auto' }}>
            <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/open-cash-register" element={<OpenCashRegisterPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route element={<RoleBasedRoute allowedRoles={['admin', 'manager']} />}>
        <Route path="/kds" element={<KDSPage />} />
      </Route>
      <Route path="/" element={<MainLayout />}>
        <Route element={<RoleBasedRoute allowedRoles={['admin', 'manager']} />}>
          <Route index element={<DashboardPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="products" element={<ProductPage />} />
          <Route path="suppliers" element={<SupplierPage />} />
          <Route path="expiration" element={<ExpirationControlPage />} />
          <Route path="marketing" element={<MarketingPage />} />
        </Route>
        <Route element={<RoleBasedRoute allowedRoles={['admin']} />}>
          <Route path="users" element={<UsersPage />} />
          <Route path="settings/floor-plan" element={<FloorPlanSettingsPage />} />
        </Route>
        <Route element={<RoleBasedRoute allowedRoles={['admin', 'manager', 'cashier']} />}>
          <Route path="pos" element={<POSPage />} />
          <Route path="tables" element={<TableManagementPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default App;