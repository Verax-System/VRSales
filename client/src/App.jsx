import React, { useState } from 'react';
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
  BarcodeOutlined, // NOVO ÍCONE ADICIONADO
} from '@ant-design/icons';
import { Routes, Route, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import ProtectedRoute from './components/ProtectedRoute.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ProductPage from './pages/ProductPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import SupplierPage from './pages/SupplierPage.jsx';
import ExpirationControlPage from './pages/ExpirationControlPage.jsx';
import POSPage from './pages/POSPage.jsx'; // NOVA PÁGINA IMPORTADA

import './App.css';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

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
  
  const menuItems = [
    { key: '/pos', icon: <BarcodeOutlined />, label: 'Frente de Caixa' }, // NOVO ITEM DE MENU
    { type: 'divider' }, // Divisor para separar o PDV das áreas de gestão
    { key: '/', icon: <AreaChartOutlined />, label: 'Análise' },
    { key: '/products', icon: <AppstoreOutlined />, label: 'Produtos' },
    { key: '/suppliers', icon: <TeamOutlined />, label: 'Fornecedores' },
    { key: '/expiration', icon: <CalendarOutlined />, label: 'Validade' },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="dark">
        <div className="logo-vertical">
          <DesktopOutlined style={{ fontSize: '24px', color: '#fff' }} />
          {!collapsed && <span className="logo-text">VR Sales</span>}
        </div>
        <Menu theme="dark" selectedKeys={[location.pathname]} mode="inline" items={menuItems} onClick={handleMenuClick} />
      </Sider>
      <Layout className="site-layout">
        <Header className="site-header">
          <div />
          <Dropdown overlay={userMenuItems}>
            <a onClick={(e) => e.preventDefault()} style={{ color: 'white' }}>
              <Space>
                <Avatar style={{ backgroundColor: '#1890ff' }} icon={<UserOutlined />} />
                <span>Usuário</span>
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
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/pos" element={<POSPage />} /> {/* NOVA ROTA ADICIONADA */}
            <Route path="/products" element={<ProductPage />} />
            <Route path="/suppliers" element={<SupplierPage />} />
            <Route path="/expiration" element={<ExpirationControlPage />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default App;