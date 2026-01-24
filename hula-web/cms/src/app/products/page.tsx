'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, Table, Button, Space, Tag, Input, Image, message, Modal, Form, InputNumber } from 'antd';
import { SearchOutlined, EditOutlined, SyncOutlined, EyeOutlined } from '@ant-design/icons';

import { productsApi } from '@/lib/api';

// ... 

interface Product {
    id: number;
    sku: string;
    name: string;
    category: string;
    base_price: number;
    cost_price: number;
    quantity_in_stock: number;
    is_active: boolean;
    show_on_website: boolean; // Add this field
    image_url: string;
    customer_description: string;
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [editModal, setEditModal] = useState(false);
    const [form] = Form.useForm();
    const loadProducts = async () => {
        setLoading(true);
        try {
            const res = await productsApi.getAll();
            const data = res.data;
            setProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            message.error('Không thể tải danh sách sản phẩm');
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        form.setFieldsValue({
            image_url: product.image_url,
            customer_description: product.customer_description,
        });
        setEditModal(true);
    };

    const handleSave = async () => {
        if (!editingProduct) return;
        try {
            const values = await form.validateFields();
            await productsApi.update(editingProduct.id, values);
            message.success('Đã cập nhật sản phẩm');
            setEditModal(false);
            loadProducts();
        } catch {
            message.error('Có lỗi xảy ra');
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    const columns = [
        {
            title: 'Hình ảnh',
            dataIndex: 'image_url',
            key: 'image_url',
            width: 80,
            render: (url: string) => (
                url ? <Image src={url} width={50} height={50} style={{ objectFit: 'cover', borderRadius: 4 }} />
                    : <div style={{ width: 50, height: 50, background: '#f5f5f5', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>
            ),
        },
        {
            title: 'SKU',
            dataIndex: 'sku',
            key: 'sku',
            width: 120,
            render: (sku: string) => <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>{sku}</code>,
        },
        {
            title: 'Tên sản phẩm',
            dataIndex: 'name',
            key: 'name',
            filteredValue: searchText ? [searchText] : null,
            onFilter: (value: any, record: Product) =>
                record.name.toLowerCase().includes(value.toLowerCase()) ||
                record.sku.toLowerCase().includes(value.toLowerCase()),
        },
        { title: 'Danh mục', dataIndex: 'category', key: 'category', width: 120 },
        {
            title: 'Giá bán',
            dataIndex: 'base_price',
            key: 'base_price',
            width: 130,
            render: (price: number) => <strong style={{ color: '#1890ff' }}>{formatPrice(price)}</strong>,
        },
        {
            title: 'Tồn kho',
            dataIndex: 'quantity_in_stock',
            key: 'quantity_in_stock',
            width: 100,
            render: (qty: number) => (
                <Tag color={qty > 10 ? 'success' : qty > 0 ? 'warning' : 'error'}>
                    {qty}
                </Tag>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'show_on_website', // Change to show_on_website
            key: 'show_on_website',
            width: 100,
            render: (show: boolean) => (
                <Tag color={show ? 'success' : 'default'}>
                    {show ? 'Hiển thị' : 'Ẩn'}
                </Tag>
            ),
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 120,
            render: (_: any, record: Product) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                        title="Sửa mô tả/ảnh"
                    />
                    <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => window.open(`https://nemmamnon.com/san-pham/${record.sku}`, '_blank')}
                        title="Xem trên website"
                    />
                </Space>
            ),
        },
    ];

    return (
        <AdminLayout>
            <Card
                title="Sản phẩm (Đồng bộ từ ERP)"
                extra={
                    <Space>
                        <Input
                            placeholder="Tìm kiếm..."
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{ width: 200 }}
                            allowClear
                        />
                        <Button icon={<SyncOutlined />} onClick={loadProducts} loading={loading}>
                            Làm mới
                        </Button>
                    </Space>
                }
            >
                <p style={{ marginBottom: 16, color: '#666' }}>
                    💡 Sản phẩm được quản lý từ ERP. Tại đây bạn có thể chỉnh sửa mô tả và hình ảnh hiển thị trên website.
                </p>
                <Table
                    columns={columns}
                    dataSource={products}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10, showTotal: (total) => `Tổng ${total} sản phẩm` }}
                />
            </Card>

            <Modal
                title={`Chỉnh sửa: ${editingProduct?.name}`}
                open={editModal}
                onOk={handleSave}
                onCancel={() => setEditModal(false)}
                okText="Lưu"
                cancelText="Hủy"
                width={600}
            >
                <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                    <Form.Item name="image_url" label="URL Hình ảnh">
                        <Input placeholder="https://... hoặc link Google Drive" />
                    </Form.Item>
                    <Form.Item name="customer_description" label="Mô tả cho khách hàng">
                        <Input.TextArea rows={5} placeholder="Mô tả chi tiết sản phẩm hiển thị trên website..." />
                    </Form.Item>
                </Form>
            </Modal>
        </AdminLayout>
    );
}
