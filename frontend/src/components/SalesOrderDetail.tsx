import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, InputNumber, Row, Col, Tabs, Divider, Button, message, Typography, Space, Tag, DatePicker, Table, Statistic, Tooltip, Radio } from 'antd';
import { PlusOutlined, CarOutlined, BankOutlined, DeleteOutlined, DollarOutlined, ExperimentOutlined, FileImageOutlined, CheckCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_URL } from '../config';

const { Text } = Typography;

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
    const [activeTab, setActiveTab] = useState('1');
    
    const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
    const [deliveryHistory, setDeliveryHistory] = useState<any[]>([]);
    const [shipItems, setShipItems] = useState<any[]>([]);

    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [payAmount, setPayAmount] = useState<number>(0);
    const [payType, setPayType] = useState('DEPOSIT');
    const [payNote, setPayNote] = useState('');

    const [isShipModalOpen, setIsShipModalOpen] = useState(false);
    const [shipNote, setShipNote] = useState('');
    
    const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);
    const [currentSampleItemIndex, setCurrentSampleItemIndex] = useState<number | null>(null);
    const [sampleForm] = Form.useForm();

    const items = Form.useWatch('items', form) || [];
    const vatRate = Form.useWatch('vat_rate', form) || 0;
    const shippingFee = Form.useWatch('shipping_fee', form) || 0;

    const isPendingSample = initialData?.status === 'SO_PENDING';
    const canEditItems = !initialData || isQuotation || initialData.status === 'QUOTATION' || isPendingSample;

    const subTotal = items.reduce((sum: number, item: any) => sum + (Number(item?.quantity || 0) * Number(item?.price || 0)), 0);
    const vatAmount = subTotal * (vatRate / 100);
    const totalAmount = subTotal + vatAmount + Number(shippingFee);
    const totalPaid = paymentHistory.reduce((s, x:any) => s + Number(x.amount), 0);
    const remain = totalAmount - totalPaid;

    useEffect(() => {
        if (open) {
            setActiveTab('1');
            if (initialData) {
                const mappedItems = initialData.items.map((i: any) => ({
                    sku: i.sku,
                    quantity: Number(i.quantity),
                    price: Number(i.unit_price),
                    variant_color: i.variant_color,
                    is_sample_approved: i.is_sample_approved,
                    sample_image: i.sample_image,
                    sample_note: i.sample_note
                }));
                form.setFieldsValue({
                    ...initialData,
                    customer_id: initialData.customer?.id || initialData.customer_id,
                    delivery_date: initialData.delivery_date ? dayjs(initialData.delivery_date) : null,
                    vat_rate: initialData.vat_rate || 0,
                    shipping_fee: initialData.shipping_fee || 0,
                    items: mappedItems
                });
                if (!isQuotation) loadHistory(initialData);
            } else {
                form.resetFields();
                form.setFieldsValue({
                    isQuotation: isQuotation,
                    order_code: `${isQuotation ? 'QUOTE' : 'SO'}-${dayjs().format('YYMMDD')}-${Math.floor(Math.random() * 1000)}`,
                    items: [{}],
                    vat_rate: 0
                });
            }
        }
    }, [open, initialData, isQuotation, form]);

    const loadHistory = async (order: any) => {
        try {
            const resPay = await axios.get(`${API_URL}/sales/${order.order_code}/payments`);
            setPaymentHistory(Array.isArray(resPay.data) ? resPay.data : []);
            const resShip = await axios.get(`${API_URL}/sales/${order.id}/deliveries`);
            setDeliveryHistory(Array.isArray(resShip.data) ? resShip.data : []);
        } catch(e) {
            setPaymentHistory([]);
            setDeliveryHistory([]);
        }
    };

    const handleSave = async (values: any) => {
        try {
            const validItems = (values.items || []).filter((i:any) => i && i.sku);
            const payload = {
                ...values,
                isQuotation: isQuotation,
                items: validItems.map((i: any) => ({ 
                    sku: i.sku, 
                    quantity: Number(i.quantity) || 0, 
                    price: Number(i.price) || 0,
                    variant_color: i.variant_color,
                    is_sample_approved: i.is_sample_approved,
                    sample_image: i.sample_image,
                    sample_note: i.sample_note
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
        } catch (e: any) { message.error(e.response?.data?.message || 'Lỗi'); }
    };

    const handleProductChange = (val: string, index: number) => {
        const p = products.find((x: any) => x.value === val);
        if (p) {
            const currentItems = form.getFieldValue('items');
            currentItems[index].price = p.price;
            form.setFieldsValue({ items: [...currentItems] });
        }
    };

    const handleCustomerChange = (val: number) => {
        const c = customers.find(x => x.id === val);
        if (c) form.setFieldsValue({ customer_name: c.name, vat_company_name: c.name, vat_tax_code: c.tax_code, vat_address: c.address, receiver_name: c.name, receiver_phone: c.phone, shipping_address: c.address });
    };

    const openItemSample = (index: number) => {
        const item = form.getFieldValue(['items', index]);
        setCurrentSampleItemIndex(index);
        sampleForm.setFieldsValue({ sample_image: item.sample_image, sample_note: item.sample_note, is_sample_approved: item.is_sample_approved });
        setIsSampleModalOpen(true);
    };

    const saveItemSample = () => {
        if (currentSampleItemIndex !== null) {
            const vals = sampleForm.getFieldsValue();
            const currentItems = form.getFieldValue('items');
            currentItems[currentSampleItemIndex] = { ...currentItems[currentSampleItemIndex], ...vals };
            form.setFieldsValue({ items: currentItems });
            setIsSampleModalOpen(false);
            message.success('Đã lưu');
        }
    };

    const handleApproveAllSamples = async () => {
        Modal.confirm({
            title: 'Xác nhận duyệt mẫu toàn bộ?',
            onOk: async () => {
                if (initialData?.id) {
                    await axios.post(`${API_URL}/sales/${initialData.id}/approve-samples`);
                    message.success('Đã duyệt toàn bộ!');
                    onSuccess(); onClose();
                } else {
                    const currentItems = form.getFieldValue('items').map((i:any) => ({...i, is_sample_approved: true}));
                    form.setFieldsValue({ items: currentItems });
                    message.success('Đã đánh dấu trên UI');
                }
            }
        });
    };

    const openPaymentModal = () => {
        setPayType('DEPOSIT');
        setPayAmount(remain > 0 ? remain : 0);
        setPayNote('');
        setIsPayModalOpen(true);
    };

    const handleAddPayment = async () => {
        if (payAmount <= 0) return message.warning('Vui lòng nhập số tiền hợp lệ');
        let prefix = '';
        if (payType === 'DEPOSIT') prefix = '[ĐẶT CỌC]';
        else if (payType === 'FINAL') prefix = '[TẤT TOÁN]';
        else prefix = '[THANH TOÁN]';

        try {
            await axios.post(`${API_URL}/finance/payment`, {
                type: 'INCOME',
                amount: payAmount,
                refCode: initialData.order_code,
                note: `${prefix} ${payNote || ''}`.trim()
            });
            message.success('Đã ghi nhận thanh toán!');
            setIsPayModalOpen(false);
            loadHistory(initialData);
            onSuccess();
        } catch (e: any) {
            message.error(e.response?.data?.message || 'Lỗi hệ thống');
        }
    };
    
    const prepareShipment = () => { setShipItems(initialData.items.map((i:any)=>({sku:i.sku, max:i.quantity, quantity:i.quantity}))); setIsShipModalOpen(true); };
    
    const handleConfirmShip = async () => {
        try {
            await axios.post(`${API_URL}/sales/${initialData.id}/delivery`, { code: `DO-${dayjs().format('YYMMDD')}-${Math.floor(Math.random()*100)}`, date: new Date(), note: shipNote, items: shipItems });
            message.success('Đã xuất kho'); setIsShipModalOpen(false); loadHistory(initialData); onSuccess();
        } catch(e) { message.error('Lỗi'); }
    };

    return (
        <Modal
            title={<div style={{display:'flex', alignItems:'center', gap: 10}}>{isQuotation ? "Báo Giá Chi Tiết" : "Quản Lý Đơn Hàng (SO)"}{!canEditItems && <Tag color="orange">Khóa SP</Tag>}{isPendingSample && <Tag color="blue" icon={<ExperimentOutlined/>}>Đang Duyệt Mẫu</Tag>}</div>}
            open={open} onCancel={onClose} onOk={() => form.submit()} width={1200} style={{ top: 10 }} okText="Lưu Thông Tin"
        >
            <Form form={form} layout="vertical" onFinish={handleSave}>
                <Form.Item name="order_code" hidden><Input /></Form.Item>
                <Form.Item name="isQuotation" hidden><Input /></Form.Item>

                <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
                    {
                        key: '1', label: '1. Thông tin & Sản phẩm',
                        children: (
                            <Row gutter={24}>
                                <Col span={16} style={{ borderRight: '1px solid #f0f0f0' }}>
                                    <Row gutter={16}><Col span={12}><Form.Item name="customer_id" label={<span style={{color:'red'}}>* Khách Hàng</span>} rules={[{required:true}]}><Select showSearch optionFilterProp="label" options={customers.map(c => ({ label: `${c.code} - ${c.name}`, value: c.id }))} onChange={handleCustomerChange} disabled={!canEditItems && initialData} /></Form.Item></Col><Col span={12}><Form.Item name="order_code" label="Mã Đơn"><Input disabled style={{ fontWeight: 'bold', color: '#1890ff' }} /></Form.Item></Col></Row>
                                    
                                    {!isQuotation && (<div style={{background:'#e6f7ff', padding:10, borderRadius:6, marginBottom:15, border:'1px solid #91d5ff'}}><Divider orientation="left" style={{marginTop:0, marginBottom:10}}><ExperimentOutlined /> Thông Tin Duyệt Mẫu Chung</Divider><Row gutter={16}><Col span={12}><Form.Item name="sample_image_url" label="Link Ảnh Mẫu (Đã duyệt)"><Input prefix={<FileImageOutlined/>} /></Form.Item></Col><Col span={12}><Form.Item name="sample_note" label="Ghi chú kỹ thuật"><Input.TextArea rows={1} /></Form.Item></Col></Row></div>)}

                                    <div style={{background: '#fafafa', padding: 10, borderRadius: 6, border: '1px solid #eee'}}>
                                        <Row gutter={8} style={{marginBottom: 5, fontWeight: 600, color: '#666', fontSize: 12, borderBottom:'1px solid #ddd', paddingBottom:5}}><Col span={8}>Tên sản phẩm</Col><Col span={4}>Màu sắc / Biến thể</Col><Col span={2}>Số Lượng</Col><Col span={2} style={{textAlign:'center'}}>ĐVT</Col><Col span={3} style={{textAlign:'right'}}>Đơn giá</Col><Col span={3} style={{textAlign:'right'}}>Thành tiền</Col><Col span={2} style={{textAlign:'center'}}>Duyệt Mẫu</Col></Row>
                                        <Form.List name="items">{(fields, { add, remove }) => (<div style={{maxHeight: 300, overflowY:'auto'}}>{fields.map(({ key, name, ...restField }) => {
                                            const currentItem = form.getFieldValue(['items', name]);
                                            const currentProd = products.find(p => p.value === currentItem?.sku);
                                            const subTotalItem = (Number(currentItem?.quantity)||0) * (Number(currentItem?.price)||0);
                                            return (<Row key={key} gutter={8} style={{ marginBottom: 8, borderBottom:'1px dashed #eee', paddingBottom:5 }} align="middle"><Col span={8}><Form.Item {...restField} name={[name, 'sku']} style={{ marginBottom: 0 }} rules={[{ required: true }]}><Select placeholder="Chọn SP..." options={products} onChange={(v) => handleProductChange(v, name)} dropdownMatchSelectWidth={400} disabled={!canEditItems} /></Form.Item></Col><Col span={4}><Form.Item {...restField} name={[name, 'variant_color']} style={{ marginBottom: 0 }}><Input placeholder="Màu..." disabled={!canEditItems} /></Form.Item></Col><Col span={2}><Form.Item {...restField} name={[name, 'quantity']} style={{ marginBottom: 0 }} rules={[{ required: true }]}><InputNumber min={1} style={{width:'100%'}} disabled={!canEditItems} /></Form.Item></Col><Col span={2} style={{textAlign:'center'}}><span style={{color:'#888', fontSize:12, background:'#eee', padding:'2px 5px', borderRadius:4}}>{currentProd?.unit || 'Cái'}</span></Col><Col span={3}><Form.Item {...restField} name={[name, 'price']} style={{ marginBottom: 0 }} rules={[{ required: true }]}><InputNumber style={{width:'100%'}} formatter={v=>`${v}`.replace(/\B(?=(\d{3})+(?!\d))/g,',')} disabled={!canEditItems} /></Form.Item></Col><Col span={3} style={{textAlign:'right', fontWeight:500, color:'#555'}}>{subTotalItem.toLocaleString()}</Col><Col span={2} style={{textAlign:'center'}}><Space size={2}><Tooltip title={currentItem?.is_sample_approved ? "Đã duyệt" : "Chưa duyệt"}><Button size="small" icon={<ExperimentOutlined />} style={{color: currentItem?.is_sample_approved ? 'green' : 'orange'}} onClick={() => openItemSample(name)} /></Tooltip>{canEditItems && <DeleteOutlined onClick={() => remove(name)} style={{ color: 'red', cursor: 'pointer' }} />}</Space></Col></Row>)
                                        })}{canEditItems && <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} style={{marginTop:5}}>Thêm dòng</Button>}</div>)}</Form.List>
                                        <Divider style={{margin: '10px 0'}} />
                                        <Row justify="space-between" align="middle"><Col>{!isQuotation && <Button type="primary" ghost icon={<CheckCircleOutlined />} onClick={handleApproveAllSamples}>Xác nhận Đã Duyệt Mẫu (All)</Button>}</Col><Col><div style={{textAlign: 'right', lineHeight: '2.2em', minWidth: 300}}><Row><Col span={14}><Text type="secondary">Cộng tiền hàng:</Text></Col><Col span={10}><b>{subTotal.toLocaleString()}</b></Col></Row><Row align="middle"><Col span={14}><Text type="secondary">Thuế VAT:</Text></Col><Col span={10}><Space><Form.Item name="vat_rate" noStyle><Select style={{width: 70}} size="small" options={[{label:'0%',value:0},{label:'5%',value:5},{label:'8%',value:8},{label:'10%',value:10}]} /></Form.Item><span style={{display:'inline-block', width: 90, textAlign:'right'}}>{vatAmount.toLocaleString()}</span></Space></Col></Row><Row><Col span={14}><Text type="secondary">Phí vận chuyển:</Text></Col><Col span={10}>{Number(shippingFee).toLocaleString()}</Col></Row><Divider style={{margin: '5px 0'}} /><Row><Col span={14}><Text strong style={{fontSize: 16}}>TỔNG CỘNG:</Text></Col><Col span={10}><Text strong style={{fontSize: 18, color: '#cf1322'}}>{totalAmount.toLocaleString()} ₫</Text></Col></Row></div></Col></Row>
                                    </div>
                                </Col>
                                <Col span={8}>
                                    <div style={{background: '#f9f9f9', padding: 15, borderRadius: 8}}>
                                        <Divider orientation="left" style={{ marginTop: 0 }}><BankOutlined /> VAT Invoice Info</Divider>
                                        <Form.Item name="vat_company_name" label="Tên Đơn vị"><Input placeholder="Để trống nếu khách lẻ" /></Form.Item>
                                        <Row gutter={8}><Col span={10}><Form.Item name="vat_tax_code" label="MST"><Input /></Form.Item></Col><Col span={14}><Form.Item name="vat_address" label="Địa chỉ"><Input /></Form.Item></Col></Row>
                                        <Divider orientation="left">Giao nhận</Divider>
                                        <Form.Item name="delivery_date" label="Ngày Giao (Deadline SX)"><DatePicker style={{width:'100%'}} /></Form.Item>
                                        <Form.Item name="shipping_address" label="Địa chỉ Nhận"><Input.TextArea rows={2} /></Form.Item>
                                        <Row gutter={8}><Col span={12}><Form.Item name="shipping_carrier" label="Hãng VC"><Input placeholder="GHTK..." prefix={<CarOutlined/>} /></Form.Item></Col><Col span={12}><Form.Item name="shipping_fee" label="Phí VC"><InputNumber style={{width:'100%'}} formatter={v=>`${v}`.replace(/\B(?=(\d{3})+(?!\d))/g,',')} /></Form.Item></Col></Row>
                                    </div>
                                </Col>
                            </Row>
                        )
                    },
                    /* --- PHẦN SỬA LỖI: HIỂN THỊ CỘT NỘI DUNG --- */
                    !isQuotation && { key: '2', label: '2. Thanh toán', children: (
                        <div>
                            <Row gutter={16}>
                                <Col span={8}><Statistic title="Tổng giá trị" value={totalAmount} suffix="đ" /></Col>
                                <Col span={8}><Statistic title="Đã thanh toán" value={totalPaid} valueStyle={{color:'green'}} suffix="đ" /></Col>
                                <Col span={8}><Statistic title="Còn lại" value={remain} valueStyle={{color:'red'}} suffix="đ" /></Col>
                            </Row>
                            <Divider />
                            <div style={{display:'flex', justifyContent:'space-between', marginBottom:10}}>
                                <b>Lịch sử thanh toán:</b>
                                <Button type="primary" icon={<DollarOutlined />} onClick={openPaymentModal}>Thêm đợt thanh toán</Button>
                            </div>
                            <Table dataSource={paymentHistory} rowKey="id" pagination={false} size="small" bordered columns={[
                                { title: 'Ngày', dataIndex: 'created_at', render: (t:any)=>dayjs(t).format('DD/MM/YYYY HH:mm') },
                                { title: 'Số tiền', dataIndex: 'amount', align:'right', render: (v:any)=><b style={{color:'green'}}>{Number(v).toLocaleString()}</b> },
                                // --- FIX: Đổi dataIndex thành 'note' (vì DB lưu là note) ---
                                { title: 'Nội dung', dataIndex: 'note' } 
                            ]} />
                        </div>
                    ) },
                    !isQuotation && { key: '3', label: '3. Giao hàng & Xuất kho', children: (<div><div style={{display:'flex', justifyContent:'space-between', marginBottom:10}}><b>Lịch sử giao hàng:</b><Button type="primary" icon={<CarOutlined />} onClick={prepareShipment}>Tạo Phiếu Giao Hàng</Button></div><Table dataSource={deliveryHistory} rowKey="id" pagination={false} size="small" bordered columns={[{ title: 'Mã phiếu', dataIndex: 'code', render: (t:any)=><b>{t}</b> }, { title: 'Ngày giao', dataIndex: 'delivery_date', render: (t:any)=>dayjs(t).format('DD/MM/YYYY') }, { title: 'SL Hàng', align:'center', render: (r:any) => r.items?.reduce((s:number,i:any)=>s+i.quantity,0) }, { title: 'Ghi chú', dataIndex: 'note' }]} expandable={{ expandedRowRender: (rec) => (<ul style={{margin:0, paddingLeft:20}}>{rec.items.map((i:any) => <li key={i.id}>{i.sku} - SL: {i.quantity}</li>)}</ul>)}} /></div>) }
                ].filter(Boolean) as any} />
            </Form>

            <Modal title="Chi tiết Duyệt Mẫu Sản Phẩm" open={isSampleModalOpen} onCancel={()=>setIsSampleModalOpen(false)} onOk={saveItemSample}><Form form={sampleForm} layout="vertical"><Form.Item name="sample_image" label="Link Ảnh Mẫu (Đã duyệt)"><Input prefix={<FileImageOutlined/>} placeholder="https://..." /></Form.Item><Form.Item name="sample_note" label="Ghi chú kỹ thuật"><Input.TextArea rows={3} /></Form.Item><Form.Item name="is_sample_approved" valuePropName="checked"><div style={{display:'flex', alignItems:'center', gap:10}}><input type="checkbox"/> <span style={{fontWeight:'bold', color:'green'}}>ĐÃ DUYỆT MẪU NÀY</span></div></Form.Item></Form></Modal>
            
            <Modal title="Thêm Đợt Thanh Toán" open={isPayModalOpen} onCancel={()=>setIsPayModalOpen(false)} onOk={handleAddPayment}>
                <Form layout="vertical">
                    <Form.Item label="Số tiền khách trả">
                        <InputNumber style={{width:'100%', fontWeight:'bold'}} size="large" value={payAmount} onChange={(v:any)=>setPayAmount(v)} formatter={v=>`${v}`.replace(/\B(?=(\d{3})+(?!\d))/g,',')} addonAfter="₫" />
                    </Form.Item>
                    <Form.Item label="Phân loại">
                        <Radio.Group value={payType} onChange={e=>setPayType(e.target.value)}>
                            <Radio.Button value="DEPOSIT">Đặt Cọc</Radio.Button>
                            <Radio.Button value="PAYMENT">Thanh Toán Đợt</Radio.Button>
                            <Radio.Button value="FINAL">Tất Toán</Radio.Button>
                        </Radio.Group>
                    </Form.Item>
                    <Form.Item label="Nội dung / Ghi chú">
                        <Input.TextArea rows={2} value={payNote} onChange={e=>setPayNote(e.target.value)} placeholder="VD: Khách chuyển khoản VCB..." />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal title="Tạo Phiếu Xuất Kho / Giao Hàng" open={isShipModalOpen} onCancel={()=>setIsShipModalOpen(false)} onOk={handleConfirmShip} width={600}><Input placeholder="Ghi chú giao hàng..." value={shipNote} onChange={e=>setShipNote(e.target.value)} style={{marginBottom:10}} /><Table dataSource={shipItems} rowKey="sku" pagination={false} size="small" columns={[{ title: 'SKU', dataIndex: 'sku' }, { title: 'SL Đặt', dataIndex: 'max' }, { title: 'Giao lần này', render: (_:any, r:any, idx:number) => (<InputNumber max={r.max} min={0} value={r.quantity} onChange={(v:any)=>{ const newItems = [...shipItems]; newItems[idx].quantity = v; setShipItems(newItems); }} />) }]} /></Modal>
        </Modal>
    );
};

export default SalesOrderDetail;