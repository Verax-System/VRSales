import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Layout,
  Input,
  Table,
  Avatar,
  Typography,
  Statistic,
  Button,
  Space,
  Divider,
  message
} from 'antd';
import {
  BarcodeOutlined,
  ShoppingOutlined,
  PlusOutlined,
  MinusOutlined,
  DeleteOutlined,
  DollarCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import ApiService from '../api/ApiService';
import dayjs from 'dayjs';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

const POSPage = () => {
  // --- Estados do Componente ---
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(dayjs().format('DD/MM/YYYY HH:mm:ss'));
  const searchInputRef = useRef(null);

  // --- Efeitos ---
  // Foco automático no input de busca ao carregar a página
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Atualiza o relógio a cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs().format('DD/MM/YYYY HH:mm:ss'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- Lógica do Carrinho ---
  const addProductToCart = (product) => {
    setCartItems(currentItems => {
      const existingItem = currentItems.find(item => item.id === product.id);
      if (existingItem) {
        // Se o item já existe, apenas incrementa a quantidade
        return currentItems.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      // Se for um novo item, adiciona ao carrinho com quantidade 1
      return [...currentItems, { ...product, quantity: 1 }];
    });
    message.success(`${product.name} adicionado ao carrinho!`);
  };
  
  const updateQuantity = (productId, amount) => {
    setCartItems(currentItems => {
      return currentItems.map(item => {
        if (item.id === productId) {
          const newQuantity = item.quantity + amount;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
        }
        return item;
      }).filter(Boolean); // Remove itens que ficaram nulos (quantidade zero)
    });
  };

  const handleSearch = async (value) => {
    if (!value) return;
    setLoading(true);
    try {
      const response = await ApiService.lookupProduct(value);
      if (response.data.length === 1) {
        // Se encontrou exatamente um produto, adiciona direto ao carrinho
        addProductToCart(response.data[0]);
        // Limpa o input para a próxima leitura de código de barras
        if (searchInputRef.current) {
          searchInputRef.current.input.value = '';
          searchInputRef.current.focus();
        }
      } else if (response.data.length > 1) {
        // Futuramente, podemos abrir um modal para o usuário escolher entre os resultados
        message.info('Vários produtos encontrados. Selecione um para adicionar.');
      } else {
        message.error('Nenhum produto encontrado com este código ou nome.');
      }
    } catch (error) {
      message.error('Erro ao buscar o produto. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSale = () => {
    setCartItems([]);
    message.warning('Venda cancelada.');
  };

  // --- Cálculos ---
  const { subtotal, totalItems } = useMemo(() => {
    const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    return { subtotal, totalItems };
  }, [cartItems]);

  // --- Configuração da Tabela do Carrinho ---
  const cartColumns = [
    {
      title: 'Produto',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <Space>
          <Avatar src={record.image_url} icon={<ShoppingOutlined />} />
          <Text>{name}</Text>
        </Space>
      )
    },
    {
      title: 'Qtd.',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 150,
      render: (quantity, record) => (
        <Space>
          <Button size="small" icon={<MinusOutlined />} onClick={() => updateQuantity(record.id, -1)} />
          <Text strong style={{ minWidth: 20, textAlign: 'center' }}>{quantity}</Text>
          <Button size="small" icon={<PlusOutlined />} onClick={() => updateQuantity(record.id, 1)} />
        </Space>
      )
    },
    {
      title: 'Preço Unit.',
      dataIndex: 'price',
      key: 'price',
      render: price => `R$ ${price.toFixed(2).replace('.', ',')}`
    },
    {
      title: 'Total Item',
      key: 'total',
      render: (_, record) => `R$ ${(record.price * record.quantity).toFixed(2).replace('.', ',')}`
    },
    {
      key: 'action',
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => updateQuantity(record.id, -record.quantity)}
        />
      )
    }
  ];

  return (
    <Layout style={{ height: '100vh', backgroundColor: '#f0f2f5' }}>
      <Header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: '0 24px',
        borderBottom: '1px solid #f0f0f0'
      }}>
        <Text strong>Operador: ADMIN</Text>
        <Title level={4} style={{ margin: 0 }}>FRENTE DE CAIXA</Title>
        <Text strong>{currentTime}</Text>
      </Header>
      <Layout>
        <Content style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <Input
            ref={searchInputRef}
            placeholder="Leia o código de barras ou digite o nome do produto e pressione Enter"
            size="large"
            prefix={<BarcodeOutlined style={{ fontSize: 20, color: '#aaa' }} />}
            onPressEnter={(e) => handleSearch(e.target.value)}
            style={{ marginBottom: '24px' }}
          />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <Table
              columns={cartColumns}
              dataSource={cartItems}
              rowKey="id"
              pagination={false}
              scroll={{ y: 'calc(100vh - 300px)' }} // Ajuste de altura para o scroll
              locale={{ emptyText: 'Nenhum item no carrinho' }}
            />
          </div>
        </Content>
        <Sider width={400} theme="light" style={{ padding: '24px', borderLeft: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Title level={3}>Resumo da Venda</Title>
            <Divider />
            <Statistic title="Subtotal" value={subtotal} precision={2} prefix="R$" />
            <Statistic title="Total de Itens" value={totalItems} />
            <Divider />
            <div style={{ marginTop: 'auto' }}>
              <Title>TOTAL</Title>
              <Title style={{ fontSize: '4rem', color: '#1890ff', margin: 0 }}>
                R$ {subtotal.toFixed(2).replace('.', ',')}
              </Title>
            </div>
            <Divider />
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button type="primary" size="large" icon={<DollarCircleOutlined />} block style={{ height: '60px', fontSize: '1.2rem' }}>
                F6 - Finalizar Venda
              </Button>
              <Button danger size="large" icon={<CloseCircleOutlined />} block onClick={handleCancelSale}>
                F3 - Cancelar Venda
              </Button>
            </Space>
          </div>
        </Sider>
      </Layout>
    </Layout>
  );
};

export default POSPage;