import React, { useState, useEffect, useCallback, useMemo } from 'react';
// Adicionando 'Input' para a busca
import { Button, Modal, message, Space, Typography, Tag, DatePicker, Select, Form, InputNumber, notification, Spin, Segmented, List, Empty, Card, Input } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
// Adicionando 'SearchOutlined'
import { PlusOutlined, CalendarOutlined, WarningFilled, ExclamationCircleOutlined, CheckCircleOutlined, SearchOutlined } from '@ant-design/icons';
import ApiService from '../api/ApiService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

// Estilos (sem alterações)
const PageStyles = () => (
    <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    .exp-page-container { padding: 24px; background-color: #f0f2f5; font-family: 'Inter', sans-serif; min-height: 100vh; }
    .exp-page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding: 20px 24px; background: linear-gradient(135deg, #e67e22 0%, #d35400 100%); border-radius: 16px; color: white; box-shadow: 0 10px 20px -10px rgba(230, 126, 34, 0.5); }
    .exp-controls { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; padding: 16px; background-color: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    
    .batch-list-item {
        background: #fff; border-radius: 12px; padding: 16px 24px; margin-bottom: 12px;
        border: 1px solid #e8e8e8; box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        display: flex; align-items: center; gap: 16px;
        position: relative; overflow: hidden; transition: all 0.3s ease;
    }

    .batch-list-item:hover { transform: translateY(-4px); box-shadow: 0 6px 16px rgba(0,0,0,0.08); }
    
    .list-item-status-bar { position: absolute; top: 0; left: 0; bottom: 0; width: 6px; }
    .list-item-status-bar.success { background: #2ecc71; }
    .list-item-status-bar.warning { background: #f39c12; }
    .list-item-status-bar.error { background: #e74c3c; }

    .list-item-content { flex: 1; display: grid; grid-template-columns: 2fr 1fr 1fr 1.5fr; align-items: center; gap: 16px; }
  `}</style>
);

// Função de status (sem alterações)
const getExpirationStatus = (expirationDate) => {
    const today = dayjs().startOf('day');
    const expDate = dayjs(expirationDate);
    const daysUntilExpiration = expDate.diff(today, 'day');

    if (daysUntilExpiration < 0) return { variant: 'error', text: `Vencido há ${Math.abs(daysUntilExpiration)} dias`, days: daysUntilExpiration, icon: <ExclamationCircleOutlined /> };
    if (daysUntilExpiration === 0) return { variant: 'error', text: 'Vence Hoje!', days: daysUntilExpiration, icon: <WarningFilled /> };
    if (daysUntilExpiration <= 7) return { variant: 'error', text: `Vence em ${daysUntilExpiration} dias`, days: daysUntilExpiration, icon: <WarningFilled /> };
    if (daysUntilExpiration <= 30) return { variant: 'warning', text: `Vence em ${daysUntilExpiration} dias`, days: daysUntilExpiration, icon: <CalendarOutlined /> };
    return { variant: 'success', text: 'Válido', days: daysUntilExpiration, icon: <CheckCircleOutlined /> };
};

// Formulário (sem alterações)
const BatchFormModal = ({ visible, onCancel, onSuccess }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);

    const handleDropdownOpen = async (isOpen) => {
        if (isOpen && products.length === 0) {
            setIsLoadingProducts(true);
            try {
                const response = await ApiService.get('/products/?limit=2000');
                setProducts(response.data || []);
            } catch (error) { message.error("Falha ao carregar a lista de produtos."); }
            finally { setIsLoadingProducts(false); }
        }
    };

    const handleFinish = async (values) => {
        setLoading(true);
        const payload = { ...values, expiration_date: values.expiration_date.format('YYYY-MM-DD') };
        try {
            await ApiService.post('/batches/', payload);
            if (onSuccess) onSuccess();
        } catch (error) { message.error(error.response?.data?.detail || 'Erro ao salvar o lote.'); }
        finally { setLoading(false); }
    };

    return (
        <Modal
            title="Adicionar Novo Lote de Produto" open={visible} onCancel={onCancel}
            footer={[ <Button key="back" onClick={onCancel}>Cancelar</Button>, <Button key="submit" type="primary" loading={loading} onClick={() => form.submit()}>Salvar</Button> ]}
            destroyOnClose afterClose={() => form.resetFields()}
        >
            <Form form={form} layout="vertical" name="batch_form" onFinish={handleFinish}>
                <Form.Item name="product_id" label="Produto" rules={[{ required: true }]}>
                    <Select showSearch placeholder="Clique para carregar e pesquisar produtos..." onDropdownVisibleChange={handleDropdownOpen} loading={isLoadingProducts} notFoundContent={isLoadingProducts ? <Spin size="small" /> : 'Nenhum produto encontrado'} filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())} >
                        {products.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)}
                    </Select>
                </Form.Item>
                <Form.Item name="quantity" label="Quantidade de itens no lote" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={1} /></Form.Item>
                <Form.Item name="expiration_date" label="Data de Validade" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item>
            </Form>
        </Modal>
    );
};


const ExpirationControlPage = () => {
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [filter, setFilter] = useState('all');
    // NOVO ESTADO PARA O TERMO DE BUSCA
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const batchesResponse = await ApiService.get('/batches/');
            const fetchedBatches = batchesResponse.data || [];
            setBatches(fetchedBatches.sort((a, b) => dayjs(a.expiration_date).unix() - dayjs(b.expiration_date).unix()));
            
            const nearExpirationCount = fetchedBatches.filter(b => getExpirationStatus(b.expiration_date).days <= 7).length;
            if (nearExpirationCount > 0) {
                notification.warning({ message: 'Produtos Próximos do Vencimento', description: `Você tem ${nearExpirationCount} lote(s) vencendo nos próximos 7 dias.`, icon: <WarningFilled />, duration: 10 });
            }
        } catch {
            message.error('Falha ao carregar dados de lotes.');
            setBatches([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleFormSuccess = () => {
        message.success('Lote adicionado com sucesso!');
        setIsModalVisible(false);
        fetchData();
    };

    // LÓGICA DE FILTRO ATUALIZADA
    const filteredBatches = useMemo(() => {
        return batches
            .filter(batch => { // Filtro de status
                if (filter === 'all') return true;
                const { days } = getExpirationStatus(batch.expiration_date);
                if (filter === 'expired') return days < 0;
                if (filter === 'today') return days === 0;
                if (filter === '7days') return days > 0 && days <= 7;
                return true;
            })
            .filter(batch => { // Filtro de pesquisa
                if (!searchTerm) return true;
                return batch.product?.name.toLowerCase().includes(searchTerm.toLowerCase());
            });
    }, [batches, filter, searchTerm]);
    
    const listVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
    const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

    return (
        <>
            <PageStyles />
            <motion.div className="exp-page-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="exp-page-header">
                    <Title level={2} style={{ color: 'white', margin: 0 }}>
                        <CalendarOutlined style={{ marginRight: 12 }} /> Controle de Validade
                    </Title>
                </div>

                <div className="exp-controls">
                    <Space size="large" wrap>
                        <Input
                            placeholder="Pesquisar por nome do produto..."
                            prefix={<SearchOutlined />}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ width: 300 }}
                            allowClear
                        />
                        <Segmented
                            options={[ { label: 'Todos', value: 'all' }, { label: 'Vence em 7 dias', value: '7days' }, { label: 'Vence Hoje', value: 'today' }, { label: 'Vencidos', value: 'expired' } ]}
                            value={filter}
                            onChange={setFilter}
                        />
                    </Space>
                    <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}> Adicionar Lote </Button>
                </div>

                {loading ? ( <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div> ) 
                : (
                    <AnimatePresence>
                        {filteredBatches.length > 0 ? (
                            <motion.div variants={listVariants} initial="hidden" animate="visible">
                                <List
                                    dataSource={filteredBatches}
                                    renderItem={batch => {
                                        const status = getExpirationStatus(batch.expiration_date);
                                        return (
                                            <motion.div variants={itemVariants}>
                                                <div className="batch-list-item">
                                                    <div className={`list-item-status-bar ${status.variant}`}></div>
                                                    <div className="list-item-content">
                                                        <Title level={5} style={{ margin: 0 }}>{batch.product?.name || 'Produto não encontrado'}</Title>
                                                        <Text type="secondary">Quantidade: {batch.quantity}</Text>
                                                        <Text strong>Validade: {dayjs(batch.expiration_date).format('DD/MM/YYYY')}</Text>
                                                        <Tag icon={status.icon} color={status.variant === 'error' ? 'volcano' : status.variant}>{status.text}</Tag>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    }}
                                />
                            </motion.div>
                        ) : (
                            <Empty description={<Title level={5} style={{color: '#888'}}>Nenhum lote encontrado para os filtros aplicados.</Title>} />
                        )}
                    </AnimatePresence>
                )}
            </motion.div>
            
            <BatchFormModal
                visible={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onSuccess={handleFormSuccess}
            />
        </>
    );
};

export default ExpirationControlPage;