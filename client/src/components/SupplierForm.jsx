import React, { useEffect, useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import ApiService from '../api/ApiService';

const SupplierForm = ({ supplier, onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (supplier) {
      form.setFieldsValue(supplier);
    } else {
      form.resetFields();
    }
  }, [supplier, form]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      if (supplier) {
        // Modo Edição
        await ApiService.updateSupplier(supplier.id, values);
        message.success(`Fornecedor "${values.name}" atualizado com sucesso!`);
      } else {
        // Modo Criação
        await ApiService.createSupplier(values);
        message.success(`Fornecedor "${values.name}" criado com sucesso!`);
      }
      onSuccess();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Erro ao salvar o fornecedor.';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Form.Item name="name" label="Nome do Fornecedor" rules={[{ required: true, message: 'Por favor, insira o nome!' }]}>
        <Input />
      </Form.Item>
      <Form.Item name="contact_person" label="Pessoa de Contato">
        <Input />
      </Form.Item>
      <Form.Item name="email" label="E-mail" rules={[{ type: 'email', message: 'Por favor, insira um e-mail válido!' }]}>
        <Input />
      </Form.Item>
      <Form.Item name="phone_number" label="Telefone">
        <Input />
      </Form.Item>
      <Form.Item style={{ textAlign: 'right', marginTop: '24px' }}>
        <Button onClick={onCancel} style={{ marginRight: 8 }}>
          Cancelar
        </Button>
        <Button type="primary" htmlType="submit" loading={loading}>
          {supplier ? 'Salvar Alterações' : 'Cadastrar Fornecedor'}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default SupplierForm;