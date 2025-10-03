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
  message,
  Modal,
} from 'antd';
import {
  BarcodeOutlined,
  ShoppingOutlined,
  PlusOutlined,
  MinusOutlined,
  DeleteOutlined,
  DollarCircleOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
// ApiService não será usado para a busca enquanto estivermos mocando
// import ApiService from '../api/ApiService'; 
import dayjs from 'dayjs';
import PaymentModal from '../components/PaymentModal';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

// --- DADOS FALSOS PARA SIMULAÇÃO (MOCK) ---
const mockProduct = {
  id: 1,
  name: 'Produto de Teste (Mock)',
  description: 'Este é um produto simulado.',
  price: 12.50,
  stock: 99,
  image_url: null,
  barcode: '123456789',
};


const POSPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(dayjs().format('DD/MM/YYYY HH:mm:ss'));
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const searchInputRef = useRef(null);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs().format('DD/MM/YYYY HH:mm:ss'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const addProductToCart = (product) => {
    setCartItems(currentItems => {
      const existingItem = currentItems.find(item => item.id === product.id);
      if (existingItem) {
        return currentItems.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
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
      }).filter(Boolean);
    });
  };
  
  // --- FUNÇÃO DE BUSCA SIMULADA ---
  const handleSearch = async (value) => {
    if (!value) return;
    setLoading(true);

    // Simula uma pequena espera, como se fosse uma chamada de API
    setTimeout(() => {
      // Adiciona o nosso produto de teste ao carrinho
      addProductToCart(mockProduct);
      setSearchValue(''); // Limpa o input
      searchInputRef.current?.focus();
      setLoading(false);
    }, 500); // 500ms de espera
  };

  const handleCancelSale = () => {
    if (cartItems.length === 0) return;
    Modal.confirm({
      title: 'Tem certeza?',
      content: 'Todos os itens serão removidos do carrinho.',
      okText: 'Sim, Cancelar Venda',
      cancelText: 'Não',
      onOk: () => {
        setCartItems([]);
        message.warning('Venda cancelada.');
        searchInputRef.current?.focus();
      }
    });
  };

  const handleOpenPaymentModal = () => {
    if (cartItems.length === 0) {
      message.error('Adicione pelo menos um item ao carrinho para finalizar a venda.');
      return;
    }
    setIsPaymentModalOpen(true);
  };

  const handleSaleSuccess = () => {
    setIsPaymentModalOpen(false);
    setCartItems([]);
    searchInputRef.current?.focus();
    Modal.success({
      title: 'Venda Concluída com Sucesso! (Simulação)',
      icon: <CheckCircleOutlined />,
      content: 'Em um ambiente real, a venda seria registrada no banco de dados.',
      okText: 'Iniciar Nova Venda'
    });
  };

  const { subtotal, totalItems } = useMemo(() => {
    const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    return { subtotal, totalItems };
  }, [cartItems]);

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
    <>
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
              placeholder="Digite qualquer coisa e pressione Enter para adicionar um item de teste"
              size="large"
              prefix={<BarcodeOutlined style={{ fontSize: 20, color: '#aaa' }} />}
              onPressEnter={(e) => handleSearch(e.target.value)}
              style={{ marginBottom: '24px' }}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <Table
                columns={cartColumns}
                dataSource={cartItems}
                rowKey="id"
                pagination={false}
                scroll={{ y: 'calc(100vh - 300px)' }}
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
                <Button 
                  type="primary" 
                  size="large" 
                  icon={<DollarCircleOutlined />} 
                  block style={{ height: '60px', fontSize: '1.2rem' }}
                  onClick={handleOpenPaymentModal}
                >
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

      <PaymentModal
        open={isPaymentModalOpen}
        onCancel={() => setIsPaymentModalOpen(false)}
        onOk={handleSaleSuccess}
        cartItems={cartItems}
        totalAmount={subtotal}
      />
    </>
  );
};

export default POSPage;