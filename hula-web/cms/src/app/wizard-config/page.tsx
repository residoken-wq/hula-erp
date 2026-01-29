'use client';

import { useState, useEffect } from 'react';
import { Card, Tabs, Table, Button, Modal, Form, Input, InputNumber, message, Space, Tag, Switch, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, DragOutlined, SaveOutlined } from '@ant-design/icons';
import { productsApi, wizardApi } from '@/lib/api';

interface WizardProduct {
    product_id: number;
    sku: string;
    name: string;
    price: number;
    image_url?: string;
    description?: string;
    icon?: string;
}

interface WizardService {
    id: string;
    name: string;
    price: number;
    note?: string;
    icon?: string;
}

interface WizardConfig {
    main: WizardProduct[];
    accessory: WizardProduct[];
    service: WizardService[];
}

interface Product {
    id: number;
    sku: string;
    name: string;
    website_price: number;
    base_price: number;
    image_url?: string;
    show_on_website: boolean;
}

export default function WizardConfigPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState<WizardConfig>({ main: [], accessory: [], service: [] });
    const [products, setProducts] = useState<Product[]>([]);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [addType, setAddType] = useState<'main' | 'accessory'>('main');
    const [serviceModalVisible, setServiceModalVisible] = useState(false);
    const [editingService, setEditingService] = useState<WizardService | null>(null);
    const [form] = Form.useForm();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [configRes, productsRes] = await Promise.all([
                wizardApi.getConfig(),
                productsApi.getAll()
            ]);
            setConfig(configRes.data || { main: [], accessory: [], service: [] });
            setProducts(productsRes.data || []);
        } catch (error) {
            message.error('Không thể tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await wizardApi.saveConfig(config);
            message.success('Đã lưu cấu hình wizard');
        } catch (error) {
            message.error('Không thể lưu cấu hình');
        } finally {
            setSaving(false);
        }
    };

    const openAddModal = (type: 'main' | 'accessory') => {
        setAddType(type);
        setAddModalVisible(true);
    };

    const handleAddProduct = (product: Product) => {
        const existingIds = config[addType].map((p: WizardProduct) => p.product_id);
        if (existingIds.includes(product.id)) {
            message.warning('Sản phẩm đã có trong danh sách');
            return;
        }

        const newProduct: WizardProduct = {
            product_id: product.id,
            sku: product.sku,
            name: product.name,
            price: product.website_price || product.base_price,
            image_url: product.image_url,
        };

        setConfig({
            ...config,
            [addType]: [...config[addType], newProduct]
        });
        setAddModalVisible(false);
        message.success('Đã thêm sản phẩm');
    };

    const handleRemoveProduct = (type: 'main' | 'accessory', productId: number) => {
        setConfig({
            ...config,
            [type]: config[type].filter((p: WizardProduct) => p.product_id !== productId)
        });
    };

    const handleEditPrice = (type: 'main' | 'accessory', productId: number, newPrice: number) => {
        setConfig({
            ...config,
            [type]: config[type].map((p: WizardProduct) =>
                p.product_id === productId ? { ...p, price: newPrice } : p
            )
        });
    };

    const handleEditDescription = (type: 'main' | 'accessory', productId: number, description: string) => {
        setConfig({
            ...config,
            [type]: config[type].map((p: WizardProduct) =>
                p.product_id === productId ? { ...p, description } : p
            )
        });
    };

    const openServiceModal = (service?: WizardService) => {
        setEditingService(service || null);
        if (service) {
            form.setFieldsValue(service);
        } else {
            form.resetFields();
        }
        setServiceModalVisible(true);
    };

    const handleSaveService = async () => {
        try {
            const values = await form.validateFields();
            if (editingService) {
                setConfig({
                    ...config,
                    service: config.service.map((s: WizardService) =>
                        s.id === editingService.id ? { ...s, ...values } : s
                    )
                });
            } else {
                const newService: WizardService = {
                    id: `SVC-${Date.now()}`,
                    ...values
                };
                setConfig({
                    ...config,
                    service: [...config.service, newService]
                });
            }
            setServiceModalVisible(false);
            form.resetFields();
        } catch (error) {
            // Form validation failed
        }
    };

    const handleRemoveService = (serviceId: string) => {
        setConfig({
            ...config,
            service: config.service.filter((s: WizardService) => s.id !== serviceId)
        });
    };

    const productColumns = (type: 'main' | 'accessory') => [
        {
            title: 'SKU',
            dataIndex: 'sku',
            width: 120,
        },
        {
            title: 'Tên sản phẩm',
            dataIndex: 'name',
            ellipsis: true,
        },
        {
            title: 'Giá (VNĐ)',
            dataIndex: 'price',
            width: 150,
            render: (price: number, record: WizardProduct) => (
                <InputNumber
                    value={price}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => Number(value?.replace(/\$\s?|(,*)/g, '') || 0)}
                    onChange={(val) => handleEditPrice(type, record.product_id, val || 0)}
                    style={{ width: '100%' }}
                />
            )
        },
        {
            title: 'Mô tả ngắn',
            dataIndex: 'description',
            width: 200,
            render: (desc: string, record: WizardProduct) => (
                <Input
                    value={desc}
                    placeholder="Mô tả cho wizard..."
                    onChange={(e) => handleEditDescription(type, record.product_id, e.target.value)}
                />
            )
        },
        {
            title: '',
            width: 60,
            render: (_: any, record: WizardProduct) => (
                <Popconfirm
                    title="Xóa sản phẩm này?"
                    onConfirm={() => handleRemoveProduct(type, record.product_id)}
                >
                    <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
            )
        }
    ];

    const serviceColumns = [
        {
            title: 'Tên dịch vụ',
            dataIndex: 'name',
        },
        {
            title: 'Giá tham khảo (VNĐ)',
            dataIndex: 'price',
            width: 150,
            render: (price: number) => price?.toLocaleString('vi-VN'),
        },
        {
            title: 'Ghi chú',
            dataIndex: 'note',
            ellipsis: true,
        },
        {
            title: '',
            width: 100,
            render: (_: any, record: WizardService) => (
                <Space>
                    <Button type="text" icon={<EditOutlined />} onClick={() => openServiceModal(record)} />
                    <Popconfirm
                        title="Xóa dịch vụ này?"
                        onConfirm={() => handleRemoveService(record.id)}
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    const availableProducts = products.filter(p => {
        const inMain = config.main.some((wp: WizardProduct) => wp.product_id === p.id);
        const inAccessory = config.accessory.some((wp: WizardProduct) => wp.product_id === p.id);
        return !inMain && !inAccessory;
    });

    const tabItems = [
        {
            key: 'main',
            label: `🛏️ Sản phẩm chính (${config.main.length})`,
            children: (
                <div>
                    <div style={{ marginBottom: 16 }}>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => openAddModal('main')}
                        >
                            Thêm sản phẩm chính
                        </Button>
                        <span style={{ marginLeft: 16, color: '#666' }}>
                            Nệm, gối, chăn - sản phẩm khách hàng chọn đầu tiên
                        </span>
                    </div>
                    <Table
                        dataSource={config.main}
                        columns={productColumns('main')}
                        rowKey="product_id"
                        pagination={false}
                        size="small"
                    />
                </div>
            )
        },
        {
            key: 'accessory',
            label: `👜 Phụ kiện (${config.accessory.length})`,
            children: (
                <div>
                    <div style={{ marginBottom: 16 }}>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => openAddModal('accessory')}
                        >
                            Thêm phụ kiện
                        </Button>
                        <span style={{ marginLeft: 16, color: '#666' }}>
                            Túi, balo, tạp dề, áo bib - sản phẩm bổ sung
                        </span>
                    </div>
                    <Table
                        dataSource={config.accessory}
                        columns={productColumns('accessory')}
                        rowKey="product_id"
                        pagination={false}
                        size="small"
                    />
                </div>
            )
        },
        {
            key: 'service',
            label: `🎨 Dịch vụ thương hiệu (${config.service.length})`,
            children: (
                <div>
                    <div style={{ marginBottom: 16 }}>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => openServiceModal()}
                        >
                            Thêm dịch vụ
                        </Button>
                        <span style={{ marginLeft: 16, color: '#666' }}>
                            Thêu logo, in túi, in balo - dịch vụ cá nhân hóa
                        </span>
                    </div>
                    <Table
                        dataSource={config.service}
                        columns={serviceColumns}
                        rowKey="id"
                        pagination={false}
                        size="small"
                    />
                </div>
            )
        }
    ];

    return (
        <div style={{ padding: 24 }}>
            <Card
                title={
                    <Space>
                        <span style={{ fontSize: 20 }}>🧙‍♂️</span>
                        <span>Cấu hình Wizard Đặt Hàng Sỉ</span>
                    </Space>
                }
                extra={
                    <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        loading={saving}
                        onClick={handleSave}
                    >
                        Lưu cấu hình
                    </Button>
                }
                loading={loading}
            >
                <Tabs items={tabItems} />
            </Card>

            {/* Modal thêm sản phẩm */}
            <Modal
                title={`Thêm ${addType === 'main' ? 'sản phẩm chính' : 'phụ kiện'}`}
                open={addModalVisible}
                onCancel={() => setAddModalVisible(false)}
                footer={null}
                width={700}
            >
                <Table
                    dataSource={availableProducts}
                    rowKey="id"
                    size="small"
                    pagination={{ pageSize: 10 }}
                    columns={[
                        { title: 'SKU', dataIndex: 'sku', width: 100 },
                        { title: 'Tên', dataIndex: 'name', ellipsis: true },
                        {
                            title: 'Giá',
                            dataIndex: 'website_price',
                            width: 120,
                            render: (price: number, record: Product) =>
                                (price || record.base_price)?.toLocaleString('vi-VN') + 'đ'
                        },
                        {
                            title: '',
                            width: 80,
                            render: (_: any, record: Product) => (
                                <Button
                                    type="primary"
                                    size="small"
                                    onClick={() => handleAddProduct(record)}
                                >
                                    Thêm
                                </Button>
                            )
                        }
                    ]}
                />
            </Modal>

            {/* Modal thêm/sửa dịch vụ */}
            <Modal
                title={editingService ? 'Sửa dịch vụ' : 'Thêm dịch vụ mới'}
                open={serviceModalVisible}
                onCancel={() => setServiceModalVisible(false)}
                onOk={handleSaveService}
                okText="Lưu"
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="name"
                        label="Tên dịch vụ"
                        rules={[{ required: true, message: 'Vui lòng nhập tên dịch vụ' }]}
                    >
                        <Input placeholder="VD: Thêu logo chăn" />
                    </Form.Item>
                    <Form.Item
                        name="price"
                        label="Giá tham khảo (VNĐ)"
                        rules={[{ required: true, message: 'Vui lòng nhập giá' }]}
                    >
                        <InputNumber
                            style={{ width: '100%' }}
                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => Number(value?.replace(/\$\s?|(,*)/g, '') || 0)}
                            placeholder="15000"
                        />
                    </Form.Item>
                    <Form.Item
                        name="note"
                        label="Ghi chú"
                    >
                        <Input placeholder="VD: Giá/cái, tối thiểu 50 cái" />
                    </Form.Item>
                    <Form.Item
                        name="icon"
                        label="Icon (emoji)"
                    >
                        <Input placeholder="VD: 🪡" maxLength={4} style={{ width: 80 }} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
