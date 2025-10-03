import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <Result
      status="403"
      title="403"
      subTitle="Desculpe, você não tem permissão para acessar esta página."
      extra={
        <Button type="primary" onClick={() => navigate('/')}>
          Voltar para a página inicial
        </Button>
      }
    />
  );
};

export default UnauthorizedPage;