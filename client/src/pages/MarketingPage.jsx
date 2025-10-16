import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Button, Modal, message, Spin, Card, Popconfirm, Tooltip, Form, Input, Select, DatePicker, Empty } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PauseCircleOutlined,
  UsergroupAddOutlined,
  ScheduleOutlined
} from '@ant-design/icons';
import ApiService from '../api/ApiService';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// Estilos embutidos para a nova página de marketing
const PageStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

    .marketing-page-container {
      padding: 24px;
      background-color: #f0f2f5;
      font-family: 'Inter', sans-serif;
      min-height: 100vh;
    }

    .marketing-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding: 20px 24px;
      background: linear-gradient(135deg, #8e44ad 0%, #d43f8d 100%);
      border-radius: 16px;
      color: white;
      box-shadow: 0 10px 30px -10px rgba(142, 68, 173, 0.5);
    }

    .campaign-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 24px;
    }

    .campaign-card {
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      border: 1px solid #e8e8e8;
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .campaign-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    }

    .campaign-card .ant-card-body {
        flex-grow: 1;
        padding: 24px;
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16px;
    }

    .status-pin {
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 600;
        text-transform: uppercase;
        font-size: 12px;
    }
    
    .status-pin.sent { color: #27ae60; }
    .status-pin.scheduled { color: #2980b9; }
    .status-pin.draft { color: #f39c12; }

    .card-footer {
        padding: 16px 24px;
        border-top: 1px solid #f0f0f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
  `}</style>
);

const CampaignForm = ({ form, onFinish }) => (
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
      <Input.TextArea rows={4} placeholder="Use {nome} para personalizar. Ex: Olá {nome}, sentimos sua falta! Use o cupom VOLTA10 para ganhar 10% de desconto." />
    </Form.Item>
    <Form.Item name="send_date" label="Agendar Envio (Opcional)">
      <DatePicker showTime style={{ width: '100%' }} placeholder="Deixe em branco para envio imediato" />
    </Form.Item>
  </Form>
);

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

  const showCreateModal = () => { setEditingCampaign(null); form.resetFields(); setIsModalVisible(true); };
  const handleModalCancel = () => { setIsModalVisible(false); setEditingCampaign(null); };

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
      fetchCampaigns();
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
    } catch (error) {
      message.error("Erro ao excluir a campanha.");
    }
  };
  
  const audienceMap = {
      inactive_30_days: "Inativos (30 dias)",
      inactive_60_days: "Inativos (60 dias)",
      top_10_spenders: "Top 10 Clientes",
      all_customers: "Todos os Clientes",
  };
  
  const statusMap = {
      sent: { color: 'success', text: 'Enviada', icon: <CheckCircleOutlined /> },
      scheduled: { color: 'processing', text: 'Agendada', icon: <ClockCircleOutlined /> },
      draft: { color: 'gold', text: 'Rascunho', icon: <PauseCircleOutlined /> }
  };

  const gridVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <>
      <PageStyles />
      <motion.div className="marketing-page-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="marketing-header">
          <Title level={2} style={{ color: 'white', margin: 0 }}>
            <RocketOutlined style={{ marginRight: 12 }} /> Campanhas de Marketing
          </Title>
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={showCreateModal}>
            Criar Nova Campanha
          </Button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>
        ) : (
          <AnimatePresence>
            {campaigns.length > 0 ? (
              <motion.div className="campaign-grid" variants={gridVariants} initial="hidden" animate="visible">
                {campaigns.map(campaign => {
                  const status = statusMap[campaign.status] || { color: 'default', text: 'Desconhecido', icon: null };
                  return (
                    <motion.div key={campaign.id} variants={cardVariants}>
                      <Card className="campaign-card">
                        <div className="card-header">
                            <div>
                                <Title level={4} style={{marginBottom: 4}}>{campaign.name}</Title>
                                <Tag icon={<UsergroupAddOutlined />} color="blue">{audienceMap[campaign.target_audience] || campaign.target_audience}</Tag>
                            </div>
                            <div className={`status-pin ${campaign.status}`}>
                                {status.icon} <span>{status.text}</span>
                            </div>
                        </div>

                        <Paragraph type="secondary" ellipsis={{ rows: 3 }}>
                          {campaign.message}
                        </Paragraph>

                        <div className="card-footer">
                          <Space>
                            <ScheduleOutlined />
                            <Text type="secondary">
                                {campaign.send_date ? dayjs(campaign.send_date).format('DD/MM/YY HH:mm') : 'Envio Imediato'}
                            </Text>
                          </Space>
                          <Space>
                            <Tooltip title="Editar">
                              <Button shape="circle" icon={<EditOutlined />} disabled={campaign.status === 'sent'} onClick={() => { setEditingCampaign(campaign); setIsModalVisible(true); form.setFieldsValue({...campaign, send_date: campaign.send_date ? dayjs(campaign.send_date) : null}); }} />
                            </Tooltip>
                            <Popconfirm title="Tem certeza?" onConfirm={() => handleDelete(campaign.id)} okText="Sim" cancelText="Não">
                              <Tooltip title="Excluir">
                                <Button shape="circle" danger icon={<DeleteOutlined />} disabled={campaign.status === 'sent'} />
                              </Tooltip>
                            </Popconfirm>
                          </Space>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
                <Empty description={<Title level={5} style={{color: '#888'}}>Nenhuma campanha criada ainda.</Title>}>
                    <Button type="primary" size="large" onClick={showCreateModal}>Crie sua primeira campanha</Button>
                </Empty>
            )}
          </AnimatePresence>
        )}

        <Modal
          title={editingCampaign ? "Editar Campanha" : "Nova Campanha de Marketing"}
          open={isModalVisible}
          onCancel={handleModalCancel}
          footer={[
            <Button key="back" onClick={handleModalCancel}>Cancelar</Button>,
            <Button key="submit" type="primary" loading={formLoading} onClick={() => form.submit()}>Salvar Campanha</Button>
          ]}
          destroyOnClose
        >
          <CampaignForm form={form} onFinish={handleFormSubmit} />
        </Modal>
      </motion.div>
    </>
  );
};

export default MarketingPage;