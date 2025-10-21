import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Badge, Modal, Form, Input, InputNumber, DatePicker, Select, Button, message, Spin, Alert, List, Popconfirm, Typography, Row, Col, Card, Space, Empty } from 'antd';
import { motion } from 'framer-motion';
import { PlusOutlined, BookOutlined, UserOutlined, ClockCircleOutlined, TeamOutlined, TableOutlined, AlignLeftOutlined, CloseCircleOutlined } from '@ant-design/icons';
import ApiService from '../api/ApiService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

// Estilos (PageStyles) continuam os mesmos...
const PageStyles = () => (
    <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

    .reservation-page-container {
      padding: 24px;
      background-color: #f0f2f5;
      font-family: 'Inter', sans-serif;
      min-height: 100vh;
    }

    .reservation-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding: 20px 24px;
      background: linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%);
      border-radius: 16px;
      color: white;
      box-shadow: 0 10px 30px -10px rgba(74, 0, 224, 0.5);
    }

    .content-card {
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        border: none;
        height: 100%;
    }

    .reservations-list .ant-list-item {
        border-bottom: 1px solid #f0f0f0;
        padding: 12px 0;
    }
    .reservations-list .ant-list-item-meta-title {
        font-weight: 600;
        margin-bottom: 0 !important;
    }
    .reservations-list .ant-list-item-meta-description {
        font-size: 0.9rem;
    }

    .form-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 24px;
    }
  `}</style>
);


const ReservationPage = () => {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [tables, setTables] = useState([]);
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [formLoading, setFormLoading] = useState(false);

    const fetchReservations = useCallback(async (date) => {
        setLoading(true);
        try {
            const start = date.startOf('day').toISOString();
            const end = date.endOf('day').toISOString();
            // Passa os parâmetros de data corretamente na URL
            const response = await ApiService.get(`/reservations/?start_date=${start}&end_date=${end}`);
            setReservations(response.data);
        } catch (error) {
            if (error.response?.status !== 401) {
                message.error('Erro ao carregar reservas.');
            }
            console.error("Erro ao buscar reservas:", error);
        } finally {
            setLoading(false);
        }
    }, []);


    useEffect(() => {
        fetchReservations(selectedDate);
    }, [selectedDate, fetchReservations]);

    useEffect(() => {
        const fetchTables = async () => {
            try {
                const response = await ApiService.get('/tables/');
                setTables(response.data);
            } catch (error) {
                 if (error.response?.status !== 401) {
                    message.error("Não foi possível carregar as mesas disponíveis.");
                 }
                 console.error("Erro ao buscar mesas:", error);
            }
        };
        fetchTables();
    }, []);

    const handleDateSelect = (date) => {
        setSelectedDate(date);
    };

    const handleFinish = async (values) => {
        setFormLoading(true);
        try {
            const payload = {
                ...values,
                // Certifica que a data/hora está no formato ISO 8601 com timezone (UTC 'Z')
                reservation_time: values.reservation_time.toISOString(),
            };
            // Envia a requisição POST para o endpoint correto
            await ApiService.post('/reservations/', payload);
            message.success('Reserva criada com sucesso!');
            setIsModalVisible(false);
            form.resetFields();
            fetchReservations(selectedDate); // Atualiza a lista de reservas para o dia
        } catch(error) {
            // Mostra a mensagem de erro detalhada vinda da API, se disponível
            message.error(error.response?.data?.detail || 'Erro ao criar reserva.');
            console.error("Erro ao criar reserva:", error.response?.data || error);
        } finally {
            setFormLoading(false);
        }
    };


    const handleDelete = async (id) => {
        try {
            await ApiService.delete(`/reservations/${id}`);
            message.success('Reserva cancelada!');
            fetchReservations(selectedDate);
        } catch (error) {
            message.error('Erro ao cancelar reserva.');
        }
    };

    const pageVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

    return (
        <>
            <PageStyles />
            <motion.div
                className="reservation-page-container"
                variants={pageVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={itemVariants}>
                    <div className="reservation-header">
                        <Title level={2} style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <BookOutlined /> Gestão de Reservas
                        </Title>
                        <Button type="primary" ghost icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)} size="large">
                            Nova Reserva
                        </Button>
                    </div>
                </motion.div>

                <Row gutter={24}>
                    <Col xs={24} md={12}>
                        <motion.div variants={itemVariants}>
                            <Card className="content-card">
                                <Calendar onSelect={handleDateSelect} value={selectedDate} />
                            </Card>
                        </motion.div>
                    </Col>
                    <Col xs={24} md={12}>
                         <motion.div variants={itemVariants}>
                            <Card className="content-card">
                                <Title level={4} style={{ marginBottom: 20 }}>Reservas para {selectedDate.format('DD/MM/YYYY')}</Title>
                                {loading ? <div style={{textAlign: 'center', padding: '50px'}}><Spin /></div> : (
                                    <List
                                        className="reservations-list"
                                        dataSource={reservations}
                                        locale={{ emptyText: <Empty description="Nenhuma reserva para esta data."/>}}
                                        renderItem={item => (
                                            <List.Item actions={[
                                                <Popconfirm title="Cancelar reserva?" onConfirm={() => handleDelete(item.id)} okText="Sim" cancelText="Não">
                                                    <Button type="text" danger icon={<CloseCircleOutlined />} size="small">Cancelar</Button>
                                                </Popconfirm>
                                            ]}>
                                                <List.Item.Meta
                                                    title={<Text strong>{item.customer_name} - {dayjs(item.reservation_time).format('HH:mm')}</Text>}
                                                    description={`Mesa: ${item.table?.number || '?'} | ${item.number_of_people} pessoas`}
                                                />
                                            </List.Item>
                                        )}
                                    />
                                )}
                            </Card>
                         </motion.div>
                    </Col>
                </Row>

                <Modal
                    title="Nova Reserva"
                    open={isModalVisible}
                    onCancel={() => setIsModalVisible(false)}
                    footer={null}
                    destroyOnClose
                    width={600}
                >
                    {isModalVisible && (
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleFinish}
                            // Define valores iniciais para hora e pessoas
                            initialValues={{ reservation_time: selectedDate.hour(19).minute(0), number_of_people: 2 }}
                        >
                            <Form.Item name="customer_name" label="Nome do Cliente" rules={[{ required: true, message: 'Nome é obrigatório' }]}>
                                <Input size="large" prefix={<UserOutlined />} />
                            </Form.Item>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item name="reservation_time" label="Data e Hora" rules={[{ required: true, message: 'Data/Hora é obrigatória' }]}>
                                        <DatePicker showTime style={{ width: '100%' }} format="DD/MM/YYYY HH:mm" size="large" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="number_of_people" label="Nº de Pessoas" rules={[{ required: true, message: 'Número de pessoas é obrigatório' }]}>
                                        <InputNumber min={1} style={{ width: '100%' }} size="large" prefix={<TeamOutlined />}/>
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Form.Item name="table_id" label="Mesa Designada" rules={[{ required: true, message: 'Selecione a mesa' }]}>
                                <Select placeholder="Selecione uma mesa disponível" size="large">
                                    {/* Filtra para mostrar apenas mesas com status 'available' */}
                                    {tables.filter(t => t.status === 'available').map(t => <Option key={t.id} value={t.id}>{t.number} (Cap: {t.capacity})</Option>)}
                                </Select>
                            </Form.Item>
                            <Form.Item name="phone_number" label="Telefone (Opcional)">
                                <Input size="large" placeholder="(XX) XXXXX-XXXX"/>
                            </Form.Item>
                            <Form.Item name="notes" label="Observações (Opcional)">
                                <Input.TextArea rows={2} prefix={<AlignLeftOutlined />} />
                            </Form.Item>
                             <div className="form-buttons">
                                <Button onClick={() => setIsModalVisible(false)} size="large">Cancelar</Button>
                                <Button type="primary" htmlType="submit" size="large" loading={formLoading}>
                                    Criar Reserva
                                </Button>
                            </div>
                        </Form>
                    )}
                </Modal>
            </motion.div>
        </>
    );
};

export default ReservationPage;