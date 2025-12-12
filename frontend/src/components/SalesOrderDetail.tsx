import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, InputNumber, Row, Col, Tabs, Divider, Button, message, Typography, Space, Tag, DatePicker } from 'antd'; // FIX: Thêm DatePicker
import { PlusOutlined, MinusCircleOutlined, CarOutlined, BankOutlined, SaveOutlined, DeleteOutlined } from '@ant-design/icons';
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
    
    // Watch values để tính toán real-time
    const items = Form.useWatch('items', form) || [];
    const vatRate = Form.useWatch('vat_rate', form) || 0;
    const shippingFee = Form.useWatch('shipping_fee', form) || 0;

    // --- LOGIC QUYỀN CHỈNH SỬA ---
    const canEditItems = !initialData || 
                         isQuotation || 
                         initialData.status === 'QUOTATION' || 
                         initialData.status === 'SO_PENDING';

    // --- LOGIC TÍNH TIỀN ---
    const subTotal = items.reduce((sum: number, item: any) => sum + (Number(item?.quantity || 0) * Number(item?.price || 0)), 0);
    const vatAmount = subTotal * (vatRate / 100);
    const totalAmount = subTotal + vatAmount + Number(shippingFee);

    useEffect(() => {
        if (open) {
            if (initialData) {
                // Mode: Edit
                form.setFieldsValue({
                    ...initialData,
                    customer_id: initialData.customer?.id || initialData.customer_id,
                    delivery_date: initialData.delivery_date ? dayjs(initialData.delivery_date) : null,
                    vat_rate: initialData.vat_rate || 0,
                    shipping_fee: initialData.shipping_fee || 0,
                    items: initialData.items.map((i: any) => ({
                        sku: i.sku,
                        quantity: Number(i.quantity),
                        price: Number(i.unit_price)
                    }))
                });
            } else {
                // Mode: Create
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

    const handleSave = async (values: any) => {
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
        } catch (e: any) { 
            message.error(e.response?.data?.message || 'Lỗi lưu thông tin'); 
        }
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
        if (c) {
            form.setFieldsValue({ 
                customer_name: c.name, 
                vat_company_name: c.name, 
                vat_tax_code: c.tax_code, 
                vat_address: c.address, 
                receiver_name: c.name, 
                receiver_phone: c.phone, 
                shipping_address: c.address 
            });
        }
    };

    return (
        <Modal
            title={
                <div style={{display:'flex', alignItems:'center', gap: 10}}>
                    {isQuotation ? "Báo Giá Chi Tiết" : "Quản Lý Đơn Hàng (SO)"}
                    {!canEditItems && <Tag color="orange">Đã khóa chỉnh sửa SP</Tag>}
                </div>
            }
            open={open} onCancel={onClose} onOk={() => form.submit()} width={1100} style={{ top: 20 }}
            okText="Lưu Thông Tin"
        >
            <Form form={form} layout="vertical" onFinish={handleSave}>
                <Form.Item name="order_code" hidden><Input /></Form.Item>
                <Form.Item name="isQuotation" hidden><Input /></Form.Item>

                <Tabs defaultActiveKey="1" items={[
                    {
                        key: '1', label: 'Thông tin & Sản phẩm',
                        children: (
                            <Row gutter={24}>
                                <Col span={15} style={{ borderRight: '1px solid #f0f0f0' }}>
                                    <Row gutter={16}>
                                        <Col span={12}><Form.Item name="customer_id" label={<span style={{color:'red'}}>* Khách Hàng</span>} rules={[{required:true}]}><Select showSearch optionFilterProp="label" options={customers.map(c => ({ label: `${c.code} - ${c.name}`, value: c.id }))} onChange={handleCustomerChange} disabled={!canEditItems && initialData} /></Form.Item></Col>
                                        <Col span={12}><Form.Item name="order_code" label="Mã Đơn"><Input disabled style={{ fontWeight: 'bold', color: '#1890ff' }} /></Form.Item></Col>
                                    </Row>
                                    
                                    <div style={{background: '#fafafa', padding: 10, borderRadius: 6, border: '1px solid #eee'}}>
                                        <Row gutter={8} style={{marginBottom: 5, fontWeight: 600, color: '#666', fontSize: 13, borderBottom:'1px solid #ddd', paddingBottom:5}}>
                                            <Col span={9}>Tên sản phẩm</Col>
                                            <Col span={3}>Số Lượng</Col>
                                            <Col span={3} style={{textAlign:'center'}}>ĐVT</Col>
                                            <Col span={4} style={{textAlign:'right'}}>Đơn giá</Col>
                                            <Col span={4} style={{textAlign:'right'}}>Thành tiền</Col>
                                            <Col span={1}></Col>
                                        </Row>
                                        
                                        <Form.List name="items">
                                            {(fields, { add, remove }) => (
                                                <div style={{maxHeight: 300, overflowY:'auto'}}>
                                                    {fields.map(({ key, name, ...restField }) => {
                                                        const currentItem = form.getFieldValue(['items', name]);
                                                        const currentProd = products.find(p => p.value === currentItem?.sku);
                                                        const subTotalItem = (Number(currentItem?.quantity)||0) * (Number(currentItem?.price)||0);
                                                        
                                                        return (
                                                            <Row key={key} gutter={8} style={{ marginBottom: 8, borderBottom:'1px dashed #eee', paddingBottom:5 }} align="middle">
                                                                <Col span={9}>
                                                                    <Form.Item {...restField} name={[name, 'sku']} style={{ marginBottom: 0 }} rules={[{ required: true, message: 'Chọn SP' }]}>
                                                                        <Select 
                                                                            placeholder="Chọn SP..." 
                                                                            options={products} 
                                                                            onChange={(v) => handleProductChange(v, name)} 
                                                                            dropdownMatchSelectWidth={400} 
                                                                            disabled={!canEditItems}
                                                                        />
                                                                    </Form.Item>
                                                                </Col>
                                                                <Col span={3}>
                                                                    <Form.Item {...restField} name={[name, 'quantity']} style={{ marginBottom: 0 }} rules={[{ required: true }]}>
                                                                        <InputNumber min={1} style={{width:'100%'}} disabled={!canEditItems} />
                                                                    </Form.Item>
                                                                </Col>
                                                                <Col span={3} style={{textAlign:'center'}}>
                                                                    <span style={{color:'#888', fontSize:12, background:'#eee', padding:'2px 5px', borderRadius:4}}>
                                                                        {currentProd?.unit || 'Cái'}
                                                                    </span>
                                                                </Col>
                                                                <Col span={4}>
                                                                    <Form.Item {...restField} name={[name, 'price']} style={{ marginBottom: 0 }} rules={[{ required: true }]}>
                                                                        <InputNumber style={{width:'100%'}} formatter={v=>`${v}`.replace(/\B(?=(\d{3})+(?!\d))/g,',')} disabled={!canEditItems} />
                                                                    </Form.Item>
                                                                </Col>
                                                                <Col span={4} style={{textAlign:'right', fontWeight:500, color:'#555'}}>
                                                                    {subTotalItem.toLocaleString()}
                                                                </Col>
                                                                <Col span={1}>
                                                                    {canEditItems && <DeleteOutlined onClick={() => remove(name)} style={{ color: 'red', cursor: 'pointer' }} />}
                                                                </Col>
                                                            </Row>
                                                        )
                                                    })}
                                                    {canEditItems && <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} style={{marginTop:5}}>Thêm dòng</Button>}
                                                </div>
                                            )}
                                        </Form.List>

                                        <Divider style={{margin: '15px 0'}} />
                                        
                                        <Row justify="end" style={{textAlign: 'right', lineHeight: '2.2em'}}>
                                            <Col span={12}>
                                                <Row>
                                                    <Col span={14}><Text type="secondary">Cộng tiền hàng:</Text></Col>
                                                    <Col span={10}><b>{subTotal.toLocaleString()}</b></Col>
                                                </Row>
                                                <Row align="middle">
                                                    <Col span={14}><Text type="secondary">Thuế GTGT (VAT):</Text></Col>
                                                    <Col span={10}>
                                                        <Space>
                                                            <Form.Item name="vat_rate" noStyle>
                                                                <Select style={{width: 80}} size="small" options={[
                                                                    {label: '0%', value: 0}, {label: '5%', value: 5}, {label: '8%', value: 8}, {label: '10%', value: 10}
                                                                ]} />
                                                            </Form.Item>
                                                            <span style={{display:'inline-block', width: 90}}>{vatAmount.toLocaleString()}</span>
                                                        </Space>
                                                    </Col>
                                                </Row>
                                                <Row>
                                                    <Col span={14}><Text type="secondary">Phí vận chuyển:</Text></Col>
                                                    <Col span={10}>{Number(shippingFee).toLocaleString()}</Col>
                                                </Row>
                                                <Divider style={{margin: '5px 0'}} />
                                                <Row>
                                                    <Col span={14}><Text strong style={{fontSize: 16}}>TỔNG CỘNG:</Text></Col>
                                                    <Col span={10}><Text strong style={{fontSize: 18, color: '#cf1322'}}>{totalAmount.toLocaleString()} ₫</Text></Col>
                                                </Row>
                                            </Col>
                                        </Row>
                                    </div>
                                </Col>

                                <Col span={9}>
                                    <div style={{background: '#f9f9f9', padding: 15, borderRadius: 8}}>
                                        <Divider orientation="left" style={{ marginTop: 0 }}><BankOutlined /> VAT Invoice Info</Divider>
                                        <Form.Item name="vat_company_name" label="Tên Đơn vị"><Input placeholder="Để trống nếu khách lẻ" /></Form.Item>
                                        <Row gutter={8}>
                                            <Col span={10}><Form.Item name="vat_tax_code" label="MST"><Input /></Form.Item></Col>
                                            <Col span={14}><Form.Item name="vat_address" label="Địa chỉ"><Input /></Form.Item></Col>
                                        </Row>
                                        
                                        <Divider orientation="left">Giao nhận</Divider>
                                        <Form.Item name="delivery_date" label="Ngày Giao (Deadline SX)"><DatePicker style={{width:'100%'}} /></Form.Item>
                                        <Form.Item name="shipping_address" label="Địa chỉ Nhận"><Input.TextArea rows={2} /></Form.Item>
                                        <Row gutter={8}>
                                            <Col span={12}><Form.Item name="shipping_carrier" label="Hãng VC"><Input placeholder="GHTK..." prefix={<CarOutlined/>} /></Form.Item></Col>
                                            <Col span={12}><Form.Item name="shipping_fee" label="Phí VC"><InputNumber style={{width:'100%'}} formatter={v=>`${v}`.replace(/\B(?=(\d{3})+(?!\d))/g,',')} /></Form.Item></Col>
                                        </Row>
                                    </div>
                                </Col>
                            </Row>
                        )
                    },
                    !isQuotation && { key: '2', label: 'Thanh toán & Xuất kho', children: <div>(Tính năng quản lý thanh toán/giao hàng)</div> }
                ].filter(Boolean) as any} />
            </Form>
        </Modal>
    );
};

export default SalesOrderDetail;