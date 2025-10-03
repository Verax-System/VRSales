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
        // O ideal seria o backend fornecer os dados já agrupados por dia.
        // Como não temos esse endpoint, vamos simular os dados para o gráfico de linha.
        const [topProductsRes] = await Promise.all([
          ApiService.getTopSellingProducts(10)
        ]);
        
        const mockSales = [];
        let currentDate = dateRange[0].clone();
        while (currentDate.isBefore(dateRange[1]) || currentDate.isSame(dateRange[1])) {
            mockSales.push({
                date: currentDate.format('DD/MM'),
                value: Math.floor(Math.random() * (500 - 50 + 1) + 50) // Valor aleatório entre 50 e 500
            });
            currentDate = currentDate.add(1, 'day');
        }

        setSalesData(mockSales);
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
    xField: 'product_name',
    yField: 'total_quantity_sold',
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
        total_quantity_sold: { alias: 'Quantidade Vendida' },
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