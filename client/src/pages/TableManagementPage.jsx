import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Row, Col, Typography, Tag, Modal, Button, message, Spin, Empty, List, Avatar, Divider, Form, Input } from 'antd';
import { TableOutlined, PlusOutlined, DollarCircleOutlined } from '@ant-design/icons';
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

  // Função para buscar e atualizar a lista de mesas
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
    const interval = setInterval(fetchTables, 15000); // Atualiza a cada 15 segundos
    return () => clearInterval(interval);
  }, [fetchTables]);

  // Agrupa os itens do pedido por produto
  const groupedOrderItems = useMemo(() => {
    if (!selectedOrder?.items) return [];

    const itemsMap = new Map();
    selectedOrder.items.forEach(item => {
      // Uma chave única para o item, considerando o produto.
      // Futuramente, pode incluir adicionais para agrupar "Coca com Gelo" separado de "Coca sem Gelo".
      const key = item.product_id;
      
      if (itemsMap.has(key)) {
        // Se o item já existe, apenas soma a quantidade
        const existingItem = itemsMap.get(key);
        existingItem.quantity += item.quantity;
      } else {
        // Se não existe, adiciona uma cópia ao Map
        itemsMap.set(key, { ...item });
      }
    });

    return Array.from(itemsMap.values());
  }, [selectedOrder]);


  // Função central que lida com o clique em QUALQUER mesa
  const handleTableClick = async (table) => {
    setModalLoading(true);
    
    if (table.status === 'available') {
      // Se a mesa está livre, cria uma nova comanda e abre o modal
      try {
        message.loading({ content: 'Abrindo comanda...', key: 'opening_order' });
        const response = await ApiService.createOrderForTable({ table_id: table.id });
        setSelectedOrder(response.data);
        setIsOrderModalVisible(true);
        fetchTables(); // Atualiza o status da mesa para "Ocupada"
        message.success({ content: `Comanda aberta para a Mesa ${table.number}!`, key: 'opening_order' });
      } catch (error) {
        message.error({ content: error.response?.data?.detail || 'Erro ao abrir comanda.', key: 'opening_order' });
      }
    } else if (table.status === 'occupied') {
      // Se a mesa está ocupada, busca a comanda existente e abre o modal
      try {
        const response = await ApiService.getOpenOrderByTable(table.id);
        setSelectedOrder(response.data);
        setIsOrderModalVisible(true);
      } catch (error) {
        message.error('Não foi possível carregar a comanda desta mesa.');
      }
    }
    
    setModalLoading(false);
  };

  // Funções para o modal de ADICIONAR MESA
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

  // Função para atualizar o modal da comanda após adicionar um item
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


  if (loading) {
    return <Spin tip="Carregando mesas..." size="large" style={{ display: 'block', marginTop: 50 }} />;
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}><TableOutlined /> Gestão de Mesas</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>Adicionar Mesa</Button>
      </div>
      
      {tables.length > 0 ? (
        <Row gutter={[16, 16]}>
          {tables.map(table => {
            const status = getStatusProps(table.status);
            return (
              <Col xs={12} sm={8} md={6} lg={4} key={table.id}>
                <Card hoverable onClick={() => handleTableClick(table)} bodyStyle={{ padding: 0 }}>
                  <div style={{ padding: '16px', textAlign: 'center' }}>
                    <Title level={3} style={{ margin: 0 }}>{table.number}</Title>
                  </div>
                  <div style={{ padding: '8px', textAlign: 'center', borderTop: '1px solid #f0f0f0', backgroundColor: status.color === 'success' ? '#f6ffed' : status.color === 'error' ? '#fff1f0' : '#fffbe6' }}>
                    <Tag color={status.color}>{status.label}</Tag>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      ) : (
        <Empty description="Nenhuma mesa cadastrada.">
          <Button type="primary" onClick={showAddModal}>Adicionar a primeira mesa</Button>
        </Empty>
      )}

      {/* MODAL PRINCIPAL DA COMANDA */}
      <Modal
        title={`Comanda - Mesa ${selectedOrder?.table_id ? tables.find(t => t.id === selectedOrder.table_id)?.number : ''}`}
        open={isOrderModalVisible}
        onCancel={() => setIsOrderModalVisible(false)}
        width={600}
        footer={[
          <Button key="back" onClick={() => setIsOrderModalVisible(false)}>Fechar</Button>,
          <Button key="add" type="dashed" onClick={() => setIsAddItemModalVisible(true)}>Adicionar Item</Button>,
          <Button key="pay" type="primary" icon={<DollarCircleOutlined />} onClick={handleGoToPayment}>Finalizar e Pagar</Button>,
        ]}
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

      {/* MODAL PARA ADICIONAR MESA */}
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

      {/* MODAL PARA ADICIONAR ITEM À COMANDA */}
      {selectedOrder && (
        <AddItemModal
          open={isAddItemModalVisible}
          onCancel={() => setIsAddItemModalVisible(false)}
          orderId={selectedOrder.id}
          onSuccess={() => {
            setIsAddItemModalVisible(false);
            refreshSelectedOrder();
          }}
        />
      )}
    </>
  );
};

export default TableManagementPage;