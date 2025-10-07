import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Row, Col, Card, Typography, Tag, message, Spin, Empty, Button, Badge, Divider, Tooltip } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, FireOutlined, RollbackOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ApiService from '../api/ApiService';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/pt-br';
import './KDSPage.css';

dayjs.extend(relativeTime);
dayjs.locale('pt-br');

const { Title, Text } = Typography;
const { Header, Content } = Layout;

// Função para calcular há quanto tempo o pedido foi feito e definir a cor
const getOrderTimeStatus = (createdAt) => {
  const now = dayjs();
  const orderedAt = dayjs(createdAt);
  const minutes = now.diff(orderedAt, 'minute');

  if (minutes >= 15) {
    return { color: 'error', text: `há ${minutes} min` }; // Vermelho
  }
  if (minutes >= 7) {
    return { color: 'warning', text: `há ${minutes} min` }; // Laranja
  }
  return { color: 'success', text: `há ${minutes} min` }; // Verde/Azul
};

const OrderCard = ({ order, onStatusChange }) => {
  const timeStatus = getOrderTimeStatus(order.created_at);

  return (
    <Card
      className="order-card"
      title={
        <div className="card-title">
          <Text strong>Mesa {order.table_number || 'Delivery'}</Text>
          <Tag icon={<ClockCircleOutlined />} color={timeStatus.color}>
            {timeStatus.text}
          </Tag>
        </div>
      }
      bordered={false}
    >
      <div className="order-items-list">
        {order.items.map(item => (
          <div key={item.id} className={`order-item status-${item.status}`}>
            <div className="item-quantity">
              <Badge count={item.quantity} style={{ backgroundColor: '#1890ff' }} />
            </div>
            <div className="item-details">
              <Text strong>{item.product.name}</Text>
              {item.notes && <Text type="secondary" italic>- {item.notes}</Text>}
            </div>
            <div className="item-actions">
                {item.status === 'pending' && (
                    <Button
                        type="primary"
                        icon={<FireOutlined />}
                        onClick={() => onStatusChange(order.id, item.id, 'preparing')}
                    >
                        Preparar
                    </Button>
                )}
                {item.status === 'preparing' && (
                     <Button
                        className="ready-button"
                        icon={<CheckCircleOutlined />}
                        onClick={() => onStatusChange(order.id, item.id, 'ready')}
                    >
                        Pronto
                    </Button>
                )}
                 {item.status === 'ready' && (
                     <Tag icon={<CheckCircleOutlined />} color="success">Pronto</Tag>
                )}
            </div>
          </div>
        ))}
      </div>
      <Divider style={{margin: '12px 0'}}/>
       <Button
            type="primary"
            ghost
            block
            onClick={() => onStatusChange(order.id, null, 'ready_all')}
            disabled={order.items.every(item => item.status === 'ready')}
        >
            Marcar Pedido Completo como Pronto
        </Button>
    </Card>
  );
};


const KDSPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchKitchenOrders = useCallback(async () => {
    // Não mostra o Spin nas atualizações, apenas no carregamento inicial
    // setLoading(true);
    try {
      const response = await ApiService.getKitchenOrders();
      setOrders(response.data);
    } catch (error) {
      message.error('Erro ao buscar pedidos da cozinha.');
    } finally {
       if (loading) setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    fetchKitchenOrders();
    // Atualiza os pedidos a cada 10 segundos
    const interval = setInterval(fetchKitchenOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchKitchenOrders]);

const handleStatusChange = async (orderId, itemId, newStatus) => {
    try {
        if (newStatus === 'ready_all') {
            // Lógica para marcar todos os itens como prontos
            const orderToUpdate = orders.find(o => o.id === orderId);
            if (orderToUpdate) {
                // Cria uma lista de promessas para atualizar cada item
                const updatePromises = orderToUpdate.items
                    .filter(item => item.status !== 'ready')
                    .map(item => ApiService.updateOrderItemStatus(item.id, 'ready'));
                
                await Promise.all(updatePromises);
            }
        } else {
            // Lógica para um único item
            await ApiService.updateOrderItemStatus(itemId, newStatus);
        }
        message.success('Status atualizado!');
        fetchKitchenOrders(); // Recarrega os dados da API
    } catch (error) {
        message.error('Falha ao atualizar o status.');
    }
};

  if (loading) {
    return <Spin tip="Carregando pedidos..." size="large" fullscreen />;
  }

  return (
    <Layout className="kds-layout">
      <Header className="kds-header">
        <Title level={3} style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FireOutlined /> Painel da Cozinha (KDS)
        </Title>
         <Tooltip title="Voltar ao sistema principal">
            <Button
                type="primary"
                shape="circle"
                icon={<RollbackOutlined />}
                onClick={() => navigate('/')}
            />
        </Tooltip>
      </Header>
      <Content className="kds-content">
        {orders.length > 0 ? (
          <Row gutter={[16, 16]}>
            {orders.map(order => (
              <Col key={order.id} xs={24} sm={12} md={8} lg={6}>
                <OrderCard order={order} onStatusChange={handleStatusChange} />
              </Col>
            ))}
          </Row>
        ) : (
          <div style={{ textAlign: 'center', paddingTop: '100px' }}>
            <Empty description={<Title level={4}>Nenhum pedido pendente.</Title>} />
          </div>
        )}
      </Content>
    </Layout>
  );
};

export default KDSPage;