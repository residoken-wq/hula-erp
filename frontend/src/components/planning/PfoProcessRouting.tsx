import React, { useState, useEffect } from 'react';
import { Table, Select, InputNumber, Button, Tag, Space, Typography, Card, message } from 'antd';
import { UserAddOutlined, SaveOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

const DEFAULT_STAGES = [
    { type: 'SPLICING', name: '1. Gia công Nối vải' },
    { type: 'QUILTING', name: '2. Gia công Chần gòn' },
    { type: 'PRINTING', name: '3. Gia công In ấn' },
    { type: 'EMBROIDERY', name: '4. Gia công Thêu' },
    { type: 'SEWING', name: '5. Gia công May thành phẩm' },
    { type: 'PACKAGING', name: '6. Gia công Đóng gói' }
];

interface PfoProcessRoutingProps {
    pfoId: number;
    existingMilestones?: any[];
    suppliers: any[];
    loading?: boolean;
    onSaveRouting: (routingData: any[]) => void;
}

const PfoProcessRouting: React.FC<PfoProcessRoutingProps> = ({
    pfoId,
    existingMilestones = [],
    suppliers = [],
    loading,
    onSaveRouting
}) => {
    const [routingRows, setRoutingRows] = useState<any[]>([]);

    useEffect(() => {
        // Map existing milestones or fallback to DEFAULT_STAGES
        const initialRows = DEFAULT_STAGES.map(stage => {
            const found = existingMilestones.find(
                m => m.milestone_type === stage.type || m.step_name?.includes(stage.name)
            );
            return {
                milestone_type: stage.type,
                step_name: stage.name,
                vendor_id: found?.vendor_id || found?.vendor?.id || undefined,
                vendor_name: found?.vendor_name || found?.vendor?.name || '',
                unit_price: Number(found?.unit_price || 0)
            };
        });
        setRoutingRows(initialRows);
    }, [existingMilestones]);

    const handleVendorChange = (index: number, vendorId: number) => {
        const vendorObj = suppliers.find(s => s.id === vendorId);
        const newRows = [...routingRows];
        newRows[index] = {
            ...newRows[index],
            vendor_id: vendorId,
            vendor_name: vendorObj ? vendorObj.name : ''
        };
        setRoutingRows(newRows);
    };

    const handlePriceChange = (index: number, price: number | null) => {
        const newRows = [...routingRows];
        newRows[index] = {
            ...newRows[index],
            unit_price: price || 0
        };
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
            render: (_: any, record: any, index: number) => (
                <Select
                    showSearch
                    allowClear
                    placeholder="Gõ tìm xưởng gia công..."
                    optionFilterProp="children"
                    style={{ width: '100%' }}
                    value={record.vendor_id}
                    onChange={(val) => handleVendorChange(index, val)}
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
            title: 'Đơn Giá / SP',
            key: 'unit_price',
            width: 140,
            render: (_: any, record: any, index: number) => (
                <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    step={1000}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value?.replace(/\$\s?|(,*)/g, '') as any}
                    placeholder="Đơn giá"
                    value={record.unit_price}
                    onChange={(val) => handlePriceChange(index, val)}
                />
            )
        },
        {
            title: 'Trạng Thái',
            key: 'status',
            width: 130,
            render: (_: any, record: any) => record.vendor_id ? (
                <Tag color="blue" icon={<CheckCircleOutlined />}>Đã phân công</Tag>
            ) : (
                <Tag color="default">Chưa gán xưởng</Tag>
            )
        }
    ];

    return (
        <Card size="small" style={{ borderRadius: 10, background: '#fafafa', border: '1px solid #e8e8e8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                    <Text strong style={{ fontSize: 14, color: '#1d39c4' }}>
                        🏭 Quy Trình Gia Công Đa Công Đoạn (Gate 3 - Multi-Vendor Routing)
                    </Text>
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                        Phân công từng xưởng đảm nhận các khâu: Nối vải, Chần gòn, In, Thêu, May, Đóng gói.
                    </div>
                </div>
                <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={loading}
                    onClick={() => onSaveRouting(routingRows)}
                    style={{ borderRadius: 6 }}
                >
                    Lưu Phân Công Xưởng
                </Button>
            </div>

            <Table
                dataSource={routingRows}
                columns={columns}
                rowKey="milestone_type"
                pagination={false}
                size="small"
                bordered
            />
        </Card>
    );
};

export default PfoProcessRouting;
