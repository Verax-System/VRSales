import React, { useState, useEffect } from 'react';
import { Button, Modal, message, Input, Tag, Avatar, Space, Typography, Spin, Popconfirm, Tooltip, Empty } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, AppstoreOutlined, DropboxOutlined } from '@ant-design/icons';
import ApiService from '../api/ApiService';
import ProductForm from '../components/ProductForm';

const { Title, Text, Paragraph } = Typography;

// Estilos embutidos para a nova página de produtos
const PageStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

    .product-page-container {
      padding: 24px;
      background-color: #f0f2f5;
      font-family: 'Inter', sans-serif;
      min-height: 100vh;
    }

    .product-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding: 20px 24px;
      background: linear-gradient(135deg, #27ae60 0%, #2980b9 100%);
      border-radius: 16px;
      color: white;
      box-shadow: 0 10px 30px -10px rgba(39, 174, 96, 0.5);
    }

    .controls-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding: 16px;
      background-color: #fff;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }

    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
    }

    .product-card {
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      border: 1px solid #e8e8e8;
      overflow: hidden;
      position: relative;
      transition: all 0.3s ease-in-out;
    }

    .product-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 24px rgba(0,0,0,0.12);
    }
    
    .product-card .ant-card-cover {
        position: relative;
    }
    
    .product-card .ant-card-cover img {
        height: 200px;
        object-fit: cover;
    }
    
    .card-actions-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.4);
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 12px;
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    .product-card:hover .card-actions-overlay {
        opacity: 1;
    }

    .stock-indicator {
        height: 6px;
        width: 100%;
        background-color: #e0e0e0;
    }
    
    .stock-indicator-bar {
        height: 100%;
        transition: width 0.5s ease;
    }
  `}</style>
);

const ProductPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchText, setSearchText] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getProducts();
      setProducts(response.data);
    } catch (error) {
      message.error('Falha ao carregar os produtos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleOpenModal = (product = null) => { setEditingProduct(product); setIsModalVisible(true); };
  const handleCancel = () => { setIsModalVisible(false); setEditingProduct(null); };
  const handleFinish = () => { fetchProducts(); handleCancel(); };

  const handleDelete = (productId) => {
    Modal.confirm({
      title: 'Tem certeza que quer apagar este produto?', content: 'Esta ação não pode ser desfeita.',
      okText: 'Sim, apagar', okType: 'danger', cancelText: 'Não',
      onOk: async () => {
        try {
          await ApiService.deleteProduct(productId);
          message.success('Produto apagado com sucesso!');
          fetchProducts();
        } catch (error) { message.error('Falha ao apagar o produto.'); }
      },
    });
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchText.toLowerCase()) ||
    (p.barcode && p.barcode.toLowerCase().includes(searchText.toLowerCase()))
  );
  
  const gridVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <>
      <PageStyles />
      <motion.div className="product-page-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="product-header">
          <Title level={2} style={{ color: 'white', margin: 0 }}>
            <AppstoreOutlined style={{ marginRight: 12 }} /> Gestão de Produtos
          </Title>
        </div>

        <div className="controls-container">
          <Input
            placeholder="Procurar por nome ou código de barras..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ maxWidth: 400 }}
            size="large"
          />
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
            Novo Produto
          </Button>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>
        ) : (
          <AnimatePresence>
            {filteredProducts.length > 0 ? (
              <motion.div className="product-grid" variants={gridVariants} initial="hidden" animate="visible">
                {filteredProducts.map(product => {
                  const stockStatus = product.stock < product.low_stock_threshold ? 'low' : 'ok';
                  const stockPercentage = Math.min((product.stock / (product.low_stock_threshold * 2)) * 100, 100);
                  let stockColor = '#2ecc71'; // Verde (ok)
                  if (stockStatus === 'low') stockColor = '#f39c12'; // Laranja (baixo)
                  if (product.stock === 0) stockColor = '#e74c3c'; // Vermelho (zerado)

                  return (
                    <motion.div key={product.id} variants={cardVariants}>
                      <Card
                        className="product-card"
                        cover={
                          <div style={{ position: 'relative' }}>
                            <Image
                              alt={product.name}
                              src={product.image_url}
                              fallback="https://via.placeholder.com/300x200/ecf0f1/bdc3c7?text=Sem+Imagem"
                              height={200}
                              style={{ objectFit: 'cover' }}
                              preview={false}
                            />
                            <div className="card-actions-overlay">
                                <Button type="primary" shape="circle" icon={<EditOutlined />} onClick={() => handleOpenModal(product)} />
                                <Popconfirm title="Tem certeza?" onConfirm={() => handleDelete(product.id)} okText="Sim" cancelText="Não">
                                    <Button type="primary" danger shape="circle" icon={<DeleteOutlined />} />
                                </Popconfirm>
                            </div>
                          </div>
                        }
                      >
                        <Title level={5} ellipsis>{product.name}</Title>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1890ff' }}>
                            {`R$ ${product.price.toFixed(2).replace('.', ',')}`}
                          </Text>
                          <Tag color={stockColor}>{product.stock} em estoque</Tag>
                        </div>
                        <Tooltip title={`Estoque: ${product.stock} / Limite Mínimo: ${product.low_stock_threshold}`}>
                            <div className="stock-indicator" style={{ marginTop: 12 }}>
                                <div className="stock-indicator-bar" style={{ width: `${stockPercentage}%`, background: stockColor }}></div>
                            </div>
                        </Tooltip>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
                <Empty description={<Title level={5} style={{color: '#888'}}>Nenhum produto encontrado.</Title>} />
            )}
          </AnimatePresence>
        )}

        {isModalVisible && (
          <Modal
            title={editingProduct ? 'Editar Produto' : 'Adicionar Novo Produto'}
            open={isModalVisible}
            onCancel={handleCancel}
            footer={null}
            destroyOnClose
          >
            <ProductForm
              product={editingProduct}
              onSuccess={handleFinish}
              onCancel={handleCancel}
            />
          </Modal>
        )}
      </motion.div>
    </>
  );
};

export default ProductPage;