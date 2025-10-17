import React, { useState, useEffect, useCallback } from 'react';
// --- INÍCIO DA CORREÇÃO ---
import { Calendar, Badge, Modal, Form, Input, InputNumber, DatePicker, Select, Button, message, Spin, Alert, List, Popconfirm, Typography, Row, Col } from 'antd';
// --- FIM DA CORREÇÃO ---
import { PlusOutlined, BookOutlined } from '@ant-design/icons';
import ApiService from '../api/ApiService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const ReservationPage = () => {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [tables, setTables] = useState([]);
    const [selectedDate, setSelectedDate] = useState(dayjs());

    const fetchReservations = useCallback(async (date) => {
        setLoading(true);
        try {
            const start = date.startOf('day').toISOString();
            const end = date.endOf('day').toISOString();
            const response = await ApiService.get(`/reservations?start_date=${start}&end_date=${end}`);
            setReservations(response.data);
        } catch (error) {
            // O intercetor do ApiService já trata o erro 401, aqui tratamos outros erros.
            if (error.response?.status !== 401) {
                message.error('Erro ao carregar reservas.');
            }
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
            }
        };
        fetchTables();
    }, []);

    const handleDateSelect = (date) => {
        setSelectedDate(date);
    };

    const handleFinish = async (values) => {
        try {
            const payload = {
                ...values,
                reservation_time: values.reservation_time.toISOString(),
            };
            await ApiService.post('/reservations/', payload);
            message.success('Reserva criada com sucesso!');
            setIsModalVisible(false);
            form.resetFields();
            fetchReservations(selectedDate);
        } catch(error) {
            message.error(error.response?.data?.detail || 'Erro ao criar reserva.');
        }
    };
    
    const handleDelete = async (id) => {
        try {
            await ApiService.delete(`/reservations/${id}`);
            message.success('Reserva cancelada!');
            setReservations(reservations.filter(r => r.id !== id));
        } catch (error) {
            message.error('Erro ao cancelar reserva.');
        }
    };

    const dateCellRender = (value) => {
        // Implementação futura para mostrar um pontinho nos dias com reserva
        return null;
    };

    return (
        <div style={{ padding: 24, background: '#fff', borderRadius: '16px' }}>
            <Title level={2}><BookOutlined /> Gestão de Reservas</Title>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)} style={{ marginBottom: 24 }}>
                Nova Reserva
            </Button>
            <Row gutter={24}>
                <Col xs={24} md={12}>
                    <Calendar onSelect={handleDateSelect} value={selectedDate} />
                </Col>
                <Col xs={24} md={12}>
                    <Title level={4}>Reservas para {selectedDate.format('DD/MM/YYYY')}</Title>
                    {loading ? <div style={{textAlign: 'center', padding: '50px'}}><Spin /></div> : (
                        <List
                            dataSource={reservations}
                            locale={{ emptyText: 'Nenhuma reserva para esta data.'}}
                            renderItem={item => (
                                <List.Item actions={[<Popconfirm title="Cancelar reserva?" onConfirm={() => handleDelete(item.id)} okText="Sim" cancelText="Não"><Button type="link" danger>Cancelar</Button></Popconfirm>]}>
                                    <List.Item.Meta
                                        title={`${item.customer_name} - ${dayjs(item.reservation_time).format('HH:mm')}`}
                                        description={`Mesa: ${item.table.number} - ${item.number_of_people} pessoas`}
                                    />
                                </List.Item>
                            )}
                        />
                    )}
                </Col>
            </Row>
            
            <Modal title="Nova Reserva" open={isModalVisible} onCancel={() => setIsModalVisible(false)} onOk={() => form.submit()} okText="Criar Reserva" cancelText="Cancelar">
                <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={{ reservation_time: selectedDate.hour(19).minute(0) }}>
                    <Form.Item name="customer_name" label="Nome do Cliente" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="reservation_time" label="Data e Hora" rules={[{ required: true }]}>
                        <DatePicker showTime style={{ width: '100%' }} format="DD/MM/YYYY HH:mm"/>
                    </Form.Item>
                    <Form.Item name="number_of_people" label="Nº de Pessoas" rules={[{ required: true }]}>
                        <InputNumber min={1} style={{ width: '100%' }}/>
                    </Form.Item>
                    <Form.Item name="table_id" label="Mesa" rules={[{ required: true }]}>
                        <Select placeholder="Selecione a mesa">
                            {tables.map(t => <Option key={t.id} value={t.id}>{t.number}</Option>)}
                        </Select>
                    </Form.Item>
                    <Form.Item name="notes" label="Observações">
                        <Input.TextArea />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ReservationPage;