import React, { useState, useEffect } from 'react';
import { Modal, Input, List, Avatar, Button, message, Spin, Empty, InputNumber, Space } from 'antd';
import ApiService from '../api/ApiService';
import { useDebounce } from '../hooks/useDebounce';

const AddItemModal = ({ open, onCancel, orderId, onSuccess }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [itemData, setItemData] = useState({}); // Combina quantidade e notas
    const [addingProductId, setAddingProductId] = useState(null);

    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    useEffect(() => {
        if (open) {
            const fetchProducts = async () => {
                setLoading(true);
                try {
                    const params = debouncedSearchTerm ? { search: debouncedSearchTerm } : {};
                    const response = await ApiService.get('/products/', { params });
                    setProducts(response.data);
                } catch {
                    message.error('Erro ao buscar produtos.');
                } finally {
                    setLoading(false);
                }
            };
            fetchProducts();
        }
    }, [open, debouncedSearchTerm]);

    const handleDataChange = (productId, field, value) => {
        setItemData(prev => ({
            ...prev,
            [productId]: {
                ...prev[productId],
                [field]: value,
            },
        }));
    };

    const handleAddItem = async (product) => {
        const data = itemData[product.id] || {};
        const quantity = data.quantity || 1;
        const notes = data.notes || null;

        if (quantity <= 0) {
            message.warning('A quantidade deve ser maior que zero.');
            return;
        }

        setAddingProductId(product.id);
        try {
            await ApiService.post(`/orders/${orderId}/items`, {
                product_id: product.id,
                quantity: quantity,
                notes: notes, // Envia as notas para a API
            });
            message.success(`${quantity}x "${product.name}" adicionado(s) com sucesso!`);
            onSuccess();
        } catch (error) {
            message.error(error.response?.data?.detail || 'Falha ao adicionar o item.');
        } finally {
            setAddingProductId(null);
        }
    };

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            title="Adicionar Item à Comanda"
            width={700}
            footer={null}
        >
            <Input.Search
                placeholder="Buscar produto por nome ou código..."
                onChange={e => setSearchTerm(e.target.value)}
                style={{ marginBottom: 20 }}
                loading={loading}
                allowClear
            />
            <Spin spinning={loading}>
                {products.length > 0 ? (
                    <List
                        itemLayout="horizontal"
                        dataSource={products}
                        renderItem={product => (
                            <List.Item>
                                <List.Item.Meta
                                    avatar={<Avatar src={product.image_url || null}>{!product.image_url && product.name[0]}</Avatar>}
                                    title={product.name}
                                    description={`R$ ${product.price.toFixed(2)}`}
                                />
                                <Space direction="vertical" align="end">
                                    {/* --- NOVOS CAMPOS AQUI --- */}
                                    <Space.Compact>
                                        <InputNumber
                                            min={1}
                                            defaultValue={1}
                                            onChange={value => handleDataChange(product.id, 'quantity', value)}
                                            style={{ width: 70 }}
                                        />
                                        <Button
                                            type="primary"
                                            onClick={() => handleAddItem(product)}
                                            loading={addingProductId === product.id}
                                        >
                                            Adicionar
                                        </Button>
                                    </Space.Compact>
                                    <Input 
                                        placeholder="Observações (ex: sem cebola)"
                                        onChange={e => handleDataChange(product.id, 'notes', e.target.value)}
                                        style={{ width: '100%' }}
                                    />
                                    {/* --- FIM DOS NOVOS CAMPOS --- */}
                                </Space>
                            </List.Item>
                        )}
                    />
                ) : (
                    <Empty description="Nenhum produto encontrado." />
                )}
            </Spin>
        </Modal>
    );
};

export default AddItemModal;