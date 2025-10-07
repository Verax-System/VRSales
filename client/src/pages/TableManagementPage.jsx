import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Typography, Tag, Modal, Button, message, Spin, Empty, List, Avatar, Divider, Form, Input, Popconfirm, Space } from 'antd';
import { TableOutlined, PlusOutlined, DollarCircleOutlined, CloseCircleOutlined, QuestionCircleOutlined, EditOutlined } from '@ant-design/icons';
import ApiService from '../api/ApiService';
import dayjs from 'dayjs';
import AddItemModal from '../components/AddItemModal';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const TableManagementPage = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOrderModalVisible, setIsOrderModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [addForm] = Form.useForm();
  const [isAddItemModalVisible, setIsAddItemModalVisible] = useState(false);
  const navigate = useNavigate();
  const [isConfirmOpenModalVisible, setIsConfirmOpenModalVisible] = useState(false);
  const [tableToOpen, setTableToOpen] = useState(null);

  const fetchTables = useCallback(async () => {
    try {
      const response = await ApiService.getTables();
      setTables(response.data);
    } catch (error) {
      message.error('Erro ao carregar mesas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchTables();
    const interval = setInterval(fetchTables, 15000);
    return () => clearInterval(interval);
  }, [fetchTables]);

  const groupedOrderItems = useMemo(() => {
    if (!selectedOrder?.items) return [];
    const itemsMap = new Map();
    selectedOrder.items.forEach(item => {
      const key = item.product_id;
      if (itemsMap.has(key)) {
        const existingItem = itemsMap.get(key);
        existingItem.quantity += item.quantity;
      } else {
        itemsMap.set(key, { ...item });
      }
    });
    return Array.from(itemsMap.values());
  }, [selectedOrder]);

  const handleTableClick = async (table) => {
    if (table.status === 'available') {
      setTableToOpen(table);
      setIsConfirmOpenModalVisible(true);
    } else if (table.status === 'occupied') {
      setModalLoading(true);
      try {
        const response = await ApiService.getOpenOrderByTable(table.id);
        setSelectedOrder(response.data);
        setIsOrderModalVisible(true);
      } catch (error) {
        message.error('Não foi possível carregar a comanda desta mesa.');
      } finally {
        setModalLoading(false);
      }
    }
  };

  const handleConfirmOpenOrder = async () => {
    if (!tableToOpen) return;
    setIsConfirmOpenModalVisible(false);
    setModalLoading(true);
    try {
      message.loading({ content: 'Abrindo comanda...', key: 'opening_order' });
      const response = await ApiService.createOrderForTable({ table_id: tableToOpen.id });
      setSelectedOrder(response.data);
      setIsOrderModalVisible(true);
      fetchTables();
      message.success({ content: `Comanda aberta para a Mesa ${tableToOpen.number}!`, key: 'opening_order' });
    } catch (error) {
      message.error({ content: error.response?.data?.detail || 'Erro ao abrir comanda.', key: 'opening_order' });
    } finally {
      setModalLoading(false);
      setTableToOpen(null);
    }
  };

  const showAddModal = () => setIsAddModalVisible(true);
  const handleAddCancel = () => {
    setIsAddModalVisible(false);
    addForm.resetFields();
  };
  const handleAddSubmit = async (values) => {
    setModalLoading(true);
    try {
      await ApiService.createTable({ number: values.number });
      message.success(`Mesa "${values.number}" criada com sucesso!`);
      handleAddCancel();
      fetchTables();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Erro ao criar a mesa.');
    } finally {
      setModalLoading(false);
    }
  };

  const refreshSelectedOrder = async () => {
    if (!selectedOrder) return;
    try {
      const response = await ApiService.getOpenOrderByTable(selectedOrder.table_id);
      setSelectedOrder(response.data);
    } catch (error) {
      message.error('Não foi possível atualizar a comanda.');
    }
  };

  const getStatusProps = (status) => {
    switch (status) {
      case 'occupied': return { color: 'error', label: 'Ocupada' };
      case 'reserved': return { color: 'warning', label: 'Reservada' };
      case 'available': return { color: 'success', label: 'Livre' };
      default: return { color: 'default', label: 'Desconhecido' };
    }
  };

  const handleGoToPayment = () => {
    if (!selectedOrder || selectedOrder.items.length === 0) {
      message.warning('Adicione pelo menos um item à comanda antes de ir para o pagamento.');
      return;
    }
    const itemsForPOS = groupedOrderItems.map(item => ({
      ...item.product,
      id: item.product_id,
      quantity: item.quantity,
      price: item.price_at_order,
    }));
    navigate('/pos', { state: { orderItems: itemsForPOS, fromTable: true } });
  };
  
  const handleCancelOrder = async () => {
    if (!selectedOrder) return;
    setModalLoading(true);
    try {
      await ApiService.cancelOrder(selectedOrder.id);
      message.success('Comanda cancelada com sucesso!');
      setIsOrderModalVisible(false);
      setSelectedOrder(null);
      fetchTables();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Erro ao cancelar a comanda.');
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return <Spin tip="Carregando mesas..." size="large" style={{ display: 'block', marginTop: 50 }} />;
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}><TableOutlined /> Gestão de Mesas</Title>
        <Space>
          <Button icon={<PlusOutlined />} onClick={showAddModal}>Adicionar Mesa</Button>
          <Button type="default" icon={<EditOutlined />} onClick={() => navigate('/settings/floor-plan')}>
            Editar Layout
          </Button>
        </Space>
      </div>
      
      <div style={{
        position: 'relative',
        height: '75vh',
        backgroundColor: '#fafafa',
        border: '1px solid #f0f0f0',
        borderRadius: '8px',
        padding: '16px'
      }}>
        {tables.length > 0 ? (
          tables.map(table => {
            const status = getStatusProps(table.status);
            return (
              <div
                key={table.id}
                style={{
                  position: 'absolute',
                  left: `${table.pos_x}px`,
                  top: `${table.pos_y}px`,
                  width: 120,
                  zIndex: 1
                }}
              >
                <Card hoverable onClick={() => handleTableClick(table)} bodyStyle={{ padding: 0 }}>
                  <div style={{ padding: '16px', textAlign: 'center' }}>
                    <Title level={4} style={{ margin: 0 }}>{table.number}</Title>
                  </div>
                  <div style={{ padding: '8px', textAlign: 'center', borderTop: '1px solid #f0f0f0', backgroundColor: status.color === 'success' ? '#f6ffed' : status.color === 'error' ? '#fff1f0' : '#fffbe6' }}>
                    <Tag color={status.color}>{status.label}</Tag>
                  </div>
                </Card>
              </div>
            );
          })
        ) : (
          <Empty description="Nenhuma mesa cadastrada. Adicione uma mesa ou edite o layout para começar." style={{ paddingTop: '25vh' }}/>
        )}
      </div>

      <Modal
        title="Confirmar Ação"
        open={isConfirmOpenModalVisible}
        onOk={handleConfirmOpenOrder}
        onCancel={() => { setIsConfirmOpenModalVisible(false); setTableToOpen(null); }}
        okText="Sim, Abrir Comanda"
        cancelText="Não"
        confirmLoading={modalLoading}
      >
        <Space align="center">
            <QuestionCircleOutlined style={{color: '#faad14', fontSize: '22px'}}/>
            <Text>Deseja abrir uma nova comanda na Mesa <strong>{tableToOpen?.number}</strong>?</Text>
        </Space>
      </Modal>

      <Modal
        title={`Comanda - Mesa ${selectedOrder?.table_id ? tables.find(t => t.id === selectedOrder.table_id)?.number : ''}`}
        open={isOrderModalVisible}
        onCancel={() => setIsOrderModalVisible(false)}
        width={600}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Popconfirm
              title="Cancelar Comanda?"
              description="Esta ação não pode ser desfeita e a mesa será liberada."
              onConfirm={handleCancelOrder}
              okText="Sim, Cancelar"
              cancelText="Não"
              placement="top"
            >
              <Button danger icon={<CloseCircleOutlined />}>
                Cancelar Comanda
              </Button>
            </Popconfirm>
            <Space>
              <Button key="add" type="dashed" onClick={() => setIsAddItemModalVisible(true)}>Adicionar Item</Button>
              <Button key="pay" type="primary" icon={<DollarCircleOutlined />} onClick={handleGoToPayment}>Finalizar e Pagar</Button>
            </Space>
          </div>
        }
      >
        {modalLoading || !selectedOrder ? <Spin /> : (
          <div>
            <Text type="secondary">Aberta em: {dayjs(selectedOrder.created_at).format('DD/MM/YYYY HH:mm')}</Text>
            <Divider />
            <List
              itemLayout="horizontal"
              dataSource={groupedOrderItems}
              locale={{ emptyText: "Nenhum item na comanda." }}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar>{item.quantity}x</Avatar>}
                    title={item.product?.name || 'Produto não encontrado'}
                    description={`R$ ${item.price_at_order.toFixed(2)}`}
                  />
                  <div>R$ {(item.price_at_order * item.quantity).toFixed(2)}</div>
                </List.Item>
              )}
            />
             <Divider />
             <div style={{ textAlign: 'right' }}>
                <Title level={4}>Total: R$ {selectedOrder.items.reduce((acc, item) => acc + item.price_at_order * item.quantity, 0).toFixed(2)}</Title>
             </div>
          </div>
        )}
      </Modal>

      <Modal
        title="Adicionar Nova Mesa"
        open={isAddModalVisible}
        onCancel={handleAddCancel}
        onOk={addForm.submit}
        confirmLoading={modalLoading}
        okText="Salvar"
        cancelText="Cancelar"
      >
        <Form form={addForm} layout="vertical" onFinish={handleAddSubmit} name="add_table_form">
          <Form.Item name="number" label="Número ou Nome da Mesa" rules={[{ required: true, message: 'Por favor, insira o número/nome da mesa!' }]}>
            <Input placeholder="Ex: 01, Varanda 2, etc." />
          </Form.Item>
        </Form>
      </Modal>

      {selectedOrder && (
        <AddItemModal
          open={isAddItemModalVisible}
          onCancel={() => setIsAddItemModalVisible(false)}
          orderId={selectedOrder.id}
          onSuccess={() => { setIsAddItemModalVisible(false); refreshSelectedOrder(); }}
        />
      )}
    </>
  );
};

export default TableManagementPage;