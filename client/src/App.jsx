import React, { useState, useMemo } from 'react';
import { Layout, Menu, Typography, Avatar, Space, Dropdown, message } from 'antd';
import {
  DesktopOutlined, PieChartOutlined, TeamOutlined, UserOutlined, SettingOutlined,
  LogoutOutlined, ShoppingCartOutlined, AppstoreOutlined, LineChartOutlined,
  GlobalOutlined, ShopOutlined, SafetyCertificateOutlined, CalendarOutlined,
  TableOutlined, RocketOutlined, FireOutlined, LayoutOutlined, BookOutlined
} from '@ant-design/icons';
import { Routes, Route, useNavigate, useLocation, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { motion } from 'framer-motion';

// Importe todas as suas páginas
import LoginPage from './pages/LoginPage';
import OpenCashRegisterPage from './pages/OpenCashRegisterPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import DashboardPage from './pages/DashboardPage';
import POSPage from './pages/POSPage';
import ProductPage from './pages/ProductPage';
import CustomerPage from './pages/CustomerPage';
import SupplierPage from './pages/SupplierPage';
import TableManagementPage from './pages/TableManagementPage';
import ExpirationControlPage from './pages/ExpirationControlPage';
import MarketingPage from './pages/MarketingPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';
import KDSPage from './pages/KDSPage';
import FloorPlanSettingsPage from './pages/FloorPlanSettingsPage';
import GlobalDashboardPage from './pages/superadmin/GlobalDashboardPage';
import StoresManagementPage from './pages/superadmin/StoresManagementPage';
import ReservationPage from './pages/ReservationPage';
import RoleBasedRoute from './components/RoleBasedRoute';

const { Header, Content, Sider } = Layout;
const { Text } = Typography;

// Definições dos menus
const storeMenuItems = [
    { label: 'Vendas e Operações', key: 'grp-sales', type: 'group', roles: ['admin', 'manager', 'cashier'],
      children: [
        { key: '/pos', icon: <ShoppingCartOutlined />, label: 'Frente de Caixa', roles: ['admin', 'manager', 'cashier'] },
        { key: '/tables', icon: <TableOutlined />, label: 'Gestão de Mesas', roles: ['admin', 'manager', 'cashier'] },
        { key: '/kds', icon: <FireOutlined />, label: 'Painel da Cozinha', roles: ['admin', 'manager'] },
      ],
    },
    { type: 'divider', roles: ['admin', 'manager'] },
    { label: 'Análise e Marketing', key: 'grp-analytics', type: 'group', roles: ['admin', 'manager'],
      children: [
        { key: '/dashboard', icon: <PieChartOutlined />, label: 'Análise da Loja', roles: ['admin', 'manager'] },
        { key: '/reservations', icon: <BookOutlined />, label: 'Reservas', roles: ['admin', 'manager'] },
        { key: '/reports', icon: <LineChartOutlined />, label: 'Relatórios', roles: ['admin', 'manager'] },
        { key: '/marketing', icon: <RocketOutlined />, label: 'Marketing', roles: ['admin', 'manager'] },
        { key: '/customers', icon: <UserOutlined />, label: 'Clientes', roles: ['admin', 'manager', 'cashier'] },
      ],
    },
    { type: 'divider', roles: ['admin', 'manager'] },
    { label: 'Gestão de Estoque', key: 'grp-management', type: 'group', roles: ['admin', 'manager'],
      children: [
        { key: '/products', icon: <AppstoreOutlined />, label: 'Produtos', roles: ['admin', 'manager'] },
        { key: '/suppliers', icon: <TeamOutlined />, label: 'Fornecedores', roles: ['admin', 'manager'] },
        { key: '/expiration', icon: <CalendarOutlined />, label: 'Validade', roles: ['admin', 'manager'] },
      ],
    },
    { type: 'divider', roles: ['admin'] },
    { label: 'Administração', key: 'grp-admin', type: 'group', roles: ['admin'],
      children: [
        { key: '/users', icon: <SafetyCertificateOutlined />, label: 'Usuários', roles: ['admin'] },
        { key: '/settings/floor-plan', icon: <LayoutOutlined />, label: 'Layout do Salão', roles: ['admin'] },
      ],
    },
];
const superAdminMenuItems = [
    { key: '/global-dashboard', icon: <GlobalOutlined />, label: 'Dashboard Global' },
    { key: '/users', icon: <SafetyCertificateOutlined />, label: 'Gestão de Usuários' },
    { key: '/stores', icon: <ShopOutlined />, label: 'Gerir Lojas' },
];

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleMenuClick = ({ key }) => {
    if (key === 'logout') {
      logout();
    } else {
      navigate(key);
    }
  };
  
  // CORREÇÃO: Estrutura do menu para o Dropdown
  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: 'Meu Perfil' },
    { key: 'settings', icon: <SettingOutlined />, label: 'Configurações' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Sair', danger: true },
  ];

  const accessibleMenuItems = useMemo(() => {
    if (!user) return [];
    const items = user.role === 'super_admin' ? superAdminMenuItems : storeMenuItems;
    return items.filter(item => !item.roles || item.roles.includes(user.role));
  }, [user]);

  if (!user) { return <Navigate to="/login" replace />; }

  if (location.pathname === '/') {
    return user.role === 'super_admin' ? <Navigate to="/global-dashboard" replace /> : <Navigate to="/dashboard" replace />;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="dark">
        <div style={{ height: '32px', margin: '16px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          {collapsed ? 'VR' : 'VR Sales'}
        </div>
        <Menu theme="dark" selectedKeys={[location.pathname]} mode="inline" items={accessibleMenuItems} onClick={handleMenuClick} />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          {/* CORREÇÃO: Usando a prop 'menu' em vez de 'overlay' */}
          <Dropdown menu={{ items: userMenuItems, onClick: handleMenuClick }} trigger={['click']}>
            <a onClick={(e) => e.preventDefault()} style={{ cursor: 'pointer' }}>
              <Space>
                <Avatar style={{ backgroundColor: '#1890ff' }} icon={<UserOutlined />} />
                <Text>{user.full_name || 'Usuário'}</Text>
              </Space>
            </a>
          </Dropdown>
        </Header>
        <Content style={{ margin: '16px', overflow: 'initial' }}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
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

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/open-cash-register" element={<OpenCashRegisterPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      
      <Route path="/" element={<MainLayout />}>
        {/* Rotas Super Admin */}
        <Route element={<RoleBasedRoute allowedRoles={['super_admin']} />}>
          <Route path="global-dashboard" element={<GlobalDashboardPage />} />
          <Route path="stores" element={<StoresManagementPage />} />
        </Route>
        
        {/* Rotas de Loja */}
        <Route element={<RoleBasedRoute allowedRoles={['admin', 'manager']} />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="products" element={<ProductPage />} />
          <Route path="suppliers" element={<SupplierPage />} />
          <Route path="expiration" element={<ExpirationControlPage />} />
          <Route path="marketing" element={<MarketingPage />} />
          <Route path="kds" element={<KDSPage />} />
          <Route path="reservations" element={<ReservationPage />} />
        </Route>
        <Route element={<RoleBasedRoute allowedRoles={['admin', 'manager', 'cashier']} />}>
          <Route path="customers" element={<CustomerPage />} />
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