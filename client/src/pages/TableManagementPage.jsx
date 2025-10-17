import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Typography, Tag, Modal, Button, message, Spin, Empty, List, Avatar, Divider, Form, Input, Popconfirm, Space } from 'antd';
import { motion } from 'framer-motion';
import { TableOutlined, PlusOutlined, DollarCircleOutlined, CloseCircleOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import ApiService from '../api/ApiService';
import dayjs from 'dayjs';
import AddItemModal from '../components/AddItemModal';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const PageStyles = () => (
    <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    .table-mgmt-page-container { padding: 24px; background-color: #f0f2f5; font-family: 'Inter', sans-serif; min-height: 100vh; }
    .table-mgmt-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding: 20px 24px; background: linear-gradient(135deg, #007BFF 0%, #00C6FF 100%); border-radius: 16px; color: white; box-shadow: 0 10px 30px -10px rgba(0, 123, 255, 0.5); }
    .table-card { text-align: center; cursor: pointer; border-radius: 12px; border: 2px solid transparent; transition: all 0.3s ease; }
    .table-card.available:hover { border-color: #2ecc71; transform: translateY(-5px); box-shadow: 0 8px 20px -5px rgba(46, 204, 113, 0.5); }
    .table-card.occupied:hover { border-color: #faad14; transform: translateY(-5px); box-shadow: 0 8px 20px -5px rgba(250, 173, 20, 0.5); }
    .table-card .ant-card-body { padding: 20px; }
    .table-number-title { font-size: 2.5rem; font-weight: 700; line-height: 1.1; margin-top: 8px !important; margin-bottom: 12px !important; }
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
    const [isConfirmOpenVisible, setIsConfirmOpenVisible] = useState(false);
    const [tableToOpen, setTableToOpen] = useState(null);
    const navigate = useNavigate();

    const fetchTables = useCallback(async () => {
        try {
            const response = await ApiService.get('/tables/');
            const sortedTables = response.data.sort((a, b) => String(a.number).localeCompare(String(b.number), undefined, { numeric: true }));
            setTables(sortedTables);
        } catch {
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

    const handleTableClick = (table) => {
        if (table.status === 'available') {
            setTableToOpen(table);
            setIsConfirmOpenVisible(true);
        } else if (table.status === 'occupied') {
            openOrderModal(table.id);
        }
    };

    const openOrderModal = async (tableId) => {
        setModalLoading(true);
        setIsOrderModalVisible(true);
        try {
            const response = await ApiService.get(`/orders/table/${tableId}/open`);
            setSelectedOrder(response.data);
        } catch {
            message.error('Não foi possível carregar a comanda desta mesa.');
            setIsOrderModalVisible(false);
        } finally {
            setModalLoading(false);
        }
    };

    const handleConfirmOpenOrder = async () => {
        if (!tableToOpen) return;
        setModalLoading(true);
        try {
            const response = await ApiService.post('/orders/', { table_id: tableToOpen.id, order_type: 'DINE_IN' });            setIsConfirmOpenVisible(false);
            message.success(`Comanda para a Mesa ${tableToOpen.number} aberta!`);
            setSelectedOrder(response.data);
            setIsOrderModalVisible(true);
            await fetchTables();
        } catch (error) {
            message.error(error.response?.data?.detail || 'Erro ao abrir comanda.');
        } finally {
            setModalLoading(false);
            setTableToOpen(null);
        }
    };

    const handleAddOk = async () => {
        try {
            const values = await addForm.validateFields();
            await ApiService.post('/tables/', values);
            message.success(`Mesa "${values.number}" criada com sucesso!`);
            setIsAddModalVisible(false);
            addForm.resetFields();
            fetchTables();
        } catch (error) {
            message.error(error.response?.data?.detail || 'Erro ao criar mesa.');
        }
    };

    const refreshSelectedOrder = async () => {
        if (!selectedOrder) return;
        setModalLoading(true);
        try {
            const response = await ApiService.get(`/orders/${selectedOrder.id}`); // Busca pelo ID da comanda
            setSelectedOrder(response.data);
        } catch { message.error('Não foi possível atualizar a comanda.'); }
        finally { setModalLoading(false); }
    };
    
    // ... o resto das funções (handleGoToPayment, handleCancelOrder) permanecem iguais ...
    const handleGoToPayment = () => {
        if (!selectedOrder || selectedOrder.items.length === 0) {
            message.warning('Adicione pelo menos um item à comanda antes de ir para o pagamento.');
            return;
        }
        const itemsForPOS = selectedOrder.items.map(item => ({
            ...item.product, id: item.product_id, quantity: item.quantity, price: item.price_at_order,
        }));
        navigate('/pos', { state: { orderId: selectedOrder.id, orderItems: itemsForPOS, fromTable: true } });
    };
    
    const handleCancelOrder = async () => {
        if (!selectedOrder) return;
        setModalLoading(true);
        try {
            await ApiService.patch(`/orders/${selectedOrder.id}/cancel`);
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


    return (
        <>
            <PageStyles />
            <motion.div className="table-mgmt-page-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="table-mgmt-header">
                    <Title level={2} style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <EyeOutlined /> Gestão de Salão
                    </Title>
                    <Space>
                        <Button icon={<PlusOutlined />} onClick={() => setIsAddModalVisible(true)}>Adicionar Mesa</Button>
                        <Button type="default" icon={<EditOutlined />} onClick={() => navigate('/settings/floor-plan')}>Editar Layout</Button>
                    </Space>
                </div>
                
                {loading && tables.length === 0 ? (
                     <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}><Spin tip="Carregando mesas..." size="large" /></div>
                ) : tables.length > 0 ? (
                    <Row gutter={[24, 24]}>
                        {tables.map(table => (
                            <Col xs={12} sm={8} md={6} lg={4} xl={3} key={table.id}>
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                                    <Card hoverable className={`table-card ${table.status}`} onClick={() => handleTableClick(table)}>
                                        <TableOutlined style={{ fontSize: '2.5rem', color: '#ccc' }} />
                                        <Title level={2} className="table-number-title">{table.number}</Title>
                                        <Tag color={table.status === 'available' ? 'green' : 'orange'}>
                                            {table.status === 'available' ? 'LIVRE' : 'OCUPADA'}
                                        </Tag>
                                    </Card>
                                </motion.div>
                            </Col>
                        ))}
                    </Row>
                ) : (
                    <Empty description="Nenhuma mesa cadastrada." style={{ marginTop: '10vh' }} />
                )}
            </motion.div>

            <Modal title="Confirmar Ação" open={isConfirmOpenVisible} onOk={handleConfirmOpenOrder} onCancel={() => setIsConfirmOpenVisible(false)} okText="Sim, Abrir Comanda" cancelText="Cancelar" confirmLoading={modalLoading}>
                <p>Deseja abrir uma nova comanda na Mesa <strong>{tableToOpen?.number}</strong>?</p>
            </Modal>

            <Modal title={`Comanda - Mesa ${tables.find(t => t.id === selectedOrder?.table_id)?.number || ''}`} open={isOrderModalVisible} onCancel={() => setIsOrderModalVisible(false)} width={600}
                footer={<div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}><Popconfirm title="Cancelar Comanda?" onConfirm={handleCancelOrder} okText="Sim, Cancelar" cancelText="Não" placement="top"><Button danger icon={<CloseCircleOutlined />}>Cancelar Comanda</Button></Popconfirm><Space><Button key="add" type="primary" onClick={() => setIsAddItemModalVisible(true)}>Adicionar Item</Button><Button key="pay" type="default" icon={<DollarCircleOutlined />} onClick={handleGoToPayment}>Finalizar e Pagar</Button></Space></div>}
            >
                <Spin spinning={modalLoading}>
                    {selectedOrder && (
                        <div>
                            <Text type="secondary">Aberta em: {dayjs(selectedOrder.created_at).format('DD/MM/YYYY HH:mm')}</Text>
                            <Divider />
                            <List
                                itemLayout="horizontal" dataSource={selectedOrder.items} locale={{ emptyText: "Nenhum item na comanda." }}
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

            <Modal title="Adicionar Nova Mesa" open={isAddModalVisible} onCancel={() => setIsAddModalVisible(false)} onOk={handleAddOk}>
                <Form form={addForm} layout="vertical"><Form.Item name="number" label="Número ou Nome da Mesa" rules={[{ required: true, message: 'Por favor, insira o número/nome da mesa!' }]}><Input placeholder="Ex: 01, Varanda 2, etc." /></Form.Item></Form>
            </Modal>

            {selectedOrder && <AddItemModal open={isAddItemModalVisible} onCancel={() => setIsAddItemModalVisible(false)} orderId={selectedOrder.id} onSuccess={() => { setIsAddItemModalVisible(false); refreshSelectedOrder(); }} />}
        </>
    );
};

export default TableManagementPage;