'use client';

import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, Form, Input, Button, Space, message, Divider, Switch, Tabs } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

export default function SettingsPage() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            // TODO: Save to backend/localStorage
            console.log('Settings:', values);
            message.success('Đã lưu cài đặt');
        } catch {
            message.error('Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    const items = [
        {
            key: 'general',
            label: 'Thông tin chung',
            children: (
                <Form form={form} layout="vertical" initialValues={{
                    site_name: 'Nệm Mầm Non HULA',
                    site_description: 'Nệm mầm non chất lượng cao, an toàn cho bé',
                    contact_phone: '0123 456 789',
                    contact_email: 'info@nemmamnon.com',
                    contact_address: '123 Đường ABC, Quận XYZ, TP.HCM',
                }}>
                    <Form.Item name="site_name" label="Tên website">
                        <Input placeholder="Tên website" />
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
