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
  Image,
  Card,
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
  CameraOutlined,
  UserOutlined, // Ícone de usuário
} from '@ant-design/icons';
import ApiService from '../api/ApiService'; 
import dayjs from 'dayjs';
import PaymentModal from '../components/PaymentModal';
import CustomerSelect from '../components/CustomerSelect'; // Importe o novo componente

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

const POSPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(dayjs().format('DD/MM/YYYY HH:mm:ss'));
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [lastAddedItem, setLastAddedItem] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null); // Novo estado para o cliente
  const searchInputRef = useRef(null);

  useEffect(() => {
    searchInputRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'F6') {
        event.preventDefault();
        handleOpenPaymentModal();
      }
      if (event.key === 'F3') {
        event.preventDefault();
        handleCancelSale();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [cartItems]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs().format('DD/MM/YYYY HH:mm:ss'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const addProductToCart = (product) => {
    setLastAddedItem(product);
    setCartItems(currentItems => {
      const existingItem = currentItems.find(item => item.id === product.id);
      if (existingItem) {
        return currentItems.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [{ ...product, quantity: 1 }, ...currentItems];
    });
    message.success(`${product.name} adicionado!`);
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
  
  const handleSearch = async (value) => {
    if (!value) return;
    setLoading(true);
    try {
        const response = await ApiService.lookupProduct(value);
        if (response.data.length > 0) {
            // Se encontrar, adiciona o primeiro resultado ao carrinho
            addProductToCart(response.data[0]);
        } else {
            message.warning('Produto não encontrado.');
        }
    } catch (error) {
        message.error('Erro ao buscar o produto.');
    } finally {
        setSearchValue('');
        searchInputRef.current?.focus();
        setLoading(false);
    }
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
        setLastAddedItem(null);
        setSelectedCustomer(null); // Limpa o cliente selecionado
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
    setLastAddedItem(null);
    setSelectedCustomer(null); // Limpa o cliente selecionado
    searchInputRef.current?.focus();
    // Mensagem de sucesso já é mostrada no PaymentModal
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
          <Avatar shape="square" src={record.image_url} icon={<ShoppingOutlined />} />
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
      <Layout style={{ height: '100vh', overflow: 'hidden' }}>
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
        <Layout style={{ height: 'calc(100% - 64px)' }}>
          <Content style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <Input
              ref={searchInputRef}
              placeholder="Leia o código de barras ou digite o nome e pressione Enter"
              size="large"
              prefix={<BarcodeOutlined style={{ fontSize: 20, color: '#aaa' }} />}
              onPressEnter={(e) => handleSearch(e.target.value)}
              style={{ marginBottom: '16px' }}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              loading={loading}
            />
            {/* Bloco do Cliente */}
            <Card style={{ marginBottom: '16px' }} bodyStyle={{padding: '16px'}}>
              {selectedCustomer ? (
                <Space>
                  <UserOutlined />
                  <Text strong>Cliente: {selectedCustomer.full_name}</Text>
                  <Button type="link" danger size="small" onClick={() => setSelectedCustomer(null)}>Remover</Button>
                </Space>
              ) : (
                <CustomerSelect onSelectCustomer={setSelectedCustomer} />
              )}
            </Card>

            <div style={{ flex: 1, minHeight: 0 }}>
              <Table
                columns={cartColumns}
                dataSource={cartItems}
                rowKey="id"
                pagination={false}
                scroll={{ y: '100%' }}
                locale={{ emptyText: 'Nenhum item no carrinho. Passe um produto para começar.' }}
              />
            </div>
          </Content>
          <Sider width={400} theme="light" style={{ padding: '24px', borderLeft: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              
              <Card bodyStyle={{ padding: 16 }}>
                {lastAddedItem ? (
                  <Space direction="vertical" align="center" style={{ width: '100%' }}>
                    <Image
                      width={150}
                      src={lastAddedItem.image_url}
                      preview={false}
                      fallback="https://via.placeholder.com/150"
                    />
                    <Title level={4} style={{ textAlign: 'center' }}>{lastAddedItem.name}</Title>
                    <Statistic value={lastAddedItem.price} precision={2} prefix="R$" />
                  </Space>
                ) : (
                  <Space direction="vertical" align="center" style={{ width: '100%', height: 260, justifyContent: 'center' }}>
                    <CameraOutlined style={{ fontSize: 48, color: '#d9d9d9' }}/>
                    <Text type="secondary">Aguardando produto...</Text>
                  </Space>
                )}
              </Card>

              <Divider />
              
              <div style={{ marginTop: 'auto' }}>
                <Statistic title="Total de Itens" value={totalItems} />
                <Title level={4} style={{ color: 'gray', fontWeight: 400, marginTop: 16 }}>TOTAL</Title>
                <Title style={{ fontSize: '3.5rem', color: '#1890ff', margin: 0, lineHeight: 1 }}>
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
        customerId={selectedCustomer?.id} // Passa o ID do cliente para o modal
      />
    </>
  );
};

export default POSPage;