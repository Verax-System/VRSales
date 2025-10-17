import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button, Modal, message, Space, Input, Typography, Popconfirm, Tooltip, Card, Avatar, Empty, Spin, Form, Select, Switch, Tag } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, SearchOutlined, MailOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import ApiService from '../api/ApiService';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

// Estilos (sem alterações)
const PageStyles = () => (
    <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    .users-page-container { padding: 24px; background-color: #f0f2f5; font-family: 'Inter', sans-serif; min-height: 100vh; }
    .users-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding: 20px 24px; background: linear-gradient(135deg, #8e44ad 0%, #9b59b6 100%); border-radius: 16px; color: white; box-shadow: 0 10px 30px -10px rgba(142, 68, 173, 0.5); }
    .controls-card { margin-bottom: 24px; border-radius: 12px; }
    .users-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; }
    .user-card { border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: none; overflow: hidden; position: relative; transition: all 0.3s ease-in-out; }
    .user-card:hover { transform: translateY(-5px); box-shadow: 0 12px 24px rgba(0,0,0,0.12); }
    .role-banner { height: 8px; width: 100%; }
    .card-content { padding: 24px; text-align: center; }
    .card-actions { position: absolute; top: 16px; right: 16px; display: flex; gap: 8px; opacity: 0; transform: scale(0.9); transition: all 0.2s ease-in-out; }
    .user-card:hover .card-actions { opacity: 1; transform: scale(1); }
  `}</style>
);

// Componente "Filho": O formulário dentro do Modal
const UserFormModal = ({ visible, onCancel, onSuccess, editingUser }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [stores, setStores] = useState([]);
    const { user: currentUser } = useAuth();

    const isSuperAdmin = currentUser?.role === 'super_admin';
    const isEditing = !!editingUser;

    useEffect(() => {
        if (visible && isSuperAdmin) {
            const fetchStores = async () => {
                try {
                    // PASSO 1 (CORRIGIDO): Usando o método padrão '.get'
                    const response = await ApiService.get('/stores/');
                    setStores(response.data);
                } catch {
                    message.error('Falha ao carregar a lista de lojas.');
                }
            };
            fetchStores();
        }
    }, [visible, isSuperAdmin]);
    
    useEffect(() => {
        if (visible) {
            if (editingUser) {
                form.setFieldsValue(editingUser);
            } else {
                form.resetFields();
            }
        }
    }, [editingUser, visible, form]);

    const handleFinish = async (values) => {
        setLoading(true);
        try {
            // Se não for Super Admin, o store_id é o do próprio usuário
            if (!isSuperAdmin) {
                values.store_id = currentUser.store_id;
            }

            if (isEditing) {
                // Não envia a senha se o campo estiver vazio
                if (!values.password) {
                    delete values.password;
                }
                // PASSO 1 (CORRIGIDO): Usando o método padrão '.put'
                await ApiService.put(`/users/${editingUser.id}`, values);
            } else {
                // PASSO 1 (CORRIGIDO): Usando o método padrão '.post'
                await ApiService.post('/users/', values);
            }
            
            if (onSuccess) {
                onSuccess(); // Notifica o "pai" sobre o sucesso
            }

        } catch (error) {
            message.error(error.response?.data?.detail || 'Ocorreu um erro ao salvar o usuário.');
        } finally {
            setLoading(false);
        }
    };

    const roles = [
        isSuperAdmin && { value: 'super_admin', label: 'Super Admin' },
        { value: 'admin', label: 'Admin' },
        { value: 'manager', label: 'Gerente' },
        { value: 'cashier', label: 'Caixa' },
    ].filter(Boolean);

    return (
        <Modal
            title={isEditing ? 'Editar Usuário' : 'Criar Novo Usuário'}
            open={visible}
            onCancel={onCancel}
            destroyOnClose
            footer={[
                <Button key="back" onClick={onCancel}>Cancelar</Button>,
                <Button key="submit" type="primary" loading={loading} onClick={() => form.submit()}>Salvar</Button>,
            ]}
        >
            <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={editingUser || { is_active: true, role: 'cashier' }}>
                <Form.Item name="full_name" label="Nome Completo" rules={[{ required: true, message: 'O nome é obrigatório' }]}>
                    <Input prefix={<UserOutlined />} placeholder="João da Silva" size="large" />
                </Form.Item>
                <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Insira um email válido' }]}>
                    <Input prefix={<MailOutlined />} placeholder="exemplo@email.com" size="large"/>
                </Form.Item>
                <Form.Item name="password" label={isEditing ? 'Nova Senha (deixe em branco para não alterar)' : 'Senha'} rules={[{ required: !isEditing, message: 'A senha é obrigatória' }, { min: 8, message: 'A senha deve ter no mínimo 8 caracteres' }]}>
                    <Input.Password prefix={<LockOutlined />} placeholder="••••••••" size="large"/>
                </Form.Item>
                <Form.Item name="role" label="Função" rules={[{ required: true }]}>
                    <Select placeholder="Selecione uma função" size="large">
                        {roles.map(role => <Option key={role.value} value={role.value}>{role.label}</Option>)}
                    </Select>
                </Form.Item>
                {isSuperAdmin && (
                    <Form.Item name="store_id" label="Loja" rules={[{ required: true, message: 'É obrigatório associar o usuário a uma loja' }]}>
                        <Select placeholder="Selecione a loja do usuário" loading={!stores.length} size="large">
                            {stores.map(store => <Option key={store.id} value={store.id}>{store.name}</Option>)}
                        </Select>
                    </Form.Item>
                )}
                <Form.Item name="is_active" label="Status" valuePropName="checked">
                    <Switch checkedChildren="Ativo" unCheckedChildren="Inativo" />
                </Form.Item>
            </Form>
        </Modal>
    );
};


// Componente "Pai": A Página de Usuários
const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [searchText, setSearchText] = useState('');

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            // PASSO 1 (CORRIGIDO): Usando o método padrão '.get'
            const response = await ApiService.get('/users/');
            setUsers(response.data);
        } catch (error) {
            message.error('Falha ao carregar os usuários.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleCancel = () => { setIsModalVisible(false); setEditingUser(null); };
    
    // A FUNÇÃO CHAVE: O que fazer quando o formulário for salvo com sucesso.
    const handleFormSuccess = () => {
        message.success(`Usuário ${editingUser ? 'atualizado' : 'criado'} com sucesso!`);
        setIsModalVisible(false); // 1. Fecha o modal
        setEditingUser(null);
        fetchUsers();           // 2. Atualiza a lista
    };

    const handleDelete = async (userId) => {
        try {
            // PASSO 1 (CORRIGIDO): Usando o método padrão '.delete'
            await ApiService.delete(`/users/${userId}`);
            message.success('Usuário apagado com sucesso!');
            fetchUsers();
        } catch (error) {
            message.error('Falha ao apagar o usuário.');
        }
    };

    const roleColors = { super_admin: '#ffd700', admin: '#ff4d4f', manager: '#1890ff', cashier: '#13c2c2' };
    const roleNames = { super_admin: 'Super Admin', admin: 'Admin', manager: 'Gerente', cashier: 'Caixa' };

    const filteredUsers = useMemo(() => users.filter(user =>
        user.full_name.toLowerCase().includes(searchText.toLowerCase()) ||
        user.email.toLowerCase().includes(searchText.toLowerCase())
    ), [users, searchText]);
    
    const gridVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
    const cardVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

    return (
        <>
            <PageStyles />
            <motion.div className="users-page-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="users-header">
                    <Title level={2} style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <SafetyCertificateOutlined /> Gestão de Usuários
                    </Title>
                </div>
                
                <Card className="controls-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Search
                            placeholder="Procurar por nome ou email..."
                            onChange={e => setSearchText(e.target.value)}
                            style={{ maxWidth: 400 }} allowClear size="large"
                        />
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingUser(null); setIsModalVisible(true); }} size="large">
                            Novo Usuário
                        </Button>
                    </div>
                </Card>

                {loading ? <div style={{textAlign: 'center', padding: 50}}><Spin size="large" /></div> : (
                    <AnimatePresence>
                        {filteredUsers.length > 0 ? (
                            <motion.div className="users-grid" variants={gridVariants} initial="hidden" animate="visible">
                                {filteredUsers.map(user => (
                                    <motion.div key={user.id} variants={cardVariants}>
                                        <Card className="user-card" bodyStyle={{padding: 0}}>
                                            <div className="role-banner" style={{ background: roleColors[user.role] || '#ccc' }} />
                                            <div className="card-actions">
                                                <Space>
                                                    <Tooltip title="Editar"><Button shape="circle" icon={<EditOutlined />} onClick={() => { setEditingUser(user); setIsModalVisible(true); }} /></Tooltip>
                                                    <Popconfirm title="Tem certeza?" onConfirm={() => handleDelete(user.id)} okText="Sim" cancelText="Não">
                                                        <Tooltip title="Excluir"><Button shape="circle" danger icon={<DeleteOutlined />} /></Tooltip>
                                                    </Popconfirm>
                                                </Space>
                                            </div>
                                            <div className="card-content">
                                                <Avatar size={64} icon={<UserOutlined />} style={{marginBottom: 16, border: '3px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'}}/>
                                                <Title level={4} style={{marginBottom: 0}}>{user.full_name}</Title>
                                                <Text type="secondary">{user.email}</Text>
                                                <div style={{marginTop: 16}}>
                                                    <Tag color={user.is_active ? 'green' : 'red'}>{user.is_active ? 'ATIVO' : 'INATIVO'}</Tag>
                                                    <Tag color={roleColors[user.role]}>{roleNames[user.role] || user.role}</Tag>
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : (
                            <Empty description={<Title level={5} style={{color: '#888'}}>Nenhum usuário encontrado.</Title>} />
                        )}
                    </AnimatePresence>
                )}
                
                <UserFormModal
                    visible={isModalVisible}
                    onCancel={handleCancel}
                    onSuccess={handleFormSuccess}
                    editingUser={editingUser}
                />
            </motion.div>
        </>
    );
};

export default UsersPage;