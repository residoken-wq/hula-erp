'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, Row, Col, Statistic, Table, Tag, Space, Button } from 'antd';
import { FileTextOutlined, ShopOutlined, TeamOutlined, EyeOutlined, RiseOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

import { blogsApi, productsApi, leadsApi, analyticsApi } from '@/lib/api';

// ...

interface DashboardStats {
    blogs: number;
    products: number;
    leads: number;
    views: number;
    visitorsToday: number;
    onlineVisitors: number;
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
    const [stats, setStats] = useState<DashboardStats>({ blogs: 0, products: 0, leads: 0, views: 0, visitorsToday: 0, onlineVisitors: 0 });
    const [recentLeads, setRecentLeads] = useState<RecentLead[]>([]);
    const [loading, setLoading] = useState(true);

    const loadDashboard = async () => {
        setLoading(true);
        try {
            // Fetch blogs count
            const blogsRes = await blogsApi.getAll();
            const blogs = blogsRes.data;

            // Fetch products count
            const productsRes = await productsApi.getAll(); // Using productsApi from lib/api
            const products = productsRes.data;

            // Fetch leads
            const customersRes = await leadsApi.getAll(); // Using leadsApi (mapped to /customers)
            const customers = customersRes.data;
            const leads = (Array.isArray(customers) ? customers : []).filter((c: any) => {
                if (c.type !== 'LEAD') return false;
                if (c.lead_source && c.lead_source.toUpperCase() === 'WEBSITE') return true;
                if (Array.isArray(c.history)) {
                    return c.history.some((h: any) => 
                        h.action === 'CREATED_FROM_WEBSITE' || h.action === 'CREATED_FROM_WIZARD'
                    );
                }
                return false;
            });

            // Fetch analytics stats
            const analyticsRes = await analyticsApi.getStats();
            const aStats = analyticsRes.data || { todayVisitors: 0, onlineVisitors: 0 };

            setStats({
                blogs: Array.isArray(blogs) ? blogs.length : 0,
                products: Array.isArray(products) ? products.length : 0,
                leads: leads.length,
                views: Array.isArray(blogs) ? blogs.reduce((sum: number, b: any) => sum + (b.view_count || 0), 0) : 0,
                visitorsToday: Number(aStats.todayVisitors || 0),
                onlineVisitors: Number(aStats.onlineVisitors || 0),
            });

            // Get recent leads (last 5)
            setRecentLeads(leads.slice(0, 5));
        } catch (error) {
            console.error('Failed to load dashboard:', error);
            // Initialize with empty/zero values on error
            setStats({ blogs: 0, products: 0, leads: 0, views: 0, visitorsToday: 0, onlineVisitors: 0 });
            setRecentLeads([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);

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
            title: 'Khách truy cập (Hôm nay)',
            value: stats.visitorsToday,
            icon: <RiseOutlined style={{ fontSize: 28, color: '#fff' }} />,
            gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            shadowColor: 'rgba(59, 130, 246, 0.4)',
            link: null,
        },
        {
            title: 'Tổng lượt xem bài viết',
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
                            <RiseOutlined style={{ color: stats.onlineVisitors > 0 ? '#16a34a' : '#64748b' }} />
                            <span style={{ fontWeight: 600 }}>{stats.onlineVisitors}</span>
                            <span>Users đang truy cập website ngay lúc này</span>
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
