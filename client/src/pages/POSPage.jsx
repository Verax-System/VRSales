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
  Image, // Importa o componente de Imagem
  Card,  // Importa o Card
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
  CameraOutlined, // Novo ícone para placeholder
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
  name: 'Salgadinho Doritos 28g',
  description: 'Salgadinho de milho sabor queijo nacho.',
  price: 4.50,
  stock: 50,
  image_url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR_p-5j-FR3u8hGk-b2K-2-vY-F7s_a-J-Q&s', // URL de imagem de exemplo
  barcode: '7898927019217',
};


const POSPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(dayjs().format('DD/MM/YYYY HH:mm:ss'));
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [lastAddedItem, setLastAddedItem] = useState(null); // NOVO ESTADO: Guarda o último item adicionado
  const searchInputRef = useRef(null);

  // --- EFEITOS (Hooks) ---
  useEffect(() => {
    // Foco automático no input de busca
    searchInputRef.current?.focus();

    // Listener para os atalhos de teclado
    const handleKeyDown = (event) => {
      if (event.key === 'F6') {
        event.preventDefault(); // Impede a ação padrão do navegador
        handleOpenPaymentModal();
      }
      if (event.key === 'F3') {
        event.preventDefault();
        handleCancelSale();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Limpa o listener quando o componente é desmontado
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [cartItems]); // Adiciona cartItems como dependência para a lógica dos atalhos

  useEffect(() => {
    // Atualiza o relógio a cada segundo
    const timer = setInterval(() => {
      setCurrentTime(dayjs().format('DD/MM/YYYY HH:mm:ss'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- LÓGICA DO CARRINHO ---
  const addProductToCart = (product) => {
    setLastAddedItem(product); // ATUALIZA O ÚLTIMO ITEM ADICIONADO
    setCartItems(currentItems => {
      const existingItem = currentItems.find(item => item.id === product.id);
      if (existingItem) {
        return currentItems.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [{ ...product, quantity: 1 }, ...currentItems]; // Adiciona no topo da lista
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
    setTimeout(() => {
      addProductToCart(mockProduct);
      setSearchValue('');
      searchInputRef.current?.focus();
      setLoading(false);
    }, 500);
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
        setLastAddedItem(null); // Limpa o último item
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
    setLastAddedItem(null); // Limpa o último item
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
      // MELHORIA VISUAL: Adiciona a imagem do produto na tabela
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
              style={{ marginBottom: '24px' }}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
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
              
              {/* --- NOVO PAINEL DO ÚLTIMO ITEM --- */}
              <Card bodyStyle={{ padding: 16 }}>
                {lastAddedItem ? (
                  <Space direction="vertical" align="center" style={{ width: '100%' }}>
                    <Image
                      width={150}
                      src={lastAddedItem.image_url}
                      preview={false}
                      fallback="https://via.placeholder.com/150" // Imagem caso a URL falhe
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
      />
    </>
  );
};

export default POSPage;