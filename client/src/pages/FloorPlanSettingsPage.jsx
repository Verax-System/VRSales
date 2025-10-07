import React, { useState, useEffect, useCallback } from 'react';
import { Button, message, Spin, Typography, Card, Tag, Empty, Alert, Space } from 'antd';
import { SaveOutlined, LayoutOutlined } from '@ant-design/icons';
import Draggable from 'react-draggable';
import ApiService from '../api/ApiService';

const { Title, Text } = Typography;

const FloorPlanSettingsPage = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchTables = useCallback(async () => {
    setLoading(true);
    try {
      const response = await ApiService.getTables();
      setTables(response.data.map(t => ({ ...t, pos_x: t.pos_x || 0, pos_y: t.pos_y || 0 })));
    } catch (error) {
      message.error('Erro ao carregar mesas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const handleDragStop = (e, data, tableId) => {
    setTables(currentTables =>
      currentTables.map(t =>
        t.id === tableId ? { ...t, pos_x: data.x, pos_y: data.y } : t
      )
    );
  };

  const handleSaveLayout = async () => {
    setSaving(true);
    try {
      const layoutData = {
        tables: tables.map(t => ({ id: t.id, pos_x: t.pos_x, pos_y: t.pos_y }))
      };
      await ApiService.updateTableLayout(layoutData);
      message.success('Layout do salão salvo com sucesso!');
    } catch (error) {
      message.error('Erro ao salvar o layout.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Spin tip="Carregando layout..." size="large" style={{ display: 'block', marginTop: 50 }} />;
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}><LayoutOutlined /> Editor de Layout do Salão</Title>
        <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSaveLayout}>
          Salvar Layout
        </Button>
      </div>

      <Alert
        message="Arraste as mesas para organizar o layout do seu salão e clique em 'Salvar Layout' para aplicar as mudanças."
        type="info"
        showIcon
      />

      <div style={{
        position: 'relative',
        height: '70vh',
        width: '100%',
        backgroundColor: '#f5f5f5',
        border: '1px dashed #ccc',
        borderRadius: '8px',
        overflow: 'hidden',
      }}>
        {tables.length > 0 ? (
          tables.map(table => (
            <Draggable
              key={table.id}
              bounds="parent"
              position={{ x: table.pos_x, y: table.pos_y }}
              onStop={(e, data) => handleDragStop(e, data, table.id)}
            >
              <div style={{ cursor: 'move', width: 120 }}>
                <Card hoverable bodyStyle={{ padding: 0 }}>
                  <div style={{ padding: '16px', textAlign: 'center' }}>
                    <Title level={4} style={{ margin: 0 }}>{table.number}</Title>
                  </div>
                  <div style={{ padding: '8px', textAlign: 'center', backgroundColor: '#fafafa' }}>
                    <Tag>Mova-me</Tag>
                  </div>
                </Card>
              </div>
            </Draggable>
          ))
        ) : (
          <Empty description="Nenhuma mesa cadastrada." style={{ paddingTop: '20vh' }}/>
        )}
      </div>
    </Space>
  );
};

export default FloorPlanSettingsPage;