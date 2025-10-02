import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Spin, Alert, List, Avatar, Tag } from 'antd';
import {
  ArrowUpOutlined,
  WarningOutlined,
  ShoppingOutlined,
  UserOutlined,
  DollarCircleOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import ApiService from '../api/ApiService'; // Importe o ApiService

const { Title, Text } = Typography;

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]); // Novo estado
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use Promise.all para buscar todos os dados em paralelo
        const [salesResponse, rankingResponse, lowStockResponse] = await Promise.all([
          ApiService.getSalesByPeriod('2025-01-01', '2025-12-31'), // Use datas dinâmicas no futuro
          ApiService.getTopSellingProducts(5),
          ApiService.getLowStockProducts()
        ]);
        
        setStats(salesResponse.data);
        setRanking(rankingResponse.data);
        setLowStockProducts(lowStockResponse.data);

      } catch (err) {
        setError('Falha ao buscar os dados do dashboard. Verifique a conexão com a API.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);


  if (loading) {
    return <Spin size="large" style={{ display: 'block', marginTop: '50px' }} />;
  }

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
      
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={12} lg={6}>
          <Card>
            <Statistic
              title="Total de Vendas"
              value={stats?.total_sales_amount || 0}
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
              title="Nº de Transações"
              value={stats?.number_of_transactions || 0}
              valueStyle={{ color: '#333', fontSize: '1.5rem' }}
              prefix={<ShoppingOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={12} lg={6}>
          <Card>
            <Statistic
              title="Ticket Médio"
              value={stats?.average_ticket || 0}
              precision={2}
              prefix="R$"
              valueStyle={{ color: '#333', fontSize: '1.5rem' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={12} lg={6}>
            {/* NOVO CARD DE ALERTA */}
            <Card bodyStyle={{ background: lowStockProducts.length > 0 ? '#fffbe6' : 'inherit' }}>
                <Statistic
                title="Alertas de Estoque Baixo"
                value={lowStockProducts.length}
                valueStyle={{ color: lowStockProducts.length > 0 ? '#d46b08' : '#333', fontSize: '1.5rem' }}
                prefix={<WarningOutlined />}
                />
            </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* Card de Ranking de Produtos */}
        <Col xs={24} lg={12}>
            <Card title="Ranking de Produtos Mais Vendidos">
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
            </Card>
        </Col>
        
        {/* NOVO CARD COM A LISTA DE PRODUTOS COM ESTOQUE BAIXO */}
        <Col xs={24} lg={12}>
            <Card title="Produtos com Estoque Baixo">
                <List
                    itemLayout="horizontal"
                    dataSource={lowStockProducts}
                    renderItem={(item) => (
                        <List.Item>
                        <List.Item.Meta
                            avatar={<Avatar icon={<ShoppingOutlined />} />}
                            title={<a href={`/products`}>{item.name}</a>}
                            description={`Nível mínimo: ${item.low_stock_threshold}`}
                        />
                        <div>
                            <Tag color={item.stock === 0 ? 'error' : 'warning'}>
                                Apenas {item.stock} em estoque
                            </Tag>
                        </div>
                        </List.Item>
                    )}
                />
            </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;