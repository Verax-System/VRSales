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
} from '@ant-design/icons';
import { Routes, Route, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext'; // Importa nosso hook

import ProtectedRoute from './components/ProtectedRoute.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ProductPage from './pages/ProductPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import SupplierPage from './pages/SupplierPage.jsx';
import ExpirationControlPage from './pages/ExpirationControlPage.jsx';

import './App.css';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth(); // Pega a função logout do contexto

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
          <div /> {/* Espaçador para alinhar à direita */}
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
            <Outlet /> {/* As rotas filhas (protegidas) serão renderizadas aqui */}
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
            <Route path="/products" element={<ProductPage />} />
            <Route path="/suppliers" element={<SupplierPage />} />
            <Route path="/expiration" element={<ExpirationControlPage />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default App;