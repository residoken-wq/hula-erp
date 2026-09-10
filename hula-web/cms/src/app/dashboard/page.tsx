'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, Row, Col, Statistic, Table, Tag, Space, Button, Tooltip, Radio, Switch, Input, Badge } from 'antd';
import {
    FileTextOutlined,
    ShopOutlined,
    TeamOutlined,
    EyeOutlined,
    RiseOutlined,
    ArrowRightOutlined,
    GlobalOutlined,
    RobotOutlined,
    LaptopOutlined,
    ReloadOutlined,
    SearchOutlined
} from '@ant-design/icons';
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

    const [visitors, setVisitors] = useState<any[]>([]);
    const [visitorsLoading, setVisitorsLoading] = useState(false);
    const [visitorsTotal, setVisitorsTotal] = useState(0);
    const [visitorsPage, setVisitorsPage] = useState(1);
    const [visitorsPageSize, setVisitorsPageSize] = useState(10);
    const [visitorViewMode, setVisitorViewMode] = useState<'ip' | 'session'>('ip');
    const [hideBots, setHideBots] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

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
                visitorsToday: Number(aStats.todayRealVisitors ?? aStats.todayVisitors ?? 0),
                onlineVisitors: Number(aStats.onlineRealVisitors ?? aStats.onlineVisitors ?? 0),
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

    const loadVisitors = async (
        page = visitorsPage,
        pageSize = visitorsPageSize,
        viewMode = visitorViewMode,
        filterBots = hideBots,
        search = searchQuery
    ) => {
        setVisitorsLoading(true);
        try {
            const res = await analyticsApi.getVisitors({
                page,
                pageSize,
                groupBy: viewMode,
                hideBots: filterBots,
                search: search || undefined,
            });
            if (res.data && res.data.success) {
                setVisitors(res.data.data);
                setVisitorsTotal(res.data.total);
            }
        } catch (error) {
            console.error('Failed to load visitors', error);
        } finally {
            setVisitorsLoading(false);
        }
    };

    useEffect(() => {
        loadVisitors(visitorsPage, visitorsPageSize, visitorViewMode, hideBots, searchQuery);
    }, [visitorsPage, visitorsPageSize, visitorViewMode, hideBots]);

    const handleSearch = () => {
        setVisitorsPage(1);
        loadVisitors(1, visitorsPageSize, visitorViewMode, hideBots, searchQuery);
    };

    const parseUserAgent = (ua: string) => {
        if (!ua) return { browser: 'Không rõ', os: 'Không rõ', isBot: false };
        const lower = ua.toLowerCase();

        const isBot = /bot|crawl|spider|slurp|lightpanda|headless|python|curl|wget|bytespider|semrush|ahrefs/i.test(lower);

        let browser = 'Khác';
        if (lower.includes('lightpanda')) browser = 'Lightpanda Bot';
        else if (lower.includes('edg/')) browser = 'Edge';
        else if (lower.includes('chrome/')) browser = 'Chrome';
        else if (lower.includes('firefox/')) browser = 'Firefox';
        else if (lower.includes('safari/') && !lower.includes('chrome/')) browser = 'Safari';
        else if (lower.includes('opera/') || lower.includes('opr/')) browser = 'Opera';
        else if (lower.includes('googlebot')) browser = 'Googlebot';
        else if (lower.includes('bingbot')) browser = 'Bingbot';
        else if (lower.includes('curl')) browser = 'cURL';

        let os = 'OS';
        if (lower.includes('windows nt 10.0')) os = 'Windows 10/11';
        else if (lower.includes('windows nt')) os = 'Windows';
        else if (lower.includes('iphone') || lower.includes('ipad') || lower.includes('ipod')) os = 'iOS';
        else if (lower.includes('mac os x')) os = 'macOS';
        else if (lower.includes('android')) os = 'Android';
        else if (lower.includes('linux')) os = 'Linux';

        return { browser, os, isBot };
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

    const ipColumns = [
        {
            title: 'Quốc gia',
            dataIndex: 'country',
            key: 'country',
            width: 140,
            render: (text: string, record: any) => (
                <span>
                    {text ? (
                        <Tag color="blue" icon={<GlobalOutlined />}>
                            {text}{record.city ? ` (${record.city})` : ''}
                        </Tag>
                    ) : (
                        <Tag>Chưa rõ</Tag>
                    )}
                </span>
            ),
        },
        {
            title: 'IP Address',
            dataIndex: 'ip_address',
            key: 'ip_address',
            width: 160,
            render: (ip: string, record: any) => (
                <Tag color={record.is_bot ? 'default' : 'geekblue'} style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {ip || 'Không rõ'}
                </Tag>
            ),
        },
        {
            title: 'Số phiên',
            dataIndex: 'session_count',
            key: 'session_count',
            width: 110,
            align: 'center' as const,
            render: (count: number) => (
                <Badge
                    count={count || 1}
                    overflowCount={99999}
                    style={{ backgroundColor: count > 5 ? '#52c41a' : '#1890ff' }}
                />
            ),
        },
        {
            title: 'Phân loại',
            dataIndex: 'is_bot',
            key: 'is_bot',
            width: 130,
            render: (isBot: boolean) => isBot ? (
                <Tag color="orange" icon={<RobotOutlined />}>Bot/Crawler</Tag>
            ) : (
                <Tag color="green" icon={<LaptopOutlined />}>Khách hàng</Tag>
            ),
        },
        {
            title: 'Trình duyệt / Thiết bị gần nhất',
            dataIndex: 'user_agent',
            key: 'user_agent',
            render: (ua: string) => {
                const parsed = parseUserAgent(ua);
                return (
                    <Tooltip title={ua}>
                        <Space size={4}>
                            <Tag color={parsed.isBot ? 'orange' : 'cyan'}>{parsed.browser}</Tag>
                            {!parsed.isBot && <Tag>{parsed.os}</Tag>}
                        </Space>
                    </Tooltip>
                );
            },
        },
        {
            title: 'Truy cập cuối',
            dataIndex: 'last_active',
            key: 'last_active',
            width: 180,
            render: (date: string) => new Date(date).toLocaleString('vi-VN'),
        },
    ];

    const sessionColumns = [
        {
            title: 'Quốc gia',
            dataIndex: 'country',
            key: 'country',
            width: 140,
            render: (text: string, record: any) => (
                <span>
                    {text ? (
                        <Tag color="blue" icon={<GlobalOutlined />}>
                            {text}{record.city ? ` (${record.city})` : ''}
                        </Tag>
                    ) : (
                        <Tag>Chưa rõ</Tag>
                    )}
                </span>
            ),
        },
        {
            title: 'IP Address',
            dataIndex: 'ip_address',
            key: 'ip_address',
            width: 160,
            render: (ip: string, record: any) => (
                <Tag color={record.is_bot ? 'default' : 'geekblue'} style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {ip || 'Không rõ'}
                </Tag>
            ),
        },
        {
            title: 'Phân loại',
            dataIndex: 'is_bot',
            key: 'is_bot',
            width: 130,
            render: (isBot: boolean) => isBot ? (
                <Tag color="orange" icon={<RobotOutlined />}>Bot/Crawler</Tag>
            ) : (
                <Tag color="green" icon={<LaptopOutlined />}>Khách hàng</Tag>
            ),
        },
        {
            title: 'Trình duyệt / Thiết bị',
            dataIndex: 'user_agent',
            key: 'user_agent',
            render: (ua: string) => {
                const parsed = parseUserAgent(ua);
                return (
                    <Tooltip title={ua}>
                        <Space size={4}>
                            <Tag color={parsed.isBot ? 'orange' : 'cyan'}>{parsed.browser}</Tag>
                            {!parsed.isBot && <Tag>{parsed.os}</Tag>}
                        </Space>
                    </Tooltip>
                );
            },
        },
        {
            title: 'Truy cập cuối',
            dataIndex: 'last_active',
            key: 'last_active',
            width: 180,
            render: (date: string) => new Date(date).toLocaleString('vi-VN'),
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 150,
            render: (date: string) => new Date(date).toLocaleDateString('vi-VN'),
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
            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col span={24}>
                    <Card
                        title={
                            <Space size={16} wrap>
                                <span style={{ fontWeight: 600, fontSize: 16 }}>Thống Kê IP & Lượt Truy Cập</span>
                                <Radio.Group
                                    value={visitorViewMode}
                                    onChange={(e) => {
                                        setVisitorViewMode(e.target.value);
                                        setVisitorsPage(1);
                                    }}
                                    buttonStyle="solid"
                                    size="small"
                                >
                                    <Radio.Button value="ip">Thống kê theo IP</Radio.Button>
                                    <Radio.Button value="session">Lịch sử theo phiên</Radio.Button>
                                </Radio.Group>
                            </Space>
                        }
                        extra={
                            <Space size={12} wrap>
                                <Space size={6}>
                                    <span style={{ fontSize: 13, color: '#64748b' }}>Ẩn Bot:</span>
                                    <Switch
                                        checked={hideBots}
                                        onChange={(checked) => {
                                            setHideBots(checked);
                                            setVisitorsPage(1);
                                        }}
                                        size="small"
                                    />
                                </Space>
                                <Input.Search
                                    placeholder="Tìm IP hoặc trình duyệt..."
                                    allowClear
                                    size="small"
                                    style={{ width: 200 }}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onSearch={handleSearch}
                                />
                                <Button
                                    icon={<ReloadOutlined />}
                                    size="small"
                                    onClick={() => loadVisitors(visitorsPage, visitorsPageSize, visitorViewMode, hideBots, searchQuery)}
                                >
                                    Làm mới
                                </Button>
                            </Space>
                        }
                    >
                        <Table
                            columns={visitorViewMode === 'ip' ? ipColumns : sessionColumns}
                            dataSource={visitors}
                            rowKey="id"
                            loading={visitorsLoading}
                            pagination={{
                                current: visitorsPage,
                                pageSize: visitorsPageSize,
                                total: visitorsTotal,
                                showSizeChanger: true,
                                showTotal: (total) => `Tổng ${total.toLocaleString()} ${visitorViewMode === 'ip' ? 'địa chỉ IP' : 'phiên'}`,
                                onChange: (page, pageSize) => {
                                    setVisitorsPage(page);
                                    setVisitorsPageSize(pageSize);
                                }
                            }}
                            size="middle"
                            scroll={{ x: 900 }}
                        />
                    </Card>
                </Col>
            </Row>
        </AdminLayout>
    );
}
