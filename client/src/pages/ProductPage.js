import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, message, Space } from 'antd';
import ApiService from '../api/ApiService';
import ProductForm from '../components/ProductForm';

const ProductPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Função para carregar os produtos da API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getProducts();
      setProducts(data);
    } catch (error) {
      message.error('Falha ao carregar produtos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // useEffect para buscar os dados quando o componente é montado
  useEffect(() => {
    fetchProducts();
  }, []);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };
  
  // Função chamada quando o formulário é submetido com sucesso
  const handleFormSuccess = () => {
    setIsModalVisible(false);
    message.success('Produto salvo com sucesso!');
    fetchProducts(); // Recarrega a lista de produtos
  };

  // Definição das colunas para a Tabela do Ant Design
  const columns = [
    {
      title: 'Nome',
      dataIndex: 'name',
      key: 'name',
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
    },
    {
      title: 'Estoque',
      dataIndex: 'stock',
      key: 'stock',
    },
    {
        title: 'Ações',
        key: 'actions',
        render: (_, record) => (
          <Space size="middle">
            {/* Futuramente: botões de editar e excluir */}
            <a>Editar</a>
            <a>Excluir</a>
          </Space>
        ),
      },
  ];

  return (
    <div>
      <Button
        type="primary"
        onClick={showModal}
        style={{ marginBottom: 16 }}
      >
        Adicionar Produto
      </Button>

      <Table
        columns={columns}
        dataSource={products}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title="Adicionar Novo Produto"
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null} // O footer será controlado pelo formulário
      >
        <ProductForm onSuccess={handleFormSuccess} />
      </Modal>
    </div>
  );
};

export default ProductPage;