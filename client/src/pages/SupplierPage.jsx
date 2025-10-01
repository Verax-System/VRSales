import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Table, Button, Modal, message, Space, Input, Typography, Popconfirm, Tooltip, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, TeamOutlined } from '@ant-design/icons';
import ApiService from '../api/ApiService';
import SupplierForm from '../components/SupplierForm.jsx';

const { Title } = Typography;
const { Search } = Input;

const SupplierPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await ApiService.getSuppliers();
      setSuppliers(response.data);
    } catch (error) {
      message.error('Falha ao carregar fornecedores.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleModalSuccess = () => {
    setIsModalVisible(false);
    setEditingSupplier(null);
    fetchSuppliers();
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingSupplier(null);
  };

  const showCreateModal = () => {
    setEditingSupplier(null);
    setIsModalVisible(true);
  };

  const showEditModal = (supplier) => {
    setEditingSupplier(supplier);
    setIsModalVisible(true);
  };

  const handleDelete = async (supplierId) => {
    try {
      await ApiService.deleteSupplier(supplierId);
      message.success('Fornecedor excluído com sucesso!');
      fetchSuppliers();
    } catch (error) {
      message.error('Erro ao excluir o fornecedor.');
    }
  };

  const filteredSuppliers = useMemo(() => {
    if (!searchTerm) return suppliers;
    return suppliers.filter(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.contact_person && s.contact_person.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [suppliers, searchTerm]);

  const columns = [
    { title: 'Nome', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
    { title: 'Contato', dataIndex: 'contact_person', key: 'contact_person' },
    { title: 'E-mail', dataIndex: 'email', key: 'email' },
    { title: 'Telefone', dataIndex: 'phone_number', key: 'phone_number' },
    {
      title: 'Ações',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Editar">
            <Button type="text" icon={<EditOutlined style={{ color: '#1890ff' }} />} onClick={() => showEditModal(record)} />
          </Tooltip>
          <Popconfirm
            title="Tem certeza que deseja excluir?"
            onConfirm={() => handleDelete(record.id)}
            okText="Sim"
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
      <Title level={2} style={{ margin: 0 }}><TeamOutlined /> Gestão de Fornecedores</Title>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <Search
            placeholder="Buscar por nome ou contato..."
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, minWidth: '250px', maxWidth: '400px' }}
            allowClear
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={showCreateModal}>
            Adicionar Fornecedor
          </Button>
        </div>
      </Card>
      <Table columns={columns} dataSource={filteredSuppliers} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} scroll={{ x: true }}/>
      <Modal
        title={editingSupplier ? 'Editar Fornecedor' : 'Adicionar Novo Fornecedor'}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
      >
        <SupplierForm
          supplier={editingSupplier}
          onSuccess={handleModalSuccess}
          onCancel={handleCancel}
        />
      </Modal>
    </Space>
  );
};

export default SupplierPage;