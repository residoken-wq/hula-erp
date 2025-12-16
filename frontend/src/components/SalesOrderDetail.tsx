import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, InputNumber, Row, Col, Tabs, Divider, Button, message, Typography, Space, Tag, DatePicker, Tooltip, Card } from 'antd';
import { PlusOutlined, DeleteOutlined, ExperimentOutlined, FileImageOutlined, CheckCircleOutlined, BankOutlined, CarOutlined, PrinterOutlined, FileTextOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_URL } from '../config';

// Import Sub-Components
import SalesPayments from './sales/SalesPayments';
import SalesDeliveries from './sales/SalesDeliveries';
import SalesComments from './sales/SalesComments';

const { Text } = Typography;

interface Props { open: boolean; onClose: () => void; onSuccess: () => void; initialData?: any; isQuotation: boolean; customers: any[]; products: any[]; }

// DEFAULT TERMS
const DEFAULT_TERMS = `- Báo giá có hiệu lực trong vòng 07 ngày.\n- Thời gian giao hàng: 3-5 ngày (hoặc theo thỏa thuận).\n- Thanh toán: Tạm ứng 50% ngay khi xác nhận đơn, 50% còn lại trước khi giao hàng.`;

const SalesOrderDetail: React.FC<Props> = ({ open, onClose, onSuccess, initialData, isQuotation, customers, products }) => {
    const [form] = Form.useForm();
    const [activeTab, setActiveTab] = useState('1'); // Tab chính của Modal
    const [infoTabKey, setInfoTabKey] = useState('VAT'); // Tab con trong cột phải
    const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);
    const [currentSampleIdx, setCurrentSampleIdx] = useState<number | null>(null);
    const [sampleForm] = Form.useForm();

    const items = Form.useWatch('items', form) || [];
    const vatRate = Form.useWatch('vat_rate', form) || 0;
    const shippingFee = Form.useWatch('shipping_fee', form) || 0;

    const subTotal = items.reduce((sum: number, item: any) => sum + (Number(item?.quantity || 0) * Number(item?.price || 0)), 0);
    const vatAmount = subTotal * (vatRate / 100);
    const totalAmount = subTotal + vatAmount + Number(shippingFee);
    
    const canEdit = !initialData || isQuotation || initialData.status === 'QUOTATION' || initialData.status === 'SO_PENDING';
    const hasData = initialData && initialData.id; 

    useEffect(() => {
        if (open && initialData) {
            form.setFieldsValue({
                ...initialData,
                customer_id: initialData.customer?.id || initialData.customer_id,
                delivery_date: initialData.delivery_date ? dayjs(initialData.delivery_date) : null,
                items: (initialData.items || []).map((i: any) => ({ ...i, quantity: Number(i.quantity), price: Number(i.unit_price) })),
                terms_content: initialData.terms_content || DEFAULT_TERMS
            });
        } else if (open) {
            form.resetFields();
            form.setFieldsValue({ order_code: `QUOTE-${dayjs().format('YYMMDD')}-${Math.floor(Math.random() * 1000)}`, items: [{}], vat_rate: 0, terms_content: DEFAULT_TERMS });
        }
        setActiveTab('1');
        setInfoTabKey('VAT');
    }, [open, initialData, form]);

    const handleSave = async (values: any) => {
        try {
            const validItems = (values.items || []).filter((i: any) => i && i.sku);
            const payload = { ...values, isQuotation, items: validItems.map((i: any) => ({ ...i, quantity: Number(i.quantity) || 0, price: Number(i.price) || 0 })) };
            
            if (initialData?.id) {
                await axios.put(`${API_URL}/sales/quote/${initialData.id}`, payload);
            } else {
                await axios.post(`${API_URL}/sales/create`, { ...payload, isQuotation: isQuotation });
            }
            message.success('Đã lưu thành công'); 
            onSuccess(); 
            onClose();
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

    const handlePrint = () => {
        if(initialData?.uuid) { window.open(`/portal/quote/${initialData.uuid}`, '_blank'); } else { message.warning('Vui lòng lưu đơn hàng trước khi in'); }
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
                        <Text strong style={{fontSize: 18}}>{isQuotation?"Báo Giá":"Đơn Hàng (SO)"} &nbsp; #{initialData?.order_code || 'Tạo Mới'}</Text>
                        {!canEdit && <Tag color="orange">Đã khóa</Tag>}
                        {initialData?.status==='COMPLETED'&&<Tag color="green">HOÀN TẤT</Tag>}
                    </div>
                    {hasData && <Button icon={<PrinterOutlined />} onClick={handlePrint}>In Đơn Hàng</Button>}
                </div>
            }
            open={open} onCancel={onClose} onOk={() => form.submit()} width={1200} style={{ top: 10 }} okText="Lưu Thông Tin">
            
            {/* Action Bar */}
            <div style={{textAlign:'right', marginBottom:10}}>
                {!isQuotation && initialData?.status!=='COMPLETED' && <Button danger type="primary" onClick={handleComplete}>Hoàn tất đơn hàng</Button>}
            </div>
            
            <Form form={form} layout="vertical" onFinish={handleSave}>
                <Form.Item name="order_code" hidden><Input /></Form.Item>
                <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
                    {
                        key: '1', label: '1. Thông tin & Sản phẩm', children: (
                            <Row gutter={24}>
                                {/* Cột Trái: Thông tin chung & Items */}
                                <Col span={16} style={{borderRight:'1px solid #f0f0f0'}}>
                                    
                                    <Card title="Thông tin chung" size="small" style={{marginBottom: 16}}>
                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item name="customer_id" label="Khách Hàng" rules={[{required:true}]}>
                                                    <Select showSearch optionFilterProp="label" options={customers.map(c=>({label:`${c.code} - ${c.name}`,value:c.id}))} onChange={handleCustomerChange} disabled={!canEdit && initialData} placeholder="Chọn Khách hàng" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item name="order_code" label="Mã Đơn">
                                                    <Input disabled style={{fontWeight:'bold', color:'#1890ff'}}/>
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    </Card>
                                    
                                    {/* Khối Duyệt Mẫu chung */}
                                    {!isQuotation && <div style={{background:'#e6f7ff', padding:10, borderRadius:6, marginBottom:16}}><Row gutter={16}><Col span={12}><Form.Item name="sample_image_url" label="Ảnh Mẫu Chung" style={{marginBottom: 0}}><Input prefix={<FileImageOutlined/>}/></Form.Item></Col><Col span={12}><Form.Item name="sample_note" label="Ghi chú kỹ thuật" style={{marginBottom: 0}}><Input.TextArea rows={1}/></Form.Item></Col></Row></div>}
                                    
                                    <Card title="Danh sách Sản phẩm" size="small">
                                        
                                        {/* FIX HEADER: Tăng span Sản phẩm lên 12, đảm bảo hiển thị full tên sản phẩm */}
                                        <Row gutter={8} style={{marginBottom:5, fontWeight:'bold', borderBottom:'2px solid #ddd', paddingBottom: 5}}>
                                            <Col span={12}>Sản phẩm</Col>
                                            <Col span={2}>Màu/Biến thể</Col>
                                            <Col span={2}>SL</Col>
                                            <Col span={1}>ĐVT</Col>
                                            <Col span={3}>Giá</Col>
                                            <Col span={2}>Thành tiền</Col>
                                            <Col span={2}>Mẫu</Col>
                                        </Row>
                                        
                                        <Form.List name="items">{(fields,{add,remove})=>(<div style={{maxHeight:300, overflowY:'auto', paddingRight: 5}}>{fields.map(({key,name,...rest})=>(
                                            <Row key={key} gutter={8} style={{marginBottom:8, borderBottom:'1px dashed #eee', paddingBottom: 8}} align="middle">
                                                
                                                {/* FIX ITEM ROW: Tăng span Sản phẩm lên 12 */}
                                                <Col span={12}>
                                                    <Form.Item {...rest} name={[name,'sku']} noStyle rules={[{required:true}]}>
                                                        {/* --- FIX: BỔ SUNG TÍNH NĂNG SEARCH VÀ FILTER --- */}
                                                        <Select 
                                                            options={products} 
                                                            onChange={(v)=>handleProductChange(v,name)} 
                                                            disabled={!canEdit} 
                                                            placeholder="Chọn Sản phẩm/SKU trong danh sách sản phẩm"
                                                            showSearch // Kích hoạt ô tìm kiếm
                                                            optionFilterProp="label" // Lọc theo nội dung label (SKU - Name)
                                                            filterOption={(input, option) =>
                                                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                                            } // Hàm filter tùy chỉnh
                                                        />
                                                        {/* -------------------------------------------------- */}
                                                    </Form.Item>
                                                </Col>
                                                <Col span={2}><Form.Item {...rest} name={[name,'variant_color']} noStyle><Input placeholder="Màu..." disabled={!canEdit}/></Form.Item></Col>
                                                <Col span={2}><Form.Item {...rest} name={[name,'quantity']} noStyle rules={[{required:true}]}><InputNumber min={1} style={{width:'100%'}} disabled={!canEdit}/></Form.Item></Col>
                                                <Col span={1} style={{textAlign:'center'}}><Text type="secondary" style={{fontSize: 12}}>Cái</Text></Col>
                                                <Col span={3}><Form.Item {...rest} name={[name,'price']} noStyle rules={[{required:true}]}><InputNumber style={{width:'100%'}} formatter={v=>`${v}`.replace(/\B(?=(\d{3})+(?!\d))/g,',')} disabled={!canEdit}/></Form.Item></Col>
                                                <Col span={2} style={{textAlign:'right'}}><Text strong style={{fontSize: 13}}>{((items[name]?.quantity||0)*(items[name]?.price||0)).toLocaleString()}</Text></Col>
                                                <Col span={2} style={{textAlign:'center'}}><Space><Tooltip title="Duyệt mẫu"><Button size="small" icon={<ExperimentOutlined/>} style={{color:items[name]?.is_sample_approved?'green':'orange'}} onClick={()=>handleSampleAction(name)}/></Tooltip>{canEdit && <DeleteOutlined onClick={()=>remove(name)} style={{color:'red'}}/>}</Space></Col>
                                            </Row>
                                        ))}{canEdit && <Button type="dashed" onClick={()=>add()} block icon={<PlusOutlined/>}>Thêm dòng</Button>}</div>)}</Form.List>
                                        
                                        <Divider style={{margin:'15px 0 10px 0'}}/>
                                        
                                        {/* --- GIAO DIỆN TỔNG TIỀN (MODERN/CLEAN) --- */}
                                        <Row justify="space-between" align="bottom">
                                            <Col span={10}>
                                                {!isQuotation && initialData?.status === 'SO_PENDING' && <Button type="primary" ghost icon={<CheckCircleOutlined/>} onClick={approveAllSamples}>Duyệt Mẫu (All)</Button>}
                                            </Col>
                                            <Col span={14}>
                                                <div style={{background: '#e6f7ff', padding: '15px', borderRadius: 8, border: '1px solid #91d5ff'}}>
                                                    <div style={{display:'flex', justifyContent:'space-between', marginBottom: 8}}>
                                                        <Text type="secondary">Cộng tiền hàng:</Text>
                                                        <Text strong>{subTotal.toLocaleString()}</Text>
                                                    </div>
                                                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 8}}>
                                                        <Text type="secondary">Thuế VAT:</Text>
                                                        <Space>
                                                            <Form.Item name="vat_rate" noStyle><Select size="small" style={{width: 70}} options={[{label:'0%',value:0},{label:'8%',value:8},{label:'10%',value:10}]} disabled={!canEdit}/></Form.Item>
                                                            <Text>{vatAmount.toLocaleString()}</Text>
                                                        </Space>
                                                    </div>
                                                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 12}}>
                                                        <Text type="secondary">Phí vận chuyển:</Text>
                                                        <Form.Item name="shipping_fee" noStyle><InputNumber size="small" style={{width: 100, textAlign: 'right'}} formatter={v=>`${v}`.replace(/\B(?=(\d{3})+(?!\d))/g,',')} disabled={!canEdit}/></Form.Item>
                                                    </div>
                                                    <Divider style={{margin: '10px 0'}} />
                                                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                                        <Text strong style={{fontSize: 18, color: '#0050b3'}}>TỔNG CỘNG:</Text>
                                                        <Text strong style={{fontSize: 24, color: '#cf1322'}}>{totalAmount.toLocaleString()} ₫</Text>
                                                    </div>
                                                </div>
                                            </Col>
                                        </Row>
                                        {/* ----------------------------------------------------- */}
                                    </Card>
                                </Col>
                                
                                {/* Cột Phải: TÁCH THÀNH TABS */}
                                <Col span={8}>
                                    <Tabs 
                                        activeKey={infoTabKey} 
                                        onChange={setInfoTabKey} 
                                        type="card"
                                        size="small"
                                        items={[
                                            {
                                                key: 'VAT',
                                                label: <Space><BankOutlined/> Hóa Đơn</Space>,
                                                children: (
                                                    <Card size="small">
                                                        <Form.Item name="vat_company_name" label="Tên Đơn vị"><Input disabled={!canEdit}/></Form.Item>
                                                        <Row gutter={8}>
                                                            <Col span={10}><Form.Item name="vat_tax_code" label="MST"><Input disabled={!canEdit}/></Form.Item></Col>
                                                            <Col span={14}><Form.Item name="vat_address" label="Địa chỉ"><Input disabled={!canEdit}/></Form.Item></Col>
                                                        </Row>
                                                    </Card>
                                                )
                                            },
                                            {
                                                key: 'SHIP',
                                                label: <Space><CarOutlined/> Giao Nhận</Space>,
                                                children: (
                                                    <Card size="small">
                                                        <Form.Item name="delivery_date" label="Ngày Giao"><DatePicker style={{width:'100%'}} disabled={!canEdit}/></Form.Item>
                                                        <Form.Item name="shipping_address" label="ĐC Nhận"><Input.TextArea rows={2} disabled={!canEdit}/></Form.Item>
                                                        <Row gutter={8}>
                                                            <Col span={12}><Form.Item name="shipping_carrier" label="Hãng VC"><Input disabled={!canEdit}/></Form.Item></Col>
                                                            <Col span={12}><Form.Item name="receiver_phone" label="SĐT Nhận"><Input disabled={!canEdit}/></Form.Item></Col>
                                                        </Row>
                                                    </Card>
                                                )
                                            },
                                            {
                                                key: 'TERM',
                                                label: <Space style={{color:'#d48806'}}><FileTextOutlined/> Điều khoản</Space>,
                                                children: (
                                                    <Card size="small" headStyle={{ background: '#fffbe6', border: '1px solid #ffe58f' }}>
                                                        <div style={{textAlign: 'right'}}><Button size="small" type="link" onClick={() => form.setFieldValue('terms_content', DEFAULT_TERMS)}>Mặc định</Button></div>
                                                        <Form.Item name="terms_content" noStyle>
                                                            <Input.TextArea 
                                                                rows={8} 
                                                                placeholder="Nhập điều khoản báo giá..." 
                                                                style={{fontSize: 12, lineHeight: 1.5, background: '#fff'}}
                                                                disabled={!canEdit}
                                                            />
                                                        </Form.Item>
                                                    </Card>
                                                )
                                            }
                                        ]}
                                    />
                                </Col>
                            </Row>
                        )
                    },
                    !isQuotation && { key: '2', label: '2. Thanh toán', children: hasData ? <SalesPayments orderId={initialData.id} orderCode={initialData.order_code} totalAmount={totalAmount} paidAmount={Number(initialData.paid_amount)} onSuccess={onSuccess} /> : <div>Đang tải dữ liệu...</div> },
                    !isQuotation && { key: '3', label: '3. Giao hàng', children: hasData ? <SalesDeliveries orderId={initialData.id} orderItems={items} onSuccess={onSuccess} /> : <div>Đang tải dữ liệu...</div> },
                    !isQuotation && { key: '4', label: '4. Trao đổi', children: hasData ? <SalesComments orderId={initialData.id} /> : <div>Đang tải dữ liệu...</div> }
                ].filter(Boolean) as any} />
            </Form>
            
            {/* Modal Duyệt Mẫu */}
            <Modal title="Chi tiết Duyệt Mẫu" open={isSampleModalOpen} onCancel={()=>setIsSampleModalOpen(false)} onOk={saveSampleInfo}>
                <Form form={sampleForm} layout="vertical">
                    <Form.Item name="sample_image" label="Link Ảnh"><Input prefix={<FileImageOutlined/>}/></Form.Item>
                    <Form.Item name="sample_note" label="Note"><Input.TextArea/></Form.Item>
                    <Form.Item name="is_sample_approved" valuePropName="checked">
                        <div style={{display:'flex', gap:10}}><input type="checkbox"/> <span style={{color:'green', fontWeight:'bold'}}>ĐÃ DUYỆT</span></div>
                    </Form.Item>
                </Form>
            </Modal>
        </Modal>
    );
};
export default SalesOrderDetail;