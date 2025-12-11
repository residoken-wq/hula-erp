import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber, Row, Col, Tabs, Divider, Button, message } from 'antd';
import { PlusOutlined, MinusCircleOutlined, CarOutlined, BankOutlined, SaveOutlined } from '@ant-design/icons';
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

    // Reset form khi mở modal hoặc thay đổi data
    useEffect(() => {
        if (open) {
            if (initialData) {
                // Mode: Edit
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
            } else {
                // Mode: Create
                form.resetFields();
                // Set giá trị mặc định
                form.setFieldsValue({
                    isQuotation: isQuotation,
                    order_code: `${isQuotation ? 'QUOTE' : 'SO'}-${dayjs().format('YYMMDD')}-${Math.floor(Math.random() * 1000)}`,
                    items: [{}]
                });
            }
        }
    }, [open, initialData, isQuotation, form]);

    const handleSave = async (values: any) => {
        try {
            const payload = {
                ...values,
                isQuotation: isQuotation, // Đảm bảo flag này đúng
                items: values.items.map((i: any) => ({
                    sku: i.sku,
                    quantity: Number(i.quantity),
                    price: Number(i.price)
                }))
            };

            if (initialData && initialData.id) {
                // Update
                await axios.put(`${API_URL}/sales/quote/${initialData.id}`, payload);
                message.success('Cập nhật thành công');
            } else {
                // Create
                await axios.post(`${API_URL}/sales/create`, payload);
                message.success('Tạo mới thành công');
            }
            onSuccess();
            onClose();
        } catch (e: any) {
            message.error(e.response?.data?.message || 'Lỗi lưu đơn hàng');
        }
    };

    // Tự động điền thông tin khách hàng khi chọn
    const handleCustomerChange = (val: number) => {
        const c = customers.find(x => x.id === val);
        if (c) {
            form.setFieldsValue({
                customer_name: c.name,
                receiver_name: c.name,
                receiver_phone: c.phone,
                shipping_address: c.address,
                // Điền thông tin VAT nếu có
                vat_company_name: c.name,
                vat_tax_code: c.tax_code,
                vat_address: c.address
            });
        }
    };

    // Tự động điền giá sản phẩm
    const handleProductChange = (val: string, index: number) => {
        const p = products.find((x: any) => x.value === val);
        if (p) {
            const items = form.getFieldValue('items');
            items[index].price = p.price;
            form.setFieldsValue({ items });
        }
    };

    return (
        <Modal
            title={isQuotation ? "Báo Giá Chi Tiết" : "Quản Lý Đơn Hàng (SO)"}
            open={open}
            onCancel={onClose}
            onOk={() => form.submit()}
            width={1000}
            style={{ top: 20 }}
            okText="Lưu & Đóng"
            cancelText="Hủy"
        >
            <Form form={form} layout="vertical" onFinish={handleSave}>
                <Form.Item name="order_code" hidden><Input /></Form.Item>
                <Form.Item name="isQuotation" hidden><Input /></Form.Item>

                <Tabs defaultActiveKey="1" items={[
                    {
                        key: '1', label: 'Thông tin chung & Sản phẩm',
                        children: (
                            <Row gutter={24}>
                                <Col span={14} style={{ borderRight: '1px solid #f0f0f0' }}>
                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item name="customer_id" label="Khách Hàng" rules={[{ required: true, message: 'Chọn khách hàng' }]}>
                                                <Select
                                                    showSearch
                                                    optionFilterProp="label"
                                                    options={customers.map(c => ({ label: `${c.code} - ${c.name}`, value: c.id }))}
                                                    onChange={handleCustomerChange}
                                                    placeholder="Tìm khách..."
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item name="order_code" label="Mã Đơn">
                                                <Input disabled style={{ fontWeight: 'bold', color: '#1890ff' }} />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    {/* LIST ITEMS */}
                                    <div style={{ background: '#fafafa', padding: 10, borderRadius: 6 }}>
                                        <Form.List name="items">
                                            {(fields, { add, remove }) => (
                                                <>
                                                    {fields.map(({ key, name, ...restField }) => (
                                                        <Row key={key} gutter={8} style={{ marginBottom: 10 }} align="middle">
                                                            <Col span={11}>
                                                                <Form.Item {...restField} name={[name, 'sku']} style={{ marginBottom: 0 }} rules={[{ required: true, message: 'Chọn SP' }]}>
                                                                    <Select
                                                                        placeholder="Sản phẩm (Màu/Size)..."
                                                                        options={products}
                                                                        onChange={(v) => handleProductChange(v, name)}
                                                                        dropdownMatchSelectWidth={400}
                                                                    />
                                                                </Form.Item>
                                                            </Col>
                                                            <Col span={5}>
                                                                <Form.Item {...restField} name={[name, 'quantity']} style={{ marginBottom: 0 }} rules={[{ required: true }]}>
                                                                    <InputNumber placeholder="SL" style={{ width: '100%' }} min={1} />
                                                                </Form.Item>
                                                            </Col>
                                                            <Col span={6}>
                                                                <Form.Item {...restField} name={[name, 'price']} style={{ marginBottom: 0 }} rules={[{ required: true }]}>
                                                                    <InputNumber placeholder="Giá" style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                                                                </Form.Item>
                                                            </Col>
                                                            <Col span={2}>
                                                                <MinusCircleOutlined onClick={() => remove(name)} style={{ color: 'red', cursor: 'pointer' }} />
                                                            </Col>
                                                        </Row>
                                                    ))}
                                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Thêm dòng</Button>
                                                </>
                                            )}
                                        </Form.List>
                                    </div>
                                </Col>

                                <Col span={10}>
                                    <Divider orientation="left" style={{ marginTop: 0 }}><BankOutlined /> Thông tin Xuất Hóa Đơn</Divider>
                                    <Form.Item name="vat_company_name" label="Tên Đơn vị (VAT)"><Input placeholder="Để trống nếu là khách lẻ" /></Form.Item>
                                    <Row gutter={8}>
                                        <Col span={10}><Form.Item name="vat_tax_code" label="Mã số thuế"><Input /></Form.Item></Col>
                                        <Col span={14}><Form.Item name="vat_address" label="Địa chỉ ĐKKD"><Input /></Form.Item></Col>
                                    </Row>
                                    
                                    <Divider orientation="left">Thanh toán</Divider>
                                    <Form.Item name="payment_note" label="Ghi chú thanh toán">
                                        <Input.TextArea rows={2} placeholder="VD: CK 50% cọc trước khi SX..." />
                                    </Form.Item>
                                </Col>
                            </Row>
                        )
                    },
                    {
                        key: '2', label: 'Giao hàng & Vận chuyển',
                        children: (
                            <Row gutter={24}>
                                <Col span={12}>
                                    <Divider orientation="left"><CarOutlined /> Người nhận hàng</Divider>
                                    <Form.Item name="receiver_name" label="Tên người nhận"><Input /></Form.Item>
                                    <Form.Item name="receiver_phone" label="SĐT người nhận"><Input /></Form.Item>
                                    <Form.Item name="shipping_address" label="Địa chỉ giao hàng" rules={[{ required: true }]}><Input.TextArea rows={2} /></Form.Item>
                                    {/* Component DatePicker cần import từ antd */}
                                </Col>
                                <Col span={12}>
                                    <Divider orientation="left">Đơn vị vận chuyển</Divider>
                                    <Form.Item name="shipping_carrier" label="Hãng vận chuyển"><Input placeholder="GHTK, Viettel Post, Grab..." /></Form.Item>
                                    <Form.Item name="tracking_code" label="Mã vận đơn"><Input placeholder="Nhập mã bill..." /></Form.Item>
                                    <Form.Item name="shipping_fee" label="Phí vận chuyển (Dự kiến)">
                                        <InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} addonAfter="₫" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        )
                    }
                ]} />
            </Form>
        </Modal>
    );
};

export default SalesOrderDetail;