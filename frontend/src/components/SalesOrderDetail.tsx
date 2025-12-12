import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, InputNumber, Row, Col, Tabs, Divider, Button, message, Typography, Space, Tag, DatePicker, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined, ExperimentOutlined, FileImageOutlined, CheckCircleOutlined, BankOutlined, CarOutlined, PrinterOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_URL } from '../config';

// Import Sub-Components
import SalesPayments from './sales/SalesPayments';
import SalesDeliveries from './sales/SalesDeliveries';
import SalesComments from './sales/SalesComments';

const { Text } = Typography;

interface Props { open: boolean; onClose: () => void; onSuccess: () => void; initialData?: any; isQuotation: boolean; customers: any[]; products: any[]; }

const SalesOrderDetail: React.FC<Props> = ({ open, onClose, onSuccess, initialData, isQuotation, customers, products }) => {
    const [form] = Form.useForm();
    const [activeTab, setActiveTab] = useState('1');
    const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);
    const [currentSampleIdx, setCurrentSampleIdx] = useState<number | null>(null);
    const [sampleForm] = Form.useForm();

    const items = Form.useWatch('items', form) || [];
    const vatRate = Form.useWatch('vat_rate', form) || 0;
    const shippingFee = Form.useWatch('shipping_fee', form) || 0;

    const subTotal = items.reduce((sum: number, item: any) => sum + (Number(item?.quantity || 0) * Number(item?.price || 0)), 0);
    const totalAmount = subTotal * (1 + vatRate / 100) + Number(shippingFee);
    
    const canEdit = !initialData || isQuotation || initialData.status === 'QUOTATION' || initialData.status === 'SO_PENDING';
    const hasData = initialData && initialData.id; 

    useEffect(() => {
        if (open && initialData) {
            form.setFieldsValue({
                ...initialData,
                customer_id: initialData.customer?.id || initialData.customer_id,
                delivery_date: initialData.delivery_date ? dayjs(initialData.delivery_date) : null,
                items: (initialData.items || []).map((i: any) => ({ ...i, quantity: Number(i.quantity), price: Number(i.unit_price) }))
            });
        } else if (open) {
            form.resetFields();
            form.setFieldsValue({ isQuotation, order_code: `QUOTE-${dayjs().format('YYMMDD')}-${Math.floor(Math.random() * 1000)}`, items: [{}], vat_rate: 0 });
        }
        setActiveTab('1');
    }, [open, initialData, form]);

    const handleSave = async (values: any) => {
        try {
            const validItems = (values.items || []).filter((i: any) => i && i.sku);
            const payload = { ...values, isQuotation, items: validItems.map((i: any) => ({ ...i, quantity: Number(i.quantity) || 0, price: Number(i.price) || 0 })) };
            if (initialData?.id) await axios.put(`${API_URL}/sales/quote/${initialData.id}`, payload);
            else await axios.post(`${API_URL}/sales/create`, payload);
            message.success('Thành công'); onSuccess(); onClose();
        } catch (e: any) { message.error(e.response?.data?.message || 'Lỗi'); }
    };

    const handleProductChange = (val: string, idx: number) => {
        const p = products.find((x: any) => x.value === val);
        if (p) {
            const current = form.getFieldValue('items');
            current[idx].price = p.price;
            form.setFieldsValue({ items: [...current] });
        }
    };

    const handleCustomerChange = (val: number) => {
        const c = customers.find(x => x.id === val);
        if (c) form.setFieldsValue({ customer_name: c.name, vat_company_name: c.name, vat_tax_code: c.tax_code, vat_address: c.address, receiver_name: c.name, receiver_phone: c.phone, shipping_address: c.address });
    };

    const handleComplete = () => {
        Modal.confirm({
            title: 'Hoàn tất đơn hàng?',
            onOk: async () => { await axios.post(`${API_URL}/sales/${initialData.id}/complete`); message.success('Đã hoàn tất'); onSuccess(); onClose(); }
        });
    };

    // Hàm mở trang in (Portal)
    const handlePrint = () => {
        if(initialData?.uuid) {
            window.open(`/portal/quote/${initialData.uuid}`, '_blank');
        } else {
            message.warning('Vui lòng lưu đơn hàng trước khi in');
        }
    };

    const handleSampleAction = (idx: number) => { setCurrentSampleIdx(idx); sampleForm.setFieldsValue(form.getFieldValue(['items', idx])); setIsSampleModalOpen(true); };
    const saveSampleInfo = () => {
        const items = form.getFieldValue('items');
        items[currentSampleIdx!] = { ...items[currentSampleIdx!], ...sampleForm.getFieldsValue() };
        form.setFieldsValue({ items }); setIsSampleModalOpen(false);
    };
    const approveAllSamples = async () => {
        if(initialData?.id) { await axios.post(`${API_URL}/sales/${initialData.id}/approve-samples`); onSuccess(); onClose(); }
    };

    return (
        <Modal
            title={
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginRight: 30}}>
                    <div style={{display:'flex', gap:10, alignItems:'center'}}>
                        {isQuotation?"Báo Giá":"Đơn Hàng (SO)"}
                        {!canEdit && <Tag color="orange">Khóa</Tag>}
                        {initialData?.status==='COMPLETED'&&<Tag color="green">HOÀN TẤT</Tag>}
                    </div>
                    {/* NÚT IN / XUẤT PDF */}
                    {hasData && <Button icon={<PrinterOutlined />} onClick={handlePrint}>In Đơn Hàng</Button>}
                </div>
            }
            open={open} onCancel={onClose} onOk={() => form.submit()} width={1200} style={{ top: 10 }} okText="Lưu Thông Tin"
        >
            <div style={{textAlign:'right', marginBottom:10}}>
                {!isQuotation && initialData?.status!=='COMPLETED' && <Button danger type="primary" onClick={handleComplete}>Hoàn tất đơn hàng</Button>}
            </div>
            <Form form={form} layout="vertical" onFinish={handleSave}>
                <Form.Item name="order_code" hidden><Input /></Form.Item>
                <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
                    {
                        key: '1', label: '1. Thông tin & Sản phẩm', children: (
                            <Row gutter={24}>
                                <Col span={16} style={{borderRight:'1px solid #f0f0f0'}}>
                                    <Row gutter={16}><Col span={12}><Form.Item name="customer_id" label="Khách Hàng" rules={[{required:true}]}><Select showSearch optionFilterProp="label" options={customers.map(c=>({label:`${c.code} - ${c.name}`,value:c.id}))} onChange={handleCustomerChange} disabled={!canEdit && initialData} /></Form.Item></Col><Col span={12}><Form.Item name="order_code" label="Mã Đơn"><Input disabled style={{fontWeight:'bold', color:'#1890ff'}}/></Form.Item></Col></Row>
                                    {!isQuotation && <div style={{background:'#e6f7ff', padding:10, borderRadius:6, marginBottom:10}}><Row gutter={16}><Col span={12}><Form.Item name="sample_image_url" label="Ảnh Mẫu Chung"><Input prefix={<FileImageOutlined/>}/></Form.Item></Col><Col span={12}><Form.Item name="sample_note" label="Ghi chú kỹ thuật"><Input.TextArea rows={1}/></Form.Item></Col></Row></div>}
                                    <div style={{background:'#fafafa', padding:10, borderRadius:6, border:'1px solid #eee'}}>
                                        <Row gutter={8} style={{marginBottom:5, fontWeight:'bold', borderBottom:'1px solid #ddd'}}><Col span={8}>Sản phẩm</Col><Col span={4}>Màu/Biến thể</Col><Col span={2}>SL</Col><Col span={2}>ĐVT</Col><Col span={3}>Giá</Col><Col span={3}>Thành tiền</Col><Col span={2}>Mẫu</Col></Row>
                                        <Form.List name="items">{(fields,{add,remove})=>(<div style={{maxHeight:300, overflowY:'auto'}}>{fields.map(({key,name,...rest})=>(
                                            <Row key={key} gutter={8} style={{marginBottom:8, borderBottom:'1px dashed #eee'}} align="middle">
                                                <Col span={8}><Form.Item {...rest} name={[name,'sku']} noStyle rules={[{required:true}]}><Select options={products} onChange={(v)=>handleProductChange(v,name)} disabled={!canEdit}/></Form.Item></Col>
                                                <Col span={4}><Form.Item {...rest} name={[name,'variant_color']} noStyle><Input placeholder="Màu..." disabled={!canEdit}/></Form.Item></Col>
                                                <Col span={2}><Form.Item {...rest} name={[name,'quantity']} noStyle rules={[{required:true}]}><InputNumber min={1} style={{width:'100%'}} disabled={!canEdit}/></Form.Item></Col>
                                                <Col span={2} style={{textAlign:'center'}}>Cái</Col>
                                                <Col span={3}><Form.Item {...rest} name={[name,'price']} noStyle rules={[{required:true}]}><InputNumber style={{width:'100%'}} formatter={v=>`${v}`.replace(/\B(?=(\d{3})+(?!\d))/g,',')} disabled={!canEdit}/></Form.Item></Col>
                                                <Col span={3} style={{textAlign:'right'}}>{((items[name]?.quantity||0)*(items[name]?.price||0)).toLocaleString()}</Col>
                                                <Col span={2} style={{textAlign:'center'}}><Space><Tooltip title="Duyệt mẫu"><Button size="small" icon={<ExperimentOutlined/>} style={{color:items[name]?.is_sample_approved?'green':'orange'}} onClick={()=>handleSampleAction(name)}/></Tooltip>{canEdit && <DeleteOutlined onClick={()=>remove(name)} style={{color:'red'}}/>}</Space></Col>
                                            </Row>
                                        ))}{canEdit && <Button type="dashed" onClick={()=>add()} block icon={<PlusOutlined/>}>Thêm dòng</Button>}</div>)}</Form.List>
                                        <Divider style={{margin:'10px 0'}}/>
                                        <Row justify="space-between"><Col>{!isQuotation && <Button type="primary" ghost icon={<CheckCircleOutlined/>} onClick={approveAllSamples}>Duyệt Mẫu (All)</Button>}</Col><Col><div style={{textAlign:'right', minWidth:200}}><Row><Col span={12}>Tổng:</Col><Col span={12}><b>{subTotal.toLocaleString()}</b></Col></Row><Row><Col span={12}>VAT:</Col><Col span={12}><Space><Form.Item name="vat_rate" noStyle><Select size="small" options={[{label:'0%',value:0},{label:'8%',value:8},{label:'10%',value:10}]} /></Form.Item><span>{(subTotal*vatRate/100).toLocaleString()}</span></Space></Col></Row><Row><Col span={12}>Phí VC:</Col><Col span={12}><Form.Item name="shipping_fee" noStyle><InputNumber size="small" style={{width:80}}/></Form.Item></Col></Row><Divider style={{margin:'5px 0'}}/><Row style={{fontSize:16, color:'red'}}><Col span={12}>TỔNG:</Col><Col span={12}><b>{totalAmount.toLocaleString()}</b></Col></Row></div></Col></Row>
                                    </div>
                                </Col>
                                <Col span={8}><div style={{background:'#f9f9f9', padding:15, borderRadius:8}}><Divider orientation="left" style={{marginTop:0}}><BankOutlined/> Hóa Đơn & Giao Nhận</Divider><Form.Item name="vat_company_name" label="Tên Đơn vị"><Input/></Form.Item><Row gutter={8}><Col span={10}><Form.Item name="vat_tax_code" label="MST"><Input/></Form.Item></Col><Col span={14}><Form.Item name="vat_address" label="Địa chỉ"><Input/></Form.Item></Col></Row><Divider orientation="left"><CarOutlined/> Giao nhận</Divider><Form.Item name="delivery_date" label="Ngày Giao"><DatePicker style={{width:'100%'}}/></Form.Item><Form.Item name="shipping_address" label="ĐC Nhận"><Input.TextArea rows={2}/></Form.Item><Row gutter={8}><Col span={12}><Form.Item name="shipping_carrier" label="Hãng VC"><Input/></Form.Item></Col><Col span={12}><Form.Item name="receiver_phone" label="SĐT Nhận"><Input/></Form.Item></Col></Row></div></Col>
                            </Row>
                        )
                    },
                    !isQuotation && { key: '2', label: '2. Thanh toán', children: hasData ? <SalesPayments orderId={initialData.id} orderCode={initialData.order_code} totalAmount={totalAmount} paidAmount={Number(initialData.paid_amount)} onSuccess={onSuccess} /> : <div>Đang tải dữ liệu...</div> },
                    !isQuotation && { key: '3', label: '3. Giao hàng', children: hasData ? <SalesDeliveries orderId={initialData.id} orderItems={items} onSuccess={onSuccess} /> : <div>Đang tải dữ liệu...</div> },
                    !isQuotation && { key: '4', label: '4. Trao đổi', children: hasData ? <SalesComments orderId={initialData.id} /> : <div>Đang tải dữ liệu...</div> }
                ].filter(Boolean) as any} />
            </Form>
            <Modal title="Chi tiết Duyệt Mẫu" open={isSampleModalOpen} onCancel={()=>setIsSampleModalOpen(false)} onOk={saveSampleInfo}><Form form={sampleForm} layout="vertical"><Form.Item name="sample_image" label="Link Ảnh"><Input prefix={<FileImageOutlined/>}/></Form.Item><Form.Item name="sample_note" label="Note"><Input.TextArea/></Form.Item><Form.Item name="is_sample_approved" valuePropName="checked"><div style={{display:'flex', gap:10}}><input type="checkbox"/> <span style={{color:'green', fontWeight:'bold'}}>ĐÃ DUYỆT</span></div></Form.Item></Form></Modal>
        </Modal>
    );
};
export default SalesOrderDetail;