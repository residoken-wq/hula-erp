import React from 'react';
import { Card, Tag, Typography, Button, Progress, Tooltip, Badge } from 'antd';
import { 
    ClockCircleOutlined, 
    ShopOutlined, 
    WarningOutlined,
    CalculatorOutlined,
    UserAddOutlined,
    ShoppingCartOutlined,
    FileTextOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

interface PfoKanbanBoardProps {
    pfos: any[];
    onPfoClick: (pfo: any) => void;
}

const PfoKanbanBoard: React.FC<PfoKanbanBoardProps> = ({ pfos, onPfoClick }) => {
    
    const COLUMNS = [
        { key: 'DRAFT', title: 'Khởi tạo / Tính BOM', color: '#d9d9d9' },
        { key: 'WAITING_VENDOR', title: 'Chờ Giao Gia Công', color: '#faad14' },
        { key: 'MATERIAL_PREP', title: 'Chuẩn bị NPL', color: '#1890ff' },
        { key: 'IN_PRODUCTION', title: 'Đang Sản Xuất', color: '#52c41a' },
        { key: 'RECEIVING', title: 'Chờ Nhập Kho', color: '#eb2f96' },
        { key: 'COMPLETED', title: 'Hoàn Thành', color: '#389e0d' },
    ];

    const getPfosByStatus = (status: string) => {
        return pfos.filter(pfo => pfo.status === status);
    };

    const renderCard = (pfo: any) => {
        const isLate = pfo.committed_finish_date && dayjs().isAfter(dayjs(pfo.committed_finish_date));
        const soCode = pfo.sales_order?.order_code || pfo.sales_order_code || pfo.code?.replace('PFO-', '');
        
        return (
            <Card 
                key={pfo.id} 
                size="small" 
                hoverable 
                style={{ 
                    marginBottom: 12, 
                    borderRadius: 12,
                    borderLeft: `4px solid ${isLate ? '#ff4d4f' : '#1890ff'}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    background: '#ffffff'
                }}
                bodyStyle={{ padding: 14 }}
                onClick={() => onPfoClick(pfo)}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <Text strong style={{ fontSize: 14, color: '#1f1f1f' }}>{pfo.code}</Text>
                    {isLate ? (
                        <Tooltip title="Trễ tiến độ giao hàng">
                            <Tag color="error" style={{ margin: 0, fontSize: 11 }}>Trễ hạn</Tag>
                        </Tooltip>
                    ) : (
                        <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>{pfo.status}</Tag>
                    )}
                </div>
                
                {soCode && (
                    <div style={{ fontSize: 12, color: '#1890ff', fontWeight: 600, marginBottom: 4 }}>
                        <FileTextOutlined style={{ marginRight: 4 }} /> Đơn hàng: {soCode}
                    </div>
                )}
                <div style={{ fontSize: 12, color: '#595959', fontWeight: 600, marginBottom: 6 }}>
                    <UserAddOutlined style={{ marginRight: 4 }} /> Khách: {pfo.sales_order?.customer?.name || 'N/A'}
                </div>
                
                <div style={{ fontSize: 12, color: '#595959', marginBottom: 6 }}>
                    <ShopOutlined style={{ marginRight: 4 }} /> {pfo.vendor_name || (pfo.vendor_id ? `Vendor #${pfo.vendor_id}` : 'Chưa gán xưởng')}
                </div>
                
                <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 10 }}>
                    <ClockCircleOutlined style={{ marginRight: 4 }} /> Deadline: {pfo.committed_finish_date ? dayjs(pfo.committed_finish_date).format('DD/MM/YYYY') : 'N/A'}
                </div>
                
                {['IN_PRODUCTION', 'RECEIVING'].includes(pfo.status) && (
                    <div style={{ marginTop: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                            <Text type="secondary">Tiến độ gia công</Text>
                            <Text strong color="#52c41a">{pfo.progress || 0}%</Text>
                        </div>
                        <Progress percent={pfo.progress || 0} size="small" showInfo={false} strokeColor="#52c41a" />
                    </div>
                )}

                <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px dashed #f0f0f0', display: 'flex', justifyContent: 'flex-end' }}>
                    {pfo.status === 'DRAFT' && (
                        <Button size="small" type="primary" ghost icon={<CalculatorOutlined />} style={{ borderRadius: 6, fontSize: 12 }}>
                            Tính BOM & Vật tư
                        </Button>
                    )}
                    {pfo.status === 'WAITING_VENDOR' && (
                        <Button size="small" type="primary" icon={<UserAddOutlined />} style={{ borderRadius: 6, fontSize: 12 }}>
                            Gán Xưởng
                        </Button>
                    )}
                    {pfo.status === 'MATERIAL_PREP' && (
                        <Button size="small" type="default" icon={<ShoppingCartOutlined />} style={{ borderRadius: 6, fontSize: 12 }}>
                            Cấp NPL / Tạo PO
                        </Button>
                    )}
                    {['IN_PRODUCTION', 'RECEIVING', 'COMPLETED'].includes(pfo.status) && (
                        <Text type="secondary" style={{ fontSize: 11 }}>Click xem chi tiết &rarr;</Text>
                    )}
                </div>
            </Card>
        );
    };

    return (
        <div style={{ display: 'flex', overflowX: 'auto', paddingBottom: 16, minHeight: 520, gap: 16 }}>
            {COLUMNS.map(col => (
                <div 
                    key={col.key} 
                    style={{ 
                        flex: '1 0 270px',
                        minWidth: 270, 
                        maxWidth: 320, 
                        background: '#f7f8fa', 
                        border: '1px solid #e8e8e8',
                        borderRadius: 14, 
                        padding: '14px 12px',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, padding: '0 4px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 13, color: '#262626' }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: col.color, display: 'inline-block' }}></span>
                            {col.title}
                        </span>
                        <Tag color="default" style={{ borderRadius: 10, margin: 0, fontWeight: 600 }}>
                            {getPfosByStatus(col.key).length}
                        </Tag>
                    </div>
                    
                    <div style={{ flex: 1, overflowY: 'auto', paddingRight: 2 }}>
                        {getPfosByStatus(col.key).map(pfo => renderCard(pfo))}
                        {getPfosByStatus(col.key).length === 0 && (
                            <div style={{ textAlign: 'center', color: '#bfbfbf', padding: '30px 0', border: '1px dashed #d9d9d9', borderRadius: 8, fontSize: 12 }}>
                                Không có lệnh SX
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PfoKanbanBoard;
