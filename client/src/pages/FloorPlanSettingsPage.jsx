import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button, message, Spin, Typography, Empty } from 'antd';
import { motion } from 'framer-motion';
import { SaveOutlined, LayoutOutlined, PlusOutlined, DragOutlined } from '@ant-design/icons';
import Draggable from 'react-draggable';
import ApiService from '../api/ApiService';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

// Estilos (sem alterações)
const PageStyles = () => (
    <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    .floorplan-page-container { padding: 24px; background-color: #f0f2f5; font-family: 'Inter', sans-serif; min-height: 100vh; }
    .floorplan-header { margin-bottom: 24px; padding: 20px 24px; background: linear-gradient(135deg, #007BFF 0%, #00C6FF 100%); border-radius: 16px; color: white; box-shadow: 0 10px 20px -10px rgba(0, 123, 255, 0.5); }
    .header-content { display: flex; justify-content: space-between; align-items: center; }
    .header-instructions { margin-top: 8px; color: rgba(255, 255, 255, 0.85); }
    .floorplan-canvas { position: relative; height: 75vh; width: 100%; border-radius: 16px; overflow: hidden; background-color: #1a202c; background-image: linear-gradient(rgba(0, 198, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 198, 255, 0.1) 1px, transparent 1px); background-size: 20px 20px; box-shadow: inset 0 0 20px rgba(0,0,0,0.4); }
    .draggable-table { cursor: grab; width: 100px; height: 100px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 50%; background: #ffffff; color: #1a202c; box-shadow: 0 0 15px rgba(0, 198, 255, 0.5); border: 2px solid rgba(0, 198, 255, 0.8); transition: transform 0.2s ease, box-shadow 0.2s ease; }
    .draggable-table:active { cursor: grabbing; }
    .table-number { font-size: 1.5rem; font-weight: 700; }
    .empty-canvas { display: flex; justify-content: center; align-items: center; height: 100%; color: white; }
  `}</style>
);

// Componente da Mesa Arrastável separado para usar a ref corretamente
const DraggableTable = ({ table, activeDragId, onStart, onStop }) => {
    const nodeRef = useRef(null);

    return (
        <Draggable
            key={table.id}
            bounds="parent"
            // --- AQUI ESTÁ A CORREÇÃO ---
            // Trocamos 'position' por 'defaultPosition'.
            // Isso permite que o componente se mova livremente,
            // evitando o bug que o "prendia" no lugar.
            defaultPosition={{ x: table.pos_x, y: table.pos_y }}
            onStart={() => onStart(table.id)}
            onStop={(e, data) => onStop(e, data, table.id)}
            nodeRef={nodeRef}
        >
            <motion.div
                ref={nodeRef}
                className="draggable-table"
                variants={{ hidden: { opacity: 0, scale: 0.5 }, visible: { opacity: 1, scale: 1 } }}
                whileTap={{ scale: 1.1, cursor: 'grabbing', boxShadow: "0 0 30px rgba(0, 230, 255, 0.8)" }}
                animate={{
                    scale: activeDragId === table.id ? 1.1 : 1,
                    boxShadow: activeDragId === table.id ? "0 0 30px rgba(0, 230, 255, 0.8)" : "0 0 15px rgba(0, 198, 255, 0.5)",
                }}
            >
                <Text className="table-number">{table.number}</Text>
                <DragOutlined style={{ fontSize: '12px', color: '#888' }} />
            </motion.div>
        </Draggable>
    );
};


const FloorPlanSettingsPage = () => {
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeDragId, setActiveDragId] = useState(null);
    const navigate = useNavigate();

    const fetchTables = useCallback(async () => {
        setLoading(true);
        try {
            const response = await ApiService.get('/tables/');
            setTables(response.data.map(t => ({ ...t, pos_x: t.pos_x || 0, pos_y: t.pos_y || 0 })));
        } catch {
            message.error('Erro ao carregar mesas.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTables();
    }, [fetchTables]);

    const handleDragStart = (tableId) => {
        setActiveDragId(tableId);
    };

    const handleDragStop = (e, data, tableId) => {
        setActiveDragId(null);
        // Atualiza o estado com a posição final da mesa
        setTables(currentTables =>
            currentTables.map(t =>
                t.id === tableId ? { ...t, pos_x: Math.round(data.x), pos_y: Math.round(data.y) } : t
            )
        );
    };

    const handleSaveLayout = async () => {
        setSaving(true);
        try {
            const layoutData = {
                tables: tables.map(t => ({ id: t.id, pos_x: t.pos_x, pos_y: t.pos_y }))
            };
            await ApiService.put('/tables/layout', layoutData);
            message.success('Layout do salão salvo com sucesso!');
        } catch {
            message.error('Erro ao salvar o layout.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><Spin tip="Carregando layout..." size="large" /></div>;
    }

    return (
        <>
            <PageStyles />
            <motion.div className="floorplan-page-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="floorplan-header">
                    <div className="header-content">
                        <Title level={2} style={{ margin: 0, color: 'white' }}>
                            <LayoutOutlined style={{ marginRight: 12 }} /> Editor de Layout do Salão
                        </Title>
                        <Button type="primary" size="large" icon={<SaveOutlined />} loading={saving} onClick={handleSaveLayout} disabled={tables.length === 0}>
                            Salvar Layout
                        </Button>
                    </div>
                    <Text className="header-instructions">
                        Arraste as mesas para organizar o layout do seu estabelecimento.
                    </Text>
                </div>

                <motion.div className="floorplan-canvas" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }} initial="hidden" animate="visible">
                    {tables.length > 0 ? (
                        tables.map(table => (
                            <DraggableTable
                                key={table.id}
                                table={table}
                                activeDragId={activeDragId}
                                onStart={handleDragStart}
                                onStop={handleDragStop}
                            />
                        ))
                    ) : (
                        <div className="empty-canvas">
                            <Empty
                                description={<span style={{ color: 'rgba(255,255,255,0.7)' }}>Nenhuma mesa cadastrada.</span>}
                            >
                                <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/tables')}>
                                    Cadastrar Mesas
                                </Button>
                            </Empty>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </>
    );
};

export default FloorPlanSettingsPage;