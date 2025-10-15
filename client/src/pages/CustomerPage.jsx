import { useState, useEffect } from 'react';
import { Button, Modal, message, Input, Space, Avatar, Tag, Tooltip, Card, Typography, Spin } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, UserOutlined, EyeOutlined, StarFilled, DollarCircleOutlined } from '@ant-design/icons';
import ApiService from '../api/ApiService';
import CustomerForm from '../components/CustomerForm';
import CustomerDetailsModal from '../components/CustomerDetailsModal';

const { Title, Text, Paragraph } = Typography;

// O CSS está agora dentro do componente para manter tudo em um único arquivo.
const PageStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

    .customer-page-container-v2 {
      padding: 24px;
      background: #f0f2f5;
      font-family: 'Inter', sans-serif;
      min-height: calc(100vh - 112px);
    }

    .page-header-gradient-v2 {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding: 20px 24px;
      background: linear-gradient(135deg, #3498db 0%, #8e44ad 100%);
      border-radius: 12px;
      color: white;
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    }

    .controls-card {
      margin-bottom: 24px;
      border-radius: 12px;
    }

    .customer-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 24px;
    }

    .customer-card {
      position: relative;
      border-radius: 12px;
      border: 1px solid #e8e8e8;
      transition: all 0.3s ease;
      overflow: hidden;
      border-left: 5px solid #3498db;
    }

    .customer-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    }

    .customer-card-header {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .customer-info {
      display: flex;
      flex-direction: column;
    }

    .customer-stats {
      display: flex;
      justify-content: space-between;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #f0f0f0;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .card-actions {
      position: absolute;
      top: 10px;
      right: 10px;
      display: flex;
      gap: 8px;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(5px);
      padding: 5px;
      border-radius: 8px;
      opacity: 0;
      transform: translateY(-10px);
      transition: all 0.2s ease-in-out;
    }

    .customer-card:hover .card-actions {
      opacity: 1;
      transform: translateY(0);
    }
  `}</style>
);

const CustomerPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchText, setSearchText] = useState('');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getCustomers();
      setCustomers(response.data);
    } catch {
      message.error('Falha ao carregar os clientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Handlers
  const handleOpenFormModal = (customer = null) => { setEditingCustomer(customer); setIsFormModalVisible(true); };
  const handleFormCancel = () => { setIsFormModalVisible(false); setEditingCustomer(null); };
  const handleFormFinish = () => { fetchCustomers(); handleFormCancel(); };
  const handleOpenDetailsModal = (customer) => { setSelectedCustomer(customer); setIsDetailsModalVisible(true); };
  const handleDetailsCancel = () => { setIsDetailsModalVisible(false); setSelectedCustomer(null); };

  const handleDelete = (customerId) => {
    Modal.confirm({
      title: 'Tem a certeza que quer apagar este cliente?',
      content: 'Esta ação não pode ser desfeita.',
      okText: 'Sim, apagar', okType: 'danger', cancelText: 'Não',
      onOk: async () => {
        try {
          await ApiService.deleteCustomer(customerId);
          message.success('Cliente apagado com sucesso!');
          fetchCustomers();
        } catch {
          message.error('Falha ao apagar o cliente.');
        }
      },
    });
  };

  const filteredCustomers = customers.filter(c =>
    c.full_name.toLowerCase().includes(searchText.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(searchText.toLowerCase())) ||
    (c.phone_number && c.phone_number.includes(searchText))
  );

  return (
    <>
      <PageStyles />
      <motion.div
        className="customer-page-container-v2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="page-header-gradient-v2">
          <Title level={2} style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <UserOutlined /> Gestão de Clientes
          </Title>
        </div>

        <Card className="controls-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Input
              placeholder="Buscar por nome, email ou telefone..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ maxWidth: 400 }}
              allowClear
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenFormModal()}>
              Adicionar Cliente
            </Button>
          </div>
        </Card>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>
        ) : (
          <AnimatePresence>
            <motion.div className="customer-grid" layout>
              {filteredCustomers.map((customer, index) => (
                <motion.div key={customer.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }}>
                  <Card className="customer-card">
                    <div className="card-actions">
                      <Tooltip title="Detalhes"><Button size="small" shape="circle" icon={<EyeOutlined />} onClick={() => handleOpenDetailsModal(customer)} /></Tooltip>
                      <Tooltip title="Editar"><Button size="small" shape="circle" icon={<EditOutlined />} onClick={() => handleOpenFormModal(customer)} /></Tooltip>
                      <Tooltip title="Excluir"><Button size="small" shape="circle" danger icon={<DeleteOutlined />} onClick={() => handleDelete(customer.id)} /></Tooltip>
                    </div>

                    <div className="customer-card-header">
                      <Avatar size={48} icon={<UserOutlined />} />
                      <div className="customer-info">
                        <Title level={5} style={{ margin: 0 }}>{customer.full_name}</Title>
                        <Text type="secondary">{customer.email || 'Sem email'}</Text>
                      </div>
                    </div>

                    <div className="customer-stats">
                      <div className="stat-item">
                        <DollarCircleOutlined style={{ color: '#27ae60' }} />
                        <Text>R$ {customer.total_spent.toFixed(2)}</Text>
                      </div>
                      <div className="stat-item">
                        <StarFilled style={{ color: '#f1c40f' }} />
                        <Text>{customer.loyalty_points} pts</Text>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>

      {isFormModalVisible && (
        <CustomerForm
          visible={isFormModalVisible}
          onCancel={handleFormCancel}
          onFinish={handleFormFinish}
          customer={editingCustomer}
        />
      )}

      {isDetailsModalVisible && (
        <CustomerDetailsModal
          visible={isDetailsModalVisible}
          onCancel={handleDetailsCancel}
          customer={selectedCustomer}
        />
      )}
    </>
  );
};

export default CustomerPage;