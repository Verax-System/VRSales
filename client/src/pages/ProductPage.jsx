import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, message, Input, Tag, Avatar, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, AppstoreOutlined } from '@ant-design/icons';
import ApiService from '../api/ApiService';
import ProductForm from '../components/ProductForm'; // Assumindo que o seu formulário está neste componente

const ProductPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchText, setSearchText] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getProducts();
      setProducts(response.data);
    } catch (error) {
      message.error('Falha ao carregar os produtos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenModal = (product = null) => {
    setEditingProduct(product);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingProduct(null);
  };

  const handleFinish = () => {
    fetchProducts();
    handleCancel();
  };
  
  const handleDelete = (productId) => {
    Modal.confirm({
      title: 'Tem a certeza que quer apagar este produto?',
      content: 'Esta ação não pode ser desfeita.',
      okText: 'Sim, apagar',
      okType: 'danger',
      cancelText: 'Não',
      onOk: async () => {
        try {
          await ApiService.deleteProduct(productId);
          message.success('Produto apagado com sucesso!');
          fetchProducts();
        } catch (error) {
          message.error('Falha ao apagar o produto.');
        }
      },
    });
  };

  const columns = [
    {
      title: 'Produto',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <Space>
          <Avatar shape="square" src={record.image_url} icon={<AppstoreOutlined />} />
          <span className="font-semibold">{name}</span>
        </Space>
      )
    },
    {
      title: 'Preço',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `R$ ${price.toFixed(2).replace('.', ',')}`,
      sorter: (a, b) => a.price - b.price,
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock, record) => (
        stock < record.low_stock_threshold 
          ? <Tag color="volcano">{stock} (Baixo)</Tag> 
          : <Tag color="green">{stock}</Tag>
      ),
      sorter: (a, b) => a.stock - b.stock,
    },
    {
      title: 'Código de Barras',
      dataIndex: 'barcode',
      key: 'barcode',
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleOpenModal(record)}>
            Editar
          </Button>
          <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)}>
            Apagar
          </Button>
        </Space>
      ),
    },
  ];

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchText.toLowerCase()) ||
    (p.barcode && p.barcode.toLowerCase().includes(searchText.toLowerCase()))
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-semibold text-gray-800">Gestão de Produtos</h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input
            placeholder="Procurar por nome ou código de barras..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="w-full sm:w-64"
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
            Novo Produto
          </Button>
        </div>
      </div>
      <Table 
        columns={columns} 
        dataSource={filteredProducts} 
        loading={loading} 
        rowKey="id" 
        pagination={{ pageSize: 10 }}
      />
      
      {isModalVisible && (
        <ProductForm
          visible={isModalVisible}
          onCancel={handleCancel}
          onFinish={handleFinish}
          product={editingProduct}
        />
      )}
    </div>
  );
};

export default ProductPage;