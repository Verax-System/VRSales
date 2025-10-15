import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, message, Input, Tag, Space, Avatar } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons';
import ApiService from '../api/ApiService';
import UserForm from '../components/UserForm'; // Vamos criar/atualizar este formulário

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchText, setSearchText] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getUsers();
      setUsers(response.data);
    } catch (error) {
      message.error('Falha ao carregar os utilizadores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenModal = (user = null) => {
    setEditingUser(user);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingUser(null);
  };

  const handleFinish = () => {
    fetchUsers();
    handleCancel();
  };

  const handleDelete = (userId) => {
    Modal.confirm({
      title: 'Tem a certeza que quer apagar este utilizador?',
      content: 'Esta ação não pode ser desfeita.',
      okText: 'Sim, apagar',
      okType: 'danger',
      cancelText: 'Não',
      onOk: async () => {
        try {
          await ApiService.deleteUser(userId);
          message.success('Utilizador apagado com sucesso!');
          fetchUsers();
        } catch (error) {
          message.error('Falha ao apagar o utilizador.');
        }
      },
    });
  };

  const roleColors = {
    super_admin: 'gold',
    admin: 'red',
    manager: 'blue',
    cashier: 'cyan',
  };

  const columns = [
    {
      title: 'Nome',
      dataIndex: 'full_name',
      key: 'full_name',
      render: (name) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <span className="font-semibold">{name}</span>
        </Space>
      )
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Função',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={roleColors[role] || 'default'} className="uppercase font-bold">
          {role.replace('_', ' ')}
        </Tag>
      ),
      filters: [
        { text: 'Super Admin', value: 'super_admin' },
        { text: 'Admin', value: 'admin' },
        { text: 'Manager', value: 'manager' },
        { text: 'Cashier', value: 'cashier' },
      ],
      onFilter: (value, record) => record.role.indexOf(value) === 0,
    },
     {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'gray'}>{isActive ? 'ATIVO' : 'INATIVO'}</Tag>
      ),
       filters: [
        { text: 'Ativo', value: true },
        { text: 'Inativo', value: false },
      ],
      onFilter: (value, record) => record.is_active === value,
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

  const filteredUsers = users.filter(user => 
    user.full_name.toLowerCase().includes(searchText.toLowerCase()) ||
    user.email.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-semibold text-gray-800">Gestão de Utilizadores</h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input
            placeholder="Procurar por nome ou email..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="w-full sm:w-64"
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
            Novo Utilizador
          </Button>
        </div>
      </div>
      <Table 
        columns={columns} 
        dataSource={filteredUsers} 
        loading={loading} 
        rowKey="id" 
        pagination={{ pageSize: 10 }}
      />
      
      {isModalVisible && (
        <UserForm
          visible={isModalVisible}
          onCancel={handleCancel}
          onFinish={handleFinish}
          user={editingUser}
        />
      )}
    </div>
  );
};

export default UsersPage;