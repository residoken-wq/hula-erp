'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, Form, Select, Button, message, Alert } from 'antd';
import { SaveOutlined, EyeOutlined } from '@ant-design/icons';
import { systemApi } from '@/lib/api';

export default function MenuDisplaySettingsPage() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setFetching(true);
        try {
            const res = await systemApi.getConfig('hidden_pages');
            
            let hidden_pages = [];
            try {
                if (res.data && res.data.value) {
                    hidden_pages = JSON.parse(res.data.value);
                }
            } catch (e) {
                console.error("Error parsing hidden_pages", e);
            }

            form.setFieldsValue({
                hidden_pages: hidden_pages,
            });
        } catch (error) {
            console.error('Failed to load menu info:', error);
            message.error('Không thể tải cấu hình Menu & Hiển thị');
        } finally {
            setFetching(false);
        }
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            const payloadStr = JSON.stringify(values.hidden_pages || []);
            await systemApi.setConfig('hidden_pages', payloadStr, 'Website Menu Hidden Pages');
            message.success('Cập nhật Menu & Hiển thị thành công');
        } catch (error) {
            console.error('Save menu error:', error);
            message.error('Lỗi khi lưu cấu hình');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <Card
                title={<><EyeOutlined /> Menu & Hiển thị</>}
                extra={
                    <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={loading}>
                        Lưu cài đặt
                    </Button>
                }
                loading={fetching}
            >
                <Form form={form} layout="vertical">
                    <Alert
                        message="Ẩn trang trên Website"
                        description="Chọn các trang mảng bạn muốn ẨN khỏi thanh menu điều hướng chính trên Desktop và Mobile của Hula Website. Những trang được chọn sẽ không xuất hiện trên Menu chính."
                        type="warning"
                        showIcon
                        style={{ marginBottom: 24 }}
                    />
                    <Form.Item name="hidden_pages" label="Các trang đang bị ẩn khỏi thanh điều hướng chính">
                        <Select
                            mode="multiple"
                            placeholder="Chọn trang để ẩn..."
                            style={{ width: '100%', maxWidth: '600px' }}
                            options={[
                                { label: 'Về Hula (/ve-hula)', value: '/ve-hula' },
                                { label: 'Dự án (/du-an)', value: '/du-an' },
                                { label: 'Đặt hàng B2B (/dat-hang-si)', value: '/dat-hang-si' },
                                { label: 'Hula Shop (/san-pham)', value: '/san-pham' },
                                { label: 'Tin Tức (/tin-tuc)', value: '/tin-tuc' },
                                { label: 'Tuyển Dụng (/tuyen-dung)', value: '/tuyen-dung' },
                                { label: 'Liên Hệ (/lien-he)', value: '/lien-he' },
                            ]}
                        />
                    </Form.Item>
                </Form>
            </Card>
        </AdminLayout>
    );
}
