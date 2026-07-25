import React, { useState } from 'react';
import { Table, Tag, InputNumber, Button, Space, Typography, Tooltip, Select } from 'antd';
import { 
    InfoCircleOutlined, 
    SaveOutlined,
    ShoppingCartOutlined,
    SyncOutlined
} from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

interface MaterialMatrixProps {
    requirements: any[];
    loading?: boolean;
    onSaveReqs?: (updatedReqs: any[]) => void;
    onGeneratePo?: () => void;
}

const MaterialMatrix: React.FC<MaterialMatrixProps> = ({ requirements, loading, onSaveReqs, onGeneratePo }) => {
    const [editableData, setEditableData] = useState<any[]>(requirements || []);

    // Sync state if props change
    React.useEffect(() => {
        setEditableData(requirements || []);
    }, [requirements]);

    const handleFieldChange = (id: number, field: string, value: any) => {
        const newData = editableData.map(item => {
            if (item.id === id) {
                return { ...item, [field]: value };
            }
            return item;
        });
        setEditableData(newData);
    };

    const columns = [
        {
            title: 'Mã Vật Tư',
            dataIndex: 'material_code',
            key: 'material_code',
            render: (text: string, record: any) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{text}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{record.material_name}</Text>
                </Space>
            )
        },
        {
            title: (
                <Space>
                    Nhu cầu BOM
                    <Tooltip title="Định mức gốc từ BOM (Đã bao gồm hao hụt)"><InfoCircleOutlined /></Tooltip>
                </Space>
            ),
            dataIndex: 'planned_quantity',
            key: 'planned_quantity',
            align: 'right' as const,
            render: (val: number) => <Text strong>{Number(val).toLocaleString()}</Text>
        },
        {
            title: 'Tồn Kho Khả Dụng',
            dataIndex: 'available_stock',
            key: 'available_stock',
            align: 'right' as const,
            render: (val: number) => (
                <Text style={{ color: val > 0 ? '#52c41a' : '#bfbfbf' }}>
                    {val ? Number(val).toLocaleString() : 0}
                </Text>
            )
        },
        {
            title: 'Hình Thức Cấp',
            dataIndex: 'supply_method',
            key: 'supply_method',
            render: (text: string, record: any) => (
                <Select 
                    value={text} 
                    onChange={(val) => handleFieldChange(record.id, 'supply_method', val)}
                    style={{ width: 140 }}
                    size="small"
                >
                    <Option value="HULA_SUPPLIED">HULA Cấp</Option>
                    <Option value="VENDOR_SUPPLIED">Xưởng Tự Lo</Option>
                </Select>
            )
        },
        {
            title: 'SL Thực Đặt',
            key: 'actual_order_quantity',
            align: 'right' as const,
            render: (_: any, record: any) => {
                const suggested = Math.max(0, record.planned_quantity - (record.available_stock || 0));
                return (
                    <InputNumber 
                        size="small" 
                        value={record.actual_order_quantity ?? suggested}
                        onChange={(val) => handleFieldChange(record.id, 'actual_order_quantity', val)}
                        style={{ width: 100 }}
                    />
                );
            }
        },
        {
            title: 'Trạng Thái',
            key: 'status',
            render: (_: any, record: any) => {
                if (record.issued_quantity >= record.planned_quantity) return <Tag color="success">Đã Xuất Đủ</Tag>;
                if (record.supply_method === 'VENDOR_SUPPLIED') return <Tag color="warning">PO Xưởng</Tag>;
                return <Tag color="processing">Chờ Mua</Tag>;
            }
        }
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text type="secondary">Phân tích nhu cầu vật tư (MRP) & Quyết định phương thức cung ứng</Text>
                <Space>
                    <Button 
                        icon={<SaveOutlined />} 
                        onClick={() => onSaveReqs && onSaveReqs(editableData)}
                    >
                        Lưu Cấu Hình
                    </Button>
                    <Button 
                        type="primary" 
                        icon={<ShoppingCartOutlined />} 
                        onClick={onGeneratePo}
                    >
                        Tạo PO Vật Tư
                    </Button>
                </Space>
            </div>
            
            <Table 
                dataSource={editableData}
                columns={columns}
                rowKey="id"
                pagination={false}
                size="middle"
                loading={loading}
                scroll={{ y: 400 }}
            />
        </div>
    );
};

export default MaterialMatrix;
