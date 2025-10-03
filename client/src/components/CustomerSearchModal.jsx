import React, { useState } from 'react';
import { Modal, Input, List, Button, message } from 'antd';
// import ApiService from '../api/ApiService'; // Descomente quando o backend estiver pronto

const { Search } = Input;

// --- DADOS FALSOS PARA SIMULAÇÃO ---
const mockCustomers = [
  { id: 1, full_name: 'João da Silva', phone_number: '16999998888' },
  { id: 2, full_name: 'Maria Oliveira', phone_number: '16988887777' },
];

const CustomerSearchModal = ({ open, onCancel, onSelect }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const handleSearch = async (value) => {
    if (!value) {
      setResults([]);
      return;
    }
    setLoading(true);
    // Simulação - Substituir pela chamada real da API
    setTimeout(() => {
      const filtered = mockCustomers.filter(c => 
        c.full_name.toLowerCase().includes(value.toLowerCase())
      );
      setResults(filtered);
      if (filtered.length === 0) {
        message.info('Nenhum cliente encontrado.');
      }
      setLoading(false);
    }, 500);
    // CHAMADA REAL DA API (quando pronta):
    // try {
    //   const response = await ApiService.searchCustomers(value);
    //   setResults(response.data);
    // } catch (error) {
    //   message.error('Erro ao buscar clientes.');
    // } finally {
    //   setLoading(false);
    // }
  };

  const handleSelect = (customer) => {
    onSelect(customer);
    onCancel(); // Fecha o modal após a seleção
  };

  return (
    <Modal
      open={open}
      title="Buscar Cliente"
      onCancel={onCancel}
      footer={null}
    >
      <Search
        placeholder="Digite o nome ou telefone do cliente"
        enterButton
        onSearch={handleSearch}
        loading={loading}
      />
      <List
        className="demo-loadmore-list"
        itemLayout="horizontal"
        dataSource={results}
        renderItem={(item) => (
          <List.Item
            actions={[<Button type="link" key="select" onClick={() => handleSelect(item)}>Selecionar</Button>]}
          >
            <List.Item.Meta
              title={item.full_name}
              description={`Telefone: ${item.phone_number}`}
            />
          </List.Item>
        )}
      />
    </Modal>
  );
};

export default CustomerSearchModal;