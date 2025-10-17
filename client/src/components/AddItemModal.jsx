import React, { useState, useEffect } from 'react';
import { Modal, Input, List, Avatar, Button, message, Spin, Empty, InputNumber, Space, Typography } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import ApiService from '../api/ApiService';
import { useDebounce } from '../hooks/useDebounce';

const { Text } = Typography;

// Estilos embutidos para o componente
const ComponentStyles = () => (
  <style>{`
    .add-item-list .ant-list-item {
        padding: 12px;
        border-radius: 8px;
        transition: background-color 0.3s ease;
    }

    .add-item-list .ant-list-item:hover {
        background-color: #f9f9f9;
    }
  `}</style>
);

const AddItemModal = ({ open, onCancel, orderId, onSuccess }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [quantities, setQuantities] = useState({});
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    // Limpa a busca quando o modal é fechado
    if (!open) {
      setSearchTerm('');
      setProducts([]);
      setQuantities({});
    }
  }, [open]);

  useEffect(() => {
    const searchProducts = async () => {
      if (debouncedSearchTerm && debouncedSearchTerm.length > 2) {
        setLoading(true);
        try {
          const response = await ApiService.lookupProduct(debouncedSearchTerm);
          setProducts(response.data);
          setQuantities({}); // Reseta as quantidades a cada nova busca
        } catch (error) {
          message.error('Erro ao buscar produtos.');
        } finally {
          setLoading(false);
        }
      } else {
        setProducts([]);
      }
    };
    searchProducts();
  }, [debouncedSearchTerm]);

  const handleQuantityChange = (productId, quantity) => {
    setQuantities(prev => ({ ...prev, [productId]: quantity }));
  };

  const handleAddItem = async (product, quantity) => {
    if (!quantity || quantity < 1) {
      message.error('A quantidade deve ser de pelo menos 1.');
      return;
    }
    try {
      const itemData = { product_id: product.id, quantity: quantity };
      await ApiService.addItemToOrder(orderId, itemData);
      message.success(`${quantity}x "${product.name}" adicionado(s) à comanda!`);
      // Limpa o campo de busca e a lista para o próximo item
      setSearchTerm('');
      setProducts([]);
      onSuccess(); // Notifica a página pai para atualizar a comanda
    } catch (error) {
      message.error(error.response?.data?.detail || 'Erro ao adicionar item.');
    }
  };

  const listVariants = {
    visible: { transition: { staggerChildren: 0.05 } },
    hidden: {},
  };

  const itemVariants = {
    visible: { opacity: 1, y: 0 },
    hidden: { opacity: 0, y: 20 },
  };

  return (
    <Modal
      title="Adicionar Item à Comanda"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={700}
      destroyOnClose
    >
      <ComponentStyles />
      <Input.Search
        placeholder="Digite o nome ou código do produto (mín. 3 caracteres)"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        loading={loading}
        style={{ marginBottom: 20 }}
        enterButton={<Button type="primary" icon={<SearchOutlined />}>Buscar</Button>}
        size="large"
        autoFocus
      />
        <div style={{ minHeight: '300px' }}>
            <AnimatePresence>
                <motion.div initial="hidden" animate="visible" variants={listVariants}>
                    <List
                      className="add-item-list"
                      itemLayout="horizontal"
                      dataSource={products}
                      locale={{ emptyText: <Empty description={debouncedSearchTerm ? "Nenhum produto encontrado" : "Digite para buscar"} /> }}
                      renderItem={(product) => (
                        <motion.div variants={itemVariants}>
                            <List.Item
                              actions={[
                                <Space key={`action-${product.id}`}>
                                  <InputNumber
                                    min={1}
                                    defaultValue={1}
                                    value={quantities[product.id] || 1}
                                    onChange={(value) => handleQuantityChange(product.id, value)}
                                    size="middle"
                                  />
                                  <Button 
                                    type="primary" 
                                    icon={<PlusOutlined />} 
                                    onClick={() => handleAddItem(product, quantities[product.id] || 1)}
                                  >
                                    Adicionar
                                  </Button>
                                </Space>
                              ]}
                            >
                              <List.Item.Meta
                                avatar={<Avatar shape="square" size={48} src={product.image_url} />}
                                title={<Text strong>{product.name}</Text>}
                                description={`R$ ${product.price.toFixed(2)}`}
                              />
                            </List.Item>
                        </motion.div>
                      )}
                    />
                </motion.div>
            </AnimatePresence>
        </div>
    </Modal>
  );
};

export default AddItemModal;