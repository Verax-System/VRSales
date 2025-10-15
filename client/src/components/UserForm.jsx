import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, message, Select, Switch } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, ShopOutlined } from '@ant-design/icons';
import ApiService from '../api/ApiService';
import { useAuth } from '../context/AuthContext';

const { Option } = Select;

const UserForm = ({ visible, onCancel, onFinish, user }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState([]);
  const { user: currentUser } = useAuth(); // Utilizador autenticado

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isEditing = !!user;

  // Carrega a lista de lojas apenas se o utilizador for um super admin
  useEffect(() => {
    if (isSuperAdmin) {
      const fetchStores = async () => {
        try {
          const response = await ApiService.getStores();
          setStores(response.data);
        } catch {
          message.error('Falha ao carregar a lista de lojas.');
        }
      };
      fetchStores();
    }
  }, [isSuperAdmin]);
  
  const onOk = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      // Se não for um super admin, a loja do novo utilizador será a mesma do admin atual
      if (!isSuperAdmin) {
        values.store_id = currentUser.store_id;
      }

      if (isEditing) {
        // Não enviamos a palavra-passe se não for alterada
        if (!values.password) {
          delete values.password;
        }
        await ApiService.updateUser(user.id, values);
        message.success('Utilizador atualizado com sucesso!');
      } else {
        await ApiService.createUser(values);
        message.success('Utilizador criado com sucesso!');
      }
      onFinish();
    } catch (error) {
      message.error('Ocorreu um erro ao guardar o utilizador.');
      console.error('Validation Failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    isSuperAdmin && { value: 'super_admin', label: 'Super Admin' },
    { value: 'admin', label: 'Admin' },
    { value: 'manager', label: 'Manager' },
    { value: 'cashier', label: 'Cashier' },
  ].filter(Boolean); // Remove o 'super_admin' se o utilizador não for um


  return (
    <Modal
      title={isEditing ? 'Editar Utilizador' : 'Criar Novo Utilizador'}
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
      <Form form={form} layout="vertical" initialValues={user || { is_active: true, role: 'cashier' }}>
        <Form.Item name="full_name" label="Nome Completo" rules={[{ required: true, message: 'O nome é obrigatório' }]}>
          <Input prefix={<UserOutlined />} placeholder="João da Silva" />
        </Form.Item>
        <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Insira um email válido' }]}>
          <Input prefix={<MailOutlined />} placeholder="exemplo@email.com" />
        </Form.Item>
        <Form.Item
          name="password"
          label={isEditing ? 'Nova Palavra-passe (deixe em branco para não alterar)' : 'Palavra-passe'}
          rules={[{ required: !isEditing, message: 'A palavra-passe é obrigatória' }, { min: 8, message: 'A palavra-passe deve ter no mínimo 8 caracteres' }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
        </Form.Item>
        <Form.Item name="role" label="Função" rules={[{ required: true }]}>
          <Select placeholder="Selecione uma função">
            {roles.map(role => (
              <Option key={role.value} value={role.value}>{role.label}</Option>
            ))}
          </Select>
        </Form.Item>
        
        {isSuperAdmin && (
          <Form.Item name="store_id" label="Loja" rules={[{ required: true, message: 'É obrigatório associar o utilizador a uma loja' }]}>
            <Select placeholder="Selecione a loja do utilizador" loading={!stores.length}>
              {stores.map(store => (
                <Option key={store.id} value={store.id}>{store.name}</Option>
              ))}
            </Select>
          </Form.Item>
        )}

        <Form.Item name="is_active" label="Status" valuePropName="checked">
          <Switch checkedChildren="Ativo" unCheckedChildren="Inativo" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UserForm;