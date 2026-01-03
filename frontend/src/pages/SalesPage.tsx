import React, { useEffect, useState, useMemo } from 'react';
import { Table, Tag, Button, message, Card, Input, Space, Row, Col, Tabs, Progress, Tooltip, Statistic, DatePicker, Select } from 'antd';
// --- FIX: Thêm PlusOutlined đã bị thiếu trước đó ---
import { PlusOutlined, ReloadOutlined, DollarOutlined, SearchOutlined, BellOutlined, EditOutlined, LinkOutlined, ShoppingCartOutlined, FileTextOutlined, CalendarOutlined, WalletOutlined, AuditOutlined, AppstoreAddOutlined, ShopOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import QuickTaskModal from '../components/QuickTaskModal';
import SalesOrderDetail from '../components/SalesOrderDetail';

dayjs.extend(isBetween);

const { RangePicker } = DatePicker;

const SalesPage: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('ALL');
    const [searchText, setSearchText] = useState('');
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);

    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);

    // State Modals
    const [taskModalOpen, setTaskModalOpen] = useState(false);
    const [taskInitialValues, setTaskInitialValues] = useState<any>({});
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<any>(null);

    // --- STATS FILTER STATE ---
    const [selectedYear, setSelectedYear] = useState(dayjs().year());
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

    // Generate years (e.g., current year - 2 to current year + 2)
    const years = Array.from({ length: 5 }, (_, i) => dayjs().year() - 2 + i);

    const handleMonthClick = (month: number) => {
        setSelectedMonth(month);
        const start = dayjs().year(selectedYear).month(month - 1).startOf('month');
        const end = dayjs().year(selectedYear).month(month - 1).endOf('month');
        setDateRange([start, end]);
    };

    const handleYearChange = (val: number) => {
        setSelectedYear(val);
        // If a month is already selected, update range for new year
        if (selectedMonth !== null) {
            const start = dayjs().year(val).month(selectedMonth - 1).startOf('month');
            const end = dayjs().year(val).month(selectedMonth - 1).endOf('month');
            setDateRange([start, end]);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resSales, resProd, resCust, resUsers] = await Promise.all([
                api.get('/sales').catch(e => ({ data: [] })),
                api.get('/products').catch(e => ({ data: [] })),
                api.get('/customers').catch(e => ({ data: [] })),
                api.get('/users').catch(e => ({ data: [] }))
            ]);

            setData(Array.isArray(resSales.data) ? resSales.data : []);

            if (Array.isArray(resProd.data)) {
                setProducts(resProd.data.map((p: any) => ({
                    label: p.name,
                    value: p.sku,
                    price: Number(p.base_price) || 0,
                    unit: p.unit,
                    description: p.customer_description,
                    type: p.product_type,
                    quantity_in_stock: p.quantity_in_stock
                })));
            }
            setCustomers(Array.isArray(resCust.data) ? resCust.data : []);
            setUsers(Array.isArray(resUsers.data) ? resUsers.data : []);
        } catch (e) {
            console.error("Error fetching data:", e);
            message.error('Lỗi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // --- ACTIONS ---
    const handleCreateTask = (record: any) => {
        setTaskInitialValues({
            title: `Theo dõi đơn: ${record.order_code}`,
            reference_code: record.order_code,
            reference_type: 'SALES',
            description: `Khách: ${record.customer?.name || record.customer_name}`
        });
        setTaskModalOpen(true);
    };

    const openDetailModal = async (record?: any) => {
        if (record && record.order_code) {
            try {
                const res = await api.get(`/sales/${record.order_code}`);
                setEditingOrder(res.data);
            } catch (e) { message.error('Không tải được chi tiết đơn'); return; }
        } else {
            // New Order (Standard or Internal)
            setEditingOrder(record);
        }
        setDetailModalOpen(true);
    };

    const handleCopyLink = (uuid: string) => {
        if (!uuid) return message.warning('Chưa có Link');
        const link = `${window.location.protocol}//${window.location.host}/portal/quote/${uuid}`;

        if (navigator.clipboard) {
            navigator.clipboard.writeText(link).then(() => message.success('Đã copy Link Portal!')).catch(() => message.error('Không thể copy'));
        } else {
            // Fallback
            const textArea = document.createElement("textarea");
            textArea.value = link;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                message.success('Đã copy Link Portal!');
            } catch (err) {
                message.error('Không thể copy link');
            }
            document.body.removeChild(textArea);
        }
    };

    // --- FILTERING LOGIC ---
    const filteredData = useMemo(() => {
        return data.filter((x: any) => {
            const matchTab = activeTab === 'ALL'
                ? true
                : activeTab === 'DELIVERED'
                    ? (x.status === 'DELIVERED' || x.status === 'PARTIAL_DELIVERY')
                    : x.status === activeTab;
            const matchSearch = x.order_code?.toLowerCase().includes(searchText.toLowerCase())
                || x.customer_name?.toLowerCase().includes(searchText.toLowerCase())
                || x.customer?.name?.toLowerCase().includes(searchText.toLowerCase());

            let matchDate = true;
            if (dateRange[0] && dateRange[1]) {
                const orderDate = dayjs(x.order_date);
                matchDate = orderDate.isBetween(dateRange[0], dateRange[1], 'day', '[]');
            }

            return matchTab && matchSearch && matchDate;
        });
    }, [data, activeTab, searchText, dateRange]);

    // --- METRICS ---
    const metrics = useMemo(() => {
        // FIX: Include QUOTATION in metrics so the user sees the value of what is listed
        const validOrders = filteredData.filter(x => x.status !== 'CANCELLED');
        const totalRevenue = validOrders.reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0);

        // FIX: Lấy paid_amount từ API (đã được fix ở Backend để tính tổng Transaction)
        const totalPaid = validOrders.reduce((acc, curr) => acc + Number(curr.paid_amount || 0), 0);

        const totalRemaining = totalRevenue - totalPaid;
        const processingCount = validOrders.filter(x => ['SO_PENDING', 'SAMPLE_APPROVED', 'DEPOSITED', 'QUOTATION'].includes(x.status)).length; // Include QUOTATION in processing? Or just count?

        return { totalRevenue, totalPaid, totalRemaining, count: validOrders.length, processingCount };
    }, [filteredData]);

    // --- COLUMNS ---
    const columns = [
        {
            title: 'Mã Đơn', dataIndex: 'order_code', width: 140,
            render: (t: any, r: any) => <a onClick={() => openDetailModal(r)}><b>{t}</b></a>
        },
        {
            title: 'Khách Hàng',
            render: (r: any) => <span style={{ fontWeight: 500 }}>{r.customer?.name || r.customer_name || 'Khách lẻ'}</span>
        },
        {
            title: 'Ngày Đặt', dataIndex: 'order_date', width: 110,
            render: (t: any) => <span style={{ color: '#666' }}>{dayjs(t).format('DD/MM/YYYY')}</span>
        },
        {
            title: 'Ngày Giao', dataIndex: 'delivery_date', width: 110,
            render: (t: any) => t ? <span style={{ color: '#1890ff' }}>{dayjs(t).format('DD/MM/YYYY')}</span> : '-'
        },
        {
            title: 'Doanh Thu', dataIndex: 'total_amount', align: 'right' as const, width: 130,
            render: (v: any) => <b style={{ color: '#cf1322' }}>{Number(v).toLocaleString()}</b>
        },
        {
            title: 'Đã Thu', dataIndex: 'paid_amount', align: 'right' as const, width: 130,
            render: (v: any) => <span style={{ color: '#389e0d' }}>{Number(v).toLocaleString()}</span>
        },
        {
            title: 'Còn Lại', key: 'remaining', align: 'right' as const, width: 130,
            render: (r: any) => {
                const total = Number(r.total_amount) || 0;
                const paid = Number(r.paid_amount) || 0;
                const remain = total - paid;
                return <span style={{ color: remain > 0 ? '#fa541c' : '#999' }}>{remain.toLocaleString()}</span>
            }
        },
        {
            title: 'Nhân sự', dataIndex: 'assigned_to', width: 120,
            render: (u: any) => u ? <Tag color="blue">{u.full_name || u.username}</Tag> : '-'
        },
        {
            title: 'Trạng Thái', dataIndex: 'status', align: 'center' as const, width: 120,
            render: (t: any) => {
                let color = 'default';
                let label = t;
                if (t === 'QUOTATION') { color = 'orange'; label = 'Báo Giá'; }
                if (t === 'SO_PENDING') { color = 'processing'; label = 'Mới'; }
                if (t === 'SAMPLE_APPROVED') { color = 'cyan'; label = 'Đã Duyệt'; }
                if (t === 'DEPOSITED') { color = 'purple'; label = 'Đã Cọc'; }
                if (t === 'IN_PRODUCTION') { color = 'blue'; label = 'Đang SX'; }
                if (t === 'MANUFACTURING_COMPLETED') { color = 'gold'; label = 'Xong SX'; }
                if (t === 'COMPLETED') { color = 'success'; label = 'Hoàn Thành'; }
                if (t === 'DELIVERED') { color = 'geekblue'; label = 'Đã Giao'; }
                if (t === 'CANCELLED') { color = 'error'; label = 'Hủy'; }
                return <Tag color={color}>{label}</Tag>
            }
        },
        {
            title: 'Thanh Toán', dataIndex: 'payment_status', width: 140,
            render: (t: any, r: any) => {
                const total = Number(r.total_amount) || 0;
                const paid = Number(r.paid_amount) || 0;
                const pct = total > 0 ? Math.min(Math.round((paid / total) * 100), 100) : 0;

                return (
                    <Tooltip title={`Đã trả: ${paid.toLocaleString()} / ${total.toLocaleString()}`}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Progress percent={pct} size="small" steps={5} strokeColor={pct >= 100 ? '#52c41a' : '#1890ff'} showInfo={false} />
                            <span style={{ fontSize: 11, color: pct >= 100 ? 'green' : '#666' }}>{pct}%</span>
                        </div>
                    </Tooltip>
                )
            }
        },
        {
            title: '', key: 'act', width: 120, align: 'right' as const,
            render: (r: any) => (
                <Space size={2}>
                    <Tooltip title="Xem/Sửa">
                        <Button type="text" size="small" icon={<EditOutlined style={{ color: '#1890ff' }} />} onClick={() => openDetailModal(r)} />
                    </Tooltip>
                    <Tooltip title="Nhắc nhở">
                        <Button type="text" size="small" icon={<BellOutlined style={{ color: '#fa8c16' }} />} onClick={() => handleCreateTask(r)} />
                    </Tooltip>
                    <Tooltip title="Copy Link KH">
                        <Button type="text" size="small" icon={<LinkOutlined style={{ color: '#52c41a' }} />} onClick={() => handleCopyLink(r.uuid)} />
                    </Tooltip>
                </Space>
            )
        }
    ];

    return (
        <div>
            <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                        <span style={{ fontSize: 16, fontWeight: 600, color: '#555', whiteSpace: 'nowrap' }}><CalendarOutlined /> Thống kê theo kỳ:</span>

                        {/* Year Select */}
                        <Select
                            value={selectedYear}
                            onChange={handleYearChange}
                            style={{ width: 120 }}
                            options={years.map(y => ({ label: `Năm ${y}`, value: y }))}
                        />

                        {/* Month Blocks */}
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
                                const isActive = selectedMonth === m;
                                return (
                                    <div
                                        key={m}
                                        onClick={() => handleMonthClick(m)}
                                        style={{
                                            padding: '4px 12px',
                                            borderRadius: 4,
                                            cursor: 'pointer',
                                            border: isActive ? '1px solid #1890ff' : '1px solid #d9d9d9',
                                            background: isActive ? '#e6f7ff' : '#fff',
                                            color: isActive ? '#1890ff' : '#666',
                                            fontSize: 13,
                                            transition: 'all 0.2s',
                                            fontWeight: isActive ? 500 : 400
                                        }}
                                        onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.borderColor = '#40a9ff'; }}
                                        onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.borderColor = '#d9d9d9'; }}
                                    >
                                        T{m}
                                    </div>
                                )
                            })}
                            {/* ALL BLOCK */}
                            <div
                                onClick={() => {
                                    setSelectedMonth(null);
                                    const start = dayjs().year(selectedYear).startOf('year');
                                    const end = dayjs().year(selectedYear).endOf('year');
                                    setDateRange([start, end]);
                                }}
                                style={{
                                    padding: '4px 12px',
                                    borderRadius: 4,
                                    cursor: 'pointer',
                                    border: selectedMonth === null ? '1px solid #722ed1' : '1px solid #d9d9d9',
                                    background: selectedMonth === null ? '#f9f0ff' : '#fff',
                                    color: selectedMonth === null ? '#722ed1' : '#666',
                                    fontSize: 13,
                                    transition: 'all 0.2s',
                                    fontWeight: selectedMonth === null ? 500 : 400
                                }}
                                onMouseEnter={(e) => { if (selectedMonth !== null) e.currentTarget.style.borderColor = '#b37feb'; }}
                                onMouseLeave={(e) => { if (selectedMonth !== null) e.currentTarget.style.borderColor = '#d9d9d9'; }}
                            >
                                All
                            </div>
                        </div>
                    </div>



                    <RangePicker
                        style={{ width: 260 }}
                        placeholder={['Từ ngày', 'Đến ngày']}
                        value={dateRange as any} // Ensure value is controlled if we want to reflect month clicks
                        onChange={(dates) => {
                            setDateRange(dates as any);
                            if (dates) setSelectedMonth(null); // Clear specific month block selection if manual range is picked
                        }}
                    />
                </div>

                <Row gutter={16}>
                    <Col span={5}>
                        <Card bordered={false} bodyStyle={{ padding: 12 }} style={{ background: '#f9f0ff', border: '1px solid #d3adf7' }}>
                            <Statistic title="Tổng Giá Trị" value={metrics.totalRevenue} precision={0} suffix="₫" prefix={<DollarOutlined style={{ color: '#722ed1' }} />} valueStyle={{ fontSize: 18, fontWeight: 'bold' }} />
                        </Card>
                    </Col>
                    <Col span={5}>
                        <Card bordered={false} bodyStyle={{ padding: 12 }} style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                            <Statistic title="Đã Thực Thu" value={metrics.totalPaid} precision={0} suffix="₫" prefix={<WalletOutlined style={{ color: '#52c41a' }} />} valueStyle={{ fontSize: 18, fontWeight: 'bold', color: '#389e0d' }} />
                        </Card>
                    </Col>
                    <Col span={5}>
                        <Card bordered={false} bodyStyle={{ padding: 12 }} style={{ background: '#fff2e8', border: '1px solid #ffbb96' }}>
                            <Statistic title="Công Nợ / Còn Lại" value={metrics.totalRemaining} precision={0} suffix="₫" prefix={<AuditOutlined style={{ color: '#fa541c' }} />} valueStyle={{ fontSize: 18, fontWeight: 'bold', color: '#cf1322' }} />
                        </Card>
                    </Col>
                    <Col span={4}>
                        <Card bordered={false} bodyStyle={{ padding: 12 }} style={{ background: '#e6f7ff', border: '1px solid #91d5ff' }}>
                            <Statistic title="Số Đơn Hàng" value={metrics.count} prefix={<ShoppingCartOutlined style={{ color: '#1890ff' }} />} valueStyle={{ fontSize: 18 }} />
                        </Card>
                    </Col>
                    <Col span={5}>
                        <Card bordered={false} bodyStyle={{ padding: 12 }} style={{ background: '#fffbe6', border: '1px solid #ffe58f' }}>
                            <Statistic title="Đang Xử Lý" value={metrics.processingCount} prefix={<FileTextOutlined style={{ color: '#fa8c16' }} />} valueStyle={{ fontSize: 18 }} />
                        </Card>
                    </Col>
                </Row>
            </div>

            <Card
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 18, fontWeight: 600 }}>Quản Lý Đơn Hàng (SO)</span>
                        <Input prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />} placeholder="Tìm mã đơn, tên khách..." value={searchText} onChange={e => setSearchText(e.target.value)} style={{ width: 250 }} allowClear />
                    </div>
                }
                extra={
                    <Space>
                        <Button type="dashed" icon={<AppstoreAddOutlined />} onClick={() => openDetailModal({ isInternal: true })} style={{ borderColor: '#722ed1', color: '#722ed1' }}>Tạo Đơn Nhập Kho (Nội Bộ)</Button>
                        <Button type="default" icon={<ShopOutlined />} onClick={() => navigate('/sales/pos')} style={{ borderColor: '#52c41a', color: '#52c41a' }}>Bán Lẻ (POS)</Button>
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => openDetailModal(null)}>Tạo Đơn Mới</Button>
                        <Button icon={<ReloadOutlined />} onClick={fetchData}>Làm mới</Button>
                    </Space>
                }
                bodyStyle={{ padding: '0 24px 24px' }}
            >
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={[
                        { key: 'ALL', label: 'Tất cả' },
                        { key: 'SO_PENDING', label: 'Chờ Duyệt' },
                        { key: 'SAMPLE_APPROVED', label: 'Đã Duyệt Mẫu' },
                        { key: 'DEPOSITED', label: 'Đã Cọc' },
                        { key: 'IN_PRODUCTION', label: 'Đang Sản Xuất' },
                        { key: 'MANUFACTURING_COMPLETED', label: 'Hoàn Thành SX' },
                        { key: 'DELIVERED', label: 'Đã Giao' },
                        { key: 'COMPLETED', label: 'Hoàn Thành' },
                        { key: 'QUOTATION', label: 'Báo Giá (Draft)' },
                    ]}
                    style={{ marginBottom: 16 }}
                />

                <Table
                    dataSource={filteredData}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Tổng ${total} đơn hàng` }}
                    size="middle"
                />

                {/* MODALS */}
                <QuickTaskModal open={taskModalOpen} onClose={() => setTaskModalOpen(false)} initialValues={taskInitialValues} />

                <SalesOrderDetail
                    open={detailModalOpen}
                    onClose={() => setDetailModalOpen(false)}
                    onSuccess={fetchData}
                    initialData={editingOrder}
                    customers={customers}
                    products={products}
                    users={users} // Pass users list
                    isQuotation={false}
                />
            </Card>
        </div >
    );
};

export default SalesPage;