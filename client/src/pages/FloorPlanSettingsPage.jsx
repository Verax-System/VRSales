import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button, message, Spin, Typography, Empty, Modal, Form, Input, InputNumber, Select, Popconfirm, Tooltip, Space, Divider } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
    SaveOutlined, LayoutOutlined, PlusOutlined, DragOutlined, UserOutlined,
    RotateRightOutlined, EditOutlined, DeleteOutlined, BorderOutlined, MinusOutlined, StopOutlined
} from '@ant-design/icons';
import Draggable from 'react-draggable';
import ApiService from '../api/ApiService';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;

// Estilos (sem alterações)
const PageStyles = () => (
    <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    .floorplan-page-container { padding: 24px; background-color: #f0f2f5; font-family: 'Inter', sans-serif; min-height: 100vh; display: flex; flex-direction: column; }
    .floorplan-header { margin-bottom: 24px; padding: 20px 24px; background: linear-gradient(135deg, #007BFF 0%, #00C6FF 100%); border-radius: 16px; color: white; box-shadow: 0 10px 20px -10px rgba(0, 123, 255, 0.5); }
    .header-content { display: flex; justify-content: space-between; align-items: center; }
    .floorplan-body { display: flex; gap: 24px; flex: 1; }
    .floorplan-toolbar { width: 200px; background: #fff; border-radius: 16px; padding: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .floorplan-canvas { position: relative; flex: 1; height: 75vh; border-radius: 16px; overflow: hidden; background-color: #1a202c; background-image: linear-gradient(rgba(0, 198, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 198, 255, 0.1) 1px, transparent 1px); background-size: 20px 20px; box-shadow: inset 0 0 20px rgba(0,0,0,0.4); }
    
    .draggable-wrapper { position: absolute; cursor: grab; }
    .draggable-wrapper:active { cursor: grabbing; z-index: 1000 !important; }

    .table-visual {
        width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;
        background: #ffffff; color: #1a202c; box-shadow: 0 4px 15px rgba(0, 198, 255, 0.3);
        border: 2px solid rgba(0, 198, 255, 0.8); transition: transform 0.2s ease, box-shadow 0.2s ease; user-select: none;
        position: relative; /* Para o botão de rotação */
    }
    .table-visual.rectangle { border-radius: 12px; width: 120px; height: 80px; }
    .table-visual.round { border-radius: 50%; width: 100px; height: 100px; }
    .table-number { font-size: 1.5rem; font-weight: 700; }
    .table-capacity { font-size: 0.9rem; color: #555; }
    .empty-canvas { display: flex; justify-content: center; align-items: center; height: 100%; color: white; }

    .rotate-button {
        position: absolute; top: -12px; right: -12px; background: white; border-radius: 50%; width: 24px; height: 24px;
        display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        cursor: pointer; opacity: 0; transition: opacity 0.2s;
    }
    .draggable-wrapper:hover .rotate-button { opacity: 1; }
    
    .draggable-wrapper:hover .delete-button { opacity: 1 !important; }

    .structural-element {
        background: #4a5568; border: 2px solid #718096; position: absolute;
        display: flex; align-items: center; justify-content: center; color: white;
    }
  `}</style>
);

const DraggableTable = ({ table, onStart, onStop, onRotate, onDoubleClick, onDelete }) => {
    const nodeRef = useRef(null);

    const handleRotate = (e) => {
        e.stopPropagation();
        onRotate(table.id);
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        onDelete(table.id);
    };

    return (
        <Draggable
            bounds="parent"
            grid={[20, 20]}
            position={{ x: table.pos_x, y: table.pos_y }}
            onStart={() => onStart(table.id)}
            onStop={(e, data) => onStop(e, data, table.id)}
            nodeRef={nodeRef}
        >
            <div
                ref={nodeRef}
                className="draggable-wrapper"
                style={{ zIndex: 1, transform: `rotate(${table.rotation || 0}deg)` }}
                onDoubleClick={() => onDoubleClick(table)}
            >
                <motion.div
                    className={`table-visual ${table.shape || 'rectangle'}`}
                    whileTap={{ scale: 1.1, cursor: 'grabbing', boxShadow: "0 0 30px rgba(0, 230, 255, 0.8)" }}
                >
                    <Text className="table-number">{table.number}</Text>
                    <Space className="table-capacity" size={4}>
                        <UserOutlined />
                        <Text>{table.capacity || 4}</Text>
                    </Space>
                    
                    <Tooltip title="Rotacionar 45°">
                        <div className="rotate-button" onClick={handleRotate}>
                            <RotateRightOutlined />
                        </div>
                    </Tooltip>
                     <Tooltip title="Excluir">
                        <Popconfirm
                            title="Excluir esta mesa?"
                            onConfirm={handleDelete}
                            onCancel={(e) => e?.stopPropagation()}
                            okText="Sim" cancelText="Não"
                        >
                            <Button
                                size="small" shape="circle" danger icon={<DeleteOutlined />}
                                style={{ position: 'absolute', bottom: -12, right: -12, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="delete-button"
                            />
                        </Popconfirm>
                    </Tooltip>
                </motion.div>
            </div>
        </Draggable>
    );
};

const FloorPlanSettingsPage = () => {
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editingTable, setEditingTable] = useState(null);
    const [form] = Form.useForm();
    const navigate = useNavigate();

    const fetchTables = useCallback(async () => {
        setLoading(true);
        try {
            const response = await ApiService.get('/tables/');
            setTables(response.data.map(t => ({ ...t, pos_x: t.pos_x || 0, pos_y: t.pos_y || 0, rotation: t.rotation || 0, shape: t.shape || 'rectangle' })));
        } catch { message.error('Erro ao carregar mesas.'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchTables(); }, [fetchTables]);

    const handleDragStop = (e, data, tableId) => {
        setTables(currentTables =>
            currentTables.map(t =>
                t.id === tableId ? { ...t, pos_x: Math.round(data.x), pos_y: Math.round(data.y) } : t
            )
        );
    };

    const handleRotate = (tableId) => {
        setTables(currentTables =>
            currentTables.map(t =>
                t.id === tableId ? { ...t, rotation: ((t.rotation || 0) + 45) % 360 } : t
            )
        );
    };
    
    const handleDoubleClick = (table) => {
        setEditingTable(table);
        form.setFieldsValue(table);
        setIsEditModalVisible(true);
    };

    const handleEditModalOk = async () => {
        try {
            const values = await form.validateFields();
            const updatedTable = { ...editingTable, ...values };
            
            setTables(tables.map(t => t.id === editingTable.id ? updatedTable : t));
            
            await ApiService.put(`/tables/${editingTable.id}`, values);

            message.success(`Mesa "${values.number}" atualizada.`);
            setIsEditModalVisible(false);
            setEditingTable(null);
        } catch (error) {
            message.error('Erro ao atualizar a mesa.');
        }
    };

    const handleDeleteTable = async (tableId) => {
        try {
            await ApiService.delete(`/tables/${tableId}`);
            message.success('Mesa excluída com sucesso!');
            fetchTables();
        } catch (error) {
            message.error(error.response?.data?.detail || 'Erro ao excluir mesa.');
        }
    };

    const handleSaveLayout = async () => {
        setSaving(true);
        try {
            const layoutData = { tables: tables.map(t => ({ id: t.id, pos_x: t.pos_x, pos_y: t.pos_y, rotation: t.rotation }))};
            await ApiService.put('/tables/layout', layoutData);
            message.success('Layout do salão salvo com sucesso!');
        } catch { message.error('Erro ao salvar o layout.'); }
        finally { setSaving(false); }
    };
    
    const addElement = async (type) => {
        try {
            const newTableData = {
                number: `Nova ${tables.length + 1}`,
                shape: type,
                capacity: type === 'round' ? 4 : 6,
                pos_x: 50,
                pos_y: 50,
            };
            const response = await ApiService.post('/tables/', newTableData);
            message.success(`Mesa ${response.data.number} adicionada!`);
            fetchTables();
        } catch (error) {
            message.error("Erro ao adicionar nova mesa.");
        }
    };

    // --- INÍCIO DA CORREÇÃO ---
    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Spin tip="Carregando layout..." size="large">
                    {/* Adicionando um conteúdo interno para o Spin para remover o aviso */}
                    <div style={{ padding: 50, borderRadius: 10 }} />
                </Spin>
            </div>
        );
    }
    // --- FIM DA CORREÇÃO ---

    return (
        <>
            <PageStyles />
            <motion.div className="floorplan-page-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="floorplan-header">
                    <div className="header-content">
                        <Title level={2} style={{ margin: 0, color: 'white' }}><LayoutOutlined style={{ marginRight: 12 }} /> Editor de Layout do Salão</Title>
                        <Button type="primary" size="large" icon={<SaveOutlined />} loading={saving} onClick={handleSaveLayout}>Salvar Layout</Button>
                    </div>
                </div>

                <div className="floorplan-body">
                    <div className="floorplan-toolbar">
                        <Title level={5}>Elementos</Title>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Button icon={<BorderOutlined />} block onClick={() => addElement('rectangle')}>Mesa Retangular</Button>
                            <Button icon={<MinusOutlined />} block onClick={() => addElement('round')}>Mesa Redonda</Button>
                            <Divider>Estrutura</Divider>
                            <Button icon={<StopOutlined />} block disabled>Parede</Button>
                        </Space>
                    </div>

                    <div className="floorplan-canvas">
                        <AnimatePresence>
                            {tables.length > 0 ? (
                                tables.map(table => (
                                    <DraggableTable
                                        key={table.id}
                                        table={table}
                                        onStart={() => {}}
                                        onStop={handleDragStop}
                                        onRotate={handleRotate}
                                        onDoubleClick={handleDoubleClick}
                                        onDelete={handleDeleteTable}
                                    />
                                ))
                            ) : (
                                <div className="empty-canvas">
                                    <Empty description={<span style={{ color: 'rgba(255,255,255,0.7)' }}>Use a barra de ferramentas para adicionar mesas.</span>} />
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>

            {editingTable && (
                 <Modal 
                    title="Editar Mesa" 
                    open={isEditModalVisible} 
                    onCancel={() => setIsEditModalVisible(false)}
                    onOk={handleEditModalOk}
                 >
                    <Form form={form} layout="vertical" initialValues={editingTable}>
                        <Form.Item name="number" label="Número/Nome" rules={[{ required: true }]}><Input /></Form.Item>
                        <Form.Item name="capacity" label="Capacidade (Lugares)" rules={[{ required: true }]}><InputNumber min={1} style={{width: '100%'}} /></Form.Item>
                        <Form.Item name="shape" label="Formato" rules={[{ required: true }]}>
                            <Select>
                                <Option value="rectangle">Retangular</Option>
                                <Option value="round">Redonda</Option>
                            </Select>
                        </Form.Item>
                    </Form>
                </Modal>
            )}
        </>
    );
};

export default FloorPlanSettingsPage;