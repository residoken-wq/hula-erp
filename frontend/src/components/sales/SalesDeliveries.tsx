// src/components/sales/SalesDeliveries.tsx
import React, { useEffect, useState } from 'react';
import { Table, Button, Input, Modal, message, InputNumber } from 'antd';
import { CarOutlined, CheckCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_URL } from '../../../../src/config';

interface Props {
    orderId: number;
    orderItems: any[]; // Items gốc của đơn hàng
    onSuccess: () => void;
}

const SalesDeliveries: React.FC<Props> = ({ orderId, orderItems, onSuccess }) => {
    const [history, setHistory] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [shipNote, setShipNote] = useState('');
    const [shipItems, setShipItems] = useState<any[]>([]);

    const fetchHistory = async () => {
        try {
            const res = await axios.get(`${API_URL}/sales/${orderId}/deliveries`);
            setHistory(Array.isArray(res.data) ? res.data : []);
        } catch (e) {}
    };

    useEffect(() => { if (orderId) fetchHistory(); }, [orderId]);

    // Tính toán tiến độ giao hàng
    const summaryData = orderItems.map((item: any) => {
        const ordered = Number(item.quantity) || 0;
        let delivered = 0;
        history.forEach((d: any) => {
            const found = d.items?.find((di: any) => di.sku === item.sku);
            if (found) delivered += Number(found.quantity);
        });
        return { sku: item.sku, ordered, delivered, remaining: ordered - delivered };
    });

    const openModal = () => {
        setShipItems(summaryData.map((d: any) => ({
            sku: d.sku, max: d.remaining, quantity: d.remaining > 0 ? d.remaining : 0
        })));
        setShipNote('');
        setIsModalOpen(true);
    };

    const handleShip = async () => {
        try {
            await axios.post(`${API_URL}/sales/${orderId}/delivery`, {
                code: `DO-${dayjs().format('YYMMDD')}-${Math.floor(Math.random() * 100)}`,
                date: new Date(),
                note: shipNote,
                items: shipItems
            });
            message.success('Đã xuất kho');
            setIsModalOpen(false); fetchHistory(); onSuccess();
        } catch (e) { message.error('Lỗi xuất kho'); }
    };

    return (
        <div>
            <div style={{ marginBottom: 20, background: '#f0f5ff', padding: 10, borderRadius: 6, border: '1px solid #adc6ff' }}>
                <div style={{ fontWeight: 'bold', marginBottom: 5, color: '#1d39c4' }}>Tiến độ giao hàng:</div>
                <Table dataSource={summaryData} rowKey="sku" pagination={false} size="small" bordered
                    columns={[
                        { title: 'SKU', dataIndex: 'sku' },
                        { title: 'SL Đặt', dataIndex: 'ordered', align: 'center' },
                        { title: 'Đã giao', dataIndex: 'delivered', align: 'center', render: (v: any) => <b style={{ color: 'green' }}>{v}</b> },
                        { title: 'Còn lại', dataIndex: 'remaining', align: 'center', render: (v: any) => v > 0 ? <b style={{ color: 'red' }}>{v}</b> : <CheckCircleOutlined style={{ color: 'green' }} /> }
                    ]}
                />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <b>Lịch sử phiếu giao:</b>
                <Button type="primary" icon={<CarOutlined />} onClick={openModal}>Tạo Phiếu Giao</Button>
            </div>
            <Table dataSource={history} rowKey="id" pagination={false} size="small" bordered columns={[
                { title: 'Mã phiếu', dataIndex: 'code', render: (t: any) => <b>{t}</b> },
                { title: 'Ngày giao', render: (r: any) => dayjs(r.delivery_date).format('DD/MM/YYYY') },
                { title: 'Ghi chú', dataIndex: 'note' },
                { title: 'Chi tiết', render: (r: any) => r.items?.map((i: any) => `${i.sku} (x${i.quantity})`).join(', ') }
            ]} />

            <Modal title="Tạo Phiếu Xuất Kho" open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={handleShip} width={600}>
                <Input placeholder="Ghi chú giao hàng..." value={shipNote} onChange={e => setShipNote(e.target.value)} style={{ marginBottom: 10 }} />
                <Table dataSource={shipItems} rowKey="sku" pagination={false} size="small" columns={[
                    { title: 'SKU', dataIndex: 'sku' },
                    { title: 'SL Còn', dataIndex: 'max' },
                    { title: 'Giao lần này', render: (_: any, r: any, idx: number) => (<InputNumber max={r.max} min={0} value={r.quantity} onChange={(v: any) => { const newItems = [...shipItems]; newItems[idx].quantity = v; setShipItems(newItems); }} />) }
                ]} />
            </Modal>
        </div>
    );
};
export default SalesDeliveries;