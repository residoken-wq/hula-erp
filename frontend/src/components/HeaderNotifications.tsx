import React, { useEffect, useState } from 'react';
import { Badge, Popover, List, Avatar, Button, Typography, Empty } from 'antd';
import { BellOutlined, CheckCircleOutlined, InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';
import api from '../utils/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { Text } = Typography;

const HeaderNotifications: React.FC = () => {
    const [list, setList] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);

    // Get user ID
    const userStr = localStorage.getItem('user');
    const userId = userStr ? JSON.parse(userStr).id : null;

    const fetchNoti = async () => {
        if (!userId) return;
        try {
            const res = await api.get('/notifications');
            const data = Array.isArray(res.data) ? res.data : [];
            setList(data);
            setUnreadCount(data.filter((n: any) => !n.is_read).length);
        } catch (e) {
            console.error("Failed to fetch notifications:", e);
        }
    };

    useEffect(() => {
        fetchNoti();
        const interval = setInterval(fetchNoti, 30000); // Polling every 30s
        return () => clearInterval(interval);
    }, [userId]);

    const handleRead = async (item: any) => {
        if (!item.is_read) {
            try {
                await api.post(`/notifications/${item.id}/read`);
                fetchNoti();
            } catch (e) {
                console.error("Failed to mark read:", e);
            }
        }
        if (item.link) window.location.href = item.link;
    };

    const handleReadAll = async () => {
        try {
            await api.post('/notifications/read-all');
            fetchNoti();
        } catch (e) {
            console.error("Failed to read all:", e);
        }
    };

    const content = (
        <div style={{ width: 350 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', borderBottom: '1px solid #f0f0f0' }}>
                <Text strong>Thông báo</Text>
                <Button type="link" size="small" onClick={handleReadAll} disabled={unreadCount === 0}>Đánh dấu đã đọc hết</Button>
            </div>
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                <List
                    dataSource={list}
                    locale={{ emptyText: <Empty description="Không có thông báo mới" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                    renderItem={(item) => (
                        <List.Item
                            className="notification-item"
                            style={{
                                background: item.is_read ? '#fff' : '#e6f7ff',
                                cursor: 'pointer',
                                padding: '12px 16px',
                                transition: 'all 0.3s'
                            }}
                            onClick={() => handleRead(item)}
                        >
                            <List.Item.Meta
                                avatar={
                                    <Avatar
                                        style={{ backgroundColor: item.type === 'WARNING' ? '#ff4d4f' : item.type === 'SUCCESS' ? '#52c41a' : '#1890ff' }}
                                        icon={item.type === 'WARNING' ? <WarningOutlined /> : item.type === 'SUCCESS' ? <CheckCircleOutlined /> : <InfoCircleOutlined />}
                                    />
                                }
                                title={<Text style={{ fontSize: 13 }} strong={!item.is_read}>{item.title}</Text>}
                                description={
                                    <div>
                                        <div style={{ fontSize: 12, color: '#666' }}>{item.message}</div>
                                        <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>{dayjs(item.created_at).fromNow()}</div>
                                    </div>
                                }
                            />
                        </List.Item>
                    )}
                />
            </div>
        </div>
    );

    return (
        <Popover
            content={content}
            trigger="click"
            open={open}
            onOpenChange={setOpen}
            placement="bottomRight"
            arrow={false}
            overlayInnerStyle={{ padding: 0 }}
        >
            <div style={{ cursor: 'pointer', padding: '0 12px', display: 'flex', alignItems: 'center' }}>
                <Badge count={unreadCount} overflowCount={99} size="small">
                    <BellOutlined style={{ fontSize: 20, color: '#333' }} />
                </Badge>
            </div>
        </Popover>
    );
};

export default HeaderNotifications;