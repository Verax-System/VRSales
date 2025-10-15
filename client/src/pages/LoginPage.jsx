import React, { useState } from 'react';
import { Form, Input, Button, message, Alert } from 'antd';
import { UserOutlined, LockOutlined, DesktopOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    setError('');
    try {
      await login(values.email, values.password);
      message.success('Login bem-sucedido! A redirecionar...');
      navigate('/');
    } catch (err) {
      setError('Email ou palavra-passe inválidos. Por favor, tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8"
      >
        <div className="text-center mb-8">
          <div className="inline-block bg-blue-500 text-white rounded-full p-4 mb-4">
            <DesktopOutlined style={{ fontSize: '32px' }} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Bem-vindo ao VR Sales</h1>
          <p className="text-gray-500">Faça login para aceder ao seu painel</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4"
          >
            <Alert message={error} type="error" showIcon closable onClose={() => setError('')} />
          </motion.div>
        )}

        <Form
          name="login_form"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="email"
            rules={[{ required: true, type: 'email', message: 'Por favor, insira um email válido!' }]}
          >
            <Input prefix={<UserOutlined className="site-form-item-icon" />} placeholder="Email" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Por favor, insira a sua palavra-passe!' }]}
          >
            <Input.Password prefix={<LockOutlined className="site-form-item-icon" />} placeholder="Palavra-passe" />
          </Form.Item>
          
          <Form.Item>
            <a className="float-right text-blue-500 hover:text-blue-700" href="">
              Esqueceu a palavra-passe?
            </a>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" className="w-full" loading={loading}>
              {loading ? 'A entrar...' : 'Entrar'}
            </Button>
          </Form.Item>
        </Form>
      </motion.div>
    </div>
  );
};

export default LoginPage;