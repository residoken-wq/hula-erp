'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, Form, Input, Button, Space, message, Tabs, Collapse, Switch, InputNumber, List, Modal } from 'antd';
import { SaveOutlined, PlusOutlined, DeleteOutlined, DragOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import { systemApi } from '@/lib/api';
import ImageUploader from '@/components/ImageUploader';

interface Feature {
    id: string;
    icon: string;
    title: string;
    description: string;
}

interface UspItem {
    id: string;
    icon: string;
    text: string;
}

interface Guarantee {
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
    const [features, setFeatures] = useState<Feature[]>([
        { id: '1', icon: '🌿', title: 'Kinh nghiệm 10 năm', description: 'Hơn một thập kỷ đồng hành cùng các hệ thống giáo dục' },
        { id: '2', icon: '🏆', title: 'Không ngừng cải tiến', description: 'Đội ngũ chuyên gia tận tâm liên tục nghiên cứu và phát triển' },
        { id: '3', icon: '🎨', title: 'Đậm dấu ấn thương hiệu', description: 'Tư vấn và thiết kế sản phẩm "may đo" theo đúng màu sắc nhận diện' },
        { id: '4', icon: '💯', title: 'Chất lượng vượt trội', description: 'Làm chủ 100% quy trình sản xuất' },
    ]);
    const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
    const [featureModal, setFeatureModal] = useState(false);

    const [uspItems, setUspItems] = useState<UspItem[]>([
        { id: '1', icon: '✨', text: 'Free tư vấn' },
        { id: '2', icon: '🎨', text: 'Free thiết kế' },
        { id: '3', icon: '🚚', text: 'Giao hàng toàn quốc' },
    ]);

    const [guarantees, setGuarantees] = useState<Guarantee[]>([
        { id: '1', icon: '🏭', title: 'Từ nhà máy đến người tiêu dùng', description: '' },
        { id: '2', icon: '🔄', title: 'Bảo hành 1 đổi 1', description: 'nếu lỗi sản xuất' },
        { id: '3', icon: '🚚', title: 'Giao hàng toàn quốc', description: 'Freeship từ 1.000.000đ' },
    ]);

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
                // New: why_choose_reasons maps to features
                if (res.data.why_choose_reasons && Array.isArray(res.data.why_choose_reasons)) {
                    setFeatures(res.data.why_choose_reasons);
                }
                if (res.data.usp_items && Array.isArray(res.data.usp_items)) {
                    setUspItems(res.data.usp_items);
                }
                if (res.data.why_choose_guarantees && Array.isArray(res.data.why_choose_guarantees)) {
                    setGuarantees(res.data.why_choose_guarantees);
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
            await systemApi.saveHomeConfig({
                ...values,
                features,
                why_choose_reasons: features,
                usp_items: uspItems,
                why_choose_guarantees: guarantees,
            });
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
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                            <strong>Slider {index + 1}</strong>
                                            <Button
                                                type="text"
                                                danger
                                                icon={<DeleteOutlined />}
                                                onClick={() => remove(field.name)}
                                            />
                                        </div>
                                        <Form.Item
                                            {...field}
                                            style={{ marginBottom: 0 }}
                                            rules={[{ required: true, message: 'Vui lòng chọn hình ảnh' }]}
                                        >
                                            <ImageUploader hint="📐 Kích thước: 1920x800px (2.4:1)" />
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
            key: 'usp',
            label: '🔖 USP Bar Icons',
            children: (
                <div>
                    <div style={{ marginBottom: 16 }}>
                        <span style={{ color: '#666' }}>Quản lý các icon trên thanh USP (dưới Hero banner)</span>
                    </div>
                    {uspItems.map((item, index) => (
                        <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12, padding: 12, background: '#f9f9f9', borderRadius: 8 }}>
                            <Input
                                value={item.icon}
                                onChange={(e) => setUspItems(uspItems.map((u, i) => i === index ? { ...u, icon: e.target.value } : u))}
                                style={{ width: 60, textAlign: 'center', fontSize: 20 }}
                                maxLength={4}
                                placeholder="⭐"
                            />
                            <Input
                                value={item.text}
                                onChange={(e) => setUspItems(uspItems.map((u, i) => i === index ? { ...u, text: e.target.value } : u))}
                                placeholder="Free tư vấn"
                                style={{ flex: 1 }}
                            />
                            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => setUspItems(uspItems.filter((_, i) => i !== index))} />
                        </div>
                    ))}
                    {uspItems.length < 5 && (
                        <Button
                            type="dashed"
                            block
                            icon={<PlusOutlined />}
                            onClick={() => setUspItems([...uspItems, { id: Date.now().toString(), icon: '⭐', text: '' }])}
                        >
                            Thêm USP ({uspItems.length}/5)
                        </Button>
                    )}
                </div>
            ),
        },
        {
            key: 'guarantees',
            label: '🛡️ Cam Kết Đảm Bảo',
            children: (
                <div>
                    <div style={{ marginBottom: 16 }}>
                        <span style={{ color: '#666' }}>Quản lý các cam kết hiển thị trong mục &quot;Mua hàng đảm bảo cùng HULA&quot;</span>
                    </div>
                    {guarantees.map((item, index) => (
                        <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12, padding: 12, background: '#f9f9f9', borderRadius: 8 }}>
                            <Input
                                value={item.icon}
                                onChange={(e) => setGuarantees(guarantees.map((g, i) => i === index ? { ...g, icon: e.target.value } : g))}
                                style={{ width: 60, textAlign: 'center', fontSize: 20 }}
                                maxLength={4}
                                placeholder="🏭"
                            />
                            <Input
                                value={item.title}
                                onChange={(e) => setGuarantees(guarantees.map((g, i) => i === index ? { ...g, title: e.target.value } : g))}
                                placeholder="Tiêu đề"
                                style={{ flex: 1 }}
                            />
                            <Input
                                value={item.description}
                                onChange={(e) => setGuarantees(guarantees.map((g, i) => i === index ? { ...g, description: e.target.value } : g))}
                                placeholder="Mô tả thêm (tùy chọn)"
                                style={{ flex: 1 }}
                            />
                            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => setGuarantees(guarantees.filter((_, i) => i !== index))} />
                        </div>
                    ))}
                    {guarantees.length < 6 && (
                        <Button
                            type="dashed"
                            block
                            icon={<PlusOutlined />}
                            onClick={() => setGuarantees([...guarantees, { id: Date.now().toString(), icon: '⭐', title: '', description: '' }])}
                        >
                            Thêm cam kết ({guarantees.length}/6)
                        </Button>
                    )}
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
        {
            key: 'topbar',
            label: '📌 Topbar',
            children: (
                <>
                    <Form.Item name="topbar_enabled" label="Hiển thị Topbar" valuePropName="checked">
                        <Switch />
                    </Form.Item>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <Form.Item name="topbar_left_text" label="Text bên trái (ngang logo)" extra="Hiển thị cố định, width bằng logo">
                            <Input placeholder="📞 Hotline: 0909 123 456" />
                        </Form.Item>

                        <Form.Item name="topbar_right_text" label="Text chạy (marquee)" extra="Hiệu ứng chạy từ trái qua phải">
                            <Input placeholder="🎉 Miễn phí vận chuyển cho đơn từ 2 triệu đồng" />
                        </Form.Item>
                    </div>

                    <Form.Item name="topbar_right_url" label="URL liên kết (cho text chạy)" extra="Khi click vào text chạy sẽ mở trang này">
                        <Input placeholder="/san-pham hoặc https://..." />
                    </Form.Item>

                    <Form.Item name="topbar_speed" label="Tốc độ chạy chữ (giây/vòng)" extra="Số nhỏ = nhanh hơn. Mặc định: 20">
                        <InputNumber min={5} max={60} style={{ width: 120 }} placeholder="20" />
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
