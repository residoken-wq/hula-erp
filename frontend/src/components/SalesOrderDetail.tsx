import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, DatePicker, Button, Table, Tabs, Row, Col, InputNumber, Divider, message, Tag, Space, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined, PrinterOutlined, CheckCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_URL } from '../config';

// Import Sub-components (Bạn đã có các file này)
import SalesPayments from './sales/SalesPayments';
import SalesDeliveries from './sales/SalesDeliveries';
import SalesComments from './sales/SalesComments';

const { Option } = Select;

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
    customers: any[];
    products: any[];
    isQuotation?: boolean; // True: Báo giá, False: Đơn hàng
}

const SalesOrderDetail: React.FC<Props> = ({ open, onClose, onSuccess, initialData, customers, products, isQuotation = false }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('1');
    
    // State cho danh sách sản phẩm trong đơn
    const [orderItems, setOrderItems] = useState<any[]>([]);
    
    // State tổng tiền
    const [totalAmount, setTotalAmount] = useState(0);

    // Load dữ liệu khi mở Modal
    useEffect(() => {
        if (open) {
            if (initialData) {
                // Edit Mode
                form.setFieldsValue({
                    ...initialData,
                    customer_id: initialData.customer?.id,
                    order_date: initialData.order_date ? dayjs(initialData.order_date) : dayjs(),
                    delivery_date: initialData.delivery_date ? dayjs(initialData.delivery_date) : null
                });
                
                // Parse items
                const items = initialData.items?.map((i: any) => ({
                    ...i,
                    sku: i.product?.sku || i.sku, // Đảm bảo có SKU
                    unit_price: Number(i.unit_price),
                    total_price: Number(i.total_price)
                })) || [];
                setOrderItems(items);
                calculateTotal(items);
            } else {
                // Create Mode
                form.resetFields();
                form.setFieldsValue({ 
                    order_code: isQuotation ? 'AUTO-QUOTE' : 'AUTO-SO',
                    order_date: dayjs(),
                    status: isQuotation ? 'QUOTATION' : 'SO_PENDING'
                });
                setOrderItems([]);
                setTotalAmount(0);
            }
            setActiveTab('1');
        }
    }, [open, initialData, isQuotation]);

    const calculateTotal = (items: any[]) => {
        const total = items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unit_price || 0)), 0);
        setTotalAmount(total);
    };

    // --- XỬ LÝ SẢN PHẨM TRONG ĐƠN ---
    const handleAddItem = () => {
        setOrderItems([...orderItems, { key: Date.now(), sku: undefined, quantity: 1, unit_price: 0, total_price: 0 }]);
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...orderItems];
        const item = { ...newItems[index], [field]: value };

        // Nếu chọn sản phẩm -> Tự điền giá
        if (field === 'sku') {
            const prod = products.find(p => p.value === value);
            if (prod) {
                item.unit_price = prod.price;
                item.unit = prod.unit;
            }
        }

        // Tính lại thành tiền
        if (field === 'quantity' || field === 'unit_price' || field === 'sku') {
            item.total_price = Number(item.quantity || 0) * Number(item.unit_price || 0);
        }

        newItems[index] = item;
        setOrderItems(newItems);
        calculateTotal(newItems);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = orderItems.filter((_, i) => i !== index);
        setOrderItems(newItems);
        calculateTotal(newItems);
    };

    // --- LƯU ĐƠN HÀNG ---
    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            const payload = {
                ...values,
                total_amount: totalAmount,
                items: orderItems.map(i => ({
                    sku: i.sku,
                    quantity: i.quantity,
                    unit_price: i.unit_price,
                    total_price: i.total_price
                }))
            };

            if (initialData?.id) {
                await axios.put(`${API_URL}/sales/${initialData.id}`, payload);
                message.success('Cập nhật thành công');
            } else {
                await axios.post(`${API_URL}/sales`, {
                    ...payload,
                    is_quotation: isQuotation // Cờ để backend biết tạo Quote hay SO
                });
                message.success(isQuotation ? 'Tạo báo giá thành công' : 'Tạo đơn hàng thành công');
            }
            
            onSuccess();
            onClose();
        } catch (e) {
            message.error('Lỗi lưu đơn hàng');
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteOrder = async () => {
        if (!initialData?.id) return;
        try {
            await axios.put(`${API_URL}/sales/${initialData.id}`, { status: 'COMPLETED' });
            message.success('Đã hoàn tất đơn hàng');
            onSuccess();
            onClose();
        } catch(e) { message.error('Lỗi'); }
    };

    // --- UI COLUMNS ---
    const itemColumns = [
        {
            title: 'Sản phẩm', dataIndex: 'sku', width: 250,
            render: (text: any, record: any, index: number) => (
                <Select 
                    showSearch 
                    placeholder="Chọn SP" 
                    optionFilterProp="label"
                    style={{ width: '100%' }}
                    value={text}
                    onChange={(val) => handleItemChange(index, 'sku', val)}
                    options={products}
                />
            )
        },
        {
            title: 'Đơn giá', dataIndex: 'unit_price', width: 120,
            render: (text: any, record: any, index: number) => (
                <InputNumber 
                    min={0} 
                    style={{ width: '100%' }} 
                    value={text}
                    formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    onChange={(val) => handleItemChange(index, 'unit_price', val)} 
                />
            )
        },
        {
            title: 'SL', dataIndex: 'quantity', width: 80,
            render: (text: any, record: any, index: number) => (
                <InputNumber min={1} value={text} onChange={(val) => handleItemChange(index, 'quantity', val)} style={{ width: '100%' }} />
            )
        },
        {
            title: 'Thành tiền', dataIndex: 'total_price', align: 'right' as const, width: 120,
            render: (val: any) => <b>{Number(val).toLocaleString()}</b>
        },
        {
            title: '', width: 50, align: 'center' as const,
            render: (_: any, r: any, index: number) => <DeleteOutlined onClick={() => handleRemoveItem(index)} style={{ color: 'red', cursor: 'pointer' }} />
        }
    ];

    return (
        <Modal 
            title={<span>{isQuotation ? 'Báo Giá' : 'Đơn Hàng (SO)'} #{initialData?.order_code} {initialData?.status === 'COMPLETED' && <Tag color="green">Hoàn tất</Tag>}</span>}
            open={open} 
            onCancel={onClose}
            width={1000}
            footer={[
                <Button key="close" onClick={onClose}>Đóng</Button>,
                <Button key="save" type="primary" icon={<SaveOutlined />} loading={loading} onClick={handleSave}>Lưu Thông Tin</Button>,
                (!isQuotation && initialData) && <Button key="complete" type="primary" danger icon={<CheckCircleOutlined/>} onClick={handleCompleteOrder}>Hoàn tất đơn hàng</Button>
            ]}
            style={{ top: 20 }}
        >
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
                <Tabs.TabPane tab="1. Thông tin & Sản phẩm" key="1">
                    <Form form={form} layout="vertical">
                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item name="order_code" label="Mã đơn hàng"><Input disabled /></Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="customer_id" label="Khách hàng" rules={[{ required: true }]}>
                                    <Select 
                                        showSearch 
                                        optionFilterProp="label" 
                                        options={customers.map(c => ({ label: `${c.name} - ${c.phone}`, value: c.id }))} 
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="order_date" label="Ngày đặt" rules={[{ required: true }]}>
                                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                                </Form.Item>
                            </Col>
                        </Row>
                        
                        <Row gutter={16}>
                            <Col span={8}>
                                <Form.Item name="status" label="Trạng thái">
                                    <Select>
                                        {isQuotation ? (
                                            <Option value="QUOTATION">Báo Giá</Option>
                                        ) : (
                                            <>
                                                <Option value="SO_PENDING">Chờ Duyệt Mẫu</Option>
                                                <Option value="SAMPLE_APPROVED">Đã Duyệt Mẫu</Option>
                                                <Option value="DEPOSITED">Đã Cọc / Sản Xuất</Option>
                                                <Option value="DELIVERED">Đã Giao Hàng</Option>
                                                <Option value="COMPLETED">Hoàn Thành</Option>
                                            </>
                                        )}
                                        <Option value="CANCELLED">Đã Hủy</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="delivery_date" label="Ngày giao dự kiến">
                                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Divider orientation="left">Danh sách sản phẩm</Divider>
                        <Table 
                            dataSource={orderItems} 
                            columns={itemColumns} 
                            pagination={false} 
                            rowKey="key" 
                            size="small"
                            bordered
                            summary={() => (
                                <Table.Summary.Row>
                                    <Table.Summary.Cell index={0} colSpan={3} align="right"><b>TỔNG CỘNG:</b></Table.Summary.Cell>
                                    <Table.Summary.Cell index={1} align="right">
                                        <b style={{ color: 'red', fontSize: 16 }}>{totalAmount.toLocaleString()} ₫</b>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={2} />
                                </Table.Summary.Row>
                            )}
                        />
                        <Button type="dashed" onClick={handleAddItem} block icon={<PlusOutlined />} style={{ marginTop: 10 }}>
                            Thêm sản phẩm
                        </Button>
                    </Form>
                </Tabs.TabPane>

                {/* --- CHỈ HIỆN CÁC TAB SAU KHI ĐÃ LƯU ĐƠN HÀNG --- */}
                {initialData && !isQuotation && (
                    <>
                        <Tabs.TabPane tab="2. Thanh toán" key="2">
                            <SalesPayments 
                                orderId={initialData.id} 
                                orderCode={initialData.order_code} 
                                totalAmount={totalAmount} 
                                paidAmount={initialData.paid_amount || 0}
                                onSuccess={onSuccess} 
                            />
                        </Tabs.TabPane>
                        <Tabs.TabPane tab="3. Giao hàng" key="3">
                            <SalesDeliveries 
                                orderId={initialData.id} 
                                orderItems={orderItems} 
                                onSuccess={onSuccess} 
                            />
                        </Tabs.TabPane>
                        <Tabs.TabPane tab="4. Trao đổi" key="4">
                            <SalesComments orderId={initialData.id} />
                        </Tabs.TabPane>
                    </>
                )}
            </Tabs>
        </Modal>
    );
};

export default SalesOrderDetail;