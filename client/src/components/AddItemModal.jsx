import React, { useState } from 'react';
import { Modal, Input, List, Avatar, Button, message, Spin, Empty, InputNumber } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import ApiService from '../api/ApiService';
import { useDebounce } from '../hooks/useDebounce'; // Criaremos este hook a seguir

const AddItemModal = ({ open, onCancel, orderId, onSuccess }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  React.useEffect(() => {
    const searchProducts = async () => {
      if (debouncedSearchTerm) {
        setLoading(true);
        try {
          const response = await ApiService.lookupProduct(debouncedSearchTerm);
          setProducts(response.data);
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

  const handleAddItem = async (product) => {
    try {
      const itemData = {
        product_id: product.id,
        quantity: 1, // Adiciona 1 por padrão, pode ser aprimorado com InputNumber
      };
      await ApiService.addItemToOrder(orderId, itemData);
      message.success(`"${product.name}" adicionado à comanda!`);
      onSuccess(); // Sinaliza para a página principal que o pedido foi atualizado
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
        <Spin />
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={products}
          locale={{ emptyText: <Empty description="Nenhum produto encontrado" /> }}
          renderItem={(product) => (
            <List.Item
              actions={[
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  onClick={() => handleAddItem(product)}
                >
                  Adicionar
                </Button>
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