import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Card, Tabs, Space, Tooltip, Popconfirm, message, Modal, Descriptions, Divider, Input, Statistic, Row, Col, InputNumber, Radio, Form, DatePicker, Select } from 'antd';
import { ReloadOutlined, EyeOutlined, DeleteOutlined, SendOutlined, CheckCircleOutlined, ShopOutlined, ScissorOutlined, PrinterOutlined, SearchOutlined, DollarOutlined, CarOutlined, AppstoreOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_URL } from '../config';

const PurchasingPage: React.FC = () => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('ALL');
    const [searchText, setSearchText] = useState('');
    
    // Detail Modal State
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [currentPO, setCurrentPO] = useState<any>(null);

    // Payment Modal State
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [payAmount, setPayAmount] = useState<number>(0);
    const [payNote, setPayNote] = useState('');

    // --- MỚI: MONITOR MODAL STATE ---
    const [isMonitorOpen, setIsMonitorOpen] = useState(false);
    const [monitorMaterials, setMonitorMaterials] = useState<any[]>([]);
    const [deliveryInfo, setDeliveryInfo] = useState<any>({});
    // --------------------------------

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

    // --- FIX: HÀM XÓA PO (Giờ đã hoạt động vì Backend đã có API) ---
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

    // --- MỚI: XỬ LÝ MONITORING NPL ---
    const openMonitorModal = async (record: any) => {
        setCurrentPO(record);
        setDeliveryInfo(record.outsourcing_delivery_info || { status: 'PENDING' });
        try {
            // Lấy danh sách NPL cần thiết từ API mới
            const res = await axios.get(`${API_URL}/purchasing/${record.id}/outsourcing-materials`);
            setMonitorMaterials(res.data);
            setIsMonitorOpen(true);
        } catch (e) { message.error('Lỗi tải thông tin NPL'); }
    };

    const handleSaveDeliveryInfo = async () => {
        try {
            await axios.put(`${API_URL}/purchasing/${currentPO.id}`, {
                outsourcing_delivery_info: deliveryInfo
            });
            message.success('Đã cập nhật thông tin chuyển NPL');
            setIsMonitorOpen(false);
            fetchData();
        } catch (e) { message.error('Lỗi lưu'); }
    };
    // ---------------------------------

    const openPaymentModal = () => {
        if (!currentPO) return;
        const remain = Number(currentPO.total_amount) - Number(currentPO.paid_amount);
        setPayAmount(remain > 0 ? remain : 0);
        setPayNote('');
        setIsPayModalOpen(true);
    };

    const handlePayment = async () => {
        if (payAmount <= 0) return message.warning('Nhập số tiền hợp lệ');
        try {
            await axios.post(`${API_URL}/finance/payment/po`, {
                amount: payAmount,
                poCode: currentPO.po_code,
                note: payNote
            });
            message.success('Thanh toán thành công!');
            setIsPayModalOpen(false);
            fetchData(); 
            setCurrentPO({ ...currentPO, paid_amount: Number(currentPO.paid_amount) + Number(payAmount) });
        } catch(e) { message.error('Lỗi thanh toán'); }
    };

    const columns = [
        { 
            title: 'Mã PO', dataIndex: 'po_code', 
            render: (t:any, r:any) => <a onClick={()=>viewDetail(r)}><b>{t}</b></a> 
        },
        { 
            title: 'Loại', dataIndex: 'type', align: 'center' as const, width: 120,
            render: (t: string) => t === 'MATERIAL' 
                ? <Tag color="blue" icon={<ShopOutlined/>}>NPL</Tag> 
                : <Tag color="orange" icon={<ScissorOutlined/>}>Gia công</Tag>
        },
        { 
            title: 'Ngày', dataIndex: 'created_at', 
            render: (t:any) => dayjs(t).format('DD/MM') 
        },
        { 
            title: 'Đối tác', dataIndex: 'supplier', 
            render: (s: any, r: any) => s?.name || (r.note?.split('NCC: ')[1] || '-')
        },
        { 
            title: 'Tổng tiền', dataIndex: 'total_amount', align: 'right' as const, 
            render: (v: number) => <b>{Number(v).toLocaleString()}</b> 
        },
        { 
            title: 'Trạng thái', dataIndex: 'status', align: 'center' as const,
            render: (t: string) => <Tag color={t==='COMPLETED'?'green':t==='SENT'?'blue':'default'}>{t}</Tag>
        },
        {
            title: '', key: 'act', align: 'right' as const,
            render: (r: any) => (
                <Space>
                    {/* Nút Monitor chỉ hiện cho PO Gia công */}
                    {r.type === 'OUTSOURCING' && (
                        <Tooltip title="Theo dõi NPL & Vận chuyển">
                            <Button size="small" style={{color:'#fa8c16', borderColor:'#fa8c16'}} icon={<CarOutlined/>} onClick={()=>openMonitorModal(r)} />
                        </Tooltip>
                    )}
                    <Tooltip title="Xem"><Button size="small" icon={<EyeOutlined/>} onClick={()=>viewDetail(r)} /></Tooltip>
                    {r.status === 'DRAFT' && (
                        <Popconfirm title="Xóa?" onConfirm={()=>handleDelete(r.id)}>
                            <Button size="small" danger icon={<DeleteOutlined/>} />
                        </Popconfirm>
                    )}
                </Space>
            )
        }
    ];

    const filteredData = data.filter((d:any) => {
        const matchesTab = activeTab === 'ALL' ? true : d.type === activeTab;
        const matchesSearch = d.po_code?.toLowerCase().includes(searchText.toLowerCase());
        return matchesTab && matchesSearch;
    });

    return (
        <div>
            <Card title="Quản Lý Mua Hàng & Gia Công" extra={<Space><Input prefix={<SearchOutlined/>} placeholder="Tìm PO..." value={searchText} onChange={e=>setSearchText(e.target.value)} style={{width: 200}} allowClear /><Button icon={<ReloadOutlined/>} onClick={fetchData}>Làm mới</Button></Space>}>
                <Tabs activeKey={activeTab} onChange={setActiveTab} items={[{ key: 'ALL', label: 'Tất cả' }, { key: 'MATERIAL', label: 'Mua NPL' }, { key: 'OUTSOURCING', label: 'Gia Công' }]} />
                <Table dataSource={filteredData} columns={columns} rowKey="id" loading={loading} />
            </Card>

            {/* MODAL MONITOR NPL (MỚI) */}
            <Modal title={<span><CarOutlined/> Theo Dõi NPL & Vận Chuyển: {currentPO?.po_code}</span>} open={isMonitorOpen} onCancel={()=>setIsMonitorOpen(false)} onOk={handleSaveDeliveryInfo} width={800}>
                <Row gutter={16} style={{marginBottom: 20}}>
                    <Col span={8}>
                        <div style={{fontWeight:'bold', marginBottom:5}}>Ngày gửi NPL:</div>
                        <DatePicker style={{width:'100%'}} value={deliveryInfo.sent_date ? dayjs(deliveryInfo.sent_date) : null} onChange={(d)=>setDeliveryInfo({...deliveryInfo, sent_date: d})} />
                    </Col>
                    <Col span={8}>
                        <div style={{fontWeight:'bold', marginBottom:5}}>Phương tiện/Người giao:</div>
                        <Input placeholder="Xe tải, Grab..." value={deliveryInfo.vehicle} onChange={e=>setDeliveryInfo({...deliveryInfo, vehicle: e.target.value})} />
                    </Col>
                    <Col span={8}>
                        <div style={{fontWeight:'bold', marginBottom:5}}>Trạng thái:</div>
                        <Select style={{width:'100%'}} value={deliveryInfo.status} onChange={v=>setDeliveryInfo({...deliveryInfo, status: v})}>
                            <Select.Option value="PENDING">Chưa gửi</Select.Option>
                            <Select.Option value="SENT">Đang gửi</Select.Option>
                            <Select.Option value="RECEIVED">Xưởng đã nhận</Select.Option>
                        </Select>
                    </Col>
                </Row>
                <Table 
                    dataSource={monitorMaterials} 
                    pagination={false} 
                    size="small" 
                    title={() => <b>Danh sách NPL cần thiết cho đơn hàng này:</b>}
                    columns={[
                        { title: 'Mã NPL', dataIndex: 'code' },
                        { title: 'Tên NPL', dataIndex: 'name' },
                        { title: 'ĐVT', dataIndex: 'unit', align:'center' },
                        { title: 'Cần', dataIndex: 'quantity', align:'center', render: (v:number)=>Number(v).toLocaleString() },
                        { title: 'Tồn Kho Hiện Tại', dataIndex: 'stock', align:'center', render: (v:number, r:any) => <span style={{color: v < r.quantity ? 'red' : 'green'}}>{Number(v).toLocaleString()}</span> },
                        { title: 'TT', render: (v:any, r:any) => r.stock >= r.quantity ? <Tag color="green">Đủ hàng</Tag> : <Tag color="red">Thiếu {Number(r.quantity - r.stock).toLocaleString()}</Tag> }
                    ]}
                />
            </Modal>

            {/* MODAL DETAIL (Giữ nguyên logic cũ nhưng rút gọn code cho gọn) */}
            <Modal title={`Chi tiết: ${currentPO?.po_code}`} open={isDetailOpen} onCancel={()=>setIsDetailOpen(false)} width={900} footer={[<Button key="pay" icon={<DollarOutlined/>} onClick={openPaymentModal}>Thanh Toán</Button>, <Button key="close" onClick={()=>setIsDetailOpen(false)}>Đóng</Button>]}>
                <Descriptions column={2} size="small" bordered>
                    <Descriptions.Item label="Mã PO">{currentPO?.po_code}</Descriptions.Item>
                    <Descriptions.Item label="NCC">{currentPO?.supplier?.name}</Descriptions.Item>
                    <Descriptions.Item label="Tổng tiền">{Number(currentPO?.total_amount).toLocaleString()} ₫</Descriptions.Item>
                    <Descriptions.Item label="Đã trả" contentStyle={{color:'green'}}>{Number(currentPO?.paid_amount).toLocaleString()} ₫</Descriptions.Item>
                </Descriptions>
                <Table dataSource={currentPO?.items} rowKey="id" pagination={false} size="small" style={{marginTop:10}} columns={[{ title: 'Tên hàng', dataIndex: 'description' }, { title: 'SL', dataIndex: 'quantity' }, { title: 'Đơn giá', dataIndex: 'unit_price', render: (v:any)=>Number(v).toLocaleString() }, { title: 'Thành tiền', dataIndex: 'subtotal', render: (v:any)=>Number(v).toLocaleString() }]} />
            </Modal>

            {/* MODAL PAYMENT (Giữ nguyên) */}
            <Modal title="Thanh Toán" open={isPayModalOpen} onCancel={()=>setIsPayModalOpen(false)} onOk={handlePayment}>
                <Form layout="vertical">
                    <Form.Item label="Số tiền"><InputNumber style={{width:'100%'}} value={payAmount} onChange={(v:any)=>setPayAmount(v)} formatter={v=>`${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} /></Form.Item>
                    <Form.Item label="Ghi chú"><Input.TextArea value={payNote} onChange={e=>setPayNote(e.target.value)} /></Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default PurchasingPage;