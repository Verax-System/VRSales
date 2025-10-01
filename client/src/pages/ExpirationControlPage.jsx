import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Modal,
  message,
  Space,
  Typography,
  Tag,
  DatePicker,
  Select,
  Form,
  InputNumber,
  notification
} from 'antd';
import { PlusOutlined, CalendarOutlined, WarningFilled } from '@ant-design/icons';
import ApiService from '../api/ApiService';
import dayjs from 'dayjs';

const { Title } = Typography;
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
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Função para buscar os dados da API
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [batchesResponse, productsResponse] = await Promise.all([
        ApiService.getProductBatches(),
        ApiService.getProducts()
      ]);
      
      const fetchedBatches = batchesResponse.data || [];
      setBatches(fetchedBatches);
      setProducts(productsResponse.data || []);

      // Lógica para notificação
      const nearExpirationCount = fetchedBatches.filter(b => getExpirationStatus(b.expiration_date).days <= 7).length;
      if (nearExpirationCount > 0) {
        notification.warning({
          message: 'Produtos Próximos do Vencimento',
          description: `Você tem ${nearExpirationCount} lote(s) de produtos vencendo nos próximos 7 dias.`,
          icon: <WarningFilled />,
          duration: 10,
        });
      }

    } catch (error) {
      message.error('Falha ao carregar dados. O backend para lotes pode não estar pronto.');
      // Inicializa com arrays vazios em caso de erro para não quebrar a página
      setBatches([]);
      setProducts([]);
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
      // Formata a data para o padrão ISO que a API espera
      values.expiration_date = values.expiration_date.toISOString();
      
      await ApiService.createProductBatch(values);
      message.success('Lote adicionado com sucesso!');
      setIsModalVisible(false);
      form.resetFields();
      fetchData(); // Recarrega os dados
    } catch (error) {
        const errorMsg = error.response?.data?.detail || 'Erro ao salvar o lote.';
        message.error(errorMsg);
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
          <Form.Item name="quantity" label="Quantidade de pacotes" rules={[{ required: true, message: 'Insira a quantidade!' }]}>
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