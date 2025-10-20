// client/src/pages/SalesHistoryPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Card, Typography, message, Spin, Tag, Avatar, List, Space } from 'antd';
import { motion } from 'framer-motion';
import { HistoryOutlined, DollarCircleOutlined, CreditCardOutlined, QrcodeOutlined } from '@ant-design/icons';
import ApiService from '../api/ApiService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const PageStyles = () => (
    <style>{`
    .sales-history-container { padding: 24px; background-color: #f0f2f5; font-family: 'Inter', sans-serif; min-height: 100vh; }
    .sales-history-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; padding: 20px 24px; background: linear-gradient(135deg, #52c41a 0%, #08979c 100%); border-radius: 16px; color: white; box-shadow: 0 10px 30px -10px rgba(82, 196, 26, 0.5); }
    .table-card { border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: none; }
    .ant-table-thead > tr > th { font-weight: 600 !important; }
    `}</style>
);

const SalesHistoryPage = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchSales = useCallback(async () => {
        setLoading(true);
        try {
            const response = await ApiService.get('/sales/');
            setSales(response.data);
        } catch (error) {
            message.error('Falha ao carregar o histórico de vendas.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSales();
    }, [fetchSales]);

    const expandedRowRender = (record) => {
        return (
            <List
                header={<Text strong>Itens da Venda</Text>}
                dataSource={record.items}
                renderItem={(item) => (
                    <List.Item>
                        <List.Item.Meta
                            avatar={<Avatar src={item.product?.image_url} />}
                            title={`${item.quantity}x ${item.product?.name || 'Produto indisponível'}`}
                            description={`Preço unitário: R$ ${item.price_at_sale.toFixed(2)}`}
                        />
                        <div>
                            <Text strong>Total: R$ {(item.quantity * item.price_at_sale).toFixed(2)}</Text>
                        </div>
                    </List.Item>
                )}
            />
        );
    };
    
    // Mapeia os nomes dos pagamentos para ícones e cores para um visual melhor
    const paymentMethodVisuals = {
      cash: { icon: <DollarCircleOutlined />, color: 'success', text: 'Dinheiro' },
      credit_card: { icon: <CreditCardOutlined />, color: 'processing', text: 'Crédito' },
      debit_card: { icon: <CreditCardOutlined />, color: 'blue', text: 'Débito' },
      pix: { icon: <QrcodeOutlined />, color: 'purple', text: 'PIX' },
      other: { icon: <DollarCircleOutlined />, color: 'default', text: 'Outro' },
    };

    const columns = [
        { title: 'ID Venda', dataIndex: 'id', key: 'id', width: 100, sorter: (a, b) => a.id - b.id },
        {
            title: 'Data e Hora', dataIndex: 'created_at', key: 'created_at', sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
            render: (text) => dayjs(text).format('DD/MM/YYYY HH:mm'),
        },
        {
            title: 'Cliente', dataIndex: 'customer', key: 'customer',
            render: (customer) => customer ? customer.full_name : <Text type="secondary">N/A</Text>,
        },
        {
            title: 'Vendedor', dataIndex: 'user', key: 'user',
            render: (user) => user ? user.full_name : <Text type="secondary">N/A</Text>,
        },
        // --- CORREÇÃO PRINCIPAL AQUI ---
        {
            title: 'Pagamentos', dataIndex: 'payments', key: 'payments',
            render: (payments) => (
                <Space direction="vertical" size="small">
                    {payments.map(p => {
                        const visual = paymentMethodVisuals[p.payment_method] || paymentMethodVisuals.other;
                        return (
                            <Tag key={p.id} icon={visual.icon} color={visual.color}>
                                {visual.text}: R$ {p.amount.toFixed(2).replace('.', ',')}
                            </Tag>
                        );
                    })}
                </Space>
            ),
        },
        // --- FIM DA CORREÇÃO ---
        {
            title: 'Valor Total', dataIndex: 'total_amount', key: 'total_amount', sorter: (a, b) => a.total_amount - b.total_amount,
            render: (amount) => <Text strong>R$ {amount.toFixed(2).replace('.', ',')}</Text>,
        },
    ];

    return (
        <>
            <PageStyles />
            <motion.div className="sales-history-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="sales-history-header">
                    <HistoryOutlined style={{ fontSize: '28px' }} />
                    <Title level={2} style={{ color: 'white', margin: 0 }}>Histórico de Vendas</Title>
                </div>
                <Card className="table-card">
                    <Table
                        columns={columns}
                        dataSource={sales}
                        loading={loading}
                        rowKey="id"
                        expandable={{ expandedRowRender }}
                        pagination={{ pageSize: 15 }}
                    />
                </Card>
            </motion.div>
        </>
    );
};

export default SalesHistoryPage;