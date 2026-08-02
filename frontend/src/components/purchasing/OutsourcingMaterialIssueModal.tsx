import React, { useEffect, useState } from 'react';
import { Modal, Table, Tag, Button, Space, InputNumber, Input, Select, DatePicker, Divider, message, Popconfirm, Empty, Progress } from 'antd';
import { CarOutlined, PlusOutlined, CheckCircleOutlined, DeleteOutlined, SendOutlined } from '@ant-design/icons';
import api from '../../utils/api';
import dayjs from 'dayjs';

interface OutsourcingMaterialIssueModalProps {
    open: boolean;
    onClose: () => void;
    currentPO: any;
    onRefresh?: () => void;
}

const OutsourcingMaterialIssueModal: React.FC<OutsourcingMaterialIssueModalProps> = ({ open, onClose, currentPO, onRefresh }) => {
    const [materials, setMaterials] = useState<any[]>([]);
    const [issueHistory, setIssueHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Form state for new issue
    const [deliveryMode, setDeliveryMode] = useState('PER_ORDER');
    const [vehicle, setVehicle] = useState('');
    const [note, setNote] = useState('');

    const [unlinkedIssues, setUnlinkedIssues] = useState<any[]>([]);
    const [selectedUnlinkedIssue, setSelectedUnlinkedIssue] = useState<number | null>(null);

    const [requestModalVisible, setRequestModalVisible] = useState(false);
    const [requestMaterial, setRequestMaterial] = useState<any>(null);
    const [requestQty, setRequestQty] = useState<number>(0);
    const [requestNote, setRequestNote] = useState<string>('');

    useEffect(() => {
        if (open && currentPO?.id) {
            fetchMaterials();
            fetchIssueHistory();
            fetchUnlinkedIssues();
        }
    }, [open, currentPO?.id]);

    const fetchMaterials = async () => {
        try {
            const res = await api.get(`/purchasing/${currentPO.id}/outsourcing-materials`);
            setMaterials(res.data.map((m: any) => ({ ...m, issue_qty: 0 })));
        } catch (e) { message.error('Lỗi tải thông tin NPL'); }
    };

    const fetchIssueHistory = async () => {
        try {
            const res = await api.get(`/inventory/goods-issue?po_id=${currentPO.id}`);
            setIssueHistory(Array.isArray(res.data) ? res.data : []);
        } catch (e) { console.error('Error fetching issue history', e); }
    };

    const fetchUnlinkedIssues = async () => {
        try {
            const pfoId = currentPO?.items?.[0]?.pfo_id || currentPO?.pfo_id;
            if (pfoId) {
                const res = await api.get(`/inventory/goods-issue/unlinked/${pfoId}`);
                setUnlinkedIssues(Array.isArray(res.data) ? res.data : []);
            }
        } catch (e) { console.error('Error fetching unlinked issues', e); }
    };

    const handleCreateIssue = async () => {
        const validItems = materials.filter(m => Number(m.issue_qty || 0) > 0);
        if (validItems.length === 0) return message.warning('Vui lòng nhập số lượng NPL cần xuất');

        setLoading(true);
        try {
            await api.post(`/inventory/goods-issue`, {
                type: 'OUTSOURCING',
                delivery_mode: deliveryMode,
                po_id: currentPO.id,
                supplier_id: currentPO.supplier?.id,
                plan_id: currentPO.items?.[0]?.plan_id,
                vehicle,
                note: note || `Xuất NPL cho GC ${currentPO.po_code}`,
                items: validItems.map(m => ({
                    material_id: m.type === 'SEMI_FINISHED' ? null : m.material_id,
                    product_id: m.type === 'SEMI_FINISHED' ? m.product_id : null,
                    quantity: Number(m.issue_qty),
                    material_category: m.material_category || (m.is_fabric ? 'FABRIC' : 'ACCESSORY'),
                    note: m.item_note
                }))
            });
            message.success('Đã tạo phiếu xuất kho NPL');
            // Reset inputs
            setMaterials(prev => prev.map(m => ({ ...m, issue_qty: 0, item_note: '' })));
            setVehicle('');
            setNote('');
            fetchIssueHistory();
            onRefresh?.();
        } catch (e) {
            message.error('Lỗi tạo phiếu xuất kho');
        }
        setLoading(false);
    };

    const handleConfirmIssue = async (issueId: number) => {
        try {
            await api.post(`/inventory/goods-issue/${issueId}/confirm`);
            message.success('Đã xác nhận xuất kho — Tồn kho đã cập nhật');
            fetchIssueHistory();
            onRefresh?.();
        } catch (e) { message.error('Lỗi xác nhận'); }
    };

    const handleMarkDelivered = async (issueId: number) => {
        try {
            await api.post(`/inventory/goods-issue/${issueId}/delivered`);
            message.success('Đã đánh dấu giao xong');
            fetchIssueHistory();
        } catch (e) { message.error('Lỗi cập nhật'); }
    };

    const handleDeleteIssue = async (issueId: number) => {
        try {
            await api.delete(`/inventory/goods-issue/${issueId}`);
            message.success('Đã xóa phiếu xuất kho');
            fetchIssueHistory();
        } catch (e) { message.error('Lỗi xóa phiếu'); }
    };

    const handleLinkIssue = async () => {
        if (!selectedUnlinkedIssue) return message.warning('Vui lòng chọn phiếu xuất kho để liên kết');
        setLoading(true);
        try {
            await api.post(`/inventory/goods-issue/${selectedUnlinkedIssue}/link-po`, { po_id: currentPO.id });
            message.success('Đã liên kết phiếu xuất kho thành công');
            setSelectedUnlinkedIssue(null);
            fetchIssueHistory();
            fetchUnlinkedIssues();
            onRefresh?.();
        } catch (e) {
            message.error('Lỗi liên kết phiếu xuất kho');
        }
        setLoading(false);
    };

    const handleRequestMaterial = async () => {
        if (!requestQty || requestQty <= 0) return message.warning('Vui lòng nhập số lượng hợp lệ');
        const pfoId = currentPO?.items?.[0]?.pfo_id || currentPO?.pfo_id;
        if (!pfoId) return message.error('Không tìm thấy thông tin Lệnh SX');

        try {
            await api.post(`/planning/pfo/${pfoId}/request-material`, {
                material_id: requestMaterial.material_id,
                requested_qty: requestQty,
                note: requestNote
            });
            message.success('Đã gửi yêu cầu bổ sung NPL thành công');
            setRequestModalVisible(false);
            onRefresh?.();
        } catch (e: any) {
            message.error(e.response?.data?.message || 'Lỗi khi gửi yêu cầu bổ sung');
        }
    };

    const totalIssued = new Map<string, number>();
    issueHistory.filter(gi => gi.status !== 'DRAFT' || true).forEach(gi => {
        gi.items?.forEach((item: any) => {
            if (item.material_id || item.product_id) {
                const key = item.product_id ? `PROD_${item.product_id}` : `MAT_${item.material_id}`;
                totalIssued.set(key, (totalIssued.get(key) || 0) + Number(item.quantity));
            }
        });
    });

    return (
        <Modal
            title={<span><CarOutlined style={{ color: '#fa8c16', marginRight: 8 }} />Xuất Kho NPL Gia Công — {currentPO?.po_code}</span>}
            open={open}
            onCancel={onClose}
            width={1200}
            style={{ top: 20 }}
            footer={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Select
                            key="link-select"
                            placeholder="Hoặc chọn PXK cũ để liên kết..."
                            style={{ width: 280, textAlign: 'left' }}
                            allowClear
                            value={selectedUnlinkedIssue}
                            onChange={setSelectedUnlinkedIssue}
                        >
                            {unlinkedIssues.map(gi => (
                                <Select.Option key={gi.id} value={gi.id}>
                                    {gi.code} ({gi.items?.length || 0} NPL)
                                </Select.Option>
                            ))}
                        </Select>
                        <Button key="link-btn" onClick={handleLinkIssue} loading={loading} disabled={!selectedUnlinkedIssue}>
                            Liên kết
                        </Button>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Button key="close" onClick={onClose} size="large">Đóng</Button>
                        <Button key="create" type="primary" onClick={handleCreateIssue} loading={loading} icon={<PlusOutlined />} size="large">
                            Tạo Phiếu Xuất Kho
                        </Button>
                    </div>
                </div>
            }
        >
            {/* 1. Danh sách NPL cần giao */}
            <Divider orientation="left" style={{ margin: '0 0 12px 0', fontSize: 13 }}>NPL cần giao cho Gia Công</Divider>
            <Table
                dataSource={materials}
                rowKey={(r) => r.type === 'SEMI_FINISHED' ? (r.product_id ? `PROD_${r.product_id}` : `BTP_${r.code || r.name}`) : `MAT_${r.material_id}`}
                pagination={false}
                size="middle"
                rowClassName={(r) => r.issue_qty && r.issue_qty > 0 ? 'highlight-row' : ''}
                columns={[
                    { 
                        title: 'Mã', 
                        dataIndex: 'code', 
                        width: 160, 
                        render: (t: any, r: any) => (
                            <Space wrap>
                                <Tag color={r.type === 'SEMI_FINISHED' ? 'purple' : 'geekblue'} style={{ fontWeight: 500 }}>{t || '-'}</Tag>
                                {r.type === 'SEMI_FINISHED' && <Tag color="magenta" style={{ margin: 0, padding: '0 4px', fontSize: 10 }}>BTP</Tag>}
                            </Space>
                        ) 
                    },
                    { 
                        title: 'Tên Nguyên Liệu / BTP', 
                        dataIndex: 'name', 
                        ellipsis: true,
                        render: (text: string, r: any) => {
                            let icon = '📦';
                            if (r.type === 'SEMI_FINISHED') icon = '🧩';
                            else if (r.is_fabric || r.material_category === 'FABRIC') icon = '🧵';
                            else icon = '🔩';
                            return (
                                <div>
                                    <span style={{ fontWeight: 600, color: r.type === 'SEMI_FINISHED' ? '#531dab' : undefined }}>{icon} {text}</span>
                                    {r.from_po_code && (
                                        <div style={{ fontSize: 11, color: '#722ed1', marginTop: 2 }}>
                                            <i>Từ công đoạn trước: {r.from_po_code} {r.from_stage ? `(${r.from_stage})` : ''}</i>
                                        </div>
                                    )}
                                    {r.formula_desc && (
                                        <div style={{ fontSize: 11, color: '#888' }}>
                                            ⚗️ Phối trộn: {r.formula_desc}
                                        </div>
                                    )}
                                </div>
                            );
                        }
                    },
                    { title: 'ĐVT', dataIndex: 'unit', width: 60, align: 'center' as const },
                    {
                        title: 'Loại', width: 140, align: 'center' as const,
                        render: (_: any, r: any, idx: number) => (
                            <Select
                                value={r.material_category || (r.is_fabric ? 'FABRIC' : 'ACCESSORY')}
                                onChange={(v) => {
                                    const newList = [...materials];
                                    newList[idx].material_category = v;
                                    setMaterials(newList);
                                }}
                                options={[
                                    { value: 'FABRIC', label: '🧵 Vải' },
                                    { value: 'ACCESSORY', label: '🔩 Phụ kiện' }
                                ]}
                                style={{ width: 120 }}
                                bordered={false}
                                className="bg-gray-50 rounded"
                            />
                        )
                    },
                    {
                        title: 'Cần (ĐM)', dataIndex: 'quantity', width: 100, align: 'right' as const,
                        render: (v: number) => <b style={{ color: '#1890ff' }}>{Number(v || 0).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}</b>
                    },
                    {
                        title: 'Đã Xuất', width: 150, align: 'center' as const,
                        render: (_: any, r: any) => {
                            const key = r.product_id ? `PROD_${r.product_id}` : `MAT_${r.material_id}`;
                            const issued = totalIssued.get(key) || 0;
                            const needed = Number(r.quantity || 0);
                            const percent = needed > 0 ? Math.round((issued / needed) * 100) : 0;
                            
                            return (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <span style={{ color: issued > 0 ? (percent >= 100 ? '#52c41a' : '#fa8c16') : '#999', fontWeight: 'bold' }}>
                                        {Number(issued).toLocaleString('vi-VN')}
                                    </span>
                                    <Progress percent={percent > 100 ? 100 : percent} size="small" showInfo={false} strokeColor={percent >= 100 ? '#52c41a' : '#fa8c16'} style={{ margin: 0, width: 90 }} />
                                    <span style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{percent}%</span>
                                </div>
                            );
                        }
                    },
                    {
                        title: 'Tồn Kho', dataIndex: 'stock', width: 110, align: 'right' as const, render: (v: number, r: any) => (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <span style={{ color: Number(v) < 0 ? '#cf1322' : '#389e0d', fontWeight: 600, fontSize: 14 }}>
                                    {Number(v || 0).toLocaleString('vi-VN')}
                                </span>
                                {Number(v || 0) < Number(r.quantity || 0) && (
                                    <Button type="primary" danger size="small" style={{ padding: '0 8px', fontSize: 11, marginTop: 4, borderRadius: 4 }} onClick={() => {
                                        setRequestMaterial(r);
                                        setRequestQty(0);
                                        setRequestNote('');
                                        setRequestModalVisible(true);
                                    }}>⚠️ Y/c bổ sung</Button>
                                )}
                            </div>
                        )
                    },
                    {
                        title: 'Xuất lần này', width: 160, align: 'center' as const,
                        render: (_: any, r: any, idx: number) => {
                            const key = r.type === 'SEMI_FINISHED' ? `PROD_${r.product_id}` : `MAT_${r.material_id}`;
                            const issued = totalIssued.get(key) || 0;
                            const needed = Number(r.quantity || 0);
                            let remain = needed - issued;
                            if (remain < 0) remain = 0;

                            const isHighlight = r.issue_qty > 0;

                            return (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: isHighlight ? '#e6f7ff' : 'transparent', padding: '4px 8px', borderRadius: 6, border: isHighlight ? '1px solid #91d5ff' : '1px solid transparent' }}>
                                    <InputNumber
                                        min={0}
                                        placeholder={remain.toString()}
                                        style={{ width: 80, borderColor: isHighlight ? '#1890ff' : undefined }}
                                        value={r.issue_qty}
                                        onChange={(val) => {
                                            const newList = [...materials];
                                            newList[idx].issue_qty = val;
                                            setMaterials(newList);
                                        }}
                                    />
                                    {remain > 0 && (!r.issue_qty || r.issue_qty < remain) && (
                                        <Button type="text" size="small" style={{ color: '#1890ff', padding: 0, fontSize: 12, minWidth: 28, fontWeight: 500 }} onClick={() => {
                                            const newList = [...materials];
                                            newList[idx].issue_qty = remain;
                                            setMaterials(newList);
                                        }}>
                                            Max
                                        </Button>
                                    )}
                                </div>
                            );
                        }
                    }
                ]}
            />

            {/* 2. Thông tin vận chuyển */}
            <div style={{ display: 'flex', gap: 16, marginTop: 12, marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, color: '#888' }}>Chế độ giao</label>
                    <Select
                        value={deliveryMode}
                        onChange={setDeliveryMode}
                        style={{ width: '100%' }}
                        options={[
                            { value: 'PER_ORDER', label: '📦 Theo đơn hàng (Vải/Chần gòn)' },
                            { value: 'BULK', label: '📋 Giao khoán (Phụ kiện)' }
                        ]}
                    />
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, color: '#888' }}>Xe vận chuyển</label>
                    <Input value={vehicle} onChange={e => setVehicle(e.target.value)} placeholder="Biển số / Đơn vị vận chuyển" />
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, color: '#888' }}>Ghi chú</label>
                    <Input value={note} onChange={e => setNote(e.target.value)} placeholder="Ghi chú..." />
                </div>
            </div>

            {/* 3. Lịch sử xuất kho */}
            <Divider orientation="left" style={{ margin: '16px 0 12px 0', fontSize: 13 }}>Lịch sử Phiếu Xuất Kho</Divider>
            {issueHistory.length === 0 ? (
                <Empty description="Chưa có phiếu xuất kho nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
                <Table
                    dataSource={issueHistory}
                    rowKey="id"
                    size="small"
                    pagination={false}
                    columns={[
                        { title: 'Mã PXK', dataIndex: 'code', width: 150, render: (t: any) => <b>{t}</b> },
                        { title: 'Ngày', dataIndex: 'issue_date', width: 100, render: (t: any) => t ? dayjs(t).format('DD/MM/YY') : '-' },
                        {
                            title: 'Chế độ', dataIndex: 'delivery_mode', width: 120, align: 'center' as const,
                            render: (t: string) => t === 'BULK' ? <Tag color="purple">Giao khoán</Tag> : <Tag color="blue">Theo đơn</Tag>
                        },
                        {
                            title: 'SL NPL', width: 80, align: 'center' as const,
                            render: (r: any) => r.items?.length || 0
                        },
                        {
                            title: 'Trạng thái', dataIndex: 'status', width: 120, align: 'center' as const,
                            render: (t: string) => (
                                <Tag color={t === 'DELIVERED' ? 'green' : t === 'CONFIRMED' ? 'blue' : 'default'}>
                                    {t === 'DELIVERED' ? 'Đã giao' : t === 'CONFIRMED' ? 'Đã xuất kho' : 'Nháp'}
                                </Tag>
                            )
                        },
                        { title: 'Xe', dataIndex: 'vehicle', width: 100, ellipsis: true },
                        { title: 'Ghi chú', dataIndex: 'note', ellipsis: true },
                        {
                            title: '', key: 'act', width: 140, align: 'right' as const,
                            render: (r: any) => (
                                <Space size={4}>
                                    {r.status === 'DRAFT' && (
                                        <Popconfirm title="Xác nhận xuất kho? Tồn kho sẽ bị trừ." onConfirm={() => handleConfirmIssue(r.id)}>
                                            <Button size="small" type="primary" icon={<CheckCircleOutlined />}>Xuất</Button>
                                        </Popconfirm>
                                    )}
                                    {r.status === 'CONFIRMED' && (
                                        <Button size="small" icon={<SendOutlined />} onClick={() => handleMarkDelivered(r.id)}>Đã giao</Button>
                                    )}
                                    <Popconfirm title="Xóa phiếu xuất kho này?" okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }} onConfirm={() => handleDeleteIssue(r.id)}>
                                        <Button size="small" danger icon={<DeleteOutlined />} />
                                    </Popconfirm>
                                </Space>
                            )
                        }
                    ]}
                />
            )}
            <Modal
                title="Yêu cầu bổ sung NPL"
                open={requestModalVisible}
                onOk={handleRequestMaterial}
                onCancel={() => setRequestModalVisible(false)}
                okText="Gửi yêu cầu"
                cancelText="Hủy"
                destroyOnClose
            >
                <div style={{ marginBottom: 16 }}>
                    <b>Nguyên phụ liệu: </b> {requestMaterial?.name} ({requestMaterial?.code})
                </div>
                <div style={{ marginBottom: 16 }}>
                    <b>Số lượng cần bổ sung:</b>
                    <InputNumber style={{ width: '100%', marginTop: 8 }} min={1} value={requestQty} onChange={(val) => setRequestQty(Number(val))} />
                </div>
                <div>
                    <b>Ghi chú/Lý do:</b>
                    <Input.TextArea style={{ width: '100%', marginTop: 8 }} rows={3} value={requestNote} onChange={(e) => setRequestNote(e.target.value)} />
                </div>
            </Modal>
        </Modal>
    );
};

export default OutsourcingMaterialIssueModal;
