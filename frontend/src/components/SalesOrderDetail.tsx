import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, DatePicker, Button, Table, Tabs, Row, Col, InputNumber, Divider, message, Tag, Space, Popconfirm, Tooltip, Popover } from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined, CheckCircleOutlined, InfoCircleOutlined, GiftOutlined, UploadOutlined, LoadingOutlined, LinkOutlined } from '@ant-design/icons';
import api from '../utils/api';
import dayjs from 'dayjs';
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
    users?: any[];
    isQuotation?: boolean;
}

const SalesOrderDetail: React.FC<Props> = ({ open, onClose, onSuccess, initialData, customers, products, users = [], isQuotation = false }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('1');
    const [orderItems, setOrderItems] = useState<any[]>([]);
    const [totalAmount, setTotalAmount] = useState(0);

    // Cancel Modal State
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    useEffect(() => {
        if (open) {
            if (initialData) {
                // --- EDIT MODE ---
                form.setFieldsValue({
                    ...initialData,
                    customer_id: initialData.customer?.id,
                    assigned_to_id: initialData.assigned_to?.id, // Map assigned user
                    order_date: initialData.order_date ? dayjs(initialData.order_date) : dayjs(),
                    delivery_date: initialData.delivery_date ? dayjs(initialData.delivery_date) : null,
                    discount_rate: initialData.discount_rate || 0,
                    discount_amount: initialData.discount_amount || 0,
                    vat_rate: initialData.vat_rate || 0,
                    shipping_fee: initialData.shipping_fee || 0
                });

                // FIX LỖI: Map dữ liệu từ Backend (subtotal) sang Frontend (total_price)
                const items = initialData.items?.map((i: any) => {
                    const qty = Number(i.quantity) || 0;
                    const price = Number(i.unit_price) || 0;

                    // Ưu tiên tính toán lại: SL * Đơn giá. Nếu không thì lấy subtotal từ DB.
                    const calculatedTotal = qty * price;

                    return {
                        ...i,
                        sku: i.product?.sku || i.sku,
                        unit_price: price,
                        quantity: qty,
                        total_price: calculatedTotal > 0 ? calculatedTotal : (Number(i.subtotal) || 0)
                    };
                }) || [];

                setOrderItems(items);
                calculateTotal(items);
            } else {
                // --- CREATE MODE ---
                form.resetFields();
                form.setFieldsValue({
                    order_code: '', // Let backend generate
                    order_date: dayjs(),
                    status: isQuotation ? 'QUOTATION' : 'SO_PENDING',
                    discount_rate: 0,
                    discount_amount: 0,
                    vat_rate: 0,
                    shipping_fee: 0
                });
                setOrderItems([]);
                setTotalAmount(0);
            }
            setActiveTab('1');
        }
    }, [open, initialData, isQuotation]);

    const calculateTotal = (items: any[]) => {
        const subtotal = items.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0);

        const discountAmt = Number(form.getFieldValue('discount_amount')) || 0;
        const vatRate = Number(form.getFieldValue('vat_rate')) || 0;
        const shipping = Number(form.getFieldValue('shipping_fee')) || 0;

        const taxable = Math.max(0, subtotal - discountAmt);
        const total = taxable * (1 + vatRate / 100) + shipping;

        setTotalAmount(total);
    };

    const handleAddItem = () => {
        setOrderItems([...orderItems, { key: Date.now(), sku: undefined, quantity: 1, unit_price: 0, total_price: 0 }]);
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...orderItems];
        const item = { ...newItems[index], [field]: value };

        if (field === 'sku') {
            const prod = products.find(p => p.value === value);
            if (prod) {
                item.unit_price = prod.price;
                item.unit = prod.unit;
                item._description = prod.description;
                item._type = prod.type;
                // Auto-fill Description if empty
                if (!item.vat_content && prod.description) {
                    item.vat_content = prod.description;
                }
            }
        }

        // Tính lại thành tiền ngay khi thay đổi số lượng hoặc đơn giá
        if (field === 'quantity' || field === 'unit_price' || field === 'sku') {
            const qty = Number(item.quantity) || 0;
            const price = Number(item.unit_price) || 0;
            item.total_price = qty * price;
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
                    vat_content: i.vat_content,
                    sample_image: i.sample_image,
                    total_price: i.total_price // Frontend gửi total_price, Backend sẽ map vào subtotal
                }))
            };

            if (initialData?.id) {
                await api.put(`/sales/${initialData.id}`, payload);
                message.success('Cập nhật thành công');
            } else {
                await api.post('/sales', { ...payload, is_quotation: isQuotation });
                message.success(isQuotation ? 'Tạo báo giá thành công' : 'Tạo đơn hàng thành công');
            }
            onSuccess();
            onClose();
        } catch (e) { message.error('Lỗi lưu đơn hàng'); }
        finally { setLoading(false); }
    };

    const handleCompleteOrder = async () => {
        if (!initialData?.id) return;
        try {
            await api.put(`/sales/${initialData.id}`, { status: 'COMPLETED' });
            message.success('Đã hoàn tất đơn hàng'); onSuccess(); onClose();
        } catch (e) { message.error('Lỗi'); }
    };

    const handleApproveSamples = async () => {
        if (!initialData?.id) return;
        try {
            await api.post(`/sales/${initialData.id}/approve-samples`);
            message.success('Đã duyệt mẫu thành công');
            onSuccess();
            onClose();
        } catch (e) {
            message.error('Lỗi khi duyệt mẫu');
        }
    };

    const handleCancelOrder = async () => {
        if (!initialData?.id || !cancelReason) return;
        try {
            await api.post(`/sales/${initialData.id}/cancel`, { reason: cancelReason });
            message.success('Đã hủy đơn hàng');
            setCancelModalOpen(false);
            setCancelReason('');
            onSuccess();
            onClose();
        } catch (e) {
            message.error('Lỗi khi hủy đơn');
        }
    };

    const itemColumns = [
        {
            title: 'Sản phẩm', dataIndex: 'sku', width: 300,
            render: (text: any, record: any, index: number) => {
                const prodInfo = products.find(p => p.value === text);
                return (
                    <div>
                        <Select
                            showSearch
                            placeholder="Chọn SP"
                            optionFilterProp="label"
                            style={{ width: '100%' }}
                            value={text}
                            onChange={(val) => handleItemChange(index, 'sku', val)}
                            options={products}
                        />
                        {prodInfo && (
                            <div style={{ marginTop: 4, lineHeight: '1.2' }}>
                                {prodInfo.type === 'COMBO' && <Tag color="purple" style={{ fontSize: 10, marginRight: 4 }}><GiftOutlined /> Combo</Tag>}
                                <span style={{ fontSize: 11, color: '#666', fontStyle: 'italic' }}>
                                    {prodInfo.description || 'Chưa có mô tả'}
                                </span>
                            </div>
                        )}
                        {/* IMAGE URL INPUT */}
                        <div style={{ marginTop: 5, display: 'flex', alignItems: 'center' }}>
                            {/* 1. Image Preview (Fixed) */}
                            {record.sample_image && (
                                <div style={{ marginRight: 8, position: 'relative' }}>
                                    {/* Basic check if it looks like an image, otherwise generic icon */}
                                    {record.sample_image.match(/\.(jpeg|jpg|gif|png)$/i) || record.sample_image.startsWith('data:image') ? (
                                        <img
                                            src={`${record.sample_image.startsWith('http') ? '' : api.defaults.baseURL}${record.sample_image}`}
                                            alt="sample"
                                            style={{ height: 40, width: 40, objectFit: 'cover', border: '1px solid #ddd', borderRadius: 4 }}
                                        />
                                    ) : (
                                        <div style={{ height: 40, width: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #ddd', borderRadius: 4, background: '#f0f0f0', color: '#1890ff', fontSize: 20 }}>
                                            <LinkOutlined />
                                        </div>
                                    )}
                                    <div style={{ position: 'absolute', top: -8, right: -8 }}>
                                        <Button
                                            type="text"
                                            danger
                                            size="small"
                                            icon={<DeleteOutlined style={{ fontSize: 10 }} />}
                                            onClick={() => handleItemChange(index, 'sample_image', null)}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* 2. Link Trigger (Stable) */}
                            <Popover
                                trigger="click"
                                content={
                                    <div style={{ padding: 8 }}>
                                        <Input
                                            placeholder="Paste Image/Drive URL..."
                                            value={record.sample_image || ''}
                                            onChange={(e) => handleItemChange(index, 'sample_image', e.target.value)}
                                            style={{ width: 300, marginBottom: 8 }}
                                            autoFocus
                                        />
                                        <div style={{ fontSize: 11, color: '#999' }}>
                                            Hỗ trợ link ảnh trực tiếp (jpg, png) hoặc Google Drive.
                                        </div>
                                    </div>
                                }
                                title="HULA Drive Link"
                            >
                                <Button size="small" icon={<LinkOutlined />} style={{ fontSize: 10 }}>
                                    {record.sample_image ? 'Sửa Link' : 'Dán Link'}
                                </Button>
                            </Popover>
                        </div>
                    </div>
                );
            }
        },
        {
            title: 'Mô tả VAT (HĐ đơn)',
            dataIndex: 'vat_content',
            width: 200,
            render: (text: any, record: any, index: number) => (
                <Input.TextArea
                    rows={2}
                    placeholder="Mô tả khi xuất hóa đơn..."
                    value={text} // Bind directly to vat_content
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleItemChange(index, 'vat_content', e.target.value)}
                />
            )
        },
        {
            title: 'Đơn giá', dataIndex: 'unit_price', width: 140,
            render: (text: any, record: any, index: number) => {
                const prod = products.find(p => p.value === record.sku);
                const basePrice = prod ? prod.price : 0;
                return (
                    <div>
                        {prod && (
                            <div style={{ fontSize: 10, color: '#999', marginBottom: 2, textAlign: 'right' }}>
                                Giá gốc: {basePrice.toLocaleString()}
                            </div>
                        )}
                        <InputNumber
                            min={0}
                            style={{ width: '100%' }}
                            value={text}
                            formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(displayVal) => displayVal!.replace(/\$\s?|(,*)/g, '')}
                            onChange={(val) => handleItemChange(index, 'unit_price', val)}
                        />
                    </div>
                );
            }
        },
        {
            title: 'SL', dataIndex: 'quantity', width: 80,
            render: (text: any, record: any, index: number) => (
                <InputNumber min={1} value={text} onChange={(val) => handleItemChange(index, 'quantity', val)} style={{ width: '100%' }} />
            )
        },
        {
            title: 'Thành tiền', dataIndex: 'total_price', align: 'right' as const, width: 140,
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
            width={1100}
            footer={[
                <Button key="close" onClick={onClose}>Đóng</Button>,
                <Button key="save" type="primary" icon={<SaveOutlined />} loading={loading} onClick={handleSave}>Lưu Thông Tin</Button>,

                /* BUTTON DUYỆT MẪU (CHỈ HIỆN KHI CÓ DATA) */
                initialData && (
                    <Tooltip title={isQuotation ? "Vui lòng chuyển thành Đơn hàng (SO) để duyệt mẫu" : "Xác nhận mẫu sản phẩm đã đạt yêu cầu"}>
                        <Button
                            key="approve"
                            type="primary"
                            style={{ backgroundColor: isQuotation ? '#d9d9d9' : '#52c41a', borderColor: isQuotation ? '#d9d9d9' : '#52c41a' }}
                            icon={<CheckCircleOutlined />}
                            onClick={handleApproveSamples}
                            disabled={isQuotation || initialData?.status !== 'SO_PENDING'}
                        >
                            Duyệt Mẫu
                        </Button>
                    </Tooltip>
                ),



                (!isQuotation && initialData && initialData.status !== 'CANCELLED' && initialData.status !== 'COMPLETED') && (
                    <Button key="cancel" danger icon={<DeleteOutlined />} onClick={() => setCancelModalOpen(true)}>Hủy Đơn</Button>
                ),

                (!isQuotation && initialData && initialData.status !== 'CANCELLED') && <Button key="complete" type="primary" danger icon={<CheckCircleOutlined />} onClick={handleCompleteOrder}>Hoàn tất đơn hàng</Button>
            ]}
            style={{ top: 20 }}
        >
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
                <Tabs.TabPane tab="1. Thông tin & Sản phẩm" key="1">
                    <Form form={form} layout="vertical">
                        <Row gutter={16}>
                            <Col span={8}><Form.Item name="order_code" label="Mã đơn hàng"><Input disabled placeholder="Tự động sinh mã" /></Form.Item></Col>
                            <Col span={8}>
                                <Form.Item name="customer_id" label="Khách hàng" rules={[{ required: true }]}>
                                    <Select
                                        showSearch
                                        optionFilterProp="label"
                                        options={customers.map(c => ({ label: `${c.name} - ${c.phone}`, value: c.id }))}
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={8}><Form.Item name="order_date" label="Ngày đặt" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
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
                            <Col span={8}><Form.Item name="delivery_date" label="Ngày giao dự kiến"><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
                            <Col span={8}>
                                <Form.Item name="assigned_to_id" label="Nhân sự phụ trách">
                                    <Select allowClear showSearch optionFilterProp="label" options={users.map(u => ({ label: u.full_name || u.username, value: u.id }))} placeholder="Chọn nhân viên" />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={24}>
                                <Form.Item name="note" label="Ghi chú nội bộ (Hiển thị trên Portal)">
                                    <Input.TextArea rows={2} placeholder="Nhập ghi chú cho khách hàng..." />
                                </Form.Item>
                            </Col>
                        </Row>

                        {/* HIDDEN FIELDS TO REGISTER VALUES */}
                        <Form.Item name="discount_rate" hidden><InputNumber /></Form.Item>
                        <Form.Item name="discount_amount" hidden><InputNumber /></Form.Item>
                        <Form.Item name="vat_rate" hidden><InputNumber /></Form.Item>
                        <Form.Item name="shipping_fee" hidden><InputNumber /></Form.Item>

                        <Divider orientation="left">Danh sách sản phẩm</Divider>
                        <Table
                            dataSource={orderItems}
                            columns={itemColumns}
                            pagination={false}
                            rowKey="key"
                            size="small"
                            bordered
                            summary={() => {
                                const subtotal = orderItems.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0);
                                const discountAmt = Number(form.getFieldValue('discount_amount')) || 0;
                                const vatRate = Number(form.getFieldValue('vat_rate')) || 0;
                                const shipping = Number(form.getFieldValue('shipping_fee')) || 0;

                                const taxable = Math.max(0, subtotal - discountAmt);
                                const total = taxable * (1 + vatRate / 100) + shipping;

                                // Note: We do NOT set state here anymore to avoid render loops.
                                // calculateTotal() is triggered by onChange of inputs.

                                return (
                                    <>
                                        <Table.Summary.Row>
                                            <Table.Summary.Cell index={0} colSpan={2} align="right">Tổng tiền hàng:</Table.Summary.Cell>
                                            <Table.Summary.Cell index={1} align="right">{subtotal.toLocaleString()} ₫</Table.Summary.Cell>
                                            <Table.Summary.Cell index={2} />
                                        </Table.Summary.Row>
                                        <Table.Summary.Row>
                                            <Table.Summary.Cell index={0} colSpan={2} align="right">
                                                Giảm giá:
                                                <InputNumber
                                                    size="small"
                                                    min={0}
                                                    max={100}
                                                    formatter={v => `${v}%`}
                                                    parser={v => v!.replace('%', '')}
                                                    placeholder="%"
                                                    style={{ width: 60, marginLeft: 10 }}
                                                    value={form.getFieldValue('discount_rate')}
                                                    onChange={(val) => {
                                                        const rate = Number(val);
                                                        const amt = Math.floor(subtotal * rate / 100);
                                                        form.setFieldsValue({ discount_rate: rate, discount_amount: amt });
                                                        calculateTotal(orderItems); // Re-trigger
                                                    }}
                                                />
                                            </Table.Summary.Cell>
                                            <Table.Summary.Cell index={1} align="right">
                                                <InputNumber
                                                    size="small"
                                                    style={{ width: '100%' }}
                                                    value={form.getFieldValue('discount_amount')}
                                                    formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                    parser={v => v!.replace(/\$\s?|(,*)/g, '')}
                                                    onChange={(val) => {
                                                        const amt = Number(val);
                                                        // Tính ngược lại % (chỉ mang tính tham khảo)
                                                        const rate = subtotal > 0 ? Number((amt / subtotal * 100).toFixed(2)) : 0;
                                                        form.setFieldsValue({ discount_amount: amt, discount_rate: rate });
                                                        calculateTotal(orderItems);
                                                    }}
                                                />
                                            </Table.Summary.Cell>
                                            <Table.Summary.Cell index={2} />
                                        </Table.Summary.Row>
                                        <Table.Summary.Row>
                                            <Table.Summary.Cell index={0} colSpan={2} align="right">
                                                VAT (%):
                                                <InputNumber size="small" min={0} max={100} style={{ width: 60, marginLeft: 10 }}
                                                    value={form.getFieldValue('vat_rate')}
                                                    onChange={(v) => { form.setFieldsValue({ vat_rate: v }); calculateTotal(orderItems); }}
                                                />
                                            </Table.Summary.Cell>
                                            <Table.Summary.Cell index={1} align="right">
                                                {vatRate > 0 ? (taxable * vatRate / 100).toLocaleString() : '0'} ₫
                                            </Table.Summary.Cell>
                                            <Table.Summary.Cell index={2} />
                                        </Table.Summary.Row>
                                        <Table.Summary.Row>
                                            <Table.Summary.Cell index={0} colSpan={2} align="right">Phí vận chuyển:</Table.Summary.Cell>
                                            <Table.Summary.Cell index={1} align="right">
                                                <InputNumber
                                                    size="small"
                                                    min={0}
                                                    style={{ width: '100%' }}
                                                    value={form.getFieldValue('shipping_fee')}
                                                    formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                    parser={v => v!.replace(/\$\s?|(,*)/g, '')}
                                                    onChange={(v) => { form.setFieldsValue({ shipping_fee: v }); calculateTotal(orderItems); }}
                                                />
                                            </Table.Summary.Cell>
                                            <Table.Summary.Cell index={2} />
                                        </Table.Summary.Row>
                                        <Table.Summary.Row>
                                            <Table.Summary.Cell index={0} colSpan={2} align="right"><b>TỔNG CỘNG:</b></Table.Summary.Cell>
                                            <Table.Summary.Cell index={1} align="right">
                                                <b style={{ color: 'red', fontSize: 16 }}>{total.toLocaleString()} ₫</b>
                                            </Table.Summary.Cell>
                                            <Table.Summary.Cell index={2} />
                                        </Table.Summary.Row>
                                    </>
                                );
                            }}
                        />
                        <Button type="dashed" onClick={handleAddItem} block icon={<PlusOutlined />} style={{ marginTop: 10 }}>Thêm sản phẩm</Button>
                    </Form>
                </Tabs.TabPane>
                {initialData && !isQuotation && (
                    <>
                        <Tabs.TabPane tab="2. Thanh toán" key="2">
                            <SalesPayments orderId={initialData.id} orderCode={initialData.order_code} totalAmount={totalAmount} paidAmount={initialData.paid_amount || 0} onSuccess={onSuccess} />
                        </Tabs.TabPane>
                        <Tabs.TabPane tab="3. Giao hàng" key="3">
                            <SalesDeliveries order={initialData} products={products} onSuccess={onSuccess} />
                        </Tabs.TabPane>
                        <Tabs.TabPane tab="4. Trao đổi" key="4">
                            <SalesComments orderId={initialData.id} />
                        </Tabs.TabPane>
                    </>
                )}
            </Tabs>

            {/* CANCEL REASON MODAL */}
            <Modal
                title="Xác nhận hủy đơn hàng"
                open={cancelModalOpen}
                onCancel={() => setCancelModalOpen(false)}
                onOk={handleCancelOrder}
                okText="Xác nhận Hủy"
                okButtonProps={{ danger: true }}
            >
                <p>Bạn có chắc chắn muốn hủy đơn hàng này không? Hành động này không thể hoàn tác.</p>
                <Form layout="vertical">
                    <Form.Item label="Lý do hủy" required>
                        <Input.TextArea
                            rows={3}
                            value={cancelReason}
                            onChange={e => setCancelReason(e.target.value)}
                            placeholder="Nhập lý do hủy đơn..."
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </Modal >
    );
};

export default SalesOrderDetail;