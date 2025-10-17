import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Row, Col, Statistic, Select, InputNumber, Button, Form, message, Divider, Space, Input } from 'antd';
import { DollarCircleOutlined, CreditCardOutlined, QrcodeOutlined, CloseCircleOutlined, TeamOutlined } from '@ant-design/icons';
import ApiService from '../api/ApiService';

const { Option } = Select;

const PaymentModal = ({ open, onCancel, onOk, cartItems, totalAmount, customerId }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState([{ payment_method: 'cash', amount: 0 }]);

  const totalPaid = useMemo(() => payments.reduce((acc, p) => acc + (p.amount || 0), 0), [payments]);
  const remainingAmount = totalAmount - totalPaid;
  const change = totalPaid > totalAmount ? totalPaid - totalAmount : 0;

  useEffect(() => {
    if (open) {
      const initialAmount = totalAmount > 0 ? parseFloat(totalAmount.toFixed(2)) : 0;
      const initialPayments = [{ payment_method: 'cash', amount: initialAmount }];
      setPayments(initialPayments);
      form.setFieldsValue({ payments: initialPayments });
    }
  }, [open, totalAmount, form]);

  const handleFinishSale = async (formValues) => {
    const finalPayments = formValues.payments.filter(p => p && p.amount > 0);
    const finalTotalPaid = finalPayments.reduce((acc, p) => acc + p.amount, 0);

    if (finalTotalPaid < totalAmount) {
      message.error('O valor pago é menor que o total da venda.');
      return;
    }
    
    setLoading(true);
    try {
      const saleData = {
        items: cartItems.map(item => ({ product_id: item.id, quantity: item.quantity, price_at_sale: item.price })),
        payments: finalPayments,
        customer_id: customerId,
        total_amount: totalAmount,
        // Adicione outros campos necessários pela sua API, como order_id se aplicável
      };
      
      // A sua API de criação de venda pode precisar de ajustes para aceitar múltiplos pagamentos.
      await ApiService.createSale(saleData); 
      
      const finalChange = finalTotalPaid - totalAmount;
      message.success(`Venda finalizada! Troco: R$ ${finalChange.toFixed(2)}`);
      onOk();
    } catch (error) {
        console.error("ERRO DETALHADO RECEBIDO PELO FRONTEND:", error.response);
        const errorMsg = error.response?.data?.detail || 'Erro ao finalizar a venda.';
        message.error(errorMsg, 5);
    } finally {
        setLoading(false);
    }
  };

  // --- NOVA FUNCIONALIDADE: DIVIDIR CONTA ---
  const handleSplitBill = (people) => {
    if (people < 2) return;
    const amountPerPerson = parseFloat((totalAmount / people).toFixed(2));
    const newPayments = Array.from({ length: people }, (_, i) => ({
        payment_method: 'cash',
        amount: i === 0 ? totalAmount - (amountPerPerson * (people - 1)) : amountPerPerson, // Garante que a soma seja exata
    }));
    setPayments(newPayments);
    form.setFieldsValue({ payments: newPayments });
  };

  return (
    <Modal
      open={open}
      title="Finalizar Venda"
      onCancel={onCancel}
      footer={null}
      width={800}
      destroyOnClose
    >
      <Row gutter={32}>
        <Col span={12}>
          <Statistic title="Total a Pagar" value={totalAmount} prefix="R$" precision={2} />
        </Col>
        <Col span={12}>
          <Statistic
            title={remainingAmount > 0 ? "Faltam" : "Troco"}
            value={remainingAmount > 0 ? remainingAmount : change}
            prefix="R$"
            precision={2}
            valueStyle={{ color: remainingAmount > 0 ? '#cf1322' : '#3f8600' }}
          />
        </Col>
      </Row>
      <Divider />
      
      {/* --- NOVA SEÇÃO: BOTÕES PARA DIVIDIR CONTA --- */}
      <Space style={{ marginBottom: 24 }}>
          <Text><TeamOutlined /> Dividir conta igualmente por:</Text>
          <Button onClick={() => handleSplitBill(2)}>2 Pessoas</Button>
          <Button onClick={() => handleSplitBill(3)}>3 Pessoas</Button>
          <Button onClick={() => handleSplitBill(4)}>4 Pessoas</Button>
      </Space>

      <Form form={form} onFinish={handleFinishSale} onValuesChange={(_, allValues) => setPayments(allValues.payments || [])}>
        <Form.List name="payments">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item {...restField} name={[name, 'payment_method']} initialValue="cash">
                    <Select style={{ width: 180 }}>
                      <Option value="cash"><DollarCircleOutlined /> Dinheiro</Option>
                      <Option value="credit_card"><CreditCardOutlined /> Crédito</Option>
                      <Option value="debit_card"><CreditCardOutlined /> Débito</Option>
                      <Option value="pix"><QrcodeOutlined /> PIX</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item {...restField} name={[name, 'amount']}>
                    <InputNumber prefix="R$" style={{ width: 200 }} precision={2} min={0} />
                  </Form.Item>
                  {fields.length > 1 ? <CloseCircleOutlined onClick={() => remove(name)} /> : null}
                </Space>
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add({ payment_method: 'credit_card', amount: remainingAmount > 0 ? parseFloat(remainingAmount.toFixed(2)) : 0 })} block>
                  Adicionar outro pagamento
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        <Divider />

        <Button
          type="primary"
          htmlType="submit"
          size="large"
          loading={loading}
          block
          disabled={totalPaid < totalAmount}
          style={{ height: '50px', fontSize: '1.1rem' }}
        >
          Confirmar Pagamento
        </Button>
      </Form>
    </Modal>
  );
};

export default PaymentModal;