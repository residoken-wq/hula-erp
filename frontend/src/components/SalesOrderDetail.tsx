import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, DatePicker, Button, Tabs, Row, Col, InputNumber, Divider, message, Tag, Popconfirm, Tooltip, Checkbox, Table } from 'antd';
import { PlusOutlined, SaveOutlined, CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { HistoryOutlined, CopyOutlined, DeleteOutlined, LinkOutlined, PrinterOutlined, FileTextOutlined } from '@ant-design/icons';
import api from '../utils/api';
import dayjs from 'dayjs';
import SalesPayments from './sales/SalesPayments';
import SalesDeliveries from './sales/SalesDeliveries';
import SalesComments from './sales/SalesComments';
import SalesChecklistPanel from './SalesChecklistPanel';
import SalesOrderItemsTable from './sales/SalesOrderItemsTable';
import CancelOrderModal from './sales/CancelOrderModal';
import RevisionHistoryModal from './sales/RevisionHistoryModal';
import QuotationHistoryTab from './sales/QuotationHistoryTab';
import SampleImagesTab from './sales/SampleImagesTab';
import ContractBuilderModal from './sales/ContractBuilderModal';
import useMobile from '../hooks/useMobile';

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
    defaultCommentTab?: string;  // For deep linking from notifications
    highlightCommentId?: string; // Comment to highlight/scroll to
}

const SalesOrderDetail: React.FC<Props> = ({ open, onClose, onSuccess, initialData, customers, products, users = [], isQuotation = false, defaultCommentTab, highlightCommentId }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('1');
    const [orderItems, setOrderItems] = useState<any[]>([]);
    const [totalAmount, setTotalAmount] = useState(0);
    const isMobile = useMobile();

    // Cancel Modal State
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    // Revisions State
    const [revisions, setRevisions] = useState<any[]>([]);
    const [revisionModalOpen, setRevisionModalOpen] = useState(false);

    // Copy Quotation State
    const [customerQuotations, setCustomerQuotations] = useState<any[]>([]);
    const [copyQuotationModalOpen, setCopyQuotationModalOpen] = useState(false);

    // Contract State
    const [contractTemplates, setContractTemplates] = useState<any[]>([]);
    const [contractBuilderOpen, setContractBuilderOpen] = useState(false);

    const fetchContractTemplates = async () => {
        try {
            const res = await api.get('/system/templates');
            setContractTemplates(res.data);
        } catch (e) { console.error('Failed to load templates'); }
    };

    useEffect(() => { fetchContractTemplates(); }, []);

    const fetchRevisions = async (id: number) => {
        try {
            const res = await api.get(`/sales/${id}/revisions`);
            setRevisions(res.data);
        } catch (e) { console.error('Failed to load revisions'); }
    }

    useEffect(() => {
        if (open) {
            if (initialData?.id) {
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
                    is_production_sample_approved: initialData.is_production_sample_approved || false,

                    shipping_fee: initialData.shipping_fee || 0,
                    deposit_percent: initialData.deposit_percent || 0,
                    deposit_amount: initialData.deposit_amount || 0,
                    vat_company_name: initialData.vat_company_name || initialData.customer?.legal_name || initialData.customer?.name || '',
                    vat_tax_code: initialData.vat_tax_code || initialData.customer?.tax_code || '',
                    vat_address: initialData.vat_address || initialData.customer?.legal_address || initialData.customer?.address || '',
                    vat_invoice_link: initialData.vat_invoice_link || '',
                    vat_email: initialData.vat_email || initialData.customer?.einvoice_email || ''
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

                const isInternal = (initialData as any)?.isInternal;

                form.setFieldsValue({
                    order_code: '', // Let backend generate
                    order_date: dayjs(),
                    delivery_date: dayjs().add(25, 'day'), // Default: +25 days from order date
                    status: isQuotation ? 'QUOTATION' : 'SO_PENDING',
                    discount_rate: 0,
                    discount_amount: 0,
                    vat_rate: 0,
                    shipping_fee: 0,
                    // --- AUTO FILL FOR INTERNAL ---
                    customer_id: isInternal ? -1 : undefined, // Use -1 or handle effectively
                    note: isInternal ? 'Đơn nhập kho (Make to Stock)' : ''
                });

                // Load default terms & note from system config
                if (isQuotation && !isInternal) {
                    Promise.all([
                        api.get('/system/config/QUOTE_DEFAULT_TERMS').catch(() => ({ data: null })),
                        api.get('/system/config/QUOTE_DEFAULT_NOTE').catch(() => ({ data: null })),
                    ]).then(([termsRes, noteRes]) => {
                        const updates: any = {};
                        if (termsRes.data?.value) updates.terms_content = termsRes.data.value;
                        if (noteRes.data?.value) updates.note = noteRes.data.value;
                        if (Object.keys(updates).length > 0) form.setFieldsValue(updates);
                    });
                }

                if (isInternal) {
                    // Mock Internal Customer if not exists in list, or just display "Nội Bộ"
                    // Better: Handle in rendering
                }

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
        const total = Math.round(taxable * (1 + vatRate / 100) + shipping);

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

    const handleCustomerChange = async (customerId: number) => {
        const customer = customers.find((c: any) => c.id === customerId);
        if (customer) {
            form.setFieldsValue({
                vat_company_name: customer.legal_name || customer.name || '',
                vat_tax_code: customer.tax_code || '',
                vat_address: customer.legal_address || customer.address || '',
                vat_email: customer.einvoice_email || customer.email || ''
            });
        }
        // Fetch customer's old quotations
        if (isQuotation && customerId && customerId !== -1) {
            try {
                const res = await api.get('/sales');
                const quotes = (res.data || []).filter((o: any) =>
                    o.customer?.id === customerId && o.status === 'QUOTATION' && o.id !== initialData?.id
                );
                setCustomerQuotations(quotes);
            } catch (e) { setCustomerQuotations([]); }
        } else {
            setCustomerQuotations([]);
        }
    };

    const handleCopyQuotation = (quotation: any) => {
        const items = (quotation.items || []).map((i: any, idx: number) => ({
            key: Date.now() + idx,
            sku: i.product?.sku || i.sku,
            quantity: Number(i.quantity) || 1,
            unit_price: Number(i.unit_price) || 0,
            total_price: (Number(i.quantity) || 1) * (Number(i.unit_price) || 0),
            note: i.note || ''
        }));
        setOrderItems(items);
        calculateTotal(items);
        form.setFieldsValue({
            delivery_date: quotation.delivery_date ? dayjs(quotation.delivery_date) : null,
            note: quotation.note || ''
        });
        setCopyQuotationModalOpen(false);
        message.success(`Đã copy ${items.length} sản phẩm từ ${quotation.order_code}`);
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
        const newItems = orderItems.filter((_: any, i: number) => i !== index);
        setOrderItems(newItems);
        calculateTotal(newItems);
    };

    const handleReorderItems = (newItems: any[]) => {
        setOrderItems(newItems);
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();

            // --- VALIDATION: Check Production Sample Approval ---
            if (values.status === 'IN_PRODUCTION' && !values.is_production_sample_approved) { // Checkbox value
                message.error('Cần duyệt mẫu sản xuất trước khi chuyển sang Đang Sản Xuất!');
                return;
            }

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
                    image_url: i.image_url, // <--- Add this!
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




    return (
        <Modal
            title={
                <span style={{ fontSize: isMobile ? 14 : 16 }}>
                    {isQuotation ? 'Báo Giá' : 'Đơn Hàng'} #{initialData?.order_code}
                    {initialData?.version > 1 && <Tag color="orange" style={{ marginLeft: 5 }}>v{initialData?.version}</Tag>}
                    {initialData?.status === 'COMPLETED' && <Tag color="green" style={{ marginLeft: 5 }}>Hoàn tất</Tag>}
                </span>
            }
            open={open}
            onCancel={onClose}
            width={isMobile ? '100%' : 1100}
            style={{ top: isMobile ? 0 : 20, maxWidth: '100vw' }}
            bodyStyle={{ padding: isMobile ? 8 : 24, maxHeight: isMobile ? 'calc(100vh - 120px)' : '70vh', overflowY: 'auto' }}
            footer={
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end' }}>
                    <Button size={isMobile ? 'small' : 'middle'} onClick={onClose}>Đóng</Button>
                    <Button size={isMobile ? 'small' : 'middle'} type="primary" icon={<SaveOutlined />} loading={loading} onClick={handleSave}>
                        {isMobile ? 'Lưu' : 'Lưu Thông Tin'}
                    </Button>
                    {isQuotation && initialData && (
                        <Button size={isMobile ? 'small' : 'middle'} icon={<CopyOutlined />} onClick={handleCreateRevision}>
                            {isMobile ? 'Tạo Ver' : 'Tạo Version Mới'}
                        </Button>
                    )}
                    {isQuotation && initialData && (
                        <Popconfirm title="Xóa báo giá?" onConfirm={async () => {
                            try { await api.delete(`/sales/quote/${initialData.id}`); message.success('Đã xóa'); onSuccess(); onClose(); } catch { message.error('Lỗi xóa'); }
                        }}>
                            <Button size={isMobile ? 'small' : 'middle'} danger icon={<DeleteOutlined />}>{isMobile ? 'Xóa' : 'Xóa Báo Giá'}</Button>
                        </Popconfirm>
                    )}
                    {isQuotation && initialData && (
                        <Button size={isMobile ? 'small' : 'middle'} icon={<HistoryOutlined />} onClick={() => setRevisionModalOpen(true)}>
                            {isMobile ? 'LS' : 'Lịch sử'}
                        </Button>
                    )}

                    {(!isQuotation && initialData && initialData.status !== 'CANCELLED' && initialData.status !== 'COMPLETED') && (
                        <Button size={isMobile ? 'small' : 'middle'} danger icon={<DeleteOutlined />} onClick={() => setCancelModalOpen(true)}>
                            {isMobile ? 'Hủy' : 'Hủy Đơn'}
                        </Button>
                    )}
                    {(!isQuotation && initialData && initialData.status === 'SO_PENDING') && (
                        <Popconfirm
                            title="Xóa đơn hàng?"
                            description="Đơn hàng sẽ bị xóa hoàn toàn khỏi hệ thống."
                            onConfirm={async () => {
                                try {
                                    await api.delete(`/sales/${initialData.id}`);
                                    message.success('Đã xóa đơn hàng');
                                    onSuccess();
                                    onClose();
                                } catch (e: any) {
                                    message.error(e.response?.data?.message || 'Lỗi xóa đơn hàng');
                                }
                            }}
                        >
                            <Button size={isMobile ? 'small' : 'middle'} danger type="dashed" icon={<DeleteOutlined />}>
                                {isMobile ? 'Xóa' : 'Xóa đơn hàng'}
                            </Button>
                        </Popconfirm>
                    )}
                    {(!isQuotation && initialData && initialData.status !== 'CANCELLED') && (
                        <Button size={isMobile ? 'small' : 'middle'} type="primary" danger icon={<CheckCircleOutlined />} onClick={handleCompleteOrder}>
                            {isMobile ? 'Hoàn tất' : 'Hoàn tất đơn hàng'}
                        </Button>
                    )}
                </div>
            }
        >
            <Tabs activeKey={activeTab} onChange={setActiveTab} size={isMobile ? 'small' : 'middle'}>
                <Tabs.TabPane tab={isMobile ? '1. SP' : '1. Thông tin & Sản phẩm'} key="1">
                    <Form form={form} layout="vertical" onValuesChange={handleFormValuesChange}>
                        <Row gutter={[16, isMobile ? 0 : 16]}>
                            <Col xs={24} sm={8}><Form.Item name="order_code" label="Mã đơn"><Input disabled placeholder="Tự động" /></Form.Item></Col>
                            <Col xs={24} sm={8}>
                                <Form.Item name="customer_id" label="Khách hàng" rules={[{ required: true }]}>
                                    <Select
                                        showSearch
                                        placeholder="Chọn KH"
                                        optionFilterProp="label"
                                        options={[
                                            ...(initialData?.isInternal ? [{ label: '🏢 NỘI BỘ', value: -1 }] : []),
                                            ...customers.map((c: any) => ({ label: `${c.name} - ${c.phone}`, value: c.id }))
                                        ]}
                                        disabled={initialData?.isInternal}
                                    />
                                </Form.Item>
                                {isQuotation && customerQuotations.length > 0 && (
                                    <Button
                                        size="small"
                                        icon={<CopyOutlined />}
                                        onClick={() => setCopyQuotationModalOpen(true)}
                                        style={{ marginTop: -10, marginBottom: 10 }}
                                    >
                                        Copy từ {customerQuotations.length} BG cũ
                                    </Button>
                                )}
                            </Col>
                            <Col xs={24} sm={8}><Form.Item name="order_date" label="Ngày đặt" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
                        </Row>
                        <Row gutter={[16, isMobile ? 0 : 16]}>
                            <Col xs={24} sm={8}>
                                <Form.Item name="status" label="Trạng thái">
                                    <Select>
                                        {isQuotation ? (
                                            <Option value="QUOTATION">Báo Giá</Option>
                                        ) : (
                                            <>
                                                <Option value="SO_PENDING">Xác nhận đơn hàng</Option>
                                                <Option value="DEPOSITED">Đã đặt cọc</Option>
                                                <Option value="SAMPLE_APPROVED">Đã duyệt mẫu SX</Option>
                                                <Option value="IN_PRODUCTION">Đang sản xuất</Option>
                                                <Option value="PARTIAL_DELIVERY">Giao 1 phần</Option>
                                                <Option value="DELIVERED">Đã giao hàng</Option>
                                                <Option value="COMPLETED">Hoàn tất</Option>
                                            </>
                                        )}
                                        <Option value="CANCELLED">Đã Hủy</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={8}><Form.Item name="delivery_date" label={isMobile ? 'Ngày giao' : 'Ngày giao dự kiến'}><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
                            <Col xs={24} sm={8}>
                                <Form.Item name="assigned_to_id" label={isMobile ? 'Phụ trách' : 'Nhân sự phụ trách'}>
                                    <Select allowClear showSearch optionFilterProp="label" options={users.map(u => ({ label: u.full_name || u.username, value: u.id }))} placeholder="Chọn NV" />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={24}>
                                <Form.Item name="is_production_sample_approved" valuePropName="checked">
                                    <Checkbox style={{ fontWeight: 600, color: '#1890ff' }}>
                                        {isMobile ? 'Đã duyệt mẫu SX' : 'Đã duyệt mẫu tiêu chuẩn - Production Sample Approved'}
                                    </Checkbox>
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
                        <Row>
                            <Col span={24}>
                                <Form.Item name="terms_content" label="Điều khoản & Quy định (Hiển thị trên Portal & Bản in)">
                                    <Input.TextArea rows={4} placeholder="VD: 1. Thời gian giao hàng: 15-20 ngày..." />
                                </Form.Item>
                            </Col>
                        </Row>

                        {/* HIDDEN FIELDS TO REGISTER VALUES */}
                        <Form.Item name="discount_rate" hidden><InputNumber /></Form.Item>
                        <Form.Item name="discount_amount" hidden><InputNumber /></Form.Item>
                        <Form.Item name="vat_rate" hidden><InputNumber /></Form.Item>
                        <Form.Item name="shipping_fee" hidden><InputNumber /></Form.Item>
                        <Form.Item name="deposit_percent" hidden><InputNumber /></Form.Item>
                        <Form.Item name="deposit_amount" hidden><InputNumber /></Form.Item>

                        <Divider orientation="left">Danh sách sản phẩm</Divider>
                        <SalesOrderItemsTable
                            items={orderItems}
                            products={products}
                            isMobile={isMobile ?? false}
                            onItemChange={handleItemChange}
                            onRemoveItem={handleRemoveItem}
                            onReorder={handleReorderItems}
                        />
                        <Button type="dashed" onClick={handleAddItem} block icon={<PlusOutlined />} style={{ marginTop: 10 }}>Thêm sản phẩm</Button>

                        {/* NEW TOTALS SECTION */}
                        <Row justify="end" style={{ marginTop: 24 }}>
                            <Col span={10}>
                                <div style={{ background: '#fafafa', padding: 16, borderRadius: 8 }}>
                                    <Form.Item shouldUpdate noStyle>
                                        {({ getFieldValue }) => {
                                            const subtotal = orderItems.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0);
                                            const discountAmt = Number(getFieldValue('discount_amount')) || 0;
                                            const vatRate = Number(getFieldValue('vat_rate')) || 0;
                                            const shipping = Number(getFieldValue('shipping_fee')) || 0;

                                            const taxable = Math.max(0, subtotal - discountAmt);
                                            const total = taxable * (1 + vatRate / 100) + shipping;

                                            // Common styles
                                            const labelStyle: React.CSSProperties = { color: '#666', fontSize: 13 };
                                            const valStyle: React.CSSProperties = { fontWeight: 500, fontSize: 13, textAlign: 'right' as const };
                                            const rowStyle: React.CSSProperties = { marginBottom: 12, alignItems: 'center' };

                                            return (
                                                <>
                                                    <Row style={rowStyle}>
                                                        <Col span={10} style={labelStyle}>Tổng tiền hàng:</Col>
                                                        <Col span={14} style={valStyle}>{subtotal.toLocaleString()} ₫</Col>
                                                    </Row>

                                                    <Row style={rowStyle}>
                                                        <Col span={10} style={labelStyle}>Giảm giá:</Col>
                                                        <Col span={14} style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                                            <InputNumber
                                                                size="small"
                                                                min={0} max={100}
                                                                formatter={v => `${v}%`}
                                                                parser={v => v!.replace('%', '')}
                                                                placeholder="%"
                                                                style={{ width: 60 }}
                                                                value={getFieldValue('discount_rate')}
                                                                onChange={(val) => {
                                                                    const rate = Number(val);
                                                                    const amt = Math.floor(subtotal * rate / 100);
                                                                    form.setFieldsValue({ discount_rate: rate, discount_amount: amt });
                                                                    calculateTotal(orderItems);
                                                                }}
                                                            />
                                                            <InputNumber
                                                                size="small"
                                                                style={{ width: 110 }}
                                                                value={getFieldValue('discount_amount')}
                                                                formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                                parser={v => v!.replace(/\$\s?|(,*)/g, '')}
                                                                onChange={(val) => {
                                                                    const amt = Number(val);
                                                                    const rate = subtotal > 0 ? Number((amt / subtotal * 100).toFixed(2)) : 0;
                                                                    form.setFieldsValue({ discount_amount: amt, discount_rate: rate });
                                                                    calculateTotal(orderItems);
                                                                }}
                                                            />
                                                        </Col>
                                                    </Row>

                                                    <Row style={rowStyle}>
                                                        <Col span={10} style={labelStyle}>VAT ({vatRate}%):</Col>
                                                        <Col span={14} style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, alignItems: 'center' }}>
                                                            <div style={{ color: '#888', marginRight: 4 }}>
                                                                {vatRate > 0 ? (taxable * vatRate / 100).toLocaleString() : '0'} ₫
                                                            </div>
                                                            <InputNumber
                                                                size="small"
                                                                min={0} max={100}
                                                                formatter={v => `${v}%`}
                                                                parser={v => v!.replace('%', '')}
                                                                style={{ width: 60 }}
                                                                value={getFieldValue('vat_rate')}
                                                                onChange={(v) => { form.setFieldsValue({ vat_rate: v }); calculateTotal(orderItems); }}
                                                            />
                                                        </Col>
                                                    </Row>

                                                    <Row style={rowStyle}>
                                                        <Col span={10} style={labelStyle}>Phí vận chuyển:</Col>
                                                        <Col span={14} style={{ textAlign: 'right' }}>
                                                            <InputNumber
                                                                size="small"
                                                                min={0}
                                                                style={{ width: 110 }}
                                                                value={getFieldValue('shipping_fee')}
                                                                formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                                parser={v => v!.replace(/\$\s?|(,*)/g, '')}
                                                                onChange={(v) => { form.setFieldsValue({ shipping_fee: v }); calculateTotal(orderItems); }}
                                                            />
                                                        </Col>
                                                    </Row>

                                                    <Divider style={{ margin: '12px 0' }} />

                                                    <Row style={{ alignItems: 'center' }}>
                                                        <Col span={10} style={{ fontSize: 15, fontWeight: 700, color: '#333' }}>TỔNG CỘNG:</Col>
                                                        <Col span={14} style={{ textAlign: 'right', fontSize: 18, fontWeight: 700, color: '#f5222d' }}>
                                                            {total.toLocaleString()} ₫
                                                        </Col>
                                                    </Row>

                                                    {/* DEPOSIT SECTION */}
                                                    <Divider style={{ margin: '12px 0' }} dashed />
                                                    <Row style={rowStyle}>
                                                        <Col span={10} style={{ ...labelStyle, fontWeight: 500, color: '#722ed1' }}>Đặt cọc:</Col>
                                                        <Col span={14} style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                                            <InputNumber
                                                                size="small"
                                                                min={0} max={100}
                                                                formatter={v => `${v}%`}
                                                                parser={v => v!.replace('%', '')}
                                                                placeholder="%"
                                                                style={{ width: 70 }}
                                                                value={getFieldValue('deposit_percent')}
                                                                onChange={(val) => {
                                                                    const rate = Number(val) || 0;
                                                                    const amt = Math.floor(total * rate / 100);
                                                                    form.setFieldsValue({ deposit_percent: rate, deposit_amount: amt });
                                                                }}
                                                            />
                                                            <InputNumber
                                                                size="small"
                                                                style={{ width: 120 }}
                                                                value={getFieldValue('deposit_amount')}
                                                                formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                                parser={v => v!.replace(/\$\s?|(,*)/g, '')}
                                                                onChange={(val) => {
                                                                    const amt = Number(val) || 0;
                                                                    const rate = total > 0 ? Number((amt / total * 100).toFixed(0)) : 0;
                                                                    form.setFieldsValue({ deposit_amount: amt, deposit_percent: rate });
                                                                }}
                                                            />
                                                        </Col>
                                                    </Row>
                                                    {getFieldValue('deposit_amount') > 0 && (
                                                        <Row style={{ marginTop: 4 }}>
                                                            <Col span={24} style={{ textAlign: 'right', fontSize: 12, color: '#722ed1', fontStyle: 'italic' }}>
                                                                💰 Yêu cầu đặt cọc: {Number(getFieldValue('deposit_amount') || 0).toLocaleString()} ₫
                                                            </Col>
                                                        </Row>
                                                    )}
                                                </>);
                                        }}
                                    </Form.Item>
                                </div>
                            </Col>
                        </Row>
                    </Form>
                </Tabs.TabPane>
                <Tabs.TabPane tab={isMobile ? '2. HĐ' : '2. Hợp đồng & Hóa đơn'} key="invoice">
                    <Form form={form} layout="vertical">
                        <div style={{ padding: 10, background: '#fff', border: '1px solid #d9d9d9', borderRadius: 4, marginBottom: 15 }}>
                            <div style={{ fontWeight: 600, marginBottom: 10, color: '#1890ff' }}><FileTextOutlined /> TẠO HỢP ĐỒNG</div>
                            <Row gutter={16} align="middle">
                                <Col flex="auto">
                                    <i>Soạn thảo hợp đồng, tự động điền biến và thêm phụ lục hình ảnh.</i>
                                    {initialData?.contract_html && (
                                        <div style={{ color: '#52c41a', marginTop: 5, fontSize: 13 }}>
                                            <CheckCircleOutlined /> Đã có bản nháp hợp đồng lưu trên hệ thống
                                        </div>
                                    )}
                                </Col>
                                <Col>
                                    <Button type={initialData?.contract_html ? "default" : "primary"} icon={<PrinterOutlined />} onClick={() => setContractBuilderOpen(true)}>
                                        {initialData?.contract_html ? 'Mở Hợp Đồng Đã Lưu' : 'Soạn Thảo & In Hợp Đồng'}
                                    </Button>
                                </Col>
                            </Row>
                        </div>

                        <div style={{ padding: isMobile ? 6 : 10, background: '#f5f5f5', borderRadius: 4, marginBottom: 15 }}>
                            {!isMobile && (
                                <div style={{ fontStyle: 'italic', color: '#666', marginBottom: 10, fontSize: 12 }}>
                                    <InfoCircleOutlined /> Lấy từ "Pháp Nhân" của KH
                                </div>
                            )}
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
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item name="vat_email" label="Email Nhận Hóa Đơn">
                                        <Input placeholder="email@company.com" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="vat_invoice_link" label="Link Hóa Đơn (PDF/Drive)">
                                        <Input placeholder="https://..." prefix={<LinkOutlined />} />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </div>
                    </Form>
                </Tabs.TabPane>
                {initialData?.id && !isQuotation && (
                    <>
                        <Tabs.TabPane tab={isMobile ? '3. TT' : '3. Thanh toán'} key="2">
                            <SalesPayments
                                orderId={initialData.id}
                                orderCode={initialData.order_code}
                                totalAmount={totalAmount}
                                paidAmount={initialData.paid_amount || 0}
                                customerName={initialData?.customer?.name || initialData?.customer_name}
                                orderStatus={initialData.status}
                                onSuccess={onSuccess}
                            />
                        </Tabs.TabPane>
                        <Tabs.TabPane tab={isMobile ? '4. GH' : '4. Giao hàng'} key="3">
                            <SalesDeliveries order={initialData} products={products} customers={customers} onSuccess={onSuccess} />
                        </Tabs.TabPane>
                        <Tabs.TabPane tab={isMobile ? '5. Chat' : '5. Trao đổi'} key="4">
                            <SalesComments
                                orderId={initialData.id}
                                defaultTab={defaultCommentTab}
                                highlightCommentId={highlightCommentId}
                            />
                        </Tabs.TabPane>
                        <Tabs.TabPane tab={isMobile ? '6. CL' : '6. Checklist'} key="5">
                            <SalesChecklistPanel orderId={initialData.id} orderStatus={initialData.status} onRefresh={onSuccess} />
                        </Tabs.TabPane>
                        <Tabs.TabPane tab={isMobile ? '7. Mẫu' : '7. Mẫu SX'} key="sample_images">
                            <SampleImagesTab
                                orderId={initialData.id}
                                initialImages={initialData.approved_sample_images || []}
                                isApproved={initialData.is_production_sample_approved}
                                onApprove={handleApproveSamples}
                                onSave={(images) => { initialData.approved_sample_images = images; }}
                                isQuotation={isQuotation}
                            />
                        </Tabs.TabPane>
                        <Tabs.TabPane tab={isMobile ? '8. BG' : '8. Lịch sử Báo giá'} key="quotation_history">
                            <QuotationHistoryTab revisions={revisions} products={products} customers={customers} />
                        </Tabs.TabPane>
                    </>
                )}
            </Tabs>

            {/* CANCEL REASON MODAL */}
            <CancelOrderModal
                open={cancelModalOpen}
                cancelReason={cancelReason}
                onReasonChange={setCancelReason}
                onConfirm={handleCancelOrder}
                onCancel={() => setCancelModalOpen(false)}
            />

            {/* REVISION HISTORY MODAL */}
            <RevisionHistoryModal
                open={revisionModalOpen}
                onClose={() => setRevisionModalOpen(false)}
                revisions={revisions}
                products={products}
                customers={customers}
            />

            {/* CONTRACT BUILDER MODAL */}
            <ContractBuilderModal
                open={contractBuilderOpen}
                onCancel={() => setContractBuilderOpen(false)}
                onSuccess={onSuccess}
                initialData={initialData}
                templates={contractTemplates}
            />

            {/* COPY QUOTATION MODAL */}
            <Modal
                title="Copy từ Báo giá cũ"
                open={copyQuotationModalOpen}
                onCancel={() => setCopyQuotationModalOpen(false)}
                footer={null}
                width={700}
            >
                <div style={{ marginBottom: 10, color: '#666' }}>Chọn báo giá để copy sản phẩm:</div>
                <Table
                    dataSource={customerQuotations}
                    rowKey="id"
                    size="small"
                    pagination={false}
                    onRow={(record: any) => ({
                        onClick: () => handleCopyQuotation(record),
                        style: { cursor: 'pointer' }
                    })}
                    columns={[
                        { title: 'Mã BG', dataIndex: 'order_code', render: (v: string) => <Tag color="blue">{v}</Tag> },
                        { title: 'Ngày', dataIndex: 'order_date', render: (d: string) => dayjs(d).format('DD/MM/YYYY') },
                        { title: 'Sản phẩm', render: (_: any, r: any) => `${r.items?.length || 0} SP` },
                        { title: 'Tổng tiền', dataIndex: 'total_amount', align: 'right' as const, render: (v: number) => <b style={{ color: 'red' }}>{Number(v || 0).toLocaleString()} ₫</b> }
                    ]}
                />
            </Modal>
        </Modal >
    );
};

export default SalesOrderDetail;