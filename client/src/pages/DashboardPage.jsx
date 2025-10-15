import React, { useState, useEffect } from 'react';
import { Row, Col, Typography, message, Spin, Segmented } from 'antd';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import {
  DollarCircleOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  LineChartOutlined,
  CrownOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import ApiService from '../api/ApiService';
import SalesByHourChart from '../components/dashboard/SalesByHourChart'; // Reutilizado
import TopProductsList from '../components/dashboard/TopProductsList';   // Reutilizado
import './DashboardPage.modern.css'; // O novo arquivo de estilo!

const { Title, Text } = Typography;

// Um componente de Card de KPI redesenhado com ícones e cores
const KpiCard = ({ icon, title, value, prefix, loading, color }) => (
  <motion.div whileHover={{ y: -5 }} className="kpi-card-wrapper">
    <div className="kpi-card" style={{ borderBottom: `3px solid ${color}` }}>
      <div className="kpi-icon" style={{ backgroundColor: color }}>
        {icon}
      </div>
      <div className="kpi-content">
        <Text type="secondary">{title}</Text>
        {loading ? <Spin size="small" /> : <Title level={3} style={{ margin: 0 }}>{prefix}{value}</Title>}
      </div>
    </div>
  </motion.div>
);

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('today');

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

  const kpisData = timeRange === 'today'
    ? dashboardData?.kpis_today
    : dashboardData?.kpis_last_7_days;

  return (
    <motion.div
      className="dashboard-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="dashboard-header">
        <div>
          <Title level={2} style={{ color: 'white', margin: 0 }}>Dashboard de Análise</Title>
          <Text style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Olá, seja bem-vindo(a) de volta!</Text>
        </div>
        <Segmented
          options={[
            { label: 'Hoje', value: 'today' },
            { label: 'Últimos 7 dias', value: '7d' },
          ]}
          value={timeRange}
          onChange={setTimeRange}
        />
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            icon={<DollarCircleOutlined />}
            title="Receita Total"
            value={kpisData?.total_revenue || 0}
            prefix="R$ "
            loading={loading}
            color="#2ecc71"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            icon={<ShoppingCartOutlined />}
            title="Total de Vendas"
            value={kpisData?.total_sales || 0}
            loading={loading}
            color="#3498db"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            icon={<LineChartOutlined />}
            title="Ticket Médio"
            value={kpisData?.average_ticket || 0}
            prefix="R$ "
            loading={loading}
            color="#9b59b6"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KpiCard
            icon={<TeamOutlined />}
            title="Novos Clientes"
            value={kpisData?.new_customers || 0}
            loading={loading}
            color="#e67e22"
          />
        </Col>

        <Col xs={24} lg={12}>
            <TopProductsList
              title={<><CrownOutlined /> Top 5 Produtos por Receita (30 dias)</>}
              data={dashboardData?.top_5_products_by_revenue_last_30_days}
              loading={loading}
              valueKey="total_revenue_generated"
              valueFormatter={formatCurrency}
            />
        </Col>
        
        <Col xs={24} lg={12}>
            <TopProductsList
              title={<><BarChartOutlined /> Top 5 Produtos por Quantidade (30 dias)</>}
              data={dashboardData?.top_5_products_by_quantity_last_30_days}
              loading={loading}
              valueKey="total_quantity_sold"
              valueFormatter={(val) => `${val} un.`}
            />
        </Col>
        
        <Col span={24}>
          <SalesByHourChart data={dashboardData?.sales_by_hour_today} loading={loading} />
        </Col>
      </Row>
    </motion.div>
  );
};

export default DashboardPage;