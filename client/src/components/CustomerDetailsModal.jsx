import React, { useState, useEffect } from 'react';
import { Modal, Descriptions, Spin, message, List, Tag, Empty } from 'antd';
import ApiService from '../api/ApiService';
import dayjs from 'dayjs';

const CustomerDetailsModal = ({ visible, onCancel, customer }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && customer) {
      const fetchHistory = async () => {
        setLoading(true);
        try {
          const response = await ApiService.getCustomerSalesHistory(customer.id);
          setHistory(response.data);
        } catch {
          message.error('Falha ao carregar o histórico do cliente.');
        } finally {
          setLoading(false);
        }
      };
      fetchHistory();
    }
  }, [visible, customer]);

  if (!customer) return null;

  const formatCurrency = (value) => `R$ ${value.toFixed(2).replace('.', ',')}`;

  return (
    <Modal
      title={`Detalhes de ${customer.full_name}`}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      destroyOnClose
    >
      {loading ? (
        <div className="text-center p-8"><Spin size="large" /></div>
      ) : (
        <div>
          <Descriptions bordered column={2} className="mb-6">
            <Descriptions.Item label="ID">{customer.id}</Descriptions.Item>
            <Descriptions.Item label="Email">{customer.email || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Telefone">{customer.phone_number || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Documento">{customer.document_number || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Total Gasto" span={2}>
              <span className="font-bold text-green-600">{formatCurrency(customer.total_spent)}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Pontos de Fidelidade" span={2}>
              <span className="font-bold text-blue-600">{customer.loyalty_points}</span>
            </Descriptions.Item>
          </Descriptions>

          <h3 className="text-lg font-semibold mb-4 text-gray-700">Histórico de Compras</h3>
          {history.length > 0 ? (
            <List
              itemLayout="vertical"
              dataSource={history}
              renderItem={sale => (
                <List.Item key={sale.id} className="bg-gray-50 p-4 rounded-md mb-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold">Venda #{sale.id}</span>
                      <span className="text-gray-500 ml-4">{dayjs(sale.created_at).format('DD/MM/YYYY HH:mm')}</span>
                    </div>
                    <Tag color="blue" className="text-base">{formatCurrency(sale.total_amount)}</Tag>
                  </div>
                  <List
                    size="small"
                    dataSource={sale.items}
                    renderItem={item => (
                      <List.Item key={item.id}>
                        {item.quantity}x {item.product?.name || 'Produto Apagado'} - {formatCurrency(item.price_at_sale)}
                      </List.Item>
                    )}
                    className="mt-2 ml-4"
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="Nenhum histórico de compras encontrado." />
          )}
        </div>
      )}
    </Modal>
  );
};

export default CustomerDetailsModal;