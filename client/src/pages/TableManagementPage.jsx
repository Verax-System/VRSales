import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Typography, Tag, Modal, Button, message, Spin, Empty, List, Avatar, Divider, Form, Input } from 'antd';
import { TableOutlined, PlusOutlined } from '@ant-design/icons';
import ApiService from '../api/ApiService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const TableManagementPage = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOrderModalVisible, setIsOrderModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  
  // --- NOVOS ESTADOS PARA O MODAL DE ADICIONAR ---
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [addForm] = Form.useForm();


  const fetchTables = useCallback(async () => {
    if (!isAddModalVisible) { // Evita recarregar enquanto o modal de adicionar está aberto
      setLoading(true);
    }
    try {
      const response = await ApiService.getTables();
      setTables(response.data);
    } catch (error) {
      message.error('Erro ao carregar mesas.');
    } finally {
      setLoading(false);
    }
  }, [isAddModalVisible]);

  useEffect(() => {
    fetchTables();
    const interval = setInterval(fetchTables, 15000);
    return () => clearInterval(interval);
  }, [fetchTables]);

  const handleTableClick = async (table) => {
    if (table.status === 'OCCUPIED') {
      setModalLoading(true);
      setIsOrderModalVisible(true);
      try {
        const order = await ApiService.getOpenOrderByTable(table.id);
        setSelectedOrder(order.data);
      } catch (error) {
        message.error('Não foi possível carregar a comanda desta mesa.');
        setIsOrderModalVisible(false);
      } finally {
        setModalLoading(false);
      }
    } else if (table.status === 'AVAILABLE') {
      handleOpenOrder(table);
    }
  };
  
  const handleOpenOrder = (table) => {
      Modal.confirm({
        title: `Abrir comanda na Mesa ${table.number}?`,
        icon: <PlusOutlined />,
        content: 'Isso marcará a mesa como ocupada e iniciará uma nova comanda.',
        okText: 'Sim, Abrir',
        cancelText: 'Cancelar',
        onOk: async () => {
          try {
            await ApiService.createOrderForTable({ table_id: table.id });
            message.success(`Comanda aberta para a Mesa ${table.number}!`);
            fetchTables();
          } catch (error) {
            message.error(error.response?.data?.detail || 'Erro ao abrir comanda.');
          }
        },
      });
  };

  // --- NOVAS FUNÇÕES PARA ADICIONAR MESA ---
  const showAddModal = () => {
    setIsAddModalVisible(true);
  };

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
      fetchTables(); // Recarrega a lista de mesas
    } catch (error) {
      message.error(error.response?.data?.detail || 'Erro ao criar a mesa.');
    } finally {
      setModalLoading(false);
    }
  };
  // --- FIM DAS NOVAS FUNÇÕES ---

  const getStatusProps = (status) => {
    switch (status) {
      case 'OCCUPIED':
        return { color: 'error', label: 'Ocupada' };
      case 'RESERVED':
        return { color: 'warning', label: 'Reservada' };
      default:
        return { color: 'success', label: 'Livre' };
    }
  };

  if (loading && tables.length === 0) {
    return <Spin tip="Carregando mesas..." size="large" style={{ display: 'block', marginTop: 50 }} />;
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}><TableOutlined /> Gestão de Mesas</Title>
        {/* Adiciona o onClick ao botão */}
        <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>Adicionar Mesa</Button>
      </div>
      
      {tables.length > 0 ? (
        <Row gutter={[16, 16]}>
          {tables.map(table => {
            const status = getStatusProps(table.status);
            return (
              <Col xs={12} sm={8} md={6} lg={4} key={table.id}>
                <Card
                  hoverable
                  onClick={() => handleTableClick(table)}
                  bodyStyle={{ padding: 0 }}
                >
                    <div style={{ padding: '16px', textAlign: 'center' }}>
                        <Title level={3} style={{ margin: 0 }}>{table.number}</Title>
                    </div>
                    <div style={{ padding: '8px', textAlign: 'center', borderTop: '1px solid #f0f0f0', backgroundColor: status.color === 'success' ? '#f6ffed' : status.color === 'error' ? '#fff1f0' : '#fffbe6' }}>
                        <Tag color={status.color}>{status.label}</Tag>
                    </div>
                </Card>
              </Col>
            )
          })}
        </Row>
      ) : (
        <Empty description="Nenhuma mesa cadastrada.">
          <Button type="primary" onClick={showAddModal}>Adicionar a primeira mesa</Button>
        </Empty>
      )}

      {/* Modal de Detalhes da Comanda (já existente) */}
      <Modal
        title={`Comanda - Mesa ${selectedOrder?.table_id ? tables.find(t => t.id === selectedOrder.table_id)?.number : ''}`}
        open={isOrderModalVisible}
        onCancel={() => setIsOrderModalVisible(false)}
        width={600}
        footer={[
          <Button key="back" onClick={() => setIsOrderModalVisible(false)}>
            Fechar
          </Button>,
          <Button key="add" type="dashed">
            Adicionar Item
          </Button>,
          <Button key="pay" type="primary">
            Fechar e Pagar
          </Button>,
        ]}
      >
        {modalLoading || !selectedOrder ? <Spin /> : (
          <div>
            <Text type="secondary">Aberta em: {dayjs(selectedOrder.created_at).format('DD/MM/YYYY HH:mm')}</Text>
            <Divider />
            <List
              itemLayout="horizontal"
              dataSource={selectedOrder.items}
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

      {/* --- NOVO MODAL PARA ADICIONAR MESA --- */}
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
          <Form.Item
            name="number"
            label="Número ou Nome da Mesa"
            rules={[{ required: true, message: 'Por favor, insira o número/nome da mesa!' }]}
          >
            <Input placeholder="Ex: 01, Varanda 2, etc." />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default TableManagementPage;