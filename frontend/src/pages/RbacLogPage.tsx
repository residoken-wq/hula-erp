import React, { useEffect, useState, useCallback } from 'react';
import {
    Card, Tabs, Table, Tag, Segmented, Button, DatePicker, Select,
    Space, Tooltip, Modal, message, Typography, Row, Col, Alert, Badge
} from 'antd';
import {
    SafetyCertificateOutlined, ReloadOutlined, DownloadOutlined,
    ExclamationCircleOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import api from '../utils/api';
import dayjs from 'dayjs';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface RbacLogItem {
    id: string;
    timestamp: string;
    username: string | null;
    ip: string | null;
    route: string;
    method: string;
    required: string | null;
    decision: string;
    mode: string;
}

interface UnclassifiedRouteItem {
    route: string;
    method: string;
    hit_count: number;
    first_seen: string;
    last_seen: string;
}

const METHOD_COLORS: Record<string, string> = {
    GET: 'blue',
    POST: 'green',
    PUT: 'orange',
    DELETE: 'red',
    PATCH: 'purple',
};

const parseRequired = (requiredStr: string | null) => {
    if (!requiredStr) return { module: '-', action: '-' };
    try {
        if (requiredStr.startsWith('{')) {
            const parsed = JSON.parse(requiredStr);
            return {
                module: parsed.module || '-',
                action: parsed.action || '-'
            };
        }
    } catch {
        // Fallback for non-JSON format
    }
    if (requiredStr.includes(':')) {
        const [mod, act] = requiredStr.split(':');
        return { module: mod, action: act || '-' };
    }
    return { module: requiredStr, action: '-' };
};

const getReasonText = (decision: string, requiredStr: string | null, mode: string) => {
    switch (decision) {
        case 'ALLOW':
            return 'Được cấp quyền hợp lệ';
        case 'SHADOW_DENIED': {
            const { module, action } = parseRequired(requiredStr);
            return `Thiếu quyền [${module}:${action}] (Bỏ qua vì ở chế độ SHADOW)`;
        }
        case 'DENIED': {
            const { module, action } = parseRequired(requiredStr);
            return `Bị chặn: thiếu quyền [${module}:${action}]`;
        }
        case 'UNCLASSIFIED':
            return 'Route chưa được phân hạng (@Perm/@Public)';
        default:
            return decision;
    }
};

const RbacLogPage: React.FC = () => {
    // RBAC Mode
    const [currentMode, setCurrentMode] = useState<string>('SHADOW');
    const [modeLoading, setModeLoading] = useState(false);

    // Logs (Tab 1)
    const [logs, setLogs] = useState<RbacLogItem[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
        dayjs().subtract(7, 'day').startOf('day'),
        dayjs().endOf('day')
    ]);
    const [decisionFilter, setDecisionFilter] = useState<string>('ALL');

    // Unclassified (Tab 2)
    const [unclassified, setUnclassified] = useState<UnclassifiedRouteItem[]>([]);
    const [unclassifiedLoading, setUnclassifiedLoading] = useState(false);

    // Fetch Mode
    const fetchMode = useCallback(async () => {
        setModeLoading(true);
        try {
            const res = await api.get('/auth/rbac/mode');
            if (res.data?.mode) {
                setCurrentMode(res.data.mode);
            }
        } catch (err: any) {
            console.error('Lỗi tải chế độ RBAC:', err);
        } finally {
            setModeLoading(false);
        }
    }, []);

    // Fetch Logs
    const fetchLogs = useCallback(async () => {
        setLogsLoading(true);
        try {
            const from = dateRange[0].toISOString();
            const to = dateRange[1].toISOString();
            const res = await api.get('/auth/rbac/report', {
                params: {
                    from,
                    to,
                    decision: decisionFilter !== 'ALL' ? decisionFilter : undefined
                }
            });
            if (Array.isArray(res.data)) {
                setLogs(res.data);
            }
        } catch (err: any) {
            message.error(err.response?.data?.message || 'Lỗi tải danh sách nhật ký RBAC');
        } finally {
            setLogsLoading(false);
        }
    }, [dateRange, decisionFilter]);

    // Fetch Unclassified
    const fetchUnclassified = useCallback(async () => {
        setUnclassifiedLoading(true);
        try {
            const res = await api.get('/auth/rbac/unclassified');
            if (Array.isArray(res.data)) {
                setUnclassified(res.data);
            }
        } catch (err: any) {
            message.error(err.response?.data?.message || 'Lỗi tải danh sách route chưa phân hạng');
        } finally {
            setUnclassifiedLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMode();
        fetchLogs();
    }, [fetchMode, fetchLogs]);

    const handleModeChange = (newMode: string) => {
        if (newMode === currentMode) return;

        Modal.confirm({
            title: `Xác nhận đổi chế độ RBAC sang [${newMode}]?`,
            icon: <ExclamationCircleOutlined />,
            content: newMode === 'OFF'
                ? 'Ở chế độ OFF, hệ thống sẽ bỏ qua kiểm tra quyền RBAC đối với mọi request.'
                : 'Ở chế độ SHADOW, hệ thống sẽ ghi log các vi phạm quyền mà không chặn request của người dùng.',
            okText: 'Xác nhận',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    const res = await api.put('/auth/rbac/mode', { mode: newMode });
                    setCurrentMode(res.data.mode);
                    message.success(`Đã chuyển RBAC sang chế độ ${res.data.mode}`);
                } catch (e: any) {
                    message.error(e.response?.data?.message || 'Không thể đổi chế độ RBAC');
                }
            }
        });
    };

    // Export to Excel
    const handleExportExcel = async () => {
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('RBAC Access Logs');

            worksheet.columns = [
                { header: 'Thời gian', key: 'timestamp', width: 22 },
                { header: 'Tài khoản', key: 'username', width: 18 },
                { header: 'IP', key: 'ip', width: 16 },
                { header: 'Đường dẫn (Route)', key: 'route', width: 32 },
                { header: 'Phương thức', key: 'method', width: 12 },
                { header: 'Phân hệ', key: 'module', width: 18 },
                { header: 'Hành động', key: 'action', width: 14 },
                { header: 'Quyết định', key: 'decision', width: 18 },
                { header: 'Chế độ', key: 'mode', width: 12 },
                { header: 'Chi tiết / Lý do', key: 'reason', width: 45 },
            ];

            // Header styling
            worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF1890FF' }
            };

            logs.forEach(log => {
                const { module, action } = parseRequired(log.required);
                worksheet.addRow({
                    timestamp: log.timestamp ? dayjs(log.timestamp).format('YYYY-MM-DD HH:mm:ss') : '-',
                    username: log.username || '(Anonymous)',
                    ip: log.ip || '-',
                    route: log.route,
                    method: log.method,
                    module,
                    action,
                    decision: log.decision,
                    mode: log.mode,
                    reason: getReasonText(log.decision, log.required, log.mode),
                });
            });

            const buffer = await workbook.xlsx.writeBuffer();
            saveAs(new Blob([buffer]), `RBAC_Report_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`);
            message.success('Xuất file Excel thành công');
        } catch (err) {
            console.error('Lỗi xuất Excel:', err);
            message.error('Không thể xuất file Excel');
        }
    };

    const getModeBadge = (mode: string) => {
        switch (mode) {
            case 'OFF':
                return <Tag color="default" style={{ fontSize: 13, padding: '4px 10px' }}>OFF (Không kiểm tra)</Tag>;
            case 'SHADOW':
                return <Tag color="warning" style={{ fontSize: 13, padding: '4px 10px' }}>SHADOW (Ghi log vi phạm, không chặn)</Tag>;
            case 'ENFORCE':
                return <Tag color="success" style={{ fontSize: 13, padding: '4px 10px' }}>ENFORCE (Chặn truy cập trái phép)</Tag>;
            default:
                return <Tag>{mode}</Tag>;
        }
    };

    const logColumns = [
        {
            title: 'Thời gian',
            dataIndex: 'timestamp',
            key: 'timestamp',
            width: 170,
            render: (val: string) => val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : '-'
        },
        {
            title: 'Tài khoản',
            dataIndex: 'username',
            key: 'username',
            width: 130,
            render: (user: string | null) => user ? (
                <Tag color={user === 'admin' ? 'gold' : 'blue'}><b>{user}</b></Tag>
            ) : <span style={{ color: '#999' }}>(Ẩn danh)</span>
        },
        {
            title: 'IP',
            dataIndex: 'ip',
            key: 'ip',
            width: 130,
            render: (ip: string | null) => ip || '-'
        },
        {
            title: 'Đường dẫn (Route)',
            dataIndex: 'route',
            key: 'route',
            render: (route: string) => (
                <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>{route}</code>
            )
        },
        {
            title: 'Phương thức',
            dataIndex: 'method',
            key: 'method',
            width: 90,
            render: (method: string) => (
                <Tag color={METHOD_COLORS[method] || 'default'}>{method}</Tag>
            )
        },
        {
            title: 'Phân hệ & Quyền',
            key: 'required',
            width: 170,
            render: (_: any, r: RbacLogItem) => {
                const { module, action } = parseRequired(r.required);
                if (module === '-') return <span style={{ color: '#999' }}>-</span>;
                return (
                    <Space size={4}>
                        <Tag color="cyan">{module}</Tag>
                        <Tag>{action}</Tag>
                    </Space>
                );
            }
        },
        {
            title: 'Quyết định',
            dataIndex: 'decision',
            key: 'decision',
            width: 140,
            render: (dec: string) => {
                switch (dec) {
                    case 'ALLOW':
                        return <Tag color="success">ALLOW</Tag>;
                    case 'SHADOW_DENIED':
                        return <Tag color="gold">SHADOW_DENIED</Tag>;
                    case 'DENIED':
                        return <Tag color="error">DENIED</Tag>;
                    case 'UNCLASSIFIED':
                        return <Tag color="default">UNCLASSIFIED</Tag>;
                    default:
                        return <Tag>{dec}</Tag>;
                }
            }
        },
        {
            title: 'Chi tiết / Lý do',
            key: 'reason',
            render: (_: any, r: RbacLogItem) => (
                <Text type={r.decision === 'SHADOW_DENIED' ? 'warning' : undefined} style={{ fontSize: 12 }}>
                    {getReasonText(r.decision, r.required, r.mode)}
                </Text>
            )
        }
    ];

    const unclassifiedColumns = [
        {
            title: 'Đường dẫn (Route)',
            dataIndex: 'route',
            key: 'route',
            render: (route: string) => (
                <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>{route}</code>
            )
        },
        {
            title: 'Phương thức',
            dataIndex: 'method',
            key: 'method',
            width: 100,
            render: (method: string) => (
                <Tag color={METHOD_COLORS[method] || 'default'}>{method}</Tag>
            )
        },
        {
            title: 'Số lần gọi (Hit Count)',
            dataIndex: 'hit_count',
            key: 'hit_count',
            width: 160,
            sorter: (a: UnclassifiedRouteItem, b: UnclassifiedRouteItem) => a.hit_count - b.hit_count,
            render: (count: number) => (
                <Badge count={count} overflowCount={99999} style={{ backgroundColor: '#108ee9' }} />
            )
        },
        {
            title: 'Lần đầu ghi nhận',
            dataIndex: 'first_seen',
            key: 'first_seen',
            width: 180,
            render: (val: string) => val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : '-'
        },
        {
            title: 'Lần cuối ghi nhận',
            dataIndex: 'last_seen',
            key: 'last_seen',
            width: 180,
            render: (val: string) => val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : '-'
        }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header / Mode Status */}
            <Card>
                <Row align="middle" justify="space-between" gutter={[16, 16]}>
                    <Col>
                        <Space align="center" size={12}>
                            <SafetyCertificateOutlined style={{ fontSize: 28, color: '#1890ff' }} />
                            <div>
                                <Title level={4} style={{ margin: 0 }}>Quản trị Phân quyền RBAC & Nhật ký Truy cập</Title>
                                <Text type="secondary">Giám sát và kiểm soát phân quyền hệ thống</Text>
                            </div>
                        </Space>
                    </Col>
                    <Col>
                        <Space align="center" size={16}>
                            <Space size={6}>
                                <Text strong>Chế độ hiện tại:</Text>
                                {getModeBadge(currentMode)}
                            </Space>

                            <Segmented
                                options={[
                                    { label: 'OFF', value: 'OFF' },
                                    { label: 'SHADOW', value: 'SHADOW' },
                                    {
                                        label: (
                                            <Tooltip title="Mở ở Phase 2">
                                                <span style={{ color: '#bbb' }}>ENFORCE</span>
                                            </Tooltip>
                                        ),
                                        value: 'ENFORCE',
                                        disabled: true
                                    }
                                ]}
                                value={currentMode}
                                onChange={(val) => handleModeChange(val as string)}
                                disabled={modeLoading}
                            />
                        </Space>
                    </Col>
                </Row>
            </Card>

            {/* Tabs */}
            <Card>
                <Tabs
                    defaultActiveKey="report"
                    items={[
                        {
                            key: 'report',
                            label: '🛡️ Báo cáo Quyền',
                            children: (
                                <div>
                                    {/* Filters */}
                                    <Row justify="space-between" align="middle" style={{ marginBottom: 16 }} gutter={[12, 12]}>
                                        <Col>
                                            <Space wrap>
                                                <RangePicker
                                                    value={dateRange}
                                                    onChange={(dates) => {
                                                        if (dates && dates[0] && dates[1]) {
                                                            setDateRange([dates[0].startOf('day'), dates[1].endOf('day')]);
                                                        }
                                                    }}
                                                    format="YYYY-MM-DD"
                                                />
                                                <Select
                                                    value={decisionFilter}
                                                    onChange={setDecisionFilter}
                                                    style={{ width: 220 }}
                                                    options={[
                                                        { label: 'Tất cả quyết định', value: 'ALL' },
                                                        { label: 'ALLOW (Hợp lệ)', value: 'ALLOW' },
                                                        { label: 'SHADOW_DENIED (Vi phạm)', value: 'SHADOW_DENIED' },
                                                        { label: 'DENIED (Bị chặn)', value: 'DENIED' },
                                                        { label: 'UNCLASSIFIED (Chưa phân hạng)', value: 'UNCLASSIFIED' },
                                                    ]}
                                                />
                                                <Button
                                                    icon={<ReloadOutlined />}
                                                    onClick={fetchLogs}
                                                    loading={logsLoading}
                                                >
                                                    Tải lại
                                                </Button>
                                            </Space>
                                        </Col>
                                        <Col>
                                            <Button
                                                type="primary"
                                                icon={<DownloadOutlined />}
                                                onClick={handleExportExcel}
                                                disabled={logs.length === 0}
                                            >
                                                Xuất Excel ({logs.length} bản ghi)
                                            </Button>
                                        </Col>
                                    </Row>

                                    <Table
                                        dataSource={logs}
                                        columns={logColumns}
                                        rowKey="id"
                                        loading={logsLoading}
                                        pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'] }}
                                        scroll={{ x: 1000 }}
                                    />
                                </div>
                            )
                        },
                        {
                            key: 'unclassified',
                            label: '⚠️ Route chưa phân hạng',
                            children: (
                                <div>
                                    <Alert
                                        type="info"
                                        showIcon
                                        icon={<InfoCircleOutlined />}
                                        message="Các route chưa phân hạng"
                                        description="Danh sách các API đã nhận request nhưng chưa được khai báo decorator phân quyền (@Perm, @AnyPerm, @AuthOnly, @Public). Cần phân loại các route này trước khi kích hoạt ENFORCE."
                                        style={{ marginBottom: 16 }}
                                    />

                                    <Row justify="end" style={{ marginBottom: 12 }}>
                                        <Button
                                            icon={<ReloadOutlined />}
                                            onClick={fetchUnclassified}
                                            loading={unclassifiedLoading}
                                        >
                                            Làm mới
                                        </Button>
                                    </Row>

                                    <Table
                                        dataSource={unclassified}
                                        columns={unclassifiedColumns}
                                        rowKey={(r) => `${r.method}_${r.route}`}
                                        loading={unclassifiedLoading}
                                        pagination={{ pageSize: 20 }}
                                    />
                                </div>
                            )
                        }
                    ]}
                    onChange={(activeKey) => {
                        if (activeKey === 'unclassified' && unclassified.length === 0) {
                            fetchUnclassified();
                        }
                    }}
                />
            </Card>
        </div>
    );
};

export default RbacLogPage;
