import React, { useEffect, useState, useCallback } from 'react';
import { Row, Col, Card, Statistic, Table, Button, Select, DatePicker, Tag, Progress, Spin, Empty, Space, message, Popconfirm, Input, Tooltip } from 'antd';
import {
    DollarOutlined, FunnelPlotOutlined, TrophyOutlined, TeamOutlined,
    ReloadOutlined, BellOutlined, WarningOutlined, RiseOutlined,
    ThunderboltOutlined, ClockCircleOutlined, SearchOutlined
} from '@ant-design/icons';
import { Funnel, Area } from '@ant-design/plots';
import api from '../utils/api';
import dayjs from 'dayjs';
import useMobile from '../hooks/useMobile';

const { RangePicker } = DatePicker;

// ===================== SALES STRATEGY DASHBOARD =====================

const SalesStrategyDashboard: React.FC = () => {
    const isMobile = useMobile();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
        dayjs().startOf('month'), dayjs()
    ]);
    const [salesRepFilter, setSalesRepFilter] = useState<number | undefined>(undefined);
    const [productTypeFilter, setProductTypeFilter] = useState<string | undefined>(undefined);
    const [users, setUsers] = useState<any[]>([]);
    const [pushingId, setPushingId] = useState<number | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [analyticsRes, usersRes] = await Promise.all([
                api.get('/sales/analytics', {
                    params: {
                        startDate: dateRange[0].format('YYYY-MM-DD'),
                        endDate: dateRange[1].format('YYYY-MM-DD'),
                        assignedToId: salesRepFilter,
                        productType: productTypeFilter,
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
    }, [dateRange, salesRepFilter, productTypeFilter]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const fmt = (v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v);

    // === KPI CARDS ===
    const KpiCards = () => {
        const kpi = data?.kpi || {};
        return (
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={6}>
                    <Card bordered={false} style={{ borderRadius: 12, borderLeft: '4px solid #10b981' }}>
                        <Statistic title="Tổng Lead" value={kpi.totalLeads || 0} prefix={<TeamOutlined />} valueStyle={{ color: '#10b981', fontWeight: 700, fontSize: isMobile ? 20 : 28 }} />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card bordered={false} style={{ borderRadius: 12, borderLeft: '4px solid #f59e0b' }}>
                        <Statistic title="Tỷ lệ chuyển đổi" value={kpi.conversionRate || 0} suffix="%" prefix={<TrophyOutlined />} valueStyle={{ color: '#f59e0b', fontWeight: 700, fontSize: isMobile ? 20 : 28 }} />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card bordered={false} style={{ borderRadius: 12, borderLeft: '4px solid #3b82f6' }}>
                        <Statistic title="Pipeline Value" value={kpi.pipelineValue || 0} prefix={<FunnelPlotOutlined />} formatter={(v) => `${fmt(Number(v))}₫`} valueStyle={{ color: '#3b82f6', fontWeight: 700, fontSize: isMobile ? 20 : 28 }} />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card bordered={false} style={{ borderRadius: 12, borderLeft: '4px solid #059669' }}>
                        <Statistic title="Doanh thu thực" value={kpi.actualRevenue || 0} prefix={<DollarOutlined />} formatter={(v) => `${fmt(Number(v))}₫`} valueStyle={{ color: '#059669', fontWeight: 700, fontSize: isMobile ? 20 : 28 }} />
                    </Card>
                </Col>
            </Row>
        );
    };

    // === REPORT 1: LEAD SOURCE FUNNEL ===
    const LeadSourceFunnel = () => {
        const funnelData = data?.funnelData || [];

        const funnelChartData = funnelData.map((d: any) => ({
            stage: d.sourceLabel,
            count: d.leads,
        }));

        const columns = [
            { title: 'Nguồn', dataIndex: 'sourceLabel', key: 'source', render: (v: string) => <b>{v}</b> },
            { title: 'Leads', dataIndex: 'leads', key: 'leads', align: 'center' as const },
            { title: 'Qualified', dataIndex: 'qualified', key: 'qualified', align: 'center' as const, render: (v: number) => <Tag color="green">{v}</Tag> },
            { title: 'Won', dataIndex: 'won', key: 'won', align: 'center' as const, render: (v: number) => <Tag color="gold">{v}</Tag> },
            { title: 'Win%', dataIndex: 'winRate', key: 'winRate', align: 'center' as const, render: (v: number) => <span style={{ fontWeight: 600, color: v >= 30 ? '#10b981' : v >= 10 ? '#f59e0b' : '#ef4444' }}>{v}%</span> },
            { title: isMobile ? 'GT TB' : 'GT Đơn TB', dataIndex: 'avgOrderValue', key: 'avgOrderValue', align: 'right' as const, render: (v: number) => v > 0 ? `${fmt(v)}₫` : '-' },
        ];

        return (
            <Card
                title={<span><FunnelPlotOutlined style={{ color: '#3b82f6' }} /> Báo cáo 1: Lead Source & Conversion</span>}
                bordered={false}
                style={{ borderRadius: 16, marginBottom: 24 }}
            >
                <Row gutter={24}>
                    <Col xs={24} md={10}>
                        {funnelChartData.length > 0 ? (
                            <Funnel
                                data={funnelChartData}
                                xField="stage"
                                yField="count"
                                height={250}
                                legend={false}
                                color={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']}
                                conversionTag={false}
                                label={{ style: { fill: '#fff', fontWeight: 600 } }}
                            />
                        ) : <Empty description="Chưa có dữ liệu" />}
                    </Col>
                    <Col xs={24} md={14}>
                        <Table
                            dataSource={funnelData}
                            columns={columns}
                            rowKey="source"
                            pagination={false}
                            size="small"
                            scroll={{ x: isMobile ? 500 : undefined }}
                        />
                    </Col>
                </Row>
            </Card>
        );
    };

    // === REPORT 2: SAMPLE & QUOTE VELOCITY ===
    const VelocityAlerts = () => {
        const velocity = data?.velocityData || [];

        const handlePush = async (record: any) => {
            setPushingId(record.customerId);
            try {
                await api.post('/sales/analytics/push-reminder', {
                    userId: record.assignedToId,
                    customerName: record.customerName,
                    message: `⚡ Khách hàng ${record.customerName} (${record.status}) đã ${record.daysSinceLastAction} ngày chưa có follow-up. Vui lòng xử lý ngay!`,
                });
                message.success(`Đã gửi nhắc nhở cho ${record.assignedTo}`);
            } catch (e) {
                message.error('Lỗi gửi nhắc nhở');
            }
            setPushingId(null);
        };

        const getRowBg = (r: any) => {
            if (r.alertLevel === 'red') return '#fef2f2';
            if (r.alertLevel === 'orange') return '#fffbeb';
            return 'transparent';
        };

        const statusLabel: Record<string, string> = {
            QUALIFIED: 'Tiềm năng',
            SAMPLE_APPROVED: 'Đã duyệt mẫu',
            CONTACTED: 'Đã liên hệ',
            NEGOTIATION: 'Đàm phán',
        };

        const columns = [
            {
                title: '', key: 'alert', width: 30,
                render: (_: any, r: any) => r.alertLevel === 'red'
                    ? <WarningOutlined style={{ color: '#ef4444', fontSize: 16 }} />
                    : r.alertLevel === 'orange'
                        ? <ClockCircleOutlined style={{ color: '#f59e0b', fontSize: 16 }} />
                        : null,
            },
            {
                title: 'Khách hàng', dataIndex: 'customerName', key: 'name',
                render: (v: string, r: any) => <div><b>{v}</b><div style={{ fontSize: 11, color: '#888' }}>{r.phone}</div></div>,
            },
            {
                title: 'Trạng thái', dataIndex: 'status', key: 'status',
                render: (v: string) => <Tag color={v === 'QUALIFIED' ? 'blue' : v === 'SAMPLE_APPROVED' ? 'purple' : 'default'}>{statusLabel[v] || v}</Tag>,
            },
            {
                title: isMobile ? 'Ngày' : 'Số ngày chờ', dataIndex: 'daysSinceLastAction', key: 'days',
                align: 'center' as const,
                render: (v: number, r: any) => <span style={{ fontWeight: 700, color: r.alertLevel === 'red' ? '#ef4444' : r.alertLevel === 'orange' ? '#f59e0b' : '#333' }}>{v} ngày</span>,
                sorter: (a: any, b: any) => b.daysSinceLastAction - a.daysSinceLastAction,
                defaultSortOrder: 'ascend' as const,
            },
            {
                title: isMobile ? 'GT' : 'Giá trị', dataIndex: 'potentialValue', key: 'value',
                align: 'right' as const,
                render: (v: number) => v > 0 ? `${fmt(v)}₫` : '-',
            },
            {
                title: 'Phụ trách', dataIndex: 'assignedTo', key: 'assigned',
                width: 100,
            },
            {
                title: '', key: 'push', width: 80,
                render: (_: any, r: any) => (
                    <Button
                        type="primary"
                        danger={r.alertLevel === 'red'}
                        size="small"
                        icon={<BellOutlined />}
                        loading={pushingId === r.customerId}
                        onClick={() => handlePush(r)}
                    >
                        Push
                    </Button>
                ),
            },
        ];

        return (
            <Card
                title={<span><ThunderboltOutlined style={{ color: '#f59e0b' }} /> Báo cáo 2: Sample & Quote Velocity</span>}
                bordered={false}
                style={{ borderRadius: 16, marginBottom: 24 }}
                extra={
                    <Space>
                        <Tag color="red">🔴 QUALIFIED &gt; 3 ngày</Tag>
                        <Tag color="orange">🟠 SAMPLE &gt; 5 ngày</Tag>
                    </Space>
                }
            >
                <Table
                    dataSource={velocity}
                    columns={columns}
                    rowKey="customerId"
                    pagination={false}
                    size="small"
                    scroll={{ x: isMobile ? 600 : undefined }}
                    onRow={(record) => ({
                        style: { background: getRowBg(record) },
                    })}
                />
            </Card>
        );
    };

    // === REPORT 3: INDIVIDUAL KPI SCORECARD ===
    const KpiScorecard = () => {
        const scorecard = data?.scorecardData || [];

        return (
            <Card
                title={<span><TeamOutlined style={{ color: '#8b5cf6' }} /> Báo cáo 3: KPI Scorecard</span>}
                bordered={false}
                style={{ borderRadius: 16, marginBottom: 24 }}
            >
                <Row gutter={[16, 16]}>
                    {scorecard.map((rep: any) => {
                        const revPct = rep.targetRevenue > 0 ? Math.min(100, Math.round((rep.actualRevenue / rep.targetRevenue) * 100)) : 0;
                        const leadPct = rep.targetLeads > 0 ? Math.min(100, Math.round((rep.newLeads / rep.targetLeads) * 100)) : 0;
                        const actPct = rep.targetActivities > 0 ? Math.min(100, Math.round((rep.activities / rep.targetActivities) * 100)) : 0;

                        return (
                            <Col xs={24} md={8} key={rep.userId}>
                                <Card
                                    bordered
                                    size="small"
                                    style={{ borderRadius: 12, background: '#fafafa' }}
                                    title={<span style={{ fontWeight: 700 }}>{rep.userName}</span>}
                                >
                                    <div style={{ marginBottom: 12 }}>
                                        <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>💰 Doanh số</div>
                                        <Progress percent={revPct} strokeColor={revPct >= 80 ? '#10b981' : '#f59e0b'} size="small" />
                                        <div style={{ fontSize: 11, color: '#888' }}>{fmt(rep.actualRevenue)}₫ / {rep.targetRevenue > 0 ? `${fmt(rep.targetRevenue)}₫` : 'Chưa set'}</div>
                                    </div>
                                    <div style={{ marginBottom: 12 }}>
                                        <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>🎯 Lead mới</div>
                                        <Progress percent={leadPct} strokeColor="#3b82f6" size="small" />
                                        <div style={{ fontSize: 11, color: '#888' }}>{rep.newLeads} / {rep.targetLeads > 0 ? rep.targetLeads : 'N/A'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>📞 Hoạt động</div>
                                        <Progress percent={actPct} strokeColor="#8b5cf6" size="small" />
                                        <div style={{ fontSize: 11, color: '#888' }}>{rep.activities} / {rep.targetActivities > 0 ? rep.targetActivities : 'N/A'}</div>
                                    </div>
                                    <div style={{ marginTop: 12, textAlign: 'center' }}>
                                        <Tag icon={<ClockCircleOutlined />} color="default">TB {rep.avgDaysToClose} ngày chốt</Tag>
                                    </div>
                                </Card>
                            </Col>
                        );
                    })}
                    {scorecard.length === 0 && <Col span={24}><Empty description="Chưa có dữ liệu nhân sự" /></Col>}
                </Row>
            </Card>
        );
    };

    // === REPORT 4: WEIGHTED REVENUE FORECAST ===
    const RevenueForecast = () => {
        const forecast = data?.forecastData || [];
        const chartData = forecast.flatMap((d: any) => [
            { month: d.label, type: 'Thực tế', value: d.actualRevenue },
            { month: d.label, type: 'Dự báo (Weighted)', value: d.forecastRevenue },
        ]);

        return (
            <Card
                title={<span><RiseOutlined style={{ color: '#10b981' }} /> Báo cáo 4: Dự báo Doanh thu Quý</span>}
                bordered={false}
                style={{ borderRadius: 16 }}
                extra={<span style={{ fontSize: 11, color: '#888' }}>Trọng số: NEW 5% | QUALIFIED 20% | SAMPLE 50% | NEGOTIATION 80%</span>}
            >
                {chartData.length > 0 ? (
                    <Area
                        data={chartData}
                        xField="month"
                        yField="value"
                        colorField="type"
                        color={['#10b981', '#3b82f6']}
                        height={isMobile ? 250 : 320}
                        smooth
                        areaStyle={(datum: any) => ({
                            fillOpacity: datum.type?.includes('Dự báo') ? 0.1 : 0.4,
                        })}
                        line={{
                            style: (datum: any) => ({
                                lineDash: datum.type?.includes('Dự báo') ? [5, 5] : [0],
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
                ) : <Empty description="Chưa có dữ liệu" />}
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
                <h2 style={{ margin: 0, fontSize: isMobile ? 18 : 24, fontWeight: 700 }}>
                    📊 Sales Strategy Dashboard
                </h2>
                <Space wrap size={isMobile ? 'small' : 'middle'}>
                    <RangePicker
                        value={dateRange}
                        onChange={(v) => v && setDateRange(v as [dayjs.Dayjs, dayjs.Dayjs])}
                        format="DD/MM/YYYY"
                        size={isMobile ? 'small' : 'middle'}
                    />
                    <Select
                        placeholder="Nhân viên"
                        allowClear
                        style={{ width: isMobile ? 100 : 150 }}
                        size={isMobile ? 'small' : 'middle'}
                        value={salesRepFilter}
                        onChange={setSalesRepFilter}
                        options={users.map((u: any) => ({ label: u.full_name || u.username, value: u.id }))}
                    />
                    <Select
                        placeholder="Nhóm SP"
                        allowClear
                        style={{ width: isMobile ? 100 : 140 }}
                        size={isMobile ? 'small' : 'middle'}
                        value={productTypeFilter}
                        onChange={setProductTypeFilter}
                        options={[
                            { label: 'Nệm', value: 'NEM' },
                            { label: 'Balo', value: 'BALO' },
                            { label: 'Đồng phục', value: 'DONG_PHUC' },
                        ]}
                    />
                    <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading} size={isMobile ? 'small' : 'middle'} />
                </Space>
            </div>

            <Spin spinning={loading}>
                <KpiCards />
                <LeadSourceFunnel />
                <VelocityAlerts />
                <KpiScorecard />
                <RevenueForecast />
            </Spin>
        </div>
    );
};

export default SalesStrategyDashboard;
