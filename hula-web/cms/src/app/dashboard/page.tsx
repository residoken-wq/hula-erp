'use client';

import AdminLayout from '@/components/AdminLayout';
import { Card, Row, Col, Statistic, Table } from 'antd';
import { FileTextOutlined, ShopOutlined, TeamOutlined, EyeOutlined } from '@ant-design/icons';

// Mock data
const stats = [
    { title: 'Blog Posts', value: 12, icon: <FileTextOutlined style={{ fontSize: 24, color: '#2563eb' }} /> },
    { title: 'Sản phẩm', value: 45, icon: <ShopOutlined style={{ fontSize: 24, color: '#16a34a' }} /> },
    { title: 'Leads mới', value: 8, icon: <TeamOutlined style={{ fontSize: 24, color: '#ea580c' }} /> },
    { title: 'Lượt xem hôm nay', value: 1250, icon: <EyeOutlined style={{ fontSize: 24, color: '#7c3aed' }} /> },
];

const recentLeads = [
    { key: 1, company: 'Trường MN Hoa Sen', contact: 'Nguyễn Văn A', phone: '0901234567', quantity: '100-500', status: 'NEW' },
    { key: 2, company: 'Trường MN Ánh Dương', contact: 'Trần Thị B', phone: '0912345678', quantity: '50-100', status: 'NEW' },
    { key: 3, company: 'Đại lý ABC', contact: 'Lê Văn C', phone: '0923456789', quantity: '500+', status: 'CONTACTED' },
];

const columns = [
    { title: 'Công ty', dataIndex: 'company', key: 'company' },
    { title: 'Người liên hệ', dataIndex: 'contact', key: 'contact' },
    { title: 'SĐT', dataIndex: 'phone', key: 'phone' },
    { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity' },
    {
        title: 'Trạng thái',
        dataIndex: 'status',
        key: 'status',
        render: (status: string) => (
            <span style={{
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 500,
                background: status === 'NEW' ? '#dbeafe' : '#dcfce7',
                color: status === 'NEW' ? '#2563eb' : '#16a34a',
            }}>
                {status === 'NEW' ? 'Mới' : 'Đã liên hệ'}
            </span>
        ),
    },
];

export default function DashboardPage() {
    return (
        <AdminLayout>
            <Row gutter={[16, 16]}>
                {stats.map((stat, index) => (
                    <Col xs={24} sm={12} lg={6} key={index}>
                        <Card hoverable>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{
                                    width: 48,
                                    height: 48,
                                    background: '#f1f5f9',
                                    borderRadius: 8,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    {stat.icon}
                                </div>
                                <Statistic title={stat.title} value={stat.value} />
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Card title="Leads Mới Nhất" style={{ marginTop: 24 }}>
                <Table
                    columns={columns}
                    dataSource={recentLeads}
                    pagination={false}
                    size="middle"
                />
            </Card>
        </AdminLayout>
    );
}
