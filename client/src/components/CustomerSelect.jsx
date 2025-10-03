import React, { useState, useEffect } from 'react';
import { Select, Button, Modal, Form, Input, message, Spin } from 'antd';
import { UserOutlined, PlusOutlined } from '@ant-design/icons';
import ApiService from '../api/ApiService';

const CustomerForm = ({ form, onFinish }) => (
  <Form form={form} layout="vertical" onFinish={onFinish}>
    <Form.Item name="full_name" label="Nome Completo" rules={[{ required: true, message: 'Insira o nome do cliente!' }]}>
      <Input />
    </Form.Item>
    <Form.Item name="phone_number" label="Telefone">
      <Input />
    </Form.Item>
    <Form.Item name="email" label="E-mail" rules={[{ type: 'email', message: 'E-mail inválido!' }]}>
      <Input />
    </Form.Item>
  </Form>
);

const CustomerSelect = ({ onSelectCustomer }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const fetchCustomers = async (searchValue = '') => {
    setLoading(true);
    try {
      // Idealmente, sua API teria um endpoint de busca. Por enquanto, filtramos no frontend.
      const response = await ApiService.getCustomers();
      const filteredData = response.data.filter(c =>
        c.full_name.toLowerCase().includes(searchValue.toLowerCase())
      );
      setCustomers(filteredData);
    } catch (error) {
      message.error('Erro ao buscar clientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCreateCustomer = async (values) => {
    try {
      const response = await ApiService.createCustomer(values);
      message.success(`Cliente "${response.data.full_name}" criado com sucesso!`);
      setIsModalVisible(false);
      form.resetFields();
      fetchCustomers(); // Atualiza a lista
      onSelectCustomer(response.data); // Seleciona o novo cliente
    } catch (error) {
      message.error(error.response?.data?.detail || 'Erro ao criar cliente.');
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <Select
        showSearch
        placeholder="Associar cliente (Opcional)"
        style={{ flex: 1 }}
        prefix={<UserOutlined />}
        allowClear
        onClear={() => onSelectCustomer(null)}
        onSelect={(_, option) => onSelectCustomer(option.customer)}
        onSearch={fetchCustomers}
        loading={loading}
        filterOption={false}
        notFoundContent={loading ? <Spin size="small" /> : null}
      >
        {customers.map(customer => (
          <Select.Option key={customer.id} value={customer.id} customer={customer}>
            {customer.full_name}
          </Select.Option>
        ))}
      </Select>
      <Button icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
        Novo
      </Button>
      <Modal
        title="Novo Cliente"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        okText="Salvar"
        cancelText="Cancelar"
      >
        <CustomerForm form={form} onFinish={handleCreateCustomer} />
      </Modal>
    </div>
  );
};

export default CustomerSelect;