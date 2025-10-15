import React, { useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, IdcardOutlined } from '@ant-design/icons';
import ApiService from '../api/ApiService';

const CustomerForm = ({ visible, onCancel, onFinish, customer }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const isEditing = !!customer;

  const onOk = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      if (isEditing) {
        await ApiService.updateCustomer(customer.id, values);
        message.success('Cliente atualizado com sucesso!');
      } else {
        await ApiService.createCustomer(values);
        message.success('Cliente criado com sucesso!');
      }
      onFinish();
    } catch {
      message.error('Ocorreu um erro ao guardar o cliente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEditing ? 'Editar Cliente' : 'Criar Novo Cliente'}
      visible={visible}
      onCancel={onCancel}
      destroyOnClose
      footer={[
        <Button key="back" onClick={onCancel}>
          Cancelar
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={onOk}>
          Guardar
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" initialValues={customer || {}}>
        <Form.Item name="full_name" label="Nome Completo" rules={[{ required: true, message: 'O nome é obrigatório' }]}>
          <Input prefix={<UserOutlined />} placeholder="João da Silva" />
        </Form.Item>
        <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Insira um email válido' }]}>
          <Input prefix={<MailOutlined />} placeholder="joao.silva@email.com" />
        </Form.Item>
        <Form.Item name="phone_number" label="Telefone">
          <Input prefix={<PhoneOutlined />} placeholder="(XX) XXXXX-XXXX" />
        </Form.Item>
        <Form.Item name="document_number" label="Documento (CPF/CNPJ)">
          <Input prefix={<IdcardOutlined />} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CustomerForm;