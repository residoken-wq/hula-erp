import React, { useEffect, useState } from 'react';
import { Table, Button, Input, Modal, message, InputNumber, Tooltip, Select, DatePicker } from 'antd';
import { CarOutlined, CheckCircleOutlined, PrinterOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_URL } from '../../config';

interface Props {
    order: any;
    products: any[];
    customers?: any[];
    onSuccess: () => void;
}

const SalesDeliveries: React.FC<Props> = ({ order, products, customers = [], onSuccess }) => {
    const [history, setHistory] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [shipNote, setShipNote] = useState('');
    const [shipItems, setShipItems] = useState<any[]>([]);

    // Additional Ship Info state
    const [shipDate, setShipDate] = useState<any>(dayjs());
    const [shipAddress, setShipAddress] = useState<string>('');
    const [shipContactName, setShipContactName] = useState<string>('');
    const [shipContactPhone, setShipContactPhone] = useState<string>('');

    // RESOLVE FULL CUSTOMER (to get contacts)
    const fullCustomer = customers.find(c => c.id === order?.customer?.id || c.id === order?.customer_id) || order?.customer || {};
    const contactList = fullCustomer?.contacts || [];

    const fetchHistory = async () => {
        try {
            const res = await axios.get(`${API_URL}/sales/${order.id}/deliveries`);
            setHistory(Array.isArray(res.data) ? res.data : []);
        } catch (e) { }
    };

    useEffect(() => { if (order?.id) fetchHistory(); }, [order?.id]);

    // Use order.items for ordered quantities
    const summaryData = (order.items || []).map((item: any) => {
        const ordered = Number(item.quantity) || 0;
        const price = Number(item.unit_price) || 0;

        let delivered = 0;
        history.forEach((d: any) => {
            const found = d.items?.find((di: any) => di.sku === item.sku);
            if (found) delivered += Number(found.quantity);
        });

        const remaining = ordered - delivered;

        return {
            sku: item.sku,
            ordered,
            delivered,
            remaining,
            totalVal: ordered * price,
            deliveredVal: delivered * price,
            remainingVal: remaining * price
        };
    });

    const openModal = () => {
        setShipItems(summaryData.map((d: any) => ({
            sku: d.sku, max: d.remaining, quantity: d.remaining > 0 ? d.remaining : 0
        })));
        setShipNote('');

        // Auto-fill defaults
        setShipDate(dayjs());
        setShipAddress(order.shipping_address || fullCustomer?.address || '');
        setShipContactName(order.receiver_name || contactList[0]?.full_name || fullCustomer?.name || '');
        setShipContactPhone(order.receiver_phone || contactList[0]?.phone || fullCustomer?.phone || '');

        setIsModalOpen(true);
    };

    // ... (Hooks and other functions remain same) ...

    return (
        <div>
            <div style={{ marginBottom: 20, background: '#f0f5ff', padding: 10, borderRadius: 6, border: '1px solid #adc6ff' }}>
                <div style={{ fontWeight: 'bold', marginBottom: 5, color: '#1d39c4' }}>Tiến độ giao hàng:</div>
                <Table dataSource={summaryData} rowKey="sku" pagination={false} size="small" bordered
                    columns={[
                        { title: 'SKU', dataIndex: 'sku' },
                        { title: 'SL Đặt', dataIndex: 'ordered', align: 'center', width: 70 },
                        { title: 'Đã giao', dataIndex: 'delivered', align: 'center', width: 70, render: (v: any) => <b style={{ color: 'green' }}>{v}</b> },
                        { title: 'Còn lại', dataIndex: 'remaining', align: 'center', width: 70, render: (v: any) => v > 0 ? <b style={{ color: 'red' }}>{v}</b> : <CheckCircleOutlined style={{ color: 'green' }} /> },

                        { title: 'Tổng tiền hàng', dataIndex: 'totalVal', align: 'right', render: (v: number) => v.toLocaleString() },
                        { title: 'Đã giao (đ)', dataIndex: 'deliveredVal', align: 'right', render: (v: number) => <span style={{ color: 'green' }}>{v.toLocaleString()}</span> },
                        { title: 'Còn lại (đ)', dataIndex: 'remainingVal', align: 'right', render: (v: number) => <span style={{ color: 'red', fontWeight: 'bold' }}>{v.toLocaleString()}</span> },
                    ]}
                />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <b>Lịch sử phiếu giao:</b>
                <Button type="primary" icon={<CarOutlined />} onClick={openModal}>Tạo Phiếu Xuất Kho</Button>
            </div>
            <Table dataSource={history} rowKey="id" pagination={false} size="small" bordered columns={[
                { title: 'Mã phiếu', dataIndex: 'code', render: (t: any) => <b>{t}</b> },
                { title: 'Ngày giao', render: (r: any) => dayjs(r.delivery_date).format('DD/MM/YYYY') },
                { title: 'Người công trình', render: (r) => (r.contact_name ? <span>{r.contact_name} <br /><small>{r.contact_phone}</small></span> : '-') },
                { title: 'Chi tiết', width: '30%', render: (r: any) => r.items?.map((i: any) => `${i.sku} (x${i.quantity})`).join(', ') },
                {
                    title: '', width: 60, align: 'center', render: (_: any, r: any) => (
                        <Tooltip title="In Phiếu Xuất Kho">
                            <Button size="small" icon={<PrinterOutlined />} onClick={() => handlePrint(r)} />
                        </Tooltip>
                    )
                }
            ]} />

            <Modal title="Tạo Phiếu Xuất Kho" open={isModalOpen} onCancel={() => setIsModalOpen(false)} onOk={handleShip} width={600}>
                {/* DATE SELECTION */}
                <div style={{ marginBottom: 10 }}>
                    <div style={{ fontWeight: 500 }}>Ngày xuất kho:</div>
                    <DatePicker format="DD/MM/YYYY" value={shipDate} onChange={setShipDate} style={{ width: '100%' }} />
                </div>

                {/* ADDRESS SELECTION */}
                <div style={{ marginBottom: 10 }}>
                    <div style={{ fontWeight: 500 }}>Chọn Chi Nhánh / Địa chỉ giao hàng:</div>
                    <Select
                        style={{ width: '100%' }}
                        value={shipAddress}
                        onChange={setShipAddress}
                        placeholder="Chọn địa chỉ giao hàng"
                        options={[
                            { value: fullCustomer?.address || '', label: `Mặc định: ${fullCustomer?.address || 'Chưa cập nhật'}` },
                            ...(fullCustomer?.delivery_addresses || []).map((addr: any) => ({
                                value: addr.address, label: `${addr.name || 'CN'} - ${addr.address}`
                            }))
                        ]}
                    />
                    <Input
                        style={{ marginTop: 5 }}
                        placeholder="Hoặc nhập địa chỉ khác..."
                        value={shipAddress}
                        onChange={e => setShipAddress(e.target.value)}
                    />
                </div>

                {/* CONTACT SELECTION */}
                <div style={{ marginBottom: 10 }}>
                    <div style={{ fontWeight: 500 }}>Người liên hệ nhận hàng:</div>
                    <Select
                        style={{ width: '100%' }}
                        placeholder="Chọn người liên hệ"
                        value={shipContactName}
                        onChange={(val) => {
                            // Find contact to auto-fill Phone
                            const contact = contactList.find((c: any) => c.full_name === val);
                            setShipContactName(val);
                            if (contact) setShipContactPhone(contact.phone);
                        }}
                        options={[
                            ...(contactList).map((c: any) => ({
                                value: c.full_name, label: `${c.full_name} - ${c.position || ''} (${c.phone})`
                            }))
                        ]}
                    />
                    <div style={{ display: 'flex', gap: 10, marginTop: 5 }}>
                        <Input placeholder="Tên người nhận" value={shipContactName} onChange={e => setShipContactName(e.target.value)} />
                        <Input placeholder="SĐT Liên hệ" value={shipContactPhone} onChange={e => setShipContactPhone(e.target.value)} />
                    </div>
                </div>

                <Input.TextArea rows={2} placeholder="Ghi chú giao hàng..." value={shipNote} onChange={e => setShipNote(e.target.value)} style={{ marginBottom: 10 }} />

                <div style={{ fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>Danh sách xuất:</div>
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