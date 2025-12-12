import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, InputNumber, Row, Col, Tabs, Divider, Button, message, Table, DatePicker, Tag, Progress, Statistic } from 'antd';
import { PlusOutlined, MinusCircleOutlined, CarOutlined, BankOutlined, SaveOutlined, HistoryOutlined, CheckCircleOutlined, DollarOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_URL } from '../config';

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
    isQuotation: boolean;
    customers: any[];
    products: any[];
}

const SalesOrderDetail: React.FC<Props> = ({ open, onClose, onSuccess, initialData, isQuotation, customers, products }) => {
    const [form] = Form.useForm();
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [deliveryHistory, setDeliveryHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('1');

    // States for Sub-modals
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [isShipModalOpen, setIsShipModalOpen] = useState(false);
    const [payAmount, setPayAmount] = useState(0);
    const [shipNote, setShipNote] = useState('');
    const [shipItems, setShipItems] = useState<any[]>([]);

    useEffect(() => {
        if (open) {
            setActiveTab('1');
            if (initialData) {
                // ... Fill Form logic (Giu nguyen) ...
                form.setFieldsValue({
                    ...initialData,
                    customer_id: initialData.customer?.id || initialData.customer_id,
                    delivery_date: initialData.delivery_date ? dayjs(initialData.delivery_date) : null,
                    items: initialData.items.map((i: any) => ({
                        sku: i.sku,
                        quantity: Number(i.quantity),
                        price: Number(i.unit_price)
                    }))
                });
                
                // Load History if Order
                if (!isQuotation) {
                    loadHistory(initialData);
                }
            } else {
                form.resetFields();
                form.setFieldsValue({
                    isQuotation: isQuotation,
                    order_code: `${isQuotation ? 'QUOTE' : 'SO'}-${dayjs().format('YYMMDD')}-${Math.floor(Math.random() * 1000)}`,
                    items: [{}]
                });
            }
        }
    }, [open, initialData, isQuotation, form]);

    const loadHistory = async (order: any) => {
        try {
            const resPay = await axios.get(`${API_URL}/sales/${order.order_code}/payments`);
            setPaymentHistory(resPay.data);
            const resShip = await axios.get(`${API_URL}/sales/${order.id}/deliveries`);
            setDeliveryHistory(resShip.data);
        } catch(e) {}
    };

    const handleSave = async (values: any) => {
        // ... Logic Save (Giu nguyen) ...
        try {
            const payload = {
                ...values,
                isQuotation: isQuotation, 
                items: values.items.map((i: any) => ({
                    sku: i.sku,
                    quantity: Number(i.quantity),
                    price: Number(i.price)
                }))
            };
            if (initialData && initialData.id) {
                await axios.put(`${API_URL}/sales/quote/${initialData.id}`, payload);
                message.success('Cập nhật thành công');
            } else {
                await axios.post(`${API_URL}/sales/create`, payload);
                message.success('Tạo mới thành công');
            }
            onSuccess();
            onClose();
        } catch (e: any) { message.error('Lỗi lưu'); }
    };

    // --- PAYMENT ACTION ---
    const handleAddPayment = async () => {
        try {
            await axios.post(`${API_URL}/finance/payment`, {
                type: 'INCOME',
                amount: payAmount,
                refCode: initialData.order_code,
                note: `Thanh toán cho đơn ${initialData.order_code}`
            });
            message.success('Đã ghi nhận thanh toán');
            setIsPayModalOpen(false);
            loadHistory(initialData);
            onSuccess(); // Refresh parent list
        } catch(e) { message.error('Lỗi'); }
    };

    // --- DELIVERY ACTION ---
    const prepareShipment = () => {
        // Init ship items based on Order items (User will edit qty)
        const items = initialData.items.map((i:any) => ({ sku: i.sku, max: i.quantity, quantity: i.quantity }));
        setShipItems(items);
        setIsShipModalOpen(true);
    };

    const handleConfirmShip = async () => {
        try {
            await axios.post(`${API_URL}/sales/${initialData.id}/delivery`, {
                code: `DO-${dayjs().format('YYMMDD')}-${Math.floor(Math.random()*100)}`,
                date: new Date(),
                note: shipNote,
                items: shipItems
            });
            message.success('Đã tạo phiếu xuất kho');
            setIsShipModalOpen(false);
            loadHistory(initialData);
            onSuccess();
        } catch(e) { message.error('Lỗi'); }
    };

    // ... (Handle Change functions Giu nguyen) ...
    const handleCustomerChange = (val: number) => {
        const c = customers.find(x => x.id === val);
        if (c) {
            form.setFieldsValue({
                customer_name: c.name, receiver_name: c.name, receiver_phone: c.phone, shipping_address: c.address,
                vat_company_name: c.name, vat_tax_code: c.tax_code, vat_address: c.address
            });
        }
    };
    const handleProductChange = (val: string, index: number) => {
        const p = products.find((x: any) => x.value === val);
        if (p) {
            const items = form.getFieldValue('items');
            items[index].price = p.price;
            form.setFieldsValue({ items });
        }
    };

    // RENDER HELPER
    const totalPaid = paymentHistory.reduce((s, x:any) => s + Number(x.amount), 0);
    const totalOrder = Number(initialData?.total_amount || 0);
    const remain = totalOrder - totalPaid;

    return (
        <Modal
            title={isQuotation ? "Báo Giá Chi Tiết" : "Quản Lý Đơn Hàng (SO)"}
            open={open} onCancel={onClose}
            width={1100} style={{ top: 20 }}
            footer={[ <Button key="back" onClick={onClose}>Đóng</Button>, <Button key="submit" type="primary" onClick={() => form.submit()}>Lưu Thông Tin</Button> ]}
        >
            <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
                {
                    key: '1', label: 'Thông tin chung',
                    children: (
                        <Form form={form} layout="vertical" onFinish={handleSave}>
                            {/* ... (Form Content GIU NGUYEN nhu cu) ... */}
                            <Form.Item name="order_code" hidden><Input /></Form.Item>
                            <Form.Item name="isQuotation" hidden><Input /></Form.Item>
                            <Row gutter={24}>
                                <Col span={14} style={{ borderRight: '1px solid #f0f0f0' }}>
                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item name="customer_id" label="Khách Hàng" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" options={customers.map(c => ({ label: `${c.code} - ${c.name}`, value: c.id }))} onChange={handleCustomerChange} /></Form.Item>
                                        </Col>
                                        <Col span={12}><Form.Item name="order_code" label="Mã Đơn"><Input disabled style={{ fontWeight: 'bold', color: '#1890ff' }} /></Form.Item></Col>
                                    </Row>
                                    <div style={{ background: '#fafafa', padding: 10, borderRadius: 6 }}>
                                        <Form.List name="items">
                                            {(fields, { add, remove }) => (
                                                <>
                                                    {fields.map(({ key, name, ...restField }) => (
                                                        <Row key={key} gutter={8} style={{ marginBottom: 10 }} align="middle">
                                                            <Col span={11}><Form.Item {...restField} name={[name, 'sku']} style={{ marginBottom: 0 }} rules={[{ required: true }]}><Select placeholder="SP" options={products} onChange={(v) => handleProductChange(v, name)} /></Form.Item></Col>
                                                            <Col span={5}><Form.Item {...restField} name={[name, 'quantity']} style={{ marginBottom: 0 }} rules={[{ required: true }]}><InputNumber placeholder="SL" style={{ width: '100%' }} /></Form.Item></Col>
                                                            <Col span={6}><Form.Item {...restField} name={[name, 'price']} style={{ marginBottom: 0 }} rules={[{ required: true }]}><InputNumber placeholder="Giá" style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} /></Form.Item></Col>
                                                            <Col span={2}><MinusCircleOutlined onClick={() => remove(name)} style={{ color: 'red' }} /></Col>
                                                        </Row>
                                                    ))}
                                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Thêm dòng</Button>
                                                </>
                                            )}
                                        </Form.List>
                                    </div>
                                </Col>
                                <Col span={10}>
                                    <Divider orientation="left" style={{ marginTop: 0 }}><BankOutlined /> VAT</Divider>
                                    <Form.Item name="vat_company_name" label="Tên Đơn vị"><Input /></Form.Item>
                                    <Row gutter={8}><Col span={10}><Form.Item name="vat_tax_code" label="MST"><Input /></Form.Item></Col><Col span={14}><Form.Item name="vat_address" label="Đia chỉ"><Input /></Form.Item></Col></Row>
                                    <Divider orientation="left">Giao nhận</Divider>
                                    <Form.Item name="delivery_date" label="Ngày Giao (Deadline SX)"><DatePicker style={{width:'100%'}} /></Form.Item>
                                    <Form.Item name="shipping_address" label="Địa chỉ Nhận"><Input.TextArea rows={2} /></Form.Item>
                                </Col>
                            </Row>
                        </Form>
                    )
                },
                !isQuotation && {
                    key: '2', label: 'Thanh toán',
                    children: (
                        <div>
                            <Row gutter={16}>
                                <Col span={8}><Statistic title="Tổng giá trị" value={totalOrder} suffix="đ" /></Col>
                                <Col span={8}><Statistic title="Đã thanh toán" value={totalPaid} valueStyle={{color:'green'}} suffix="đ" /></Col>
                                <Col span={8}><Statistic title="Còn lại" value={remain} valueStyle={{color:'red'}} suffix="đ" /></Col>
                            </Row>
                            <Button type="primary" icon={<DollarOutlined />} onClick={()=>setIsPayModalOpen(true)} style={{margin:'20px 0'}}>Thêm đợt thanh toán</Button>
                            <Table dataSource={paymentHistory} rowKey="id" pagination={false} size="small" columns={[
                                { title: 'Ngày', dataIndex: 'created_at', render: (t:any)=>dayjs(t).format('DD/MM/YY HH:mm') },
                                { title: 'Số tiền', dataIndex: 'amount', render: (v:any)=><b style={{color:'green'}}>{Number(v).toLocaleString()}</b> },
                                { title: 'Nội dung', dataIndex: 'description' },
                            ]} />
                        </div>
                    )
                },
                !isQuotation && {
                    key: '3', label: 'Giao hàng',
                    children: (
                        <div>
                            <Button type="primary" icon={<CarOutlined />} onClick={prepareShipment} style={{marginBottom:15}}>Tạo Phiếu Giao Hàng (Xuất Kho)</Button>
                            <Table dataSource={deliveryHistory} rowKey="id" pagination={false} size="small" columns={[
                                { title: 'Mã phiếu', dataIndex: 'code', render: (t:any)=><b>{t}</b> },
                                { title: 'Ngày giao', dataIndex: 'delivery_date', render: (t:any)=>dayjs(t).format('DD/MM/YYYY') },
                                { title: 'SL Hàng', render: (r:any) => r.items?.reduce((s:number,i:any)=>s+i.quantity,0) },
                                { title: 'Ghi chú', dataIndex: 'note' }
                            ]} expandable={{ expandedRowRender: (rec) => (
                                <ul style={{margin:0}}>{rec.items.map((i:any) => <li key={i.id}>{i.sku} - SL: {i.quantity}</li>)}</ul>
                            )}} />
                        </div>
                    )
                }
            ].filter(Boolean) as any} />

            {/* MODAL PAY */}
            <Modal title="Thanh toán" open={isPayModalOpen} onCancel={()=>setIsPayModalOpen(false)} onOk={handleAddPayment}>
                <p>Nhập số tiền khách thanh toán:</p>
                <InputNumber style={{width:'100%'}} value={payAmount} onChange={(v:any)=>setPayAmount(v)} formatter={v=>`${v}`.replace(/\B(?=(\d{3})+(?!\d))/g,',')} addonAfter="₫" />
            </Modal>

            {/* MODAL SHIP */}
            <Modal title="Tạo Phiếu Xuất Kho / Giao Hàng" open={isShipModalOpen} onCancel={()=>setIsShipModalOpen(false)} onOk={handleConfirmShip}>
                <Input placeholder="Ghi chú giao hàng..." value={shipNote} onChange={e=>setShipNote(e.target.value)} style={{marginBottom:10}} />
                <Table dataSource={shipItems} rowKey="sku" pagination={false} size="small" columns={[
                    { title: 'SKU', dataIndex: 'sku' },
                    { title: 'Đặt', dataIndex: 'max' },
                    { title: 'Giao lần này', render: (_:any, r:any, idx:number) => (
                        <InputNumber max={r.max} min={0} value={r.quantity} onChange={(v:any)=>{
                            const newItems = [...shipItems];
                            newItems[idx].quantity = v;
                            setShipItems(newItems);
                        }} />
                    )}
                ]} />
            </Modal>
        </Modal>
    );
};

export default SalesOrderDetail;