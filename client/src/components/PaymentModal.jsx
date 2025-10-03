import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Row, Col, Statistic, Select, InputNumber, Button, Form, message, Divider, Space } from 'antd';
import { DollarCircleOutlined, CreditCardOutlined, QrcodeOutlined, CloseCircleOutlined } from '@ant-design/icons';
// import ApiService from '../api/ApiService'; // Será usado quando o backend estiver pronto

const { Option } = Select;

const PaymentModal = ({ open, onCancel, onOk, cartItems, totalAmount }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  // Agora controlamos uma lista de pagamentos
  const [payments, setPayments] = useState([{ method: 'cash', amount: 0 }]);

  // Calcula o total pago e o valor restante
  const totalPaid = useMemo(() => payments.reduce((acc, p) => acc + (p.amount || 0), 0), [payments]);
  const remainingAmount = totalAmount - totalPaid;
  const change = totalPaid > totalAmount ? totalPaid - totalAmount : 0;

  useEffect(() => {
    if (open) {
      // Começa com um único pagamento em dinheiro, com o valor restante
      setPayments([{ method: 'cash', amount: totalAmount > 0 ? totalAmount : 0 }]);
      form.setFieldsValue({ payments: [{ method: 'cash', amount: totalAmount > 0 ? totalAmount : 0 }] });
    }
  }, [open, totalAmount, form]);

  const handleFinishSale = async () => {
    if (totalPaid < totalAmount) {
      message.error('O valor pago é menor que o total da venda.');
      return;
    }
    
    setLoading(true);
    // SIMULAÇÃO: No futuro, aqui chamaríamos a API real
    setTimeout(() => {
      // const saleData = {
      //   items: cartItems.map(item => ({ product_id: item.id, quantity: item.quantity })),
      //   payments: payments.filter(p => p.amount > 0), // Envia apenas pagamentos com valor
      // };
      // await ApiService.createSaleWithPayments(saleData);
      
      console.log('Dados que seriam enviados para a API:', {
        items: cartItems.map(item => ({ product_id: item.id, quantity: item.quantity })),
        payments: payments.filter(p => p.amount > 0),
      });

      setLoading(false);
      message.success(`Venda finalizada! Troco: R$ ${change.toFixed(2)}`);
      onOk();
    }, 1000); // Simula 1 segundo de espera
  };

  return (
    <Modal
      open={open}
      title="Finalizar Venda"
      onCancel={onCancel}
      footer={null}
      width={800}
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
      
      <Form form={form} onFinish={handleFinishSale}>
        <Form.List name="payments">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item {...restField} name={[name, 'method']} initialValue="cash">
                    <Select style={{ width: 180 }}>
                      <Option value="cash"><DollarCircleOutlined /> Dinheiro</Option>
                      <Option value="credit_card"><CreditCardOutlined /> Crédito</Option>
                      <Option value="debit_card"><CreditCardOutlined /> Débito</Option>
                      <Option value="pix"><QrcodeOutlined /> PIX</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item {...restField} name={[name, 'amount']}>
                    <InputNumber prefix="R$" style={{ width: 200 }} precision={2} />
                  </Form.Item>
                  {fields.length > 1 ? <CloseCircleOutlined onClick={() => remove(name)} /> : null}
                </Space>
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add({ amount: remainingAmount > 0 ? remainingAmount : 0 })} block>
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
      {/* Atualiza o estado 'payments' sempre que o formulário mudar */}
      <Form.Item shouldUpdate>
        {() => {
          setPayments(form.getFieldValue('payments') || []);
          return null;
        }}
      </Form.Item>
    </Modal>
  );
};

export default PaymentModal;