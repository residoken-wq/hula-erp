import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, message, Modal, Tooltip } from 'antd';
import { ReloadOutlined, UndoOutlined } from '@ant-design/icons';
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
        { title: 'SKU', dataIndex: 'sku', width: 120 },
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

    return (
        <div>
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span>Tổng: <b>{totalBookings}</b></span>
                    <span>Chờ duyệt: <Tag color="orange">{pendingCount}</Tag></span>
                    <span>Đã duyệt: <Tag color="green">{confirmedCount}</Tag></span>
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
            />
        </div>
    );
};

export default BookingListTab;
