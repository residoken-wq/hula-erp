import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, DatePicker, Button, Table, Tabs, Row, Col, InputNumber, Divider, message, Tag, Space, Popconfirm, Tooltip, Popover } from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined, CheckCircleOutlined, InfoCircleOutlined, GiftOutlined, UploadOutlined, LoadingOutlined, LinkOutlined } from '@ant-design/icons';
import api from '../utils/api';
import dayjs from 'dayjs';
import SalesPayments from './sales/SalesPayments';
import SalesDeliveries from './sales/SalesDeliveries';
import SalesComments from './sales/SalesComments';
import { HistoryOutlined, CopyOutlined } from '@ant-design/icons'; // Import icons

import { DndContext, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { MenuOutlined } from '@ant-design/icons';

interface RowProps extends React.HTMLAttributes<HTMLTableRowElement> {
    'data-row-key': string;
}

const DraggableRow = ({ children, ...props }: RowProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: props['data-row-key'],
    });

    const style: React.CSSProperties = {
        ...props.style,
        transform: CSS.Transform.toString(transform && { ...transform, scaleY: 1 }),
        transition,
        cursor: 'move',
        ...(isDragging ? { position: 'relative', zIndex: 9999 } : {}),
    };

    return (
        <tr {...props} ref={setNodeRef} style={style} {...attributes}>
            {React.Children.map(children, (child) => {
                if ((child as React.ReactElement).key === 'sort') {
                    return React.cloneElement(child as React.ReactElement, {
                        children: (
                            <div {...listeners} style={{ touchAction: 'none', cursor: 'grab' }}>
                                <MenuOutlined style={{ color: '#999' }} />
                            </div>
                        ),
                    });
                }
                return child;
            })}
        </tr>
    );
};

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

    // Revisions State
    const [revisions, setRevisions] = useState<any[]>([]);
    const [revisionModalOpen, setRevisionModalOpen] = useState(false);

    const fetchRevisions = async (id: number) => {
        try {
            const res = await api.get(`/sales/${id}/revisions`);
            setRevisions(res.data);
        } catch (e) { console.error('Failed to load revisions'); }
    }

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

                    shipping_fee: initialData.shipping_fee || 0,
                    vat_company_name: initialData.vat_company_name || initialData.customer?.legal_name || initialData.customer?.name || '',
                    vat_tax_code: initialData.vat_tax_code || initialData.customer?.tax_code || '',
                    vat_address: initialData.vat_address || initialData.customer?.legal_address || initialData.customer?.address || ''
                });

                // FIX LỖI: Map dữ liệu từ Backend (subtotal) sang Frontend (total_price)
                const items = initialData.items?.map((i: any) => {
                    const qty = Number(i.quantity) || 0;
                    const price = Number(i.unit_price) || 0;

                    // Ưu tiên tính toán lại: SL * Đơn giá. Nếu không thì lấy subtotal từ DB.
                    const calculatedTotal = qty * price;

                    return {
                        ...i,
                        key: i.id || `temp-${Date.now()}-${Math.random()}`, // Ensure KEY exists for DragDrop
                        sku: i.product?.sku || i.sku,
                        unit_price: price,
                        quantity: qty,
                        total_price: calculatedTotal > 0 ? calculatedTotal : (Number(i.subtotal) || 0)
                    };
                }) || [];

                setOrderItems(items);
                calculateTotal(items);

                // Fetch Revisions
                fetchRevisions(initialData.id);
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

    const handleFormValuesChange = (changedValues: any) => {
        if (changedValues.customer_id) {
            handleCustomerChange(changedValues.customer_id);
        }
    };

    const handleCustomerChange = (customerId: number) => {
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            form.setFieldsValue({
                vat_company_name: customer.legal_name || customer.name || '',
                vat_tax_code: customer.tax_code || '',
                vat_address: customer.legal_address || customer.address || ''
            });
        }
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

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 1 } })
    );

    const onDragEnd = ({ active, over }: DragEndEvent) => {
        if (active.id !== over?.id) {
            setOrderItems((prev) => {
                const activeIndex = prev.findIndex((i) => i.key === active.id);
                const overIndex = prev.findIndex((i) => i.key === over?.id);
                return arrayMove(prev, activeIndex, overIndex);
            });
        }
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

    const handleCreateRevision = async () => {
        if (!initialData?.id) return;
        try {
            await api.post(`/sales/${initialData.id}/revision`, {}); // User info handled by interceptor/token
            message.success('Đã tạo phiên bản mới');
            // Reload data
            onSuccess();
            onClose();
        } catch (e) {
            message.error('Lỗi tạo revision');
        }
    };

    const itemColumns = [
        {
            key: 'sort',
            width: 30,
            render: () => <MenuOutlined style={{ cursor: 'grab', color: '#999' }} />,
        },
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
            title={
                <span>
                    {isQuotation ? 'Báo Giá' : 'Đơn Hàng (SO)'} #{initialData?.order_code}
                    {initialData?.version > 1 && <Tag color="orange" style={{ marginLeft: 5 }}>v{initialData?.version}</Tag>}
                    {initialData?.status === 'COMPLETED' && <Tag color="green" style={{ marginLeft: 5 }}>Hoàn tất</Tag>}
                </span>
            }
            open={open}
            onCancel={onClose}
            width={1100}
            footer={[
                <Button key="close" onClick={onClose}>Đóng</Button>,
                <Button key="save" type="primary" icon={<SaveOutlined />} loading={loading} onClick={handleSave}>Lưu Thông Tin</Button>,

                isQuotation && initialData && (
                    <Button key="revision" icon={<CopyOutlined />} onClick={handleCreateRevision}>Tạo Version Mới</Button>
                ),

                isQuotation && initialData && (
                    <Popconfirm title="Bạn có chắc chắn muốn xóa báo giá này không?" onConfirm={async () => {
                        try {
                            await api.delete(`/sales/quote/${initialData.id}`);
                            message.success('Đã xóa báo giá');
                            onSuccess();
                            onClose();
                        } catch (e) { message.error('Không thể xóa báo giá'); }
                    }}>
                        <Button key="delete-quote" danger icon={<DeleteOutlined />}>Xóa Báo Giá</Button>
                    </Popconfirm>
                ),

                isQuotation && initialData && (
                    <Button key="history" icon={<HistoryOutlined />} onClick={() => setRevisionModalOpen(true)}>Lịch sử</Button>
                ),

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
                    <Form form={form} layout="vertical" onValuesChange={handleFormValuesChange}>
                        <Row gutter={16}>
                            <Col span={8}><Form.Item name="order_code" label="Mã đơn hàng"><Input disabled placeholder="Tự động sinh mã" /></Form.Item></Col>
                            <Col span={8}>
                                <Form.Item name="customer_id" label="Khách hàng" rules={[{ required: true }]}>
                                    <Select
                                        showSearch
                                        placeholder="Chọn khách hàng"
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
                                                <Option value="SO_PENDING">Xác nhận đơn hàng</Option>
                                                <Option value="DEPOSITED">Đã đặt cọc</Option>
                                                <Option value="SAMPLE_APPROVED">Đã duyệt mẫu</Option>
                                                <Option value="IN_PRODUCTION">Đang sản xuất</Option>
                                                <Option value="PARTIAL_DELIVERY">Giao hàng 1 phần</Option>
                                                <Option value="DELIVERED">Đã giao hàng</Option>
                                                <Option value="COMPLETED">Hoàn tất</Option>
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
                        <DndContext sensors={sensors} modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
                            <SortableContext items={orderItems.map((i) => i.key)} strategy={verticalListSortingStrategy}>
                                <Table
                                    components={{
                                        body: {
                                            row: DraggableRow,
                                        },
                                    }}
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
                            </SortableContext>
                        </DndContext>
                        <Button type="dashed" onClick={handleAddItem} block icon={<PlusOutlined />} style={{ marginTop: 10 }}>Thêm sản phẩm</Button>
                    </Form>
                </Tabs.TabPane>
                <Tabs.TabPane tab="2. Xuất Hóa Đơn & VAT" key="invoice">
                    <Form form={form} layout="vertical">
                        <div style={{ padding: 10, background: '#f5f5f5', borderRadius: 4, marginBottom: 15 }}>
                            <div style={{ fontStyle: 'italic', color: '#666', marginBottom: 10 }}>
                                <InfoCircleOutlined /> Thông tin này được lấy mặc định từ phần "Pháp Nhân" của khách hàng. Bạn có thể chỉnh sửa cho đơn hàng này.
                            </div>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item name="vat_company_name" label="Tên đơn vị (Xuất HĐ)">
                                        <Input placeholder="Công ty TNHH..." />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="vat_tax_code" label="Mã số thuế">
                                        <Input placeholder="VD: 031..." />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={16}>
                                <Col span={24}>
                                    <Form.Item name="vat_address" label="Địa chỉ xuất HĐ">
                                        <Input placeholder="Địa chỉ theo ĐKKD" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </div>
                    </Form>
                </Tabs.TabPane>
                {initialData && !isQuotation && (
                    <>
                        <Tabs.TabPane tab="3. Thanh toán" key="2">
                            <SalesPayments
                                orderId={initialData.id}
                                orderCode={initialData.order_code}
                                totalAmount={totalAmount}
                                paidAmount={initialData.paid_amount || 0}
                                customerName={initialData?.customer?.name || initialData?.customer_name}
                                onSuccess={onSuccess}
                            />
                        </Tabs.TabPane>
                        <Tabs.TabPane tab="4. Giao hàng" key="3">
                            <SalesDeliveries order={initialData} products={products} customers={customers} onSuccess={onSuccess} />
                        </Tabs.TabPane>
                        <Tabs.TabPane tab="5. Trao đổi" key="4">
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

            {/* REVISION HISTORY MODELS */}
            <Modal title="Lịch sử phiên bản" open={revisionModalOpen} onCancel={() => setRevisionModalOpen(false)} footer={null} width={800}>
                <Table
                    dataSource={revisions}
                    rowKey="id"
                    columns={[
                        { title: 'Version', dataIndex: 'version_number', render: (v) => <Tag>v{v}</Tag> },
                        { title: 'Ngày tạo', dataIndex: 'created_at', render: (t) => dayjs(t).format('DD/MM/YYYY HH:mm') },
                        { title: 'Người tạo', dataIndex: 'created_by' },
                        {
                            title: 'Action', render: (r) => <Button size="small" onClick={() => {
                                const snapshot = r.data_snapshot || {};
                                const snapItems = snapshot.items || [];

                                Modal.info({
                                    title: `Chi tiết version ${r.version_number} - ${dayjs(r.created_at).format('DD/MM/YYYY HH:mm')}`,
                                    width: 900,
                                    icon: <HistoryOutlined />,
                                    content: (
                                        <div>
                                            <div style={{ marginBottom: 15, display: 'flex', gap: 20, flexWrap: 'wrap', background: '#f5f5f5', padding: 10, borderRadius: 6 }}>
                                                <div><b>Mã:</b> {snapshot.order_code}</div>
                                                <div><b>Khách hàng:</b> {customers.find(c => c.id === snapshot.customer_id)?.name || snapshot.customer_name || snapshot.customer_id}</div>
                                                <div><b>Ngày đặt:</b> {dayjs(snapshot.order_date).format('DD/MM/YYYY')}</div>
                                                <div><b>Ngày giao:</b> {snapshot.delivery_date ? dayjs(snapshot.delivery_date).format('DD/MM/YYYY') : 'N/A'}</div>
                                            </div>
                                            {snapshot.note && <div style={{ marginBottom: 10, fontStyle: 'italic' }}>Ghi chú: {snapshot.note}</div>}

                                            <Table
                                                dataSource={snapItems}
                                                rowKey={(rec: any) => rec?.sku || rec || Math.random()}
                                                pagination={false}
                                                size="small"
                                                bordered
                                                columns={[
                                                    {
                                                        title: 'Sản phẩm', dataIndex: 'sku',
                                                        render: (sku) => {
                                                            const p = products.find(x => x.value === sku);
                                                            return p ? (
                                                                <div>
                                                                    <b>{p.label || sku}</b>
                                                                    <div style={{ fontSize: 11, color: '#888' }}>{p.description}</div>
                                                                </div>
                                                            ) : sku
                                                        }
                                                    },
                                                    { title: 'SL', dataIndex: 'quantity', width: 60, align: 'center' },
                                                    { title: 'Đơn giá', dataIndex: 'unit_price', align: 'right', render: (v: any) => Number(v).toLocaleString() },
                                                    { title: 'Thành tiền', dataIndex: 'total_price', align: 'right', render: (v: any) => <b>{Number(v).toLocaleString()}</b> }
                                                ]}
                                                summary={() => {
                                                    return (
                                                        <>
                                                            <Table.Summary.Row>
                                                                <Table.Summary.Cell index={0} colSpan={3} align="right">Tổng tiền hàng</Table.Summary.Cell>
                                                                <Table.Summary.Cell index={1} align="right">{snapItems.reduce((s: number, i: any) => s + Number(i.total_price || 0), 0).toLocaleString()}</Table.Summary.Cell>
                                                            </Table.Summary.Row>
                                                            {Number(snapshot.discount_amount) > 0 && (
                                                                <Table.Summary.Row>
                                                                    <Table.Summary.Cell index={0} colSpan={3} align="right">Giảm giá</Table.Summary.Cell>
                                                                    <Table.Summary.Cell index={1} align="right"><span style={{ color: 'green' }}>-{Number(snapshot.discount_amount).toLocaleString()}</span></Table.Summary.Cell>
                                                                </Table.Summary.Row>
                                                            )}
                                                            {Number(snapshot.vat_rate) > 0 && (
                                                                <Table.Summary.Row>
                                                                    <Table.Summary.Cell index={0} colSpan={3} align="right">VAT ({snapshot.vat_rate}%)</Table.Summary.Cell>
                                                                    <Table.Summary.Cell index={1} align="right">
                                                                        {/* Estimate VAT content if not saved directly. Usually Total = (Sub - Disc) * (1+VAT) + Ship. So VAT = Total - Ship - Taxable. */}
                                                                        {((Number(snapshot.total_amount) - Number(snapshot.shipping_fee || 0)) - (snapItems.reduce((s: number, i: any) => s + Number(i.total_price || 0), 0) - Number(snapshot.discount_amount || 0))).toLocaleString()}
                                                                    </Table.Summary.Cell>
                                                                </Table.Summary.Row>
                                                            )}
                                                            {Number(snapshot.shipping_fee) > 0 && (
                                                                <Table.Summary.Row>
                                                                    <Table.Summary.Cell index={0} colSpan={3} align="right">Phí vận chuyển</Table.Summary.Cell>
                                                                    <Table.Summary.Cell index={1} align="right">{Number(snapshot.shipping_fee).toLocaleString()}</Table.Summary.Cell>
                                                                </Table.Summary.Row>
                                                            )}
                                                            <Table.Summary.Row style={{ background: '#fafafa' }}>
                                                                <Table.Summary.Cell index={0} colSpan={3} align="right"><b style={{ fontSize: 15 }}>TỔNG CỘNG</b></Table.Summary.Cell>
                                                                <Table.Summary.Cell index={1} align="right"><b style={{ color: 'red', fontSize: 15 }}>{Number(snapshot.total_amount).toLocaleString()}</b></Table.Summary.Cell>
                                                            </Table.Summary.Row>
                                                        </>
                                                    )
                                                }}
                                            />
                                        </div>
                                    ),
                                    maskClosable: true
                                })
                            }}>Xem chi tiết</Button>
                        }
                    ]}
                />
            </Modal>
        </Modal >
    );
};

export default SalesOrderDetail;