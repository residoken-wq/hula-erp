import React, { useState } from 'react';
import { Table, Button, Tag, Space, Modal, message, DatePicker, Input } from 'antd';
import { AlertOutlined, TruckOutlined, FilterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import api from '../../utils/api';

dayjs.extend(isBetween);
const { RangePicker } = DatePicker;

interface PendingOrdersTabProps {
    pendingOrders: any[];
    selectedRowKeys: React.Key[];
    onSelectedRowKeysChange: (keys: React.Key[]) => void;
    onCreatePlan: () => void;
    isMobile: boolean;
    loading: boolean;
    setLoading: (v: boolean) => void;
    onRefresh: () => void;
}

const PendingOrdersTab: React.FC<PendingOrdersTabProps> = ({
    pendingOrders, selectedRowKeys, onSelectedRowKeysChange, onCreatePlan, isMobile, loading, setLoading, onRefresh
}) => {
    const [deliveryDateRange, setDeliveryDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
    const [customerSearch, setCustomerSearch] = useState('');

    const handleFulfillStock = async (order: any) => {
        Modal.confirm({
            title: `Xuất kho cho đơn ${order.order_code}?`,
            content: (
                <div>
                    <p>Hệ thống sẽ tạo Phiếu Xuất Kho cho toàn bộ sản phẩm trong đơn hàng.</p>
                    <p><b>Lưu ý:</b> Đơn hàng sẽ chuyển sang trạng thái "Đang giao" và rời khỏi danh sách chờ Lập Kế Hoạch.</p>
                </div>
            ),
            onOk: async () => {
                setLoading(true);
                try {
                    const deliveryItems = order.items.map((i: any) => ({
                        sku: i.sku,
                        quantity: i.quantity,
                        note: 'Xuất kho từ Lập Kế Hoạch'
                    }));
                    const payload = {
                        code: `PX-${order.order_code}-${dayjs().format('HHmm')}`,
                        date: new Date().toISOString(),
                        note: 'Xuất nhanh từ Planning Center (Có sẵn tồn kho)',
                        delivery_address: order.shipping_address,
                        contact_name: order.receiver_name,
                        contact_phone: order.receiver_phone,
                        items: deliveryItems
                    };
                    await api.post(`/sales/${order.id}/delivery`, payload);
                    message.success('Đã tạo phiếu xuất kho thành công');
                    onRefresh();
                } catch (e) {
                    message.error('Lỗi khi xuất kho');
                }
                setLoading(false);
            }
        });
    };

    const pendingColumns = [
        { title: 'Mã Đơn', dataIndex: 'order_code', render: (t: any) => <b>{t}</b> },
        { title: 'Khách Hàng', dataIndex: 'customer_name' },
        {
            title: 'Trạng Thái', dataIndex: 'status',
            render: (t: any, r: any) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <Tag>{t}</Tag>
                    {r.can_fulfill_stock && <Tag color="green">Sẵn sàng xuất kho</Tag>}
                </div>
            )
        },
        { title: 'Ngày Giao', dataIndex: 'delivery_date', render: (t: any) => t ? <Tag color="red">{dayjs(t).format('DD/MM/YYYY')}</Tag> : '-' },
        { title: 'Giá Trị', dataIndex: 'total_amount', align: 'right' as const, render: (v: any) => Number(v).toLocaleString() },
        {
            title: 'Hành động',
            align: 'center' as const,
            render: (_: any, r: any) => (
                r.can_fulfill_stock && (
                    <Button type="primary" size="small" icon={<TruckOutlined />} onClick={() => handleFulfillStock(r)} style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}>Xuất Kho</Button>
                )
            )
        }
    ];

    const expandedRowRender = (record: any) => (
        <Table
            dataSource={record.items}
            rowKey="id"
            pagination={false}
            size="small"
            columns={[
                { title: 'Sản phẩm', dataIndex: ['product', 'name'], render: (t: any, r: any) => <span><b>{r.sku}</b> - {t || r.sku}</span> },
                { title: 'Số lượng đặt', dataIndex: 'quantity', align: 'center' as const },
                {
                    title: 'Tồn kho khả dụng',
                    dataIndex: 'available_stock_tp',
                    align: 'center' as const,
                    render: (v: any, r: any) => (
                        <span style={{ color: v >= r.quantity ? 'green' : 'red', fontWeight: 'bold' }}>
                            {v} {v >= r.quantity ? '(Đủ)' : '(Thiếu)'}
                        </span>
                    )
                }
            ]}
        />
    );

    const filteredOrders = pendingOrders.filter(o => {
        let matchDate = true;
        if (deliveryDateRange && deliveryDateRange[0] && deliveryDateRange[1]) {
            if (!o.delivery_date) matchDate = false;
            else matchDate = dayjs(o.delivery_date).isBetween(deliveryDateRange[0], deliveryDateRange[1], 'day', '[]');
        }
        
        let matchCustomer = true;
        if (customerSearch) {
            matchCustomer = o.customer_name?.toLowerCase().includes(customerSearch.toLowerCase()) || o.order_code?.toLowerCase().includes(customerSearch.toLowerCase());
        }

        return matchDate && matchCustomer;
    });

    return (
        <div>
            <div style={{ marginBottom: 10, background: '#fffbe6', padding: 10, borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <span><AlertOutlined /> Chọn đơn hàng để lập kế hoạch.</span>
                <Space wrap>
                    <Input.Search 
                        placeholder="Tìm KH hoặc Mã SO..." 
                        allowClear
                        size="small"
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        style={{ width: isMobile ? '100%' : 200 }}
                    />
                    <FilterOutlined style={{ color: '#1890ff' }} />
                    <span style={{ fontSize: 13 }}>Lọc ngày giao:</span>
                    <RangePicker
                        size="small"
                        format="DD/MM/YYYY"
                        value={deliveryDateRange}
                        onChange={(dates) => setDeliveryDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
                        allowClear
                        placeholder={['Từ ngày', 'Đến ngày']}
                        style={{ width: isMobile ? '100%' : 240 }}
                    />
                </Space>
            </div>
            <Table
                rowSelection={{ selectedRowKeys, onChange: (keys) => onSelectedRowKeysChange(keys) }}
                dataSource={filteredOrders}
                columns={pendingColumns}
                rowKey="id"
                expandable={{ expandedRowRender }}
                scroll={{ x: isMobile ? 600 : undefined }}
                footer={() => (<Button type="primary" disabled={selectedRowKeys.length === 0} onClick={onCreatePlan}>Lập Kế Hoạch</Button>)}
            />
        </div>
    );
};

export default PendingOrdersTab;
