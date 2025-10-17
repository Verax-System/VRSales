import React, { useEffect, useState } from 'react';
import { Form, Input, InputNumber, Button, message, Row, Col } from 'antd';
import { AppstoreOutlined, AlignLeftOutlined, DollarCircleOutlined, DropboxOutlined, WarningOutlined, BarcodeOutlined, LinkOutlined } from '@ant-design/icons';
import ApiService from '../api/ApiService';

const ProductForm = ({ product, onSuccess, onCancel }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const isEditing = !!product;

    useEffect(() => {
        if (isEditing) {
            form.setFieldsValue(product);
        } else {
            form.resetFields();
        }
    }, [product, form, isEditing]);

    const onFinish = async (values) => {
        setLoading(true);
        try {
            if (isEditing) {
                await ApiService.put(`/products/${product.id}/`, values);
            } else {
                await ApiService.post('/products/', values);
            }
            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            const errorMsg = error.response?.data?.detail || 'Erro ao salvar o produto.';
            message.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
                stock: 0,
                price: 0.0,
                low_stock_threshold: 10
            }}
        >
            <Form.Item name="name" label="Nome do Produto" rules={[{ required: true, message: 'Por favor, insira o nome!' }]}>
                <Input size="large" prefix={<AppstoreOutlined />} placeholder="Ex: Coca-Cola 2L" />
            </Form.Item>
            
            <Form.Item name="description" label="Descrição (Opcional)">
                <Input.TextArea rows={2} prefix={<AlignLeftOutlined />} placeholder="Breve descrição do produto" />
            </Form.Item>

            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item name="price" label="Preço de Venda" rules={[{ required: true, message: 'Insira o preço!' }]}>
                        <InputNumber
                            size="large"
                            style={{ width: '100%' }}
                            min={0}
                            step={0.01}
                            precision={2}
                            prefix="R$"
                        />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="barcode" label="Código de Barras (Opcional)">
                        <Input size="large" prefix={<BarcodeOutlined />} />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item name="stock" label="Estoque Atual" rules={[{ required: true, message: 'Insira o estoque!' }]}>
                        <InputNumber size="large" style={{ width: '100%' }} min={0} prefix={<DropboxOutlined />} />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="low_stock_threshold" label="Nível Mínimo de Estoque" rules={[{ required: true, message: 'Insira o nível mínimo!' }]}>
                        <InputNumber size="large" style={{ width: '100%' }} min={0} prefix={<WarningOutlined />} />
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item name="image_url" label="URL da Imagem (Opcional)">
                <Input size="large" prefix={<LinkOutlined />} placeholder="https://exemplo.com/imagem.png" />
            </Form.Item>

            <Form.Item style={{ textAlign: 'right', marginBottom: 0, marginTop: 24 }}>
                <Button onClick={onCancel} style={{ marginRight: 8 }} size="large">
                    Cancelar
                </Button>
                <Button type="primary" htmlType="submit" loading={loading} size="large">
                    {isEditing ? 'Salvar Alterações' : 'Criar Produto'}
                </Button>
            </Form.Item>
        </Form>
    );
};

export default ProductForm;