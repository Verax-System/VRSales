import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  Button,
  Modal,
  message,
  Space,
  Input,
  Typography,
  Popconfirm,
  Tooltip,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import ApiService from '../api/ApiService';
import ProductForm from '../components/ProductForm.jsx';

const { Title } = Typography;
const { Search } = Input;

const ProductPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Busca os dados da API
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await ApiService.getProducts();
      setProducts(response.data);
    } catch (error) {
      message.error('Falha ao carregar produtos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Funções para controlar o Modal
  const showCreateModal = () => {
    setEditingProduct(null);
    setIsModalVisible(true);
  };

  const showEditModal = (product) => {
    setEditingProduct(product);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingProduct(null);
  };

  const handleFormSuccess = () => {
    setIsModalVisible(false);
    setEditingProduct(null);
    fetchProducts(); // Recarrega a lista de produtos
  };

  // Função para deletar produto
  const handleDelete = async (productId) => {
    try {
      await ApiService.deleteProduct(productId);
      message.success('Produto excluído com sucesso!');
      fetchProducts();
    } catch (error) {
      message.error('Erro ao excluir o produto.');
    }
  };

  // Filtra os produtos com base na busca (em tempo real)
  const filteredProducts = useMemo(() => {
    if (!searchTerm) {
      return products;
    }
    return products.filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  // Colunas da tabela
  const columns = [
    {
      title: 'Nome',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Descrição',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Preço',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `R$ ${price.toFixed(2)}`,
      sorter: (a, b) => a.price - b.price,
    },
    {
      title: 'Estoque',
      dataIndex: 'stock',
      key: 'stock',
      sorter: (a, b) => a.stock - b.stock,
    },
    {
      title: 'Ações',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Editar">
            <Button
              type="primary"
              shape="circle"
              icon={<EditOutlined />}
              onClick={() => showEditModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Tem certeza que deseja excluir?"
            onConfirm={() => handleDelete(record.id)}
            okText="Sim"
            cancelText="Não"
          >
            <Tooltip title="Excluir">
              <Button
                type="primary"
                danger
                shape="circle"
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>Gerenciamento de Produtos</Title>
        <Space>
          <Search
            placeholder="Buscar produto..."
            onSearch={(value) => setSearchTerm(value)}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 300 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={showCreateModal}>
            Adicionar Produto
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredProducts}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingProduct ? 'Editar Produto' : 'Adicionar Novo Produto'}
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose // Garante que o estado do formulário seja resetado ao fechar
      >
        <ProductForm
          product={editingProduct}
          onSuccess={handleFormSuccess}
          onCancel={handleCancel}
        />
      </Modal>
    </Space>
  );
};

export default ProductPage;