import React, { useEffect, useState } from 'react';
import {
    Card, Row, Col, Statistic, Table, Button, Tabs, Modal, Form,
    Input, Select, DatePicker, Tag, message, Popconfirm,
    Radio, InputNumber, Space
} from 'antd';
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
    const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });

    // UI State
    const [isTransModalOpen, setIsTransModalOpen] = useState(false);
    // isCatModalOpen không còn dùng vì Form nằm trên trang, ta dùng editingCategory để control
    const [editingCategory, setEditingCategory] = useState<any>(null); // <--- MỚI: Lưu danh mục đang sửa

    const [activeTab, setActiveTab] = useState('1');
    const [filterMonth, setFilterMonth] = useState(dayjs());

    const [formTrans] = Form.useForm();
    const [formCat] = Form.useForm();

    const currentTransType = Form.useWatch('type', formTrans);

    const fetchData = async () => {
        setLoading(true);
        try {
            const monthStr = filterMonth.format('YYYY-MM');
            const [resTrans, resCat, resSum] = await Promise.all([
                axios.get(`${API_URL}/finance/transactions?month=${monthStr}`),
                axios.get(`${API_URL}/finance/categories`),
                axios.get(`${API_URL}/finance/summary`)
            ]);
            setTransactions(Array.isArray(resTrans.data) ? resTrans.data : []);
            setCategories(Array.isArray(resCat.data) ? resCat.data : []);
            setSummary(resSum.data || { income: 0, expense: 0, balance: 0 });
        } catch (e) { message.error('Lỗi tải dữ liệu'); }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, [filterMonth]);

    // --- ACTIONS ---
    const handleSaveTrans = async (values: any) => {
        try {
            const payload = {
                ...values,
                date: values.date.format('YYYY-MM-DD'),
                type: values.type
            };
            await axios.post(`${API_URL}/finance/transactions`, payload);
            message.success('Đã lưu giao dịch');
            setIsTransModalOpen(false);
            formTrans.resetFields();
            fetchData();
        } catch (e) { message.error('Lỗi lưu'); }
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
    // -------------------------------------------------------

    const handleDelete = async (endpoint: string, id: number) => {
        try { await axios.delete(`${API_URL}/finance/${endpoint}/${id}`); message.success('Đã xóa'); fetchData(); }
        catch (e) { message.error('Không thể xóa (có thể đang có dữ liệu liên quan)'); }
    };

    // --- COMPONENTS ---
    const columnsTrans = [
        { title: 'Ngày', dataIndex: 'date', render: (t: any) => dayjs(t).format('DD/MM/YYYY') },
        {
            title: 'Loại', dataIndex: 'type', align: 'center' as const, width: 80,
            render: (t: string) => t === 'INCOME' ? <Tag color="green"><ArrowUpOutlined /> Thu</Tag> : <Tag color="red"><ArrowDownOutlined /> Chi</Tag>
        },
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
            title: '', key: 'act', width: 50,
            render: (_: any, r: any) => <Popconfirm title="Xóa?" onConfirm={() => handleDelete('transactions', r.id)}><Button size="small" danger icon={<DeleteOutlined />} type="text" /></Popconfirm>
        }
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
                title={<span><WalletOutlined /> Sổ Quỹ Tiền Mặt</span>}
                extra={
                    <div style={{ display: 'flex', gap: 10 }}>
                        <Input
                            prefix={<SearchOutlined />}
                            placeholder="Tìm nội dung, đối tác, mã..."
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            style={{ width: 250 }}
                            allowClear
                        />
                        <DatePicker picker="month" value={filterMonth} onChange={v => v && setFilterMonth(v)} allowClear={false} />
                        <Button icon={<ReloadOutlined />} onClick={fetchData} />
                    </div>
                }
            >
                <Tabs activeKey={activeTab} onChange={setActiveTab} type="card" items={[
                    {
                        key: '1',
                        label: <span><FileTextOutlined /> Danh sách Giao dịch</span>,
                        children: (
                            <>
                                <div style={{ marginBottom: 16, textAlign: 'right' }}>
                                    <Button type="primary" icon={<PlusOutlined />} onClick={() => { formTrans.resetFields(); setIsTransModalOpen(true) }}>Lập Phiếu Thu/Chi</Button>
                                </div>
                                <Table dataSource={filteredTransactions} columns={columnsTrans} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
                            </>
                        )
                    },
                    // ... (Keep existing Categories Tab logic) ...
                    {
                        key: '2',
                        label: <span><PieChartOutlined /> Quản lý Danh mục Thu/Chi</span>,
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

            {/* ... (Keep existing Modal) ... */}
            <Modal title="Lập Phiếu Thu / Chi" open={isTransModalOpen} onCancel={() => setIsTransModalOpen(false)} footer={null}>
                <Form form={formTrans} layout="vertical" onFinish={handleSaveTrans} initialValues={{ date: dayjs(), type: 'EXPENSE' }}>

                    <Form.Item name="type" label="Loại phiếu" rules={[{ required: true }]}>
                        <Radio.Group
                            buttonStyle="solid"
                            onChange={() => formTrans.setFieldsValue({ category_id: undefined })}
                        >
                            <Radio.Button value="INCOME" style={{ color: 'green' }}>PHIẾU THU (+)</Radio.Button>
                            <Radio.Button value="EXPENSE" style={{ color: 'red' }}>PHIẾU CHI (-)</Radio.Button>
                        </Radio.Group>
                    </Form.Item>

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
                    <Form.Item name="partner_name" label="Đối tượng (Khách hàng / NCC)"><Input placeholder="VD: Công ty ABC..." /></Form.Item>
                    <Form.Item name="reference_code" label="Mã tham chiếu (Optional)"><Input placeholder="VD: SO-1234, PO-5678" /></Form.Item>

                    <Button type="primary" htmlType="submit" block size="large">Lưu Phiếu</Button>
                </Form>
            </Modal>
        </div>
    );
};

export default FinancePage;