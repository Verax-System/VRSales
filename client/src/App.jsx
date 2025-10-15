import React, { useState, useMemo } from 'react';
import { Layout, Menu, Typography, Avatar, Space, Dropdown } from 'antd';
import {
  DesktopOutlined, AppstoreOutlined, AreaChartOutlined, UserOutlined, SettingOutlined,
  LogoutOutlined, TeamOutlined, CalendarOutlined, BarcodeOutlined, TableOutlined,
  LineChartOutlined, SafetyCertificateOutlined, FireOutlined, RocketOutlined,
  LayoutOutlined, GlobalOutlined, ShopOutlined
} from '@ant-design/icons';
import { Routes, Route, useNavigate, useLocation, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { motion } from 'framer-motion';

// Importação de Páginas (assumindo que estas páginas serão criadas)
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
import OpenCashRegisterPage from './pages/OpenCashRegisterPage';
import GlobalDashboardPage from './pages/superadmin/GlobalDashboardPage'; // Nova página
import StoresManagementPage from './pages/superadmin/StoresManagementPage'; // Nova página

// Remova App.css se não for mais necessário ou limpe o seu conteúdo
// import './App.css';

const { Header, Content, Sider } = Layout;

// Definição dos itens de menu para cada tipo de utilizador
const storeMenuItems = [
    { key: '/pos', icon: <BarcodeOutlined />, label: 'Frente de Caixa', roles: ['admin', 'manager', 'cashier'] },
    { key: '/tables', icon: <TableOutlined />, label: 'Gestão de Mesas', roles: ['admin', 'manager', 'cashier'] },
    { key: '/kds', icon: <FireOutlined />, label: 'Painel da Cozinha', roles: ['admin', 'manager'] },
    { type: 'divider', roles: ['admin', 'manager'] },
    { key: '/', icon: <AreaChartOutlined />, label: 'Análise da Loja', roles: ['admin', 'manager'] },
    { key: '/reports', icon: <LineChartOutlined />, label: 'Relatórios', roles: ['admin', 'manager'] },
    { key: '/marketing', icon: <RocketOutlined />, label: 'Marketing', roles: ['admin', 'manager'] },
    { type: 'divider', roles: ['admin', 'manager'] },
    { key: '/products', icon: <AppstoreOutlined />, label: 'Produtos', roles: ['admin', 'manager'] },
    { key: '/suppliers', icon: <TeamOutlined />, label: 'Fornecedores', roles: ['admin', 'manager'] },
    { key: '/expiration', icon: <CalendarOutlined />, label: 'Validade', roles: ['admin', 'manager'] },
    { type: 'divider', roles: ['admin'] },
    { key: '/users', icon: <SafetyCertificateOutlined />, label: 'Utilizadores', roles: ['admin'] },
    { key: '/settings/floor-plan', icon: <LayoutOutlined />, label: 'Layout do Salão', roles: ['admin'] },
];

const superAdminMenuItems = [
    { key: '/global-dashboard', icon: <GlobalOutlined />, label: 'Dashboard Global' },
    { key: '/stores', icon: <ShopOutlined />, label: 'Gerir Lojas' },
];

// Componente de Layout Principal (para utilizadores de loja e super admins)
const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const accessibleMenuItems = useMemo(() => {
    if (!user) return [];
    
    const items = user.role === 'super_admin' ? superAdminMenuItems : storeMenuItems;
    
    // Filtra com base na role para os menus de loja
    return items.filter(item => !item.roles || item.roles.includes(user.role));
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
  
  // Redireciona para o dashboard correto após o login
  if (location.pathname === '/') {
    if (user.role === 'super_admin') {
      return <Navigate to="/global-dashboard" replace />;
    }
    // O dashboard padrão '/' é para os outros utilizadores
  }


  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="dark" className="!bg-gray-900">
        <div className="flex items-center justify-center h-16 text-white text-xl">
          <DesktopOutlined className="transition-all" style={{ fontSize: collapsed ? '24px' : '20px' }} />
          {!collapsed && <span className="ml-2 font-semibold">VR Sales</span>}
        </div>
        <Menu theme="dark" selectedKeys={[location.pathname]} mode="inline" items={accessibleMenuItems} onClick={handleMenuClick} className="!bg-gray-900" />
      </Sider>
      <Layout>
        <Header className="bg-white shadow-sm flex items-center justify-end px-6">
          <Dropdown overlay={userMenuItems} trigger={['click']}>
            <a onClick={(e) => e.preventDefault()} className="cursor-pointer">
              <Space>
                <Avatar style={{ backgroundColor: '#1890ff' }} icon={<UserOutlined />} />
                <span className="text-gray-700">{user.name}</span>
              </Space>
            </a>
          </Dropdown>
        </Header>
        <Content className="m-4 overflow-auto">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Outlet />
            </motion.div>
        </Content>
      </Layout>
    </Layout>
  );
};

// Componente Principal da Aplicação
const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/open-cash-register" element={<OpenCashRegisterPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      
      {/* Rotas de Layout Principal */}
      <Route path="/" element={<MainLayout />}>
        {/* Rotas do Super Admin */}
        <Route element={<RoleBasedRoute allowedRoles={['super_admin']} />}>
          <Route path="global-dashboard" element={<GlobalDashboardPage />} />
          <Route path="stores" element={<StoresManagementPage />} />
        </Route>
        
        {/* Rotas de Admin/Manager */}
        <Route element={<RoleBasedRoute allowedRoles={['admin', 'manager']} />}>
          <Route index element={<DashboardPage />} /> {/* Página inicial para admins de loja */}
          <Route path="reports" element={<ReportsPage />} />
          <Route path="products" element={<ProductPage />} />
          <Route path="suppliers" element={<SupplierPage />} />
          <Route path="expiration" element={<ExpirationControlPage />} />
          <Route path="marketing" element={<MarketingPage />} />
          <Route path="kds" element={<KDSPage />} />
        </Route>

        {/* Rotas de Admin */}
        <Route element={<RoleBasedRoute allowedRoles={['admin']} />}>
          <Route path="users" element={<UsersPage />} />
          <Route path="settings/floor-plan" element={<FloorPlanSettingsPage />} />
        </Route>

        {/* Rotas de Caixa/Operador */}
        <Route element={<RoleBasedRoute allowedRoles={['admin', 'manager', 'cashier']} />}>
          <Route path="pos" element={<POSPage />} />
          <Route path="tables" element={<TableManagementPage />} />
        </Route>

        {/* Rota de fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default App;