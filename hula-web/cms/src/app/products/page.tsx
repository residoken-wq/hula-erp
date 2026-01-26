'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, Table, Button, Space, Tag, Input, Image, message, Modal, Form, InputNumber, Tabs, Switch, Typography } from 'antd';
import { SearchOutlined, EditOutlined, SyncOutlined, EyeOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';

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
    customization_config?: {
        allow_logo?: boolean;
        logo_price?: number;
        colors?: Array<{ name: string; code: string; image_url?: string }>;
        accessories?: Array<{ name: string; price: number; image_url?: string }>;
    };
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
            // Only show products enabled for website
            const filteredData = Array.isArray(data)
                ? data.filter((p: Product) => p.show_on_website)
                : [];
            setProducts(filteredData);
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

    const handleEdit = async (product: Product) => {
        setEditingProduct(product);
        // Fetch separate website config
        try {
            const res = await productsApi.getWebsiteConfig(product.id);
            const config = res.data?.customization_config || { colors: [], accessories: [], allow_logo: false };

            form.setFieldsValue({
                image_url: product.image_url,
                customer_description: product.customer_description,
                customization_config: config
            });
            setEditModal(true);
        } catch (error) {
            console.error('Failed to load website config', error);
            form.setFieldsValue({
                image_url: product.image_url,
                customer_description: product.customer_description,
                customization_config: { colors: [], accessories: [], allow_logo: false }
            });
            setEditModal(true);
        }
    };

    const handleSave = async () => {
        if (!editingProduct) return;
        try {
            const values = await form.validateFields();

            // 1. Save Core Product Info (Image/Desc)
            await productsApi.update(editingProduct.id, {
                image_url: values.image_url,
                customer_description: values.customer_description
            });

            // 2. Save Separate Website Config
            if (values.customization_config) {
                await productsApi.saveWebsiteConfig(editingProduct.id, values.customization_config);
            }

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
                width={800} // Increased width
            >
                <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                    <Tabs defaultActiveKey="1" items={[
                        {
                            key: '1',
                            label: 'Thông tin chung',
                            children: (
                                <>
                                    <Form.Item name="image_url" label="URL Hình ảnh">
                                        <Input placeholder="https://... hoặc link Google Drive" />
                                    </Form.Item>
                                    <Form.Item name="customer_description" label="Mô tả cho khách hàng">
                                        <Input.TextArea rows={5} placeholder="Mô tả chi tiết sản phẩm hiển thị trên website..." />
                                    </Form.Item>
                                </>
                            ),
                        },
                        {
                            key: '2',
                            label: 'Tùy chỉnh (Màu sắc/Logo)',
                            children: (
                                <>
                                    <Form.Item name={['customization_config', 'allow_logo']} valuePropName="checked" label="Cho phép In Logo?">
                                        <Switch />
                                    </Form.Item>
                                    <Form.Item
                                        noStyle
                                        shouldUpdate={(prev, curr) => prev.customization_config?.allow_logo !== curr.customization_config?.allow_logo}
                                    >
                                        {({ getFieldValue }) =>
                                            getFieldValue(['customization_config', 'allow_logo']) ? (
                                                <Form.Item name={['customization_config', 'logo_price']} label="Phí in Logo (VNĐ)">
                                                    <InputNumber style={{ width: '100%' }} formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(displayVal) => displayVal?.replace(/\$\s?|(,*)/g, '') as unknown as number} />
                                                </Form.Item>
                                            ) : null
                                        }
                                    </Form.Item>

                                    <Typography.Title level={5}>Màu sắc tùy chọn</Typography.Title>
                                    <Form.List name={['customization_config', 'colors']}>
                                        {(fields, { add, remove }) => (
                                            <>
                                                {fields.map(({ key, name, ...restField }) => (
                                                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                                        <Form.Item
                                                            {...restField}
                                                            name={[name, 'name']}
                                                            rules={[{ required: true, message: 'Nhập tên màu' }]}
                                                        >
                                                            <Input placeholder="Tên màu (Vd: Xanh coban)" />
                                                        </Form.Item>
                                                        <Form.Item
                                                            {...restField}
                                                            name={[name, 'code']}
                                                            rules={[{ required: true, message: 'Nhập mã màu' }]}
                                                        >
                                                            <Input type="color" style={{ width: 50, padding: 0, border: 'none' }} />
                                                        </Form.Item>
                                                        <MinusCircleOutlined onClick={() => remove(name)} />
                                                    </Space>
                                                ))}
                                                <Form.Item>
                                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                                        Thêm màu sắc
                                                    </Button>
                                                </Form.Item>
                                            </>
                                        )}
                                    </Form.List>
                                </>
                            ),
                        },
                        {
                            key: '3',
                            label: 'Phụ kiện đi kèm',
                            children: (
                                <Form.List name={['customization_config', 'accessories']}>
                                    {(fields, { add, remove }) => (
                                        <>
                                            {fields.map(({ key, name, ...restField }) => (
                                                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, 'name']}
                                                        rules={[{ required: true, message: 'Tên phụ kiện' }]}
                                                    >
                                                        <Input placeholder="Tên phụ kiện (Vd: Túi đựng)" />
                                                    </Form.Item>
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, 'price']}
                                                        rules={[{ required: true, message: 'Giá thêm' }]}
                                                    >
                                                        <InputNumber placeholder="Giá thêm" formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(displayVal) => displayVal?.replace(/\$\s?|(,*)/g, '') as unknown as number} />
                                                    </Form.Item>
                                                    <MinusCircleOutlined onClick={() => remove(name)} />
                                                </Space>
                                            ))}
                                            <Form.Item>
                                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                                    Thêm phụ kiện
                                                </Button>
                                            </Form.Item>
                                        </>
                                    )}
                                </Form.List>
                            ),
                        }
                    ]} />
                </Form>
            </Modal>
        </AdminLayout>
    );
}
