import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Button,
  Table,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Spin,
  Card,
  Popconfirm,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  RocketOutlined,
  SendOutlined,
  PauseCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined, // ÍCONE FALTANTE ADICIONADO AQUI
} from '@ant-design/icons';
import ApiService from '../api/ApiService';
import dayjs from 'dayjs';
import './MarketingPage.css';

const { Title } = Typography;
const { Option } = Select;

const CampaignForm = ({ form, onFinish, loading }) => {
  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Form.Item name="name" label="Nome da Campanha" rules={[{ required: true, message: 'Dê um nome para a campanha!' }]}>
        <Input placeholder="Ex: Campanha de Aniversário de Outubro" />
      </Form.Item>
       <Form.Item name="target_audience" label="Público-Alvo" rules={[{ required: true, message: 'Selecione o público-alvo!' }]}>
        <Select placeholder="Selecione para quem a campanha será enviada">
          <Option value="inactive_30_days">Clientes inativos há 30 dias</Option>
          <Option value="inactive_60_days">Clientes inativos há 60 dias</Option>
          <Option value="top_10_spenders">Top 10 Clientes (maiores gastos)</Option>
          <Option value="all_customers">Todos os Clientes</Option>
        </Select>
      </Form.Item>
      <Form.Item name="message" label="Mensagem" rules={[{ required: true, message: 'Escreva a mensagem da campanha!' }]}>
        <Input.TextArea rows={4} placeholder="Use {nome} para personalizar. Ex: Olá {nome}, sentimos sua falta! Use o cupom VOLTA10 para ganhar 10% de desconto."/>
      </Form.Item>
       <Form.Item name="send_date" label="Agendar Envio (Opcional)">
        <DatePicker showTime style={{width: '100%'}} placeholder="Deixe em branco para envio imediato"/>
      </Form.Item>
    </Form>
  )
}


const MarketingPage = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [form] = Form.useForm();
  const [formLoading, setFormLoading] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const response = await ApiService.getMarketingCampaigns();
      setCampaigns(response.data);
    } catch (error) {
      message.error("Erro ao carregar campanhas de marketing.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const showCreateModal = () => {
    setEditingCampaign(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingCampaign(null);
  };

  const handleFormSubmit = async (values) => {
    setFormLoading(true);
    try {
        if (editingCampaign) {
            await ApiService.updateMarketingCampaign(editingCampaign.id, values);
            message.success("Campanha atualizada com sucesso!");
        } else {
            await ApiService.createMarketingCampaign(values);
            message.success("Campanha criada com sucesso!");
        }
        setIsModalVisible(false);
        fetchCampaigns(); // Atualiza a lista
    } catch (error) {
        message.error("Erro ao salvar a campanha.");
    } finally {
        setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
        await ApiService.deleteMarketingCampaign(id);
        message.success("Campanha excluída com sucesso!");
        fetchCampaigns();
    } catch(error) {
        message.error("Erro ao excluir a campanha.");
    }
  }


  const columns = [
    {
      title: 'Campanha',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Público-Alvo',
      dataIndex: 'target_audience',
      key: 'target_audience',
       render: (audience) => {
            const audiences = {
                inactive_30_days: "Inativos (30 dias)",
                inactive_60_days: "Inativos (60 dias)",
                top_10_spenders: "Top 10 Clientes",
                all_customers: "Todos os Clientes",
            }
            return <Tag>{audiences[audience] || audience}</Tag>
        }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        let icon = null;
        if (status === 'sent') {
            color = 'success';
            icon = <CheckCircleOutlined />;
        } else if (status === 'scheduled') {
            color = 'processing';
            icon = <ClockCircleOutlined />;
        } else if (status === 'draft') {
            color = 'gold';
            icon = <PauseCircleOutlined />;
        }
        return <Tag icon={icon} color={color}>{status ? status.toUpperCase() : ''}</Tag>;
      }
    },
     {
      title: 'Data de Envio',
      dataIndex: 'send_date',
      key: 'send_date',
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : 'Envio Imediato',
    },
    {
      title: 'Ações',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Space>
            <Tooltip title="Editar">
                <Button type="text" icon={<EditOutlined />} disabled={record.status === 'sent'} />
            </Tooltip>
             <Popconfirm
                title="Tem certeza que deseja excluir?"
                onConfirm={() => handleDelete(record.id)}
                okText="Sim"
                cancelText="Não"
            >
                <Tooltip title="Excluir">
                    <Button type="text" danger icon={<DeleteOutlined />} disabled={record.status === 'sent'} />
                </Tooltip>
            </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Card>
            <div className="page-header">
                <Title level={2} style={{ margin: 0 }}>
                    <RocketOutlined /> Campanhas de Marketing
                </Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={showCreateModal}>
                    Criar Nova Campanha
                </Button>
            </div>
        </Card>
        <Card>
             {loading ? <Spin /> : <Table columns={columns} dataSource={campaigns} rowKey="id" />}
        </Card>

         <Modal
            title={editingCampaign ? "Editar Campanha" : "Nova Campanha de Marketing"}
            open={isModalVisible}
            onCancel={handleModalCancel}
            footer={[
                <Button key="back" onClick={handleModalCancel}>
                    Cancelar
                </Button>,
                <Button key="submit" type="primary" loading={formLoading} onClick={() => form.submit()}>
                    Salvar e Ativar
                </Button>
            ]}
            destroyOnClose
        >
            <CampaignForm form={form} onFinish={handleFormSubmit} loading={formLoading} />
        </Modal>
    </Space>
  )
}

export default MarketingPage;