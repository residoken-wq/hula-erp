'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, Table, Button, Space, Tag, Input, Modal, Form, Select, message, Drawer, Descriptions, Timeline, Alert, Popconfirm } from 'antd';
import { SearchOutlined, EyeOutlined, EditOutlined, PhoneOutlined, MailOutlined, EnvironmentOutlined, CloudUploadOutlined, CheckCircleOutlined } from '@ant-design/icons';

import { leadsApi } from '@/lib/api';

// ... 

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
    erp_synced: boolean;
    erp_customer_id: number | null;
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
    const [pushing, setPushing] = useState<number | null>(null);
    const [form] = Form.useForm();

    const loadLeads = async () => {
        setLoading(true);
        try {
            const res = await leadsApi.getAll();
            const data = res.data;
            const leadsOnly = (Array.isArray(data) ? data : []).filter((c: any) => {
                if (c.type !== 'LEAD') return false;
                // Only show leads created from website form or wizard
                return Array.isArray(c.history) && c.history.some((h: any) => 
                    h.action === 'CREATED_FROM_WEBSITE' || h.action === 'CREATED_FROM_WIZARD'
                );
            });
            setLeads(leadsOnly);
        } catch (error) {
            setLeads([]);
            // Mock data fallback
        } finally {
            setLoading(false);
        }
    };

    const handlePushToERP = async (lead: Lead) => {
        setPushing(lead.id);
        try {
            // Call API to create customer in ERP
            // Using leadsApi.create (which maps to POST /customers)
            const res = await leadsApi.create({
                name: lead.name,
                phone: lead.phone,
                email: lead.email,
                address: lead.address,
                type: 'LEAD',
                lead_status: lead.lead_status,
                source: 'WEBSITE',
                notes: `Đồng bộ từ CMS Website - ${lead.code}`,
            });
            const newCustomer = res.data;

            // Update lead with ERP sync status
            await leadsApi.update(lead.id, {
                erp_synced: true,
                erp_customer_id: newCustomer.id,
            });

            message.success('Đã tạo Lead trên ERP thành công!');
            loadLeads();
        } catch {
            message.error('Không thể đồng bộ lên ERP');
        } finally {
            setPushing(null);
        }
    };

    useEffect(() => {
        loadLeads();
    }, []);

    const handleView = (lead: Lead) => {
        setSelectedLead(lead);
        setDrawerOpen(true);
    };

    const handleEdit = (lead: Lead) => {
        setSelectedLead(lead);
        form.setFieldsValue({
            lead_status: lead.lead_status,
        });
        setEditModal(true);
    };

    const handleUpdateStatus = async () => {
        if (!selectedLead) return;
        try {
            const values = await form.validateFields();
            await leadsApi.update(selectedLead.id, values);
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
            title: 'ERP',
            key: 'erp_synced',
            width: 100,
            render: (_: any, record: Lead) => (
                record.erp_synced ? (
                    <Tag color="success" icon={<CheckCircleOutlined />}>Đã đồng bộ</Tag>
                ) : (
                    <Popconfirm
                        title="Tạo Lead trên ERP?"
                        description="Lead sẽ được tạo trong hệ thống ERP/CRM"
                        onConfirm={() => handlePushToERP(record)}
                        okText="Tạo"
                        cancelText="Hủy"
                    >
                        <Button
                            size="small"
                            type="primary"
                            ghost
                            icon={<CloudUploadOutlined />}
                            loading={pushing === record.id}
                        >
                            Push
                        </Button>
                    </Popconfirm>
                )
            ),
        },
        {
            title: 'Giá trị',
            dataIndex: 'potential_value',
            key: 'potential_value',
            width: 130,
            render: (value: number) => value > 0 ? formatPrice(value) : '-',
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 100,
            render: (date: string) => date ? new Date(date).toLocaleDateString('vi-VN') : '-',
        },
        {
            title: '',
            key: 'actions',
            width: 80,
            render: (_: any, record: Lead) => (
                <Space>
                    <Button type="text" icon={<EyeOutlined />} onClick={() => handleView(record)} />
                    <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                </Space>
            ),
        },
    ];

    const unsyncedCount = leads.filter(l => !l.erp_synced).length;

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
                {unsyncedCount > 0 && (
                    <Alert
                        message={`Có ${unsyncedCount} lead chưa đồng bộ lên ERP`}
                        description="Click nút 'Push' để tạo lead trên hệ thống ERP/CRM"
                        type="warning"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />
                )}

                <p style={{ marginBottom: 16, color: '#666' }}>
                    💡 Leads được tạo từ form đăng ký sỉ trên website. Push lên ERP để quản lý trong hệ thống CRM.
                </p>
                <Table
                    columns={columns}
                    dataSource={leads}
                    rowKey="id"
                    loading={loading}
                    size="middle"
                    pagination={{ pageSize: 10, showTotal: (total) => `Tổng ${total} leads` }}
                    rowClassName={(record) => record.erp_synced ? '' : 'row-unsynced'}
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
                            <Descriptions.Item label="ERP">
                                {selectedLead.erp_synced ? (
                                    <Tag color="success">Đã đồng bộ (ID: {selectedLead.erp_customer_id})</Tag>
                                ) : (
                                    <Tag color="warning">Chưa đồng bộ</Tag>
                                )}
                            </Descriptions.Item>
                            <Descriptions.Item label="Giá trị tiềm năng">
                                {formatPrice(selectedLead.potential_value)}
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
                            <Space direction="vertical" style={{ width: '100%' }}>
                                {!selectedLead.erp_synced && (
                                    <Button
                                        type="primary"
                                        block
                                        icon={<CloudUploadOutlined />}
                                        onClick={() => { setDrawerOpen(false); handlePushToERP(selectedLead); }}
                                    >
                                        Push lên ERP
                                    </Button>
                                )}
                                <Button block onClick={() => { setDrawerOpen(false); handleEdit(selectedLead); }}>
                                    Cập nhật trạng thái
                                </Button>
                            </Space>
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

            <style>{`
        .row-unsynced {
          background-color: #fffbe6;
        }
      `}</style>
        </AdminLayout>
    );
}
