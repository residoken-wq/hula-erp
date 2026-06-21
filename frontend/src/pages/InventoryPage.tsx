import React, { useEffect, useState, useMemo } from 'react';
import { Table, Button, message, Card, Modal, Form, Input, Select, InputNumber, Row, Col, Tabs, Tag, Statistic, Radio, Divider, Space, Badge, Checkbox, Popconfirm, DatePicker } from 'antd';
import {
    ReloadOutlined, SwapOutlined, HistoryOutlined,
    AppstoreOutlined, ArrowUpOutlined, ArrowDownOutlined,
    InboxOutlined, ShopOutlined, AlertOutlined, CheckCircleOutlined, CarOutlined, PlusOutlined, EditOutlined, DeleteOutlined
} from '@ant-design/icons';
import api from '../utils/api';
import dayjs from 'dayjs';
import useMobile from '../hooks/useMobile';


const { Option } = Select;

// ĐỊNH NGHĨA 4 KHO & QUY ĐỊNH LOẠI HÀNG CHO TỪNG KHO
const WAREHOUSES = [
    { code: 'KHO_TP', name: '1. Kho Thành Phẩm', color: 'green', allowedTypes: ['PRODUCT'] },
    { code: 'KHO_BTP', name: '2. Kho Bán Thành Phẩm', color: 'orange', allowedTypes: ['PRODUCT'] }, // BTP thường là SP dở dang
    { code: 'KHO_NPL', name: '3. Kho Nguyên Phụ Liệu', color: 'blue', allowedTypes: ['MATERIAL'] }, // Kho này chỉ chứa NL
    { code: 'KHO_LOI', name: '4. Kho Hàng Lỗi', color: 'red', allowedTypes: ['PRODUCT'] }, // Hàng lỗi trả về thường là SP
    { code: 'KHO_THANH_LY', name: '5. Kho Thanh Lý', color: 'gray', allowedTypes: ['PRODUCT', 'MATERIAL'] }, // Hàng chờ thanh lý
];

const InventoryPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const isMobile = useMobile();

    const [products, setProducts] = useState<any[]>([]);
    const [materials, setMaterials] = useState<any[]>([]);
    const [stocks, setStocks] = useState<any[]>([]); // Dữ liệu tồn chi tiết
    const [history, setHistory] = useState<any[]>([]);
    const [pendingReceipts, setPendingReceipts] = useState<any[]>([]);
    const [pendingDeliveries, setPendingDeliveries] = useState<any[]>([]); // <--- New State: Pending Export Requests
    const [completedDeliveries, setCompletedDeliveries] = useState<any[]>([]); // <--- New State: Completed Export Deliveries
    const [shippingCarriers, setShippingCarriers] = useState<any[]>([]); // <--- Shipping Carriers

    const [searchText, setSearchText] = useState('');

    const [activeTab, setActiveTab] = useState('ALL_STOCKS'); // Tab chính
    const [isModalOpen, setIsModalOpen] = useState(false);

    // --- STATE ---
    const [showNegativeOnly, setShowNegativeOnly] = useState(false);
    const [resetCode, setResetCode] = useState('');
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);

    // --- TRANSFER MODAL STATE ---
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [transferForm] = Form.useForm();
    const [transferTarget, setTransferTarget] = useState<{ item: any, fromWh: string, toWh: string, title: string } | null>(null);

    // --- CARRIER MODAL STATE ---
    const [isCarrierModalOpen, setIsCarrierModalOpen] = useState(false);
    const [carrierForm] = Form.useForm();
    const [editingCarrier, setEditingCarrier] = useState<any>(null);

    // --- CONFIRM RECEIPT MODAL STATE ---
    const [isConfirmReceiptModalOpen, setIsConfirmReceiptModalOpen] = useState(false);
    const [confirmReceiptForm] = Form.useForm();
    const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

    const [form] = Form.useForm();


    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const adjustmentType = Form.useWatch('type', form);
    const itemType = Form.useWatch('itemType', form);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [pRes, mRes, sRes, hRes, grRes, dRes, cdRes, cRes] = await Promise.all([
                api.get('/products'),
                api.get('/materials'),
                api.get('/inventory/stocks'),
                api.get('/inventory/history'),
                api.get('/inventory/goods-receipt/pending'),
                api.get('/inventory/deliveries/pending'),
                api.get('/inventory/deliveries/completed'),
                api.get('/inventory/shipping-carriers')
            ]);
            setProducts(pRes.data);
            setMaterials(mRes.data);
            setStocks(sRes.data);
            setHistory(hRes.data);
            setPendingReceipts(grRes.data || []);
            setPendingDeliveries(dRes.data || []);
            setCompletedDeliveries(cdRes.data || []);
            setShippingCarriers(cRes.data || []);
        } catch (error) {
            message.error('Đã xảy ra lỗi khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAdjust = async (values: any) => {
        try {
            await api.post('/inventory/adjust', values);
            message.success('Điều chỉnh thành công');
            setIsModalOpen(false);
            form.resetFields();
            fetchData();
        } catch (error) {
            message.error('Lỗi điều chỉnh kho');
        }
    };

    const getStockQty = (type: string, id: number, whCode: string) => {
        if (type === 'PRODUCT') {
            const product = products.find(p => p.id === id);
            if (product && product.product_type === 'COMBO') {
                if (!product.combo_components || product.combo_components.length === 0) return 0;
                let minStock = Infinity;
                for (const comp of product.combo_components) {
                    const childStockRecord = stocks.find(s => s.item_type === 'PRODUCT' && Number(s.item_id) === comp.child_id && s.warehouse_code === whCode);
                    const childQty = childStockRecord ? Number(childStockRecord.quantity) : 0;
                    const possibleStock = Math.floor(childQty / (Number(comp.quantity) || 1));
                    if (possibleStock < minStock) {
                        minStock = possibleStock;
                    }
                }
                return minStock === Infinity ? 0 : minStock;
            }
        }
        
        const record = stocks.find(s => s.item_type === type && Number(s.item_id) === id && s.warehouse_code === whCode);
        return record ? Number(record.quantity) : 0;
    };

    // --- TRANSFER ---
    const openTransferModal = (record: any, actionType: 'REPORT_DEFECT' | 'RE_IMPORT' | 'LIQUIDATE') => {
        let fromWh = '', toWh = '';
        let title = '';

        if (actionType === 'REPORT_DEFECT') {
            fromWh = 'KHO_TP';
            toWh = 'KHO_LOI';
            title = `Báo lỗi SP: ${record.name} (${record.sku})`;
        } else if (actionType === 'RE_IMPORT') {
            fromWh = 'KHO_LOI';
            toWh = 'KHO_TP';
            title = `Tái nhập kho SP: ${record.name}`;
        } else if (actionType === 'LIQUIDATE') {
            fromWh = 'KHO_LOI';
            toWh = 'KHO_THANH_LY';
            title = `Thanh lý SP: ${record.name}`;
        }

        setTransferTarget({ item: record, fromWh, toWh, title });
        transferForm.setFieldsValue({ quantity: 1, note: '' });
        setIsTransferModalOpen(true);
    };

    const handleTransfer = async () => {
        try {
            const values = await transferForm.validateFields();
            if (!transferTarget) return;

            await api.post('/inventory/transfer', {
                itemType: transferTarget.item.item_type,
                itemId: transferTarget.item.id,
                quantity: values.quantity,
                fromWh: transferTarget.fromWh,
                toWh: transferTarget.toWh,
                note: values.note
            });

            message.success('Chuyển kho thành công');
            setIsTransferModalOpen(false);
            fetchData();
        } catch (e) {
            message.error('Lỗi chuyển kho');
        }
    };

    const openConfirmReceiptModal = (receipt: any) => {
        setSelectedReceipt(receipt);
        const initialValues: any = {
            actual_receive_date: dayjs(),
            shipping_fee: 0,
            delivery_note_url: ''
        };
        receipt.items.forEach((item: any) => {
            initialValues[`quantity_${item.id}`] = item.quantity;
        });
        confirmReceiptForm.setFieldsValue(initialValues);
        setIsConfirmReceiptModalOpen(true);
    };

    const handleConfirmReceipt = async () => {
        try {
            const values = await confirmReceiptForm.validateFields();
            if (!selectedReceipt) return;
            
            const payload = {
                actual_receive_date: values.actual_receive_date ? values.actual_receive_date.format('YYYY-MM-DD') : undefined,
                shipping_fee: values.shipping_fee,
                delivery_note_url: values.delivery_note_url,
                items: selectedReceipt.items.map((item: any) => ({
                    id: item.id,
                    quantity: values[`quantity_${item.id}`] !== undefined ? values[`quantity_${item.id}`] : item.quantity
                }))
            };

            await api.post(`/inventory/goods-receipt/${selectedReceipt.id}/confirm`, payload);
            message.success('Đã nhập kho thành công');
            setIsConfirmReceiptModalOpen(false);
            fetchData();
        } catch (e) {
            message.error('Lỗi nhập kho');
        }
    };

    const handleDeleteReceipt = async (id: number) => {
        try {
            await api.delete(`/inventory/goods-receipt/${id}`);
            message.success('Đã hủy phiếu nhập');
            fetchData();
        } catch (e) {
            message.error('Lỗi hủy phiếu nhập');
        }
    };

    const handleConfirmExport = async (id: number) => {
        try {
            // Defaulting to KHO_TP for now as per requirement, but could be selectable
            await api.post(`/inventory/deliveries/${id}/confirm`, { warehouse: 'KHO_TP' });
            message.success('Đã xác nhận xuất kho');
            fetchData();
        } catch (e) {
            message.error('Lỗi xác nhận xuất kho');
        }
    };

    // --- SHIPPING CARRIER CRUD ---
    const openCarrierModal = (carrier?: any) => {
        if (carrier) {
            setEditingCarrier(carrier);
            carrierForm.setFieldsValue(carrier);
        } else {
            setEditingCarrier(null);
            carrierForm.resetFields();
        }
        setIsCarrierModalOpen(true);
    };

    const handleSaveCarrier = async () => {
        try {
            const values = await carrierForm.validateFields();
            if (editingCarrier) {
                await api.put(`/inventory/shipping-carriers/${editingCarrier.id}`, values);
                message.success('Đã cập nhật đơn vị vận chuyển');
            } else {
                await api.post('/inventory/shipping-carriers', values);
                message.success('Đã thêm đơn vị vận chuyển');
            }
            setIsCarrierModalOpen(false);
            fetchData();
        } catch (e) {
            message.error('Lỗi lưu đơn vị vận chuyển');
        }
    };

    const handleDeleteCarrier = async (id: number) => {
        try {
            await api.delete(`/inventory/shipping-carriers/${id}`);
            message.success('Đã xóa đơn vị vận chuyển');
            fetchData();
        } catch (e) {
            message.error('Lỗi xóa');
        }
    };

    // --- PREPARE DATA TỔNG HỢP ---
    const masterData = useMemo(() => {
        const prodList = products.map(p => ({ ...p, item_type: 'PRODUCT', key: `P_${p.id}` }));
        const matList = materials.map(m => ({ ...m, item_type: 'MATERIAL', key: `M_${m.id}` }));
        return [...prodList, ...matList];
    }, [products, materials]);

    // --- LỌC DATA THEO SEARCH TEXT & FILTER ---
    const filteredMasterData = useMemo(() => {
        let data = masterData;

        // 1. Filter Text
        if (searchText) {
            const lower = searchText.toLowerCase();
            data = data.filter(item =>
                (item.name && item.name.toLowerCase().includes(lower)) ||
                (item.sku && item.sku.toLowerCase().includes(lower)) ||
                (item.code && item.code.toLowerCase().includes(lower))
            );
        }

        // 2. Filter Negative
        if (showNegativeOnly) {
            // Logic: Nếu đang xem All -> check total stock < 0. Nếu đang xem kho con -> check stock in that warehouse (nhưng logic kho con nằm ở getDataByWarehouse).
            // Tuy nhiên filteredMasterData là nguồn chung.
            // Giải pháp: Ở đây ta chỉ lọc những item mà CÓ ÍT NHẤT 1 kho bị âm HOẶC tổng âm?
            // Đơn giản nhất: Lọc những item có quantity_in_stock < 0 (Tổng âm).
            // User request: "tìm các sản phẩm đang bị âm số lượng". Thường là tổng âm hoặc âm kho.
            // Hãy check quantity_in_stock < 0.
            data = data.filter(item => Number(item.quantity_in_stock || 0) < 0);
        }

        return data;
    }, [masterData, searchText, showNegativeOnly]);

    // --- HÀM LỌC DATA THEO KHO ---
    const getDataByWarehouse = (whCode: string) => {
        const whConfig = WAREHOUSES.find(w => w.code === whCode);
        if (!whConfig) return [];
        let data = filteredMasterData.filter(item => whConfig.allowedTypes.includes(item.item_type));

        // Fix: Đối với Kho Lỗi, Kho Thanh Lý, Kho BTP, chỉ hiển thị những sản phẩm có tồn kho khác 0
        if (whCode === 'KHO_LOI' || whCode === 'KHO_THANH_LY' || whCode === 'KHO_BTP') {
            data = data.filter(item => getStockQty(item.item_type, item.id, whCode) !== 0);
        }

        return data;
    };

    // ...



    // Cột hiển thị linh động theo Kho
    const getStockColumns = (whCode?: string) => [
        {
            title: 'Phân loại', dataIndex: 'item_type', width: 100,
            render: (t: string) => t === 'PRODUCT' ? <Tag color="blue">Sản phẩm</Tag> : <Tag color="cyan">Nguyên liệu</Tag>
        },
        { title: 'Mã', dataIndex: 'sku', render: (t: any, r: any) => <b>{t || r.code}</b> },
        { title: 'Tên hàng', dataIndex: 'name' },
        { title: 'ĐVT', dataIndex: 'unit', align: 'center' as const, width: 80 },
        {
            title: whCode ? `Tồn ${WAREHOUSES.find(w => w.code === whCode)?.name}` : 'Tổng Tồn Hệ Thống',
            key: 'qty', align: 'right' as const, width: 150,
            render: (_: any, r: any) => {
                const qty = whCode
                    ? getStockQty(r.item_type, r.id, whCode)
                    : Number(r.quantity_in_stock || 0); // Nếu xem tất cả thì lấy tổng

                return <Tag color={qty > 0 ? 'green' : 'red'} style={{ fontSize: 14, fontWeight: 'bold' }}>{qty.toLocaleString()}</Tag>
            }
        },
        {
            title: '', key: 'action', align: 'center' as const, width: 180,
            render: (_: any, r: any) => (
                <Space>
                    <Button size="small" icon={<SwapOutlined />} onClick={() => {
                        form.setFieldsValue({
                            itemType: r.item_type,
                            itemId: r.id,
                            type: 'IMPORT',
                            warehouse: whCode || 'KHO_TP' // Default
                        });
                        setIsModalOpen(true);
                    }}>Đ/C</Button>

                    {/* KHO LỖI: HIỆN NÚT XỬ LÝ */}
                    {whCode === 'KHO_LOI' && (
                        <>
                            <Button size="small" type="primary" ghost icon={<InboxOutlined />} title="Tái nhập kho tốt" onClick={() => openTransferModal(r, 'RE_IMPORT')} />
                            <Button size="small" danger icon={<ShopOutlined />} title="Thanh lý" onClick={() => openTransferModal(r, 'LIQUIDATE')} />
                        </>
                    )}

                    {/* KHO THƯỜNG HOẶC ALL: HIỆN NÚT BÁO LỖI (CHỈ CHO PRODUCT) */}
                    {whCode !== 'KHO_LOI' && whCode !== 'KHO_THANH_LY' && r.item_type === 'PRODUCT' && (
                        <Button size="small" type="dashed" danger icon={<AlertOutlined />} title="Báo lỗi (Chuyển sang Kho Lỗi)" onClick={() => openTransferModal(r, 'REPORT_DEFECT')} />
                    )}
                </Space>
            )
        }
    ];

    const historyColumns = [
        { title: 'Thời gian', dataIndex: 'created_at', width: 140, render: (t: any) => <span style={{ fontSize: 12 }}>{dayjs(t).format('DD/MM/YY HH:mm')}</span> },
        { title: 'Kho', dataIndex: 'warehouse', width: 120, render: (w: string) => { const wh = WAREHOUSES.find(x => x.code === w); return <Tag color={wh?.color}>{wh?.name || w}</Tag> } },
        { title: 'GD', dataIndex: 'type', width: 80, render: (t: string) => t === 'IMPORT' ? <span style={{ color: 'green' }}><ArrowDownOutlined /> Nhập</span> : <span style={{ color: 'red' }}><ArrowUpOutlined /> Xuất</span> },
        { title: 'Mã Hàng', dataIndex: 'item_code', width: 120, render: (t: any) => <b>{t}</b> },
        { title: 'SL', dataIndex: 'quantity', align: 'right' as const, width: 80, render: (v: any, r: any) => <b style={{ color: r.type === 'IMPORT' ? 'green' : 'red' }}>{r.type === 'IMPORT' ? '+' : '-'}{Number(v).toLocaleString()}</b> },
        { title: 'Tồn sau', dataIndex: 'balance_after', align: 'right' as const, width: 80, render: (v: any) => Number(v).toLocaleString() },
        { title: 'Ref', dataIndex: 'reference_code', render: (t: any) => <Tag>{t}</Tag> },
        { title: 'Người Cập Nhật', dataIndex: 'updated_by', width: 130, render: (t: any) => t ? <Tag color="blue">{t}</Tag> : '-' },
        { title: 'Note', dataIndex: 'note' }
    ];

    // List item cho Select trong Modal (Chỉ hiện item đúng loại đã chọn)
    const itemList = useMemo(() => {
        if (itemType === 'PRODUCT') return products.map(p => ({ label: `${p.sku} - ${p.name}`, value: p.id }));
        if (itemType === 'MATERIAL') return materials.map(m => ({ label: `${m.code} - ${m.name}`, value: m.id }));
        return [];
    }, [itemType, products, materials]);

    // --- ADMIN RESET ---

    const handleSystemReset = async () => {
        if (resetCode !== 'RESET') return message.error('Mã xác nhận không đúng');
        try {
            await api.post('/inventory/reset');
            message.success('Hệ thống kho đã được Reset về 0');
            setIsResetModalOpen(false);
            setResetCode('');
            fetchData();
        } catch (e) { message.error('Lỗi reset hệ thống'); }
    };

    return (
        <div>
            {/* --- DASHBOARD MINI - HORIZONTAL SCROLL ON MOBILE --- */}
            <div style={{ overflowX: isMobile ? 'auto' : 'visible', marginBottom: 16 }}>
                <Row gutter={[isMobile ? 8 : 16, 8]} wrap={!isMobile} style={{ flexWrap: isMobile ? 'nowrap' : 'wrap', minWidth: isMobile ? 700 : 'auto' }}>
                    {WAREHOUSES.map(wh => {
                        const whData = getDataByWarehouse(wh.code);
                        const totalInWh = whData.reduce((sum, item) => sum + getStockQty(item.item_type, item.id, wh.code), 0);
                        return (
                            <Col flex={isMobile ? '140px' : 1} key={wh.code}>
                                <Card size="small" bodyStyle={{ padding: isMobile ? 8 : 12 }} style={{ borderTop: `3px solid ${wh.color}` }}>
                                    <Statistic
                                        title={<span style={{ fontSize: isMobile ? 11 : 14 }}>{wh.name.split('.')[1] || wh.name}</span>}
                                        value={totalInWh}
                                        valueStyle={{ color: wh.color, fontSize: isMobile ? 16 : 24 }}
                                        prefix={<AppstoreOutlined />}
                                        suffix="đv"
                                    />
                                </Card>
                            </Col>
                        )
                    })}
                </Row>
            </div>

            <Card
                bodyStyle={{ padding: isMobile ? '8px 12px' : undefined }}
                title={<span style={{ fontSize: isMobile ? 14 : 16 }}>Kho Hàng</span>}
                extra={
                    isMobile ? (
                        <Space size={4}>
                            <Input.Search
                                placeholder="Tìm..."
                                onSearch={val => setSearchText(val)}
                                onChange={e => setSearchText(e.target.value)}
                                style={{ width: 120 }}
                                allowClear
                            />
                            <Button icon={<ReloadOutlined />} onClick={fetchData} />
                        </Space>
                    ) : (
                        <Space>
                            <Tag color="gold" style={{ fontSize: 14, padding: '5px 10px' }}>
                                Tổng giá trị: <b>{filteredMasterData.reduce((sum, item) => sum + (Number(item.quantity_in_stock || 0) * Number(item.cost_price || item.cost_per_unit || 0)), 0).toLocaleString()} ₫</b>
                            </Tag>
                            <Divider type="vertical" />
                            <Input.Search
                                placeholder="Tìm tên SP / SKU..."
                                onSearch={val => setSearchText(val)}
                                onChange={e => setSearchText(e.target.value)}
                                style={{ width: 250 }}
                                allowClear
                            />
                            <Checkbox checked={showNegativeOnly} onChange={e => setShowNegativeOnly(e.target.checked)} style={{ marginLeft: 10 }}>
                                <span style={{ color: showNegativeOnly ? 'red' : 'inherit' }}>Chỉ hiện tồn âm</span>
                            </Checkbox>
                            <Divider type="vertical" />
                            <Button type="primary" icon={<SwapOutlined />} onClick={() => { form.resetFields(); setIsModalOpen(true) }}>Điều Chỉnh Kho</Button>
                            <Button icon={<ReloadOutlined />} onClick={fetchData}>Làm mới</Button>
                            <Button type="text" danger icon={<AlertOutlined />} onClick={() => setIsResetModalOpen(true)} title="Admin Reset System" />
                        </Space>
                    )
                }
            >
                <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
                    {/* TAB TỔNG HỢP: HIỆN TẤT CẢ */}
                    <Tabs.TabPane tab={<span><AppstoreOutlined /> Toàn bộ hệ thống</span>} key="ALL_STOCKS">
                        <Table dataSource={filteredMasterData} columns={getStockColumns()} size="small" rowKey="key" pagination={{ pageSize: 10 }} />
                    </Tabs.TabPane>

                    {/* CÁC TAB KHO CON: LỌC THEO LOGIC */}
                    {WAREHOUSES.map(wh => (
                        <Tabs.TabPane tab={<span style={{ color: wh.color }}>{wh.name}</span>} key={wh.code}>
                            <Table
                                dataSource={getDataByWarehouse(wh.code)} // <--- LỌC DỮ LIỆU Ở ĐÂY
                                columns={getStockColumns(wh.code)}
                                size="small"
                                rowKey="key"
                                pagination={{ pageSize: 10 }}
                            />
                        </Tabs.TabPane>
                    ))}

                    {/* TAB LỊCH SỬ */}
                    <Tabs.TabPane tab={<span><HistoryOutlined /> Nhật Ký GD</span>} key="HISTORY">
                        <Table dataSource={history} columns={historyColumns} size="small" rowKey="id" pagination={{ pageSize: 15 }} />
                    </Tabs.TabPane>

                    {/* TAB YÊU CẦU XUẤT KHO (New) */}
                    <Tabs.TabPane tab={<span><ArrowUpOutlined /> Yêu cầu Xuất kho <Badge count={pendingDeliveries.length} offset={[5, 0]} /></span>} key="EXPORT_REQUESTS">
                        <Table
                            dataSource={pendingDeliveries}
                            rowKey="id"
                            size="small"
                            expandable={{
                                expandedRowRender: record => (
                                    <Table
                                        dataSource={record.items}
                                        size="small"
                                        pagination={false}
                                        columns={[
                                            { title: 'SKU', dataIndex: 'sku', render: (t: any) => <b>{t}</b> },
                                            { title: 'Số lượng', dataIndex: 'quantity', render: (v: number) => <b>{Number(v).toLocaleString()}</b> },
                                            {
                                                title: 'Tồn kho thực tế',
                                                render: (_: any, item: any) => {
                                                    const prod = products.find(p => p.sku === item.sku);
                                                    return <b>{prod ? Number(prod.quantity_in_stock || 0).toLocaleString() : '-'}</b>;
                                                }
                                            },
                                            {
                                                title: 'Tồn kho khả dụng',
                                                render: (_: any, item: any) => {
                                                    const prod = products.find(p => p.sku === item.sku);
                                                    const qty = Number(prod?.quantity_in_stock || 0);
                                                    const approved = Number(prod?.approved_booking_stock || 0);
                                                    return <b>{(qty - approved).toLocaleString()}</b>;
                                                }
                                            },
                                            {
                                                title: 'Booking',
                                                render: (_: any, item: any) => {
                                                    const prod = products.find(p => p.sku === item.sku);
                                                    return <b>{prod ? Number(prod.booking_stock || 0).toLocaleString() : '-'}</b>;
                                                }
                                            },
                                            {
                                                title: 'Approve',
                                                render: (_: any, item: any) => {
                                                    const prod = products.find(p => p.sku === item.sku);
                                                    return <b>{prod ? Number(prod.approved_booking_stock || 0).toLocaleString() : '-'}</b>;
                                                }
                                            },
                                            { title: 'Ghi chú', dataIndex: 'note' },
                                        ]}
                                    />
                                )
                            }}
                            columns={[
                                { title: 'Mã PXK', dataIndex: 'code', render: (t: any) => <b>{t}</b> },
                                { title: 'Đơn hàng', render: (r: any) => <Tag color="blue">{r.sales_order?.order_code}</Tag> },
                                { title: 'Khách hàng', render: (r: any) => r.sales_order?.customer?.name || r.sales_order?.customer_name },
                                { title: 'Ngày giao', dataIndex: 'delivery_date', render: (t: any) => dayjs(t).format('DD/MM/YYYY') },
                                { title: 'Ghi chú', dataIndex: 'note' },
                                {
                                    title: 'Thao tác', render: (r: any) => (
                                        <Popconfirm title="Xác nhận đủ hàng và xuất kho?" onConfirm={() => handleConfirmExport(r.id)}>
                                            <Button type="primary" danger size="small" icon={<CheckCircleOutlined />}>Xuất Kho</Button>
                                        </Popconfirm>
                                    )
                                }
                            ]}
                        />
                    </Tabs.TabPane>

                    {/* TAB DANH SÁCH PHIẾU XUẤT KHO ĐÃ HOÀN THÀNH (New) */}
                    <Tabs.TabPane tab={<span><CheckCircleOutlined /> Phiếu Xuất kho</span>} key="COMPLETED_EXPORTS">
                        <Table
                            dataSource={completedDeliveries}
                            rowKey="id"
                            size="small"
                            expandable={{
                                expandedRowRender: record => (
                                    <Table
                                        dataSource={record.items}
                                        size="small"
                                        pagination={false}
                                        columns={[
                                            { title: 'SKU', dataIndex: 'sku', render: (t: any) => <b>{t}</b> },
                                            { title: 'Số lượng', dataIndex: 'quantity', render: (v: number) => <b>{Number(v).toLocaleString()}</b> },
                                            { title: 'Ghi chú', dataIndex: 'note' },
                                        ]}
                                    />
                                )
                            }}
                            columns={[
                                { title: 'Mã PXK', dataIndex: 'code', render: (t: any) => <b>{t}</b> },
                                { title: 'Đơn hàng', render: (r: any) => <Tag color="blue">{r.sales_order?.order_code}</Tag> },
                                { title: 'Khách hàng', render: (r: any) => r.sales_order?.customer?.name || r.sales_order?.customer_name },
                                { title: 'Ngày giao', dataIndex: 'delivery_date', render: (t: any) => dayjs(t).format('DD/MM/YYYY') },
                                { title: 'Trạng thái', dataIndex: 'status', render: () => <Tag color="green">Đã xuất kho</Tag> },
                                { title: 'Ghi chú', dataIndex: 'note' }
                            ]}
                        />
                    </Tabs.TabPane>

                    {/* TAB PHIẾU NHẬP KHO CHỜ DUYỆT */}
                    <Tabs.TabPane tab={<span><InboxOutlined /> Nhập Kho Chờ Duyệt <Badge count={pendingReceipts.length} offset={[5, 0]} /></span>} key="RECEIPTS">
                        <Table
                            dataSource={pendingReceipts}
                            rowKey="id"
                            size="small"
                            expandable={{
                                expandedRowRender: record => (
                                    <Table
                                        dataSource={record.items}
                                        size="small"
                                        pagination={false}
                                        columns={[
                                            { title: 'Vật tư / SP', render: (r: any) => r.material?.name || r.product?.name || '-' },
                                            { title: 'Mã', render: (r: any) => r.material?.code || r.product?.sku || r.product?.code || '-' },
                                            { title: 'Số lượng dự kiến', dataIndex: 'quantity', render: (v: number) => <b>{Number(v).toLocaleString()}</b> },
                                        ]}
                                    />
                                )
                            }}
                            columns={[
                                { title: 'Mã Phiếu', dataIndex: 'code', render: (t: any) => <b>{t}</b> },
                                { title: 'PO Liên Quan', render: (r: any) => r.purchase_order?.po_code || '-' },
                                { title: 'Ngày tạo', dataIndex: 'created_at', render: (t: any) => dayjs(t).format('DD/MM/YY HH:mm') },
                                { title: 'Ghi chú', dataIndex: 'note' },
                                {
                                    title: 'Thao tác', render: (r: any) => (
                                        <Space>
                                            <Button type="primary" size="small" icon={<CheckCircleOutlined />} onClick={() => openConfirmReceiptModal(r)}>Nhập Kho</Button>
                                            <Popconfirm title="Bạn có chắc chắn muốn hủy phiếu nhập này?" onConfirm={() => handleDeleteReceipt(r.id)}>
                                                <Button danger size="small" icon={<DeleteOutlined />}>Hủy</Button>
                                            </Popconfirm>
                                        </Space>
                                    )
                                }
                            ]}
                        />
                    </Tabs.TabPane>

                    {/* TAB ĐƠN VỊ VẬN CHUYỂN */}
                    <Tabs.TabPane tab={<span><CarOutlined /> Đơn vị vận chuyển</span>} key="CARRIERS">
                        <div style={{ marginBottom: 10 }}>
                            <Button type="primary" icon={<PlusOutlined />} onClick={() => openCarrierModal()}>Thêm ĐVVC</Button>
                        </div>
                        <Table
                            dataSource={shippingCarriers}
                            rowKey="id"
                            size="small"
                            columns={[
                                { title: 'Mã', dataIndex: 'code', width: 100, render: (t: any) => <b>{t}</b> },
                                { title: 'Tên đơn vị', dataIndex: 'name' },
                                { title: 'SĐT', dataIndex: 'phone', width: 120 },
                                { title: 'Website', dataIndex: 'website', render: (t: any) => t ? <a href={t} target="_blank" rel="noreferrer">{t}</a> : '-' },
                                { title: 'Trạng thái', dataIndex: 'is_active', width: 100, render: (v: boolean) => v ? <Tag color="green">Hoạt động</Tag> : <Tag color="red">Đã tắt</Tag> },
                                {
                                    title: '', width: 100, render: (_: any, r: any) => (
                                        <Space>
                                            <Button size="small" icon={<EditOutlined />} onClick={() => openCarrierModal(r)} />
                                            <Popconfirm title="Xóa đơn vị này?" onConfirm={() => handleDeleteCarrier(r.id)}>
                                                <Button size="small" danger icon={<DeleteOutlined />} />
                                            </Popconfirm>
                                        </Space>
                                    )
                                }
                            ]}
                        />
                    </Tabs.TabPane>
                </Tabs>
            </Card>

            {/* MODAL ĐIỀU CHỈNH */}
            <Modal title="Phiếu Điều Chỉnh Kho" open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={() => form.submit()} okText="Xác nhận">
                <Form form={form} layout="vertical" onFinish={handleAdjust} initialValues={{ type: 'IMPORT', itemType: 'PRODUCT', warehouse: 'KHO_TP', quantity: 1 }}>

                    <Form.Item name="warehouse" label="Chọn Kho tác động" rules={[{ required: true }]}>
                        <Select>
                            {WAREHOUSES.map(w => <Option key={w.code} value={w.code}>{w.name}</Option>)}
                        </Select>
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="type" label="Hành động">
                                <Radio.Group buttonStyle="solid">
                                    <Radio.Button value="IMPORT">NHẬP (+)</Radio.Button>
                                    <Radio.Button value="EXPORT">XUẤT (-)</Radio.Button>
                                </Radio.Group>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="itemType" label="Loại hàng">
                                <Select><Option value="PRODUCT">Sản phẩm</Option><Option value="MATERIAL">Nguyên liệu</Option></Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="itemId" label="Mã hàng" rules={[{ required: true }]}>
                        <Select showSearch optionFilterProp="label" options={itemList} placeholder="Tìm kiếm..." />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="quantity" label="Số lượng" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
                        <Col span={12}><Form.Item name="ref" label="Mã tham chiếu"><Input placeholder="VD: KK-01" /></Form.Item></Col>
                    </Row>
                    <Form.Item name="note" label="Ghi chú"><Input.TextArea rows={2} /></Form.Item>
                </Form>
            </Modal>

            {/* MODAL RESET ADMIN */}
            <Modal
                title={<span style={{ color: 'red' }}><AlertOutlined /> DANGER ZONE: Reset Inventory</span>}
                open={isResetModalOpen}
                onCancel={() => setIsResetModalOpen(false)}
                onOk={handleSystemReset}
                okText="Xác nhận XÓA HẾT"
                okButtonProps={{ danger: true }}
            >
                <div style={{ background: '#fff1f0', padding: 15, borderRadius: 8, border: '1px solid #ffccc7', marginBottom: 15 }}>
                    <p><b>Cảnh báo:</b> Hành động này sẽ:</p>
                    <ul>
                        <li>Xóa toàn bộ lịch sử giao dịch kho (History).</li>
                        <li>Xóa sạch số lượng tồn kho chi tiết trong các kho (Stocks).</li>
                        <li>Đưa số lượng tồn của TẤT CẢ Sản phẩm và Nguyên liệu về 0.</li>
                    </ul>
                    <p style={{ color: 'red', fontWeight: 'bold' }}>Dữ liệu không thể khôi phục!</p>
                </div>
                <Form layout="vertical">
                    <Form.Item label="Nhập chữ 'RESET' để xác nhận">
                        <Input value={resetCode} onChange={e => setResetCode(e.target.value)} placeholder="RESET" />
                    </Form.Item>
                </Form>
            </Modal>

            {/* MODAL CHUYỂN KHO (TRANSFER) */}
            <Modal
                title={transferTarget?.title}
                open={isTransferModalOpen}
                onCancel={() => setIsTransferModalOpen(false)}
                onOk={handleTransfer}
                okText="Xác nhận Chuyển"
            >
                <Form form={transferForm} layout="vertical">
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Từ Kho">
                                <Input value={WAREHOUSES.find(w => w.code === transferTarget?.fromWh)?.name} disabled style={{ color: 'red', fontWeight: 'bold' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Đến Kho">
                                <Input value={WAREHOUSES.find(w => w.code === transferTarget?.toWh)?.name} disabled style={{ color: 'green', fontWeight: 'bold' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="quantity" label="Số lượng chuyển" rules={[{ required: true }]}>
                                <InputNumber style={{ width: '100%' }} min={1} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="note" label="Ghi chú / Lý do">
                        <Input.TextArea rows={2} placeholder="VD: Hàng bị móp méo / Đã sửa xong..." />
                    </Form.Item>
                </Form>
            </Modal>

            {/* MODAL ĐƠN VỊ VẬN CHUYỂN */}
            <Modal
                title={editingCarrier ? 'Cập nhật ĐVVC' : 'Thêm Đơn vị vận chuyển'}
                open={isCarrierModalOpen}
                onCancel={() => setIsCarrierModalOpen(false)}
                onOk={handleSaveCarrier}
                okText="Lưu"
            >
                <Form form={carrierForm} layout="vertical" initialValues={{ is_active: true }}>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="code" label="Mã" rules={[{ required: true }]}>
                                <Input placeholder="VD: GHTK" />
                            </Form.Item>
                        </Col>
                        <Col span={16}>
                            <Form.Item name="name" label="Tên đơn vị" rules={[{ required: true }]}>
                                <Input placeholder="VD: Giao Hàng Tiết Kiệm" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="phone" label="Số điện thoại">
                                <Input placeholder="Hotline" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="website" label="Website">
                                <Input placeholder="https://..." />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="tracking_url" label="URL tra cứu vận đơn">
                        <Input placeholder="VD: https://ghtk.vn/tracking?code={code}" />
                    </Form.Item>
                    <Form.Item name="is_active" valuePropName="checked">
                        <Checkbox>Đang hoạt động</Checkbox>
                    </Form.Item>
                </Form>
            </Modal>

            {/* MODAL XÁC NHẬN NHẬP KHO */}
            <Modal
                title="Xác nhận nhận hàng & Nhập kho"
                open={isConfirmReceiptModalOpen}
                onCancel={() => setIsConfirmReceiptModalOpen(false)}
                onOk={handleConfirmReceipt}
                okText="Xác nhận Nhập Kho"
                width={800}
            >
                <Form form={confirmReceiptForm} layout="vertical">
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="actual_receive_date" label="Ngày nhận hàng thực tế" rules={[{ required: true }]}>
                                <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="shipping_fee" label="Phí vận chuyển (VND)">
                                <InputNumber
                                    style={{ width: '100%' }}
                                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={value => value?.replace(/\$\s?|(,*)/g, '') as unknown as number}
                                    min={0}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="delivery_note_url" label="Link / URL Phiếu giao hàng (Hoặc ghi chú file)">
                        <Input placeholder="Nhập đường dẫn lưu trữ file hoặc ghi chú..." />
                    </Form.Item>

                    <Divider orientation="left">Chi tiết hàng hóa thực nhận</Divider>
                    {selectedReceipt && (
                        <Table
                            dataSource={selectedReceipt.items}
                            rowKey="id"
                            size="small"
                            pagination={false}
                            columns={[
                                { title: 'Vật tư / SP', render: (r: any) => r.material?.name || r.product?.name || '-' },
                                { title: 'Mã', render: (r: any) => r.material?.code || r.product?.sku || r.product?.code || '-' },
                                { title: 'Số lượng PO (Dự kiến)', dataIndex: 'quantity', align: 'center', render: (v: number) => <Tag color="blue">{Number(v).toLocaleString()}</Tag> },
                                {
                                    title: 'SỐ LƯỢNG THỰC NHẬN',
                                    align: 'center',
                                    render: (r: any) => (
                                        <Form.Item
                                            name={`quantity_${r.id}`}
                                            noStyle
                                            rules={[{ required: true, message: 'Nhập số lượng' }]}
                                        >
                                            <InputNumber min={0} style={{ width: 100 }} />
                                        </Form.Item>
                                    )
                                }
                            ]}
                        />
                    )}
                </Form>
            </Modal>
        </div>
    );
};

export default InventoryPage;