import React, { useState, useEffect, useMemo } from 'react'; // A CORREÇÃO ESTÁ AQUI
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
  Tag,
  Switch,
  Card
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SafetyCertificateOutlined,
  LockOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import ApiService from '../api/ApiService';
import UserForm from '../components/UserForm';

const { Title, Text } = Typography;

const roleColors = {
  admin: 'red',
  manager: 'orange',
  cashier: 'blue',
};

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Usando dados mockados enquanto o backend não está pronto
      const response = await ApiService.getUsers();
      setUsers(response.data);
    } catch (error) {
      message.error('Falha ao carregar usuários.');
      setUsers([]); // Garante que 'users' seja um array em caso de erro
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleModalSuccess = async (values) => {
    setSubmitLoading(true);
    try {
      if (editingUser) {
        await ApiService.updateUser(editingUser.id, values);
        message.success(`Usuário "${values.full_name}" atualizado com sucesso!`);
      } else {
        await ApiService.createUser(values);
        message.success(`Usuário "${values.full_name}" criado com sucesso!`);
      }
      setIsModalVisible(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Erro ao salvar usuário.');
    } finally {
        setSubmitLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingUser(null);
  };
  
  const showCreateModal = () => {
    setEditingUser(null);
    setIsModalVisible(true);
  };

  const showEditModal = (user) => {
    setEditingUser(user);
    setIsModalVisible(true);
  };
  
  const handleStatusChange = async (userId, isActive) => {
    try {
        await ApiService.updateUser(userId, { is_active: isActive });
        message.success(`Status do usuário alterado com sucesso!`);
        // Atualiza o estado localmente para uma resposta visual mais rápida
        setUsers(currentUsers => 
            currentUsers.map(u => u.id === userId ? { ...u, is_active: isActive } : u)
        );
    } catch (error) {
        message.error('Erro ao alterar status do usuário.');
    }
  };

  const handleDelete = async (userId) => {
    try {
      await ApiService.deleteUser(userId);
      message.success('Usuário excluído com sucesso!');
      fetchUsers();
    } catch (error) {
      message.error('Erro ao excluir o usuário.');
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    return users.filter(user =>
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const columns = [
    {
      title: 'Nome',
      dataIndex: 'full_name',
      key: 'name',
      sorter: (a, b) => a.full_name.localeCompare(b.full_name),
      render: (name) => <Text strong>{name}</Text>,
    },
    {
      title: 'E-mail',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Função',
      dataIndex: 'role',
      key: 'role',
      filters: [
        { text: 'Admin', value: 'admin' },
        { text: 'Gerente', value: 'manager' },
        { text: 'Caixa', value: 'cashier' },
      ],
      onFilter: (value, record) => record.role.indexOf(value) === 0,
      render: (role) => <Tag color={roleColors[role] || 'default'}>{role ? role.toUpperCase() : 'N/A'}</Tag>,
    },
    {
        title: 'Status',
        dataIndex: 'is_active',
        key: 'status',
        filters: [
            { text: 'Ativo', value: true },
            { text: 'Inativo', value: false },
        ],
        onFilter: (value, record) => record.is_active === value,
        render: (isActive, record) => (
             <Tooltip title={isActive ? 'Desativar usuário' : 'Ativar usuário'}>
                <Switch 
                    checked={isActive} 
                    onChange={() => handleStatusChange(record.id, !isActive)}
                />
             </Tooltip>
        )
    },
    {
      title: 'Ações',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Editar">
            <Button type="text" icon={<EditOutlined style={{ color: '#1890ff' }} />} onClick={() => showEditModal(record)} />
          </Tooltip>
          <Tooltip title="Resetar Senha">
            <Popconfirm
                title="Deseja enviar um link de reset de senha?"
                onConfirm={() => message.info('Funcionalidade de reset de senha a ser implementada.')}
                okText="Sim"
                cancelText="Não"
            >
                <Button type="text" icon={<LockOutlined style={{ color: '#faad14' }} />} />
            </Popconfirm>
          </Tooltip>
          <Popconfirm
            title="Tem certeza que deseja excluir?"
            description="Esta ação não pode ser desfeita."
            onConfirm={() => handleDelete(record.id)}
            okText="Sim, Excluir"
            cancelText="Não"
          >
            <Tooltip title="Excluir">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Title level={2} style={{ margin: 0 }}><SafetyCertificateOutlined /> Gerenciamento de Usuários</Title>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <Input
            placeholder="Buscar por nome ou e-mail..."
            prefix={<SearchOutlined />}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, minWidth: '250px', maxWidth: '400px' }}
            allowClear
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={showCreateModal}>
            Adicionar Usuário
          </Button>
        </div>
      </Card>
      <Table columns={columns} dataSource={filteredUsers} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} scroll={{ x: true }}/>
      
      <Modal
        title={editingUser ? 'Editar Usuário' : 'Adicionar Novo Usuário'}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
      >
        <UserForm
          user={editingUser}
          onSuccess={handleModalSuccess}
          onCancel={handleCancel}
          loading={submitLoading}
        />
      </Modal>
    </Space>
  );
};

export default UsersPage;