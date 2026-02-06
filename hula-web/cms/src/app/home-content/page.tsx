'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, Form, Input, Button, Space, message, Tabs, Collapse, Switch, InputNumber, Upload, List, Modal } from 'antd';
import { SaveOutlined, PlusOutlined, DeleteOutlined, DragOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import { systemApi } from '@/lib/api';

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


const getGoogleDriveImageUrl = (url?: string) => {
    if (!url) return '';
    try {
        // Handle common Google Drive formats
        if (url.includes('drive.google.com')) {
            // Case 1: /file/d/VIDEO_ID/view
            const standardMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
            if (standardMatch) {
                return `https://drive.google.com/thumbnail?id=${standardMatch[1]}&sz=w1000`;
            }

            // Case 2: ?id=VIDEO_ID
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
                    <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>Vui lòng kiểm tra lại đường dẫn</p>
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

export default function HomeContentPage() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [features, setFeatures] = useState<Feature[]>([
        { id: '1', icon: '🌿', title: 'Nguyên Liệu Tự Nhiên', description: 'Chất liệu 100% cotton organic, an toàn cho làn da nhạy cảm của bé' },
        { id: '2', icon: '🏆', title: 'Chất Lượng Cao Cấp', description: 'Sản phẩm đạt tiêu chuẩn chất lượng ISO và chứng nhận an toàn' },
        { id: '3', icon: '💯', title: 'Bảo Hành 12 Tháng', description: 'Cam kết đổi mới nếu có lỗi từ nhà sản xuất trong 12 tháng' },
        { id: '4', icon: '🚚', title: 'Giao Hàng Toàn Quốc', description: 'Miễn phí vận chuyển cho đơn hàng từ 2 triệu đồng' },
    ]);
    const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
    const [featureModal, setFeatureModal] = useState(false);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            setLoading(true);
            const res = await systemApi.getHomeConfig();
            if (res.data) {
                const data = { ...res.data };
                // Backward compatibility for single image
                if (!data.hero_images || data.hero_images.length === 0) {
                    if (data.hero_image) {
                        data.hero_images = [data.hero_image];
                    } else {
                        data.hero_images = [];
                    }
                }
                form.setFieldsValue(data);
                if (res.data.features && Array.isArray(res.data.features)) {
                    setFeatures(res.data.features);
                }
            }
        } catch (error) {
            message.error('Không thể tải cấu hình');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            await systemApi.saveHomeConfig({ ...values, features });
            message.success('Đã lưu nội dung trang chủ');
        } catch {
            message.error('Có lỗi xảy ra');
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
                <>
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

                    <Form.List name="hero_images">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map((field, index) => (
                                    <div key={field.key} style={{ marginBottom: 24, padding: 16, background: '#f9f9f9', borderRadius: 8, border: '1px solid #eee' }}>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <Form.Item
                                                {...field}
                                                label={`Hình ảnh Slider ${index + 1}`}
                                                style={{ flex: 1, marginBottom: 0 }}
                                                rules={[{ required: true, message: 'Vui lòng nhập URL hình ảnh' }]}
                                                extra="📐 Kích thước: 1920x800px (tỷ lệ 2.4:1) | Hỗ trợ link Google Drive (quyền chia sẻ công khai)"
                                            >
                                                <Input placeholder="https://drive.google.com/..." />
                                            </Form.Item>
                                            <Button
                                                type="text"
                                                danger
                                                icon={<DeleteOutlined />}
                                                onClick={() => remove(field.name)}
                                                style={{ marginTop: 30 }}
                                            />
                                        </div>

                                        <Form.Item shouldUpdate={(prev, cur) => prev.hero_images?.[index] !== cur.hero_images?.[index]}>
                                            {({ getFieldValue }) => {
                                                const images = getFieldValue('hero_images') || [];
                                                return <ImagePreview url={images[index]} />;
                                            }}
                                        </Form.Item>
                                    </div>
                                ))}

                                {fields.length < 5 && (
                                    <Form.Item>
                                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                            Thêm hình ảnh ({fields.length}/5)
                                        </Button>
                                    </Form.Item>
                                )}
                            </>
                        )}
                    </Form.List>
                </>
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
                <>
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
                </>
            ),
        },
        {
            key: 'products',
            label: '🛍️ Sản Phẩm Nổi Bật',
            children: (
                <>
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
                </>
            ),
        },
        {
            key: 'cta',
            label: '📢 Banner CTA',
            children: (
                <>
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
                </>
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
                <Form form={form} layout="vertical">
                    <Tabs items={items} />
                </Form>
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
