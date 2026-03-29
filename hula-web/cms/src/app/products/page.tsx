'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, Table, Button, Space, Tag, Input, Image, message, Modal, Form, InputNumber, Tabs, Switch, Typography, Segmented, Select } from 'antd';
import { SearchOutlined, EditOutlined, SyncOutlined, EyeOutlined, PlusOutlined, MinusCircleOutlined, EyeInvisibleOutlined, AppstoreOutlined, DeleteOutlined } from '@ant-design/icons';

import { productsApi, systemApi } from '@/lib/api';
import { ProductVisualEditor } from './ProductVisualEditor';
import ImageUploader from '@/components/ImageUploader';

// Helper to convert Google Drive URLs to thumbnail URLs
const getGoogleDriveImageUrl = (url?: string) => {
    if (!url) return '';
    try {
        if (url.includes('drive.google.com')) {
            // Case 1: /file/d/FILE_ID/view
            const standardMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
            if (standardMatch) {
                return `https://drive.google.com/thumbnail?id=${standardMatch[1]}&sz=w1000`;
            }
            // Case 2: ?id=FILE_ID
            const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
            if (idMatch) {
                return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w1000`;
            }
        }
        return url;
    } catch {
        return url || '';
    }
};

// Image Preview Component with Google Drive support
const ImagePreview = ({ url }: { url?: string }) => {
    const [hasError, setHasError] = useState(false);
    const imageUrl = getGoogleDriveImageUrl(url);

    useEffect(() => {
        setHasError(false);
    }, [imageUrl]);

    if (!imageUrl) return null;

    return (
        <div style={{ marginTop: 10, border: '1px dashed #d9d9d9', padding: 8, borderRadius: 8, textAlign: 'center' }}>
            <p style={{ marginBottom: 8, color: '#888', fontSize: 12 }}>Xem trước hình ảnh:</p>
            {hasError ? (
                <div style={{ padding: 20, color: '#ff4d4f', background: '#fff1f0', borderRadius: 4 }}>
                    <p style={{ margin: 0 }}>⚠️ Không thể tải hình ảnh</p>
                    <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>Vui lòng kiểm tra lại đường dẫn hoặc quyền chia sẻ</p>
                </div>
            ) : (
                <img
                    src={imageUrl}
                    alt="Preview"
                    style={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 4 }}
                    onError={() => setHasError(true)}
                />
            )}
        </div>
    );
};

interface Product {
    id: number;
    sku: string;
    name: string;
    category: string;
    base_price: number;
    cost_price: number;
    quantity_in_stock: number;
    is_active: boolean;
    show_on_website: boolean;
    website_price?: number;
    website_display_name?: string;
    image_url: string;
    customer_description: string;
    customization_config?: {
        allow_logo?: boolean;
        logo_price?: number;
        logo_position?: { x: number; y: number; width: number; height: number };
        base_image?: string;
        mattress_back_image?: string;
        pillow_image?: string;
        pillow_back_image?: string;
        dimensions?: {
            mattress?: { width: number; height: number };
            pillow?: { width: number; height: number };
            logo?: { width: number; height: number };
        };
        colors?: Array<{ name: string; code: string; image_url?: string; pillow_image_url?: string }>;
        accessories?: Array<{ name: string; price: number; image_url?: string }>;
    };
    tags?: string[];
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [tagsConfig, setTagsConfig] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [showFilter, setShowFilter] = useState<'all' | 'visible' | 'hidden'>('all');
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [editModal, setEditModal] = useState(false);
    const [form] = Form.useForm();
    const loadProducts = async () => {
        setLoading(true);
        try {
            const res = await productsApi.getAll();
            const data = res.data;
            setProducts(Array.isArray(data) ? data : []);

            try {
                const configRes = await systemApi.getConfig('product_tags_config');
                if (configRes.data && configRes.data.value) {
                    let parsed = configRes.data.value;
                    if (typeof parsed === 'string') parsed = JSON.parse(parsed);
                    setTagsConfig(Array.isArray(parsed) ? parsed : []);
                }
            } catch (e) {
                console.error("Failed to load tags config", e);
            }
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
            const config = res.data?.customization_config || { colors: [], accessories: [], allow_logo: false, gallery_images: [] };

            let parsedImg = product.image_url;
            if (typeof parsedImg === 'string' && parsedImg.startsWith('{')) {
                try { parsedImg = JSON.parse(parsedImg).url || parsedImg; } catch { }
            }

            form.setFieldsValue({
                website_display_name: product.website_display_name || '',
                image_url: parsedImg,
                customer_description: product.customer_description,
                tags: product.tags || [],
                customization_config: config
            });
            setEditModal(true);
        } catch (error) {
            console.error('Failed to load website config', error);
            let parsedImg = product.image_url;
            if (typeof parsedImg === 'string' && parsedImg.startsWith('{')) {
                try { parsedImg = JSON.parse(parsedImg).url || parsedImg; } catch { }
            }

            form.setFieldsValue({
                website_display_name: product.website_display_name || '',
                image_url: parsedImg,
                customer_description: product.customer_description,
                tags: product.tags || [],
                customization_config: { colors: [], accessories: [], allow_logo: false, gallery_images: [] }
            });
            setEditModal(true);
        }
    };

    const handleSave = async () => {
        if (!editingProduct) return;
        try {
            const values = await form.validateFields();

            // 1. Save Core Product Info (Image/Desc/Tags)
            await productsApi.update(editingProduct.id, {
                website_display_name: values.website_display_name || null,
                image_url: values.image_url,
                customer_description: values.customer_description,
                tags: values.tags || []
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

    const handleToggleShow = async (record: Product, checked: boolean) => {
        try {
            await productsApi.update(record.id, { show_on_website: checked });
            message.success(checked ? 'Đã hiển thị sản phẩm' : 'Đã ẩn sản phẩm');
            // Optimistic update
            setProducts(products.map(p => p.id === record.id ? { ...p, show_on_website: checked } : p));
        } catch (error) {
            message.error('Không thể cập nhật trạng thái');
            loadProducts();
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    // Filter products based on visibility filter
    const filteredProducts = products.filter(p => {
        if (showFilter === 'visible') return p.show_on_website;
        if (showFilter === 'hidden') return !p.show_on_website;
        return true;
    });

    const columns = [
        {
            title: 'Hình ảnh',
            dataIndex: 'image_url',
            key: 'image_url',
            width: 80,
            render: (url: string) => {
                let parsedUrl = url;
                if (typeof url === 'string' && url.startsWith('{')) {
                    try { parsedUrl = JSON.parse(url).url || url; } catch { }
                }
                const imageUrl = getGoogleDriveImageUrl(parsedUrl);
                return imageUrl ? (
                    <Image src={imageUrl} width={50} height={50} style={{ objectFit: 'cover', borderRadius: 4 }} fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" />
                ) : (
                    <div style={{ width: 50, height: 50, background: '#f5f5f5', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>
                );
            },
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
            render: (_: any, record: Product) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <strong style={{ color: '#1890ff' }}>
                        {formatPrice(record.website_price || record.base_price)}
                    </strong>
                    {record.website_price && record.website_price !== record.base_price && (
                        <span style={{ fontSize: 11, color: '#999', textDecoration: 'line-through' }}>
                            {formatPrice(record.base_price)}
                        </span>
                    )}
                </div>
            ),
        },
        {
            title: 'Tags',
            dataIndex: 'tags',
            key: 'tags',
            width: 180,
            render: (tags: string[]) => (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {tags && tags.length > 0 ? tags.map(tag => (
                        <Tag key={tag} color="blue" bordered={false}>{tag}</Tag>
                    )) : <span style={{ color: '#ccc' }}>-</span>}
                </div>
            )
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
            render: (show: boolean, record: Product) => (
                <Switch
                    checked={show}
                    onChange={(checked) => handleToggleShow(record, checked)}
                    checkedChildren="Hiện"
                    unCheckedChildren="Ẩn"
                />
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
                        <Segmented
                            value={showFilter}
                            onChange={(val) => setShowFilter(val as 'all' | 'visible' | 'hidden')}
                            options={[
                                { label: 'Tất cả', value: 'all', icon: <AppstoreOutlined /> },
                                { label: 'Hiển', value: 'visible', icon: <EyeOutlined /> },
                                { label: 'Ẩn', value: 'hidden', icon: <EyeInvisibleOutlined /> },
                            ]}
                        />
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
                    dataSource={filteredProducts}
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
                width="max-content"
            >
                <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                    <Tabs defaultActiveKey="1" items={[
                        {
                            key: '1',
                            label: 'Thông tin chung',
                            children: (
                                <>
                                    <Form.Item name="website_display_name" label="Tên sản phẩm hiển thị trên website" extra="Để trống nếu muốn sử dụng tên sản phẩm gốc từ ERP">
                                        <Input placeholder={editingProduct?.name || 'Nhập tên hiển thị riêng cho website...'} allowClear />
                                    </Form.Item>
                                    <Form.Item name="image_url" label="Hình ảnh chính của sản phẩm (Bắt buộc)">
                                        <ImageUploader simple hint="📐 Kích thước: 800x800px (tỷ lệ 1:1, vuông)" />
                                    </Form.Item>
                                    
                                    <div style={{ marginBottom: 16, padding: 16, background: '#fafafa', border: '1px solid #eee', borderRadius: 8 }}>
                                        <p style={{ fontWeight: 500, margin: '0 0 12px 0' }}>📂 Hình ảnh phụ (Tối đa 10 hình ảnh bổ sung)</p>
                                        <Form.List name={['customization_config', 'gallery_images']}>
                                            {(fields, { add, remove }) => (
                                                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                                    {fields.map(({ key, name, ...restField }) => (
                                                        <div key={key} style={{ width: 140, position: 'relative' }}>
                                                            <Form.Item {...restField} name={[name]} style={{ marginBottom: 0 }}>
                                                                <ImageUploader simple hint="800x800px" />
                                                            </Form.Item>
                                                            <Button 
                                                                danger 
                                                                size="small" 
                                                                icon={<DeleteOutlined />} 
                                                                onClick={() => remove(name)}
                                                                style={{ position: 'absolute', top: -8, right: -8, zIndex: 10, borderRadius: '50%' }}
                                                            />
                                                        </div>
                                                    ))}
                                                    {fields.length < 10 && (
                                                        <div style={{ width: 140, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Button type="dashed" onClick={() => add()} style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                                <PlusOutlined style={{ fontSize: 20, marginBottom: 8 }} />
                                                                Thêm ảnh phụ
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </Form.List>
                                    </div>
                                    
                                    <Form.Item name="customer_description" label="Mô tả cho khách hàng">
                                        <Input.TextArea rows={5} placeholder="Mô tả chi tiết sản phẩm hiển thị trên website..." />
                                    </Form.Item>

                                    {tagsConfig && tagsConfig.length > 0 && (
                                        <div style={{ marginBottom: 16, padding: 16, background: '#fafafa', border: '1px solid #eee', borderRadius: 8 }}>
                                            <p style={{ fontWeight: 500, margin: '0 0 12px 0' }}>🏷️ Phân loại Tags</p>
                                            <Form.Item name="tags" noStyle>
                                                <Select
                                                    mode="multiple"
                                                    style={{ width: '100%' }}
                                                    placeholder="Chọn tags cho sản phẩm"
                                                    options={tagsConfig.flatMap(group => 
                                                        (group.tags || []).map((tag: string) => ({
                                                            label: `${group.group} - ${tag}`,
                                                            value: `${group.group}:${tag}`
                                                        }))
                                                    )}
                                                />
                                            </Form.Item>
                                        </div>
                                    )}
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
                        },
                        {
                            key: '4',
                            label: 'Cấu hình Hình ảnh (Visual)',
                            children: (
                                <Form.Item name="customization_config" noStyle>
                                    <ProductVisualEditor />
                                </Form.Item>
                            ),
                        }
                    ]} />
                </Form>
            </Modal>
        </AdminLayout>
    );
}
