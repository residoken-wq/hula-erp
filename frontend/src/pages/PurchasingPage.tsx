import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Card, Tabs, Space, Tooltip, Popconfirm, message, Modal, Descriptions, Divider, Input, Statistic, Row, Col, InputNumber, Radio } from 'antd';
import { ReloadOutlined, EyeOutlined, DeleteOutlined, SendOutlined, CheckCircleOutlined, ShopOutlined, ScissorOutlined, PrinterOutlined, SearchOutlined, DollarOutlined } from '@ant-design/icons';
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
            if (currentPO && currentPO.id === id) {
                setCurrentPO({ ...currentPO, status });
            }
        } catch (e) { message.error('Lỗi cập nhật'); }
    };

    const handleDelete = async (id: number) => {
        try {
            await axios.delete(`${API_URL}/purchasing/${id}`);
            message.success('Đã xóa PO');
            fetchData();
        } catch (e) { message.error('Lỗi xóa'); }
    };

    const viewDetail = (record: any) => {
        setCurrentPO(record);
        setIsDetailOpen(true);
    };

    // --- XỬ LÝ THANH TOÁN ---
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
            
            // Reload
            fetchData(); 
            // Cập nhật lại currentPO trên modal nếu đang mở
            setCurrentPO({
                ...currentPO,
                paid_amount: Number(currentPO.paid_amount) + Number(payAmount)
            });
        } catch(e) { message.error('Lỗi thanh toán'); }
    };
    // ------------------------

    const columns = [
        { 
            title: 'Mã PO', dataIndex: 'po_code', 
            render: (t:any, r:any) => <a onClick={()=>viewDetail(r)}><b>{t}</b></a> 
        },
        { 
            title: 'Loại', dataIndex: 'type', align: 'center' as const, width: 120,
            render: (t: string) => t === 'MATERIAL' 
                ? <Tag color="blue" icon={<ShopOutlined/>}>Nguyên liệu</Tag> 
                : <Tag color="orange" icon={<ScissorOutlined/>}>Gia công</Tag>
        },
        { 
            title: 'Ngày tạo', dataIndex: 'created_at', 
            render: (t:any) => dayjs(t).format('DD/MM/YYYY') 
        },
        { 
            title: 'Nhà Cung Cấp / Gia Công', dataIndex: 'supplier', 
            render: (s: any, r: any) => {
                if (s?.name) return s.name;
                // Fallback nếu note chứa thông tin NCC (dữ liệu cũ)
                const parts = r.note?.split('NCC: ');
                return parts && parts.length > 1 ? parts[1] : '-';
            }
        },
        { 
            title: 'Tổng tiền', dataIndex: 'total_amount', align: 'right' as const, 
            render: (v: number) => <b>{Number(v).toLocaleString()} ₫</b> 
        },
        { 
            title: 'Đã thanh toán', dataIndex: 'paid_amount', align: 'right' as const, 
            render: (v: number, r:any) => {
                const total = Number(r.total_amount);
                const paid = Number(v || 0);
                const pct = total > 0 ? (paid / total) * 100 : 0;
                return (
                    <Tooltip title={`Còn lại: ${(total - paid).toLocaleString()}`}>
                        <div style={{color: pct >= 100 ? 'green' : 'orange'}}>
                            {paid.toLocaleString()} <small>({pct.toFixed(0)}%)</small>
                        </div>
                    </Tooltip>
                );
            }
        },
        { 
            title: 'Trạng thái', dataIndex: 'status', align: 'center' as const,
            render: (t: string) => {
                let color = 'default';
                if (t === 'SENT') color = 'processing';
                if (t === 'CONFIRMED') color = 'purple';
                if (t === 'COMPLETED') color = 'success';
                if (t === 'CANCELLED') color = 'red';
                return <Tag color={color}>{t}</Tag>;
            }
        },
        {
            title: '', key: 'act', align: 'right' as const,
            render: (r: any) => (
                <Space>
                    <Tooltip title="Xem chi tiết"><Button size="small" icon={<EyeOutlined/>} onClick={()=>viewDetail(r)} /></Tooltip>
                    {r.status === 'DRAFT' && (
                        <Popconfirm title="Xóa đơn này?" onConfirm={()=>handleDelete(r.id)}>
                            <Button size="small" danger icon={<DeleteOutlined/>} />
                        </Popconfirm>
                    )}
                </Space>
            )
        }
    ];

    const filteredData = data.filter((d:any) => {
        const matchesTab = activeTab === 'ALL' ? true : d.type === activeTab;
        const matchesSearch = d.po_code?.toLowerCase().includes(searchText.toLowerCase()) 
                           || d.supplier?.name?.toLowerCase().includes(searchText.toLowerCase());
        return matchesTab && matchesSearch;
    });

    return (
        <div>
            <Card 
                title="Quản Lý Mua Hàng & Gia Công" 
                extra={
                    <Space>
                        <Input prefix={<SearchOutlined/>} placeholder="Tìm Mã PO, NCC..." value={searchText} onChange={e=>setSearchText(e.target.value)} style={{width: 200}} allowClear />
                        <Button icon={<ReloadOutlined/>} onClick={fetchData}>Làm mới</Button>
                    </Space>
                }
            >
                <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
                    { key: 'ALL', label: 'Tất cả' },
                    { key: 'MATERIAL', label: <span><ShopOutlined/> Mua Nguyên Liệu (NPL)</span> },
                    { key: 'OUTSOURCING', label: <span><ScissorOutlined/> Đặt Gia Công (Outsource)</span> },
                ]} />
                <Table dataSource={filteredData} columns={columns} rowKey="id" loading={loading} />
            </Card>

            {/* MODAL CHI TIẾT PO */}
            <Modal 
                title={`Chi tiết đơn hàng: ${currentPO?.po_code}`} 
                open={isDetailOpen} 
                onCancel={()=>setIsDetailOpen(false)} 
                width={900}
                footer={[
                    <Button key="pay" icon={<DollarOutlined/>} onClick={openPaymentModal}>Thanh Toán</Button>,
                    <Button key="print" icon={<PrinterOutlined/>}>In Đơn</Button>,
                    currentPO?.status === 'DRAFT' && (
                        <Button key="send" type="primary" icon={<SendOutlined/>} onClick={()=>handleStatusChange(currentPO.id, 'SENT')}>
                            Gửi cho NCC
                        </Button>
                    ),
                    currentPO?.status === 'SENT' && (
                        <Button key="confirm" type="primary" style={{background:'purple'}} icon={<CheckCircleOutlined/>} onClick={()=>handleStatusChange(currentPO.id, 'CONFIRMED')}>
                            Xác nhận Đặt Hàng
                        </Button>
                    ),
                    <Button key="close" onClick={()=>setIsDetailOpen(false)}>Đóng</Button>
                ]}
            >
                {currentPO && (
                    <>
                        <Descriptions column={2} bordered size="small">
                            <Descriptions.Item label="Mã PO"><b>{currentPO.po_code}</b></Descriptions.Item>
                            <Descriptions.Item label="Ngày tạo">{dayjs(currentPO.created_at).format('DD/MM/YYYY HH:mm')}</Descriptions.Item>
                            <Descriptions.Item label="Loại đơn">{currentPO.type === 'MATERIAL' ? 'Mua Nguyên Liệu' : 'Đặt Gia Công'}</Descriptions.Item>
                            <Descriptions.Item label="Nhà Cung Cấp">{currentPO.supplier?.name || (currentPO.note?.split('NCC: ')[1] || '-')}</Descriptions.Item>
                            <Descriptions.Item label="Trạng thái"><Tag color="blue">{currentPO.status}</Tag></Descriptions.Item>
                            <Descriptions.Item label="Tổng tiền"><b style={{color:'red', fontSize:16}}>{Number(currentPO.total_amount).toLocaleString()} ₫</b></Descriptions.Item>
                            <Descriptions.Item label="Đã thanh toán">
                                <span style={{color:'green', fontWeight:'bold'}}>{Number(currentPO.paid_amount || 0).toLocaleString()} ₫</span>
                            </Descriptions.Item>
                            <Descriptions.Item label="Ghi chú chung">{currentPO.note}</Descriptions.Item>
                        </Descriptions>
                        
                        <Divider orientation="left">Danh sách hàng hóa / Dịch vụ</Divider>
                        
                        <Table 
                            dataSource={currentPO.items} 
                            rowKey="id" 
                            pagination={false} 
                            size="small" 
                            bordered
                            columns={[
                                { title: 'Mã', render: (r:any) => r.material?.code || r.product?.sku || '-' },
                                { title: 'Tên hàng / Công đoạn', dataIndex: 'description' },
                                { title: 'Ghi chú', dataIndex: 'note', render: (t:string) => <i style={{color:'#888'}}>{t}</i> },
                                { title: 'Số lượng', dataIndex: 'quantity', align:'center' as const, render: (v:number) => Number(v).toLocaleString() },
                                { title: 'Đơn giá', dataIndex: 'unit_price', align:'right' as const, render: (v:number) => Number(v).toLocaleString() },
                                { title: 'Thành tiền', dataIndex: 'subtotal', align:'right' as const, render: (v:number) => <b>{Number(v).toLocaleString()}</b> }
                            ]}
                            summary={(pageData) => {
                                let total = 0;
                                pageData.forEach(({ subtotal }) => { total += Number(subtotal); });
                                return (
                                    <Table.Summary.Row>
                                        <Table.Summary.Cell index={0} colSpan={5} align="right"><b>TỔNG CỘNG</b></Table.Summary.Cell>
                                        <Table.Summary.Cell index={1} align="right"><b style={{color:'red'}}>{total.toLocaleString()} ₫</b></Table.Summary.Cell>
                                    </Table.Summary.Row>
                                );
                            }}
                        />
                    </>
                )}
            </Modal>

            {/* MODAL THANH TOÁN */}
            <Modal title="Lập Phiếu Chi (Thanh toán PO)" open={isPayModalOpen} onCancel={()=>setIsPayModalOpen(false)} onOk={handlePayment}>
                <Form layout="vertical">
                    <Row gutter={16}>
                        <Col span={12}><Statistic title="Tổng giá trị" value={currentPO?.total_amount} suffix="đ" /></Col>
                        <Col span={12}><Statistic title="Đã trả" value={currentPO?.paid_amount} suffix="đ" valueStyle={{color:'green'}} /></Col>
                    </Row>
                    <Divider />
                    <Form.Item label="Số tiền thanh toán">
                        <InputNumber 
                            style={{width:'100%'}} 
                            value={payAmount} 
                            onChange={(v:any)=>setPayAmount(v)} 
                            formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} 
                            addonAfter="₫" 
                        />
                    </Form.Item>
                    <Form.Item label="Ghi chú">
                        <Input.TextArea rows={2} value={payNote} onChange={e=>setPayNote(e.target.value)} placeholder="VD: Thanh toán đợt 1..." />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default PurchasingPage;