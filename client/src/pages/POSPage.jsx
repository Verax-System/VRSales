import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Layout, Input, Table, Avatar, Typography, Statistic, Button, Space, Divider, message, Modal, Image, Card, Spin, Tooltip, Empty } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarcodeOutlined, ShoppingOutlined, PlusOutlined, MinusOutlined, DeleteOutlined,
  DollarCircleOutlined, CloseCircleOutlined, CameraOutlined, UserOutlined, WarningOutlined,
} from '@ant-design/icons';
import ApiService from '../api/ApiService';
import dayjs from 'dayjs';
import PaymentModal from '../components/PaymentModal';
import CustomerSelect from '../components/CustomerSelect';
import { useLocation, useNavigate } from 'react-router-dom';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

// Estilos embutidos com o design "Clean & Modern" + Mais Cores
const PageStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');

    .pos-page-layout {
      --primary-color: #0052CC;
      --primary-color-light: rgba(0, 82, 204, 0.05);
      --success-color-rgb: 0, 168, 120;
      --danger-color: #DE350B;
      --warning-color: #faad14;
      --page-bg: #F4F5F7;
      --card-bg: #FFFFFF;
      --text-primary: #172B4D;
      --text-secondary: #595959;
      --text-on-primary: #FFFFFF;
      --border-color: #e8e8e8;
      --zebra-stripe-color: #fafafa;
    }

    .pos-page-layout {
      height: 100vh;
      overflow: hidden;
      font-family: 'Inter', sans-serif;
      background-color: var(--page-bg);
      color: var(--text-primary);
      display: flex;
      flex-direction: column;
    }

    /* NOVO: Header Colorido */
    .pos-header {
      background: var(--primary-color);
      border-bottom: none;
      height: 72px;
      padding: 0 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: var(--text-on-primary);
      border-radius: 16px;
      margin: 16px 24px 0 24px;
      box-shadow: 0 8px 20px -5px rgba(0, 82, 204, 0.5);
    }

    .pos-header .ant-typography {
        color: var(--text-on-primary);
    }

    /* Ajuste no padding do layout para o novo header */
    .pos-content-layout {
        padding: 16px 24px 24px 24px;
        background: transparent;
        flex: 1;
        min-height: 0;
    }

    .pos-main-content {
      display: flex; flex-direction: column;
      gap: 16px;
      height: 100%; 
    }

    .clean-card {
        background: var(--card-bg); border-radius: 16px;
        border: none; box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
        height: 100%;
    }

    .cart-table-card {
        flex: 1;
        min-height: 0; /* Garante que ele possa encolher */
        display: flex;
        flex-direction: column;
    }

    .cart-table-card .ant-card-body {
        padding: 8px; height: 100%; display: flex; flex-direction: column;
    }
    
.cart-table .ant-table-wrapper { 
      /* --- INÍCIO DA ALTERAÇÃO --- */
      /* 5. É o wrapper da tabela que deve rolar, não a tabela em si */
      flex: 1; 
      min-height: 0;
      overflow-y: auto; 
      /* --- FIM DA ALTERAÇÃO --- */
    }

    /* NOVO: Cabeçalho da tabela colorido */
    .cart-table .ant-table-thead > tr > th {
        background-color: var(--primary-color-light);
        color: var(--primary-color);
        font-weight: 600;
    }
    
    .cart-table .ant-table-tbody > tr:nth-child(even) > td {
      background-color: var(--zebra-stripe-color);
    }

    @keyframes highlight-row {
      0% { background-color: rgba(var(--success-color-rgb), 0.25); }
      100% { background-color: transparent; }
    }
    .highlight-new-item td { animation: highlight-row 1.5s ease-out; }

    .search-input .ant-input-affix-wrapper {
        border-radius: 12px; background: var(--card-bg);
        border-color: #d9d9d9; box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    }
    .search-input .ant-input-affix-wrapper:hover,
    .search-input .ant-input-affix-wrapper-focused {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 2px rgba(0, 82, 204, 0.1);
    }

    .pos-sider { background: transparent !important; padding-left: 24px; }
    
    .sider-container {
        display: flex; flex-direction: column; gap: 24px;
        height: 100%; background: var(--card-bg);
        border-radius: 16px; padding: 24px;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
        overflow-y: auto;
    }

    /* NOVO: Destaque na Seção de Pagamento */
    .payment-section {
      margin-top: auto;
      background-color: var(--page-bg);
      border-radius: 12px;
      padding: 16px;
    }

    .total-display { text-align: right; }
    .total-display .total-label { font-size: 1.1rem; color: var(--text-secondary); font-weight: 600; }
    .total-display .total-amount .ant-statistic-content { 
        font-size: 3.5rem !important; font-weight: 900 !important; 
        color: var(--primary-color) !important; 
        line-height: 1 !important;
    }
    
    .action-buttons .ant-btn { 
        height: 60px !important; font-size: 1.2rem !important; 
        font-weight: 700; border-radius: 12px; 
        transition: all 0.2s ease-in-out;
    }
    .action-buttons .ant-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
    }
    .action-buttons .ant-btn-primary { background: var(--primary-color); }
    .action-buttons .ant-btn-dangerous { background: var(--danger-color); color: white !important; }
    .action-buttons .ant-btn-dangerous:hover { background: #ff4d4f; }
    .action-button-key { 
        font-weight: 700; margin-right: 8px; padding: 2px 6px; 
        border-radius: 4px; background: rgba(0,0,0,0.05); color: var(--text-secondary); 
    }
    .ant-btn-primary .action-button-key, .ant-btn-dangerous .action-button-key {
        background: rgba(255,255,255,0.2);
        color: white;
    }
  `}</style>
);

const POSPage = () => {
  // A lógica de estados e funções permanece a mesma
  const [cashRegisterStatus, setCashRegisterStatus] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(dayjs().format('DD/MM/YYYY HH:mm:ss'));
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [lastAddedItem, setLastAddedItem] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const searchInputRef = useRef(null);
  const location = useLocation();

  const handleCancelSale = useCallback(() => {
    if (cartItems.length === 0) return;
    Modal.confirm({
      title: 'Tem certeza?', content: 'Todos os itens serão removidos do carrinho.',
      okText: 'Sim, Cancelar Venda', cancelText: 'Não',
      onOk: () => { setCartItems([]); setLastAddedItem(null); setSelectedCustomer(null); message.warning('Venda cancelada.'); searchInputRef.current?.focus(); }
    });
  }, [cartItems]);

  const handleOpenPaymentModal = useCallback(() => {
    if (cartItems.length === 0) { message.error('Adicione pelo menos um item ao carrinho para finalizar a venda.'); return; }
    setIsPaymentModalOpen(true);
  }, [cartItems]);

  useEffect(() => {
    const checkCashRegister = async () => {
      try {
        const status = await ApiService.getCashRegisterStatus();
        setCashRegisterStatus(status.data);
      } catch (error) {
        if (error.response?.status === 404) {
          message.warning('Nenhum caixa aberto. Por favor, abra o caixa para começar.');
          navigate('/open-cash-register');
        } else { message.error('Erro ao verificar status do caixa.'); }
      } finally { setPageLoading(false); }
    };
    checkCashRegister();
  }, [navigate]);

  useEffect(() => { if (location.state?.orderItems) { setCartItems(location.state.orderItems); navigate(location.pathname, { replace: true, state: {} }); } }, [location, navigate]);

  useEffect(() => {
    searchInputRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'F6') { event.preventDefault(); handleOpenPaymentModal(); }
      if (event.key === 'F3') { event.preventDefault(); handleCancelSale(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    const timer = setInterval(() => setCurrentTime(dayjs().format('DD/MM/YYYY HH:mm:ss')), 1000);
    return () => { window.removeEventListener('keydown', handleKeyDown); clearInterval(timer); };
  }, [handleCancelSale, handleOpenPaymentModal]);

  const addProductToCart = (product) => {
    const productWithStock = { ...product, stock: Math.floor(Math.random() * 15) };
    setLastAddedItem(productWithStock);
    setCartItems(currentItems => {
      const existingItem = currentItems.find(item => item.id === productWithStock.id);
      if (existingItem) { return currentItems.map(item => item.id === productWithStock.id ? { ...item, quantity: item.quantity + 1 } : item); }
      return [{ ...productWithStock, quantity: 1, key: productWithStock.id }, ...currentItems];
    });
    message.success(`${productWithStock.name} adicionado!`);
  };

  const updateQuantity = (productId, amount) => {
    setCartItems(currentItems => currentItems.map(item => {
      if (item.id === productId) {
        const newQuantity = item.quantity + amount;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const handleSearch = async (value) => {
    if (!value) return;
    setLoading(true);
    try {
      const response = await ApiService.lookupProduct(value);
      if (response.data.length > 0) { addProductToCart(response.data[0]); }
      else { message.warning('Produto não encontrado.'); }
    } catch { message.error('Erro ao buscar o produto.'); }
    finally { setSearchValue(''); searchInputRef.current?.focus(); setLoading(false); }
  };

  const handleSaleSuccess = () => {
    setIsPaymentModalOpen(false); setCartItems([]); setLastAddedItem(null); setSelectedCustomer(null); searchInputRef.current?.focus();
  };

  const { subtotal, totalItems } = useMemo(() => {
    const sub = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const items = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    return { subtotal: sub, totalItems: items };
  }, [cartItems]);

  const cartColumns = [
    { 
      title: 'Produto', dataIndex: 'name', key: 'name', 
      render: (name, record) => (
        <Space>
          <Avatar shape="square" src={record.image_url} icon={<ShoppingOutlined />} /> 
          <Text>{name}</Text>
          {record.stock <= 5 && (
            <Tooltip title={`Estoque baixo! Apenas ${record.stock} unidades.`}>
              <WarningOutlined style={{ color: 'var(--warning-color)' }} />
            </Tooltip>
          )}
        </Space>
      )
    },
    { title: 'Qtd.', dataIndex: 'quantity', key: 'quantity', width: 150, render: (q, r) => <Space><Button size="small" icon={<MinusOutlined />} onClick={() => updateQuantity(r.id, -1)} /><Text strong style={{ minWidth: 20, textAlign: 'center' }}>{q}</Text><Button size="small" icon={<PlusOutlined />} onClick={() => updateQuantity(r.id, 1)} /></Space> },
    { title: 'Preço Unit.', dataIndex: 'price', key: 'price', render: p => `R$ ${p.toFixed(2).replace('.', ',')}` },
    { title: 'Total', key: 'total', render: (_, r) => <Text strong>R$ ${(r.price * r.quantity).toFixed(2).replace('.', ',')}</Text> },
    { key: 'action', render: (_, r) => <Tooltip title="Remover Item"><Button type="text" danger icon={<DeleteOutlined />} onClick={() => updateQuantity(r.id, -r.quantity)} /></Tooltip> }
  ];

  if (pageLoading) { return <Spin size="large" tip="Verificando status do caixa..." fullscreen />; }

  return (
    <>
      <PageStyles />
      <Layout className="pos-page-layout">
        {/* NOVO: Header agora está fora do Layout principal para ocupar a largura total */}
        <Header className="pos-header">
          <Text strong>Operador: {cashRegisterStatus?.user?.full_name || 'N/A'}</Text>
          <Title level={4} style={{ margin: 0 }}>FRENTE DE CAIXA</Title>
          <Text>{currentTime}</Text>
        </Header>
        <Layout className="pos-content-layout">
          <Content>
            <div className="pos-main-content">
              <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                <Input
                  className="search-input" ref={searchInputRef} placeholder="Leia o código de barras ou digite o nome e pressione Enter" size="large"
                  // NOVO: Ícone com cor funcional
                  prefix={<BarcodeOutlined style={{ fontSize: 20, color: 'var(--primary-color)' }} />}
                  onPressEnter={(e) => handleSearch(e.target.value)}
                  value={searchValue} onChange={(e) => setSearchValue(e.target.value)} loading={loading}
                />
              </motion.div>
              <Card className="clean-card cart-table-card">
                <Table
                  className="cart-table" columns={cartColumns} dataSource={cartItems} rowKey="id" pagination={false}
                  locale={{ emptyText: <Empty description="Nenhum item no carrinho." /> }}
                  rowClassName={(record) => record.id === lastAddedItem?.id ? 'highlight-new-item' : '' }
                />
              </Card>
            </div>
          </Content>
          <Sider width={450} className="pos-sider">
            <div className='sider-container'>
              <Card bordered={false} bodyStyle={{padding: 0}}>
                <CustomerSelect onSelectCustomer={setSelectedCustomer} />
              </Card>

              <Card bordered={false} bodyStyle={{padding: '16px 0'}}>
                <AnimatePresence mode="wait">
                  {lastAddedItem ? (
                    <motion.div key={lastAddedItem.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                      <Space direction="vertical" align="center" style={{ width: '100%' }}>
                        <Image width={120} height={120} src={lastAddedItem.image_url} preview={false} fallback="https://via.placeholder.com/150" style={{borderRadius: 8, objectFit: 'cover'}} />
                        <Title level={5} style={{ textAlign: 'center' }}>{lastAddedItem.name}</Title>
                        <Statistic value={lastAddedItem.price} precision={2} prefix="R$" />
                      </Space>
                    </motion.div>
                  ) : (
                    <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <Space direction="vertical" align="center" style={{ width: '100%', height: 213, justifyContent: 'center' }}>
                        <CameraOutlined style={{ fontSize: 48, color: '#bdc3c7' }}/>
                        <Text type="secondary">Aguardando produto...</Text>
                      </Space>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>

              {/* NOVO: Wrapper para a seção de pagamento */}
              <div className="payment-section">
                  <div className="total-display">
                      <Text className="total-label">VALOR TOTAL</Text>
                      <motion.div key={subtotal} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                          <Statistic value={subtotal} precision={2} prefix="R$" className="total-amount" />
                      </motion.div>
                      <Statistic title="Total de Itens" value={totalItems} />
                  </div>
                  <Divider style={{ margin: '16px 0' }}/>
                  <Space direction="vertical" style={{ width: '100%' }} size="middle" className="action-buttons">
                      <Button type="primary" size="large" icon={<DollarCircleOutlined />} block onClick={handleOpenPaymentModal}>
                          <span className="action-button-key">F6</span> FINALIZAR
                      </Button>
                      <Button danger size="large" icon={<CloseCircleOutlined />} block onClick={handleCancelSale}>
                          <span className="action-button-key">F3</span> CANCELAR
                      </Button>
                  </Space>
              </div>
            </div>
          </Sider>
        </Layout>
      </Layout>
      <PaymentModal open={isPaymentModalOpen} onCancel={() => setIsPaymentModalOpen(false)} onOk={handleSaleSuccess} cartItems={cartItems} totalAmount={subtotal} customerId={selectedCustomer?.id} />
    </>
  );
};

export default POSPage;