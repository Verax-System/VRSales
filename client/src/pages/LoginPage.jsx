import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography, Space } from 'antd';
import { UserOutlined, LockOutlined, DesktopOutlined, ForwardOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { Title } = Typography;

const LoginPage = () => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm(); // Adiciona referência ao formulário

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
      message.success('Login realizado com sucesso!');
    } catch {
      message.error('Falha no login. Verifique seu e-mail e senha.');
    } finally {
      setLoading(false);
    }
  };
  
  // --- INÍCIO DO NOVO CÓDIGO ---

  // Função para o botão de pular login
  const handleSkipLogin = () => {
    // IMPORTANTE: Substitua com um usuário válido do seu ambiente de desenvolvimento
    const devCredentials = {
      email: 'admin@example.com',
      password: 'admin',
    };
    
    // Preenche o formulário e o submete programaticamente
    form.setFieldsValue(devCredentials);
    onFinish(devCredentials);
  };
  
  // --- FIM DO NOVO CÓDIGO ---

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100%', background: '#f0f2f5' }}>
      <Card style={{ width: 400, boxShadow: '0 4px 8px 0 rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <DesktopOutlined style={{ fontSize: '48px', color: '#1890ff' }}/>
            <Title level={2}>VR Sales</Title>
        </div>
        <Form form={form} name="login" onFinish={onFinish}>
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
              
              {/* --- INÍCIO DO NOVO CÓDIGO --- */}
              {/* Este botão só será renderizado em ambiente de desenvolvimento */}
              {import.meta.env.DEV && (
                <Button 
                  type="link" 
                  icon={<ForwardOutlined />} 
                  onClick={handleSkipLogin} 
                  style={{ width: '100%' }}
                >
                  Pular Login (Desenvolvimento)
                </Button>
              )}
              {/* --- FIM DO NOVO CÓDIGO --- */}
              
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;