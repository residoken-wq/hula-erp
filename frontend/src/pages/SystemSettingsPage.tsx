import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Switch, message, Spin, Row, Col, Divider, Alert } from 'antd';
import { SaveOutlined, MailOutlined, LinkOutlined } from '@ant-design/icons';
import axios from 'axios';
import { API_URL } from '../config';

const SystemSettingsPage: React.FC = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/system/smtp`);
            // Convert 'true'/'false' string to boolean for Switch
            const data = { ...res.data, SMTP_SECURE: res.data.SMTP_SECURE === 'true' };
            form.setFieldsValue(data);
        } catch (error) {
            message.error('Không thể tải cấu hình SMTP');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    const onFinish = async (values: any) => {
        setSubmitting(true);
        try {
            // Convert boolean back to string if needed by backend, though backend treated it as string in my impl
            const payload = { ...values, SMTP_SECURE: String(values.SMTP_SECURE) };
            await axios.post(`${API_URL}/system/smtp`, payload);
            message.success('Đã lưu cấu hình SMTP thành công!');
        } catch (error) {
            message.error('Lỗi khi lưu cấu hình');
        }
        setSubmitting(false);
    };

    return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <Card
                title={<span><MailOutlined /> Cấu Hình Email (SMTP)</span>}
                bordered={false}
                extra={<Button type="primary" icon={<SaveOutlined />} onClick={form.submit} loading={submitting}>Lưu Cấu Hình</Button>}
            >
                <Alert message="Cấu hình này dùng để gửi Email thông báo và Báo giá cho khách hàng." type="info" showIcon style={{ marginBottom: 24 }} />

                {loading ? <div style={{ textAlign: 'center', padding: 50 }}><Spin /></div> : (
                    <Form form={form} layout="vertical" onFinish={onFinish}>
                        <Row gutter={24}>
                            <Col span={16}>
                                <Form.Item name="SMTP_HOST" label="SMTP Host" rules={[{ required: true, message: 'Nhập SMTP Host' }]}>
                                    <Input placeholder="smtp.gmail.com" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="SMTP_PORT" label="Port" rules={[{ required: true, message: 'Nhập Port' }]}>
                                    <Input placeholder="587" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={24}>
                            <Col span={12}>
                                <Form.Item name="SMTP_USER" label="Username / Email" rules={[{ required: true }]}>
                                    <Input placeholder="email@domain.com" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="SMTP_PASS" label="Password / App Password" rules={[{ required: true }]}>
                                    <Input.Password placeholder="Nhập mật khẩu" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Divider />

                        <Row gutter={24}>
                            <Col span={12}>
                                <Form.Item name="SMTP_FROM_NAME" label="Tên người gửi (From Name)" rules={[{ required: true }]}>
                                    <Input placeholder="Hula ERP System" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="SMTP_FROM_EMAIL" label="Email người gửi (From Email)" rules={[{ required: true }]}>
                                    <Input placeholder="no-reply@domain.com" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item name="SMTP_SECURE" valuePropName="checked" label="Sử dụng kết nối an toàn (SSL/TLS)">
                            <Switch />
                        </Form.Item>
                    </Form>
                )}
            </Card>

            <div style={{ marginBottom: 24 }} />

            <div style={{ marginBottom: 24 }} />

            <Card
                title={<span><ShopOutlined /> Thông tin Doanh nghiệp</span>}
                bordered={false}
            >
                <CompanyConfigForm />
            </Card>

            <div style={{ marginBottom: 24 }} />

            <Card
                title={<span><LinkOutlined /> Quản Lý Link Tài Nguyên</span>}
                bordered={false}
            >
                <div style={{ marginBottom: 16 }}>
                    <Alert message="Cấu hình các link tài nguyên dùng chung cho hệ thống (VD: Google Drive ảnh sản phẩm)." type="info" showIcon />
                </div>

                <LinkConfigItem
                    label="Folder Ảnh Sản Phẩm (Google Drive)"
                    configKey="SALES_SHARED_DRIVE_LINK"
                    placeholder="https://drive.google.com/drive/folders/..."
                />
            </Card>
        </div >
    );
};

const LinkConfigItem = ({ label, configKey, placeholder }: { label: string, configKey: string, placeholder: string }) => {
    const [val, setVal] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        axios.get(`${API_URL}/system/config/${configKey}`).then(res => {
            if (res.data && res.data.value) setVal(res.data.value);
        });
    }, [configKey]);

    const handleSave = async () => {
        setLoading(true);
        try {
            await axios.post(`${API_URL}/system/config`, {
                key: configKey,
                value: val,
                description: label
            });
            message.success('Đã lưu');
        } catch (e) { message.error('Lỗi lưu'); }
        setLoading(false);
    }

    return (
        <Form.Item label={label}>
            <div style={{ display: 'flex', gap: 8 }}>
                <Input value={val} onChange={e => setVal(e.target.value)} placeholder={placeholder} />
                <Button type="primary" icon={<SaveOutlined />} loading={loading} onClick={handleSave}>Lưu</Button>
            </div>
        </Form.Item>
    );
}

const CompanyConfigForm = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        axios.get(`${API_URL}/system/company`).then(res => form.setFieldsValue(res.data));
    }, []);

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            await axios.post(`${API_URL}/system/company`, values);
            message.success('Đã lưu thông tin doanh nghiệp');
        } catch (e) { message.error('Lỗi khi lưu'); }
        setLoading(false);
    };

    return (
        <Form form={form} layout="vertical" onFinish={onFinish}>
            <Row gutter={16}>
                <Col span={12}><Form.Item name="COMPANY_NAME" label="Tên Doanh Nghiệp"><Input placeholder="VD: Công ty TNHH ABC" /></Form.Item></Col>
                <Col span={12}><Form.Item name="COMPANY_PHONE" label="Số điện thoại"><Input placeholder="0909xxxxxx" /></Form.Item></Col>
            </Row>
            <Form.Item name="COMPANY_ADDRESS" label="Địa chỉ"><Input.TextArea rows={2} placeholder="Số 123, đường xyz..." /></Form.Item>
            <Row gutter={16}>
                <Col span={12}><Form.Item name="COMPANY_EMAIL" label="Email"><Input /></Form.Item></Col>
                <Col span={12}><Form.Item name="COMPANY_WEBSITE" label="Website"><Input /></Form.Item></Col>
            </Row>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>Lưu Thông Tin</Button>
        </Form>
    );
};

export default SystemSettingsPage;
