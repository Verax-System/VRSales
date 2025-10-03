import React, { useState, useEffect } from 'react';
import { Modal, Row, Col, Statistic, Select, InputNumber, Button, Form, message, Divider } from 'antd';
import { DollarCircleOutlined, CreditCardOutlined, QrcodeOutlined } from '@ant-design/icons';
import ApiService from '../api/ApiService';

const { Option } = Select;

const PaymentModal = ({ open, onCancel, onOk, cartItems, totalAmount }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [amountPaid, setAmountPaid] = useState(0);

  const change = amountPaid > totalAmount ? amountPaid - totalAmount : 0;

  // Reseta o formulário sempre que o modal for fechado/aberto
  useEffect(() => {
    if (open) {
      form.resetFields();
      setAmountPaid(0);
    }
  }, [open, form]);

  const handleFinishSale = async (values) => {
    if (amountPaid < totalAmount) {
      message.error('O valor pago é menor que o total da venda.');
      return;
    }
    
    setLoading(true);
    try {
      const saleData = {
        items: cartItems.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
        // Futuramente, podemos adicionar um campo para selecionar o cliente
        customer_id: null, 
      };

      await ApiService.createSale(saleData);
      
      message.success(`Venda finalizada com sucesso! Troco: R$ ${change.toFixed(2)}`);
      onOk(); // Chama a função de sucesso para limpar o PDV
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Erro ao finalizar a venda.';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Finalizar Venda"
      onCancel={onCancel}
      footer={null}
      width={600}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Statistic title="Total a Pagar" value={totalAmount} prefix="R$" precision={2} />
        </Col>
        <Col span={12}>
          <Statistic title="Troco" value={change} prefix="R$" precision={2} valueStyle={{ color: '#3f8600' }} />
        </Col>
      </Row>
      <Divider />
      <Form form={form} layout="vertical" onFinish={handleFinishSale}>
        <Form.Item label="Forma de Pagamento">
          <Select defaultValue="cash" size="large">
            <Option value="cash"><DollarCircleOutlined /> Dinheiro</Option>
            <Option value="credit_card"><CreditCardOutlined /> Cartão de Crédito</Option>
            <Option value="debit_card"><CreditCardOutlined /> Cartão de Débito</Option>
            <Option value="pix"><QrcodeOutlined /> PIX</Option>
          </Select>
        </Form.Item>
        <Form.Item label="Valor Recebido">
          <InputNumber
            size="large"
            style={{ width: '100%' }}
            prefix="R$"
            precision={2}
            step={0.01}
            min={0}
            onChange={(value) => setAmountPaid(value || 0)}
            autoFocus
          />
        </Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          loading={loading}
          block
          style={{ height: '50px', fontSize: '1.1rem' }}
        >
          Confirmar Pagamento
        </Button>
      </Form>
    </Modal>
  );
};

export default PaymentModal;