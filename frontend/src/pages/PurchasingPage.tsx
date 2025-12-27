import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Card, Tabs, Space, Tooltip, Popconfirm, message, Modal, Descriptions, Divider, Input, Statistic, Row, Col, InputNumber, Select, DatePicker, Form } from 'antd';
import { ReloadOutlined, EyeOutlined, DeleteOutlined, SendOutlined, CheckCircleOutlined, ShopOutlined, ScissorOutlined, PrinterOutlined, SearchOutlined, DollarOutlined, CarOutlined, LinkOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_URL } from '../config';

const PurchasingPage: React.FC = () => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('ALL');
    const [searchText, setSearchText] = useState('');

    // Detail Modal
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [currentPO, setCurrentPO] = useState<any>(null);

    // Payment Modal (Nâng cấp)
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [paymentHistory, setPaymentHistory] = useState<any[]>([]); // Danh sách các đợt đã trả
    const [payForm] = Form.useForm(); // Sử dụng Form Instance

    // Monitor Modal
    const [isMonitorOpen, setIsMonitorOpen] = useState(false);
    const [monitorMaterials, setMonitorMaterials] = useState<any[]>([]);
    const [deliveryInfo, setDeliveryInfo] = useState<any>({});

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/purchasing`);
            setData(Array.isArray(res.data) ? res.data : []);
        } catch (e) { message.error('Lỗi tải dữ liệu PO'); }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const handleStatusChange = async (id: number, status: string) => {
        try {
            await axios.put(`${API_URL}/purchasing/${id}/status`, { status });
            message.success('Cập nhật trạng thái thành công');
            fetchData();
            if (currentPO && currentPO.id === id) setCurrentPO({ ...currentPO, status });
        } catch (e) { message.error('Lỗi cập nhật'); }
    };

    const handleDelete = async (id: number) => {
        try {
            await axios.delete(`${API_URL}/purchasing/${id}`);
            message.success('Đã xóa PO');
            fetchData();
        } catch (e) { message.error('Lỗi xóa PO'); }
    };

    const viewDetail = (record: any) => {
        setCurrentPO(record);
        setIsDetailOpen(true);
    };

    // --- LOGIC MONITORING ---
    const openMonitorModal = async (record: any) => {
        setCurrentPO(record);
        setDeliveryInfo(record.outsourcing_delivery_info || { status: 'PENDING' });
        try {
            const res = await axios.get(`${API_URL}/purchasing/${record.id}/outsourcing-materials`);
            setMonitorMaterials(res.data);
            setIsMonitorOpen(true);
        } catch (e) { message.error('Lỗi tải thông tin NPL'); }
    };

    const handleSaveDeliveryInfo = async () => {
        try {
            await axios.put(`${API_URL}/purchasing/${currentPO.id}`, { outsourcing_delivery_info: deliveryInfo });
            message.success('Đã cập nhật thông tin');
            setIsMonitorOpen(false); fetchData();
        } catch (e) { message.error('Lỗi lưu'); }
    };

    // --- LOGIC THANH TOÁN (CẬP NHẬT MỚI) ---
    const openPaymentModal = async () => {
        if (!currentPO) return;

        // 1. Reset Form
        const remain = Number(currentPO.total_amount) - Number(currentPO.paid_amount);
        payForm.setFieldsValue({
            amount: remain > 0 ? remain : 0,
            date: dayjs(), // Mặc định hôm nay
            note: '',
            vatCode: '',
            vatUrl: ''
        });

        // 2. Load lịch sử thanh toán
        try {
            const res = await axios.get(`${API_URL}/finance/history/${currentPO.po_code}`);
            setPaymentHistory(res.data);
        } catch (e) { setPaymentHistory([]); }

        setIsPayModalOpen(true);
    };

    const handlePaymentSubmit = async (values: any) => {
        if (values.amount <= 0) return message.warning('Nhập số tiền hợp lệ');
        try {
            await axios.post(`${API_URL}/finance/payment/po`, {
                poCode: currentPO.po_code,
                amount: values.amount,
                note: values.note,
                date: values.date ? values.date.toISOString() : null, // Gửi ngày
                vatCode: values.vatCode, // Gửi mã hóa đơn
                vatUrl: values.vatUrl,    // Gửi link hóa đơn
                partnerName: currentPO.supplier?.name // <--- Fix: Gửi tên NCC sang Finance
            });
            message.success('Thanh toán thành công!');
            setIsPayModalOpen(false);

            // Reload data
            fetchData();
            // Update UI modal detail nếu đang mở
            setCurrentPO({ ...currentPO, paid_amount: Number(currentPO.paid_amount) + Number(values.amount) });
        } catch (e) { message.error('Lỗi thanh toán'); }
    };
    // ----------------------------------------

    const columns = [
        { title: 'Mã PO', dataIndex: 'po_code', render: (t: any, r: any) => <a onClick={() => viewDetail(r)}><b>{t}</b></a> },
        { title: 'Loại', dataIndex: 'type', align: 'center' as const, width: 100, render: (t: string) => t === 'MATERIAL' ? <Tag color="blue">NPL</Tag> : <Tag color="orange">Gia công</Tag> },
        { title: 'Ngày', dataIndex: 'created_at', render: (t: any) => dayjs(t).format('DD/MM/YYYY') },
        { title: 'Đối tác', dataIndex: 'supplier', render: (s: any, r: any) => s?.name || (r.note?.split('NCC: ')[1] || '-') },
        { title: 'Tổng tiền', dataIndex: 'total_amount', align: 'right' as const, render: (v: number) => <b>{Number(v).toLocaleString()}</b> },
        { title: 'Trạng thái', dataIndex: 'status', align: 'center' as const, render: (t: string) => <Tag color={t === 'COMPLETED' ? 'green' : t === 'SENT' ? 'blue' : 'default'}>{t}</Tag> },
        {
            title: '', key: 'act', align: 'right' as const,
            render: (r: any) => (
                <Space>
                    {r.type === 'OUTSOURCING' && (<Tooltip title="Theo dõi NPL"><Button size="small" style={{ color: '#fa8c16', borderColor: '#fa8c16' }} icon={<CarOutlined />} onClick={() => openMonitorModal(r)} /></Tooltip>)}
                    <Tooltip title="Xem"><Button size="small" icon={<EyeOutlined />} onClick={() => viewDetail(r)} /></Tooltip>
                    {r.status === 'DRAFT' && (<Popconfirm title="Xóa?" onConfirm={() => handleDelete(r.id)}><Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm>)}
                </Space>
            )
        }
    ];

    const filteredData = data.filter((d: any) => {
        return (activeTab === 'ALL' || d.type === activeTab) && d.po_code?.toLowerCase().includes(searchText.toLowerCase());
    });

    // --- LOGIC REQUIREMENT (PO GỘP) ---
    const [requirements, setRequirements] = useState<any[]>([]);
    const [selectedReqs, setSelectedReqs] = useState<any[]>([]);

    const fetchRequirements = async () => {
        try {
            const res = await axios.get(`${API_URL}/purchasing/requirements`);
            setRequirements(res.data);
        } catch (e) { message.error('Lỗi tải nhu cầu'); }
    };

    useEffect(() => {
        if (activeTab === 'REQ') fetchRequirements();
    }, [activeTab]);

    const handleCreatePooledPO = async () => {
        if (selectedReqs.length === 0) return message.warning('Chọn ít nhất 1 dòng');

        // Check if all selected items (with supplier_name) have the same supplier
        // Note: `supplier_name` is essentially descriptive here, but we need `supplier_id`.
        // The backend `getPendingRequirements` returns string supplier_name.
        // We might need strict validation or just allow user to pick a supplier?

        // For simplicity: Group by Supplier Name, if multiple, warn
        const suppliers = [...new Set(selectedReqs.map(r => r.supplier_name).filter(Boolean))];
        if (suppliers.length > 1) {
            Modal.confirm({
                title: 'Cảnh báo đa nhà cung cấp',
                content: `Bạn đang chọn vật tư của nhiều NCC: ${suppliers.join(', ')}. Hệ thống sẽ tạo PO tạm chưa gán NCC hoặc bạn cần tách ra. Tiếp tục?`,
                onOk: () => proceedCreatePooled(null) // Null supplier logic
            });
        } else {
            // Try to find supplier ID? Actually we don't have ID in requirement list, only name.
            // So we prompt user to SELECT Supplier for this PO.
            setIsSelectSupplierOpen(true);
        }
    };

    // Auxiliary state for selecting supplier
    const [isSelectSupplierOpen, setIsSelectSupplierOpen] = useState(false);
    const [targetSupplierId, setTargetSupplierId] = useState<number | null>(null);
    const [suppliers, setSuppliers] = useState<any[]>([]);

    useEffect(() => {
        axios.get(`${API_URL}/suppliers`).then(res => setSuppliers(res.data));
    }, []);

    const proceedCreatePooled = async (supId: number | null) => {
        try {
            await axios.post(`${API_URL}/purchasing/create-pooled`, {
                supplier_id: supId,
                items: selectedReqs.map(r => ({
                    material_id: r.material_id,
                    quantity: r.remaining_qty, // Mua số lượng còn thiếu
                    unit_price: r.reference_price,
                    plan_id: r.plan_id // Quan Trọng
                }))
            });
            message.success('Tạo PO gộp thành công!');
            setIsSelectSupplierOpen(false);
            setSelectedReqs([]);
            fetchRequirements(); // Refresh list
        } catch (e) { message.error('Lỗi tạo PO'); }
    }

    // ----------------------------------

    return (
        <div>
            <Card title="Quản Lý Mua Hàng & Gia Công" extra={<Space>
                {activeTab === 'REQ' && <Button type="primary" onClick={handleCreatePooledPO} disabled={selectedReqs.length === 0}>+ Tạo PO Gộp ({selectedReqs.length})</Button>}
                <Input prefix={<SearchOutlined />} placeholder="Tìm PO..." value={searchText} onChange={e => setSearchText(e.target.value)} style={{ width: 200 }} allowClear />
                <Button icon={<ReloadOutlined />} onClick={() => activeTab === 'REQ' ? fetchRequirements() : fetchData()}>Làm mới</Button>
            </Space>}>
                <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
                    { key: 'ALL', label: 'Tất cả PO' },
                    { key: 'MATERIAL', label: 'Mua NPL' },
                    { key: 'OUTSOURCING', label: 'Gia Công' },
                    { key: 'REQ', label: 'Tổng Hợp Nhu Cầu (Mới)' } // --- NEW TAB ---
                ]} />

                {activeTab === 'REQ' ? (
                    <Table
                        dataSource={requirements}
                        rowKey={(r) => `${r.plan_id}_${r.material_id}`}
                        rowSelection={{
                            type: 'checkbox',
                            onChange: (_, rows) => setSelectedReqs(rows)
                        }}
                        columns={[
                            { title: 'Kế Hoạch', dataIndex: 'plan_code', render: t => <b>{t}</b> },
                            { title: 'Mã NPL', dataIndex: 'material_code' },
                            { title: 'Tên NPL', dataIndex: 'material_name' },
                            { title: 'ĐV', dataIndex: 'unit' },
                            { title: 'Cần mua', dataIndex: 'remaining_qty', render: v => <b style={{ color: 'red' }}>{Number(v).toLocaleString()}</b> },
                            { title: 'NCC Gợi ý', dataIndex: 'supplier_name' },
                            { title: 'Đơn giá', dataIndex: 'reference_price', align: 'right', render: v => Number(v).toLocaleString() }
                        ]}
                    />
                ) : (
                    <Table dataSource={filteredData} columns={columns} rowKey="id" loading={loading} />
                )}
            </Card>

            <Modal title="Chọn Nhà Cung Cấp cho PO" open={isSelectSupplierOpen} onCancel={() => setIsSelectSupplierOpen(false)} onOk={() => proceedCreatePooled(targetSupplierId)}>
                <p>Bạn đang tạo PO gộp cho {selectedReqs.length} vật tư. Vui lòng chọn NCC:</p>
                <Select
                    style={{ width: '100%' }}
                    placeholder="Chọn NCC..."
                    showSearch optionFilterProp="label"
                    onChange={v => setTargetSupplierId(v)}
                    options={suppliers.map(s => ({ label: s.name, value: s.id }))}
                />
            </Modal>

            {/* MODAL MONITOR NPL */}
            <Modal title={<span><CarOutlined /> Theo Dõi NPL: {currentPO?.po_code}</span>} open={isMonitorOpen} onCancel={() => setIsMonitorOpen(false)} onOk={handleSaveDeliveryInfo} width={800}>
                <Row gutter={16} style={{ marginBottom: 20 }}>
                    <Col span={8}><b>Ngày gửi:</b> <DatePicker style={{ width: '100%' }} value={deliveryInfo.sent_date ? dayjs(deliveryInfo.sent_date) : null} onChange={(d) => setDeliveryInfo({ ...deliveryInfo, sent_date: d })} /></Col>
                    <Col span={8}><b>Xe/Người giao:</b> <Input value={deliveryInfo.vehicle} onChange={e => setDeliveryInfo({ ...deliveryInfo, vehicle: e.target.value })} /></Col>
                    <Col span={8}><b>Trạng thái:</b> <Select style={{ width: '100%' }} value={deliveryInfo.status} onChange={v => setDeliveryInfo({ ...deliveryInfo, status: v })} options={[{ label: 'Chưa gửi', value: 'PENDING' }, { label: 'Đang gửi', value: 'SENT' }, { label: 'Đã nhận', value: 'RECEIVED' }]} /></Col>
                </Row>
                <Table dataSource={monitorMaterials} pagination={false} size="small" columns={[{ title: 'Mã', dataIndex: 'code' }, { title: 'Tên', dataIndex: 'name' }, { title: 'Cần', dataIndex: 'quantity', align: 'center', render: (v: number) => Number(v).toLocaleString() }, { title: 'Tồn Kho', dataIndex: 'stock', align: 'center', render: (v: number, r: any) => <span style={{ color: v < r.quantity ? 'red' : 'green' }}>{Number(v).toLocaleString()}</span> }]} />
            </Modal>

            {/* MODAL DETAIL */}
            <Modal title={`Chi tiết: ${currentPO?.po_code}`} open={isDetailOpen} onCancel={() => setIsDetailOpen(false)} width={900} footer={[<Button key="pay" icon={<DollarOutlined />} onClick={openPaymentModal}>Thanh Toán</Button>, <Button key="close" onClick={() => setIsDetailOpen(false)}>Đóng</Button>]}>
                <Descriptions column={2} size="small" bordered>
                    <Descriptions.Item label="NCC">{currentPO?.supplier?.name}</Descriptions.Item>
                    <Descriptions.Item label="Tổng tiền">{Number(currentPO?.total_amount).toLocaleString()} ₫</Descriptions.Item>
                    <Descriptions.Item label="Đã trả" contentStyle={{ color: 'green', fontWeight: 'bold' }}>{Number(currentPO?.paid_amount).toLocaleString()} ₫</Descriptions.Item>
                    <Descriptions.Item label="Còn lại" contentStyle={{ color: 'red' }}>{Number((currentPO?.total_amount || 0) - (currentPO?.paid_amount || 0)).toLocaleString()} ₫</Descriptions.Item>
                </Descriptions>
                <Table dataSource={currentPO?.items} rowKey="id" pagination={false} size="small" style={{ marginTop: 10 }} columns={[{ title: 'Tên hàng', dataIndex: 'description' }, { title: 'SL', dataIndex: 'quantity' }, { title: 'Đơn giá', render: (r: any) => Number(r.unit_price).toLocaleString() }, { title: 'Thành tiền', render: (r: any) => Number(r.subtotal).toLocaleString() }]} />
            </Modal>

            {/* MODAL THANH TOÁN (NÂNG CẤP) */}
            <Modal title="Thanh Toán & Hóa Đơn" open={isPayModalOpen} onCancel={() => setIsPayModalOpen(false)} onOk={() => payForm.submit()} width={700}>
                <Row gutter={24}>
                    <Col span={10}>
                        <Divider orientation="left" style={{ marginTop: 0 }}>Lập Phiếu Chi Mới</Divider>
                        <Form form={payForm} layout="vertical" onFinish={handlePaymentSubmit}>
                            <Form.Item name="date" label="Ngày thanh toán" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item>
                            <Form.Item name="amount" label="Số tiền" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} addonAfter="₫" /></Form.Item>
                            <Form.Item name="vatCode" label="Mã Hóa đơn VAT"><Input placeholder="Số hóa đơn..." /></Form.Item>
                            <Form.Item name="vatUrl" label="Link Hóa đơn (Ảnh/Drive)"><Input prefix={<LinkOutlined />} placeholder="URL..." /></Form.Item>
                            <Form.Item name="note" label="Ghi chú"><Input.TextArea rows={2} /></Form.Item>
                        </Form>
                    </Col>
                    <Col span={14} style={{ borderLeft: '1px solid #f0f0f0' }}>
                        <Divider orientation="left" style={{ marginTop: 0 }}>Lịch Sử Đã Thanh Toán</Divider>
                        <Table
                            dataSource={paymentHistory}
                            rowKey="id"
                            size="small"
                            pagination={false}
                            scroll={{ y: 300 }}
                            columns={[
                                { title: 'Ngày', dataIndex: 'date', width: 90, render: (t: string) => dayjs(t).format('DD/MM') },
                                { title: 'Số tiền', dataIndex: 'amount', align: 'right', width: 100, render: (v: number) => <b style={{ color: 'green' }}>{v.toLocaleString()}</b> },
                                { title: 'HĐ VAT', dataIndex: 'vat_invoice_code', render: (t: string, r: any) => r.vat_invoice_url ? <a href={r.vat_invoice_url} target="_blank" rel="noreferrer">{t || 'Link'}</a> : t || '-' }
                            ]}
                        />
                    </Col>
                </Row>
            </Modal>
        </div>
    );
};

export default PurchasingPage;