import React, { useState, useEffect, useMemo } from 'react'; // A CORREÇÃO ESTÁ AQUI: Adicionado useMemo
import { Row, Col, Typography, message, Card, Spin, Space } from 'antd'; // Adicionado Space
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GlobalOutlined, DollarCircleOutlined, ShoppingCartOutlined, TeamOutlined, LineChartOutlined, ShopOutlined } from '@ant-design/icons';
import ApiService from '../../api/ApiService';
// Removida a importação do KpiCard externo, pois ele será definido aqui.

const { Title, Text } = Typography;

// Estilos embutidos para a nova página
const PageStyles = () => (
    <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    .global-dashboard-container { padding: 24px; background-color: #f0f2f5; font-family: 'Inter', sans-serif; min-height: 100vh; }
    .global-dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding: 20px 24px; background: linear-gradient(135deg, #6A11CB 0%, #2575FC 100%); border-radius: 16px; color: white; box-shadow: 0 10px 30px -10px rgba(106, 17, 203, 0.5); }
    .kpi-card-wrapper { height: 100%; }
    .kpi-card { display: flex; align-items: center; padding: 20px; background: #fff; border-radius: 12px; height: 100%; box-shadow: 0 4px 15px rgba(0,0,0,0.06); transition: all 0.3s ease; }
    .kpi-card:hover { transform: translateY(-5px); box-shadow: 0 8px 25px rgba(0,0,0,0.1); }
    .kpi-icon { font-size: 28px; color: white; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; border-radius: 50%; margin-right: 16px; }
    .kpi-content .ant-typography { margin: 0; }
    .kpi-content .ant-typography-secondary { margin-bottom: 4px; font-weight: 600; }
    .chart-card { border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: none; height: 100%; transition: all 0.3s ease; }
    .chart-card:hover { transform: translateY(-5px); box-shadow: 0 12px 24px rgba(0,0,0,0.12); }
    .chart-card .ant-card-head-title { font-weight: 600; font-size: 1.1rem; }
  `}</style>
);

// Componente KpiCard estilizado
const KpiCard = ({ icon, title, value, prefix, loading, color, precision = 0 }) => (
    <motion.div whileHover={{ y: -5 }} className="kpi-card-wrapper">
      <Card className="kpi-card" bodyStyle={{ padding: 0, width: '100%' }}>
        <div className="kpi-icon" style={{ backgroundColor: color }}>{icon}</div>
        <div className="kpi-content">
          <Text type="secondary">{title}</Text>
          {loading ? <Spin size="small" /> : (
            <Title level={3} style={{ margin: 0 }}>
              {prefix}{value.toLocaleString('pt-BR', { minimumFractionDigits: precision, maximumFractionDigits: precision })}
            </Title>
          )}
        </div>
      </Card>
    </motion.div>
);

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

    const chartData = useMemo(() => {
        return (data?.top_5_stores_by_revenue_last_7_days || [])
                 .sort((a, b) => b.total_revenue - a.total_revenue);
    }, [data]);

    const pageVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

    return (
        <>
            <PageStyles />
            <motion.div
                className="global-dashboard-container"
                variants={pageVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={itemVariants}>
                    <div className="global-dashboard-header">
                        <Title level={2} style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <GlobalOutlined /> Dashboard Global
                        </Title>
                    </div>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Title level={4} style={{ margin: '24px 0 16px', color: '#555', fontWeight: 600 }}>Desempenho Geral Hoje</Title>
                </motion.div>

                <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
                    <Col xs={24} sm={12} lg={6}><motion.div variants={itemVariants}><KpiCard icon={<DollarCircleOutlined />} title="Receita Global" value={data?.global_kpis_today?.total_revenue || 0} prefix="R$ " precision={2} loading={loading} color="#2ecc71" /></motion.div></Col>
                    <Col xs={24} sm={12} lg={6}><motion.div variants={itemVariants}><KpiCard icon={<ShoppingCartOutlined />} title="Vendas Globais" value={data?.global_kpis_today?.total_sales || 0} loading={loading} color="#3498db" /></motion.div></Col>
                    <Col xs={24} sm={12} lg={6}><motion.div variants={itemVariants}><KpiCard icon={<LineChartOutlined />} title="Ticket Médio Global" value={data?.global_kpis_today?.average_ticket || 0} prefix="R$ " precision={2} loading={loading} color="#9b59b6" /></motion.div></Col>
                    <Col xs={24} sm={12} lg={6}><motion.div variants={itemVariants}><KpiCard icon={<TeamOutlined />} title="Novos Clientes" value={data?.global_kpis_today?.new_customers || 0} loading={loading} color="#e67e22" /></motion.div></Col>
                </Row>

                <motion.div variants={itemVariants}>
                    <Card title={<Space><ShopOutlined /> Top 5 Lojas por Receita (Últimos 7 dias)</Space>} className="chart-card">
                        {loading ? <div style={{ textAlign: 'center', padding: '50px' }}><Spin /></div> : (
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                    <XAxis type="number" tickFormatter={formatCurrency} />
                                    <YAxis type="category" dataKey="store_name" width={120} tick={{ fontSize: 12 }} />
                                    <Tooltip formatter={(value) => [formatCurrency(value), 'Receita']} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
                                    <Bar dataKey="total_revenue" fill="#82ca9d" name="Receita" barSize={30} radius={[0, 5, 5, 0]}/>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </Card>
                </motion.div>
            </motion.div>
        </>
    );
};

export default GlobalDashboardPage;