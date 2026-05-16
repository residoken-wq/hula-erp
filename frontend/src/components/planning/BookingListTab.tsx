import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, message, Modal, Tooltip } from 'antd';
import { ReloadOutlined, UndoOutlined, AppstoreOutlined } from '@ant-design/icons';
import api from '../../utils/api';
import dayjs from 'dayjs';

interface BookingListTabProps {
    isMobile: boolean;
}

const BookingListTab: React.FC<BookingListTabProps> = ({ isMobile }) => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const res = await api.get('/planning/bookings');
            setData(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            message.error('Lỗi tải danh sách booking');
        }
        setLoading(false);
    };

    useEffect(() => { fetchBookings(); }, []);

    const handleRevert = (itemId: number, sku: string) => {
        Modal.confirm({
            title: 'Chuyển lại trạng thái Chờ duyệt?',
            content: `Booking của sản phẩm ${sku} sẽ chuyển từ "Đã duyệt" về "Chờ duyệt". Chỉ thực hiện được nếu chưa xuất kho.`,
            okText: 'Xác nhận',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await api.post(`/planning/bookings/${itemId}/revert`);
                    message.success('Đã chuyển về trạng thái Chờ duyệt');
                    fetchBookings();
                } catch (e: any) {
                    message.error(e.response?.data?.message || 'Lỗi revert booking');
                }
            }
        });
    };

    const columns = [
        {
            title: 'Mã KH SX', dataIndex: 'plan_code', width: 120,
            render: (t: string) => t ? <Tag color="blue">{t}</Tag> : <Tag>Chưa gắn</Tag>
        },
        {
            title: 'Mã SO', dataIndex: 'order_code', width: 130,
            render: (t: string) => <b>{t}</b>
        },
        {
            title: 'SKU', dataIndex: 'sku', width: 140,
            render: (t: string, r: any) => (
                <span>
                    {r.product_type === 'COMBO' && <AppstoreOutlined style={{ color: '#722ed1', marginRight: 4 }} />}
                    {t}
                    {r.product_type === 'COMBO' && <Tag color="purple" style={{ margin: '0 0 0 4px', fontSize: 10, lineHeight: '16px', padding: '0 3px' }}>COMBO</Tag>}
                </span>
            )
        },
        {
            title: 'Sản phẩm', dataIndex: 'product_name', width: 200,
            ellipsis: true
        },
        { title: 'Khách hàng', dataIndex: 'customer_name', width: 180, ellipsis: true },
        {
            title: 'Ngày giao', dataIndex: 'delivery_date', width: 110,
            render: (d: string) => d ? dayjs(d).format('DD/MM/YYYY') : '-'
        },
        { title: 'NV Sale', dataIndex: 'assigned_to_name', width: 130 },
        {
            title: 'SL Book', dataIndex: 'booked_quantity', width: 80, align: 'center' as const,
            render: (v: number) => Number(v || 0).toLocaleString()
        },
        {
            title: 'Trạng thái', dataIndex: 'booking_status', width: 130, align: 'center' as const,
            render: (s: string) => {
                if (s === 'CONFIRMED') return <Tag color="green">Đã duyệt</Tag>;
                if (s === 'TEMPORARY') return <Tag color="orange">Chờ duyệt</Tag>;
                return <Tag>{s}</Tag>;
            },
            filters: [
                { text: 'Chờ duyệt', value: 'TEMPORARY' },
                { text: 'Đã duyệt', value: 'CONFIRMED' },
            ],
            onFilter: (value: any, record: any) => record.booking_status === value,
        },
        {
            title: 'Hết hạn', dataIndex: 'booking_expires_at', width: 110,
            render: (d: string) => {
                if (!d) return '-';
                const exp = dayjs(d);
                const isExpired = exp.isBefore(dayjs());
                return <span style={{ color: isExpired ? 'red' : '#888' }}>{exp.format('DD/MM HH:mm')}</span>;
            }
        },
        {
            title: '', key: 'action', width: 60, align: 'center' as const,
            render: (_: any, record: any) => {
                if (record.booking_status === 'CONFIRMED') {
                    return (
                        <Tooltip title="Chuyển về Chờ duyệt">
                            <Button
                                icon={<UndoOutlined />}
                                size="small"
                                danger
                                onClick={() => handleRevert(record.id, record.sku)}
                            />
                        </Tooltip>
                    );
                }
                return null;
            }
        }
    ];

    // Summary stats
    const totalBookings = data.length;
    const pendingCount = data.filter(d => d.booking_status === 'TEMPORARY').length;
    const confirmedCount = data.filter(d => d.booking_status === 'CONFIRMED').length;
    const comboCount = data.filter(d => d.product_type === 'COMBO').length;

    return (
        <div>
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span>Tổng: <b>{totalBookings}</b></span>
                    <span>Chờ duyệt: <Tag color="orange">{pendingCount}</Tag></span>
                    <span>Đã duyệt: <Tag color="green">{confirmedCount}</Tag></span>
                    {comboCount > 0 && <span>Combo: <Tag color="purple">{comboCount}</Tag></span>}
                </div>
                <Button icon={<ReloadOutlined />} onClick={fetchBookings} size="small">Làm mới</Button>
            </div>
            <Table
                dataSource={data}
                columns={columns}
                rowKey="id"
                size="small"
                loading={loading}
                pagination={{ pageSize: 20 }}
                scroll={{ x: isMobile ? 900 : 1200 }}
                expandable={{
                    expandedRowRender: (record: any) => {
                        if (!record.combo_components?.length) return null;
                        return (
                            <div style={{ padding: '4px 0 4px 10px', background: '#fafafa' }}>
                                <div style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 4, color: '#722ed1' }}>
                                    <AppstoreOutlined /> Thành phần Combo ({record.combo_components.length} SP con):
                                </div>
                                <table style={{ width: '100%', maxWidth: 500, fontSize: 12, borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: '#f0f0f0' }}>
                                            <th style={{ padding: '3px 8px', textAlign: 'left', border: '1px solid #e8e8e8' }}>SKU Con</th>
                                            <th style={{ padding: '3px 8px', textAlign: 'left', border: '1px solid #e8e8e8' }}>Tên SP</th>
                                            <th style={{ padding: '3px 8px', textAlign: 'center', border: '1px solid #e8e8e8' }}>SL/Combo</th>
                                            <th style={{ padding: '3px 8px', textAlign: 'center', border: '1px solid #e8e8e8' }}>Cần</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {record.combo_components.map((c: any, idx: number) => (
                                            <tr key={idx}>
                                                <td style={{ padding: '3px 8px', border: '1px solid #e8e8e8', fontWeight: 500 }}>{c.sku}</td>
                                                <td style={{ padding: '3px 8px', border: '1px solid #e8e8e8' }}>{c.name}</td>
                                                <td style={{ padding: '3px 8px', textAlign: 'center', border: '1px solid #e8e8e8' }}>x{c.quantity_per_combo}</td>
                                                <td style={{ padding: '3px 8px', textAlign: 'center', border: '1px solid #e8e8e8', fontWeight: 'bold' }}>{c.total_needed}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        );
                    },
                    rowExpandable: (record: any) => record.product_type === 'COMBO' && record.combo_components?.length > 0,
                }}
            />
        </div>
    );
};

export default BookingListTab;
