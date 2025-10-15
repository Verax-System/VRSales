import React, { useState, useEffect } from 'react';
import { Row, Col, Typography, message, Card } from 'antd';
import ApiService from '../../api/ApiService';
import KpiCard from '../../components/dashboard/KpiCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const { Title } = Typography;

const GlobalDashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await ApiService.getGlobalDashboardSummary();
        setData(response.data);
      } catch (error) {
        message.error('Falha ao carregar os dados do dashboard global.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatCurrency = (value) => `R$ ${value.toFixed(2).replace('.', ',')}`;

  return (
    <div>
      <Title level={2} className="mb-6 text-gray-800">Dashboard Global</Title>
      
      <Title level={4} className="mb-4 text-gray-600 font-normal">Desempenho Hoje</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <KpiCard title="Receita Global (Hoje)" value={data?.global_kpis_today?.total_revenue || 0} prefix="R$" precision={2} loading={loading} />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KpiCard title="Vendas Globais (Hoje)" value={data?.global_kpis_today?.total_sales || 0} loading={loading} />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KpiCard title="Ticket Médio Global (Hoje)" value={data?.global_kpis_today?.average_ticket || 0} prefix="R$" precision={2} loading={loading} />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KpiCard title="Novos Clientes (Hoje)" value={data?.global_kpis_today?.new_customers || 0} loading={loading} />
        </Col>
      </Row>

      <div className="mt-8">
        <Card>
          <Title level={5}>Top 5 Lojas por Receita (Últimos 7 dias)</Title>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.top_5_stores_by_revenue_last_7_days} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={formatCurrency} />
              <YAxis type="category" dataKey="store_name" width={120} />
              <Tooltip formatter={(value) => [formatCurrency(value), 'Receita']} />
              <Legend />
              <Bar dataKey="total_revenue" fill="#82ca9d" name="Receita Total" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};

export default GlobalDashboardPage;