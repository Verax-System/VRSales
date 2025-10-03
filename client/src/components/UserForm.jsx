import React, { useEffect } from 'react';
import { Form, Input, Button, message, Select } from 'antd';

const { Option } = Select;

const UserForm = ({ user, onSuccess, onCancel, loading }) => {
  const [form] = Form.useForm();
  const isEditing = !!user;

  useEffect(() => {
    if (isEditing) {
      form.setFieldsValue(user);
    } else {
      form.resetFields();
    }
  }, [user, form, isEditing]);

  const onFinish = (values) => {
    // A lógica de chamada da API será feita na página principal
    onSuccess(values);
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Form.Item name="full_name" label="Nome Completo" rules={[{ required: true, message: 'Por favor, insira o nome completo!' }]}>
        <Input placeholder="Ex: João da Silva" />
      </Form.Item>
      <Form.Item name="email" label="E-mail" rules={[{ required: true, message: 'Por favor, insira o e-mail!' }, { type: 'email', message: 'E-mail inválido!' }]}>
        <Input placeholder="Ex: joao.silva@email.com" />
      </Form.Item>
      <Form.Item
        name="password"
        label={isEditing ? 'Nova Senha (opcional)' : 'Senha'}
        rules={isEditing ? [] : [{ required: true, message: 'Por favor, insira a senha!' }]}
        help={isEditing ? 'Deixe em branco para não alterar a senha.' : null}
      >
        <Input.Password placeholder="••••••••" />
      </Form.Item>
      <Form.Item name="role" label="Função" rules={[{ required: true, message: 'Por favor, selecione a função!' }]}>
        <Select placeholder="Selecione a função do usuário">
          <Option value="admin">Administrador</Option>
          <Option value="manager">Gerente</Option>
          <Option value="cashier">Operador de Caixa</Option>
        </Select>
      </Form.Item>
      <Form.Item style={{ textAlign: 'right', marginTop: '24px', marginBottom: 0 }}>
        <Button onClick={onCancel} style={{ marginRight: 8 }}>
          Cancelar
        </Button>
        <Button type="primary" htmlType="submit" loading={loading}>
          {isEditing ? 'Salvar Alterações' : 'Criar Usuário'}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default UserForm;