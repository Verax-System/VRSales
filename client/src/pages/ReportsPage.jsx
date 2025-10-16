import React, { useState, useEffect } from 'react';
// A CORREÇÃO ESTÁ AQUI: 'Space' foi adicionado e 'Select' foi removido por não ser usado. 'Text' será extraído do 'Typography'.
import { Row, Col, Card, DatePicker, Typography, Spin, Alert, message, Space } from 'antd';
import { motion } from 'framer-motion';
import { Line, Column } from '@ant-design/charts';
import { LineChartOutlined, CalendarOutlined } from '@ant-design/icons';
import ApiService from '../api/ApiService';
import dayjs from 'dayjs';

// A CORREÇÃO ESTÁ AQUI: Extraindo 'Title' e 'Text' do Typography.
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Estilos embutidos para a nova página de relatórios
const PageStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

    .reports-page-container {
      padding: 24px;
      background-color: #f0f2f5;
      font-family: 'Inter', sans-serif;
      min-height: 100vh;
    }

    .reports-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding: 20px 24px;
      background: linear-gradient(135deg, #26A69A 0%, #007991 100%);
      border-radius: 16px;
      color: white;
      box-shadow: 0 10px 30px -10px rgba(0, 121, 145, 0.5);
    }
    
    .report-card {
        border-radius: 16px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        border: none;
        height: 100%;
        transition: all 0.3s ease;
    }
    
    .report-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 24px rgba(0,0,0,0.12);
    }

    .report-card .ant-card-head-title {
        font-weight: 600;
        font-size: 1.1rem;
    }
  `}</style>
);

const ReportsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);

  useEffect(() => {
    const fetchData = async () => {
      if (!dateRange || dateRange.length !== 2) return;
      setLoading(true);
      setError(null);
      try {
        const startDate = dateRange[0].format('YYYY-MM-DD');
        const endDate = dateRange[1].format('YYYY-MM-DD');
        
        const [topProductsRes, salesEvolutionRes] = await Promise.all([
          ApiService.getTopSellingProducts(10),
          ApiService.getSalesEvolution(startDate, endDate)
        ]);

        setSalesData(salesEvolutionRes.data);
        setTopProducts(topProductsRes.data);
      } catch (err) {
        setError('Falha ao buscar dados para os relatórios.');
        message.error('Não foi possível carregar os relatórios.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateRange]);
  
  const salesConfig = {
    data: salesData,
    xField: 'date',
    yField: 'value',
    height: 350,
    xAxis: { title: { text: 'Data' } },
    yAxis: { title: { text: 'Total de Vendas (R$)' } },
    tooltip: { formatter: (datum) => ({ name: 'Vendas', value: `R$ ${datum.value.toFixed(2)}` }) },
    smooth: true,
    area: { style: { fill: 'l(270) 0:#ffffff 0.5:#7ec2f3 1:#1890ff' } },
    line: { color: '#1890ff' },
  };
  
  const productsConfig = {
    data: topProducts,
    xField: 'product_name',
    yField: 'total_quantity',
    height: 350,
    xAxis: { label: { autoHide: true, autoRotate: false } },
    yAxis: { title: { text: 'Quantidade Vendida' } },
    meta: {
        product_name: { alias: 'Produto' },
        total_quantity: { alias: 'Quantidade Vendida' },
    },
    color: '#27ae60',
  };

  if (error) {
    return <Alert message="Erro de Carregamento" description={error} type="error" showIcon />;
  }

  return (
    <>
      <PageStyles />
      <motion.div className="reports-page-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="reports-header">
          <Title level={2} style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            <LineChartOutlined /> Relatórios Gerenciais
          </Title>
        </div>
        
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
            <Card style={{ marginBottom: 24, borderRadius: 12 }}>
                <Space>
                    <CalendarOutlined style={{ fontSize: 20, color: '#555' }}/>
                    <Text strong>Selecione o Período:</Text>
                    <RangePicker picker="date" value={dateRange} onChange={setDateRange} size="large" />
                </Space>
            </Card>
        </motion.div>
        
        {loading ? <div style={{textAlign: 'center', padding: 50}}><Spin size="large" /></div> : (
          <Row gutter={[24, 24]}>
            <Col span={24}>
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                <Card title="Evolução de Vendas no Período" className="report-card">
                  <Line {...salesConfig} />
                </Card>
              </motion.div>
            </Col>
            <Col span={24}>
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                <Card title="Top 10 Produtos Mais Vendidos (por Quantidade)" className="report-card">
                    <Column {...productsConfig} />
                </Card>
              </motion.div>
            </Col>
          </Row>
        )}
      </motion.div>
    </>
  );
};

export default ReportsPage;