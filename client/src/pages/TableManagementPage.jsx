import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Row, Col, Typography, Tag, Modal, Button, message, Spin, Empty, List, Avatar, Divider, Form, Input, Popconfirm, Space, Dropdown, Menu, Select, Tooltip, Checkbox, InputNumber, Alert } from 'antd';
import { motion } from 'framer-motion';
import {
    TableOutlined, PlusOutlined, DollarCircleOutlined, CloseCircleOutlined, EditOutlined, EyeOutlined,
    SwapOutlined, MergeCellsOutlined, BellFilled, UserOutlined, ClockCircleOutlined, SyncOutlined, CheckCircleOutlined, CheckSquareOutlined
} from '@ant-design/icons';
import ApiService from '../api/ApiService';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/pt-br';
import AddItemModal from '../components/AddItemModal';
import { useNavigate } from 'react-router-dom';
import PartialPaymentModal from '../components/PartialPaymentModal';

dayjs.extend(relativeTime);
dayjs.locale('pt-br');

const { Title, Text } = Typography;
const { Option } = Select;

const PageStyles = () => (
    <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    .table-mgmt-page-container { padding: 24px; background-color: #f0f2f5; font-family: 'Inter', sans-serif; min-height: 100vh; }
    .table-mgmt-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding: 20px 24px; background: linear-gradient(135deg, #007BFF 0%, #00C6FF 100%); border-radius: 16px; color: white; box-shadow: 0 10px 30px -10px rgba(0, 123, 255, 0.5); }
    .table-card-wrapper { position: relative; }
    .table-card { text-align: center; cursor: pointer; border-radius: 12px; border: 2px solid transparent; transition: all 0.3s ease; }
    .table-card.available:hover { border-color: #2ecc71; transform: translateY(-5px); box-shadow: 0 8px 20px -5px rgba(46, 204, 113, 0.5); }
    .table-card.occupied:hover { border-color: #faad14; transform: translateY(-5px); box-shadow: 0 8px 20px -5px rgba(250, 173, 20, 0.5); }
    .table-card.reserved:hover { border-color: #3498db; transform: translateY(-5px); box-shadow: 0 8px 20px -5px rgba(52, 152, 219, 0.5); }
    .table-card .ant-card-body { padding: 20px; }
    .table-number-title { font-size: 2.5rem; font-weight: 700; line-height: 1.1; margin-top: 8px !important; margin-bottom: 12px !important; }
    .item-status-icon { font-size: 16px; }
    .paid-item { opacity: 0.5; text-decoration: line-through; }
    `}</style>
);

// --- INÍCIO DA ATUALIZAÇÃO DO CARD ---
const TableCard = ({ table, onClick, onEdit, onDelete }) => {
    const [currentTime, setCurrentTime] = useState(dayjs());

    useEffect(() => {
        let timer;
        if (table.status === 'occupied' && table.open_order_created_at) {
            timer = setInterval(() => setCurrentTime(dayjs()), 1000 * 60);
        }
        return () => clearInterval(timer);
    }, [table.status, table.open_order_created_at]);

    const getElapsedTime = () => {
        if (!table.open_order_created_at) return '';
        return `(${dayjs(table.open_order_created_at).fromNow(true)})`;
    };

    // Define os itens do menu de contexto
    const menuItems = [
        {
            key: 'edit',
            icon: <EditOutlined />,
            label: 'Editar',
            onClick: (e) => { e.domEvent.stopPropagation(); onEdit(table); },
        },
        {
            key: 'delete',
            danger: true,
            icon: <CloseCircleOutlined />,
            label: (
                <Popconfirm
                    title="Tem certeza?"
                    onConfirm={(e) => { e.stopPropagation(); onDelete(table.id); }}
                    onCancel={(e) => e.stopPropagation()}
                    okText="Sim"
                    cancelText="Não"
                >
                    {/* Envolve o texto em um span para parar a propagação do clique */}
                    <span onClick={(e) => e.stopPropagation()}>Excluir</span>
                </Popconfirm>
            ),
        }
    ];

    const colorMap = { available: 'green', occupied: 'orange', reserved: 'blue' };
    const textMap = {
        available: 'Livre',
        occupied: `Ocupada ${getElapsedTime()}`,
        reserved: 'Reservada',
    };

    return (
        <Dropdown menu={{ items: menuItems }} trigger={['contextMenu']}>
            <div className="table-card-wrapper">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <Card hoverable className={`table-card ${table.status}`} onClick={() => onClick(table)}>
                        {table.has_ready_items && (
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], color: ['#faad14', '#f5222d', '#faad14'] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                style={{ position: 'absolute', top: 10, right: 10, zIndex: 1 }}
                            >
                                <BellFilled style={{ fontSize: '18px' }} />
                            </motion.div>
                        )}
                        <TableOutlined style={{ fontSize: '2.5rem', color: '#ccc' }} />
                        <Title level={2} className="table-number-title">{table.number}</Title>
                        <Tag color={colorMap[table.status] || 'default'}>
                            {textMap[table.status] || table.status.toUpperCase()}
                        </Tag>
                    </Card>
                </motion.div>
            </div>
        </Dropdown>
    );
};
// --- FIM DA ATUALIZAÇÃO DO CARD ---


const TableManagementPage = () => {
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOrderModalVisible, setIsOrderModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [isAddEditModalVisible, setIsAddEditModalVisible] = useState(false);
    const [editingTable, setEditingTable] = useState(null);
    const [form] = Form.useForm();
    const [isAddItemModalVisible, setIsAddItemModalVisible] = useState(false);
    const [isConfirmOpenVisible, setIsConfirmOpenVisible] = useState(false);
    const [tableToOpen, setTableToOpen] = useState(null);
    const [isTransferModalVisible, setIsTransferModalVisible] = useState(false);
    const [isMergeModalVisible, setIsMergeModalVisible] = useState(false);
    const navigate = useNavigate();
    const [selectedItemsToPay, setSelectedItemsToPay] = useState({});
    const [isPartialPaymentModalVisible, setIsPartialPaymentModalVisible] = useState(false);

    const fetchTables = useCallback(async (showLoading = false) => {
        if (showLoading) setLoading(true);
        try {
            const response = await ApiService.get('/tables/');
            setTables(response.data);
        } catch {
            message.error('Erro ao carregar mesas.');
        } finally {
            if (showLoading) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTables(true);
        const interval = setInterval(() => fetchTables(false), 15000);
        return () => clearInterval(interval);
    }, [fetchTables]);

    const handleItemSelectionChange = (item, checked) => {
        const remainingQty = item.quantity - item.paid_quantity;
        setSelectedItemsToPay(prev => {
            const newState = { ...prev };
            if (checked) {
                newState[item.id] = {
                    order_item_id: item.id,
                    quantity: remainingQty,
                    price: item.price_at_order,
                    name: item.product.name,
                    maxQuantity: remainingQty,
                };
            } else {
                delete newState[item.id];
            }
            return newState;
        });
    };

    const handleItemQuantityToPayChange = (itemId, quantity) => {
        setSelectedItemsToPay(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], quantity: quantity },
        }));
    };

    const itemsToPayList = useMemo(() => Object.values(selectedItemsToPay), [selectedItemsToPay]);
    const totalToPayForSelected = useMemo(() => itemsToPayList.reduce((acc, item) => acc + (item.quantity * item.price), 0), [itemsToPayList]);

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

    const handleCloseOrderModal = () => {
        setIsOrderModalVisible(false);
        setSelectedOrder(null);
        setSelectedItemsToPay({});
    };

    const handleConfirmOpenOrder = async () => {
        if (!tableToOpen) return;
        setModalLoading(true);
        try {
            const response = await ApiService.post('/orders/', { table_id: tableToOpen.id, order_type: 'DINE_IN' });
            setIsConfirmOpenVisible(false);
            message.success(`Comanda para a Mesa ${tableToOpen.number} aberta!`);
            await fetchTables(false);
            setSelectedOrder(response.data);
            setIsOrderModalVisible(true);
        } catch (error) {
            message.error(error.response?.data?.detail || 'Erro ao abrir comanda.');
        } finally {
            setModalLoading(false);
            setTableToOpen(null);
        }
    };

    const handleAddEditOk = async () => {
        try {
            const values = await form.validateFields();
            if (editingTable) {
                await ApiService.put(`/tables/${editingTable.id}`, values);
                message.success(`Mesa "${values.number}" atualizada com sucesso!`);
            } else {
                await ApiService.post('/tables/', values);
                message.success(`Mesa "${values.number}" criada com sucesso!`);
            }
            setIsAddEditModalVisible(false);
            fetchTables(false);
        } catch (error) {
            message.error(error.response?.data?.detail || 'Erro ao salvar mesa.');
        }
    };

    // --- INÍCIO DA NOVA FUNÇÃO DE DELETAR ---
    const handleDeleteTable = async (tableId) => {
        try {
            await ApiService.delete(`/tables/${tableId}`);
            message.success('Mesa excluída com sucesso!');
            fetchTables(false); // Atualiza a lista de mesas
        } catch (error) {
            message.error(error.response?.data?.detail || 'Erro ao excluir mesa.');
        }
    };
    // --- FIM DA NOVA FUNÇÃO DE DELETAR ---

    const handleTransferOk = async (values) => {
        setModalLoading(true);
        try {
            await ApiService.post(`/orders/${selectedOrder.id}/transfer`, { target_table_id: values.target_table_id });
            message.success('Comanda transferida com sucesso!');
            setIsTransferModalVisible(false);
            setIsOrderModalVisible(false);
            fetchTables(true);
        } catch (error) {
            message.error(error.response?.data?.detail || 'Erro ao transferir comanda.');
        } finally {
            setModalLoading(false);
        }
    };

    const handleMergeOk = async (values) => {
        setModalLoading(true);
        try {
            const targetTable = tables.find(t => t.id === values.target_table_id);
            const openOrderResponse = await ApiService.get(`/orders/table/${targetTable.id}/open`);
            const targetOrderId = openOrderResponse.data.id;

            if (!targetOrderId) {
                message.error("A mesa de destino não possui uma comanda aberta.");
                setModalLoading(false);
                return;
            }

            await ApiService.post(`/orders/${targetOrderId}/merge`, { source_order_id: selectedOrder.id });

            message.success('Comandas unidas com sucesso!');
            setIsMergeModalVisible(false);
            setIsOrderModalVisible(false);
            fetchTables(true);
        } catch (error) {
            message.error(error.response?.data?.detail || 'Erro ao unir comandas.');
        } finally {
            setModalLoading(false);
        }
    };

    const refreshSelectedOrder = async (showSuccess = false) => {
        if (!selectedOrder) return;
        setModalLoading(true);
        try {
            const response = await ApiService.get(`/orders/${selectedOrder.id}`);
            setSelectedOrder(response.data);
            if (showSuccess) message.success("Comanda atualizada!");
        } catch {
            message.error('Não foi possível atualizar a comanda.');
        } finally {
            setModalLoading(false);
        }
    };

    const handleGoToPayment = () => {
        if (selectedOrder?.status === 'PAID') {
            message.info("Esta comanda já foi totalmente paga.");
            return;
        }

        if (!selectedOrder || selectedOrder.items.length === 0) {
            message.warning('Adicione itens à comanda antes de ir para o pagamento.');
            return;
        }
        const itemsForPOS = selectedOrder.items
            .filter(item => (item.quantity - item.paid_quantity) > 0)
            .map(item => ({
                ...item.product,
                id: item.product_id,
                quantity: item.quantity - item.paid_quantity,
                price: item.price_at_order,
            }));
        
        if (itemsForPOS.length === 0) {
            message.info("Todos os itens desta comanda já foram pagos.");
            return;
        }

        navigate('/pos', { state: { orderId: selectedOrder.id, orderItems: itemsForPOS, fromTable: true } });
    };

    const handleCancelOrder = async () => {
        if (!selectedOrder) return;
        setModalLoading(true);
        try {
            await ApiService.cancelOrder(selectedOrder.id);
            message.success('Comanda cancelada com sucesso!');
            handleCloseOrderModal();
            fetchTables(true);
        } catch (error) {
            message.error(error.response?.data?.detail || 'Erro ao cancelar a comanda.');
        } finally {
            setModalLoading(false);
        }
    };

    const handlePartialPaymentSuccess = () => {
        setIsPartialPaymentModalVisible(false);
        setSelectedItemsToPay({});
        refreshSelectedOrder(true);
        fetchTables(false);
    };
    
    const statusIcons = {
        pending: <Tooltip title="Pendente"><ClockCircleOutlined className="item-status-icon" style={{ color: '#faad14' }} /></Tooltip>,
        preparing: <Tooltip title="Em Preparo"><SyncOutlined spin className="item-status-icon" style={{ color: '#108ee9' }} /></Tooltip>,
        ready: <Tooltip title="Pronto para Servir"><CheckCircleOutlined className="item-status-icon" style={{ color: '#52c41a' }} /></Tooltip>,
        delivered: <Tooltip title="Entregue"><CheckCircleOutlined className="item-status-icon" style={{ color: '#8c8c8c' }} /></Tooltip>
    };

    const isOrderPaid = selectedOrder?.status === 'PAID';

    return (
        <>
            <PageStyles />
            <motion.div className="table-mgmt-page-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                 <div className="table-mgmt-header">
                    <Title level={2} style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <EyeOutlined /> Gestão de Salão
                    </Title>
                    <Space>
                        <Button icon={<PlusOutlined />} onClick={() => { setEditingTable(null); form.resetFields(); setIsAddEditModalVisible(true); }}>Adicionar Mesa</Button>
                        <Button type="default" icon={<EditOutlined />} onClick={() => navigate('/settings/floor-plan')}>Editar Layout</Button>
                    </Space>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}><Spin tip="A carregar mesas..." size="large" /></div>
                ) : tables.length > 0 ? (
                    <Row gutter={[24, 24]}>
                        {tables.map(table => (
                            <Col xs={12} sm={8} md={6} lg={4} xl={3} key={table.id}>
                                {/* --- ATUALIZAÇÃO AQUI --- */}
                                <TableCard
                                    table={table}
                                    onClick={handleTableClick}
                                    onEdit={(t) => { setEditingTable(t); form.setFieldsValue(t); setIsAddEditModalVisible(true); }}
                                    onDelete={handleDeleteTable}
                                />
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
            
            <Modal title={editingTable ? "Editar Mesa" : "Adicionar Nova Mesa"} open={isAddEditModalVisible} onCancel={() => setIsAddEditModalVisible(false)} onOk={handleAddEditOk}>
                <Form form={form} layout="vertical"><Form.Item name="number" label="Número ou Nome da Mesa" rules={[{ required: true, message: 'Por favor, insira o número/nome da mesa!' }]}><Input placeholder="Ex: 01, Varanda 2, etc." /></Form.Item></Form>
            </Modal>

            {selectedOrder && (
                <Modal
                    title={
                        <Space>
                            <Text>{`Comanda - Mesa ${tables.find(t => t.id === selectedOrder.table_id)?.number || ''}`}</Text>
                            <Tag icon={<UserOutlined />}>{selectedOrder.user?.full_name || 'N/A'}</Tag>
                        </Space>
                    }
                    open={isOrderModalVisible} onCancel={handleCloseOrderModal} width={800}
                    footer={<div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <Space>
                            <Button icon={<SwapOutlined />} onClick={() => setIsTransferModalVisible(true)} disabled={isOrderPaid}>Transferir</Button>
                            <Button icon={<MergeCellsOutlined />} onClick={() => setIsMergeModalVisible(true)} disabled={isOrderPaid}>Juntar</Button>
                            <Popconfirm title="Cancelar Comanda?" onConfirm={handleCancelOrder} okText="Sim, Cancelar" cancelText="Não" placement="top"><Button danger icon={<CloseCircleOutlined />} disabled={isOrderPaid}>Cancelar</Button></Popconfirm>
                        </Space>
                        <Space>
                            <Button key="add" type="dashed" onClick={() => setIsAddItemModalVisible(true)} disabled={isOrderPaid}>Adicionar Item</Button>
                            <Button key="paySelected" type="primary" icon={<CheckSquareOutlined />} onClick={() => setIsPartialPaymentModalVisible(true)} disabled={itemsToPayList.length === 0 || isOrderPaid}>Pagar Selecionados</Button>
                            <Button key="pay" type="primary" icon={<DollarCircleOutlined />} onClick={handleGoToPayment} disabled={isOrderPaid}>Pagar Restante</Button>
                        </Space>
                    </div>}
                >
                    <Spin spinning={modalLoading}>
                        <div>
                            {isOrderPaid && (
                                <Alert
                                    message="Comanda Finalizada"
                                    description="Esta comanda já foi totalmente paga e não pode mais ser alterada."
                                    type="success"
                                    showIcon
                                    style={{ marginBottom: 16 }}
                                />
                            )}
                            <Text type="secondary">Aberta há: {dayjs(selectedOrder.created_at).fromNow()}</Text>
                            <Divider />
                            <List
                                itemLayout="horizontal" dataSource={selectedOrder.items} locale={{ emptyText: "Nenhum item na comanda." }}
                                renderItem={item => {
                                    const remainingQty = item.quantity - item.paid_quantity;
                                    const isFullyPaid = remainingQty <= 0;
                                    const isSelected = !!selectedItemsToPay[item.id];
                                    
                                    return (
                                        <>
                                            {item.paid_quantity > 0 && (
                                                <List.Item className="paid-item">
                                                    <List.Item.Meta avatar={<Avatar style={{ backgroundColor: '#87d068' }}>{item.paid_quantity}x</Avatar>} title={<>{item.product?.name || 'Produto não encontrado'} <Tag color="green">PAGO</Tag></>} description={`R$ ${item.price_at_order.toFixed(2)}`} />
                                                    <div>R$ {(item.price_at_order * item.paid_quantity).toFixed(2)}</div>
                                                </List.Item>
                                            )}
                                            {!isFullyPaid && (
                                                <List.Item
                                                    actions={[
                                                        <Space key={`actions-${item.id}`}>
                                                            {isSelected && remainingQty > 1 && (
                                                                <InputNumber size="small" min={1} max={remainingQty} value={selectedItemsToPay[item.id]?.quantity} onChange={(val) => handleItemQuantityToPayChange(item.id, val)} />
                                                            )}
                                                            <Checkbox checked={isSelected} onChange={(e) => handleItemSelectionChange(item, e.target.checked)} />
                                                        </Space>
                                                    ]}
                                                >
                                                    <List.Item.Meta 
                                                        avatar={<Avatar>{remainingQty}x</Avatar>} 
                                                        title={<Space>{statusIcons[item.status]} {item.product?.name || 'Produto não encontrado'}</Space>}
                                                        description={
                                                            <>
                                                                <div>{`R$ ${item.price_at_order.toFixed(2)}`}</div>
                                                                {item.notes && <Text type="secondary" italic>- {item.notes}</Text>}
                                                            </>
                                                        }
                                                    />
                                                    <div>R$ {(item.price_at_order * remainingQty).toFixed(2)}</div>
                                                </List.Item>
                                            )}
                                        </>
                                    );
                                }}
                            />
                            <Divider />
                            <div style={{ textAlign: 'right' }}>
                                 {itemsToPayList.length > 0 && (
                                    <Alert message={<Text strong>Total dos itens selecionados: R$ {totalToPayForSelected.toFixed(2)}</Text>} type="info" style={{ textAlign: 'center', marginBottom: 16 }} />
                                )}
                                <Title level={4}>Total Pendente: R$ {selectedOrder.items.reduce((acc, item) => acc + item.price_at_order * (item.quantity - item.paid_quantity), 0).toFixed(2)}</Title>
                            </div>
                        </div>
                    </Spin>
                </Modal>
            )}

            {selectedOrder && <AddItemModal open={isAddItemModalVisible} onCancel={() => setIsAddItemModalVisible(false)} orderId={selectedOrder.id} onSuccess={() => { setIsAddItemModalVisible(false); refreshSelectedOrder(true); }} />}

            {isTransferModalVisible && (
                <Modal title="Transferir Comanda" open={isTransferModalVisible} onCancel={() => setIsTransferModalVisible(false)} footer={null}>
                    <Form onFinish={handleTransferOk} layout="vertical">
                        <Form.Item name="target_table_id" label="Transferir para a Mesa" rules={[{ required: true, message: 'Selecione a mesa de destino!' }]}>
                            <Select showSearch placeholder="Selecione uma mesa livre">
                                {tables.filter(t => t.status === 'available').map(t => (
                                    <Option key={t.id} value={t.id}>{t.number}</Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item><Button type="primary" htmlType="submit" loading={modalLoading} block>Confirmar Transferência</Button></Form.Item>
                    </Form>
                </Modal>
            )}

            {isMergeModalVisible && (
                <Modal title="Juntar Comandas" open={isMergeModalVisible} onCancel={() => setIsMergeModalVisible(false)} footer={null}>
                    <Form onFinish={handleMergeOk} layout="vertical">
                        <Form.Item name="target_table_id" label="Juntar com a comanda da Mesa" rules={[{ required: true, message: 'Selecione a comanda de destino!' }]}>
                            <Select showSearch placeholder="Selecione a mesa de destino">
                                {tables.filter(t => t.status === 'occupied' && t.id !== selectedOrder?.table_id).map(t => (
                                    <Option key={t.id} value={t.id}>{t.number}</Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item><Button type="primary" htmlType="submit" loading={modalLoading} block>Confirmar Junção</Button></Form.Item>
                    </Form>
                </Modal>
            )}

            {selectedOrder && isPartialPaymentModalVisible && (
                <PartialPaymentModal
                    open={isPartialPaymentModalVisible}
                    onCancel={() => setIsPartialPaymentModalVisible(false)}
                    onSuccess={handlePartialPaymentSuccess}
                    orderId={selectedOrder.id}
                    itemsToPay={itemsToPayList}
                    totalAmount={totalToPayForSelected}
                    customerId={selectedOrder.customer_id}
                />
            )}
        </>
    );
};

export default TableManagementPage;