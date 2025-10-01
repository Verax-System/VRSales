import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Spin, Alert, List, Avatar } from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  DollarCircleOutlined,
  BarChartOutlined
} from '@ant-design/icons';
// ApiService não é mais necessário aqui por enquanto, pois usaremos dados estáticos.
// import ApiService from '../api/ApiService';

const { Title, Text } = Typography;

// --- DADOS ESTÁTICOS PARA DEMONSTRAÇÃO ---

// Mock para os cartões de KPI
const mockStats = {
  total_sales: 126560.00,
  visits: 8846,
  payments: 6560,
  operational_effect: 78,
};

// Mock para o ranking de produtos
const mockRanking = [
    { product_name: 'Produto Exemplo 1', total_quantity_sold: 120, total_revenue: 12000.50 },
    { product_name: 'Produto Exemplo 2', total_quantity_sold: 110, total_revenue: 9500.00 },
    { product_name: 'Produto Exemplo 3', total_quantity_sold: 98, total_revenue: 8750.75 },
    { product_name: 'Produto Exemplo 4', total_quantity_sold: 85, total_revenue: 7600.00 },
    { product_name: 'Produto Exemplo 5', total_quantity_sold: 72, total_revenue: 6500.25 },
];


const DashboardPage = () => {
  // O estado agora é controlado com os dados estáticos.
  const [stats, setStats] = useState(mockStats);
  const [ranking, setRanking] = useState(mockRanking);
  const [loading, setLoading] = useState(false); // Definido como false
  const [error, setError] = useState(null);

  // O useEffect para buscar dados foi removido por enquanto para evitar o erro.
  // Ele será reativado quando o login for implementado.

  if (loading) {
    return <Spin size="large" style={{ display: 'block', marginTop: '50px' }} />;
  }

  // O container do erro foi ajustado para evitar quebra de layout
  if (error) {
    return (
        <div style={{ padding: '20px' }}>
            <Alert message="Erro" description={error} type="error" showIcon />
        </div>
    );
  }

  return (
    <div style={{ padding: '0 16px' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>Análise Geral</Title>
      
      {/* KPI Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={12} lg={6}>
          <Card>
            <Statistic
              title="Total de Vendas"
              value={stats.total_sales}
              precision={2}
              prefix="R$"
              valueStyle={{ color: '#3f8600', fontSize: '1.5rem' }}
              suffix={<ArrowUpOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={12} lg={6}>
          <Card>
            <Statistic
              title="Visitas"
              value={stats.visits}
              valueStyle={{ color: '#333', fontSize: '1.5rem' }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={12} lg={6}>
          <Card>
            <Statistic
              title="Pagamentos"
              value={stats.payments}
              valueStyle={{ color: '#333', fontSize: '1.5rem' }}
              prefix={<DollarCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={12} lg={6}>
          <Card>
            <Statistic
              title="Eficiência Operacional"
              value={stats.operational_effect}
              valueStyle={{ color: '#333', fontSize: '1.5rem' }}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>

      {/* Sales Trend and Ranking */}
      <Card title="Tendência de Vendas">
         <Row gutter={[24, 24]}>
            <Col xs={24} lg={16}>
                <Title level={5}>Vendas Mensais</Title>
                {/* Placeholder para o gráfico */}
                <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa', borderRadius: '8px' }}>
                    <BarChartOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                    <Text type="secondary" style={{ marginLeft: 16, fontSize: '16px' }}>Área reservada para o gráfico de barras</Text>
                </div>
            </Col>
            <Col xs={24} lg={8}>
                <Title level={5}>Ranking de Produtos</Title>
                 <List
                    itemLayout="horizontal"
                    dataSource={ranking}
                    renderItem={(item, index) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={<Avatar style={{ backgroundColor: index < 3 ? '#1890ff' : '#d9d9d9', color: index < 3 ? '#fff' : '#555' }}>{index + 1}</Avatar>}
                          title={<a href="#">{item.product_name}</a>}
                          description={`Vendidos: ${item.total_quantity_sold}`}
                        />
                        <div>R$ {item.total_revenue.toFixed(2).replace('.', ',')}</div>
                      </List.Item>
                    )}
                  />
            </Col>
         </Row>
      </Card>
    </div>
  );
};

export default DashboardPage;