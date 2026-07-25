import React from 'react';
import { Card, Tag, Typography, Button, Space, Progress, Tooltip, Avatar } from 'antd';
import { 
    ClockCircleOutlined, 
    ShopOutlined, 
    ToolOutlined, 
    CheckCircleOutlined,
    WarningOutlined,
    RightOutlined
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
        { key: 'WAITING_VENDOR', title: 'Chờ Giao Gia Công', color: '#ffd591' },
        { key: 'MATERIAL_PREP', title: 'Chuẩn bị NPL', color: '#91d5ff' },
        { key: 'IN_PRODUCTION', title: 'Đang Sản Xuất', color: '#b7eb8f' },
        { key: 'RECEIVING', title: 'Chờ Nhập Kho', color: '#ffadd2' },
        { key: 'COMPLETED', title: 'Hoàn Thành', color: '#52c41a' },
    ];

    const getPfosByStatus = (status: string) => {
        return pfos.filter(pfo => pfo.status === status);
    };

    const renderCard = (pfo: any) => {
        const isLate = pfo.committed_finish_date && dayjs().isAfter(dayjs(pfo.committed_finish_date));
        
        return (
            <Card 
                key={pfo.id} 
                size="small" 
                hoverable 
                style={{ 
                    marginBottom: 12, 
                    borderRadius: 12,
                    borderLeft: `4px solid ${isLate ? '#ff4d4f' : '#1890ff'}`,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                }}
                bodyStyle={{ padding: 16 }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)';
                }}
                onClick={() => onPfoClick(pfo)}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <Text strong style={{ fontSize: 14 }}>{pfo.code}</Text>
                    {isLate && (
                        <Tooltip title="Trễ tiến độ">
                            <WarningOutlined style={{ color: '#cf1322' }} />
                        </Tooltip>
                    )}
                </div>
                
                <div style={{ fontSize: 12, color: '#595959', marginBottom: 8 }}>
                    <ShopOutlined /> {pfo.vendor_name || 'Chưa gán xưởng'}
                </div>
                
                <div style={{ fontSize: 12, color: '#595959', marginBottom: 12 }}>
                    <ClockCircleOutlined /> Deadline: {pfo.committed_finish_date ? dayjs(pfo.committed_finish_date).format('DD/MM/YYYY') : 'N/A'}
                </div>
                
                {['IN_PRODUCTION', 'RECEIVING'].includes(pfo.status) && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                            <Text type="secondary">Tiến độ</Text>
                            <Text strong>{pfo.progress || 0}%</Text>
                        </div>
                        <Progress percent={pfo.progress || 0} size="small" showInfo={false} strokeColor="#52c41a" />
                    </div>
                )}
                
                {pfo.status === 'WAITING_VENDOR' && (
                    <Button size="small" type="primary" block style={{ marginTop: 8, fontSize: 12 }}>
                        Chọn Xưởng
                    </Button>
                )}
            </Card>
        );
    };

    return (
        <div style={{ display: 'flex', overflowX: 'auto', paddingBottom: 16, minHeight: 500, gap: 16 }}>
            {COLUMNS.map(col => (
                <div 
                    key={col.key} 
                    style={{ 
                        minWidth: 300, 
                        maxWidth: 300, 
                        background: 'linear-gradient(180deg, rgba(240, 242, 245, 0.8) 0%, rgba(240, 242, 245, 0.4) 100%)', 
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.6)',
                        borderRadius: 16, 
                        padding: '16px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.02)'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Title level={5} style={{ margin: 0, fontSize: 14, color: '#262626' }}>
                            <Badge color={col.color} text={col.title} />
                        </Title>
                        <Tag color="default" style={{ borderRadius: 10 }}>{getPfosByStatus(col.key).length}</Tag>
                    </div>
                    
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {getPfosByStatus(col.key).map(pfo => renderCard(pfo))}
                        {getPfosByStatus(col.key).length === 0 && (
                            <div style={{ textAlign: 'center', color: '#bfbfbf', padding: '20px 0', border: '1px dashed #d9d9d9', borderRadius: 8 }}>
                                Trống
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

// Quick inline Badge component for title
const Badge: React.FC<{color: string, text: string}> = ({ color, text }) => (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: color, display: 'inline-block' }}></span>
        {text}
    </span>
);

export default PfoKanbanBoard;
