import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Tag, Switch } from 'antd';
import { PlusOutlined, EditOutlined, ShopOutlined } from '@ant-design/icons';
import ApiService from '../../api/ApiService';

const StoresManagementPage = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [form] = Form.useForm();

  const fetchStores = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getStores();
      setStores(response.data);
    } catch (error) {
      message.error('Falha ao carregar a lista de lojas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleOpenModal = (store = null) => {
    setEditingStore(store);
    form.setFieldsValue(store || { name: '', address: '', is_active: true });
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingStore(null);
    form.resetFields();
  };

  const onFinish = async (values) => {
    try {
      if (editingStore) {
        await ApiService.updateStore(editingStore.id, values);
        message.success('Loja atualizada com sucesso!');
      } else {
        await ApiService.createStore(values);
        message.success('Loja criada com sucesso!');
      }
      fetchStores();
      handleCancel();
    } catch (error) {
      message.error('Ocorreu um erro ao guardar a loja.');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', sorter: (a, b) => a.id - b.id },
    { title: 'Nome da Loja', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
    { title: 'Endereço', dataIndex: 'address', key: 'address' },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'ATIVA' : 'INATIVA'}</Tag>
      ),
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (_, record) => (
        <Button icon={<EditOutlined />} onClick={() => handleOpenModal(record)}>
          Editar
        </Button>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Gestão de Lojas</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
          Nova Loja
        </Button>
      </div>
      <Table columns={columns} dataSource={stores} loading={loading} rowKey="id" />
      
      <Modal
        title={editingStore ? 'Editar Loja' : 'Criar Nova Loja'}
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="name" label="Nome da Loja" rules={[{ required: true, message: 'O nome é obrigatório' }]}>
            <Input prefix={<ShopOutlined />} />
          </Form.Item>
          <Form.Item name="address" label="Endereço">
            <Input />
          </Form.Item>
           <Form.Item name="is_active" label="Status" valuePropName="checked">
            <Switch checkedChildren="Ativa" unCheckedChildren="Inativa" />
          </Form.Item>
          <Form.Item className="text-right">
            <Button onClick={handleCancel} className="mr-2">Cancelar</Button>
            <Button type="primary" htmlType="submit">
              Guardar
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StoresManagementPage;