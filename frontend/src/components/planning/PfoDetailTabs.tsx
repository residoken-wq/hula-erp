import React, { useMemo } from 'react';
import { Card, Row, Col, Typography, Tag, Tabs, Table, Statistic } from 'antd';
import dayjs from 'dayjs';
import MaterialMatrix from './MaterialMatrix';
import PfoProcessRouting from './PfoProcessRouting';

const { Title, Text } = Typography;

interface PfoDetailTabsProps {
    selectedPfo: any;
    pfoDetails: any;
    suppliers: any[];
    loading: boolean;
    isMobile: boolean;
    handleSaveRouting: (routing: any[]) => void;
    handleSaveReqs: (reqs: any[]) => void;
    handleGeneratePo: (reqs?: any[]) => void;
    handleCalculateBom: () => void;
}

const PfoDetailTabs: React.FC<PfoDetailTabsProps> = ({
    selectedPfo, pfoDetails, suppliers, loading, isMobile,
    handleSaveRouting, handleSaveReqs, handleGeneratePo, handleCalculateBom
}) => {
    // 1. Calculate Estimated Costs
    const estimatedBomCost = useMemo(() => {
        if (!pfoDetails?.material_requirements) return 0;
        return pfoDetails.material_requirements.reduce((sum: number, req: any) => sum + (Number(req.planned_quantity || 0) * Number(req.unit_price || 0)), 0);
    }, [pfoDetails]);

    const estimatedRoutingCost = useMemo(() => {
        if (!pfoDetails?.milestones) return 0;
        return pfoDetails.milestones.reduce((sum: number, ms: any) => sum + (Number(ms.planned_quantity || selectedPfo?.quantity || 1) * Number(ms.unit_price || 0)), 0);
    }, [pfoDetails, selectedPfo]);

    // Helper for recursive logistics cost
    const getLogisticsCost = (product: any): number => {
        if (!product) return 0;
        let cost = (product.logistics || []).reduce((acc: number, log: any) => acc + Number(log.cost || 0), 0);
        if (product.product_type === 'COMBO' && product.components) {
            cost += product.components.reduce((acc: number, comp: any) => acc + getLogisticsCost(comp.child_product) * Number(comp.quantity || 1), 0);
        }
        return cost;
    };

    const estimatedLogisticCost = useMemo(() => {
        if (!pfoDetails?.sales_order?.items) return 0;
        return pfoDetails.sales_order.items.reduce((sum: number, item: any) => {
            const itemLogCost = getLogisticsCost(item.product);
            return sum + (itemLogCost * Number(item.quantity || 1));
        }, 0);
    }, [pfoDetails]);

    const totalRevenue = useMemo(() => {
        if (!pfoDetails?.sales_order?.items) return 0;
        return pfoDetails.sales_order.items.reduce((sum: number, item: any) => sum + (Number(item.quantity || 0) * Number(item.unit_price || 0)), 0);
    }, [pfoDetails]);

    const totalEstimatedCost = estimatedBomCost + estimatedRoutingCost + estimatedLogisticCost;
    const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalEstimatedCost) / totalRevenue) * 100 : 0;

    // 2. Calculate Actual Costs from POs and Inventory
    const actualNplCost = useMemo(() => {
        if (!pfoDetails?.pos?.pos_npl) return 0;
        return pfoDetails.pos.pos_npl
            .filter((po: any) => po.status !== 'CANCELLED')
            .reduce((sum: number, po: any) => sum + Number(po.total_amount || 0), 0);
    }, [pfoDetails]);

    const actualGcCost = useMemo(() => {
        if (!pfoDetails?.pos?.pos_gc) return 0;
        return pfoDetails.pos.pos_gc
            .filter((po: any) => po.status !== 'CANCELLED')
            .reduce((sum: number, po: any) => sum + Number(po.total_amount || 0), 0);
    }, [pfoDetails]);

    const actualNplInventoryCost = useMemo(() => {
        if (!pfoDetails?.material_requirements) return 0;
        return pfoDetails.material_requirements
            .filter((req: any) => req.use_inventory)
            .reduce((sum: number, req: any) => sum + (Number(req.inventory_used_quantity || 0) * Number(req.unit_price || 0)), 0);
    }, [pfoDetails]);

    const actualLogisticCost = estimatedLogisticCost; // CP_VC currently uses estimated for actual as well unless PO logistics exist

    const totalActualCost = actualNplCost + actualGcCost + actualNplInventoryCost + actualLogisticCost;
    const actualProfitMargin = totalRevenue > 0 ? ((totalRevenue - totalActualCost) / totalRevenue) * 100 : 0;

    // 3. BOM Tree Data
    const bomTreeData = useMemo(() => {
        if (!pfoDetails?.sales_order?.items) return [];
        return pfoDetails.sales_order.items.map((item: any) => {
            const product = item.product;
            let children: any[] = [];
            
            if (product?.product_type === 'COMBO' && product?.components) {
                children = product.components.map((comp: any) => {
                    const cProd = comp.child_product;
                    return {
                        key: `comp-${comp.id}`,
                        name: cProd?.name || cProd?.sku,
                        sku: cProd?.sku,
                        type: 'Sản phẩm con',
                        quantity: comp.quantity,
                        children: cProd?.boms?.map((b: any) => ({
                            key: `bom-${comp.id}-${b.id}`,
                            name: b.material?.name || b.material?.sku,
                            sku: b.material?.sku,
                            type: 'NPL',
                            quantity: b.quantity
                        }))
                    };
                });
            } else if (product?.boms) {
                children = product.boms.map((b: any) => ({
                    key: `bom-${b.id}`,
                    name: b.material?.name || b.material?.sku,
                    sku: b.material?.sku,
                    type: 'NPL',
                    quantity: b.quantity
                }));
            }

            return {
                key: `prod-${product?.id}`,
                name: product?.name || product?.sku,
                sku: product?.sku,
                type: 'Thành phẩm',
                quantity: item.quantity,
                children: children.length > 0 ? children : undefined
            };
        });
    }, [pfoDetails]);

    const columnsBom = [
        { title: 'Tên / Mã', dataIndex: 'name', key: 'name', render: (text: string, record: any) => <b>{text} ({record.sku})</b> },
        { title: 'Loại', dataIndex: 'type', key: 'type' },
        { title: 'Định mức / SL', dataIndex: 'quantity', key: 'quantity' }
    ];

    const columnsPo = [
        { title: 'Mã PO', dataIndex: 'po_code', key: 'po_code' },
        { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (val: string) => <Tag color="blue">{val}</Tag> },
        { title: 'Nhà cung cấp', dataIndex: ['supplier', 'name'], key: 'supplier' },
        { title: 'Tổng tiền', dataIndex: 'total_amount', key: 'total_amount', render: (val: any) => <b>{Number(val).toLocaleString()} ₫</b> }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* THÔNG TIN CHUNG */}
            <Card size="small" style={{ background: '#fafafa', borderRadius: 10, border: '1px solid #e8e8e8' }}>
                <Row gutter={[16, 8]}>
                    <Col span={isMobile ? 24 : 6}>
                        <Text type="secondary">Mã Đơn Hàng (SO):</Text><br />
                        <Text strong style={{ fontSize: 15, color: '#1890ff' }}>
                            {pfoDetails?.sales_order?.order_code || selectedPfo?.sales_order_code || selectedPfo?.code?.replace('PFO-', '')}
                        </Text>
                    </Col>
                    <Col span={isMobile ? 24 : 6}>
                        <Text type="secondary">Khách Hàng:</Text><br />
                        <Text strong>
                            {pfoDetails?.sales_order?.customer_name || pfoDetails?.sales_order?.customer?.name || 'N/A'}
                        </Text>
                    </Col>
                    <Col span={isMobile ? 24 : 6}>
                        <Text type="secondary">Hạn Giao Hàng (Deadline):</Text><br />
                        <Text strong style={{ color: '#cf1322' }}>
                            {selectedPfo?.committed_finish_date ? dayjs(selectedPfo.committed_finish_date).format('DD/MM/YYYY') : 'N/A'}
                        </Text>
                    </Col>
                    <Col span={isMobile ? 24 : 6}>
                        <Text type="secondary">Tiến Độ Tổng:</Text><br />
                        <Tag color="green" style={{ fontSize: 14 }}>{selectedPfo?.progress || 0}%</Tag>
                    </Col>
                </Row>
            </Card>

            {/* DỰ TÍNH CHI PHÍ & CHI PHÍ THỰC TẾ */}
            <Row gutter={[16, 16]}>
                <Col span={isMobile ? 24 : 12}>
                    <Card size="small" title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text strong style={{ color: '#fa8c16' }}>Dự Tính Chi Phí Theo BOM</Text>
                            <div style={{ textAlign: 'right', fontWeight: 'normal' }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>Tổng CP: </Text><Text strong>{totalEstimatedCost.toLocaleString('vi-VN')} ₫</Text>
                                <Divider type="vertical" />
                                <Text type="secondary" style={{ fontSize: 12 }}>Lợi nhuận: </Text><Text strong style={{ color: (totalRevenue - totalEstimatedCost) < 0 ? '#cf1322' : '#3f8600' }}>{(totalRevenue - totalEstimatedCost).toLocaleString('vi-VN')} ₫</Text>
                            </div>
                        </div>
                    } style={{ borderRadius: 10, border: '1px solid #ffd591', background: '#fff7e6' }}>
                        <Row gutter={[16, 16]}>
                            <Col span={isMobile ? 12 : 8}><Statistic title="CP NPL" value={estimatedBomCost} suffix="₫" valueStyle={{ fontSize: 16 }} /></Col>
                            <Col span={isMobile ? 12 : 8}><Statistic title="CP Gia Công" value={estimatedRoutingCost} suffix="₫" valueStyle={{ fontSize: 16 }} /></Col>
                            <Col span={isMobile ? 12 : 8}><Statistic title="CP Vận Chuyển (CP_VC)" value={estimatedLogisticCost} suffix="₫" valueStyle={{ fontSize: 16 }} /></Col>
                            <Col span={isMobile ? 12 : 8}><Statistic title="% Lợi Nhuận" value={profitMargin} precision={2} suffix="%" valueStyle={{ fontSize: 16, color: profitMargin < 0 ? '#cf1322' : '#3f8600' }} /></Col>
                        </Row>
                    </Card>
                </Col>
                <Col span={isMobile ? 24 : 12}>
                    <Card size="small" title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text strong style={{ color: '#389e0d' }}>Chi Phí Thực Tế (Từ PO)</Text>
                            <div style={{ textAlign: 'right', fontWeight: 'normal' }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>Tổng CP: </Text><Text strong>{totalActualCost.toLocaleString('vi-VN')} ₫</Text>
                                <Divider type="vertical" />
                                <Text type="secondary" style={{ fontSize: 12 }}>Lợi nhuận: </Text><Text strong style={{ color: (totalRevenue - totalActualCost) < 0 ? '#cf1322' : '#389e0d' }}>{(totalRevenue - totalActualCost).toLocaleString('vi-VN')} ₫</Text>
                            </div>
                        </div>
                    } style={{ borderRadius: 10, border: '1px solid #b7eb8f', background: '#f6ffed', height: '100%' }}>
                        <Row gutter={[16, 16]}>
                            <Col span={isMobile ? 12 : 8}><Statistic title="CP NPL (PO)" value={actualNplCost} suffix="₫" valueStyle={{ fontSize: 16 }} /></Col>
                            <Col span={isMobile ? 12 : 8}><Statistic title="CP NPL (Từ kho)" value={actualNplInventoryCost} suffix="₫" valueStyle={{ fontSize: 16 }} /></Col>
                            <Col span={isMobile ? 12 : 8}><Statistic title="CP Gia Công (PO)" value={actualGcCost} suffix="₫" valueStyle={{ fontSize: 16 }} /></Col>
                            <Col span={isMobile ? 12 : 8}><Statistic title="CP Vận Chuyển" value={actualLogisticCost} suffix="₫" valueStyle={{ fontSize: 16 }} /></Col>
                            <Col span={isMobile ? 12 : 8}><Statistic title="% Lợi Nhuận Thực Tế" value={actualProfitMargin} precision={2} suffix="%" valueStyle={{ fontSize: 16, color: actualProfitMargin < 0 ? '#cf1322' : '#389e0d' }} /></Col>
                        </Row>
                    </Card>
                </Col>
            </Row>

            {/* TABS */}
            <Card size="small" style={{ borderRadius: 10, border: '1px solid #e8e8e8' }}>
                <Tabs items={[
                    {
                        key: 'ROUTING',
                        label: 'Quy trình gia công',
                        children: (
                            <PfoProcessRouting 
                                pfoId={selectedPfo.id}
                                existingMilestones={pfoDetails?.milestones || []}
                                suppliers={suppliers}
                                loading={loading}
                                onSaveRouting={handleSaveRouting}
                            />
                        )
                    },
                    {
                        key: 'MATRIX',
                        label: 'Ma trận vật tư',
                        children: (
                            <MaterialMatrix 
                                requirements={pfoDetails?.material_requirements || []} 
                                suppliers={suppliers}
                                loading={loading}
                                onSaveReqs={handleSaveReqs}
                                onGeneratePo={handleGeneratePo}
                                onCalculateBom={handleCalculateBom}
                            />
                        )
                    },
                    {
                        key: 'BOM',
                        label: 'Thông tin BOM',
                        children: (
                            <Table 
                                columns={columnsBom} 
                                dataSource={bomTreeData} 
                                size="small" 
                                pagination={false}
                                expandable={{
                                    defaultExpandAllRows: true
                                }}
                            />
                        )
                    },
                    {
                        key: 'CP_VC',
                        label: 'CP_VC',
                        children: (
                            <Table 
                                columns={[
                                    { title: 'Sản phẩm', dataIndex: 'product_name', key: 'product_name' },
                                    { title: 'Khoản mục', dataIndex: 'name', key: 'name' },
                                    { title: 'Chi phí (1 SP)', dataIndex: 'cost', key: 'cost', render: (val: any) => `${Number(val).toLocaleString()} ₫` }
                                ]} 
                                dataSource={pfoDetails?.sales_order?.items?.flatMap((item: any) => {
                                    const logs: any[] = [];
                                    const extractLogs = (prod: any, prefix: string = '') => {
                                        if (!prod) return;
                                        (prod.logistics || []).forEach((log: any) => {
                                            logs.push({ ...log, product_name: prefix + prod.name, key: `log-${log.id}-${prod.id}` });
                                        });
                                        if (prod.product_type === 'COMBO' && prod.components) {
                                            prod.components.forEach((comp: any) => extractLogs(comp.child_product, `${prefix}${prod.name} > `));
                                        }
                                    };
                                    extractLogs(item.product);
                                    return logs;
                                }) || []}
                                size="small"
                                pagination={false}
                            />
                        )
                    },
                    {
                        key: 'PO_NPL',
                        label: 'PO_NPL',
                        children: (
                            <Table 
                                columns={columnsPo} 
                                dataSource={pfoDetails?.pos?.pos_npl || []} 
                                size="small" 
                                rowKey="id"
                            />
                        )
                    },
                    {
                        key: 'PO_GC',
                        label: 'PO_GC',
                        children: (
                            <Table 
                                columns={columnsPo} 
                                dataSource={pfoDetails?.pos?.pos_gc || []} 
                                size="small" 
                                rowKey="id"
                            />
                        )
                    }
                ]} />
            </Card>
        </div>
    );
};

export default PfoDetailTabs;
