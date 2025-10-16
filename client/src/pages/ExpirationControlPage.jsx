import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, Modal, message, Space, Typography, Tag, DatePicker, Select, Form, InputNumber, notification, Spin, Segmented } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusOutlined, CalendarOutlined, WarningFilled, ExclamationCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import ApiService from '../api/ApiService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

// Estilos embutidos para a página
const PageStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

    .exp-page-container {
      padding: 24px;
      background-color: #f0f2f5;
      font-family: 'Inter', sans-serif;
      min-height: 100vh;
    }

    .exp-page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding: 20px 24px;
      background: linear-gradient(135deg, #e67e22 0%, #d35400 100%);
      border-radius: 16px;
      color: white;
      box-shadow: 0 10px 20px -10px rgba(230, 126, 34, 0.5);
    }

    .exp-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding: 16px;
      background-color: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    
    .batch-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 24px;
    }

    .batch-card {
      background: #fff;
      border-radius: 12px;
      border: 1px solid #e8e8e8;
      overflow: hidden;
      position: relative;
      transition: all 0.3s ease;
    }

    .batch-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 24px rgba(0,0,0,0.1);
    }
    
    .status-bar {
        width: 6px;
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
    }
    .status-bar.success { background: #2ecc71; }
    .status-bar.warning { background: #f39c12; }
    .status-bar.error { background: #e74c3c; }

    .card-content {
        padding: 20px;
        padding-left: 26px; /* Space for the status bar */
    }
    
    .card-footer {
        padding: 12px 20px;
        background: #fafafa;
        border-top: 1px solid #f0f0f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
  `}</style>
);

const getExpirationStatus = (expirationDate) => {
  const today = dayjs().startOf('day');
  const expDate = dayjs(expirationDate);
  const daysUntilExpiration = expDate.diff(today, 'day');

  if (daysUntilExpiration < 0) {
    return { variant: 'error', text: `Vencido há ${Math.abs(daysUntilExpiration)} dias`, days: daysUntilExpiration, icon: <ExclamationCircleOutlined /> };
  }
  if (daysUntilExpiration === 0) {
    return { variant: 'error', text: 'Vence Hoje!', days: daysUntilExpiration, icon: <WarningFilled /> };
  }
  if (daysUntilExpiration <= 7) {
    return { variant: 'error', text: `Vence em ${daysUntilExpiration} dias`, days: daysUntilExpiration, icon: <WarningFilled /> };
  }
  if (daysUntilExpiration <= 30) {
    return { variant: 'warning', text: `Vence em ${daysUntilExpiration} dias`, days: daysUntilExpiration, icon: <CalendarOutlined /> };
  }
  return { variant: 'success', text: 'Válido', days: daysUntilExpiration, icon: <CheckCircleOutlined /> };
};

const ExpirationControlPage = () => {
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [batchesResponse, productsResponse] = await Promise.all([
        ApiService.getProductBatches(),
        ApiService.getProducts()
      ]);
      const fetchedBatches = batchesResponse.data || [];
      setBatches(fetchedBatches.sort((a, b) => dayjs(a.expiration_date).unix() - dayjs(b.expiration_date).unix()));
      setProducts(productsResponse.data || []);
      
      const nearExpirationCount = fetchedBatches.filter(b => getExpirationStatus(b.expiration_date).days <= 7).length;
      if (nearExpirationCount > 0) {
        notification.warning({
          message: 'Produtos Próximos do Vencimento',
          description: `Você tem ${nearExpirationCount} lote(s) vencendo nos próximos 7 dias.`,
          icon: <WarningFilled />,
          duration: 10,
        });
      }
    } catch{
      message.error('Falha ao carregar dados.');
      setBatches([]); setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      values.expiration_date = values.expiration_date.toISOString();
      await ApiService.createProductBatch(values);
      message.success('Lote adicionado com sucesso!');
      setIsModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Erro ao salvar o lote.';
      message.error(errorMsg);
    }
  };

  const filteredBatches = useMemo(() => {
    if (filter === 'all') return batches;
    return batches.filter(batch => {
      const { days } = getExpirationStatus(batch.expiration_date);
      if (filter === 'expired') return days < 0;
      if (filter === 'today') return days === 0;
      if (filter === '7days') return days > 0 && days <= 7;
      return true;
    });
  }, [batches, filter]);

  const gridVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <>
      <PageStyles />
      <motion.div className="exp-page-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="exp-page-header">
          <Title level={2} style={{ color: 'white', margin: 0 }}>
            <CalendarOutlined style={{ marginRight: 12 }} /> Controle de Validade
          </Title>
        </div>

        <div className="exp-controls">
          <Space>
            <Text strong>Filtrar por:</Text>
            <Segmented
              options={[
                { label: 'Todos', value: 'all' },
                { label: 'Vence em 7 dias', value: '7days' },
                { label: 'Vence Hoje', value: 'today' },
                { label: 'Vencidos', value: 'expired' },
              ]}
              value={filter}
              onChange={setFilter}
            />
          </Space>
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
            Adicionar Lote
          </Button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>
        ) : (
          <motion.div className="batch-grid" variants={gridVariants} initial="hidden" animate="visible">
            <AnimatePresence>
              {filteredBatches.map(batch => {
                const status = getExpirationStatus(batch.expiration_date);
                return (
                  <motion.div key={batch.id} variants={cardVariants} layout>
                    <div className="batch-card">
                      <div className={`status-bar ${status.variant}`}></div>
                      <div className="card-content">
                        <Title level={4} style={{ marginBottom: 4 }}>{batch.product?.name || 'Produto não encontrado'}</Title>
                        <Text type="secondary">Quantidade: {batch.quantity}</Text>
                      </div>
                      <div className="card-footer">
                        <Text strong>Validade: {dayjs(batch.expiration_date).format('DD/MM/YYYY')}</Text>
                        <Tag icon={status.icon} color={status.variant === 'error' ? 'volcano' : status.variant}>{status.text}</Tag>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>

      <Modal
        title="Adicionar Novo Lote de Produto"
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        okText="Salvar"
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical" name="batch_form">
          <Form.Item name="product_id" label="Produto" rules={[{ required: true, message: 'Selecione um produto!' }]}>
            <Select showSearch placeholder="Selecione o produto" optionFilterProp="children">
              {products.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="quantity" label="Quantidade de itens no lote" rules={[{ required: true, message: 'Insira a quantidade!' }]}>
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item name="expiration_date" label="Data de Validade" rules={[{ required: true, message: 'Selecione a data!' }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ExpirationControlPage;