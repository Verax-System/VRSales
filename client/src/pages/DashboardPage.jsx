import React, { useState, useEffect } from 'react';
import { Row, Col, Typography, message } from 'antd';
import ApiService from '../api/ApiService';
import KpiCard from '../components/dashboard/KpiCard';
import SalesByHourChart from '../components/dashboard/SalesByHourChart';
import TopProductsList from '../components/dashboard/TopProductsList';

const { Title } = Typography;

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await ApiService.getDashboardSummary();
        setDashboardData(response.data);
      } catch (error) {
        message.error('Falha ao carregar os dados do dashboard.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (value) => `R$ ${value.toFixed(2).replace('.', ',')}`;

  return (
    <div>
      <Title level={2} style={{ marginBottom: '24px' }}>Dashboard de Análise</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <KpiCard
            title="Receita de Hoje"
            value={dashboardData?.kpis_today?.total_revenue || 0}
            prefix="R$"
            precision={2}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KpiCard
            title="Vendas de Hoje"
            value={dashboardData?.kpis_today?.total_sales || 0}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KpiCard
            title="Ticket Médio (Hoje)"
            value={dashboardData?.kpis_today?.average_ticket || 0}
            prefix="R$"
            precision={2}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <KpiCard
            title="Novos Clientes (Hoje)"
            value={dashboardData?.kpis_today?.new_customers || 0}
            loading={loading}
          />
        </Col>

        <Col xs={24} lg={12}>
          <SalesByHourChart data={dashboardData?.sales_by_hour_today} loading={loading} />
        </Col>

        <Col xs={24} lg={12}>
            <TopProductsList
              title="Top 5 Produtos por Receita (Últimos 30 dias)"
              data={dashboardData?.top_5_products_by_revenue_last_30_days}
              loading={loading}
              valueKey="total_revenue_generated"
              valueFormatter={formatCurrency}
            />
        </Col>
        
         <Col xs={24} lg={12}>
             <TopProductsList
              title="Top 5 Produtos por Quantidade (Últimos 30 dias)"
              data={dashboardData?.top_5_products_by_quantity_last_30_days}
              loading={loading}
              valueKey="total_quantity_sold"
              valueFormatter={(val) => `${val} un.`}
            />
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;