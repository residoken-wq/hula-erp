import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Card, Tabs, Space, Tooltip, Popconfirm, message, Modal, Descriptions, Divider, Input, Statistic, Row, Col, InputNumber, Select, DatePicker, Form } from 'antd';
import { ReloadOutlined, EyeOutlined, DeleteOutlined, SendOutlined, CheckCircleOutlined, ShopOutlined, ScissorOutlined, PrinterOutlined, SearchOutlined, DollarOutlined, CarOutlined, LinkOutlined, ImportOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_URL } from '../config';

const PurchasingPage: React.FC = () => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('ALL');
    const [searchText, setSearchText] = useState('');

    // Detail Modal State
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [currentPO, setCurrentPO] = useState<any>(null);
    const [editingItems, setEditingItems] = useState<any[]>([]);
    const [poDeliveryInfo, setPoDeliveryInfo] = useState<any>({});
    const [packingList, setPackingList] = useState<any[]>([]); // Matrix data
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false); // Print Selection Modal
    const [planProducts, setPlanProducts] = useState<any[]>([]); // Products in related Plan
    const [planSearchText, setPlanSearchText] = useState('');



    // Monitor Modal
    const [isMonitorOpen, setIsMonitorOpen] = useState(false);
    const [monitorMaterials, setMonitorMaterials] = useState<any[]>([]);
    const [deliveryInfo, setDeliveryInfo] = useState<any>({});

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/purchasing`);
            setData(Array.isArray(res.data) ? res.data : []);
        } catch (e) { message.error('Lỗi tải dữ liệu PO'); }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const handleStatusChange = async (id: number, status: string) => {
        try {
            await axios.put(`${API_URL}/purchasing/${id}/status`, { status });
            message.success('Cập nhật trạng thái thành công');
            fetchData();
            if (currentPO && currentPO.id === id) setCurrentPO({ ...currentPO, status });
        } catch (e) { message.error('Lỗi cập nhật'); }
    };

    const handleDelete = async (id: number) => {
        try {
            await axios.delete(`${API_URL}/purchasing/${id}`);
            message.success('Đã xóa PO');
            fetchData();
        } catch (e) { message.error('Lỗi xóa PO'); }
    };

    const viewDetail = async (record: any) => {
        setCurrentPO(record);
        // Clone items for editing
        setEditingItems(record.items ? record.items.map((i: any) => ({ ...i })) : []);
        // Set delivery info
        setPoDeliveryInfo(record.delivery_info || {});
        // Set packing list
        // Set packing list: If empty, auto-generate from Items
        if (record.packing_list_details && record.packing_list_details.length > 0) {
            setPackingList(record.packing_list_details);
        } else {
            // Auto generate rows from unique Materials in PO Items
            const uniqueMaterials = new Map();
            if (record.items) {
                record.items.forEach((item: any) => {
                    // Check if item has material info (name)
                    const matName = item.material?.name || item.reference_name || item.sku;
                    // Group by Material Name to avoid duplicates if split items exist
                    if (!uniqueMaterials.has(matName)) {
                        uniqueMaterials.set(matName, {
                            id: Date.now() + Math.random(),
                            po_form_code: '', // Will be index + 1
                            material_name: matName,
                            n1: '', n2: '', c1: '', c2: '', g1: '', g2: '', odd: '', border: '', note: ''
                        });
                    }
                });
            }
            setPackingList(Array.from(uniqueMaterials.values()));
        }
        setIsDetailOpen(true);

        // Fetch Plan Products
        setPlanProducts([]);
        if (record.items && record.items.length > 0 && record.items[0].plan_id) {
            try {
                const planId = record.items[0].plan_id;
                // Identify target material IDs from PO
                const targetMaterialIds = new Set(record.items.map((i: any) => i.material?.id).filter(Boolean));

                const pRes = await axios.get(`${API_URL}/planning/${planId}`);
                const plan = pRes.data;
                // Extract unique products from sales orders
                const prods = new Map();
                const addProductToMap = (product: any, qty: number) => {
                    // Check if it's a Combo based on type OR components existence
                    const isCombo = product.product_type === 'COMBO' || (product.components && product.components.length > 0);

                    if (isCombo && product.components && product.components.length > 0) {
                        // Is Combo -> Decompose
                        product.components.forEach((comp: any) => {
                            if (comp.child_product) {
                                addProductToMap(comp.child_product, qty * Number(comp.quantity));
                            }
                        });
                    } else {
                        // Standard Product (Leaf node)
                        if (!prods.has(product.sku)) {
                            prods.set(product.sku, {
                                sku: product.sku,
                                name: product.name,
                                quantity: 0,
                                product: product
                            });
                        }
                        const p = prods.get(product.sku);
                        p.quantity += Number(qty);
                    }
                };

                if (plan && plan.sales_orders) {
                    plan.sales_orders.forEach((so: any) => {
                        so.items?.forEach((item: any) => {
                            if (item.product) {
                                addProductToMap(item.product, Number(item.quantity));
                            } else {
                                // Fallback
                                if (!prods.has(item.sku)) prods.set(item.sku, { sku: item.sku, name: item.product_name, quantity: 0 });
                                prods.get(item.sku).quantity += Number(item.quantity);
                            }
                        });
                    });
                }

                // Calculate Norms for each aggregated product
                const finalProducts = Array.from(prods.values()).map((p: any) => {
                    let unitNorm = 0;
                    // Use BOMs to find Material Usage
                    if (p.product && p.product.boms) {
                        p.product.boms.forEach((bom: any) => {
                            if (bom.material && targetMaterialIds.has(bom.material.id)) {
                                unitNorm += Number(bom.quantity || 0);
                            }
                        });
                    }
                    return {
                        ...p,
                        unit_norm: unitNorm > 0 ? unitNorm : 0,
                        total_norm: (unitNorm > 0 ? unitNorm : 0) * p.quantity
                    };
                });

                setPlanProducts(finalProducts);
            } catch (e) { console.error('Error fetching plan', e); }
        }
    };

    // --- LOGIC MONITORING ---
    const openMonitorModal = async (record: any) => {
        setCurrentPO(record);
        setDeliveryInfo(record.outsourcing_delivery_info || { status: 'PENDING' });
        try {
            const res = await axios.get(`${API_URL}/purchasing/${record.id}/outsourcing-materials`);
            setMonitorMaterials(res.data);
            setIsMonitorOpen(true);
        } catch (e) { message.error('Lỗi tải thông tin NPL'); }
    };

    const handleSaveDeliveryInfo = async () => {
        try {
            await axios.put(`${API_URL}/purchasing/${currentPO.id}`, { outsourcing_delivery_info: deliveryInfo });
            message.success('Đã cập nhật thông tin');
            setIsMonitorOpen(false); fetchData();
        } catch (e) { message.error('Lỗi lưu'); }
    };


    // ----------------------------------------

    const columns = [
        { title: 'Mã PO', dataIndex: 'po_code', render: (t: any, r: any) => <a onClick={() => viewDetail(r)}><b>{t}</b></a> },
        { title: 'Loại', dataIndex: 'type', align: 'center' as const, width: 100, render: (t: string) => t === 'MATERIAL' ? <Tag color="blue">NPL</Tag> : <Tag color="orange">Gia công</Tag> },
        { title: 'Ngày', dataIndex: 'created_at', render: (t: any) => dayjs(t).format('DD/MM/YYYY') },
        { title: 'Đối tác', dataIndex: 'supplier', render: (s: any, r: any) => s?.name || (r.note?.split('NCC: ')[1] || '-') },
        { title: 'Tổng tiền', dataIndex: 'total_amount', align: 'right' as const, render: (v: number) => <b>{Number(v).toLocaleString()}</b> },
        { title: 'Trạng thái', dataIndex: 'status', align: 'center' as const, render: (t: string) => <Tag color={t === 'COMPLETED' ? 'green' : t === 'SENT' ? 'blue' : 'default'}>{t}</Tag> },
        {
            title: '', key: 'act', align: 'right' as const,
            render: (r: any) => (
                <Space>
                    {r.type === 'OUTSOURCING' && (<Tooltip title="Theo dõi NPL"><Button size="small" style={{ color: '#fa8c16', borderColor: '#fa8c16' }} icon={<CarOutlined />} onClick={() => openMonitorModal(r)} /></Tooltip>)}
                    <Tooltip title="Xem"><Button size="small" icon={<EyeOutlined />} onClick={() => viewDetail(r)} /></Tooltip>
                    {r.status === 'DRAFT' && (<Popconfirm title="Xóa?" onConfirm={() => handleDelete(r.id)}><Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm>)}
                </Space>
            )
        }
    ];

    const filteredData = data.filter((d: any) => {
        return (activeTab === 'ALL' || d.type === activeTab) && d.po_code?.toLowerCase().includes(searchText.toLowerCase());
    });

    // --- LOGIC REQUIREMENT (PO GỘP) ---
    const [requirements, setRequirements] = useState<any[]>([]);
    const [selectedReqs, setSelectedReqs] = useState<any[]>([]);

    const fetchRequirements = async () => {
        try {
            const res = await axios.get(`${API_URL}/purchasing/requirements`);
            setRequirements(res.data);
        } catch (e) { message.error('Lỗi tải nhu cầu'); }
    };

    useEffect(() => {
        if (activeTab === 'REQ') fetchRequirements();
    }, [activeTab]);

    const handleCreatePooledPO = async () => {
        if (selectedReqs.length === 0) return message.warning('Chọn ít nhất 1 dòng');

        // Check if all selected items (with supplier_name) have the same supplier
        // Note: `supplier_name` is essentially descriptive here, but we need `supplier_id`.
        // The backend `getPendingRequirements` returns string supplier_name.
        // We might need strict validation or just allow user to pick a supplier?

        // For simplicity: Group by Supplier Name, if multiple, warn
        const suppliers = [...new Set(selectedReqs.map(r => r.supplier_name).filter(Boolean))];
        if (suppliers.length > 1) {
            Modal.confirm({
                title: 'Cảnh báo đa nhà cung cấp',
                content: `Bạn đang chọn vật tư của nhiều NCC: ${suppliers.join(', ')}. Hệ thống sẽ tạo PO tạm chưa gán NCC hoặc bạn cần tách ra. Tiếp tục?`,
                onOk: () => proceedCreatePooled(null) // Null supplier logic
            });
        } else {
            // Try to find supplier ID? Actually we don't have ID in requirement list, only name.
            // So we prompt user to SELECT Supplier for this PO.
            setIsSelectSupplierOpen(true);
        }
    };

    // Auxiliary state for selecting supplier
    const [isSelectSupplierOpen, setIsSelectSupplierOpen] = useState(false);
    const [targetSupplierId, setTargetSupplierId] = useState<number | null>(null);
    const [suppliers, setSuppliers] = useState<any[]>([]);

    useEffect(() => {
        axios.get(`${API_URL}/suppliers`).then(res => setSuppliers(res.data));
    }, []);

    const proceedCreatePooled = async (supId: number | null) => {
        try {
            await axios.post(`${API_URL}/purchasing/create-pooled`, {
                supplier_id: supId,
                items: selectedReqs.map(r => ({
                    material_id: r.material_id,
                    quantity: r.remaining_qty, // Mua số lượng còn thiếu
                    unit_price: r.reference_price,
                    plan_id: r.plan_id // Quan Trọng
                }))
            });
            message.success('Tạo PO gộp thành công!');
            setIsSelectSupplierOpen(false);
            setSelectedReqs([]);
            fetchRequirements(); // Refresh list
        } catch (e) { message.error('Lỗi tạo PO'); }
    }

    const handleSavePOChanges = async () => {
        try {
            await axios.put(`${API_URL}/purchasing/${currentPO.id}`, {
                items: editingItems,
                delivery_info: poDeliveryInfo,
                packing_list_details: packingList,
                supplier_id: currentPO.supplier?.id // Include Supplier ID
            });
            message.success('Đã lưu thay đổi PO');
            fetchData(); // Refresh global list
            // Update local currentPO to reflect changes safely
            const updatedPO = { ...currentPO, items: editingItems, delivery_info: poDeliveryInfo, packing_list_details: packingList };
            // Recalc total
            const newTotal = editingItems.reduce((acc, i) => acc + (i.subtotal || 0), 0);
            updatedPO.total_amount = newTotal;
            setCurrentPO(updatedPO);
        } catch (e) { message.error('Lỗi lưu PO'); }
    };

    const handleCreateReceipt = async () => {
        if (!currentPO) return;
        try {
            await axios.post(`${API_URL}/inventory/goods-receipt/draft`, {
                po_id: currentPO.id,
                items: currentPO.items.map((i: any) => ({
                    po_item_id: i.id,
                    material_id: i.material?.id,
                    quantity: i.quantity
                })),
                note: `Nhập kho từ PO ${currentPO.po_code}`
            });
            message.success('Đã tạo phiếu nhập kho nháp');
            setIsDetailOpen(false);
        } catch (error) {
            message.error('Lỗi tạo phiếu nhập kho');
        }
    };

    const handlePrint = (template: string) => {
        const w = window.open('', '_blank');
        if (!w) return;

        let content = '';
        const dateStr = dayjs().format('DD/MM/YYYY');
        const poCode = currentPO?.po_code || 'PO-XXXX';
        const supplierName = currentPO?.supplier?.name || '';

        // CSS Common
        const style = `
            <style>
                body { font-family: 'Times New Roman', serif; padding: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #000; padding: 5px; text-align: center; }
                .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
                .title { text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 20px; }
                .left-align { text-align: left; }
                .bold { font-weight: bold; }
                @media print { .no-print { display: none; } }
            </style>
        `;

        if (template === 'STANDARD') {
            const rows = currentPO?.items?.map((i: any, idx: number) => `
                <tr>
                    <td>${idx + 1}</td>
                    <td class="left-align">${i.description}</td>
                    <td>${Number(i.quantity).toLocaleString()}</td>
                    <td>${Number(i.unit_price).toLocaleString()}</td>
                    <td>${Number(i.subtotal).toLocaleString()}</td>
                </tr>
            `).join('');

            content = `
                ${style}
                <div class="header">
                    <div><b>Date:</b> ${dateStr}</div>
                    <div><b>PO No:</b> ${poCode}</div>
                </div>
                <div class="title">PURCHASE ORDER</div>
                <p><b>Supplier:</b> ${supplierName}</p>
                <table>
                    <thead>
                        <tr>
                            <th>STT</th>
                            <th>Description</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                    <tfoot>
                        <tr>
                            <td colspan="4" style="text-align:right; font-weight:bold;">Total</td>
                            <td style="font-weight:bold;">${Number(currentPO?.total_amount).toLocaleString()}</td>
                        </tr>
                    </tfoot>
                </table>
            `;
        } else if (template === 'CARA' || template === 'HQ') {
            const list = packingList.length > 0 ? packingList : [{ po_form_code: '', material_name: '' }];
            const rows = list.map((r: any, idx: number) => `
                <tr>
                    <td>${idx + 1}</td>
                    <td class="left-align">${r.po_form_code || ''}</td>
                    <td class="left-align">${r.material_name || ''}</td>
                    <td>${r.n1 || '-'}</td>
                    <td>${r.n2 || '-'}</td>
                    <td>${r.c1 || '-'}</td>
                    <td>${r.c2 || '-'}</td>
                    <td>${r.g1 || '-'}</td>
                    <td>${r.g2 || '-'}</td>
                    <td>${r.odd || '-'}</td>
                    <td>${r.border || '-'}</td>
                    <td>${r.note || ''}</td>
                </tr>
            `).join('');

            content = `
                ${style}
                <style>th { background-color: #f0f0f0; }</style>
                <div class="header">
                    <div><b>Ngày:</b> ${dateStr}</div>
                    <div><b>Mã PO:</b> ${poCode}</div>
                </div>
                <div class="title">ĐƠN ĐẶT HÀNG</div>
                 <table>
                    <thead>
                        <tr>
                            <th rowspan="2">STT</th>
                            <th rowspan="2">Mã PO Form</th>
                            <th rowspan="2">Mã Vải / Tên NPL</th>
                            <th colspan="2">N</th>
                            <th colspan="2">C</th>
                            <th colspan="2">G</th>
                            <th rowspan="2">Kiện lẻ</th>
                            <th rowspan="2">Kiện viền</th>
                            <th rowspan="2">Ghi chú</th>
                        </tr>
                        <tr>
                            <th>N1</th><th>N2</th><th>C1</th><th>C2</th><th>G1</th><th>G2</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            `;
        }

        w.document.write(`<html><head><title>Print PO ${poCode}</title></head><body>${content}</body></html>`);
        w.document.close();
        w.focus();
        setTimeout(() => w.print(), 500);
    };

    // ----------------------------------

    return (
        <div>
            <Card title="Quản Lý Mua Hàng & Gia Công" extra={<Space>
                {activeTab === 'REQ' && <Button type="primary" onClick={handleCreatePooledPO} disabled={selectedReqs.length === 0}>+ Tạo PO Gộp ({selectedReqs.length})</Button>}
                <Input prefix={<SearchOutlined />} placeholder="Tìm PO..." value={searchText} onChange={e => setSearchText(e.target.value)} style={{ width: 200 }} allowClear />
                <Button icon={<ReloadOutlined />} onClick={() => activeTab === 'REQ' ? fetchRequirements() : fetchData()}>Làm mới</Button>
            </Space>}>
                <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
                    { key: 'ALL', label: 'Tất cả PO' },
                    { key: 'MATERIAL', label: 'Mua NPL' },
                    { key: 'OUTSOURCING', label: 'Gia Công' },
                    { key: 'REQ', label: 'Tổng Hợp Nhu Cầu (Mới)' } // --- NEW TAB ---
                ]} />

                {activeTab === 'REQ' ? (
                    <Table
                        dataSource={requirements}
                        rowKey={(r) => `${r.plan_id}_${r.material_id}`}
                        rowSelection={{
                            type: 'checkbox',
                            onChange: (_, rows) => setSelectedReqs(rows)
                        }}
                        columns={[
                            { title: 'Kế Hoạch', dataIndex: 'plan_code', render: t => <b>{t}</b> },
                            { title: 'Mã NPL', dataIndex: 'material_code' },
                            { title: 'Tên NPL', dataIndex: 'material_name' },
                            { title: 'ĐV', dataIndex: 'unit' },
                            { title: 'Cần mua', dataIndex: 'remaining_qty', render: v => <b style={{ color: 'red' }}>{Number(v).toLocaleString()}</b> },
                            { title: 'NCC Gợi ý', dataIndex: 'supplier_name' },
                            { title: 'Đơn giá', dataIndex: 'reference_price', align: 'right', render: v => Number(v).toLocaleString() }
                        ]}
                    />
                ) : (
                    <Table dataSource={filteredData} columns={columns} rowKey="id" loading={loading} />
                )}
            </Card>

            <Modal title="Chọn Nhà Cung Cấp cho PO" open={isSelectSupplierOpen} onCancel={() => setIsSelectSupplierOpen(false)} onOk={() => proceedCreatePooled(targetSupplierId)}>
                <p>Bạn đang tạo PO gộp cho {selectedReqs.length} vật tư. Vui lòng chọn NCC:</p>
                <Select
                    style={{ width: '100%' }}
                    placeholder="Chọn NCC..."
                    showSearch optionFilterProp="label"
                    onChange={v => setTargetSupplierId(v)}
                    options={suppliers.map(s => ({ label: s.name, value: s.id }))}
                />
            </Modal>

            {/* MODAL DETAIL */}
            <Modal
                title={`Chi tiết: ${currentPO?.po_code}`}
                open={isDetailOpen}
                onCancel={() => setIsDetailOpen(false)}
                width={1200}
                style={{ top: 20 }}
                footer={[
                    <Button key="print" icon={<PrinterOutlined />} onClick={() => setIsPrintModalOpen(true)}>In PO</Button>,
                    <Button key="receipt" icon={<ImportOutlined />} type="dashed" onClick={handleCreateReceipt}>Tạo Phiếu Kho</Button>,
                    <Button key="save" type="primary" onClick={handleSavePOChanges}>Lưu Thay Đổi</Button>,
                    <Button key="close" onClick={() => setIsDetailOpen(false)}>Đóng</Button>
                ]}
            >
                <Descriptions size="small" bordered column={2} style={{ marginBottom: 16 }}>
                    <Descriptions.Item label="NCC">
                        <Select
                            showSearch
                            style={{ width: 250 }}
                            value={currentPO?.supplier?.id}
                            onChange={(id) => setCurrentPO({ ...currentPO, supplier: { ...currentPO.supplier, id: id, name: suppliers.find(s => s.id === id)?.name } })}
                            options={suppliers.map((s: any) => ({ label: s.name, value: s.id }))}
                            optionFilterProp="label"
                        />
                    </Descriptions.Item>
                    <Descriptions.Item label="Tổng tiền"><b style={{ fontSize: 16 }}>{Number(currentPO?.total_amount).toLocaleString()} ₫</b></Descriptions.Item>
                    <Descriptions.Item label="Đã trả" contentStyle={{ color: 'green', fontWeight: 'bold' }}>{Number(currentPO?.paid_amount).toLocaleString()} ₫</Descriptions.Item>
                    <Descriptions.Item label="Còn lại" contentStyle={{ color: 'red' }}>{Number((currentPO?.total_amount || 0) - (currentPO?.paid_amount || 0)).toLocaleString()} ₫</Descriptions.Item>
                </Descriptions>

                <Tabs defaultActiveKey="1" items={[
                    {
                        key: '1', label: 'Chi tiết Đơn hàng', children: (
                            <Table
                                dataSource={editingItems}
                                rowKey="id"
                                pagination={false}
                                size="small"
                                columns={[
                                    { title: 'Tên hàng', dataIndex: 'description' },
                                    { title: 'SL (ĐM)', render: (r: any) => <span>{Number(r.quantity).toLocaleString()} {r.material?.unit}</span> },
                                    {
                                        title: 'SL (QĐ)', width: 150, render: (r: any, _: any, index: number) => {
                                            if (!r.material) return '-';
                                            const factor = Number(r.material.conversion_factor || 1);
                                            const val = r.quantity / factor;
                                            return <InputNumber
                                                value={val}
                                                min={0}
                                                style={{ width: '100%' }}
                                                onChange={(v) => {
                                                    const newQ = Number(v) * factor;
                                                    const newItems = [...editingItems];
                                                    newItems[index].quantity = newQ;
                                                    newItems[index].subtotal = newQ * Number(newItems[index].unit_price);
                                                    setEditingItems(newItems);
                                                }}
                                                addonAfter={r.material.purchase_unit}
                                            />
                                        }
                                    },
                                    {
                                        title: 'Đơn giá', width: 150, render: (r: any, _: any, index: number) => (
                                            <InputNumber
                                                value={r.unit_price}
                                                min={0}
                                                style={{ width: '100%' }}
                                                formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                onChange={(v) => {
                                                    const newItems = [...editingItems];
                                                    newItems[index].unit_price = Number(v);
                                                    newItems[index].subtotal = Number(newItems[index].quantity) * Number(v);
                                                    setEditingItems(newItems);
                                                }}
                                            />
                                        )
                                    },
                                    { title: 'Thành tiền', render: (r: any) => <b>{Number(r.subtotal).toLocaleString()}</b> }
                                ]}
                            />
                        )
                    },
                    {
                        key: '2', label: 'Thông tin Giao hàng', children: (
                            <Form layout="vertical">
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item label="Ngày giao hàng dự kiến">
                                            <DatePicker
                                                style={{ width: '100%' }}
                                                value={poDeliveryInfo.delivery_date ? dayjs(poDeliveryInfo.delivery_date) : null}
                                                onChange={(d) => setPoDeliveryInfo({ ...poDeliveryInfo, delivery_date: d })}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item label="Người liên hệ">
                                            <Input
                                                value={poDeliveryInfo.contact_person}
                                                onChange={(e) => setPoDeliveryInfo({ ...poDeliveryInfo, contact_person: e.target.value })}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item label="SĐT Liên hệ">
                                            <Input
                                                value={poDeliveryInfo.contact_phone}
                                                onChange={(e) => setPoDeliveryInfo({ ...poDeliveryInfo, contact_phone: e.target.value })}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item label="Phương thức vận chuyển">
                                            <Select
                                                value={poDeliveryInfo.delivery_method}
                                                onChange={(v) => setPoDeliveryInfo({ ...poDeliveryInfo, delivery_method: v })}
                                                options={[{ value: 'Giao tận nơi', label: 'Giao tận nơi' }, { value: 'Lấy tại kho', label: 'Lấy tại kho' }]}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item label="Địa chỉ giao hàng">
                                            <Input
                                                value={poDeliveryInfo.delivery_address}
                                                onChange={(e) => setPoDeliveryInfo({ ...poDeliveryInfo, delivery_address: e.target.value })}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item label="Ghi chú đóng gói">
                                            <Input.TextArea
                                                rows={3}
                                                value={poDeliveryInfo.packing_note}
                                                onChange={(e) => setPoDeliveryInfo({ ...poDeliveryInfo, packing_note: e.target.value })}
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Form>
                        )
                    },
                    // Only show Packing Matrix for MATERIAL POs
                    ...(currentPO?.po_type !== 'OUTSOURCING' ? [{
                        key: '3', label: 'Chi tiết Đóng gói (Matrix)', children: (
                            <div>
                                <div style={{ marginBottom: 10 }}>
                                    <span style={{ marginLeft: 10, color: '#888' }}>Thông tin đóng gói được tạo tự động từ danh sách NPL</span>
                                </div>
                                <Table
                                    dataSource={packingList}
                                    rowKey="id"
                                    pagination={false}
                                    size="small"
                                    scroll={{ x: 1200 }}
                                    columns={[
                                        {
                                            title: 'Mã PO Form', width: 100, align: 'center', render: (t, r, idx) => <b>{idx + 1}</b>
                                        },
                                        {
                                            title: 'Tên NPL', width: 250, render: (t, r, idx) => <span>{r.material_name}</span>
                                        },
                                        {
                                            title: 'Tổng SL', width: 100, align: 'right', render: (t, r, idx) => {
                                                // Find matching item in PO items to get quantity
                                                const matchingItem = currentPO?.items?.find((i: any) => (i.material?.name || i.reference_name || i.sku) === r.material_name);
                                                return <b>{matchingItem ? Number(matchingItem.quantity).toLocaleString() : '-'}</b>;
                                            }
                                        },
                                        {
                                            title: 'N1', width: 60, render: (t, r, idx) => <Input value={r.n1} onChange={e => {
                                                const list = [...packingList]; list[idx].n1 = e.target.value; setPackingList(list);
                                            }} />
                                        },
                                        {
                                            title: 'N2', width: 60, render: (t, r, idx) => <Input value={r.n2} onChange={e => {
                                                const list = [...packingList]; list[idx].n2 = e.target.value; setPackingList(list);
                                            }} />
                                        },
                                        {
                                            title: 'C1', width: 60, render: (t, r, idx) => <Input value={r.c1} onChange={e => {
                                                const list = [...packingList]; list[idx].c1 = e.target.value; setPackingList(list);
                                            }} />
                                        },
                                        {
                                            title: 'C2', width: 60, render: (t, r, idx) => <Input value={r.c2} onChange={e => {
                                                const list = [...packingList]; list[idx].c2 = e.target.value; setPackingList(list);
                                            }} />
                                        },
                                        {
                                            title: 'G1', width: 60, render: (t, r, idx) => <Input value={r.g1} onChange={e => {
                                                const list = [...packingList]; list[idx].g1 = e.target.value; setPackingList(list);
                                            }} />
                                        },
                                        {
                                            title: 'G2', width: 60, render: (t, r, idx) => <Input value={r.g2} onChange={e => {
                                                const list = [...packingList]; list[idx].g2 = e.target.value; setPackingList(list);
                                            }} />
                                        },
                                        {
                                            title: 'Kiện lẻ', width: 80, render: (t, r, idx) => <Input value={r.odd} onChange={e => {
                                                const list = [...packingList]; list[idx].odd = e.target.value; setPackingList(list);
                                            }} />
                                        },
                                        {
                                            title: 'Kiện viền', width: 80, render: (t, r, idx) => <Input value={r.border} onChange={e => {
                                                const list = [...packingList]; list[idx].border = e.target.value; setPackingList(list);
                                            }} />
                                        },
                                        {
                                            title: 'Tổng Nhập', width: 80, render: (t, r) => {
                                                const total =
                                                    Number(r.n1 || 0) + Number(r.n2 || 0) +
                                                    Number(r.c1 || 0) + Number(r.c2 || 0) +
                                                    Number(r.g1 || 0) + Number(r.g2 || 0) +
                                                    Number(r.odd || 0) + Number(r.border || 0);
                                                return <b>{total}</b>;
                                            }
                                        },
                                        {
                                            title: 'Ghi chú', render: (t, r, idx) => <Input value={r.note} onChange={e => {
                                                const list = [...packingList]; list[idx].note = e.target.value; setPackingList(list);
                                            }} />
                                        },
                                        {
                                            title: '', width: 40, fixed: 'right' as const, render: (t, r, idx) => <Button danger icon={<DeleteOutlined />} size="small" type="text" onClick={() => {
                                                const list = [...packingList]; list.splice(idx, 1); setPackingList(list);
                                            }} />
                                        }
                                    ]}
                                />

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                    <b>Thông tin Sản phẩm trong Kế hoạch</b>
                                    <Input
                                        placeholder="Tìm kiếm sản phẩm (Tên, SKU)"
                                        style={{ width: 300 }}
                                        allowClear
                                        prefix={<SearchOutlined />}
                                        value={planSearchText}
                                        onChange={e => setPlanSearchText(e.target.value)}
                                    />
                                </div>
                                <Table
                                    dataSource={planProducts.filter(p => !planSearchText ||
                                        p.sku.toLowerCase().includes(planSearchText.toLowerCase()) ||
                                        p.name.toLowerCase().includes(planSearchText.toLowerCase())
                                    )}
                                    rowKey="sku"
                                    size="small"
                                    pagination={{ pageSize: 10 }}
                                    columns={[
                                        { title: 'SKU', dataIndex: 'sku', width: 150 },
                                        { title: 'Tên sản phẩm', dataIndex: 'name' },
                                        { title: 'ĐM (Cái)', dataIndex: 'unit_norm', width: 100, align: 'right', render: v => v ? Number(v).toLocaleString() : '-' },
                                        { title: 'Tổng ĐM', dataIndex: 'total_norm', width: 100, align: 'right', render: v => v ? Number(v).toLocaleString() : '-' },
                                        { title: 'Tổng SL', dataIndex: 'quantity', width: 100, align: 'right', render: v => Number(v).toLocaleString() }
                                    ]}
                                />
                            </div>
                        )
                    }] : [])
                ]}
                />
            </Modal>


            {/* MODAL PRINT SELECTION */}
            <Modal title="Chọn Mẫu In PO" open={isPrintModalOpen} onCancel={() => setIsPrintModalOpen(false)} footer={null}>
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Button block onClick={() => handlePrint('STANDARD')}>Mẫu Tiêu Chuẩn (Đơn hàng)</Button>
                    <Button block onClick={() => handlePrint('CARA')}>Mẫu Đóng Gói (Cara Style)</Button>
                    <Button block onClick={() => handlePrint('HQ')}>Mẫu Đóng Gói (HQ Style)</Button>
                </Space>
            </Modal>
        </div>
    );
};

export default PurchasingPage;