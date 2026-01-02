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

    const [packingList, setPackingList] = useState<any[]>([]); // Matrix data
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false); // Print Selection Modal
    const [planProducts, setPlanProducts] = useState<any[]>([]); // Products in related Plan
    const [planSearchText, setPlanSearchText] = useState('');

    // Delivery Matrix State
    const [deliveryMatrix, setDeliveryMatrix] = useState<any[]>([]);
    const [isDeliveryLoading, setIsDeliveryLoading] = useState(false);



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
        try {
            // FIX: Gọi API để lấy data enriched thay vì dùng record từ list
            const res = await axios.get(`${API_URL}/purchasing/${record.id}`);
            const poDetail = res.data;

            setCurrentPO(poDetail);
            // Clone items for editing
            setEditingItems(poDetail.items ? poDetail.items.map((i: any) => ({ ...i })) : []);

            // Set packing list: If empty, auto-generate from Items
            if (poDetail.packing_list_details && poDetail.packing_list_details.length > 0) {
                setPackingList(poDetail.packing_list_details);
            } else {
                // Auto generate rows from unique Materials in PO Items
                const uniqueMaterials = new Map();
                if (poDetail.items) {
                    poDetail.items.forEach((item: any) => {
                        const matName = item.material?.name || item.reference_name || item.sku;
                        if (!uniqueMaterials.has(matName)) {
                            uniqueMaterials.set(matName, {
                                id: Date.now() + Math.random(),
                                po_form_code: '',
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
            if (poDetail.items && poDetail.items.length > 0 && poDetail.items[0].plan_id) {
                const planId = poDetail.items[0].plan_id;
                // Identify target material IDs from PO
                const targetMaterialIds = new Set(poDetail.items.map((i: any) => i.material?.id).filter(Boolean));

                try {
                    const pRes = await axios.get(`${API_URL}/planning/${planId}`);
                    const plan = pRes.data;
                    // Extract unique products from sales orders
                    const prods = new Map();
                    const addProductToMap = (product: any, qty: number) => {
                        const isCombo = product.product_type === 'COMBO' || (product.components && product.components.length > 0);

                        if (isCombo && product.components && product.components.length > 0) {
                            product.components.forEach((comp: any) => {
                                if (comp.child_product) {
                                    addProductToMap(comp.child_product, qty * Number(comp.quantity));
                                }
                            });
                        } else {
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
                                    if (!prods.has(item.sku)) prods.set(item.sku, { sku: item.sku, name: item.product_name, quantity: 0 });
                                    prods.get(item.sku).quantity += Number(item.quantity);
                                }
                            });
                        });
                    }

                    // Calculate Norms for each aggregated product
                    const finalProducts = Array.from(prods.values()).map((p: any) => {
                        let unitNorm = 0;
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

            // Fetch Delivery Matrix Progress
            fetchDeliveryMatrix(poDetail.id);
        } catch (e) {
            message.error('Lỗi tải chi tiết PO');
            console.error('Error fetching PO detail', e);
        }
    };

    const fetchDeliveryMatrix = async (poId: number) => {
        setIsDeliveryLoading(true);
        try {
            // Fetch PO with Items and their GoodsReceiptItems
            // Since we don't have a direct endpoint for matrix progress, we calculate it 
            // by fetching all GoodsReceipts for this PO AND the PO's Packing List.
            // Simplified: We assume we can get receipts. 
            // Better: Endpoint `GET /purchasing/:id/delivery-progress` (Mocking logic here for now or assuming we fetch receipts)

            const res = await axios.get(`${API_URL}/inventory/goods-receipt/po/${poId}`);
            const receipts = res.data; // List of receipts with items

            // We need to aggregate received quantities per Matrix Row (identified by material_name or po_form_code)
            // But GoodsReceiptItems currently store `packing_data` (Newly added).

            // Re-use current PO's packing list as base
            /* 
               Logic: 
               1. Get `packing_list_details` from PO (this is the PLAN).
               2. Iterate all Receipts -> Items -> packing_data.
               3. Sum up N1, N2... for each matching Material/Row.
            */
        } catch (e) { console.error('Error fetching delivery', e); }
        setIsDeliveryLoading(false);
    };

    const handleCreateMatrixReceipt = async () => {
        if (!currentPO) return;
        // Filter rows that have input
        const validRows = packingList.filter(r =>
            Number(r.n1_input || 0) > 0 || Number(r.n2_input || 0) > 0 ||
            Number(r.c1_input || 0) > 0 || Number(r.c2_input || 0) > 0 ||
            Number(r.g1_input || 0) > 0 || Number(r.g2_input || 0) > 0 ||
            Number(r.odd_input || 0) > 0 || Number(r.border_input || 0) > 0
        );

        if (validRows.length === 0) return message.warning('Vui lòng nhập số lượng thực nhận vào cột "Giao"');

        try {
            await axios.post(`${API_URL}/inventory/goods-receipt/draft`, {
                po_id: currentPO.id,
                items: validRows.map(r => {
                    // Find matching PO Item ID
                    const poItem = currentPO.items?.find((i: any) => (i.material?.name || i.reference_name || i.sku) === r.material_name);
                    const totalQty =
                        Number(r.n1_input || 0) + Number(r.n2_input || 0) +
                        Number(r.c1_input || 0) + Number(r.c2_input || 0) +
                        Number(r.g1_input || 0) + Number(r.g2_input || 0) +
                        Number(r.odd_input || 0) + Number(r.border_input || 0);

                    return {
                        po_item_id: poItem?.id, // Might be undefined if name mismatch, assume matching
                        material_id: poItem?.material?.id,
                        quantity: totalQty,
                        packing_data: {
                            n1: Number(r.n1_input || 0), n2: Number(r.n2_input || 0),
                            c1: Number(r.c1_input || 0), c2: Number(r.c2_input || 0),
                            g1: Number(r.g1_input || 0), g2: Number(r.g2_input || 0),
                            odd: Number(r.odd_input || 0), border: Number(r.border_input || 0)
                        }
                    };
                }),
                note: `Nhập kho (Matrix) từ PO ${currentPO.po_code}`
            });
            message.success('Đã tạo phiếu nhập kho (Draft)');
            // Clear inputs or Refresh
            fetchDeliveryMatrix(currentPO.id);
        } catch (e) { message.error('Lỗi tạo phiếu nhập: ' + e); }
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
        { title: 'Mã KH', dataIndex: 'plan', render: (p: any) => p?.code || '-' },
        { title: 'Tên Plan', dataIndex: 'plan', render: (p: any) => p?.name || '-' },
        { title: 'Loại', dataIndex: 'type', align: 'center' as const, width: 100, render: (t: string) => t === 'MATERIAL' ? <Tag color="blue">NPL</Tag> : <Tag color="orange">Gia công</Tag> },
        { title: 'Ngày', dataIndex: 'created_at', render: (t: any) => dayjs(t).format('DD/MM/YYYY') },
        { title: 'Đối tác', dataIndex: 'supplier', render: (s: any, r: any) => s?.name || (r.note?.split('NCC: ')[1] || '-') },
        { title: 'Tổng tiền', dataIndex: 'total_amount', align: 'right' as const, render: (v: number) => <b>{Number(v).toLocaleString()}</b> },
        { title: 'Trạng thái', dataIndex: 'status', align: 'center' as const, render: (t: string) => <Tag color={t === 'COMPLETED' ? 'green' : t === 'DELIVERED' ? 'cyan' : t === 'SENT' ? 'blue' : 'default'}>{t === 'DELIVERED' ? 'Đã giao đủ' : t}</Tag> },
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
            // Lấy danh sách PO_NPL có thể gộp (chưa có parent_po_id)
            const type = activeTab === 'REQ_GC' ? 'OUTSOURCING' : 'MATERIAL';
            const res = await axios.get(`${API_URL}/purchasing/available-for-pooling?type=${type}`);
            setRequirements(res.data);
        } catch (e) { message.error('Lỗi tải danh sách PO'); }
    };

    useEffect(() => {
        if (activeTab.startsWith('REQ')) fetchRequirements();
    }, [activeTab]);

    const handleCreatePooledPO = async () => {
        if (selectedReqs.length === 0) return message.warning('Chọn ít nhất 1 PO');
        // Check types
        const types = new Set(selectedReqs.map(r => r.type));
        if (types.size > 1) return message.error('Không thể gộp NPL và Gia công chung 1 đơn');

        // Check vendors (Optional warning)
        const suppliers = [...new Set(selectedReqs.map(r => r.supplier?.name).filter(Boolean))];
        if (suppliers.length > 1) {
            Modal.confirm({
                title: 'Khác Nhà Cung Cấp',
                content: `Các PO đã chọn thuộc nhiều NCC khác nhau (${suppliers.join(', ')}). Bạn có chắc muốn gộp chung?`,
                onOk: () => setIsSelectSupplierOpen(true)
            });
        } else {
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
                child_po_ids: selectedReqs.map(r => r.id)  // FIX: Đổi tên field
            });
            message.success('Gộp PO thành công!');
            setIsSelectSupplierOpen(false);
            setSelectedReqs([]);
            fetchRequirements(); // Refresh list
            fetchData(); // Refresh main list
        } catch (e) { message.error('Lỗi gộp PO'); }
    }

    const handleSavePOChanges = async () => {
        try {
            await axios.put(`${API_URL}/purchasing/${currentPO.id}`, {
                items: editingItems,
                packing_list_details: packingList,
                supplier_id: currentPO.supplier?.id, // Include Supplier ID
                status: currentPO.status
            });
            message.success('Đã lưu thay đổi PO');
            fetchData(); // Refresh global list
            // Update local currentPO to reflect changes safely
            const updatedPO = { ...currentPO, items: editingItems, packing_list_details: packingList };
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

    const handlePrint = (template: string, showPrice = true) => {
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
        } else if (template === 'OUTSOURCING') {
            // --- TEMPLATE GIA CÔNG MỚI ---
            const priceHeaders = showPrice ? `<th>Đơn giá</th><th>Thành tiền</th>` : '';
            const priceColspan = showPrice ? 2 : 0;

            const rows = currentPO?.items?.map((i: any, idx: number) => {
                const priceCells = showPrice ? `<td>${Number(i.unit_price || 0).toLocaleString()}</td><td>${Number(i.subtotal || 0).toLocaleString()}</td>` : '';
                return `
                <tr>
                    <td>${idx + 1}</td>
                    <td>${currentPO.po_code}</td>
                    <td>${i.material?.code || i.product?.sku || '-'}</td>
                    <td class="left-align">${i.product?.processing_description || i.description || i.material?.name || ''}</td>
                    <td>-</td> 
                    <td>-</td> 
                    <td>${Number(i.quantity).toLocaleString()}</td>
                    <td>-</td> 
                    ${priceCells}
                    <td>${i.note || ''}</td>
                </tr>
            `}).join('');

            content = `
                ${style}
                 <div class="header">
                    <div>
                         <div class="title" style="margin-bottom:5px; text-align:left;">HULA</div>
                         <div>Đ/C: 123 ABC...</div>
                    </div>
                    <div style="text-align:right;">
                        <div><b>Ngày:</b> ${dateStr}</div>
                        <div><b>Mã:</b> ${poCode}</div>
                    </div>
                </div>
                <div class="title">ĐƠN ĐẶT HÀNG GIA CÔNG</div>
                <div style="margin-bottom:10px;"><b>Kính gửi:</b> ${supplierName}</div>
                 <table>
                    <thead>
                        <tr>
                            <th>STT</th>
                            <th>Mã ĐH</th>
                            <th>Mã SKU</th>
                            <th>Mô tả sản phẩm</th>
                            <th>Định mức vải (VMT)</th>
                            <th>Định mức vải (VMS)</th>
                            <th>Số lượng</th>
                            <th>Thêu</th>
                            ${priceHeaders}
                            <th>Ghi chú</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                     <tfoot>
                        <tr>
                            <td colspan="6" style="text-align:right; font-weight:bold;">Tổng cộng</td>
                            <td style="font-weight:bold;">${Number(currentPO?.items?.reduce((s: number, i: any) => s + Number(i.quantity || 0), 0)).toLocaleString()}</td>
                            <td colspan="${2 + priceColspan}"></td>
                        </tr>
                    </tfoot>
                </table>
                <div style="margin-top:20px;">
                    <div><b>Ghi chú chung:</b> ${currentPO.note || ''}</div>
                </div>
                 <div style="display:flex; justify-content:space-between; margin-top:40px; text-align:center;">
                    <div><b>Người lập phiếu</b><br/><br/><br/>(Ký, họ tên)</div>
                    <div><b>Người duyệt</b><br/><br/><br/>(Ký, họ tên)</div>
                     <div><b>Nhà cung cấp</b><br/><br/><br/>(Ký, họ tên)</div>
                </div>
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
                {(activeTab === 'REQ_NPL' || activeTab === 'REQ_GC') && <Button type="primary" onClick={handleCreatePooledPO} disabled={selectedReqs.length === 0}>+ Tạo PO Gộp ({selectedReqs.length})</Button>}
                {activeTab === 'POOLED' && <Popconfirm title="Xóa tất cả PO Gộp?" onConfirm={async () => {
                    await axios.delete(`${API_URL}/purchasing/pooled/all`);
                    message.success('Đã xóa dữ liệu gộp');
                    fetchData();
                }}><Button danger>Xóa Data Gộp (Test)</Button></Popconfirm>}

                <Input prefix={<SearchOutlined />} placeholder="Tìm PO..." value={searchText} onChange={e => setSearchText(e.target.value)} style={{ width: 200 }} allowClear />
                <Button icon={<ReloadOutlined />} onClick={() => activeTab.startsWith('REQ') ? fetchRequirements() : fetchData()}>Làm mới</Button>
            </Space>}>
                <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
                    { key: 'ALL', label: 'Tất cả PO' },
                    { key: 'MATERIAL', label: 'Mua NPL' },
                    { key: 'OUTSOURCING', label: 'Gia Công' },
                    { key: 'POOLED', label: 'PO Gộp' },
                    { key: 'REQ_NPL', label: 'Tổng Hợp Nhu Cầu NPL' },
                    { key: 'REQ_GC', label: 'Tổng Hợp Nhu Cầu GC' }
                ]} />

                {(activeTab === 'REQ_NPL' || activeTab === 'REQ_GC') ? (
                    <Table
                        dataSource={requirements}
                        rowKey="id"
                        rowSelection={{
                            type: 'checkbox',
                            onChange: (_, rows) => setSelectedReqs(rows)
                        }}
                        columns={[
                            { title: 'Mã PO', dataIndex: 'po_code', width: 150, render: (t: any, r: any) => <a onClick={() => viewDetail(r)}><b>{t}</b></a> },
                            { title: 'NCC', dataIndex: 'supplier', render: (s: any) => s?.name || '-' },
                            { title: 'Số mặt hàng', width: 100, align: 'center' as const, render: (r: any) => r.items?.length || 0 },
                            { title: 'Tổng tiền', dataIndex: 'total_amount', align: 'right' as const, render: (v: number) => <b>{Number(v).toLocaleString()}</b> },
                            { title: 'Trạng thái', dataIndex: 'status', width: 100, align: 'center' as const, render: (t: string) => <Tag color={t === 'ORDERED' ? 'blue' : 'default'}>{t}</Tag> },
                            { title: 'Ngày tạo', dataIndex: 'created_at', width: 100, align: 'right' as const, render: (t: any) => dayjs(t).format('DD/MM/YY') }
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
                    <Descriptions.Item label="Trạng thái">
                        <Select
                            style={{ width: 150 }}
                            value={currentPO?.status || 'DRAFT'}
                            onChange={(v) => setCurrentPO({ ...currentPO, status: v })}
                            options={[
                                { value: 'DRAFT', label: 'Nháp' },
                                { value: 'ORDERED', label: 'Đặt hàng' },
                                { value: 'COMPLETED', label: 'Đã Thanh toán' }, // Mapping 'COMPLETED' to 'Đã Thanh toán'
                            ]}
                        />
                    </Descriptions.Item>
                    <Descriptions.Item label="Tổng tiền"><b style={{ fontSize: 16 }}>{Number(currentPO?.total_amount).toLocaleString()} ₫</b></Descriptions.Item>
                    <Descriptions.Item label="Đã trả" contentStyle={{ color: 'green', fontWeight: 'bold' }}>{Number(currentPO?.paid_amount).toLocaleString()} ₫</Descriptions.Item>
                    <Descriptions.Item label="Còn lại" contentStyle={{ color: 'red' }}>{Number((currentPO?.total_amount || 0) - (currentPO?.paid_amount || 0)).toLocaleString()} ₫</Descriptions.Item>
                    <Descriptions.Item label="Ghi chú chung" span={2}>
                        <Input.TextArea
                            rows={2}
                            value={currentPO?.note}
                            onChange={(e) => setCurrentPO({ ...currentPO, note: e.target.value })}
                            placeholder="Ghi chú chung cho đơn hàng..."
                        />
                    </Descriptions.Item>
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
                                    { title: 'Tổng Cần (Gốc)', width: 100, align: 'center', render: (r: any) => <span>{Number(r.raw_quantity || 0).toLocaleString()}</span> },
                                    { title: '% Hao hụt', width: 80, align: 'center', render: (r: any) => <Tag color="orange">{r.wastage_rate || 0}%</Tag> },
                                    { title: 'Tổng (+Hao hụt)', width: 120, align: 'center', render: (r: any) => <b>{Number(r.total_quantity || r.quantity).toLocaleString()}</b> },
                                    {
                                        title: 'SL (QĐ)', width: 150, render: (r: any, _: any, index: number) => {
                                            // --- FIX: Allow edit for Outsourcing (no material) ---
                                            const factor = r.material ? Number(r.material.conversion_factor || 1) : 1;
                                            const unit = r.material ? r.material.purchase_unit : '';

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
                                                addonAfter={unit}
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
                                    {
                                        title: 'Ghi chú', width: 150, render: (r: any, _: any, index: number) => (
                                            <Input
                                                value={r.note}
                                                onChange={(e) => {
                                                    const newItems = [...editingItems];
                                                    newItems[index].note = e.target.value;
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
                    // Renamed from key '3' to '2' effectively in the UI flow, or just keep key logic simpler
                    // Removed old "Thông tin giao hàng" tab that used removed state variables.

                    // Only show Packing Matrix for MATERIAL POs
                    ...(currentPO?.po_type !== 'OUTSOURCING' ? [{
                        key: '3', label: 'Thông tin đóng gói', children: (
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
                                            title: 'Mã PO Form', width: 100, align: 'center', render: (t: any, r: any, idx: number) => <b>{idx + 1}</b>
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
                    },
                    {
                        key: '4', label: 'Quản lý Giao hàng', children: (
                            <div>
                                <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#888' }}>
                                        Theo dõi tiến độ giao hàng và tạo phiếu nhập kho.
                                    </span>
                                    <Space>
                                        <Button type="primary" ghost size="small" onClick={() => handleCreateMatrixReceipt()} loading={isDeliveryLoading}>+ Tạo Phiếu Kho (Theo Form)</Button>
                                        {currentPO?.status !== 'DELIVERED' && (
                                            <Popconfirm title="Xác nhận đã giao đủ hàng?" onConfirm={() => handleStatusChange(currentPO.id, 'DELIVERED')}>
                                                <Button type="primary" style={{ background: '#52c41a', borderColor: '#52c41a' }} size="small" icon={<CheckCircleOutlined />}>Đã giao đủ</Button>
                                            </Popconfirm>
                                        )}
                                    </Space>
                                </div>

                                <Table
                                    dataSource={packingList}
                                    rowKey="id"
                                    size="small"
                                    pagination={false}
                                    scroll={{ x: 1200 }}
                                    columns={[
                                        { title: 'Mã PO Form', dataIndex: 'po_form_code', width: 80, align: 'center', render: (t: any, r: any, idx: number) => <b>{idx + 1}</b> },
                                        { title: 'Tên NPL', dataIndex: 'material_name', width: 200 },
                                        {
                                            title: 'Tổng SL ĐM', width: 80, align: 'right', render: (t, r, idx) => {
                                                const matchingItem = currentPO?.items?.find((i: any) => (i.material?.name || i.reference_name || i.sku) === r.material_name);
                                                return <b>{matchingItem ? Number(matchingItem.quantity).toLocaleString() : '-'}</b>;
                                            }
                                        },
                                        {
                                            title: 'Tổng SL đặt', width: 80, align: 'right', render: (t, r) => {
                                                const total =
                                                    Number(r.n1 || 0) + Number(r.n2 || 0) +
                                                    Number(r.c1 || 0) + Number(r.c2 || 0) +
                                                    Number(r.g1 || 0) + Number(r.g2 || 0) +
                                                    Number(r.odd || 0) + Number(r.border || 0);
                                                return <b>{total}</b>
                                            }
                                        },
                                        {
                                            title: 'Tổng SL giao', width: 80, align: 'right', render: (t, r) => {
                                                const total =
                                                    Number(r.n1_input || 0) + Number(r.n2_input || 0) +
                                                    Number(r.c1_input || 0) + Number(r.c2_input || 0) +
                                                    Number(r.g1_input || 0) + Number(r.g2_input || 0) +
                                                    Number(r.odd_input || 0) + Number(r.border_input || 0);
                                                return <b style={{ color: total > 0 ? 'green' : 'inherit' }}>{total}</b>
                                            }
                                        },
                                        {
                                            title: 'N1', children: [
                                                { title: 'Đặt', width: 50, dataIndex: 'n1', align: 'center', render: v => v || '-' },
                                                {
                                                    title: 'Giao', width: 60, align: 'center', render: (v, r: any, idx) => <Input size="small" style={{ textAlign: 'center', color: 'green' }} placeholder="0" value={r.n1_input} onChange={(e) => {
                                                        const list = [...packingList]; list[idx].n1_input = e.target.value; setPackingList(list);
                                                    }} />
                                                }
                                            ]
                                        },
                                        {
                                            title: 'N2', children: [
                                                { title: 'Đặt', width: 50, dataIndex: 'n2', align: 'center', render: v => v || '-' },
                                                {
                                                    title: 'Giao', width: 60, align: 'center', render: (v, r: any, idx) => <Input size="small" style={{ textAlign: 'center', color: 'green' }} placeholder="0" value={r.n2_input} onChange={(e) => {
                                                        const list = [...packingList]; list[idx].n2_input = e.target.value; setPackingList(list);
                                                    }} />
                                                }
                                            ]
                                        },
                                        {
                                            title: 'C1', children: [
                                                { title: 'Đặt', width: 50, dataIndex: 'c1', align: 'center', render: v => v || '-' },
                                                {
                                                    title: 'Giao', width: 60, align: 'center', render: (v, r: any, idx) => <Input size="small" style={{ textAlign: 'center', color: 'green' }} placeholder="0" value={r.c1_input} onChange={(e) => {
                                                        const list = [...packingList]; list[idx].c1_input = e.target.value; setPackingList(list);
                                                    }} />
                                                }
                                            ]
                                        },
                                        {
                                            title: 'C2', children: [
                                                { title: 'Đặt', width: 50, dataIndex: 'c2', align: 'center', render: v => v || '-' },
                                                {
                                                    title: 'Giao', width: 60, align: 'center', render: (v, r: any, idx) => <Input size="small" style={{ textAlign: 'center', color: 'green' }} placeholder="0" value={r.c2_input} onChange={(e) => {
                                                        const list = [...packingList]; list[idx].c2_input = e.target.value; setPackingList(list);
                                                    }} />
                                                }
                                            ]
                                        },
                                        {
                                            title: 'G1', children: [
                                                { title: 'Đặt', width: 50, dataIndex: 'g1', align: 'center', render: v => v || '-' },
                                                {
                                                    title: 'Giao', width: 60, align: 'center', render: (v, r: any, idx) => <Input size="small" style={{ textAlign: 'center', color: 'green' }} placeholder="0" value={r.g1_input} onChange={(e) => {
                                                        const list = [...packingList]; list[idx].g1_input = e.target.value; setPackingList(list);
                                                    }} />
                                                }
                                            ]
                                        },
                                        {
                                            title: 'G2', children: [
                                                { title: 'Đặt', width: 50, dataIndex: 'g2', align: 'center', render: v => v || '-' },
                                                {
                                                    title: 'Giao', width: 60, align: 'center', render: (v, r: any, idx) => <Input size="small" style={{ textAlign: 'center', color: 'green' }} placeholder="0" value={r.g2_input} onChange={(e) => {
                                                        const list = [...packingList]; list[idx].g2_input = e.target.value; setPackingList(list);
                                                    }} />
                                                }
                                            ]
                                        },
                                        {
                                            title: 'Kiện lẻ', children: [
                                                { title: 'Đặt', width: 50, dataIndex: 'odd', align: 'center', render: v => v || '-' },
                                                {
                                                    title: 'Giao', width: 60, align: 'center', render: (v, r: any, idx) => <Input size="small" style={{ textAlign: 'center', color: 'green' }} placeholder="0" value={r.odd_input} onChange={(e) => {
                                                        const list = [...packingList]; list[idx].odd_input = e.target.value; setPackingList(list);
                                                    }} />
                                                }
                                            ]
                                        },
                                        {
                                            title: 'Kiện viền', children: [
                                                { title: 'Đặt', width: 50, dataIndex: 'border', align: 'center', render: v => v || '-' },
                                                {
                                                    title: 'Giao', width: 60, align: 'center', render: (v, r: any, idx) => <Input size="small" style={{ textAlign: 'center', color: 'green' }} placeholder="0" value={r.border_input} onChange={(e) => {
                                                        const list = [...packingList]; list[idx].border_input = e.target.value; setPackingList(list);
                                                    }} />
                                                }
                                            ]
                                        }
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
                    <Button block onClick={() => handlePrint('OUTSOURCING', true)}>Mẫu Gia Công (Có Đơn giá)</Button>
                    <Button block onClick={() => handlePrint('OUTSOURCING', false)}>Mẫu Gia Công (Không Đơn giá)</Button>
                    <Button block onClick={() => handlePrint('CARA')}>Mẫu Đóng Gói (Cara Style)</Button>
                    <Button block onClick={() => handlePrint('HQ')}>Mẫu Đóng Gói (HQ Style)</Button>
                </Space>
            </Modal>
        </div>
    );
};

export default PurchasingPage;