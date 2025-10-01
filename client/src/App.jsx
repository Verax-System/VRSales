import React, { useState } from 'react';
import { Layout, Menu, Typography, Avatar, Space, Dropdown } from 'antd';
import {
  DesktopOutlined,
  AppstoreOutlined,
  AreaChartOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import ProductPage from './pages/ProductPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import './App.css';
import { CalendarOutlined } from '@ant-design/icons';
import ExpirationControlPage from './pages/ExpirationControlPage.jsx'; // <-- Nova importação
import { TeamOutlined } from '@ant-design/icons'; // <-- Importe o novo ícone
import SupplierPage from './pages/SupplierPage.jsx'; // <-- Importe a nova página


const { Header, Content, Footer, Sider } = Layout;
const { Title } = Typography;

const menuItems = [
  { key: '/', icon: <AreaChartOutlined />, label: 'Análise' },
  { key: '/expiration', icon: <CalendarOutlined />, label: 'Validade' }, // <-- Novo item
  { key: '/suppliers', icon: <TeamOutlined />, label: 'Fornecedores' },
  { key: '/products', icon: <AppstoreOutlined />, label: 'Produtos' },
];

const userMenuItems = (
  <Menu>
    <Menu.Item key="profile" icon={<UserOutlined />}>Meu Perfil</Menu.Item>
    <Menu.Item key="settings" icon={<SettingOutlined />}>Configurações</Menu.Item>
    <Menu.Divider />
    <Menu.Item key="logout" icon={<LogoutOutlined />}>Sair</Menu.Item>
  </Menu>
);

const App = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="dark">
        <div className="logo-vertical">
          <DesktopOutlined style={{ fontSize: '24px', color: '#fff' }}/>
          {!collapsed && <span className="logo-text">VR Sales</span>}
        </div>
        <Menu
          theme="dark"
          selectedKeys={[location.pathname]}
          mode="inline"
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout className="site-layout">
        <Header className="site-header">
          <Title level={4} style={{ color: 'rgba(255, 255, 255, 0.85)', margin: 0 }}>
            Painel de Controle
          </Title>
          <Dropdown overlay={userMenuItems}>
            <a onClick={(e) => e.preventDefault()} style={{color: 'white'}}>
              <Space>
                <Avatar style={{ backgroundColor: '#1890ff' }} icon={<UserOutlined />} />
                <span>Usuário</span>
              </Space>
            </a>
          </Dropdown>
        </Header>
        {/* CORREÇÃO AQUI: Adicionado overflow para permitir rolagem e ajustado o margin */}
        <Content style={{ margin: '16px', overflow: 'auto' }}>
          <div className="site-layout-background" style={{ padding: 24, minHeight: '100%' }}>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/products" element={<ProductPage />} />
              <Route path="/suppliers" element={<SupplierPage />} />
              <Route path="/expiration" element={<ExpirationControlPage />} /> 
            </Routes>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;