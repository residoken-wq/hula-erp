import React, { useState, useEffect, useMemo } from 'react';
import { Layout, Row, Col, Card, Input, Button, List, Avatar, Badge, message, Select, Typography, Statistic, Divider, Empty, Tag, Drawer } from 'antd';
import { SearchOutlined, ShoppingCartOutlined, UserOutlined, DeleteOutlined, PlusOutlined, MinusOutlined, CheckCircleOutlined, WalletOutlined, HomeOutlined, BarcodeOutlined } from '@ant-design/icons';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import useMobile from '../hooks/useMobile'; // <--- Import Hook
import { FloatButton } from 'antd'; // <--- Import FloatButton

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

interface Product {
    id: number;
    sku: string;
    name: string;
    base_price: number;
    quantity_in_stock: number;
    image_url?: string;
    category?: string;
    unit?: string;
}

interface CartItem extends Product {
    qty: number;
}

const PosPage: React.FC = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const isMobile = useMobile(); // <--- Detect Mobile
    const [mobileCartVisible, setMobileCartVisible] = useState(false); // <--- Drawer State

    // Initial Data Fetch
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [resProd, resCust] = await Promise.all([
                    api.get('/products'),
                    api.get('/customers')
                ]);
                setProducts(resProd.data || []);
                setCustomers(resCust.data || []);
            } catch (error) {
                message.error('Lỗi tải dữ liệu');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Helper: Add to Cart
    const addToCart = (product: Product) => {
        if (product.quantity_in_stock < 0) {
            message.warning('Sản phẩm này đã hết hàng kho (Tồn < 0)');
            return;
        }

        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
            }
            return [...prev, { ...product, qty: 1 }];
        });
        message.success({ content: `Đã thêm ${product.name}`, key: 'cart_msg', duration: 1 });
    };

    // Helper: Update Qty
    const updateQty = (id: number, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.qty + delta);
                return { ...item, qty: newQty };
            }
            return item;
        }));
    };

    // Helper: Remove Item
    const removeFromCart = (id: number) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    // Helper: Checkout
    const handleCheckout = async () => {
        if (cart.length === 0) return message.warning('Giỏ hàng trống');

        try {
            const payload = {
                customer_id: selectedCustomer ? selectedCustomer.id : null,
                customer_name: selectedCustomer ? selectedCustomer.name : 'Khách lẻ',
                items: cart.map(item => ({
                    product_id: item.id,
                    product_sku: item.sku,
                    product_name: item.name,
                    quantity: item.qty,
                    unit_price: item.base_price,
                    total_price: item.qty * item.base_price
                })),
                total_amount: cart.reduce((acc, item) => acc + (item.qty * item.base_price), 0),
                status: 'COMPLETED', // Auto complete for retail
                billing_address: 'Tại quầy',
                notes: 'Đơn bán lẻ POS' // Identify source
            };

            await api.post('/sales', payload);
            message.success('Thanh toán thành công!');
            setCart([]);
            setSelectedCustomer(null);
        } catch (error) {
            message.error('Lỗi thanh toán');
        }
    };

    // Filtering
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchSearch = p.name.toLowerCase().includes(searchText.toLowerCase()) || p.sku.toLowerCase().includes(searchText.toLowerCase());
            const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory; // Assuming category field exists or logic needs adjustment
            return matchSearch && matchCat;
        });
    }, [products, searchText, selectedCategory]);

    const categories = useMemo(() => [...new Set(products.map(p => p.category || 'Khác'))], [products]);
    const totalAmount = cart.reduce((acc, item) => acc + (item.qty * item.base_price), 0);
    const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);

    // --- RENDER HELPERS ---
    const renderProductGrid = () => (
        <Content style={{ padding: '16px', overflowY: 'auto', background: '#f0f2f5', height: '100%' }}>
            <div style={{ marginBottom: 16, display: 'flex', gap: 10 }}>
                <Input
                    prefix={<SearchOutlined style={{ color: '#ccc' }} />}
                    placeholder="Tìm sản phẩm (Tên, SKU, Barcode)..."
                    size="large"
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    style={{ flex: 1, borderRadius: 8 }}
                />
                <Select
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                    size="large"
                    style={{ width: isMobile ? 110 : 150 }} // Slightly smaller on mobile
                    dropdownMatchSelectWidth={false}
                >
                    <Option value="ALL">Tất cả</Option>
                    {categories.map(c => <Option key={c} value={c}>{c}</Option>)}
                </Select>
            </div>

            <Row gutter={[16, 16]}>
                {filteredProducts.map(product => {
                    const isOutOfStock = product.quantity_in_stock < 0;
                    return (
                        <Col xs={12} sm={12} md={8} lg={6} xl={4} key={product.id}>
                            {/* xs={12} allows 2 items per row on mobile */}
                            <Card
                                hoverable={!isOutOfStock}
                                style={{
                                    borderRadius: 8,
                                    overflow: 'hidden',
                                    opacity: isOutOfStock ? 0.6 : 1,
                                    cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                                    height: '100%',
                                    display: 'flex', flexDirection: 'column'
                                }}
                                bodyStyle={{ padding: 8, flex: 1, display: 'flex', flexDirection: 'column' }} // Reduce padding on mobile
                                onClick={() => !isOutOfStock && addToCart(product)}
                                cover={
                                    <div style={{ height: isMobile ? 120 : 140, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #f0f0f0' }}>
                                        {product.image_url ? (
                                            <img alt={product.name} src={product.image_url} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                                        ) : (
                                            <div style={{ fontSize: 32, color: '#eee' }}><BarcodeOutlined /></div>
                                        )}
                                    </div>
                                }
                            >
                                <div style={{ flex: 1 }}>
                                    <Text strong style={{ fontSize: 13, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 40 }}>
                                        {product.name}
                                    </Text>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 }}>
                                        <div>
                                            <Text strong style={{ color: '#1890ff', fontSize: 15 }}>{product.base_price.toLocaleString()}đ</Text>
                                        </div>
                                    </div>
                                    {!isMobile && <Tag color={isOutOfStock ? 'red' : 'green'} style={{ marginTop: 5 }}>{isOutOfStock ? 'Hết' : 'Kho: ' + product.quantity_in_stock}</Tag>}
                                </div>
                                {!isMobile && !isOutOfStock && <Button type="primary" block size="small" style={{ marginTop: 8 }} icon={<PlusOutlined />}>Thêm</Button>}
                            </Card>
                        </Col>
                    )
                })}
                {filteredProducts.length === 0 && <Empty description="Không tìm thấy sản phẩm" style={{ width: '100%', marginTop: 50 }} />}
            </Row>
        </Content>
    );

    const renderCartContent = () => (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>
            {/* CART HEADER */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={4} style={{ margin: 0 }}><ShoppingCartOutlined /> Giỏ Hàng <Badge count={totalQty} style={{ backgroundColor: '#52c41a' }} /></Title>
                <Button type="text" icon={<DeleteOutlined />} danger onClick={() => setCart([])}>Xóa</Button>
            </div>

            {/* CUSTOMER SELECT */}
            <div style={{ padding: '12px 24px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                <Select
                    showSearch
                    placeholder="Khách lẻ (Mặc định)"
                    style={{ width: '100%' }}
                    allowClear
                    optionFilterProp="children"
                    onChange={(val) => {
                        const cust = customers.find(c => c.id === val);
                        setSelectedCustomer(cust);
                    }}
                    filterOption={(input, option: any) =>
                        (option?.children as unknown as string).toLowerCase().includes(input.toLowerCase())
                    }
                >
                    {customers.map(c => <Option key={c.id} value={c.id}>{c.name} - {c.phone}</Option>)}
                </Select>
                {selectedCustomer && <div style={{ marginTop: 5, fontSize: 12, color: '#1890ff' }}><UserOutlined /> {selectedCustomer.phone}</div>}
            </div>

            {/* CART ITEMS */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px' }}>
                <List
                    itemLayout="horizontal"
                    dataSource={cart}
                    renderItem={item => (
                        <List.Item actions={[
                            <Button size="small" shape="circle" icon={<MinusOutlined />} onClick={() => item.qty > 1 ? updateQty(item.id, -1) : removeFromCart(item.id)} />,
                            <span style={{ fontWeight: 600, width: 20, textAlign: 'center' }}>{item.qty}</span>,
                            <Button size="small" shape="circle" icon={<PlusOutlined />} onClick={() => updateQty(item.id, 1)} />
                        ]}>
                            <List.Item.Meta
                                title={<span style={{ fontSize: 13 }}>{item.name}</span>}
                                description={
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: 12, color: '#999' }}>{item.base_price.toLocaleString()} x {item.qty}</span>
                                        <span style={{ fontWeight: 600, color: '#333' }}>{(item.base_price * item.qty).toLocaleString()}đ</span>
                                    </div>
                                }
                            />
                        </List.Item>
                    )}
                />
                {cart.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có sản phẩm" style={{ marginTop: 30 }} />}
            </div>

            {/* FOOTER TOTALS */}
            <div style={{ padding: 24, background: '#fafafa', borderTop: '1px solid #e8e8e8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text>Tạm tính:</Text>
                    <Text strong>{totalAmount.toLocaleString()}đ</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <Text>VAT (0%):</Text>
                    <Text strong>0đ</Text>
                </div>
                <Divider style={{ margin: '12px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
                    <Title level={4} style={{ margin: 0 }}>Tổng:</Title>
                    <Title level={3} type="danger" style={{ margin: 0 }}>{totalAmount.toLocaleString()}đ</Title>
                </div>

                <Row gutter={10}>
                    <Col span={12}>
                        <Button block type="dashed" size="large" onClick={() => navigate('/orders')}>Thoát</Button>
                    </Col>
                    <Col span={12}>
                        <Button block type="primary" size="large" icon={<WalletOutlined />} onClick={handleCheckout} disabled={cart.length === 0}>
                            Thanh Toán
                        </Button>
                    </Col>
                </Row>
            </div>
        </div>
    );

    if (isMobile) {
        return (
            <Layout style={{ height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
                {renderProductGrid()}

                {/* Mobile Floating Button */}
                <FloatButton
                    icon={<ShoppingCartOutlined />}
                    type="primary"
                    badge={{ count: totalQty, color: 'red' }}
                    onClick={() => setMobileCartVisible(true)}
                    style={{ right: 24, bottom: 24, width: 60, height: 60 }}
                />

                {/* Mobile Cart Drawer */}
                <Drawer
                    title="Giỏ hàng"
                    placement="right"
                    onClose={() => setMobileCartVisible(false)}
                    open={mobileCartVisible}
                    width="90%"
                    bodyStyle={{ padding: 0 }}
                >
                    {renderCartContent()}
                </Drawer>
            </Layout>
        );
    }

    // DESKTOP LAYOUT (Preserved Logic)
    return (
        <Layout style={{ height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
            {/* LEFT SIDE: PRODUCTS GRID */}
            {renderProductGrid()}

            {/* RIGHT SIDE: CART */}
            <div style={{ width: 420, minWidth: 420, background: '#fff', borderLeft: '1px solid #e8e8e8', height: '100%' }}>
                {renderCartContent()}
            </div>
        </Layout>
    );
};

export default PosPage;
