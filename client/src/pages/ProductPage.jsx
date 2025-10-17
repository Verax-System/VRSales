import React, { useState, useEffect, useCallback } from 'react';
// Importando Table e todos os outros componentes necessários
import { Button, Modal, message, Input, Tag, Card, Space, Typography, Spin, Popconfirm, Tooltip, Empty, Image, Form, Table, Row, Col } from 'antd';
import { motion } from 'framer-motion';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, AppstoreOutlined } from '@ant-design/icons';
import ApiService from '../api/ApiService';

const { Title, Text } = Typography;

// Estilos para a nova página de produtos com tabela
const PageStyles = () => (
    <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    .product-page-container { padding: 24px; background-color: #f0f2f5; font-family: 'Inter', sans-serif; min-height: 100vh; }
    .product-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding: 20px 24px; background: linear-gradient(135deg, #27ae60 0%, #2980b9 100%); border-radius: 16px; color: white; box-shadow: 0 10px 30px -10px rgba(39, 174, 96, 0.5); }
    .controls-container { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding: 16px; background-color: #fff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    
    /* Estilizando o Card que envolve a tabela */
    .product-table-card {
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        border: none;
    }

    /* Estilizando a Tabela */
    .product-table .ant-table {
        border-radius: 8px;
        overflow: hidden;
    }
    
    .product-table .ant-table-thead > tr > th {
        background-color: #fafafa;
        font-weight: 600;
        color: #333;
    }

    .product-table .ant-table-tbody > tr > td {
        border-bottom: 1px solid #f0f0f0;
    }

    .product-table .ant-table-tbody > tr:hover > td {
        background-color: #e6f7ff;
    }
    
    .stock-indicator { height: 6px; width: 80%; background-color: #e0e0e0; border-radius: 3px; }
    .stock-indicator-bar { height: 100%; border-radius: 3px; transition: width 0.5s ease; }

    .product-form-buttons { display: flex; justify-content: flex-end; gap: 8px; margin-top: 24px; }
  `}</style>
);

// Formulário integrado
const ProductForm = ({ product, onSuccess, onCancel }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (product) {
            form.setFieldsValue({ ...product, price: parseFloat(product.price) });
        } else {
            form.resetFields();
        }
    }, [product, form]);

    const handleFinish = async (values) => {
        setLoading(true);
        try {
            const apiValues = { ...values, price: parseFloat(values.price) };
            if (product) {
                await ApiService.put(`/products/${product.id}/`, apiValues);
            } else {
                await ApiService.post('/products/', apiValues);
            }
            onSuccess();
        } catch (error) {
            message.error(error.response?.data?.detail || 'Falha ao salvar o produto.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form form={form} layout="vertical" onFinish={handleFinish}>
            <Form.Item name="name" label="Nome do Produto" rules={[{ required: true, message: 'Insira o nome do produto!' }]}>
                <Input size="large" />
            </Form.Item>
            <Row gutter={16}>
                <Col span={12}><Form.Item name="price" label="Preço" rules={[{ required: true }]}><Input type="number" step="0.01" prefix="R$" size="large" /></Form.Item></Col>
                <Col span={12}><Form.Item name="barcode" label="Código de Barras"><Input size="large" /></Form.Item></Col>
            </Row>
             <Row gutter={16}>
                <Col span={12}><Form.Item name="stock" label="Estoque Atual" rules={[{ required: true }]}><Input type="number" size="large" /></Form.Item></Col>
                <Col span={12}><Form.Item name="low_stock_threshold" label="Nível Mínimo" rules={[{ required: true }]}><Input type="number" size="large" /></Form.Item></Col>
            </Row>
             <Form.Item name="image_url" label="URL da Imagem"><Input size="large" placeholder="https://exemplo.com/imagem.png" /></Form.Item>
            <div className="product-form-buttons">
                <Button onClick={onCancel} size="large">Cancelar</Button>
                <Button type="primary" htmlType="submit" loading={loading} size="large">{product ? 'Salvar Alterações' : 'Criar Produto'}</Button>
            </div>
        </Form>
    );
};


const ProductPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [searchText, setSearchText] = useState('');

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const response = await ApiService.get('/products/');
            setProducts(response.data);
        } catch (error) {
            message.error('Falha ao carregar os produtos.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const handleOpenModal = (product = null) => { setEditingProduct(product); setIsModalVisible(true); };
    const handleCancelModal = () => { setIsModalVisible(false); setEditingProduct(null); };
    const handleFormSuccess = () => {
        message.success(`Produto ${editingProduct ? 'atualizado' : 'criado'} com sucesso!`);
        fetchProducts();
        handleCancelModal();
    };

    const handleDelete = async (productId) => {
        try {
            await ApiService.delete(`/products/${productId}`);
            message.success('Produto apagado com sucesso!');
            fetchProducts();
        } catch (error) { message.error('Falha ao apagar o produto.'); }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (p.barcode && p.barcode.toLowerCase().includes(searchText.toLowerCase()))
    );

    const columns = [
        {
            title: 'Produto', dataIndex: 'name', key: 'name', width: '35%',
            render: (name, record) => (
                <Space>
                    <Image width={48} height={48} src={record.image_url} fallback="https://via.placeholder.com/48/ecf0f1/bdc3c7?text=Sem+Img" style={{ objectFit: 'cover', borderRadius: 4 }} preview={false} />
                    <div>
                        <Text strong>{name}</Text>
                        <br />
                        <Text type="secondary">Cód: {record.barcode || 'N/A'}</Text>
                    </div>
                </Space>
            )
        },
        {
            title: 'Preço', dataIndex: 'price', key: 'price', sorter: (a, b) => a.price - b.price,
            render: (price) => `R$ ${parseFloat(price).toFixed(2).replace('.', ',')}`
        },
        {
            title: 'Estoque', dataIndex: 'stock', key: 'stock', sorter: (a, b) => a.stock - b.stock,
            render: (stock, record) => {
                const stockStatus = stock <= record.low_stock_threshold ? 'low' : 'ok';
                const stockPercentage = Math.min((stock / (record.low_stock_threshold * 2)) * 100, 100);
                let stockColor = '#2ecc71';
                if (stockStatus === 'low') stockColor = '#f39c12';
                if (stock === 0) stockColor = '#e74c3c';
                return (
                    <div>
                        <Tag color={stockColor}>{stock} em estoque</Tag>
                        <Tooltip title={`Estoque: ${stock} / Mínimo: ${record.low_stock_threshold}`}>
                            <div className="stock-indicator" style={{ marginTop: 4 }}>
                                <div className="stock-indicator-bar" style={{ width: `${stockPercentage}%`, background: stockColor }}></div>
                            </div>
                        </Tooltip>
                    </div>
                )
            }
        },
        {
            title: 'Ações', key: 'actions', align: 'center',
            render: (_, record) => (
                <Space>
                    <Tooltip title="Editar"><Button shape="circle" icon={<EditOutlined />} onClick={() => handleOpenModal(record)} /></Tooltip>
                    <Popconfirm title="Tem certeza?" onConfirm={() => handleDelete(record.id)} okText="Sim" cancelText="Não">
                        <Tooltip title="Excluir"><Button shape="circle" danger icon={<DeleteOutlined />} /></Tooltip>
                    </Popconfirm>
                </Space>
            )
        },
    ];

    return (
        <>
            <PageStyles />
            <motion.div className="product-page-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="product-header">
                    <Title level={2} style={{ color: 'white', margin: 0 }}>
                        <AppstoreOutlined style={{ marginRight: 12 }} /> Gestão de Produtos
                    </Title>
                </div>

                <div className="controls-container">
                    <Input placeholder="Procurar por nome ou código de barras..." prefix={<SearchOutlined />} value={searchText} onChange={e => setSearchText(e.target.value)} style={{ maxWidth: 400 }} size="large" />
                    <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>Novo Produto</Button>
                </div>
                
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                    <Card className="product-table-card" bodyStyle={{ padding: 0 }}>
                        <Table
                            className="product-table"
                            columns={columns}
                            dataSource={filteredProducts}
                            loading={loading}
                            rowKey="id"
                            pagination={{ pageSize: 10, showSizeChanger: false }}
                        />
                    </Card>
                </motion.div>
                
                <Modal title={editingProduct ? 'Editar Produto' : 'Adicionar Novo Produto'} open={isModalVisible} onCancel={handleCancelModal} footer={null} destroyOnClose>
                    {isModalVisible && <ProductForm product={editingProduct} onSuccess={handleFormSuccess} onCancel={handleCancelModal} />}
                </Modal>
            </motion.div>
        </>
    );
};

export default ProductPage;