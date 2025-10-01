import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Layout,
  Card,
  Tag,
  Avatar,
  Grid,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ShoppingOutlined,
  BoxPlotOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import ApiService from '../api/ApiService';
import ProductForm from '../components/ProductForm.jsx';

const { Title, Text } = Typography;
const { Search } = Input;
const { Content } = Layout;
const { useBreakpoint } = Grid;

// Componente para renderizar o nível de estoque com cores
const StockLevel = ({ stock }) => {
  if (stock === 0) {
    return <Tag icon={<WarningOutlined />} color="error">Esgotado</Tag>;
  }
  if (stock < 10) {
    return <Tag icon={<WarningOutlined />} color="warning">Estoque Baixo</Tag>;
  }
  return <Tag icon={<CheckCircleOutlined />} color="success">Em Estoque</Tag>;
};

const ProductPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const screens = useBreakpoint();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await ApiService.getProducts();
      setProducts(response.data);
    } catch (error) {
      message.error('Falha ao carregar produtos. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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
    message.success(`Produto ${editingProduct ? 'atualizado' : 'criado'} com sucesso!`);
    setIsModalVisible(false);
    setEditingProduct(null);
    fetchProducts();
  };

  const handleDelete = async (productId) => {
    try {
      await ApiService.deleteProduct(productId);
      message.success('Produto excluído com sucesso!');
      fetchProducts();
    } catch (error) {
      message.error('Erro ao excluir o produto.');
    }
  };

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    return products.filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.barcode && product.barcode.includes(searchTerm))
    );
  }, [products, searchTerm]);

  const columns = [
    {
      title: 'Produto',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name, record) => (
        <Space>
          <Avatar
            shape="square"
            size="large"
            src={record.image_url}
            icon={<ShoppingOutlined />}
          />
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: 'Preço',
      dataIndex: 'price',
      key: 'price',
      align: 'right',
      render: (price) => `R$ ${price.toFixed(2).replace('.', ',')}`,
      sorter: (a, b) => a.price - b.price,
    },
    {
      title: 'Estoque',
      dataIndex: 'stock',
      key: 'stock',
      align: 'center',
      sorter: (a, b) => a.stock - b.stock,
      render: (stock) => (
        <Space direction="vertical">
          <Text strong>{stock}</Text>
          <StockLevel stock={stock} />
        </Space>
      ),
    },
    {
      title: 'Ações',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Editar">
            <Button
              type="text"
              shape="circle"
              icon={<EditOutlined style={{ color: '#1890ff' }} />}
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
                type="text"
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
    <Layout style={{ padding: screens.md ? '24px' : '12px' }}>
      <Content
        style={{
          background: '#fff',
          padding: 24,
          margin: 0,
          minHeight: 'auto',
          borderRadius: '8px',
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Title level={2} style={{ margin: 0 }}>
            <BoxPlotOutlined /> Gerenciamento de Produtos
          </Title>

          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <Search
                placeholder="Buscar por nome ou código de barras..."
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ flex: 1, minWidth: '250px', maxWidth: '400px' }}
                allowClear
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={showCreateModal}>
                Adicionar Produto
              </Button>
            </div>
          </Card>

          <Table
            columns={columns}
            dataSource={filteredProducts}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 8, showSizeChanger: false }}
            scroll={{ x: true }} // Garante responsividade em telas menores
          />
        </Space>
      </Content>

      <Modal
        title={
          <Title level={4} style={{ margin: 0 }}>
            {editingProduct ? 'Editar Produto' : 'Adicionar Novo Produto'}
          </Title>
        }
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
        width={600}
      >
        <ProductForm
          product={editingProduct}
          onSuccess={handleFormSuccess}
          onCancel={handleCancel}
        />
      </Modal>
    </Layout>
  );
};

export default ProductPage;