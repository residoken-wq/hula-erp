import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Button, Typography, Tag, List, Avatar, Skeleton, message } from 'antd';
import {
    ShoppingCartOutlined, DropboxOutlined, DollarOutlined,
    ClockCircleOutlined, UserOutlined, ShopOutlined, CheckCircleOutlined,
    AlertOutlined, PlusOutlined, ExperimentOutlined, FileTextOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import api from '../utils/api';

const { Title, Text } = Typography;

const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [recentLogs, setRecentLogs] = useState<any[]>([]);

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const permissions = user?.permissions || [];

    const hasPerm = (moduleCode: string) => {
        if (user?.username === 'admin') return true;
        const p = permissions.find((perm: any) => perm.module_code === moduleCode);
        return !!(p && (p.can_view === true || p.can_view === 1));
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statRes, logRes] = await Promise.all([
                    api.get('/system/dashboard/stats'),
                    api.get('/system/logs?limit=5')
                ]);
                setStats(statRes.data);
                setRecentLogs(logRes.data || []);
            } catch (e) {
                console.error(e);
                // message.error('Không thể tải dữ liệu Dashboard'); // Silent fail better for dashboard
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // --- QUICK WIDGETS ---
    const QuickAction: React.FC<{ title: string, icon: any, color: string, onClick: () => void }> = ({ title, icon, color, onClick }) => (
        <Card hoverable style={{ textAlign: 'center', height: '100%' }} bodyStyle={{ padding: 12 }} onClick={onClick}>
            <div style={{ fontSize: 24, color: color, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontWeight: 600 }}>{title}</div>
        </Card>
    );

    return (
        <div>
            {/* HEADER */}
            <Row gutter={16} align="middle" style={{ marginBottom: 24 }}>
                <Col flex="auto">
                    <Title level={3} style={{ margin: 0 }}>
                        👋 Xin chào, {user?.full_name || 'User'}
                    </Title>
                    <Text type="secondary">
                        <ClockCircleOutlined /> Hôm nay, {dayjs().format('DD/MM/YYYY')}
                    </Text>
                </Col>
                <Col>
                    {hasPerm('SALES') && (
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/sales/pos')}>
                            Bán hàng nhanh
                        </Button>
                    )}
                </Col>
            </Row>

            <Skeleton loading={loading} active>
                {/* 1. STATS GRID */}
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    {hasPerm('SALES') && (
                        <>
                            <Col xs={24} sm={12} md={6}>
                                <Card size="small">
                                    <Statistic
                                        title={<span style={{ fontWeight: 600 }}>Đơn hàng hôm nay</span>}
                                        value={stats?.sales?.ordersToday || 0}
                                        prefix={<ShoppingCartOutlined style={{ color: '#1890ff' }} />}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                                <Card size="small">
                                    <Statistic
                                        title={<span style={{ fontWeight: 600 }}>Doanh thu tháng này</span>}
                                        value={stats?.sales?.revenueMonth || 0}
                                        prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
                                        formatter={(val) => Number(val).toLocaleString()}
                                        suffix="₫"
                                    />
                                </Card>
                            </Col>
                        </>
                    )}

                    {hasPerm('INVENTORY') && (
                        <>
                            <Col xs={24} sm={12} md={6}>
                                <Card size="small">
                                    <Statistic
                                        title={<span style={{ fontWeight: 600 }}>Cảnh báo tồn kho</span>}
                                        value={stats?.inventory?.lowStockItems || 0}
                                        valueStyle={{ color: '#cf1322' }}
                                        prefix={<AlertOutlined />}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} sm={12} md={6}>
                                <Card size="small">
                                    <Statistic
                                        title={<span style={{ fontWeight: 600 }}>Phiếu nhập chờ duyệt</span>}
                                        value={stats?.inventory?.pendingReceipts || 0}
                                        prefix={<DropboxOutlined style={{ color: '#faad14' }} />}
                                    />
                                </Card>
                            </Col>
                        </>
                    )}
                </Row>

                {/* 2. QUICK ACTIONS & ACTIVITY */}
                <Row gutter={[24, 24]}>
                    <Col xs={24} md={16}>
                        <Card title="Truy cập nhanh" bordered={false} style={{ height: '100%' }}>
                            <Row gutter={[16, 16]}>
                                {hasPerm('SALES') && (
                                    <>
                                        <Col span={6}><QuickAction title="Tạo Báo Giá" icon={<FileTextOutlined />} color="#1890ff" onClick={() => navigate('/sales')} /></Col>
                                        <Col span={6}><QuickAction title="Đơn Hàng (SO)" icon={<ShoppingCartOutlined />} color="#722ed1" onClick={() => navigate('/orders')} /></Col>
                                        <Col span={6}><QuickAction title="Khách Hàng" icon={<UserOutlined />} color="#13c2c2" onClick={() => navigate('/customers')} /></Col>
                                    </>
                                )}
                                {hasPerm('INVENTORY') && (
                                    <>
                                        <Col span={6}><QuickAction title="Kiểm Kho" icon={<DropboxOutlined />} color="#faad14" onClick={() => navigate('/inventory')} /></Col>
                                    </>
                                )}
                                {hasPerm('PRODUCT') && (
                                    <Col span={6}><QuickAction title="Sản Phẩm" icon={<ShopOutlined />} color="#eb2f96" onClick={() => navigate('/products')} /></Col>
                                )}
                                {hasPerm('PRODUCTION') && (
                                    <Col span={6}><QuickAction title="Lệnh Sản Xuất" icon={<ExperimentOutlined />} color="#fa541c" onClick={() => navigate('/planning')} /></Col>
                                )}
                            </Row>
                        </Card>
                    </Col>

                    <Col xs={24} md={8}>
                        <Card title="Hoạt động gần đây" bordered={false} style={{ height: '100%' }} extra={<a onClick={() => navigate('/system/logs')}>Xem tất cả</a>}>
                            <List
                                itemLayout="horizontal"
                                dataSource={recentLogs}
                                renderItem={(item: any) => (
                                    <List.Item style={{ padding: '8px 0' }}>
                                        <List.Item.Meta
                                            avatar={<Avatar style={{ backgroundColor: '#87d068' }} icon={<UserOutlined />} />}
                                            title={<Text style={{ fontSize: 13 }}>{item.action_type}</Text>}
                                            description={
                                                <div>
                                                    <div style={{ fontSize: 12 }}>{item.description}</div>
                                                    <div style={{ fontSize: 10, color: '#999' }}>{dayjs(item.created_at).fromNow()}</div>
                                                </div>
                                            }
                                        />
                                    </List.Item>
                                )}
                            />
                        </Card>
                    </Col>
                </Row>
            </Skeleton>
        </div>
    );
};

export default DashboardPage;
