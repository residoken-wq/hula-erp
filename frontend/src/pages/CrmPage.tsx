import React, { useEffect, useState, useMemo } from 'react';
import { Table, Button, message, Card, Modal, Form, Input, Select, Space, Timeline, Drawer, Row, Col, Statistic, Divider, Popconfirm, Tooltip, Progress, Avatar, Tag, Badge, Tabs, InputNumber, Typography } from 'antd'; // <--- Đã thêm Tabs
import { UserOutlined, ClockCircleOutlined, CheckOutlined, CloseOutlined, SendOutlined, DollarOutlined, FileTextOutlined, PlusOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, PrinterOutlined, LinkOutlined, CopyOutlined, UnorderedListOutlined, BellOutlined, SearchOutlined, FilterOutlined, RiseOutlined, TagOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import dayjs from 'dayjs';
import QuotationTemplate from '../components/QuotationTemplate';
import SalesOrderDetail from '../components/SalesOrderDetail';
import QuickTaskModal from '../components/QuickTaskModal';

const { Text } = Typography;

const CrmPage: React.FC = () => {
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('LEAD');
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState(''); // State tìm kiếm

    // Data
    const [allCustomers, setAllCustomers] = useState<any[]>([]);
    const [leads, setLeads] = useState<any[]>([]);
    const [quotes, setQuotes] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);

    // UI State
    const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
    const [followDrawerOpen, setFollowDrawerOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // Task Modal
    const [taskModalOpen, setTaskModalOpen] = useState(false);
    const [taskInitialValues, setTaskInitialValues] = useState<any>({});

    // Sales Order Detail
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<any>(null);
    const [isQuotationMode, setIsQuotationMode] = useState(false);

    // Lead Modal
    const [currentCustomer, setCurrentCustomer] = useState<any>(null);
    const [isNewCustomerMode, setIsNewCustomerMode] = useState(false);
    const [editingLeadId, setEditingLeadId] = useState<number | null>(null);
    const [formLead] = Form.useForm();
    const [followNote, setFollowNote] = useState('');

    const customerOptionsForLead = useMemo(() => allCustomers.map((c: any) => ({
        label: `${c.code} - ${c.name} (${c.phone || 'N/A'})`,
        value: c.id,
        name: c.name,
        phone: c.phone
    })), [allCustomers]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resCust, resSales, resProd, resUsers] = await Promise.all([
                api.get('/customers').catch(e => ({ data: [] })),
                api.get('/sales').catch(e => ({ data: [] })),
                api.get('/products').catch(e => ({ data: [] })),
                api.get('/users').catch(e => ({ data: [] }))
            ]);

            // Customers
            const custData = Array.isArray(resCust.data) ? resCust.data : [];
            setAllCustomers(custData);
            setLeads(custData.filter((c: any) => c.type === 'LEAD').sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));

            // Sales
            const salesData = Array.isArray(resSales.data) ? resSales.data : [];
            setQuotes(salesData.filter((s: any) => s.status === 'QUOTATION' || s.status === 'CANCELLED'));
            setOrders(salesData.filter((s: any) => !['QUOTATION', 'CANCELLED'].includes(s.status)));

            // Products
            if (Array.isArray(resProd.data)) {
                setProducts(resProd.data.map((p: any) => ({
                    label: p.name, value: p.sku, price: Number(p.base_price) || 0, unit: p.unit
                })));
            }

            // Users
            setUsers(Array.isArray(resUsers.data) ? resUsers.data : []);

        } catch (error) {
            console.error("Error fetching data:", error);
            message.error("Có lỗi khi tải dữ liệu.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // --- LOGIC LỌC DỮ LIỆU (SEARCH) ---
    const getFilteredData = (data: any[]) => {
        if (!searchText) return data;
        const lower = searchText.toLowerCase();
        return data.filter(item =>
            item.code?.toLowerCase().includes(lower) ||
            item.name?.toLowerCase().includes(lower) ||
            item.phone?.toLowerCase().includes(lower) ||
            item.customer?.name?.toLowerCase().includes(lower) ||
            item.order_code?.toLowerCase().includes(lower)
        );
    };

    // --- ACTIONS ---
    const openCreateLead = () => {
        setEditingLeadId(null);
        const autoCode = `LEAD-${dayjs().format('YYMMDD')}-${Math.floor(Math.random() * 1000)}`;
        formLead.setFieldsValue({ code: autoCode });
        formLead.resetFields(['name', 'phone', 'customer_id']);
        setIsNewCustomerMode(false);
        setIsLeadModalOpen(true);
    };

    const handleEditLead = (record: any) => {
        setEditingLeadId(record.id);
        setIsNewCustomerMode(true);
        formLead.setFieldsValue({
            code: record.code,
            name: record.name,
            phone: record.phone,
            lead_status: record.lead_status,
            potential_value: record.potential_value,
            assigned_to_id: record.assigned_to?.id // Map user
        });
        setIsLeadModalOpen(true);
    };

    const handleDeleteLead = async (id: number) => {
        try {
            await api.delete(`/customers/${id}`);
            message.success('Đã xóa Lead'); fetchData();
        } catch (e: any) { message.error('Không thể xóa'); }
    };

    const handleCreateTask = (record: any, type: 'CRM' | 'SALES') => {
        setTaskInitialValues({
            title: type === 'CRM' ? `CSKH: ${record.name}` : `Follow đơn: ${record.order_code}`,
            reference_code: type === 'CRM' ? record.code : record.order_code,
            reference_type: type,
            description: type === 'CRM' ? `SĐT: ${record.phone}` : `Khách: ${record.customer?.name}`
        });
        setTaskModalOpen(true);
    };

    const handleSaveLead = async (values: any) => {
        try {
            const { code, customer_id, name, phone, lead_status, potential_value, assigned_to_id } = values;
            const payload = {
                name, phone, lead_status,
                potential_value: Number(potential_value) || 0,
                assigned_to_id
            };

            if (editingLeadId) {
                await api.put(`/customers/${editingLeadId}`, payload);
                message.success('Cập nhật thành công!');
            } else {
                if (isNewCustomerMode) {
                    if (!name || !phone) { message.error('Nhập Tên và SĐT'); return; }
                    await api.post('/customers', { code, type: 'LEAD', ...payload });
                } else {
                    if (!customer_id) { message.error('Chọn khách hàng'); return; }
                    await api.put(`/customers/${customer_id}`, { type: 'LEAD', ...payload }); // Update existing cust to LEAD
                    await api.post(`/customers/${customer_id}/follow`, { note: `Lead created` });
                }
                message.success('Tạo Lead thành công!');
            }
            setIsLeadModalOpen(false); fetchData();
        } catch (e: any) { message.error('Lỗi lưu Lead'); }
    };

    const handleFollowLead = async () => {
        if (!followNote) return;
        try {
            await api.post(`/customers/${currentCustomer.id}/follow`, { note: followNote });
            message.success('Đã lưu ghi chú'); setFollowNote('');
            const res = await api.get(`/customers/${currentCustomer.id}`);
            setCurrentCustomer(res.data); fetchData();
        } catch (e) { message.error('Lỗi'); }
    };

    // --- Quick Status Change ---
    const handleChangeStatus = async (id: number, status: string) => {
        try {
            await api.put(`/customers/${id}`, { lead_status: status });
            message.success('Đã cập nhật trạng thái');
            fetchData();
        } catch (e) { message.error('Lỗi'); }
    };

    const statusColors: any = {
        NEW: 'blue', CONTACTED: 'cyan', QUALIFIED: 'purple', NEGOTIATION: 'orange', WON: 'green', LOST: 'red'
    };
    const statusLabels: any = {
        NEW: 'Mới', CONTACTED: 'Đã liên hệ', QUALIFIED: 'Tiềm năng', NEGOTIATION: 'Đàm phán', WON: 'Thành công', LOST: 'Thất bại'
    };

    const handleConvertQuote = async (id: number, accepted: boolean) => {
        try {
            await api.post(`/sales/${id}/convert`, { accepted });
            message.success(accepted ? 'Đã chốt báo giá!' : 'Đã hủy'); fetchData();
        } catch (e: any) { Modal.error({ title: 'Lỗi', content: e.response?.data?.message }); }
    };

    const handleDeleteQuote = async (id: number) => {
        try { await api.delete(`/sales/quote/${id}`); message.success('Đã xóa'); fetchData(); }
        catch (e: any) { message.error('Không thể xóa'); }
    };

    const openDetailModal = async (record?: any, isQuote = false) => {
        if (record) {
            try {
                const res = await api.get(`/sales/${record.order_code}`);
                setEditingOrder(res.data);
            } catch (e) { }
        } else { setEditingOrder(null); }
        setIsQuotationMode(record ? (record.status === 'QUOTATION') : isQuote);
        setDetailModalOpen(true);
    };

    const handleCopyLink = (uuid: string) => {
        if (!uuid) return message.warning('Chưa có Link');
        const link = `${window.location.protocol}//${window.location.host}/portal/quote/${uuid}`;

        if (navigator.clipboard) {
            navigator.clipboard.writeText(link).then(() => message.success('Copied!')).catch(() => { });
        } else {
            // Fallback
            const textArea = document.createElement("textarea");
            textArea.value = link;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                message.success('Copied!');
            } catch (err) {
                message.error('Oops, unable to copy');
            }
            document.body.removeChild(textArea);
        }
    };

    // --- COLUMNS DEFINITION ---
    const leadColumns = [
        {
            title: 'Ngày tạo', dataIndex: 'created_at', width: 110,
            render: (t: any) => <span style={{ color: '#888' }}>{dayjs(t).format('DD/MM/YYYY')}</span>
        },
        {
            title: 'Trạng Thái', dataIndex: 'lead_status', width: 150,
            render: (st: string, r: any) => (
                <Select
                    value={st || 'NEW'}
                    size="small"
                    style={{ width: 120 }}
                    onChange={(v) => handleChangeStatus(r.id, v)}
                    dropdownMatchSelectWidth={false}
                >
                    {Object.keys(statusLabels).map(k => (
                        <Select.Option key={k} value={k}>
                            <Tag color={statusColors[k]}>{statusLabels[k]}</Tag>
                        </Select.Option>
                    ))}
                </Select>
            )
        },
        {
            title: 'Giá Trị (Dự kiến)', dataIndex: 'potential_value', width: 140, align: 'right' as const,
            render: (v: any) => v ? <span style={{ color: '#fa8c16', fontWeight: 600 }}>{Number(v).toLocaleString()}</span> : '-'
        },
        {
            title: 'Phụ trách', dataIndex: 'assigned_to', width: 120,
            render: (u: any) => u ? <Tag color="blue">{u.full_name || u.username}</Tag> : '-'
        },
        {
            title: 'Khách Hàng', dataIndex: 'name',
            render: (t: any, r: any) => (
                <Space>
                    <Avatar style={{ backgroundColor: '#1890ff', verticalAlign: 'middle' }} size="small">
                        {t ? t.charAt(0).toUpperCase() : 'U'}
                    </Avatar>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <a onClick={() => { setCurrentCustomer(r); setFollowDrawerOpen(true) }} style={{ fontWeight: 500 }}>{t}</a>
                        <small style={{ color: '#888' }}>
                            {r.code} -
                            <Tooltip title={r.phone}>
                                <span style={{ cursor: 'pointer' }}>
                                    {r.phone && r.phone.length > 3
                                        ? '*******' + r.phone.slice(-3)
                                        : r.phone}
                                </span>
                            </Tooltip>
                        </small>
                    </div>
                </Space>
            )
        },
        {
            title: 'Tiến Độ', key: 'progress', width: 180,
            render: (_: any, r: any) => {
                const leadId = r.id;
                const myOrders = orders.filter((o: any) => o.customer?.id === leadId);
                const myQuotes = quotes.filter((q: any) => q.customer?.id === leadId);

                let pct = 10, status = 'normal', text = 'Mới tiếp cận';
                if (myQuotes.length > 0) { pct = 50; status = 'active'; text = 'Đang báo giá'; }
                if (myOrders.some((o: any) => o.status === 'SO_PENDING')) { pct = 70; status = 'active'; text = 'Chốt đơn/HĐ'; }
                if (myOrders.some((o: any) => o.status === 'DEPOSITED')) { pct = 90; status = 'success'; text = 'Đang sản xuất'; }

                return <Tooltip title={text}><Progress percent={pct} size="small" status={status as any} showInfo={false} strokeColor={pct === 90 ? '#52c41a' : '#1890ff'} /></Tooltip>
            }
        },
        {
            title: 'Ghi chú gần nhất', dataIndex: 'history', ellipsis: true,
            render: (h: any[]) => h && h.length > 0 ? (
                <Tooltip title={h[0].note}>
                    <span><ClockCircleOutlined style={{ fontSize: 10, marginRight: 5 }} /> {h[0].note}</span>
                </Tooltip>
            ) : <span style={{ color: '#ccc' }}>-</span>
        },
        {
            title: '', key: 'act', align: 'right' as const, width: 140,
            render: (_: any, r: any) => (
                <Space size="small">
                    <Tooltip title="Chăm sóc"><Button size="small" icon={<ClockCircleOutlined />} onClick={() => { setCurrentCustomer(r); setFollowDrawerOpen(true) }} /></Tooltip>
                    <Tooltip title="Tạo Nhắc nhở"><Button size="small" icon={<BellOutlined />} onClick={() => handleCreateTask(r, 'CRM')} /></Tooltip>
                    <Tooltip title="Sửa"><Button size="small" icon={<EditOutlined />} onClick={() => handleEditLead(r)} /></Tooltip>
                    <Popconfirm title="Xóa?" onConfirm={() => handleDeleteLead(r.id)}><Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
                </Space>
            )
        }
    ];

    const quoteColumns = [
        { title: 'Mã BG', dataIndex: 'order_code', render: (t: any) => <Tag color="orange">#{t}</Tag> },
        { title: 'Khách Hàng', dataIndex: 'customer', render: (c: any) => <b>{c?.name}</b> },
        { title: 'Giá Trị', dataIndex: 'total_amount', align: 'right' as const, render: (v: any) => <b style={{ color: '#cf1322' }}>{Number(v).toLocaleString()}</b> },
        { title: 'Phụ trách', dataIndex: 'assigned_to', render: (u: any) => u ? <Tag color="blue">{u.full_name || u.username}</Tag> : '-' },
        { title: 'Ngày tạo', dataIndex: 'created_at', render: (t: any) => <small>{dayjs(t).format('DD/MM/YYYY')}</small> },
        {
            title: 'Thao tác', key: 'act', align: 'center' as const, width: 220,
            render: (_: any, r: any) => r.status === 'QUOTATION' ? (
                <Space size="small">
                    <Tooltip title="Link"><Button icon={<LinkOutlined />} size="small" onClick={() => handleCopyLink(r.uuid)} /></Tooltip>
                    <Tooltip title="Xem"><Button icon={<PrinterOutlined />} size="small" onClick={() => { openDetailModal(r); setTimeout(() => setIsPreviewOpen(true), 500) }} /></Tooltip>
                    <Tooltip title="Sửa"><Button icon={<EditOutlined />} size="small" onClick={() => openDetailModal(r, true)} /></Tooltip>
                    <Tooltip title="Task"><Button size="small" icon={<BellOutlined />} onClick={() => handleCreateTask(r, 'SALES')} /></Tooltip>
                    <Popconfirm title="Xác nhận chốt đơn?" onConfirm={() => handleConvertQuote(r.id, true)}><Button type="primary" size="small" icon={<CheckOutlined />} /></Popconfirm>
                    <Popconfirm title="Xóa?" onConfirm={() => handleDeleteQuote(r.id)}><Button icon={<DeleteOutlined />} size="small" danger /></Popconfirm>
                </Space>
            ) : <Tag color="default">Đã chốt</Tag>
        }
    ];

    return (
        <div>
            {/* KPI DASHBOARD */}
            <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={8}><Card bordered={false} style={{ background: 'linear-gradient(135deg, #e6f7ff 0%, #ffffff 100%)' }}><Statistic title="Leads Tiềm Năng" value={leads.length} prefix={<UserOutlined style={{ color: '#1890ff' }} />} /></Card></Col>
                <Col span={8}><Card bordered={false} style={{ background: 'linear-gradient(135deg, #fff7e6 0%, #ffffff 100%)' }}><Statistic title="Báo Giá Đang Chờ" value={quotes.length} prefix={<FileTextOutlined style={{ color: '#fa8c16' }} />} /></Card></Col>
                <Col span={8}><Card bordered={false} style={{ background: 'linear-gradient(135deg, #f6ffed 0%, #ffffff 100%)' }}><Statistic title="Tỷ lệ chuyển đổi" value={leads.length > 0 ? ((orders.length / leads.length) * 100).toFixed(1) : 0} suffix="%" prefix={<RiseOutlined style={{ color: '#52c41a' }} />} /></Card></Col>
            </Row>

            <Card
                bodyStyle={{ padding: '12px 24px' }}
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 18 }}>Quản Lý Kinh Doanh (CRM)</span>
                        <Input prefix={<SearchOutlined />} placeholder="Tìm tên, sđt, mã..." style={{ width: 250, fontSize: 13 }} value={searchText} onChange={e => setSearchText(e.target.value)} allowClear />
                    </div>
                }
                extra={
                    <Space>
                        <Button icon={<UnorderedListOutlined />} onClick={() => navigate('/sales/pricelist')}>Bảng Giá</Button>
                        <Button icon={<ReloadOutlined />} onClick={fetchData}>Làm mới</Button>
                    </Space>
                }
            >
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    type="card"
                    items={[
                        {
                            key: 'LEAD', label: <span><UserOutlined /> Leads ({leads.length})</span>,
                            children: (
                                <>
                                    <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button type="primary" onClick={openCreateLead} icon={<PlusOutlined />}>Tạo Lead Mới</Button>
                                    </div>
                                    <Table
                                        dataSource={getFilteredData(leads)}
                                        columns={leadColumns}
                                        rowKey="id"
                                        pagination={{ pageSize: 8, showTotal: (total) => `Tổng ${total} leads` }}
                                    />
                                </>
                            )
                        },
                        {
                            key: 'QUOTE', label: <span><FileTextOutlined /> Báo Giá ({quotes.length})</span>,
                            children: (
                                <>
                                    <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button type="primary" onClick={() => openDetailModal(null, true)} icon={<PlusOutlined />}>Tạo Báo Giá</Button>
                                    </div>
                                    <Table dataSource={getFilteredData(quotes)} columns={quoteColumns} rowKey="id" pagination={{ pageSize: 8 }} />
                                </>
                            )
                        }
                    ]} />
            </Card>

            <SalesOrderDetail open={detailModalOpen} onClose={() => setDetailModalOpen(false)} onSuccess={fetchData} initialData={editingOrder} isQuotation={isQuotationMode} customers={allCustomers} products={products} users={users} />
            <Modal title="Xem Trước" open={isPreviewOpen} onCancel={() => setIsPreviewOpen(false)} footer={null} width={900}>
                <div id="printableArea"><QuotationTemplate data={editingOrder} /></div>
                <div style={{ textAlign: 'center', marginTop: 20 }}><Button type="primary" onClick={() => { const c = document.getElementById('printableArea'); const w = window.open(); if (w && c) { w.document.write(c.innerHTML); w.print(); } }}>In Ngay</Button></div>
            </Modal>
            <QuickTaskModal open={taskModalOpen} onClose={() => setTaskModalOpen(false)} initialValues={taskInitialValues} />

            <Modal title={editingLeadId ? "Cập nhật Lead" : "Tạo Lead"} open={isLeadModalOpen} onCancel={() => { setIsLeadModalOpen(false); formLead.resetFields(); }} onOk={() => formLead.submit()}>
                <Form form={formLead} layout="vertical" onFinish={handleSaveLead}>
                    <Form.Item name="code" label="Mã Lead"><Input disabled /></Form.Item>
                    {!isNewCustomerMode ? (
                        <Form.Item label="Khách hàng có sẵn" name="customer_id" rules={[{ required: !isNewCustomerMode }]}>
                            <Select showSearch placeholder="Tìm theo tên/sđt" optionFilterProp="label" options={customerOptionsForLead} allowClear />
                        </Form.Item>
                    ) : (
                        <>
                            <Divider orientation="left">KH Mới</Divider>
                            <Form.Item name="name" label="Tên KH" rules={[{ required: isNewCustomerMode }]}><Input /></Form.Item>
                            <Form.Item name="phone" label="SĐT" rules={[{ required: isNewCustomerMode }]}><Input /></Form.Item>
                        </>
                    )}
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="lead_status" label="Trạng thái" initialValue="NEW">
                                <Select>
                                    {Object.keys(statusLabels).map(k => <Select.Option key={k} value={k}>{statusLabels[k]}</Select.Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="potential_value" label="Giá trị đơn hàng (dự kiến)">
                                <InputNumber style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(value: any) => value.replace(/\$\s?|(,*)/g, '')} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row>
                        <Col span={24}>
                            <Form.Item name="assigned_to_id" label="Nhân viên phụ trách">
                                <Select allowClear showSearch optionFilterProp="label" options={users.map(u => ({ label: u.full_name || u.username, value: u.id }))} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Button type="link" onClick={() => { setIsNewCustomerMode(!isNewCustomerMode); formLead.resetFields(['name', 'phone', 'customer_id']); }}>
                        {isNewCustomerMode ? "Chọn KH có sẵn" : "+ Thêm KH Mới"}
                    </Button>
                </Form>
            </Modal>

            <Drawer title={`Chăm sóc: ${currentCustomer?.name}`} width={400} open={followDrawerOpen} onClose={() => setFollowDrawerOpen(false)} footer={<Button type="primary" block onClick={() => { setFollowDrawerOpen(false); setEditingOrder({ customer_id: currentCustomer.id }); setIsQuotationMode(true); setDetailModalOpen(true); }}>Tạo Báo Giá Ngay</Button>}>
                <div style={{ marginBottom: 20 }}><Input.TextArea rows={3} value={followNote} onChange={e => setFollowNote(e.target.value)} placeholder="Nhập nội dung trao đổi..." /><Button block type="primary" style={{ marginTop: 10 }} onClick={handleFollowLead}>Lưu Ghi Chú</Button></div>
                <Divider>Lịch sử tương tác</Divider>
                <Timeline mode="left">{currentCustomer?.history?.map((h: any, i: number) => <Timeline.Item key={i} color="blue" label={<span style={{ fontSize: 11, color: '#999' }}>{dayjs(h.date).format('DD/MM HH:mm')}</span>}>{h.note}</Timeline.Item>)}</Timeline>
            </Drawer>
        </div>
    );
};

export default CrmPage;