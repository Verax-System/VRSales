import React, { useEffect } from 'react';
import { Form, Input, Button, message } from 'antd';
import ApiService from '../api/ApiService';

const CustomerForm = ({ customer, onSuccess, onCancel }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    // Se estivermos editando um cliente, preenche o formulário com os dados dele
    if (customer) {
      form.setFieldsValue(customer);
    } else {
      form.resetFields();
    }
  }, [customer, form]);

  const onFinish = async (values) => {
    try {
      if (customer) {
        // Lógica de atualização (PUT)
        await ApiService.put(`/customers/${customer.id}`, values);
        message.success('Cliente atualizado com sucesso!');
      } else {
        // Lógica de criação (POST)
        await ApiService.post('/customers/', values);
        message.success('Cliente criado com sucesso!');
      }
      // --- INÍCIO DA CORREÇÃO ---
      // Chama a função onSuccess passada pela página principal
      if (onSuccess) {
        onSuccess();
      }
      // --- FIM DA CORREÇÃO ---

    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Ocorreu um erro. Tente novamente.';
      message.error(`Falha ao salvar cliente: ${errorMessage}`);
      console.error('Erro ao salvar cliente:', error);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={customer}
    >
      <Form.Item
        name="full_name"
        label="Nome Completo"
        rules={[{ required: true, message: 'Por favor, insira o nome completo.' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="email"
        label="Email"
        rules={[{ type: 'email', message: 'O email inserido não é válido.' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="phone_number"
        label="Número de Telefone"
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="document_number"
        label="CPF/CNPJ"
      >
        <Input />
      </Form.Item>

      {/* Botões de Ação */}
      <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
        <Button onClick={onCancel} style={{ marginRight: 8 }}>
          Cancelar
        </Button>
        <Button type="primary" htmlType="submit">
          Guardar
        </Button>
      </Form.Item>
    </Form>
  );
};

export default CustomerForm;