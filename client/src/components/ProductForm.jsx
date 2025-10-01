import React, { useEffect, useState } from 'react';
import { Form, Input, InputNumber, Button, message } from 'antd';
import ApiService from '../api/ApiService';

const ProductForm = ({ product, onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Se um produto for passado via props (modo de edição), preenche o formulário
  useEffect(() => {
    if (product) {
      form.setFieldsValue(product);
    } else {
      form.resetFields();
    }
  }, [product, form]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      if (product) {
        // Modo de Edição
        await ApiService.updateProduct(product.id, values);
        message.success(`Produto "${values.name}" atualizado com sucesso!`);
      } else {
        // Modo de Criação
        await ApiService.createProduct(values);
        message.success(`Produto "${values.name}" criado com sucesso!`);
      }
      onSuccess(); // Chama a função de sucesso (fechar modal e recarregar tabela)
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Erro ao salvar o produto.';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ stock: 0, price: 0.0 }}>
      <Form.Item name="name" label="Nome do Produto" rules={[{ required: true, message: 'Por favor, insira o nome!' }]}>
        <Input />
      </Form.Item>
      <Form.Item name="description" label="Descrição">
        <Input.TextArea rows={3} />
      </Form.Item>
      <Form.Item name="price" label="Preço" rules={[{ required: true, message: 'Por favor, insira o preço!' }]}>
        <InputNumber style={{ width: '100%' }} min={0} step={0.01} precision={2} addonBefore="R$" />
      </Form.Item>
      <Form.Item name="stock" label="Quantidade em Estoque" rules={[{ required: true, message: 'Por favor, insira o estoque!' }]}>
        <InputNumber style={{ width: '100%' }} min={0} />
      </Form.Item>
      <Form.Item style={{ textAlign: 'right' }}>
        <Button onClick={onCancel} style={{ marginRight: 8 }}>
          Cancelar
        </Button>
        <Button type="primary" htmlType="submit" loading={loading}>
          {product ? 'Salvar Alterações' : 'Criar Produto'}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ProductForm;