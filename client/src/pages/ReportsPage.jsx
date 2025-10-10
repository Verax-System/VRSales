import React, { useState, useEffect } from 'react';
import { Row, Col, Card, DatePicker, Typography, Spin, Alert, Select, message } from 'antd';
import { Line, Column } from '@ant-design/charts';
import ApiService from '../api/ApiService';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

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
        
        // --- INÍCIO DA CORREÇÃO ---
        // Agora busca os dados reais da API em paralelo
        const [topProductsRes, salesEvolutionRes] = await Promise.all([
          ApiService.getTopSellingProducts(10),
          ApiService.getSalesEvolution(startDate, endDate)
        ]);

        setSalesData(salesEvolutionRes.data);
        setTopProducts(topProductsRes.data);
        // --- FIM DA CORREÇÃO ---

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
    height: 300,
    xAxis: { title: { text: 'Data' } },
    yAxis: { title: { text: 'Total de Vendas (R$)' } },
    tooltip: {
        formatter: (datum) => ({ name: 'Vendas', value: `R$ ${datum.value.toFixed(2)}` }),
    },
    smooth: true,
  };
  
  const productsConfig = {
    data: topProducts,
    // --- CORREÇÃO DO NOME DO CAMPO ---
    xField: 'product_name',
    yField: 'total_quantity', // O backend retorna 'total_quantity'
    // --- FIM DA CORREÇÃO ---
    height: 300,
    label: {
        position: 'middle',
        style: { fill: '#FFFFFF' },
    },
    xAxis: {
        label: {
            autoHide: true,
            autoRotate: false,
        },
        title: { text: 'Produtos', style: { fontSize: 14 } }
    },
    yAxis: { title: { text: 'Quantidade Vendida', style: { fontSize: 14 } } },
    meta: {
        product_name: { alias: 'Produto' },
        // --- CORREÇÃO DO NOME DO CAMPO ---
        total_quantity: { alias: 'Quantidade Vendida' },
        // --- FIM DA CORREÇÃO ---
    },
  };

  if (error) {
    return <Alert message="Erro de Carregamento" description={error} type="error" showIcon />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0 }}>Relatórios Gerenciais</Title>
          <RangePicker picker="date" value={dateRange} onChange={setDateRange} />
      </div>
      
      {loading ? <Spin size="large" style={{display: 'block', marginTop: 50}} /> : (
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card title="Evolução de Vendas no Período">
              <Line {...salesConfig} />
            </Card>
          </Col>
          <Col span={24}>
            <Card title="Top 10 Produtos Mais Vendidos (por Quantidade)">
                <Column {...productsConfig} />
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default ReportsPage;