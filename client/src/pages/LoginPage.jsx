import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined, DesktopOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { Title } = Typography;

const LoginPage = () => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
      message.success('Login realizado com sucesso!');
    } catch (error) {
      message.error('Falha no login. Verifique seu e-mail e senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 400, boxShadow: '0 4px 8px 0 rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <DesktopOutlined style={{ fontSize: '48px', color: '#1890ff' }}/>
            <Title level={2}>VR Sales</Title>
        </div>
        <Form name="login" onFinish={onFinish}>
          <Form.Item name="email" rules={[{ required: true, message: 'Por favor, insira seu e-mail!' }, { type: 'email', message: 'E-mail inválido!' }]}>
            <Input prefix={<UserOutlined />} placeholder="E-mail" size="large" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Por favor, insira sua senha!' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Senha" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }} size="large" loading={loading}>
              Entrar
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;