import React, { useState, useEffect } from 'react';
import { Layout, Typography, Card, Table, Button, Tabs, Space, Modal, Form, InputNumber, Input, Select, message, Tag, Popconfirm, Row, Col } from 'antd';
import { PlusOutlined, HistoryOutlined, CheckCircleOutlined, AppstoreOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../utils/api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

const SampleInventoryPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('stocks');
    const [stocks, setStocks] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [salesOrders, setSalesOrders] = useState<any[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
    
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'IMPORT' | 'EXPORT'>('IMPORT');
    
    const [form] = Form.useForm();
    const [selectedItems, setSelectedItems] = useState<{product_id: number, quantity: number, note: string}[]>([]);

    useEffect(() => {
        fetchProducts();
        fetchSalesAndCustomers();
        if (activeTab === 'stocks') fetchStocks();
        if (activeTab === 'transactions') fetchTransactions();
    }, [activeTab]);

    const fetchSalesAndCustomers = async () => {
        try {
            const [custRes, soRes] = await Promise.all([
                api.get('/customers'),
                api.get('/sales')
            ]);
            setCustomers(Array.isArray(custRes.data) ? custRes.data : []);
            setSalesOrders(Array.isArray(soRes.data) ? soRes.data : []);
        } catch (e) {
            console.error('Error fetching customers or SOs');
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await api.get('/products');
            setProducts(res.data);
        } catch (e) {
            console.error(e);
        }
    }

    const fetchStocks = async () => {
        setLoading(true);
        try {
            const res = await api.get('/inventory/samples/stocks');
            setStocks(res.data);
        } catch (e) {
            message.error('Lỗi tải tồn kho mẫu');
        } finally {
            setLoading(false);
        }
    };

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const res = await api.get('/inventory/samples/transactions');
            setTransactions(res.data);
        } catch (e) {
            message.error('Lỗi tải lịch sử');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTransaction = async (values: any) => {
        if (selectedItems.length === 0) {
            message.warning('Vui lòng thêm ít nhất 1 sản phẩm');
            return;
        }

        try {
            await api.post('/inventory/samples/transactions', {
                type: modalType,
                reference_type: values.reference_type,
                reference_id: values.reference_id, // can be ID or string for now
                note: values.note,
                items: selectedItems
            });
            message.success('Tạo phiếu thành công!');
            setIsModalOpen(false);
            if (activeTab === 'transactions') fetchTransactions();
            else setActiveTab('transactions');
        } catch (e: any) {
            message.error(e.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const handleConfirmTransaction = async (id: number) => {
        try {
            await api.post(`/inventory/samples/transactions/${id}/confirm`);
            message.success('Đã xác nhận phiếu!');
            fetchTransactions();
        } catch (e: any) {
            message.error(e.response?.data?.message || 'Có lỗi xảy ra');
        }
    };

    const handleDeleteTransaction = async (id: number) => {
        try {
            await api.delete(`/inventory/samples/transactions/${id}`);
            message.success('Đã xóa phiếu!');
            fetchTransactions();
        } catch (e: any) {
            message.error(e.response?.data?.message || 'Không thể xóa phiếu');
        }
    };

    const handlePrintExport = (tx: any) => {
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) return message.error('Vui lòng cho phép popup để in');

        const customerName = tx.customer?.name || '..............................................';
        const customerAddress = tx.customer?.address || '..............................................';
        const customerPhone = tx.customer?.phone || '......................';
        const deposit = tx.deposit_amount ? Number(tx.deposit_amount).toLocaleString('vi-VN') + ' VNĐ' : '0 VNĐ';

        let html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Phiếu Xuất Kho Hàng Mẫu - ${tx.code}</title>
    <style>
        body { font-family: 'Times New Roman', serif; font-size: 14px; color: #000; padding: 20px; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; }
        .company-info { font-size: 13px; line-height: 1.5; }
        .title { text-align: center; margin-bottom: 30px; }
        .title h2 { margin: 0; font-size: 22px; font-weight: bold; text-transform: uppercase; }
        .title p { margin: 5px 0 0 0; font-style: italic; }
        .info-group { margin-bottom: 20px; line-height: 1.6; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #000; padding: 8px; text-align: left; }
        th { font-weight: bold; text-align: center; background-color: #f0f0f0 !important; -webkit-print-color-adjust: exact; }
        .signatures { display: flex; justify-content: space-around; margin-top: 50px; text-align: center; }
        .sig-box { width: 30%; }
        .sig-box strong { display: block; margin-bottom: 70px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-info">
            <strong>CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ TƯỜNG LINH</strong><br>
            📍 74/21/2A Nguyễn Khuyến, P.12, Q.Bình Thạnh, TP.HCM<br>
            📞 0983.882210 - 0983.796654<br>
            MST: 0311.874.522
        </div>
        <div style="text-align: right;">
            <strong>Mã phiếu:</strong> ${tx.code}<br>
            <strong>Ngày lập:</strong> ${dayjs(tx.created_at).format('DD/MM/YYYY')}
        </div>
    </div>

    <div class="title">
        <h2>PHIẾU XUẤT KHO HÀNG MẪU</h2>
        <p>(Kèm theo đơn: ${tx.reference_type} #${tx.reference_id || '......'})</p>
    </div>

    <div class="info-group">
        Khách hàng nhận mẫu: <b>${customerName}</b><br>
        Số điện thoại: <b>${customerPhone}</b><br>
        Địa chỉ: <b>${customerAddress}</b><br>
        Ghi chú: ${tx.note || '..............................................'}<br>
        <strong>Tiền cọc mẫu: <span style="font-size: 16px;">${deposit}</span></strong>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 50px;">STT</th>
                <th>Tên Sản Phẩm Mẫu</th>
                <th style="width: 80px;">Số Lượng</th>
                <th>Ghi chú</th>
            </tr>
        </thead>
        <tbody>
            ${(tx.items || []).map((item: any, idx: number) => `
            <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td>${item.product?.sku} - ${item.product?.name || ''}</td>
                <td style="text-align: center;">${item.quantity}</td>
                <td>${item.note || ''}</td>
            </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="signatures">
        <div class="sig-box">
            <strong>Người Nhận Mẫu</strong>
            <i>(Ký, ghi rõ họ tên)</i>
        </div>
        <div class="sig-box">
            <strong>Người Giao</strong>
            <i>(Ký, ghi rõ họ tên)</i>
        </div>
        <div class="sig-box">
            <strong>Quản Lý Duyệt</strong>
            <i>(Ký, ghi rõ họ tên)</i>
        </div>
    </div>

    <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    const stockColumns = [
        { title: 'Item ID', dataIndex: 'item_id', width: 80 },
        { 
            title: 'Sản phẩm', 
            key: 'product',
            render: (_: any, r: any) => {
                const p = products.find(x => x.id === r.item_id);
                return p ? `${p.sku} - ${p.name}` : `Loading ID ${r.item_id}`;
            }
        },
        { 
            title: 'Hình ảnh', 
            key: 'image', 
            width: 80,
            render: (_: any, r: any) => {
                const p = products.find(x => x.id === r.item_id);
                return p?.image_url ? <img src={p.image_url} style={{width:40, height:40, objectFit:'cover'}} alt="" /> : '-';
            }
        },
        { title: 'SL Tồn Hàng Mẫu', dataIndex: 'quantity', width: 150, align: 'right' as const, render: (v:any)=> <b>{Number(v).toLocaleString()}</b> },
    ];

    const txColumns = [
        { title: 'Mã Phiếu', dataIndex: 'code', width: 140, render: (t:any)=> <b>{t}</b> },
        { 
            title: 'Loại', dataIndex: 'type', width: 100, 
            render: (t:any) => <Tag color={t === 'IMPORT' ? 'blue' : 'orange'}>{t === 'IMPORT' ? 'NHẬP MAIN' : 'XUẤT MẪU'}</Tag>
        },
        { 
            title: 'Trạng thái', dataIndex: 'status', width: 120,
            render: (s:any) => <Tag color={s === 'COMPLETED' ? 'green' : 'default'}>{s}</Tag>
        },
        { title: 'Nguồn/Đích', dataIndex: 'reference_type', render: (_:any, r:any) => r.reference_type ? `${r.reference_type} #${r.reference_id||''}` : 'Nội bộ' },
        { title: 'Chi tiết SP', key: 'items', render: (_:any, r:any) => (
            <ul style={{ margin:0, paddingLeft: 16 }}>
                {(r.items || []).map((i:any) => (
                    <li key={i.id}>{i.product?.name || `Product#${i.product_id}`} (SL: {i.quantity}) {i.note ? `- ${i.note}`:''}</li>
                ))}
            </ul>
        )},
        { title: 'Ngày tạo', dataIndex: 'created_at', render: (d:any) => dayjs(d).format('DD/MM/YY HH:mm') },
        {
            title: 'Hành động',
            key: 'action',
            render: (_:any, r:any) => (
                <Space>
                    {r.status === 'DRAFT' && (
                        <>
                            <Popconfirm title="Xác nhận phiếu này kho?" onConfirm={() => handleConfirmTransaction(r.id)}>
                                <Button size="small" type="primary" icon={<CheckCircleOutlined />}>Duyệt</Button>
                            </Popconfirm>
                            <Popconfirm title="Xóa phiếu này?" onConfirm={() => handleDeleteTransaction(r.id)}>
                                <Button size="small" danger icon={<DeleteOutlined />} />
                            </Popconfirm>
                        </>
                    )}
                    {r.type === 'EXPORT' && (
                        <Button size="small" onClick={() => handlePrintExport(r)}>In Phiếu</Button>
                    )}
                </Space>
            )
        }
    ];

    const openModal = (type: 'IMPORT' | 'EXPORT') => {
        setModalType(type);
        setSelectedItems([]);
        form.resetFields();
        setIsModalOpen(true);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <Title level={2} style={{ margin: 0 }}>Quản lý Kho Hàng Mẫu</Title>
                <Space>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('IMPORT')}>Tạo Phiếu Nhập Mẫu</Button>
                    <Button type="primary" danger icon={<PlusOutlined />} onClick={() => openModal('EXPORT')}>Tạo Phiếu Xuất Mẫu</Button>
                </Space>
            </div>

            <Card bodyStyle={{ padding: 0 }}>
                <Tabs 
                    activeKey={activeTab} 
                    onChange={setActiveTab}
                    items={[
                        {
                            key: 'stocks',
                            label: <span><AppstoreOutlined /> Tồn Kho Hàng Mẫu</span>,
                            children: (
                                <div style={{ padding: 24 }}>
                                    <Table 
                                        loading={loading}
                                        columns={stockColumns}
                                        dataSource={stocks}
                                        rowKey="id"
                                        pagination={{ pageSize: 20 }}
                                    />
                                </div>
                            )
                        },
                        {
                            key: 'transactions',
                            label: <span><HistoryOutlined /> Lịch sử Nhập/Xuất Mẫu</span>,
                            children: (
                                <div style={{ padding: 24 }}>
                                    <Table 
                                        loading={loading}
                                        columns={txColumns}
                                        dataSource={transactions}
                                        rowKey="id"
                                    />
                                </div>
                            )
                        }
                    ]} 
                />
            </Card>

            <Modal
                title={modalType === 'IMPORT' ? "Tạo Phiếu Nhập Hàng Mẫu" : "Tạo Phiếu Xuất Hàng Mẫu"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={() => form.submit()}
                width={1000}
                destroyOnClose
            >
                <Form form={form} layout="vertical" onFinish={handleCreateTransaction}>
                    {modalType === 'EXPORT' && (
                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item name="customer_id" label="Khách hàng">
                                    <Select showSearch filterOption={(inpt, opt:any) => (opt?.children as string).toLowerCase().includes(inpt.toLowerCase())} placeholder="Chọn khách hàng" onChange={val => {
                                        setSelectedCustomerId(val);
                                        form.setFieldsValue({ ref_order: undefined, reference_type: undefined, reference_id: undefined });
                                    }}>
                                        {customers.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="ref_order" label="Chọn Báo giá / SO">
                                    <Select placeholder="Chọn đơn hàng tham chiếu" allowClear
                                        onChange={(val, opt:any) => {
                                            if (val) {
                                                const order = salesOrders.find(o => o.order_code === val);
                                                if (order) {
                                                    form.setFieldsValue({
                                                        reference_type: order.status === 'QUOTATION' ? 'QUOTE' : 'SO',
                                                        reference_id: order.id
                                                    });
                                                }
                                            } else {
                                                form.setFieldsValue({ reference_type: undefined, reference_id: undefined });
                                            }
                                        }}
                                    >
                                        {salesOrders.filter(o => o.customer_id === selectedCustomerId).map(o => (
                                            <Option key={o.order_code} value={o.order_code}>
                                                {o.order_code} ({o.status === 'QUOTATION' ? 'Báo giá' : 'SO'})
                                            </Option>
                                        ))}
                                    </Select>
                                    <Form.Item name="reference_type" hidden style={{ margin: 0 }}><Input /></Form.Item>
                                    <Form.Item name="reference_id" hidden style={{ margin: 0 }}><Input /></Form.Item>
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="deposit_amount" label="Phí đặt cọc (VND)">
                                    <InputNumber style={{width:'100%'}} formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(val: any) => val!.replace(/\$\s?|(,*)/g, '')} placeholder="Vd: 50,000" />
                                </Form.Item>
                            </Col>
                        </Row>
                    )}
                    
                    <Form.Item name="note" label="Ghi chú chung">
                        <Input.TextArea rows={2} placeholder="Vd: Chuyển hàng mẫu từ kho chính sang kho mẫu..." />
                    </Form.Item>

                    <Card size="small" title="Danh sách sản phẩm" style={{ marginTop: 10 }}>
                        <Form onFinish={(vals) => {
                            setSelectedItems([...selectedItems, { product_id: vals.prodId, quantity: vals.qty, note: '' }]);
                        }} layout="inline">
                            <Form.Item name="prodId" rules={[{required: true}]}>
                                <Select showSearch filterOption={(inpt, opt:any) => (opt?.children as string).toLowerCase().includes(inpt.toLowerCase())} style={{ width: 300 }} placeholder="Chọn sản phẩm">
                                    {products.map(p => <Option key={p.id} value={p.id}>{p.sku} - {p.name}</Option>)}
                                </Select>
                            </Form.Item>
                            <Form.Item name="qty" rules={[{required: true}]}>
                                <InputNumber min={1} placeholder="SL" />
                            </Form.Item>
                            <Button type="dashed" htmlType="submit">Thêm</Button>
                        </Form>

                        <Table 
                            size="small" 
                            style={{ marginTop: 15 }}
                            dataSource={selectedItems} 
                            rowKey={(r, idx) => idx as number}
                            pagination={false}
                            columns={[
                                { title: 'Sản phẩm', render: (_, r) => products.find(p => p.id === r.product_id)?.name },
                                { title: 'SL', dataIndex: 'quantity' },
                                { title: '', width: 50, render: (_, r, idx) => <Button danger size="small" icon={<DeleteOutlined />} onClick={()=> {
                                    const n = [...selectedItems]; n.splice(idx, 1); setSelectedItems(n);
                                }}/> }
                            ]}
                        />
                    </Card>
                </Form>
            </Modal>
        </div>
    );
};

export default SampleInventoryPage;
