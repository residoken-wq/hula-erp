'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, Table, Button, Space, Tag, Input, Modal, Form, Select, message, Drawer, Descriptions, Timeline } from 'antd';
import { SearchOutlined, EyeOutlined, EditOutlined, PhoneOutlined, MailOutlined, EnvironmentOutlined, UserOutlined } from '@ant-design/icons';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface Lead {
    id: number;
    code: string;
    name: string;
    type: string;
    lead_status: string;
    phone: string;
    email: string;
    address: string;
    potential_value: number;
    created_at: string;
    history: any[];
}

const statusColors: Record<string, string> = {
    NEW: 'blue',
    CONTACTED: 'cyan',
    QUALIFIED: 'purple',
    NEGOTIATION: 'orange',
    WON: 'green',
    LOST: 'red',
};

const statusLabels: Record<string, string> = {
    NEW: 'Mới',
    CONTACTED: 'Đã liên hệ',
    QUALIFIED: 'Đủ điều kiện',
    NEGOTIATION: 'Đang thương lượng',
    WON: 'Thành công',
    LOST: 'Thất bại',
};

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        loadLeads();
    }, []);

    const loadLeads = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/customers`);
            const data = await res.json();
            // Filter only LEADs
            const leadsOnly = (Array.isArray(data) ? data : []).filter((c: any) => c.type === 'LEAD');
            setLeads(leadsOnly);
        } catch (error) {
            // Fallback mock data
            setLeads([
                { id: 1, code: 'LEAD-00001', name: 'Trường MN Hoa Sen', type: 'LEAD', lead_status: 'NEW', phone: '0901234567', email: 'hoasen@example.com', address: 'Q.1, HCM', potential_value: 50000000, created_at: '2026-01-07', history: [] },
                { id: 2, code: 'LEAD-00002', name: 'Trường MN Ánh Dương', type: 'LEAD', lead_status: 'CONTACTED', phone: '0912345678', email: 'anhduong@example.com', address: 'Q.7, HCM', potential_value: 30000000, created_at: '2026-01-06', history: [] },
                { id: 3, code: 'LEAD-00003', name: 'Đại lý ABC', type: 'LEAD', lead_status: 'QUALIFIED', phone: '0923456789', email: 'dailyabc@example.com', address: 'TP. Thủ Đức', potential_value: 100000000, created_at: '2026-01-05', history: [] },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleView = (lead: Lead) => {
        setSelectedLead(lead);
        setDrawerOpen(true);
    };

    const handleEdit = (lead: Lead) => {
        setSelectedLead(lead);
        form.setFieldsValue({ lead_status: lead.lead_status });
        setEditModal(true);
    };

    const handleUpdateStatus = async () => {
        if (!selectedLead) return;
        try {
            const values = await form.validateFields();
            await fetch(`${API_URL}/customers/${selectedLead.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });
            message.success('Đã cập nhật trạng thái');
            setEditModal(false);
            loadLeads();
        } catch {
            message.error('Có lỗi xảy ra');
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    const columns = [
        {
            title: 'Mã',
            dataIndex: 'code',
            key: 'code',
            width: 130,
            render: (code: string) => <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>{code}</code>,
        },
        {
            title: 'Tên',
            dataIndex: 'name',
            key: 'name',
            filteredValue: searchText ? [searchText] : null,
            onFilter: (value: any, record: Lead) =>
                record.name.toLowerCase().includes(value.toLowerCase()) ||
                record.code.toLowerCase().includes(value.toLowerCase()),
            render: (name: string, record: Lead) => (
                <a onClick={() => handleView(record)} style={{ fontWeight: 500 }}>{name}</a>
            ),
        },
        {
            title: 'Điện thoại',
            dataIndex: 'phone',
            key: 'phone',
            width: 130,
            render: (phone: string) => (
                <a href={`tel:${phone}`}><PhoneOutlined /> {phone}</a>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'lead_status',
            key: 'lead_status',
            width: 140,
            render: (status: string) => (
                <Tag color={statusColors[status] || 'default'}>
                    {statusLabels[status] || status}
                </Tag>
            ),
        },
        {
            title: 'Giá trị tiềm năng',
            dataIndex: 'potential_value',
            key: 'potential_value',
            width: 150,
            render: (value: number) => value > 0 ? formatPrice(value) : '-',
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 120,
            render: (date: string) => date ? new Date(date).toLocaleDateString('vi-VN') : '-',
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 120,
            render: (_: any, record: Lead) => (
                <Space>
                    <Button type="text" icon={<EyeOutlined />} onClick={() => handleView(record)} />
                    <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                </Space>
            ),
        },
    ];

    return (
        <AdminLayout>
            <Card
                title="Leads (Khách hàng tiềm năng)"
                extra={
                    <Space>
                        <Input
                            placeholder="Tìm kiếm..."
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{ width: 200 }}
                            allowClear
                        />
                        <Button onClick={loadLeads} loading={loading}>
                            Làm mới
                        </Button>
                    </Space>
                }
            >
                <p style={{ marginBottom: 16, color: '#666' }}>
                    💡 Leads được tạo từ form đăng ký sỉ trên website. Cập nhật trạng thái để theo dõi quá trình chăm sóc.
                </p>
                <Table
                    columns={columns}
                    dataSource={leads}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10, showTotal: (total) => `Tổng ${total} leads` }}
                />
            </Card>

            {/* Detail Drawer */}
            <Drawer
                title={selectedLead?.name}
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                width={500}
            >
                {selectedLead && (
                    <>
                        <Descriptions column={1} bordered size="small">
                            <Descriptions.Item label="Mã">{selectedLead.code}</Descriptions.Item>
                            <Descriptions.Item label="Điện thoại">
                                <a href={`tel:${selectedLead.phone}`}><PhoneOutlined /> {selectedLead.phone}</a>
                            </Descriptions.Item>
                            <Descriptions.Item label="Email">
                                <a href={`mailto:${selectedLead.email}`}><MailOutlined /> {selectedLead.email || '-'}</a>
                            </Descriptions.Item>
                            <Descriptions.Item label="Địa chỉ">
                                <EnvironmentOutlined /> {selectedLead.address || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Trạng thái">
                                <Tag color={statusColors[selectedLead.lead_status]}>
                                    {statusLabels[selectedLead.lead_status]}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Giá trị tiềm năng">
                                {formatPrice(selectedLead.potential_value)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Ngày tạo">
                                {new Date(selectedLead.created_at).toLocaleDateString('vi-VN')}
                            </Descriptions.Item>
                        </Descriptions>

                        <div style={{ marginTop: 24 }}>
                            <h4>Lịch sử hoạt động</h4>
                            {selectedLead.history && selectedLead.history.length > 0 ? (
                                <Timeline
                                    items={selectedLead.history.map((h: any) => ({
                                        children: (
                                            <>
                                                <strong>{h.action}</strong>
                                                <br />
                                                <span style={{ color: '#666', fontSize: 12 }}>
                                                    {new Date(h.timestamp).toLocaleString('vi-VN')}
                                                </span>
                                            </>
                                        ),
                                    }))}
                                />
                            ) : (
                                <p style={{ color: '#666' }}>Chưa có lịch sử</p>
                            )}
                        </div>

                        <div style={{ marginTop: 24 }}>
                            <Button type="primary" block onClick={() => { setDrawerOpen(false); handleEdit(selectedLead); }}>
                                Cập nhật trạng thái
                            </Button>
                        </div>
                    </>
                )}
            </Drawer>

            {/* Edit Status Modal */}
            <Modal
                title="Cập nhật trạng thái Lead"
                open={editModal}
                onOk={handleUpdateStatus}
                onCancel={() => setEditModal(false)}
                okText="Cập nhật"
                cancelText="Hủy"
            >
                <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                    <Form.Item name="lead_status" label="Trạng thái" rules={[{ required: true }]}>
                        <Select>
                            <Select.Option value="NEW">Mới</Select.Option>
                            <Select.Option value="CONTACTED">Đã liên hệ</Select.Option>
                            <Select.Option value="QUALIFIED">Đủ điều kiện</Select.Option>
                            <Select.Option value="NEGOTIATION">Đang thương lượng</Select.Option>
                            <Select.Option value="WON">Thành công</Select.Option>
                            <Select.Option value="LOST">Thất bại</Select.Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </AdminLayout>
    );
}
