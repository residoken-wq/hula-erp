import React, { useState } from 'react';
import { Modal, Table, Button, Tag } from 'antd';
import { CheckCircleOutlined, InfoCircleOutlined, AppstoreOutlined } from '@ant-design/icons';

interface BookingApprovalModalProps {
    open: boolean;
    planName: string;
    items: any[];
    loading: boolean;
    onCancel: () => void;
    onConfirm: (itemIds?: number[]) => void;
}

const BookingApprovalModal: React.FC<BookingApprovalModalProps> = ({
    open,
    planName,
    items,
    loading,
    onCancel,
    onConfirm,
}) => {
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    const columns = [
        {
            title: 'Mã Đơn',
            dataIndex: 'order_code',
            key: 'order_code',
            render: (text: string) => <b>{text}</b>,
        },
        {
            title: 'Khách hàng',
            dataIndex: 'customer_name',
            key: 'customer_name',
        },
        {
            title: 'Sản phẩm (SKU)',
            dataIndex: 'sku',
            key: 'sku',
            render: (text: string, record: any) => (
                <div>
                    <div>
                        {record.product_type === 'COMBO' && <AppstoreOutlined style={{ color: '#722ed1', marginRight: 4 }} />}
                        <b>{text}</b>
                        {record.product_type === 'COMBO' && <Tag color="purple" style={{ margin: '0 0 0 6px', fontSize: 10, lineHeight: '16px', padding: '0 4px' }}>COMBO</Tag>}
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>{record.product_name}</div>
                </div>
            )
        },
        {
            title: 'Số lượng',
            dataIndex: 'quantity',
            key: 'quantity',
            align: 'center' as const,
        },
        {
            title: 'Trạng thái Book',
            dataIndex: 'booking_status',
            key: 'booking_status',
            align: 'center' as const,
            render: (status: string) => {
                if (status === 'CONFIRMED') return <Tag color="green">Đã duyệt (CONFIRMED)</Tag>;
                if (status === 'TEMPORARY') return <Tag color="orange">Chờ duyệt (TEMPORARY)</Tag>;
                return <Tag>Chưa book</Tag>;
            }
        }
    ];

    return (
        <Modal
            title={`Duyệt Book - ${planName}`}
            open={open}
            onCancel={onCancel}
            width={900}
            footer={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ color: '#666', fontSize: 13 }}>
                        <InfoCircleOutlined /> Chỉ các mục "Chờ duyệt (TEMPORARY)" mới có thể duyệt.
                    </div>
                    <div>
                        <Button onClick={onCancel} style={{ marginRight: 8 }}>Hủy</Button>
                        <Button 
                            type="primary" 
                            ghost
                            disabled={selectedRowKeys.length === 0}
                            loading={loading}
                            onClick={() => onConfirm(selectedRowKeys as number[])}
                            style={{ marginRight: 8 }}
                        >
                            Duyệt ({selectedRowKeys.length}) mục đã chọn
                        </Button>
                        <Button 
                            type="primary" 
                            icon={<CheckCircleOutlined />} 
                            loading={loading}
                            onClick={() => onConfirm()} // undefined means all
                        >
                            Duyệt TẤT CẢ (TEMPORARY)
                        </Button>
                    </div>
                </div>
            }
        >
            <Table
                dataSource={items}
                columns={columns}
                rowKey="id"
                size="small"
                pagination={false}
                scroll={{ y: 400 }}
                expandable={{
                    expandedRowRender: (record: any) => {
                        if (!record.combo_components?.length) return null;
                        return (
                            <div style={{ padding: '4px 0 4px 10px', background: '#fafafa' }}>
                                <div style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 4, color: '#722ed1' }}>
                                    <AppstoreOutlined /> Thành phần Combo:
                                </div>
                                {record.combo_components.map((c: any, idx: number) => (
                                    <div key={idx} style={{ fontSize: 12, padding: '2px 0', color: '#555' }}>
                                        • <b>{c.sku}</b> — {c.name} <span style={{ color: '#888' }}>(x{c.quantity_per_combo})</span> → Cần: <b>{c.total_needed}</b>
                                    </div>
                                ))}
                            </div>
                        );
                    },
                    rowExpandable: (record: any) => record.product_type === 'COMBO' && record.combo_components?.length > 0,
                }}
                rowSelection={{
                    selectedRowKeys,
                    onChange: (keys) => setSelectedRowKeys(keys),
                    getCheckboxProps: (record) => ({
                        disabled: record.booking_status !== 'TEMPORARY',
                    }),
                }}
            />
        </Modal>
    );
};

export default BookingApprovalModal;
