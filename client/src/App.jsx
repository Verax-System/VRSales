import React from 'react';
import { Layout, Menu } from 'antd';
import ProductPage from './pages/ProductPage';
import './App.css';

const { Header, Content, Footer } = Layout;

function App() {
  return (
    <Layout className="layout">
      <Header>
        <div className="logo" />
        <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['1']}>
          <Menu.Item key="1">Produtos</Menu.Item>
          {/* Adicione outros itens de menu aqui no futuro (Vendas, Clientes, etc) */}
        </Menu>
      </Header>
      <Content style={{ padding: '0 50px' }}>
        <div className="site-layout-content" style={{ padding: 24, minHeight: 280, background: '#fff' }}>
          <h1>Gestão de Vendas</h1>
          <ProductPage />
        </div>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        VR Sales ©2025 Criado com Ant Design
      </Footer>
    </Layout>
  );
}

export default App;