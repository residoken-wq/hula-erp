import React, { useEffect, useState } from 'react';
import { Modal, Table, Tag, Button, Space, InputNumber, Input, Select, DatePicker, Divider, message, Popconfirm, Empty } from 'antd';
import { CarOutlined, PlusOutlined, CheckCircleOutlined, DeleteOutlined, SendOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_URL } from '../../config';

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

    useEffect(() => {
        if (open && currentPO?.id) {
            fetchMaterials();
            fetchIssueHistory();
        }
    }, [open, currentPO?.id]);

    const fetchMaterials = async () => {
        try {
            const res = await axios.get(`${API_URL}/purchasing/${currentPO.id}/outsourcing-materials`);
            setMaterials(res.data.map((m: any) => ({ ...m, issue_qty: 0 })));
        } catch (e) { message.error('Lỗi tải thông tin NPL'); }
    };

    const fetchIssueHistory = async () => {
        try {
            const res = await axios.get(`${API_URL}/inventory/goods-issue?po_id=${currentPO.id}`);
            setIssueHistory(Array.isArray(res.data) ? res.data : []);
        } catch (e) { console.error('Error fetching issue history', e); }
    };

    const handleCreateIssue = async () => {
        const validItems = materials.filter(m => Number(m.issue_qty || 0) > 0);
        if (validItems.length === 0) return message.warning('Vui lòng nhập số lượng NPL cần xuất');

        setLoading(true);
        try {
            await axios.post(`${API_URL}/inventory/goods-issue`, {
                type: 'OUTSOURCING',
                delivery_mode: deliveryMode,
                po_id: currentPO.id,
                supplier_id: currentPO.supplier?.id,
                plan_id: currentPO.items?.[0]?.plan_id,
                vehicle,
                note: note || `Xuất NPL cho GC ${currentPO.po_code}`,
                items: validItems.map(m => ({
                    material_id: m.material_id,
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
            await axios.post(`${API_URL}/inventory/goods-issue/${issueId}/confirm`);
            message.success('Đã xác nhận xuất kho — Tồn kho đã cập nhật');
            fetchIssueHistory();
            onRefresh?.();
        } catch (e) { message.error('Lỗi xác nhận'); }
    };

    const handleMarkDelivered = async (issueId: number) => {
        try {
            await axios.post(`${API_URL}/inventory/goods-issue/${issueId}/delivered`);
            message.success('Đã đánh dấu giao xong');
            fetchIssueHistory();
        } catch (e) { message.error('Lỗi cập nhật'); }
    };

    const handleDeleteIssue = async (issueId: number) => {
        try {
            await axios.delete(`${API_URL}/inventory/goods-issue/${issueId}`);
            message.success('Đã xóa phiếu xuất kho');
            fetchIssueHistory();
        } catch (e) { message.error('Lỗi xóa phiếu'); }
    };

    // Tổng đã xuất per material
    const totalIssued = new Map<number, number>();
    issueHistory.filter(gi => gi.status !== 'DRAFT' || true).forEach(gi => {
        gi.items?.forEach((item: any) => {
            if (item.material_id) {
                totalIssued.set(item.material_id, (totalIssued.get(item.material_id) || 0) + Number(item.quantity));
            }
        });
    });

    return (
        <Modal
            title={<span><CarOutlined style={{ color: '#fa8c16', marginRight: 8 }} />Xuất Kho NPL Gia Công — {currentPO?.po_code}</span>}
            open={open}
            onCancel={onClose}
            width={1100}
            style={{ top: 20 }}
            footer={[
                <Button key="close" onClick={onClose}>Đóng</Button>,
                <Button key="create" type="primary" onClick={handleCreateIssue} loading={loading} icon={<PlusOutlined />}>
                    Tạo Phiếu Xuất Kho
                </Button>
            ]}
        >
            {/* 1. Danh sách NPL cần giao */}
            <Divider orientation="left" style={{ margin: '0 0 12px 0', fontSize: 13 }}>NPL cần giao cho Gia Công</Divider>
            <Table
                dataSource={materials}
                rowKey="material_id"
                pagination={false}
                size="small"
                columns={[
                    { title: 'Mã NPL', dataIndex: 'code', width: 100, render: (t: any) => <Tag>{t || '-'}</Tag> },
                    { title: 'Tên Nguyên Liệu', dataIndex: 'name', ellipsis: true },
                    { title: 'ĐVT', dataIndex: 'unit', width: 60, align: 'center' as const },
                    {
                        title: 'Loại', width: 100, align: 'center' as const,
                        render: (_: any, r: any, idx: number) => (
                            <Select
                                size="small"
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
                                style={{ width: 90 }}
                            />
                        )
                    },
                    {
                        title: 'Cần (ĐM)', dataIndex: 'quantity', width: 100, align: 'right' as const,
                        render: (v: number) => <b style={{ color: '#1890ff' }}>{Number(v || 0).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}</b>
                    },
                    {
                        title: 'Đã Xuất', width: 80, align: 'right' as const,
                        render: (_: any, r: any) => {
                            const issued = totalIssued.get(r.material_id) || 0;
                            return <span style={{ color: issued > 0 ? '#52c41a' : '#999' }}>{Number(issued).toLocaleString('vi-VN')}</span>;
                        }
                    },
                    { title: 'Tồn Kho', dataIndex: 'stock', width: 80, align: 'right' as const, render: (v: number) => <span style={{ color: Number(v) < 0 ? 'red' : 'green' }}>{Number(v || 0).toLocaleString('vi-VN')}</span> },
                    {
                        title: 'Xuất lần này', width: 120, align: 'center' as const,
                        render: (_: any, r: any, idx: number) => (
                            <InputNumber
                                size="small"
                                min={0}
                                placeholder="0"
                                style={{ width: 100 }}
                                value={r.issue_qty}
                                onChange={(val) => {
                                    const newList = [...materials];
                                    newList[idx].issue_qty = val;
                                    setMaterials(newList);
                                }}
                            />
                        )
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
                                        <>
                                            <Popconfirm title="Xác nhận xuất kho? Tồn kho sẽ bị trừ." onConfirm={() => handleConfirmIssue(r.id)}>
                                                <Button size="small" type="primary" icon={<CheckCircleOutlined />}>Xuất</Button>
                                            </Popconfirm>
                                            <Popconfirm title="Xóa phiếu?" onConfirm={() => handleDeleteIssue(r.id)}>
                                                <Button size="small" danger icon={<DeleteOutlined />} />
                                            </Popconfirm>
                                        </>
                                    )}
                                    {r.status === 'CONFIRMED' && (
                                        <Button size="small" icon={<SendOutlined />} onClick={() => handleMarkDelivered(r.id)}>Đã giao</Button>
                                    )}
                                </Space>
                            )
                        }
                    ]}
                />
            )}
        </Modal>
    );
};

export default OutsourcingMaterialIssueModal;
