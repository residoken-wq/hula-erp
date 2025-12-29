import React, { useEffect, useState } from 'react';
import {
    Card, Row, Col, Statistic, Table, Button, Tabs, Modal, Form,
    Input, Select, DatePicker, Tag, message, Popconfirm,
    Radio, InputNumber, Space, Segmented, Divider
} from 'antd';
import { Pie, Column } from '@ant-design/plots';
import {
    WalletOutlined, ArrowUpOutlined, ArrowDownOutlined,
    PlusOutlined, DeleteOutlined, BankOutlined,
    FileTextOutlined, PieChartOutlined, ReloadOutlined, EditOutlined, CloseOutlined, SearchOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_URL } from '../config';

const { Option } = Select;

const FinancePage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]); // <--- New State
    const [suppliers, setSuppliers] = useState<any[]>([]); // <--- New State
    const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });

    // UI State
    const [isTransModalOpen, setIsTransModalOpen] = useState(false);
    // isCatModalOpen không còn dùng vì Form nằm trên trang, ta dùng editingCategory để control
    const [editingCategory, setEditingCategory] = useState<any>(null); // <--- MỚI: Lưu danh mục đang sửa
    const [editingTransaction, setEditingTransaction] = useState<any>(null); // <--- State for editing transaction

    const [activeTab, setActiveTab] = useState('1');
    const [filterMonth, setFilterMonth] = useState(dayjs());
    const [pageSize, setPageSize] = useState<number>(10); // <--- State for Page Size

    const [formTrans] = Form.useForm();
    const [formCat] = Form.useForm();

    const currentTransType = Form.useWatch('type', formTrans);
    const isRetail = Form.useWatch('is_retail', formTrans); // <--- Watch checkbox Income
    const isOtherExpense = Form.useWatch('is_other_expense', formTrans); // <--- Watch checkbox Expense

    // --- REPORT STATE ---
    const [reportData, setReportData] = useState<any>({ transactions: [], summary: { income: 0, expense: 0, profit: 0 } });
    const [reportType, setReportType] = useState<'MONTH' | 'YEAR'>('MONTH');
    const [reportFilter, setReportFilter] = useState(dayjs());
    const [isAccountingModalOpen, setIsAccountingModalOpen] = useState(false);
    const [accountingTrans, setAccountingTrans] = useState<any>(null);
    const [formAccounting] = Form.useForm();

    const fetchData = async () => {
        setLoading(true);
        try {
            const monthStr = filterMonth.format('YYYY-MM');
            const [resTrans, resCat, resSum, resCust, resSup] = await Promise.all([
                axios.get(`${API_URL}/finance/transactions?month=${monthStr}`),
                axios.get(`${API_URL}/finance/categories`),
                axios.get(`${API_URL}/finance/summary`),
                axios.get(`${API_URL}/customers`), // <--- Fetch Customers
                axios.get(`${API_URL}/suppliers`)  // <--- Fetch Suppliers
            ]);
            setTransactions(Array.isArray(resTrans.data) ? resTrans.data : []);
            setCategories(Array.isArray(resCat.data) ? resCat.data : []);
            setSummary(resSum.data || { income: 0, expense: 0, balance: 0 });
            setCustomers(Array.isArray(resCust.data) ? resCust.data : []);
            setSuppliers(Array.isArray(resSup.data) ? resSup.data : []);
        } catch (e) { message.error('Lỗi tải dữ liệu'); }
        setLoading(false);
    };

    const fetchReport = async () => {
        try {
            let query = '';
            if (reportType === 'MONTH') query = `month=${reportFilter.format('YYYY-MM')}`;
            if (reportType === 'YEAR') query = `year=${reportFilter.format('YYYY')}`;

            const res = await axios.get(`${API_URL}/finance/report?${query}`);
            setReportData(res.data || { transactions: [], summary: { income: 0, expense: 0, profit: 0 } });
        } catch (e) { message.error('Lỗi tải báo cáo'); }
    }

    useEffect(() => { fetchData(); }, [filterMonth]);
    useEffect(() => { if (activeTab === 'REPORT') fetchReport(); }, [activeTab, reportType, reportFilter]);

    // --- ACTIONS ---
    const handleSaveTrans = async (values: any) => {
        try {
            // Logic xử lý tên đối tác
            let finalPartnerName = values.partner_name;

            // Nếu là Thu + Chọn khách hàng (không phải khách lẻ)
            if (values.type === 'INCOME' && !values.is_retail && values.customer_id) {
                const cust = customers.find(c => c.id === values.customer_id);
                if (cust) finalPartnerName = cust.name;
            }

            // Nếu là Chi + Chọn NCC (không phải chi khác)
            if (values.type === 'EXPENSE' && !values.is_other_expense && values.supplier_id) {
                const sup = suppliers.find(s => s.id === values.supplier_id);
                if (sup) finalPartnerName = sup.name;
            }

            const payload = {
                ...values,
                date: values.date.format('YYYY-MM-DD'),
                type: values.type,
                partner_name: finalPartnerName // Override partner_name
            };

            if (editingTransaction) {
                await axios.put(`${API_URL}/finance/transactions/${editingTransaction.id}`, payload);
                message.success('Cập nhật thành công');
            } else {
                await axios.post(`${API_URL}/finance/transactions`, payload);
                message.success('Đã lưu giao dịch');
            }

            setIsTransModalOpen(false);
            setEditingTransaction(null);
            formTrans.resetFields();
            fetchData();
        } catch (e) { message.error('Lỗi lưu'); }
    };

    const handleEditTransaction = (record: any) => {
        setEditingTransaction(record);

        const custId = record.customer_id || record.customer?.id;
        const supId = record.supplier_id || record.supplier?.id;
        const catId = record.category_id || record.category?.id;

        formTrans.setFieldsValue({
            ...record,
            date: dayjs(record.date),
            category_id: catId,
            customer_id: custId,
            supplier_id: supId,
            is_retail: !custId && record.type === 'INCOME',
            is_other_expense: !supId && record.type === 'EXPENSE'
        });
        setIsTransModalOpen(true);
    };

    // --- MỚI: LOGIC LƯU DANH MỤC (TẠO MỚI HOẶC CẬP NHẬT) ---
    const handleSaveCat = async (values: any) => {
        try {
            if (editingCategory) {
                // Update
                await axios.put(`${API_URL}/finance/categories/${editingCategory.id}`, values);
                message.success('Cập nhật danh mục thành công');
                setEditingCategory(null); // Reset mode
            } else {
                // Create
                await axios.post(`${API_URL}/finance/categories`, values);
                message.success('Đã thêm danh mục mới');
            }
            formCat.resetFields();
            fetchData();
        } catch (e) { message.error('Lỗi lưu danh mục'); }
    };

    const handleEditCat = (record: any) => {
        setEditingCategory(record);
        formCat.setFieldsValue(record); // Điền dữ liệu vào form bên phải
    };

    const handleCancelEdit = () => {
        setEditingCategory(null);
        formCat.resetFields();
    };

    const handleOpenAccounting = (record: any) => {
        setAccountingTrans(record);
        formAccounting.setFieldsValue({
            is_accounting: record.is_accounting || true, // Default checked
            accounting_invoice_code: record.accounting_invoice_code,
            accounting_note: record.accounting_note
        });
        setIsAccountingModalOpen(true);
    };

    const handleSaveAccounting = async (values: any) => {
        try {
            await axios.put(`${API_URL}/finance/transactions/${accountingTrans.id}`, values);
            message.success('Đã hạch toán');
            setIsAccountingModalOpen(false);
            fetchData(); // Refresh list
        } catch (e) { message.error('Lỗi hạch toán'); }
    };
    // -------------------------------------------------------

    const handleDelete = async (endpoint: string, id: number) => {
        try { await axios.delete(`${API_URL}/finance/${endpoint}/${id}`); message.success('Đã xóa'); fetchData(); }
        catch (e) { message.error('Không thể xóa (có thể đang có dữ liệu liên quan)'); }
    };

    // --- COMPONENTS ---
    const columnsTrans = (type: 'INCOME' | 'EXPENSE') => [
        { title: 'Ngày', dataIndex: 'date', render: (t: any) => dayjs(t).format('DD/MM/YYYY') },
        {
            title: 'Danh mục', dataIndex: 'category',
            render: (c: any) => c ? <Tag color={c.color || 'default'}>{c.name}</Tag> : <span style={{ color: '#999' }}>Khác</span>
        },
        { title: 'Diễn giải', dataIndex: 'description' },
        { title: 'Khách hàng / NCC', dataIndex: 'partner_name', render: (t: any) => t ? <b>{t}</b> : '-' },
        { title: 'Mã tham chiếu', dataIndex: 'reference_code', render: (t: any) => t ? <Tag color="blue">{t}</Tag> : '-' },
        {
            title: 'Số tiền', dataIndex: 'amount', align: 'right' as const,
            render: (v: any, r: any) => <b style={{ color: r.type === 'INCOME' ? 'green' : 'red' }}>{r.type === 'INCOME' ? '+' : '-'}{Number(v).toLocaleString()}</b>
        },
        {
            title: 'Hạch Toán', align: 'center' as const,
            render: (_: any, r: any) => r.is_accounting
                ? <Tag color="blue" icon={<FileTextOutlined />}>Đã HT</Tag>
                : <Button size="small" icon={<FileTextOutlined />} onClick={() => handleOpenAccounting(r)}>Hạch toán</Button>
        },
        {
            title: '', key: 'act', width: 50,
            render: (_: any, r: any) => (
                <Space>
                    <Button size="small" icon={<EditOutlined style={{ color: 'orange' }} />} onClick={() => handleEditTransaction(r)} />
                    <Button size="small" icon={<FileTextOutlined />} onClick={() => handleOpenAccounting(r)} />
                    <Popconfirm title="Xóa?" onConfirm={() => handleDelete('transactions', r.id)}><Button size="small" danger icon={<DeleteOutlined />} type="text" /></Popconfirm>
                </Space>
            )
        }
    ];

    const columnsReport = [
        { title: 'Ngày', dataIndex: 'date', render: (t: any) => dayjs(t).format('DD/MM/YYYY') },
        { title: 'Loại', dataIndex: 'type', render: (t: string) => t === 'INCOME' ? <Tag color="green">Thu</Tag> : <Tag color="red">Chi</Tag> },
        { title: 'Số Hóa Đơn', dataIndex: 'accounting_invoice_code', render: (t: any) => t ? <b>{t}</b> : '-' },
        { title: 'Diễn giải', dataIndex: 'description' },
        { title: 'Ghi chú', dataIndex: 'accounting_note' },
        { title: 'Số tiền', dataIndex: 'amount', align: 'right' as const, render: (v: any) => <b>{Number(v).toLocaleString()}</b> },
    ];

    const columnsCat = [
        { title: 'Tên danh mục', dataIndex: 'name', render: (t: any, r: any) => <Tag color={r.color}>{t}</Tag> },
        { title: 'Loại', dataIndex: 'type', render: (t: string) => t === 'INCOME' ? <Tag color="green">Khoản Thu</Tag> : <Tag color="red">Khoản Chi</Tag> },
        { title: 'Mô tả', dataIndex: 'description' },
        {
            title: '', key: 'act', align: 'right' as const,
            render: (_: any, r: any) => (
                <Space>
                    {/* Nút Edit */}
                    <Button size="small" icon={<EditOutlined />} onClick={() => handleEditCat(r)} />
                    {/* Nút Delete */}
                    <Popconfirm title="Xóa?" onConfirm={() => handleDelete('categories', r.id)}>
                        <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    // --- FILTER ---
    const [searchText, setSearchText] = useState('');

    const filteredTransactions = transactions.filter(t => {
        if (!searchText) return true;
        const s = searchText.toLowerCase();
        return (
            t.description?.toLowerCase().includes(s) ||
            t.partner_name?.toLowerCase().includes(s) ||
            t.reference_code?.toLowerCase().includes(s) ||
            t.category?.name?.toLowerCase().includes(s)
        );
    });

    return (
        <div style={{ paddingBottom: 20 }}>
            {/* TOP CARDS */}
            <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={8}>
                    <Card bordered={false} style={{ background: 'linear-gradient(135deg, #3f8600 0%, #52c41a 100%)' }}>
                        <Statistic title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Tổng Thu (Lũy kế)</span>} value={summary.income} precision={0} valueStyle={{ color: '#fff', fontWeight: 'bold' }} prefix={<ArrowUpOutlined />} />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card bordered={false} style={{ background: 'linear-gradient(135deg, #cf1322 0%, #ff4d4f 100%)' }}>
                        <Statistic title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Tổng Chi (Lũy kế)</span>} value={summary.expense} precision={0} valueStyle={{ color: '#fff', fontWeight: 'bold' }} prefix={<ArrowDownOutlined />} />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card bordered={false} style={{ background: 'linear-gradient(135deg, #096dd9 0%, #1890ff 100%)' }}>
                        <Statistic title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>Quỹ Tiền Mặt</span>} value={summary.balance} precision={0} valueStyle={{ color: '#fff', fontWeight: 'bold' }} prefix={<BankOutlined />} />
                    </Card>
                </Col>
            </Row>



            <Card
                title={<span><WalletOutlined /> Quản Lý Tài Chính</span>}
                extra={
                    <div style={{ display: 'flex', gap: 10 }}>
                        {activeTab !== 'REPORT' && (
                            <>
                                <Input prefix={<SearchOutlined />} placeholder="Tìm kiếm..." value={searchText} onChange={e => setSearchText(e.target.value)} style={{ width: 200 }} allowClear />
                                <DatePicker picker="month" value={filterMonth} onChange={v => v && setFilterMonth(v)} allowClear={false} />
                            </>
                        )}
                        <Select
                            value={pageSize}
                            style={{ width: 110 }}
                            onChange={(v) => setPageSize(v)}
                            options={[
                                { value: 10, label: '10 dòng' },
                                { value: 20, label: '20 dòng' },
                                { value: 50, label: '50 dòng' },
                                { value: 100, label: '100 dòng' },
                                { value: 999999, label: 'Tất cả' },
                            ]}
                        />
                        <Button icon={<ReloadOutlined />} onClick={fetchData} />
                    </div>
                }
            >
                <Tabs activeKey={activeTab} onChange={setActiveTab} type="card" items={[
                    {
                        key: 'INCOME',
                        label: <span><ArrowUpOutlined /> Thu</span>,
                        children: (
                            <>
                                <div style={{ marginBottom: 16, textAlign: 'right' }}>
                                    <Button type="primary" icon={<PlusOutlined />} onClick={() => { formTrans.resetFields(); formTrans.setFieldsValue({ type: 'INCOME' }); setIsTransModalOpen(true) }}>Tạo Phiếu Thu</Button>
                                </div>
                                <Table
                                    dataSource={filteredTransactions.filter(t => t.type === 'INCOME')}
                                    columns={columnsTrans('INCOME')}
                                    rowKey="id" loading={loading}
                                    pagination={pageSize >= 999999 ? false : { pageSize: pageSize, showSizeChanger: false }}
                                />
                            </>
                        )
                    },
                    {
                        key: 'EXPENSE',
                        label: <span><ArrowDownOutlined /> Chi</span>,
                        children: (
                            <>
                                <div style={{ marginBottom: 16, textAlign: 'right' }}>
                                    <Button type="primary" danger icon={<PlusOutlined />} onClick={() => { formTrans.resetFields(); formTrans.setFieldsValue({ type: 'EXPENSE' }); setIsTransModalOpen(true) }}>Tạo Phiếu Chi</Button>
                                </div>
                                <Table
                                    dataSource={filteredTransactions.filter(t => t.type === 'EXPENSE')}
                                    columns={columnsTrans('EXPENSE')}
                                    rowKey="id" loading={loading}
                                    pagination={pageSize >= 999999 ? false : { pageSize: pageSize, showSizeChanger: false }}
                                />
                            </>
                        )
                    },
                    {
                        key: 'REPORT',
                        label: <span><PieChartOutlined /> Báo Cáo & Thống Kê</span>,
                        children: (
                            <div style={{ padding: 10 }}>
                                {/* TOOLBAR */}
                                <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '12px 20px', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                    <Space size="large">
                                        <div>
                                            <span style={{ marginRight: 8, fontWeight: 500 }}>Xem theo:</span>
                                            <Segmented options={[{ label: 'Tháng', value: 'MONTH' }, { label: 'Năm', value: 'YEAR' }]} value={reportType} onChange={(v: any) => setReportType(v)} />
                                        </div>
                                        <DatePicker
                                            picker={reportType === 'MONTH' ? 'month' : 'year'}
                                            value={reportFilter}
                                            onChange={v => v && setReportFilter(v)}
                                            allowClear={false}
                                            style={{ minWidth: 120 }}
                                        />
                                        <Button type="primary" onClick={fetchReport} icon={<ReloadOutlined />}>Tải dữ liệu</Button>
                                    </Space>
                                    <Button disabled>Xuất Excel</Button>
                                </div>

                                {/* SUMMARY CARDS */}
                                <Row gutter={24} style={{ marginBottom: 24 }}>
                                    <Col span={8}>
                                        <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(63, 134, 0, 0.1)' }}>
                                            <Statistic
                                                title={<span style={{ fontWeight: 600, color: '#555' }}>Tổng Thu (Hạch toán)</span>}
                                                value={reportData.summary.income}
                                                precision={0}
                                                valueStyle={{ color: '#3f8600', fontWeight: 'bold', fontSize: 24 }}
                                                prefix={<ArrowUpOutlined />}
                                            />
                                        </Card>
                                    </Col>
                                    <Col span={8}>
                                        <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(207, 19, 34, 0.1)' }}>
                                            <Statistic
                                                title={<span style={{ fontWeight: 600, color: '#555' }}>Tổng Chi (Hạch toán)</span>}
                                                value={reportData.summary.expense}
                                                precision={0}
                                                valueStyle={{ color: '#cf1322', fontWeight: 'bold', fontSize: 24 }}
                                                prefix={<ArrowDownOutlined />}
                                            />
                                        </Card>
                                    </Col>
                                    <Col span={8}>
                                        <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(24, 144, 255, 0.1)' }}>
                                            <Statistic
                                                title={<span style={{ fontWeight: 600, color: '#555' }}>Lợi Nhuận Thuần</span>}
                                                value={reportData.summary.profit}
                                                precision={0}
                                                valueStyle={{ color: reportData.summary.profit >= 0 ? '#3f8600' : '#cf1322', fontWeight: 'bold', fontSize: 24 }}
                                                prefix={<WalletOutlined />}
                                            />
                                        </Card>
                                    </Col>
                                </Row>

                                {/* CHARTS SECTION */}
                                <Row gutter={24} style={{ marginBottom: 24 }}>
                                    {reportType === 'MONTH' ? (
                                        <>
                                            <Col span={12}>
                                                <Card title="Cơ cấu Khoản Thu (Theo Danh mục)" bordered={false} style={{ borderRadius: 12 }}>
                                                    <Pie
                                                        data={reportData.transactions.filter((t: any) => t.type === 'INCOME').reduce((acc: any[], t: any) => {
                                                            const cat = t.category?.name || 'Khác';
                                                            const existing = acc.find(i => i.type === cat);
                                                            if (existing) existing.value += Number(t.amount);
                                                            else acc.push({ type: cat, value: Number(t.amount) });
                                                            return acc;
                                                        }, [])}
                                                        angleField="value"
                                                        colorField="type"
                                                        radius={0.8}
                                                        innerRadius={0.6}
                                                        label={{ text: 'value', style: { fontWeight: 'bold' } }}
                                                        legend={{ position: 'bottom' }}
                                                        height={300}
                                                    />
                                                </Card>
                                            </Col>
                                            <Col span={12}>
                                                <Card title="Cơ cấu Khoản Chi (Theo Danh mục)" bordered={false} style={{ borderRadius: 12 }}>
                                                    <Pie
                                                        data={reportData.transactions.filter((t: any) => t.type === 'EXPENSE').reduce((acc: any[], t: any) => {
                                                            const cat = t.category?.name || 'Khác';
                                                            const existing = acc.find(i => i.type === cat);
                                                            if (existing) existing.value += Number(t.amount);
                                                            else acc.push({ type: cat, value: Number(t.amount) });
                                                            return acc;
                                                        }, [])}
                                                        angleField="value"
                                                        colorField="type"
                                                        radius={0.8}
                                                        innerRadius={0.6}
                                                        label={{ text: 'value', style: { fontWeight: 'bold' } }}
                                                        legend={{ position: 'bottom' }}
                                                        height={300}
                                                    />
                                                </Card>
                                            </Col>
                                        </>
                                    ) : (
                                        <Col span={24}>
                                            <Card title="Biểu đồ Thu / Chi theo Tháng" bordered={false} style={{ borderRadius: 12 }}>
                                                <Column
                                                    data={reportData.transactions.reduce((acc: any[], t: any) => {
                                                        const month = dayjs(t.date).format('MM/YYYY');
                                                        const type = t.type === 'INCOME' ? 'Thu' : 'Chi';

                                                        // Chart expects array of objects
                                                        // We need robust aggregations here.
                                                        // But wait, reportData.transactions contains ALL transactions for the selected YEAR.

                                                        const existing = acc.find(i => i.month === month && i.type === type);
                                                        if (existing) existing.value += Number(t.amount);
                                                        else acc.push({ month, type, value: Number(t.amount) });
                                                        return acc;
                                                    }, []).sort((a: any, b: any) => {
                                                        // Sort by month
                                                        const [m1] = a.month.split('/');
                                                        const [m2] = b.month.split('/');
                                                        return Number(m1) - Number(m2);
                                                    })}
                                                    xField="month"
                                                    yField="value"
                                                    colorField="type"
                                                    group={true}
                                                    columnWidthRatio={0.6}
                                                    color={({ type }: any) => type === 'Thu' ? '#52c41a' : '#f5222d'}
                                                    height={350}
                                                />
                                            </Card>
                                        </Col>
                                    )}
                                </Row>

                                <Divider orientation="left">Chi tiết Giao dịch</Divider>

                                <Table
                                    dataSource={reportData.transactions}
                                    columns={columnsReport}
                                    rowKey="id"
                                    pagination={pageSize >= 999999 ? false : { pageSize: pageSize, showSizeChanger: false }}
                                    summary={() => (
                                        <Table.Summary fixed>
                                            <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 'bold' }}>
                                                <Table.Summary.Cell index={0} colSpan={5}>Tổng Cộng (Lợi nhuận HT)</Table.Summary.Cell>
                                                <Table.Summary.Cell index={1} align="right">
                                                    <span style={{ color: reportData.summary.profit >= 0 ? 'green' : 'red', fontSize: 16 }}>
                                                        {Number(reportData.summary.profit).toLocaleString()}
                                                    </span>
                                                </Table.Summary.Cell>
                                            </Table.Summary.Row>
                                        </Table.Summary>
                                    )}
                                />
                            </div>
                        )
                    },
                    {
                        key: 'CATEGORIES',
                        label: <span><FileTextOutlined /> Danh Mục</span>,
                        children: (
                            <Row gutter={24}>
                                <Col span={16}>
                                    <Table dataSource={categories} columns={columnsCat} rowKey="id" pagination={false} size="small" />
                                </Col>
                                <Col span={8}>
                                    <Card
                                        title={editingCategory ? "Cập nhật Danh mục" : "Thêm Danh mục mới"}
                                        size="small"
                                        style={{ background: editingCategory ? '#fffbe6' : '#f9f9f9', borderColor: editingCategory ? '#ffe58f' : '#f0f0f0' }}
                                        extra={editingCategory && <Button size="small" type="text" danger icon={<CloseOutlined />} onClick={handleCancelEdit}>Hủy</Button>}
                                    >
                                        <Form form={formCat} layout="vertical" onFinish={handleSaveCat}>
                                            <Form.Item name="name" label="Tên danh mục" rules={[{ required: true }]}><Input placeholder="Vd: Tiền điện, Tiếp khách..." /></Form.Item>
                                            <Form.Item name="type" label="Loại" initialValue="EXPENSE"><Radio.Group options={[{ label: 'Thu', value: 'INCOME' }, { label: 'Chi', value: 'EXPENSE' }]} optionType="button" buttonStyle="solid" /></Form.Item>
                                            <Form.Item name="color" label="Màu nhãn"><Input type="color" style={{ width: 50, padding: 0, border: 'none' }} /></Form.Item>
                                            <Form.Item name="description" label="Mô tả"><Input.TextArea rows={2} /></Form.Item>
                                            <Button type="primary" htmlType="submit" block icon={editingCategory ? <EditOutlined /> : <PlusOutlined />}>
                                                {editingCategory ? "Lưu thay đổi" : "Thêm Danh mục"}
                                            </Button>
                                        </Form>
                                    </Card>
                                </Col>
                            </Row>
                        )
                    }
                ]} />
            </Card>

            <Modal title="Hạch Toán Giao Dịch" open={isAccountingModalOpen} onCancel={() => setIsAccountingModalOpen(false)} footer={null}>
                <Form form={formAccounting} layout="vertical" onFinish={handleSaveAccounting}>
                    <Form.Item name="is_accounting" valuePropName="checked" wrapperCol={{ span: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, border: '1px solid #d9d9d9', borderRadius: 4, background: '#f6ffed' }}>
                            <input type="checkbox" id="acc_chk" defaultChecked style={{ width: 20, height: 20 }} onChange={e => formAccounting.setFieldValue('is_accounting', e.target.checked)} />
                            <label htmlFor="acc_chk" style={{ fontWeight: 600, fontSize: 16 }}>Xác nhận Hạch toán vào BCTC</label>
                        </div>
                    </Form.Item>
                    <Form.Item name="accounting_invoice_code" label="Số Hóa Đơn VAT / Chứng Từ" rules={[{ required: true, message: 'Nhập số hóa đơn' }]}><Input placeholder="VD: 0012345" /></Form.Item>
                    <Form.Item name="accounting_note" label="Ghi chú hạch toán"><Input.TextArea rows={3} /></Form.Item>
                    <Button type="primary" htmlType="submit" block size="large">Lưu Hạch Toán</Button>
                </Form>
            </Modal>

            {/* ... (Keep existing Modal) ... */}
            <Modal title={editingTransaction ? "Cập nhật Giao Dịch" : "Lập Phiếu Thu / Chi"} open={isTransModalOpen} onCancel={() => { setIsTransModalOpen(false); setEditingTransaction(null); formTrans.resetFields(); }} footer={null}>
                <Form form={formTrans} layout="vertical" onFinish={handleSaveTrans} initialValues={{ date: dayjs(), type: activeTab === 'EXPENSE' ? 'EXPENSE' : 'INCOME' }}>

                    <Form.Item name="type" label="Loại phiếu" rules={[{ required: true }]}>
                        <Radio.Group
                            buttonStyle="solid"
                            onChange={() => formTrans.setFieldsValue({ category_id: undefined })}
                        >
                            <Radio.Button value="INCOME" style={{ color: 'green' }}>PHIẾU THU (+)</Radio.Button>
                            <Radio.Button value="EXPENSE" style={{ color: 'red' }}>PHIẾU CHI (-)</Radio.Button>
                        </Radio.Group>
                    </Form.Item>

                    {/* SELECT CUSTOMER/SUPPLIER Logic */}
                    <div style={{ background: '#f0f2f5', padding: 12, borderRadius: 6, marginBottom: 16 }}>
                        {currentTransType === 'INCOME' && (
                            <>
                                <Form.Item name="is_retail" valuePropName="checked" style={{ marginBottom: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <input type="checkbox" id="retail" style={{ width: 16, height: 16 }} onChange={e => formTrans.setFieldValue('is_retail', e.target.checked)} />
                                        <label htmlFor="retail" style={{ fontWeight: 500 }}>Khách lẻ / Vãng lai</label>
                                    </div>
                                </Form.Item>
                                {isRetail ? (
                                    <Form.Item name="partner_name" label="Tên khách hàng" rules={[{ required: true, message: 'Nhập tên khách' }]}>
                                        <Input placeholder="Nhập tên khách..." />
                                    </Form.Item>
                                ) : (
                                    <Form.Item name="customer_id" label="Chọn khách hàng từ hệ thống" rules={[{ required: true, message: 'Chọn khách hàng' }]}>
                                        <Select placeholder="Tìm kiếm khách hàng" showSearch optionFilterProp="children">
                                            {customers.map(c => (
                                                <Option key={c.id} value={c.id}>{c.name} ({c.phone})</Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                )}
                            </>
                        )}

                        {currentTransType === 'EXPENSE' && (
                            <>
                                <Form.Item name="is_other_expense" valuePropName="checked" style={{ marginBottom: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <input type="checkbox" id="other_exp" style={{ width: 16, height: 16 }} onChange={e => formTrans.setFieldValue('is_other_expense', e.target.checked)} />
                                        <label htmlFor="other_exp" style={{ fontWeight: 500 }}>Chi khác / Nội bộ (Không có NCC)</label>
                                    </div>
                                </Form.Item>
                                {isOtherExpense ? (
                                    <Form.Item name="partner_name" label="Tên đơn vị / Người nhận" rules={[{ required: true, message: 'Nhập tên người nhận' }]}>
                                        <Input placeholder="Vd: Điện lực, Tiền nước, Lương..." />
                                    </Form.Item>
                                ) : (
                                    <Form.Item name="supplier_id" label="Chọn Nhà Cung Cấp / NGC" rules={[{ required: true, message: 'Chọn nhà cung cấp' }]}>
                                        <Select placeholder="Tìm kiếm NCC" showSearch optionFilterProp="children">
                                            {suppliers.map(s => (
                                                <Option key={s.id} value={s.id}>
                                                    {s.name} - <Tag>{s.type}</Tag>
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                )}
                            </>
                        )}
                    </div>

                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="date" label="Ngày giao dịch" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
                        <Col span={12}>
                            <Form.Item name="amount" label="Số tiền" rules={[{ required: true }]}>
                                <InputNumber
                                    style={{ width: '100%' }}
                                    formatter={(v: any) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    addonAfter="₫"
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="category_id"
                        label="Chọn Danh mục (Lọc theo Loại phiếu)"
                        rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
                    >
                        <Select placeholder="Chọn danh mục...">
                            {categories
                                .filter(c => c.type === currentTransType)
                                .map(c => (
                                    <Option key={c.id} value={c.id}>
                                        <Tag color={c.color || (c.type === 'INCOME' ? 'green' : 'red')}>{c.name}</Tag>
                                    </Option>
                                ))
                            }
                        </Select>
                    </Form.Item>

                    <Form.Item name="description" label="Diễn giải / Lý do"><Input.TextArea rows={3} /></Form.Item>
                    <Form.Item name="reference_code" label="Mã tham chiếu (Optional)"><Input placeholder="VD: SO-1234, PO-5678" /></Form.Item>

                    <Button type="primary" htmlType="submit" block size="large">Lưu Phiếu</Button>
                </Form>
            </Modal>
        </div>
    );
};

export default FinancePage;