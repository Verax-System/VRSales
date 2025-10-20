import React, { useEffect } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
// Removido ApiService daqui, a lógica de submit é passada via props

const CustomerForm = ({ form, customer, onFinish, onCancel }) => { // Recebe form, onFinish e onCancel

  useEffect(() => {
    if (customer) {
      form.setFieldsValue(customer);
    } else {
      form.resetFields();
    }
  }, [customer, form]);

  const handleInternalFinish = async (values) => {
    // A lógica de API (ApiService.post/put) agora está na POSPage (handleCreateCustomer)
    // Apenas chamamos a função onFinish passada como prop
    try {
        await onFinish(values); // Chama a função passada pela POSPage
    } catch (error) {
        // O tratamento de erro principal também fica na POSPage
        console.error("Erro no formulário:", error);
        message.error("Verifique os dados do formulário.");
    }
  };

  return (
    <Form
      form={form} // Usa o form passado via props
      layout="vertical"
      onFinish={handleInternalFinish} // Chama o handler interno
      initialValues={customer}
    >
      <Form.Item
        name="full_name"
        label="Nome Completo"
        rules={[{ required: true, message: 'Por favor, insira o nome completo!' }]}
      >
        <Input prefix={<UserOutlined />} placeholder="Ex: João da Silva" size="large" />
      </Form.Item>
      <Form.Item
        name="email"
        label="E-mail"
        rules={[{ type: 'email', message: 'Por favor, insira um e-mail válido!' }]}
      >
        <Input prefix={<MailOutlined />} placeholder="Ex: joao.silva@email.com" size="large" />
      </Form.Item>
      <Form.Item
        name="phone_number"
        label="Telefone"
      >
        <Input prefix={<PhoneOutlined />} placeholder="Ex: (16) 99999-8888" size="large" />
      </Form.Item>
      {/* Adicione outros campos se necessário (CPF/CNPJ, etc.) */}

      {/* Botões de Ação */}
      <Form.Item style={{ textAlign: 'right', marginBottom: 0, marginTop: 24 }}>
        <Button onClick={onCancel} style={{ marginRight: 8 }} size="large">
          Cancelar
        </Button>
        <Button type="primary" htmlType="submit" size="large">
          {customer ? 'Salvar Alterações' : 'Adicionar Cliente'}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default CustomerForm;