'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Modal, Form, Input, InputNumber, message, Space, Popconfirm, Collapse, Table, Tabs, Select, Upload } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, SaveOutlined, UploadOutlined, SettingOutlined, DollarOutlined } from '@ant-design/icons';
import { wizardApi } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { WizardConfigData, WizardCategoryL1, WizardCategoryL2, WizardCustomizationStep, WizardPriceTier } from '@/types/wizard';
import SubcategoryConfigModal from './components/SubcategoryConfigModal';

export default function WizardConfigPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState<WizardConfigData>({ hero_title: '', categories: [] });
    const [form] = Form.useForm();
    
    // Modal states
    const [l1ModalVisible, setL1ModalVisible] = useState(false);
    const [editingL1, setEditingL1] = useState<WizardCategoryL1 | null>(null);

    const [l2ModalVisible, setL2ModalVisible] = useState(false);
    const [editingL2, setEditingL2] = useState<{ l1Id: string; l2: WizardCategoryL2 | null } | null>(null);

    const [configModalVisible, setConfigModalVisible] = useState(false);
    const [activeConfigL2, setActiveConfigL2] = useState<{ l1Id: string; l2: WizardCategoryL2 } | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await wizardApi.getConfig();
            const data = res.data || { hero_title: 'Tự Thiết Kế Bộ Sản Phẩm Mầm Non Cao Cấp', categories: [] };
            // Ensure data structures
            if (!data.categories) data.categories = [];
            setConfig(data);
        } catch (error) {
            message.error('Không thể tải cấu hình');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveConfig = async () => {
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

    // --- L1 Management ---
    const handleSaveL1 = (values: any) => {
        let newCategories = [...config.categories];
        if (editingL1) {
            newCategories = newCategories.map(c => c.id === editingL1.id ? { ...c, ...values } : c);
        } else {
            newCategories.push({
                id: `L1-${Date.now()}`,
                ...values,
                subcategories: []
            });
        }
        setConfig({ ...config, categories: newCategories });
        setL1ModalVisible(false);
    };

    const handleDeleteL1 = (id: string) => {
        setConfig({ ...config, categories: config.categories.filter(c => c.id !== id) });
    };

    // --- L2 Management ---
    const handleSaveL2 = (values: any) => {
        if (!editingL2) return;
        const newCategories = config.categories.map(c => {
            if (c.id === editingL2.l1Id) {
                let newSubs = [...c.subcategories];
                if (editingL2.l2) {
                    newSubs = newSubs.map(sub => sub.id === editingL2.l2!.id ? { ...sub, ...values } : sub);
                } else {
                    newSubs.push({
                        id: `L2-${Date.now()}`,
                        ...values,
                        customization_steps: [],
                        price_tiers: []
                    });
                }
                return { ...c, subcategories: newSubs };
            }
            return c;
        });
        setConfig({ ...config, categories: newCategories });
        setL2ModalVisible(false);
    };

    const handleDeleteL2 = (l1Id: string, l2Id: string) => {
        const newCategories = config.categories.map(c => {
            if (c.id === l1Id) {
                return { ...c, subcategories: c.subcategories.filter(sub => sub.id !== l2Id) };
            }
            return c;
        });
        setConfig({ ...config, categories: newCategories });
    };

    const handleSaveConfigL2 = (updatedL2: WizardCategoryL2) => {
        if (!activeConfigL2) return;
        const newCategories = config.categories.map(c => {
            if (c.id === activeConfigL2.l1Id) {
                return {
                    ...c,
                    subcategories: c.subcategories.map(sub => sub.id === updatedL2.id ? updatedL2 : sub)
                };
            }
            return c;
        });
        setConfig({ ...config, categories: newCategories });
        setConfigModalVisible(false);
    };

    return (
        <AdminLayout>
            <div style={{ padding: 24 }}>
                <Card
                    title={
                        <Space>
                            <span style={{ fontSize: 20 }}>🧙‍♂️</span>
                            <span>Cấu hình Tùy Biến Sản Phẩm B2B (Visual Wizard v2)</span>
                        </Space>
                    }
                    extra={
                        <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSaveConfig}>
                            Lưu cấu hình
                        </Button>
                    }
                    loading={loading}
                >
                    <div style={{ marginBottom: 24 }}>
                        <Form layout="vertical">
                            <Form.Item label="Tiêu đề trang (Hero Title)">
                                <Input 
                                    value={config.hero_title} 
                                    onChange={e => setConfig({ ...config, hero_title: e.target.value })} 
                                />
                            </Form.Item>
                        </Form>
                    </div>

                    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>Danh Mục Sản Phẩm (L1)</h3>
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingL1(null); form.resetFields(); setL1ModalVisible(true); }}>
                            Thêm Danh Mục
                        </Button>
                    </div>

                    <Collapse>
                        {config.categories.map(l1 => (
                            <Collapse.Panel
                                key={l1.id}
                                header={
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Space>
                                            {l1.icon_url && <img src={l1.icon_url} width={24} height={24} style={{ objectFit: 'contain' }} />}
                                            <strong>{l1.name}</strong>
                                        </Space>
                                        <div onClick={e => e.stopPropagation()}>
                                            <Space>
                                                <Button size="small" type="text" icon={<EditOutlined />} onClick={() => { setEditingL1(l1); form.setFieldsValue(l1); setL1ModalVisible(true); }} />
                                                <Popconfirm title="Xóa danh mục này?" onConfirm={() => handleDeleteL1(l1.id)}>
                                                    <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                                                </Popconfirm>
                                            </Space>
                                        </div>
                                    </div>
                                }
                            >
                                <div style={{ marginBottom: 16 }}>
                                    <Button 
                                        size="small" 
                                        icon={<PlusOutlined />} 
                                        onClick={() => { setEditingL2({ l1Id: l1.id, l2: null }); form.resetFields(); setL2ModalVisible(true); }}
                                    >
                                        Thêm Sản Phẩm (L2)
                                    </Button>
                                </div>
                                <Table
                                    size="small"
                                    dataSource={l1.subcategories}
                                    rowKey="id"
                                    pagination={false}
                                    columns={[
                                        { title: 'Tên Sản Phẩm', dataIndex: 'name' },
                                        { title: 'Ảnh Base', dataIndex: 'base_image', render: (val) => val ? <img src={val} height={30} /> : 'Trống' },
                                        { title: 'Số lượng Step', render: (_, r) => r.customization_steps?.length || 0 },
                                        { title: 'Số mốc giá', render: (_, r) => r.price_tiers?.length || 0 },
                                        {
                                            title: 'Thao tác',
                                            width: 250,
                                            render: (_, r) => (
                                                <Space>
                                                    <Button size="small" icon={<SettingOutlined />} onClick={() => { setActiveConfigL2({ l1Id: l1.id, l2: r }); setConfigModalVisible(true); }}>
                                                        Cấu hình Tùy biến
                                                    </Button>
                                                    <Button size="small" type="text" icon={<EditOutlined />} onClick={() => { setEditingL2({ l1Id: l1.id, l2: r }); form.setFieldsValue(r); setL2ModalVisible(true); }} />
                                                    <Popconfirm title="Xóa sản phẩm này?" onConfirm={() => handleDeleteL2(l1.id, r.id)}>
                                                        <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                                                    </Popconfirm>
                                                </Space>
                                            )
                                        }
                                    ]}
                                />
                            </Collapse.Panel>
                        ))}
                    </Collapse>
                </Card>

                {/* Modal L1 */}
                <Modal
                    title={editingL1 ? 'Sửa Danh Mục' : 'Thêm Danh Mục Mới'}
                    open={l1ModalVisible}
                    onCancel={() => setL1ModalVisible(false)}
                    onOk={() => form.submit()}
                >
                    <Form form={form} layout="vertical" onFinish={handleSaveL1}>
                        <Form.Item name="name" label="Tên Danh Mục" rules={[{ required: true }]}>
                            <Input placeholder="VD: Bộ Nệm & Phụ Kiện Giấc Ngủ" />
                        </Form.Item>
                        <Form.Item name="icon_url" label="Icon URL">
                            <Input placeholder="URL ảnh icon nhỏ" />
                        </Form.Item>
                        <Form.Item name="image_url" label="Thumbnail URL">
                            <Input placeholder="URL ảnh hiển thị lớn" />
                        </Form.Item>
                        <Form.Item name="sort_order" label="Thứ tự">
                            <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                    </Form>
                </Modal>

                {/* Modal L2 */}
                <Modal
                    title={editingL2?.l2 ? 'Sửa Sản Phẩm L2' : 'Thêm Sản Phẩm L2'}
                    open={l2ModalVisible}
                    onCancel={() => setL2ModalVisible(false)}
                    onOk={() => form.submit()}
                >
                    <Form form={form} layout="vertical" onFinish={handleSaveL2}>
                        <Form.Item name="name" label="Tên Sản Phẩm" rules={[{ required: true }]}>
                            <Input placeholder="VD: Bộ Túi Ngủ" />
                        </Form.Item>
                        <Form.Item name="base_image" label="Base Image URL" extra="Ảnh nền gốc cho Visualization, nền trắng/trong suốt.">
                            <Input placeholder="URL ảnh gốc" />
                        </Form.Item>
                        <Form.Item name="sort_order" label="Thứ tự">
                            <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                    </Form>
                </Modal>

                {/* Fullscreen Modal for Customization Steps & Pricing */}
                {configModalVisible && activeConfigL2 && (
                    <SubcategoryConfigModal
                        visible={configModalVisible}
                        onClose={() => setConfigModalVisible(false)}
                        onSave={handleSaveConfigL2}
                        data={activeConfigL2.l2}
                    />
                )}
            </div>
        </AdminLayout>
    );
}
