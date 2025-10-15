import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, Typography, Spin } from 'antd';

const { Title } = Typography;

const SalesByHourChart = ({ data, loading }) => {
  return (
    <Card>
      <Title level={5}>Vendas por Hora (Hoje)</Title>
      {loading ? (
        <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" tickFormatter={(tick) => `${tick}:00`} />
            <YAxis allowDecimals={false} />
            <Tooltip formatter={(value) => [value, 'Vendas']} />
            <Legend />
            <Bar dataKey="total_sales" fill="#8884d8" name="Total de Vendas" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
};

export default SalesByHourChart;