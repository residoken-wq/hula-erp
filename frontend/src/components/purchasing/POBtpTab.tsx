import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Input, InputNumber, Select, Space, Tag, Typography, Row, Col, Popconfirm, message, Alert, Tooltip, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined, CopyOutlined, SaveOutlined, ArrowRightOutlined, ExperimentOutlined, CheckCircleOutlined } from '@ant-design/icons';
import api from '../../utils/api';

const { Text, Title } = Typography;

export interface BtpComponent {
    id?: string;
    material_id?: number | null;
    material_code?: string;
    material_name: string;
    quantity: number;
    unit: string;
    note?: string;
}

export interface SemiFinishedProduct {
    id: string;
    btp_code?: string;
    btp_name: string;
    product_id?: number | null;
    product_name?: string;
    output_quantity: number;
    unit: string;
    target_vendor_id?: number | null;
    target_vendor_name?: string;
    note?: string;
    status?: 'DRAFT' | 'IN_PRODUCTION' | 'COMPLETED';
    components: BtpComponent[];
}

interface POBtpTabProps {
    currentPO: any;
    suppliers: any[];
    products: any[];
    onSave?: (btpList: SemiFinishedProduct[]) => void;
}

const COMMON_UNITS = [
    { value: 'm', label: 'Mét (m)' },
    { value: 'cuộn', label: 'Cuộn' },
    { value: 'tấm', label: 'Tấm' },
    { value: 'cái', label: 'Cái' },
    { value: 'bộ', label: 'Bộ' },
    { value: 'kg', label: 'Kg' },
    { value: 'con', label: 'Con' }
];

export const POBtpTab: React.FC<POBtpTabProps> = ({ currentPO, suppliers, products, onSave }) => {
    const [btpList, setBtpList] = useState<SemiFinishedProduct[]>([]);
    const [availableMaterials, setAvailableMaterials] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (currentPO) {
            // Load existing BTP list from PO
            if (Array.isArray(currentPO.semi_finished_products) && currentPO.semi_finished_products.length > 0) {
                setBtpList(currentPO.semi_finished_products);
            } else {
                setBtpList([]);
            }

            // Fetch available outsourcing materials for dropdown
            if (currentPO.id) {
                api.get(`/purchasing/${currentPO.id}/outsourcing-materials`)
                    .then(res => {
                        if (Array.isArray(res.data)) {
                            setAvailableMaterials(res.data);
                        }
                    })
                    .catch(e => console.error('Error fetching outsourcing materials:', e));
            }
        }
    }, [currentPO?.id]);

    const handleAddBtp = () => {
        const firstProduct = currentPO?.items?.[0]?.product;
        const newBtp: SemiFinishedProduct = {
            id: `BTP_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            btp_code: `BTP-GC-${currentPO?.po_code ? currentPO.po_code.replace('PO-', '') : Date.now().toString().slice(-4)}`,
            btp_name: '',
            product_id: firstProduct?.id || null,
            product_name: firstProduct?.name || '',
            output_quantity: Number(currentPO?.items?.[0]?.quantity || 1),
            unit: 'm',
            target_vendor_id: null,
            target_vendor_name: '',
            note: '',
            status: 'DRAFT',
            components: []
        };
        setBtpList([...btpList, newBtp]);
    };

    const handleCloneBtp = (index: number) => {
        const itemToClone = btpList[index];
        const cloned: SemiFinishedProduct = {
            ...itemToClone,
            id: `BTP_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            btp_code: `${itemToClone.btp_code || 'BTP'}-COPY`,
            btp_name: `${itemToClone.btp_name} (Bản sao)`,
            components: itemToClone.components.map(c => ({ ...c, id: `COMP_${Date.now()}_${Math.floor(Math.random() * 1000)}` }))
        };
        const newList = [...btpList];
        newList.splice(index + 1, 0, cloned);
        setBtpList(newList);
        message.success('Đã nhân bản BTP');
    };

    const handleDeleteBtp = (index: number) => {
        const newList = [...btpList];
        newList.splice(index, 1);
        setBtpList(newList);
        message.info('Đã xóa BTP');
    };

    const handleUpdateBtp = (index: number, field: keyof SemiFinishedProduct, value: any) => {
        const newList = [...btpList];
        newList[index] = { ...newList[index], [field]: value };
        
        if (field === 'target_vendor_id') {
            const supp = suppliers.find(s => s.id === value);
            newList[index].target_vendor_name = supp?.name || '';
        }
        if (field === 'product_id') {
            const prod = products.find(p => p.id === value);
            newList[index].product_name = prod?.name || '';
        }

        setBtpList(newList);
    };

    const handleAddComponent = (btpIndex: number, materialOption?: any) => {
        const newList = [...btpList];
        const newComp: BtpComponent = {
            id: `COMP_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            material_id: materialOption?.material_id || null,
            material_code: materialOption?.code || '',
            material_name: materialOption?.name || '',
            quantity: 1,
            unit: materialOption?.unit || 'm',
            note: ''
        };
        newList[btpIndex].components = [...(newList[btpIndex].components || []), newComp];
        setBtpList(newList);
    };

    const handleUpdateComponent = (btpIndex: number, compIndex: number, field: keyof BtpComponent, value: any) => {
        const newList = [...btpList];
        const components = [...newList[btpIndex].components];
        components[compIndex] = { ...components[compIndex], [field]: value };

        if (field === 'material_id') {
            const mat = availableMaterials.find(m => m.material_id === value);
            if (mat) {
                components[compIndex].material_code = mat.code;
                components[compIndex].material_name = mat.name;
                components[compIndex].unit = mat.unit || components[compIndex].unit;
            }
        }

        newList[btpIndex].components = components;
        setBtpList(newList);
    };

    const handleDeleteComponent = (btpIndex: number, compIndex: number) => {
        const newList = [...btpList];
        const components = [...newList[btpIndex].components];
        components.splice(compIndex, 1);
        newList[btpIndex].components = components;
        setBtpList(newList);
    };

    const handleSaveBtpList = async () => {
        setSaving(true);
        try {
            await api.put(`/purchasing/${currentPO.id}`, {
                semi_finished_products: btpList
            });
            message.success('Đã lưu danh sách Bán Thành Phẩm thành công!');
            if (onSave) onSave(btpList);
        } catch (e: any) {
            console.error('Error saving BTP:', e);
            message.error('Lỗi khi lưu Bán Thành Phẩm: ' + (e?.response?.data?.message || e.message));
        } finally {
            setSaving(false);
        }
    };

    // Auto-suggest BTP components from available materials
    const handleAutoSuggestFromMaterials = (btpIndex: number) => {
        if (availableMaterials.length === 0) {
            return message.warning('Chưa có danh sách NPL cấp phát từ PO/Kế hoạch');
        }
        const newList = [...btpList];
        const newComponents = availableMaterials.map(m => ({
            id: `COMP_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            material_id: m.material_id || null,
            material_code: m.code || '',
            material_name: m.name || '',
            quantity: Number(m.quantity || 1),
            unit: m.unit || 'm',
            note: ''
        }));
        newList[btpIndex].components = newComponents;
        setBtpList(newList);
        message.success(`Đã tự động điền ${newComponents.length} NPL từ kế hoạch`);
    };

    return (
        <div style={{ padding: '4px 0' }}>
            {/* Header & Help Banner */}
            <Alert
                message={<b>Định mức Bán Thành Phẩm (BTP) & Phối Trộn NPL Gia Công</b>}
                description={
                    <div>
                        Phối trộn các Nguyên Phụ Liệu (NPL) được giao cho xưởng này để tạo ra <b>Bán Thành Phẩm (BTP)</b>.<br/>
                        <i>Ví dụ: <b>Vải cara vàng chanh</b> (4 tấm) + <b>Vải dù xám gạo</b> (10m) + <b>Gòn chần 300gr</b> (10m) = <b>Cuộn vải chần gòn 300gr Cara vàng chanh / dù xám</b> (9.8m).</i><br/>
                        BTP tạo ra sẽ sẵn sàng xuất sang <b>Xưởng tiếp theo (NGC đích)</b> để may ráp và hoàn thiện sản phẩm.
                    </div>
                }
                type="info"
                showIcon
                icon={<ExperimentOutlined />}
                style={{ marginBottom: 16, borderRadius: 8 }}
            />

            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Space>
                    <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddBtp} style={{ borderColor: '#722ed1', color: '#722ed1', fontWeight: 600 }}>
                        + Thêm Bán Thành Phẩm
                    </Button>
                </Space>
                <Button 
                    type="primary" 
                    icon={<SaveOutlined />} 
                    loading={saving} 
                    onClick={handleSaveBtpList}
                    style={{ background: '#722ed1', borderColor: '#722ed1', fontWeight: 600 }}
                >
                    Lưu Bán Thành Phẩm ({btpList.length})
                </Button>
            </div>

            {/* Empty state */}
            {btpList.length === 0 && (
                <Card style={{ textAlign: 'center', padding: '32px 0', borderStyle: 'dashed', borderColor: '#d3adf7', background: '#faf5ff', borderRadius: 8 }}>
                    <ExperimentOutlined style={{ fontSize: 40, color: '#9254de', marginBottom: 12 }} />
                    <Title level={5} style={{ color: '#531dab', margin: 0 }}>Chưa có Bán Thành Phẩm nào được thiết lập cho PO này</Title>
                    <p style={{ color: '#888', marginTop: 8, marginBottom: 16 }}>Bấm vào nút bên dưới để tạo công thức phối trộn NPL thành BTP.</p>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAddBtp} style={{ background: '#722ed1', borderColor: '#722ed1' }}>
                        Tạo Bán Thành Phẩm Đầu Tiên
                    </Button>
                </Card>
            )}

            {/* BTP Cards List */}
            {btpList.map((btp, btpIndex) => {
                // Build formula string
                const inputSummary = (btp.components || []).length > 0
                    ? btp.components.map(c => `${c.quantity} ${c.unit || ''} [${c.material_name || c.material_code || 'Vật tư'}]`).join('  +  ')
                    : 'Chưa chọn NPL đầu vào';
                const outputSummary = `${btp.output_quantity || 0} ${btp.unit || ''} [${btp.btp_name || 'Bán thành phẩm'}]`;

                return (
                    <Card
                        key={btp.id || btpIndex}
                        style={{
                            marginBottom: 20,
                            border: '1px solid #d3adf7',
                            borderRadius: 8,
                            boxShadow: '0 2px 8px rgba(114, 46, 209, 0.08)'
                        }}
                        bodyStyle={{ padding: '16px 20px' }}
                        title={
                            <Space size={12} wrap>
                                <Tag color="purple" style={{ fontSize: 13, padding: '2px 8px', fontWeight: 600 }}>
                                    #{btpIndex + 1} {btp.btp_code || 'BTP'}
                                </Tag>
                                <span style={{ fontWeight: 600, color: '#391085', fontSize: 15 }}>
                                    {btp.btp_name || <i style={{ color: '#bfbfbf' }}>(Chưa đặt tên BTP)</i>}
                                </span>
                                <Tag color="blue" style={{ fontSize: 12 }}>
                                    Đầu ra: <b>{btp.output_quantity || 0} {btp.unit}</b>
                                </Tag>
                                {btp.target_vendor_name && (
                                    <Tag color="cyan" style={{ fontSize: 12 }}>
                                        <ArrowRightOutlined /> Giao sang: <b>{btp.target_vendor_name}</b>
                                    </Tag>
                                )}
                            </Space>
                        }
                        extra={
                            <Space>
                                <Tooltip title="Nhân bản BTP này">
                                    <Button size="small" icon={<CopyOutlined />} onClick={() => handleCloneBtp(btpIndex)} />
                                </Tooltip>
                                <Popconfirm title="Xóa BTP này?" onConfirm={() => handleDeleteBtp(btpIndex)}>
                                    <Button size="small" danger icon={<DeleteOutlined />} />
                                </Popconfirm>
                            </Space>
                        }
                    >
                        {/* 1. Thông tin tổng quan BTP */}
                        <Row gutter={[16, 12]}>
                            <Col xs={24} sm={12} md={8}>
                                <label style={{ fontSize: 12, color: '#666', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                                    Tên Bán Thành Phẩm (BTP) <span style={{ color: 'red' }}>*</span>:
                                </label>
                                <Input
                                    placeholder="Vd: Cuộn vải chần gòn 300gr Cara vàng chanh..."
                                    value={btp.btp_name}
                                    onChange={e => handleUpdateBtp(btpIndex, 'btp_name', e.target.value)}
                                    style={{ fontWeight: 600, borderColor: btp.btp_name ? undefined : '#ffa39e' }}
                                />
                            </Col>

                            <Col xs={24} sm={12} md={4}>
                                <label style={{ fontSize: 12, color: '#666', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                                    Mã BTP / Quy cách:
                                </label>
                                <Input
                                    placeholder="Vd: BTP-CHAN-01"
                                    value={btp.btp_code}
                                    onChange={e => handleUpdateBtp(btpIndex, 'btp_code', e.target.value)}
                                />
                            </Col>

                            <Col xs={12} sm={6} md={3}>
                                <label style={{ fontSize: 12, color: '#666', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                                    SL Đầu ra <span style={{ color: 'red' }}>*</span>:
                                </label>
                                <InputNumber
                                    min={0.01}
                                    step={0.1}
                                    style={{ width: '100%', fontWeight: 600, color: '#722ed1' }}
                                    value={btp.output_quantity}
                                    onChange={val => handleUpdateBtp(btpIndex, 'output_quantity', Number(val || 0))}
                                />
                            </Col>

                            <Col xs={12} sm={6} md={3}>
                                <label style={{ fontSize: 12, color: '#666', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                                    Đơn vị tính:
                                </label>
                                <Select
                                    style={{ width: '100%' }}
                                    value={btp.unit || 'm'}
                                    onChange={val => handleUpdateBtp(btpIndex, 'unit', val)}
                                    options={COMMON_UNITS}
                                />
                            </Col>

                            <Col xs={24} sm={12} md={6}>
                                <label style={{ fontSize: 12, color: '#666', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                                    Xưởng nhận tiếp theo (NGC đích):
                                </label>
                                <Select
                                    showSearch
                                    allowClear
                                    placeholder="Chọn xưởng / NGC nhận BTP..."
                                    style={{ width: '100%' }}
                                    value={btp.target_vendor_id || undefined}
                                    onChange={val => handleUpdateBtp(btpIndex, 'target_vendor_id', val || null)}
                                    options={suppliers.map(s => ({ label: `🏭 ${s.name}`, value: s.id }))}
                                    optionFilterProp="label"
                                />
                            </Col>
                        </Row>

                        {/* 2. Visual Recipe Formula Preview Box */}
                        <div style={{
                            marginTop: 12,
                            marginBottom: 12,
                            padding: '10px 14px',
                            background: '#f9f0ff',
                            border: '1px dashed #d3adf7',
                            borderRadius: 6,
                            display: 'flex',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 8,
                            fontSize: 13
                        }}>
                            <span style={{ color: '#531dab', fontWeight: 600 }}>⚗️ Công thức phối trộn:</span>
                            <span style={{ color: '#262626', background: '#fff', padding: '2px 8px', borderRadius: 4, border: '1px solid #e8e8e8' }}>
                                {inputSummary}
                            </span>
                            <ArrowRightOutlined style={{ color: '#722ed1', fontSize: 16 }} />
                            <span style={{ color: '#531dab', fontWeight: 700, background: '#efdbff', padding: '2px 8px', borderRadius: 4, border: '1px solid #d3adf7' }}>
                                {outputSummary}
                            </span>
                            {btp.target_vendor_name && (
                                <>
                                    <ArrowRightOutlined style={{ color: '#13c2c2', fontSize: 16 }} />
                                    <Tag color="cyan" style={{ margin: 0, fontWeight: 600 }}>
                                        Xuất sang: {btp.target_vendor_name}
                                    </Tag>
                                </>
                            )}
                        </div>

                        {/* 3. Bảng Thành Phần NPL Đầu Vào */}
                        <div style={{ marginTop: 14 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <span style={{ fontWeight: 600, fontSize: 13, color: '#333' }}>
                                    📦 Thành phần NPL phối trộn đầu vào ({btp.components?.length || 0}):
                                </span>
                                <Space size={8}>
                                    {availableMaterials.length > 0 && (
                                        <Button 
                                            size="small" 
                                            type="link" 
                                            icon={<CheckCircleOutlined />} 
                                            onClick={() => handleAutoSuggestFromMaterials(btpIndex)}
                                            style={{ color: '#52c41a' }}
                                        >
                                            Gợi ý từ NPL Kế hoạch
                                        </Button>
                                    )}
                                    <Button 
                                        size="small" 
                                        icon={<PlusOutlined />} 
                                        onClick={() => handleAddComponent(btpIndex)}
                                        style={{ borderColor: '#722ed1', color: '#722ed1' }}
                                    >
                                        + Thêm NPL
                                    </Button>
                                </Space>
                            </div>

                            <Table
                                dataSource={btp.components || []}
                                rowKey="id"
                                pagination={false}
                                size="small"
                                bordered
                                columns={[
                                    {
                                        title: 'NPL / Vật tư đầu vào',
                                        width: 320,
                                        render: (r: BtpComponent, _: any, compIdx: number) => (
                                            <Select
                                                showSearch
                                                allowClear
                                                placeholder="Chọn NPL từ PO hoặc nhập tên..."
                                                style={{ width: '100%' }}
                                                value={r.material_id || r.material_name || undefined}
                                                onChange={(val) => {
                                                    const foundMat = availableMaterials.find(m => m.material_id === val);
                                                    if (foundMat) {
                                                        handleUpdateComponent(btpIndex, compIdx, 'material_id', foundMat.material_id);
                                                    } else {
                                                        handleUpdateComponent(btpIndex, compIdx, 'material_name', val);
                                                    }
                                                }}
                                                options={availableMaterials.map(m => ({
                                                    label: `${m.code ? `[${m.code}] ` : ''}${m.name} (${m.quantity || 0} ${m.unit || ''})`,
                                                    value: m.material_id || m.name
                                                }))}
                                                optionFilterProp="label"
                                            />
                                        )
                                    },
                                    {
                                        title: 'Số lượng tiêu hao',
                                        width: 140,
                                        render: (r: BtpComponent, _: any, compIdx: number) => (
                                            <InputNumber
                                                min={0.001}
                                                step={0.1}
                                                style={{ width: '100%', fontWeight: 600, color: '#cf1322' }}
                                                value={r.quantity}
                                                onChange={val => handleUpdateComponent(btpIndex, compIdx, 'quantity', Number(val || 0))}
                                            />
                                        )
                                    },
                                    {
                                        title: 'ĐVT',
                                        width: 110,
                                        render: (r: BtpComponent, _: any, compIdx: number) => (
                                            <Select
                                                style={{ width: '100%' }}
                                                value={r.unit || 'm'}
                                                onChange={val => handleUpdateComponent(btpIndex, compIdx, 'unit', val)}
                                                options={COMMON_UNITS}
                                            />
                                        )
                                    },
                                    {
                                        title: 'Ghi chú / Vị trí',
                                        render: (r: BtpComponent, _: any, compIdx: number) => (
                                            <Input
                                                placeholder="Vd: Mặt trước, Mặt sau, Lớp lót giữa..."
                                                value={r.note}
                                                onChange={e => handleUpdateComponent(btpIndex, compIdx, 'note', e.target.value)}
                                            />
                                        )
                                    },
                                    {
                                        title: '',
                                        width: 50,
                                        align: 'center',
                                        render: (_: any, __: any, compIdx: number) => (
                                            <Button
                                                size="small"
                                                type="text"
                                                danger
                                                icon={<DeleteOutlined />}
                                                onClick={() => handleDeleteComponent(btpIndex, compIdx)}
                                            />
                                        )
                                    }
                                ]}
                            />
                        </div>
                    </Card>
                );
            })}
        </div>
    );
};

export default POBtpTab;
