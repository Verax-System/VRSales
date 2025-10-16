import React from 'react';
import { Button, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LockOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

// Estilos embutidos para a nova página
const PageStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

    .unauthorized-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      width: 100%;
      background: linear-gradient(-45deg, #e74c3c, #f39c12, #e67e22, #d35400);
      background-size: 400% 400%;
      animation: gradient 15s ease infinite;
      font-family: 'Inter', sans-serif;
    }

    @keyframes gradient {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    .result-card {
      width: 450px;
      padding: 40px;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(25px);
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
      text-align: center;
      color: #fff;
    }

    .result-icon {
        font-size: 64px;
        margin-bottom: 24px;
        color: #fff;
    }
    
    .result-card .ant-typography-title,
    .result-card .ant-typography {
        color: #fff;
        text-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    .back-home-button {
        height: 50px !important;
        font-size: 1rem !important;
        font-weight: 600;
        background: linear-gradient(135deg, #fff 0%, #eee 100%);
        border: none;
        color: #333;
        transition: all 0.3s ease;
        margin-top: 24px;
    }
    
    .back-home-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        color: #000;
    }
  `}</style>
);


const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <PageStyles />
      <div className="unauthorized-container">
        <motion.div
          className="result-card"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="result-icon">
            <LockOutlined />
          </div>
          <Title level={1}>Acesso Negado</Title>
          <Text style={{ fontSize: '16px' }}>
            Desculpe, você não tem permissão para acessar esta página.
          </Text>
          <Button
            type="primary"
            className="back-home-button"
            onClick={() => navigate('/')}
            size="large"
          >
            Voltar para a Página Inicial
          </Button>
        </motion.div>
      </div>
    </>
  );
};

export default UnauthorizedPage;