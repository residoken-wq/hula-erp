import React, { useState, useEffect, useMemo } from 'react';
import { Table, Select, InputNumber, Button, Tag, Space, Typography, Card, Divider } from 'antd';
import { SaveOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

interface PfoProcessRoutingProps {
    pfoId: number;
    existingMilestones?: any[];
    suppliers: any[];
    loading?: boolean;
    onSaveRouting: (routingData: any[]) => void;
}

const PfoProcessRouting: React.FC<PfoProcessRoutingProps> = ({
    existingMilestones = [],
    suppliers = [],
    loading,
    onSaveRouting
}) => {
    const [routingRows, setRoutingRows] = useState<any[]>([]);

    useEffect(() => {
        // Map existing milestones directly since they are now generated from product routings
        setRoutingRows([...existingMilestones]);
    }, [existingMilestones]);

    const handleVendorChange = (id: number, vendorId: number) => {
        const vendorObj = suppliers.find(s => s.id === vendorId);
        const newRows = routingRows.map(row => {
            if (row.id === id) {
                return {
                    ...row,
                    vendor_id: vendorId,
                    vendor_name: vendorObj ? vendorObj.name : ''
                };
            }
            return row;
        });
        setRoutingRows(newRows);
    };

    const handlePriceChange = (id: number, price: number | null) => {
        const newRows = routingRows.map(row => {
            if (row.id === id) {
                return {
                    ...row,
                    unit_price: price || 0
                };
            }
            return row;
        });
        setRoutingRows(newRows);
    };

    const columns = [
        {
            title: 'Công Đoạn Gia Công',
            dataIndex: 'step_name',
            key: 'step_name',
            width: 220,
            render: (text: string) => <Text strong style={{ fontSize: 13, color: '#1f1f1f' }}>{text}</Text>
        },
        {
            title: 'Nhà Gia Công (Xưởng Phụ Trách)',
            key: 'vendor_id',
            render: (_: any, record: any) => (
                <Select
                    showSearch
                    allowClear
                    placeholder="Gõ tìm xưởng gia công..."
                    optionFilterProp="children"
                    style={{ width: '100%' }}
                    value={record.vendor_id}
                    onChange={(val) => handleVendorChange(record.id, val)}
                    filterOption={(input, option) =>
                        String(option?.children || '').toLowerCase().includes(input.toLowerCase())
                    }
                >
                    {suppliers.map(s => (
                        <Option key={s.id} value={s.id}>
                            {s.name} {s.code || s.supplier_code ? `(${s.code || s.supplier_code})` : ''}
                        </Option>
                    ))}
                </Select>
            )
        },
        {
            title: 'SL Kế hoạch',
            dataIndex: 'planned_quantity',
            key: 'planned_quantity',
            width: 120,
            align: 'right' as const,
            render: (val: number) => <Text>{Number(val || 0).toLocaleString()}</Text>
        },
        {
            title: 'Đơn Giá / SP',
            key: 'unit_price',
            width: 140,
            align: 'right' as const,
            render: (_: any, record: any) => (
                <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    step={1000}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value?.replace(/\$\s?|(,*)/g, '') as any}
                    placeholder="Đơn giá"
                    value={record.unit_price}
                    onChange={(val) => handlePriceChange(record.id, val)}
                />
            )
        },
        {
            title: 'Trạng Thái',
            key: 'status',
            width: 130,
            align: 'center' as const,
            render: (_: any, record: any) => record.vendor_id ? (
                <Tag color="blue" icon={<CheckCircleOutlined />}>Đã phân công</Tag>
            ) : (
                <Tag color="default">Chưa gán xưởng</Tag>
            )
        }
    ];

    // Group rows by product
    const groupedRows = useMemo(() => {
        const groups: { [key: number]: any[] } = {};
        const noProduct: any[] = [];

        routingRows.forEach(row => {
            if (row.product_id) {
                if (!groups[row.product_id]) groups[row.product_id] = [];
                groups[row.product_id].push(row);
            } else {
                noProduct.push(row);
            }
        });

        return { groups, noProduct };
    }, [routingRows]);

    return (
        <Card size="small" style={{ borderRadius: 10, background: '#fafafa', border: '1px solid #e8e8e8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                    <Text strong style={{ fontSize: 14, color: '#1d39c4' }}>
                        🏭 Quy Trình Gia Công Đa Công Đoạn (Gate 3 - Multi-Vendor Routing)
                    </Text>
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                        Phân công xưởng cho từng công đoạn của từng sản phẩm.
                    </div>
                </div>
                <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={loading}
                    onClick={() => onSaveRouting(routingRows)}
                    style={{ borderRadius: 6 }}
                >
                    Lưu Phân Công
                </Button>
            </div>

            {Object.keys(groupedRows.groups).map(productIdStr => {
                const rows = groupedRows.groups[Number(productIdStr)];
                const productName = rows[0]?.product_name || `Sản phẩm #${productIdStr}`;
                return (
                    <div key={productIdStr} style={{ marginBottom: 24 }}>
                        <Divider orientation="left" style={{ margin: '12px 0' }}>
                            <Text strong style={{ color: '#096dd9' }}>{productName}</Text>
                        </Divider>
                        <Table
                            dataSource={rows}
                            columns={columns}
                            rowKey="id"
                            pagination={false}
                            size="small"
                            bordered
                            style={{ background: '#fff' }}
                        />
                    </div>
                );
            })}

            {groupedRows.noProduct.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                    <Divider orientation="left" style={{ margin: '12px 0' }}>
                        <Text strong style={{ color: '#096dd9' }}>Công Đoạn Chung (Không gắn sản phẩm cụ thể)</Text>
                    </Divider>
                    <Table
                        dataSource={groupedRows.noProduct}
                        columns={columns}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        bordered
                        style={{ background: '#fff' }}
                    />
                </div>
            )}
        </Card>
    );
};

export default PfoProcessRouting;
