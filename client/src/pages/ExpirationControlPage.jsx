import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Modal, message, Space, Input, Typography, Tag, DatePicker, Select, Form, InputNumber, notification } from 'antd';
import { PlusOutlined, CalendarOutlined, WarningFilled } from '@ant-design/icons';
import ApiService from '../api/ApiService';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

// Função para determinar o status do lote
const getExpirationStatus = (expirationDate) => {
  const today = dayjs().startOf('day');
  const expDate = dayjs(expirationDate);
  const daysUntilExpiration = expDate.diff(today, 'day');

  if (daysUntilExpiration < 0) {
    return { color: 'error', text: 'Vencido', days: daysUntilExpiration };
  }
  if (daysUntilExpiration <= 7) {
    return { color: 'error', text: `Vence em ${daysUntilExpiration} dias`, days: daysUntilExpiration };
  }
  if (daysUntilExpiration <= 30) {
    return { color: 'warning', text: `Vence em ${daysUntilExpiration} dias`, days: daysUntilExpiration };
  }
  return { color: 'success', text: 'Válido', days: daysUntilExpiration };
};


const ExpirationControlPage = () => {
  const [batches, setBatches] = useState([]); // Lotes de produtos
  const [products, setProducts] = useState([]); // Lista de produtos para o formulário
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  
  // Função para buscar os dados
  const fetchData = async () => {
    setLoading(true);
    try {
      // Usaremos dados MOCK enquanto o backend não está pronto
      const mockBatches = [
          { id: 1, product: { id: 1, name: 'Leite Integral 1L' }, quantity: 50, expiration_date: dayjs().add(5, 'day').toISOString() },
          { id: 2, product: { id: 2, name: 'Pão de Forma' }, quantity: 30, expiration_date: dayjs().subtract(2, 'day').toISOString() },
          { id: 3, product: { id: 1, name: 'Leite Integral 1L' }, quantity: 100, expiration_date: dayjs().add(25, 'day').toISOString() },
          { id: 4, product: { id: 3, name: 'Queijo Minas' }, quantity: 20, expiration_date: dayjs().add(90, 'day').toISOString() },
      ];
      setBatches(mockBatches);
      
      // A busca de produtos continua real
      const productsResponse = await ApiService.getProducts();
      setProducts(productsResponse.data);

    } catch (error) {
      message.error('Falha ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Lógica para notificação
    const nearExpirationCount = batches.filter(b => getExpirationStatus(b.expiration_date).days <= 7).length;
    if (nearExpirationCount > 0) {
      notification.warning({
        message: 'Produtos Próximos do Vencimento',
        description: `Você tem ${nearExpirationCount} lote(s) de produtos vencendo em 7 dias ou menos.`,
        icon: <WarningFilled />,
        duration: 10, // 10 segundos
      });
    }
  }, []);

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      values.expiration_date = values.expiration_date.toISOString();
      console.log('Dados do Lote:', values);
      // Aqui iria a chamada real da API
      // await ApiService.createProductBatch(values);
      message.success('Lote adicionado com sucesso!');
      setIsModalVisible(false);
      form.resetFields();
      fetchData(); // Recarrega os dados
    } catch (info) {
      console.log('Validate Failed:', info);
    }
  };

  const columns = [
    {
      title: 'Produto',
      dataIndex: ['product', 'name'],
      key: 'productName',
    },
    {
      title: 'Quantidade no Lote',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'center',
    },
    {
      title: 'Data de Validade',
      dataIndex: 'expiration_date',
      key: 'expiration_date',
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
      sorter: (a, b) => dayjs(a.expiration_date).unix() - dayjs(b.expiration_date).unix(),
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Status',
      key: 'status',
      dataIndex: 'expiration_date',
      render: (date) => {
        const status = getExpirationStatus(date);
        return <Tag color={status.color}>{status.text}</Tag>;
      },
    },
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Title level={2}><CalendarOutlined /> Controle de Validade</Title>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
          Adicionar Lote
        </Button>
      </div>
      <Table columns={columns} dataSource={batches} rowKey="id" loading={loading} />

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
          <Form.Item name="quantity" label="Quantidade" rules={[{ required: true, message: 'Insira a quantidade!' }]}>
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item name="expiration_date" label="Data de Validade" rules={[{ required: true, message: 'Selecione a data!' }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default ExpirationControlPage;