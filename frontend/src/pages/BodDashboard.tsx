import React, { useEffect, useState, useCallback } from 'react';
import { Row, Col, Card, Statistic, Table, Button, Select, DatePicker, Tag, Progress, Spin, Empty, Space, Tooltip } from 'antd';
import {
    DollarOutlined, FunnelPlotOutlined, TrophyOutlined, TeamOutlined,
    ArrowUpOutlined, ArrowDownOutlined, MinusOutlined, ReloadOutlined,
    RiseOutlined, FallOutlined, FireOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import { Column, Funnel, Area } from '@ant-design/plots';
import api from '../utils/api';
import dayjs from 'dayjs';
import useMobile from '../hooks/useMobile';

const { RangePicker } = DatePicker;

// ===================== BOD DASHBOARD: THE SCHOOL SALES ENGINE =====================

const BodDashboard: React.FC = () => {
    const isMobile = useMobile();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
        dayjs().startOf('month'), dayjs()
    ]);
    const [salesRepFilter, setSalesRepFilter] = useState<number | undefined>(undefined);
    const [users, setUsers] = useState<any[]>([]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [analyticsRes, usersRes] = await Promise.all([
                api.get('/sales/analytics', {
                    params: {
                        startDate: dateRange[0].format('YYYY-MM-DD'),
                        endDate: dateRange[1].format('YYYY-MM-DD'),
                        assignedToId: salesRepFilter,
                    }
                }),
                api.get('/users'),
            ]);
            setData(analyticsRes.data);
            setUsers(usersRes.data || []);
        } catch (e) {
            console.error('Error fetching analytics:', e);
        }
        setLoading(false);
    }, [dateRange, salesRepFilter]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const fmt = (v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v);

    // === TREND BADGE ===
    const TrendBadge = ({ value, suffix = '%' }: { value: number; suffix?: string }) => {
        if (value === 0) return <Tag icon={<MinusOutlined />} color="default">0{suffix}</Tag>;
        return value > 0
            ? <Tag icon={<ArrowUpOutlined />} color="success">+{value}{suffix}</Tag>
            : <Tag icon={<ArrowDownOutlined />} color="error">{value}{suffix}</Tag>;
    };

    // === KPI CARDS ===
    const KpiCards = () => {
        const kpi = data?.kpi || {};
        const cards = [
            {
                title: '💰 Doanh thu thực thu',
                value: kpi.paidRevenue || 0,
                trend: kpi.trends?.paidTrend || 0,
                gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', // Emerald
                icon: <DollarOutlined />,
            },
            {
                title: '🔵 Giá trị Phễu',
                value: kpi.pipelineValue || 0,
                trend: kpi.trends?.leadsTrend || 0,
                gradient: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)', // Royal Blue
                icon: <FunnelPlotOutlined />,
            },
            {
                title: '🏆 Tỷ lệ Chốt',
                value: kpi.conversionRate || 0,
                trend: 0,
                gradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)', // Amber
                icon: <TrophyOutlined />,
                isSuffix: '%',
            },
            {
                title: '📊 Tổng Lead',
                value: kpi.totalLeads || 0,
                trend: kpi.trends?.leadsTrend || 0,
                gradient: 'linear-gradient(135deg, #475569 0%, #64748b 100%)', // Slate
                icon: <TeamOutlined />,
                isCount: true,
            },
        ];

        return (
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                {cards.map((c, i) => (
                    <Col xs={12} sm={12} md={6} key={i}>
                        <Card bordered={false} style={{ background: c.gradient, borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Statistic
                                    title={<span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: isMobile ? 11 : 13 }}>{c.title}</span>}
                                    value={c.isCount ? c.value : (c.isSuffix ? c.value : c.value)}
                                    precision={0}
                                    formatter={(v) => c.isSuffix ? `${v}%` : (c.isCount ? String(v) : `${fmt(Number(v))}₫`)}
                                    valueStyle={{ color: '#fff', fontWeight: 'bold', fontSize: isMobile ? 18 : 26 }}
                                />
                            </div>
                            <div style={{ marginTop: 8 }}>
                                <TrendBadge value={c.trend} />
                                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginLeft: 4 }}>vs kỳ trước</span>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>
        );
    };

    // === LEAD SOURCE ROI (Stacked Bar) ===
    const LeadSourceROI = () => {
        const funnelData = data?.funnelData || [];
        const chartData = funnelData.flatMap((d: any) => [
            { source: d.sourceLabel, type: 'Qualified', count: d.qualified },
            { source: d.sourceLabel, type: 'Unqualified', count: d.unqualified },
        ]);

        return (
            <Card
                title={<span><FireOutlined style={{ color: '#f59e0b' }} /> Lead Source ROI</span>}
                bordered={false}
                style={{ borderRadius: 16, height: '100%' }}
            >
                {chartData.length > 0 ? (
                    <Column
                        data={chartData}
                        xField="source"
                        yField="count"
                        colorField="type"
                        stack
                        color={['#10b981', '#e5e7eb']}
                        height={isMobile ? 250 : 300}
                        label={{ position: 'middle', style: { fill: '#fff', fontWeight: 600 } }}
                        tooltip={{
                            formatter: (datum: any) => {
                                const src = funnelData.find((f: any) => f.sourceLabel === datum.source);
                                return {
                                    name: datum.type,
                                    value: `${datum.count} (GT TB: ${(src?.avgOrderValue || 0).toLocaleString()}₫)`,
                                };
                            },
                        }}
                        legend={{ position: 'top' }}
                    />
                ) : <Empty description="Chưa có dữ liệu nguồn Lead" />}
                <div style={{ marginTop: 12, fontSize: 12, color: '#666', fontStyle: 'italic' }}>
                    💡 Hover vào cột để xem Giá trị đơn hàng trung bình của nguồn
                </div>
            </Card>
        );
    };

    // === CONVERSION FUNNEL ===
    const ConversionFunnel = () => {
        const velocity = data?.velocityData || [];
        const kpi = data?.kpi || {};

        // Build funnel from all velocity + KPI data
        const stages = [
            { stage: 'Lead Mới', count: kpi.totalLeads || 0 },
            { stage: 'Đã Liên Hệ', count: velocity.filter((v: any) => ['CONTACTED', 'QUALIFIED', 'SAMPLE_APPROVED', 'NEGOTIATION'].includes(v.status)).length },
            { stage: 'Duyệt Mẫu SX', count: velocity.filter((v: any) => ['SAMPLE_APPROVED', 'NEGOTIATION'].includes(v.status)).length },
            { stage: 'Đàm Phán / BG', count: velocity.filter((v: any) => v.status === 'NEGOTIATION').length },
            { stage: 'Thành Công (WON)', count: kpi.conversionRate ? Math.round((kpi.totalLeads * kpi.conversionRate) / 100) : 0 },
        ];

        return (
            <Card
                title={<span><FunnelPlotOutlined style={{ color: '#3b82f6' }} /> Phễu Chuyển Đổi</span>}
                bordered={false}
                style={{ borderRadius: 16, height: '100%' }}
            >
                {stages[0].count > 0 ? (
                    <Funnel
                        data={stages}
                        xField="stage"
                        yField="count"
                        height={isMobile ? 250 : 300}
                        legend={false}
                        label={{
                            formatter: (datum: any) => `${datum.stage}\n${datum.count}`,
                            style: { fill: '#fff', fontWeight: 600, fontSize: 12 },
                        }}
                        color={['#3b82f6', '#60a5fa', '#f59e0b', '#f97316', '#10b981']}
                        conversionTag={false}
                    />
                ) : <Empty description="Chưa có dữ liệu phễu" />}
            </Card>
        );
    };

    // === 3-SALES SCORECARD ===
    const SalesScorecard = () => {
        const scorecard = data?.scorecardData || [];

        const columns = [
            {
                title: 'Nhân sự',
                dataIndex: 'userName',
                key: 'userName',
                render: (v: string) => <b>{v}</b>,
                width: isMobile ? 80 : 120,
            },
            {
                title: 'Tiến độ Doanh số',
                key: 'progress',
                render: (_: any, r: any) => {
                    const pct = r.targetRevenue > 0 ? Math.min(100, Math.round((r.actualRevenue / r.targetRevenue) * 100)) : 0;
                    return (
                        <div>
                            <Progress
                                percent={pct}
                                size="small"
                                strokeColor={pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'}
                                format={() => `${pct}%`}
                            />
                            <div style={{ fontSize: 11, color: '#888' }}>
                                {fmt(r.actualRevenue)}₫ / {r.targetRevenue > 0 ? `${fmt(r.targetRevenue)}₫` : 'N/A'}
                            </div>
                        </div>
                    );
                },
            },
            {
                title: isMobile ? 'Leads' : 'Lead mới',
                dataIndex: 'newLeads',
                key: 'newLeads',
                align: 'center' as const,
                width: 70,
                render: (v: number) => <Tag color="blue">{v}</Tag>,
            },
            {
                title: isMobile ? 'Ngày' : 'TB ngày chốt',
                dataIndex: 'avgDaysToClose',
                key: 'avgDaysToClose',
                align: 'center' as const,
                width: 80,
                render: (v: number) => <span>{v > 0 ? `${v} ngày` : '-'}</span>,
            },
            {
                title: isMobile ? 'HĐ' : 'Hoạt động',
                dataIndex: 'activities',
                key: 'activities',
                align: 'center' as const,
                width: 70,
                render: (v: number) => <Tag color="purple">{v}</Tag>,
            },
        ];

        return (
            <Card
                title={<span><TeamOutlined style={{ color: '#8b5cf6' }} /> Bảng điểm Sales</span>}
                bordered={false}
                style={{ borderRadius: 16, height: '100%' }}
            >
                <Table
                    dataSource={scorecard}
                    columns={columns}
                    rowKey="userId"
                    pagination={false}
                    size="small"
                    scroll={{ x: isMobile ? 500 : undefined }}
                />
            </Card>
        );
    };

    // === REVENUE FORECAST (Area Chart) ===
    const RevenueForecast = () => {
        const forecast = data?.forecastData || [];
        const chartData = forecast.flatMap((d: any) => [
            { month: d.label, type: 'Thực tế', value: d.actualRevenue },
            { month: d.label, type: 'Dự báo', value: d.forecastRevenue },
        ]);

        return (
            <Card
                title={<span><RiseOutlined style={{ color: '#10b981' }} /> Dự báo Doanh thu Quý</span>}
                bordered={false}
                style={{ borderRadius: 16, height: '100%' }}
            >
                {chartData.length > 0 ? (
                    <Area
                        data={chartData}
                        xField="month"
                        yField="value"
                        colorField="type"
                        scale={{ color: { range: ['#10b981', '#3b82f6'] } }}
                        height={isMobile ? 250 : 300}
                        areaStyle={(datum: any) => ({
                            fillOpacity: datum.type === 'Dự báo' ? 0.15 : 0.4,
                        })}
                        line={{
                            style: (datum: any) => ({
                                lineDash: datum.type === 'Dự báo' ? [5, 5] : [0],
                                lineWidth: 2,
                            }),
                        }}
                        yAxis={{
                            label: { formatter: (v: string) => `${(Number(v) / 1000000).toFixed(0)}M` },
                        }}
                        tooltip={{
                            formatter: (datum: any) => ({
                                name: datum.type,
                                value: `${Number(datum.value).toLocaleString()}₫`,
                            }),
                        }}
                        legend={{ position: 'top' }}
                    />
                ) : <Empty description="Chưa có dữ liệu dự báo" />}
                <div style={{ marginTop: 8, fontSize: 12, color: '#888', fontStyle: 'italic' }}>
                    📈 Đường nét đứt = Dự báo dựa trên trọng số lead pipeline
                </div>
            </Card>
        );
    };

    return (
        <div style={{ padding: isMobile ? 8 : 0, fontFamily: "'Inter', -apple-system, sans-serif" }}>
            {/* HEADER */}
            <div style={{
                display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 20, gap: 12
            }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: isMobile ? 18 : 24, fontWeight: 700 }}>
                        🏫 The School Sales Engine
                    </h2>
                    <span style={{ color: '#888', fontSize: 13 }}>BOD Dashboard • Real-time</span>
                </div>
                <Space wrap size={isMobile ? 'small' : 'middle'}>
                    <RangePicker
                        value={dateRange}
                        onChange={(v) => v && setDateRange(v as [dayjs.Dayjs, dayjs.Dayjs])}
                        format="DD/MM/YYYY"
                        size={isMobile ? 'small' : 'middle'}
                    />
                    <Select
                        placeholder="Tất cả NV"
                        allowClear
                        style={{ width: isMobile ? 100 : 150 }}
                        size={isMobile ? 'small' : 'middle'}
                        value={salesRepFilter}
                        onChange={setSalesRepFilter}
                        options={users.map((u: any) => ({ label: u.full_name || u.username, value: u.id }))}
                    />
                    <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading} size={isMobile ? 'small' : 'middle'}>
                        {isMobile ? '' : 'Làm mới'}
                    </Button>
                </Space>
            </div>

            <Spin spinning={loading}>
                {/* TOP ROW: KPI Cards */}
                <KpiCards />

                {/* MIDDLE ROW: Charts */}
                <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
                    <Col xs={24} lg={12}>
                        <LeadSourceROI />
                    </Col>
                    <Col xs={24} lg={12}>
                        <ConversionFunnel />
                    </Col>
                </Row>

                {/* BOTTOM ROW: Scorecard + Forecast */}
                <Row gutter={[24, 24]}>
                    <Col xs={24} lg={12}>
                        <SalesScorecard />
                    </Col>
                    <Col xs={24} lg={12}>
                        <RevenueForecast />
                    </Col>
                </Row>
            </Spin>
        </div>
    );
};

export default BodDashboard;
