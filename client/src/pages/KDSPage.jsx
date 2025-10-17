import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Row, Col, Typography, Tag, message, Spin, Empty, Button, Badge, Divider, Tooltip } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleOutlined, ClockCircleOutlined, FireOutlined, RollbackOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ApiService from '../api/ApiService';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/pt-br';

dayjs.extend(relativeTime);
dayjs.locale('pt-br');

const { Title, Text } = Typography;
const { Content } = Layout;

const PageStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    .kds-page-container { background-color: #f0f2f5; font-family: 'Inter', sans-serif; min-height: 100vh; }
    .kds-header { display: flex; justify-content: space-between; align-items: center; margin: 24px; padding: 20px 24px; background: linear-gradient(135deg, #e74c3c 0%, #f39c12 100%); border-radius: 16px; color: white; box-shadow: 0 10px 30px -10px rgba(231, 76, 60, 0.5); }
    .kds-header .ant-typography { color: white; text-shadow: 0 1px 3px rgba(0,0,0,0.2); }
    .kds-content { padding: 0 24px 24px 24px; }
    .order-card { background: #fff; border-radius: 12px; border: 1px solid #e8e8e8; box-shadow: 0 4px 12px rgba(0,0,0,0.08); position: relative; overflow: hidden; transition: all 0.3s ease; }
    .order-card:hover { transform: translateY(-5px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
    .order-card-status-bar { position: absolute; top: 0; left: 0; bottom: 0; width: 6px; }
    .order-card-status-bar.success { background: #2ecc71; }
    .order-card-status-bar.warning { background: #f39c12; }
    .order-card-status-bar.error { background: #e74c3c; }
    .card-title { display: flex; justify-content: space-between; align-items: center; }
    .order-card .ant-card-head { padding: 0 24px 0 30px; }
    .order-card .ant-card-body { padding: 8px 16px; }
    .order-item { display: flex; align-items: center; padding: 12px 8px; border-bottom: 1px solid #f0f0f0; }
    .order-item:last-child { border-bottom: none; }
    .order-item.status-ready { opacity: 0.6; }
    .order-item.status-ready .item-details { text-decoration: line-through; }
    .item-quantity { margin-right: 12px; }
    .item-details { flex-grow: 1; }
    .item-actions { margin-left: 16px; }
  `}</style>
);

const getOrderTimeStatus = (createdAt) => {
  const minutes = dayjs().diff(dayjs(createdAt), 'minute');
  if (minutes >= 15) return { color: 'red', text: `há ${minutes} min`, variant: 'error' };
  if (minutes >= 7) return { color: 'orange', text: `há ${minutes} min`, variant: 'warning' };
  return { color: 'green', text: `há ${minutes} min`, variant: 'success' };
};

const OrderCard = ({ order, onStatusChange }) => {
  const timeStatus = getOrderTimeStatus(order.created_at);
  const allItemsReady = order.items.every(item => item.status === 'ready');

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }} whileHover={{ y: -5 }}>
      <Card className="order-card" headStyle={{ padding: '0 24px 0 30px', borderBottom: '1px solid #f0f0f0' }} bodyStyle={{ padding: '8px 16px' }} title={
          <div className="card-title">
            <Title level={4} style={{ margin: 0 }}>Mesa {order.table?.number || 'Delivery'}</Title>
            <Tag icon={<ClockCircleOutlined />} color={timeStatus.color}>{timeStatus.text}</Tag>
          </div>
        }
      >
        <div className={`order-card-status-bar ${timeStatus.variant}`} />
        <div className="order-items-list">
          {order.items.map(item => (
            <motion.div key={item.id} layout className={`order-item status-${item.status}`}>
              <div className="item-quantity"><Badge count={item.quantity} style={{ backgroundColor: '#1890ff' }} /></div>
              <div className="item-details">
                <Text strong>{item.product.name}</Text>
                {item.notes && <Text type="secondary" italic>- {item.notes}</Text>}
              </div>
              <div className="item-actions">
                {item.status === 'pending' && <Tooltip title="Começar Preparo"><Button type="primary" shape="circle" icon={<PlayCircleOutlined />} onClick={() => onStatusChange(order.id, item.id, 'preparing')} /></Tooltip>}
                {item.status === 'preparing' && <Tooltip title="Marcar como Pronto"><Button type="primary" shape="circle" icon={<CheckCircleOutlined />} style={{ background: '#f39c12', borderColor: '#f39c12' }} onClick={() => onStatusChange(order.id, item.id, 'ready')} /></Tooltip>}
                {item.status === 'ready' && <Tag icon={<CheckCircleOutlined />} color="success">Pronto</Tag>}
              </div>
            </motion.div>
          ))}
        </div>
        {!allItemsReady && (
          <>
            <Divider style={{ margin: '0' }} />
            <div style={{ padding: '12px' }}>
              <Button type="dashed" block onClick={() => onStatusChange(order.id, null, 'ready_all')}>Marcar Tudo como Pronto</Button>
            </div>
          </>
        )}
      </Card>
    </motion.div>
  );
};

const KDSPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchKitchenOrders = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) setLoading(true);
    try {
      const response = await ApiService.get('/orders/kitchen'); // Assumindo que esta rota existe
      setOrders(response.data);
    } catch {
      message.error('Erro ao buscar pedidos da cozinha.');
    } finally {
      if (isInitialLoad) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKitchenOrders(true);
    const interval = setInterval(() => fetchKitchenOrders(false), 10000);
    return () => clearInterval(interval);
  }, [fetchKitchenOrders]);

  const handleStatusChange = async (orderId, itemId, newStatus) => {
    try {
      if (newStatus === 'ready_all') {
        const orderToUpdate = orders.find(o => o.id === orderId);
        if (orderToUpdate) {
          const updatePromises = orderToUpdate.items.filter(item => item.status !== 'ready').map(item => 
            ApiService.patch(`/orders/items/${item.id}/status`, { status: 'ready' })
          );
          await Promise.all(updatePromises);
        }
      } else {
        await ApiService.patch(`/orders/items/${itemId}/status`, { status: newStatus });
      }
      message.success('Status atualizado!');
      fetchKitchenOrders(false);
    } catch {
      message.error('Falha ao atualizar o status.');
    }
  };
  
  const activeOrders = orders.filter(order => !order.items.every(item => item.status === 'ready'));

  if (loading) {
    return <Spin tip="Carregando pedidos..." size="large" fullscreen />;
  }

  return (
    <>
      <PageStyles />
      <Layout className="kds-layout">
        <Content className="kds-page-container">
          <div className="kds-header">
            <Title level={2} style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FireOutlined /> Painel da Cozinha
            </Title>
            <Tooltip title="Voltar ao sistema principal">
              <Button type="primary" ghost shape="circle" icon={<RollbackOutlined />} onClick={() => navigate('/')} />
            </Tooltip>
          </div>

          <AnimatePresence>
            {activeOrders.length > 0 ? (
              <Row gutter={[24, 24]}>
                {activeOrders.map(order => (
                  <Col key={order.id} xs={24} sm={12} md={8} lg={6}>
                    <OrderCard order={order} onStatusChange={handleStatusChange} />
                  </Col>
                ))}
              </Row>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', paddingTop: '15vh' }}>
                <Empty description={<Title level={4} style={{ color: '#555' }}>Nenhum pedido na fila. Cozinha em dia!</Title>} />
              </motion.div>
            )}
          </AnimatePresence>
        </Content>
      </Layout>
    </>
  );
};

export default KDSPage;