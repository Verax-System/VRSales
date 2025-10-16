import React, { useState } from 'react';
import { Form, InputNumber, Button, message, Typography } from 'antd';
import { motion } from 'framer-motion';
import { DollarCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ApiService from '../api/ApiService';

const { Title, Text } = Typography;

// Estilos embutidos para a nova página
const PageStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

    .open-cash-register-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      width: 100%;
      background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
      background-size: 400% 400%;
      animation: gradient 15s ease infinite;
      font-family: 'Inter', sans-serif;
    }

    @keyframes gradient {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    .form-card {
      width: 420px;
      padding: 40px;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(25px);
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
    }

    .form-header {
      text-align: center;
      margin-bottom: 32px;
      color: #fff;
    }
    
    .form-header .anticon {
        font-size: 48px;
        margin-bottom: 16px;
    }
    
    .form-header .ant-typography-title,
    .form-header .ant-typography-secondary {
        color: #fff;
        text-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    .ant-form-item-label > label {
        color: #fff !important;
        font-weight: 600;
    }
    
    .open-cash-register-button {
        height: 50px !important;
        font-size: 1.1rem !important;
        font-weight: 600;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        transition: all 0.3s ease;
    }
    
    .open-cash-register-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }
  `}</style>
);

const OpenCashRegisterPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await ApiService.openCashRegister(values);
      message.success('Caixa aberto com sucesso!');
      navigate('/pos'); // Redireciona para a frente de caixa
    } catch (error) {
      message.error(error.response?.data?.detail || 'Erro ao abrir o caixa.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageStyles />
      <div className="open-cash-register-container">
        <motion.div
          className="form-card"
          initial={{ opacity: 0, scale: 0.8, y: -50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="form-header">
            <DollarCircleOutlined />
            <Title level={2}>Abertura de Caixa</Title>
            <Text type="secondary">Informe o saldo inicial para começar o dia.</Text>
          </div>
          <Form onFinish={onFinish} layout="vertical">
            <Form.Item
              name="opening_balance"
              label="Valor de Abertura (Suprimento)"
              rules={[{ required: true, message: 'O valor de abertura é obrigatório!' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                formatter={(value) => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value.replace(/R\$\s?|(,*)/g, '')}
                min={0}
                precision={2}
                size="large"
                autoFocus
              />
            </Form.Item>
            <Form.Item style={{ marginTop: '32px' }}>
              <Button type="primary" htmlType="submit" size="large" block loading={loading} className="open-cash-register-button">
                Abrir Caixa e Iniciar Vendas
              </Button>
            </Form.Item>
          </Form> 
          {/* A tag </Form> duplicada foi removida daqui */}
        </motion.div>
      </div>
    </>
  );
};

export default OpenCashRegisterPage;