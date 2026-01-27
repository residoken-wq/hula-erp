'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import api from '@/utils/api';
import { Card, Form, Input, Button, Space, message, Tabs, Collapse, Switch, InputNumber, Upload, List, Modal } from 'antd';
import { SaveOutlined, PlusOutlined, DeleteOutlined, DragOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';

interface Feature {
    id: string;
    icon: string;
    title: string;
    description: string;
}

interface FeaturedProduct {
    sku: string;
    name: string;
}

export default function HomeContentPage() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [features, setFeatures] = useState<Feature[]>([]);
    const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
    const [featureModal, setFeatureModal] = useState(false);

    // Initial load
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                // Assuming api utility is configured with base URL
                // If utilizing axios directly, ensure baseURL is correct or use relative path if proxy is set up
                // Creating a local instance if import issues arise, but ideally should import fromutils
                // For now, let's use fetch or axios. Using window.location.origin might be safer if in same domain, 
                // but this is CMS separate form API likely.
                // Re-using the stub for now but targeting the route we just made.
                // checking imports... no api import. 
                // Let's add api import at top of file separately or just use relative path if proxied.
                // Wait, previous file content didn't have api import.
                // I will assume /api proxy exists or I should use full URL.
                // Actually, I'll use the 'api' util I saw earlier in `utils/api.ts` but I need to import it.
                // Since I cannot easy add import with this tool without rewriting whole file or using multi_replace.
                // I'll assume axios is imported (it was in line 6 of original file? NO, line 4 was AdminLayout).
                // Ah, line 10 in original file `import axios from 'axios';` was NOT there.
                // I need to add imports too.

                // WAIT, I should use `multi_replace_file_content` to add imports AND update the body.
                // But for now, let's just write the body and I'll do a separate tool call for import if needed.
                // Actually, I can use `fetch` or `axios` if I import them.
                // The original file DOES NOT import axios. 
                // I will add the import in a separate step or use `multi_replace`.

                // Let's stick to `replace_file_content` for the body and I will add import in next step.
                // Or better, I'll just use `fetch` with full path or relative.
                // But I should use `api` from `@/utils/api`.

                // I will proceed with `api` usage and add import in next step.
            } catch (e) { }
        };
        // fetchConfig();
    }, []);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            // Using absolute path for now to be safe or relative? 
            // The cms `api.ts` uses process.env.NEXT_PUBLIC_API_URL.
            // I'll rely on `api` utility.
            const res = await api.get('/system/home-config');
            const data = res.data;

            form.setFieldsValue(data);
            if (data.features && Array.isArray(data.features)) {
                setFeatures(data.features);
            }
        } catch (error) {
            message.error('Không thể tải cấu hình');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            // Combine form values with features
            const payload = {
                ...values,
                features: features
            };

            await api.post('/system/home-config', payload);
            message.success('Đã lưu nội dung trang chủ');
        } catch (e) {
            message.error('Có lỗi xảy ra khi lưu');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAddFeature = () => {
        setEditingFeature(null);
        setFeatureModal(true);
    };

    const handleEditFeature = (feature: Feature) => {
        setEditingFeature(feature);
        setFeatureModal(true);
    };

    const handleDeleteFeature = (id: string) => {
        setFeatures(features.filter(f => f.id !== id));
        message.success('Đã xóa');
    };

    const handleSaveFeature = (values: any) => {
        if (editingFeature) {
            setFeatures(features.map(f => f.id === editingFeature.id ? { ...f, ...values } : f));
        } else {
            setFeatures([...features, { id: Date.now().toString(), ...values }]);
        }
        setFeatureModal(false);
        message.success(editingFeature ? 'Đã cập nhật' : 'Đã thêm');
    };

    const items = [
        {
            key: 'hero',
            label: '🎯 Hero Section',
            children: (
                <Form form={form} layout="vertical" initialValues={{
                    hero_title_1: 'Giấc Ngủ Ngon',
                    hero_title_2: 'Cho Bé Yêu',
                    hero_description: 'Nệm mầm non HULA - Được thiết kế đặc biệt cho trẻ em với chất liệu cao cấp, đảm bảo sức khỏe và giấc ngủ an lành cho bé yêu của bạn.',
                    hero_button_1: 'Xem Sản Phẩm',
                    hero_button_2: 'Liên Hệ Mua Sỉ',
                    hero_image: '',
                }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <Form.Item name="hero_title_1" label="Tiêu đề dòng 1">
                            <Input placeholder="Giấc Ngủ Ngon" size="large" />
                        </Form.Item>
                        <Form.Item name="hero_title_2" label="Tiêu đề dòng 2 (highlight)">
                            <Input placeholder="Cho Bé Yêu" size="large" />
                        </Form.Item>
                    </div>

                    <Form.Item name="hero_description" label="Mô tả">
                        <Input.TextArea rows={3} placeholder="Mô tả ngắn về sản phẩm..." />
                    </Form.Item>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <Form.Item name="hero_button_1" label="Nút CTA chính">
                            <Input placeholder="Xem Sản Phẩm" />
                        </Form.Item>
                        <Form.Item name="hero_button_2" label="Nút CTA phụ">
                            <Input placeholder="Liên Hệ Mua Sỉ" />
                        </Form.Item>
                    </div>

                    <Form.Item name="hero_image" label="Hình ảnh Hero (URL)">
                        <Input placeholder="https://..." />
                    </Form.Item>
                </Form>
            ),
        },
        {
            key: 'features',
            label: '✨ Tại Sao Chọn HULA',
            children: (
                <div>
                    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#666' }}>Quản lý các điểm nổi bật hiển thị trên trang chủ</span>
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddFeature}>
                            Thêm mới
                        </Button>
                    </div>

                    <List
                        dataSource={features}
                        renderItem={(feature) => (
                            <List.Item
                                style={{
                                    background: '#fff',
                                    marginBottom: 8,
                                    borderRadius: 8,
                                    padding: '12px 16px',
                                    border: '1px solid #f0f0f0',
                                }}
                                actions={[
                                    <Button key="edit" type="text" icon={<EditOutlined />} onClick={() => handleEditFeature(feature)} />,
                                    <Button key="delete" type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteFeature(feature.id)} />,
                                ]}
                            >
                                <List.Item.Meta
                                    avatar={<span style={{ fontSize: 32 }}>{feature.icon}</span>}
                                    title={feature.title}
                                    description={feature.description}
                                />
                            </List.Item>
                        )}
                    />
                </div>
            ),
        },
        {
            key: 'video',
            label: '🎬 Video Giới Thiệu',
            children: (
                <Form layout="vertical" initialValues={{
                    video_enabled: true,
                    video_title: 'Khám Phá HULA',
                    video_subtitle: 'Xem video giới thiệu về sản phẩm nệm mầm non HULA',
                    video_youtube_url: '',
                }}>
                    <Form.Item name="video_enabled" label="Hiển thị video section" valuePropName="checked">
                        <Switch />
                    </Form.Item>

                    <Form.Item name="video_title" label="Tiêu đề section">
                        <Input placeholder="Khám Phá HULA" />
                    </Form.Item>

                    <Form.Item name="video_subtitle" label="Tiêu đề phụ">
                        <Input placeholder="Xem video giới thiệu về sản phẩm..." />
                    </Form.Item>

                    <Form.Item
                        name="video_youtube_url"
                        label="YouTube Video URL"
                        extra="Nhập link video YouTube. Ví dụ: https://www.youtube.com/watch?v=abc123"
                        rules={[
                            {
                                pattern: /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+/,
                                message: 'Vui lòng nhập đúng định dạng link YouTube'
                            }
                        ]}
                    >
                        <Input
                            placeholder="https://www.youtube.com/watch?v=VIDEO_ID"
                            size="large"
                            prefix={<span style={{ color: '#ff0000' }}>▶</span>}
                        />
                    </Form.Item>

                    <div style={{ background: '#f0f5ff', padding: 16, borderRadius: 8 }}>
                        <p style={{ margin: 0, color: '#1890ff', fontSize: 13 }}>
                            💡 <strong>Hướng dẫn:</strong> Sao chép URL video từ YouTube và dán vào ô trên.<br />
                            Video sẽ hiển thị responsive (16:9) trên trang chủ bên dưới section "Tại Sao Chọn HULA".
                        </p>
                    </div>
                </Form>
            ),
        },
        {
            key: 'products',
            label: '🛍️ Sản Phẩm Nổi Bật',
            children: (
                <Form layout="vertical" initialValues={{
                    products_title: 'Sản Phẩm Nổi Bật',
                    products_subtitle: 'Những sản phẩm được yêu thích nhất',
                    products_limit: 4,
                }}>
                    <Form.Item name="products_title" label="Tiêu đề section">
                        <Input placeholder="Sản Phẩm Nổi Bật" />
                    </Form.Item>

                    <Form.Item name="products_subtitle" label="Tiêu đề phụ">
                        <Input placeholder="Những sản phẩm được yêu thích nhất" />
                    </Form.Item>

                    <Form.Item name="products_limit" label="Số sản phẩm hiển thị">
                        <InputNumber min={2} max={8} style={{ width: 120 }} />
                    </Form.Item>

                    <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
                        <p style={{ margin: 0, color: '#666', fontSize: 13 }}>
                            💡 Sản phẩm được lấy tự động từ ERP (sắp xếp theo mới nhất).
                            Để chỉ định sản phẩm cụ thể, vui lòng cấu hình trường "featured" trong ERP.
                        </p>
                    </div>
                </Form>
            ),
        },
        {
            key: 'cta',
            label: '📢 Banner CTA',
            children: (
                <Form layout="vertical" initialValues={{
                    cta_title: 'Bạn là đại lý hoặc trường mầm non?',
                    cta_description: 'Liên hệ ngay để nhận báo giá sỉ ưu đãi và chính sách hỗ trợ đặc biệt dành cho đối tác',
                    cta_button: 'Đăng Ký Mua Sỉ Ngay',
                    cta_enabled: true,
                }}>
                    <Form.Item name="cta_enabled" label="Hiển thị banner" valuePropName="checked">
                        <Switch />
                    </Form.Item>

                    <Form.Item name="cta_title" label="Tiêu đề">
                        <Input placeholder="Bạn là đại lý hoặc trường mầm non?" />
                    </Form.Item>

                    <Form.Item name="cta_description" label="Mô tả">
                        <Input.TextArea rows={2} placeholder="Mô tả ngắn..." />
                    </Form.Item>

                    <Form.Item name="cta_button" label="Nội dung nút">
                        <Input placeholder="Đăng Ký Mua Sỉ Ngay" />
                    </Form.Item>
                </Form>
            ),
        },
    ];

    return (
        <AdminLayout>
            <Card
                title="Quản lý nội dung Trang Chủ"
                extra={
                    <Space>
                        <Button icon={<EyeOutlined />} onClick={() => window.open('https://nemmamnon.com', '_blank')}>
                            Xem trang
                        </Button>
                        <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={loading}>
                            Lưu thay đổi
                        </Button>
                    </Space>
                }
            >
                <Tabs items={items} />
            </Card>

            {/* Feature Edit Modal */}
            <Modal
                title={editingFeature ? 'Sửa điểm nổi bật' : 'Thêm điểm nổi bật'}
                open={featureModal}
                onCancel={() => setFeatureModal(false)}
                footer={null}
            >
                <Form
                    layout="vertical"
                    initialValues={editingFeature || { icon: '⭐', title: '', description: '' }}
                    onFinish={handleSaveFeature}
                    style={{ marginTop: 16 }}
                >
                    <Form.Item name="icon" label="Icon (emoji)" rules={[{ required: true }]}>
                        <Input placeholder="🌿" maxLength={4} style={{ width: 100, fontSize: 24, textAlign: 'center' }} />
                    </Form.Item>

                    <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}>
                        <Input placeholder="Nguyên Liệu Tự Nhiên" />
                    </Form.Item>

                    <Form.Item name="description" label="Mô tả" rules={[{ required: true }]}>
                        <Input.TextArea rows={2} placeholder="Chất liệu 100% cotton organic..." />
                    </Form.Item>

                    <Button type="primary" htmlType="submit" block>
                        {editingFeature ? 'Cập nhật' : 'Thêm'}
                    </Button>
                </Form>
            </Modal>
        </AdminLayout>
    );
}
