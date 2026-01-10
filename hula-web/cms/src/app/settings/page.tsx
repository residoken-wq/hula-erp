'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, Form, Input, Button, Space, message, Divider, Switch, Tabs, Radio, Alert, Spin } from 'antd';
import { SaveOutlined, GlobalOutlined, ToolOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { systemApi } from '@/lib/api';

export default function SettingsPage() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [siteMode, setSiteMode] = useState('live');
    const [modeLoading, setModeLoading] = useState(true);
    const [modeSaving, setModeSaving] = useState(false);

    // Load settings from backend on mount
    useEffect(() => {
        const loadSettings = async () => {
            try {
                // Load site mode
                const modeRes = await systemApi.getConfig('SITE_MODE');
                if (modeRes.data && modeRes.data.value) {
                    setSiteMode(modeRes.data.value);
                }

                // Load general settings
                const configKeys = ['site_name', 'site_description', 'logo_url', 'contact_phone', 'contact_email', 'contact_address'];
                const configValues: Record<string, string> = {};

                for (const key of configKeys) {
                    try {
                        const res = await systemApi.getConfig(key);
                        if (res.data && res.data.value) {
                            configValues[key] = res.data.value;
                        }
                    } catch (e) {
                        // Key doesn't exist yet, use default
                    }
                }

                if (Object.keys(configValues).length > 0) {
                    form.setFieldsValue(configValues);
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
            } finally {
                setModeLoading(false);
            }
        };
        loadSettings();
    }, [form]);

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            // Save each config field to backend
            const configKeys = ['site_name', 'site_description', 'logo_url', 'contact_phone', 'contact_email', 'contact_address'];

            for (const key of configKeys) {
                if (values[key] !== undefined) {
                    await systemApi.setConfig(key, values[key] || '', `Website ${key}`);
                }
            }

            message.success('Đã lưu cài đặt thành công!');
        } catch (error) {
            console.error('Failed to save settings:', error);
            message.error('Có lỗi xảy ra khi lưu cài đặt');
        } finally {
            setLoading(false);
        }
    };

    const handleModeChange = async (mode: string) => {
        setModeSaving(true);
        try {
            await systemApi.setConfig('SITE_MODE', mode, 'Website display mode: live, coming-soon, or maintenance');
            setSiteMode(mode);
            message.success(`Đã chuyển sang chế độ: ${mode === 'live' ? 'Website hoạt động' : mode === 'coming-soon' ? 'Coming Soon' : 'Bảo trì'}`);
        } catch (error) {
            console.error('Failed to save site mode:', error);
            message.error('Không thể lưu chế độ website. Vui lòng thử lại.');
        } finally {
            setModeSaving(false);
        }
    };

    const items = [
        {
            key: 'site-mode',
            label: '🌐 Chế độ Website',
            children: (
                <div>
                    <Alert
                        message="Điều khiển trạng thái website"
                        description="Chọn chế độ hiển thị cho khách truy cập. Khi chọn Coming Soon hoặc Bảo trì, khách sẽ thấy trang thông báo thay vì nội dung website."
                        type="info"
                        showIcon
                        style={{ marginBottom: 24 }}
                    />

                    {modeLoading ? (
                        <div style={{ textAlign: 'center', padding: 40 }}>
                            <Spin tip="Đang tải cấu hình..." />
                        </div>
                    ) : (
                        <Radio.Group
                            value={siteMode}
                            onChange={(e) => handleModeChange(e.target.value)}
                            style={{ width: '100%' }}
                            disabled={modeSaving}
                        >
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <label
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        width: '100%',
                                        padding: '16px 20px',
                                        borderRadius: 8,
                                        marginBottom: 8,
                                        cursor: modeSaving ? 'not-allowed' : 'pointer',
                                        border: siteMode === 'live' ? '2px solid #16a34a' : '1px solid #d9d9d9',
                                        background: siteMode === 'live' ? '#f0fdf4' : '#fff',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    <Radio value="live" style={{ marginRight: 12 }} />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                                        <div style={{
                                            width: 40,
                                            height: 40,
                                            background: siteMode === 'live' ? '#dcfce7' : '#f5f5f5',
                                            borderRadius: 8,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <GlobalOutlined style={{ fontSize: 20, color: '#16a34a' }} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>Website Hoạt Động</div>
                                            <div style={{ fontSize: 12, color: '#666' }}>Hiển thị đầy đủ nội dung website cho khách hàng</div>
                                        </div>
                                    </div>
                                </label>

                                <label
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        width: '100%',
                                        padding: '16px 20px',
                                        borderRadius: 8,
                                        marginBottom: 8,
                                        cursor: modeSaving ? 'not-allowed' : 'pointer',
                                        border: siteMode === 'coming-soon' ? '2px solid #2563eb' : '1px solid #d9d9d9',
                                        background: siteMode === 'coming-soon' ? '#eff6ff' : '#fff',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    <Radio value="coming-soon" style={{ marginRight: 12 }} />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                                        <div style={{
                                            width: 40,
                                            height: 40,
                                            background: siteMode === 'coming-soon' ? '#dbeafe' : '#f5f5f5',
                                            borderRadius: 8,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <ClockCircleOutlined style={{ fontSize: 20, color: '#2563eb' }} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>Coming Soon</div>
                                            <div style={{ fontSize: 12, color: '#666' }}>Hiển thị trang countdown + đăng ký email</div>
                                        </div>
                                    </div>
                                </label>

                                <label
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        width: '100%',
                                        padding: '16px 20px',
                                        borderRadius: 8,
                                        cursor: modeSaving ? 'not-allowed' : 'pointer',
                                        border: siteMode === 'maintenance' ? '2px solid #d97706' : '1px solid #d9d9d9',
                                        background: siteMode === 'maintenance' ? '#fffbeb' : '#fff',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    <Radio value="maintenance" style={{ marginRight: 12 }} />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                                        <div style={{
                                            width: 40,
                                            height: 40,
                                            background: siteMode === 'maintenance' ? '#fef3c7' : '#f5f5f5',
                                            borderRadius: 8,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <ToolOutlined style={{ fontSize: 20, color: '#d97706' }} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>Bảo Trì</div>
                                            <div style={{ fontSize: 12, color: '#666' }}>Hiển thị trang bảo trì với progress bar</div>
                                        </div>
                                    </div>
                                </label>
                            </Space>
                        </Radio.Group>
                    )}

                    <Divider />

                    <div style={{ background: '#f9fafb', padding: 16, borderRadius: 8 }}>
                        <p style={{ margin: 0, fontSize: 13, color: '#666' }}>
                            <strong>💡 Lưu ý:</strong> Thay đổi chế độ sẽ được lưu vào hệ thống. Website sẽ tự động chuyển hướng khách truy cập đến trang tương ứng (cache 5 phút).
                            Xem trang preview:
                        </p>
                        <Space style={{ marginTop: 8 }}>
                            <Button size="small" onClick={() => window.open('https://nemmamnon.com/coming-soon', '_blank')}>
                                Xem Coming Soon
                            </Button>
                            <Button size="small" onClick={() => window.open('https://nemmamnon.com/maintenance', '_blank')}>
                                Xem Bảo Trì
                            </Button>
                        </Space>
                    </div>
                </div>
            ),
        },
        {
            key: 'general',
            label: 'Thông tin chung',
            children: (
                <Form form={form} layout="vertical" initialValues={{
                    site_name: 'Nệm Mầm Non HULA',
                    site_description: 'Nệm mầm non chất lượng cao, an toàn cho bé',
                    logo_url: '',
                    contact_phone: '0123 456 789',
                    contact_email: 'info@nemmamnon.com',
                    contact_address: '123 Đường ABC, Quận XYZ, TP.HCM',
                }}>
                    <Form.Item name="site_name" label="Tên website">
                        <Input placeholder="Tên website" />
                    </Form.Item>

                    <Form.Item name="logo_url" label="Logo URL" extra="Logo sẽ tự động scale để vừa với frame header">
                        <Input placeholder="https://... hoặc link Google Drive" />
                    </Form.Item>

                    <Form.Item name="site_description" label="Mô tả website">
                        <Input.TextArea rows={3} placeholder="Mô tả ngắn về website..." />
                    </Form.Item>

                    <Divider>Thông tin liên hệ</Divider>

                    <Form.Item name="contact_phone" label="Số điện thoại">
                        <Input placeholder="0123 456 789" />
                    </Form.Item>

                    <Form.Item name="contact_email" label="Email">
                        <Input placeholder="info@example.com" />
                    </Form.Item>

                    <Form.Item name="contact_address" label="Địa chỉ">
                        <Input.TextArea rows={2} placeholder="Địa chỉ công ty..." />
                    </Form.Item>
                </Form>
            ),
        },
        {
            key: 'social',
            label: 'Mạng xã hội',
            children: (
                <Form layout="vertical" initialValues={{
                    facebook: 'https://facebook.com/nemmamnon',
                    instagram: '',
                    tiktok: '',
                    youtube: '',
                }}>
                    <Form.Item name="facebook" label="Facebook">
                        <Input placeholder="https://facebook.com/..." />
                    </Form.Item>

                    <Form.Item name="instagram" label="Instagram">
                        <Input placeholder="https://instagram.com/..." />
                    </Form.Item>

                    <Form.Item name="tiktok" label="TikTok">
                        <Input placeholder="https://tiktok.com/@..." />
                    </Form.Item>

                    <Form.Item name="youtube" label="YouTube">
                        <Input placeholder="https://youtube.com/..." />
                    </Form.Item>
                </Form>
            ),
        },
        {
            key: 'seo',
            label: 'SEO',
            children: (
                <Form layout="vertical" initialValues={{
                    meta_title: 'Nệm Mầm Non HULA - Giấc Ngủ Ngon Cho Bé Yêu',
                    meta_description: 'Nệm mầm non HULA chất lượng cao, an toàn cho sức khỏe bé. Nguyên liệu tự nhiên, thiết kế chống khuẩn, bảo hành 12 tháng.',
                    meta_keywords: 'nệm mầm non, nệm trẻ em, HULA, nệm cao cấp',
                }}>
                    <Form.Item name="meta_title" label="Meta Title">
                        <Input placeholder="Tiêu đề SEO mặc định" />
                    </Form.Item>

                    <Form.Item name="meta_description" label="Meta Description">
                        <Input.TextArea rows={3} placeholder="Mô tả SEO mặc định..." />
                    </Form.Item>

                    <Form.Item name="meta_keywords" label="Meta Keywords">
                        <Input placeholder="keyword1, keyword2, ..." />
                    </Form.Item>

                    <Form.Item name="google_analytics" label="Google Analytics ID">
                        <Input placeholder="G-XXXXXXXXXX" />
                    </Form.Item>
                </Form>
            ),
        },
        {
            key: 'notification',
            label: 'Thông báo',
            children: (
                <Form layout="vertical">
                    <Form.Item name="email_new_lead" label="Email khi có Lead mới" valuePropName="checked">
                        <Switch defaultChecked />
                    </Form.Item>

                    <Form.Item name="email_new_order" label="Email khi có Đơn hàng mới" valuePropName="checked">
                        <Switch defaultChecked />
                    </Form.Item>

                    <Form.Item name="notification_email" label="Email nhận thông báo">
                        <Input placeholder="admin@example.com" />
                    </Form.Item>
                </Form>
            ),
        },
    ];

    return (
        <AdminLayout>
            <Card
                title="Cài đặt"
                extra={
                    <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={loading}>
                        Lưu cài đặt
                    </Button>
                }
            >
                <Tabs items={items} />
            </Card>
        </AdminLayout>
    );
}
