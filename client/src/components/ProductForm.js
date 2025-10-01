import React from 'react';
import { Form, Input, InputNumber, Button, message } from 'antd';
import ApiService from '../api/ApiService';

const ProductForm = ({ onSuccess }) => {
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    try {
      // Os campos do formulário (values) já correspondem ao schema ProductCreate
      await ApiService.createProduct(values);
      form.resetFields();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      message.error('Erro ao salvar o produto.');
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{ stock: 0, price: 0.0 }}
    >
      <Form.Item
        name="name"
        label="Nome do Produto"
        rules={[{ required: true, message: 'Por favor, insira o nome do produto!' }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="description"
        label="Descrição"
      >
        <Input.TextArea />
      </Form.Item>

      <Form.Item
        name="price"
        label="Preço"
        rules={[{ required: true, message: 'Por favor, insira o preço!' }]}
      >
        <InputNumber
          style={{ width: '100%' }}
          formatter={value => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={value => value.replace(/R\$\s?|(,*)/g, '')}
          min={0}
        />
      </Form.Item>

      <Form.Item
        name="stock"
        label="Quantidade em Estoque"
        rules={[{ required: true, message: 'Por favor, insira a quantidade em estoque!' }]}
      >
        <InputNumber style={{ width: '100%' }} min={0} />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          Salvar
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ProductForm;