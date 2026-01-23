'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, Row, Col, Statistic, Table, Tag, Space, Button } from 'antd';
import { FileTextOutlined, ShopOutlined, TeamOutlined, EyeOutlined, RiseOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface DashboardStats {
    blogs: number;
    products: number;
    leads: number;
    views: number;
}

interface RecentLead {
    id: number;
    code: string;
    name: string;
    phone: string;
    lead_status: string;
    created_at: string;
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

export default function DashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats>({ blogs: 0, products: 0, leads: 0, views: 0 });
    const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        setLoading(true);
        try {
            // Fetch blogs count
            const blogsRes = await fetch(`${API_URL}/blogs`);
            const blogs = await blogsRes.json();

            // Fetch products count
            const productsRes = await fetch(`${API_URL}/products`);
            const products = await productsRes.json();

            // Fetch leads
            const customersRes = await fetch(`${API_URL}/customers`);
            const customers = await customersRes.json();
            const leads = (Array.isArray(customers) ? customers : []).filter((c: any) => c.type === 'LEAD');

            setStats({
                blogs: Array.isArray(blogs) ? blogs.length : 0,
                products: Array.isArray(products) ? products.length : 0,
                leads: leads.length,
                views: Array.isArray(blogs) ? blogs.reduce((sum: number, b: any) => sum + (b.view_count || 0), 0) : 0,
            });

            // Get recent leads (last 5)
            setRecentLeads(leads.slice(0, 5));
        } catch (error) {
            console.error('Failed to load dashboard:', error);
            // Initialize with empty/zero values on error
            setStats({ blogs: 0, products: 0, leads: 0, views: 0 });
            setRecentLeads([]);
        } finally {
            setLoading(false);
        }
    };

    const leadsColumns = [
        { title: 'Mã', dataIndex: 'code', key: 'code', width: 120 },
        { title: 'Tên', dataIndex: 'name', key: 'name' },
        { title: 'SĐT', dataIndex: 'phone', key: 'phone', width: 120 },
        {
            title: 'Trạng thái',
            dataIndex: 'lead_status',
            key: 'lead_status',
            width: 130,
            render: (status: string) => (
                <Tag color={statusColors[status] || 'default'}>
                    {statusLabels[status] || status}
                </Tag>
            ),
        },
    ];

    const statCards = [
        {
            title: 'Bài viết',
            value: stats.blogs,
            icon: <FileTextOutlined style={{ fontSize: 28, color: '#fff' }} />,
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            shadowColor: 'rgba(102, 126, 234, 0.4)',
            link: '/blogs',
        },
        {
            title: 'Sản phẩm',
            value: stats.products,
            icon: <ShopOutlined style={{ fontSize: 28, color: '#fff' }} />,
            gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            shadowColor: 'rgba(16, 185, 129, 0.4)',
            link: '/products',
        },
        {
            title: 'Leads mới',
            value: stats.leads,
            icon: <TeamOutlined style={{ fontSize: 28, color: '#fff' }} />,
            gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            shadowColor: 'rgba(245, 158, 11, 0.4)',
            link: '/leads',
        },
        {
            title: 'Tổng lượt xem',
            value: stats.views,
            icon: <EyeOutlined style={{ fontSize: 28, color: '#fff' }} />,
            gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            shadowColor: 'rgba(139, 92, 246, 0.4)',
            link: null,
        },
    ];

    return (
        <AdminLayout>
            <Row gutter={[16, 16]}>
                {statCards.map((stat, index) => (
                    <Col xs={24} sm={12} lg={6} key={index}>
                        <Card
                            hoverable={!!stat.link}
                            onClick={() => stat.link && router.push(stat.link)}
                            style={{ cursor: stat.link ? 'pointer' : 'default' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{
                                    width: 60,
                                    height: 60,
                                    background: stat.gradient,
                                    borderRadius: 14,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: `0 8px 20px ${stat.shadowColor}`,
                                }}>
                                    {stat.icon}
                                </div>
                                <div>
                                    <div style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>{stat.title}</div>
                                    <div style={{ fontSize: 32, fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>
                                        {stat.value.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col xs={24} lg={16}>
                    <Card
                        title="Leads Mới Nhất"
                        extra={
                            <Button type="link" onClick={() => router.push('/leads')}>
                                Xem tất cả <ArrowRightOutlined />
                            </Button>
                        }
                    >
                        <Table
                            columns={leadsColumns}
                            dataSource={recentLeads}
                            rowKey="id"
                            loading={loading}
                            pagination={false}
                            size="middle"
                            locale={{ emptyText: 'Chưa có leads nào' }}
                        />
                    </Card>
                </Col>

                <Col xs={24} lg={8}>
                    <Card title="Liên kết nhanh">
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Button block onClick={() => router.push('/blogs/new')}>
                                <FileTextOutlined /> Tạo bài viết mới
                            </Button>
                            <Button block onClick={() => router.push('/products')}>
                                <ShopOutlined /> Quản lý sản phẩm
                            </Button>
                            <Button block onClick={() => router.push('/leads')}>
                                <TeamOutlined /> Xem danh sách Leads
                            </Button>
                            <Button block onClick={() => window.open('https://nemmamnon.com', '_blank')}>
                                <EyeOutlined /> Xem website
                            </Button>
                        </Space>
                    </Card>

                    <Card title="Thống kê nhanh" style={{ marginTop: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <RiseOutlined style={{ color: '#16a34a' }} />
                            <span>Website đang hoạt động tốt</span>
                        </div>
                        <p style={{ color: '#666', fontSize: 13 }}>
                            Cập nhật nội dung thường xuyên để thu hút khách hàng. Kiểm tra leads mới hàng ngày để không bỏ lỡ cơ hội.
                        </p>
                    </Card>
                </Col>
            </Row>
        </AdminLayout>
    );
}
