import React, { useState, useEffect, useCallback, useMemo } from 'react';
// Garantindo que TODOS os componentes AntD estão importados
import { Card, Row, Col, Typography, Tag, Modal, Button, message, Spin, Empty, List, Avatar, Divider, Form, Input, Popconfirm, Space } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { TableOutlined, PlusOutlined, DollarCircleOutlined, CloseCircleOutlined, QuestionCircleOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import ApiService from '../api/ApiService';
import dayjs from 'dayjs';
import AddItemModal from '../components/AddItemModal';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

// Estilos embutidos para a nova página
const PageStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

    .table-mgmt-page-container {
      padding: 24px;
      background-color: #f0f2f5;
      font-family: 'Inter', sans-serif;
      min-height: 100vh;
    }

    .table-mgmt-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding: 20px 24px;
      background: linear-gradient(135deg, #007BFF 0%, #00C6FF 100%);
      border-radius: 16px;
      color: white;
      box-shadow: 0 10px 30px -10px rgba(0, 123, 255, 0.5);
    }

    .floor-plan-canvas {
      position: relative;
      height: 75vh;
      width: 100%;
      border-radius: 16px;
      overflow: hidden;
      background-color: #1a202c;
      background-image:
        linear-gradient(rgba(0, 198, 255, 0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 198, 255, 0.1) 1px, transparent 1px);
      background-size: 25px 25px;
      box-shadow: inset 0 0 20px rgba(0,0,0,0.4);
      animation: bg-pan 45s linear infinite;
    }

    @keyframes bg-pan { 0% { background-position: 0% 0%; } 100% { background-position: 100% 100%; } }

    .table-wrapper {
        position: absolute;
        width: 100px;
        height: 100px;
        z-index: 1;
    }
    
    .table-circle {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        transition: all 0.3s ease;
        border: 3px solid;
    }

    .table-circle.available {
        background: rgba(46, 204, 113, 0.1);
        border-color: #2ecc71;
        color: #2ecc71;
        box-shadow: 0 0 15px rgba(46, 204, 113, 0.5);
    }
    
    .table-circle.occupied {
        background: rgba(231, 76, 60, 0.1);
        border-color: #e74c3c;
        color: #e74c3c;
        box-shadow: 0 0 15px rgba(231, 76, 60, 0.5);
    }

    .table-circle:hover {
        transform: scale(1.1);
    }
    
    .table-number {
        font-size: 1.8rem;
        font-weight: 700;
        line-height: 1;
    }
    
    .table-status {
        font-size: 0.8rem;
        font-weight: 600;
        text-transform: uppercase;
    }
  `}</style>
);

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
        return selectedOrder.items.reduce((acc, item) => {
          const existing = acc.find(i => i.product_id === item.product_id);
          if (existing) {
            existing.quantity += item.quantity;
          } else {
            acc.push({ ...item });
          }
          return acc;
        }, []);
    }, [selectedOrder]);
  
    const handleTableClick = async (table) => {
      if (table.status === 'available') {
        setTableToOpen(table);
        setIsConfirmOpenModalVisible(true);
      } else if (table.status === 'occupied') {
        setModalLoading(true);
        setIsOrderModalVisible(true);
        try {
          const response = await ApiService.getOpenOrderByTable(table.id);
          setSelectedOrder(response.data);
        } catch (error) {
          message.error('Não foi possível carregar a comanda desta mesa.');
          setIsOrderModalVisible(false);
        } finally {
          setModalLoading(false);
        }
      }
    };
  
    const handleConfirmOpenOrder = async () => {
        if (!tableToOpen) return;
        setIsConfirmOpenModalVisible(false);
        setModalLoading(true);
        message.loading({ content: 'Abrindo comanda...', key: 'opening_order' });
        try {
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
    const handleAddCancel = () => { setIsAddModalVisible(false); addForm.resetFields(); };

    const handleAddOk = async () => {
        try {
            const values = await addForm.validateFields();
            setModalLoading(true);
            await ApiService.createTable(values);
            message.success(`Mesa "${values.number}" criada com sucesso!`);
            handleAddCancel();
            fetchTables();
        } catch (error) {
            if (error.response) { message.error(error.response.data?.detail || 'Erro ao salvar no servidor.'); }
        } finally {
            setModalLoading(false);
        }
    };
  
    const refreshSelectedOrder = async () => {
        if (!selectedOrder) return;
        setModalLoading(true);
        try {
          const response = await ApiService.getOpenOrderByTable(selectedOrder.table_id);
          setSelectedOrder(response.data);
        } catch (error) { message.error('Não foi possível atualizar a comanda.'); }
        finally { setModalLoading(false); }
    };
  
    const getStatusProps = (status) => {
      switch (status) {
        case 'occupied': return { variant: 'occupied', label: 'Ocupada' };
        case 'available': return { variant: 'available', label: 'Livre' };
        default: return { variant: 'default', label: 'N/A' };
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
  
    if (loading && !tables.length) {
      return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin tip="Carregando mesas..." size="large" /></div>;
    }
  
    return (
      <>
        <PageStyles />
        <motion.div className="table-mgmt-page-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="table-mgmt-header">
                <Title level={2} style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <EyeOutlined /> Gestão de Salão
                </Title>
                <Space>
                    <Button icon={<PlusOutlined />} onClick={showAddModal}>Adicionar Mesa</Button>
                    <Button type="default" icon={<EditOutlined />} onClick={() => navigate('/settings/floor-plan')}>
                        Editar Layout
                    </Button>
                </Space>
            </div>
            
            <motion.div className="floor-plan-canvas">
                <AnimatePresence>
                    {tables.length > 0 ? (
                        tables.map(table => {
                            const status = getStatusProps(table.status);
                            return (
                                <motion.div
                                    key={table.id}
                                    className="table-wrapper"
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1, x: table.pos_x || 0, y: table.pos_y || 0 }}
                                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                                    onClick={() => handleTableClick(table)}
                                >
                                    <div className={`table-circle ${status.variant}`}>
                                        <span className="table-number">{table.number}</span>
                                        <span className="table-status">{status.label}</span>
                                    </div>
                                </motion.div>
                            );
                        })
                    ) : (
                        <Empty description="Nenhuma mesa cadastrada." style={{ paddingTop: '25vh' }}/>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>

        {/* --- MODAIS --- */}
        <Modal title="Confirmar Ação" open={isConfirmOpenModalVisible} onOk={handleConfirmOpenOrder} onCancel={() => setIsConfirmOpenModalVisible(false)} okText="Sim, Abrir Comanda" cancelText="Não" confirmLoading={modalLoading}>
            <p>Deseja abrir uma nova comanda na Mesa <strong>{tableToOpen?.number}</strong>?</p>
        </Modal>

        <Modal title={`Comanda - Mesa ${selectedOrder?.table_id ? tables.find(t => t.id === selectedOrder.table_id)?.number : ''}`} open={isOrderModalVisible} onCancel={() => setIsOrderModalVisible(false)} width={600}
               footer={
                 <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                   <Popconfirm title="Cancelar Comanda?" onConfirm={handleCancelOrder} okText="Sim, Cancelar" cancelText="Não" placement="top"><Button danger icon={<CloseCircleOutlined />}>Cancelar Comanda</Button></Popconfirm>
                   <Space>
                     <Button key="add" type="dashed" onClick={() => setIsAddItemModalVisible(true)}>Adicionar Item</Button>
                     <Button key="pay" type="primary" icon={<DollarCircleOutlined />} onClick={handleGoToPayment}>Finalizar e Pagar</Button>
                   </Space>
                 </div>
               }
        >
            <Spin spinning={modalLoading}>
                {selectedOrder && (
                    <div>
                        <Text type="secondary">Aberta em: {dayjs(selectedOrder.created_at).format('DD/MM/YYYY HH:mm')}</Text>
                        <Divider />
                        <List
                            itemLayout="horizontal" dataSource={groupedOrderItems} locale={{ emptyText: "Nenhum item na comanda." }}
                            renderItem={item => (
                                <List.Item>
                                    <List.Item.Meta avatar={<Avatar>{item.quantity}x</Avatar>} title={item.product?.name || 'Produto não encontrado'} description={`R$ ${item.price_at_order.toFixed(2)}`} />
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
            </Spin>
        </Modal>

        <Modal title="Adicionar Nova Mesa" open={isAddModalVisible} onCancel={handleAddCancel} onOk={handleAddOk} confirmLoading={modalLoading}>
            <Form form={addForm} layout="vertical">
                <Form.Item name="number" label="Número ou Nome da Mesa" rules={[{ required: true, message: 'Por favor, insira o número/nome da mesa!' }]}>
                    <Input placeholder="Ex: 01, Varanda 2, etc." />
                </Form.Item>
            </Form>
        </Modal>

        {selectedOrder && <AddItemModal open={isAddItemModalVisible} onCancel={() => setIsAddItemModalVisible(false)} orderId={selectedOrder.id} onSuccess={() => { setIsAddItemModalVisible(false); refreshSelectedOrder(); }} />}
      </>
    );
};

export default TableManagementPage;