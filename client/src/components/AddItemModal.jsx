import React, { useState, useEffect } from 'react';
import { Modal, Input, List, Avatar, Button, message, Spin, Empty, InputNumber, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import ApiService from '../api/ApiService';
import { useDebounce } from '../hooks/useDebounce';

const AddItemModal = ({ open, onCancel, orderId, onSuccess }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [quantities, setQuantities] = useState({});
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    const searchProducts = async () => {
      if (debouncedSearchTerm) {
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
    setQuantities(prevQuantities => ({
      ...prevQuantities,
      [productId]: quantity,
    }));
  };

  const handleAddItem = async (product, quantity) => {
    if (!quantity || quantity < 1) {
      message.error('A quantidade deve ser de pelo menos 1.');
      return;
    }
    try {
      const itemData = {
        product_id: product.id,
        quantity: quantity,
      };
      await ApiService.addItemToOrder(orderId, itemData);
      message.success(`${quantity}x "${product.name}" adicionado(s) à comanda!`);
      onSuccess();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Erro ao adicionar item.');
    }
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
      <Input.Search
        placeholder="Digite o nome ou código do produto"
        onChange={(e) => setSearchTerm(e.target.value)}
        loading={loading}
        style={{ marginBottom: 20 }}
        enterButton
      />
      {loading && products.length === 0 ? (
        <Spin style={{ display: 'block', margin: '20px 0' }} />
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={products}
          locale={{ emptyText: <Empty description="Nenhum produto encontrado" /> }}
          renderItem={(product) => (
            <List.Item
              actions={[
                <Space key={`action-${product.id}`}>
                  <InputNumber
                    min={1}
                    defaultValue={1}
                    value={quantities[product.id] || 1}
                    onChange={(value) => handleQuantityChange(product.id, value)}
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
                avatar={<Avatar shape="square" src={product.image_url} />}
                title={product.name}
                description={`R$ ${product.price.toFixed(2)}`}
              />
            </List.Item>
          )}
        />
      )}
    </Modal>
  );
};

export default AddItemModal;