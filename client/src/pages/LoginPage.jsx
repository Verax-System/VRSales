import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography, Space, Divider } from 'antd';
import { UserOutlined, LockOutlined, DesktopOutlined, ForwardOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { Title } = Typography;

const LoginPage = () => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
    } catch {
      message.error('Falha no login. Verifique seu e-mail e senha.');
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = (credentials) => {
    form.setFieldsValue(credentials);
    onFinish(credentials);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100%', background: '#f0f2f5' }}>
      <Card style={{ width: 400, boxShadow: '0 4px 8px 0 rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <DesktopOutlined style={{ fontSize: '48px', color: '#1890ff' }}/>
            <Title level={2}>VR Sales</Title>
        </div>
        <Form form={form} name="login" onFinish={onFinish} initialValues={{ email: 'admin@example.com' }}>
          <Form.Item name="email" rules={[{ required: true, message: 'Por favor, insira seu e-mail!' }, { type: 'email', message: 'E-mail inválido!' }]}>
            <Input prefix={<UserOutlined />} placeholder="E-mail" size="large" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Por favor, insira sua senha!' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Senha" size="large" />
          </Form.Item>
          <Form.Item>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button type="primary" htmlType="submit" style={{ width: '100%' }} size="large" loading={loading}>
                Entrar
              </Button>
              
              {/* --- INÍCIO DAS MODIFICAÇÕES --- */}
              {import.meta.env.DEV && (
                <>
                  <Button 
                    icon={<ForwardOutlined />} 
                    onClick={() => handleDevLogin({ email: 'admin@example.com', password: 'admin' })} 
                    style={{ width: '100%' }}
                    size="large"
                  >
                    Pular Login (Desenvolvimento)
                  </Button>
                  <Divider>Outras Funções</Divider>
                  <Space style={{width: '100%', justifyContent: 'center'}}>
                      <Button type="link" onClick={() => handleDevLogin({ email: 'gerente@example.com', password: 'admin'})}>
                          Logar como Gerente
                      </Button>
                      <Button type="link" onClick={() => handleDevLogin({ email: 'caixa@example.com', password: 'admin'})}>
                          Logar como Caixa
                      </Button>
                  </Space>
                </>
              )}
              {/* --- FIM DAS MODIFICAÇÕES --- */}
              
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;