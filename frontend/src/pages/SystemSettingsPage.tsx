import React, { useEffect, useState } from 'react';
import { Card, Form, Input, InputNumber, Button, Switch, message, Spin, Row, Col, Divider, Alert, Tabs, Table, Modal, Popconfirm, Tooltip, Tag, Space } from 'antd';
import { SaveOutlined, MailOutlined, LinkOutlined, ShopOutlined, FileTextOutlined, PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined, SettingOutlined, MinusCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import { API_URL } from '../config';
import dayjs from 'dayjs';
import RichTextEditor from '../components/common/RichTextEditor';

const SystemSettingsPage: React.FC = () => {
    return (
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <Card bordered={false} bodyStyle={{ padding: 0 }}>
                <Tabs defaultActiveKey="1" tabPosition="left" style={{ minHeight: 600 }}>
                    <Tabs.TabPane tab={<span><MailOutlined /> Cấu hình Email & Chung</span>} key="1">
                        <div style={{ padding: 24 }}>
                            <GeneralSettingsTab />
                        </div>
                    </Tabs.TabPane>
                    <Tabs.TabPane tab={<span><FileTextOutlined /> Mẫu Hợp Đồng</span>} key="2">
                        <div style={{ padding: 24 }}>
                            <ContractTemplatesTab />
                        </div>
                    </Tabs.TabPane>
                </Tabs>
            </Card>
        </div>
    );
};

const GeneralSettingsTab: React.FC = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/system/smtp`);
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
            const payload = { ...values, SMTP_SECURE: String(values.SMTP_SECURE) };
            await axios.post(`${API_URL}/system/smtp`, payload);
            message.success('Đã lưu cấu hình SMTP thành công!');
        } catch (error) {
            message.error('Lỗi khi lưu cấu hình');
        }
        setSubmitting(false);
    };

    return (
        <>
            <Card title="Cấu Hình Email (SMTP)" bordered={false} size="small">
                <Alert message="Cấu hình này dùng để gửi Email thông báo và Báo giá cho khách hàng." type="info" showIcon style={{ marginBottom: 24 }} />
                {loading ? <Spin /> : (
                    <Form form={form} layout="vertical" onFinish={onFinish}>
                        <Row gutter={24}>
                            <Col span={16}><Form.Item name="SMTP_HOST" label="SMTP Host" rules={[{ required: true }]}><Input placeholder="smtp.gmail.com" /></Form.Item></Col>
                            <Col span={8}><Form.Item name="SMTP_PORT" label="Port" rules={[{ required: true }]}><Input placeholder="587" /></Form.Item></Col>
                        </Row>
                        <Row gutter={24}>
                            <Col span={12}><Form.Item name="SMTP_USER" label="Username / Email" rules={[{ required: true }]}><Input placeholder="email@domain.com" /></Form.Item></Col>
                            <Col span={12}><Form.Item name="SMTP_PASS" label="Password"><Input.Password placeholder="Nhập mật khẩu" /></Form.Item></Col>
                        </Row>
                        <Row gutter={24}>
                            <Col span={12}><Form.Item name="SMTP_FROM_NAME" label="Tên người gửi" rules={[{ required: true }]}><Input placeholder="Hula ERP System" /></Form.Item></Col>
                            <Col span={12}><Form.Item name="SMTP_FROM_EMAIL" label="Email người gửi" rules={[{ required: true }]}><Input placeholder="no-reply@domain.com" /></Form.Item></Col>
                        </Row>
                        <Form.Item name="SMTP_SECURE" valuePropName="checked" label="Sử dụng SSL/TLS"><Switch /></Form.Item>
                        <Button type="primary" icon={<SaveOutlined />} onClick={form.submit} loading={submitting}>Lưu Cấu Hình Email</Button>
                    </Form>
                )}
            </Card>

            <Divider />

            <Card title="Thông tin Doanh nghiệp" bordered={false} size="small">
                <CompanyConfigForm />
            </Card>

            <Divider />

            <Card title="Quản Lý Link Tài Nguyên" bordered={false} size="small">
                <LinkConfigItem label="Folder Ảnh Sản Phẩm (Google Drive)" configKey="SALES_SHARED_DRIVE_LINK" placeholder="https://drive.google.com/..." />
            </Card>

            <Divider />

            <Card title="Cấu Hình Dòng Tiền" bordered={false} size="small">
                <NumberConfigItem label="Ngưỡng cảnh báo quỹ thấp (VNĐ)" configKey="CASH_FLOW_THRESHOLD" defaultValue={50000000} />
            </Card>
        </>
    );
};

const ContractTemplatesTab: React.FC = () => {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<any>(null);
    const [form] = Form.useForm();

    // Placeholders Management
    const [customPlaceholders, setCustomPlaceholders] = useState<{key: string, desc: string}[]>([]);
    const [placeholderModalOpen, setPlaceholderModalOpen] = useState(false);
    const [placeholderForm] = Form.useForm();

    const fetchPlaceholders = async () => {
        try {
            const res = await axios.get(`${API_URL}/system/config/CONTRACT_CUSTOM_PLACEHOLDERS`);
            if (res.data && res.data.value) {
                const parsed = JSON.parse(res.data.value);
                setCustomPlaceholders(parsed);
                placeholderForm.setFieldsValue({ placeholders: parsed });
            }
        } catch (e) { }
    };

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/system/templates`);
            setTemplates(res.data);
        } catch (e) { message.error('Lỗi tải danh sách mẫu'); }
        setLoading(false);
    };

    useEffect(() => { 
        fetchTemplates(); 
        fetchPlaceholders();
    }, []);

    const handleSavePlaceholders = async (values: any) => {
        try {
            await axios.post(`${API_URL}/system/config`, {
                key: 'CONTRACT_CUSTOM_PLACEHOLDERS',
                value: JSON.stringify(values.placeholders || []),
                description: 'Danh sách Placeholder Hợp đồng tự tạo'
            });
            message.success('Đã lưu danh sách Placeholder');
            setPlaceholderModalOpen(false);
            fetchPlaceholders();
        } catch (e) {
            message.error('Lỗi khi lưu Placeholder');
        }
    };

    const handleSave = async (values: any) => {
        try {
            await axios.post(`${API_URL}/system/templates`, { ...values, id: editingTemplate?.id });
            message.success('Đã lưu mẫu hợp đồng');
            setModalOpen(false);
            fetchTemplates();
        } catch (e) { message.error('Lỗi lưu mẫu'); }
    };

    const handleDelete = async (id: number) => {
        try {
            await axios.delete(`${API_URL}/system/templates/${id}`);
            message.success('Đã xóa mẫu');
            fetchTemplates();
        } catch (e) { message.error('Lỗi xóa mẫu'); }
    };

    const columns = [
        { title: 'Tên Mẫu', dataIndex: 'name', key: 'name', width: '30%', render: (t: string) => <b>{t}</b> },
        { title: 'Cập nhật lần cuối', dataIndex: 'updated_at', key: 'updated_at', render: (t: string) => dayjs(t).format('DD/MM/YYYY HH:mm') },
        {
            title: 'Hành động', key: 'action', width: 150, render: (_: any, r: any) => (
                <div style={{ display: 'flex', gap: 8 }}>
                    <Button icon={<EditOutlined />} size="small" onClick={() => { setEditingTemplate(r); form.setFieldsValue(r); setModalOpen(true); }} />
                    <Popconfirm title="Xóa mẫu này?" onConfirm={() => handleDelete(r.id)}>
                        <Button icon={<DeleteOutlined />} danger size="small" />
                    </Popconfirm>
                </div>
            )
        }
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3>Danh Sách Mẫu Hợp Đồng</h3>
                <Space>
                    <Button icon={<SettingOutlined />} onClick={() => setPlaceholderModalOpen(true)}>Cấu Hình Nhãn (Placeholders)</Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingTemplate(null); form.resetFields(); setModalOpen(true); }}>Tạo Mẫu Mới</Button>
                </Space>
            </div>

            <Alert
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
                message="Hướng dẫn sử dụng Nhãn (Placeholder)"
                description={
                    <div style={{ marginTop: 8 }}>
                        <p style={{ marginBottom: 8, fontSize: 13, color: '#666' }}>Click vào các nhãn dưới đây để copy, sau đó <strong>DÁN</strong> vào trình soạn thảo bằng <code>Ctrl + V</code>.</p>
                        <Space size={[8, 8]} wrap>
                            {/* Default Placeholders */}
                            {[
                                { key: 'customer_name', desc: 'Tên Khách hàng' },
                                { key: 'customer_address', desc: 'Địa chỉ Khách hàng' },
                                { key: 'customer_tax_code', desc: 'Mã số thuế Khách hàng' },
                                { key: 'order_code', desc: 'Mã Đơn hàng / Hợp đồng' },
                                { key: 'order_date', desc: 'Ngày tạo đơn' },
                                { key: 'total_amount_text', desc: 'Tổng tiền bằng chữ' },
                                { key: 'items_table', desc: 'Bảng chi tiết mặt hàng' }
                            ].map(p => (
                                <Tooltip title={`Mặc định: ${p.desc}`} key={p.key}>
                                    <Tag color="blue" style={{ cursor: 'pointer', padding: '4px 8px', fontSize: 13 }} onClick={() => {
                                        navigator.clipboard.writeText(`{{${p.key}}}`);
                                        message.success(`Đã copy: {{${p.key}}}`);
                                    }}>
                                        <Space size={4}>
                                            <CopyOutlined style={{ opacity: 0.6 }} />
                                            {`{{${p.key}}}`}
                                        </Space>
                                    </Tag>
                                </Tooltip>
                            ))}
                            {/* Custom Placeholders */}
                            {customPlaceholders.map(p => (
                                <Tooltip title={`Tự định nghĩa: ${p.desc}`} key={p.key}>
                                    <Tag color="green" style={{ cursor: 'pointer', padding: '4px 8px', fontSize: 13 }} onClick={() => {
                                        navigator.clipboard.writeText(`{{${p.key}}}`);
                                        message.success(`Đã copy: {{${p.key}}}`);
                                    }}>
                                        <Space size={4}>
                                            <CopyOutlined style={{ opacity: 0.6 }} />
                                            {`{{${p.key}}}`}
                                        </Space>
                                    </Tag>
                                </Tooltip>
                            ))}
                        </Space>
                    </div>
                }
            />

            <Table dataSource={templates} columns={columns} rowKey="id" loading={loading} pagination={false} />

            <Modal
                title={editingTemplate ? "Chỉnh Sửa Mẫu Hợp Đồng" : "Tạo Mẫu Mới"}
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                onOk={form.submit}
                width={1200}
                style={{ top: 20 }}
                maskClosable={false}
            >
                <Row gutter={24}>
                    <Col span={17}>
                        <Form form={form} layout="vertical" onFinish={handleSave}>
                            <Form.Item name="name" label={<span style={{fontWeight: 600}}>Tên mẫu hợp đồng</span>} rules={[{ required: true, message: 'Nhập tên mẫu' }]}>
                                <Input placeholder="VD: Hợp đồng nguyên tắc 2024" size="large" />
                            </Form.Item>
                            <Form.Item name="content" label={<span style={{fontWeight: 600}}>Nội dung hợp đồng (HTML/Text)</span>} rules={[{ required: true }]}>
                                <RichTextEditor minHeight={500} />
                            </Form.Item>
                        </Form>
                    </Col>
                    <Col span={7}>
                        <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, height: '100%' }}>
                            <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 15 }}>Danh Sách Placeholder</div>
                            <p style={{ fontSize: 13, color: '#666', marginBottom: 16, lineHeight: 1.4 }}>
                                Click để copy biến và DÁN (<code>Ctrl+V</code>) vào vị trí cần thiết. Các biến này sẽ được hệ thống dữ liệu tự động thay thế khi in hợp đồng.
                            </p>
                            <div style={{ maxHeight: 600, overflowY: 'auto', paddingRight: 4 }}>
                                <Space size={[8, 12]} wrap direction="vertical" style={{ width: '100%' }}>
                                    {/* Default Placeholders */}
                                    {[
                                        { key: 'customer_name', desc: 'Tên Khách hàng' },
                                        { key: 'customer_address', desc: 'Địa chỉ Khách hàng' },
                                        { key: 'customer_tax_code', desc: 'Mã số thuế Khách hàng' },
                                        { key: 'order_code', desc: 'Mã Đơn hàng / Hợp đồng' },
                                        { key: 'order_date', desc: 'Ngày tạo đơn' },
                                        { key: 'total_amount_text', desc: 'Tổng tiền bằng chữ' },
                                        { key: 'items_table', desc: 'Bảng chi tiết mặt hàng' }
                                    ].map(p => (
                                        <div key={p.key} style={{ display: 'flex', flexDirection: 'column' }}>
                                            <Tag color="blue" style={{ cursor: 'pointer', padding: '6px 12px', fontSize: 13, width: 'fit-content' }} onClick={() => {
                                                navigator.clipboard.writeText(`{{${p.key}}}`);
                                                message.success(`Đã copy: {{${p.key}}}`);
                                            }}>
                                                <Space size={4}>
                                                    <CopyOutlined style={{ opacity: 0.6 }} />
                                                    {`{{${p.key}}}`}
                                                </Space>
                                            </Tag>
                                            <span style={{ fontSize: 12, color: '#888', marginTop: 4, marginLeft: 4 }}>{p.desc}</span>
                                        </div>
                                    ))}
                                    {customPlaceholders.length > 0 && <Divider style={{ margin: '12px 0' }} orientation="left" plain><span style={{fontSize: 12, color: '#aaa'}}>Tự định nghĩa</span></Divider>}
                                    {customPlaceholders.map(p => (
                                        <div key={p.key} style={{ display: 'flex', flexDirection: 'column' }}>
                                            <Tag color="green" style={{ cursor: 'pointer', padding: '6px 12px', fontSize: 13, width: 'fit-content' }} onClick={() => {
                                                navigator.clipboard.writeText(`{{${p.key}}}`);
                                                message.success(`Đã copy: {{${p.key}}}`);
                                            }}>
                                                <Space size={4}>
                                                    <CopyOutlined style={{ opacity: 0.6 }} />
                                                    {`{{${p.key}}}`}
                                                </Space>
                                            </Tag>
                                            <span style={{ fontSize: 12, color: '#888', marginTop: 4, marginLeft: 4 }}>{p.desc}</span>
                                        </div>
                                    ))}
                                </Space>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Modal>

            {/* Placeholder Config Modal */}
            <Modal
                title="Cấu Hình Danh Sách Nhãn (Placeholders)"
                open={placeholderModalOpen}
                onCancel={() => setPlaceholderModalOpen(false)}
                onOk={placeholderForm.submit}
                width={600}
                destroyOnClose
            >
                <Alert
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                    message="Quy tắc tạo mã Placeholder (Mã biến)"
                    description={
                        <ul style={{ paddingLeft: 20, margin: 0, fontSize: 13 }}>
                            <li><strong>Định dạng đúng:</strong> Ghi bằng chữ thường, tiếng Anh không dấu, sử dụng dấu gạch dưới <code>_</code> thay cho dấu cách (VD: <code>contract_value</code>, <code>buyer_email</code>). Không dùng chữ in hoa, không dùng ký tự đặc biệt.</li>
                            <li><strong>Khớp dữ liệu:</strong> Tên biến phải <strong>chính xác</strong> với các trường dữ liệu trên hệ thống CRM (VD: khách hàng có số điện thoại là `phone` thì đặt biến là <code>customer_phone</code> hoặc <code>buyer_phone</code> tùy thiết lập tính năng in). Nếu đặt sai mã, hệ thống không thể tự lấy dữ liệu điền vào khoảng trống.</li>
                        </ul>
                    }
                />
                <Form form={placeholderForm} layout="vertical" onFinish={handleSavePlaceholders}>
                    <Form.List name="placeholders">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Row key={key} gutter={8} align="middle" style={{ marginBottom: 8 }}>
                                        <Col flex="180px">
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'key']}
                                                rules={[{ required: true, message: 'Nhập key' }]}
                                                style={{ marginBottom: 0 }}
                                            >
                                                <Input addonBefore="{{" addonAfter="}}" placeholder="chi_nhanh" />
                                            </Form.Item>
                                        </Col>
                                        <Col flex="auto">
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'desc']}
                                                rules={[{ required: true, message: 'Nhập ghi chú' }]}
                                                style={{ marginBottom: 0 }}
                                            >
                                                <Input placeholder="Chi nhánh văn phòng" />
                                            </Form.Item>
                                        </Col>
                                        <Col>
                                            <MinusCircleOutlined onClick={() => remove(name)} style={{ color: '#ff4d4f', fontSize: 16 }} />
                                        </Col>
                                    </Row>
                                ))}
                                <Form.Item style={{ marginTop: 16 }}>
                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                        Thêm Placeholder tùy chỉnh
                                    </Button>
                                </Form.Item>
                            </>
                        )}
                    </Form.List>
                </Form>
            </Modal>
        </div>
    );
};

// ... Helper components (LinkConfigItem, NumberConfigItem, CompanyConfigForm) ...

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
        <Form.Item label={label} style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', gap: 8 }}>
                <Input value={val} onChange={e => setVal(e.target.value)} placeholder={placeholder} />
                <Button type="primary" icon={<SaveOutlined />} loading={loading} onClick={handleSave}>Lưu</Button>
            </div>
        </Form.Item>
    );
}

const NumberConfigItem = ({ label, configKey, defaultValue }: { label: string, configKey: string, defaultValue: number }) => {
    const [val, setVal] = useState<number>(defaultValue);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        axios.get(`${API_URL}/system/config/${configKey}`).then(res => {
            if (res.data && res.data.value) setVal(Number(res.data.value));
        });
    }, [configKey]);

    const handleSave = async () => {
        setLoading(true);
        try {
            await axios.post(`${API_URL}/system/config`, {
                key: configKey,
                value: String(val),
                description: label
            });
            message.success('Đã lưu');
        } catch (e) { message.error('Lỗi lưu'); }
        setLoading(false);
    }

    return (
        <Form.Item label={label} style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <InputNumber
                    style={{ width: 200 }}
                    value={val}
                    onChange={(v) => setVal(v || defaultValue)}
                    formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(v) => Number(v?.replace(/,/g, '') || defaultValue)}
                    min={0}
                />
                <span style={{ color: '#888' }}>VNĐ</span>
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
