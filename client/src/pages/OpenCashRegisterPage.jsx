import React, { useState } from 'react';
import { Form, InputNumber, Button, Card, message, Typography } from 'antd';
import { DollarCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ApiService from '../api/ApiService';

const { Title, Text } = Typography;

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
    // --- CORREÇÃO AQUI ---
    // Adicionado 'width: '100%'' para que a div ocupe toda a largura
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100%', background: '#f0f2f5' }}>
      <Card style={{ width: 400, boxShadow: '0 4px 8px 0 rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Title level={2}>Abrir Caixa</Title>
          <Text type="secondary">Informe o valor inicial (suprimento) para começar o dia.</Text>
        </div>
        <Form onFinish={onFinish} layout="vertical">
          <Form.Item
            name="opening_balance"
            label="Valor de Abertura"
            rules={[{ required: true, message: 'O valor de abertura é obrigatório!' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              prefix="R$"
              min={0}
              precision={2}
              size="large"
              autoFocus
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={loading} icon={<DollarCircleOutlined />}>
              Abrir Caixa e Iniciar Vendas
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default OpenCashRegisterPage;